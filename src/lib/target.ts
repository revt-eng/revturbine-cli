/**
 * Target-aware upload (plan 131 TASK-10, cli.md "Target-aware, portable"):
 * a downloaded Config File carries its origin `tenant_id`; `upload`/`launch`
 * send it back there by default, an explicit `-t/--tenant-id` retargets
 * deliberately, and an embedded tenant that contradicts the session with no
 * explicit choice is refused before anything is sent. The server always
 * re-authorizes membership — this guard only prevents the honest mistake.
 */

export type UploadTarget =
  | { ok: true; tenantId: string; note?: string }
  | { ok: false; error: string };

export function resolveUploadTarget(params: {
  /** `tenant_id` embedded in the Config File (absent on hand-authored files). */
  embedded?: string | null;
  /** Explicit `-t/--tenant-id` from the command line. */
  explicit?: string | null;
  /** The session's tenant (stored token, or the dev default). */
  session: string;
}): UploadTarget {
  const embedded = params.embedded ?? undefined;
  const explicit = params.explicit ?? undefined;

  if (explicit) {
    return {
      ok: true,
      tenantId: explicit,
      note:
        embedded && embedded !== explicit
          ? `retargeting deliberately: config was exported from ${embedded}, sending to ${explicit} (-t)`
          : undefined,
    };
  }
  if (!embedded || embedded === params.session) {
    return { ok: true, tenantId: params.session };
  }
  return {
    ok: false,
    error:
      `this config was exported from tenant ${embedded}, but the session targets ${params.session}. ` +
      `Pass -t ${embedded} to send it back where it came from, or -t ${params.session} to retarget it deliberately.`,
  };
}
