import { describe, expect, it } from 'vitest';
import { latestStableSdk, sdkDeclaration, sdkPackageVersion, sdkVersionAdvice } from '../src/lib/sdk-version';
import { installArgs, planInstall } from '../src/lib/init';

describe('latest stable SDK metadata', () => {
  it.each(['1.2.3', '0.9.3', '0.0.5', '1.2.3+build.4'])('accepts stable %s', (version) => {
    expect(latestStableSdk({ name: '@revturbine/sdk', version })).toBe(version);
  });
  it.each([null, [], {}, { name: 'other', version: '1.2.3' }, ...['v1.2.3', '01.2.3', '1.2', '1.2.3-rc.1', 'latest', '^1.2.3', ' 1.2.3', 123].map((version) => ({ name: '@revturbine/sdk', version }))])('rejects unavailable metadata %j', (metadata) => {
    expect(latestStableSdk(metadata)).toBeUndefined();
  });
  it('allows a prerelease installation, but not a prerelease latest tag', () => {
    const metadata = { name: '@revturbine/sdk', version: '1.2.3-rc.1' };
    expect(sdkPackageVersion(metadata)).toBe('1.2.3-rc.1');
    expect(latestStableSdk(metadata)).toBeUndefined();
  });
});

describe('SDK recommendations', () => {
  const advice = (spec: string, latest: string, installed?: string) => sdkVersionAdvice({ latest, installed, declaration: { spec, dev: false }, manager: 'npm' });
  it.each([
    ['^0.9.1', '0.9.3', '0.9.1'], ['0.9.1', '0.9.3', '0.9.1'],
    ['^0.9.1', '0.10.0', '0.9.1'], ['^0.0.4', '0.0.5', '0.0.4'],
    ['workspace:*', '0.9.3', '0.9.1'], ['git+https://example.test/sdk', '0.9.3', '0.9.1'],
    ['1.0.0-rc.1', '1.0.0', '1.0.0-rc.1'],
  ])('recommends concrete latest for installed %s / %s / %s', (spec, latest, installed) => {
    const result = advice(spec, latest, installed);
    expect(result).toContain(`SDK installed ${installed}; latest stable ${latest}`);
    expect(result).toContain(`npm install @revturbine/sdk@${latest}`);
    expect(result).not.toContain('caret');
  });
  it.each(['0.9.4', '0.10.0-rc.1', '1.0.0'])('never recommends downgrading %s', (installed) => {
    expect(advice('^0.9.0', '0.9.3', installed)).toContain('no downgrade');
    expect(advice('^0.9.0', '0.9.3', installed)).not.toContain('npm install');
  });
  it('reports an equal installation as current', () => {
    expect(advice('0.1.0', '0.9.3', '0.9.3')).toContain('Up to date');
  });
  it.each(['^0.9.1', '^0.0.4', '0.9.1', 'workspace:*'])('labels declaration fallback %s honestly', (spec) => {
    const result = advice(spec, '0.9.3');
    expect(result).toContain('installed version unavailable; declared');
    expect(result).toContain('npm install @revturbine/sdk@0.9.3');
    expect(result).not.toContain('Up to date');
  });
  it.each(['0.9.4', '^0.10.0', '>=1.0.0-rc.1'])('does not recommend downgrading declaration %s', (spec) => {
    expect(advice(spec, '0.9.3')).toContain('no downgrade');
    expect(advice(spec, '0.9.3')).not.toContain('npm install');
  });
  it('does not confuse a matching declaration with a verified installation', () => {
    expect(advice('0.9.3', '0.9.3')).toContain('installation could not be verified');
  });
  it('does not echo credentials embedded in non-semver declarations', () => {
    expect(advice('git+https://secret@example.test/sdk', '0.9.3')).not.toContain('secret');
  });
  it('recommends the detected package manager and preserves dev dependency placement', () => {
    expect(sdkVersionAdvice({ latest: '0.9.3', declaration: { spec: '0.9.1', dev: true }, manager: 'pnpm' })).toContain('pnpm add -D @revturbine/sdk@0.9.3');
  });
  it('cannot recommend a fabricated version when the registry is unavailable', () => {
    expect(sdkVersionAdvice({ manager: 'npm' })).toContain('check unavailable');
    expect(sdkVersionAdvice({ manager: 'npm' })).not.toContain('npm install');
  });
  it('reads the same declared dependency precedence as init', () => {
    expect(sdkDeclaration({ dependencies: { '@revturbine/sdk': '1.0.0' }, devDependencies: { '@revturbine/sdk': '2.0.0' } })).toEqual({ spec: '1.0.0', dev: false });
    expect(sdkDeclaration({ devDependencies: { '@revturbine/sdk': '2.0.0' } })).toEqual({ spec: '2.0.0', dev: true });
    expect(sdkDeclaration(null)).toBeUndefined();
  });
  it.each(['npm', 'pnpm', 'yarn'] as const)('installs checked latest using %s save settings', (manager) => {
    const sdk = planInstall({ cliVersion: '0.19.0', sdkVersion: '0.9.3' }).install[0];
    expect(installArgs(manager, sdk)).toEqual([manager === 'npm' ? 'install' : 'add', '@revturbine/sdk@0.9.3']);
  });
});
