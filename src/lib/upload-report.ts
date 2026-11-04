/**
 * Pure rendering and report logic for `upload` (BL-0518 TASK-11): the two 409
 * refusals, the dry-run plan, the warn-in-full notes and the `--report` file.
 * `cli.ts` owns the IO; everything here takes the response body as an argument
 * (AGENTS.md rule 3).
 *
 * Server contract (web `/api/config/import`, `?dryRun=true`):
 *   200 apply   { ok, imported, playbook_version_id, findings, plan?, import_notes? }
 *   200 dry run { ok, dryRun, imported, playbook_version_id, plan, findings }
 *   409 beyond  { ok:false, stage, details:{ error:'in_flight_version_beyond_draft',
 *                 playbook_version_id, status, held_by, held_by_source, backup_command },
 *                 detail:{ message } }
 *   409 edits   { ok:false, stage, details:{ conflicts:[DraftChange-shaped edit], instruction? },
 *                 detail:{ message } }
 *   422         { ok:false, error, findings | issues }
 */

export const PLAN_GROUPS = ['create', 'update', 'remove', 'conflict', 'no_change'] as const;
export type PlanGroup = (typeof PLAN_GROUPS)[number];
export type PlanItem = { section: string; handle: string };
export type PlanGroups = Record<PlanGroup, PlanItem[]>;

/** The backup command the server names; used when an older server omits it. */
export const DEFAULT_BACKUP_COMMAND = 'revturbine download --draft --save <file>';

const DEFAULT_INSTRUCTION =
  'Work these edits into your file and upload again, or discard the draft with `revturbine discard`, '
  + "which needs the human's confirmation because discarding deletes the edits. If in doubt, ask the human.";

type Json = Record<string, unknown>;

function isRecord(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

/** The grouped plan from a 200 body, or undefined when the server sent none. */
export function readPlan(body: unknown): PlanGroups | undefined {
  const plan = isRecord(body) ? body.plan : undefined;
  if (!isRecord(plan)) return undefined;
  const groups = {} as PlanGroups;
  for (const group of PLAN_GROUPS) {
    const items = plan[group];
    groups[group] = Array.isArray(items)
      ? items.filter(isRecord).map((item) => ({ section: String(item.section ?? ''), handle: String(item.handle ?? '') }))
      : [];
  }
  return groups;
}

/** Count of items the plan marks as conflicts. */
export function conflictCount(plan: PlanGroups | undefined): number {
  return plan?.conflict.length ?? 0;
}

/** Human text for the grouped plan: removals and conflicts are their own groups; unchanged items are only counted. */
export function formatPlan(plan: PlanGroups): string {
  const lines: string[] = [];
  const summary = PLAN_GROUPS.map((group) => `${plan[group].length} ${group.replace('_', ' ')}`).join(', ');
  lines.push(`Plan: ${summary}`);
  for (const group of PLAN_GROUPS) {
    if (group === 'no_change' || plan[group].length === 0) continue;
    lines.push(`  ${group.toUpperCase()} (${plan[group].length})`);
    for (const item of plan[group]) lines.push(`    ${item.section}: ${item.handle}`);
  }
  return lines.join('\n');
}

export interface Note {
  code?: string;
  message: string;
  field?: string;
  value?: unknown;
  origin?: string;
}

function noteFrom(entry: unknown): Note | undefined {
  if (typeof entry === 'string') return { message: entry };
  if (!isRecord(entry)) return undefined;
  const message = text(entry.message) ?? text(entry.summary);
  if (!message) return undefined;
  return {
    ...(text(entry.code) ? { code: text(entry.code) } : {}),
    message,
    ...(text(entry.field) ? { field: text(entry.field) } : {}),
    ...('value' in entry ? { value: entry.value } : {}),
    ...(text(entry.origin) ? { origin: text(entry.origin) } : {}),
  };
}

/** The structured warn-in-full notes (`import_notes`) a response carries, if any. */
export function readNotes(body: unknown): Note[] {
  const raw = isRecord(body) ? body.import_notes : undefined;
  return Array.isArray(raw) ? raw.map(noteFrom).filter((n): n is Note => n !== undefined) : [];
}

export function formatNotes(notes: ReadonlyArray<Note>): string {
  return notes
    .map((n) => `• ${n.code ? `${n.code}: ` : ''}${n.message}${n.origin ? ` (origin: ${n.origin})` : ''}`)
    .join('\n');
}

export interface ConflictField {
  name: string;
  before: string | null;
  after: string | null;
}

export interface ConflictEdit {
  objectType: string;
  objectName: string;
  action?: string;
  source: string;
  fields: ConflictField[];
}

export type UploadRefusal =
  | {
      kind: 'beyond_draft';
      playbookVersionId: string;
      status: string;
      heldBy: string | null;
      heldBySource: string | null;
      backupCommand: string;
      message?: string;
    }
  | { kind: 'conflicts'; edits: ConflictEdit[]; instruction: string; backupCommand: string; message?: string }
  | { kind: 'other' };

function pick(entry: Json, camel: string, snake: string): unknown {
  return entry[camel] ?? entry[snake];
}

function editFrom(entry: unknown): ConflictEdit | undefined {
  if (!isRecord(entry)) return undefined;
  const fields = Array.isArray(entry.fields)
    ? entry.fields.filter(isRecord).map((f) => ({
        name: String(f.name ?? ''),
        before: f.before === null || f.before === undefined ? null : String(f.before),
        after: f.after === null || f.after === undefined ? null : String(f.after),
      }))
    : [];
  return {
    objectType: String(pick(entry, 'objectType', 'object_type') ?? 'object'),
    objectName: String(pick(entry, 'objectName', 'object_name') ?? pick(entry, 'canonicalId', 'lineage_key') ?? ''),
    ...(text(entry.action) ? { action: text(entry.action) } : {}),
    // The studio/agent/rollback source is reported as one phrase; no person is named (D-1).
    source: !text(entry.source) || entry.source === 'edited_since_last_upload'
      ? 'edited since the last upload'
      : String(entry.source).replace(/_/g, ' '),
    fields,
  };
}

/** Classify a 409 body from the upload routes. Anything unrecognized is `other` and rendered raw. */
export function classifyUploadRefusal(body: unknown): UploadRefusal {
  if (!isRecord(body)) return { kind: 'other' };
  const details = isRecord(body.details) ? body.details : undefined;
  const detail = isRecord(body.detail) ? body.detail : undefined;
  const message = text(detail?.message);
  if (details && details.error === 'in_flight_version_beyond_draft') {
    return {
      kind: 'beyond_draft',
      playbookVersionId: String(details.playbook_version_id ?? ''),
      status: String(details.status ?? 'unknown'),
      heldBy: text(details.held_by) ?? null,
      heldBySource: text(details.held_by_source) ?? null,
      backupCommand: text(details.backup_command) ?? DEFAULT_BACKUP_COMMAND,
      ...(message ? { message } : {}),
    };
  }
  const conflicts = details?.conflicts ?? body.conflicts;
  // Only studio-edit-shaped entries (objectType / fields[]) are edits. The
  // duplicate_handles 409 also carries details.conflicts, as
  // {collection, handle, existing_id, config_id, scope}; that is `other` so the
  // server message prints and no backup is offered.
  const editShaped = (entry: unknown): boolean =>
    isRecord(entry) && (entry.objectType !== undefined || entry.object_type !== undefined || Array.isArray(entry.fields));
  if (Array.isArray(conflicts) && conflicts.length > 0 && conflicts.every(editShaped)) {
    const edits = conflicts.map(editFrom).filter((e): e is ConflictEdit => e !== undefined);
    return {
      kind: 'conflicts',
      edits,
      instruction: text(details?.instruction) ?? text(body.instruction) ?? DEFAULT_INSTRUCTION,
      backupCommand: text(details?.backup_command) ?? DEFAULT_BACKUP_COMMAND,
      ...(message ? { message } : {}),
    };
  }
  return { kind: 'other' };
}

function quote(value: string | null): string {
  return value === null ? '(none)' : JSON.stringify(value);
}

/** The detailed refusal text printed for a 409; ends with the instruction and backup command. */
export function formatRefusal409(refusal: Exclude<UploadRefusal, { kind: 'other' }>): string {
  if (refusal.kind === 'beyond_draft') {
    const holder = refusal.heldBy
      ? `${refusal.heldBy}${refusal.heldBySource ? ` (${refusal.heldBySource.replace('_', ' ')})` : ''}`
      : 'no recorded holder';
    return [
      `✗ Upload refused: version ${refusal.playbookVersionId} is ${refusal.status} and occupies the single in-flight slot. Nothing was written and the version was not changed.`,
      `  version: ${refusal.playbookVersionId}`,
      `  status:  ${refusal.status}`,
      `  holder:  ${holder}`,
      '  Ask the holder to approve, reject or withdraw it first, then upload again.',
      `  To keep a copy of the current draft: ${refusal.backupCommand}`,
    ].join('\n');
  }
  const lines = [
    `✗ Upload refused: the open draft holds ${refusal.edits.length} edit(s) made since the last upload that this file would overwrite or remove. Nothing was written.`,
  ];
  for (const edit of refusal.edits) {
    lines.push(`  • ${edit.objectType} ${JSON.stringify(edit.objectName)}${edit.action ? ` (${edit.action})` : ''} — ${edit.source}`);
    for (const field of edit.fields) lines.push(`      ${field.name}: ${quote(field.before)} → ${quote(field.after)}`);
  }
  lines.push(`  ${refusal.instruction}`);
  lines.push(`  To keep a copy of the current draft: ${refusal.backupCommand}`);
  return lines.join('\n');
}

/** A sensible default backup file name. */
export function backupFileName(versionId: string | undefined): string {
  return versionId ? `revturbine-draft-backup-${versionId}.json` : 'revturbine-draft-backup.json';
}

/** The version whose draft a backup should save: the beyond-draft holder, else the open draft. */
export function backupTargetVersion(refusal: UploadRefusal): string | undefined {
  return refusal.kind === 'beyond_draft' && refusal.playbookVersionId ? refusal.playbookVersionId : undefined;
}

export interface BackupDeps {
  /** True only when a person can answer (stdin is a TTY). */
  interactive: boolean;
  ask: (question: string) => Promise<string>;
  /** Download the draft's config; `versionId` undefined means the tenant's open draft. */
  fetchDraft: (versionId: string | undefined) => Promise<unknown>;
  /** Write the file and return its absolute path. */
  write: (file: string, content: string) => string;
  log: (message: string) => void;
}

/**
 * Offer to save the current draft before the caller works the refusal (D-4,
 * REQ-13). Never prompts without a person to answer, and a failed backup is
 * reported, never thrown: the refusal stays the command's result.
 */
export async function offerBackup(
  deps: BackupDeps,
  refusal: Exclude<UploadRefusal, { kind: 'other' }>,
): Promise<{ saved?: string }> {
  if (!deps.interactive) {
    deps.log('Not prompting for a backup (no terminal). Run the backup command above before discarding or re-uploading.');
    return {};
  }
  const versionId = backupTargetVersion(refusal);
  const file = backupFileName(versionId);
  const answer = (await deps.ask(`Save the current draft to ${file} first? [y/N] `)).trim().toLowerCase();
  if (answer !== 'y' && answer !== 'yes') return {};
  try {
    const config = await deps.fetchDraft(versionId);
    const saved = deps.write(file, `${JSON.stringify(config, null, 2)}\n`);
    deps.log(`✓ Wrote ${saved}`);
    return { saved };
  } catch (err) {
    deps.log(`Could not save the backup: ${(err as Error).message}. Run \`${refusal.backupCommand}\` yourself.`);
    return {};
  }
}

export type UploadOutcome ='applied' | 'dry_run' | 'refused';

export interface UploadReport {
  outcome: UploadOutcome;
  plan: {
    playbook_version_id: string | null;
    imported: unknown;
    groups: PlanGroups | null;
  } | null;
  rejected: {
    status: number;
    kind: UploadRefusal['kind'] | 'validation' | 'offline_validation' | 'http';
    body: unknown;
    instruction?: string;
  } | null;
  warnings: { findings: unknown[]; notes: Note[] };
}

function findingsOf(body: unknown): unknown[] {
  return isRecord(body) && Array.isArray(body.findings) ? body.findings : [];
}

/** The report for a 200 (applied or dry run). */
export function reportForSuccess(body: unknown, dryRun: boolean): UploadReport {
  const json = isRecord(body) ? body : {};
  return {
    outcome: dryRun ? 'dry_run' : 'applied',
    plan: {
      playbook_version_id: text(json.playbook_version_id) ?? null,
      imported: json.imported ?? null,
      groups: readPlan(body) ?? null,
    },
    rejected: null,
    warnings: { findings: findingsOf(body), notes: readNotes(body) },
  };
}

/** The report for a refusal: a 409 (either kind), a 422, or any other non-OK status. */
export function reportForRefusal(status: number, body: unknown): UploadReport {
  const refusal = status === 409 ? classifyUploadRefusal(body) : ({ kind: 'other' } as const);
  const kind = refusal.kind !== 'other' ? refusal.kind : status === 422 ? 'validation' : 'http';
  return {
    outcome: 'refused',
    plan: null,
    rejected: {
      status,
      kind,
      body,
      ...(refusal.kind === 'conflicts' ? { instruction: refusal.instruction } : {}),
      ...(refusal.kind === 'beyond_draft'
        ? { instruction: `Ask the holder to approve, reject or withdraw version ${refusal.playbookVersionId} first. Backup: ${refusal.backupCommand}` }
        : {}),
    },
    warnings: { findings: findingsOf(body), notes: [] },
  };
}

/** The report for a file the offline pre-check rejected before any request was made. */
export function reportForOfflineFailure(): UploadReport {
  return {
    outcome: 'refused',
    plan: null,
    rejected: { status: 0, kind: 'offline_validation', body: null },
    warnings: { findings: [], notes: [] },
  };
}

export function serializeReport(report: UploadReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

/** The `discard` confirmation, naming the version's status when it is known. */
export function discardPrompt(input: { id: string; url: string; status?: string }): string {
  const status = input.status ? ` (status: ${input.status})` : '';
  return `Discard draft ${input.id}${status} on ${input.url}? This deletes its staged edits.`;
}
