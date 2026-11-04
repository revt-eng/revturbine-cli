/**
 * Proxy support (BUG-821). Node's built-in fetch ignores HTTP(S)_PROXY, so the
 * CLI installs undici's EnvHttpProxyAgent as the global dispatcher when one of
 * the standard variables is set (cli.ts owns that IO). The decisions live here
 * as pure functions: which variable is in force, and the cause-bearing text of
 * a failed request. A proxy URL can carry credentials, so only the variable
 * NAME is ever printed.
 */

/** Variables EnvHttpProxyAgent reads, in the order the CLI reports them. */
const PROXY_VARIABLES = ['HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy'] as const;

/** The name of the first proxy variable that is set and non-blank, else null. */
export function proxyVariable(env: Record<string, string | undefined>): string | null {
  return PROXY_VARIABLES.find((name) => env[name]?.trim()) ?? null;
}

type ErrorWithCause = { message?: unknown; cause?: unknown; code?: unknown };

/** The deepest "code: message" an error carries, e.g. "ECONNREFUSED: connect ECONNREFUSED 127.0.0.1:3128". */
function rootCause(err: unknown): string | null {
  let cursor: unknown = (err as ErrorWithCause | null)?.cause;
  let found: string | null = null;
  for (let depth = 0; cursor && typeof cursor === 'object' && depth < 5; depth++) {
    const { code, message, cause } = cursor as ErrorWithCause;
    const text = [typeof code === 'string' ? code : '', typeof message === 'string' ? message : ''].filter(Boolean).join(': ');
    if (text) found = text;
    cursor = cause;
  }
  return found;
}

/**
 * Turn a failed request into text that names the cause and the remedy instead
 * of a bare "fetch failed".
 */
export function describeFetchFailure(err: unknown, env: Record<string, string | undefined>): string {
  const base = err instanceof Error ? err.message : String(err);
  const cause = rootCause(err);
  const variable = proxyVariable(env);
  const parts = [cause ? `${base} (${cause})` : base];
  if (variable) {
    parts.push(
      `The request went through the proxy named by ${variable}. Check that the proxy is reachable and allows this host, or add the host to NO_PROXY.`,
    );
  } else if (/fetch failed/i.test(base)) {
    parts.push('If this machine reaches the internet only through a proxy, set HTTPS_PROXY (and NO_PROXY for hosts that bypass it) and run again.');
  }
  return parts.join(' ');
}
