import { execFileSync } from 'node:child_process';

export const SOURCE_CLI_SETUP_TIMEOUT_MS = 20_000;

/**
 * A newly written, fully bundled source fixture has a separate cold-start cost
 * (measured before the first stdout/request on Windows). Pay that cost during
 * bounded fixture setup, not inside a request deadline assertion. Never call
 * this for REVTURBINE_TEST_CLI: installed artifacts must be tested cold.
 */
export function prepareSourceCli(cli: string, cwd: string): void {
  execFileSync(process.execPath, [cli, '--help'], {
    cwd, stdio: 'pipe', timeout: 15_000,
  });
}
