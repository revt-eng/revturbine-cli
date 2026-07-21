import { describe, expect, it } from 'vitest';

import {
  CLI_PACKAGE,
  SDK_PACKAGE,
  detectPackageManager,
  detectStack,
  installArgs,
  planInstall,
} from '../src/lib/init';

describe('detectPackageManager', () => {
  it('prefers the packageManager field over everything else', () => {
    const r = detectPackageManager({
      packageManagerField: 'pnpm@11.0.0',
      files: ['package-lock.json'],
      userAgent: 'npm/11.0.0 node/v22.13.0',
    });
    expect(r.name).toBe('pnpm');
    expect(r.reason).toContain('packageManager');
  });

  it('ignores an unrecognized packageManager field and falls through', () => {
    const r = detectPackageManager({ packageManagerField: 'bun@1.0.0', files: ['yarn.lock'] });
    expect(r.name).toBe('yarn');
  });

  it('detects each lockfile', () => {
    expect(detectPackageManager({ files: ['pnpm-lock.yaml'] }).name).toBe('pnpm');
    expect(detectPackageManager({ files: ['yarn.lock'] }).name).toBe('yarn');
    expect(detectPackageManager({ files: ['package-lock.json'] }).name).toBe('npm');
  });

  it('lets a lockfile beat the invoking user-agent', () => {
    // `npm create revturbine` in a pnpm repo reports an npm user-agent, but the
    // repo is unambiguously pnpm.
    const r = detectPackageManager({
      files: ['pnpm-lock.yaml'],
      userAgent: 'npm/11.0.0 node/v22.13.0',
    });
    expect(r.name).toBe('pnpm');
    expect(r.reason).toBe('pnpm-lock.yaml');
  });

  it('falls back to the user-agent in a repo with no lockfile yet', () => {
    const r = detectPackageManager({ files: [], userAgent: 'pnpm/11.0.0 npm/? node/v22.13.0' });
    expect(r.name).toBe('pnpm');
    expect(r.reason).toContain('user_agent');
  });

  it('defaults to npm when nothing is knowable', () => {
    expect(detectPackageManager({})).toEqual({ name: 'npm', reason: 'default' });
  });
});

describe('detectStack', () => {
  it('identifies frameworks from either dep list', () => {
    expect(detectStack({ dependencies: { next: '16.0.0' } })).toBe('next');
    expect(detectStack({ devDependencies: { astro: '5.0.0' } })).toBe('astro');
    expect(detectStack({ devDependencies: { vite: '8.0.0' } })).toBe('vite');
    expect(detectStack({ dependencies: { '@remix-run/react': '2.0.0' } })).toBe('remix');
  });

  it('prefers the more specific framework over bare react', () => {
    expect(detectStack({ dependencies: { next: '16.0.0', react: '19.0.0' } })).toBe('next');
    expect(detectStack({ dependencies: { react: '19.0.0' } })).toBe('react');
  });

  it('reports unknown rather than guessing', () => {
    expect(detectStack({})).toBe('unknown');
    expect(detectStack({ dependencies: { express: '5.0.0' } })).toBe('unknown');
  });
});

describe('planInstall', () => {
  it('installs both packages in a bare repo, pinning the CLI exactly', () => {
    const plan = planInstall({ cliVersion: '0.7.1' });
    expect(plan.install).toEqual([
      { spec: SDK_PACKAGE, dev: false, exact: false },
      { spec: `${CLI_PACKAGE}@0.7.1`, dev: true, exact: true },
    ]);
    expect(plan.skipped).toEqual([]);
  });

  it('is idempotent — a scaffolded repo needs nothing installed', () => {
    const plan = planInstall({
      dependencies: { [SDK_PACKAGE]: '^0.2.26' },
      devDependencies: { [CLI_PACKAGE]: '0.7.1' },
      cliVersion: '0.7.1',
    });
    expect(plan.install).toEqual([]);
    expect(plan.skipped).toHaveLength(2);
    expect(plan.skipped.join(' ')).toContain('already pinned');
  });

  it('leaves a differently-pinned CLI alone and says so', () => {
    const plan = planInstall({
      devDependencies: { [CLI_PACKAGE]: '0.6.0' },
      cliVersion: '0.7.1',
    });
    expect(plan.install.map((p) => p.spec)).toEqual([SDK_PACKAGE]);
    expect(plan.skipped.join(' ')).toContain('left as-is');
  });

  it('honors the SDK declared as a devDependency', () => {
    const plan = planInstall({ devDependencies: { [SDK_PACKAGE]: '^0.2.26' }, cliVersion: '0.7.1' });
    expect(plan.install.map((p) => p.spec)).toEqual([`${CLI_PACKAGE}@0.7.1`]);
  });
});

describe('installArgs', () => {
  it('uses each manager’s add/install verb', () => {
    const sdk = { spec: SDK_PACKAGE, dev: false, exact: false };
    expect(installArgs('pnpm', sdk)).toEqual(['add', SDK_PACKAGE]);
    expect(installArgs('yarn', sdk)).toEqual(['add', SDK_PACKAGE]);
    expect(installArgs('npm', sdk)).toEqual(['install', SDK_PACKAGE]);
  });

  it('passes the exact-pin flag explicitly — a bare pkg@x.y.z still writes a caret', () => {
    const cli = { spec: `${CLI_PACKAGE}@0.7.1`, dev: true, exact: true };
    expect(installArgs('pnpm', cli)).toEqual(['add', '-D', '--save-exact', `${CLI_PACKAGE}@0.7.1`]);
    expect(installArgs('npm', cli)).toEqual(['install', '-D', '--save-exact', `${CLI_PACKAGE}@0.7.1`]);
    expect(installArgs('yarn', cli)).toEqual(['add', '-D', '--exact', `${CLI_PACKAGE}@0.7.1`]);
  });
});
