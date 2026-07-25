/**
 * `revturbine validate <playbook-version-id>` support (plan 74 TASK-7; renamed
 * to the playbook-version wire in plan 130).
 *
 * Thin client over the server's `POST /api/config/validate` — the same shared
 * `@revt-eng/schema/validators` catalog the studios and the publish gate run.
 * The endpoint returns the flat findings and does NOT decide blocking; the CLI
 * does, by the four-tier severity ladder: `error_draft` / `error_launch` block
 * (non-zero exit), `warning` / `ai_check` advise (zero exit). Kept here (not
 * inline in the CLI) so the exit-code rule and the text formatting are unit
 * tested without spawning the binary.
 */

export type Severity = 'error_draft' | 'error_launch' | 'warning' | 'ai_check';

export interface ValidationFinding {
  code: string;
  severity: Severity | string;
  message: string;
  targetRef?: Record<string, unknown>;
}

export interface ValidationResult {
  ok: boolean;
  status: number;
  findings: ValidationFinding[];
  /** Server-provided error text on a non-OK response. */
  error?: string;
}

/**
 * The severities that block a deploy (and so drive a non-zero CLI exit). This
 * mirrors the canonical `disposition(finding, 'publish')` rule in
 * `@revt-eng/schema/validators` (spec config-validation.md §3.1): `error_draft`
 * blocks everywhere, `error_launch` blocks at the launch gate — and the CLI
 * validates a draft pre-deploy, i.e. the publish call site. It is pinned here
 * rather than imported because the devkit CLI is a dependency-light HTTP client
 * with no `@revt-eng/*` package. Keep in sync with the ladder; the per-severity
 * test in `tests/config-validate.test.ts` fails if this set drifts from the AC.
 */
const BLOCKING_SEVERITIES: ReadonlySet<string> = new Set(['error_draft', 'error_launch']);

/**
 * Whether a finding blocks a launch. `force` mirrors the server's
 * `forceLaunchGate` (plan 147 REQ-10): a deliberate `--force` relaxes the
 * `error_launch` tier (incomplete-but-valid, e.g. a plan with no price) while
 * `error_draft` — a structural error — STILL blocks. Without `force` the full
 * ladder applies. Keeping the override here (not just in the command) means the
 * CLI's pre-deploy gate and the server gate agree on what `--force` lets past.
 */
export function isBlockingFinding(finding: { severity: string }, force = false): boolean {
  if (force && finding.severity === 'error_launch') return false;
  return BLOCKING_SEVERITIES.has(finding.severity);
}

export function hasBlockingFindings(
  findings: ReadonlyArray<{ severity: string }>,
  force = false,
): boolean {
  return findings.some((f) => isBlockingFinding(f, force));
}

/**
 * One human-readable line per finding — blocking findings marked `✗`, advisory
 * `•`. Always carries the finding's `message` verbatim (the same string the
 * studios show). Returns a clean-bill line for an empty set.
 */
export function formatFindings(findings: ReadonlyArray<ValidationFinding>): string {
  if (findings.length === 0) return 'No validation findings.';
  return findings
    .map((f) => `${isBlockingFinding(f) ? '✗' : '•'} [${f.severity}] ${f.code}: ${f.message}`)
    .join('\n');
}

/**
 * POST the playbook version id to `/api/config/validate` and return the flat
 * findings. `fetchImpl` is injectable so the command can be tested against a
 * stubbed endpoint (AC-8). Never throws on a non-OK status — the caller
 * inspects `ok`.
 */
export async function fetchValidation(
  baseUrl: string,
  playbookVersionId: string,
  headers: Record<string, string>,
  fetchImpl: typeof fetch = fetch,
): Promise<ValidationResult> {
  const res = await fetchImpl(`${baseUrl}/api/config/validate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ playbookVersionId }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    findings?: unknown;
    error?: string;
  };
  return {
    ok: res.ok,
    status: res.status,
    findings: Array.isArray(json.findings) ? (json.findings as ValidationFinding[]) : [],
    error: typeof json.error === 'string' ? json.error : undefined,
  };
}
