/** Authentication evidence from the protected endpoint, independent of tenant configuration. */
export function classifyToken(hasToken: boolean, status: number | null): boolean | null {
  if (!hasToken || status === null) return null;
  if (status >= 200 && status < 300) return true;
  if (status === 401 || status === 403) return false;
  return null;
}

export function formatAuthentication(hasToken: boolean, tokenValid: boolean | null): string {
  if (!hasToken) return 'authentication: not logged in — run `revturbine login`';
  if (tokenValid === true) return 'authentication: credentials accepted for this instance and tenant';
  if (tokenValid === false) return 'authentication: credentials rejected for this instance or tenant — check access or run `revturbine login`';
  return 'authentication: verification unavailable — credentials present; retry when the instance is reachable';
}
