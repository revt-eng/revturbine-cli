import { describe, expect, it } from 'vitest';

import { serverSchemaIsNewer } from '../src/lib/version-trail';

describe('serverSchemaIsNewer (version-trail warning)', () => {
  it('flags a newer server schema stamp', () => {
    expect(serverSchemaIsNewer({ schema_version: '0.1.108' }, '0.1.107')).toBe('0.1.108');
    expect(serverSchemaIsNewer({ schema_version: '0.2.0' }, '0.1.107')).toBe('0.2.0');
  });

  it('stays quiet for equal or older stamps (frozen release snapshots)', () => {
    expect(serverSchemaIsNewer({ schema_version: '0.1.107' }, '0.1.107')).toBeNull();
    expect(serverSchemaIsNewer({ schema_version: '0.1.84' }, '0.1.107')).toBeNull();
  });

  it('stays quiet when the stamp is absent or malformed', () => {
    expect(serverSchemaIsNewer({}, '0.1.107')).toBeNull();
    expect(serverSchemaIsNewer({ schema_version: 42 }, '0.1.107')).toBeNull();
    expect(serverSchemaIsNewer(null, '0.1.107')).toBeNull();
  });
});
