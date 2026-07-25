/**
 * Convergent-import query builder (plan 155).
 *
 * The CLI's `upload` / `launch <file>` are convergent by default — the uploaded
 * Config File is the desired state, so entities absent from it are removed
 * (guarded against emptying / >50%-deleting a populated type). These flags map
 * to the `/api/config/import` query string:
 *   - no flag (`prune === undefined`) → `''` — guarded convergent default
 *   - `--prune` (`prune === true`)     → `?prune=force` — confirm a mass deletion
 *   - `--no-prune` (`prune === false`) → `?prune=false` — additive (keep absent entities)
 */
export function pruneQuery(prune: boolean | undefined): string {
  if (prune === false) return '?prune=false';
  if (prune === true) return '?prune=force';
  return '';
}
