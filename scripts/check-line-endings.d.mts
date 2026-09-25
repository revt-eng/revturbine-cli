// Ambient types for check-line-endings.mjs — this tsconfig has no allowJs,
// so a plain .mjs import from a .ts test file needs a declaration file
// rather than flipping a repo-wide compiler option for one script (BL-0216).

type ExecFile = (cmd: string, args: string[], opts?: Record<string, unknown>) => string;

export function hasCRLF(buf: string | Buffer): boolean;
export function isBinaryPath(file: string, execFile?: ExecFile): boolean;
export function checkFiles(
  files: string[],
  opts?: { execFile?: ExecFile; readStaged?: (file: string) => string },
): string[];
