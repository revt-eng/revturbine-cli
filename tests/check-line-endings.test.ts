/**
 * BL-0216 (follow-up to BL-0209) — the staged-CRLF pre-commit gate.
 *
 * `.gitattributes` normalizes line endings on checkin/checkout, but a
 * stale git config, an editor that writes CRLF, or a merge tool can still
 * stage a CRLF file — that has repeatedly turned an ordinary merge into a
 * whole-file conflict in the product repos (web #852, BL-0065, #853).
 * `check-line-endings.mjs` inspects staged content directly so it catches
 * that regardless of `.gitattributes`.
 */
import { describe, expect, it } from 'vitest';
import { checkFiles, hasCRLF, isBinaryPath } from '../scripts/check-line-endings.mjs';

describe('hasCRLF', () => {
  it('detects a CRLF line ending', () => {
    expect(hasCRLF('line one\r\nline two\n')).toBe(true);
  });

  it('passes LF-only content', () => {
    expect(hasCRLF('line one\nline two\n')).toBe(false);
  });

  it('passes content with no line breaks at all', () => {
    expect(hasCRLF('no newline here')).toBe(false);
  });

  it('accepts a Buffer as well as a string', () => {
    expect(hasCRLF(Buffer.from('a\r\nb'))).toBe(true);
    expect(hasCRLF(Buffer.from('a\nb'))).toBe(false);
  });
});

describe('isBinaryPath', () => {
  it('treats a path git reports as -text (binary) as binary', () => {
    const execFile = () => 'public/logo.png: text: unset\n';
    expect(isBinaryPath('public/logo.png', execFile)).toBe(true);
  });

  it('treats a path git reports as text=auto as non-binary', () => {
    const execFile = () => 'scripts/index.mjs: text: set\n';
    expect(isBinaryPath('scripts/index.mjs', execFile)).toBe(false);
  });

  it('fails open (non-binary) when git check-attr errors', () => {
    const execFile = () => {
      throw new Error('git not found');
    };
    expect(isBinaryPath('whatever.mjs', execFile)).toBe(false);
  });
});

describe('checkFiles', () => {
  const noExec = () => {
    throw new Error('execFile should not be called in these cases');
  };

  it('flags a staged text file containing CRLF', () => {
    const offenders = checkFiles(['scripts/foo.mjs'], {
      execFile: () => 'scripts/foo.mjs: text: set\n',
      readStaged: () => 'const x = 1;\r\nconst y = 2;\n',
    });
    expect(offenders).toEqual(['scripts/foo.mjs']);
  });

  it('passes a staged text file with only LF', () => {
    const offenders = checkFiles(['scripts/foo.mjs'], {
      execFile: () => 'scripts/foo.mjs: text: set\n',
      readStaged: () => 'const x = 1;\nconst y = 2;\n',
    });
    expect(offenders).toEqual([]);
  });

  it('exempts a file git considers binary, even if its bytes contain \\r\\n', () => {
    const offenders = checkFiles(['docs/specs/scaffold/business-context/placement-model.pdf'], {
      execFile: () => 'docs/specs/scaffold/business-context/placement-model.pdf: text: unset\n',
      readStaged: noExec,
    });
    expect(offenders).toEqual([]);
  });

  it('skips a file that cannot be read (e.g. deleted from the index)', () => {
    const offenders = checkFiles(['gone.mjs'], {
      execFile: () => 'gone.mjs: text: set\n',
      readStaged: () => {
        throw new Error('no such blob');
      },
    });
    expect(offenders).toEqual([]);
  });

  it('checks multiple files independently', () => {
    const content: Record<string, string> = {
      'good.mjs': 'a\nb\n',
      'bad.mjs': 'a\r\nb\n',
    };
    const offenders = checkFiles(['good.mjs', 'bad.mjs'], {
      execFile: () => 'x: text: set\n',
      readStaged: (file: string) => content[file],
    });
    expect(offenders).toEqual(['bad.mjs']);
  });
});
