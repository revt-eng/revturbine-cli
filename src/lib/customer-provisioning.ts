export const CUSTOMER_RESOURCES = ['customer-accounts', 'customer-users', 'plans', 'plan-variations'] as const;
export type CustomerResource = typeof CUSTOMER_RESOURCES[number];
export const CUSTOMER_RESOURCE_TYPES = {
  'customer-accounts': 'customer_account', 'customer-users': 'customer_user', plans: 'plan', 'plan-variations': 'plan_variation',
} as const;

export function objectInput(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected a JSON object.');
  return value as Record<string, unknown>;
}

export function linkInput(resource: CustomerResource, key: string, value: unknown, scope: { environment: string; providerInstance: string }, selector: Record<string, string> = {}): Record<string, unknown> {
  const body = objectInput(value);
  for (const field of ['tenant_id', 'resource_type', 'resource_key', 'provider', 'provider_instance_id', 'environment_id', 'state', 'release_id', 'verification_status']) {
    if (Object.hasOwn(body, field)) throw new Error(`Link JSON must not set ${field}; use the command scope and selector options.`);
  }
  return { ...body, provider: 'clerk', environment_id: scope.environment, provider_instance_id: scope.providerInstance, resource_type: CUSTOMER_RESOURCE_TYPES[resource], resource_key: key, ...selector };
}

export function positivePage(value: string, max = Number.MAX_SAFE_INTEGER): number {
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1 || Number(value) > max) throw new Error(`Expected an integer between 1 and ${max}.`);
  return Number(value);
}

export function provisioningPath(resource: string, query: Record<string, string | number | undefined> = {}, key?: string): string {
  if (key === '.' || key === '..' || key === '') throw new Error('The application ID must be a nonempty URL path segment other than . or ...');
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(query)) if (value !== undefined) params.set(name, String(value));
  return `/api/${resource}${key === undefined ? '' : `/${encodeURIComponent(key)}`}${params.size ? `?${params}` : ''}`;
}

export function listItems(value: unknown): unknown[] {
  const body = objectInput(value);
  if (!Array.isArray(body.items)) throw new Error('Server response must contain an items array.');
  return body.items;
}
