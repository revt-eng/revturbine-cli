/**
 * Canonical Playbook header handling for the CLI (plan 118 TASK-23).
 *
 * A downloaded/authored Config File carries a header. There are two shapes:
 *
 *   - **canonical** — `{ artifact_type: 'playbook', format_version, playbook_handle?,
 *     playbook_version_id?, tenant_id?, environment_id? }`
 *   - **legacy** — `{ version, change_set_id?, tenant_id?, environment_id? }` with no
 *     `artifact_type` discriminator (pre-plan-118 exports; the server still reads them).
 *
 * The CLI is a dependency-light HTTP client with no `@revt-eng/*` package, so the
 * set of supported `format_version`s is pinned here (mirroring the scaffold's
 * `PLAYBOOK_FORMAT_VERSION` in `src/config/models/schema.ts`) and unit-tested,
 * rather than imported. Keep it in sync with the scaffold; the test in
 * `tests/playbook-header.test.ts` fails if it drifts.
 *
 * Policy (plan 118 REQ-2): an absent/new-shape discriminator selects the known
 * legacy reader, but an **unknown future `format_version` fails validation** —
 * and the CLI enforces that BEFORE any network mutation (upload / launch), so a
 * too-new file never reaches `/api/config/import`.
 */

/** Format versions this CLI build understands. Mirrors scaffold PLAYBOOK_FORMAT_VERSION. */
export const SUPPORTED_FORMAT_VERSIONS: ReadonlySet<string> = new Set(['1.0.0']);

export type PlaybookShape = 'canonical' | 'legacy' | 'unknown';

export interface PlaybookHeaderView {
  shape: PlaybookShape;
  artifactType?: string;
  /** Canonical `format_version`, or the legacy `version`, normalized to one field. */
  formatVersion?: string;
  playbookHandle?: string;
  /** Canonical `playbook_version_id`, or the legacy `change_set_id`, normalized. */
  playbookVersionId?: string | null;
  tenantId?: string;
  environmentId?: string;
}

/** Thrown when a Config File declares a `format_version` this CLI can't handle. */
export class UnsupportedFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedFormatError';
  }
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/**
 * Read a Config File's header into a normalized view. Legacy `version` /
 * `change_set_id` normalize onto `formatVersion` / `playbookVersionId` for display.
 */
export function readPlaybookHeader(config: unknown): PlaybookHeaderView {
  const c = (config && typeof config === 'object' ? (config as Record<string, unknown>) : {}) as Record<string, unknown>;
  const artifactType = str(c.artifact_type);
  const tenantId = str(c.tenant_id);
  const environmentId = str(c.environment_id);

  if (artifactType === 'playbook') {
    return {
      shape: 'canonical',
      artifactType,
      formatVersion: str(c.format_version),
      playbookHandle: str(c.playbook_handle),
      playbookVersionId: (c.playbook_version_id ?? null) as string | null,
      tenantId,
      environmentId,
    };
  }

  // No canonical discriminator → the known legacy shape iff it carries `version`.
  if (artifactType === undefined && typeof c.version === 'string') {
    return {
      shape: 'legacy',
      formatVersion: c.version,
      playbookVersionId: (c.change_set_id ?? null) as string | null,
      tenantId,
      environmentId,
    };
  }

  return { shape: 'unknown', artifactType, tenantId, environmentId };
}

/**
 * Reject a Config File whose format this CLI can't handle — BEFORE any network
 * mutation. A canonical Playbook with an unsupported `format_version`, or an
 * unrecognized `artifact_type`, throws `UnsupportedFormatError`. The known legacy
 * shape is always allowed (the server normalizes it). Returns the header view on
 * success so callers can display it.
 */
export function assertSupportedFormat(config: unknown): PlaybookHeaderView {
  const header = readPlaybookHeader(config);

  if (header.shape === 'canonical') {
    const version = header.formatVersion;
    if (!version || !SUPPORTED_FORMAT_VERSIONS.has(version)) {
      throw new UnsupportedFormatError(
        `Unsupported Playbook format_version ${version ? `"${version}"` : '(missing)'}. ` +
          `This CLI supports: ${[...SUPPORTED_FORMAT_VERSIONS].join(', ')}. Upgrade the CLI (\`npm i -g @revturbine/cli\`).`,
      );
    }
    return header;
  }

  if (header.shape === 'unknown') {
    throw new UnsupportedFormatError(
      header.artifactType
        ? `Unrecognized artifact_type "${header.artifactType}" — expected "playbook" or a legacy Config File.`
        : 'File is neither a canonical Playbook (artifact_type: "playbook") nor a legacy Config File (missing "version").',
    );
  }

  return header; // legacy — allowed
}

/** One-line summary of the header for `download` / `validate` diagnostics. */
export function describePlaybookHeader(header: PlaybookHeaderView): string {
  if (header.shape === 'legacy') {
    return `legacy Config File (version ${header.formatVersion ?? '?'})`;
  }
  if (header.shape === 'canonical') {
    const parts = [`Playbook format_version ${header.formatVersion ?? '?'}`];
    if (header.playbookHandle) parts.push(`handle ${header.playbookHandle}`);
    if (header.playbookVersionId) parts.push(`playbook_version_id ${header.playbookVersionId}`);
    return parts.join(', ');
  }
  return 'unrecognized artifact';
}
