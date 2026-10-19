import { describe, expect, it } from 'vitest';
import { linkInput, listItems, positivePage, provisioningPath } from '../src/lib/customer-provisioning';

describe('customer provisioning request construction', () => {
  it('preserves opaque application IDs and encodes query/path components', () => {
    expect(provisioningPath('customer-users', {}, 'user/a?b#c')).toBe('/api/customer-users/user%2Fa%3Fb%23c');
    expect(provisioningPath('customer-entity-links', { resource_key: 'a&b' })).toBe('/api/customer-entity-links?resource_key=a%26b');
    expect(() => provisioningPath('customer-users', {}, '..')).toThrow();
  });
  it('requires object input and protects command-owned scope', () => {
    const scope = { environment: 'env_a', providerInstance: 'ins_a' };
    expect(linkInput('customer-users', 'app-user', { external_entity_type: 'user', external_id: 'opaque' }, scope)).toMatchObject({ resource_type: 'customer_user', resource_key: 'app-user', environment_id: 'env_a' });
    expect(() => linkInput('plans', 'pro', { tenant_id: 'other' }, scope)).toThrow('tenant_id');
    expect(() => linkInput('plans', 'pro', [], scope)).toThrow();
  });
  it('bounds pages and rejects malformed response envelopes', () => {
    for (const value of ['0', '-1', '1.5', 'abc', '101']) expect(() => positivePage(value, 100)).toThrow();
    expect(positivePage('100', 100)).toBe(100);
    expect(() => listItems({ data: [] })).toThrow();
    expect(listItems({ items: [] })).toEqual([]);
  });
});
