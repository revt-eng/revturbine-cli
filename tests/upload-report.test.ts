/**
 * BL-0518 TASK-11 — the pure half of `upload`: the two 409 renderings, the
 * backup offer, the dry-run plan, the notes and the `--report` shape
 * (AC-11, AC-19, AC-7 CLI half).
 */
import { describe, expect, it, vi } from 'vitest';

import {
  backupFileName,
  classifyUploadRefusal,
  conflictCount,
  discardPrompt,
  formatNotes,
  formatPlan,
  formatRefusal409,
  offerBackup,
  readNotes,
  readPlan,
  reportForOfflineFailure,
  reportForRefusal,
  reportForSuccess,
  serializeReport,
  type BackupDeps,
} from '../src/lib/upload-report';

const BEYOND = {
  ok: false,
  error: 'Config import failed',
  stage: 'in_flight_version',
  details: {
    error: 'in_flight_version_beyond_draft',
    playbook_version_id: 'pv_42',
    status: 'awaiting_approval',
    held_by: 'mark@example.com',
    held_by_source: 'submitted_by',
    backup_command: 'revturbine download --draft --save <file>',
  },
  detail: { message: 'Cannot upload: version pv_42 is awaiting_approval' },
};

const CONFLICTS = {
  ok: false,
  stage: 'conflicts',
  details: {
    conflicts: [
      {
        canonicalId: 'pro',
        objectType: 'Plan',
        objectName: 'Pro',
        action: 'modified',
        source: 'edited_since_last_upload',
        fields: [{ name: 'price', before: '10', after: '12' }],
      },
    ],
  },
  detail: { message: 'edited since the last upload' },
};

const PLAN = {
  create: [{ section: 'plans', handle: 'team' }],
  update: [{ section: 'plans', handle: 'pro' }],
  no_change: [{ section: 'plans', handle: 'free' }],
  remove: [{ section: 'segments', handle: 'old' }],
  conflict: [],
};

describe('classifyUploadRefusal / formatRefusal409 (AC-11)', () => {
  it('beyond-draft: names the version id, status, holder and the backup command', () => {
    const refusal = classifyUploadRefusal(BEYOND);
    expect(refusal).toMatchObject({ kind: 'beyond_draft', playbookVersionId: 'pv_42', status: 'awaiting_approval', heldBy: 'mark@example.com' });
    if (refusal.kind === 'other') throw new Error('unreachable');
    const out = formatRefusal409(refusal);
    expect(out).toContain('pv_42');
    expect(out).toContain('awaiting_approval');
    expect(out).toContain('mark@example.com (submitted by)');
    expect(out).toContain('revturbine download --draft --save <file>');
    expect(out).toContain('Nothing was written');
  });

  it('beyond-draft with no recorded holder says so', () => {
    const body = { ...BEYOND, details: { ...BEYOND.details, held_by: null, held_by_source: null } };
    const refusal = classifyUploadRefusal(body);
    if (refusal.kind === 'other') throw new Error('unreachable');
    expect(formatRefusal409(refusal)).toContain('no recorded holder');
  });

  it('conflicts: prints each edit with before/after, the instruction and the backup command', () => {
    const refusal = classifyUploadRefusal(CONFLICTS);
    if (refusal.kind !== 'conflicts') throw new Error('expected conflicts');
    const out = formatRefusal409(refusal);
    expect(out).toContain('Plan "Pro" (modified) — edited since the last upload');
    expect(out).toContain('price: "10" → "12"');
    expect(out).toContain('discard');
    expect(out).toContain('ask the human');
    expect(out).toContain('revturbine download --draft --save <file>');
  });

  it('a server-supplied instruction wins over the default', () => {
    const refusal = classifyUploadRefusal({ details: { ...CONFLICTS.details, instruction: 'Do the thing.' } });
    expect(refusal).toMatchObject({ kind: 'conflicts', instruction: 'Do the thing.' });
  });

  it.each([null, 'x', {}, { details: { conflicts: [] } }, { details: { error: 'something_else' } }])('unrecognized body %j is `other`', (body) => {
    expect(classifyUploadRefusal(body)).toEqual({ kind: 'other' });
  });
});

describe('offerBackup (AC-11)', () => {
  const refusal = (): Exclude<ReturnType<typeof classifyUploadRefusal>, { kind: 'other' }> => {
    const r = classifyUploadRefusal(BEYOND);
    if (r.kind === 'other') throw new Error('unreachable');
    return r;
  };
  const deps = (over: Partial<BackupDeps> = {}): BackupDeps => ({
    interactive: true,
    ask: vi.fn(async () => 'y'),
    fetchDraft: vi.fn(async () => ({ plans: [] })),
    write: vi.fn((file: string) => `/abs/${file}`),
    log: vi.fn(),
    ...over,
  });

  it('accepted: downloads the holder version and writes the file', async () => {
    const d = deps();
    const result = await offerBackup(d, refusal());
    expect(d.fetchDraft).toHaveBeenCalledWith('pv_42');
    expect(d.write).toHaveBeenCalledWith('revturbine-draft-backup-pv_42.json', '{\n  "plans": []\n}\n');
    expect(result).toEqual({ saved: '/abs/revturbine-draft-backup-pv_42.json' });
  });

  it('conflicts target the open draft (undefined version id)', async () => {
    const d = deps();
    const r = classifyUploadRefusal(CONFLICTS);
    if (r.kind === 'other') throw new Error('unreachable');
    await offerBackup(d, r);
    expect(d.fetchDraft).toHaveBeenCalledWith(undefined);
    expect(d.write).toHaveBeenCalledWith('revturbine-draft-backup.json', expect.any(String));
  });

  it('declined: writes nothing', async () => {
    const d = deps({ ask: vi.fn(async () => 'n') });
    expect(await offerBackup(d, refusal())).toEqual({});
    expect(d.fetchDraft).not.toHaveBeenCalled();
    expect(d.write).not.toHaveBeenCalled();
  });

  it('no terminal: never prompts and points at the command', async () => {
    const d = deps({ interactive: false });
    expect(await offerBackup(d, refusal())).toEqual({});
    expect(d.ask).not.toHaveBeenCalled();
    expect(d.log).toHaveBeenCalledWith(expect.stringContaining('backup command'));
  });

  it('a failed download is reported, not thrown', async () => {
    const d = deps({ fetchDraft: vi.fn(async () => { throw new Error('boom'); }) });
    expect(await offerBackup(d, refusal())).toEqual({});
    expect(d.log).toHaveBeenCalledWith(expect.stringContaining('Could not save the backup: boom'));
  });

  it('backupFileName', () => {
    expect(backupFileName('pv_1')).toBe('revturbine-draft-backup-pv_1.json');
    expect(backupFileName(undefined)).toBe('revturbine-draft-backup.json');
  });
});

describe('plan and notes (AC-7 CLI half, AC-11)', () => {
  it('formatPlan lists removals as their own group and only counts unchanged items', () => {
    const plan = readPlan({ plan: PLAN });
    if (!plan) throw new Error('no plan');
    const out = formatPlan(plan);
    expect(out).toContain('1 create, 1 update, 1 remove, 0 conflict, 1 no change');
    expect(out).toContain('REMOVE (1)');
    expect(out).toContain('segments: old');
    expect(out).not.toContain('plans: free');
    expect(conflictCount(plan)).toBe(0);
  });

  it('readPlan is undefined without a plan and tolerates missing groups', () => {
    expect(readPlan({})).toBeUndefined();
    expect(readPlan({ plan: { create: [{ section: 'a', handle: 'b' }] } })?.remove).toEqual([]);
  });

  it('readNotes + formatNotes print injected defaults, dropped fields and rewrites', () => {
    const notes = readNotes({
      import_notes: [
        { code: 'import.default_injected', message: "cooldown_days 7 injected", origin: 'platform default' },
        { message: "dropped 'status'" },
        'rewrote trial rule id',
        42,
      ],
    });
    expect(notes).toHaveLength(3);
    const out = formatNotes(notes);
    expect(out).toContain('import.default_injected: cooldown_days 7 injected (origin: platform default)');
    expect(out).toContain("dropped 'status'");
    expect(out).toContain('rewrote trial rule id');
  });
});

describe('--report (AC-19)', () => {
  const KEYS = ['outcome', 'plan', 'rejected', 'warnings'];

  it('200: applied, with the plan groups, findings, notes and version id', () => {
    const report = reportForSuccess(
      { ok: true, playbook_version_id: 'pv_1', imported: { plans: 2 }, plan: PLAN, findings: [{ code: 'x' }], import_notes: [{ message: 'n' }] },
      false,
    );
    expect(Object.keys(report)).toEqual(KEYS);
    expect(report.outcome).toBe('applied');
    expect(report.plan?.playbook_version_id).toBe('pv_1');
    expect(report.plan?.groups?.remove).toEqual([{ section: 'segments', handle: 'old' }]);
    expect(report.warnings.findings).toEqual([{ code: 'x' }]);
    expect(report.warnings.notes).toEqual([{ message: 'n' }]);
    expect(report.rejected).toBeNull();
  });

  it('dry run: outcome dry_run carrying the plan it printed', () => {
    const report = reportForSuccess({ ok: true, dryRun: true, plan: PLAN }, true);
    expect(report.outcome).toBe('dry_run');
    expect(report.plan?.groups).not.toBeNull();
  });

  it('409 beyond draft: refused, with the body and the instruction', () => {
    const report = reportForRefusal(409, BEYOND);
    expect(Object.keys(report)).toEqual(KEYS);
    expect(report.outcome).toBe('refused');
    expect(report.plan).toBeNull();
    expect(report.rejected).toMatchObject({ status: 409, kind: 'beyond_draft', body: BEYOND });
    expect(report.rejected?.instruction).toContain('pv_42');
    expect(report.rejected?.instruction).toContain('revturbine download --draft --save <file>');
  });

  it('409 conflicts: refused with the instruction', () => {
    const report = reportForRefusal(409, CONFLICTS);
    expect(report.rejected?.kind).toBe('conflicts');
    expect(report.rejected?.instruction).toContain('ask the human');
  });

  it('422: refused, findings surfaced as warnings', () => {
    const body = { ok: false, error: 'Config has blocking validation findings', findings: [{ code: 'VAL-1', severity: 'error_draft' }] };
    const report = reportForRefusal(422, body);
    expect(report.rejected).toMatchObject({ status: 422, kind: 'validation', body });
    expect(report.warnings.findings).toEqual(body.findings);
  });

  it('an offline failure and an unclassified status are still refused reports', () => {
    expect(reportForOfflineFailure().outcome).toBe('refused');
    expect(reportForRefusal(500, { error: 'x' }).rejected?.kind).toBe('http');
  });

  it('serializes to valid JSON ending in a newline', () => {
    const text = serializeReport(reportForRefusal(422, {}));
    expect(text.endsWith('\n')).toBe(true);
    expect(JSON.parse(text).outcome).toBe('refused');
  });
});

describe('discardPrompt (AC-11)', () => {
  it('names the status when known and says discarding deletes edits', () => {
    const prompt = discardPrompt({ id: 'pv_1', url: 'https://x/app', status: 'draft' });
    expect(prompt).toContain('pv_1 (status: draft)');
    expect(prompt).toContain('deletes');
  });
  it('omits the status when unknown', () => {
    expect(discardPrompt({ id: 'pv_1', url: 'https://x/app' })).not.toContain('status');
  });
});
