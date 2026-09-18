import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildSync } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SCHEMA_VERSION } from '../src/schema/version';

const repo = fileURLToPath(new URL('../', import.meta.url));
const root = mkdtempSync(path.join(tmpdir(), 'revturbine-placement-validation-'));
const networkGuard = path.join(root, 'offline.mjs');
const networkAttempt = path.join(root, 'network-attempt');
let cli = process.env.REVTURBINE_TEST_CLI;

beforeAll(() => {
  if (!cli) {
    cli = path.join(root, 'package', 'dist', 'cli.js');
    mkdirSync(path.dirname(cli), { recursive: true });
    writeFileSync(path.join(root, 'package', 'package.json'), JSON.stringify({ type: 'module', version: '0.0.0-test' }));
    buildSync({ entryPoints: [path.join(repo, 'src/cli.ts')], outfile: cli, bundle: true, platform: 'node', format: 'esm', target: 'node22' });
  }
  writeFileSync(networkGuard, `import { writeFileSync } from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';
function blocked() {
  writeFileSync(process.env.VALIDATION_NETWORK_ATTEMPT, 'network attempted');
  throw new Error('Offline validation attempted network access');
}
globalThis.fetch = blocked;
http.request = http.get = https.request = https.get = blocked;
net.connect = net.createConnection = tls.connect = blocked;
`);
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

const base = {
  artifact_type: 'playbook', format_version: '1.0.0',
  plans: [{ unique_handle: 'free', name: 'Free', tier_position: 0, sort_order: 0 }],
  entitlements: [], entitlement_rules: [], segments: [], content_ui_paths: [], surface_templates: [],
};
const activeSettings = { caps: { max_per_period: { count: 1, period: 'day' }, cooldown_days: 7 }, remind_later_minutes: 60 };

function playbook(category: string, planIds: string[], settings: Record<string, unknown> = {}) {
  return { ...base, placements: [{
    id: 'placement', name: 'Placement', category, order: 0,
    trigger: { type: 'surface_render', slot_id: 'test-slot' },
    payloads: [{ id: 'payload', target: { plan_ids: planIds, segment_chips: [] }, surfaces: [], ...settings }],
  }] };
}

const standalone = {
  ...playbook('fixed', []),
  placement_payloads: [{
    payload_id: 'standalone', placement_id: 'placement',
    target: { plan_ids: ['missing'], segment_chips: [] }, source_mode: 'inline',
    created_at: '2026-01-01T00:00:00.000Z', surfaces: [], ...activeSettings,
  }],
};

const cases = [
  { name: 'fixed caps and unknown plan', config: playbook('fixed', ['missing'], activeSettings), ignored: 3, unmatched: 1 },
  { name: 'access gate caps and reachable plan', config: playbook('gated', ['free'], activeSettings), ignored: 3, unmatched: 0 },
  { name: 'standalone portable payload', config: standalone, ignored: 3, unmatched: 1 },
  { name: 'nonempty filter with empty catalog', config: { ...playbook('retention', ['missing']), plans: [] }, ignored: 0, unmatched: 1 },
  { name: 'ordinary category settings and reachable plan', config: playbook('retention', ['free'], activeSettings), ignored: 0, unmatched: 0 },
  { name: 'fixed zero windows and wildcard plans', config: playbook('fixed', [], { caps: { cooldown_days: 0 }, remind_later_minutes: 0 }), ignored: 0, unmatched: 0 },
  { name: 'inherited settings and reachable plan', config: playbook('gated', ['free'], { caps: {}, remind_later_minutes: null }), ignored: 0, unmatched: 0 },
  { name: 'absent settings and wildcard plans', config: playbook('fixed', []), ignored: 0, unmatched: 0 },
  { name: 'partially reachable filter', config: playbook('retention', ['missing', 'free']), ignored: 0, unmatched: 0 },
];

function run(args: string[]) {
  return spawnSync(process.execPath, ['--import', pathToFileURL(networkGuard).href, cli!, ...args], {
    cwd: root, encoding: 'utf8', timeout: 10_000,
    env: { ...process.env, REVTURBINE_CONFIG_DIR: path.join(root, 'credentials'), VALIDATION_NETWORK_ATTEMPT: networkAttempt },
  });
}

describe('shared placement warnings in the offline CLI (also installed npm tarball)', () => {
  it.each(cases)('$name stays nonblocking with the expected shared warnings', ({ name, config, ignored, unmatched }) => {
    const file = path.join(root, `${name.replaceAll(' ', '-')}.json`);
    writeFileSync(file, JSON.stringify(config));
    const hash = () => createHash('sha256').update(readFileSync(file)).digest('hex');
    const before = hash();
    const result = run(['validate', file]);
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(result.stdout.match(/\[warning\] VAL-PLC-06:/g) ?? []).toHaveLength(ignored);
    expect(result.stdout.match(/\[warning\] VAL-PLC-07:/g) ?? []).toHaveLength(unmatched);
    if (ignored) {
      expect(result.stdout).toContain('caps.max_per_period');
      expect(result.stdout).toContain('caps.cooldown_days');
      expect(result.stdout).toContain('remind_later_minutes');
      expect(result.stdout).toMatch(/ignored.*Remove the setting/);
    }
    if (unmatched) expect(result.stdout).toContain("Use an existing plan's unique_handle or clear the plan filter");
    if (!ignored && !unmatched) expect(result.stdout.trim()).toBe('No validation findings.');
    expect(result.stderr).toContain(`offline, canonical shape, schema ${SCHEMA_VERSION}`);
    expect(result.stderr).not.toMatch(/VAL-PLC-0[67]/);
    expect(existsSync(networkAttempt)).toBe(false);
    expect(hash()).toBe(before);
  });

  it('reports the coherent source version without private runtime packages', () => {
    const result = run(['--version']);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain(`(schema ${SCHEMA_VERSION})`);
    const manifest = JSON.parse(readFileSync(path.resolve(path.dirname(cli!), '..', 'package.json'), 'utf8'));
    expect(Object.keys(manifest.dependencies ?? {}).some((name) => name.startsWith('@revt-eng/'))).toBe(false);
    expect(existsSync(networkAttempt)).toBe(false);
  });
});
