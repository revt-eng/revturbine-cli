/**
 * Open-draft resolution (plan 131): `--draft` selectors and draft-scoped
 * commands resolve the tenant's single open draft via
 * `GET /api/optimization/drafts` instead of requiring the id on the command
 * line. `fetchImpl` is injectable for tests.
 */

export interface ActiveDraft {
  id: string;
  name?: string;
  status?: string;
}

export async function resolveActiveDraft(
  baseUrl: string,
  headers: Record<string, string>,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; status: number; draft: ActiveDraft | null }> {
  const res = await fetchImpl(`${baseUrl}/api/optimization/drafts`, { headers });
  const json = (await res.json().catch(() => ({}))) as { active?: ActiveDraft | null };
  return { ok: res.ok, status: res.status, draft: res.ok ? (json.active ?? null) : null };
}
