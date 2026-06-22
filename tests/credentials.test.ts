import { mkdtempSync, rmSync, statSync, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  credentialsFilePath,
  getCredential,
  normalizeBaseUrl,
  redactToken,
  removeCredential,
  saveCredential,
  urlKey,
} from '../src/lib/credentials';

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(path.join(os.tmpdir(), 'revt-cred-'));
  process.env.REVTURBINE_CONFIG_DIR = tmpDir;
});

afterEach(() => {
  delete process.env.REVTURBINE_CONFIG_DIR;
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('credentials store', () => {
  it('round-trips a credential keyed by URL origin', () => {
    saveCredential('http://localhost:3000', {
      token: 'rtk_abcdef0123456789',
      tenant_id: 'tenant_1',
      created_at: '2026-06-03T00:00:00.000Z',
    });
    const cred = getCredential('http://localhost:3000/');
    expect(cred?.token).toBe('rtk_abcdef0123456789');
    expect(cred?.tenant_id).toBe('tenant_1');
  });

  it('normalizes URLs to their origin (trailing slash / path ignored)', () => {
    expect(urlKey('https://app.example.com/')).toBe('https://app.example.com');
    expect(urlKey('https://app.example.com/api/x')).toBe('https://app.example.com');
    saveCredential('https://app.example.com/api/config/import', {
      token: 'rtk_t',
      tenant_id: null,
      created_at: 'now',
    });
    expect(getCredential('https://app.example.com')?.token).toBe('rtk_t');
  });

  it('returns null for an unknown URL', () => {
    expect(getCredential('http://nope.example')).toBeNull();
  });

  it('removes a credential and reports whether one existed', () => {
    saveCredential('http://localhost:3000', { token: 'rtk_x', tenant_id: null, created_at: 'now' });
    expect(removeCredential('http://localhost:3000')).toBe(true);
    expect(getCredential('http://localhost:3000')).toBeNull();
    expect(removeCredential('http://localhost:3000')).toBe(false);
  });

  it('writes the credentials file with 0600 perms (POSIX)', () => {
    saveCredential('http://localhost:3000', { token: 'rtk_x', tenant_id: null, created_at: 'now' });
    expect(existsSync(credentialsFilePath())).toBe(true);
    if (process.platform !== 'win32') {
      const mode = statSync(credentialsFilePath()).mode & 0o777;
      expect(mode).toBe(0o600);
    }
  });

  it('redacts a token to a safe preview', () => {
    expect(redactToken('rtk_abcdef0123456789')).toBe('rtk_…6789');
    expect(redactToken('short')).toBe('rtk_…');
  });
});

describe('normalizeBaseUrl', () => {
  it('defaults a scheme-less host to https', () => {
    expect(normalizeBaseUrl('revturbine-web.vercel.app')).toBe('https://revturbine-web.vercel.app');
  });

  it('defaults localhost / loopback to http', () => {
    expect(normalizeBaseUrl('localhost:3000')).toBe('http://localhost:3000');
    expect(normalizeBaseUrl('127.0.0.1:3000')).toBe('http://127.0.0.1:3000');
  });

  it('preserves an explicit scheme and strips trailing slashes', () => {
    expect(normalizeBaseUrl('http://localhost:3000/')).toBe('http://localhost:3000');
    expect(normalizeBaseUrl('https://app.example.com//')).toBe('https://app.example.com');
  });

  it('keys credentials the same with or without a scheme', () => {
    expect(urlKey('revturbine-web.vercel.app')).toBe(urlKey('https://revturbine-web.vercel.app'));
  });
});
