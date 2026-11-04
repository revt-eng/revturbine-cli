/**
 * BL-0518 TASK-16 / AC-18 — permanent fixture sweep.
 *
 * Every fixture that is meant to be a valid Playbook must (1) parse against the
 * vendored `PlaybookSchema` and (2) yield zero unknown fields at any depth.
 * Parse success comes FIRST: `collectUnknownFields` returns `[]` for anything
 * that does not parse, so a zero-findings assertion alone would pass vacuously
 * on a fixture the schema rejects.
 *
 * Fixtures that are deliberately not a full Playbook are excluded by name with
 * a reason; a new fixture file is swept by default, so adding one without
 * listing it here puts it under the same check.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { PlaybookSchema } from '../src/schema/exported-config.snapshot.mjs';
import { collectUnknownFields, formatFieldPath } from '../src/schema/validators.snapshot.mjs';

const FIXTURES = join(__dirname, 'fixtures');

const EXCLUDED: Readonly<Record<string, string>> = {
  'evaluate-context-playbook.json':
    'a minimal evaluate-context fragment, not a full Playbook: it fails PlaybookSchema.safeParse by design',
  'invalid.export-config.json': 'intentionally invalid input for the validation tests',
};

const swept = readdirSync(FIXTURES)
  .filter((name) => name.endsWith('.json') && !(name in EXCLUDED))
  .sort();

describe('fixture sweep — meant-to-be-valid Playbook fixtures carry no unknown fields', () => {
  it('sweeps at least the known valid fixtures', () => {
    expect(swept).toContain('valid.export-config.json');
    expect(swept).toContain('evaluate-playbook.json');
  });

  it.each(swept)('%s parses as a Playbook, then has zero unknown fields', (name) => {
    const raw: unknown = JSON.parse(readFileSync(join(FIXTURES, name), 'utf8'));

    const parsed = PlaybookSchema.safeParse(raw);
    expect(parsed.success, parsed.success ? '' : JSON.stringify(parsed.error?.issues)).toBe(true);

    const unknown = collectUnknownFields(raw).map((field) => formatFieldPath(field.path));
    expect(unknown).toEqual([]);
  });

  it.each(Object.keys(EXCLUDED))('exclusion %s still exists (drop it from EXCLUDED if removed)', (name) => {
    expect(readdirSync(FIXTURES)).toContain(name);
  });
});
