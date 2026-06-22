import { describe, expect, it, vi } from 'vitest';

import {
  fetchValidation,
  formatFindings,
  hasBlockingFindings,
  isBlockingFinding,
  type ValidationFinding,
} from '../src/lib/config-validate';

function finding(severity: string, over: Partial<ValidationFinding> = {}): ValidationFinding {
  return {
    code: 'VAL-PLN-01',
    severity,
    message: `finding for ${severity}`,
    ...over,
  };
}

/** Minimal Response stub for the injected fetch. */
function stubFetch(status: number, body: unknown): typeof fetch {
  return vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  })) as unknown as typeof fetch;
}

describe('blocking rule (the CLI exit-code contract — AC-8)', () => {
  it('error_draft and error_publish block; warning and ai_check do not', () => {
    expect(isBlockingFinding(finding('error_draft'))).toBe(true);
    expect(isBlockingFinding(finding('error_publish'))).toBe(true);
    expect(isBlockingFinding(finding('warning'))).toBe(false);
    expect(isBlockingFinding(finding('ai_check'))).toBe(false);
  });

  it('hasBlockingFindings is true iff any finding blocks', () => {
    expect(hasBlockingFindings([])).toBe(false);
    expect(hasBlockingFindings([finding('warning'), finding('ai_check')])).toBe(false);
    expect(hasBlockingFindings([finding('warning'), finding('error_publish')])).toBe(true);
    expect(hasBlockingFindings([finding('error_draft')])).toBe(true);
  });
});

describe('formatFindings', () => {
  it('prints the finding message verbatim and marks blocking vs advisory', () => {
    const out = formatFindings([
      finding('error_draft', { message: 'Plan has no Stripe price linked.' }),
      finding('warning', { code: 'VAL-PLN-05', message: 'Two rules overlap.' }),
    ]);
    expect(out).toContain('Plan has no Stripe price linked.');
    expect(out).toContain('Two rules overlap.');
    expect(out).toContain('✗ [error_draft]');
    expect(out).toContain('• [warning]');
  });

  it('reports a clean bill for no findings', () => {
    expect(formatFindings([])).toBe('No validation findings.');
  });
});

describe('fetchValidation against a stubbed /validate (AC-8)', () => {
  const headers = { 'Content-Type': 'application/json', 'x-tenant-id': 't1' };

  it('blocks (non-zero exit) when the response has an error_draft finding', async () => {
    const result = await fetchValidation(
      'http://stub',
      'cs_1',
      headers,
      stubFetch(200, { findings: [finding('error_draft', { message: 'broken' })] }),
    );
    expect(result.ok).toBe(true);
    expect(hasBlockingFindings(result.findings)).toBe(true); // → CLI process.exit(1)
    expect(formatFindings(result.findings)).toContain('broken');
  });

  it('blocks on an error_publish finding', async () => {
    const result = await fetchValidation(
      'http://stub',
      'cs_1',
      headers,
      stubFetch(200, { findings: [finding('error_publish')] }),
    );
    expect(hasBlockingFindings(result.findings)).toBe(true);
  });

  it('does NOT block (zero exit) when only warning/ai_check findings are present', async () => {
    const result = await fetchValidation(
      'http://stub',
      'cs_1',
      headers,
      stubFetch(200, { findings: [finding('warning'), finding('ai_check')] }),
    );
    expect(hasBlockingFindings(result.findings)).toBe(false); // → CLI exits 0
  });

  it('does NOT block when there are no findings', async () => {
    const result = await fetchValidation('http://stub', 'cs_1', headers, stubFetch(200, { findings: [] }));
    expect(result.findings).toEqual([]);
    expect(hasBlockingFindings(result.findings)).toBe(false);
  });

  it('surfaces a non-OK response without throwing', async () => {
    const result = await fetchValidation(
      'http://stub',
      'cs_1',
      headers,
      stubFetch(404, { error: 'ChangeSet not found' }),
    );
    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
    expect(result.error).toBe('ChangeSet not found');
  });

  it('POSTs { changeSetId } to /api/config/validate', async () => {
    const spy = stubFetch(200, { findings: [] });
    await fetchValidation('http://stub', 'cs_42', headers, spy);
    expect(spy).toHaveBeenCalledWith(
      'http://stub/api/config/validate',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ changeSetId: 'cs_42' }) }),
    );
  });
});
