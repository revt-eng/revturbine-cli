import { describe, expect, it } from 'vitest';

import { schemaForConfig } from '../src/lib/offline-schema';

const CANONICAL = {
  artifact_type: 'playbook',
  format_version: '1.0.0',
  playbook_handle: 'default',
  playbook_version_id: null,
  tenant_id: 'local',
  environment_id: 'local',
  plans: [],
  entitlements: [],
  entitlement_rules: [],
  segments: [],
  content_ui_paths: [],
  surface_templates: [],
  placements: [],
};

const LEGACY = {
  version: '1.0.0',
  plans: [],
  entitlements: [],
  entitlement_rules: [],
  segments: [],
  content_ui_paths: [],
  surface_templates: [],
  placements: [],
};

describe('schemaForConfig', () => {
  it('routes a canonical Playbook to PlaybookSchema', () => {
    const { shape, schema } = schemaForConfig(CANONICAL);
    expect(shape).toBe('canonical');
    expect(schema.safeParse(CANONICAL).success).toBe(true);
  });

  it('routes a legacy config to the legacy schema', () => {
    const { shape, schema } = schemaForConfig(LEGACY);
    expect(shape).toBe('legacy');
    expect(schema.safeParse(LEGACY).success).toBe(true);
  });

  it('no longer reports "version is required" for a canonical Playbook', () => {
    // The regression this module exists to fix: `validate <file>` ran every
    // file through the legacy schema, so canonical artifacts failed on a field
    // the canonical shape deliberately does not have.
    const { schema } = schemaForConfig(CANONICAL);
    const result = schema.safeParse(CANONICAL);
    expect(result.success).toBe(true);
  });

  it('resolves both wire shapes to the one reconciled schema (true alias)', () => {
    // Plan 147 collapsed the legacy + canonical schemas into one lenient config
    // (ExportedConfig === RevTurbineConfig === Playbook). The schema the legacy
    // branch resolves therefore accepts a canonical Playbook too — the
    // interchangeability this previously guarded against is now the goal. The
    // `shape` label the router returns still distinguishes them for diagnostics.
    const { schema: legacySchema, shape } = schemaForConfig(LEGACY);
    expect(shape).toBe('legacy');
    expect(legacySchema.safeParse(CANONICAL).success).toBe(true);
  });

  it('falls back to legacy for junk input so errors stay meaningful', () => {
    expect(schemaForConfig({}).shape).toBe('legacy');
    expect(schemaForConfig(null).shape).toBe('legacy');
  });
});
