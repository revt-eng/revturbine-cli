// GENERATED — do not edit by hand.
// Vendored ExportedConfigSchema snapshot bundled from @revt-eng/schema@0.1.367
// (revturbine-scaffold/src/core/zod/index.ts). Regenerate with:
//   node scripts/generate-schema-snapshot.mjs


// scaffold/src/core/common.ts
import { z as z2 } from "zod";

// scaffold/src/core/classification.ts
import { z } from "zod";

// scaffold/src/core/handle-pattern.ts
var HANDLE_PATTERN = /^[a-z0-9._]{1,100}$/;

// scaffold/src/core/classification.ts
var SchemaPersistence = {
  Persisted: "persisted",
  Transient: "transient"
};
var SchemaExposure = {
  Internal: "internal",
  External: "external"
};
var DataClassification = {
  Pii: { "x-revturbine-data-classification": "pii" },
  Financial: { "x-revturbine-data-classification": "financial" },
  Unrestricted: { "x-revturbine-data-classification": "unrestricted" },
  /**
   * Machine-generated evaluation exhaust — supersession records, entitlement
   * grants, placement decision traces. Carries no personal or financial data
   * itself, but describes what the engine decided about a user, so it is not
   * `Unrestricted` either. Applied at the MODEL level (plan 182 REQ-7); it was
   * already in use as a raw string literal on four schemas before being
   * declared here, which left `DataClassificationValue` unable to represent it.
   */
  Operational: { "x-revturbine-data-classification": "operational" }
};
var ContextVisibility = {
  /** Returnable to the browser. */
  ClientSafe: "client_safe",
  /** Never returned to the browser. */
  ServerOnly: "server_only",
  /** Influences Playbook evaluation server-side but is never returned to the browser. */
  DecisionOnly: "decision_only"
};
var DATA_CLASSIFICATION_META_KEY = "x-revturbine-data-classification";
var SCHEMA_PERSISTENCE_META_KEY = "x-revturbine-schema-persistence";
var SCHEMA_EXPOSURE_META_KEY = "x-revturbine-schema-exposure";
var READ_ONLY_META_KEY = "readOnly";
var DECISION_ONLY_META_KEY = "x-revturbine-decision-only";
var DecisionOnly = { [DECISION_ONLY_META_KEY]: true };
var ClientSafe = { [SCHEMA_EXPOSURE_META_KEY]: SchemaExposure.External };
var ServerOnly = { [SCHEMA_EXPOSURE_META_KEY]: SchemaExposure.Internal };
function getSchemaClassification(schema) {
  const meta8 = schema.meta();
  const persistence = meta8?.[SCHEMA_PERSISTENCE_META_KEY];
  const exposure = meta8?.[SCHEMA_EXPOSURE_META_KEY];
  if ((persistence === SchemaPersistence.Persisted || persistence === SchemaPersistence.Transient) && (exposure === SchemaExposure.Internal || exposure === SchemaExposure.External)) {
    return {
      persistence,
      exposure
    };
  }
  return void 0;
}
function getFieldClassification(schema) {
  const meta8 = schema.meta();
  const classification = meta8?.[DATA_CLASSIFICATION_META_KEY];
  return typeof classification === "string" ? classification : void 0;
}
function getObjectFieldClassifications(schema) {
  const result = {};
  for (const [fieldName, fieldSchema] of Object.entries(schema.shape)) {
    result[fieldName] = typeof fieldSchema === "object" && fieldSchema !== null ? getFieldClassification(fieldSchema) : void 0;
  }
  return result;
}
function getSchemaExposure(schema) {
  const meta8 = schema.meta();
  const exposure = meta8?.[SCHEMA_EXPOSURE_META_KEY];
  if (exposure === SchemaExposure.Internal || exposure === SchemaExposure.External) {
    return exposure;
  }
  return void 0;
}
function getSchemaPersistence(schema) {
  const meta8 = schema.meta();
  const persistence = meta8?.[SCHEMA_PERSISTENCE_META_KEY];
  if (persistence === SchemaPersistence.Persisted || persistence === SchemaPersistence.Transient) {
    return persistence;
  }
  return void 0;
}
function filterExternalSchemas(allSchemas) {
  const result = {};
  for (const [name, schema] of Object.entries(allSchemas)) {
    if (getSchemaExposure(schema) === SchemaExposure.External) {
      result[name] = schema;
    }
  }
  return result;
}
function filterPersistedSchemas(allSchemas) {
  const result = {};
  for (const [name, schema] of Object.entries(allSchemas)) {
    if (getSchemaPersistence(schema) === SchemaPersistence.Persisted) {
      result[name] = schema;
    }
  }
  return result;
}
function toWritableSchema(schema) {
  const writableShape = {};
  for (const [fieldName, fieldSchema] of Object.entries(schema.shape)) {
    if (typeof fieldSchema !== "object" || fieldSchema === null) {
      continue;
    }
    const isReadOnly = fieldSchema.meta()?.[READ_ONLY_META_KEY] === true;
    if (!isReadOnly) {
      writableShape[fieldName] = fieldSchema;
    }
  }
  return z.object(writableShape);
}
function toCreateSchema(schema) {
  const writable = toWritableSchema(schema);
  const handleField = writable.shape["handle"];
  if (handleField && typeof handleField.regex === "function") {
    return writable.extend({ handle: handleField.regex(HANDLE_PATTERN) });
  }
  return writable;
}
function unwrapSchema(schema) {
  let cursor = schema;
  for (let i = 0; i < 5; i++) {
    const ctor = cursor?.constructor?.name;
    if (ctor === "ZodOptional" || ctor === "ZodNullable" || ctor === "ZodDefault") {
      const inner = cursor._def?.innerType;
      if (!inner) break;
      cursor = inner;
      continue;
    }
    break;
  }
  return cursor;
}
function getFieldVisibility(schema) {
  const meta8 = schema.meta() ?? {};
  if (meta8[DECISION_ONLY_META_KEY] === true) {
    return ContextVisibility.DecisionOnly;
  }
  const dataClass = meta8[DATA_CLASSIFICATION_META_KEY];
  if (dataClass === "pii" || dataClass === "financial") {
    return ContextVisibility.ServerOnly;
  }
  if (meta8[SCHEMA_EXPOSURE_META_KEY] === SchemaExposure.External) {
    return ContextVisibility.ClientSafe;
  }
  return ContextVisibility.ServerOnly;
}
function isPlainRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function projectClientSafe(schema, value) {
  const inner = unwrapSchema(schema);
  if (inner instanceof z.ZodObject && isPlainRecord(value)) {
    const shape = inner.shape;
    const out = {};
    for (const [key, fieldSchema] of Object.entries(shape)) {
      if (getFieldVisibility(fieldSchema) !== ContextVisibility.ClientSafe) {
        continue;
      }
      if (!(key in value)) {
        continue;
      }
      const projected = projectClientSafe(fieldSchema, value[key]);
      if (projected !== void 0) {
        out[key] = projected;
      }
    }
    return out;
  }
  return value;
}
function getObjectFieldVisibilities(schema) {
  const result = {};
  for (const [fieldName, fieldSchema] of Object.entries(schema.shape)) {
    result[fieldName] = getFieldVisibility(fieldSchema);
  }
  return result;
}

// scaffold/src/core/common.ts
var { Unrestricted } = DataClassification;
var { Transient, Persisted } = SchemaPersistence;
var { Internal, External } = SchemaExposure;
var PaginationParamsSchema = z2.object({
  page: z2.coerce.number().int().min(1).default(1).meta(Unrestricted),
  per_page: z2.coerce.number().int().min(1).max(100).default(25).meta(Unrestricted)
}).meta(
  {
    id: "PaginationParams",
    "x-revturbine-schema-persistence": Transient,
    "x-revturbine-schema-exposure": External
  }
);
var PaginatedResponseSchema = (itemSchema) => z2.object({
  items: z2.array(itemSchema).meta(Unrestricted),
  total: z2.number().int().min(0).meta(Unrestricted),
  page: z2.number().int().min(1).meta(Unrestricted),
  per_page: z2.number().int().min(1).meta(Unrestricted),
  has_more: z2.boolean().meta(Unrestricted)
}).meta(
  {
    id: "PaginatedResponse",
    "x-revturbine-schema-persistence": Transient,
    "x-revturbine-schema-exposure": External
  }
);
var TimestampFields = z2.object({
  created_at: z2.string().datetime().meta({ ...Unrestricted, readOnly: true }),
  updated_at: z2.string().datetime().meta({ ...Unrestricted, readOnly: true })
}).meta(
  {
    id: "null",
    "x-revturbine-schema-persistence": Transient,
    "x-revturbine-schema-exposure": External
  }
);
var IdField = z2.object({
  id: z2.string().min(1).meta({ ...Unrestricted, readOnly: true })
}).meta(
  {
    id: "null",
    "x-revturbine-schema-persistence": Transient,
    "x-revturbine-schema-exposure": External
  }
);
var TenantIdField = z2.object({
  tenant_id: z2.string().min(1, "tenant_id is required").meta({ ...Unrestricted, readOnly: true })
}).meta(
  {
    id: "null",
    "x-revturbine-schema-persistence": Transient,
    "x-revturbine-schema-exposure": Internal
  }
);
var BillingCadenceSchema = z2.enum([
  "monthly",
  "annual",
  "quarterly",
  "one_time",
  "usage_based"
]).meta(
  {
    id: "BillingCadence",
    "x-revturbine-schema-persistence": Transient,
    "x-revturbine-schema-exposure": External
  }
);
var COMPONENT_TYPE_VALUES = [
  "banner",
  "modal",
  "tooltip",
  "sidebar",
  "inline",
  "toast",
  "fullscreen",
  "email",
  "sms",
  "push",
  "in_page",
  "button",
  "full_page",
  "agent",
  "cli",
  "custom"
];
var ComponentTypeSchema = z2.enum(COMPONENT_TYPE_VALUES).meta({ id: "ComponentType", "x-revturbine-schema-persistence": Transient, "x-revturbine-schema-exposure": External });
var SurfaceTypeSchema = ComponentTypeSchema;
var DEFAULT_TEMPLATE_IDS = [
  "button",
  "plans_page_ctas",
  "plans_page_full",
  "inline_gate_message",
  "tooltip",
  "in_page_card",
  "usage_counter",
  "credit_counter",
  "trial_counter",
  "banner",
  "modal_optional",
  "modal_blocking",
  "toast",
  "email",
  "sms",
  "push",
  "cli",
  "agent_connector",
  "custom_in_app"
];
var DefaultTemplateIdsSchema = z2.enum(DEFAULT_TEMPLATE_IDS).meta({ id: "DefaultTemplateIds", "x-revturbine-schema-persistence": Transient, "x-revturbine-schema-exposure": Internal });
var StudioSurfaceTypeSchema = DefaultTemplateIdsSchema;
var DEFAULT_TEMPLATE_COMPONENT_TYPES = {
  button: "button",
  plans_page_ctas: "in_page",
  plans_page_full: "full_page",
  inline_gate_message: "inline",
  tooltip: "tooltip",
  in_page_card: "in_page",
  usage_counter: "in_page",
  credit_counter: "in_page",
  trial_counter: "in_page",
  banner: "banner",
  modal_optional: "modal",
  modal_blocking: "modal",
  toast: "toast",
  email: "email",
  sms: "sms",
  push: "push",
  cli: "cli",
  agent_connector: "agent",
  custom_in_app: "custom"
};
var BUILT_IN_TEMPLATE_COMPONENT_TYPES = Object.freeze({
  ...DEFAULT_TEMPLATE_COMPONENT_TYPES,
  modal_overlay: "modal",
  banner_placement: "banner",
  full_page: "full_page"
});
function resolveComponentType(value) {
  const componentType = ComponentTypeSchema.safeParse(value);
  if (componentType.success) return componentType.data;
  return DEFAULT_TEMPLATE_COMPONENT_TYPES[value];
}
var ENTITLEMENT_STATUS_VALUES = ["allowed", "limited", "denied"];
var DEFAULT_ACTIVITY_THRESHOLDS = {
  window_days: 30,
  high_min: 10,
  medium_min: 3,
  low_min: 1
};
var PresentationOutcomeSchema = z2.enum(["presented", "clicked", "converted", "dismissed", "reminded", "suppressed"]).meta(
  { id: "PresentationOutcome", "x-revturbine-schema-persistence": Transient, "x-revturbine-schema-exposure": External }
);
var EntitlementTypeSchema = z2.enum([
  "feature",
  "capability_tier",
  "usage_limit",
  "price_per_unit",
  "rate_limit",
  "credits",
  "seat"
]).meta(
  {
    id: "EntitlementType",
    "x-revturbine-schema-persistence": Transient,
    "x-revturbine-schema-exposure": External
  }
);
var CurrencySchema = z2.string().regex(/^[a-z]{3}$/, "Currency must be a lowercase ISO 4217 code").default("usd").meta(
  {
    id: "Currency",
    "x-revturbine-schema-persistence": Transient,
    "x-revturbine-schema-exposure": External
  }
);
var FeatureFlagValueSchema = z2.union([
  z2.boolean(),
  z2.number(),
  z2.string()
]).meta(
  {
    id: "FeatureFlagValue",
    "x-revturbine-schema-persistence": Transient,
    "x-revturbine-schema-exposure": Internal
  }
);
var NameField = z2.string().min(1).max(200);
var HandleField = z2.string().min(1).max(100);
var DescriptionField = z2.string().max(500).optional();
var MetadataField = z2.record(z2.string(), z2.unknown()).default({});
var ThresholdPercentField = z2.number().int().min(10).max(100).multipleOf(10);
var NullableDatetimeField = z2.string().datetime().nullable().default(null);
var AnchorFields = z2.object({
  environment_id: z2.string().min(1).default("production").meta({ ...Unrestricted, readOnly: true })
}).meta({ id: "null", "x-revturbine-schema-persistence": Transient, "x-revturbine-schema-exposure": Internal });
var VersionFields = z2.object({
  // Which playbook version (the review/deploy unit — was `change_set_id`) staged
  // this ledger row; null once it is the deployed live row.
  playbook_version_id: z2.string().nullable().default(null).meta(Unrestricted),
  is_current: z2.boolean().default(true).meta({ ...Unrestricted, readOnly: true }),
  is_deleted: z2.boolean().default(false).meta({ ...Unrestricted, readOnly: true }),
  delete_date: z2.string().datetime().nullable().default(null).meta({ ...Unrestricted, readOnly: true }),
  // Monotonic version number within a lineage (v1, v2, v3 …); `base_sequence` is
  // the live sequence this version was forked from (null for the first version),
  // so a stale draft is detected when live has moved past it.
  sequence: z2.number().int().min(1).default(1).meta({ ...Unrestricted, readOnly: true }),
  base_sequence: z2.number().int().nullable().default(null).meta({ ...Unrestricted, readOnly: true })
}).meta({ id: "null", "x-revturbine-schema-persistence": Transient, "x-revturbine-schema-exposure": Internal });
var AnchorBaseSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).extend({
  handle: HandleField.meta({ ...Unrestricted, readOnly: true }),
  active: z2.boolean().default(true).meta({ ...Unrestricted, readOnly: true })
});
function makeAnchor(id) {
  return AnchorBaseSchema.meta({
    id,
    "x-revturbine-schema-persistence": Persisted,
    "x-revturbine-schema-exposure": Internal
  });
}
var SeveritySchema = z2.enum(["info", "warning", "critical"]).meta({ id: "Severity", "x-revturbine-schema-persistence": Transient, "x-revturbine-schema-exposure": Internal });
var CtaActionTypeSchema = z2.enum([
  "open_checkout",
  "view_plans",
  "book_demo",
  "contact_sales",
  "complete_onboarding",
  "invite_teammate",
  "refer_friend",
  "verify_work_email",
  "update_payment_method",
  "enable_auto_renewal",
  "manage_subscription",
  "switch_billing_period",
  "extend_trial",
  "open_rt_placement",
  "dismiss",
  "snooze",
  "custom"
]).meta({ id: "CtaActionType", "x-revturbine-schema-persistence": Transient, "x-revturbine-schema-exposure": External });
var ObjectiveField = HandleField.optional();

// scaffold/src/core/facets.ts
var SchemaContext = {
  Playbook: "playbook",
  Branding: "branding",
  Billing: "billing",
  Metering: "metering",
  CustomerOperations: "customer_operations",
  EventIngestion: "event_ingestion"
};
var SchemaSource = {
  Customer: "customer",
  Stripe: "stripe",
  CodeConstant: "code-constant",
  Runtime: "runtime"
};
var SCHEMA_CONTEXT_META_KEY = "x-revturbine-context";
var SCHEMA_IN_CONFIG_META_KEY = "x-revturbine-in-config";
var SCHEMA_SDK_INPUT_META_KEY = "x-revturbine-sdk-input";
var SCHEMA_SOURCE_META_KEY = "x-revturbine-source";
var SCHEMA_DEPRECATION_META_KEY = "x-revturbine-deprecation";
var DEFAULT_SOURCE_BY_CONTEXT = {
  [SchemaContext.Playbook]: SchemaSource.Customer,
  [SchemaContext.Branding]: SchemaSource.Customer,
  [SchemaContext.Billing]: SchemaSource.Stripe,
  [SchemaContext.Metering]: SchemaSource.Customer,
  [SchemaContext.CustomerOperations]: SchemaSource.Runtime,
  [SchemaContext.EventIngestion]: SchemaSource.Runtime
};
function schemaFacets(context, options) {
  return {
    [SCHEMA_CONTEXT_META_KEY]: context,
    [SCHEMA_IN_CONFIG_META_KEY]: options.inConfig ?? context === SchemaContext.Playbook,
    [SCHEMA_SDK_INPUT_META_KEY]: options.sdkInput,
    [SCHEMA_SOURCE_META_KEY]: options.source ?? DEFAULT_SOURCE_BY_CONTEXT[context]
  };
}
function schemaDeprecation(declaration) {
  return {
    deprecated: true,
    [SCHEMA_DEPRECATION_META_KEY]: {
      since: declaration.since,
      replacement: declaration.replacement,
      remove_after: declaration.removeAfter,
      reason: declaration.reason
    }
  };
}
function isSchemaContext(value) {
  return Object.values(SchemaContext).some((context) => context === value);
}
function isSchemaSource(value) {
  return Object.values(SchemaSource).some((source) => source === value);
}
function getSchemaFacets(schema) {
  const meta8 = schema.meta();
  const context = meta8?.[SCHEMA_CONTEXT_META_KEY];
  const inConfig = meta8?.[SCHEMA_IN_CONFIG_META_KEY];
  const sdkInput = meta8?.[SCHEMA_SDK_INPUT_META_KEY];
  const source = meta8?.[SCHEMA_SOURCE_META_KEY];
  if (!isSchemaContext(context) || typeof inConfig !== "boolean" || typeof sdkInput !== "boolean" || !isSchemaSource(source)) {
    return void 0;
  }
  return { context, inConfig, sdkInput, source };
}
function requireSchemaFacets(schema, label) {
  const facets = getSchemaFacets(schema);
  if (!facets) {
    throw new Error(`${label} is missing complete RevTurbine schema facets`);
  }
  return facets;
}
function getSchemaDeprecation(schema) {
  const meta8 = schema.meta();
  if (meta8?.deprecated !== true) return void 0;
  const value = meta8[SCHEMA_DEPRECATION_META_KEY];
  if (!value || typeof value !== "object") return void 0;
  const declaration = value;
  if (typeof declaration.since !== "string" || typeof declaration.replacement !== "string" || typeof declaration.remove_after !== "string" || typeof declaration.reason !== "string") {
    return void 0;
  }
  return {
    since: declaration.since,
    replacement: declaration.replacement,
    removeAfter: declaration.remove_after,
    reason: declaration.reason
  };
}
function isZodSchema(value) {
  return typeof value === "object" && value !== null && typeof value.meta === "function";
}
function collectPersistedSchemas(allExports) {
  const persisted2 = {};
  for (const [name, value] of Object.entries(allExports)) {
    if (isZodSchema(value) && value.meta()?.["x-revturbine-schema-persistence"] === "persisted") {
      persisted2[name] = value;
    }
  }
  return persisted2;
}
var PERSISTED_SCHEMA_FACET_EXEMPTIONS = {
  AlertSchema: "Operational analytics output is not authored portable configuration.",
  AuditActorTypeSchema: "Audit vocabulary is control-plane infrastructure, not authored strategy.",
  AuditEventSchema: "Audit history is control-plane infrastructure, not authored strategy.",
  AuthAccountSchema: "Authentication account state is infrastructure, not authored strategy.",
  AuthApiKeySchema: "Authentication credential state is infrastructure, not authored strategy.",
  AuthInvitationSchema: "Authentication invitation state is infrastructure, not authored strategy.",
  AuthMemberSchema: "Authentication membership state is infrastructure, not authored strategy.",
  AuthOrganizationSchema: "Authentication organization state is infrastructure, not authored strategy.",
  AuthPasskeySchema: "Authentication passkey state is infrastructure, not authored strategy.",
  AuthSessionSchema: "Authentication session state is infrastructure, not authored strategy.",
  AuthSsoProviderSchema: "Authentication provider state is infrastructure, not authored strategy.",
  AuthTwoFactorSchema: "Authentication factor state is infrastructure, not authored strategy.",
  AuthUserSchema: "Authentication user state is infrastructure, not authored strategy.",
  AuthVerificationSchema: "Authentication verification state is infrastructure, not authored strategy.",
  ChangeLogActionSchema: "Change-log vocabulary is lifecycle infrastructure, not authored strategy.",
  ChangeLogEntrySchema: "Change-log history is lifecycle infrastructure, not authored strategy.",
  CustomerSchema: "Runtime customer state is not authored portable configuration.",
  DriftReportSchema: "Operational drift output is not authored portable configuration.",
  EnvironmentSchema: "Target environment infrastructure is not authored portable configuration.",
  FeatureFlagSchema: "Studio feature-flag infrastructure is not authored Playbook strategy.",
  FlagValueTypeSchema: "Studio feature-flag vocabulary is not authored Playbook strategy.",
  IdentitySchema: "Runtime customer identity data is not authored portable configuration.",
  IngestedEventSchema: "Event-ingestion records are runtime data, not authored strategy.",
  InvitationStatusSchema: "Authentication invitation vocabulary is infrastructure, not authored strategy.",
  McpConfigSchema: "Tenant MCP integration state is infrastructure, not authored strategy.",
  McpTokenScopeSchema: "Authentication token vocabulary is infrastructure, not authored strategy.",
  OnboardingChecklistSchema: "Tenant onboarding progress is operational state, not authored strategy.",
  OptimizationSuggestionSchema: "Generated optimization advice is operational output, not authored strategy.",
  OrgMemberRoleSchema: "Organization authorization vocabulary is infrastructure, not authored strategy.",
  PlacementTestUserSchema: "Runtime test-audience state is not authored Playbook strategy and is not portable config.",
  PlacementTestUserIdentifierTypeSchema: "Runtime test-audience vocabulary is not authored Playbook strategy or portable config.",
  PlaybookVersionSchema: "Review and deployment lifecycle state is infrastructure, not authored strategy.",
  RoleSchema: "Authorization role definitions are infrastructure, not authored Playbook strategy.",
  SupersessionRecordSchema: "Version supersession history is lifecycle infrastructure, not authored strategy.",
  TenantConfigSchema: "Tenant platform settings are infrastructure, not authored Playbook strategy.",
  TenantSchema: "Tenant ownership infrastructure is not authored portable configuration.",
  TrialInstanceSchema: "Per-customer trial runtime state is not authored portable configuration.",
  UiPreferenceSchema: "Per-user Studio preferences are not authored portable configuration.",
  UserContextSchema: "Runtime user evaluation context is not authored portable configuration.",
  UserInstanceContextSchema: "Runtime user-instance state is not authored portable configuration.",
  UserRoleSchema: "Application authorization vocabulary is infrastructure, not authored strategy.",
  WebhookEventLogSchema: "Webhook delivery history is runtime data, not authored strategy."
};

// scaffold/src/core/identity.ts
import { z as z3 } from "zod";
var IdentityKind = {
  /** Author-given, human-meaningful handle (plans, entitlements, segments, …). */
  Named: "named",
  /** Opaque machine-minted slug (variations, entitlement_rules, payloads, …). */
  Minted: "minted"
};
var SCHEMA_IDENTITY_META_KEY = "x-revturbine-schema-identity";
function namedIdentity(handleField = "handle") {
  return { [SCHEMA_IDENTITY_META_KEY]: { kind: IdentityKind.Named, handleField } };
}
function mintedIdentity(handleField = "handle") {
  return { [SCHEMA_IDENTITY_META_KEY]: { kind: IdentityKind.Minted, handleField } };
}
function isIdentityKind(v) {
  return v === IdentityKind.Named || v === IdentityKind.Minted;
}
function getSchemaIdentity(schema) {
  const decl = schema.meta()?.[SCHEMA_IDENTITY_META_KEY];
  if (!decl || typeof decl !== "object") return void 0;
  const d = decl;
  if (!isIdentityKind(d.kind)) return void 0;
  const handleField = typeof d.handleField === "string" ? d.handleField : "handle";
  return { kind: d.kind, handleField };
}
function isZodObject(v) {
  return v instanceof z3.ZodObject;
}
function isVersionedConfigEntity(schema) {
  if (!isZodObject(schema)) return false;
  const shape = schema.shape;
  return "playbook_version_id" in shape && "is_current" in shape;
}
function collectVersionedConfigEntities(allExports) {
  const out = {};
  for (const [name, value] of Object.entries(allExports)) {
    if (isZodObject(value) && isVersionedConfigEntity(value) && "tenant_id" in value.shape) {
      out[name] = value;
    }
  }
  return out;
}

// scaffold/src/plans/models/schema.ts
import { z as z5 } from "zod";

// scaffold/src/core/openapi/helpers.ts
import { z as z4 } from "zod";
var ListEnvelope = (itemSchema) => z4.object({
  items: z4.array(itemSchema)
});
var ErrorEnvelope = z4.object({
  error: z4.string(),
  code: z4.string(),
  request_id: z4.string()
});
var operation = (op) => op;
var ListQueryParamsSchema = z4.object({
  page: z4.number().int().min(1).default(1).optional(),
  per_page: z4.number().int().min(1).max(100).default(25).optional(),
  sort: z4.string().optional(),
  order: z4.enum(["asc", "desc"]).default("asc").optional(),
  include_deleted: z4.boolean().default(false).optional()
});

// scaffold/src/plans/models/schema.ts
var { Unrestricted: Unrestricted2, Financial } = DataClassification;
var { Persisted: Persisted2, Transient: Transient2 } = SchemaPersistence;
var { External: External2 } = SchemaExposure;
var PLAYBOOK_SDK_FACETS = schemaFacets(SchemaContext.Playbook, { sdkInput: true });
var PLAYBOOK_AUTHORING_FACETS = schemaFacets(SchemaContext.Playbook, { sdkInput: false });
var BILLING_FACETS = schemaFacets(SchemaContext.Billing, { sdkInput: false });
var PlanVisibilitySchema = z5.enum(["public", "unlisted", "legacy"]).meta(
  {
    id: "PlanVisibility",
    "x-revturbine-schema-persistence": Transient2,
    "x-revturbine-schema-exposure": External2
  }
);
var PricingModelSchema = z5.enum(["flat", "per_unit", "tiered", "metered"]).meta(
  {
    id: "PricingModel",
    "x-revturbine-schema-persistence": Transient2,
    "x-revturbine-schema-exposure": External2
  }
);
var PriceSourceSchema = z5.enum(["stripe", "static"]).meta(
  {
    id: "PriceSource",
    "x-revturbine-schema-persistence": Transient2,
    "x-revturbine-schema-exposure": External2
  }
);
var PlanSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z5.string().min(1).meta({ ...Unrestricted2, readOnly: true }),
  name: NameField.meta(Unrestricted2),
  handle: HandleField.meta(Unrestricted2),
  tier_position: z5.number().int().min(0).default(0).meta(Unrestricted2),
  sort_order: z5.number().int().default(0).meta(Unrestricted2),
  // Plan-level visibility default (plan 91 Part B). Distinct from the
  // per-variation `PlanVariationSchema.visibility`: a free/custom tier with no
  // priced variation can still be unlisted/legacy. Persisted so it round-trips
  // (plan 146 found it was declared on the portable config but had no column).
  visibility: PlanVisibilitySchema.default("public").meta(Unrestricted2),
  metadata: MetadataField.meta(Unrestricted2)
}).meta(
  {
    id: "Plan",
    "x-revturbine-schema-persistence": Persisted2,
    "x-revturbine-schema-exposure": External2,
    ...PLAYBOOK_SDK_FACETS,
    ...namedIdentity()
  }
);
var PlanAnchorSchema = makeAnchor("PlanAnchor");
var PlanVariationSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z5.string().min(1).meta({ ...Unrestricted2, readOnly: true }),
  handle: HandleField.meta({ ...Unrestricted2, readOnly: true }),
  plan_id: z5.string().min(1).meta(Unrestricted2),
  billing_period: z5.enum(["monthly", "annual", "one_time", "custom"]).meta(Unrestricted2),
  segment_id: z5.string().nullable().default(null).meta(Unrestricted2),
  price_amount: z5.number().min(0).meta(Financial),
  currency: CurrencySchema.meta(Financial),
  pricing_model: PricingModelSchema.meta(Unrestricted2),
  visibility: PlanVisibilitySchema.default("public").meta(Unrestricted2),
  // Soft reference → StripePrice.stripe_price_id (the backend Stripe-price mirror).
  // No DB foreign key: stripe_price_id lives on the append-only version tables and
  // a hard FK would block plan-122 price-deletion sync (plan 118 FK decision, devkit #472).
  stripe_price_id: z5.string().optional().meta(Unrestricted2),
  price_source: PriceSourceSchema.default("static").meta(Unrestricted2)
}).meta(
  {
    id: "PlanVariation",
    "x-revturbine-schema-persistence": Persisted2,
    "x-revturbine-schema-exposure": External2,
    ...BILLING_FACETS,
    ...mintedIdentity()
  }
);
var PlanVariationAnchorSchema = makeAnchor("PlanVariationAnchor");
var AddOnSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z5.string().min(1).meta({ ...Unrestricted2, readOnly: true }),
  name: NameField.meta(Unrestricted2),
  handle: HandleField.meta(Unrestricted2),
  sort_order: z5.number().int().default(0).meta(Unrestricted2),
  // Add-on visibility default — same rationale as PlanSchema (plan 91 Part B);
  // metadata, not price, so it lives on the add-on independent of variations.
  visibility: PlanVisibilitySchema.default("public").meta(Unrestricted2),
  metadata: MetadataField.meta(Unrestricted2)
}).meta(
  {
    id: "AddOn",
    "x-revturbine-schema-persistence": Persisted2,
    "x-revturbine-schema-exposure": External2,
    ...PLAYBOOK_AUTHORING_FACETS,
    ...namedIdentity()
  }
);
var AddOnAnchorSchema = makeAnchor("AddOnAnchor");
var AddOnVariationSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z5.string().min(1).meta({ ...Unrestricted2, readOnly: true }),
  handle: HandleField.meta({ ...Unrestricted2, readOnly: true }),
  addon_id: z5.string().min(1).meta(Unrestricted2),
  // 'one_time' is first-class — Stripe one-time Prices (credit packs,
  // expansion packages) bind here without coercion to 'custom'.
  billing_period: z5.enum(["monthly", "annual", "one_time", "custom"]).meta(Unrestricted2),
  segment_id: z5.string().nullable().default(null).meta(Unrestricted2),
  price_amount: z5.number().min(0).meta(Financial),
  currency: CurrencySchema.meta(Financial),
  pricing_model: PricingModelSchema.meta(Unrestricted2),
  visibility: PlanVisibilitySchema.default("public").meta(Unrestricted2),
  // Soft reference → StripePrice.stripe_price_id (the backend Stripe-price mirror).
  // No DB foreign key: stripe_price_id lives on the append-only version tables and
  // a hard FK would block plan-122 price-deletion sync (plan 118 FK decision, devkit #472).
  stripe_price_id: z5.string().optional().meta(Unrestricted2),
  price_source: PriceSourceSchema.default("static").meta(Unrestricted2)
}).meta(
  {
    id: "AddOnVariation",
    "x-revturbine-schema-persistence": Persisted2,
    "x-revturbine-schema-exposure": External2,
    ...BILLING_FACETS,
    ...mintedIdentity()
  }
);
var AddOnVariationAnchorSchema = makeAnchor("AddOnVariationAnchor");
var StripePriceBillingPeriodSchema = z5.enum(["monthly", "annual", "one_time", "custom"]).meta({
  id: "StripePriceBillingPeriod",
  "x-revturbine-schema-persistence": Transient2,
  "x-revturbine-schema-exposure": External2
});
var StripePriceSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  stripe_price_id: z5.string().min(1).meta(Unrestricted2),
  stripe_product_id: z5.string().min(1).meta(Unrestricted2),
  billing_period: StripePriceBillingPeriodSchema.meta(Unrestricted2),
  unit_amount_cents: z5.number().int().min(0).nullable().default(null).meta(Financial),
  currency: CurrencySchema.meta(Financial),
  pricing_model: PricingModelSchema.meta(Unrestricted2),
  nickname: z5.string().nullable().default(null).meta(Unrestricted2),
  // Placeholder/seed price (demo or pre-integration tenants) vs a real
  // Stripe-synced mirror row. Migration backfills existing seed rows to true.
  is_mock: z5.boolean().default(false).meta(Unrestricted2),
  // Timestamp of the last successful sync from Stripe; null for rows that were
  // never sourced from a real Stripe Price (seeds/mocks).
  last_updated_from_stripe: NullableDatetimeField.meta(Unrestricted2)
}).meta({
  id: "StripePrice",
  "x-revturbine-schema-persistence": Persisted2,
  "x-revturbine-schema-exposure": External2,
  ...BILLING_FACETS
});
var StripePriceMockSchema = StripePriceSchema;
var StripePriceMockBillingPeriodSchema = StripePriceBillingPeriodSchema;
var PlanWriteSchema = toWritableSchema(PlanSchema);
var PlanVariationWriteSchema = toWritableSchema(PlanVariationSchema);
var AddOnWriteSchema = toWritableSchema(AddOnSchema);
var AddOnVariationWriteSchema = toWritableSchema(AddOnVariationSchema);
var StripePriceWriteSchema = toWritableSchema(StripePriceSchema);
var planPaths = {
  "/api/plan-anchors": {
    get: operation({
      operationId: "listPlanAnchors",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List plan anchors (identity registry)",
      tags: ["plans"],
      responses: {
        "200": { description: "Plan anchor list", content: { "application/json": { schema: ListEnvelope(PlanAnchorSchema) } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "plan-anchors", persistence: { table: "plans", mode: "list" } }
    })
  },
  "/api/plans": {
    get: operation({
      operationId: "listPlans",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List plans",
      tags: ["plans"],
      responses: {
        "200": { description: "Plan list response", content: { "application/json": { schema: ListEnvelope(PlanSchema) } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "external", resource: "plans", persistence: { table: "planVersions", mode: "list" } }
    }),
    post: operation({
      operationId: "createPlan",
      summary: "Create plan",
      tags: ["plans"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(PlanSchema) } } },
      responses: {
        "201": { description: "Created plan", content: { "application/json": { schema: PlanSchema } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "external", resource: "plans", persistence: { table: "planVersions", mode: "create" } }
    })
  },
  "/api/plans/{planId}": {
    get: operation({
      operationId: "getPlan",
      requestParams: { path: z5.object({ planId: z5.string() }) },
      summary: "Get plan by ID",
      tags: ["plans"],
      responses: {
        "200": { description: "Plan detail", content: { "application/json": { schema: PlanSchema } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "external", resource: "plans", persistence: { table: "planVersions", mode: "get" } }
    }),
    patch: operation({
      operationId: "updatePlan",
      requestParams: { path: z5.object({ planId: z5.string() }) },
      summary: "Update plan",
      tags: ["plans"],
      requestBody: { required: true, content: { "application/json": { schema: PlanWriteSchema } } },
      responses: {
        "200": { description: "Updated plan", content: { "application/json": { schema: PlanSchema } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "external", resource: "plans", persistence: { table: "planVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deletePlan",
      requestParams: { path: z5.object({ planId: z5.string() }) },
      summary: "Delete plan",
      tags: ["plans"],
      responses: {
        "204": { description: "Plan deleted" },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "external", resource: "plans", persistence: { table: "planVersions", mode: "delete" } }
    })
  },
  "/api/plans/reorder": {
    post: operation({
      operationId: "reorderPlans",
      summary: "Reorder plans",
      tags: ["plans"],
      requestBody: { required: true, content: { "application/json": { schema: z5.object({ ids: z5.array(z5.string()) }) } } },
      responses: { "200": { description: "Reordered" } },
      "x-revturbine-operation": { exposure: "external", resource: "plans", persistence: { table: "planVersions", mode: "reorder" } }
    })
  },
  "/api/plan-variation-anchors": {
    get: operation({
      operationId: "listPlanVariationAnchors",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List plan variation anchors (identity registry)",
      tags: ["plans"],
      responses: {
        "200": { description: "Plan variation anchor list", content: { "application/json": { schema: ListEnvelope(PlanVariationAnchorSchema) } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "plan-variation-anchors", persistence: { table: "planVariations", mode: "list" } }
    })
  },
  "/api/plans/{planId}/variations": {
    get: operation({
      operationId: "listPlanVariations",
      requestParams: { path: z5.object({ planId: z5.string() }), query: ListQueryParamsSchema },
      summary: "List plan variations",
      tags: ["plans"],
      responses: { "200": { description: "Plan variations", content: { "application/json": { schema: ListEnvelope(PlanVariationSchema) } } } },
      "x-revturbine-operation": { exposure: "external", resource: "plan-variations", persistence: { table: "planVariationVersions", mode: "list" } }
    }),
    post: operation({
      operationId: "createPlanVariation",
      requestParams: { path: z5.object({ planId: z5.string() }) },
      summary: "Create plan variation",
      tags: ["plans"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(PlanVariationSchema) } } },
      responses: { "201": { description: "Created plan variation", content: { "application/json": { schema: PlanVariationSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "plan-variations", persistence: { table: "planVariationVersions", mode: "create" } }
    })
  },
  "/api/plan-variations/{variationId}": {
    get: operation({
      operationId: "getPlanVariation",
      requestParams: { path: z5.object({ variationId: z5.string() }) },
      summary: "Get plan variation by ID",
      tags: ["plans"],
      responses: { "200": { description: "Plan variation detail", content: { "application/json": { schema: PlanVariationSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "plan-variations", persistence: { table: "planVariationVersions", mode: "get" } }
    }),
    patch: operation({
      operationId: "updatePlanVariation",
      requestParams: { path: z5.object({ variationId: z5.string() }) },
      summary: "Update plan variation",
      tags: ["plans"],
      requestBody: { required: true, content: { "application/json": { schema: PlanVariationWriteSchema } } },
      responses: { "200": { description: "Updated plan variation", content: { "application/json": { schema: PlanVariationSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "plan-variations", persistence: { table: "planVariationVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deletePlanVariation",
      requestParams: { path: z5.object({ variationId: z5.string() }) },
      summary: "Delete plan variation",
      tags: ["plans"],
      responses: { "204": { description: "Plan variation deleted" } },
      "x-revturbine-operation": { exposure: "external", resource: "plan-variations", persistence: { table: "planVariationVersions", mode: "delete" } }
    })
  },
  "/api/addon-anchors": {
    get: operation({
      operationId: "listAddOnAnchors",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List add-on anchors (identity registry)",
      tags: ["plans"],
      responses: {
        "200": { description: "Add-on anchor list", content: { "application/json": { schema: ListEnvelope(AddOnAnchorSchema) } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "addon-anchors", persistence: { table: "addons", mode: "list" } }
    })
  },
  "/api/addons": {
    get: operation({
      operationId: "listAddOns",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List add-ons",
      tags: ["plans"],
      responses: { "200": { description: "Add-on list", content: { "application/json": { schema: ListEnvelope(AddOnSchema) } } } },
      "x-revturbine-operation": { exposure: "external", resource: "addons", persistence: { table: "addonVersions", mode: "list" } }
    }),
    post: operation({
      operationId: "createAddOn",
      summary: "Create add-on",
      tags: ["plans"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(AddOnSchema) } } },
      responses: { "201": { description: "Created add-on", content: { "application/json": { schema: AddOnSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "addons", persistence: { table: "addonVersions", mode: "create" } }
    })
  },
  "/api/addons/{addonId}": {
    get: operation({
      operationId: "getAddOn",
      requestParams: { path: z5.object({ addonId: z5.string() }) },
      summary: "Get add-on by ID",
      tags: ["plans"],
      responses: { "200": { description: "Add-on detail", content: { "application/json": { schema: AddOnSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "addons", persistence: { table: "addonVersions", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateAddOn",
      requestParams: { path: z5.object({ addonId: z5.string() }) },
      summary: "Update add-on",
      tags: ["plans"],
      requestBody: { required: true, content: { "application/json": { schema: AddOnWriteSchema } } },
      responses: { "200": { description: "Updated add-on", content: { "application/json": { schema: AddOnSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "addons", persistence: { table: "addonVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteAddOn",
      requestParams: { path: z5.object({ addonId: z5.string() }) },
      summary: "Delete add-on",
      tags: ["plans"],
      responses: { "204": { description: "Add-on deleted" } },
      "x-revturbine-operation": { exposure: "external", resource: "addons", persistence: { table: "addonVersions", mode: "delete" } }
    })
  },
  "/api/addon-variation-anchors": {
    get: operation({
      operationId: "listAddOnVariationAnchors",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List add-on variation anchors (identity registry)",
      tags: ["plans"],
      responses: {
        "200": { description: "Add-on variation anchor list", content: { "application/json": { schema: ListEnvelope(AddOnVariationAnchorSchema) } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "addon-variation-anchors", persistence: { table: "addonVariations", mode: "list" } }
    })
  },
  "/api/addons/{addonId}/variations": {
    get: operation({
      operationId: "listAddOnVariations",
      requestParams: { path: z5.object({ addonId: z5.string() }), query: ListQueryParamsSchema },
      summary: "List add-on variations",
      tags: ["plans"],
      responses: { "200": { description: "Add-on variations", content: { "application/json": { schema: ListEnvelope(AddOnVariationSchema) } } } },
      "x-revturbine-operation": { exposure: "external", resource: "addon-variations", persistence: { table: "addonVariationVersions", mode: "list" } }
    }),
    post: operation({
      operationId: "createAddOnVariation",
      requestParams: { path: z5.object({ addonId: z5.string() }) },
      summary: "Create add-on variation",
      tags: ["plans"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(AddOnVariationSchema) } } },
      responses: { "201": { description: "Created variation", content: { "application/json": { schema: AddOnVariationSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "addon-variations", persistence: { table: "addonVariationVersions", mode: "create" } }
    })
  },
  "/api/addon-variations/{variationId}": {
    get: operation({
      operationId: "getAddOnVariation",
      requestParams: { path: z5.object({ variationId: z5.string() }) },
      summary: "Get add-on variation by ID",
      tags: ["plans"],
      responses: { "200": { description: "Add-on variation detail", content: { "application/json": { schema: AddOnVariationSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "addon-variations", persistence: { table: "addonVariationVersions", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateAddOnVariation",
      requestParams: { path: z5.object({ variationId: z5.string() }) },
      summary: "Update add-on variation",
      tags: ["plans"],
      requestBody: { required: true, content: { "application/json": { schema: AddOnVariationWriteSchema } } },
      responses: { "200": { description: "Updated variation", content: { "application/json": { schema: AddOnVariationSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "addon-variations", persistence: { table: "addonVariationVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteAddOnVariation",
      requestParams: { path: z5.object({ variationId: z5.string() }) },
      summary: "Delete add-on variation",
      tags: ["plans"],
      responses: { "204": { description: "Variation deleted" } },
      "x-revturbine-operation": { exposure: "external", resource: "addon-variations", persistence: { table: "addonVariationVersions", mode: "delete" } }
    })
  },
  "/api/stripe-prices": {
    get: operation({
      operationId: "listStripePrices",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List Stripe prices",
      tags: ["plans"],
      responses: { "200": { description: "Stripe price list", content: { "application/json": { schema: ListEnvelope(StripePriceSchema) } } } },
      "x-revturbine-operation": { exposure: "external", resource: "stripe-prices", persistence: { table: "stripePrices", mode: "list" } }
    }),
    post: operation({
      operationId: "createStripePrice",
      summary: "Create Stripe price",
      tags: ["plans"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(StripePriceSchema) } } },
      responses: { "201": { description: "Created Stripe price", content: { "application/json": { schema: StripePriceSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "stripe-prices", persistence: { table: "stripePrices", mode: "create" } }
    })
  },
  "/api/stripe-prices/{id}": {
    get: operation({
      operationId: "getStripePrice",
      requestParams: { path: z5.object({ id: z5.string() }) },
      summary: "Get Stripe price by ID",
      tags: ["plans"],
      responses: { "200": { description: "Stripe price detail", content: { "application/json": { schema: StripePriceSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "stripe-prices", persistence: { table: "stripePrices", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateStripePrice",
      requestParams: { path: z5.object({ id: z5.string() }) },
      summary: "Update Stripe price",
      tags: ["plans"],
      requestBody: { required: true, content: { "application/json": { schema: StripePriceWriteSchema } } },
      responses: { "200": { description: "Updated Stripe price", content: { "application/json": { schema: StripePriceSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "stripe-prices", persistence: { table: "stripePrices", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteStripePrice",
      requestParams: { path: z5.object({ id: z5.string() }) },
      summary: "Delete Stripe price",
      tags: ["plans"],
      responses: { "204": { description: "Stripe price deleted" } },
      "x-revturbine-operation": { exposure: "external", resource: "stripe-prices", persistence: { table: "stripePrices", mode: "delete" } }
    })
  }
};

// scaffold/src/entitlements/models/schema.ts
import { z as z6 } from "zod";
var { Unrestricted: Unrestricted3 } = DataClassification;
var { Persisted: Persisted3, Transient: Transient3 } = SchemaPersistence;
var { Internal: Internal2, External: External3 } = SchemaExposure;
var PLAYBOOK_SDK_FACETS2 = schemaFacets(SchemaContext.Playbook, { sdkInput: true });
var PENDING_PLAYBOOK_FACETS = schemaFacets(SchemaContext.Playbook, {
  inConfig: false,
  sdkInput: false
});
var UsagePeriodScopeSchema = z6.enum(["per_month", "per_year", "per_billing_period", "lifetime", "concurrent", "per_instance", "per_second", "per_minute", "per_hour", "per_6_hours", "per_day", "per_week"]).meta(
  { id: "UsagePeriodScope", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": External3 }
);
var UsageAllocationSchema = z6.enum(["account_pool", "per_instance", "per_user", "per_user_pooled"]).meta(
  { id: "UsageAllocation", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": External3 }
);
var EntitlementGrantStatusSchema = z6.enum(ENTITLEMENT_STATUS_VALUES).meta(
  { id: "EntitlementGrantStatus", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": External3 }
);
var EntitlementGrantSourceSchema = z6.enum(["rule", "user_context", "override"]).meta(
  { id: "EntitlementGrantSource", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": External3 }
);
var EnforcementModeSchema = z6.enum(["hard_block", "block_with_upsell", "degrade", "allow_overage"]).meta(
  { id: "EnforcementMode", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": External3 }
);
var EntitlementGrantSchema = z6.object({
  entitlement_id: z6.string().min(1).meta(Unrestricted3),
  entitlement_handle: z6.string().min(1).meta(Unrestricted3),
  status: EntitlementGrantStatusSchema.meta(Unrestricted3),
  limit: z6.number().optional().meta(Unrestricted3),
  used: z6.number().optional().meta(Unrestricted3),
  allocation: UsageAllocationSchema.optional().meta(Unrestricted3),
  enforcement: EnforcementModeSchema.optional().meta(Unrestricted3),
  /** How this grant was derived. */
  source: EntitlementGrantSourceSchema.optional().meta(Unrestricted3),
  // ── Derivation context (populated when source = 'rule') ──
  /** The plan that activated this rule-derived grant. */
  plan_id: z6.string().optional().meta(Unrestricted3),
  /** The segment that matched for this rule-derived grant. */
  segment_id: z6.string().optional().meta(Unrestricted3),
  /** The seat type that qualified this grant (when allocation is per-seat). */
  seat_type_id: z6.string().optional().meta(Unrestricted3),
  /** The entitlement rule id that produced this grant. */
  rule_id: z6.string().optional().meta(Unrestricted3)
}).meta(
  {
    id: "EntitlementGrant",
    "x-revturbine-schema-persistence": Transient3,
    "x-revturbine-schema-exposure": External3,
    ...DataClassification.Operational
  }
);
var EntitlementGrantSetSchema = z6.object({
  account: z6.record(z6.string(), EntitlementGrantSchema).optional().meta(Unrestricted3),
  instance: z6.record(z6.string(), EntitlementGrantSchema).optional().meta(Unrestricted3),
  user: z6.record(z6.string(), EntitlementGrantSchema).optional().meta(Unrestricted3)
}).meta(
  {
    id: "EntitlementGrantSet",
    "x-revturbine-schema-persistence": Transient3,
    "x-revturbine-schema-exposure": External3,
    ...DataClassification.Operational
  }
);
var RuleVisibilitySchema = z6.enum(["public", "non_public"]).meta(
  { id: "RuleVisibility", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": External3 }
);
var EntitlementRuleTargetKindSchema = z6.enum(["plan", "plan_variation", "addon", "addon_variation"]).meta(
  { id: "EntitlementRuleTargetKind", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": External3 }
);
var EntitlementRuleTargetSchema = z6.object({
  kind: EntitlementRuleTargetKindSchema.meta(Unrestricted3),
  id: z6.string().min(1).meta(Unrestricted3)
}).meta(
  { id: "EntitlementRuleTarget", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": External3 }
);
var EntitlementRulePeriodUnitSchema = z6.enum(["month", "day", "week", "quarter", "year", "billing_period", "hour", "six_hours"]).meta(
  { id: "EntitlementRulePeriodUnit", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": External3 }
);
var EntitlementSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z6.string().min(1).meta({ ...Unrestricted3, readOnly: true }),
  name: NameField.meta(Unrestricted3),
  handle: HandleField.meta(Unrestricted3),
  customer_facing_description: z6.string().max(500).optional().meta(Unrestricted3),
  type: EntitlementTypeSchema.meta(Unrestricted3),
  unit: z6.string().max(100).optional().meta(Unrestricted3),
  period_scope: UsagePeriodScopeSchema.optional().meta(Unrestricted3),
  allocation: UsageAllocationSchema.optional().meta(Unrestricted3),
  tier_definitions: z6.array(z6.object({
    name: z6.string(),
    handle: z6.string(),
    description: z6.string().optional()
  })).optional().meta(Unrestricted3),
  sort_order: z6.number().int().default(0).meta(Unrestricted3),
  metadata: MetadataField.meta(Unrestricted3)
}).meta(
  {
    id: "Entitlement",
    "x-revturbine-schema-persistence": Persisted3,
    "x-revturbine-schema-exposure": External3,
    ...PLAYBOOK_SDK_FACETS2,
    ...namedIdentity()
  }
);
var EntitlementAnchorSchema = makeAnchor("EntitlementAnchor");
var EntitlementRuleSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z6.string().min(1).meta({ ...Unrestricted3, readOnly: true }),
  handle: HandleField.meta({ ...Unrestricted3, readOnly: true }),
  entitlement_id: z6.string().min(1).meta(Unrestricted3),
  targets: z6.array(EntitlementRuleTargetSchema).min(1).meta(Unrestricted3),
  // Segment scoping per spec §2.5: array of segment IDs interpreted with
  // intra-dimension OR + cross-dimension AND at evaluation time. The
  // dimensions registry resolves each ID → dimension. Empty array means
  // "match all users" (replaces the legacy 'all' sentinel).
  segment_ids: z6.array(z6.string()).default([]).meta(Unrestricted3),
  visibility: RuleVisibilitySchema.default("public").meta(Unrestricted3),
  // Business objective this rule monetizes for — the analytics `objective`
  // slice, which resolves `rule_handle → objective` through a configuration
  // snapshot (BL-0065 / worksheet G4). A reference by handle to an
  // `objectives[]` entity (D-15; VAL-OBJ-01). Config-only, and deliberately
  // NOT part of the minted identity below: an objective relabel is a
  // behaviour-only edit that coalesces onto the same rule, not a new rule scope.
  // Nullable on the persisted entity so an editor can CLEAR the reference
  // (a PATCH merges, so omission keeps the old value); the portable
  // projection stays optional-only and omits it when unset.
  objective: ObjectiveField.nullable().meta(Unrestricted3),
  // Usage-Limit "measured over" window, rule-level (plan #55). Rate Limit
  // keeps its entitlement-level `period_scope`; this is the per-rule one.
  period_scope: UsagePeriodScopeSchema.optional().meta(Unrestricted3),
  // Optional instance label, surfaced when `period_scope = 'per_instance'` (F-1).
  instance: z6.string().max(100).optional().meta(Unrestricted3),
  // Credits reset cadence ("refills every"): governs only the per-period
  // `allowance_value` refill. `billing_period` resolves at runtime to the
  // customer's Variation billing period; structural guard below. Absent means
  // one-time only — an `initial_grant` with no recurring refill (plan 147
  // REQ-6; `on_purchase` retired from the enum).
  reset_period: EntitlementRulePeriodUnitSchema.optional().meta(Unrestricted3),
  // Type-specific fields (populated based on entitlement type)
  limit_value: z6.union([z6.number(), z6.literal("unlimited")]).optional().meta(Unrestricted3),
  enforcement: EnforcementModeSchema.optional().meta(Unrestricted3),
  // Usage-warning emitter (plan 138 REQ-13): the percent at which this rule
  // emits a usage-warning crossing event. 10% increments so a placement's
  // `threshold_percent` (same field type) can align with — "should match one
  // of those global values" (placement-studio-ui.md §3.4). Optional; a rule
  // with no warning threshold emits none.
  warning_threshold_percent: ThresholdPercentField.optional().meta(Unrestricted3),
  overage_price_ref: z6.string().optional().meta(Unrestricted3),
  grace_period_hours: z6.number().int().min(0).optional().meta(Unrestricted3),
  tier_value: z6.string().optional().meta(Unrestricted3),
  rate_value: z6.number().optional().meta(Unrestricted3),
  initial_grant: z6.number().optional().meta(Unrestricted3),
  allowance_value: z6.union([z6.number(), z6.literal("unlimited")]).optional().meta(Unrestricted3),
  rollover_enabled: z6.boolean().optional().meta(Unrestricted3),
  // Ceiling on total balance — refills clipped, add-on top-ups bypass.
  // NOT NULL JSONB at the DB level; JSON-null value means "no ceiling."
  max_balance: z6.union([z6.number(), z6.literal("unlimited")]).nullable().default(null).meta(Unrestricted3),
  seat_type_id: z6.string().optional().meta(Unrestricted3),
  included_count: z6.union([z6.number().int(), z6.literal("unlimited")]).optional().meta(Unrestricted3),
  at_limit_behavior: z6.enum(["hard_cap", "auto_upgrade_at_renewal"]).optional().meta(Unrestricted3),
  stripe_metered_price_id: z6.string().optional().meta(Unrestricted3),
  // ── Plan 147: columns promoted from the deleted portable `type_fields` union
  // so the flat wire projection round-trips (REQ-3 persist verdicts). The wire
  // (RevTurbineConfigEntitlementRulesItemSchema) mirrors these one-to-one under
  // their canonical names; web derives `kind`/`unit`/`tier_*` from the parent
  // entitlement instead of persisting them.
  //
  // feature enable/disable: a present-but-disabled feature rule is a real DENY
  // (`entitlement-check.ts` reads `enabled !== false`), distinct from "no rule".
  // Optional (absent = enabled) matches that evaluator semantic — replaces the
  // hard-coded `true` the export used to emit.
  enabled: z6.boolean().optional().meta(Unrestricted3),
  // How this rule partitions usage across the identity hierarchy. Rule-level in
  // the IR (`encode.ts` maps `r.allocation`); may default from the parent
  // entitlement's `allocation` when unset.
  allocation: UsageAllocationSchema.optional().meta(Unrestricted3),
  // Seat ceiling. null = unlimited (plan 72); the 999999 export sentinel maps
  // back to null at the compile boundary.
  max_seats: z6.union([z6.number(), z6.literal("unlimited")]).nullable().optional().meta(Unrestricted3),
  // price_per_unit content-rendering fields (OQ-7: persisted-and-rendered, NOT
  // evaluated — no IR/evaluator branch). `unit` derives from the entitlement;
  // `period` maps onto the existing `period_scope` column.
  amount_cents: z6.number().int().optional().meta(Unrestricted3),
  currency: z6.string().optional().meta(Unrestricted3)
}).meta(
  {
    id: "EntitlementRule",
    "x-revturbine-schema-persistence": Persisted3,
    "x-revturbine-schema-exposure": Internal2,
    ...PLAYBOOK_SDK_FACETS2,
    // Bucket 2: a rule IS its scope (entitlement + segments + targets); its
    // limit/enforcement is the mutable payload. Behaviour-only edits coalesce
    // as the same rule; a scope edit is a new rule identity (plan 121 REQ-3).
    // segment_ids/targets are jsonb arrays — the DB unique index normalizes them.
    ...mintedIdentity()
  }
);
var EntitlementRuleAnchorSchema = makeAnchor("EntitlementRuleAnchor");
var EntitlementRuleValidatedSchema = EntitlementRuleSchema.superRefine(
  (rule, ctx) => {
    if (rule.reset_period === "billing_period") {
      const nonVariationIdx = rule.targets.findIndex(
        (t) => t.kind !== "plan_variation" && t.kind !== "addon_variation"
      );
      if (nonVariationIdx !== -1) {
        ctx.addIssue({
          code: "custom",
          path: ["reset_period"],
          params: { code: "billing_period_target_mismatch" },
          message: "reset_period='billing_period' requires all targets to be plan_variation or addon_variation"
        });
      }
    }
    const allowance = rule.allowance_value;
    const hasRecurringAllowance = allowance === "unlimited" || typeof allowance === "number" && allowance > 0;
    if (hasRecurringAllowance && rule.reset_period == null) {
      ctx.addIssue({
        code: "custom",
        path: ["reset_period"],
        params: { code: "allowance_requires_reset_period" },
        message: "a non-zero credits allowance_value requires a reset_period (the per-period refill cadence)"
      });
    }
  }
);
var EntitlementRuleWarningCodeSchema = z6.enum(["one_time_period_mismatch"]).meta(
  { id: "EntitlementRuleWarningCode", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": External3 }
);
var EntitlementRuleWarningSchema = z6.object({
  code: EntitlementRuleWarningCodeSchema.meta(Unrestricted3),
  message: z6.string().min(1).meta(Unrestricted3),
  /** Optional dotted field path the warning relates to (e.g. `['targets']`). */
  path: z6.array(z6.union([z6.string(), z6.number().int()])).optional().meta(Unrestricted3)
}).meta(
  { id: "EntitlementRuleWarning", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": External3 }
);
var EntitlementRuleWriteResponseSchema = EntitlementRuleSchema.extend({
  warnings: z6.array(EntitlementRuleWarningSchema).optional().meta(Unrestricted3)
}).meta(
  {
    id: "EntitlementRuleWriteResponse",
    "x-revturbine-schema-persistence": Transient3,
    "x-revturbine-schema-exposure": External3
  }
);
var EntitlementRuleVariantSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  handle: HandleField.meta({ ...Unrestricted3, readOnly: true }),
  rule_id: z6.string().min(1).meta(Unrestricted3),
  experiment_id: z6.string().min(1).meta(Unrestricted3),
  variant_name: z6.string().min(1).max(200).meta(Unrestricted3),
  is_control: z6.boolean().default(false).meta(Unrestricted3),
  override_fields: z6.record(z6.string(), z6.unknown()).default({}).meta(Unrestricted3)
}).meta(
  {
    id: "EntitlementRuleVariant",
    "x-revturbine-schema-persistence": Persisted3,
    "x-revturbine-schema-exposure": Internal2,
    ...PENDING_PLAYBOOK_FACETS,
    ...mintedIdentity()
  }
);
var EntitlementWriteSchema = toWritableSchema(EntitlementSchema);
var EntitlementRuleWriteSchema = toWritableSchema(EntitlementRuleSchema);
var entitlementPaths = {
  "/api/entitlement-anchors": {
    get: operation({
      operationId: "listEntitlementAnchors",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List entitlement anchors (identity registry)",
      tags: ["entitlements"],
      responses: {
        "200": { description: "Entitlement anchor list", content: { "application/json": { schema: ListEnvelope(EntitlementAnchorSchema) } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "entitlement-anchors", persistence: { table: "entitlements", mode: "list" } }
    })
  },
  "/api/entitlement-rule-anchors": {
    get: operation({
      operationId: "listEntitlementRuleAnchors",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List entitlement rule anchors (identity registry)",
      tags: ["entitlements"],
      responses: {
        "200": { description: "Entitlement rule anchor list", content: { "application/json": { schema: ListEnvelope(EntitlementRuleAnchorSchema) } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "entitlement-rule-anchors", persistence: { table: "entitlementRules", mode: "list" } }
    })
  },
  "/api/entitlements": {
    get: operation({
      operationId: "listEntitlements",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List entitlements",
      tags: ["entitlements"],
      responses: { "200": { description: "Entitlement list", content: { "application/json": { schema: ListEnvelope(EntitlementSchema) } } } },
      "x-revturbine-operation": { exposure: "external", resource: "entitlements", persistence: { table: "entitlementVersions", mode: "list" } }
    }),
    post: operation({
      operationId: "createEntitlement",
      summary: "Create entitlement",
      tags: ["entitlements"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(EntitlementSchema) } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: EntitlementSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "entitlements", persistence: { table: "entitlementVersions", mode: "create" } }
    })
  },
  "/api/entitlements/{entitlementId}": {
    get: operation({
      operationId: "getEntitlement",
      requestParams: { path: z6.object({ entitlementId: z6.string() }) },
      summary: "Get entitlement",
      tags: ["entitlements"],
      responses: { "200": { description: "Entitlement detail", content: { "application/json": { schema: EntitlementSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "entitlements", persistence: { table: "entitlementVersions", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateEntitlement",
      requestParams: { path: z6.object({ entitlementId: z6.string() }) },
      summary: "Update entitlement",
      tags: ["entitlements"],
      requestBody: { required: true, content: { "application/json": { schema: EntitlementWriteSchema } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: EntitlementSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "entitlements", persistence: { table: "entitlementVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteEntitlement",
      requestParams: { path: z6.object({ entitlementId: z6.string() }) },
      summary: "Delete entitlement",
      tags: ["entitlements"],
      responses: { "204": { description: "Deleted" }, default: { description: "Error", content: { "application/json": { schema: ErrorEnvelope } } } },
      "x-revturbine-operation": { exposure: "external", resource: "entitlements", persistence: { table: "entitlementVersions", mode: "delete" } }
    })
  },
  "/api/entitlements/{entitlementId}/rules": {
    get: operation({
      operationId: "listEntitlementRules",
      requestParams: { path: z6.object({ entitlementId: z6.string() }), query: ListQueryParamsSchema },
      summary: "List rules for entitlement",
      tags: ["entitlements"],
      responses: { "200": { description: "Rule list", content: { "application/json": { schema: ListEnvelope(EntitlementRuleSchema) } } } },
      "x-revturbine-operation": { exposure: "external", resource: "entitlement-rules", persistence: { table: "entitlementRuleVersions", mode: "list" } }
    }),
    post: operation({
      operationId: "createEntitlementRule",
      requestParams: { path: z6.object({ entitlementId: z6.string() }) },
      summary: "Create entitlement rule",
      tags: ["entitlements"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(EntitlementRuleSchema) } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: EntitlementRuleWriteResponseSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "entitlement-rules", persistence: { table: "entitlementRuleVersions", mode: "create" } }
    })
  },
  "/api/entitlement-rules/{ruleId}": {
    patch: operation({
      operationId: "updateEntitlementRule",
      requestParams: { path: z6.object({ ruleId: z6.string() }) },
      summary: "Update entitlement rule",
      tags: ["entitlements"],
      requestBody: { required: true, content: { "application/json": { schema: EntitlementRuleWriteSchema } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: EntitlementRuleWriteResponseSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "entitlement-rules", persistence: { table: "entitlementRuleVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteEntitlementRule",
      requestParams: { path: z6.object({ ruleId: z6.string() }) },
      summary: "Delete entitlement rule",
      tags: ["entitlements"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "external", resource: "entitlement-rules", persistence: { table: "entitlementRuleVersions", mode: "delete" } }
    })
  },
  "/api/entitlement-rules/{ruleId}/duplicate": {
    post: operation({
      operationId: "duplicateEntitlementRule",
      requestParams: { path: z6.object({ ruleId: z6.string() }) },
      summary: "Duplicate entitlement rule",
      tags: ["entitlements"],
      responses: { "201": { description: "Duplicated", content: { "application/json": { schema: EntitlementRuleWriteResponseSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "entitlement-rules", persistence: { table: "entitlementRuleVersions", mode: "duplicate" } }
    })
  },
  "/api/entitlement-rules/{ruleId}/variants": {
    get: operation({
      operationId: "listEntitlementRuleVariants",
      requestParams: { path: z6.object({ ruleId: z6.string() }), query: ListQueryParamsSchema },
      summary: "List A/B variants for rule",
      tags: ["entitlements"],
      responses: { "200": { description: "Variant list", content: { "application/json": { schema: ListEnvelope(EntitlementRuleVariantSchema) } } } },
      "x-revturbine-operation": { exposure: "external", resource: "entitlement-rule-variants", persistence: { table: "entitlementRuleVariants", mode: "list" } }
    }),
    post: operation({
      operationId: "createEntitlementRuleVariant",
      requestParams: { path: z6.object({ ruleId: z6.string() }) },
      summary: "Create rule A/B variant",
      tags: ["entitlements"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(EntitlementRuleVariantSchema) } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: EntitlementRuleVariantSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "entitlement-rule-variants", persistence: { table: "entitlementRuleVariants", mode: "create" } }
    })
  }
};

// scaffold/src/placements/models/schema.ts
import { z as z7 } from "zod";
var { Unrestricted: Unrestricted4 } = DataClassification;
var { Persisted: Persisted4, Transient: Transient4 } = SchemaPersistence;
var { External: External4, Internal: Internal3 } = SchemaExposure;
var PLAYBOOK_SDK_FACETS3 = schemaFacets(SchemaContext.Playbook, { sdkInput: true });
var PENDING_PLAYBOOK_FACETS2 = schemaFacets(SchemaContext.Playbook, {
  inConfig: false,
  sdkInput: false
});
var EMBEDDED_PLAYBOOK_SDK_FACETS = schemaFacets(SchemaContext.Playbook, {
  inConfig: false,
  sdkInput: true
});
var DISCOVERED_PLAYBOOK_FACETS = schemaFacets(SchemaContext.Playbook, {
  inConfig: false,
  sdkInput: false,
  source: SchemaSource.Runtime
});
var PlacementQualifierSchema = z7.enum(["none_always_on", "overage_vs_upgrade", "time_bound", "payment_failed", "payment_at_risk"]);
var PlacementCategorySchema = z7.enum([
  "fixed",
  "gated_feature",
  "usage_limit",
  "trial",
  "other_conversion",
  "retention"
]).meta(
  { id: "PlacementCategory", "x-revturbine-schema-persistence": Transient4, "x-revturbine-schema-exposure": External4 }
);
var CapPeriodSchema = z7.enum(["session", "day", "week", "month", "lifetime"]).meta(
  { id: "CapPeriod", "x-revturbine-schema-persistence": Transient4, "x-revturbine-schema-exposure": External4 }
);
var PlacementCapRuleSchema = z7.object({
  count: z7.number().int().positive().meta(Unrestricted4),
  period: CapPeriodSchema.meta(Unrestricted4)
}).meta(
  { id: "PlacementCapRule", "x-revturbine-schema-persistence": Transient4, "x-revturbine-schema-exposure": External4 }
);
var SurfaceTypeCapRuleSchema = z7.object({
  surface_type: z7.string().min(1).meta(Unrestricted4),
  rules: z7.array(PlacementCapRuleSchema).meta(Unrestricted4),
  cooldown_ms: z7.number().int().nonnegative().optional().meta(Unrestricted4)
}).meta(
  {
    id: "SurfaceTypeCapRule",
    "x-revturbine-schema-persistence": Persisted4,
    "x-revturbine-schema-exposure": External4,
    ...DataClassification.Operational,
    ...EMBEDDED_PLAYBOOK_SDK_FACETS
  }
);
var CtaPathTypeSchema = z7.enum([
  "open_checkout",
  "view_plans",
  "book_demo",
  "contact_sales",
  "complete_onboarding",
  "invite_teammate",
  "refer_friend",
  "verify_work_email",
  "update_payment_method",
  "enable_auto_renewal",
  "manage_subscription",
  "switch_billing_period",
  "extend_trial",
  "open_rt_placement",
  "dismiss",
  "snooze",
  "custom"
]).meta(
  { id: "CtaPathType", "x-revturbine-schema-persistence": Transient4, "x-revturbine-schema-exposure": External4 }
);
var PlacementSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z7.string().min(1).meta({ ...Unrestricted4, readOnly: true }),
  name: NameField.meta(Unrestricted4),
  handle: HandleField.meta(Unrestricted4),
  description: DescriptionField.meta(Unrestricted4),
  category: PlacementCategorySchema.meta(Unrestricted4),
  // Business objective this placement monetizes for — the analytics
  // `objective` slice, which resolves `placement_id → objective` through a
  // configuration snapshot (BL-0065 / worksheet G4). A reference by handle to
  // an `objectives[]` entity (D-15; VAL-OBJ-01). Config-only: nothing in the
  // runtime decision reads it, so it round-trips through the portable
  // Playbook projection but never lowers into the compiled IR. See
  // `ObjectiveField`.
  // Nullable on the persisted entity so an editor can CLEAR the reference
  // (a PATCH merges, so omission keeps the old value); the portable
  // projection stays optional-only and omits it when unset.
  objective: ObjectiveField.nullable().meta(Unrestricted4),
  drag_order_in_category: z7.number().int().default(0).meta(Unrestricted4),
  // Trigger config (populated based on category)
  surface_slot_id: z7.string().optional().meta(Unrestricted4),
  entitlement_id: z7.string().optional().meta(Unrestricted4),
  tier_threshold: z7.string().optional().meta(Unrestricted4),
  threshold_percent: ThresholdPercentField.optional().meta(Unrestricted4),
  trial_type: z7.enum(["free", "reverse"]).optional().meta(Unrestricted4),
  trigger_type: z7.string().optional().meta(Unrestricted4),
  trial_progress_percent: z7.number().min(0).max(100).optional().meta(Unrestricted4),
  days_before_end: z7.number().int().min(0).optional().meta(Unrestricted4),
  qualifier: PlacementQualifierSchema.optional().meta(Unrestricted4),
  activation_window_start: z7.string().datetime().optional().meta(Unrestricted4),
  activation_window_end: z7.string().datetime().optional().meta(Unrestricted4),
  metadata: MetadataField.meta(Unrestricted4)
}).meta(
  {
    id: "Placement",
    "x-revturbine-schema-persistence": Persisted4,
    "x-revturbine-schema-exposure": External4,
    ...PLAYBOOK_SDK_FACETS3,
    ...namedIdentity()
  }
);
var PlacementAnchorSchema = makeAnchor("PlacementAnchor");
var PlacementWarningCodeSchema = z7.enum(["threshold_not_emitted"]).meta(
  { id: "PlacementWarningCode", "x-revturbine-schema-persistence": Transient4, "x-revturbine-schema-exposure": External4 }
);
var PlacementWarningSchema = z7.object({
  code: PlacementWarningCodeSchema.meta(Unrestricted4),
  message: z7.string().min(1).meta(Unrestricted4),
  /** Optional field path the warning relates to (e.g. `['threshold_percent']`). */
  path: z7.array(z7.union([z7.string(), z7.number().int()])).optional().meta(Unrestricted4)
}).meta(
  { id: "PlacementWarning", "x-revturbine-schema-persistence": Transient4, "x-revturbine-schema-exposure": External4 }
);
var PlacementWriteResponseSchema = PlacementSchema.extend({
  warnings: z7.array(PlacementWarningSchema).optional().meta(Unrestricted4)
}).meta(
  {
    id: "PlacementWriteResponse",
    "x-revturbine-schema-persistence": Transient4,
    "x-revturbine-schema-exposure": External4
  }
);
var THRESHOLD_TRIGGER_TYPES = /* @__PURE__ */ new Set([
  "usage_threshold",
  "credit_threshold",
  "seat_threshold"
]);
function validatePlacementThresholdWarnings(placement, lookup) {
  const { trigger_type, threshold_percent, entitlement_id } = placement;
  if (!trigger_type || !THRESHOLD_TRIGGER_TYPES.has(trigger_type)) return [];
  if (typeof threshold_percent !== "number" || !entitlement_id) return [];
  const emitted = lookup(entitlement_id);
  if (emitted === void 0) return [];
  if (emitted.includes(threshold_percent)) return [];
  const emittedLabel = emitted.length > 0 ? `${[...emitted].sort((a, b) => a - b).join("%, ")}%` : "none";
  return [
    {
      code: "threshold_not_emitted",
      message: `threshold_percent=${threshold_percent}% is not among the target entitlement's emitted warning thresholds (${emittedLabel}); the placement still saves, but it may fire without a matching usage-warning crossing`,
      path: ["threshold_percent"]
    }
  ];
}
var CtaObjectSchema = z7.object({
  label: z7.string().min(1).max(200).meta(Unrestricted4),
  cta_path_type: CtaPathTypeSchema.meta(Unrestricted4),
  config_fields: z7.record(z7.string(), z7.unknown()).default({}).meta(Unrestricted4)
}).meta(
  { id: "CtaObject", "x-revturbine-schema-persistence": Transient4, "x-revturbine-schema-exposure": External4 }
);
var PlacementPayloadSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z7.string().min(1).meta({ ...Unrestricted4, readOnly: true }),
  handle: HandleField.meta({ ...Unrestricted4, readOnly: true }),
  placement_id: z7.string().min(1).meta(Unrestricted4),
  drag_order: z7.number().int().default(0).meta(Unrestricted4),
  // Plan Filter (spec §3.1.1 Target): OR within each dimension, AND across.
  // Empty arrays = "All" (no filter). Cadence values mirror the selected
  // plans' Plan Variations (free-form strings, e.g. 'monthly' / 'annual').
  target_plan_ids: z7.array(z7.string()).default([]).meta(Unrestricted4),
  target_plan_billing_cadences: z7.array(z7.string()).default([]).meta(Unrestricted4),
  target_segments: z7.array(z7.string()).default([]).meta(Unrestricted4),
  // Optional slot targeting (spec §3.1.1 Surface & Content): empty = "any
  // compatible slot"; hidden for Fixed placements at the UI layer.
  surface_slot_ids: z7.array(z7.string()).default([]).meta(Unrestricted4),
  surface_template_id: z7.string().min(1).meta(Unrestricted4),
  content_fields: z7.record(z7.string(), z7.unknown()).default({}).meta(Unrestricted4),
  cta_list: z7.array(CtaObjectSchema).default([]).meta(Unrestricted4),
  max_per_period: z7.number().int().min(0).nullable().default(null).meta(Unrestricted4),
  max_period_unit: CapPeriodSchema.default("session").meta(Unrestricted4),
  cooldown_after_dismiss_days: z7.number().int().min(0).default(7).meta(Unrestricted4),
  // Per-payload remind-me-later (defer) window override, in minutes. Null =
  // inherit the tenant default (`remindLaterMinutes`, 60). Plan 167 REQ-6 / Q-3.
  remind_later_minutes: z7.number().int().min(0).nullable().default(null).meta(Unrestricted4),
  recommendation_strategy: z7.enum(["next_tier_up", "best_value", "custom"]).optional().default("next_tier_up").meta(Unrestricted4),
  recommendation_plan_override: z7.string().optional().meta(Unrestricted4)
}).meta(
  {
    id: "PlacementPayload",
    "x-revturbine-schema-persistence": Persisted4,
    "x-revturbine-schema-exposure": External4,
    ...PLAYBOOK_SDK_FACETS3,
    // KENT-REVIEW (plan 121): defaulted to Bucket 2 on (placement_id, drag_order)
    // — a payload's ordinal within its placement. This is the strongest Bucket-3
    // candidate (reordering a key edit would fork history); if lineage must survive
    // reordering it should become the first Bucket-3 member with its own surrogate,
    // which then needs a REQ-6 carve-out from the "canonical_id drops everywhere".
    ...mintedIdentity()
  }
);
var PlacementPayloadAnchorSchema = makeAnchor("PlacementPayloadAnchor");
var SURFACE_SLOT_STATUS_VALUES = ["live", "idle"];
var SurfaceSlotStatusSchema = z7.enum(SURFACE_SLOT_STATUS_VALUES).meta({ id: "SurfaceSlotStatus", "x-revturbine-schema-persistence": Transient4, "x-revturbine-schema-exposure": External4 });
var SURFACE_SLOT_ROUTE_MAX_LENGTH = 512;
var SurfaceSlotSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  surface_slot_handle: z7.string().min(1).max(200).meta(Unrestricted4),
  surface_type: SurfaceTypeSchema.meta(Unrestricted4),
  surface_template_ids: z7.array(z7.string()).default([]).meta(Unrestricted4),
  surface_slot_category: z7.enum(["fixed", "gated", "triggered"]).default("fixed").meta(Unrestricted4),
  first_seen: z7.string().datetime().meta({ ...Unrestricted4, readOnly: true }),
  last_seen: z7.string().datetime().meta({ ...Unrestricted4, readOnly: true }),
  /**
   * The app route the slot rendered on (D-30, BL-0207): computed by the
   * SDK's React layer, carried on the slot events' `route` field, and
   * persisted here by ingestion-driven discovery — never by an SDK write.
   * A path only (`/projects/[projectId]`, `/billing/:id`): no origin, query
   * string or fragment, identifier-like segments templated. `null` when no
   * route was observed (non-browser producers, pre-BL-0207 SDKs).
   */
  route: z7.string().min(1).max(SURFACE_SLOT_ROUTE_MAX_LENGTH).nullable().optional().meta({ ...Unrestricted4, readOnly: true }),
  status: SurfaceSlotStatusSchema.default("idle").meta(Unrestricted4),
  placement_count: z7.number().int().min(0).default(0).meta({ ...Unrestricted4, readOnly: true })
}).meta(
  {
    id: "SurfaceSlot",
    "x-revturbine-schema-persistence": Persisted4,
    "x-revturbine-schema-exposure": External4,
    ...DISCOVERED_PLAYBOOK_FACETS,
    ...namedIdentity("surface_slot_handle")
  }
);
var PlacementWriteSchema = toWritableSchema(PlacementSchema);
var PayloadWriteSchema = toWritableSchema(PlacementPayloadSchema);
var placementPaths = {
  "/api/placement-anchors": {
    get: operation({
      operationId: "listPlacementAnchors",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List placement anchors (identity registry)",
      tags: ["placements"],
      responses: {
        "200": { description: "Placement anchor list", content: { "application/json": { schema: ListEnvelope(PlacementAnchorSchema) } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "placement-anchors", persistence: { table: "placements", mode: "list" } }
    })
  },
  "/api/placements": {
    get: operation({
      operationId: "listPlacements",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List placements",
      tags: ["placements"],
      responses: { "200": { description: "Placement list", content: { "application/json": { schema: ListEnvelope(PlacementSchema) } } } },
      "x-revturbine-operation": { exposure: "external", resource: "placements", persistence: { table: "placementVersions", mode: "list" } }
    }),
    post: operation({
      operationId: "createPlacement",
      summary: "Create placement",
      tags: ["placements"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(PlacementSchema) } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: PlacementWriteResponseSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "placements", persistence: { table: "placementVersions", mode: "create" } }
    })
  },
  "/api/placements/{placementId}": {
    get: operation({
      operationId: "getPlacement",
      requestParams: { path: z7.object({ placementId: z7.string() }) },
      summary: "Get placement",
      tags: ["placements"],
      responses: { "200": { description: "Placement detail", content: { "application/json": { schema: PlacementSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "placements", persistence: { table: "placementVersions", mode: "get" } }
    }),
    patch: operation({
      operationId: "updatePlacement",
      requestParams: { path: z7.object({ placementId: z7.string() }) },
      summary: "Update placement",
      tags: ["placements"],
      requestBody: { required: true, content: { "application/json": { schema: PlacementWriteSchema } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: PlacementWriteResponseSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "placements", persistence: { table: "placementVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deletePlacement",
      requestParams: { path: z7.object({ placementId: z7.string() }) },
      summary: "Delete placement",
      tags: ["placements"],
      responses: { "204": { description: "Deleted" }, default: { description: "Error", content: { "application/json": { schema: ErrorEnvelope } } } },
      "x-revturbine-operation": { exposure: "external", resource: "placements", persistence: { table: "placementVersions", mode: "delete" } }
    })
  },
  "/api/placements/{placementId}/duplicate": {
    post: operation({
      operationId: "duplicatePlacement",
      requestParams: { path: z7.object({ placementId: z7.string() }) },
      summary: "Duplicate placement",
      tags: ["placements"],
      responses: { "201": { description: "Duplicated", content: { "application/json": { schema: PlacementSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "placements", persistence: { table: "placementVersions", mode: "duplicate" } }
    })
  },
  "/api/placements/reorder": {
    post: operation({
      operationId: "reorderPlacements",
      summary: "Reorder placements within category",
      tags: ["placements"],
      requestBody: { required: true, content: { "application/json": { schema: z7.object({ category: PlacementCategorySchema, ids: z7.array(z7.string()) }) } } },
      responses: { "200": { description: "Reordered" } },
      "x-revturbine-operation": { exposure: "external", resource: "placements", persistence: { table: "placementVersions", mode: "reorder" } }
    })
  },
  "/api/placement-payload-anchors": {
    get: operation({
      operationId: "listPlacementPayloadAnchors",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List placement payload anchors (identity registry)",
      tags: ["placements"],
      responses: {
        "200": { description: "Placement payload anchor list", content: { "application/json": { schema: ListEnvelope(PlacementPayloadAnchorSchema) } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "placement-payload-anchors", persistence: { table: "placementPayloads", mode: "list" } }
    })
  },
  "/api/placements/{placementId}/payloads": {
    get: operation({
      operationId: "listPlacementPayloads",
      requestParams: { path: z7.object({ placementId: z7.string() }), query: ListQueryParamsSchema },
      summary: "List placement payloads",
      tags: ["placements"],
      responses: { "200": { description: "Payload list", content: { "application/json": { schema: ListEnvelope(PlacementPayloadSchema) } } } },
      "x-revturbine-operation": { exposure: "external", resource: "placement-payloads", persistence: { table: "placementPayloadVersions", mode: "list" } }
    }),
    post: operation({
      operationId: "createPlacementPayload",
      requestParams: { path: z7.object({ placementId: z7.string() }) },
      summary: "Create placement payload",
      tags: ["placements"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(PlacementPayloadSchema) } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: PlacementPayloadSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "placement-payloads", persistence: { table: "placementPayloadVersions", mode: "create" } }
    })
  },
  "/api/placement-payloads/{payloadId}": {
    patch: operation({
      operationId: "updatePlacementPayload",
      requestParams: { path: z7.object({ payloadId: z7.string() }) },
      summary: "Update placement payload",
      tags: ["placements"],
      requestBody: { required: true, content: { "application/json": { schema: PayloadWriteSchema } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: PlacementPayloadSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "placement-payloads", persistence: { table: "placementPayloadVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deletePlacementPayload",
      requestParams: { path: z7.object({ payloadId: z7.string() }) },
      summary: "Delete placement payload",
      tags: ["placements"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "external", resource: "placement-payloads", persistence: { table: "placementPayloadVersions", mode: "delete" } }
    })
  },
  "/api/surface-slots": {
    get: operation({
      operationId: "listSurfaceSlots",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List auto-discovered surface slots",
      tags: ["placements"],
      responses: { "200": { description: "Surface slot list", content: { "application/json": { schema: ListEnvelope(SurfaceSlotSchema) } } } },
      "x-revturbine-operation": { exposure: "external", resource: "surface-slots", persistence: { table: "surfaceSlots", mode: "list" } }
    })
  }
};

// scaffold/src/user/models/schema.ts
import { z as z9 } from "zod";

// scaffold/src/customers/models/schema.ts
import { z as z8 } from "zod";
var { Unrestricted: Unrestricted5, Pii } = DataClassification;
var { Persisted: Persisted5, Transient: Transient5 } = SchemaPersistence;
var { Internal: Internal4 } = SchemaExposure;
var CUSTOMER_OPERATIONS_FACETS = schemaFacets(SchemaContext.CustomerOperations, {
  sdkInput: false
});
var IdentitySchema = z8.object({
  external_id: z8.string().min(1).meta(Pii),
  traits: z8.record(z8.string(), z8.unknown()).default({}).meta(Pii),
  plan_id: z8.string().optional().meta(Unrestricted5)
}).meta(
  {
    id: "Identity",
    "x-revturbine-schema-persistence": Persisted5,
    "x-revturbine-schema-exposure": Internal4
  }
);
var BillingHealthStatusSchema = z8.enum(["payment_failed", "payment_method_missing"]);
var CustomerSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  external_id: z8.string().min(1).meta(Pii),
  identity: IdentitySchema.meta(Pii),
  stripe_customer_id: z8.string().optional().meta(Unrestricted5),
  current_plan_id: z8.string().optional().meta(Unrestricted5),
  subscription_status: z8.enum(["active", "past_due", "canceled", "trialing", "unpaid", "none"]).default("none").meta(Unrestricted5),
  status: z8.enum(["active", "churned", "trial", "suspended"]).default("active").meta(Unrestricted5),
  /** Active billing-health problems (plan 156); empty array = healthy. */
  billing_health_issues: z8.array(BillingHealthStatusSchema).default([]).meta(Unrestricted5),
  metadata: MetadataField.meta(Unrestricted5)
}).meta(
  {
    id: "Customer",
    "x-revturbine-schema-persistence": Persisted5,
    "x-revturbine-schema-exposure": Internal4
  }
);
var CustomerOverrideDurationSchema = z8.enum([
  "permanent",
  "for_duration"
]).meta(
  {
    id: "CustomerOverrideDuration",
    "x-revturbine-schema-persistence": Transient5,
    "x-revturbine-schema-exposure": Internal4
  }
);
var CustomerOverrideTypeSchema = z8.enum(["grant_plan", "grant_addon", "grant_entitlement"]).meta(
  { id: "CustomerOverrideType", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": Internal4 }
);
var CustomerOverrideStatusSchema = z8.enum(["active", "expired", "revoked"]).meta(
  { id: "CustomerOverrideStatus", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": Internal4 }
);
var CustomerOverrideSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  handle: HandleField.meta({ ...Unrestricted5, readOnly: true }),
  customer_id: z8.string().min(1).meta(Pii),
  customer_id_list: z8.array(z8.string()).optional().meta(Pii),
  override_type: CustomerOverrideTypeSchema.meta(Unrestricted5),
  target_id: z8.string().min(1).meta(Unrestricted5),
  value: z8.record(z8.string(), z8.unknown()).default({}).meta(Unrestricted5),
  duration_type: CustomerOverrideDurationSchema.default("permanent").meta(Unrestricted5),
  duration_value: z8.string().optional().meta(Unrestricted5),
  expiry_date: NullableDatetimeField.meta(Unrestricted5),
  status: CustomerOverrideStatusSchema.default("active").meta(Unrestricted5),
  reason: z8.string().max(500).optional().meta(Unrestricted5),
  created_by: z8.string().optional().meta(Unrestricted5)
}).meta(
  {
    id: "CustomerOverride",
    "x-revturbine-schema-persistence": Persisted5,
    "x-revturbine-schema-exposure": Internal4,
    ...CUSTOMER_OPERATIONS_FACETS,
    // KENT-REVIEW (plan 121): defaulted to Bucket 2 on (customer_id, override_type,
    // target_id) — one override per customer per target per type. Note the optional
    // `customer_id_list` (multi-customer overrides) complicates the tuple; confirm
    // the key, or whether this should be Bucket 3 with its own surrogate.
    ...mintedIdentity()
  }
);
var customerPaths = {
  "/api/customers": {
    get: operation({
      operationId: "listCustomers",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List customers",
      tags: ["customers"],
      responses: { "200": { description: "Customer list", content: { "application/json": { schema: ListEnvelope(CustomerSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "customers", persistence: { table: "customers", mode: "list" } }
    })
  },
  "/api/customers/{customerId}": {
    get: operation({
      operationId: "getCustomer",
      requestParams: { path: z8.object({ customerId: z8.string() }) },
      summary: "Get customer by ID",
      tags: ["customers"],
      responses: { "200": { description: "Customer", content: { "application/json": { schema: CustomerSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "customers", persistence: { table: "customers", mode: "get" } }
    })
  },
  "/api/customer-overrides": {
    get: operation({
      operationId: "listCustomerOverrides",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List customer overrides",
      tags: ["customers"],
      responses: { "200": { description: "Override list", content: { "application/json": { schema: ListEnvelope(CustomerOverrideSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "customer-overrides", persistence: { table: "customerOverrides", mode: "list" } }
    }),
    post: operation({
      operationId: "createCustomerOverride",
      summary: "Create customer override",
      tags: ["customers"],
      requestBody: { required: true, content: { "application/json": { schema: CustomerOverrideSchema } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: CustomerOverrideSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "customer-overrides", persistence: { table: "customerOverrides", mode: "create" } }
    })
  },
  "/api/customer-overrides/{overrideId}": {
    get: operation({
      operationId: "getCustomerOverride",
      requestParams: { path: z8.object({ overrideId: z8.string() }) },
      summary: "Get customer override",
      tags: ["customers"],
      responses: { "200": { description: "Override", content: { "application/json": { schema: CustomerOverrideSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "customer-overrides", persistence: { table: "customerOverrides", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateCustomerOverride",
      requestParams: { path: z8.object({ overrideId: z8.string() }) },
      summary: "Update customer override",
      tags: ["customers"],
      requestBody: { required: true, content: { "application/json": { schema: CustomerOverrideSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: CustomerOverrideSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "customer-overrides", persistence: { table: "customerOverrides", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteCustomerOverride",
      requestParams: { path: z8.object({ overrideId: z8.string() }) },
      summary: "Delete customer override",
      tags: ["customers"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "customer-overrides", persistence: { table: "customerOverrides", mode: "delete" } }
    })
  },
  "/api/customer-overrides/{overrideId}/revoke": {
    post: operation({
      operationId: "revokeCustomerOverride",
      requestParams: { path: z8.object({ overrideId: z8.string() }) },
      summary: "Revoke an active customer override",
      tags: ["customers"],
      responses: { "200": { description: "Revoked", content: { "application/json": { schema: CustomerOverrideSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "customer-overrides", persistence: { table: "customerOverrides", mode: "update" } }
    })
  },
  "/api/customer-overrides/{overrideId}/duplicate": {
    post: operation({
      operationId: "duplicateCustomerOverride",
      requestParams: { path: z8.object({ overrideId: z8.string() }) },
      summary: "Duplicate customer override for another customer",
      tags: ["customers"],
      requestBody: { required: true, content: { "application/json": { schema: z8.object({ customer_id: z8.string() }) } } },
      responses: { "201": { description: "Duplicated", content: { "application/json": { schema: CustomerOverrideSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "customer-overrides", persistence: { table: "customerOverrides", mode: "create" } }
    })
  }
};

// scaffold/src/user/models/schema.ts
var { Unrestricted: Unrestricted6, Pii: Pii2, Financial: Financial2 } = DataClassification;
var { Persisted: Persisted6, Transient: Transient6 } = SchemaPersistence;
var { External: External5, Internal: Internal5 } = SchemaExposure;
var UserTrialStatusSchema = z9.object({
  in_trial: z9.boolean().meta(Unrestricted6),
  trial_type: z9.string().optional().meta(Unrestricted6),
  plan_handle: z9.string().optional().meta(Unrestricted6),
  // 'converted' reflects a server-side analytic-event transition
  // (typically a Stripe webhook like `customer.subscription.created`
  // or `invoice.payment_succeeded` against a trialing subscription)
  // that the control plane processes to flip TrialInstance.status.
  // The SDK reads this state from the decision-API response — it does
  // NOT derive 'converted' client-side. trial_lifecycle.v1 rules
  // matching on 'trial_converted' fire while the user's status carries
  // this value, enabling conversion-celebration / receipt placements.
  state: z9.enum(["active", "running_out", "expired", "converted", "none"]).optional().meta(Unrestricted6),
  /**
   * Trial limit model — mirrors the rule's `trial_limit_type`. The
   * SDK uses this to decide which numeric fields below to surface;
   * the placement-resolver gates `trial_ending(days_before_end)`
   * only when `trial_limit_type === 'time'`.
   */
  trial_limit_type: z9.enum(["time", "usage"]).optional().meta(Unrestricted6),
  /**
   * Universal progress metric, 0..100. Computed by
   * `deriveLocalTrialStatusFromInstance` from elapsed days
   * (time-based) or consumed/limit (usage-based). Trial rule
   * modules + placement-resolver supersession consume this field
   * so they don't have to branch on the limit type.
   */
  progress_percent: z9.number().min(0).max(100).optional().meta(Unrestricted6),
  // Time-based numeric fields. Populated when trial_limit_type='time'.
  day_number: z9.number().int().min(0).optional().meta(Unrestricted6),
  days_remaining: z9.number().int().min(0).optional().meta(Unrestricted6),
  // Usage-based numeric fields. Populated when trial_limit_type='usage'.
  usage_entitlement_handle: z9.string().optional().meta(Unrestricted6),
  usage_consumed: z9.number().int().min(0).optional().meta(Unrestricted6),
  usage_remaining: z9.number().int().min(0).optional().meta(Unrestricted6),
  usage_limit: z9.number().int().min(0).optional().meta(Unrestricted6)
}).meta(
  { id: "UserTrialStatus", "x-revturbine-schema-persistence": Transient6, "x-revturbine-schema-exposure": External5 }
);
var UserUsageEntrySchema = z9.object({
  entitlement_handle: z9.string().min(1).meta(Unrestricted6),
  unit: z9.string().min(1).meta(Unrestricted6),
  amount: z9.number().min(0).meta(Unrestricted6),
  limit: z9.number().min(0).optional().meta(Unrestricted6),
  reset_date: z9.string().optional().meta(Unrestricted6)
}).meta(
  { id: "UserUsageEntry", "x-revturbine-schema-persistence": Transient6, "x-revturbine-schema-exposure": External5 }
);
var ActivityLevelSchema = z9.enum(["new", "high", "medium", "low", "inactive"]).meta(
  { id: "ActivityLevel", "x-revturbine-schema-persistence": Transient6, "x-revturbine-schema-exposure": External5 }
);
var UserPlanContextSchema = z9.object({
  handle: z9.string().min(1).meta(Unrestricted6),
  name: z9.string().min(1).meta(Unrestricted6),
  price: z9.string().optional().meta(Unrestricted6),
  billing_period: z9.enum(["monthly", "annual", "none"]).optional().meta(Unrestricted6)
}).meta(
  { id: "UserPlanContext", "x-revturbine-schema-persistence": Transient6, "x-revturbine-schema-exposure": External5 }
);
var BuiltinActivityLevelSchema = z9.enum(["new", "high", "medium", "low", "inactive"]);
var BuiltinSubscriptionStateSchema = z9.enum(["none", "trial", "paid", "cancelled"]);
var BuiltinTrialTypeSchema = z9.enum(["none", "free_trial", "reverse_trial"]);
var BuiltinBuyerRoleSchema = z9.enum(["buyer", "non_buyer"]);
var BuiltinEmailTypeSchema = z9.enum(["business", "personal", "unknown"]);
var BuiltinBillingHealthSchema = z9.enum([
  "no_billing",
  "good_standing",
  "trial_payment_method_attached",
  "payment_method_missing",
  "payment_failed",
  "payment_overdue",
  "cancelled"
]);
var BuiltinRegionSchema = z9.enum(["us_canada", "europe", "rest_of_world"]);
var BuiltinDeviceTypeSchema = z9.enum(["desktop", "mobile", "tablet", "unknown"]);
var BuiltinSeatTypeSchema = z9.string().regex(/^[a-z0-9._]{1,87}$/);
var UserBuiltinDimensionsSchema = z9.object({
  activity_level: BuiltinActivityLevelSchema.optional().meta(Unrestricted6),
  subscription_state: BuiltinSubscriptionStateSchema.optional().meta(Unrestricted6),
  trial_type: BuiltinTrialTypeSchema.optional().meta(Unrestricted6),
  seat_type: BuiltinSeatTypeSchema.optional().meta(Unrestricted6),
  buyer_role: BuiltinBuyerRoleSchema.optional().meta(Unrestricted6),
  email_type: BuiltinEmailTypeSchema.optional().meta(Unrestricted6),
  billing_health: BuiltinBillingHealthSchema.optional().meta(Unrestricted6),
  region: BuiltinRegionSchema.optional().meta(Unrestricted6),
  device_type: BuiltinDeviceTypeSchema.optional().meta(Unrestricted6)
});
var UserInstanceContextSchema = z9.object({
  product_instance_id: z9.string().min(1).meta(Unrestricted6),
  user_id: z9.string().min(1).meta(Pii2),
  plan: UserPlanContextSchema.optional().meta(Unrestricted6),
  /** Usage entries for this instance, keyed by entitlement handle. */
  usage: z9.record(z9.string(), UserUsageEntrySchema).default({}).meta(Unrestricted6),
  trial: UserTrialStatusSchema.optional().meta(Unrestricted6),
  /** Entitlements resolved at this instance level, keyed by handle. */
  entitlements: z9.record(z9.string(), z9.union([z9.boolean(), EntitlementGrantSchema])).default({}).meta(Unrestricted6)
}).meta(
  {
    id: "UserInstanceContext",
    "x-revturbine-schema-persistence": Persisted6,
    "x-revturbine-schema-exposure": External5
  }
);
var UserContextSchema = IdField.merge(TenantIdField).merge(TimestampFields).extend({
  user_id: z9.string().min(1).meta(Pii2),
  account_id: z9.string().min(1).nullable().optional().meta(Pii2),
  email: z9.string().email().nullable().optional().meta(Pii2),
  /** Optional email classification (e.g. `business`, `personal`). */
  email_type: z9.string().optional().meta(Unrestricted6),
  /**
   * THE plan matching identity — the plan's `unique_handle` (plan 191
   * Q-1/REQ-1/REQ-8). Rule targets, segment plan predicates, and the SDK's
   * plan resolver match on this value alone. The `plan` object below is
   * display metadata; its `id` is DB-internal and never participates in
   * matching.
   */
  plan_handle: z9.string().min(1).optional().meta(Unrestricted6),
  plan: UserPlanContextSchema.optional().meta(Unrestricted6),
  /** Aggregate usage entries across all instances, keyed by handle. */
  usage: z9.record(z9.string(), UserUsageEntrySchema).default({}).meta(Unrestricted6),
  trial: UserTrialStatusSchema.optional().meta(Unrestricted6),
  /**
   * Billing-recovery signals (account-level). `payment_failed` reflects a
   * hard payment failure (e.g. Stripe `invoice.payment_failed`);
   * `payment_at_risk` an expiring / missing-backup payment method. They
   * drive the Retention `qualifier` placement triggers
   * (placement-studio-ui.md §3.7) — the SDK surfaces them onto the
   * PlanProvider state the placement resolver reads. Omitted for users in
   * good standing; a qualifier gate reads `=== true`, so an absent signal
   * never fires the recovery placement.
   */
  payment_failed: z9.boolean().optional().meta(Unrestricted6),
  payment_at_risk: z9.boolean().optional().meta(Unrestricted6),
  /**
   * The user's current tier per `capability_tier` entitlement, keyed by
   * entitlement handle → tier handle (plan 138 TASK-4). Drives the
   * `entitlement_gate.tier_threshold` placement trigger: the SDK surfaces
   * this onto the EntitlementProvider state, and the resolver ranks the
   * current tier against the entitlement's ordered ladder. Omitted for a
   * user holding no tier (ranks below every threshold).
   */
  tiers: z9.record(z9.string(), z9.string()).optional().meta(Unrestricted6),
  /** Account-level entitlements, keyed by handle. */
  entitlements: z9.record(z9.string(), z9.union([z9.boolean(), EntitlementGrantSchema])).default({}).meta(Unrestricted6),
  /** Per-instance breakdowns when the account has multiple product instances. */
  instances: z9.array(UserInstanceContextSchema).optional().meta(Unrestricted6),
  /** Customer-defined fields: role, app-level permissions, display prefs. */
  custom: z9.record(z9.string(), z9.union([z9.string(), z9.number(), z9.boolean(), z9.null()])).default({}).meta(Pii2),
  /**
   * Personalization token map.
   *
   * Holds SDK-derived tokens (plan_name, usage_current, etc.) merged with
   * app-provided tokens; the SDK rebuilds it on each session from context +
   * exported config.
   *
   * Deliberately NOT marked field-level Transient: the `user_contexts` table
   * carries a `personalization` jsonb column (web `drizzle/0000_*.sql`) and
   * the generic user-context write persists it (web
   * `src/lib/user-context/sanitize-write.ts` redacts it first). The drizzle
   * generator emits no column for a field-level Transient (plan 279
   * TASK-3), so the label has to match the table.
   */
  personalization: z9.record(z9.string(), z9.union([z9.string(), z9.number()])).default({}).meta(Unrestricted6),
  /**
   * Built-in segment dimension values (plan 279 PD-3) — see
   * {@link UserBuiltinDimensionsSchema}. Field-level Transient: no DB
   * column; assembled at retrieval, or set by the app in `local_only` mode
   * and on the server ports.
   */
  builtin_dimensions: UserBuiltinDimensionsSchema.optional().meta({ ...Unrestricted6, "x-revturbine-schema-persistence": Transient6 }),
  // ── Derived-entitlement cache (plan 74 REQ-12/REQ-13) ──────────────
  // `entitlements` above is the rule-evaluated projection — a CACHE, not
  // source of truth. These stamps record what it was computed against so a
  // read can detect staleness: recompute when the active config version
  // moved on OR the context hash changed.
  /** Active config version (activated change-set id / compiled-bundle stamp) the cache was computed against. */
  derived_config_version: z9.string().nullable().optional().meta(Unrestricted6),
  /** Deterministic `computeUserContextHash` of the inputs the cache was computed from (REQ-13 ETag value). */
  context_hash: z9.string().nullable().optional().meta(Unrestricted6),
  /** When the cached entitlements were last (re)computed. */
  derived_computed_at: NullableDatetimeField.meta(Unrestricted6),
  // ── Activity score (plan 180 D4) ───────────────────────────────────
  // PERSISTED per-user score: the number of inbound events for this user
  // over the tenant's activity window, computed by the web score job —
  // never trusted from app input. The activity LEVEL is NOT persisted: it
  // is derived at context retrieval by applying the tenant's
  // `activity_*` thresholds (TenantConfig) via `deriveActivityLevel` and
  // stamped onto retrieval traits (plan 180 D5). null = never computed
  // (derives `new`).
  activity_score: z9.number().int().min(0).nullable().optional().meta(Unrestricted6),
  /** When the activity score was last computed; null/absent = never. */
  activity_score_computed_at: z9.string().datetime().nullable().optional().meta(Unrestricted6),
  // ── Experiment assignments (plan 183) ──────────────────────────────
  /**
   * `{ [experimentHandle]: variantHandle }` — which experiments this user is
   * enrolled in and which arm they were assigned.
   *
   * **Both sides are handles**, not database ids: handles are canonical and
   * version-stable, so editing an experiment mints a new version without
   * breaking the reference.
   *
   * Supplied by whoever owns assignment. A third-party experimentation tool is
   * a first-class source here — RevTurbine does not own the split, and our own
   * bucketer is an opt-in SDK-side `ExperimentProvider` rather than the
   * default. A segment naming an experiment matches a user iff that
   * experiment appears as a key, so an absent key means NOT ENROLLED, which
   * stays distinct from being assigned to a control arm.
   */
  experiments: z9.record(z9.string(), z9.string()).optional().meta(Unrestricted6)
}).meta(
  { id: "UserContext", "x-revturbine-schema-persistence": Persisted6, "x-revturbine-schema-exposure": External5 }
);
var ClientContextTrialSchema = z9.object({
  status: z9.enum(["active", "running_out", "expired", "converted", "none"]).meta({ ...Unrestricted6, ...ClientSafe }),
  days_remaining: z9.number().int().min(0).optional().meta({ ...Unrestricted6, ...ClientSafe }),
  ends_at: z9.string().optional().meta({ ...Unrestricted6, ...ClientSafe })
}).meta(
  { id: "ClientContextTrial", "x-revturbine-schema-persistence": Transient6, "x-revturbine-schema-exposure": Internal5 }
);
var ClientContextBillingSchema = z9.object({
  /** Coarse, browser-safe billing-health signal (the only billing field exposed). */
  health: z9.enum(["ok", "attention_required"]).optional().meta({ ...Unrestricted6, ...ClientSafe }),
  /** decision_only — drives retention placements server-side; never returned to the browser. */
  failed_payment_reason: z9.string().optional().meta({ ...Financial2, ...DecisionOnly }),
  /**
   * decision_only — the raw billing-health issue codes (plan 156). The coarse
   * `health` above is derived from whether this is non-empty; these raw codes
   * may drive server-side Playbook decisions but are stripped by the exposure
   * filter and never returned to the browser.
   */
  issues: z9.array(BillingHealthStatusSchema).optional().meta({ ...Financial2, ...DecisionOnly }),
  /** server_only — raw provider identifier; never exposed. */
  provider_subscription_id: z9.string().optional().meta({ ...Financial2, ...ServerOnly })
}).meta(
  { id: "ClientContextBilling", "x-revturbine-schema-persistence": Transient6, "x-revturbine-schema-exposure": Internal5 }
);
var ClientContextCapabilitiesSchema = z9.object({
  can_upgrade: z9.boolean().optional().meta({ ...Unrestricted6, ...ClientSafe }),
  can_manage_billing: z9.boolean().optional().meta({ ...Unrestricted6, ...ClientSafe })
}).meta(
  { id: "ClientContextCapabilities", "x-revturbine-schema-persistence": Transient6, "x-revturbine-schema-exposure": Internal5 }
);
var ClientContextPlanSchema = z9.object({
  /** The customer's current plan handle (`plans.unique_handle`). */
  handle: z9.string().min(1).optional().meta({ ...Unrestricted6, ...ClientSafe }),
  /**
   * The plan's display name, resolved server-side from the plan record so
   * client UI can render it without a Playbook lookup (plan 179 TASK-1 —
   * Q-2 ruling: `{ handle, name }`). Plan names are already client-visible
   * in every Playbook; no new exposure.
   */
  name: z9.string().min(1).optional().meta({ ...Unrestricted6, ...ClientSafe })
}).meta(
  { id: "ClientContextPlan", "x-revturbine-schema-persistence": Transient6, "x-revturbine-schema-exposure": Internal5 }
);
var ClientContextBuiltinDimensionsSchema = z9.object({
  activity_level: BuiltinActivityLevelSchema.optional().meta({ ...Unrestricted6, ...ClientSafe }),
  subscription_state: BuiltinSubscriptionStateSchema.optional().meta({ ...Unrestricted6, ...ClientSafe }),
  trial_type: BuiltinTrialTypeSchema.optional().meta({ ...Unrestricted6, ...ClientSafe }),
  seat_type: BuiltinSeatTypeSchema.optional().meta({ ...Unrestricted6, ...ClientSafe }),
  buyer_role: BuiltinBuyerRoleSchema.optional().meta({ ...Unrestricted6, ...ClientSafe }),
  email_type: BuiltinEmailTypeSchema.optional().meta({ ...Unrestricted6, ...ClientSafe }),
  region: BuiltinRegionSchema.optional().meta({ ...Unrestricted6, ...ClientSafe }),
  device_type: BuiltinDeviceTypeSchema.optional().meta({ ...Unrestricted6, ...ClientSafe })
}).meta(
  { id: "ClientContextBuiltinDimensions", "x-revturbine-schema-persistence": Transient6, "x-revturbine-schema-exposure": Internal5 }
);
var ClientContextSchema = z9.object({
  /** The end-user subject the client token was minted for (carried by the token, not the request). */
  subject: z9.string().min(1).meta({ ...Unrestricted6, ...ClientSafe }),
  /** Opaque version stamp of the underlying context snapshot. */
  context_version: z9.string().optional().meta({ ...Unrestricted6, ...ClientSafe }),
  trial: ClientContextTrialSchema.optional().meta({ ...Unrestricted6, ...ClientSafe }),
  billing: ClientContextBillingSchema.optional().meta({ ...Unrestricted6, ...ClientSafe }),
  plan: ClientContextPlanSchema.optional().meta({ ...Unrestricted6, ...ClientSafe }),
  capabilities: ClientContextCapabilitiesSchema.optional().meta({ ...Unrestricted6, ...ClientSafe }),
  /** Server-evaluated built-in segment dimensions (plan 279 PD-3). */
  builtin_dimensions: ClientContextBuiltinDimensionsSchema.optional().meta({ ...Unrestricted6, ...ClientSafe })
}).meta(
  { id: "ClientContext", "x-revturbine-schema-persistence": Transient6, "x-revturbine-schema-exposure": Internal5 }
);
var userContextPaths = {
  "/api/user-contexts": {
    get: operation({
      operationId: "listUserContexts",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List user contexts",
      tags: ["users"],
      responses: { "200": { description: "User context list", content: { "application/json": { schema: ListEnvelope(UserContextSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "user-contexts", persistence: { table: "userContexts", mode: "list" } }
    }),
    // Upsert by (tenant_id, user_id): the SDK identify/setUserContext path
    // writes the persisted context. The collection POST is the create-or-update
    // entry point — the route resolves the existing row by (tenant_id, user_id)
    // and applies an idempotent upsert (server-side, plan 74 TASK-4).
    post: operation({
      operationId: "createUserContext",
      summary: "Create or upsert a user context",
      tags: ["users"],
      requestBody: { required: true, content: { "application/json": { schema: UserContextSchema } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: UserContextSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "user-contexts", persistence: { table: "userContexts", mode: "create", uniqueBy: ["tenant_id", "user_id"] } }
    })
  },
  "/api/user-contexts/{userContextId}": {
    get: operation({
      operationId: "getUserContext",
      requestParams: { path: z9.object({ userContextId: z9.string() }) },
      summary: "Get user context",
      tags: ["users"],
      responses: { "200": { description: "User context", content: { "application/json": { schema: UserContextSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "user-contexts", persistence: { table: "userContexts", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateUserContext",
      requestParams: { path: z9.object({ userContextId: z9.string() }) },
      summary: "Update a user context",
      tags: ["users"],
      requestBody: { required: true, content: { "application/json": { schema: UserContextSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: UserContextSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "user-contexts", persistence: { table: "userContexts", mode: "update" } }
    }),
    // Delete path ships in v1 (plan 74 Q-1): a user context can be removed on
    // request now; full by-email DSR tooling remains deferred (sdk.md §8).
    delete: operation({
      operationId: "deleteUserContext",
      requestParams: { path: z9.object({ userContextId: z9.string() }) },
      summary: "Delete a user context",
      tags: ["users"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "user-contexts", persistence: { table: "userContexts", mode: "delete" } }
    })
  }
};

// scaffold/src/segments/models/schema.ts
import { z as z10 } from "zod";
var { Unrestricted: Unrestricted7 } = DataClassification;
var { Persisted: Persisted7, Transient: Transient7 } = SchemaPersistence;
var { Internal: Internal6 } = SchemaExposure;
var PLAYBOOK_SDK_FACETS4 = schemaFacets(SchemaContext.Playbook, { sdkInput: true });
var PENDING_PLAYBOOK_SDK_FACETS = schemaFacets(SchemaContext.Playbook, {
  inConfig: false,
  sdkInput: true
});
var DimensionCategorySchema = z10.enum(["default", "custom"]).meta(
  { id: "DimensionCategory", "x-revturbine-schema-persistence": Transient7, "x-revturbine-schema-exposure": Internal6 }
);
var DimensionSourceTypeSchema = z10.enum(["system", "sdk_trait", "sdk_trait_enum", "cdp_property", "manual_list"]).meta(
  { id: "DimensionSourceType", "x-revturbine-schema-persistence": Transient7, "x-revturbine-schema-exposure": Internal6 }
);
var SegmentDimensionSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z10.string().min(1).meta({ ...Unrestricted7, readOnly: true }),
  name: NameField.meta(Unrestricted7),
  // Plan 120 TASK-7: dimensions are customer-extensible (a custom dimension is
  // a named entity the user owns), so they resolve by handle like their peers.
  // Additive/nullable — existing rows are backfilled by the web migration and
  // tightened to notNull once every row carries one.
  handle: HandleField.optional().meta(Unrestricted7),
  category: DimensionCategorySchema.default("custom").meta(Unrestricted7),
  visibility_toggle: z10.boolean().default(true).meta(Unrestricted7),
  source_type: DimensionSourceTypeSchema.default("system").meta(Unrestricted7),
  estimated_size: z10.number().int().min(0).optional().meta(Unrestricted7)
}).meta(
  {
    id: "SegmentDimension",
    "x-revturbine-schema-persistence": Persisted7,
    "x-revturbine-schema-exposure": Internal6,
    ...PENDING_PLAYBOOK_SDK_FACETS,
    ...namedIdentity()
  }
);
var SegmentDimensionAnchorSchema = makeAnchor("SegmentDimensionAnchor");
var SegmentValueSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z10.string().min(1).meta({ ...Unrestricted7, readOnly: true }),
  dimension_id: z10.string().min(1).meta(Unrestricted7),
  name: NameField.meta(Unrestricted7),
  handle: HandleField.meta(Unrestricted7),
  description: DescriptionField.meta(Unrestricted7),
  definition_rule: z10.record(z10.string(), z10.unknown()).optional().meta(Unrestricted7),
  used_in_count: z10.number().int().min(0).default(0).meta({ ...Unrestricted7, readOnly: true })
}).meta(
  {
    id: "SegmentValue",
    "x-revturbine-schema-persistence": Persisted7,
    "x-revturbine-schema-exposure": Internal6,
    ...PENDING_PLAYBOOK_SDK_FACETS,
    ...namedIdentity()
  }
);
var SegmentValueAnchorSchema = makeAnchor("SegmentValueAnchor");
var SegmentSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z10.string().min(1).meta({ ...Unrestricted7, readOnly: true }),
  name: NameField.meta(Unrestricted7),
  handle: HandleField.meta(Unrestricted7),
  description: DescriptionField.meta(Unrestricted7),
  rules: z10.record(z10.string(), z10.unknown()).default({}).meta(Unrestricted7),
  /** Canonical experiment-handle reference for optional enrollment. */
  experiment_handle: z10.string().min(1).optional().meta(Unrestricted7),
  is_active: z10.boolean().default(true).meta(Unrestricted7),
  estimated_size: z10.number().int().min(0).nullable().default(null).meta(Unrestricted7),
  metadata: MetadataField.meta(Unrestricted7)
}).meta(
  {
    id: "Segment",
    "x-revturbine-schema-persistence": Persisted7,
    "x-revturbine-schema-exposure": Internal6,
    ...PLAYBOOK_SDK_FACETS4,
    ...namedIdentity()
  }
);
var segmentPaths = {
  "/api/segment-dimension-anchors": {
    get: operation({
      operationId: "listSegmentDimensionAnchors",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List segment dimension anchors (identity registry)",
      tags: ["segments"],
      responses: {
        "200": { description: "Segment dimension anchor list", content: { "application/json": { schema: ListEnvelope(SegmentDimensionAnchorSchema) } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "segment-dimension-anchors", persistence: { table: "segmentDimensions", mode: "list" } }
    })
  },
  "/api/segment-value-anchors": {
    get: operation({
      operationId: "listSegmentValueAnchors",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List segment value anchors (identity registry)",
      tags: ["segments"],
      responses: {
        "200": { description: "Segment value anchor list", content: { "application/json": { schema: ListEnvelope(SegmentValueAnchorSchema) } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "segment-value-anchors", persistence: { table: "segmentValues", mode: "list" } }
    })
  },
  "/api/segments": {
    get: operation({
      operationId: "listSegmentDimensions",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List segment dimensions",
      tags: ["segments"],
      responses: { "200": { description: "Dimension list", content: { "application/json": { schema: ListEnvelope(SegmentDimensionSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "segments", persistence: { table: "segmentDimensionVersions", mode: "list" } }
    })
  },
  "/api/segments/custom": {
    post: operation({
      operationId: "createCustomDimension",
      summary: "Create custom segment dimension",
      tags: ["segments"],
      requestBody: { required: true, content: { "application/json": { schema: z10.object({ name: z10.string(), description: z10.string().optional() }) } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: SegmentDimensionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "segments", persistence: { table: "segmentDimensionVersions", mode: "create" } }
    })
  },
  "/api/segments/{dimensionId}": {
    delete: operation({
      operationId: "deleteCustomDimension",
      requestParams: { path: z10.object({ dimensionId: z10.string() }) },
      summary: "Delete custom dimension",
      tags: ["segments"],
      responses: { "204": { description: "Deleted" }, default: { description: "Error", content: { "application/json": { schema: ErrorEnvelope } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "segments", persistence: { table: "segmentDimensionVersions", mode: "delete" } }
    })
  },
  "/api/segments/{dimensionId}/visibility": {
    patch: operation({
      operationId: "toggleDimensionVisibility",
      requestParams: { path: z10.object({ dimensionId: z10.string() }) },
      summary: "Toggle dimension visibility",
      tags: ["segments"],
      requestBody: { required: true, content: { "application/json": { schema: z10.object({ visible: z10.boolean() }) } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: SegmentDimensionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "segments", persistence: { table: "segmentDimensionVersions", mode: "update" } }
    })
  },
  "/api/segments/{dimensionId}/values": {
    get: operation({
      operationId: "listSegmentValues",
      requestParams: { path: z10.object({ dimensionId: z10.string() }), query: ListQueryParamsSchema },
      summary: "List segment values for dimension",
      tags: ["segments"],
      responses: { "200": { description: "Value list", content: { "application/json": { schema: ListEnvelope(SegmentValueSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "segment-values", persistence: { table: "segmentValueVersions", mode: "list" } }
    }),
    post: operation({
      operationId: "createSegmentValue",
      requestParams: { path: z10.object({ dimensionId: z10.string() }) },
      summary: "Create segment value",
      tags: ["segments"],
      requestBody: { required: true, content: { "application/json": { schema: z10.object({ name: z10.string(), handle: z10.string(), definition_rule: z10.record(z10.string(), z10.unknown()).optional() }) } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: SegmentValueSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "segment-values", persistence: { table: "segmentValueVersions", mode: "create" } }
    })
  },
  "/api/segment-values/{valueId}": {
    patch: operation({
      operationId: "updateSegmentValue",
      requestParams: { path: z10.object({ valueId: z10.string() }) },
      summary: "Update segment value",
      tags: ["segments"],
      requestBody: { required: true, content: { "application/json": { schema: z10.object({ name: z10.string().optional(), definition_rule: z10.record(z10.string(), z10.unknown()).optional() }) } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: SegmentValueSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "segment-values", persistence: { table: "segmentValueVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteSegmentValue",
      requestParams: { path: z10.object({ valueId: z10.string() }) },
      summary: "Delete segment value",
      tags: ["segments"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "segment-values", persistence: { table: "segmentValueVersions", mode: "delete" } }
    })
  }
};

// scaffold/src/content/models/schema.ts
import { z as z11 } from "zod";
var { Unrestricted: Unrestricted8 } = DataClassification;
var { Persisted: Persisted8, Transient: Transient8 } = SchemaPersistence;
var { External: External6 } = SchemaExposure;
var PLAYBOOK_SDK_FACETS5 = schemaFacets(SchemaContext.Playbook, { sdkInput: true });
var PENDING_PLAYBOOK_FACETS3 = schemaFacets(SchemaContext.Playbook, {
  inConfig: false,
  sdkInput: false
});
var EMBEDDED_PLAYBOOK_SDK_FACETS2 = schemaFacets(SchemaContext.Playbook, {
  inConfig: false,
  sdkInput: true
});
var PLAYBOOK_VOCABULARY_FACETS = schemaFacets(SchemaContext.Playbook, {
  inConfig: false,
  sdkInput: true,
  source: SchemaSource.CodeConstant
});
var MessageSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z11.string().min(1).meta({ ...Unrestricted8, readOnly: true }),
  handle: HandleField.meta({ ...Unrestricted8, readOnly: true }),
  name: NameField.meta(Unrestricted8),
  channel: z11.enum(["in_app", "email", "push", "sms", "webhook"]).meta(Unrestricted8),
  subject: z11.string().max(500).optional().meta(Unrestricted8),
  body: z11.string().meta(Unrestricted8),
  template_variables: z11.array(z11.string()).default([]).meta(Unrestricted8),
  metadata: MetadataField.meta(Unrestricted8)
}).meta(
  { id: "Message", "x-revturbine-schema-persistence": Persisted8, "x-revturbine-schema-exposure": External6, ...PENDING_PLAYBOOK_FACETS3, ...mintedIdentity() }
);
var CtaPathSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z11.string().min(1).meta({ ...Unrestricted8, readOnly: true }),
  name: NameField.meta(Unrestricted8),
  handle: HandleField.meta(Unrestricted8),
  action_type: CtaActionTypeSchema.meta(Unrestricted8),
  target_url: z11.string().optional().meta(Unrestricted8),
  target_plan_id: z11.string().optional().meta(Unrestricted8),
  config_fields: z11.record(z11.string(), z11.unknown()).default({}).meta(Unrestricted8),
  metadata: MetadataField.meta(Unrestricted8)
}).meta(
  { id: "CtaPath", "x-revturbine-schema-persistence": Persisted8, "x-revturbine-schema-exposure": External6, ...PLAYBOOK_SDK_FACETS5, ...namedIdentity() }
);
var CtaPathAnchorSchema = makeAnchor("CtaPathAnchor");
var TemplateFieldTypeSchema = z11.enum([
  "header",
  "body",
  "secondary_body",
  "message",
  "cta_label",
  "secondary_label",
  "image",
  "toggle",
  "duration",
  "send_delay",
  "entitlement",
  "plan",
  "dropdown",
  "json"
]).meta(
  { id: "TemplateFieldType", "x-revturbine-schema-persistence": Persisted8, "x-revturbine-schema-exposure": External6, ...PLAYBOOK_VOCABULARY_FACETS }
);
var FieldDefinitionSchema = z11.object({
  name: z11.string().min(1),
  field_type: TemplateFieldTypeSchema,
  required: z11.boolean().default(false),
  default_value: z11.unknown().optional(),
  // Authoring-only metadata (plan 76 TASK-9). Drives the Content Studio
  // surface-template editor: `order` sets the explicit display sequence (the
  // implicit array order stays the fallback) and `help_text` is editor
  // guidance. Neither enters the runtime bundle — SurfaceTemplateField stays
  // {name, type, required}, mirroring how `default_value` is DB-only too.
  order: z11.number().int().min(0).optional(),
  help_text: z11.string().max(500).optional()
}).meta(
  { id: "FieldDefinition", "x-revturbine-schema-persistence": Persisted8, "x-revturbine-schema-exposure": External6, ...EMBEDDED_PLAYBOOK_SDK_FACETS2 }
);
var SurfaceTemplateSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z11.string().min(1).meta({ ...Unrestricted8, readOnly: true }),
  name: NameField.meta(Unrestricted8),
  handle: HandleField.meta(Unrestricted8),
  surface_type: z11.union([ComponentTypeSchema, DefaultTemplateIdsSchema]).meta(Unrestricted8),
  field_definitions: z11.array(FieldDefinitionSchema).default([]).meta(Unrestricted8),
  description: DescriptionField.meta(Unrestricted8)
}).meta(
  { id: "SurfaceTemplate", "x-revturbine-schema-persistence": Persisted8, "x-revturbine-schema-exposure": External6, ...PLAYBOOK_SDK_FACETS5, ...namedIdentity() }
);
var SurfaceTemplateAnchorSchema = makeAnchor("SurfaceTemplateAnchor");
var MessageBlockRecordSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z11.string().min(1).meta({ ...Unrestricted8, readOnly: true }),
  name: NameField.meta(Unrestricted8),
  handle: HandleField.meta(Unrestricted8),
  content_fields: z11.record(z11.string(), z11.unknown()).default({}).meta(Unrestricted8),
  variation_dimension_id: z11.string().optional().meta(Unrestricted8),
  variation_values: z11.array(z11.object({
    segment_value_id: z11.string(),
    content_fields_override: z11.record(z11.string(), z11.unknown())
  })).optional().meta(Unrestricted8),
  notes: z11.string().max(1e3).optional().meta(Unrestricted8),
  used_in_count: z11.number().int().min(0).default(0).meta({ ...Unrestricted8, readOnly: true })
}).meta(
  { id: "MessageBlockRecord", "x-revturbine-schema-persistence": Persisted8, "x-revturbine-schema-exposure": External6, ...PLAYBOOK_SDK_FACETS5, ...namedIdentity() }
);
var MessageBlockRecordAnchorSchema = makeAnchor("MessageBlockRecordAnchor");
var ContentPayloadSegmentEntrySchema = z11.object({
  segment_id: z11.string().min(1).meta(Unrestricted8),
  message_block_id: z11.string().min(1).meta(Unrestricted8),
  ui_path_id: z11.string().optional().meta(Unrestricted8),
  promotion_id: z11.string().optional().meta(Unrestricted8)
}).meta(
  { id: "ContentPayloadSegmentEntry", "x-revturbine-schema-persistence": Transient8, "x-revturbine-schema-exposure": External6 }
);
var ContentPlacementPayloadSchema = z11.object({
  payload_id: z11.string().min(1).meta(Unrestricted8),
  tenant_id: z11.string().min(1).meta(Unrestricted8),
  name: NameField.meta(Unrestricted8),
  surface_template_id: z11.string().min(1).meta(Unrestricted8),
  default_message_block_id: z11.string().min(1).meta(Unrestricted8),
  segment_content_map: z11.array(ContentPayloadSegmentEntrySchema).optional().meta(Unrestricted8),
  ui_path_id: z11.string().optional().meta(Unrestricted8),
  promotion_id: z11.string().optional().meta(Unrestricted8),
  status: z11.enum(["draft", "active", "inactive"]).meta(Unrestricted8),
  created_at: z11.string().datetime().optional().meta({ ...Unrestricted8, readOnly: true }),
  updated_at: z11.string().datetime().optional().meta({ ...Unrestricted8, readOnly: true })
}).meta(
  { id: "ContentPlacementPayload", "x-revturbine-schema-persistence": Transient8, "x-revturbine-schema-exposure": External6 }
);
var contentPaths = {
  "/api/surface-template-anchors": {
    get: operation({
      operationId: "listSurfaceTemplateAnchors",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List surface template anchors (identity registry)",
      tags: ["content"],
      responses: {
        "200": { description: "Surface template anchor list", content: { "application/json": { schema: ListEnvelope(SurfaceTemplateAnchorSchema) } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "surface-template-anchors", persistence: { table: "surfaceTemplates", mode: "list" } }
    })
  },
  "/api/surface-templates": {
    get: operation({
      operationId: "listSurfaceTemplates",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List surface templates",
      tags: ["content"],
      responses: { "200": { description: "Template list", content: { "application/json": { schema: ListEnvelope(SurfaceTemplateSchema) } } } },
      "x-revturbine-operation": { exposure: "external", resource: "surface-templates", persistence: { table: "surfaceTemplateVersions", mode: "list" } }
    }),
    post: operation({
      operationId: "createSurfaceTemplate",
      summary: "Create surface template",
      tags: ["content"],
      requestBody: { required: true, content: { "application/json": { schema: SurfaceTemplateSchema } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: SurfaceTemplateSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "surface-templates", persistence: { table: "surfaceTemplateVersions", mode: "create" } }
    })
  },
  "/api/message-block-record-anchors": {
    get: operation({
      operationId: "listMessageBlockRecordAnchors",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List message block anchors (identity registry)",
      tags: ["content"],
      responses: {
        "200": { description: "Message block anchor list", content: { "application/json": { schema: ListEnvelope(MessageBlockRecordAnchorSchema) } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "message-block-record-anchors", persistence: { table: "messageBlocks", mode: "list" } }
    })
  },
  "/api/messages": {
    get: operation({
      operationId: "listMessageBlocks",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List message blocks",
      tags: ["content"],
      responses: { "200": { description: "Message block list", content: { "application/json": { schema: ListEnvelope(MessageBlockRecordSchema) } } } },
      "x-revturbine-operation": { exposure: "external", resource: "message-blocks", persistence: { table: "messageBlockVersions", mode: "list" } }
    }),
    post: operation({
      operationId: "createMessageBlock",
      summary: "Create message block",
      tags: ["content"],
      requestBody: { required: true, content: { "application/json": { schema: MessageBlockRecordSchema } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: MessageBlockRecordSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "message-blocks", persistence: { table: "messageBlockVersions", mode: "create" } }
    })
  },
  "/api/cta-path-anchors": {
    get: operation({
      operationId: "listCtaPathAnchors",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List CTA path anchors (identity registry)",
      tags: ["content"],
      responses: {
        "200": { description: "CTA path anchor list", content: { "application/json": { schema: ListEnvelope(CtaPathAnchorSchema) } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "cta-path-anchors", persistence: { table: "ctaPaths", mode: "list" } }
    })
  },
  "/api/cta-paths": {
    get: operation({
      operationId: "listCtaPaths",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List CTA paths",
      tags: ["content"],
      responses: { "200": { description: "CTA path list", content: { "application/json": { schema: ListEnvelope(CtaPathSchema) } } } },
      "x-revturbine-operation": { exposure: "external", resource: "cta-paths", persistence: { table: "ctaPathVersions", mode: "list" } }
    }),
    post: operation({
      operationId: "createCtaPath",
      summary: "Create custom CTA path",
      tags: ["content"],
      requestBody: { required: true, content: { "application/json": { schema: CtaPathSchema } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: CtaPathSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "cta-paths", persistence: { table: "ctaPathVersions", mode: "create" } }
    })
  }
};

// scaffold/src/ui/models/schema.ts
import { z as z12 } from "zod";
var { Unrestricted: Unrestricted9, Pii: Pii3 } = DataClassification;
var { Persisted: Persisted9, Transient: Transient9 } = SchemaPersistence;
var { Internal: Internal7, External: External7 } = SchemaExposure;
var BRANDING_FACETS = schemaFacets(SchemaContext.Branding, { sdkInput: false });
var ThemeSchema = z12.object({
  id: z12.string().min(1).meta({ ...Unrestricted9, readOnly: true }),
  name: z12.string().min(1).max(120).meta(Unrestricted9),
  mode: z12.enum(["light", "dark", "system"]).default("system").meta(Unrestricted9),
  tokens: z12.record(z12.string(), z12.string()).default({}).meta(Unrestricted9)
}).meta(
  {
    id: "Theme",
    "x-revturbine-schema-persistence": Persisted9,
    "x-revturbine-schema-exposure": External7,
    ...BRANDING_FACETS
  }
);
var UiPreferenceSchema = IdField.merge(TimestampFields).extend({
  user_id: z12.string().min(1).meta(Pii3),
  scope: z12.string().min(1).meta(Unrestricted9),
  preferences: z12.record(z12.string(), z12.unknown()).default({}).meta(Unrestricted9)
}).meta(
  {
    id: "UiPreference",
    "x-revturbine-schema-persistence": Persisted9,
    "x-revturbine-schema-exposure": Internal7
  }
);
var uiPreferencePaths = {
  "/api/ui-preferences": {
    get: operation({
      operationId: "listUiPreferences",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List UI preferences",
      tags: ["ui"],
      responses: {
        "200": {
          description: "UI preferences list response",
          content: { "application/json": { schema: ListEnvelope(UiPreferenceSchema) } }
        }
      },
      "x-revturbine-operation": {
        exposure: "internal",
        resource: "ui-preferences",
        persistence: { table: "uiPreferences", mode: "list" }
      }
    }),
    put: operation({
      operationId: "upsertUiPreferences",
      summary: "Upsert UI preferences",
      tags: ["ui"],
      requestBody: {
        required: true,
        content: { "application/json": { schema: z12.array(toWritableSchema(UiPreferenceSchema)) } }
      },
      responses: {
        "200": {
          description: "UI preferences upsert response",
          content: { "application/json": { schema: z12.object({ updated: z12.number().int().min(0) }) } }
        }
      },
      "x-revturbine-operation": {
        exposure: "internal",
        resource: "ui-preferences",
        persistence: { table: "uiPreferences", mode: "upsert", writeSchema: "UiPreferenceSchema#writable" }
      }
    })
  }
};

// scaffold/src/analytics/models/schema.ts
import { z as z13 } from "zod";
var { Unrestricted: Unrestricted10, Financial: Financial3 } = DataClassification;
var { Persisted: Persisted10, Transient: Transient10 } = SchemaPersistence;
var { External: External8, Internal: Internal8 } = SchemaExposure;
var CohortMonthSchema = z13.object({
  month: z13.string().meta(Unrestricted10),
  cohort_size: z13.number().int().min(0).meta(Unrestricted10),
  retained: z13.number().int().min(0).meta(Unrestricted10),
  retention_rate: z13.number().min(0).max(1).meta(Unrestricted10),
  revenue_cents: z13.number().int().min(0).meta(Financial3)
}).meta(
  { id: "CohortMonth", "x-revturbine-schema-persistence": Transient10, "x-revturbine-schema-exposure": External8 }
);
var FunnelStepSchema = z13.object({
  step: z13.string().meta(Unrestricted10),
  label: z13.string().meta(Unrestricted10),
  count: z13.number().int().min(0).meta(Unrestricted10),
  conversion_rate: z13.number().min(0).max(1).meta(Unrestricted10),
  drop_off_rate: z13.number().min(0).max(1).meta(Unrestricted10)
}).meta(
  { id: "FunnelStep", "x-revturbine-schema-persistence": Transient10, "x-revturbine-schema-exposure": External8 }
);
var PlacementPerformanceRowSchema = z13.object({
  placement_id: z13.string().meta(Unrestricted10),
  placement_name: z13.string().meta(Unrestricted10),
  impressions: z13.number().int().min(0).meta(Unrestricted10),
  clicks: z13.number().int().min(0).meta(Unrestricted10),
  conversions: z13.number().int().min(0).meta(Unrestricted10),
  ctr: z13.number().min(0).meta(Unrestricted10),
  conversion_rate: z13.number().min(0).meta(Unrestricted10),
  revenue_cents: z13.number().int().min(0).meta(Financial3)
}).meta(
  { id: "PlacementPerformanceRow", "x-revturbine-schema-persistence": Transient10, "x-revturbine-schema-exposure": External8 }
);
var RevenueMetricSchema = z13.object({
  date: z13.string().meta(Unrestricted10),
  mrr_cents: z13.number().int().min(0).meta(Financial3),
  arr_cents: z13.number().int().min(0).meta(Financial3),
  new_mrr_cents: z13.number().int().min(0).meta(Financial3),
  churned_mrr_cents: z13.number().int().min(0).meta(Financial3),
  expansion_mrr_cents: z13.number().int().min(0).meta(Financial3),
  net_new_mrr_cents: z13.number().int().meta(Financial3)
}).meta(
  { id: "RevenueMetric", "x-revturbine-schema-persistence": Transient10, "x-revturbine-schema-exposure": External8 }
);
var KpiAggregateSchema = z13.object({
  metric_key: z13.string().min(1).meta(Unrestricted10),
  label: z13.string().meta(Unrestricted10),
  current_value: z13.number().meta(Financial3),
  previous_value: z13.number().nullable().default(null).meta(Financial3),
  change_percent: z13.number().nullable().default(null).meta(Unrestricted10),
  period: z13.string().meta(Unrestricted10),
  unit: z13.enum(["count", "cents", "percent", "ratio", "seconds"]).default("count").meta(Unrestricted10)
}).meta(
  { id: "KpiAggregate", "x-revturbine-schema-persistence": Transient10, "x-revturbine-schema-exposure": External8 }
);
var DriftReportSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  report_type: z13.enum(["plan_drift", "entitlement_drift", "usage_anomaly", "revenue_anomaly"]).meta(Unrestricted10),
  severity: SeveritySchema.meta(Unrestricted10),
  resource_type: z13.string().min(1).meta(Unrestricted10),
  resource_id: z13.string().min(1).meta(Unrestricted10),
  summary: z13.string().max(1e3).meta(Unrestricted10),
  expected_value: z13.unknown().optional().meta(Unrestricted10),
  actual_value: z13.unknown().optional().meta(Unrestricted10),
  affected_customer_count: z13.number().int().min(0).default(0).meta(Unrestricted10),
  is_resolved: z13.boolean().default(false).meta(Unrestricted10),
  resolved_at: NullableDatetimeField.meta(Unrestricted10),
  metadata: MetadataField.meta(Unrestricted10)
}).meta(
  { id: "DriftReport", "x-revturbine-schema-persistence": Persisted10, "x-revturbine-schema-exposure": Internal8 }
);
var AlertSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  alert_type: z13.enum(["usage_threshold", "revenue_drop", "conversion_drop", "experiment_significance", "drift_detected", "custom"]).meta(Unrestricted10),
  severity: SeveritySchema.meta(Unrestricted10),
  title: z13.string().min(1).max(300).meta(Unrestricted10),
  description: z13.string().max(2e3).meta(Unrestricted10),
  resource_type: z13.string().optional().meta(Unrestricted10),
  resource_id: z13.string().optional().meta(Unrestricted10),
  is_acknowledged: z13.boolean().default(false).meta(Unrestricted10),
  acknowledged_at: NullableDatetimeField.meta(Unrestricted10),
  acknowledged_by: z13.string().nullable().default(null).meta(Unrestricted10),
  metadata: MetadataField.meta(Unrestricted10)
}).meta(
  { id: "Alert", "x-revturbine-schema-persistence": Persisted10, "x-revturbine-schema-exposure": Internal8 }
);
var analyticsPaths = {
  "/api/analytics/kpis": {
    get: operation({
      operationId: "listKpiAggregates",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List KPI aggregate metrics",
      tags: ["analytics"],
      responses: { "200": { description: "KPI list", content: { "application/json": { schema: ListEnvelope(KpiAggregateSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "analytics", persistence: { table: "kpiAggregates", mode: "list" } }
    })
  },
  "/api/analytics/placement-performance": {
    get: operation({
      operationId: "listPlacementPerformance",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List placement performance rows",
      tags: ["analytics"],
      responses: { "200": { description: "Performance rows", content: { "application/json": { schema: ListEnvelope(PlacementPerformanceRowSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "analytics", persistence: { table: "placementPerformance", mode: "list" } }
    })
  },
  "/api/analytics/revenue": {
    get: operation({
      operationId: "listRevenueMetrics",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List revenue metrics over time",
      tags: ["analytics"],
      responses: { "200": { description: "Revenue metrics", content: { "application/json": { schema: ListEnvelope(RevenueMetricSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "analytics", persistence: { table: "revenueMetrics", mode: "list" } }
    })
  },
  "/api/analytics/cohorts": {
    get: operation({
      operationId: "listCohortMetrics",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List cohort retention metrics",
      tags: ["analytics"],
      responses: { "200": { description: "Cohort metrics", content: { "application/json": { schema: ListEnvelope(CohortMonthSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "analytics", persistence: { table: "cohortMetrics", mode: "list" } }
    })
  },
  "/api/analytics/funnels": {
    get: operation({
      operationId: "listFunnelSteps",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List funnel step metrics",
      tags: ["analytics"],
      responses: { "200": { description: "Funnel steps", content: { "application/json": { schema: ListEnvelope(FunnelStepSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "analytics", persistence: { table: "funnelSteps", mode: "list" } }
    })
  },
  "/api/analytics/drift-reports": {
    get: operation({
      operationId: "listDriftReports",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List drift reports",
      tags: ["analytics"],
      responses: { "200": { description: "Drift reports", content: { "application/json": { schema: ListEnvelope(DriftReportSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "analytics", persistence: { table: "driftReports", mode: "list" } }
    })
  },
  "/api/analytics/drift-reports/{reportId}/resolve": {
    post: operation({
      operationId: "resolveDriftReport",
      requestParams: { path: z13.object({ reportId: z13.string() }) },
      summary: "Mark a drift report as resolved",
      tags: ["analytics"],
      responses: { "200": { description: "Resolved", content: { "application/json": { schema: DriftReportSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "analytics", persistence: { table: "driftReports", mode: "update" } }
    })
  },
  "/api/analytics/alerts": {
    get: operation({
      operationId: "listAlerts",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List alerts",
      tags: ["analytics"],
      responses: { "200": { description: "Alert list", content: { "application/json": { schema: ListEnvelope(AlertSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "analytics", persistence: { table: "alerts", mode: "list" } }
    })
  },
  "/api/analytics/alerts/{alertId}/acknowledge": {
    post: operation({
      operationId: "acknowledgeAlert",
      requestParams: { path: z13.object({ alertId: z13.string() }) },
      summary: "Acknowledge an alert",
      tags: ["analytics"],
      responses: { "200": { description: "Acknowledged", content: { "application/json": { schema: AlertSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "analytics", persistence: { table: "alerts", mode: "update" } }
    })
  }
};

// scaffold/src/analytics/models/view-schema.ts
import { z as z14 } from "zod";
var { Unrestricted: Unrestricted11 } = DataClassification;
var { Transient: Transient11 } = SchemaPersistence;
var { Internal: Internal9 } = SchemaExposure;
var meta = (id) => ({
  id,
  "x-revturbine-schema-persistence": Transient11,
  "x-revturbine-schema-exposure": Internal9
});
var SEMANTIC_ID_PATTERN = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
var VIEW_ELEMENT_ID_PATTERN = /^[a-z][a-z0-9_-]{0,99}$/;
var SemanticIdField = z14.string().regex(SEMANTIC_ID_PATTERN).max(120);
var ElementIdField = z14.string().regex(VIEW_ELEMENT_ID_PATTERN);
var AnalyticsSemanticIdSchema = SemanticIdField.meta(meta("AnalyticsSemanticId"));
var AnalyticsAnalyticalUnitSchema = z14.enum(["account", "user", "billing_unit", "organization"]).meta(meta("AnalyticsAnalyticalUnit"));
var AnalyticsQueryFamilySchema = z14.enum(["scalar", "timeseries", "breakdown", "funnel", "table", "timeline"]).meta(meta("AnalyticsQueryFamily"));
var AnalyticsSourceScopeSchema = z14.enum(["total", "revturbine_tracked", "revturbine_influenced"]).meta(meta("AnalyticsSourceScope"));
var AnalyticsHistoricalModeSchema = z14.enum(["as_of_event", "current"]).meta(meta("AnalyticsHistoricalMode"));
var AnalyticsTimeGrainSchema = z14.enum(["hour", "day", "week", "month", "quarter"]).meta(meta("AnalyticsTimeGrain"));
var ANALYTICS_PERIOD_COMPARE_MODES = ["none", "previous_period", "previous_year", "custom_period"];
var AnalyticsPeriodCompareModeSchema = z14.enum(ANALYTICS_PERIOD_COMPARE_MODES).meta(meta("AnalyticsPeriodCompareMode"));
var AnalyticsCompareModeSchema = z14.enum([...ANALYTICS_PERIOD_COMPARE_MODES, "segment", "variant", "scope", "intervention"]).meta(meta("AnalyticsCompareMode"));
var AnalyticsCompareDeltaSchema = z14.enum(["absolute", "percentage"]).meta(meta("AnalyticsCompareDelta"));
var AnalyticsFilterOperatorSchema = z14.enum(["eq", "neq", "in", "not_in", "between", "gte", "lte", "is_null", "is_not_null", "contains"]).meta(meta("AnalyticsFilterOperator"));
var AnalyticsFilterControlSchema = z14.enum(["date_range", "single_select", "multi_select", "search_select", "number_range", "entity_picker", "toggle"]).meta(meta("AnalyticsFilterControl"));
var AnalyticsCardinalityClassSchema = z14.enum(["low", "medium", "high"]).meta(meta("AnalyticsCardinalityClass"));
var AnalyticsFieldTypeSchema = z14.enum(["string", "number", "currency", "percent", "date", "datetime", "boolean"]).meta(meta("AnalyticsFieldType"));
var AnalyticsMetricDirectionSchema = z14.enum(["increase", "decrease", "neutral"]).meta(meta("AnalyticsMetricDirection"));
var AnalyticsMetricStatisticalTypeSchema = z14.enum(["binary", "count", "continuous", "ratio", "revenue"]).meta(meta("AnalyticsMetricStatisticalType"));
var AnalyticsMetricAggregationSemanticsSchema = z14.enum(["additive", "semi_additive", "non_additive"]).meta(meta("AnalyticsMetricAggregationSemantics"));
var AnalyticsDimensionTypeSchema = z14.enum(["string", "number", "boolean", "date", "datetime", "id", "enum"]).meta(meta("AnalyticsDimensionType"));
var AnalyticsDimensionCapabilitySchema = z14.enum(["filter", "group", "split", "sort"]).meta(meta("AnalyticsDimensionCapability"));
var AnalyticsViewVisibilitySchema = z14.enum(["private", "team", "tenant"]).meta(meta("AnalyticsViewVisibility"));
var AnalyticsCustomizationCapabilitySchema = z14.enum([
  "title",
  "filter_defaults",
  "metric_selection",
  "grouping",
  "compatible_renderer",
  "sort",
  "limit",
  "block_visibility",
  "layout",
  "source_scope",
  "handoff_target",
  "hidden_scope",
  "raw_expression",
  // Chart-driven cross-filtering is author-wired and OFF by default: a
  // view offers filter-to/exclude gestures only when its policy allows
  // this capability (plan 218 REQ-5/REQ-12).
  "cross_filter"
]).meta(meta("AnalyticsCustomizationCapability"));
var AnalyticsClassificationSchema = z14.enum(["unrestricted", "pii", "financial", "operational"]).meta(meta("AnalyticsClassification"));
var LocalizedTextSchema = z14.strictObject({
  value: z14.string().min(1).max(300).meta(Unrestricted11),
  key: z14.string().max(120).optional().meta(Unrestricted11)
}).meta(meta("LocalizedText"));
var FilterScalar = z14.union([z14.string().max(200), z14.number(), z14.boolean(), z14.null()]);
var AnalyticsFilterValueSchema = z14.union([
  FilterScalar,
  z14.array(FilterScalar).max(100),
  z14.strictObject({
    preset: z14.string().regex(/^[a-z0-9_]{1,20}$/).meta(Unrestricted11),
    compare: AnalyticsPeriodCompareModeSchema.optional().meta(Unrestricted11),
    // `custom_period` comparisons carry their own ISO-date window. Optional
    // and absent otherwise, so pre-existing documents keep their canonical
    // bytes (and therefore their content hashes) unchanged.
    compare_start: z14.string().date().optional().meta(Unrestricted11),
    compare_end: z14.string().date().optional().meta(Unrestricted11)
  }),
  z14.strictObject({
    min: z14.number().optional().meta(Unrestricted11),
    max: z14.number().optional().meta(Unrestricted11)
  }),
  z14.strictObject({
    type: z14.literal("date_range").meta(Unrestricted11),
    start: z14.string().date().meta(Unrestricted11),
    end: z14.string().date().meta(Unrestricted11)
  })
]).meta(meta("AnalyticsFilterValue"));
var ANALYTICS_DATE_RANGE_FILTER_VALUE_TYPE = "date_range";
function isAnalyticsDateRangeFilterValue(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) && value.type === ANALYTICS_DATE_RANGE_FILTER_VALUE_TYPE;
}
var ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
function isLegacyDateRangeArray(value) {
  return Array.isArray(value) && value.length === 2 && typeof value[0] === "string" && typeof value[1] === "string" && ISO_DATE_PATTERN.test(value[0]) && ISO_DATE_PATTERN.test(value[1]);
}
var AnalyticsSemanticFilterSchema = z14.strictObject({
  dimension: SemanticIdField.meta(Unrestricted11),
  operator: AnalyticsFilterOperatorSchema.meta(Unrestricted11),
  value: AnalyticsFilterValueSchema.optional().meta(Unrestricted11)
}).meta(meta("AnalyticsSemanticFilter"));
var AnalyticsCompareSegmentSchema = z14.strictObject({
  dimension: SemanticIdField.meta(Unrestricted11),
  baseline: FilterScalar.meta(Unrestricted11),
  against: FilterScalar.meta(Unrestricted11)
}).meta(meta("AnalyticsCompareSegment"));
var AnalyticsCompareExperimentSchema = z14.strictObject({
  experiment: z14.string().min(1).max(100).meta(Unrestricted11),
  baseline: z14.string().min(1).max(100).optional().meta(Unrestricted11),
  against: z14.string().min(1).max(100).optional().meta(Unrestricted11)
}).meta(meta("AnalyticsCompareExperiment"));
var AnalyticsFormatSpecSchema = z14.strictObject({
  type: z14.enum(["number", "currency", "percent", "duration"]).meta(Unrestricted11),
  decimals: z14.number().int().min(0).max(6).optional().meta(Unrestricted11),
  compact: z14.boolean().optional().meta(Unrestricted11)
}).meta(meta("AnalyticsFormatSpec"));
var AnalyticsSafeChartOptionsSchema = z14.strictObject({
  legend: z14.enum(["none", "top", "right", "bottom", "left"]).optional().meta(Unrestricted11),
  value_labels: z14.boolean().optional().meta(Unrestricted11),
  reference_lines: z14.array(z14.strictObject({
    value: z14.number().meta(Unrestricted11),
    label: LocalizedTextSchema.optional().meta(Unrestricted11)
  })).max(5).optional().meta(Unrestricted11),
  x_axis_format: AnalyticsFormatSpecSchema.optional().meta(Unrestricted11),
  y_axis_format: AnalyticsFormatSpecSchema.optional().meta(Unrestricted11),
  empty_state: z14.enum(["blank", "message"]).optional().meta(Unrestricted11)
}).meta(meta("AnalyticsSafeChartOptions"));
var CatalogDeprecation = z14.object({
  deprecated: z14.boolean().meta(Unrestricted11),
  replaced_by: SemanticIdField.optional().meta(Unrestricted11)
}).meta(meta("AnalyticsCatalogDeprecation"));
var AnalyticsCatalogDeprecationSchema = CatalogDeprecation;
var AnalyticsCatalogDimensionSchema = z14.object({
  id: SemanticIdField.meta(Unrestricted11),
  label: z14.string().min(1).max(120).meta(Unrestricted11),
  description: z14.string().max(500).optional().meta(Unrestricted11),
  when_to_use: z14.string().max(500).optional().meta(Unrestricted11),
  do_not_use_for: z14.string().max(500).optional().meta(Unrestricted11),
  type: AnalyticsDimensionTypeSchema.meta(Unrestricted11),
  operators: z14.array(AnalyticsFilterOperatorSchema).min(1).meta(Unrestricted11),
  control: AnalyticsFilterControlSchema.meta(Unrestricted11),
  capabilities: z14.array(AnalyticsDimensionCapabilitySchema).min(1).meta(Unrestricted11),
  cardinality: AnalyticsCardinalityClassSchema.meta(Unrestricted11),
  classification: AnalyticsClassificationSchema.default("unrestricted").meta(Unrestricted11),
  historical_mode: AnalyticsHistoricalModeSchema.optional().meta(Unrestricted11),
  allowed_concepts: z14.array(SemanticIdField).optional().meta(Unrestricted11),
  exclude_from_segment_picker: z14.boolean().default(false).meta(Unrestricted11),
  deprecation: CatalogDeprecation.optional().meta(Unrestricted11)
}).meta(meta("AnalyticsCatalogDimension"));
var AnalyticsMetricDerivationKindSchema = z14.enum(["derived", "observed", "unavailable"]).meta(meta("AnalyticsMetricDerivationKind"));
var AnalyticsIngestedInputOriginSchema = z14.enum(["platform", "customer_authored", "mixed", "none"]).meta(meta("AnalyticsIngestedInputOrigin"));
var IngestedEventName = z14.string().regex(/^[a-z][a-z0-9_]*$/).max(120);
var IngestedDatasourceName = z14.string().regex(/^[a-z][a-z0-9_]*$/).max(120);
var AnalyticsMetricDerivationSchema = z14.object({
  input_origin: AnalyticsIngestedInputOriginSchema.meta(Unrestricted11),
  /**
   * Ingested EVENT names this metric is computed from. Cross-checked
   * against the platform event taxonomy when `input_origin` is `platform`,
   * which is what turns a typo or a retired name into a failed check.
   */
  ingested_events: z14.array(IngestedEventName).max(20).meta(Unrestricted11),
  /**
   * Non-clickstream inputs — Tinybird datasources or control-plane tables.
   * Some products are computed from rows rather than events
   * (`placement_presentations`, `events_billing`, experiment results).
   */
  ingested_datasources: z14.array(IngestedDatasourceName).max(20).optional().meta(Unrestricted11),
  /**
   * Pipes that CARRY this metric (plan 228 REQ-4/TASK-3): the base pipe
   * names whose output includes it — simulation-family twins are implied,
   * never listed. This is what lets the web project DERIVE each pipe's
   * metric allowlist from the registry instead of hand-typing an IN-list
   * the contract tests then parse back out of the SQL. Empty means not
   * pipe-carried (Postgres-backed executors, or nothing at all).
   */
  carried_by: z14.array(z14.string().regex(/^[a-z][a-z0-9_]*$/).max(120)).max(10).optional().meta(Unrestricted11),
  /**
   * Required when `kind` is `unavailable`: the real blocker, so the gap is
   * reviewable. Optional elsewhere for caveats worth carrying.
   */
  note: z14.string().max(600).optional().meta(Unrestricted11)
}).meta(meta("AnalyticsMetricDerivation"));
var AnalyticsMetricLayerSchema = z14.enum(["primitive", "derived"]).meta(meta("AnalyticsMetricLayer"));
var AnalyticsCatalogStatusSchema = z14.enum(["declared", "bound", "validated", "tested", "unavailable"]).meta(meta("AnalyticsCatalogStatus"));
var AnalyticsFactKindSchema = z14.enum(["transaction", "periodic_snapshot", "accumulating_snapshot"]).meta(meta("AnalyticsFactKind"));
var AnalyticsConceptProducerSchema = z14.enum(["platform", "customer_authored", "simulation"]).meta(meta("AnalyticsConceptProducer"));
var AnalyticsRecordDedupSchema = z14.enum(["deduplicated_on_record_id", "summed_on_sorting_key", "append_only", "upsert_on_primary_key", "recomputed_at_query", "unknown"]).meta(meta("AnalyticsRecordDedup"));
var AnalyticsRecordRevisionSchema = z14.enum(["immutable", "re_emit_higher_version", "in_place_update", "recomputed_from_source", "unknown"]).meta(meta("AnalyticsRecordRevision"));
var AnalyticsRecordLateArrivalSchema = z14.enum(["accepted", "accepted_within_retention", "rejected", "unknown"]).meta(meta("AnalyticsRecordLateArrival"));
var AnalyticsRecordContractSchema = z14.object({
  /** The columns whose tuple is the stable record id. Identity resolution is never part of it (R2). */
  record_id: z14.array(z14.string().min(1).max(120)).min(1).max(8).meta(Unrestricted11),
  /** Where the rows come from: `stripe`, `sdk_clickstream`, `revturbine_control_plane`. */
  source_namespace: z14.string().min(1).max(120).meta(Unrestricted11),
  /** Occurred (effective) time. */
  occurred_time_field: z14.string().min(1).max(120).meta(Unrestricted11),
  /** Received (observation) time; absent when the source records none. */
  received_time_field: z14.string().min(1).max(120).optional().meta(Unrestricted11),
  dedup: AnalyticsRecordDedupSchema.meta(Unrestricted11),
  revision: AnalyticsRecordRevisionSchema.meta(Unrestricted11),
  late_arrival: AnalyticsRecordLateArrivalSchema.meta(Unrestricted11),
  correlation_keys: z14.array(z14.string().min(1).max(120)).max(12).optional().meta(Unrestricted11),
  /**
   * The field carrying Stripe live/test mode. R2 requires it on every
   * billing fact; a billing concept that declares `livemode_qualified: true`
   * must name it, and one that cannot is `livemode_qualified: false` with
   * the gap stated in `note`.
   */
  livemode_field: z14.string().min(1).max(120).optional().meta(Unrestricted11),
  /** Stamped policy-version fields (R2/R9). Empty or absent = none stamped. */
  policy_version_fields: z14.array(z14.string().min(1).max(120)).max(8).optional().meta(Unrestricted11),
  note: z14.string().max(400).optional().meta(Unrestricted11)
}).meta(meta("AnalyticsRecordContract"));
var AnalyticsKeyResolutionSchema = z14.enum(["source", "enriched", "absent"]).meta(meta("AnalyticsKeyResolution"));
var AnalyticsConceptKeySchema = z14.object({
  key: z14.string().regex(/^[a-z][a-z0-9_]{0,49}$/).meta(Unrestricted11),
  /** `column:<name>`, `payload:<field>`, `envelope:<field>` - or `-` when absent. */
  path: z14.string().min(1).max(200).meta(Unrestricted11),
  resolution: AnalyticsKeyResolutionSchema.meta(Unrestricted11),
  note: z14.string().max(400).optional().meta(Unrestricted11)
}).meta(meta("AnalyticsConceptKey"));
var AnalyticsMeasureUnitSchema = z14.enum(["currency_minor", "count", "seconds", "ratio", "timestamp", "usage_unit", "polymorphic"]).meta(meta("AnalyticsMeasureUnit"));
var AnalyticsMeasureTemporalSchema = z14.enum(["stock", "flow", "gauge"]).meta(meta("AnalyticsMeasureTemporal"));
var AnalyticsMeasureSignSchema = z14.enum(["signed", "positive_magnitude", "unsigned"]).meta(meta("AnalyticsMeasureSign"));
var AnalyticsConceptMeasureSchema = z14.object({
  name: z14.string().regex(/^[a-z][a-z0-9_]{0,63}$/).meta(Unrestricted11),
  /** `column:<name>` or `row_count` - a transaction fact whose measure IS its row count. */
  source: z14.string().min(1).max(200).meta(Unrestricted11),
  unit: AnalyticsMeasureUnitSchema.meta(Unrestricted11),
  temporal: AnalyticsMeasureTemporalSchema.meta(Unrestricted11),
  sign: AnalyticsMeasureSignSchema.meta(Unrestricted11),
  aggregation_semantics: AnalyticsMetricAggregationSemanticsSchema.meta(Unrestricted11),
  note: z14.string().max(400).optional().meta(Unrestricted11)
}).meta(meta("AnalyticsConceptMeasure"));
var AnalyticsConceptEventAttributeSchema = z14.object({
  name: z14.string().regex(/^[a-z][a-z0-9_]{0,63}$/).meta(Unrestricted11),
  /** `column:<name>`, `payload:<field>` or `envelope:<field>`. */
  path: z14.string().min(1).max(200).meta(Unrestricted11),
  note: z14.string().max(400).optional().meta(Unrestricted11)
}).meta(meta("AnalyticsConceptEventAttribute"));
var AnalyticsConceptSourceKindSchema = z14.enum(["ingested_event", "datasource", "control_plane_table", "build", "unavailable"]).meta(meta("AnalyticsConceptSourceKind"));
var AnalyticsConceptSourceSchema = z14.object({
  kind: AnalyticsConceptSourceKindSchema.meta(Unrestricted11),
  ref: z14.string().min(1).max(200).meta(Unrestricted11),
  /** Required when `kind` is `unavailable`: what has to ship before rows exist. */
  blocker: z14.string().max(400).optional().meta(Unrestricted11),
  note: z14.string().max(400).optional().meta(Unrestricted11)
}).meta(meta("AnalyticsConceptSource"));
var AnalyticsConceptBuildSchema = z14.object({
  kind: z14.enum(["pipe", "materialized_view", "worker", "query_time", "unavailable"]).meta(Unrestricted11),
  ref: z14.string().min(1).max(200).meta(Unrestricted11),
  inputs: z14.array(z14.string().min(1).max(200)).min(1).max(12).meta(Unrestricted11),
  blocker: z14.string().max(400).optional().meta(Unrestricted11)
}).meta(meta("AnalyticsConceptBuild"));
var AnalyticsConceptMaturitySchema = z14.object({
  status: z14.enum(["declared", "unavailable"]).meta(Unrestricted11),
  horizon_field: z14.string().min(1).max(120).optional().meta(Unrestricted11),
  observed_through_field: z14.string().min(1).max(120).optional().meta(Unrestricted11),
  blocker: z14.string().max(400).optional().meta(Unrestricted11)
}).meta(meta("AnalyticsConceptMaturity"));
var AnalyticsOracleFamilySchema = z14.enum(["gate", "presentation", "revenue", "attribution", "event_count", "cohort", "funnel", "read_through", "none"]).meta(meta("AnalyticsOracleFamily"));
var AnalyticsConceptOracleFamilySchema = z14.object({
  family: AnalyticsOracleFamilySchema.meta(Unrestricted11),
  blocker: z14.string().max(400).optional().meta(Unrestricted11)
}).meta(meta("AnalyticsConceptOracleFamily"));
var AnalyticsPolicyKindSchema = z14.enum(["mrr", "attribution", "lifecycle", "engagement"]).meta(meta("AnalyticsPolicyKind"));
var AnalyticsConceptPolicyDependencySchema = z14.object({
  kind: AnalyticsPolicyKindSchema.meta(Unrestricted11),
  stamped: z14.boolean().meta(Unrestricted11),
  blocker: z14.string().max(400).optional().meta(Unrestricted11)
}).meta(meta("AnalyticsConceptPolicyDependency"));
var AnalyticsGroundingAnchorSchema = z14.enum([
  "fact_time",
  "period_opening",
  "touch_time",
  "cohort_entry",
  "exposure_time",
  "assignment_time",
  "carried_version",
  "fixed",
  "current"
]).meta(meta("AnalyticsGroundingAnchor"));
var AnalyticsDimensionGroundingKindSchema = z14.enum(["stamped", "membership_join", "config_join", "derived"]).meta(meta("AnalyticsDimensionGroundingKind"));
var AnalyticsDimensionGroundingSchema = z14.object({
  kind: AnalyticsDimensionGroundingKindSchema.meta(Unrestricted11),
  source: z14.string().min(1).max(200).meta(Unrestricted11),
  note: z14.string().max(400).optional().meta(Unrestricted11),
  /**
   * The instant this grounding resolves its attribute at (D-9). Optional
   * while the concepts are being migrated; required once a concept
   * declares `fact_kind`, because a grounding without an anchor cannot be
   * executed correctly.
   */
  anchor: AnalyticsGroundingAnchorSchema.optional().meta(Unrestricted11),
  /**
   * Narrows a join from a coarser fact to a finer snapshot. Billing facts
   * are tenant-global, so a lifecycle slice over a billing metric must name
   * the product and environment it reads, or the join fans out.
   */
  selection: z14.object({
    product: z14.string().max(120).optional().meta(Unrestricted11),
    environment: z14.string().max(120).optional().meta(Unrestricted11)
  }).optional().meta(Unrestricted11),
  /**
   * Whether grouping by this attribute PARTITIONS the fact rows. Multivalued
   * attributes (an account's segments) group without partitioning. Whether
   * the grouped values SUM to the total is a property of the metric's
   * `aggregation_semantics`, not of the grouping.
   */
  partitions: z14.boolean().optional().meta(Unrestricted11),
  /**
   * A grounding carries its OWN status and blocker, so "MRR available, plan
   * slice unavailable" is expressible instead of being hidden in a
   * hand-maintained denial list.
   */
  catalog_status: AnalyticsCatalogStatusSchema.optional().meta(Unrestricted11),
  blocker: z14.string().max(400).optional().meta(Unrestricted11),
  /** Part of the V1 slice set tested on every P0 metric whose fact carries the key. */
  v1: z14.boolean().optional().meta(Unrestricted11)
}).meta(meta("AnalyticsDimensionGrounding"));
var AnalyticsCatalogMetricSchema = z14.object({
  id: SemanticIdField.meta(Unrestricted11),
  label: z14.string().min(1).max(120).meta(Unrestricted11),
  description: z14.string().max(500).optional().meta(Unrestricted11),
  when_to_use: z14.string().max(500).optional().meta(Unrestricted11),
  do_not_use_for: z14.string().max(500).optional().meta(Unrestricted11),
  value_type: AnalyticsFieldTypeSchema.meta(Unrestricted11),
  format: AnalyticsFormatSpecSchema.optional().meta(Unrestricted11),
  source_scope: AnalyticsSourceScopeSchema.optional().meta(Unrestricted11),
  direction: AnalyticsMetricDirectionSchema.optional().meta(Unrestricted11),
  statistical_type: AnalyticsMetricStatisticalTypeSchema.optional().meta(Unrestricted11),
  aggregation_semantics: AnalyticsMetricAggregationSemanticsSchema.optional().meta(Unrestricted11),
  preferred_analysis_unit: AnalyticsAnalyticalUnitSchema.optional().meta(Unrestricted11),
  // Ratio composition (§5.2 / war-games §10.1): semantic-id refs to the
  // catalog metrics this ratio is composed from. Only meaningful when
  // `statistical_type` is `ratio` — `AnalyticsCatalogMetricValidatedSchema`
  // enforces the pairing structurally.
  numerator_metric: SemanticIdField.optional().meta(Unrestricted11),
  denominator_metric: SemanticIdField.optional().meta(Unrestricted11),
  /**
   * Which ingested events produce this derived data product. Optional on the
   * canonical schema so a partial fixture stays parseable, but REQUIRED by
   * `AnalyticsCatalogMetricValidatedSchema` and by the in-memory catalog's
   * integrity check — i.e. required everywhere a catalog is authored or
   * served. A metric whose inputs nobody recorded is the exact defect this
   * field exists to prevent.
   */
  derivation: AnalyticsMetricDerivationSchema.optional().meta(Unrestricted11),
  /**
   * Which layer this metric occupies (D-9). Optional only so a partial
   * fixture stays parseable; required wherever a catalog is authored or
   * served, like `derivation`.
   */
  layer: AnalyticsMetricLayerSchema.optional().meta(Unrestricted11),
  /**
   * Definition readiness (D-9). `unavailable` carries its blocker in
   * `derivation.note`, which is why that field survives the migration.
   */
  catalog_status: AnalyticsCatalogStatusSchema.optional().meta(Unrestricted11),
  deprecation: CatalogDeprecation.optional().meta(Unrestricted11)
}).meta(meta("AnalyticsCatalogMetric"));
var AnalyticsCatalogMetricValidatedSchema = AnalyticsCatalogMetricSchema.superRefine(
  (metric, ctx) => {
    if (metric.statistical_type === "ratio") {
      if (!metric.numerator_metric || !metric.denominator_metric) {
        ctx.addIssue({
          code: "custom",
          path: ["statistical_type"],
          params: { code: "ratio_composition_incomplete" },
          message: "statistical_type='ratio' requires both numerator_metric and denominator_metric"
        });
      }
      return;
    }
    for (const field2 of ["numerator_metric", "denominator_metric"]) {
      if (metric[field2] !== void 0) {
        ctx.addIssue({
          code: "custom",
          path: [field2],
          params: { code: "ratio_composition_without_ratio_type" },
          message: `${field2} is only meaningful when statistical_type='ratio'`
        });
      }
    }
  }
).superRefine((metric, ctx) => {
  const derivation = metric.derivation;
  if (!derivation) {
    ctx.addIssue({
      code: "custom",
      path: ["derivation"],
      params: { code: "derivation_required" },
      message: "every metric must declare `derivation` \u2014 the ingested events it is computed from, or kind='unavailable' with the blocker in `note`"
    });
    return;
  }
  const hasInputs = derivation.ingested_events.length > 0 || (derivation.ingested_datasources?.length ?? 0) > 0;
  if (metric.catalog_status === "unavailable") {
    if (hasInputs) {
      ctx.addIssue({
        code: "custom",
        path: ["derivation", "ingested_events"],
        params: { code: "unavailable_metric_names_inputs" },
        message: "catalog_status='unavailable' must name no inputs \u2014 if inputs exist the metric is produced, and any routing blocker belongs in `note`"
      });
    }
    if (derivation.input_origin !== "none") {
      ctx.addIssue({
        code: "custom",
        path: ["derivation", "input_origin"],
        params: { code: "unavailable_metric_claims_input_origin" },
        message: "catalog_status='unavailable' requires input_origin='none'"
      });
    }
    if (!derivation.note || derivation.note.trim().length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["derivation", "note"],
        params: { code: "unavailable_metric_missing_blocker" },
        message: "catalog_status='unavailable' requires `note` naming the real blocker"
      });
    }
    return;
  }
  if (!hasInputs) {
    ctx.addIssue({
      code: "custom",
      path: ["derivation", "ingested_events"],
      params: { code: "produced_metric_without_inputs" },
      message: `catalog_status='${metric.catalog_status ?? "unset"}' must name at least one ingested event or datasource \u2014 a metric with no inputs is catalog_status='unavailable'`
    });
  }
  if (derivation.input_origin === "none") {
    ctx.addIssue({
      code: "custom",
      path: ["derivation", "input_origin"],
      params: { code: "produced_metric_without_input_origin" },
      message: "input_origin='none' is only valid with catalog_status='unavailable'"
    });
  }
}).meta(meta("AnalyticsCatalogMetricValidated"));
var AnalyticsCatalogConceptSchema = z14.object({
  id: SemanticIdField.meta(Unrestricted11),
  version: z14.number().int().min(1).meta(Unrestricted11),
  label: z14.string().min(1).max(120).meta(Unrestricted11),
  description: z14.string().max(500).optional().meta(Unrestricted11),
  when_to_use: z14.string().max(500).optional().meta(Unrestricted11),
  do_not_use_for: z14.string().max(500).optional().meta(Unrestricted11),
  grain: z14.array(z14.string().regex(/^[a-z][a-z0-9_]{0,49}$/)).min(1).meta(Unrestricted11),
  analytical_units: z14.array(AnalyticsAnalyticalUnitSchema).min(1).meta(Unrestricted11),
  primary_time_dimension: SemanticIdField.meta(Unrestricted11),
  historical_mode: AnalyticsHistoricalModeSchema.meta(Unrestricted11),
  dimensions: z14.array(SemanticIdField).min(1).meta(Unrestricted11),
  metrics: z14.array(SemanticIdField).min(1).meta(Unrestricted11),
  query_families: z14.array(AnalyticsQueryFamilySchema).min(1).meta(Unrestricted11),
  source_scope: AnalyticsSourceScopeSchema.meta(Unrestricted11),
  coverage_metric: SemanticIdField.optional().meta(Unrestricted11),
  /**
   * How each declared dimension GROUNDS for this concept (plan 228 REQ-11).
   * Optional on the canonical schema so partial fixtures parse; the
   * in-memory integrity check requires totality — one grounding per
   * declared non-time dimension, no extras.
   */
  dimension_groundings: z14.record(SemanticIdField, AnalyticsDimensionGroundingSchema).optional().meta(Unrestricted11),
  /**
   * CONCEPT = FACT TABLE (plan 252 TASK-58, workspace decision D-9). There
   * is no separate fact-table object: a concept IS its fact table seen from
   * the query side, so `grain` above is the STORED grain (one row per
   * exposure, not per placement-day — a daily rollup is a pipe's physical
   * choice, not a second grain).
   *
   * These fields stay optional on the canonical schema so a partial fixture
   * still parses, but they are NOT decorative: a concept that declares
   * `fact_kind` is asserting it has been mapped, and
   * `AnalyticsCatalogConceptValidatedSchema` then REQUIRES the whole set —
   * the same split as the metric schema. Every shipped concept declares them
   * (BL-0246, TASK-58's second half).
   *
   * `revenue.movement` is still NOT split into `revenue.stock` /
   * `.movement` / `.ledger`: today's definitions do not distinguish them
   * (the only served measure is the invoice-paid cash proxy), so the split
   * stays registered as the `catalog_status: 'unavailable'` blocker on
   * `revenue.mrr` / `revenue.net_new_mrr` and rides with the normalized
   * recurring stock and movement oracle (plan 252 TASK-29/34/36/45) that
   * produce the rows. Declaring three empty concepts here would invent them.
   */
  fact_kind: AnalyticsFactKindSchema.optional().meta(Unrestricted11),
  family: z14.enum(["billing", "behavioral"]).optional().meta(Unrestricted11),
  primary_key: z14.array(z14.string().min(1).max(120)).max(12).optional().meta(Unrestricted11),
  /** Who writes the rows — replaces the retired `derivation.kind: 'observed'`. */
  producer: AnalyticsConceptProducerSchema.optional().meta(Unrestricted11),
  /** Physical serving choice; several tables or a pre-aggregating pipe may serve one concept. */
  materialization: z14.object({
    mode: z14.enum(["raw", "rollup", "logical"]).meta(Unrestricted11),
    rollup_grain: AnalyticsTimeGrainSchema.optional().meta(Unrestricted11)
  }).optional().meta(Unrestricted11),
  /** Billing facts carry Stripe live/test mode; without it live and test revenue are indistinguishable. */
  livemode_qualified: z14.boolean().optional().meta(Unrestricted11),
  /** The record contract the rows obey (R2). */
  record_contract: AnalyticsRecordContractSchema.optional().meta(Unrestricted11),
  /** Every entity key the fact carries, and the path it resolves through (R1). */
  keys: z14.array(AnalyticsConceptKeySchema).max(24).optional().meta(Unrestricted11),
  /**
   * The stored measures. May be EMPTY for a concept every one of whose
   * metrics is `catalog_status: 'unavailable'` — there is no measure to
   * declare until the fact exists. The in-memory integrity check enforces
   * that pairing, so an empty list cannot hide a served metric.
   */
  measures: z14.array(AnalyticsConceptMeasureSchema).max(32).optional().meta(Unrestricted11),
  /** Non-key attributes carried on the row (R7). */
  event_attributes: z14.array(AnalyticsConceptEventAttributeSchema).max(32).optional().meta(Unrestricted11),
  /** Where the rows come from (R1/R5). */
  sources: z14.array(AnalyticsConceptSourceSchema).min(1).max(12).optional().meta(Unrestricted11),
  /** How snapshot rows are built (R5); required for both snapshot kinds. */
  build: AnalyticsConceptBuildSchema.optional().meta(Unrestricted11),
  /** Horizon / `observed_through` right-censoring (R5); required for accumulating snapshots. */
  maturity: AnalyticsConceptMaturitySchema.optional().meta(Unrestricted11),
  /** The pure oracle family that derives this concept's metrics (R6). */
  oracle_family: AnalyticsConceptOracleFamilySchema.optional().meta(Unrestricted11),
  /** The versioned policy kinds the rows depend on, and whether the version is stamped (R9). */
  policy_dependencies: z14.array(AnalyticsConceptPolicyDependencySchema).max(8).optional().meta(Unrestricted11),
  deprecation: CatalogDeprecation.optional().meta(Unrestricted11)
}).meta(meta("AnalyticsCatalogConcept"));
var AnalyticsCatalogConceptValidatedSchema = AnalyticsCatalogConceptSchema.superRefine(
  (concept, ctx) => {
    const problem = (path, code, message) => {
      ctx.addIssue({ code: "custom", path, params: { code }, message });
    };
    const duplicates = (names) => {
      const seen = /* @__PURE__ */ new Set();
      const dupes = /* @__PURE__ */ new Set();
      for (const name of names) {
        if (seen.has(name)) dupes.add(name);
        seen.add(name);
      }
      return [...dupes].sort();
    };
    if (concept.fact_kind === void 0) {
      for (const field2 of [
        "family",
        "primary_key",
        "producer",
        "materialization",
        "livemode_qualified",
        "record_contract",
        "keys",
        "measures",
        "event_attributes",
        "build",
        "maturity"
      ]) {
        if (concept[field2] !== void 0) {
          problem(
            [field2],
            "fact_table_field_without_fact_kind",
            `${field2} describes a fact table's rows, so the concept must declare fact_kind`
          );
        }
      }
      for (const [index, source] of (concept.sources ?? []).entries()) {
        if (source.kind !== "unavailable") {
          problem(
            ["sources", index, "kind"],
            "real_source_without_fact_kind",
            "a concept naming a real row source must declare fact_kind (D-9: the concept IS the fact table)"
          );
        }
      }
    } else {
      const required = [
        "family",
        "primary_key",
        "producer",
        "materialization",
        "livemode_qualified",
        "record_contract",
        "keys",
        "measures",
        "event_attributes",
        "sources",
        "oracle_family",
        "policy_dependencies"
      ];
      for (const field2 of required) {
        if (concept[field2] === void 0) {
          problem(
            [field2],
            "mapped_concept_missing_fact_table_field",
            `a concept declaring fact_kind must declare ${field2} (D-9: the concept IS the fact table)`
          );
        }
      }
      if (concept.keys !== void 0 && concept.keys.length === 0) {
        problem(["keys"], "mapped_concept_without_keys", "a fact carries at least one entity key (R1)");
      }
      for (const [dimensionId, grounding] of Object.entries(concept.dimension_groundings ?? {})) {
        if (grounding.anchor === void 0) {
          problem(
            ["dimension_groundings", dimensionId, "anchor"],
            "grounding_without_anchor",
            `grounding for ${dimensionId} must declare an anchor once the concept declares fact_kind (R8)`
          );
        }
      }
      if (concept.fact_kind === "accumulating_snapshot" && concept.maturity === void 0) {
        problem(
          ["maturity"],
          "accumulating_snapshot_without_maturity",
          "an accumulating snapshot must declare maturity \u2014 status 'unavailable' with a blocker when right-censoring is not implemented (R5)"
        );
      }
      if (concept.fact_kind !== "transaction" && concept.build === void 0) {
        problem(["build"], "snapshot_without_build", "a snapshot fact must declare the build that produces its rows (R5)");
      }
      if (concept.fact_kind === "transaction" && concept.maturity !== void 0) {
        problem(["maturity"], "transaction_with_maturity", "maturity is a snapshot property; a transaction fact has no horizon (R5)");
      }
    }
    for (const [dimensionId, grounding] of Object.entries(concept.dimension_groundings ?? {})) {
      if (grounding.catalog_status === "unavailable" && !grounding.blocker?.trim()) {
        problem(
          ["dimension_groundings", dimensionId, "blocker"],
          "unavailable_grounding_without_blocker",
          `grounding for ${dimensionId} is catalog_status 'unavailable' and must name the blocker (R11/G13)`
        );
      }
      if (grounding.catalog_status !== "unavailable" && grounding.blocker !== void 0) {
        problem(
          ["dimension_groundings", dimensionId, "blocker"],
          "grounding_blocker_without_unavailable",
          `grounding for ${dimensionId} carries a blocker, so its catalog_status must be 'unavailable' (R11/G13)`
        );
      }
      if (grounding.kind !== "config_join" && grounding.kind !== "membership_join") continue;
      if (grounding.catalog_status === "unavailable") continue;
      const joined = (concept.sources ?? []).some(
        (source) => source.ref === grounding.source && source.kind !== "unavailable"
      );
      if (!joined) {
        problem(
          ["dimension_groundings", dimensionId, "source"],
          "join_grounding_without_execution_path",
          `grounding for ${dimensionId} is a ${grounding.kind} against '${grounding.source}', which the concept does not declare among its sources \u2014 nothing performs that join, so the grounding must declare catalog_status 'unavailable' with its blocker (R11/G13)`
        );
      }
    }
    if (concept.materialization?.mode === "rollup" && concept.materialization.rollup_grain === void 0) {
      problem(["materialization", "rollup_grain"], "rollup_without_grain", "materialization mode 'rollup' must name its rollup_grain");
    }
    if (concept.materialization && concept.materialization.mode !== "rollup" && concept.materialization.rollup_grain !== void 0) {
      problem(["materialization", "rollup_grain"], "rollup_grain_without_rollup", "rollup_grain is only meaningful when mode is 'rollup'");
    }
    if (concept.family === "billing" && concept.livemode_qualified === void 0) {
      problem(["livemode_qualified"], "billing_concept_without_livemode", "a billing fact must state whether it is live/test qualified (R2)");
    }
    if (concept.livemode_qualified === true && concept.record_contract?.livemode_field === void 0) {
      problem(
        ["record_contract", "livemode_field"],
        "livemode_qualified_without_field",
        "livemode_qualified: true must name the field carrying Stripe live/test mode (R2)"
      );
    }
    for (const [index, key] of (concept.keys ?? []).entries()) {
      if (key.resolution === "absent" && !key.note?.trim()) {
        problem(["keys", index, "note"], "absent_key_without_note", "resolution 'absent' must state why the key is not carried (R1)");
      }
      if (key.resolution === "absent" && key.path !== "-") {
        problem(["keys", index, "path"], "absent_key_with_path", "resolution 'absent' must carry path '-' \u2014 there is no path to read");
      }
      if (key.resolution !== "absent" && key.path === "-") {
        problem(["keys", index, "path"], "resolved_key_without_path", "a source or enriched key must name the path it resolves through");
      }
    }
    for (const duplicate of duplicates((concept.keys ?? []).map((key) => key.key))) {
      problem(["keys"], "duplicate_key", `duplicate entity key: ${duplicate}`);
    }
    for (const [index, measure] of (concept.measures ?? []).entries()) {
      if (measure.temporal === "stock" && measure.aggregation_semantics !== "semi_additive") {
        problem(
          ["measures", index, "aggregation_semantics"],
          "stock_measure_not_semi_additive",
          "a stock measure is semi_additive by construction \u2014 it is summed at one date, never across dates (R3)"
        );
      }
      if (measure.unit === "polymorphic") {
        if (!measure.note?.trim()) {
          problem(
            ["measures", index, "note"],
            "polymorphic_measure_without_note",
            "unit 'polymorphic' must name the column that decides the unit"
          );
        }
        if (measure.aggregation_semantics !== "non_additive") {
          problem(
            ["measures", index, "aggregation_semantics"],
            "polymorphic_measure_summed",
            "unit 'polymorphic' is non_additive \u2014 rows of different units cannot be summed"
          );
        }
      }
      if (measure.unit === "count" && measure.sign === "signed") {
        problem(["measures", index, "sign"], "signed_count_measure", "a count is unsigned; a signed change is a currency or usage delta (R3)");
      }
    }
    for (const duplicate of duplicates((concept.measures ?? []).map((measure) => measure.name))) {
      problem(["measures"], "duplicate_measure", `duplicate measure name: ${duplicate}`);
    }
    for (const duplicate of duplicates((concept.event_attributes ?? []).map((attribute) => attribute.name))) {
      problem(["event_attributes"], "duplicate_event_attribute", `duplicate event attribute: ${duplicate}`);
    }
    for (const [index, source] of (concept.sources ?? []).entries()) {
      if (source.kind === "unavailable" && !source.blocker?.trim()) {
        problem(["sources", index, "blocker"], "unavailable_source_without_blocker", "source kind 'unavailable' must name the blocker");
      }
      if (source.kind !== "unavailable" && source.blocker !== void 0) {
        problem(["sources", index, "blocker"], "available_source_with_blocker", "a real source carries no blocker \u2014 use note");
      }
    }
    const sourceKinds = new Set((concept.sources ?? []).map((source) => source.kind));
    if (sourceKinds.has("unavailable") && sourceKinds.size > 1) {
      problem(["sources"], "mixed_unavailable_sources", "a concept with an 'unavailable' source declares no other source");
    }
    if (sourceKinds.has("unavailable") && (concept.measures?.length ?? 0) > 0) {
      problem(["measures"], "unavailable_source_with_measures", "a concept with no fact declares no measures");
    }
    if (concept.build?.kind === "unavailable" && !concept.build.blocker?.trim()) {
      problem(["build", "blocker"], "unavailable_build_without_blocker", "build kind 'unavailable' must name the blocker");
    }
    if (concept.build && concept.build.kind !== "unavailable" && concept.build.blocker !== void 0) {
      problem(["build", "blocker"], "available_build_with_blocker", "a real build carries no blocker");
    }
    if (concept.maturity) {
      if (concept.maturity.status === "declared") {
        for (const field2 of ["horizon_field", "observed_through_field"]) {
          if (concept.maturity[field2] === void 0) {
            problem(["maturity", field2], "declared_maturity_missing_field", `maturity status 'declared' must name ${field2} (R5)`);
          }
        }
        if (concept.maturity.blocker !== void 0) {
          problem(["maturity", "blocker"], "declared_maturity_with_blocker", "maturity status 'declared' carries no blocker");
        }
      } else if (!concept.maturity.blocker?.trim()) {
        problem(["maturity", "blocker"], "unavailable_maturity_without_blocker", "maturity status 'unavailable' must name the blocker");
      }
    }
    if (concept.oracle_family) {
      if (concept.oracle_family.family === "none" && !concept.oracle_family.blocker?.trim()) {
        problem(["oracle_family", "blocker"], "no_oracle_without_blocker", "oracle_family 'none' must name why no oracle covers this concept (R6)");
      }
      if (concept.oracle_family.family !== "none" && concept.oracle_family.blocker !== void 0) {
        problem(["oracle_family", "blocker"], "oracle_family_with_blocker", "a concept with an oracle family carries no blocker");
      }
    }
    for (const [index, dependency] of (concept.policy_dependencies ?? []).entries()) {
      if (!dependency.stamped && !dependency.blocker?.trim()) {
        problem(
          ["policy_dependencies", index, "blocker"],
          "unstamped_policy_without_blocker",
          `policy dependency '${dependency.kind}' is not stamped on the row, so it must name the blocker (R9)`
        );
      }
      if (dependency.stamped && dependency.blocker !== void 0) {
        problem(["policy_dependencies", index, "blocker"], "stamped_policy_with_blocker", "a stamped policy dependency carries no blocker");
      }
    }
    for (const duplicate of duplicates((concept.policy_dependencies ?? []).map((dependency) => dependency.kind))) {
      problem(["policy_dependencies"], "duplicate_policy_dependency", `duplicate policy dependency: ${duplicate}`);
    }
    const stampedPolicies = (concept.policy_dependencies ?? []).filter((dependency) => dependency.stamped);
    if (stampedPolicies.length > 0 && (concept.record_contract?.policy_version_fields?.length ?? 0) === 0) {
      problem(
        ["record_contract", "policy_version_fields"],
        "stamped_policy_without_version_field",
        "a stamped policy dependency requires the record contract to name the policy-version field it is stamped in (R2)"
      );
    }
  }
).meta(meta("AnalyticsCatalogConceptValidated"));
var OrderBy = z14.strictObject({
  field: SemanticIdField.meta(Unrestricted11),
  direction: z14.enum(["asc", "desc"]).meta(Unrestricted11)
});
var QueryTime = z14.strictObject({
  dimension: SemanticIdField.meta(Unrestricted11),
  grain: AnalyticsTimeGrainSchema.meta(Unrestricted11)
});
var MAX_ANALYTICS_GROUP_BY_FIELDS = 8;
var AnalyticsViewQuerySchema = z14.strictObject({
  concept: SemanticIdField.meta(Unrestricted11),
  family: AnalyticsQueryFamilySchema.meta(Unrestricted11),
  metrics: z14.array(SemanticIdField).min(1).max(10).meta(Unrestricted11),
  group_by: z14.array(SemanticIdField).max(MAX_ANALYTICS_GROUP_BY_FIELDS).optional().meta(Unrestricted11),
  time: QueryTime.optional().meta(Unrestricted11),
  filters_from: z14.array(ElementIdField).max(20).optional().meta(Unrestricted11),
  fixed_filters: z14.array(AnalyticsSemanticFilterSchema).max(20).optional().meta(Unrestricted11),
  compare: AnalyticsCompareModeSchema.optional().meta(Unrestricted11),
  // Comparison targets and presentation (plan 219 TASK-1). All OPTIONAL and
  // never defaulted, so pre-existing documents keep their canonical bytes.
  // Semantic validation pairs each parameterized mode with its one target.
  compare_delta: AnalyticsCompareDeltaSchema.optional().meta(Unrestricted11),
  compare_segment: AnalyticsCompareSegmentSchema.optional().meta(Unrestricted11),
  compare_experiment: AnalyticsCompareExperimentSchema.optional().meta(Unrestricted11),
  compare_scope: AnalyticsSourceScopeSchema.optional().meta(Unrestricted11),
  /** Intervention anchor: the instant an annotation marks; before/after windows derive from it. */
  compare_anchor: z14.string().datetime().optional().meta(Unrestricted11),
  order_by: z14.array(OrderBy).max(3).optional().meta(Unrestricted11),
  limit: z14.number().int().min(1).max(1e3).optional().meta(Unrestricted11)
}).meta(meta("AnalyticsViewQuery"));
var AnalyticsRenderMetricSchema = z14.strictObject({
  type: z14.literal("metric").meta(Unrestricted11),
  value: SemanticIdField.meta(Unrestricted11),
  comparison: SemanticIdField.optional().meta(Unrestricted11),
  format: AnalyticsFormatSpecSchema.optional().meta(Unrestricted11)
}).meta(meta("AnalyticsRenderMetric"));
var AnalyticsRenderCartesianSchema = z14.strictObject({
  type: z14.literal("cartesian").meta(Unrestricted11),
  mark: z14.enum(["line", "area", "bar", "stacked_bar", "scatter"]).meta(Unrestricted11),
  encoding: z14.strictObject({
    x: SemanticIdField.meta(Unrestricted11),
    y: z14.union([SemanticIdField, z14.array(SemanticIdField).min(1).max(5)]).meta(Unrestricted11),
    color: SemanticIdField.optional().meta(Unrestricted11),
    facet: SemanticIdField.optional().meta(Unrestricted11)
  }).meta(Unrestricted11),
  options: AnalyticsSafeChartOptionsSchema.optional().meta(Unrestricted11)
}).meta(meta("AnalyticsRenderCartesian"));
var AnalyticsRenderFunnelSchema = z14.strictObject({
  type: z14.literal("funnel").meta(Unrestricted11),
  stages: z14.array(SemanticIdField).min(2).max(10).meta(Unrestricted11),
  split_by: SemanticIdField.optional().meta(Unrestricted11)
}).meta(meta("AnalyticsRenderFunnel"));
var AnalyticsRenderTableSchema = z14.strictObject({
  type: z14.literal("table").meta(Unrestricted11),
  columns: z14.array(SemanticIdField).min(1).max(20).meta(Unrestricted11)
}).meta(meta("AnalyticsRenderTable"));
var AnalyticsRenderTimelineSchema = z14.strictObject({
  type: z14.literal("timeline").meta(Unrestricted11),
  timestamp: SemanticIdField.meta(Unrestricted11),
  event_type: SemanticIdField.meta(Unrestricted11)
}).meta(meta("AnalyticsRenderTimeline"));
var AnalyticsRenderRecommendationsSchema = z14.strictObject({
  type: z14.literal("recommendations").meta(Unrestricted11),
  presentation: z14.enum(["list", "ranked_cards"]).meta(Unrestricted11)
}).meta(meta("AnalyticsRenderRecommendations"));
var AnalyticsRenderSpecSchema = z14.discriminatedUnion("type", [
  AnalyticsRenderMetricSchema,
  AnalyticsRenderCartesianSchema,
  AnalyticsRenderFunnelSchema,
  AnalyticsRenderTableSchema,
  AnalyticsRenderTimelineSchema,
  AnalyticsRenderRecommendationsSchema
]).meta(meta("AnalyticsRenderSpec"));
var AnalyticsViewFilterSchema = z14.strictObject({
  id: ElementIdField.meta(Unrestricted11),
  dimension: SemanticIdField.meta(Unrestricted11),
  control: AnalyticsFilterControlSchema.meta(Unrestricted11),
  label: LocalizedTextSchema.optional().meta(Unrestricted11),
  operators: z14.array(AnalyticsFilterOperatorSchema).min(1).meta(Unrestricted11),
  default_value: AnalyticsFilterValueSchema.optional().meta(Unrestricted11),
  required: z14.boolean().default(false).meta(Unrestricted11),
  pinned: z14.boolean().default(false).meta(Unrestricted11),
  applies_to: z14.union([z14.literal("all"), z14.array(ElementIdField).min(1).max(24)]).default("all").meta(Unrestricted11),
  // Explore-mode facets (plan 217 TASK-2). Both are OPTIONAL, never
  // defaulted: a defaulted key would join the canonical bytes of every
  // reparsed document and shift shipped content hashes.
  /** Cascading dependency: this filter's options narrow under the named filter's value. */
  depends_on: ElementIdField.optional().meta(Unrestricted11),
  /** When false, the serialized share-link omits this filter's value. Absent means safe. */
  url_safe: z14.boolean().optional().meta(Unrestricted11)
}).meta(meta("AnalyticsViewFilter"));
var AnalyticsViewLayoutSchema = z14.strictObject({
  type: z14.literal("grid").meta(Unrestricted11),
  columns: z14.number().int().min(1).max(24).default(12).meta(Unrestricted11),
  items: z14.array(z14.strictObject({
    block_id: ElementIdField.meta(Unrestricted11),
    x: z14.number().int().min(0).meta(Unrestricted11),
    y: z14.number().int().min(0).meta(Unrestricted11),
    w: z14.number().int().min(1).max(24).meta(Unrestricted11),
    h: z14.number().int().min(1).max(24).meta(Unrestricted11)
  })).max(24).meta(Unrestricted11)
}).meta(meta("AnalyticsViewLayout"));
var AnalyticsViewBlockSchema = z14.strictObject({
  id: ElementIdField.meta(Unrestricted11),
  title: LocalizedTextSchema.optional().meta(Unrestricted11),
  description: LocalizedTextSchema.optional().meta(Unrestricted11),
  query: AnalyticsViewQuerySchema.meta(Unrestricted11),
  render: AnalyticsRenderSpecSchema.meta(Unrestricted11)
}).meta(meta("AnalyticsViewBlock"));
var AnalyticsViewHandoffSchema = z14.strictObject({
  id: ElementIdField.meta(Unrestricted11),
  label: LocalizedTextSchema.meta(Unrestricted11),
  target: SemanticIdField.meta(Unrestricted11),
  bindings: z14.record(z14.string().regex(/^[a-z][a-z0-9_]{0,49}$/), z14.string().min(1).max(200)).default({}).meta(Unrestricted11)
}).meta(meta("AnalyticsViewHandoff"));
var AnalyticsCustomizationPolicySchema = z14.strictObject({
  allow: z14.array(AnalyticsCustomizationCapabilitySchema).default([]).meta(Unrestricted11),
  deny: z14.array(AnalyticsCustomizationCapabilitySchema).default([]).meta(Unrestricted11)
}).meta(meta("AnalyticsCustomizationPolicy"));
var ANALYTICS_VIEW_SCHEMA_VERSION = "1.0";
var SchemaVersionField = z14.string().regex(/^\d+\.\d+$/);
var AnalyticsViewSchema = z14.strictObject({
  kind: z14.literal("revturbine.analytics-view").meta(Unrestricted11),
  schema_version: SchemaVersionField.meta(Unrestricted11),
  id: ElementIdField.meta(Unrestricted11),
  revision: z14.number().int().min(1).meta(Unrestricted11),
  title: LocalizedTextSchema.meta(Unrestricted11),
  description: LocalizedTextSchema.optional().meta(Unrestricted11),
  analytical_unit: AnalyticsAnalyticalUnitSchema.meta(Unrestricted11),
  base_template: z14.strictObject({
    id: ElementIdField.meta(Unrestricted11),
    version: z14.number().int().min(1).meta(Unrestricted11)
  }).optional().meta(Unrestricted11),
  catalog_version: z14.string().min(1).max(64).meta(Unrestricted11),
  filters: z14.array(AnalyticsViewFilterSchema).max(20).meta(Unrestricted11),
  layout: AnalyticsViewLayoutSchema.meta(Unrestricted11),
  blocks: z14.array(AnalyticsViewBlockSchema).min(1).max(24).meta(Unrestricted11),
  handoffs: z14.array(AnalyticsViewHandoffSchema).max(10).optional().meta(Unrestricted11),
  customization_policy: AnalyticsCustomizationPolicySchema.meta(Unrestricted11)
}).meta(meta("AnalyticsView"));
var AnalyticsViewFilterDraftSchema = z14.strictObject({
  id: ElementIdField.optional().meta(Unrestricted11),
  dimension: SemanticIdField.meta(Unrestricted11),
  control: AnalyticsFilterControlSchema.optional().meta(Unrestricted11),
  label: LocalizedTextSchema.optional().meta(Unrestricted11),
  operators: z14.array(AnalyticsFilterOperatorSchema).min(1).optional().meta(Unrestricted11),
  default_value: AnalyticsFilterValueSchema.optional().meta(Unrestricted11),
  required: z14.boolean().optional().meta(Unrestricted11),
  pinned: z14.boolean().optional().meta(Unrestricted11),
  applies_to: z14.union([z14.literal("all"), z14.array(ElementIdField).min(1).max(24)]).optional().meta(Unrestricted11)
}).meta(meta("AnalyticsViewFilterDraft"));
var AnalyticsViewBlockDraftSchema = z14.strictObject({
  id: ElementIdField.optional().meta(Unrestricted11),
  title: LocalizedTextSchema.optional().meta(Unrestricted11),
  concept: SemanticIdField.meta(Unrestricted11),
  family: AnalyticsQueryFamilySchema.meta(Unrestricted11),
  metrics: z14.array(SemanticIdField).min(1).max(10).meta(Unrestricted11),
  group_by: z14.array(SemanticIdField).max(MAX_ANALYTICS_GROUP_BY_FIELDS).optional().meta(Unrestricted11),
  time: QueryTime.optional().meta(Unrestricted11),
  filters_from: z14.array(ElementIdField).max(20).optional().meta(Unrestricted11),
  fixed_filters: z14.array(AnalyticsSemanticFilterSchema).max(20).optional().meta(Unrestricted11),
  compare: AnalyticsCompareModeSchema.optional().meta(Unrestricted11),
  compare_delta: AnalyticsCompareDeltaSchema.optional().meta(Unrestricted11),
  compare_segment: AnalyticsCompareSegmentSchema.optional().meta(Unrestricted11),
  compare_experiment: AnalyticsCompareExperimentSchema.optional().meta(Unrestricted11),
  compare_scope: AnalyticsSourceScopeSchema.optional().meta(Unrestricted11),
  compare_anchor: z14.string().datetime().optional().meta(Unrestricted11),
  order_by: z14.array(OrderBy).max(3).optional().meta(Unrestricted11),
  limit: z14.number().int().min(1).max(1e3).optional().meta(Unrestricted11),
  render: z14.union([z14.literal("auto"), AnalyticsRenderSpecSchema]).optional().meta(Unrestricted11)
}).meta(meta("AnalyticsViewBlockDraft"));
var AnalyticsViewHandoffDraftSchema = z14.strictObject({
  id: ElementIdField.optional().meta(Unrestricted11),
  label: LocalizedTextSchema.optional().meta(Unrestricted11),
  target: SemanticIdField.meta(Unrestricted11),
  bindings: z14.record(z14.string().regex(/^[a-z][a-z0-9_]{0,49}$/), z14.string().min(1).max(200)).optional().meta(Unrestricted11)
}).meta(meta("AnalyticsViewHandoffDraft"));
var AnalyticsViewDraftSchema = z14.strictObject({
  kind: z14.literal("revturbine.analytics-view-draft").meta(Unrestricted11),
  schema_version: SchemaVersionField.meta(Unrestricted11),
  title: LocalizedTextSchema.meta(Unrestricted11),
  analytical_unit: AnalyticsAnalyticalUnitSchema.optional().meta(Unrestricted11),
  filters: z14.union([z14.literal("recommended"), z14.array(AnalyticsViewFilterDraftSchema).max(20)]).optional().meta(Unrestricted11),
  layout: z14.union([z14.literal("auto"), AnalyticsViewLayoutSchema]).optional().meta(Unrestricted11),
  blocks: z14.array(AnalyticsViewBlockDraftSchema).min(1).max(24).meta(Unrestricted11),
  handoffs: z14.union([z14.literal("recommended"), z14.array(AnalyticsViewHandoffDraftSchema).max(10)]).optional().meta(Unrestricted11),
  visibility: AnalyticsViewVisibilitySchema.optional().meta(Unrestricted11)
}).meta(meta("AnalyticsViewDraft"));
var JsonPointerField = z14.string().regex(/^(\/[^/]*)*$/).max(300);
var AnalyticsSuggestedPatchOpSchema = z14.strictObject({
  op: z14.enum(["add", "replace", "remove"]).meta(Unrestricted11),
  path: JsonPointerField.meta(Unrestricted11),
  value: z14.unknown().optional().meta(Unrestricted11)
}).meta(meta("AnalyticsSuggestedPatchOp"));
var AnalyticsWarningSchema = z14.object({
  code: z14.string().regex(/^[A-Z][A-Z0-9_]{2,79}$/).meta(Unrestricted11),
  message: z14.string().min(1).max(500).meta(Unrestricted11)
}).meta(meta("AnalyticsWarning"));
var AnalyticsValidationIssueSchema = z14.object({
  code: z14.string().regex(/^[A-Z][A-Z0-9_]{2,79}$/).meta(Unrestricted11),
  path: JsonPointerField.meta(Unrestricted11),
  message: z14.string().min(1).max(500).meta(Unrestricted11),
  actual: z14.unknown().optional().meta(Unrestricted11),
  allowed: z14.array(FilterScalar).max(50).optional().meta(Unrestricted11),
  suggested_patch: z14.array(AnalyticsSuggestedPatchOpSchema).max(10).optional().meta(Unrestricted11)
}).meta(meta("AnalyticsValidationIssue"));
var AnalyticsCompileResolutionSchema = z14.object({
  path: JsonPointerField.meta(Unrestricted11),
  rule: z14.string().min(1).max(120).meta(Unrestricted11),
  value: z14.unknown().optional().meta(Unrestricted11)
}).meta(meta("AnalyticsCompileResolution"));
var AnalyticsValidationResultSchema = z14.object({
  valid: z14.boolean().meta(Unrestricted11),
  errors: z14.array(AnalyticsValidationIssueSchema).default([]).meta(Unrestricted11),
  warnings: z14.array(AnalyticsWarningSchema).default([]).meta(Unrestricted11),
  catalog_version: z14.string().min(1).max(64).meta(Unrestricted11)
}).meta(meta("AnalyticsValidationResult"));
var AnalyticsResultFieldSchema = z14.object({
  id: SemanticIdField.meta(Unrestricted11),
  type: AnalyticsFieldTypeSchema.meta(Unrestricted11),
  nullable: z14.boolean().meta(Unrestricted11)
}).meta(meta("AnalyticsResultField"));
var AnalyticsCoverageSchema = z14.object({
  numerator: z14.number().int().min(0).meta(Unrestricted11),
  denominator: z14.number().int().min(0).meta(Unrestricted11),
  rate: z14.number().min(0).max(1).meta(Unrestricted11)
}).meta(meta("AnalyticsCoverage"));
var AnalyticsResultMetaSchema = z14.object({
  query_hash: z14.string().min(1).max(128).meta(Unrestricted11),
  concept: SemanticIdField.meta(Unrestricted11),
  analytical_unit: AnalyticsAnalyticalUnitSchema.meta(Unrestricted11),
  source_scope: AnalyticsSourceScopeSchema.meta(Unrestricted11),
  coverage: AnalyticsCoverageSchema.optional().meta(Unrestricted11),
  as_of: z14.string().datetime().meta(Unrestricted11),
  freshness_seconds: z14.number().int().min(0).meta(Unrestricted11),
  applied_filters: z14.array(AnalyticsSemanticFilterSchema).default([]).meta(Unrestricted11),
  next_cursor: z14.string().max(500).optional().meta(Unrestricted11),
  warnings: z14.array(AnalyticsWarningSchema).default([]).meta(Unrestricted11)
}).meta(meta("AnalyticsResultMeta"));
var AnalyticsResultSchema = z14.object({
  data: z14.array(z14.record(z14.string(), z14.unknown())).meta(Unrestricted11),
  fields: z14.array(AnalyticsResultFieldSchema).meta(Unrestricted11),
  meta: AnalyticsResultMetaSchema.meta(Unrestricted11)
}).meta(meta("AnalyticsResult"));

// scaffold/src/analytics/models/saved-view-schema.ts
import { z as z15 } from "zod";
var { Unrestricted: Unrestricted12 } = DataClassification;
var { Persisted: Persisted11, Transient: Transient12 } = SchemaPersistence;
var { Internal: Internal10 } = SchemaExposure;
var CUSTOMER_SAVED_VIEW_FACETS = schemaFacets(SchemaContext.CustomerOperations, {
  inConfig: false,
  sdkInput: false,
  source: SchemaSource.Customer
});
var persistedMeta = (id) => ({
  id,
  "x-revturbine-schema-persistence": Persisted11,
  "x-revturbine-schema-exposure": Internal10,
  ...CUSTOMER_SAVED_VIEW_FACETS
});
var transientMeta = (id) => ({
  id,
  "x-revturbine-schema-persistence": Transient12,
  "x-revturbine-schema-exposure": Internal10
});
var EnvironmentScopeFields = z15.object({
  environment_id: z15.string().min(1).meta({ ...Unrestricted12, readOnly: true })
});
var AnalyticsViewAccessRoleSchema = z15.enum(["viewer", "editor"]).meta(transientMeta("AnalyticsViewAccessRole"));
var AnalyticsSavedViewSchema = IdField.merge(TenantIdField).merge(EnvironmentScopeFields).merge(TimestampFields).extend({
  owner_user_id: z15.string().min(1).meta(Unrestricted12),
  name: z15.string().min(1).max(300).meta(Unrestricted12),
  visibility: AnalyticsViewVisibilitySchema.meta(Unrestricted12),
  base_template_id: z15.string().min(1).max(100).nullable().optional().meta(Unrestricted12),
  base_template_version: z15.number().int().min(1).nullable().optional().meta(Unrestricted12),
  current_revision: z15.number().int().min(1).meta(Unrestricted12),
  is_default: z15.boolean().default(false).meta(Unrestricted12),
  idempotency_key: z15.string().min(1).max(200).nullable().optional().meta(Unrestricted12)
}).meta(persistedMeta("AnalyticsSavedView"));
var AnalyticsViewRevisionSchema = IdField.merge(TenantIdField).merge(EnvironmentScopeFields).extend({
  view_id: z15.string().min(1).meta(Unrestricted12),
  revision: z15.number().int().min(1).meta(Unrestricted12),
  schema_version: z15.string().regex(/^\d+\.\d+$/).meta(Unrestricted12),
  catalog_version: z15.string().min(1).max(64).meta(Unrestricted12),
  document_jsonb: AnalyticsViewSchema.meta(Unrestricted12),
  content_hash: z15.string().regex(/^[a-f0-9]{64}$/).meta(Unrestricted12),
  created_by: z15.string().min(1).meta(Unrestricted12),
  created_at: z15.string().datetime().meta({ ...Unrestricted12, readOnly: true })
}).meta(persistedMeta("AnalyticsViewRevision"));
var AnalyticsViewAccessSchema = IdField.merge(TenantIdField).merge(EnvironmentScopeFields).extend({
  view_id: z15.string().min(1).meta(Unrestricted12),
  // TASK-3 settles the bounded sharing vocabulary; do not pre-decide Q-1/Q-3 here.
  principal_type: z15.string().regex(/^[a-z][a-z0-9_]{0,49}$/).meta(Unrestricted12),
  principal_id: z15.string().min(1).meta(Unrestricted12),
  role: AnalyticsViewAccessRoleSchema.meta(Unrestricted12)
}).meta(persistedMeta("AnalyticsViewAccess"));

// scaffold/src/analytics/models/catalog-schema.ts
import { z as z17 } from "zod";

// scaffold/src/analytics/models/annotation-schema.ts
import { z as z16 } from "zod";
var { Unrestricted: Unrestricted13 } = DataClassification;
var { Transient: Transient13 } = SchemaPersistence;
var { Internal: Internal11 } = SchemaExposure;
var meta2 = (id) => ({
  id,
  "x-revturbine-schema-persistence": Transient13,
  "x-revturbine-schema-exposure": Internal11
});
var AnalyticsAnnotationKindSchema = z16.enum([
  "playbook_published",
  "entitlement_change",
  "price_change",
  "plan_change",
  "experiment_started",
  "experiment_ended",
  "sdk_release",
  "sdk_error_rate"
]).meta(meta2("AnalyticsAnnotationKind"));
var AnalyticsAnnotationSourceSchema = z16.enum(["control_plane", "events_billing", "events_sdk_meta", "events_sdk_diagnostics"]).meta(meta2("AnalyticsAnnotationSource"));
var AnalyticsAnnotationMarkerSchema = z16.enum(["point", "region"]).meta(meta2("AnalyticsAnnotationMarker"));
var AnalyticsCatalogAnnotationKindSchema = z16.object({
  kind: AnalyticsAnnotationKindSchema.meta(Unrestricted13),
  label: z16.string().min(1).max(120).meta(Unrestricted13),
  description: z16.string().min(1).max(500).meta(Unrestricted13),
  source: AnalyticsAnnotationSourceSchema.meta(Unrestricted13),
  marker: AnalyticsAnnotationMarkerSchema.meta(Unrestricted13)
}).meta(meta2("AnalyticsCatalogAnnotationKind"));
var ANALYTICS_ANNOTATION_KINDS = [
  {
    kind: "playbook_published",
    label: "Playbook published",
    description: "A playbook version was deployed, read from the tenant's own version records; covers the placement and content releases that version carries.",
    source: "control_plane",
    marker: "point"
  },
  {
    kind: "entitlement_change",
    label: "Entitlement change",
    description: "An entitlement or its rules changed through a deployed playbook version.",
    source: "control_plane",
    marker: "point"
  },
  {
    kind: "price_change",
    label: "Price change",
    description: "A Stripe price changed, from the tenant-scoped billing event stream.",
    source: "events_billing",
    marker: "point"
  },
  {
    kind: "plan_change",
    label: "Plan change",
    description: "A Stripe product or plan definition changed, from the tenant-scoped billing event stream.",
    source: "events_billing",
    marker: "point"
  },
  {
    kind: "experiment_started",
    label: "Experiment started",
    description: "An experiment began assigning, from the control-plane experiment lifecycle.",
    source: "control_plane",
    marker: "point"
  },
  {
    kind: "experiment_ended",
    label: "Experiment ended",
    description: "An experiment stopped assigning, from the control-plane experiment lifecycle.",
    source: "control_plane",
    marker: "point"
  },
  {
    kind: "sdk_release",
    label: "SDK release",
    description: "A new SDK or bundle version was first observed for this tenant (keyless source, resolved by config hash).",
    source: "events_sdk_meta",
    marker: "point"
  },
  {
    kind: "sdk_error_rate",
    label: "SDK error rate",
    description: "A sustained window of elevated SDK resolution failures. A region, not a point: a single failure is noise, a sustained rate is the signal.",
    source: "events_sdk_diagnostics",
    marker: "region"
  }
];
var AnalyticsAnnotationSchema = z16.object({
  kind: AnalyticsAnnotationKindSchema.meta(Unrestricted13),
  at: z16.string().datetime().meta(Unrestricted13),
  until: z16.string().datetime().optional().meta(Unrestricted13),
  label: z16.string().min(1).max(160).meta(Unrestricted13),
  description: z16.string().max(500).optional().meta(Unrestricted13),
  source: AnalyticsAnnotationSourceSchema.meta(Unrestricted13),
  subject: z16.string().min(1).max(100).optional().meta(Unrestricted13)
}).meta(meta2("AnalyticsAnnotation"));
var AnalyticsAnnotationRequestSchema = z16.strictObject({
  start: z16.string().datetime().meta(Unrestricted13),
  end: z16.string().datetime().meta(Unrestricted13),
  kinds: z16.array(AnalyticsAnnotationKindSchema).min(1).max(8).optional().meta(Unrestricted13)
}).meta(meta2("AnalyticsAnnotationRequest"));
var AnalyticsAnnotationResponseSchema = z16.object({
  annotations: z16.array(AnalyticsAnnotationSchema).meta(Unrestricted13),
  as_of: z16.string().datetime().meta(Unrestricted13)
}).meta(meta2("AnalyticsAnnotationResponse"));

// scaffold/src/analytics/models/catalog-schema.ts
var { Unrestricted: Unrestricted14 } = DataClassification;
var { Transient: Transient14 } = SchemaPersistence;
var { Internal: Internal12 } = SchemaExposure;
var meta3 = (id) => ({
  id,
  "x-revturbine-schema-persistence": Transient14,
  "x-revturbine-schema-exposure": Internal12
});
var AnalyticsCatalogSourceSchema = z17.enum(["fixture", "generated"]).meta(meta3("AnalyticsCatalogSource"));
var AnalyticsCatalogProvenanceKindSchema = z17.enum(["event_taxonomy", "openapi_identity", "tinybird_project", "annotation_kinds"]).meta(meta3("AnalyticsCatalogProvenanceKind"));
var AnalyticsCatalogProvenanceSchema = z17.object({
  kind: AnalyticsCatalogProvenanceKindSchema.meta(Unrestricted14),
  location: z17.string().min(1).max(240).meta(Unrestricted14),
  version: z17.string().min(1).max(64).optional().meta(Unrestricted14),
  entry_count: z17.number().int().nonnegative().meta(Unrestricted14)
}).meta(meta3("AnalyticsCatalogProvenance"));
var AnalyticsCatalogSchema = z17.object({
  catalog_version: z17.string().min(1).max(64).meta(Unrestricted14),
  source: AnalyticsCatalogSourceSchema.meta(Unrestricted14),
  generated_at: z17.string().datetime().optional().meta(Unrestricted14),
  provenance: z17.array(AnalyticsCatalogProvenanceSchema).optional().meta(Unrestricted14),
  concepts: z17.array(AnalyticsCatalogConceptSchema).min(1).meta(Unrestricted14),
  dimensions: z17.array(AnalyticsCatalogDimensionSchema).min(1).meta(Unrestricted14),
  metrics: z17.array(AnalyticsCatalogMetricSchema).min(1).meta(Unrestricted14),
  // Annotation-kind vocabulary (plan 219 TASK-2). Optional so a fixture
  // catalog stays valid; the generated catalog must carry the complete
  // vocabulary — the in-memory integrity check enforces it.
  annotations: z17.array(AnalyticsCatalogAnnotationKindSchema).optional().meta(Unrestricted14)
}).meta(meta3("AnalyticsCatalog"));
var AnalyticsAgentCatalogEntryKindSchema = z17.enum(["concept", "dimension", "metric", "query_family"]).meta(meta3("AnalyticsAgentCatalogEntryKind"));
var AnalyticsAgentCatalogEntrySchema = z17.object({
  id: AnalyticsSemanticIdSchema.meta(Unrestricted14),
  kind: AnalyticsAgentCatalogEntryKindSchema.meta(Unrestricted14),
  label: z17.string().min(1).max(120).meta(Unrestricted14),
  description: z17.string().min(1).max(500).meta(Unrestricted14),
  when_to_use: z17.string().max(500).optional().meta(Unrestricted14),
  do_not_use_for: z17.string().max(500).optional().meta(Unrestricted14),
  value_type: AnalyticsFieldTypeSchema.optional().meta(Unrestricted14),
  format: AnalyticsFormatSpecSchema.optional().meta(Unrestricted14),
  capabilities: z17.array(AnalyticsDimensionCapabilitySchema).optional().meta(Unrestricted14),
  compatible_concepts: z17.array(AnalyticsSemanticIdSchema).optional().meta(Unrestricted14),
  compatible_families: z17.array(AnalyticsQueryFamilySchema).optional().meta(Unrestricted14),
  analytical_units: z17.array(AnalyticsAnalyticalUnitSchema).optional().meta(Unrestricted14),
  source_scope: AnalyticsSourceScopeSchema.optional().meta(Unrestricted14),
  example: z17.string().max(2e3).optional().meta(Unrestricted14),
  deprecation: AnalyticsCatalogDeprecationSchema.optional().meta(Unrestricted14)
}).meta(meta3("AnalyticsAgentCatalogEntry"));
var AnalyticsCatalogSearchResultSchema = z17.object({
  catalog_version: z17.string().min(1).max(64).meta(Unrestricted14),
  query: z17.string().min(1).max(200).meta(Unrestricted14),
  entries: z17.array(AnalyticsAgentCatalogEntrySchema).max(50).meta(Unrestricted14)
}).meta(meta3("AnalyticsCatalogSearchResult"));

// scaffold/src/analytics/catalog/in-memory.ts
import { z as z22 } from "zod";

// scaffold/src/events/models/event-payloads.ts
import { z as z20 } from "zod";

// scaffold/src/customers/models/billing-profiles.ts
import { z as z19 } from "zod";

// scaffold/src/customers/models/subscription-evidence.ts
import { z as z18 } from "zod";
var privateField = { ...DataClassification.Operational, ...ServerOnly, readOnly: true };
var privateBilling = { ...DataClassification.Financial, ...ServerOnly, readOnly: true };
var transient = (id) => ({
  id,
  "x-revturbine-schema-persistence": SchemaPersistence.Transient,
  "x-revturbine-schema-exposure": SchemaExposure.Internal
});
var persisted = (id, table, uniqueBy, indexes) => ({
  id,
  "x-revturbine-schema-persistence": SchemaPersistence.Persisted,
  "x-revturbine-schema-exposure": SchemaExposure.Internal,
  ...schemaFacets(SchemaContext.Billing, { sdkInput: false, source: SchemaSource.Stripe }),
  "x-revturbine-persistence": { table, uniqueBy, indexes }
});
var providerId = () => z18.string().min(1).max(255);
var optionalTime = () => z18.string().datetime().nullable().optional().meta(privateField);
var STRIPE_SUBSCRIPTION_STATUS_VALUES = [
  "incomplete",
  "incomplete_expired",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "paused"
];
var StripeSubscriptionStatusSchema = z18.enum(STRIPE_SUBSCRIPTION_STATUS_VALUES).meta(transient("StripeSubscriptionStatus"));
var SubscriptionProtectionSchema = z18.enum(["protected", "released", "unknown"]).meta(transient("SubscriptionProtection"));
var TERMINAL_SUBSCRIPTION_STATUSES = ["canceled", "incomplete_expired"];
var SUBSCRIPTION_STATUS_PROTECTION = Object.freeze({
  incomplete: "protected",
  incomplete_expired: "released",
  trialing: "protected",
  active: "protected",
  past_due: "protected",
  canceled: "released",
  unpaid: "protected",
  paused: "protected"
});
function classifySubscriptionStatus(status) {
  if (typeof status !== "string") return "unknown";
  return SUBSCRIPTION_STATUS_PROTECTION[status] ?? "unknown";
}
var StripeBillingScopeSchema = z18.object({
  tenant_id: z18.string().min(1).meta(privateField),
  account_id: providerId().describe("Connected Stripe account the observation was made against.").meta(privateField),
  livemode: z18.boolean().describe("Stripe live (true) or test (false) mode.").meta(privateField)
}).strict().meta(transient("StripeBillingScope"));
var StripePriceScopeSchema = StripeBillingScopeSchema.extend({
  price_id: providerId().meta(privateField)
}).strict().meta(transient("StripePriceScope"));
var StripeSubscriptionItemSchema = IdField.merge(TenantIdField).merge(TimestampFields).extend({
  item_version: z18.literal(1).meta(privateField),
  account_id: providerId().meta(privateField),
  livemode: z18.boolean().meta(privateField),
  subscription_id: providerId().meta(privateBilling),
  item_id: providerId().meta(privateBilling),
  customer_id: providerId().meta(privateBilling),
  price_id: providerId().meta(privateBilling),
  subscription_status: StripeSubscriptionStatusSchema.meta(privateField),
  protection: SubscriptionProtectionSchema.meta(privateField),
  cancel_at_period_end: z18.boolean().default(false).describe("Scheduled cancellation does not release the mapping.").meta(privateField),
  quantity: z18.number().int().min(0).nullable().optional().describe("Diagnostics only \u2014 protection counts distinct subscriptions, never quantity.").meta(privateField),
  item_state: z18.enum(["present", "removed"]).default("present").meta(privateField),
  removed_at: optionalTime(),
  source_version: z18.number().int().min(0).describe("Provider ordering fence; a lower value never overwrites a higher one.").meta(privateField),
  source_event_id: providerId().nullable().default(null).describe(
    "Sub-second tiebreak for a source_version TIE (plan 248 follow-up, BL-0090): the Stripe event id that produced this observation. Two webhook deliveries for the same item can carry the same source_version (Stripe event `created` has one-second resolution), and arrival order at the server is not the same thing as the order the events actually happened in. Comparing event ids is not a claim that Stripe's ids are chronological \u2014 they are not guaranteed to be \u2014 only that they are unique and stable, so a lexical comparison is a deterministic total order: whichever of two same-second events is applied first, the tiebreak resolves identically, so the row converges to the same final id regardless of delivery order. A scan observation (no event) always leaves this null and a null never outranks a webhook-authored id, so a scan can never silently re-win a tie a webhook already settled."
  ).meta(privateField),
  provider_updated_at: z18.string().datetime().meta(privateField),
  observed_at: z18.string().datetime().meta(privateField),
  scan_generation: z18.number().int().min(0).default(0).meta(privateField)
}).strict().superRefine((item, ctx) => {
  const fail = (field2, message) => ctx.addIssue({ code: "custom", path: [field2], message });
  if (item.protection !== SUBSCRIPTION_STATUS_PROTECTION[item.subscription_status]) {
    fail("protection", "Stored protection must equal the policy verdict for the status.");
  }
  if (item.item_state === "removed" !== (item.removed_at != null)) {
    fail("removed_at", "A removed item records when it was removed; a present item does not.");
  }
}).meta(
  persisted(
    "StripeSubscriptionItem",
    "stripeSubItem",
    ["tenant_id", "account_id", "livemode", "item_id"],
    [
      ["account_id", "livemode", "price_id", "protection"],
      ["tenant_id", "price_id"],
      ["subscription_id"],
      ["scan_generation"]
    ]
  )
);
var SUBSCRIPTION_EVIDENCE_UNAVAILABLE_REASONS = [
  "uninitialized",
  "scan_in_progress",
  "partial_scan",
  "stale",
  "invalidated",
  "conflicting_webhook",
  "provider_error",
  "provider_timeout",
  "verification_deadline_exceeded",
  "not_connected",
  "account_rebound",
  "mode_mismatch",
  "unknown_subscription_status"
];
var SubscriptionEvidenceUnavailableReasonSchema = z18.enum(SUBSCRIPTION_EVIDENCE_UNAVAILABLE_REASONS).meta(transient("SubscriptionEvidenceUnavailableReason"));
var EvidenceReasonColumnSchema = z18.enum(["none", ...SUBSCRIPTION_EVIDENCE_UNAVAILABLE_REASONS]).meta(transient("EvidenceReasonColumn"));
var NON_RETRYABLE_EVIDENCE_REASONS = [
  "not_connected",
  "account_rebound",
  "mode_mismatch"
];
var EvidenceCoverageStateSchema = z18.enum(["uninitialized", "scanning", "complete", "invalidated", "failed"]).meta(transient("EvidenceCoverageState"));
var StripeSubscriptionEvidenceSchema = IdField.merge(TenantIdField).merge(TimestampFields).extend({
  evidence_version: z18.literal(1).meta(privateField),
  account_id: providerId().meta(privateField),
  livemode: z18.boolean().meta(privateField),
  price_id: providerId().meta(privateBilling),
  coverage_state: EvidenceCoverageStateSchema.default("uninitialized").meta(privateField),
  unavailable_reason: EvidenceReasonColumnSchema.default("uninitialized").meta(privateField),
  protected_subscription_count: z18.number().int().min(0).nullable().default(null).describe("Distinct protected subscriptions; null unless coverage is complete.").meta(privateField),
  scan_generation: z18.number().int().min(0).default(0).meta(privateField),
  account_binding_id: z18.string().min(1).max(255).nullable().default(null).describe("Tenant/account binding in force at scan time; a change invalidates the proof.").meta(privateField),
  scan_started_at: optionalTime(),
  verified_at: optionalTime(),
  invalidated_at: optionalTime(),
  last_error_code: z18.string().min(1).max(128).nullable().optional().meta(privateField),
  last_error_message: z18.string().max(1e3).nullable().optional().describe("Sanitized diagnostic only; exclude credentials, headers and provider payloads.").meta(privateField)
}).strict().superRefine((evidence, ctx) => {
  const fail = (field2, message) => ctx.addIssue({ code: "custom", path: [field2], message });
  if (evidence.coverage_state === "complete") {
    if (evidence.protected_subscription_count == null || evidence.verified_at == null) {
      fail("protected_subscription_count", "Complete coverage records a count and a scan time.");
    }
    if (evidence.unavailable_reason !== "none") {
      fail("unavailable_reason", "Complete coverage has no unavailable reason.");
    }
    if (evidence.account_binding_id == null) {
      fail("account_binding_id", "Complete coverage names the account binding it proved.");
    }
  } else {
    if (evidence.protected_subscription_count != null) {
      fail(
        "protected_subscription_count",
        "Incomplete coverage must not carry a count \u2014 an unverified scope reports no number."
      );
    }
    if (evidence.unavailable_reason === "none") {
      fail("unavailable_reason", "Incomplete coverage must say why it cannot answer.");
    }
    if (evidence.verified_at != null) {
      fail("verified_at", "Only complete coverage records a verification time.");
    }
  }
  if (evidence.coverage_state === "failed" !== (evidence.last_error_code != null)) {
    fail("last_error_code", "Failed coverage records an error code, and only failed coverage.");
  }
  if (evidence.coverage_state === "invalidated" !== (evidence.invalidated_at != null)) {
    fail("invalidated_at", "Invalidated coverage records when the proof was invalidated.");
  }
  if (evidence.coverage_state === "scanning" && evidence.scan_started_at == null) {
    fail("scan_started_at", "A running scan records when it started.");
  }
  if (evidence.coverage_state === "uninitialized" && evidence.unavailable_reason !== "uninitialized") {
    fail("unavailable_reason", "A scope that has never been scanned is uninitialized.");
  }
}).meta(
  persisted(
    "StripeSubscriptionEvidence",
    "stripeSubEvidence",
    ["tenant_id", "account_id", "livemode", "price_id"],
    [
      ["coverage_state", "verified_at"],
      ["account_id", "livemode", "price_id"],
      ["scan_generation"]
    ]
  )
);
var PROTECTED_SUBSCRIPTION_SAMPLE_LIMIT = 50;
var SubscriptionEvidenceKnownSchema = z18.object({
  state: z18.literal("known").meta(privateField),
  result_version: z18.literal(1).meta(privateField),
  scope: StripePriceScopeSchema.meta(privateField),
  protected_subscription_count: z18.number().int().min(0).meta(privateField),
  protected_subscription_ids: z18.array(providerId()).max(PROTECTED_SUBSCRIPTION_SAMPLE_LIMIT).default([]).describe("Bounded distinct sample for operator messaging, never the count itself.").meta(privateBilling),
  verified_at: z18.string().datetime().meta(privateField),
  scan_generation: z18.number().int().min(0).meta(privateField),
  account_binding_id: z18.string().min(1).max(255).meta(privateField)
}).strict().superRefine((known, ctx) => {
  const fail = (field2, message) => ctx.addIssue({ code: "custom", path: [field2], message });
  const ids = known.protected_subscription_ids;
  if (new Set(ids).size !== ids.length) {
    fail("protected_subscription_ids", "Protected subscriptions are counted distinctly.");
  }
  if (ids.length > known.protected_subscription_count) {
    fail("protected_subscription_ids", "The sample cannot exceed the count it illustrates.");
  }
  if (known.protected_subscription_count === 0 && ids.length > 0) {
    fail("protected_subscription_ids", "A verified-empty scope names no subscriptions.");
  }
}).meta(transient("SubscriptionEvidenceKnown"));
var SubscriptionEvidenceUnavailableSchema = z18.object({
  state: z18.literal("unavailable").meta(privateField),
  result_version: z18.literal(1).meta(privateField),
  scope: StripePriceScopeSchema.meta(privateField),
  reason: SubscriptionEvidenceUnavailableReasonSchema.meta(privateField),
  retryable: z18.boolean().meta(privateField),
  last_observed_at: optionalTime(),
  detail: z18.string().max(500).nullable().optional().describe("Sanitized operator hint; never provider payloads or credentials.").meta(privateField)
}).strict().meta(transient("SubscriptionEvidenceUnavailable"));
var SubscriptionEvidenceResultSchema = z18.discriminatedUnion("state", [
  SubscriptionEvidenceKnownSchema,
  SubscriptionEvidenceUnavailableSchema
]).meta(transient("SubscriptionEvidenceResult"));
function isRetryableEvidenceReason(reason) {
  return !NON_RETRYABLE_EVIDENCE_REASONS.includes(reason);
}
function unavailableEvidence(scope, reason, extra = {}) {
  return SubscriptionEvidenceUnavailableSchema.parse({
    state: "unavailable",
    result_version: 1,
    scope,
    reason,
    retryable: isRetryableEvidenceReason(reason),
    ...extra
  });
}
var SUBSCRIPTION_EVIDENCE_UNAVAILABLE_CODE = "subscription_evidence_unavailable";
var SUBSCRIPTION_REFERENCE_EXISTS_CODE = "subscription_reference_exists";
var SUBSCRIPTION_BLOCKER_ENTITY = "subscriptions";
var DeleteProtectionDecisionSchema = z18.object({
  outcome: z18.enum(["permitted", "blocked", "unverified"]).meta(privateField),
  http_status: z18.union([z18.literal(200), z18.literal(409), z18.literal(503)]).meta(privateField),
  code: z18.enum([SUBSCRIPTION_REFERENCE_EXISTS_CODE, SUBSCRIPTION_EVIDENCE_UNAVAILABLE_CODE]).nullable().meta(privateField),
  scope: StripePriceScopeSchema.meta(privateField),
  protected_subscription_count: z18.number().int().min(1).nullable().meta(privateField),
  protected_subscription_ids: z18.array(providerId()).default([]).meta(privateBilling),
  reason: SubscriptionEvidenceUnavailableReasonSchema.nullable().meta(privateField),
  retryable: z18.boolean().meta(privateField)
}).strict().meta(transient("DeleteProtectionDecision"));
function decideDeleteProtection(result) {
  if (result.state === "unavailable") {
    return DeleteProtectionDecisionSchema.parse({
      outcome: "unverified",
      http_status: 503,
      code: SUBSCRIPTION_EVIDENCE_UNAVAILABLE_CODE,
      scope: result.scope,
      protected_subscription_count: null,
      protected_subscription_ids: [],
      reason: result.reason,
      retryable: result.retryable
    });
  }
  if (result.protected_subscription_count > 0) {
    return DeleteProtectionDecisionSchema.parse({
      outcome: "blocked",
      http_status: 409,
      code: SUBSCRIPTION_REFERENCE_EXISTS_CODE,
      scope: result.scope,
      protected_subscription_count: result.protected_subscription_count,
      protected_subscription_ids: result.protected_subscription_ids,
      reason: null,
      retryable: false
    });
  }
  return DeleteProtectionDecisionSchema.parse({
    outcome: "permitted",
    http_status: 200,
    code: null,
    scope: result.scope,
    protected_subscription_count: null,
    protected_subscription_ids: [],
    reason: null,
    retryable: false
  });
}
function inScope(item, scope) {
  return item.tenant_id === scope.tenant_id && item.account_id === scope.account_id && item.livemode === scope.livemode && item.price_id === scope.price_id;
}
function summarizeProtectedSubscriptions(scope, items) {
  const subscriptions = /* @__PURE__ */ new Set();
  const unknown = [];
  for (const item of items) {
    if (!inScope(item, scope) || item.item_state !== "present") continue;
    const protection = classifySubscriptionStatus(item.subscription_status);
    if (protection === "unknown") {
      unknown.push(item.item_id);
      continue;
    }
    if (protection === "protected") subscriptions.add(item.subscription_id);
  }
  return { subscription_ids: [...subscriptions].sort(), unknown_status_item_ids: unknown.sort() };
}
function resolveSubscriptionEvidence(input) {
  const { scope, coverage, items, now, max_age_ms, current_account_binding_id } = input;
  const summary = summarizeProtectedSubscriptions(scope, items);
  const lastObserved = coverage?.verified_at ?? null;
  if (current_account_binding_id == null) {
    return unavailableEvidence(scope, "not_connected", { last_observed_at: lastObserved });
  }
  if (coverage == null) {
    return unavailableEvidence(scope, "uninitialized");
  }
  if (coverage.tenant_id !== scope.tenant_id || coverage.account_id !== scope.account_id || coverage.price_id !== scope.price_id) {
    return unavailableEvidence(scope, "uninitialized", { last_observed_at: lastObserved });
  }
  if (coverage.livemode !== scope.livemode) {
    return unavailableEvidence(scope, "mode_mismatch", { last_observed_at: lastObserved });
  }
  if (coverage.coverage_state !== "complete") {
    const reason = coverage.unavailable_reason;
    return unavailableEvidence(scope, reason === "none" ? "uninitialized" : reason, {
      last_observed_at: lastObserved,
      detail: coverage.last_error_message ?? void 0
    });
  }
  if (coverage.account_binding_id !== current_account_binding_id) {
    return unavailableEvidence(scope, "account_rebound", { last_observed_at: lastObserved });
  }
  const verifiedAt = Date.parse(coverage.verified_at ?? "");
  const evaluatedAt = Date.parse(now);
  if (!Number.isFinite(verifiedAt) || !Number.isFinite(evaluatedAt)) {
    return unavailableEvidence(scope, "invalidated", { last_observed_at: lastObserved });
  }
  if (evaluatedAt - verifiedAt > max_age_ms) {
    return unavailableEvidence(scope, "stale", { last_observed_at: lastObserved });
  }
  if (summary.unknown_status_item_ids.length > 0) {
    return unavailableEvidence(scope, "unknown_subscription_status", {
      last_observed_at: lastObserved
    });
  }
  const observed = summary.subscription_ids.length;
  const published = coverage.protected_subscription_count ?? 0;
  if (observed < published) {
    return unavailableEvidence(scope, "conflicting_webhook", { last_observed_at: lastObserved });
  }
  return SubscriptionEvidenceKnownSchema.parse({
    state: "known",
    result_version: 1,
    scope,
    protected_subscription_count: observed,
    protected_subscription_ids: summary.subscription_ids.slice(
      0,
      PROTECTED_SUBSCRIPTION_SAMPLE_LIMIT
    ),
    verified_at: coverage.verified_at,
    scan_generation: coverage.scan_generation,
    account_binding_id: coverage.account_binding_id
  });
}

// scaffold/src/customers/models/billing-profiles.ts
var fin = { ...DataClassification.Financial, ...ServerOnly };
var ops = { ...DataClassification.Operational, ...ServerOnly };
var transient2 = (id) => ({
  id,
  "x-revturbine-schema-persistence": SchemaPersistence.Transient,
  "x-revturbine-schema-exposure": SchemaExposure.Internal
});
var BILLING_PROFILE_VERSION = 1;
var BILLING_OCCURRENCE_IDENTITY_VERSION = 2;
var LEGACY_BILLING_OCCURRENCE_IDENTITY_VERSION = 1;
var BILLING_OCCURRENCE_KEY_PREFIX = "bo2";
var MAX_BILLING_PROFILE_LIST = 250;
var isoDateTime = () => z19.iso.datetime({ offset: true });
var providerId2 = () => z19.string().min(1).max(255);
var signedMinor = () => z19.string().regex(/^-?(0|[1-9][0-9]*)$/).max(40);
var unsignedMinor = () => z19.string().regex(/^(0|[1-9][0-9]*)$/).max(40);
var currencyFields = {
  /** ISO 4217, upper case. Producers normalize Stripe's lower-case codes. */
  currency: z19.string().regex(/^[A-Z]{3}$/).meta(ops),
  /** Minor-unit exponent of `currency` (ISO 4217: 0..4). Never assumed to be 2. */
  currency_exponent: z19.number().int().min(0).max(4).meta(ops)
};
var BillingSourceScopeSchema = StripeBillingScopeSchema.extend({
  provider: z19.enum(["stripe"]).meta(ops),
  /** Simulation scope (plan 232); absent on real traffic. Same raw ids in two scopes are two facts. */
  simulation_id: z19.string().min(1).max(255).optional().meta(ops)
}).strict().meta(transient2("BillingSourceScope"));
var occurrenceCommon = {
  identity_version: z19.literal(BILLING_OCCURRENCE_IDENTITY_VERSION).meta(ops),
  /** The logical economic occurrence. Must equal {@link deriveBillingOccurrenceKey}. */
  occurrence_key: z19.string().min(1).max(512).meta(ops),
  /** The provider revision that reported this state. Replays of it are the same revision. */
  source_revision: z19.string().min(1).max(255).meta(ops),
  /** Authoritative provider ordering evidence, when the source supplies one. Never delivery order. */
  source_order: z19.number().int().min(0).nullable().optional().meta(ops),
  /** The revision this one supersedes, when the source says so. */
  supersedes_revision: z19.string().min(1).max(255).nullable().optional().meta(ops),
  /** Transport delivery id (webhook delivery / receipt). Diagnostic only — never identity. */
  delivery_id: z19.string().min(1).max(255).optional().meta(ops),
  /** The v1 `billing_ref` of the same fact, when one exists — keeps conversion links and historical projections. */
  legacy_billing_ref: z19.string().min(1).max(512).optional().meta(ops)
};
var BillingOccurrenceSchema = z19.strictObject(occurrenceCommon).meta(transient2("BillingOccurrence"));
var BillingRepeatableOccurrenceSchema = z19.strictObject({
  ...occurrenceCommon,
  /**
   * The provider's identity for this one occurrence of a repeatable
   * transition — e.g. the Stripe event id that first reported a
   * subscription change, the balance-transaction id of a dispute
   * withdrawal. Two `→10` seat changes carry two refs.
   */
  source_occurrence_ref: z19.string().min(1).max(255).meta(ops)
}).meta(transient2("BillingRepeatableOccurrence"));
var factTimes = {
  /** When the fact takes economic effect. Segment `timestamp` stays the capture time. */
  effective_at: isoDateTime().meta(ops),
  /** When the source recorded it (e.g. Stripe event `created`). */
  source_recorded_at: isoDateTime().meta(ops),
  /** When RevTurbine observed it. Server-owned. */
  observed_at: isoDateTime().meta(ops)
};
var base = (profile, kind, repeatable) => ({
  profile: z19.literal(profile).meta(ops),
  kind: z19.literal(kind).meta(ops),
  profile_version: z19.literal(BILLING_PROFILE_VERSION).meta(ops),
  source: BillingSourceScopeSchema.meta(ops),
  occurrence: (repeatable ? BillingRepeatableOccurrenceSchema : BillingOccurrenceSchema).meta(ops),
  /** Provider customer id, qualified by `source`. Never a substitute for `context.groupId`. */
  customer_ref: providerId2().meta(fin),
  ...factTimes
});
var listCoverage = () => z19.enum(["complete", "partial"]).meta(ops);
var exactDecimalMinor = () => z19.string().regex(/^(0|[1-9][0-9]*)(\.[0-9]{1,12})?$/).max(64);
var MAX_BILLING_PRICE_TIERS = 100;
var BillingPriceTierSchema = z19.strictObject({
  up_to: z19.number().int().min(1).nullable().meta(ops),
  unit_amount_decimal: exactDecimalMinor().nullable().meta(fin),
  flat_amount_minor: unsignedMinor().nullable().meta(fin)
}).meta(transient2("BillingPriceTier"));
var BillingPriceTermsSchema = z19.discriminatedUnion("billing_scheme", [
  z19.strictObject({
    billing_scheme: z19.literal("per_unit").meta(ops),
    unit_amount_decimal: exactDecimalMinor().meta(fin),
    transform_quantity: z19.strictObject({
      divide_by: z19.number().int().min(1).meta(ops),
      round: z19.enum(["up", "down"]).meta(ops)
    }).nullable().meta(ops)
  }),
  z19.strictObject({
    billing_scheme: z19.literal("tiered").meta(ops),
    tiers_mode: z19.enum(["graduated", "volume"]).meta(ops),
    tiers: z19.array(BillingPriceTierSchema).min(1).max(MAX_BILLING_PRICE_TIERS).meta(fin)
  })
]).meta(transient2("BillingPriceTerms"));
var BillingRecurringPriceSchema = z19.strictObject({
  price_id: providerId2().meta(fin),
  product_id: providerId2().optional().meta(fin),
  interval: z19.enum(["day", "week", "month", "year"]).meta(ops),
  interval_count: z19.number().int().min(1).meta(ops),
  usage_type: z19.enum(["licensed", "metered"]).meta(ops),
  /** Per-unit amount; null when the price is tiered/package and its terms ride elsewhere. */
  unit_amount_minor: unsignedMinor().nullable().meta(fin),
  /** TASK-28: the exact price terms. Optional (additive); absent + null amount = `missing_price_terms` gap. */
  terms: BillingPriceTermsSchema.optional().meta(fin)
}).meta(transient2("BillingRecurringPrice"));
var BillingRecurrenceSchema = z19.strictObject({
  /** The instant billing periods are anchored to. */
  billing_cycle_anchor_at: isoDateTime().meta(ops),
  /** How the source prorates changes. `none` means changes carry no proration lines. */
  proration_behavior: z19.enum(["create_prorations", "always_invoice", "none"]).meta(ops),
  /** Stripe billing mode; `flexible` permits mixed item intervals and changes proration math. */
  billing_mode: z19.enum(["classic", "flexible"]).optional().meta(ops),
  collection_method: z19.enum(["charge_automatically", "send_invoice"]).meta(ops),
  /** Days from finalization to due date for `send_invoice`; null otherwise. */
  days_until_due: z19.number().int().min(0).nullable().optional().meta(ops)
}).meta(transient2("BillingRecurrence"));
var BillingEconomicOwnerSchema = z19.strictObject({
  /** The provider account whose books own the sale. */
  owner_account_id: providerId2().meta(fin),
  /** `platform` = no Connect involvement. */
  charge_type: z19.enum(["platform", "direct", "destination", "separate_charges_and_transfers"]).meta(ops),
  /** Connect `on_behalf_of`, when set. */
  on_behalf_of_account_id: providerId2().nullable().optional().meta(fin),
  /** The transfer that moved funds between the two accounts, when there is one. It is never a second sale. */
  transfer_id: providerId2().nullable().optional().meta(fin)
}).meta(transient2("BillingEconomicOwner"));
var BillingSettlementAmountSchema = z19.strictObject({
  ...currencyFields,
  amount_minor: unsignedMinor().meta(fin)
}).meta(transient2("BillingSettlementAmount"));
var economicOwner = { economic_owner: BillingEconomicOwnerSchema.optional().meta(fin) };
var BillingSubscriptionItemSnapshotSchema = z19.strictObject({
  item_id: providerId2().meta(fin),
  price: BillingRecurringPriceSchema.meta(fin),
  /** Contracted quantity. Never negative; zero is a valid (zero-stock) state. */
  quantity: z19.number().int().min(0).meta(fin),
  /** Item-level trial window, when the provider supports item trials. */
  trial_end_at: isoDateTime().nullable().optional().meta(ops)
}).meta(transient2("BillingSubscriptionItemSnapshot"));
var subscriptionState = {
  subscription_id: providerId2().meta(fin),
  status_after: StripeSubscriptionStatusSchema.meta(ops),
  /** End of this revision's effective interval `[effective_at, next_effective_at)`; null = open. */
  next_effective_at: isoDateTime().nullable().meta(ops),
  ...currencyFields,
  items: z19.array(BillingSubscriptionItemSnapshotSchema).min(1).max(MAX_BILLING_PROFILE_LIST).meta(fin),
  items_coverage: listCoverage(),
  /** TASK-28: exact subscription-level recurrence (anchor, proration, collection). Optional (additive). */
  recurrence: BillingRecurrenceSchema.optional().meta(ops)
};
var trialWindow = {
  trial_start_at: isoDateTime().meta(ops),
  trial_end_at: isoDateTime().meta(ops)
};
var targetOccurrence = {
  target_occurrence_key: z19.string().min(1).max(512).meta(ops)
};
var sub = (kind) => base("subscription", kind, true);
var BillingSubscriptionProfileSchema = z19.discriminatedUnion("kind", [
  z19.strictObject({ ...sub("create"), ...subscriptionState }),
  z19.strictObject({ ...sub("change"), ...subscriptionState }),
  z19.strictObject({
    ...sub("renew"),
    ...subscriptionState,
    current_period_start_at: isoDateTime().meta(ops),
    current_period_end_at: isoDateTime().meta(ops)
  }),
  /** Cancellation needs no price: it ends the contract at `effective_at`. */
  z19.strictObject({
    ...sub("cancel"),
    subscription_id: providerId2().meta(fin),
    status_after: StripeSubscriptionStatusSchema.meta(ops),
    cancel_mode: z19.enum(["immediate", "period_end"]).meta(ops),
    reason: z19.string().min(1).max(64).optional().meta(ops)
  }),
  /** `collection` pauses bill collection only; the contract stays active (plan 252 A-3). */
  z19.strictObject({
    ...sub("pause"),
    subscription_id: providerId2().meta(fin),
    pause_mode: z19.enum(["service", "collection"]).meta(ops),
    resumes_at: isoDateTime().nullable().meta(ops)
  }),
  z19.strictObject({
    ...sub("resume"),
    subscription_id: providerId2().meta(fin),
    pause_mode: z19.enum(["service", "collection"]).meta(ops)
  }),
  z19.strictObject({ ...sub("trial_start"), ...subscriptionState, ...trialWindow }),
  /** Conversion carries the converting items: the first positive stock after the trial. */
  z19.strictObject({ ...sub("trial_convert"), ...subscriptionState, ...trialWindow }),
  z19.strictObject({
    ...sub("trial_expire"),
    subscription_id: providerId2().meta(fin),
    status_after: StripeSubscriptionStatusSchema.meta(ops),
    ...trialWindow
  }),
  z19.strictObject({ ...sub("retract"), subscription_id: providerId2().meta(fin), ...targetOccurrence }),
  z19.strictObject({ ...sub("correct"), ...subscriptionState, ...targetOccurrence })
]).meta(transient2("BillingSubscriptionProfile"));
var sch = (kind) => base("schedule", kind, true);
var BillingScheduleProfileSchema = z19.discriminatedUnion("kind", [
  /**
   * One authoritative future phase. `observed_through` is the watermark the
   * phase set is known to; `phases_coverage: partial` means a missing phase
   * is NOT proof of no change (revenue-accounting §8).
   */
  z19.strictObject({
    ...sch("phase_declared"),
    schedule_id: providerId2().meta(fin),
    subscription_id: providerId2().nullable().meta(fin),
    phase_index: z19.number().int().min(0).meta(ops),
    phase_start_at: isoDateTime().meta(ops),
    phase_end_at: isoDateTime().nullable().meta(ops),
    ...currencyFields,
    items: z19.array(BillingSubscriptionItemSnapshotSchema).min(1).max(MAX_BILLING_PROFILE_LIST).meta(fin),
    observed_through: isoDateTime().meta(ops),
    phases_coverage: listCoverage(),
    /** TASK-28: the phase's recurrence (a phase may change proration or anchor). */
    recurrence: BillingRecurrenceSchema.optional().meta(ops)
  }),
  /** A cancellation requested now for a later instant; today's stock is unchanged until `cancel_effective_at`. */
  z19.strictObject({
    ...sch("cancellation_scheduled"),
    subscription_id: providerId2().meta(fin),
    cancel_effective_at: isoDateTime().meta(ops)
  }),
  z19.strictObject({
    ...sch("cancellation_withdrawn"),
    subscription_id: providerId2().meta(fin),
    ...targetOccurrence
  }),
  z19.strictObject({ ...sch("retract"), schedule_id: providerId2().meta(fin), ...targetOccurrence })
]).meta(transient2("BillingScheduleProfile"));
var inv = (kind) => base("invoice", kind, false);
var lineAmounts = (sign) => {
  const amount = sign === "signed" ? signedMinor : unsignedMinor;
  return {
    ...currencyFields,
    subtotal_minor: amount().meta(fin),
    discount_minor: unsignedMinor().meta(fin),
    tax_minor: unsignedMinor().meta(fin),
    total_minor: amount().meta(fin)
  };
};
var lineIdentity = {
  invoice_id: providerId2().meta(fin),
  line_id: providerId2().meta(fin)
};
var InvoiceStatusSchema = z19.enum(["draft", "open", "paid", "uncollectible", "void"]).meta(transient2("InvoiceStatus"));
var InvoiceSettlementBasisSchema = z19.enum(["payments", "zero_total", "customer_balance", "credit_note", "rollover", "out_of_band", "mixed"]).meta(transient2("InvoiceSettlementBasis"));
var InvoicePaymentStatusSchema = z19.enum(["open", "paid", "canceled"]).meta(transient2("InvoicePaymentStatus"));
var BillingInvoicePaymentSourceSchema = z19.discriminatedUnion("type", [
  z19.strictObject({ type: z19.literal("payment_intent").meta(ops), payment_id: providerId2().meta(fin) }),
  z19.strictObject({ type: z19.literal("charge").meta(ops), payment_id: providerId2().meta(fin) }),
  z19.strictObject({ type: z19.literal("out_of_band").meta(ops) })
]).meta(transient2("BillingInvoicePaymentSource"));
var BillingInvoiceProfileSchema = z19.discriminatedUnion("kind", [
  /** The finalized header: due obligation, and whether every line page was hydrated. */
  z19.strictObject({
    ...inv("finalized"),
    invoice_id: providerId2().meta(fin),
    subscription_id: providerId2().nullable().meta(fin),
    ...currencyFields,
    total_minor: signedMinor().meta(fin),
    amount_due_minor: unsignedMinor().meta(fin),
    due_at: isoDateTime().nullable().meta(ops),
    line_count: z19.number().int().min(0).meta(ops),
    lines_coverage: listCoverage(),
    /** TASK-28: InvoicePayment edges known for this invoice, and whether every page was hydrated. */
    payment_count: z19.number().int().min(0).optional().meta(ops),
    payments_coverage: listCoverage().optional().meta(ops)
  }),
  /**
   * A recurring line: item reference, service period and the recurring price
   * snapshot. `proration: true` lines may be negative (a proration CREDIT);
   * a non-proration recurring line may not.
   */
  z19.strictObject({
    ...inv("recurring_line"),
    ...lineIdentity,
    subscription_id: providerId2().meta(fin),
    subscription_item_id: providerId2().meta(fin),
    price: BillingRecurringPriceSchema.meta(fin),
    quantity: z19.number().int().min(0).meta(fin),
    service_period_start_at: isoDateTime().meta(ops),
    service_period_end_at: isoDateTime().meta(ops),
    proration: z19.boolean().meta(ops),
    ...lineAmounts("signed")
  }),
  z19.strictObject({
    ...inv("trial_line"),
    ...lineIdentity,
    subscription_id: providerId2().meta(fin),
    subscription_item_id: providerId2().meta(fin),
    ...trialWindow,
    ...lineAmounts("unsigned")
  }),
  /** A one-time line has NO recurrence fields — none can be invented for it. May be a negative invoice-item credit. */
  z19.strictObject({
    ...inv("one_time_line"),
    ...lineIdentity,
    price_id: providerId2().nullable().meta(fin),
    quantity: z19.number().int().min(0).meta(fin),
    ...lineAmounts("signed")
  }),
  /**
   * TASK-28 — one InvoicePayment: a single EDGE of the many-to-many
   * invoice↔payment relation (plan 252 A-11). `amount_paid_minor` is what
   * this payment ALLOCATED to this invoice — never the payment's full
   * received amount, never the invoice total. One payment funding two
   * invoices is two edges; two payments settling one invoice is two edges.
   * `amount_paid_minor` is null until the edge is `paid`.
   */
  z19.strictObject({
    ...inv("payment_allocation"),
    invoice_payment_id: providerId2().meta(fin),
    invoice_id: providerId2().meta(fin),
    payment: BillingInvoicePaymentSourceSchema.meta(fin),
    status: InvoicePaymentStatusSchema.meta(ops),
    /** Stripe `is_default`: the invoice's default payment attempt. */
    is_default: z19.boolean().optional().meta(ops),
    ...currencyFields,
    amount_requested_minor: unsignedMinor().meta(fin),
    amount_paid_minor: unsignedMinor().nullable().meta(fin),
    paid_at: isoDateTime().nullable().meta(ops),
    ...economicOwner
  }),
  /**
   * TASK-28 — a receivable transition of one invoice (revenue-accounting
   * §7). Repeatable: one invoice may go open → uncollectible → paid. The
   * amounts are the invoice's state AFTER the transition; a write-off is
   * the remaining amount at `→ uncollectible`, a recovery is
   * `uncollectible → paid`. A refund never appears here: it does not
   * reopen a receivable.
   */
  z19.strictObject({
    ...base("invoice", "status_transition", true),
    invoice_id: providerId2().meta(fin),
    subscription_id: providerId2().nullable().meta(fin),
    from_status: InvoiceStatusSchema.meta(ops),
    to_status: InvoiceStatusSchema.meta(ops),
    ...currencyFields,
    amount_due_minor: unsignedMinor().meta(fin),
    amount_paid_minor: unsignedMinor().meta(fin),
    amount_remaining_minor: unsignedMinor().meta(fin),
    due_at: isoDateTime().nullable().meta(ops),
    /** Stripe `paid_out_of_band`: marked paid with no provider payment. */
    paid_out_of_band: z19.boolean().meta(ops),
    /** How a `→ paid` transition was settled; null for every other transition. */
    settlement_basis: InvoiceSettlementBasisSchema.nullable().meta(ops)
  })
]).meta(transient2("BillingInvoiceProfile"));
var INVOICE_RECEIVABLE_TRANSITIONS = Object.freeze({
  "draft->open": "finalized",
  "draft->paid": "settled",
  "open->paid": "settled",
  "open->void": "voided",
  "open->uncollectible": "written_off",
  "uncollectible->paid": "recovered",
  "uncollectible->void": "write_off_voided"
});
function classifyInvoiceTransition(from, to) {
  return INVOICE_RECEIVABLE_TRANSITIONS[`${from}->${to}`] ?? null;
}
var txn = (kind) => base("transaction", kind, false);
var paymentObservation = {
  payment_id: providerId2().meta(fin),
  observed_object_type: z19.enum(["payment_intent", "charge", "invoice", "invoice_payment", "checkout_session"]).meta(ops),
  observed_object_id: providerId2().meta(fin),
  ...currencyFields,
  ...economicOwner
};
var BillingTransactionProfileSchema = z19.discriminatedUnion("kind", [
  /** Captured cash at capture time (revenue-accounting §6). The only kind that is a collection. */
  z19.strictObject({
    ...txn("payment_captured"),
    ...paymentObservation,
    amount_captured_minor: unsignedMinor().meta(fin),
    amount_requested_minor: unsignedMinor().optional().meta(fin),
    /**
     * TASK-28: whether every InvoicePayment edge of this payment was
     * hydrated. `partial` means its unapplied remainder is UNKNOWN, not the
     * difference against the edges seen.
     */
    allocations_coverage: listCoverage().optional().meta(ops)
  }),
  z19.strictObject({
    ...txn("payment_failed"),
    ...paymentObservation,
    amount_requested_minor: unsignedMinor().meta(fin),
    failure_code: z19.string().min(1).max(128).meta(ops)
  }),
  z19.strictObject({
    ...txn("payment_pending"),
    ...paymentObservation,
    amount_requested_minor: unsignedMinor().meta(fin)
  }),
  z19.strictObject({
    ...txn("payment_canceled"),
    ...paymentObservation,
    amount_requested_minor: unsignedMinor().meta(fin)
  })
]).meta(transient2("BillingTransactionProfile"));
var BillingAllocationSchema = z19.strictObject({
  allocation_id: z19.string().min(1).max(255).meta(ops),
  invoice_id: providerId2().meta(fin),
  invoice_line_id: providerId2().nullable().meta(fin),
  amount_minor: unsignedMinor().meta(fin)
}).meta(transient2("BillingAllocation"));
var rfd = (kind) => base("refund", kind, false);
var BillingRefundProfileSchema = z19.discriminatedUnion("kind", [
  /**
   * One refund. Its statuses are REVISIONS of one occurrence; only
   * `succeeded` nets collections, and a later `failed`/`canceled` revision
   * restores it (plan 252 A-5).
   */
  z19.strictObject({
    ...rfd("refund"),
    refund_id: providerId2().meta(fin),
    payment_id: providerId2().meta(fin),
    status: z19.enum(["pending", "requires_action", "succeeded", "failed", "canceled"]).meta(ops),
    ...currencyFields,
    amount_minor: unsignedMinor().meta(fin),
    reason: z19.enum(["duplicate", "fraudulent", "requested_by_customer", "expired_uncaptured_charge", "other"]).nullable().meta(ops),
    credit_note_id: providerId2().nullable().meta(fin),
    allocations: z19.array(BillingAllocationSchema).max(MAX_BILLING_PROFILE_LIST).meta(fin),
    ...economicOwner
  }),
  /**
   * A cumulative provider total (e.g. `charge.amount_refunded`): a
   * reconciliation OBSERVATION, never a debit. Carries no refund id.
   */
  z19.strictObject({
    ...rfd("refund_total_observed"),
    payment_id: providerId2().meta(fin),
    ...currencyFields,
    amount_refunded_cumulative_minor: unsignedMinor().meta(fin)
  })
]).meta(transient2("BillingRefundProfile"));
var crd = (kind) => base("credit", kind, false);
var BillingCreditNoteLineSchema = z19.strictObject({
  credit_line_id: providerId2().meta(fin),
  invoice_line_id: providerId2().nullable().meta(fin),
  amount_minor: unsignedMinor().meta(fin)
}).meta(transient2("BillingCreditNoteLine"));
var creditNote = {
  credit_note_id: providerId2().meta(fin),
  invoice_id: providerId2().meta(fin),
  ...currencyFields,
  total_minor: unsignedMinor().meta(fin),
  reason: z19.enum(["duplicate", "fraudulent", "order_change", "product_unsatisfactory", "other"]).nullable().meta(ops),
  lines: z19.array(BillingCreditNoteLineSchema).max(MAX_BILLING_PROFILE_LIST).meta(fin),
  lines_coverage: listCoverage()
};
var BillingCreditSettlementSchema = z19.discriminatedUnion("method", [
  z19.strictObject({ method: z19.literal("refund").meta(ops), refund_id: providerId2().meta(fin) }),
  z19.strictObject({ method: z19.literal("customer_balance").meta(ops), balance_transaction_id: providerId2().meta(fin) }),
  z19.strictObject({ method: z19.literal("out_of_band").meta(ops), out_of_band_amount_minor: unsignedMinor().meta(fin) })
]).meta(transient2("BillingCreditSettlement"));
var BillingCreditProfileSchema = z19.discriminatedUnion("kind", [
  /** Reduces the receivable before payment; no cash outflow. */
  z19.strictObject({ ...crd("issued_pre_payment"), ...creditNote }),
  /** After payment: must say where the value went (refund / customer balance / out of band). */
  z19.strictObject({
    ...crd("issued_post_payment"),
    ...creditNote,
    settlements: z19.array(BillingCreditSettlementSchema).min(1).max(MAX_BILLING_PROFILE_LIST).meta(fin)
  }),
  z19.strictObject({
    ...crd("voided"),
    credit_note_id: providerId2().meta(fin),
    invoice_id: providerId2().meta(fin)
  })
]).meta(transient2("BillingCreditProfile"));
var bal = (kind, repeatable = false) => base("balance", kind, repeatable);
var grantFields = {
  grant_id: providerId2().meta(fin),
  /** `paid` grants were funded by the customer; `promotional` grants were not cash. */
  category: z19.enum(["paid", "promotional"]).meta(ops),
  ...currencyFields
};
var BillingBalanceProfileSchema = z19.discriminatedUnion("kind", [
  /** Signed customer-balance movement: negative = credit to the customer, positive = debit. */
  z19.strictObject({
    ...bal("balance_adjusted"),
    balance_transaction_id: providerId2().meta(fin),
    ...currencyFields,
    amount_minor: signedMinor().meta(fin),
    balance_type: z19.enum(["customer_balance", "invoice_credit_balance"]).meta(ops),
    invoice_id: providerId2().nullable().meta(fin),
    /**
     * TASK-28: what moved the balance (Stripe customer balance transaction
     * `type`, narrowed). Applying funded balance to an invoice is not cash;
     * an overpayment credited to the balance is not a sale.
     */
    adjustment_source: z19.enum(["invoice_applied", "invoice_unapplied", "credit_note", "overpayment", "rollover", "manual_adjustment", "migration", "other"]).optional().meta(ops),
    /** TASK-28: the credit note that credited the balance, when `adjustment_source` is `credit_note`. */
    credit_note_id: providerId2().nullable().optional().meta(fin)
  }),
  z19.strictObject({
    ...bal("credit_grant_funded"),
    ...grantFields,
    amount_minor: unsignedMinor().meta(fin),
    expires_at: isoDateTime().nullable().meta(ops)
  }),
  /** Applying funded credit to an invoice is NOT fresh cash (plan 252 A-11). Repeatable per grant. */
  z19.strictObject({
    ...bal("credit_grant_applied", true),
    ...grantFields,
    invoice_id: providerId2().meta(fin),
    amount_minor: unsignedMinor().meta(fin),
    /** TASK-28: the `credit_grant_funded` occurrence this application draws on (provenance, never new cash). */
    funding_occurrence_key: z19.string().min(1).max(512).optional().meta(ops)
  }),
  z19.strictObject({
    ...bal("credit_grant_expired"),
    ...grantFields,
    amount_minor: unsignedMinor().meta(fin)
  })
]).meta(transient2("BillingBalanceProfile"));
var loss = (kind, repeatable) => base("loss", kind, repeatable);
var lossReferences = {
  ...economicOwner,
  /** TASK-28: the processor-settlement amount, kept apart from the payment currency (A-12). */
  settlement_amount: BillingSettlementAmountSchema.optional().meta(fin)
};
var disputeFunds = {
  dispute_id: providerId2().meta(fin),
  payment_id: providerId2().meta(fin),
  balance_transaction_id: providerId2().meta(fin),
  ...currencyFields,
  amount_minor: unsignedMinor().meta(fin),
  ...lossReferences
};
var BillingLossProfileSchema = z19.discriminatedUnion("kind", [
  /** A VERIFIED withdrawal of funds; status alone never creates one. */
  z19.strictObject({ ...loss("dispute_funds_withdrawn", true), ...disputeFunds }),
  z19.strictObject({
    ...loss("dispute_funds_reinstated", true),
    ...disputeFunds,
    /** TASK-28: the withdrawal occurrence this reinstatement reverses. A recovery links a recorded deduction. */
    reverses_occurrence_key: z19.string().min(1).max(512).optional().meta(ops)
  }),
  /** Inquiry / status update: no verified economic movement, so no amount field exists. */
  z19.strictObject({
    ...loss("dispute_status_changed", true),
    dispute_id: providerId2().meta(fin),
    payment_id: providerId2().meta(fin),
    status: z19.enum(["warning_needs_response", "warning_under_review", "warning_closed", "needs_response", "under_review", "won", "lost"]).meta(ops)
  }),
  z19.strictObject({
    ...loss("payment_returned", false),
    return_id: providerId2().meta(fin),
    payment_id: providerId2().meta(fin),
    ...currencyFields,
    amount_minor: unsignedMinor().meta(fin),
    ...lossReferences
  })
]).meta(transient2("BillingLossProfile"));
var BILLING_PROFILE_NAMES = [
  "subscription",
  "schedule",
  "invoice",
  "transaction",
  "refund",
  "credit",
  "balance",
  "loss"
];
var PROFILE_UNIONS = {
  subscription: BillingSubscriptionProfileSchema,
  schedule: BillingScheduleProfileSchema,
  invoice: BillingInvoiceProfileSchema,
  transaction: BillingTransactionProfileSchema,
  refund: BillingRefundProfileSchema,
  credit: BillingCreditProfileSchema,
  balance: BillingBalanceProfileSchema,
  loss: BillingLossProfileSchema
};
var BILLING_PROFILE_KINDS = Object.fromEntries(
  BILLING_PROFILE_NAMES.map((name) => [
    name,
    PROFILE_UNIONS[name].options.map((option) => option.shape.kind.value)
  ])
);
var field = (name) => (p) => String(p[name]);
var line = (p) => `${String(p.invoice_id)}/${String(p.line_id)}`;
var BILLING_OCCURRENCE_RULES = {
  subscription: Object.fromEntries(
    ["create", "change", "renew", "cancel", "pause", "resume", "trial_start", "trial_convert", "trial_expire", "retract", "correct"].map((kind) => [kind, { subject: field("subscription_id"), repeatable: true }])
  ),
  schedule: {
    phase_declared: { subject: field("schedule_id"), repeatable: true },
    cancellation_scheduled: { subject: field("subscription_id"), repeatable: true },
    cancellation_withdrawn: { subject: field("subscription_id"), repeatable: true },
    retract: { subject: field("schedule_id"), repeatable: true }
  },
  invoice: {
    finalized: { subject: field("invoice_id"), repeatable: false, family: "finalized" },
    recurring_line: { subject: line, repeatable: false, family: "line" },
    trial_line: { subject: line, repeatable: false, family: "line" },
    one_time_line: { subject: line, repeatable: false, family: "line" },
    payment_allocation: { subject: field("invoice_payment_id"), repeatable: false, family: "invoice_payment" },
    status_transition: { subject: field("invoice_id"), repeatable: true }
  },
  transaction: Object.fromEntries(
    ["payment_captured", "payment_failed", "payment_pending", "payment_canceled"].map((kind) => [kind, { subject: field("payment_id"), repeatable: false, family: "payment" }])
  ),
  refund: {
    refund: { subject: field("refund_id"), repeatable: false, family: "refund" },
    refund_total_observed: { subject: field("payment_id"), repeatable: false, family: "refund_total" }
  },
  credit: Object.fromEntries(
    ["issued_pre_payment", "issued_post_payment", "voided"].map((kind) => [kind, { subject: field("credit_note_id"), repeatable: false, family: "credit_note" }])
  ),
  balance: {
    balance_adjusted: { subject: field("balance_transaction_id"), repeatable: false, family: "balance_transaction" },
    credit_grant_funded: { subject: field("grant_id"), repeatable: false, family: "grant_funded" },
    credit_grant_applied: { subject: field("grant_id"), repeatable: true },
    credit_grant_expired: { subject: field("grant_id"), repeatable: false, family: "grant_expired" }
  },
  loss: {
    dispute_funds_withdrawn: { subject: field("dispute_id"), repeatable: true },
    dispute_funds_reinstated: { subject: field("dispute_id"), repeatable: true },
    dispute_status_changed: { subject: field("dispute_id"), repeatable: true },
    payment_returned: { subject: field("return_id"), repeatable: false, family: "return" }
  }
};
var seg = (value) => encodeURIComponent(value);
function deriveBillingOccurrenceKey(profile) {
  const rule = BILLING_OCCURRENCE_RULES[profile.profile]?.[profile.kind];
  if (!rule) throw new Error(`no occurrence rule for billing profile ${profile.profile}.${profile.kind}`);
  const discriminator = rule.repeatable ? profile.occurrence.source_occurrence_ref : rule.family;
  if (!discriminator) throw new Error(`${profile.profile}.${profile.kind} is repeatable and needs occurrence.source_occurrence_ref`);
  const { source } = profile;
  return [
    BILLING_OCCURRENCE_KEY_PREFIX,
    seg(source.tenant_id),
    seg(source.provider),
    seg(source.account_id),
    source.livemode ? "live" : "test",
    source.simulation_id === void 0 ? "-" : `sim=${seg(source.simulation_id)}`,
    profile.profile,
    seg(rule.subject(profile)),
    seg(discriminator)
  ].join(":");
}
function deriveBillingRevisionKey(profile) {
  return `${profile.occurrence.occurrence_key}#rev=${seg(profile.occurrence.source_revision)}`;
}
function deriveBillingAllocationKey(occurrenceKey, allocationId) {
  return `${occurrenceKey}/alloc=${seg(allocationId)}`;
}
var BILLING_UNIQUE_KEYS = {
  logical_occurrence: ["source.tenant_id", "occurrence.occurrence_key"],
  source_revision: ["source.tenant_id", "occurrence.occurrence_key", "occurrence.source_revision"],
  allocation: ["source.tenant_id", "occurrence.occurrence_key", "allocations[].allocation_id"],
  output_generation: ["tenant_id", "policy_version", "generation_id", "output_key"],
  /** TASK-28: one credit-note line allocation (the credit side of refund/credit allocation). */
  credit_allocation: ["source.tenant_id", "occurrence.occurrence_key", "lines[].credit_line_id"],
  /** TASK-28: one InvoicePayment edge — its occurrence is the InvoicePayment object. */
  invoice_payment_allocation: ["source.tenant_id", "occurrence.occurrence_key"],
  /** TASK-28: one immutable accounting revision row. */
  accounting_revision: ["source.tenant_id", "revision_key"],
  /** TASK-28: one provider-customer → RT-account mapping revision. */
  mapping_revision: ["source.tenant_id", "source.provider", "source.account_id", "source.livemode", "source.simulation_id", "customer_ref", "mapping_revision"],
  /** TASK-28: one derived output generation (its checkpoint rides on it). */
  generation: ["tenant_id", "generation_id"],
  /** TASK-28: one coverage checkpoint per scope, RT account and fact family. */
  coverage_checkpoint: ["source.tenant_id", "source.provider", "source.account_id", "source.livemode", "source.simulation_id", "rt_account_id", "family"]
};
var BILLING_ITEM_JOIN_KEYS = ["tenant_id", "account_id", "livemode", "item_id"];
var after = (a, b) => Date.parse(a) > Date.parse(b);
var isNegative = (minor) => minor.startsWith("-");
function refineProfile(profile, ctx) {
  const fail = (path, message) => ctx.addIssue({ code: "custom", path, message });
  const p = profile;
  let expectedKey;
  try {
    expectedKey = deriveBillingOccurrenceKey(p);
  } catch (error) {
    fail(["occurrence"], error.message);
  }
  if (expectedKey !== void 0 && p.occurrence.occurrence_key !== expectedKey) {
    fail(["occurrence", "occurrence_key"], `occurrence_key must be the source-qualified v2 key ${expectedKey}`);
  }
  if (p.occurrence.supersedes_revision != null && p.occurrence.supersedes_revision === p.occurrence.source_revision) {
    fail(["occurrence", "supersedes_revision"], "a revision cannot supersede itself");
  }
  const next = p.next_effective_at;
  if (typeof next === "string" && !after(next, p.effective_at)) {
    fail(["next_effective_at"], "the effective interval [effective_at, next_effective_at) must be non-empty");
  }
  const items = p.items;
  if (items) {
    const ids = items.map((item) => item.item_id);
    if (new Set(ids).size !== ids.length) fail(["items"], "each subscription item appears once per revision");
  }
  const trial = p;
  if (trial.trial_start_at && trial.trial_end_at && !after(trial.trial_end_at, trial.trial_start_at)) {
    fail(["trial_end_at"], "a trial ends after it starts");
  }
  if (p.profile === "invoice" && p.kind === "recurring_line") {
    if (!p.proration && (isNegative(p.subtotal_minor) || isNegative(p.total_minor))) {
      fail(["total_minor"], "only a proration line may carry a negative recurring amount");
    }
    if (!after(p.service_period_end_at, p.service_period_start_at)) {
      fail(["service_period_end_at"], "a service period ends after it starts");
    }
  }
  if (p.profile === "schedule" && p.kind === "phase_declared" && p.phase_end_at != null && !after(p.phase_end_at, p.phase_start_at)) {
    fail(["phase_end_at"], "a schedule phase ends after it starts");
  }
  if (p.profile === "refund" && p.kind === "refund") {
    const allocated = p.allocations.reduce((sum, a) => sum + BigInt(a.amount_minor), 0n);
    if (allocated > BigInt(p.amount_minor)) fail(["allocations"], "allocations cannot exceed the refund amount");
    const allocationIds = p.allocations.map((a) => a.allocation_id);
    if (new Set(allocationIds).size !== allocationIds.length) fail(["allocations"], "allocation ids are unique within a refund");
  }
  if (p.profile === "credit" && (p.kind === "issued_pre_payment" || p.kind === "issued_post_payment") && p.lines_coverage === "complete") {
    const lineSum = p.lines.reduce((sum, l) => sum + BigInt(l.amount_minor), 0n);
    if (lineSum !== BigInt(p.total_minor)) fail(["lines"], "complete credit-note lines sum to the credit-note total");
  }
  refineTask28(p, fail);
}
var decimalEqualsMinor = (decimal, minor) => decimal.replace(/\.0+$/, "") === minor;
function priceIssues(price) {
  const issues = [];
  const terms = price.terms;
  if (!terms) return issues;
  if (terms.billing_scheme === "tiered") {
    if (price.unit_amount_minor !== null) issues.push("a tiered price carries no single unit_amount_minor");
    terms.tiers.forEach((tier, i) => {
      const last = i === terms.tiers.length - 1;
      if (last !== (tier.up_to === null)) issues.push("only the last tier is open-ended (up_to: null), and it must be");
      const prev = i > 0 ? terms.tiers[i - 1].up_to : 0;
      if (tier.up_to !== null && prev !== null && tier.up_to <= prev) issues.push("tier bounds strictly ascend");
      if (tier.unit_amount_decimal === null && tier.flat_amount_minor === null) issues.push("a tier prices its units, a flat amount, or both");
    });
  } else if (price.unit_amount_minor !== null && !decimalEqualsMinor(terms.unit_amount_decimal, price.unit_amount_minor)) {
    issues.push("unit_amount_minor and terms.unit_amount_decimal disagree");
  }
  return [...new Set(issues)];
}
function refineTask28(p, fail) {
  const items = p.items;
  items?.forEach((item, i) => {
    for (const issue2 of priceIssues(item.price)) fail(["items", i, "price", "terms"], issue2);
  });
  if (p.profile === "invoice" && p.kind === "recurring_line") {
    for (const issue2 of priceIssues(p.price)) fail(["price", "terms"], issue2);
  }
  if (p.profile === "invoice" && p.kind === "payment_allocation") {
    if (p.status === "paid" !== (p.amount_paid_minor !== null)) {
      fail(["amount_paid_minor"], "an InvoicePayment carries its allocated amount exactly when it is paid");
    }
    if (p.status === "paid" !== (p.paid_at !== null)) fail(["paid_at"], "a paid InvoicePayment records when, and only then");
    if (p.amount_paid_minor !== null && BigInt(p.amount_paid_minor) > BigInt(p.amount_requested_minor)) {
      fail(["amount_paid_minor"], "an allocation cannot exceed the amount requested for this invoice");
    }
  }
  if (p.profile === "invoice" && p.kind === "status_transition") {
    if (classifyInvoiceTransition(p.from_status, p.to_status) === null) {
      fail(["to_status"], `invoice transition ${p.from_status} -> ${p.to_status} is not allowed`);
    }
    if (p.to_status === "paid" !== (p.settlement_basis !== null)) {
      fail(["settlement_basis"], "a transition to paid names its settlement basis, and only such a transition");
    }
    if (p.to_status === "paid" && p.amount_remaining_minor !== "0") fail(["amount_remaining_minor"], "a paid invoice has nothing remaining");
    const due = BigInt(p.amount_due_minor);
    if (BigInt(p.amount_paid_minor) > due || BigInt(p.amount_remaining_minor) > due) {
      fail(["amount_due_minor"], "paid and remaining amounts are bounded by the amount due");
    }
    if (p.paid_out_of_band && p.settlement_basis !== "out_of_band" && p.settlement_basis !== "mixed") {
      fail(["settlement_basis"], "an out-of-band payment settles as out_of_band or mixed");
    }
    if (p.settlement_basis === "zero_total" && due !== 0n) fail(["settlement_basis"], "zero_total settles only a zero amount due");
  }
  if (p.profile === "balance" && p.kind === "balance_adjusted" && p.credit_note_id != null && p.adjustment_source !== "credit_note") {
    fail(["adjustment_source"], "a balance adjustment naming a credit note has adjustment_source credit_note");
  }
  if (p.profile === "loss" && p.kind === "dispute_funds_reinstated" && p.reverses_occurrence_key === p.occurrence.occurrence_key) {
    fail(["reverses_occurrence_key"], "a reinstatement reverses a different (withdrawal) occurrence");
  }
  const owner = p.economic_owner;
  if (owner?.charge_type === "platform" && (owner.on_behalf_of_account_id != null || owner.transfer_id != null)) {
    fail(["economic_owner"], "a platform (non-Connect) movement has no on_behalf_of or transfer");
  }
}
var BillingProfileSchema = z19.discriminatedUnion("profile", [
  BillingSubscriptionProfileSchema,
  BillingScheduleProfileSchema,
  BillingInvoiceProfileSchema,
  BillingTransactionProfileSchema,
  BillingRefundProfileSchema,
  BillingCreditProfileSchema,
  BillingBalanceProfileSchema,
  BillingLossProfileSchema
]).superRefine(refineProfile).meta(transient2("BillingProfile"));
function billingProfileCoverageGaps(profile) {
  const gaps = [];
  const p = profile;
  const push = (fieldName, reason = "partial_hydration") => gaps.push({ occurrence_key: profile.occurrence.occurrence_key, field: fieldName, reason });
  if (p.items_coverage === "partial") push("items");
  if (p.lines_coverage === "partial") push("lines");
  if (p.phases_coverage === "partial") push("phases");
  if (p.payments_coverage === "partial") push("payments");
  if (p.allocations_coverage === "partial") push("allocations");
  const prices = [
    ...(p.items ?? []).map((item) => item.price),
    ...p.price && typeof p.price === "object" ? [p.price] : []
  ];
  if (prices.some((price) => price.unit_amount_minor === null && price.terms === void 0)) push("price_terms", "missing_price_terms");
  return gaps;
}
function billingEconomicOwnership(profile) {
  const owner = profile.economic_owner;
  if (!owner) return "unknown";
  return owner.owner_account_id === profile.source.account_id ? "owner" : "non_owner";
}
function collapseBillingRevisions(profiles) {
  const occurrences = /* @__PURE__ */ new Map();
  const ambiguous = /* @__PURE__ */ new Set();
  const rank = (a, b) => {
    const ao = a.occurrence.source_order;
    const bo = b.occurrence.source_order;
    if (ao != null && bo != null && ao !== bo) return ao - bo;
    return Date.parse(a.source_recorded_at) - Date.parse(b.source_recorded_at);
  };
  for (const profile of profiles) {
    const key = profile.occurrence.occurrence_key;
    const held = occurrences.get(key);
    if (!held) {
      occurrences.set(key, profile);
      continue;
    }
    if (held.occurrence.source_revision === profile.occurrence.source_revision) continue;
    const order = rank(held, profile);
    if (order === 0) ambiguous.add(key);
    else if (order < 0) occurrences.set(key, profile);
  }
  return { occurrences, ambiguous: [...ambiguous].sort() };
}

// scaffold/src/events/models/event-payloads.ts
var { Unrestricted: Unrestricted15 } = DataClassification;
var { Transient: Transient15 } = SchemaPersistence;
var { External: External9 } = SchemaExposure;
var meta4 = (id) => ({
  id,
  "x-revturbine-schema-persistence": Transient15,
  "x-revturbine-schema-exposure": External9
});
var str = () => z20.string().meta(Unrestricted15);
var nstr = () => z20.string().nullable().meta(Unrestricted15);
var onstr = () => z20.string().nullable().optional().meta(Unrestricted15);
var num = () => z20.number().meta(Unrestricted15);
var nnum = () => z20.number().nullable().meta(Unrestricted15);
var bool = () => z20.boolean().meta(Unrestricted15);
var cents = () => z20.number().int().nonnegative().meta(Unrestricted15);
var controlPlaneBase = {
  control_plane_source: z20.enum(["system", "workflow"]).meta(Unrestricted15)
};
var ControlPlaneBarePayload = z20.looseObject({ ...controlPlaneBase });
var PlaybookVersionActionPayload = z20.looseObject({
  ...controlPlaneBase,
  playbook_version_id: str()
});
var EntityActionPayload = z20.looseObject({
  ...controlPlaneBase,
  resource: str(),
  resource_id: z20.string().optional().meta(Unrestricted15)
});
var CliCommandPayload = z20.looseObject({
  ...controlPlaneBase,
  command: str()
});
var WebApiErrorPayload = z20.looseObject({
  ...controlPlaneBase,
  request_id: str(),
  status: z20.number().int().meta(Unrestricted15),
  route: z20.string().optional().meta(Unrestricted15),
  method: z20.string().optional().meta(Unrestricted15),
  error_code: z20.string().optional().meta(Unrestricted15)
});
var AreaViewedPayload = z20.looseObject({ area: str() });
var FeatureGatedPayload = z20.looseObject({
  pathname: nstr(),
  reason: str()
});
var placementLifecycleBase = {
  placement_id: str(),
  surface_slot_id: nstr(),
  payload_id: nstr(),
  decision_id: nstr(),
  decision_source: nstr(),
  /**
   * The `unique_handle` of the entitlement rule / placement rule whose verdict
   * this event records; `null` when no rule matched (BL-0062, worksheet gap
   * G3). On the placement lane this is the winning placement entry's handle —
   * `PlacementOutput.rule_id`, already selected by the local resolver and
   * discarded at emit until now.
   *
   * Optional AND nullable, unlike the required-but-nullable siblings around
   * it. Every SDK already in the field emits these payloads without the key,
   * and `quarantineVerdict` (revturbine-web `src/lib/events/ingest-validation.ts`)
   * holds platform event names to this contract at the ingest boundary — a
   * required field would quarantine live telemetry from every deployed SDK.
   * So: absent = a pre-BL-0062 producer, `null` = no rule matched, string =
   * the winning rule.
   *
   * Why it rides the whole lifecycle base rather than `placement_resolved`
   * alone: attribution reads the exposure and outcome facts and stamps the
   * winning touch's keys onto the movement — "through it rule `usage_70pct`"
   * in the metric-primitives worked example (§3), anchored `touch_time` per
   * its R8. An exposure without the rule key cannot carry that.
   */
  rule_handle: onstr()
};
var PlacementLifecyclePayload = z20.looseObject({ ...placementLifecycleBase });
var PlacementExposedPayload = z20.looseObject({
  ...placementLifecycleBase,
  exposure_basis: z20.string().optional().meta(Unrestricted15)
});
var PlacementOutcomePayload = z20.looseObject({
  ...placementLifecycleBase,
  outcome: str(),
  cta_target: nstr()
});
var PlacementInteractionPayload = z20.looseObject({
  /** The canonical interaction discriminator (plan 181: TYPE is never a name). */
  interaction_type: str(),
  placement_id: onstr(),
  payload_id: onstr(),
  decision_id: onstr(),
  user_id: onstr(),
  action_type: z20.string().optional().meta(Unrestricted15),
  action_success: z20.boolean().optional().meta(Unrestricted15),
  // Nullable AND optional: the SDK's treatment-interaction path sends an
  // explicit null when the caller supplied no timestamp (plan 228 TASK-4 —
  // the typed emit surface surfaced the mismatch; the wire is the truth).
  interaction_at: onstr(),
  remind_after_seconds: z20.number().optional().meta(Unrestricted15),
  /**
   * The `unique_handle` of the placement rule whose treatment the user acted
   * on — `PlacementOutput.rule_id`, the same value the lifecycle lane stamps
   * (BL-0182, follow-up to BL-0062 / #389).
   *
   * `placement_interaction` does not share `placementLifecycleBase` — its
   * placement keys are all optional, because a bare `trackInteraction` caller
   * may supply none of them — so #389's single edit to that base reached the
   * four lifecycle, five slot and three gate events and left the interaction
   * lane without a rule key. The effect was a funnel sliceable by rule at
   * exposure and at outcome but NOT at the click in between, which is the
   * step the CTR and click-through primitives are computed over.
   *
   * Same contract as #389 and for the same reason: optional AND nullable.
   * revturbine-web's `quarantineVerdict`
   * (`src/lib/events/ingest-validation.ts`) holds platform event names to
   * these contracts at the ingest boundary, so a required field would
   * quarantine live interaction telemetry from every SDK already deployed.
   * Absent = a pre-BL-0182 producer or an interaction with no decision in
   * scope, `null` = no rule matched, string = the winning rule.
   */
  rule_handle: onstr()
});
var GateEvaluatedPayloadSchema = z20.looseObject({
  entitlement_handle: str(),
  outcome: z20.enum(["allowed", "limited", "denied"]).meta(Unrestricted15),
  gated: bool(),
  reason: nstr(),
  limit: nnum(),
  used: nnum(),
  remaining: nnum(),
  /**
   * The `unique_handle` of the entitlement rule whose verdict this event
   * records; `null` when no rule matched (BL-0062, worksheet gap G3).
   *
   * This is the rule the §2.6.5 most-permissive selection picked — the one
   * whose `limit` / `enabled` / `allowance_value` produced the `outcome`
   * beside it. Without it the event says WHAT was decided and never WHICH
   * configured rule decided it, which is the rule slice, and the
   * `rule_handle → objective` hop the objective slice needs (BL-0065).
   *
   * Optional as well as nullable — see `placementLifecycleBase.rule_handle`
   * for why a required field would quarantine every deployed SDK's gate
   * telemetry at the ingest boundary.
   */
  rule_handle: onstr()
}).meta(meta4("GateEvaluatedPayload"));
var GateAttemptedPayload = z20.looseObject({ entitlement_handle: str() });
var GateAllowedPayload = z20.looseObject({
  entitlement_handle: str(),
  /** The rule that granted. See `GateEvaluatedPayloadSchema.rule_handle`. */
  rule_handle: onstr()
});
var GateDeniedPayload = z20.looseObject({
  entitlement_handle: str(),
  reason: onstr(),
  /**
   * The rule that denied — `null` on the two identity-shaped denials
   * (`no_plan_identity`, `no_matching_entitlement_rule`), where no rule
   * matched at all. See `GateEvaluatedPayloadSchema.rule_handle`.
   */
  rule_handle: onstr()
});
var slotContextBase = {
  surface_slot_id: nstr(),
  slot_name: nstr(),
  template_ids: z20.array(z20.string()).nullable().meta(Unrestricted15),
  template_id: nstr(),
  surface_type: nstr(),
  category: nstr(),
  decision_source: nstr(),
  reason_codes: z20.array(z20.string()).meta(Unrestricted15),
  decision_id: nstr(),
  /**
   * The placement rule that won this slot — `PlacementOutput.rule_id`, in
   * scope in `slotContext()` and dropped there until now (BL-0062, gap G3).
   *
   * Slot events are a verdict lane, not merely a render log: `slot_filled`
   * says a rule won, `slot_suppressed` / `slot_empty` say none did. Carrying
   * the handle is what lets "which rule keeps losing its slot" be asked at
   * all — `reason_codes` beside it names WHY, never WHOSE. `null` on the
   * terminal-empty events, absent on a pre-BL-0062 producer.
   */
  rule_handle: onstr(),
  /**
   * The app route the slot rendered on (D-30, BL-0207) — computed by the
   * SDK's React layer at emission time, so ingestion-driven discovery can
   * persist it on the discovered surface slot (`SurfaceSlotSchema.route`).
   *
   * A path, never a URL: no origin, no query string, no fragment. The
   * framework route pattern when the host supplies one (Next.js
   * `/projects/[projectId]`); otherwise `location.pathname` with
   * identifier-like segments (numbers, UUIDs, long opaque tokens,
   * email-shaped values) templated to `:id`, so neither PII nor per-entity
   * cardinality reaches the wire. `null` outside a browser; absent on a
   * pre-BL-0207 producer.
   */
  route: onstr()
};
var SlotLifecyclePayload = z20.looseObject({ ...slotContextBase });
var SlotErrorPayload = z20.looseObject({
  ...slotContextBase,
  message: z20.string().optional().meta(Unrestricted15)
});
var SegmentMembershipPayload = z20.looseObject({
  segment_id: str(),
  user_id: nstr()
});
var ExperimentAssignedPayload = z20.looseObject({
  schema_version: z20.number().int().meta(Unrestricted15),
  /** Idempotency key: hash(tenant, handle, version, unit, subject). */
  assignment_id: str(),
  /** Carries the experiment HANDLE (wire vocabulary, spec §8). */
  experiment_id: str(),
  experiment_version: z20.number().int().meta(Unrestricted15),
  variant_key: str(),
  assignment_unit: AnalyticsAnalyticalUnitSchema.meta(Unrestricted15),
  subject_id: str(),
  assigned_at: str(),
  provider_handle: z20.string().optional().meta(Unrestricted15),
  provider_revision: z20.string().optional().meta(Unrestricted15)
});
var UserContextObservedPayload = z20.looseObject({
  /** Field NAMES only — never custom values (plan 114 AC-9). */
  context_fields: z20.array(z20.string()).meta(Unrestricted15)
});
var PageViewPayload = z20.looseObject({
  mode: z20.string().optional().meta(Unrestricted15),
  runtime_mode: z20.string().optional().meta(Unrestricted15),
  source: z20.string().optional().meta(Unrestricted15)
});
var SdkInitPayload = z20.looseObject({
  config_hash_id: z20.string().optional().meta(Unrestricted15),
  sdk_version: z20.string().optional().meta(Unrestricted15),
  runtime_mode: z20.string().optional().meta(Unrestricted15),
  schema_version: z20.string().optional().meta(Unrestricted15),
  bundle_version: z20.string().optional().meta(Unrestricted15),
  config_shape: z20.string().optional().meta(Unrestricted15)
});
var SdkMessagePayload = z20.looseObject({
  message: str(),
  config_hash_id: z20.string().optional().meta(Unrestricted15),
  sdk_version: z20.string().optional().meta(Unrestricted15)
});
var ResolutionFailurePayload = z20.looseObject({
  reason: str(),
  placement_handle: onstr(),
  slot_handle: onstr(),
  surface: onstr(),
  plan_handle: onstr(),
  entitlement_handle: onstr(),
  message: z20.string().optional().meta(Unrestricted15),
  config_hash_id: z20.string().optional().meta(Unrestricted15)
});
var MilestonePayload = z20.looseObject({});
var AcquisitionMilestonePayload = z20.looseObject({
  acquisition_source: z20.string().optional().meta(Unrestricted15)
});
var LifecycleEvidence = z20.looseObject({
  kind: z20.enum(["provider_fact", "app_fact", "usage_exhaustion"]).meta(Unrestricted15),
  /** The producer-scoped reference to the proving fact (a Stripe event id, an
   * app write id, a metering observation id). Opaque to RevTurbine. */
  ref: str()
});
var AccountCreatedPayload = z20.looseObject({
  acquisition_source: z20.string().optional().meta(Unrestricted15),
  /** The account grain (plan 276 R-2) — never a user id. */
  account_id: onstr(),
  /** When the account came into existence, per the producer. */
  created_at: onstr(),
  /** What kind of act created it (e.g. `self_serve_signup`, `invite_accepted`,
   * `provisioned`, `import`). A USER signup is not account creation (R-2). */
  source: onstr(),
  evidence: LifecycleEvidence.nullable().optional()
});
var TrialRevisionPayload = z20.looseObject({
  /** Stable id for the episode this revision belongs to. Conversion links only
   * its OWN episode (plan 276 AC-4), so this is half the identity key. */
  trial_episode_id: str(),
  /** The account the episode is materialized against (R-2). */
  account_id: str(),
  /** `user` retains a user-subject episode WITHOUT making it an account-wide
   * grant (R-2); `account` is an account-wide grant. */
  subject_scope: z20.enum(["account", "user"]).meta(Unrestricted15),
  /** The Playbook trial rule's `unique_handle`, when the episode came from one. */
  rule_handle: onstr(),
  /** The trialed plan's handle, when the episode grants one plan. */
  plan_handle: onstr(),
  /** `free_trial` / `reverse_trial` / anything the tenant runs. Vocabulary only. */
  trial_type: onstr(),
  revision: z20.enum(["started", "extended", "converted", "reverted", "expired", "revoked"]).meta(Unrestricted15),
  /** When the revision took effect, per the proving fact — never the write clock. */
  effective_at: str(),
  /** The declared end. Its passing proves only that the time passed (R-1(c)). */
  scheduled_end_at: onstr(),
  /** The EVIDENCED end. Null until a fact closes the episode. */
  actual_end_at: onstr(),
  evidence: LifecycleEvidence,
  /** The biller's reference when a provider fact is involved (e.g. a Stripe
   * subscription id), so an app fact and a provider derivative about the same
   * episode can be reconciled. */
  provider_ref: onstr()
});
function isEvidencedAccountCreation(payload) {
  const parsed = AccountCreatedPayload.safeParse(payload ?? {});
  if (!parsed.success) return false;
  const { account_id, created_at, source, evidence } = parsed.data;
  return Boolean(account_id && created_at && source && evidence);
}
var UsageRecordedPayload = z20.looseObject({
  metered_units: z20.number().nonnegative().meta(Unrestricted15),
  included_allowance: z20.number().nonnegative().meta(Unrestricted15),
  utilization: num()
});
var PlanViewedPayload = z20.looseObject({
  plan_handle: str(),
  entry_tier: z20.boolean().optional().meta(Unrestricted15)
});
var PromotionAppliedPayload = z20.looseObject({
  promotion_handle: str(),
  plan_handle: z20.string().optional().meta(Unrestricted15)
});
var PromotionConvertedPayload = z20.looseObject({
  promotion_handle: str(),
  full_price: z20.boolean().optional().meta(Unrestricted15),
  plan_handle: z20.string().optional().meta(Unrestricted15)
});
var GrowthSignalObservedPayload = z20.looseObject({
  metric: str(),
  dimension_key: str(),
  dimension_value: str(),
  window_start: str(),
  window_end: str(),
  value: num(),
  numerator: z20.number().optional().meta(Unrestricted15),
  denominator: z20.number().optional().meta(Unrestricted15),
  sample_size: z20.number().int().nonnegative().optional().meta(Unrestricted15)
});
var billingBase = {
  billing_ref: str(),
  plan_handle: str()
};
var subscriptionPricing = {
  billing_period: str(),
  amount_cents: cents(),
  currency: str()
};
var SubscriptionStartedPayload = z20.looseObject({ ...billingBase, ...subscriptionPricing });
var SubscriptionRenewedPayload = z20.looseObject({ ...billingBase, ...subscriptionPricing });
var SubscriptionExpandedPayload = z20.looseObject({
  ...billingBase,
  ...subscriptionPricing,
  previous_plan_handle: z20.string().optional().meta(Unrestricted15),
  /** Signed change against the previous recurring amount. */
  delta_cents: z20.number().int().optional().meta(Unrestricted15),
  /** True when the expansion was a self-serve plan upgrade (pricing.self_serve_upgrade_rate). */
  self_serve: z20.boolean().optional().meta(Unrestricted15)
});
var SubscriptionCanceledPayload = z20.looseObject({
  ...billingBase,
  reason: z20.string().optional().meta(Unrestricted15)
});
var TrialStartedPayload = z20.looseObject({
  ...billingBase,
  trial_rule_handle: str(),
  ends_at: str()
});
var TrialConvertedPayload = z20.looseObject({
  ...billingBase,
  ...subscriptionPricing,
  trial_rule_handle: str()
});
var TrialExpiredPayload = z20.looseObject({
  ...billingBase,
  trial_rule_handle: str()
});
var PaymentSucceededPayload = z20.looseObject({
  billing_ref: str(),
  amount_cents: cents(),
  currency: str(),
  plan_handle: z20.string().optional().meta(Unrestricted15)
});
var PaymentFailedPayload = z20.looseObject({
  billing_ref: str(),
  reason: str(),
  amount_cents: z20.number().int().nonnegative().optional().meta(Unrestricted15),
  currency: z20.string().optional().meta(Unrestricted15),
  plan_handle: z20.string().optional().meta(Unrestricted15)
});
var BILLING_OCCURRENCE_IDENTITY = {
  [LEGACY_BILLING_OCCURRENCE_IDENTITY_VERSION]: {
    keys: ["billing_ref"],
    defect: "Per-class producer keying: subscription_expanded is keyed on the TARGET quantity, so a repeated transition (5\u219210\u21925\u219210) collapses onto the first."
  },
  [BILLING_OCCURRENCE_IDENTITY_VERSION]: {
    keys: BILLING_UNIQUE_KEYS.logical_occurrence,
    revision_keys: BILLING_UNIQUE_KEYS.source_revision,
    legacy_link: "occurrence.legacy_billing_ref"
  }
};
var envelopeIdentity = ["event_id"];
var EVENT_PAYLOAD_CONTRACTS = {
  // Control plane — identity/auth + CLI
  web_signed_up: { schema: ControlPlaneBarePayload, identity: envelopeIdentity },
  web_signed_in: { schema: ControlPlaneBarePayload, identity: envelopeIdentity },
  cli_signed_up: { schema: ControlPlaneBarePayload, identity: envelopeIdentity },
  cli_signed_in: { schema: ControlPlaneBarePayload, identity: envelopeIdentity },
  cli_command_executed: { schema: CliCommandPayload, identity: envelopeIdentity },
  // Control plane — playbook version lifecycle
  playbook_version_submitted: { schema: PlaybookVersionActionPayload, identity: envelopeIdentity },
  playbook_version_approved: { schema: PlaybookVersionActionPayload, identity: envelopeIdentity },
  playbook_version_rejected: { schema: PlaybookVersionActionPayload, identity: envelopeIdentity },
  playbook_version_deployed: { schema: PlaybookVersionActionPayload, identity: envelopeIdentity },
  playbook_version_launched: { schema: PlaybookVersionActionPayload, identity: envelopeIdentity },
  playbook_version_parked: { schema: PlaybookVersionActionPayload, identity: envelopeIdentity },
  playbook_version_resumed: { schema: PlaybookVersionActionPayload, identity: envelopeIdentity },
  playbook_version_discarded: { schema: PlaybookVersionActionPayload, identity: envelopeIdentity },
  playbook_version_archived: { schema: PlaybookVersionActionPayload, identity: envelopeIdentity },
  // Control plane — playbook transfer + CRUD + error telemetry
  playbook_imported: { schema: PlaybookVersionActionPayload, identity: envelopeIdentity },
  playbook_exported: { schema: ControlPlaneBarePayload, identity: envelopeIdentity },
  entity_created: { schema: EntityActionPayload, identity: envelopeIdentity },
  entity_updated: { schema: EntityActionPayload, identity: envelopeIdentity },
  entity_deleted: { schema: EntityActionPayload, identity: envelopeIdentity },
  web_api_error: { schema: WebApiErrorPayload, identity: envelopeIdentity },
  // Control plane — dogfood product signals
  area_viewed: { schema: AreaViewedPayload, identity: envelopeIdentity },
  feature_gated: { schema: FeatureGatedPayload, identity: envelopeIdentity },
  // SDK client — placement lifecycle
  placement_resolved: { schema: PlacementLifecyclePayload, identity: envelopeIdentity },
  placement_rendered: { schema: PlacementLifecyclePayload, identity: envelopeIdentity },
  placement_exposed: { schema: PlacementExposedPayload, identity: envelopeIdentity },
  placement_outcome: { schema: PlacementOutcomePayload, identity: envelopeIdentity },
  placement_interaction: { schema: PlacementInteractionPayload, identity: envelopeIdentity },
  // SDK client — entitlement gates
  gate_evaluated: { schema: GateEvaluatedPayloadSchema, identity: envelopeIdentity },
  gate_attempted: { schema: GateAttemptedPayload, identity: envelopeIdentity },
  gate_allowed: { schema: GateAllowedPayload, identity: envelopeIdentity },
  gate_denied: { schema: GateDeniedPayload, identity: envelopeIdentity },
  // SDK client — slot diagnostics
  slot_evaluated: { schema: SlotLifecyclePayload, identity: envelopeIdentity },
  slot_filled: { schema: SlotLifecyclePayload, identity: envelopeIdentity },
  slot_empty: { schema: SlotLifecyclePayload, identity: envelopeIdentity },
  slot_suppressed: { schema: SlotLifecyclePayload, identity: envelopeIdentity },
  slot_error: { schema: SlotErrorPayload, identity: envelopeIdentity },
  // SDK client — segments, experiments, context, navigation
  segment_enrolled: { schema: SegmentMembershipPayload, identity: envelopeIdentity },
  segment_unenrolled: { schema: SegmentMembershipPayload, identity: envelopeIdentity },
  experiment_assigned: {
    // The WIRE shape, not the allocation plane's fact row — see the schema's
    // own doc for why the plan-224 "reused, not restated" binding was wrong.
    schema: ExperimentAssignedPayload,
    identity: ["assignment_id"]
  },
  user_context_observed: { schema: UserContextObservedPayload, identity: envelopeIdentity },
  clickstream_page_view: { schema: PageViewPayload, identity: envelopeIdentity },
  // SDK client — customer-product lifecycle milestones (promoted, R-1)
  account_created: { schema: AccountCreatedPayload, identity: envelopeIdentity },
  user_signed_up: { schema: AcquisitionMilestonePayload, identity: envelopeIdentity },
  onboarding_completed: { schema: MilestonePayload, identity: envelopeIdentity },
  account_activated: { schema: MilestonePayload, identity: envelopeIdentity },
  product_used: { schema: MilestonePayload, identity: envelopeIdentity },
  value_realized: { schema: MilestonePayload, identity: envelopeIdentity },
  usage_recorded: { schema: UsageRecordedPayload, identity: envelopeIdentity },
  plan_viewed: { schema: PlanViewedPayload, identity: envelopeIdentity },
  promotion_applied: { schema: PromotionAppliedPayload, identity: envelopeIdentity },
  promotion_converted: { schema: PromotionConvertedPayload, identity: envelopeIdentity },
  // App-owned trial episode (plan 276 R-1(b)) — identity is the episode plus
  // the revision, so a retry of the same app fact collapses while a later
  // revision of the same episode stays a distinct occurrence.
  trial_revision: { schema: TrialRevisionPayload, identity: ["trial_episode_id", "revision"] },
  // SDK server — derived observations
  growth_signal_observed: { schema: GrowthSignalObservedPayload, identity: envelopeIdentity },
  // SDK meta lane
  sdk_init: { schema: SdkInitPayload, identity: envelopeIdentity },
  sdk_error: { schema: SdkMessagePayload, identity: envelopeIdentity },
  sdk_validation_warning: { schema: SdkMessagePayload, identity: envelopeIdentity },
  resolution_failure: { schema: ResolutionFailurePayload, identity: envelopeIdentity },
  // Billing lifecycle (R-2) — identity v1 is the producer-minted idempotency
  // key; `billing_profiles` binds the v2 discriminated profile (plan 252 TASK-3)
  subscription_started: {
    schema: SubscriptionStartedPayload,
    identity: ["billing_ref"],
    billing_profiles: [{ profile: "subscription", kinds: ["create"] }]
  },
  subscription_renewed: {
    schema: SubscriptionRenewedPayload,
    identity: ["billing_ref"],
    billing_profiles: [{ profile: "subscription", kinds: ["renew"] }]
  },
  subscription_expanded: {
    schema: SubscriptionExpandedPayload,
    identity: ["billing_ref"],
    billing_profiles: [{ profile: "subscription", kinds: ["change"] }]
  },
  subscription_canceled: {
    schema: SubscriptionCanceledPayload,
    identity: ["billing_ref"],
    billing_profiles: [{ profile: "subscription", kinds: ["cancel"] }, { profile: "schedule", kinds: ["cancellation_scheduled"] }]
  },
  trial_started: {
    schema: TrialStartedPayload,
    identity: ["billing_ref"],
    billing_profiles: [{ profile: "subscription", kinds: ["trial_start"] }]
  },
  trial_converted: {
    schema: TrialConvertedPayload,
    identity: ["billing_ref"],
    billing_profiles: [{ profile: "subscription", kinds: ["trial_convert"] }]
  },
  trial_expired: {
    schema: TrialExpiredPayload,
    identity: ["billing_ref"],
    billing_profiles: [{ profile: "subscription", kinds: ["trial_expire"] }]
  },
  payment_succeeded: {
    schema: PaymentSucceededPayload,
    identity: ["billing_ref"],
    billing_profiles: [{ profile: "transaction", kinds: ["payment_captured"] }]
  },
  payment_failed: {
    schema: PaymentFailedPayload,
    identity: ["billing_ref"],
    billing_profiles: [{ profile: "transaction", kinds: ["payment_failed"] }]
  }
};
var EVENT_PAYLOAD_EVENT_NAMES = Object.keys(
  EVENT_PAYLOAD_CONTRACTS
).sort();
function validateEventPayload(eventName, payload) {
  const contract = EVENT_PAYLOAD_CONTRACTS[eventName];
  if (!contract) return { ok: false, reason: "unknown_event" };
  const parsed = contract.schema.safeParse(payload ?? {});
  if (!parsed.success) {
    return {
      ok: false,
      reason: "schema_violation",
      detail: parsed.error.issues.map((issue2) => `${issue2.path.join(".") || "(root)"}: ${issue2.message}`).join("; ")
    };
  }
  return { ok: true, payload: parsed.data };
}
function validateBillingProfileForEvent(eventName, properties) {
  const contract = EVENT_PAYLOAD_CONTRACTS[eventName];
  const bindings = contract?.billing_profiles;
  if (!bindings) return { ok: false, reason: "no_billing_profile" };
  const parsed = BillingProfileSchema.safeParse(properties);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "schema_violation",
      detail: parsed.error.issues.map((issue2) => `${issue2.path.join(".") || "(root)"}: ${issue2.message}`).join("; ")
    };
  }
  const { profile, kind } = parsed.data;
  if (!bindings.some((b) => b.profile === profile && b.kinds.includes(kind))) {
    return { ok: false, reason: "profile_not_bound", detail: `${eventName} does not carry ${profile}.${kind}` };
  }
  return { ok: true, profile: parsed.data };
}
function boundBillingProfileKinds() {
  const bound = Object.fromEntries(Object.keys(BILLING_PROFILE_KINDS).map((p) => [p, []]));
  for (const contract of Object.values(EVENT_PAYLOAD_CONTRACTS)) {
    for (const binding of contract.billing_profiles ?? []) {
      for (const kind of binding.kinds) if (!bound[binding.profile].includes(kind)) bound[binding.profile].push(kind);
    }
  }
  for (const kinds of Object.values(bound)) kinds.sort();
  return bound;
}

// scaffold/src/events/models/taxonomy.ts
import { z as z21 } from "zod";
var { Unrestricted: Unrestricted16 } = DataClassification;
var { Transient: Transient16 } = SchemaPersistence;
var { External: External10 } = SchemaExposure;
var EventSurfaceSchema = z21.enum(["sdk_client", "sdk_server", "control_plane", "webhook_derived"]).meta({
  id: "EventSurface",
  "x-revturbine-schema-persistence": Transient16,
  "x-revturbine-schema-exposure": External10
});
var EventStabilitySchema = z21.enum(["stable", "internal", "deprecated"]).meta({
  id: "EventStability",
  "x-revturbine-schema-persistence": Transient16,
  "x-revturbine-schema-exposure": External10
});
var EventTaxonomyEntrySchema = z21.object({
  name: z21.string().regex(/^[a-z][a-z0-9_]*$/).meta(Unrestricted16),
  surface: EventSurfaceSchema.meta(Unrestricted16),
  purpose: z21.string().min(1).max(300).meta(Unrestricted16),
  stability: EventStabilitySchema.meta(Unrestricted16)
}).meta({
  id: "EventTaxonomyEntry",
  "x-revturbine-schema-persistence": Transient16,
  "x-revturbine-schema-exposure": External10
});
var EventPrefixFamilySchema = z21.object({
  prefix: z21.string().regex(/^[a-z][a-z0-9_]*_$/).meta(Unrestricted16),
  surface: EventSurfaceSchema.meta(Unrestricted16),
  purpose: z21.string().min(1).max(300).meta(Unrestricted16)
}).meta({
  id: "EventPrefixFamily",
  "x-revturbine-schema-persistence": Transient16,
  "x-revturbine-schema-exposure": External10
});
var EventTaxonomySchema = z21.object({
  version: z21.number().int().min(1).meta(Unrestricted16),
  events: z21.array(EventTaxonomyEntrySchema).min(1).meta(Unrestricted16),
  prefix_families: z21.array(EventPrefixFamilySchema).meta(Unrestricted16)
}).meta({
  id: "EventTaxonomy",
  "x-revturbine-schema-persistence": Transient16,
  "x-revturbine-schema-exposure": External10
});
var CONTROL_PLANE_EVENT_NAMES = [
  "web_signed_up",
  "web_signed_in",
  "cli_signed_up",
  "cli_signed_in",
  "cli_command_executed",
  "playbook_version_submitted",
  "playbook_version_approved",
  "playbook_version_rejected",
  "playbook_version_deployed",
  "playbook_version_launched",
  "playbook_version_parked",
  "playbook_version_resumed",
  "playbook_version_discarded",
  "playbook_version_archived",
  "playbook_imported",
  "playbook_exported",
  "entity_created",
  "entity_updated",
  "entity_deleted",
  "web_api_error"
];
var SDK_CLIENT_EVENT_NAMES = [
  "placement_resolved",
  "placement_rendered",
  "placement_exposed",
  "placement_outcome",
  "placement_interaction",
  "gate_evaluated",
  "gate_attempted",
  "gate_allowed",
  "gate_denied",
  "slot_evaluated",
  "slot_filled",
  "slot_empty",
  "slot_suppressed",
  "slot_error",
  "segment_enrolled",
  "segment_unenrolled",
  "experiment_assigned",
  "user_context_observed",
  // The wire truth (plan 228 TASK-2 audit): `normalizeEventType` namespaces
  // the generic name to `clickstream_page_view` BY DESIGN, so the taxonomy
  // declares the name that actually lands, not the one that never can.
  "clickstream_page_view",
  // Customer-product lifecycle milestones, promoted from the Growth Lab walk
  // under R-1 (the walk owns no vocabulary): real events a customer's product
  // emits, schema-bound and SDK-emittable like every other sdk_client name.
  "account_created",
  "user_signed_up",
  "onboarding_completed",
  "account_activated",
  "product_used",
  "value_realized",
  "usage_recorded",
  "plan_viewed",
  "promotion_applied",
  "promotion_converted",
  // App-owned trial-episode revision (plan 276 R-1(b), TASK-12/TASK-13; ruling
  // D-21). The authoritative fact for an APP-RUN trial: the tenant's product
  // owns trial execution, so only the tenant's product can state that an
  // episode started, was extended, converted, reverted, expired or was
  // revoked. Distinct from the `trial_*` billing band, which is the provider
  // derivative (R-1(a)) and cannot establish enrolment. The clock is never an
  // authority (R-1(c)): an elapsed scheduled end emits nothing at all.
  "trial_revision"
];
var SDK_SERVER_EVENT_NAMES = [
  "growth_signal_observed"
];
var SDK_META_EVENT_NAMES = [
  "sdk_init",
  "sdk_error",
  "sdk_validation_warning",
  "resolution_failure"
];
var DOGFOOD_CLIENT_EVENT_NAMES = ["area_viewed", "feature_gated"];
var WEBHOOK_DERIVED_EVENT_NAMES = [
  "subscription_started",
  "subscription_renewed",
  "subscription_expanded",
  "subscription_canceled",
  "trial_started",
  "trial_converted",
  "trial_expired",
  "payment_succeeded",
  "payment_failed"
];
var EVENT_METADATA = {
  // Control plane — identity
  web_signed_up: { purpose: "An operator created a control-plane account via the web app.", stability: "stable" },
  web_signed_in: { purpose: "An operator signed in to the web app.", stability: "stable" },
  cli_signed_up: { purpose: "An operator created an account through the CLI device flow.", stability: "stable" },
  cli_signed_in: { purpose: "An operator authenticated the CLI.", stability: "stable" },
  cli_command_executed: { purpose: "A CLI command ran; the command name rides on payload.command.", stability: "stable" },
  // Control plane — playbook version lifecycle (plan 228 TASK-2: renamed from
  // the pre-plan-118 changeset_* family; R-3 hard cut, no aliases)
  playbook_version_submitted: { purpose: "A playbook version was submitted for review.", stability: "stable" },
  playbook_version_approved: { purpose: "A playbook version was approved.", stability: "stable" },
  playbook_version_rejected: { purpose: "A playbook version was rejected.", stability: "stable" },
  playbook_version_deployed: { purpose: "A playbook version was compiled and activated.", stability: "stable" },
  playbook_version_launched: { purpose: "A deployed playbook version was launched to traffic.", stability: "stable" },
  playbook_version_parked: { purpose: "A playbook version was parked.", stability: "stable" },
  playbook_version_resumed: { purpose: "A parked playbook version resumed.", stability: "stable" },
  playbook_version_discarded: { purpose: "A draft playbook version was discarded.", stability: "stable" },
  playbook_version_archived: { purpose: "A playbook version was archived.", stability: "stable" },
  // Control plane — playbook transfer + CRUD
  playbook_imported: { purpose: "A Playbook was imported as a staged change set.", stability: "stable" },
  playbook_exported: { purpose: "A Playbook was exported.", stability: "stable" },
  entity_created: { purpose: "A config entity was created; the resource rides on payload.resource.", stability: "stable" },
  entity_updated: { purpose: "A config entity was updated; the resource rides on payload.resource.", stability: "stable" },
  entity_deleted: { purpose: "A config entity was deleted; the resource rides on payload.resource.", stability: "stable" },
  web_api_error: { purpose: "A control-plane API request failed; internal telemetry only, never via the customer SDK.", stability: "internal" },
  // Control plane — dogfood product signals (emitted by revturbine-web via track())
  area_viewed: { purpose: "An authenticated product area of the web app was viewed (dashboard, a studio).", stability: "internal" },
  feature_gated: { purpose: "A nav-gated section of the web app rendered its gate notice \u2014 the control plane\u2019s own paywall analog.", stability: "internal" },
  // SDK client — placement lifecycle
  placement_resolved: { purpose: "The decision engine resolved a placement for a slot.", stability: "stable" },
  placement_rendered: { purpose: "A resolved placement's visual root rendered.", stability: "stable" },
  placement_exposed: { purpose: "A rendered placement met the exposure basis (render or viewport).", stability: "stable" },
  placement_outcome: { purpose: "A placement reached a terminal outcome (converted, dismissed, \u2026).", stability: "stable" },
  placement_interaction: { purpose: "A user interacted with a presented placement.", stability: "stable" },
  // SDK client — entitlement gates
  gate_evaluated: { purpose: "A gate was evaluated during render; the passive denominator signal.", stability: "stable" },
  gate_attempted: { purpose: "A user actively invoked a gated action.", stability: "stable" },
  gate_allowed: { purpose: "An actively invoked gated action was allowed.", stability: "stable" },
  gate_denied: { purpose: "An actively invoked gated action was denied.", stability: "stable" },
  // SDK client — slot delivery diagnostics
  slot_evaluated: { purpose: "A surface slot resolution ran; the funnel denominator.", stability: "stable" },
  slot_filled: { purpose: "A slot resolved to a payload and will render.", stability: "stable" },
  slot_empty: { purpose: "A slot resolved to nothing eligible.", stability: "stable" },
  slot_suppressed: { purpose: "A slot was eligible but suppressed by caps or cooldown.", stability: "stable" },
  slot_error: { purpose: "A slot resolution failed.", stability: "internal" },
  // SDK client — other automatic
  segment_enrolled: { purpose: "A user entered a targeting segment.", stability: "stable" },
  segment_unenrolled: { purpose: "A user left a targeting segment.", stability: "stable" },
  // SDK client — experiment assignment plane (plan 224, spec §9.1)
  experiment_assigned: { purpose: "The assignment fact: emitted once per (experiment_handle, experiment_version, subject) when the resolved assignment snapshot enrolls a subject; carries idempotent assignment_id, experiment_version, variant_key, assignment_unit, subject_id, provider provenance. Unenrolled subjects emit nothing.", stability: "stable" },
  user_context_observed: { purpose: "Reserved: the NAMES of custom user-context fields set on identify/setUserContext. Names only, never values.", stability: "internal" },
  clickstream_page_view: { purpose: "A route change tracked by the SDK router integration.", stability: "stable" },
  // SDK meta lane — anonymous, no tenant or user
  sdk_init: { purpose: "One anonymous adoption beacon per SDK startup.", stability: "internal" },
  sdk_error: { purpose: "The SDK itself malfunctioned; distinct from a decision producing nothing.", stability: "internal" },
  sdk_validation_warning: { purpose: "The SDK found a config or usage problem worth surfacing.", stability: "internal" },
  resolution_failure: { purpose: "A decision produced nothing; allow-listed handles and closed reason codes only.", stability: "internal" },
  // Customer-product lifecycle milestones (plan 228 TASK-2, promoted under R-1)
  account_created: { purpose: "A customer account came into existence in the tenant product; acquisition_source rides on the payload, and the plan-276 REQ-3 account-creation evidence (account_id, created_at, source, evidence) rides on it when the producer holds it.", stability: "stable" },
  user_signed_up: { purpose: "A user completed signup in the tenant product.", stability: "stable" },
  onboarding_completed: { purpose: "A user finished the tenant product onboarding flow.", stability: "stable" },
  account_activated: { purpose: "An account reached the tenant-defined activation milestone.", stability: "stable" },
  product_used: { purpose: "An account performed recurring core product usage.", stability: "stable" },
  value_realized: { purpose: "An account reached the tenant-defined value-realization milestone.", stability: "stable" },
  usage_recorded: { purpose: "A periodic metering observation: metered_units against included_allowance, with utilization.", stability: "stable" },
  plan_viewed: { purpose: "A user viewed plan or pricing content; plan_handle and entry_tier ride on the payload.", stability: "stable" },
  promotion_applied: { purpose: "A promotion was applied to an account; promotion_handle rides on the payload.", stability: "stable" },
  promotion_converted: { purpose: "An account with a promotion converted; full_price marks conversions where the discount lapsed first.", stability: "stable" },
  trial_revision: { purpose: "The app-owned authoritative fact about one trial episode (plan 276 R-1(b)): which revision occurred (started/extended/converted/reverted/expired/revoked), when it took effect, and the evidence that proves it. Trial execution and ownership stay with the customer app.", stability: "stable" },
  // Server-derived observations (plan 228 TASK-2)
  growth_signal_observed: { purpose: "A pre-computed windowed metric observation written by a server-side producer; readers should prefer read-time derivation where a platform source exists.", stability: "internal" },
  // Billing lifecycle (plan 228 R-2) — dual-source: Stripe webhook processor OR typed SDK emit.
  subscription_started: { purpose: "A paid subscription began; payload carries plan_handle, billing_period, amount_cents, currency.", stability: "stable" },
  subscription_renewed: { purpose: "A subscription renewed for another period at its recurring amount.", stability: "stable" },
  subscription_expanded: { purpose: "A subscription grew (seat/tier/usage expansion); amount_cents is the NEW recurring amount, delta_cents the change.", stability: "stable" },
  subscription_canceled: { purpose: "A subscription ended or was scheduled to end; reason rides on the payload when known.", stability: "stable" },
  trial_started: { purpose: "A trial was granted; payload carries trial_rule_handle, the trialed plan_handle, and ends_at.", stability: "stable" },
  trial_converted: { purpose: "A trial converted to a paid subscription; carries the converting plan_handle and price.", stability: "stable" },
  trial_expired: { purpose: "A trial lapsed without converting.", stability: "stable" },
  payment_succeeded: { purpose: "A payment settled; amount_cents + currency, plan_handle when attributable.", stability: "stable" },
  payment_failed: { purpose: "A payment attempt failed; reason rides on the payload.", stability: "stable" }
};
function entriesFor(names, surface) {
  return names.map((name) => ({
    name,
    surface,
    purpose: EVENT_METADATA[name].purpose,
    stability: EVENT_METADATA[name].stability
  }));
}
var SDK_AUTOMATIC_NON_EMITTED_NAMES = ["impression"];
var EVENT_PREFIX_FAMILIES = [
  {
    prefix: "engagement_",
    surface: "sdk_client",
    purpose: "Organic product-signal events under customer-declared engagement scopes."
  }
];
var PLATFORM_EVENT_TAXONOMY = {
  // v4 (plan 228 R-2): the webhook_derived billing band — nine dual-source
  // names. v5 (plan 228 TASK-2, R-1/R-3 hard cut): changeset_*/config_* →
  // playbook_*, page_view → clickstream_page_view (the wire truth), ten
  // customer-milestone promotions from the walk, growth_signal_observed
  // declared on the new sdk_server band; retired names removed outright.
  version: 5,
  events: [
    ...entriesFor(CONTROL_PLANE_EVENT_NAMES, "control_plane"),
    ...entriesFor(DOGFOOD_CLIENT_EVENT_NAMES, "sdk_client"),
    ...entriesFor(SDK_CLIENT_EVENT_NAMES, "sdk_client"),
    ...entriesFor(SDK_SERVER_EVENT_NAMES, "sdk_server"),
    ...entriesFor(SDK_META_EVENT_NAMES, "sdk_client"),
    ...entriesFor(WEBHOOK_DERIVED_EVENT_NAMES, "webhook_derived")
  ],
  prefix_families: [...EVENT_PREFIX_FAMILIES]
};
var PLATFORM_EMITTED_EVENT_NAMES = PLATFORM_EVENT_TAXONOMY.events.map((entry) => entry.name);
var PLATFORM_EMITTED_EVENT_NAME_SET = new Set(PLATFORM_EMITTED_EVENT_NAMES);
function namespacePlatformCollision(normalizedName) {
  if (!PLATFORM_EMITTED_EVENT_NAME_SET.has(normalizedName)) return normalizedName;
  if (normalizedName.startsWith("clickstream_")) return normalizedName;
  return `clickstream_${normalizedName}`;
}
var DEPRECATED_EVENT_NAMES = PLATFORM_EVENT_TAXONOMY.events.filter((e) => e.stability === "deprecated").map((e) => e.name);

// scaffold/src/analytics/catalog/in-memory.ts
var byId = (items) => [...items].sort((a, b) => a.id.localeCompare(b.id, "en"));
var PLATFORM_EVENT_NAMES = new Set(PLATFORM_EMITTED_EVENT_NAMES);
var PLATFORM_PAYLOAD_FIELDS = new Set(
  Object.values(EVENT_PAYLOAD_CONTRACTS).flatMap(
    (contract) => contract.schema instanceof z22.ZodObject ? Object.keys(contract.schema.shape) : []
  )
);
function createInMemoryAnalyticsCatalog(data) {
  const catalog = AnalyticsCatalogSchema.parse(data);
  const problems = [];
  if (catalog.source === "generated") {
    const provenanceKinds = new Set(catalog.provenance?.map((entry) => entry.kind) ?? []);
    for (const kind of ["event_taxonomy", "openapi_identity", "tinybird_project", "annotation_kinds"]) {
      if (!provenanceKinds.has(kind)) problems.push(`generated catalog is missing ${kind} provenance`);
    }
    const annotationKinds = new Set((catalog.annotations ?? []).map((entry) => entry.kind));
    for (const kind of AnalyticsAnnotationKindSchema.options) {
      if (!annotationKinds.has(kind)) problems.push(`generated catalog is missing annotation kind: ${kind}`);
    }
  }
  {
    const seen = /* @__PURE__ */ new Set();
    for (const entry of catalog.annotations ?? []) {
      if (seen.has(entry.kind)) problems.push(`duplicate annotation kind: ${entry.kind}`);
      seen.add(entry.kind);
    }
  }
  const indexUnique = (items, kind) => {
    const map = /* @__PURE__ */ new Map();
    for (const item of items) {
      if (map.has(item.id)) problems.push(`duplicate ${kind} id: ${item.id}`);
      map.set(item.id, item);
    }
    return map;
  };
  const concepts = indexUnique(catalog.concepts, "concept");
  const dimensions = indexUnique(catalog.dimensions, "dimension");
  const metrics = indexUnique(catalog.metrics, "metric");
  for (const concept of catalog.concepts) {
    for (const dim of concept.dimensions) {
      if (!dimensions.has(dim)) problems.push(`concept ${concept.id} references undeclared dimension: ${dim}`);
    }
    for (const metric of concept.metrics) {
      if (!metrics.has(metric)) problems.push(`concept ${concept.id} references undeclared metric: ${metric}`);
    }
    if (!concept.dimensions.includes(concept.primary_time_dimension)) {
      problems.push(`concept ${concept.id} primary_time_dimension is not among its dimensions: ${concept.primary_time_dimension}`);
    }
    if (concept.coverage_metric && !metrics.has(concept.coverage_metric)) {
      problems.push(`concept ${concept.id} references undeclared coverage_metric: ${concept.coverage_metric}`);
    }
    if (concept.dimension_groundings) {
      const grounded = new Set(Object.keys(concept.dimension_groundings));
      for (const dim of concept.dimensions) {
        if (dim === concept.primary_time_dimension) continue;
        if (!grounded.has(dim)) problems.push(`concept ${concept.id} declares dimension_groundings but leaves dimension ungrounded: ${dim}`);
      }
      for (const [dim, grounding] of Object.entries(concept.dimension_groundings)) {
        if (!concept.dimensions.includes(dim)) {
          problems.push(`concept ${concept.id} grounds a dimension it does not declare: ${dim}`);
        }
        if (grounding.kind === "stamped" && grounding.source.startsWith("payload:")) {
          const fieldName = grounding.source.slice("payload:".length);
          if (!PLATFORM_PAYLOAD_FIELDS.has(fieldName)) {
            problems.push(`concept ${concept.id} grounds ${dim} in payload field '${fieldName}', which no platform event contract declares`);
          }
        }
      }
    }
    const structural = AnalyticsCatalogConceptValidatedSchema.safeParse(concept);
    if (!structural.success) {
      for (const issue2 of structural.error.issues) {
        problems.push(`concept ${concept.id} failed structural validation at ${issue2.path.join(".") || "(root)"}: ${issue2.message}`);
      }
    }
  }
  for (const concept of catalog.concepts) {
    const conceptMetrics = concept.metrics.flatMap((id) => metrics.get(id) ?? []);
    if (conceptMetrics.length === 0) continue;
    const allUnavailable = conceptMetrics.every((metric) => metric.catalog_status === "unavailable");
    if (allUnavailable) {
      if (concept.fact_kind !== void 0) {
        problems.push(
          `concept ${concept.id} declares fact_kind but every one of its metrics is catalog_status='unavailable' \u2014 declare sources with kind='unavailable' and the blocker instead`
        );
      }
      continue;
    }
    if (concept.fact_kind === void 0) {
      problems.push(
        `concept ${concept.id} serves at least one available metric but declares no fact_kind (D-9: the concept IS the fact table)`
      );
    }
    if ((concept.measures?.length ?? 0) === 0) {
      problems.push(
        `concept ${concept.id} serves at least one available metric but declares no stored measure`
      );
    }
  }
  for (const metric of catalog.metrics) {
    const derivation = metric.derivation;
    if (!derivation) {
      problems.push(`metric ${metric.id} does not declare derivation (ingested events it is computed from)`);
      continue;
    }
    const inputCount = derivation.ingested_events.length + (derivation.ingested_datasources?.length ?? 0);
    if (metric.catalog_status === "unavailable") {
      if (inputCount > 0) {
        problems.push(`metric ${metric.id} is catalog_status='unavailable' but names ${inputCount} input(s)`);
      }
      if (derivation.input_origin !== "none") {
        problems.push(`metric ${metric.id} is catalog_status='unavailable' but claims input_origin='${derivation.input_origin}'`);
      }
      if (!derivation.note?.trim()) {
        problems.push(`metric ${metric.id} is catalog_status='unavailable' without a note naming the blocker`);
      }
      continue;
    }
    if (!metric.layer) {
      problems.push(`metric ${metric.id} does not declare layer (primitive | derived)`);
    }
    if (inputCount === 0) {
      problems.push(`metric ${metric.id} is catalog_status='${metric.catalog_status ?? "unset"}' but names no ingested event or datasource`);
    }
    if (derivation.input_origin === "none") {
      problems.push(`metric ${metric.id} claims input_origin='none' without catalog_status='unavailable'`);
    }
    if (derivation.input_origin === "platform") {
      for (const eventName of derivation.ingested_events) {
        if (!PLATFORM_EVENT_NAMES.has(eventName)) {
          problems.push(`metric ${metric.id} reads platform event '${eventName}', which the event taxonomy does not declare`);
        }
      }
    }
    if (derivation.carried_by) {
      const seenPipes = /* @__PURE__ */ new Set();
      for (const pipe of derivation.carried_by) {
        if (seenPipes.has(pipe)) problems.push(`metric ${metric.id} declares duplicate carrying pipe: ${pipe}`);
        seenPipes.add(pipe);
      }
    }
  }
  if (problems.length > 0) {
    throw new Error(`analytics catalog integrity check failed:
- ${[...problems].sort().join("\n- ")}`);
  }
  const bySource = /* @__PURE__ */ new Map();
  for (const metric of catalog.metrics) {
    const derivation = metric.derivation;
    if (!derivation) continue;
    const sources = [...derivation.ingested_events, ...derivation.ingested_datasources ?? []];
    for (const source of sources) {
      const existing = bySource.get(source);
      if (existing) existing.push(metric);
      else bySource.set(source, [metric]);
    }
  }
  for (const list of bySource.values()) list.sort((a, b) => a.id.localeCompare(b.id, "en"));
  const byPipe = /* @__PURE__ */ new Map();
  for (const metric of catalog.metrics) {
    for (const pipe of metric.derivation?.carried_by ?? []) {
      const existing = byPipe.get(pipe);
      if (existing) existing.push(metric);
      else byPipe.set(pipe, [metric]);
    }
  }
  for (const list of byPipe.values()) list.sort((a, b) => a.id.localeCompare(b.id, "en"));
  return {
    version: catalog.catalog_version,
    source: catalog.source,
    listConcepts: () => byId(catalog.concepts),
    listDimensions: () => byId(catalog.dimensions),
    listMetrics: () => byId(catalog.metrics),
    getConcept: (id) => concepts.get(id),
    getDimension: (id) => dimensions.get(id),
    getMetric: (id) => metrics.get(id),
    dimensionsFor: (conceptId) => (concepts.get(conceptId)?.dimensions ?? []).flatMap((id) => dimensions.get(id) ?? []),
    metricsFor: (conceptId) => (concepts.get(conceptId)?.metrics ?? []).flatMap((id) => metrics.get(id) ?? []),
    listAnnotationKinds: () => [...catalog.annotations ?? []].sort((a, b) => a.kind.localeCompare(b.kind, "en")),
    metricsFromIngestedSource: (sourceName) => [...bySource.get(sourceName) ?? []],
    listIngestedSources: () => [...bySource.keys()].sort((a, b) => a.localeCompare(b, "en")),
    metricsForPipe: (pipeName) => [...byPipe.get(pipeName) ?? []],
    listCarryingPipes: () => [...byPipe.keys()].sort((a, b) => a.localeCompare(b, "en"))
  };
}
var FAMILY_GUIDANCE = {
  scalar: { label: "Scalar", description: "One row of metrics \u2014 headline numbers and metric cards." },
  timeseries: { label: "Timeseries", description: "Metrics per time bucket, optionally split \u2014 trends over time." },
  breakdown: { label: "Breakdown", description: "Metrics grouped by one or two categorical dimensions \u2014 comparisons." },
  funnel: { label: "Funnel", description: "Ordered stages with counts or rates \u2014 where a population drops off." },
  table: { label: "Table", description: "Typed rows with cursor pagination \u2014 detail listings." },
  timeline: { label: "Timeline", description: "Ordered fact events \u2014 what happened to one population, in order." }
};
var DIMENSION_VALUE_TYPE = {
  string: "string",
  number: "number",
  boolean: "boolean",
  date: "date",
  datetime: "datetime",
  id: "string",
  enum: "string"
};
function buildAgentCatalogProjection(catalog) {
  const concepts = catalog.listConcepts();
  const conceptsUsing = (predicate) => concepts.filter(predicate).map((c) => c.id);
  const entries = [];
  for (const concept of concepts) {
    entries.push({
      id: concept.id,
      kind: "concept",
      label: concept.label,
      description: concept.description ?? concept.label,
      when_to_use: concept.when_to_use,
      do_not_use_for: concept.do_not_use_for,
      compatible_families: concept.query_families,
      analytical_units: concept.analytical_units,
      source_scope: concept.source_scope,
      deprecation: concept.deprecation,
      example: JSON.stringify({
        concept: concept.id,
        family: concept.query_families[0],
        metrics: [concept.metrics[0]]
      })
    });
  }
  for (const dimension of catalog.listDimensions()) {
    entries.push({
      id: dimension.id,
      kind: "dimension",
      label: dimension.label,
      description: dimension.description ?? dimension.label,
      when_to_use: dimension.when_to_use,
      do_not_use_for: dimension.do_not_use_for,
      value_type: DIMENSION_VALUE_TYPE[dimension.type],
      capabilities: dimension.capabilities,
      compatible_concepts: conceptsUsing((c) => c.dimensions.includes(dimension.id)),
      deprecation: dimension.deprecation
    });
  }
  for (const metric of catalog.listMetrics()) {
    entries.push({
      id: metric.id,
      kind: "metric",
      label: metric.label,
      description: metric.description ?? metric.label,
      when_to_use: metric.when_to_use,
      do_not_use_for: metric.do_not_use_for,
      value_type: metric.value_type,
      format: metric.format,
      source_scope: metric.source_scope,
      compatible_concepts: conceptsUsing((c) => c.metrics.includes(metric.id)),
      deprecation: metric.deprecation
    });
  }
  const familiesInUse = [...new Set(concepts.flatMap((c) => c.query_families))].sort();
  for (const family of familiesInUse) {
    entries.push({
      id: `family.${family}`,
      kind: "query_family",
      label: FAMILY_GUIDANCE[family].label,
      description: FAMILY_GUIDANCE[family].description,
      compatible_concepts: conceptsUsing((c) => c.query_families.includes(family))
    });
  }
  return entries;
}
function searchAgentCatalog(catalog, query, limit = 20) {
  const tokens = [...new Set(query.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 2))];
  const scored = buildAgentCatalogProjection(catalog).map((entry) => {
    const id = entry.id.toLowerCase();
    const label = entry.label.toLowerCase();
    const prose = `${entry.description} ${entry.when_to_use ?? ""} ${entry.do_not_use_for ?? ""}`.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (id.includes(token)) score += 3;
      else if (label.includes(token)) score += 2;
      else if (prose.includes(token)) score += 1;
    }
    return { entry, score };
  });
  const entries = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id, "en")).slice(0, Math.min(limit, 50)).map((s) => s.entry);
  return { catalog_version: catalog.version, query, entries };
}

// scaffold/src/analytics/catalog/fixture.ts
var FIXTURE_ANALYTICS_CATALOG = {
  // Versioned additively (§15) as the ported surfaces need semantics:
  //   fixture-2 — placement.payload + content.message_block dimensions, the
  //     placement.last_presented_at recency metric, revenue.attribution concept.
  //   fixture-3 — the event-count metrics those surfaces chart:
  //     conversion.paid_count (billing-fact events on revenue.movement) and
  //     placement.conversions (interaction outcomes on placement.presentation).
  //   fixture-4 — experiment anchor identity for per-experiment AVF scope.
  //   fixture-5 — lifecycle and funnel signals consumed by Plan 204 detectors.
  //   fixture-6 — trial-conversion and reactivation detector signals.
  //   fixture-7 — placement-frequency signal for Plan 204 fatigue detection.
  //   fixture-8 — explicit currency semantics for billing-backed revenue.
  //   fixture-9 — explicit account and user identity for customer timelines.
  //   fixture-10 — persisted optimization-opportunity serving semantics.
  //   fixture-11 — immutable experiment-result contribution semantics.
  //   fixture-12 — event-count timeseries semantics for customer activity.
  //   fixture-13 — catalog honesty for the revenue family (BL-0063): the
  //     invoice-paid proxy is named revenue.invoice_paid_amount_legacy, and
  //     revenue.mrr / revenue.net_new_mrr are declared gaps until plan 252
  //     delivers contractual stock and classified movements.
  catalog_version: "fixture-13",
  source: "fixture",
  dimensions: [
    {
      id: "time.occurred_at",
      label: "Occurred at",
      description: "Event time of the underlying fact.",
      type: "datetime",
      operators: ["between"],
      control: "date_range",
      capabilities: ["filter", "sort"],
      cardinality: "high",
      classification: "unrestricted",
      exclude_from_segment_picker: false
    },
    {
      id: "commercial.plan",
      label: "Plan",
      description: "Commercial plan, by anchor handle.",
      type: "id",
      operators: ["in", "not_in", "is_null", "is_not_null"],
      control: "multi_select",
      capabilities: ["filter", "group", "split", "sort"],
      cardinality: "low",
      classification: "unrestricted",
      exclude_from_segment_picker: true
    },
    {
      id: "commercial.billing_period",
      label: "Billing period",
      type: "enum",
      operators: ["in", "not_in"],
      control: "multi_select",
      capabilities: ["filter", "group", "split"],
      cardinality: "low",
      classification: "unrestricted",
      exclude_from_segment_picker: true
    },
    {
      id: "revenue.currency",
      label: "Currency",
      description: "ISO 4217 currency code carried by the billing fact; unlike currencies must never be summed.",
      type: "enum",
      operators: ["eq", "in", "not_in"],
      control: "multi_select",
      capabilities: ["filter", "group", "split", "sort"],
      cardinality: "low",
      classification: "unrestricted",
      exclude_from_segment_picker: true
    },
    {
      id: "lifecycle.state",
      label: "Lifecycle state",
      type: "enum",
      operators: ["in", "not_in"],
      control: "multi_select",
      capabilities: ["filter", "group", "split"],
      cardinality: "low",
      classification: "unrestricted",
      exclude_from_segment_picker: false
    },
    {
      id: "acquisition.source",
      label: "Acquisition source",
      description: "The normalized source associated with an account signup.",
      type: "string",
      operators: ["eq", "in", "not_in"],
      control: "multi_select",
      capabilities: ["filter", "group", "split"],
      cardinality: "medium",
      classification: "unrestricted",
      exclude_from_segment_picker: false
    },
    {
      id: "funnel.step",
      label: "Funnel step",
      description: "Stable caller-supplied handle for one ordered product funnel step.",
      type: "id",
      operators: ["eq", "in", "not_in"],
      control: "multi_select",
      capabilities: ["filter", "group", "split"],
      cardinality: "medium",
      classification: "unrestricted",
      exclude_from_segment_picker: false
    },
    {
      id: "trial.rule",
      label: "Trial rule",
      description: "Stable handle of the free or reverse trial rule governing the cohort.",
      type: "id",
      operators: ["eq", "in", "not_in"],
      control: "multi_select",
      capabilities: ["filter", "group", "split"],
      cardinality: "low",
      classification: "unrestricted",
      exclude_from_segment_picker: false
    },
    {
      id: "customer.lifecycle_cohort",
      label: "Customer lifecycle cohort",
      description: "Stable cohort distinguishing previously healthy accounts from never-activated accounts.",
      type: "enum",
      operators: ["eq", "in", "not_in"],
      control: "multi_select",
      capabilities: ["filter", "group", "split"],
      cardinality: "low",
      classification: "unrestricted",
      exclude_from_segment_picker: false
    },
    {
      id: "targeting.segment",
      label: "Segment",
      description: "Targeting segment, excluding plan and billing period.",
      type: "id",
      operators: ["in", "not_in"],
      control: "search_select",
      capabilities: ["filter", "group", "split"],
      cardinality: "medium",
      classification: "unrestricted",
      exclude_from_segment_picker: false
    },
    {
      id: "decision.rule",
      label: "Entitlement rule",
      description: "The rule that produced the decision, by anchor handle.",
      type: "id",
      operators: ["in", "not_in"],
      control: "search_select",
      capabilities: ["filter", "group", "split", "sort"],
      cardinality: "medium",
      classification: "operational",
      exclude_from_segment_picker: false
    },
    {
      id: "decision.entitlement",
      label: "Entitlement",
      type: "id",
      operators: ["in", "not_in"],
      control: "search_select",
      capabilities: ["filter", "group", "split"],
      cardinality: "medium",
      classification: "operational",
      exclude_from_segment_picker: false
    },
    {
      id: "release.playbook_version",
      label: "Playbook version",
      type: "id",
      operators: ["in", "not_in"],
      control: "multi_select",
      capabilities: ["filter", "group"],
      cardinality: "medium",
      classification: "operational",
      exclude_from_segment_picker: false
    },
    {
      id: "experiment.experiment",
      label: "Experiment",
      description: "Experiment identity, by stable experiment handle.",
      type: "id",
      operators: ["eq", "in", "not_in"],
      control: "search_select",
      capabilities: ["filter", "group", "split"],
      cardinality: "medium",
      classification: "operational",
      exclude_from_segment_picker: true
    },
    {
      id: "experiment.variant",
      label: "Experiment variant",
      type: "id",
      operators: ["in", "not_in"],
      control: "multi_select",
      capabilities: ["filter", "group", "split"],
      cardinality: "low",
      classification: "operational",
      exclude_from_segment_picker: false
    },
    {
      id: "experiment.metric",
      label: "Experiment metric",
      description: "Semantic metric identifier evaluated by the immutable experiment analysis result.",
      type: "id",
      operators: ["eq", "in", "not_in"],
      control: "search_select",
      capabilities: ["filter", "group", "sort"],
      cardinality: "medium",
      classification: "operational",
      exclude_from_segment_picker: true
    },
    {
      id: "experiment.evidence_state",
      label: "Causal evidence",
      description: "Whether a validated immutable experiment result is available for the requested window.",
      type: "enum",
      operators: ["eq", "in", "not_in"],
      control: "multi_select",
      capabilities: ["filter", "group", "sort"],
      cardinality: "low",
      classification: "operational",
      exclude_from_segment_picker: true
    },
    {
      id: "experiment.methodology",
      label: "Methodology",
      description: "Methodology recorded by the immutable experiment analysis result.",
      type: "string",
      operators: ["eq", "in", "not_in"],
      control: "search_select",
      capabilities: ["filter", "group", "sort"],
      cardinality: "low",
      classification: "operational",
      exclude_from_segment_picker: true
    },
    {
      id: "experiment.analysis_health",
      label: "Analysis health",
      description: "Health status recorded by the immutable experiment analysis result.",
      type: "enum",
      operators: ["eq", "in", "not_in"],
      control: "multi_select",
      capabilities: ["filter", "group", "sort"],
      cardinality: "low",
      classification: "operational",
      exclude_from_segment_picker: true
    },
    {
      id: "experiment.observation_window",
      label: "Observation window",
      description: "UTC start and end recorded with the immutable evidence snapshot.",
      type: "string",
      operators: ["eq"],
      control: "search_select",
      capabilities: ["group", "sort"],
      cardinality: "high",
      classification: "operational",
      exclude_from_segment_picker: true
    },
    {
      id: "experiment.uncertainty",
      label: "Uncertainty",
      description: "Recorded confidence interval, probability, or p-value; unavailable when the result contains none.",
      type: "string",
      operators: ["eq"],
      control: "search_select",
      capabilities: ["group", "sort"],
      cardinality: "high",
      classification: "operational",
      exclude_from_segment_picker: true
    },
    {
      id: "placement.placement",
      label: "Placement",
      type: "id",
      operators: ["in", "not_in"],
      control: "search_select",
      capabilities: ["filter", "group", "split", "sort"],
      cardinality: "medium",
      classification: "unrestricted",
      exclude_from_segment_picker: false
    },
    {
      id: "entitlement.entitlement",
      label: "Entitlement",
      type: "id",
      operators: ["in", "not_in"],
      control: "search_select",
      capabilities: ["filter", "group", "split", "sort"],
      cardinality: "medium",
      classification: "unrestricted",
      exclude_from_segment_picker: false
    },
    {
      id: "promotion.promotion",
      label: "Promotion",
      type: "id",
      operators: ["in", "not_in"],
      control: "search_select",
      capabilities: ["filter", "group", "split", "sort"],
      cardinality: "medium",
      classification: "unrestricted",
      exclude_from_segment_picker: false
    },
    {
      id: "placement.payload",
      label: "Payload",
      description: "Placement payload, by anchor id.",
      type: "id",
      operators: ["in", "not_in"],
      control: "search_select",
      capabilities: ["filter", "group", "split", "sort"],
      cardinality: "medium",
      classification: "unrestricted",
      exclude_from_segment_picker: false
    },
    {
      id: "content.message_block",
      label: "Message block",
      description: "Message block, by unique handle (the SDK-facing identifier).",
      type: "id",
      operators: ["in", "not_in"],
      control: "search_select",
      capabilities: ["filter", "group", "split"],
      cardinality: "medium",
      classification: "unrestricted",
      exclude_from_segment_picker: false
    },
    {
      id: "event.type",
      label: "Event type",
      type: "enum",
      operators: ["in", "not_in"],
      control: "multi_select",
      capabilities: ["filter", "group"],
      cardinality: "low",
      classification: "unrestricted",
      exclude_from_segment_picker: false
    },
    {
      id: "customer.account",
      label: "Account",
      description: "Stable customer account identifier carried by the event fact.",
      type: "id",
      operators: ["eq", "in", "not_in"],
      control: "search_select",
      capabilities: ["filter", "group", "sort"],
      cardinality: "high",
      classification: "operational",
      exclude_from_segment_picker: true
    },
    {
      id: "customer.user",
      label: "User",
      description: "Stable customer user identifier carried by the event fact.",
      type: "id",
      operators: ["eq", "in", "not_in"],
      control: "search_select",
      capabilities: ["filter", "group", "sort"],
      cardinality: "high",
      classification: "pii",
      exclude_from_segment_picker: true
    },
    {
      // Plan 230 TASK-1: signup-cohort membership, DERIVED at read time from
      // each account's first observed fact (the schema's own
      // `derived:first_observed_cohort` example made real). Values are
      // period labels at the query's cohort grain (default month, e.g.
      // '2026-01') — never a stamped column, so cohort assignment can never
      // drift from the raw facts that define it (plan 230 R-2).
      id: "customer.cohort_period",
      label: "Signup cohort",
      description: "The period (default: month) of the account's first observed fact across clickstream and billing. Derived at read time; no stamped cohort column exists.",
      type: "enum",
      operators: ["eq", "in", "not_in"],
      control: "multi_select",
      capabilities: ["filter", "group", "split", "sort"],
      cardinality: "medium",
      classification: "unrestricted",
      exclude_from_segment_picker: true
    },
    {
      id: "customer.cohort_age",
      label: "Cohort age",
      description: "Whole periods elapsed since the cohort period (0 = the cohort's own period). The column axis of a cohort grid.",
      type: "enum",
      operators: ["eq", "in", "not_in"],
      control: "multi_select",
      capabilities: ["group", "split", "sort"],
      cardinality: "low",
      classification: "unrestricted",
      exclude_from_segment_picker: true
    },
    {
      // Plan 230 TASK-1: the six-stage platform monetization funnel
      // (overall-app-ux-structure §1.1.5), defined ONCE here so the
      // dashboard snapshot and the funnel-over-time view can never disagree
      // (plan 230 REQ-4). Stages, in order: registered (first observed
      // fact), free (no paid subscription), placement_reached (≥1
      // presentation), engaged (≥1 non-pending presentation outcome), paid
      // (≥1 attributable conversion, rules 15-17 vocabulary), expanded
      // (≥1 subscription_expanded).
      id: "monetization.funnel_stage",
      label: "Funnel stage",
      description: "Six-stage platform monetization funnel stage: registered \u2192 free \u2192 placement_reached \u2192 engaged \u2192 paid \u2192 expanded. Derived from raw facts; stage semantics are catalog-owned.",
      type: "enum",
      operators: ["eq", "in", "not_in"],
      control: "multi_select",
      capabilities: ["filter", "group"],
      cardinality: "low",
      classification: "unrestricted",
      exclude_from_segment_picker: true
    },
    {
      id: "opportunity.type",
      label: "Opportunity type",
      description: "Stable type emitted by the detector that produced a persisted opportunity.",
      type: "enum",
      operators: ["eq", "in", "not_in"],
      control: "multi_select",
      capabilities: ["filter", "group", "sort"],
      cardinality: "medium",
      classification: "operational",
      exclude_from_segment_picker: true
    },
    {
      id: "optimization.detector",
      label: "Detector",
      description: "Stable identifier of the detector that produced a persisted opportunity.",
      type: "id",
      operators: ["eq", "in", "not_in"],
      control: "search_select",
      capabilities: ["filter", "group", "sort"],
      cardinality: "medium",
      classification: "operational",
      exclude_from_segment_picker: true
    }
  ],
  metrics: [
    // Experiment-planning metadata (war-games §10.1 / architecture §5.2):
    // every metric carries `statistical_type` + `direction` (+
    // `preferred_analysis_unit`, and ratio composition refs when the type is
    // `ratio`) — or sits on the explicit
    // `ANALYTICS_CATALOG_METRIC_METADATA_EXEMPT` list in generated.ts.
    // Never silent absence.
    { id: "acquisition.signup_count", label: "Signups", value_type: "number", source_scope: "total", statistical_type: "count", direction: "increase", preferred_analysis_unit: "user", layer: "primitive", catalog_status: "tested", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "customer_authored", ingested_events: ["growth_signal_observed"], note: "Read from pre-computed growth_signal_observed rows. The lifecycle milestones behind it are customer-authored track() names, so no read-time derivation can produce it; today the only producer is the simulation loader." } },
    { id: "activation.rate", label: "Activation rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total", statistical_type: "binary", direction: "increase", preferred_analysis_unit: "user", layer: "primitive", catalog_status: "tested", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "customer_authored", ingested_events: ["growth_signal_observed"], note: "Read from pre-computed growth_signal_observed rows. The lifecycle milestones behind it are customer-authored track() names, so no read-time derivation can produce it; today the only producer is the simulation loader." } },
    { id: "activation.time_to_value_seconds", label: "Time to value", value_type: "number", format: { type: "duration" }, source_scope: "total", statistical_type: "continuous", direction: "decrease", preferred_analysis_unit: "user", layer: "primitive", catalog_status: "tested", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "customer_authored", ingested_events: ["growth_signal_observed"], note: "Read from pre-computed growth_signal_observed rows. The lifecycle milestones behind it are customer-authored track() names, so no read-time derivation can produce it; today the only producer is the simulation loader." } },
    { id: "retention.d7_rate", label: "D7 retention rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total", statistical_type: "binary", direction: "increase", preferred_analysis_unit: "user", catalog_status: "unavailable", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "none", ingested_events: [], note: "In the growth_funnel_signals allowlist but no producer emits it \u2014 not even the simulation loader, whose growth-signal producer covers six lifecycle metrics and not this one. Retention requires a returning-user derivation over customer-authored activity." } },
    { id: "funnel.entry_count", label: "Funnel step entries", value_type: "number", source_scope: "total", statistical_type: "count", direction: "increase", preferred_analysis_unit: "user", layer: "primitive", catalog_status: "tested", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "customer_authored", ingested_events: ["growth_signal_observed"], note: "Read from pre-computed growth_signal_observed rows. The lifecycle milestones behind it are customer-authored track() names, so no read-time derivation can produce it; today the only producer is the simulation loader." } },
    { id: "funnel.completion_rate", label: "Funnel step completion rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total", statistical_type: "binary", direction: "increase", preferred_analysis_unit: "user", layer: "primitive", catalog_status: "tested", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "customer_authored", ingested_events: ["growth_signal_observed"], note: "Read from pre-computed growth_signal_observed rows. The lifecycle milestones behind it are customer-authored track() names, so no read-time derivation can produce it; today the only producer is the simulation loader." } },
    { id: "funnel.elapsed_seconds", label: "Funnel step elapsed time", value_type: "number", format: { type: "duration" }, source_scope: "total", statistical_type: "continuous", direction: "decrease", preferred_analysis_unit: "user", layer: "primitive", catalog_status: "tested", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "customer_authored", ingested_events: ["growth_signal_observed"], note: "Read from pre-computed growth_signal_observed rows. The lifecycle milestones behind it are customer-authored track() names, so no read-time derivation can produce it; today the only producer is the simulation loader." } },
    { id: "funnel.error_rate", label: "Funnel step error rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total", statistical_type: "binary", direction: "decrease", preferred_analysis_unit: "user", catalog_status: "unavailable", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "none", ingested_events: [], note: 'No producer emits a growth_signal_observed row for this metric, and funnel error semantics are customer-defined. Inputs are customer-authored track() names. The event taxonomy declares that set deliberately open ("the SDK has no closed event-name set"), so there is no platform vocabulary to derive from \u2014 this needs per-tenant event mapping, which does not exist.' } },
    { id: "trial.start_count", label: "Trial starts", value_type: "number", source_scope: "total", statistical_type: "count", direction: "increase", preferred_analysis_unit: "account", catalog_status: "unavailable", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "none", ingested_events: [], note: "In the growth_funnel_signals allowlist but no producer emits it. Trial state is customer-authored; events_billing carries no trial event type yet (daily_revenue_rollup hard-codes trial_conversions to 0)." } },
    { id: "trial.conversion_rate", label: "Trial-to-paid conversion rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total", statistical_type: "binary", direction: "increase", preferred_analysis_unit: "account", catalog_status: "unavailable", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "none", ingested_events: [], note: "Same as trial.start_count \u2014 allowlisted, unproduced. Needs a trial event type in events_billing or a customer trial mapping." } },
    { id: "trial.activation_rate", label: "Trial activation rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total", statistical_type: "binary", direction: "increase", preferred_analysis_unit: "account", catalog_status: "unavailable", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "none", ingested_events: [], note: "Same as trial.start_count \u2014 allowlisted, unproduced." } },
    { id: "reactivation.previously_healthy_account_count", label: "Previously healthy accounts", value_type: "number", source_scope: "total", statistical_type: "count", direction: "neutral", preferred_analysis_unit: "account", catalog_status: "unavailable", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "none", ingested_events: [], note: "Allowlisted by the pipe but no producer emits it. Requires an account activity-history derivation that does not exist." } },
    { id: "reactivation.inactive_previously_healthy_rate", label: "Inactive previously healthy rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total", statistical_type: "binary", direction: "decrease", preferred_analysis_unit: "account", catalog_status: "unavailable", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "none", ingested_events: [], note: "Same as reactivation.previously_healthy_account_count \u2014 allowlisted, unproduced." } },
    { id: "reactivation.reactivated_rate", label: "Reactivated account rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total", statistical_type: "binary", direction: "increase", preferred_analysis_unit: "account", catalog_status: "unavailable", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "none", ingested_events: [], note: "Same as reactivation.previously_healthy_account_count \u2014 allowlisted, unproduced." } },
    // ── Account lifecycle transitions (plan 276 TASK-3, R-6) ──────────────
    //
    // The movement counts of `growth.account_lifecycle_transitions_v1`. All
    // eleven are `catalog_status: 'unavailable'` and DECLARED rather than
    // served, which is the point: the concept exists so a binding can refuse
    // a lifecycle movement BY NAME instead of returning a silent zero, and so
    // the surface can say "not available" with the blocker rather than "0".
    //
    // Two distinct blockers, never conflated:
    //   Phase A (paid_started, plan_upgraded, plan_downgraded, paid_ended,
    //   reactivated) — derivable from billing facts alone under R-6, blocked
    //   only on the projection and endpoint that produce the rows
    //   (plan 276 TASK-7/TASK-8, over plan 252's unshipped accounting chain).
    //   Phase B (signup, trial_started, trial_converted, trial_reverted,
    //   access_ended) — blocked on there being no authoritative producer AT
    //   ALL (workspace D-21; plan 276 TASK-2's inventory found zero call
    //   sites), which is a different and deeper gap.
    { id: "lifecycle.paid_started_count", label: "Paid started", value_type: "number", source_scope: "total", statistical_type: "count", direction: "increase", preferred_analysis_unit: "account", aggregation_semantics: "additive", catalog_status: "unavailable", derivation: { input_origin: "none", ingested_events: [], note: "Phase A, declared not served: plan 276 TASK-7/TASK-8 unshipped, so no transition row exists. Positive eligible recurring stock under the shared accounting policy is what makes an account paid, and that stock is plan 252 TASK-29/34/36 (also unshipped). Card collection or subscription status `active` never substitutes (R-6)." } },
    { id: "lifecycle.plan_upgraded_count", label: "Plan upgrades", value_type: "number", source_scope: "total", statistical_type: "count", direction: "increase", preferred_analysis_unit: "account", aggregation_semantics: "additive", catalog_status: "unavailable", derivation: { input_origin: "none", ingested_events: [], note: "Phase A, declared not served: plan 276 TASK-7/TASK-8 unshipped. Compares verified commercial TIERS in the applicable Playbook snapshot; seat growth, add-ons, price and billing-interval changes are separate causes and never an upgrade edge (R-6)." } },
    { id: "lifecycle.plan_downgraded_count", label: "Plan downgrades", value_type: "number", source_scope: "total", statistical_type: "count", direction: "decrease", preferred_analysis_unit: "account", aggregation_semantics: "additive", catalog_status: "unavailable", derivation: { input_origin: "none", ingested_events: [], note: "Phase A, declared not served: plan 276 TASK-7/TASK-8 unshipped. Tier comparison as for lifecycle.plan_upgraded_count; a lower tier is not inferred from a lower amount." } },
    { id: "lifecycle.paid_ended_count", label: "Paid ended", value_type: "number", source_scope: "total", statistical_type: "count", direction: "decrease", preferred_analysis_unit: "account", aggregation_semantics: "additive", catalog_status: "unavailable", derivation: { input_origin: "none", ingested_events: [], note: "Phase A, declared not served: plan 276 TASK-7/TASK-8 unshipped. Requires composing every relevant subscription before declaring an account no longer paid; a 100% recurring discount ends positive stock while subscription and access remain and keeps its accounting cause, and payment failure does not prove access ended (R-6)." } },
    { id: "lifecycle.reactivated_count", label: "Reactivations", value_type: "number", source_scope: "total", statistical_type: "count", direction: "increase", preferred_analysis_unit: "account", aggregation_semantics: "additive", catalog_status: "unavailable", derivation: { input_origin: "none", ingested_events: [], note: "Phase A, declared not served: plan 276 TASK-7/TASK-8 unshipped. R-6 additionally requires KNOWN prior history \u2014 incomplete history yields lifecycle.paid_started_count with an `unknown_prior_history` quality flag, never a fabricated first acquisition." } },
    { id: "lifecycle.signup_count", label: "Account signups", value_type: "number", source_scope: "total", statistical_type: "count", direction: "increase", preferred_analysis_unit: "account", aggregation_semantics: "additive", catalog_status: "unavailable", derivation: { input_origin: "none", ingested_events: [], note: "Phase B: no authoritative producer (workspace D-21). Plan 276 TASK-2 found zero call sites for any account-creation event in any repo, and `account_created` is not an emittable control-plane name; `provisionTenantForFirstUser` emits nothing. A USER signup is not account creation (R-2), so first observation may not stand in." } },
    { id: "lifecycle.trial_started_count", label: "Trials started", value_type: "number", source_scope: "total", statistical_type: "count", direction: "increase", preferred_analysis_unit: "account", aggregation_semantics: "additive", catalog_status: "unavailable", derivation: { input_origin: "none", ingested_events: [], note: "Phase B: no authoritative producer (workspace D-21). The app-owned `trial_instances` row emits nothing and carries no episode id or subject scope; a Playbook trial rule is vocabulary only and never an occurrence (R-1c). Plan 276 TASK-12/TASK-14." } },
    { id: "lifecycle.trial_converted_count", label: "Trials converted", value_type: "number", source_scope: "total", statistical_type: "count", direction: "increase", preferred_analysis_unit: "account", aggregation_semantics: "additive", catalog_status: "unavailable", derivation: { input_origin: "none", ingested_events: [], note: "Phase B: no authoritative producer (workspace D-21). Conversion must link the episode's OWN commitment at or after its actual end; `trial_instances` has no `actual_end`, and `deriveBillingRef` dedupes trial events once per subscription, so the episode evidence the link needs does not exist. Plan 276 TASK-12." } },
    { id: "lifecycle.trial_reverted_count", label: "Trials reverted", value_type: "number", source_scope: "total", statistical_type: "count", direction: "decrease", preferred_analysis_unit: "account", aggregation_semantics: "additive", catalog_status: "unavailable", derivation: { input_origin: "none", ingested_events: [], note: "Phase B: no authoritative producer (workspace D-21). An elapsed scheduled end proves only that the scheduled time passed \u2014 the episode stays `pending_unknown` and NO reversion edge is emitted (R-1c). Today's live signal is clock-derived at read time, which R-1 forbids as an authority." } },
    { id: "lifecycle.access_ended_count", label: "Access ended", value_type: "number", source_scope: "total", statistical_type: "count", direction: "decrease", preferred_analysis_unit: "account", aggregation_semantics: "additive", catalog_status: "unavailable", derivation: { input_origin: "none", ingested_events: [], note: "Phase B: no authoritative producer (workspace D-21). Requires resulting-access evidence from the app; usage-metered expiry additionally requires exhaustion or end evidence, and Free requires affirmative Free-access evidence rather than a lowest tier or zero revenue (R-1, R-6)." } },
    { id: "lifecycle.moved_account_count", label: "Accounts moved", value_type: "number", source_scope: "total", statistical_type: "count", direction: "neutral", preferred_analysis_unit: "account", aggregation_semantics: "non_additive", catalog_status: "unavailable", derivation: { input_origin: "none", ingested_events: [], note: "Distinct accounts with at least one transition in the window \u2014 the plan 276 AC-8 companion to the per-kind occurrence counts. NON-ADDITIVE by construction: one account can traverse several edges, so distinct counts are never summed across edges and never used as a cohort denominator. Declared not served: plan 276 TASK-7/TASK-8 unshipped." } },
    { id: "entitlement.granted_account_count", label: "Granted accounts", value_type: "number", source_scope: "total", statistical_type: "count", direction: "increase", preferred_analysis_unit: "account", layer: "primitive", catalog_status: "tested", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "platform", ingested_events: ["gate_evaluated"], note: "uniq accounts whose gate_evaluated outcome was `allowed`." } },
    { id: "entitlement.adoption_rate", label: "Entitlement adoption rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total", statistical_type: "binary", direction: "increase", preferred_analysis_unit: "account", layer: "derived", catalog_status: "tested", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "platform", ingested_events: ["gate_evaluated"], note: "allowed accounts over all evaluated accounts. gate_evaluated is the passive denominator the SDK emits on every gate render." } },
    { id: "entitlement.adopter_retention_lift", label: "Adopter retention lift", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total", statistical_type: "continuous", direction: "increase", preferred_analysis_unit: "account", catalog_status: "unavailable", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "none", ingested_events: [], note: "Needs a retention cohort comparison between adopters and non-adopters. No retention derivation exists." } },
    { id: "entitlement.denied_account_count", label: "Denied accounts", value_type: "number", source_scope: "revturbine_tracked", statistical_type: "count", direction: "neutral", preferred_analysis_unit: "account", layer: "primitive", catalog_status: "tested", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "platform", ingested_events: ["gate_evaluated"], note: "uniq accounts whose gate_evaluated outcome was `denied` or `limited`." } },
    { id: "entitlement.denied_attempts_per_account", label: "Denied attempts per account", value_type: "number", source_scope: "revturbine_tracked", statistical_type: "count", direction: "neutral", preferred_analysis_unit: "account", layer: "derived", catalog_status: "tested", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "platform", ingested_events: ["gate_denied"], note: 'gate_denied is the ACTIVE denial \u2014 a user invoked a gated action and was refused, which is what "attempt" means here.' } },
    { id: "entitlement.denied_upgrade_conversion_rate", label: "Denied-account upgrade conversion rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "revturbine_influenced", statistical_type: "binary", direction: "increase", preferred_analysis_unit: "account", catalog_status: "unavailable", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "none", ingested_events: [], note: "Needs to join denials to a subsequent upgrade. Upgrade is a customer-authored event, so the join has no platform anchor." } },
    { id: "usage.metered_per_account", label: "Metered usage per account", value_type: "number", source_scope: "total", statistical_type: "continuous", direction: "increase", preferred_analysis_unit: "account", layer: "primitive", catalog_status: "tested", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "platform", ingested_events: ["gate_evaluated"], note: "avg of gate_evaluated `used`, over evaluations where `limit` > 0. Gated on limit rather than on the presence of `used` because an unmetered entitlement reports both as JSON null." } },
    { id: "usage.expansion_mrr_per_unit", label: "Expansion MRR per usage unit", value_type: "currency", source_scope: "total", catalog_status: "unavailable", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "none", ingested_events: [], note: "Needs metered units joined to expansion revenue, and no expansion amount is served: daily_revenue_rollup hard-codes expansion_revenue_cents to 0. See revenue.expansion_mrr for why expansion specifically cannot be recovered from the derived event vocabulary." } },
    { id: "revenue.expansion_mrr", label: "Expansion MRR", value_type: "currency", source_scope: "total", statistical_type: "revenue", direction: "increase", preferred_analysis_unit: "account", catalog_status: "unavailable", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "none", ingested_events: [], note: "Two blockers (BL-0063 correction). (1) daily_revenue_rollup keys on stripe_event_type = 'invoice.paid' and hard-codes expansion_revenue_cents to 0, discarding the event_name plan 228 already stamps \u2014 new and churn ARE discriminated upstream. (2) Expansion is the real exception: only quantity growth is derived; value-based upgrades priced via items map null by design. Plan 252 classifies movements from contractual stock (A-4, AC-17), which catches those." } },
    { id: "usage.projected_bill_to_historical_ratio", label: "Projected bill to historical ratio", value_type: "number", source_scope: "total", statistical_type: "continuous", direction: "neutral", preferred_analysis_unit: "account", catalog_status: "unavailable", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "none", ingested_events: [], note: "Needs a billing projection model. None exists." } },
    { id: "usage.acceleration_rate", label: "Usage acceleration rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total", statistical_type: "continuous", direction: "increase", preferred_analysis_unit: "account", catalog_status: "unavailable", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "none", ingested_events: [], note: "Needs a usage time series per account over a trailing window. The gate-event stream is too sparse to ground a rate of change." } },
    { id: "usage.alert_coverage_rate", label: "Usage alert coverage rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total", statistical_type: "binary", direction: "increase", preferred_analysis_unit: "account", catalog_status: "unavailable", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "none", ingested_events: [], note: "Needs usage-alert configuration state, which is control-plane config rather than an ingested event." } },
    { id: "usage.utilization_rate", label: "Usage utilization rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total", statistical_type: "continuous", direction: "increase", preferred_analysis_unit: "account", catalog_status: "unavailable", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "none", ingested_events: [], note: "Grounded \u2014 gate_evaluated carries `limit` and `used` \u2014 but not routable: this metric belongs to growth.commercial_health, whose dimensions are plan/promotion/segment, while gate events can only ground entitlement.entitlement. Emitting it under that dimension would store rows no concept matches (the PR #328 failure). Unlocking it needs a plan-grained source or a ruling moving the metric onto growth.entitlement_usage. See plan 227 R-9." } },
    { id: "usage.growth_rate", label: "Usage growth rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total", statistical_type: "continuous", direction: "increase", preferred_analysis_unit: "account", catalog_status: "unavailable", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "none", ingested_events: [], note: "Same as usage.acceleration_rate \u2014 no per-account usage series to difference." } },
    { id: "pricing.entry_tier_account_share", label: "Entry-tier account share", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total", statistical_type: "binary", direction: "neutral", preferred_analysis_unit: "account", catalog_status: "unavailable", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "none", ingested_events: [], note: 'Inputs are customer-authored track() names. The event taxonomy declares that set deliberately open ("the SDK has no closed event-name set"), so there is no platform vocabulary to derive from \u2014 this needs per-tenant event mapping, which does not exist.' } },
    { id: "pricing.self_serve_upgrade_rate", label: "Self-serve upgrade rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total", statistical_type: "binary", direction: "increase", preferred_analysis_unit: "account", catalog_status: "unavailable", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "none", ingested_events: [], note: 'Inputs are customer-authored track() names. The event taxonomy declares that set deliberately open ("the SDK has no closed event-name set"), so there is no platform vocabulary to derive from \u2014 this needs per-tenant event mapping, which does not exist.' } },
    { id: "pricing.plan_churn_rate", label: "Plan churn rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total", statistical_type: "binary", direction: "decrease", preferred_analysis_unit: "account", catalog_status: "unavailable", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "none", ingested_events: [], note: 'Inputs are customer-authored track() names. The event taxonomy declares that set deliberately open ("the SDK has no closed event-name set"), so there is no platform vocabulary to derive from \u2014 this needs per-tenant event mapping, which does not exist.' } },
    { id: "promotion.discount_use_rate", label: "Promotion discount use rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "revturbine_tracked", statistical_type: "binary", direction: "neutral", preferred_analysis_unit: "account", catalog_status: "unavailable", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "none", ingested_events: [], note: 'Inputs are customer-authored track() names. The event taxonomy declares that set deliberately open ("the SDK has no closed event-name set"), so there is no platform vocabulary to derive from \u2014 this needs per-tenant event mapping, which does not exist.' } },
    { id: "promotion.full_price_conversion_rate", label: "Full-price conversion rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total", statistical_type: "binary", direction: "increase", preferred_analysis_unit: "account", catalog_status: "unavailable", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "none", ingested_events: [], note: 'Inputs are customer-authored track() names. The event taxonomy declares that set deliberately open ("the SDK has no closed event-name set"), so there is no platform vocabulary to derive from \u2014 this needs per-tenant event mapping, which does not exist.' } },
    { id: "promotion.net_revenue_lift_rate", label: "Promotion net revenue lift", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "revturbine_influenced", statistical_type: "continuous", direction: "increase", preferred_analysis_unit: "account", catalog_status: "unavailable", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "none", ingested_events: [], note: 'Inputs are customer-authored track() names. The event taxonomy declares that set deliberately open ("the SDK has no closed event-name set"), so there is no platform vocabulary to derive from \u2014 this needs per-tenant event mapping, which does not exist.' } },
    { id: "retention.active_users_per_account", label: "Active users per account", value_type: "number", source_scope: "total", statistical_type: "continuous", direction: "increase", preferred_analysis_unit: "account", catalog_status: "unavailable", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "none", ingested_events: [], note: 'Inputs are customer-authored track() names. The event taxonomy declares that set deliberately open ("the SDK has no closed event-name set"), so there is no platform vocabulary to derive from \u2014 this needs per-tenant event mapping, which does not exist.' } },
    { id: "retention.core_action_frequency", label: "Core action frequency", value_type: "number", source_scope: "total", statistical_type: "count", direction: "increase", preferred_analysis_unit: "user", catalog_status: "unavailable", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "none", ingested_events: [], note: 'Inputs are customer-authored track() names. The event taxonomy declares that set deliberately open ("the SDK has no closed event-name set"), so there is no platform vocabulary to derive from \u2014 this needs per-tenant event mapping, which does not exist.' } },
    { id: "retention.active_days_rate", label: "Active days rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total", statistical_type: "continuous", direction: "increase", preferred_analysis_unit: "user", catalog_status: "unavailable", derivation: { carried_by: ["growth_funnel_signals"], input_origin: "none", ingested_events: [], note: 'Inputs are customer-authored track() names. The event taxonomy declares that set deliberately open ("the SDK has no closed event-name set"), so there is no platform vocabulary to derive from \u2014 this needs per-tenant event mapping, which does not exist.' } },
    { id: "decision.eligible_accounts", label: "Eligible accounts", value_type: "number", statistical_type: "count", direction: "neutral", preferred_analysis_unit: "account", catalog_status: "unavailable", derivation: { input_origin: "none", ingested_events: [], note: "The decision-log facts this reads do not exist in Tinybird yet." } },
    { id: "decision.reached_accounts", label: "Reached accounts", value_type: "number", statistical_type: "count", direction: "increase", preferred_analysis_unit: "account", catalog_status: "unavailable", derivation: { input_origin: "none", ingested_events: [], note: "The decision-log facts this reads do not exist in Tinybird yet." } },
    { id: "placement.presented_accounts", label: "Presented accounts", value_type: "number", statistical_type: "count", direction: "neutral", preferred_analysis_unit: "account", layer: "primitive", catalog_status: "tested", derivation: { carried_by: ["analytics_presentation_timeseries", "analytics_presentation_breakdown", "analytics_presentation_funnel", "exposure_breakdown"], input_origin: "platform", ingested_events: ["placement_exposed", "placement_interaction", "placement_outcome"], ingested_datasources: ["placement_presentations"], note: "BL-0195: reconsidered and left OFF growth_funnel_signals. account_id is stamped on placement_interaction, so the per-rule aggregate CAN compute uniqExact(account_id) \u2014 but this metric belongs to monetization.entitlement_decision, not placement.presentation, and only placement.presentation carries the decision.rule execution route. Grounded data with no route to travel is not honest carriage; see placement.clicks for the metric that IS on that route." } },
    { id: "conversion.paid_accounts", label: "Converted accounts", value_type: "number", statistical_type: "count", direction: "increase", preferred_analysis_unit: "account", layer: "primitive", catalog_status: "tested", derivation: { carried_by: ["analytics_presentation_timeseries", "analytics_presentation_breakdown", "analytics_presentation_funnel", "exposure_breakdown"], input_origin: "platform", ingested_events: ["placement_exposed", "placement_interaction", "placement_outcome"], ingested_datasources: ["placement_presentations"] } },
    {
      id: "conversion.rate",
      label: "Conversion rate",
      when_to_use: "Converted over eligible accounts under the attribution window.",
      value_type: "percent",
      format: { type: "percent", decimals: 1 },
      source_scope: "revturbine_tracked",
      statistical_type: "binary",
      direction: "increase",
      preferred_analysis_unit: "account",
      layer: "derived",
      catalog_status: "tested",
      derivation: { carried_by: ["growth_funnel_signals", "analytics_presentation_timeseries", "analytics_presentation_breakdown", "analytics_presentation_funnel", "exposure_breakdown"], input_origin: "platform", ingested_events: ["placement_exposed", "placement_interaction", "placement_outcome"], ingested_datasources: ["placement_exposure_attribution", "placement_presentations"] }
    },
    // Plan 229 TASK-5 (Q-1 default ruling): the label stops claiming MRR —
    // this is last-touch gross conversion credit, neither monthly nor
    // recurring. carried_by shrinks to the one pipe that can serve it
    // honestly at conversion grain (rule 17): the presentation-family
    // templates read a column no writer populates and are a named refusal.
    { id: "revenue.attributed_mrr", label: "Attributed revenue (last-touch)", value_type: "currency", source_scope: "revturbine_influenced", statistical_type: "revenue", direction: "increase", preferred_analysis_unit: "account", layer: "primitive", catalog_status: "tested", derivation: { carried_by: ["exposure_breakdown"], input_origin: "platform", ingested_events: ["placement_exposed"], ingested_datasources: ["placement_exposure_attribution", "events_billing"], note: "Declared success conversions credited once each to their read-time last-touch exposure (optimization-contracts rules 15-17)." } },
    { id: "retention.retained_mrr_30d", label: "Retained MRR (30d)", value_type: "currency", statistical_type: "revenue", direction: "increase", preferred_analysis_unit: "account", catalog_status: "unavailable", derivation: { input_origin: "none", ingested_events: [], note: "Needs a join against billing data that no presentation-backed executor has access to." } },
    // ── Catalog honesty, BL-0063 (analytics spec cover note §2) ───────────
    // What daily_revenue_rollup actually projects is `sum(amount_cents)` over
    // `invoice.paid` rows. That is neither MRR nor collected cash: an
    // out-of-band paid invoice has no charge (revenue-accounting §6), an
    // annual USD 1,200 subscription posts 120000 cents on its payment day
    // instead of 10000 a month, and a day with no billing event produces no
    // row at all — so it cannot be a stock. It keeps its (one) served
    // measure under an honest id; `revenue.mrr` and `revenue.net_new_mrr`
    // become declared gaps until plan 252's recurring normalizer delivers the
    // contributing stock (S1, AC-16) and classified movements (T2, AC-17).
    {
      id: "revenue.invoice_paid_amount_legacy",
      label: "Paid invoice amount (legacy proxy)",
      when_to_use: "Sum of paid invoice amounts in the period, as Stripe reported them.",
      do_not_use_for: "MRR, ARR, collected cash, or any movement \u2014 it is none of those. Environment-scoped cuts either: billing facts are tenant-global.",
      value_type: "currency",
      source_scope: "total",
      statistical_type: "revenue",
      direction: "increase",
      preferred_analysis_unit: "account",
      layer: "primitive",
      catalog_status: "tested",
      derivation: { carried_by: ["analytics_revenue_timeseries"], input_origin: "platform", ingested_events: [], ingested_datasources: ["events_billing", "aggregates_daily_revenue"], note: "sum(amount_cents) over `invoice.paid` rows, projected by the daily_revenue_rollup materialised view. Platform-sourced: no customer instrumentation involved. Named `_legacy` because it is a cash-adjacent proxy the plan-252 spine replaces, not a run rate: an out-of-band paid invoice has no charge, an annual term posts its whole amount on one day, and no-event days carry nothing forward." }
    },
    { id: "revenue.mrr", label: "MRR", value_type: "currency", source_scope: "total", statistical_type: "revenue", direction: "increase", preferred_analysis_unit: "account", catalog_status: "unavailable", derivation: { input_origin: "none", ingested_events: [], note: "No contractual-stock source exists. The only revenue projection shipped today is the invoice-paid proxy now served as revenue.invoice_paid_amount_legacy, which is a cash-adjacent flow and not a run rate (revenue-accounting \xA76). MRR needs the normalized recurring stock carried forward on no-event days (plan 252 S1, AC-16, TASK-29/34/36)." } },
    { id: "revenue.net_new_mrr", label: "Net new MRR", value_type: "currency", source_scope: "total", statistical_type: "revenue", direction: "increase", preferred_analysis_unit: "account", catalog_status: "unavailable", derivation: { input_origin: "none", ingested_events: [], note: "daily_revenue_rollup computes net_new_revenue_cents with the SAME expression as mrr_cents, so this served the invoice-paid proxy twice rather than a movement. A movement is the classified net change in contractual stock (plan 252 policy A-4, AC-17); until that exists there is nothing honest to serve." } },
    { id: "placement.impressions", label: "Impressions", value_type: "number", statistical_type: "count", direction: "neutral", preferred_analysis_unit: "account", layer: "primitive", catalog_status: "tested", derivation: { carried_by: ["growth_funnel_signals", "analytics_presentation_timeseries", "analytics_presentation_breakdown", "analytics_presentation_funnel", "exposure_breakdown"], input_origin: "platform", ingested_events: ["placement_exposed", "placement_interaction", "placement_outcome"], ingested_datasources: ["placement_presentations"] } },
    { id: "placement.clicks", label: "Clicks", value_type: "number", statistical_type: "count", direction: "increase", preferred_analysis_unit: "account", layer: "primitive", catalog_status: "tested", derivation: { carried_by: ["growth_funnel_signals", "analytics_presentation_timeseries", "analytics_presentation_breakdown", "analytics_presentation_funnel"], input_origin: "platform", ingested_events: ["placement_exposed", "placement_interaction", "placement_outcome"], ingested_datasources: ["placement_presentations"], note: "BL-0195: the placement per-rule route (growth_funnel_signals, decision.rule) derives this from the SAME countIf(interaction_type = 'cta_clicked') already computed as placement.ctr's numerator over placement_interaction \u2014 the pipe just also emits it under its own metric name instead of only inside the ratio." } },
    { id: "placement.conversions", label: "Conversions", value_type: "number", statistical_type: "count", direction: "increase", preferred_analysis_unit: "account", layer: "primitive", catalog_status: "tested", derivation: { carried_by: ["growth_funnel_signals", "analytics_presentation_timeseries", "analytics_presentation_breakdown", "analytics_presentation_funnel", "exposure_breakdown"], input_origin: "platform", ingested_events: ["placement_exposed", "placement_interaction", "placement_outcome"], ingested_datasources: ["placement_presentations"] } },
    { id: "conversion.paid_count", label: "Paid conversions", value_type: "number", when_to_use: "Billing-fact conversion events (subscription created), not distinct accounts.", statistical_type: "count", direction: "increase", preferred_analysis_unit: "account", layer: "primitive", catalog_status: "tested", derivation: { carried_by: ["analytics_revenue_timeseries"], input_origin: "platform", ingested_events: [], ingested_datasources: ["events_billing", "aggregates_daily_revenue"], note: "Counts customer.subscription.created rows, not distinct customers." } },
    { id: "placement.ctr", label: "Click-through rate", value_type: "percent", format: { type: "percent", decimals: 1 }, statistical_type: "ratio", direction: "increase", preferred_analysis_unit: "account", numerator_metric: "placement.clicks", denominator_metric: "placement.impressions", layer: "derived", catalog_status: "tested", derivation: { carried_by: ["growth_funnel_signals", "analytics_presentation_timeseries", "analytics_presentation_breakdown", "analytics_presentation_funnel"], input_origin: "platform", ingested_events: ["placement_exposed", "placement_interaction", "placement_outcome"], ingested_datasources: ["placement_presentations"] } },
    { id: "placement.presentations_per_account", label: "Presentations per account", value_type: "number", source_scope: "revturbine_tracked", statistical_type: "count", direction: "neutral", preferred_analysis_unit: "account", layer: "derived", catalog_status: "tested", derivation: { carried_by: ["growth_funnel_signals", "analytics_presentation_timeseries", "analytics_presentation_breakdown", "analytics_presentation_funnel"], input_origin: "platform", ingested_events: ["placement_exposed", "placement_interaction", "placement_outcome"], ingested_datasources: ["placement_presentations"] } },
    { id: "event.count", label: "Event count", value_type: "number", statistical_type: "count", direction: "neutral", preferred_analysis_unit: "account", layer: "primitive", catalog_status: "tested", derivation: { carried_by: ["analytics_customer_event_timeseries", "analytics_customer_timeline"], input_origin: "mixed", ingested_events: [], ingested_datasources: ["events_clickstream"], note: "Counts whatever is on the stream \u2014 platform events and customer track() names alike \u2014 so it is the one metric that never goes dark." } },
    // ── Cohort metrics (plan 230 TASK-1) ────────────────────────────────
    // All DERIVED at read from raw platform facts (plan 230 R-2): cohort
    // membership is the account's first observed fact; every measure below
    // is computed by the cohort_rollup pipe over events_billing +
    // events_clickstream. Nothing here is ever seeded pre-aggregated.
    { id: "cohort.account_count", label: "Cohort accounts", value_type: "number", source_scope: "total", statistical_type: "count", direction: "neutral", preferred_analysis_unit: "account", layer: "primitive", catalog_status: "tested", derivation: { carried_by: ["cohort_rollup"], input_origin: "platform", ingested_events: [], ingested_datasources: ["events_clickstream", "events_billing"], note: 'Distinct accounts whose first observed fact falls in the cohort period. "Registered" approximates to first-observed \u2014 the platform sees an account when it first emits.' } },
    { id: "cohort.paid_conversion_rate", label: "Cohort paid conversion", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total", statistical_type: "binary", direction: "increase", preferred_analysis_unit: "account", layer: "derived", catalog_status: "tested", derivation: { carried_by: ["cohort_rollup"], input_origin: "platform", ingested_events: ["payment_succeeded", "subscription_started", "trial_converted"], ingested_datasources: ["events_billing", "events_clickstream"], note: "Share of cohort accounts with \u22651 attributable-vocabulary conversion by the given cohort age (rules 15-17 name allowlist, minus expansion)." } },
    { id: "cohort.expansion_rate", label: "Cohort expansion", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total", statistical_type: "binary", direction: "increase", preferred_analysis_unit: "account", layer: "derived", catalog_status: "tested", derivation: { carried_by: ["cohort_rollup"], input_origin: "platform", ingested_events: ["subscription_expanded"], ingested_datasources: ["events_billing"], note: "Share of cohort accounts with \u22651 subscription_expanded by the given cohort age." } },
    { id: "cohort.retention_rate", label: "Cohort retention", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total", statistical_type: "binary", direction: "increase", preferred_analysis_unit: "account", layer: "derived", catalog_status: "tested", derivation: { carried_by: ["cohort_rollup"], input_origin: "platform", ingested_events: ["payment_succeeded", "subscription_renewed"], ingested_datasources: ["events_billing"], note: "Logo retention by billing recurrence: share of the cohort's ever-recurring accounts with a recurrence fact (payment_succeeded | subscription_renewed) in the given age period \u2014 production cycles arrive as the former, the simulation engine's renewal cadence as the latter. Revenue retention is a deliberate non-goal here (see revenue.movement)." } },
    { id: "cohort.ltv_cents", label: "Cohort LTV", value_type: "currency", source_scope: "total", statistical_type: "revenue", direction: "increase", preferred_analysis_unit: "account", layer: "derived", catalog_status: "tested", derivation: { carried_by: ["cohort_rollup"], input_origin: "platform", ingested_events: ["payment_succeeded", "subscription_started", "subscription_expanded", "subscription_renewed", "trial_converted"], ingested_datasources: ["events_billing"], note: "Cumulative gross billing revenue per cohort account through the given age. UNLIKE attribution (rules 15-17), LTV deliberately INCLUDES renewal cycles \u2014 it measures customer value, not placement credit. Grouped by currency; unlike currencies are never summed (rule 17 discipline)." } },
    // ── Monetization-funnel metrics (plan 230 TASK-1) ───────────────────
    { id: "monetization.funnel_accounts", label: "Funnel stage accounts", value_type: "number", source_scope: "total", statistical_type: "count", direction: "neutral", preferred_analysis_unit: "account", layer: "primitive", catalog_status: "tested", derivation: { carried_by: ["monetization_funnel"], input_origin: "platform", ingested_events: ["payment_succeeded", "subscription_started", "subscription_expanded", "trial_converted"], ingested_datasources: ["events_clickstream", "placement_presentations", "events_billing"], note: "Distinct accounts that reached the stage in the window, per the catalog-owned six-stage definition on monetization.funnel_stage." } },
    { id: "monetization.funnel_stage_conversion", label: "Stage conversion", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total", statistical_type: "binary", direction: "increase", preferred_analysis_unit: "account", layer: "derived", catalog_status: "tested", derivation: { carried_by: ["monetization_funnel"], input_origin: "platform", ingested_events: ["payment_succeeded", "subscription_started", "subscription_expanded", "trial_converted"], ingested_datasources: ["events_clickstream", "placement_presentations", "events_billing"], note: "Stage accounts over the PRECEDING stage's accounts \u2014 the \xA71.1.5 stage-to-stage rate, computed from the same rows as funnel_accounts." } },
    {
      id: "placement.last_presented_at",
      label: "Last presented",
      when_to_use: "Recency over ALL retained history \u2014 drives the payload Runtime Status derivation.",
      value_type: "datetime",
      layer: "primitive",
      catalog_status: "tested",
      derivation: { carried_by: ["analytics_presentation_breakdown"], input_origin: "platform", ingested_events: ["placement_exposed", "placement_interaction", "placement_outcome"], ingested_datasources: ["placement_presentations"], note: "Served on the breakdown route via carried_by; the funnel pipe has no such column, so this metric has no execution route through that executor. A binding-coverage gap, not a data-availability one." }
    },
    {
      id: "revenue.attributed_amount",
      label: "Attributed amount",
      when_to_use: "Per-conversion attributed revenue (last-touch, 1h window).",
      value_type: "currency",
      source_scope: "revturbine_influenced",
      statistical_type: "revenue",
      direction: "increase",
      preferred_analysis_unit: "account",
      layer: "primitive",
      catalog_status: "tested",
      derivation: { carried_by: ["growth_funnel_signals", "attributed_conversions"], input_origin: "platform", ingested_events: ["placement_exposed"], ingested_datasources: ["placement_exposure_attribution", "events_billing", "placement_presentations"], note: "Stripe conversions joined ASOF against the presentations that preceded them." }
    },
    {
      id: "experiment.absolute_effect",
      label: "Absolute effect",
      description: "Absolute treatment effect exactly as persisted by the experiment analysis engine. Its unit is determined by experiment.metric; it is never assumed to be currency.",
      when_to_use: "Only with a validated immutable experiment result and its recorded metric, methodology, window, and uncertainty.",
      do_not_use_for: "Descriptive attribution, recomputed estimates, or missing/invalid experiment evidence.",
      value_type: "number",
      source_scope: "revturbine_influenced",
      layer: "primitive",
      catalog_status: "tested",
      derivation: { input_origin: "platform", ingested_events: ["experiment_assigned"], ingested_datasources: ["experiment_analysis_results"], note: "Read from immutable causal results in Postgres, never recomputed at query time." }
    },
    { id: "coverage.matched_paid_accounts", label: "Matched paid accounts", value_type: "number", statistical_type: "count", direction: "increase", preferred_analysis_unit: "account", layer: "primitive", catalog_status: "tested", derivation: { carried_by: ["attributed_conversions"], input_origin: "platform", ingested_events: ["placement_exposed"], ingested_datasources: ["placement_exposure_attribution", "events_billing", "placement_presentations"], note: "Coverage denominator: paid accounts that could be matched to a presentation." } },
    {
      id: "opportunity.candidate_count",
      label: "Opportunity candidates",
      description: "Count of current persisted detector candidates; reading it never reruns a detector.",
      value_type: "number",
      source_scope: "revturbine_tracked",
      statistical_type: "count",
      direction: "neutral",
      preferred_analysis_unit: "account",
      layer: "primitive",
      catalog_status: "tested",
      derivation: { input_origin: "platform", ingested_events: [], ingested_datasources: ["optimization_opportunities"], note: "Control-plane detector output in Postgres, not an ingested event stream." }
    }
  ],
  concepts: [
    {
      id: "growth.lifecycle",
      version: 1,
      label: "Acquisition and activation lifecycle",
      description: "Signup cohorts, activation quality, time-to-value, and D7 retention by acquisition source.",
      grain: ["tenant", "environment", "acquisition_source", "day"],
      analytical_units: ["account", "user"],
      primary_time_dimension: "time.occurred_at",
      historical_mode: "as_of_event",
      dimensions: ["time.occurred_at", "acquisition.source", "targeting.segment"],
      dimension_groundings: {
        "acquisition.source": { kind: "stamped", source: "payload:acquisition_source", anchor: "fact_time" },
        "targeting.segment": { kind: "stamped", source: "envelope:segment_ids", anchor: "fact_time", note: "R-11a stamp; lands with TASK-4" }
      },
      metrics: [
        "acquisition.signup_count",
        "activation.rate",
        "activation.time_to_value_seconds",
        "retention.d7_rate"
      ],
      query_families: ["scalar", "timeseries", "breakdown", "table"],
      source_scope: "total",
      fact_kind: "transaction",
      family: "behavioral",
      primary_key: ["tenant_id", "environment_id", "event_ts", "event_name", "request_id"],
      producer: "customer_authored",
      materialization: { mode: "rollup", rollup_grain: "day" },
      livemode_qualified: false,
      record_contract: {
        record_id: ["tenant_id", "environment_id", "event_ts", "event_name", "request_id"],
        source_namespace: "sdk_clickstream",
        occurred_time_field: "event_ts",
        received_time_field: "ingested_at",
        dedup: "deduplicated_on_record_id",
        revision: "re_emit_higher_version",
        late_arrival: "accepted_within_retention",
        correlation_keys: ["request_id", "event_id", "decision_id"],
        note: "events_clickstream is a ReplacingMergeTree keyed on the sorting tuple with ingested_at as the version, so a re-emission supersedes rather than duplicates. Its `test` column marks simulated traffic, NOT Stripe live/test mode, so this fact is not livemode-qualified. Rows outside tenant_simulation expire after 365 days, which bounds late arrival."
      },
      keys: [
        { key: "tenant", path: "column:tenant_id", resolution: "source" },
        { key: "environment", path: "column:environment_id", resolution: "source" },
        { key: "user", path: "column:user_id", resolution: "source" },
        { key: "account", path: "column:account_id", resolution: "enriched", note: "Nullable on the wire; resolved through the identity map at ingest (R1). An unresolved row keeps its value and counts toward total scope." }
      ],
      measures: [
        { name: "signal_count", source: "row_count", unit: "count", temporal: "flow", sign: "unsigned", aggregation_semantics: "additive" },
        { name: "signal_value", source: "payload:value", unit: "polymorphic", temporal: "gauge", sign: "unsigned", aggregation_semantics: "non_additive", note: "growth_signal_observed is a generic metric carrier: the unit is decided by payload:metric, so one column serves signup counts, activation rates and time-to-value seconds. Rows of different units can never be summed." },
        { name: "signal_numerator", source: "payload:numerator", unit: "count", temporal: "flow", sign: "unsigned", aggregation_semantics: "additive" },
        { name: "signal_denominator", source: "payload:denominator", unit: "count", temporal: "flow", sign: "unsigned", aggregation_semantics: "additive" },
        { name: "sample_size", source: "payload:sample_size", unit: "count", temporal: "flow", sign: "unsigned", aggregation_semantics: "additive" }
      ],
      event_attributes: [
        { name: "event_name", path: "column:event_name" },
        { name: "metric", path: "payload:metric" },
        { name: "dimension_key", path: "payload:dimension_key" },
        { name: "dimension_value", path: "payload:dimension_value" },
        { name: "window_start", path: "payload:window_start" },
        { name: "window_end", path: "payload:window_end" },
        { name: "origin", path: "column:origin" },
        { name: "test", path: "column:test" }
      ],
      sources: [
        { kind: "ingested_event", ref: "growth_signal_observed" },
        { kind: "datasource", ref: "events_clickstream" },
        { kind: "build", ref: "growth_funnel_signals", note: "Query-time pipe; it groups the raw rows to the day, which is why materialization is a rollup rather than a second stored grain." }
      ],
      oracle_family: { family: "none", blocker: "growth_signal_observed aggregation is served straight out of the growth_funnel_signals pipe. DERIVED_METRIC_ORACLE_FAMILIES in @revt-eng/optimization-core covers gate, presentation, revenue, attribution, event_count, cohort and funnel only, so these metrics have no pure derivation to tie out against (R6, plan 228 REQ-6)." },
      policy_dependencies: []
    },
    {
      id: "growth.funnel",
      version: 1,
      label: "Product funnel steps",
      description: "Ordered product funnel step entries, completions, elapsed time, and errors.",
      grain: ["tenant", "environment", "funnel_step", "day"],
      analytical_units: ["account", "user"],
      primary_time_dimension: "time.occurred_at",
      historical_mode: "as_of_event",
      dimensions: ["time.occurred_at", "funnel.step", "targeting.segment"],
      dimension_groundings: {
        "funnel.step": { kind: "derived", source: "observation", anchor: "fact_time", note: "growth_signal_observed dimension_key" },
        "targeting.segment": { kind: "stamped", source: "envelope:segment_ids", anchor: "fact_time", note: "R-11a stamp; lands with TASK-4" }
      },
      metrics: [
        "funnel.entry_count",
        "funnel.completion_rate",
        "funnel.elapsed_seconds",
        "funnel.error_rate"
      ],
      query_families: ["scalar", "timeseries", "breakdown", "funnel", "table"],
      source_scope: "total",
      fact_kind: "transaction",
      family: "behavioral",
      primary_key: ["tenant_id", "environment_id", "event_ts", "event_name", "request_id"],
      producer: "customer_authored",
      materialization: { mode: "rollup", rollup_grain: "day" },
      livemode_qualified: false,
      record_contract: {
        record_id: ["tenant_id", "environment_id", "event_ts", "event_name", "request_id"],
        source_namespace: "sdk_clickstream",
        occurred_time_field: "event_ts",
        received_time_field: "ingested_at",
        dedup: "deduplicated_on_record_id",
        revision: "re_emit_higher_version",
        late_arrival: "accepted_within_retention",
        correlation_keys: ["request_id", "event_id", "decision_id"],
        note: "events_clickstream is a ReplacingMergeTree keyed on the sorting tuple with ingested_at as the version, so a re-emission supersedes rather than duplicates. Its `test` column marks simulated traffic, NOT Stripe live/test mode, so this fact is not livemode-qualified. Rows outside tenant_simulation expire after 365 days, which bounds late arrival."
      },
      keys: [
        { key: "tenant", path: "column:tenant_id", resolution: "source" },
        { key: "environment", path: "column:environment_id", resolution: "source" },
        { key: "user", path: "column:user_id", resolution: "source" },
        { key: "account", path: "column:account_id", resolution: "enriched", note: "Nullable on the wire; resolved through the identity map at ingest (R1). An unresolved row keeps its value and counts toward total scope." }
      ],
      measures: [
        { name: "signal_count", source: "row_count", unit: "count", temporal: "flow", sign: "unsigned", aggregation_semantics: "additive" },
        { name: "signal_value", source: "payload:value", unit: "polymorphic", temporal: "gauge", sign: "unsigned", aggregation_semantics: "non_additive", note: "Unit decided by payload:metric \u2014 the same carrier serves step entry counts, completion rates and elapsed seconds." },
        { name: "signal_numerator", source: "payload:numerator", unit: "count", temporal: "flow", sign: "unsigned", aggregation_semantics: "additive" },
        { name: "signal_denominator", source: "payload:denominator", unit: "count", temporal: "flow", sign: "unsigned", aggregation_semantics: "additive" },
        { name: "sample_size", source: "payload:sample_size", unit: "count", temporal: "flow", sign: "unsigned", aggregation_semantics: "additive" }
      ],
      event_attributes: [
        { name: "event_name", path: "column:event_name" },
        { name: "metric", path: "payload:metric" },
        { name: "dimension_key", path: "payload:dimension_key", note: "funnel.step grounds on this: the pipe reads JSONExtractString(properties, dimension_key)." },
        { name: "dimension_value", path: "payload:dimension_value" },
        { name: "window_start", path: "payload:window_start" },
        { name: "window_end", path: "payload:window_end" },
        { name: "origin", path: "column:origin" },
        { name: "test", path: "column:test" }
      ],
      sources: [
        { kind: "ingested_event", ref: "growth_signal_observed" },
        { kind: "datasource", ref: "events_clickstream" },
        { kind: "build", ref: "growth_funnel_signals" }
      ],
      oracle_family: { family: "none", blocker: "Served straight out of growth_funnel_signals; no growth-signal family exists in DERIVED_METRIC_ORACLE_FAMILIES, so there is no pure derivation to tie out against (R6)." },
      policy_dependencies: []
    },
    {
      id: "growth.trial_conversion",
      version: 1,
      label: "Trial conversion",
      description: "Trial starts, activation, and paid conversion by stable trial rule.",
      grain: ["tenant", "environment", "trial_rule", "day"],
      analytical_units: ["account", "user"],
      primary_time_dimension: "time.occurred_at",
      historical_mode: "as_of_event",
      dimensions: ["time.occurred_at", "trial.rule", "targeting.segment"],
      dimension_groundings: {
        "trial.rule": { kind: "stamped", source: "payload:trial_rule_handle" },
        "targeting.segment": { kind: "stamped", source: "envelope:segment_ids", note: "R-11a stamp; lands with TASK-4" }
      },
      metrics: ["trial.start_count", "trial.activation_rate", "trial.conversion_rate"],
      query_families: ["scalar", "timeseries", "breakdown", "funnel", "table"],
      source_scope: "total",
      sources: [
        { kind: "unavailable", ref: "trial lifecycle fact (app-owned trial revision: episode, subject scope, scheduled vs actual end, outcome)", blocker: "No producer emits a trial lifecycle fact. All three metrics are catalog_status unavailable; plan 276 TASK-2 found zero call sites for any trial lifecycle event, and the only live trial signal is derived from the clock at read time, which plan 276 R-1 forbids as an authority. Blocked on workspace decision D-21." }
      ],
      oracle_family: { family: "none", blocker: "No fact, so no derivation to tie out. The oracle family lands with the trial lifecycle build." },
      policy_dependencies: [
        { kind: "lifecycle", stamped: false, blocker: "Commercial lifecycle (free, trialing, paying, previously paying) is R10 derived attributes on an account-state snapshot that does not exist; no row carries a lifecycle policy version (plan 252 TASK-30/54)." }
      ]
    },
    {
      id: "growth.reactivation",
      version: 1,
      label: "Customer reactivation",
      description: "Inactivity and return behavior for accounts with demonstrated historical health.",
      grain: ["tenant", "environment", "customer_lifecycle_cohort", "day"],
      analytical_units: ["account"],
      primary_time_dimension: "time.occurred_at",
      historical_mode: "as_of_event",
      dimensions: ["time.occurred_at", "customer.lifecycle_cohort", "targeting.segment"],
      dimension_groundings: {
        "customer.lifecycle_cohort": { kind: "derived", source: "derived:first_observed_event" },
        "targeting.segment": { kind: "stamped", source: "envelope:segment_ids", note: "R-11a stamp; lands with TASK-4" }
      },
      metrics: [
        "reactivation.previously_healthy_account_count",
        "reactivation.inactive_previously_healthy_rate",
        "reactivation.reactivated_rate"
      ],
      query_families: ["scalar", "timeseries", "breakdown", "table"],
      source_scope: "total",
      sources: [
        { kind: "unavailable", ref: "account-state snapshot with lifecycle and engagement attributes (R10)", blocker: "All three metrics are catalog_status unavailable. Demonstrated historical health, inactivity and return are R10 derived attributes on an account-state snapshot that nothing builds; plan 227 TASK-2 shipped a lifecycle generator family that models no reactivation at all (plan 276 TASK-18)." }
      ],
      oracle_family: { family: "none", blocker: "No fact, so no derivation to tie out." },
      policy_dependencies: [
        { kind: "lifecycle", stamped: false, blocker: "R10 lifecycle attributes are not built and carry no version." },
        { kind: "engagement", stamped: false, blocker: "R10 engagement thresholds (active, dormant, never used) are not a versioned policy anywhere in the stack." }
      ]
    },
    {
      // Plan 276 TASK-3 (BL-0227), ruling R-6. The effective-time account
      // transition product: one row per state-change OCCURRENCE, which is
      // what retains repeated and same-day movements that a daily account
      // snapshot cannot (the worksheet's S2 stays the daily snapshot).
      //
      // It is registered with NO `fact_kind`. That is not a narrower shape
      // chosen for convenience — every one of its metrics is
      // `catalog_status: 'unavailable'`, and D-9's cross-object rule is that
      // such a concept must NOT describe a fact table it does not have. The
      // fact is built by plan 276 TASK-7 over plan 252's qualified billing
      // facts; when it exists, this concept gains `fact_kind` and the whole
      // record contract at once. Declaring the contract now would be
      // describing rows that do not exist.
      //
      // The record contract TASK-7 will publish is specified in plan 276
      // "Transition materialization" and is deliberately NOT restated here.
      //
      // Registering it now is the point of TASK-3: a binding can refuse a
      // lifecycle movement BY NAME with a stated blocker, instead of the
      // surface returning a silent zero for a question nobody can answer.
      id: "growth.account_lifecycle_transitions_v1",
      version: 1,
      label: "Account lifecycle transitions",
      description: "Effective-time account state changes \u2014 one row per occurrence, retaining repeated and same-day movements.",
      when_to_use: "Counting how accounts MOVED between commercial lifecycle states over a window, including several moves by one account in one day.",
      do_not_use_for: "Point-in-time account state (that is the daily snapshot), revenue amounts, or any signup/trial path \u2014 the Phase B kinds have no producer.",
      grain: ["tenant", "environment", "account", "transition"],
      analytical_units: ["account"],
      primary_time_dimension: "time.occurred_at",
      historical_mode: "as_of_event",
      dimensions: [
        "time.occurred_at",
        "lifecycle.state",
        "commercial.plan",
        "customer.account",
        "trial.rule",
        "release.playbook_version"
      ],
      dimension_groundings: {
        "lifecycle.state": { kind: "derived", source: "derived:commercial_lifecycle_state", anchor: "fact_time", partitions: true, catalog_status: "unavailable", blocker: "R-6 restricts the Phase A vocabulary to metric rule R10's commercial-lifecycle attribute (free, trialing, paying, previously paying) plus `unknown` for incomplete history; billing health and engagement stay separate attributes. That derivation is not built \u2014 plan 276 TASK-4/TASK-7 over plan 252 TASK-29/TASK-54.", note: "A movement edge carries both endpoints (from_state, to_state); grouping resolves the TO endpoint, and the FROM endpoint is the previous edge's TO." },
        "commercial.plan": { kind: "config_join", source: "config:playbook_plan_by_price", anchor: "carried_version", partitions: true, catalog_status: "unavailable", blocker: "Resolved price -> variation -> plan from the IMMUTABLE Playbook snapshot named by the row's carried release version, with a documented effective-time fallback (plan 276 TASK-5). No transition row exists yet (TASK-7).", note: "Single plan only where the composition supports one; a multi-plan account never gets an arbitrary primary plan." },
        "customer.account": { kind: "derived", source: "derived:payer_account_mapping", anchor: "fact_time", partitions: true, catalog_status: "unavailable", blocker: "Account is resolved through the effective-dated payer->account mapping (plan 252 TASK-54, unshipped), NEVER through a latest clickstream association (plan 276 R-2 \u2014 that association is plan 229 F-7 / BL-0068). Unmatched and multi-account payers stay in coverage, never pooled." },
        "trial.rule": { kind: "stamped", source: "column:trial_rule_handle", anchor: "fact_time", partitions: true, catalog_status: "unavailable", blocker: "Phase B only. A Playbook trial rule supplies VOCABULARY \u2014 handle, type, declared fallback target, tier order \u2014 and never an occurrence (R-1c); no producer emits a trial-revision fact, so nothing stamps this. Workspace D-21; plan 276 TASK-12/TASK-14." },
        "release.playbook_version": { kind: "stamped", source: "column:playbook_version", anchor: "carried_version", partitions: true, catalog_status: "unavailable", blocker: "Carried on the transition row the plan 276 TASK-7 projection publishes, so generations are never mixed across incompatible configuration versions. No row exists yet." }
      },
      metrics: [
        "lifecycle.paid_started_count",
        "lifecycle.plan_upgraded_count",
        "lifecycle.plan_downgraded_count",
        "lifecycle.paid_ended_count",
        "lifecycle.reactivated_count",
        "lifecycle.signup_count",
        "lifecycle.trial_started_count",
        "lifecycle.trial_converted_count",
        "lifecycle.trial_reverted_count",
        "lifecycle.access_ended_count",
        "lifecycle.moved_account_count"
      ],
      query_families: ["scalar", "timeseries", "breakdown", "funnel", "table"],
      source_scope: "total",
      sources: [
        { kind: "unavailable", ref: "account_lifecycle_transitions_v1 \u2014 the immutable generation partitions plan 276 TASK-7 publishes over plan 252's qualified billing fact revisions", blocker: "No producer. The five Phase A kinds are derivable from billing facts alone but wait on plan 276 TASK-7 (projection + restartable publication) and TASK-8 (datasource + movement endpoint). The five Phase B kinds have NO authoritative producer of any kind \u2014 workspace D-21, evidenced by plan 276 TASK-2.", note: "TASK-7/TASK-8 in turn wait on plan 252 TASK-28/29/31/34/36/45/54, all unshipped as of 2026-09-25." }
      ],
      oracle_family: { family: "none", blocker: "The pure billing-only transition classifier is plan 276 TASK-4 and does not exist; no family in DERIVED_METRIC_ORACLE_FAMILIES covers a lifecycle transition, so there is nothing to tie out against yet (R6)." },
      policy_dependencies: [
        { kind: "lifecycle", stamped: false, blocker: "The R10 commercial-lifecycle attribute is derived by plan 276 TASK-4 and versioned by the generation TASK-7 publishes; neither exists, so no row carries a lifecycle policy version." },
        { kind: "mrr", stamped: false, blocker: "from_mrr_positive / to_mrr_positive are CONSUMED from plan 252's normalized recurring stock and movement output (TASK-29/34/36/45), never derived from an invoice amount. That output does not exist and stamps no version." }
      ]
    },
    {
      id: "growth.entitlement_usage",
      version: 1,
      label: "Entitlement and usage growth",
      description: "Entitlement adoption, locked demand, usage monetization, and projected bill-risk trends.",
      grain: ["tenant", "environment", "entitlement", "day"],
      analytical_units: ["account"],
      primary_time_dimension: "time.occurred_at",
      historical_mode: "as_of_event",
      dimensions: ["time.occurred_at", "entitlement.entitlement", "decision.rule", "commercial.plan", "targeting.segment"],
      dimension_groundings: {
        "entitlement.entitlement": { kind: "stamped", source: "payload:entitlement_handle", anchor: "fact_time" },
        // BL-0062 (gap G3): every metric on this concept reads `gate_evaluated`,
        // which now names the rule whose limit/enablement produced the outcome.
        // "Which RULE is denying people" was unanswerable here while only the
        // entitlement was stamped — an entitlement with four plan-scoped rules
        // reported one undifferentiated denial count.
        "decision.rule": { kind: "stamped", source: "payload:rule_handle", anchor: "fact_time", partitions: true, catalog_status: "bound" },
        "commercial.plan": { kind: "stamped", source: "payload:plan_handle", anchor: "fact_time" },
        "targeting.segment": { kind: "stamped", source: "envelope:segment_ids", anchor: "fact_time", note: "R-11a stamp; lands with TASK-4" }
      },
      metrics: [
        "entitlement.granted_account_count",
        "entitlement.adoption_rate",
        "entitlement.adopter_retention_lift",
        "entitlement.denied_account_count",
        "entitlement.denied_attempts_per_account",
        "entitlement.denied_upgrade_conversion_rate",
        "usage.metered_per_account",
        "usage.expansion_mrr_per_unit",
        "revenue.expansion_mrr",
        "usage.projected_bill_to_historical_ratio",
        "usage.acceleration_rate",
        "usage.alert_coverage_rate"
      ],
      query_families: ["scalar", "timeseries", "breakdown", "table"],
      source_scope: "total",
      fact_kind: "transaction",
      family: "behavioral",
      primary_key: ["tenant_id", "environment_id", "event_ts", "event_name", "request_id"],
      producer: "platform",
      materialization: { mode: "rollup", rollup_grain: "day" },
      livemode_qualified: false,
      record_contract: {
        record_id: ["tenant_id", "environment_id", "event_ts", "event_name", "request_id"],
        source_namespace: "sdk_clickstream",
        occurred_time_field: "event_ts",
        received_time_field: "ingested_at",
        dedup: "deduplicated_on_record_id",
        revision: "re_emit_higher_version",
        late_arrival: "accepted_within_retention",
        correlation_keys: ["request_id", "event_id", "decision_id"],
        note: "events_clickstream is a ReplacingMergeTree keyed on the sorting tuple with ingested_at as the version, so a re-emission supersedes rather than duplicates. Its `test` column marks simulated traffic, NOT Stripe live/test mode, so this fact is not livemode-qualified. Rows outside tenant_simulation expire after 365 days, which bounds late arrival."
      },
      keys: [
        { key: "tenant", path: "column:tenant_id", resolution: "source" },
        { key: "environment", path: "column:environment_id", resolution: "source" },
        { key: "user", path: "column:user_id", resolution: "source" },
        { key: "account", path: "column:account_id", resolution: "enriched", note: "Nullable on the wire; resolved through the identity map at ingest (R1). An unresolved row keeps its value and counts toward total scope." }
      ],
      measures: [
        { name: "gate_evaluations", source: "row_count", unit: "count", temporal: "flow", sign: "unsigned", aggregation_semantics: "additive" },
        { name: "gate_limit", source: "payload:limit", unit: "usage_unit", temporal: "gauge", sign: "unsigned", aggregation_semantics: "non_additive" },
        { name: "gate_used", source: "payload:used", unit: "usage_unit", temporal: "gauge", sign: "unsigned", aggregation_semantics: "non_additive" },
        { name: "gate_remaining", source: "payload:remaining", unit: "usage_unit", temporal: "gauge", sign: "unsigned", aggregation_semantics: "non_additive" }
      ],
      event_attributes: [
        { name: "event_name", path: "column:event_name", note: "gate_evaluated and gate_denied share this fact; the pipe discriminates on it." },
        { name: "outcome", path: "payload:outcome" },
        { name: "gated", path: "payload:gated" },
        { name: "reason", path: "payload:reason" },
        { name: "entitlement_handle", path: "payload:entitlement_handle" },
        { name: "rule_handle", path: "payload:rule_handle", note: "BL-0062: the winning entitlement rule, stamped at emit; nullable when no rule matched." },
        { name: "plan_handle", path: "payload:plan_handle" },
        { name: "origin", path: "column:origin" },
        { name: "test", path: "column:test" }
      ],
      sources: [
        { kind: "ingested_event", ref: "gate_evaluated" },
        { kind: "ingested_event", ref: "gate_denied" },
        { kind: "datasource", ref: "events_clickstream" },
        { kind: "build", ref: "growth_funnel_signals" }
      ],
      oracle_family: { family: "gate" },
      policy_dependencies: []
    },
    {
      id: "growth.commercial_health",
      version: 1,
      label: "Commercial growth health",
      description: "Expansion pressure, packaging health, promotion economics, and retention-risk trends.",
      grain: ["tenant", "environment", "commercial_resource", "day"],
      analytical_units: ["account"],
      primary_time_dimension: "time.occurred_at",
      historical_mode: "as_of_event",
      dimensions: ["time.occurred_at", "commercial.plan", "promotion.promotion", "targeting.segment"],
      dimension_groundings: {
        "commercial.plan": { kind: "stamped", source: "payload:plan_handle" },
        "promotion.promotion": { kind: "stamped", source: "payload:promotion_handle" },
        "targeting.segment": { kind: "stamped", source: "envelope:segment_ids", note: "R-11a stamp; lands with TASK-4" }
      },
      metrics: [
        "usage.utilization_rate",
        "usage.growth_rate",
        "revenue.expansion_mrr",
        "pricing.entry_tier_account_share",
        "pricing.self_serve_upgrade_rate",
        "pricing.plan_churn_rate",
        "promotion.discount_use_rate",
        "promotion.full_price_conversion_rate",
        "promotion.net_revenue_lift_rate",
        "retention.active_users_per_account",
        "retention.core_action_frequency",
        "retention.active_days_rate"
      ],
      query_families: ["scalar", "timeseries", "breakdown", "table"],
      source_scope: "total",
      sources: [
        { kind: "unavailable", ref: "contractual recurring stock and the plan / promotion economics facts", blocker: "Every one of the twelve metrics is catalog_status unavailable. Utilization, pricing, promotion and retention rates all need the normalized recurring stock and the commercial facts plan 252 TASK-29/31/34/38 build; growth_funnel_signals carries the metric ids but no producer writes their rows." }
      ],
      oracle_family: { family: "none", blocker: "No fact, so no derivation to tie out." },
      policy_dependencies: [
        { kind: "mrr", stamped: false, blocker: "No MRR policy exists: normalization and movement classification are revenue-accounting semantics that plan 252 TASK-29/45 build." },
        { kind: "engagement", stamped: false, blocker: "The retention metrics here need R10 engagement thresholds, which are not a versioned policy." }
      ]
    },
    {
      id: "monetization.entitlement_decision",
      version: 1,
      label: "Entitlement decisions",
      description: "Entitlement decision funnel from eligibility through presentation to conversion.",
      when_to_use: "Which rules and plans drive conversion; where the decision funnel leaks.",
      grain: ["tenant", "environment", "account", "decision_rule", "day"],
      analytical_units: ["account", "user"],
      primary_time_dimension: "time.occurred_at",
      historical_mode: "as_of_event",
      dimensions: [
        "time.occurred_at",
        "commercial.plan",
        "commercial.billing_period",
        "lifecycle.state",
        "targeting.segment",
        "decision.rule",
        "decision.entitlement",
        "release.playbook_version",
        "experiment.experiment",
        "experiment.variant"
      ],
      dimension_groundings: {
        "commercial.plan": { kind: "stamped", source: "payload:plan_handle", anchor: "fact_time" },
        "commercial.billing_period": { kind: "stamped", source: "payload:billing_period", anchor: "fact_time", catalog_status: "unavailable", blocker: "BL-0248/G13: no serving pipe exposes a billing-period split. placement_presentations has no such column, and exposure_breakdown's dimension enum offers only segment and converted_plan, so the stamp never reaches a group_by. A Tinybird pipe change, not a mapping fix." },
        "lifecycle.state": { kind: "config_join", source: "config:activity_tier", anchor: "current", catalog_status: "unavailable", blocker: "BL-0248/G13: a config join with no execution path. The plan-180 activity tier lives in Postgres configuration; the \xA75.6 tenant-scoped configuration snapshots that would put it in the warehouse do not exist, so no pipe performs this join and the concept declares no config source for it." },
        "targeting.segment": { kind: "stamped", source: "envelope:segment_ids", anchor: "fact_time", note: "R-11a stamp; lands with TASK-4" },
        // BL-0062 (worksheet gap G3): both of these were `config_join` against
        // a `events_decisions` datasource that does not exist and was never
        // planned — the "decision-log" shape assumed the decision had to be
        // reconstructed from configuration because the EVENT recording it
        // carried no rule identity. Stamping `rule_handle` at emit retires that
        // assumption: the gate payloads now carry the winning rule themselves,
        // so the slice is a plain stamped read of the fact row, anchored at the
        // fact's own time, and the register gap is closed rather than deferred.
        // `catalog_status: 'bound'` is deliberately not 'validated'/'tested' —
        // the definition is bound to a real source, but the extraction in
        // revturbine-web's `growth_funnel_signals` pipe and its conformance
        // tests are the separate execution-layer step.
        "decision.rule": { kind: "stamped", source: "payload:rule_handle", anchor: "fact_time", partitions: true, catalog_status: "bound", note: "BL-0062: the winning entitlement/placement rule, stamped at emit" },
        // BL-0248/G13: this grounding was `bound` while `bindings.ts` denied it
        // globally — the exact split-brain G13 names, and the definition is the
        // half that was wrong. The gate PAYLOADS carry `entitlement_handle`,
        // but this concept's fact rows are placement exposures and outcomes
        // (placement_presentations / placement_exposure_attribution), and that
        // lane carries no entitlement key at all. The gate lane that does
        // carries neither an exposure nor revenue, so borrowing a temporally
        // adjacent gate event's entitlement would assert a link no fact makes.
        "decision.entitlement": { kind: "stamped", source: "payload:entitlement_handle", anchor: "fact_time", partitions: true, catalog_status: "unavailable", blocker: "BL-0248/G13: the entitlement key is stamped on the GATE payloads, not on this concept's exposure/outcome fact rows; the gate lane carries neither an exposure nor revenue, so no honest join exists. Stamping the entitlement of a temporally adjacent gate event onto a movement would assert a link no fact makes.", note: "BL-0062 recorded the payload stamp; BL-0248 records that this concept's fact does not carry it" },
        "release.playbook_version": { kind: "stamped", source: "column:playbook_version", anchor: "carried_version", catalog_status: "unavailable", blocker: "BL-0248/G13: the column exists on placement_presentations (plan 228 additive migration 003) but no serving pipe splits by it \u2014 a pipe change, no longer a data-capture gap." },
        "experiment.experiment": { kind: "stamped", source: "column:experiment_id", anchor: "fact_time", catalog_status: "unavailable", blocker: "BL-0248/G13: experiment_id is on the fact rows, but only experiment.variant is wired into a serving pipe's split enum; an experiment-level split is a Tinybird pipe change." },
        "experiment.variant": { kind: "stamped", source: "column:variant_key", anchor: "fact_time" }
      },
      metrics: [
        "decision.eligible_accounts",
        "decision.reached_accounts",
        "placement.presented_accounts",
        "conversion.paid_accounts",
        "conversion.rate",
        "revenue.attributed_mrr",
        "retention.retained_mrr_30d"
      ],
      query_families: ["scalar", "timeseries", "breakdown", "funnel", "table"],
      source_scope: "revturbine_tracked",
      coverage_metric: "coverage.matched_paid_accounts",
      fact_kind: "transaction",
      family: "behavioral",
      primary_key: ["tenant_id", "environment_id", "presented_at", "placement_id", "payload_id"],
      producer: "platform",
      materialization: { mode: "rollup", rollup_grain: "day" },
      livemode_qualified: false,
      record_contract: {
        record_id: ["tenant_id", "environment_id", "presented_at", "placement_id", "payload_id"],
        source_namespace: "sdk_clickstream",
        occurred_time_field: "presented_at",
        dedup: "append_only",
        revision: "immutable",
        late_arrival: "accepted_within_retention",
        correlation_keys: ["exposure_id", "experiment_id", "surface_slot_id"],
        note: "placement_presentations is a plain MergeTree: rows are append-only and immutable, and there is NO received-time column, so observation time is not recoverable from the fact (R2 asks for both). Its `test` column marks simulated traffic, not Stripe live/test mode."
      },
      keys: [
        { key: "tenant", path: "column:tenant_id", resolution: "source" },
        { key: "environment", path: "column:environment_id", resolution: "source" },
        { key: "account", path: "column:account_id", resolution: "source" },
        { key: "user", path: "column:user_id", resolution: "source" },
        { key: "placement", path: "column:placement_id", resolution: "source" },
        { key: "payload", path: "column:payload_id", resolution: "source" },
        { key: "surface_slot", path: "column:surface_slot_id", resolution: "source" },
        { key: "message_block", path: "column:message_block_handle", resolution: "source" },
        { key: "experiment", path: "column:experiment_id", resolution: "source" },
        { key: "variant", path: "column:variant_key", resolution: "source" },
        { key: "exposure", path: "column:exposure_id", resolution: "source" }
      ],
      measures: [
        { name: "presentations", source: "row_count", unit: "count", temporal: "flow", sign: "unsigned", aggregation_semantics: "additive" },
        { name: "converted_amount_cents", source: "column:converted_amount_cents", unit: "currency_minor", temporal: "flow", sign: "signed", aggregation_semantics: "additive", note: "Carried on placement_exposure_attribution, not on placement_presentations: the conversion amount is last-touch enrichment from events_billing (rule 17), which is also why this concept is not livemode-qualified." }
      ],
      event_attributes: [
        { name: "outcome", path: "column:outcome" },
        { name: "outcome_at", path: "column:outcome_at" },
        { name: "playbook_version", path: "column:playbook_version" },
        { name: "rule_handle", path: "payload:rule_handle" },
        { name: "entitlement_handle", path: "payload:entitlement_handle" },
        { name: "plan_handle", path: "payload:plan_handle" },
        { name: "billing_period", path: "payload:billing_period" },
        { name: "converted", path: "column:converted" },
        { name: "is_last_touch", path: "column:is_last_touch" },
        { name: "test", path: "column:test" }
      ],
      sources: [
        { kind: "ingested_event", ref: "placement_exposed" },
        { kind: "ingested_event", ref: "placement_interaction" },
        { kind: "ingested_event", ref: "placement_outcome" },
        { kind: "datasource", ref: "placement_presentations" },
        { kind: "datasource", ref: "placement_exposure_attribution" },
        { kind: "datasource", ref: "events_billing", note: "Conversion enrichment only; the gate-funnel stages read the clickstream through growth_funnel_signals." },
        { kind: "build", ref: "exposure_breakdown" }
      ],
      oracle_family: { family: "presentation" },
      policy_dependencies: [
        { kind: "attribution", stamped: false, blocker: "The last-touch attribution policy is the hard-coded ATTRIBUTION_WINDOW_SECONDS = 3600 constant in @revt-eng/optimization-core; placement_exposure_attribution stores the window per row but never a policy VERSION, so a result cannot cite the policy set that produced it (R2/R9, plan 252 TASK-46)." }
      ]
    },
    {
      id: "revenue.movement",
      version: 1,
      label: "Revenue movement",
      description: "Billing-fact revenue: today the paid-invoice amount projected per day, with MRR levels and movements declared but not yet served. Billing facts carry no environment scope, so this concept is tenant-global.",
      do_not_use_for: "Per-environment revenue cuts.",
      grain: ["tenant", "day"],
      analytical_units: ["account"],
      primary_time_dimension: "time.occurred_at",
      historical_mode: "current",
      dimensions: ["time.occurred_at", "commercial.plan", "commercial.billing_period", "revenue.currency"],
      dimension_groundings: {
        "commercial.plan": { kind: "stamped", source: "payload:plan_handle", anchor: "fact_time", catalog_status: "unavailable", blocker: "BL-0248/G13: the daily revenue rollup carries no plan column, so aggregates_daily_revenue cannot be cut by plan. Plan cuts of revenue arrive with the billing-vocabulary datasource work (plan 252 TASK-9/TASK-31)." },
        "commercial.billing_period": { kind: "stamped", source: "payload:billing_period", anchor: "fact_time", catalog_status: "unavailable", blocker: "BL-0248/G13: the daily revenue rollup carries no billing-period column; same billing-vocabulary datasource work as the plan slice (plan 252 TASK-9/TASK-31)." },
        "revenue.currency": { kind: "stamped", source: "column:currency", anchor: "fact_time" }
      },
      // Plan 229 TASK-5: attributed revenue left this concept — its only
      // revenue-family carrier summed the never-populated presentation
      // column. It lives under monetization.entitlement_decision, served at
      // conversion grain by exposure_breakdown (rule 17).
      // BL-0063: the served measure is the invoice-paid proxy, now declared
      // under its own id. revenue.mrr / revenue.net_new_mrr stay listed as
      // declared gaps (catalog_status='unavailable') so the concept keeps
      // naming what a revenue reader expects and says it is not served.
      metrics: ["revenue.invoice_paid_amount_legacy", "revenue.mrr", "revenue.net_new_mrr", "conversion.paid_count"],
      query_families: ["scalar", "timeseries", "breakdown"],
      source_scope: "total",
      fact_kind: "transaction",
      family: "billing",
      primary_key: ["tenant_id", "occurred_at", "stripe_event_id"],
      producer: "platform",
      materialization: { mode: "rollup", rollup_grain: "day" },
      livemode_qualified: false,
      record_contract: {
        record_id: ["stripe_event_id"],
        source_namespace: "stripe",
        occurred_time_field: "occurred_at",
        received_time_field: "ingested_at",
        dedup: "deduplicated_on_record_id",
        revision: "re_emit_higher_version",
        late_arrival: "accepted",
        correlation_keys: ["billing_ref", "subscription_id"],
        note: "GAP against R2: events_billing carries NO Stripe livemode column, so live and test revenue are indistinguishable in the fact itself \u2014 the reason livemode_qualified is false rather than true. Plan 252 TASK-9 adds it. The datasource is TTL-free, so late Stripe deliveries are accepted without bound."
      },
      keys: [
        { key: "tenant", path: "column:tenant_id", resolution: "source" },
        { key: "payer", path: "column:customer_id", resolution: "source", note: "The Stripe customer. Billing facts and the ledger are keyed by payer; account is an enriched attribute (metric-primitives section 6)." },
        { key: "subscription", path: "column:subscription_id", resolution: "source" },
        { key: "user", path: "column:user_id", resolution: "source" },
        { key: "account", path: "-", resolution: "absent", note: "events_billing carries the payer only and no enrichment writes an account key, so an account slice would have to run in account_matched scope with excluded payers shown as coverage. This concept offers no account cut for that reason." },
        { key: "environment", path: "-", resolution: "absent", note: "Billing facts are tenant-global: events_billing has no environment_id. That is why the stored grain is [tenant, day] and per-environment revenue cuts are refused." }
      ],
      measures: [
        { name: "amount_cents", source: "column:amount_cents", unit: "currency_minor", temporal: "flow", sign: "signed", aggregation_semantics: "additive" },
        { name: "mrr_cents", source: "column:mrr_cents", unit: "currency_minor", temporal: "flow", sign: "signed", aggregation_semantics: "additive", note: "On aggregates_daily_revenue. Named mrr_cents but computed as the paid-invoice amount per day: a cash-adjacent FLOW, not a run rate, served as revenue.invoice_paid_amount_legacy (BL-0063). There is no MRR stock measure anywhere in the fact." },
        { name: "paid_conversions", source: "column:paid_conversions", unit: "count", temporal: "flow", sign: "unsigned", aggregation_semantics: "additive" }
      ],
      event_attributes: [
        { name: "stripe_event_type", path: "column:stripe_event_type" },
        { name: "event_name", path: "column:event_name", note: "The declared billing vocabulary name plan 228 stamps beside the raw Stripe type." },
        { name: "currency", path: "column:currency" },
        { name: "plan_handle", path: "payload:plan_handle" },
        { name: "billing_period", path: "payload:billing_period" }
      ],
      sources: [
        { kind: "datasource", ref: "events_billing" },
        { kind: "datasource", ref: "aggregates_daily_revenue" },
        { kind: "build", ref: "daily_revenue_rollup", note: "Materialized view over events_billing; it keys on stripe_event_type = invoice.paid and hard-codes expansion_revenue_cents to 0 (BL-0063)." }
      ],
      oracle_family: { family: "revenue" },
      policy_dependencies: [
        { kind: "mrr", stamped: false, blocker: "No MRR policy exists to stamp: normalization and movement classification are revenue-accounting sections 3-4, built by plan 252 TASK-29/34/45. Same reason revenue.mrr and net_new_mrr are unavailable, and why the D-9 revenue.stock/.movement/.ledger split is NOT made here: the only served measure is the invoice-paid cash proxy." }
      ]
    },
    {
      id: "placement.presentation",
      version: 1,
      label: "Placement performance",
      description: "Placement and payload presentations with interaction outcomes and attributed revenue, as recorded at event time.",
      grain: ["tenant", "environment", "account", "placement", "day"],
      analytical_units: ["account", "user"],
      primary_time_dimension: "time.occurred_at",
      historical_mode: "as_of_event",
      dimensions: [
        "time.occurred_at",
        "placement.placement",
        "placement.payload",
        "content.message_block",
        "commercial.plan",
        "targeting.segment",
        "experiment.experiment",
        "experiment.variant",
        "release.playbook_version",
        // BL-0182: the placement lane's own rule slice. #389 stamped
        // `rule_handle` on the four lifecycle, five slot and three gate
        // events; BL-0182 completes the funnel by adding it to
        // `placement_interaction`, which is the click between exposure and
        // outcome and the only one of the three that did not share
        // `placementLifecycleBase`. With all three stamped, "which placement
        // RULE converts" is a read of the facts rather than a reconstruction.
        "decision.rule"
      ],
      dimension_groundings: {
        // Stamped on the payload, not a column: the placement events carry the
        // winning `PlacementOutput.rule_id`, and `events_clickstream` holds
        // payload fields inside its `properties` JSON, so no datasource
        // migration stands between the stamp and the slice. `catalog_status:
        // 'bound'` and not 'validated' for the same reason #389 gave — the
        // definition names a real source; the extraction in revturbine-web's
        // `growth_funnel_signals` pipe is the separate execution-layer step.
        "decision.rule": { kind: "stamped", source: "payload:rule_handle", anchor: "fact_time", partitions: true, catalog_status: "bound", note: "BL-0182: the winning placement rule, stamped on exposure, interaction and outcome" },
        "commercial.plan": { kind: "stamped", source: "column:converted_plan_handle", anchor: "touch_time", note: "via placement_exposure_attribution (TASK-10)" },
        "targeting.segment": { kind: "stamped", source: "column:segment_ids", anchor: "exposure_time", note: "as-of exposure, via placement_exposure_attribution (TASK-10)" },
        "placement.placement": { kind: "stamped", source: "column:placement_id", anchor: "fact_time" },
        "placement.payload": { kind: "stamped", source: "column:payload_id", anchor: "fact_time" },
        "content.message_block": { kind: "stamped", source: "column:message_block_handle", anchor: "fact_time" },
        "experiment.experiment": { kind: "stamped", source: "column:experiment_id", anchor: "fact_time", catalog_status: "unavailable", blocker: "BL-0248/G13: experiment_id is on placement_presentations, but only experiment.variant is wired into the presentation pipes' split enum; an experiment-level split is a Tinybird pipe change." },
        "experiment.variant": { kind: "stamped", source: "column:variant_key", anchor: "fact_time" },
        "release.playbook_version": { kind: "stamped", source: "column:playbook_version", anchor: "carried_version", catalog_status: "unavailable", blocker: "BL-0248/G13: the column exists on placement_presentations (plan 228 additive migration 003) but no serving pipe splits by it yet \u2014 a pipe change, not a data-capture gap.", note: "additive column on placement_presentations \u2014 AC-10 first customer" }
      },
      metrics: [
        "placement.impressions",
        "placement.clicks",
        "placement.ctr",
        "placement.presentations_per_account",
        "placement.conversions",
        "conversion.rate",
        // Plan 229 TASK-5: revenue.attributed_mrr left this concept — the
        // presentation templates summed a column no writer populates (silent
        // zero, the F-1 split-brain). Attributed revenue is served at
        // conversion grain under monetization.entitlement_decision
        // (exposure_breakdown, rule 17).
        "placement.last_presented_at"
      ],
      query_families: ["scalar", "timeseries", "breakdown", "table"],
      source_scope: "revturbine_tracked",
      coverage_metric: "coverage.matched_paid_accounts",
      fact_kind: "transaction",
      family: "behavioral",
      primary_key: ["tenant_id", "environment_id", "presented_at", "placement_id", "payload_id"],
      producer: "platform",
      materialization: { mode: "rollup", rollup_grain: "day" },
      livemode_qualified: false,
      record_contract: {
        record_id: ["tenant_id", "environment_id", "presented_at", "placement_id", "payload_id"],
        source_namespace: "sdk_clickstream",
        occurred_time_field: "presented_at",
        dedup: "append_only",
        revision: "immutable",
        late_arrival: "accepted_within_retention",
        correlation_keys: ["exposure_id", "experiment_id", "surface_slot_id"],
        note: "placement_presentations is a plain MergeTree: rows are append-only and immutable, and there is NO received-time column, so observation time is not recoverable from the fact (R2 asks for both). Its `test` column marks simulated traffic, not Stripe live/test mode."
      },
      keys: [
        { key: "tenant", path: "column:tenant_id", resolution: "source" },
        { key: "environment", path: "column:environment_id", resolution: "source" },
        { key: "account", path: "column:account_id", resolution: "source" },
        { key: "user", path: "column:user_id", resolution: "source" },
        { key: "placement", path: "column:placement_id", resolution: "source" },
        { key: "payload", path: "column:payload_id", resolution: "source" },
        { key: "surface_slot", path: "column:surface_slot_id", resolution: "source" },
        { key: "message_block", path: "column:message_block_handle", resolution: "source" },
        { key: "experiment", path: "column:experiment_id", resolution: "source" },
        { key: "variant", path: "column:variant_key", resolution: "source" },
        { key: "exposure", path: "column:exposure_id", resolution: "source" }
      ],
      measures: [
        { name: "presentations", source: "row_count", unit: "count", temporal: "flow", sign: "unsigned", aggregation_semantics: "additive", note: "Impressions, clicks and conversions are all this measure under an outcome filter; CTR and presentations-per-account are derived ratios over it. There is no separate stored click or conversion column." },
        { name: "last_presented_at", source: "column:presented_at", unit: "timestamp", temporal: "gauge", sign: "unsigned", aggregation_semantics: "non_additive", note: "max(presented_at) drives Runtime Status; a recency marker, never a countable outcome." }
      ],
      event_attributes: [
        { name: "outcome", path: "column:outcome" },
        { name: "outcome_at", path: "column:outcome_at" },
        { name: "surface_template_id", path: "column:surface_template_id" },
        { name: "playbook_version", path: "column:playbook_version" },
        { name: "rule_handle", path: "payload:rule_handle", note: "BL-0182: stamped on exposure, interaction and outcome; held in the clickstream properties JSON, so no datasource migration stands between the stamp and the slice." },
        { name: "test", path: "column:test" }
      ],
      sources: [
        { kind: "ingested_event", ref: "placement_exposed" },
        { kind: "ingested_event", ref: "placement_interaction" },
        { kind: "ingested_event", ref: "placement_outcome" },
        { kind: "datasource", ref: "placement_presentations" },
        { kind: "datasource", ref: "placement_exposure_attribution" },
        { kind: "build", ref: "exposure_breakdown" }
      ],
      oracle_family: { family: "presentation" },
      policy_dependencies: [
        { kind: "attribution", stamped: false, blocker: "The last-touch attribution policy is the hard-coded ATTRIBUTION_WINDOW_SECONDS = 3600 constant in @revt-eng/optimization-core; placement_exposure_attribution stores the window per row but never a policy VERSION, so a result cannot cite the policy set that produced it (R2/R9, plan 252 TASK-46)." }
      ]
    },
    {
      id: "revenue.attribution",
      version: 1,
      label: "Attributed conversions",
      description: "Revenue-bearing conversions credited to the most recent preceding presentation (last-touch, 1h window). Billing facts carry no environment scope, so attribution is tenant-global.",
      when_to_use: "Which presentations preceded real conversions, one row per conversion.",
      do_not_use_for: "Per-environment cuts; total-revenue accounting (use revenue.movement).",
      grain: ["tenant", "conversion"],
      analytical_units: ["account"],
      primary_time_dimension: "time.occurred_at",
      historical_mode: "as_of_event",
      dimensions: ["time.occurred_at", "placement.placement", "placement.payload", "experiment.experiment", "experiment.variant", "revenue.currency"],
      dimension_groundings: {
        "revenue.currency": { kind: "stamped", source: "column:currency", anchor: "fact_time" },
        "placement.placement": { kind: "stamped", source: "column:placement_id", anchor: "touch_time" },
        "placement.payload": { kind: "stamped", source: "column:payload_id", anchor: "touch_time" },
        "experiment.experiment": { kind: "stamped", source: "column:experiment_id", anchor: "touch_time" },
        "experiment.variant": { kind: "stamped", source: "column:variant_key", anchor: "touch_time" }
      },
      metrics: ["revenue.attributed_amount"],
      query_families: ["table"],
      source_scope: "revturbine_influenced",
      fact_kind: "accumulating_snapshot",
      family: "behavioral",
      primary_key: ["tenant_id", "environment_id", "presented_at", "exposure_id"],
      producer: "platform",
      materialization: { mode: "raw" },
      livemode_qualified: false,
      record_contract: {
        record_id: ["tenant_id", "environment_id", "presented_at", "exposure_id"],
        source_namespace: "sdk_clickstream",
        occurred_time_field: "presented_at",
        received_time_field: "enriched_at",
        dedup: "deduplicated_on_record_id",
        revision: "re_emit_higher_version",
        late_arrival: "accepted_within_retention",
        correlation_keys: ["exposure_id", "conversion_event_id"],
        note: "One row per exposure, followed forward: enrichment re-emits the WHOLE row with a higher enriched_at, which is what makes this an accumulating snapshot rather than a transaction fact. Its conversion enrichment reads events_billing, which carries no Stripe livemode column, so the row cannot be livemode-qualified either."
      },
      keys: [
        { key: "tenant", path: "column:tenant_id", resolution: "source" },
        { key: "environment", path: "column:environment_id", resolution: "source", note: "Carried on the exposure row, but the concept grain is [tenant, conversion] because the conversion side comes from tenant-global billing facts." },
        { key: "account", path: "column:account_id", resolution: "source" },
        { key: "user", path: "column:user_id", resolution: "source" },
        { key: "placement", path: "column:placement_id", resolution: "source" },
        { key: "payload", path: "column:payload_id", resolution: "source" },
        { key: "surface_slot", path: "column:surface_slot_id", resolution: "source" },
        { key: "message_block", path: "column:message_block_handle", resolution: "source" },
        { key: "experiment", path: "column:experiment_id", resolution: "source" },
        { key: "variant", path: "column:variant_key", resolution: "source" },
        { key: "exposure", path: "column:exposure_id", resolution: "source" }
      ],
      measures: [
        { name: "conversions", source: "column:converted", unit: "count", temporal: "flow", sign: "unsigned", aggregation_semantics: "additive", note: "Counted only where is_last_touch = 1, so one conversion is credited once (optimization-contracts rules 15-17)." },
        { name: "converted_amount_cents", source: "column:converted_amount_cents", unit: "currency_minor", temporal: "flow", sign: "signed", aggregation_semantics: "additive" }
      ],
      event_attributes: [
        { name: "outcome", path: "column:outcome" },
        { name: "converted", path: "column:converted" },
        { name: "converted_at", path: "column:converted_at" },
        { name: "is_last_touch", path: "column:is_last_touch" },
        { name: "converted_currency", path: "column:converted_currency" },
        { name: "converted_plan_handle", path: "column:converted_plan_handle" },
        { name: "converted_billing_period", path: "column:converted_billing_period" },
        { name: "attribution_window_seconds", path: "column:attribution_window_seconds" },
        { name: "rule_handle", path: "column:rule_handle" },
        { name: "segment_ids", path: "column:segment_ids", note: "Segments as of exposure; multivalued, so grouping by it does not partition the rows (R7)." },
        { name: "playbook_version", path: "column:playbook_version" },
        { name: "test", path: "column:test" }
      ],
      sources: [
        { kind: "ingested_event", ref: "placement_exposed" },
        { kind: "datasource", ref: "placement_presentations" },
        { kind: "datasource", ref: "placement_exposure_attribution" },
        { kind: "datasource", ref: "events_billing" },
        { kind: "build", ref: "rebuild_placement_exposure_attribution" }
      ],
      build: {
        kind: "pipe",
        ref: "rebuild_placement_exposure_attribution",
        inputs: ["placement_presentations", "events_billing", "placement_exposure_attribution"]
      },
      maturity: {
        status: "declared",
        horizon_field: "attribution_window_seconds",
        observed_through_field: "enriched_at"
      },
      oracle_family: { family: "attribution" },
      policy_dependencies: [
        { kind: "attribution", stamped: false, blocker: "The last-touch attribution policy is the hard-coded ATTRIBUTION_WINDOW_SECONDS = 3600 constant in @revt-eng/optimization-core; placement_exposure_attribution stores the window per row but never a policy VERSION, so a result cannot cite the policy set that produced it (R2/R9, plan 252 TASK-46)." }
      ]
    },
    {
      id: "experiment.causal_result",
      version: 1,
      label: "Immutable experiment results",
      description: "Validated, persisted experiment-analysis results. These are causal estimates only when evidence_state is available; absence or invalidity is unavailable, never zero.",
      when_to_use: "Explain measured treatment contribution from immutable experiment results without rerunning analysis.",
      do_not_use_for: "Last-touch attribution, detector output, on-read analysis, or currency amounts unless the persisted result records an explicit currency partition.",
      grain: ["tenant", "environment", "experiment", "variant", "metric", "analysis_result"],
      analytical_units: ["account", "user"],
      primary_time_dimension: "time.occurred_at",
      historical_mode: "as_of_event",
      dimensions: [
        "time.occurred_at",
        "experiment.experiment",
        "experiment.variant",
        "experiment.metric",
        "experiment.evidence_state",
        "experiment.methodology",
        "experiment.analysis_health",
        "experiment.observation_window",
        "experiment.uncertainty"
      ],
      dimension_groundings: {
        "experiment.experiment": { kind: "stamped", source: "column:experiment_handle", anchor: "fact_time" },
        "experiment.variant": { kind: "stamped", source: "column:variant_key", anchor: "fact_time" },
        "experiment.metric": { kind: "stamped", source: "column:metric_id", anchor: "fact_time" },
        "experiment.evidence_state": { kind: "stamped", source: "column:evidence_state", anchor: "fact_time" },
        "experiment.methodology": { kind: "stamped", source: "column:methodology", anchor: "fact_time" },
        "experiment.analysis_health": { kind: "stamped", source: "column:analysis_health", anchor: "fact_time" },
        "experiment.observation_window": { kind: "stamped", source: "column:observation_window", anchor: "fact_time" },
        "experiment.uncertainty": { kind: "stamped", source: "column:uncertainty", anchor: "fact_time" }
      },
      metrics: ["experiment.absolute_effect"],
      query_families: ["table"],
      source_scope: "revturbine_influenced",
      fact_kind: "transaction",
      family: "behavioral",
      primary_key: ["id"],
      producer: "platform",
      materialization: { mode: "raw" },
      livemode_qualified: false,
      record_contract: {
        record_id: ["id"],
        source_namespace: "revturbine_control_plane",
        occurred_time_field: "observation_window_end",
        received_time_field: "created_at",
        dedup: "upsert_on_primary_key",
        revision: "immutable",
        late_arrival: "accepted",
        correlation_keys: ["query_hash", "evidence_snapshot_id", "experiment_handle"],
        policy_version_fields: ["estimator_version", "analysis_provider_contract_version", "summary_schema_version", "metric_catalog_version"],
        note: "A Postgres table (experiment_analysis_results), not a Tinybird datasource: rows are written once by the analysis engine and never revised, which is what makes the readout citable as evidence. data_watermark records how far the evidence had landed when the analysis ran."
      },
      keys: [
        { key: "tenant", path: "column:tenant_id", resolution: "source" },
        { key: "experiment", path: "column:experiment_handle", resolution: "source" },
        { key: "variant", path: "column:variant_key", resolution: "source" },
        { key: "metric", path: "column:metric_semantic_id", resolution: "source" },
        { key: "analysis_result", path: "column:id", resolution: "source" },
        { key: "environment", path: "-", resolution: "absent", note: "The concept declares environment in its grain, but experiment_analysis_results carries no environment column; the environment is implied by the experiment version the analysis ran against." },
        { key: "account", path: "-", resolution: "absent", note: "A result is an aggregate readout over an evidence snapshot, never a per-account row; there is no subject key to slice by." }
      ],
      measures: [
        { name: "absolute_effect", source: "column:result", unit: "polymorphic", temporal: "gauge", sign: "signed", aggregation_semantics: "non_additive", note: "Unit decided by column:metric_semantic_id \u2014 the effect size is expressed in the analysed metric unit. Held inside the result JSONB with its p-value and standard error; an estimate is never summed across experiments or metrics." }
      ],
      event_attributes: [
        { name: "evidence_state", path: "column:evidence_state" },
        { name: "methodology", path: "column:engine" },
        { name: "analysis_health", path: "column:analysis_health" },
        { name: "observation_window", path: "column:observation_window_start" },
        { name: "estimator", path: "column:estimator" },
        { name: "data_watermark", path: "column:data_watermark" }
      ],
      sources: [
        { kind: "ingested_event", ref: "experiment_assigned" },
        { kind: "control_plane_table", ref: "experiment_analysis_results" }
      ],
      oracle_family: { family: "read_through" },
      policy_dependencies: []
    },
    {
      id: "customer.timeline",
      version: 1,
      label: "Customer timeline",
      description: "Ordered fact events and event-count trends for a scoped population.",
      when_to_use: "What happened to an account or cohort, in order, or how its event volume changed over time.",
      grain: ["tenant", "environment", "account", "event"],
      analytical_units: ["account", "user"],
      primary_time_dimension: "time.occurred_at",
      historical_mode: "as_of_event",
      dimensions: ["time.occurred_at", "customer.account", "customer.user", "event.type", "commercial.plan", "targeting.segment"],
      dimension_groundings: {
        "event.type": { kind: "stamped", source: "column:event_name", anchor: "fact_time" },
        "customer.account": { kind: "stamped", source: "column:account_id", anchor: "fact_time" },
        "customer.user": { kind: "stamped", source: "column:user_id", anchor: "fact_time" },
        "commercial.plan": { kind: "config_join", source: "config:subscription_state", anchor: "current", catalog_status: "unavailable", blocker: "BL-0248/G13: a config join with no execution path. The clickstream has no plan column and no pipe joins account subscription state; the \xA75.6 configuration snapshots that would make the join possible do not exist, and the concept declares no config source for it.", note: "no plan column on the clickstream; joins account subscription state" },
        "targeting.segment": { kind: "stamped", source: "envelope:segment_ids", anchor: "fact_time", catalog_status: "unavailable", blocker: "BL-0248/G13: the R-11a envelope stamp has not reached a timeline split \u2014 events_clickstream carries no segment column and no customer-timeline pipe splits by one (SDK/ingest follow-up).", note: "R-11a stamp; lands with TASK-4" }
      },
      metrics: ["event.count"],
      query_families: ["timeline", "table", "timeseries"],
      source_scope: "revturbine_tracked",
      fact_kind: "transaction",
      family: "behavioral",
      primary_key: ["tenant_id", "environment_id", "event_ts", "event_name", "request_id"],
      producer: "platform",
      materialization: { mode: "raw" },
      livemode_qualified: false,
      record_contract: {
        record_id: ["tenant_id", "environment_id", "event_ts", "event_name", "request_id"],
        source_namespace: "sdk_clickstream",
        occurred_time_field: "event_ts",
        received_time_field: "ingested_at",
        dedup: "deduplicated_on_record_id",
        revision: "re_emit_higher_version",
        late_arrival: "accepted_within_retention",
        correlation_keys: ["request_id", "event_id", "decision_id"],
        note: "events_clickstream is a ReplacingMergeTree keyed on the sorting tuple with ingested_at as the version, so a re-emission supersedes rather than duplicates. Its `test` column marks simulated traffic, NOT Stripe live/test mode, so this fact is not livemode-qualified. Rows outside tenant_simulation expire after 365 days, which bounds late arrival."
      },
      keys: [
        { key: "tenant", path: "column:tenant_id", resolution: "source" },
        { key: "environment", path: "column:environment_id", resolution: "source" },
        { key: "user", path: "column:user_id", resolution: "source" },
        { key: "account", path: "column:account_id", resolution: "enriched", note: "Nullable on the wire; resolved through the identity map at ingest (R1)." },
        { key: "placement", path: "column:placement_id", resolution: "source" },
        { key: "payload", path: "column:payload_id", resolution: "source" },
        { key: "surface_slot", path: "column:surface_slot_id", resolution: "source" },
        { key: "experiment", path: "column:experiment_id", resolution: "source" },
        { key: "variant", path: "column:variant_key", resolution: "source" }
      ],
      measures: [
        { name: "events", source: "row_count", unit: "count", temporal: "flow", sign: "unsigned", aggregation_semantics: "additive", note: "The whole concept: a timeline has no measure other than the rows themselves." }
      ],
      event_attributes: [
        { name: "event_name", path: "column:event_name", note: "Open vocabulary: platform names plus customer track() names, which is why this concept carries no closed event list." },
        { name: "origin", path: "column:origin" },
        { name: "playbook_version", path: "column:playbook_version" },
        { name: "decision_id", path: "column:decision_id" },
        { name: "test", path: "column:test" }
      ],
      sources: [
        { kind: "datasource", ref: "events_clickstream" },
        { kind: "build", ref: "analytics_customer_timeline" }
      ],
      oracle_family: { family: "event_count" },
      policy_dependencies: []
    },
    {
      // Plan 230 TASK-1 (killer demo views): signup cohorts. Cohort
      // membership is DERIVED at read from each account's first observed
      // fact (R-2: never a stamped or seeded assignment), so a loaded raw
      // dataset materializes the whole grid with no cohort-specific seeding.
      id: "customer.cohort",
      version: 1,
      label: "Signup cohorts",
      description: "Accounts grouped by the period of their first observed fact, measured over cohort age: conversion, expansion, retention, and LTV. Billing facts carry no environment scope, so this concept is tenant-global.",
      when_to_use: "How successive signup generations convert, expand, retain, and accumulate value over their lifetime.",
      do_not_use_for: "Per-environment cuts; point-in-time revenue accounting (use revenue.movement); crediting placements (use revenue.attribution).",
      grain: ["tenant", "cohort", "period"],
      analytical_units: ["account"],
      primary_time_dimension: "time.occurred_at",
      historical_mode: "as_of_event",
      dimensions: ["time.occurred_at", "customer.cohort_period", "customer.cohort_age", "revenue.currency"],
      dimension_groundings: {
        "customer.cohort_period": { kind: "derived", source: "derived:first_observed_cohort", anchor: "cohort_entry", note: "min(occurred_at) per account across events_clickstream + events_billing, bucketed at the cohort grain (default month)." },
        "customer.cohort_age": { kind: "derived", source: "derived:first_observed_cohort", anchor: "cohort_entry", note: "whole periods between the cohort period and the measured period." },
        "revenue.currency": { kind: "stamped", source: "column:currency", anchor: "fact_time" }
      },
      metrics: ["cohort.account_count", "cohort.paid_conversion_rate", "cohort.expansion_rate", "cohort.retention_rate", "cohort.ltv_cents"],
      query_families: ["table", "breakdown"],
      source_scope: "total",
      fact_kind: "periodic_snapshot",
      family: "billing",
      primary_key: ["tenant_id", "cohort_period", "cohort_age"],
      producer: "platform",
      materialization: { mode: "logical" },
      livemode_qualified: false,
      record_contract: {
        record_id: ["tenant_id", "cohort_period", "cohort_age"],
        source_namespace: "revturbine_analytics_build",
        occurred_time_field: "cohort_period",
        dedup: "recomputed_at_query",
        revision: "recomputed_from_source",
        late_arrival: "accepted",
        correlation_keys: ["account_id"],
        note: "A LOGICAL snapshot: cohort_rollup recomputes every cell from events_clickstream and events_billing at query time, so nothing is stored and there is no received time. A late source row silently changes a published cell; R2 dataset generations are not implemented, so a query cannot pin one. events_billing carries no livemode column."
      },
      keys: [
        { key: "tenant", path: "column:tenant_id", resolution: "source" },
        { key: "account", path: "column:account_id", resolution: "enriched", note: "Cohort membership is per account: min(occurred_at) across events_clickstream and events_billing. The billing side is keyed by payer, so the account key there depends on the identity map." },
        { key: "payer", path: "column:customer_id", resolution: "source", note: "On the events_billing side only." },
        { key: "environment", path: "-", resolution: "absent", note: "Billing facts are tenant-global, so the cohort grid is too; per-environment cohort cuts are refused." }
      ],
      measures: [
        { name: "cohort_accounts", source: "column:account_count", unit: "count", temporal: "stock", sign: "unsigned", aggregation_semantics: "semi_additive", note: "Fixed cohort membership held at the cohort period: summed across cohorts at one age, never across ages (R3/R5)." },
        { name: "ltv_cents", source: "column:ltv_cents", unit: "currency_minor", temporal: "stock", sign: "signed", aggregation_semantics: "semi_additive", note: "Cumulative revenue to the measured period, so it is a stock at each cohort age and must not be summed across ages." }
      ],
      event_attributes: [],
      sources: [
        { kind: "datasource", ref: "events_clickstream" },
        { kind: "datasource", ref: "events_billing" },
        { kind: "ingested_event", ref: "payment_succeeded" },
        { kind: "ingested_event", ref: "subscription_started" },
        { kind: "ingested_event", ref: "trial_converted" },
        { kind: "ingested_event", ref: "subscription_expanded" },
        { kind: "ingested_event", ref: "subscription_renewed" },
        { kind: "build", ref: "cohort_rollup" }
      ],
      build: {
        kind: "query_time",
        ref: "cohort_rollup",
        inputs: ["events_clickstream", "events_billing"]
      },
      maturity: {
        status: "unavailable",
        blocker: "cohort_rollup implements no right-censoring: it stores and returns no horizon and no observed_through, so an immature cohort-age cell is indistinguishable from a complete one and R5 maturity filtering cannot be applied to the retention and conversion rates. Needs the declared cohort origin, horizon and maturity contracts of plan 252 TASK-47."
      },
      oracle_family: { family: "cohort" },
      policy_dependencies: [
        { kind: "lifecycle", stamped: false, blocker: "Cohort entry is derived at read from the first observed fact (plan 230 R-2) rather than assigned under a versioned lifecycle policy, and no cell carries a policy version, so a cohort readout cannot cite the policy set that produced it (R2/R9)." }
      ]
    },
    {
      // Plan 230 TASK-1: the six-stage platform monetization funnel
      // (overall-app-ux-structure §1.1.5). ONE stage definition (on the
      // monetization.funnel_stage dimension) consumed by both the dashboard
      // snapshot (funnel family) and the funnel-over-time view (timeseries
      // family) — REQ-4's single-definition rule enforced by construction.
      id: "monetization.funnel",
      version: 1,
      label: "Monetization funnel",
      description: "Distinct accounts per six-stage monetization funnel stage (registered \u2192 free \u2192 placement_reached \u2192 engaged \u2192 paid \u2192 expanded), derived from raw clickstream, presentation, and billing facts. Registered/free/paid/expanded are tenant-global (billing carries no environment); placement stages read the tracked environment.",
      when_to_use: "Where accounts drop out of the registered-to-expanded journey, as a snapshot or over time.",
      do_not_use_for: "Customer-authored funnels (use growth.funnel); per-placement performance (use placement.presentation).",
      grain: ["tenant", "stage", "day"],
      analytical_units: ["account"],
      primary_time_dimension: "time.occurred_at",
      historical_mode: "as_of_event",
      dimensions: ["time.occurred_at", "monetization.funnel_stage"],
      dimension_groundings: {
        "monetization.funnel_stage": { kind: "derived", source: "derived:monetization_funnel_stage", anchor: "fact_time", note: "catalog-owned stage predicates over raw facts; see the dimension's description for the six-stage order." }
      },
      metrics: ["monetization.funnel_accounts", "monetization.funnel_stage_conversion"],
      query_families: ["funnel", "timeseries"],
      source_scope: "total",
      fact_kind: "accumulating_snapshot",
      family: "billing",
      primary_key: ["tenant_id", "stage", "day"],
      producer: "platform",
      materialization: { mode: "logical" },
      livemode_qualified: false,
      record_contract: {
        record_id: ["tenant_id", "stage", "day"],
        source_namespace: "revturbine_analytics_build",
        occurred_time_field: "day",
        dedup: "recomputed_at_query",
        revision: "recomputed_from_source",
        late_arrival: "accepted",
        correlation_keys: ["account_id"],
        note: "A LOGICAL snapshot: monetization_funnel recomputes the reached-by flags per account from raw facts at query time, so nothing is stored and there is no received time. events_billing carries no Stripe livemode column, so the billing-derived stages are not livemode-qualified."
      },
      keys: [
        { key: "tenant", path: "column:tenant_id", resolution: "source" },
        { key: "account", path: "column:account_id", resolution: "enriched", note: "The stage flags are per account (R10). The billing-derived stages read events_billing, which carries only the payer, so they depend on the identity map." },
        { key: "environment", path: "-", resolution: "absent", note: "The registered, free, paid and expanded stages are tenant-global because events_billing has no environment_id; only the placement stages read the tracked environment. That mixture is why the stored grain is [tenant, stage, day]." }
      ],
      measures: [
        { name: "funnel_accounts", source: "column:accounts", unit: "count", temporal: "stock", sign: "unsigned", aggregation_semantics: "semi_additive", note: "Distinct accounts that EVER reached the stage by the window end (R10), so stage-to-stage ratios are ratios of reached counts, not a followed-population conversion. A reached count is held at one date and never summed across days or stages." }
      ],
      event_attributes: [],
      sources: [
        { kind: "datasource", ref: "events_clickstream" },
        { kind: "datasource", ref: "placement_presentations" },
        { kind: "datasource", ref: "events_billing" },
        { kind: "ingested_event", ref: "payment_succeeded" },
        { kind: "ingested_event", ref: "subscription_started" },
        { kind: "ingested_event", ref: "subscription_expanded" },
        { kind: "ingested_event", ref: "trial_converted" },
        { kind: "build", ref: "monetization_funnel" }
      ],
      build: {
        kind: "query_time",
        ref: "monetization_funnel",
        inputs: ["events_clickstream", "placement_presentations", "events_billing"]
      },
      maturity: {
        status: "unavailable",
        blocker: "The stage flags carry no horizon and no observed_through, so an account that could still reach a later stage is counted as not having reached it and immature rows cannot be excluded from the stage ratios (R5). Needs the declared maturity contracts of plan 252 TASK-47."
      },
      oracle_family: { family: "funnel" },
      policy_dependencies: [
        { kind: "lifecycle", stamped: false, blocker: "The six stage predicates are catalog-owned over raw facts rather than read from a versioned R10 account-state snapshot, and no cell carries a lifecycle policy version." },
        { kind: "engagement", stamped: false, blocker: "The engaged stage threshold is a catalog-owned predicate; R10 makes engagement an independently versioned policy, and nothing stamps its version." }
      ]
    },
    {
      id: "optimization.opportunity",
      version: 1,
      label: "Optimization opportunities",
      description: "Current persisted detector candidates with their original machine-readable evidence.",
      when_to_use: "Review recommendations already produced and persisted by the optimization pipeline.",
      do_not_use_for: "Recomputing detectors or treating a candidate as an applied optimization result.",
      grain: ["tenant", "opportunity"],
      analytical_units: ["account"],
      primary_time_dimension: "time.occurred_at",
      historical_mode: "current",
      dimensions: ["time.occurred_at", "opportunity.type", "optimization.detector"],
      dimension_groundings: {
        "opportunity.type": { kind: "stamped", source: "column:opportunity_type", anchor: "current" },
        "optimization.detector": { kind: "stamped", source: "column:detector_id", anchor: "current" }
      },
      metrics: ["opportunity.candidate_count"],
      query_families: ["table"],
      source_scope: "revturbine_tracked",
      fact_kind: "accumulating_snapshot",
      family: "behavioral",
      primary_key: ["id"],
      producer: "platform",
      materialization: { mode: "raw" },
      livemode_qualified: false,
      record_contract: {
        record_id: ["id"],
        source_namespace: "revturbine_control_plane",
        occurred_time_field: "created_at",
        received_time_field: "updated_at",
        dedup: "upsert_on_primary_key",
        revision: "in_place_update",
        late_arrival: "accepted",
        correlation_keys: ["resource_id", "experiment_id"],
        policy_version_fields: ["detector_version"],
        note: "The catalog datasource name optimization_opportunities resolves to the Postgres table optimization_suggestions in revturbine-web; the names diverge. Rows are updated in place (updated_at, is_dismissed), which is why historical_mode is `current`: an earlier state of a candidate is not recoverable."
      },
      keys: [
        { key: "tenant", path: "column:tenant_id", resolution: "source" },
        { key: "opportunity", path: "column:id", resolution: "source" },
        { key: "experiment", path: "column:experiment_id", resolution: "source" },
        { key: "account", path: "-", resolution: "absent", note: "A candidate is scoped to a configuration resource (resource_type / resource_id), not to an account; there is no account key to slice by even though the declared analytical unit is the account." },
        { key: "environment", path: "-", resolution: "absent", note: "optimization_suggestions is tenant-scoped with no environment column." }
      ],
      measures: [
        { name: "candidates", source: "row_count", unit: "count", temporal: "stock", sign: "unsigned", aggregation_semantics: "semi_additive", note: "Current undismissed candidates: a stock read at one instant, never summed across instants." },
        { name: "estimated_impact", source: "column:estimated_impact", unit: "polymorphic", temporal: "gauge", sign: "signed", aggregation_semantics: "non_additive", note: "Unit decided by column:opportunity_type \u2014 a detector-supplied estimate, not a measured amount, and never additive across detectors." },
        { name: "confidence", source: "column:confidence", unit: "ratio", temporal: "gauge", sign: "unsigned", aggregation_semantics: "non_additive" }
      ],
      event_attributes: [
        { name: "opportunity_type", path: "column:opportunity_type" },
        { name: "detector_id", path: "column:detector_id" },
        { name: "severity", path: "column:severity" },
        { name: "is_dismissed", path: "column:is_dismissed" },
        { name: "resource_type", path: "column:resource_type" }
      ],
      sources: [
        { kind: "control_plane_table", ref: "optimization_opportunities" }
      ],
      build: {
        kind: "worker",
        ref: "optimization detector pipeline",
        inputs: ["optimization_opportunities"]
      },
      maturity: {
        status: "unavailable",
        blocker: "Candidates carry no horizon and no observed_through, and rows are updated in place, so a candidate outcome cannot be followed forward and R5 maturity does not apply. Needs the declared maturity contracts of plan 252 TASK-47."
      },
      oracle_family: { family: "read_through" },
      policy_dependencies: []
    }
  ]
};
function createFixtureAnalyticsCatalog() {
  return createInMemoryAnalyticsCatalog(FIXTURE_ANALYTICS_CATALOG);
}

// scaffold/src/analytics/compile/defaults.ts
var FAMILY_RENDER_COMPATIBILITY = {
  scalar: ["metric"],
  timeseries: ["cartesian"],
  breakdown: ["cartesian", "table"],
  funnel: ["funnel", "table", "cartesian"],
  table: ["table", "recommendations"],
  timeline: ["timeline", "table"]
};
function timeDimensionFor(query, catalog) {
  return query.time?.dimension ?? catalog.getConcept(query.concept)?.primary_time_dimension ?? "time.occurred_at";
}
function defaultRenderForQuery(query, catalog) {
  const concept = catalog.getConcept(query.concept);
  switch (query.family) {
    case "scalar":
      return {
        type: "metric",
        value: query.metrics[0],
        comparison: query.metrics[1],
        format: catalog.getMetric(query.metrics[0])?.format
      };
    case "timeseries":
      return {
        type: "cartesian",
        mark: "line",
        encoding: {
          x: timeDimensionFor(query, catalog),
          y: query.metrics.length === 1 ? query.metrics[0] : query.metrics,
          color: query.group_by?.[0]
        }
      };
    case "breakdown": {
      const grouping = query.group_by ?? [];
      const highCardinality = grouping.length > 1 || grouping.some((id) => catalog.getDimension(id)?.cardinality === "high");
      if (grouping.length === 0 || highCardinality) {
        return { type: "table", columns: [...grouping, ...query.metrics] };
      }
      return {
        type: "cartesian",
        mark: "bar",
        encoding: {
          x: grouping[0],
          y: query.metrics.length === 1 ? query.metrics[0] : query.metrics
        }
      };
    }
    case "funnel":
      return { type: "funnel", stages: query.metrics, split_by: query.group_by?.[0] };
    case "table":
      return { type: "table", columns: [...query.group_by ?? [], ...query.metrics] };
    case "timeline": {
      const eventType = query.group_by?.[0] ?? concept?.dimensions.find((id) => catalog.getDimension(id)?.type === "enum") ?? timeDimensionFor(query, catalog);
      return {
        type: "timeline",
        timestamp: timeDimensionFor(query, catalog),
        event_type: eventType
      };
    }
  }
}

// scaffold/src/analytics/validation/semantic.ts
var ANALYTICS_VALIDATION_CODES = [
  "UNKNOWN_CONCEPT",
  "UNKNOWN_DIMENSION",
  "UNKNOWN_METRIC",
  "METRIC_NOT_IN_CONCEPT",
  "DIMENSION_NOT_IN_CONCEPT",
  "FAMILY_NOT_SUPPORTED",
  "FUNNEL_REQUIRES_STAGES",
  "RENDERER_INCOMPATIBLE_WITH_QUERY",
  "RENDER_FIELD_NOT_IN_QUERY",
  "OPERATOR_NOT_SUPPORTED",
  "DIMENSION_NOT_GROUPABLE",
  "ANALYTICAL_UNIT_NOT_SUPPORTED",
  "TIME_DIMENSION_INVALID",
  "ORDER_FIELD_NOT_IN_QUERY",
  "FILTER_REF_UNKNOWN",
  "APPLIES_TO_UNKNOWN_BLOCK",
  "DUPLICATE_ELEMENT_ID",
  "LAYOUT_UNKNOWN_BLOCK",
  "LAYOUT_MISSING_BLOCK",
  "TEMPLATE_LOCKED_PROPERTY_CHANGED",
  "COMPARE_TARGET_MISSING",
  "COMPARE_TARGET_MISMATCH"
];
var issue = (code, path, message, extra) => ({ code, path, message, ...extra });
function queryFields(query) {
  const fields = /* @__PURE__ */ new Set([...query.metrics, ...query.group_by ?? []]);
  if (query.time) fields.add(query.time.dimension);
  return fields;
}
var deprecationWarning = (kind, id, replacedBy) => ({
  code: `DEPRECATED_${kind}`,
  message: `${kind[0]}${kind.slice(1).toLowerCase()} ${id} is deprecated${replacedBy ? `; use ${replacedBy}` : ""}.`
});
function analyticsDeprecationWarnings(view, catalog) {
  const references = {
    concepts: new Set(view.blocks.map((block) => block.query.concept)),
    dimensions: new Set(view.filters.map((filter) => filter.dimension)),
    metrics: /* @__PURE__ */ new Set()
  };
  for (const block of view.blocks) {
    block.query.metrics.forEach((id) => references.metrics.add(id));
    block.query.group_by?.forEach((id) => references.dimensions.add(id));
    if (block.query.time) references.dimensions.add(block.query.time.dimension);
    block.query.fixed_filters?.forEach((filter) => references.dimensions.add(filter.dimension));
  }
  const warnings = [];
  for (const id of [...references.concepts].sort()) {
    const deprecation = catalog.getConcept(id)?.deprecation;
    if (deprecation?.deprecated) warnings.push(deprecationWarning("CONCEPT", id, deprecation.replaced_by));
  }
  for (const id of [...references.dimensions].sort()) {
    const deprecation = catalog.getDimension(id)?.deprecation;
    if (deprecation?.deprecated) warnings.push(deprecationWarning("DIMENSION", id, deprecation.replaced_by));
  }
  for (const id of [...references.metrics].sort()) {
    const deprecation = catalog.getMetric(id)?.deprecation;
    if (deprecation?.deprecated) warnings.push(deprecationWarning("METRIC", id, deprecation.replaced_by));
  }
  return warnings;
}
function validateAnalyticsQuery(query, catalog, basePath) {
  const issues = [];
  const concept = catalog.getConcept(query.concept);
  if (!concept) {
    issues.push(issue(
      "UNKNOWN_CONCEPT",
      `${basePath}/concept`,
      `Concept ${query.concept} is not in the catalog.`,
      {
        actual: query.concept,
        allowed: catalog.listConcepts().map((c) => c.id)
      }
    ));
    return issues;
  }
  if (!concept.query_families.includes(query.family)) {
    issues.push(issue(
      "FAMILY_NOT_SUPPORTED",
      `${basePath}/family`,
      `Concept ${concept.id} does not support the ${query.family} family.`,
      {
        actual: query.family,
        allowed: concept.query_families,
        suggested_patch: [{ op: "replace", path: `${basePath}/family`, value: concept.query_families[0] }]
      }
    ));
  }
  query.metrics.forEach((metric, i) => {
    if (!catalog.getMetric(metric)) {
      issues.push(issue(
        "UNKNOWN_METRIC",
        `${basePath}/metrics/${i}`,
        `Metric ${metric} is not in the catalog.`,
        {
          actual: metric,
          suggested_patch: [{ op: "remove", path: `${basePath}/metrics/${i}` }]
        }
      ));
    } else if (!concept.metrics.includes(metric)) {
      issues.push(issue(
        "METRIC_NOT_IN_CONCEPT",
        `${basePath}/metrics/${i}`,
        `Metric ${metric} is not available on concept ${concept.id}.`,
        {
          actual: metric,
          allowed: concept.metrics,
          suggested_patch: [{ op: "remove", path: `${basePath}/metrics/${i}` }]
        }
      ));
    }
  });
  (query.group_by ?? []).forEach((dim, i) => {
    const dimension = catalog.getDimension(dim);
    if (!dimension) {
      issues.push(issue(
        "UNKNOWN_DIMENSION",
        `${basePath}/group_by/${i}`,
        `Dimension ${dim} is not in the catalog.`,
        { actual: dim }
      ));
    } else if (!concept.dimensions.includes(dim)) {
      issues.push(issue(
        "DIMENSION_NOT_IN_CONCEPT",
        `${basePath}/group_by/${i}`,
        `Dimension ${dim} is not available on concept ${concept.id}.`,
        {
          actual: dim,
          allowed: concept.dimensions
        }
      ));
    } else if (!dimension.capabilities.includes("group")) {
      issues.push(issue(
        "DIMENSION_NOT_GROUPABLE",
        `${basePath}/group_by/${i}`,
        `Dimension ${dim} does not support grouping.`,
        { actual: dim }
      ));
    }
  });
  if (query.time && query.time.dimension !== concept.primary_time_dimension) {
    issues.push(issue(
      "TIME_DIMENSION_INVALID",
      `${basePath}/time/dimension`,
      `Concept ${concept.id} buckets time by ${concept.primary_time_dimension}.`,
      {
        actual: query.time.dimension,
        allowed: [concept.primary_time_dimension],
        suggested_patch: [{ op: "replace", path: `${basePath}/time/dimension`, value: concept.primary_time_dimension }]
      }
    ));
  }
  if (query.family === "funnel" && query.metrics.length < 2) {
    issues.push(issue(
      "FUNNEL_REQUIRES_STAGES",
      `${basePath}/metrics`,
      "A funnel query needs at least two ordered stage metrics.",
      { actual: query.metrics.length }
    ));
  }
  const fields = queryFields(query);
  (query.order_by ?? []).forEach((order, i) => {
    if (!fields.has(order.field)) {
      issues.push(issue(
        "ORDER_FIELD_NOT_IN_QUERY",
        `${basePath}/order_by/${i}/field`,
        `Ordering field ${order.field} is not produced by this query.`,
        {
          actual: order.field,
          allowed: [...fields].sort(),
          suggested_patch: [{ op: "remove", path: `${basePath}/order_by/${i}` }]
        }
      ));
    }
  });
  (query.fixed_filters ?? []).forEach((filter, i) => {
    const dimension = catalog.getDimension(filter.dimension);
    if (!dimension) {
      issues.push(issue(
        "UNKNOWN_DIMENSION",
        `${basePath}/fixed_filters/${i}/dimension`,
        `Dimension ${filter.dimension} is not in the catalog.`,
        { actual: filter.dimension }
      ));
    } else if (!dimension.operators.includes(filter.operator)) {
      issues.push(issue(
        "OPERATOR_NOT_SUPPORTED",
        `${basePath}/fixed_filters/${i}/operator`,
        `Dimension ${filter.dimension} does not support the ${filter.operator} operator.`,
        {
          actual: filter.operator,
          allowed: dimension.operators,
          suggested_patch: [{ op: "replace", path: `${basePath}/fixed_filters/${i}/operator`, value: dimension.operators[0] }]
        }
      ));
    }
  });
  issues.push(...validateComparison(query, concept, catalog, basePath));
  return issues;
}
var COMPARE_TARGET_FIELDS = {
  segment: "compare_segment",
  variant: "compare_experiment",
  scope: "compare_scope",
  intervention: "compare_anchor"
};
function validateComparison(query, concept, catalog, basePath) {
  const issues = [];
  const mode = query.compare;
  const required = mode && mode in COMPARE_TARGET_FIELDS ? COMPARE_TARGET_FIELDS[mode] : void 0;
  if (required && query[required] === void 0) {
    issues.push(issue(
      "COMPARE_TARGET_MISSING",
      `${basePath}/compare`,
      `A ${mode} comparison requires ${required}.`,
      { actual: mode }
    ));
  }
  for (const field2 of Object.values(COMPARE_TARGET_FIELDS)) {
    if (field2 !== required && query[field2] !== void 0) {
      issues.push(issue(
        "COMPARE_TARGET_MISMATCH",
        `${basePath}/${field2}`,
        `${field2} is only meaningful when compare is ${Object.entries(COMPARE_TARGET_FIELDS).find(([, f]) => f === field2)[0]}.`,
        {
          actual: mode ?? "none",
          suggested_patch: [{ op: "remove", path: `${basePath}/${field2}` }]
        }
      ));
    }
  }
  if (query.compare_segment) {
    const { dimension } = query.compare_segment;
    if (!catalog.getDimension(dimension)) {
      issues.push(issue(
        "UNKNOWN_DIMENSION",
        `${basePath}/compare_segment/dimension`,
        `Dimension ${dimension} is not in the catalog.`,
        { actual: dimension }
      ));
    } else if (!concept.dimensions.includes(dimension)) {
      issues.push(issue(
        "DIMENSION_NOT_IN_CONCEPT",
        `${basePath}/compare_segment/dimension`,
        `Dimension ${dimension} is not available on concept ${concept.id}.`,
        {
          actual: dimension,
          allowed: concept.dimensions
        }
      ));
    }
  }
  return issues;
}
function validateRender(render, query, catalog, basePath) {
  const issues = [];
  const allowedTypes = FAMILY_RENDER_COMPATIBILITY[query.family];
  if (!allowedTypes.includes(render.type)) {
    issues.push(issue(
      "RENDERER_INCOMPATIBLE_WITH_QUERY",
      basePath,
      `A ${render.type} renderer cannot present a ${query.family} query.`,
      {
        actual: render.type,
        allowed: allowedTypes,
        suggested_patch: [{ op: "replace", path: basePath, value: defaultRenderForQuery(query, catalog) }]
      }
    ));
    return issues;
  }
  const concept = catalog.getConcept(query.concept);
  if (!concept) return issues;
  const fields = queryFields(query);
  const requireField = (field2, path) => {
    if (!fields.has(field2)) {
      issues.push(issue(
        "RENDER_FIELD_NOT_IN_QUERY",
        path,
        `Field ${field2} is not produced by this block's query.`,
        {
          actual: field2,
          allowed: [...fields].sort()
        }
      ));
    }
  };
  const requireConceptDimension = (field2, path) => {
    if (!catalog.getDimension(field2)) {
      issues.push(issue(
        "UNKNOWN_DIMENSION",
        path,
        `Dimension ${field2} is not in the catalog.`,
        { actual: field2 }
      ));
    } else if (!concept.dimensions.includes(field2)) {
      issues.push(issue(
        "DIMENSION_NOT_IN_CONCEPT",
        path,
        `Dimension ${field2} is not available on concept ${concept.id}.`,
        {
          actual: field2,
          allowed: concept.dimensions
        }
      ));
    }
  };
  switch (render.type) {
    case "metric":
      requireField(render.value, `${basePath}/value`);
      if (render.comparison) requireField(render.comparison, `${basePath}/comparison`);
      break;
    case "cartesian": {
      requireField(render.encoding.x, `${basePath}/encoding/x`);
      if (Array.isArray(render.encoding.y)) {
        render.encoding.y.forEach((y, i) => requireField(y, `${basePath}/encoding/y/${i}`));
      } else {
        requireField(render.encoding.y, `${basePath}/encoding/y`);
      }
      if (render.encoding.color) requireConceptDimension(render.encoding.color, `${basePath}/encoding/color`);
      if (render.encoding.facet) requireConceptDimension(render.encoding.facet, `${basePath}/encoding/facet`);
      break;
    }
    case "funnel":
      render.stages.forEach((stage, i) => requireField(stage, `${basePath}/stages/${i}`));
      if (render.split_by) requireConceptDimension(render.split_by, `${basePath}/split_by`);
      break;
    case "table":
      render.columns.forEach((column, i) => requireField(column, `${basePath}/columns/${i}`));
      break;
    case "timeline":
      requireConceptDimension(render.timestamp, `${basePath}/timestamp`);
      requireConceptDimension(render.event_type, `${basePath}/event_type`);
      break;
    case "recommendations":
      break;
  }
  return issues;
}
function validateFilters(view, catalog) {
  const issues = [];
  const blockIds = new Set(view.blocks.map((b) => b.id));
  view.filters.forEach((filter, i) => {
    const dimension = catalog.getDimension(filter.dimension);
    if (!dimension) {
      issues.push(issue(
        "UNKNOWN_DIMENSION",
        `/filters/${i}/dimension`,
        `Dimension ${filter.dimension} is not in the catalog.`,
        { actual: filter.dimension }
      ));
      return;
    }
    filter.operators.forEach((op, j) => {
      if (!dimension.operators.includes(op)) {
        issues.push(issue(
          "OPERATOR_NOT_SUPPORTED",
          `/filters/${i}/operators/${j}`,
          `Dimension ${filter.dimension} does not support the ${op} operator.`,
          {
            actual: op,
            allowed: dimension.operators,
            suggested_patch: [{ op: "replace", path: `/filters/${i}/operators`, value: dimension.operators }]
          }
        ));
      }
    });
    if (filter.applies_to !== "all") {
      filter.applies_to.forEach((blockId, j) => {
        if (!blockIds.has(blockId)) {
          issues.push(issue(
            "APPLIES_TO_UNKNOWN_BLOCK",
            `/filters/${i}/applies_to/${j}`,
            `Filter ${filter.id} applies to unknown block ${blockId}.`,
            {
              actual: blockId,
              allowed: [...blockIds].sort()
            }
          ));
        }
      });
    }
    if (filter.depends_on !== void 0) {
      const filterIds = new Set(view.filters.map((f) => f.id));
      if (!filterIds.has(filter.depends_on) || filter.depends_on === filter.id) {
        issues.push(issue(
          "FILTER_REF_UNKNOWN",
          `/filters/${i}/depends_on`,
          `Filter ${filter.id} depends on ${filter.depends_on}, which is not another filter in this view.`,
          {
            actual: filter.depends_on,
            allowed: [...filterIds].filter((id) => id !== filter.id).sort()
          }
        ));
      }
    }
  });
  return issues;
}
function validateLayout(view) {
  const issues = [];
  const blockIds = new Set(view.blocks.map((b) => b.id));
  const laidOut = /* @__PURE__ */ new Set();
  view.layout.items.forEach((item, i) => {
    laidOut.add(item.block_id);
    if (!blockIds.has(item.block_id)) {
      issues.push(issue(
        "LAYOUT_UNKNOWN_BLOCK",
        `/layout/items/${i}/block_id`,
        `Layout places unknown block ${item.block_id}.`,
        {
          actual: item.block_id,
          allowed: [...blockIds].sort(),
          suggested_patch: [{ op: "remove", path: `/layout/items/${i}` }]
        }
      ));
    }
  });
  view.blocks.forEach((block, i) => {
    if (!laidOut.has(block.id)) {
      issues.push(issue(
        "LAYOUT_MISSING_BLOCK",
        `/blocks/${i}`,
        `Block ${block.id} has no layout position.`,
        { actual: block.id }
      ));
    }
  });
  return issues;
}
function validateUniqueIds(view) {
  const issues = [];
  const seen = /* @__PURE__ */ new Map();
  const check = (id, path, kind) => {
    const key = `${kind}:${id}`;
    if (seen.has(key)) {
      issues.push(issue("DUPLICATE_ELEMENT_ID", path, `Duplicate ${kind} id ${id}.`, { actual: id }));
    }
    seen.set(key, path);
  };
  view.blocks.forEach((b, i) => check(b.id, `/blocks/${i}/id`, "block"));
  view.filters.forEach((f, i) => check(f.id, `/filters/${i}/id`, "filter"));
  (view.handoffs ?? []).forEach((h, i) => check(h.id, `/handoffs/${i}/id`, "handoff"));
  return issues;
}
function validateTemplateLocks(view, base2, policy) {
  const issues = [];
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const locked = (capability, path, changed) => {
    if (changed) {
      issues.push(issue(
        "TEMPLATE_LOCKED_PROPERTY_CHANGED",
        path,
        `The base template locks ${capability}.`,
        { actual: capability }
      ));
    }
  };
  const baseBlocks = new Map(base2.blocks.map((b) => [b.id, b]));
  for (const capability of policy.deny) {
    switch (capability) {
      case "title":
        locked(capability, "/title", !same(view.title, base2.title));
        break;
      case "layout":
        locked(capability, "/layout", !same(view.layout, base2.layout));
        break;
      case "filter_defaults":
        locked(capability, "/filters", !same(
          view.filters.map((f) => ({ id: f.id, default_value: f.default_value })),
          base2.filters.map((f) => ({ id: f.id, default_value: f.default_value }))
        ));
        break;
      case "metric_selection":
        locked(capability, "/blocks", !same(
          view.blocks.map((b) => ({ id: b.id, metrics: b.query.metrics })),
          base2.blocks.map((b) => ({ id: b.id, metrics: b.query.metrics }))
        ));
        break;
      case "grouping":
        locked(capability, "/blocks", !same(
          view.blocks.map((b) => ({ id: b.id, group_by: b.query.group_by ?? [] })),
          base2.blocks.map((b) => ({ id: b.id, group_by: b.query.group_by ?? [] }))
        ));
        break;
      case "compatible_renderer":
        locked(capability, "/blocks", !same(
          view.blocks.map((b) => ({ id: b.id, render: b.render })),
          base2.blocks.map((b) => ({ id: b.id, render: b.render }))
        ));
        break;
      case "sort":
        locked(capability, "/blocks", !same(
          view.blocks.map((b) => ({ id: b.id, order_by: b.query.order_by ?? [] })),
          base2.blocks.map((b) => ({ id: b.id, order_by: b.query.order_by ?? [] }))
        ));
        break;
      case "limit":
        locked(capability, "/blocks", !same(
          view.blocks.map((b) => ({ id: b.id, limit: b.query.limit ?? null })),
          base2.blocks.map((b) => ({ id: b.id, limit: b.query.limit ?? null }))
        ));
        break;
      case "block_visibility":
        locked(capability, "/blocks", !same(
          view.blocks.map((b) => b.id),
          base2.blocks.map((b) => b.id)
        ));
        break;
      case "handoff_target":
        locked(capability, "/handoffs", !same(view.handoffs ?? [], base2.handoffs ?? []));
        break;
      // source_scope, hidden_scope, and raw_expression are structurally
      // unrepresentable in a view document — nothing to diff.
      default:
        break;
    }
  }
  return issues;
}
function validateAnalyticsView(view, catalog, options = {}) {
  const errors = [];
  const warnings = analyticsDeprecationWarnings(view, catalog);
  errors.push(...validateUniqueIds(view));
  errors.push(...validateFilters(view, catalog));
  errors.push(...validateLayout(view));
  view.blocks.forEach((block, i) => {
    const basePath = `/blocks/${i}`;
    const concept = catalog.getConcept(block.query.concept);
    if (concept && !concept.analytical_units.includes(view.analytical_unit)) {
      errors.push(issue(
        "ANALYTICAL_UNIT_NOT_SUPPORTED",
        "/analytical_unit",
        `Concept ${concept.id} does not support the ${view.analytical_unit} analytical unit.`,
        {
          actual: view.analytical_unit,
          allowed: concept.analytical_units,
          suggested_patch: [{ op: "replace", path: "/analytical_unit", value: concept.analytical_units[0] }]
        }
      ));
    }
    errors.push(...validateAnalyticsQuery(block.query, catalog, `${basePath}/query`));
    if (errors.every((e) => !e.path.startsWith(`${basePath}/query`))) {
      errors.push(...validateRender(block.render, block.query, catalog, `${basePath}/render`));
    }
  });
  if (options.baseTemplate) {
    errors.push(...validateTemplateLocks(view, options.baseTemplate.view, options.baseTemplate.policy));
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    catalog_version: catalog.version
  };
}

// scaffold/src/analytics/compile/compile.ts
var RECOMMENDED_FILTER_DIMENSIONS = [
  "commercial.plan",
  "commercial.billing_period",
  "lifecycle.state",
  "targeting.segment",
  "release.playbook_version",
  "experiment.variant"
];
var DEFAULT_CUSTOMIZATION_POLICY = {
  allow: [
    "title",
    "filter_defaults",
    "metric_selection",
    "grouping",
    "compatible_renderer",
    "sort",
    "limit",
    "block_visibility",
    "layout"
  ],
  deny: ["source_scope", "handoff_target", "hidden_scope", "raw_expression"]
};
var LAYOUT_FOOTPRINT = {
  metric: { w: 3, h: 2 },
  cartesian: { w: 6, h: 5 },
  funnel: { w: 6, h: 5 },
  table: { w: 12, h: 6 },
  timeline: { w: 12, h: 6 },
  recommendations: { w: 6, h: 5 }
};
var slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "view";
function uniqueId(base2, used) {
  let candidate = base2;
  let n = 2;
  while (used.has(candidate)) candidate = `${base2}-${n++}`;
  used.add(candidate);
  return candidate;
}
function compileAnalyticsDraft(draft, catalog, options = {}) {
  const resolutions = [];
  const resolve = (path, rule, value) => {
    resolutions.push(value === void 0 ? { path, rule } : { path, rule, value });
  };
  const errors = [];
  const blockIds = /* @__PURE__ */ new Set();
  const queries = draft.blocks.map((block, i) => {
    let time = block.time;
    if (!time && block.family === "timeseries") {
      const primary = catalog.getConcept(block.concept)?.primary_time_dimension;
      if (primary) {
        time = { dimension: primary, grain: "day" };
        resolve(`/blocks/${i}/time`, "time.auto.day_grain", time);
      }
    }
    const query = {
      concept: block.concept,
      family: block.family,
      metrics: block.metrics,
      group_by: block.group_by,
      time,
      filters_from: block.filters_from,
      fixed_filters: block.fixed_filters,
      compare: block.compare,
      compare_delta: block.compare_delta,
      compare_segment: block.compare_segment,
      compare_experiment: block.compare_experiment,
      compare_scope: block.compare_scope,
      compare_anchor: block.compare_anchor,
      order_by: block.order_by,
      limit: block.limit
    };
    errors.push(...validateAnalyticsQuery(query, catalog, `/blocks/${i}`));
    return query;
  });
  const visibility = draft.visibility ?? "private";
  if (draft.visibility === void 0) resolve("/visibility", "visibility.default_private", visibility);
  if (errors.length > 0) {
    return {
      visibility,
      resolutions,
      validation: { valid: false, errors, warnings: [], catalog_version: catalog.version }
    };
  }
  const blocks = draft.blocks.map((block, i) => {
    let id = block.id;
    if (!id) {
      id = uniqueId(`block-${i + 1}`, blockIds);
      resolve(`/blocks/${i}/id`, "block.id.minted", id);
    } else {
      blockIds.add(id);
    }
    let render;
    if (!block.render || block.render === "auto") {
      render = defaultRenderForQuery(queries[i], catalog);
      resolve(`/blocks/${i}/render`, `render.auto.${queries[i].family}`, render);
    } else {
      render = block.render;
    }
    return { id, title: block.title, query: queries[i], render };
  });
  const filterIds = /* @__PURE__ */ new Set();
  let filters;
  if (draft.filters === "recommended" || draft.filters === void 0) {
    const concepts = draft.blocks.map((b) => catalog.getConcept(b.concept));
    const timeDimension = concepts[0].primary_time_dimension;
    filters = [{
      id: uniqueId("period", filterIds),
      dimension: timeDimension,
      control: "date_range",
      operators: ["between"],
      default_value: { preset: "30d", compare: "previous_period" },
      required: true,
      pinned: true,
      applies_to: "all"
    }];
    for (const dimensionId of RECOMMENDED_FILTER_DIMENSIONS) {
      if (!concepts.every((c) => c.dimensions.includes(dimensionId))) continue;
      const dimension = catalog.getDimension(dimensionId);
      filters.push({
        id: uniqueId(dimensionId.split(".").pop(), filterIds),
        dimension: dimensionId,
        control: dimension.control,
        operators: dimension.operators,
        required: false,
        pinned: dimensionId === "commercial.plan",
        applies_to: "all"
      });
    }
    resolve("/filters", "filters.recommended.standard_bar", filters.map((f) => f.id));
  } else {
    filters = draft.filters.map((filter, i) => {
      const dimension = catalog.getDimension(filter.dimension);
      let id = filter.id;
      if (!id) {
        id = uniqueId(filter.dimension.split(".").pop(), filterIds);
        resolve(`/filters/${i}/id`, "filter.id.minted", id);
      } else {
        filterIds.add(id);
      }
      let control = filter.control;
      if (!control) {
        control = dimension?.control ?? "multi_select";
        resolve(`/filters/${i}/control`, "filter.control.dimension_default", control);
      }
      let operators = filter.operators;
      if (!operators) {
        operators = dimension?.operators ?? ["in"];
        resolve(`/filters/${i}/operators`, "filter.operators.dimension_default", operators);
      }
      return {
        id,
        dimension: filter.dimension,
        control,
        label: filter.label,
        operators,
        default_value: filter.default_value,
        required: filter.required ?? false,
        pinned: filter.pinned ?? false,
        applies_to: filter.applies_to ?? "all"
      };
    });
  }
  let layout;
  if (draft.layout === "auto" || draft.layout === void 0) {
    const items = [];
    let x = 0;
    let y = 0;
    let rowHeight = 0;
    for (const block of blocks) {
      const { w, h } = LAYOUT_FOOTPRINT[block.render.type];
      if (x + w > 12) {
        y += rowHeight;
        x = 0;
        rowHeight = 0;
      }
      items.push({ block_id: block.id, x, y, w, h });
      x += w;
      rowHeight = Math.max(rowHeight, h);
    }
    layout = { type: "grid", columns: 12, items };
    resolve("/layout", "layout.auto.packed", layout);
  } else {
    layout = draft.layout;
  }
  let handoffs;
  if (draft.handoffs === "recommended") {
    handoffs = void 0;
    resolve("/handoffs", "handoffs.recommended.none");
  } else if (draft.handoffs) {
    const handoffIds = /* @__PURE__ */ new Set();
    handoffs = draft.handoffs.map((handoff, i) => {
      let id = handoff.id;
      if (!id) {
        id = uniqueId(handoff.target.split(".").pop(), handoffIds);
        resolve(`/handoffs/${i}/id`, "handoff.id.minted", id);
      } else {
        handoffIds.add(id);
      }
      let label = handoff.label;
      if (!label) {
        label = { value: handoff.target };
        resolve(`/handoffs/${i}/label`, "handoff.label.from_target", label);
      }
      return { id, label, target: handoff.target, bindings: handoff.bindings ?? {} };
    });
  }
  const analyticalUnit = draft.analytical_unit ?? "account";
  if (draft.analytical_unit === void 0) {
    resolve("/analytical_unit", "analytical_unit.default_account", analyticalUnit);
  }
  let viewId = options.view_id;
  if (!viewId) {
    viewId = slugify(draft.title.value);
    resolve("/id", "view.id.from_title", viewId);
  }
  resolve("/customization_policy", "customization_policy.v1_default", DEFAULT_CUSTOMIZATION_POLICY);
  const view = AnalyticsViewSchema.parse({
    kind: "revturbine.analytics-view",
    schema_version: draft.schema_version,
    id: viewId,
    revision: options.revision ?? 1,
    title: draft.title,
    analytical_unit: analyticalUnit,
    catalog_version: catalog.version,
    filters,
    layout,
    blocks,
    handoffs,
    customization_policy: DEFAULT_CUSTOMIZATION_POLICY
  });
  const validation = validateAnalyticsView(view, catalog);
  return validation.valid ? { view, visibility, resolutions, validation } : { visibility, resolutions, validation };
}

// scaffold/src/analytics/models/api-schema.ts
import { z as z23 } from "zod";
var { Unrestricted: Unrestricted17 } = DataClassification;
var { Transient: Transient17 } = SchemaPersistence;
var { Internal: Internal13 } = SchemaExposure;
var meta5 = (id) => ({
  id,
  "x-revturbine-schema-persistence": Transient17,
  "x-revturbine-schema-exposure": Internal13
});
var ElementIdField2 = z23.string().regex(VIEW_ELEMENT_ID_PATTERN);
var AnalyticsFilterStateSchema = z23.strictObject({
  filter_id: ElementIdField2.meta(Unrestricted17),
  value: AnalyticsFilterValueSchema.nullable().meta(Unrestricted17)
}).meta(meta5("AnalyticsFilterState"));
var AnalyticsQueryOverridesSchema = z23.strictObject({
  time_grain: AnalyticsTimeGrainSchema.optional().meta(Unrestricted17),
  compare: AnalyticsCompareModeSchema.optional().meta(Unrestricted17),
  compare_delta: AnalyticsCompareDeltaSchema.optional().meta(Unrestricted17),
  compare_segment: AnalyticsCompareSegmentSchema.optional().meta(Unrestricted17),
  compare_experiment: AnalyticsCompareExperimentSchema.optional().meta(Unrestricted17),
  compare_scope: AnalyticsSourceScopeSchema.optional().meta(Unrestricted17),
  compare_anchor: z23.string().datetime().optional().meta(Unrestricted17),
  source_scope: AnalyticsSourceScopeSchema.optional().meta(Unrestricted17),
  /** Semantic-time basis switch (plan 219 REQ-4): as-occurred vs current classification. */
  historical_mode: AnalyticsHistoricalModeSchema.optional().meta(Unrestricted17)
}).meta(meta5("AnalyticsQueryOverrides"));
var AnalyticsQueryRequestSchema = z23.strictObject({
  view_id: ElementIdField2.meta(Unrestricted17),
  revision: z23.number().int().min(1).optional().meta(Unrestricted17),
  block_ids: z23.array(ElementIdField2).min(1).max(24).optional().meta(Unrestricted17),
  filter_state: z23.array(AnalyticsFilterStateSchema).max(20).optional().meta(Unrestricted17),
  overrides: AnalyticsQueryOverridesSchema.optional().meta(Unrestricted17)
}).meta(meta5("AnalyticsQueryRequest"));
var AnalyticsBlockErrorSchema = z23.object({
  block_id: ElementIdField2.meta(Unrestricted17),
  code: z23.string().regex(/^[A-Z][A-Z0-9_]{2,79}$/).meta(Unrestricted17),
  message: z23.string().min(1).max(500).meta(Unrestricted17)
}).meta(meta5("AnalyticsBlockError"));
var AnalyticsBlockResultSchema = z23.object({
  block_id: ElementIdField2.meta(Unrestricted17),
  result: AnalyticsResultSchema.meta(Unrestricted17)
}).meta(meta5("AnalyticsBlockResult"));
var AnalyticsQueryResponseSchema = z23.object({
  view_id: ElementIdField2.meta(Unrestricted17),
  revision: z23.number().int().min(1).meta(Unrestricted17),
  catalog_version: z23.string().min(1).max(64).meta(Unrestricted17),
  results: z23.array(AnalyticsBlockResultSchema).meta(Unrestricted17),
  errors: z23.array(AnalyticsBlockErrorSchema).default([]).meta(Unrestricted17)
}).meta(meta5("AnalyticsQueryResponse"));
var AnalyticsTemplateSummarySchema = z23.object({
  id: ElementIdField2.meta(Unrestricted17),
  version: z23.number().int().min(1).meta(Unrestricted17),
  title: LocalizedTextSchema.meta(Unrestricted17),
  description: LocalizedTextSchema.optional().meta(Unrestricted17),
  block_count: z23.number().int().min(1).meta(Unrestricted17)
}).meta(meta5("AnalyticsTemplateSummary"));
var CatalogSearchQuerySchema = z23.object({
  q: z23.string().min(1).max(200),
  limit: z23.coerce.number().int().min(1).max(50).optional()
});
var analyticsViewPaths = {
  "/api/analytics/views": {
    get: operation({
      operationId: "listAnalyticsViews",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List saved analytics views",
      tags: ["analytics-views"],
      responses: { "200": { description: "Saved analytics views", content: { "application/json": { schema: ListEnvelope(AnalyticsSavedViewSchema) } } } },
      "x-revturbine-operation": {
        exposure: "internal",
        resource: "analytics-views",
        persistence: {
          table: "analyticsViews",
          mode: "list",
          uniqueBy: ["tenant_id", "environment_id", "idempotency_key"]
        }
      }
    })
  },
  "/api/analytics/view-revisions": {
    get: operation({
      operationId: "listAnalyticsViewRevisions",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List immutable saved-view revisions",
      tags: ["analytics-views"],
      responses: { "200": { description: "Saved-view revisions", content: { "application/json": { schema: ListEnvelope(AnalyticsViewRevisionSchema) } } } },
      "x-revturbine-operation": {
        exposure: "internal",
        resource: "analytics-view-revisions",
        persistence: {
          table: "analyticsViewRevisions",
          mode: "list",
          uniqueBy: ["tenant_id", "environment_id", "view_id", "revision"]
        }
      }
    })
  },
  "/api/analytics/view-access": {
    get: operation({
      operationId: "listAnalyticsViewAccess",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List explicit saved-view access grants",
      tags: ["analytics-views"],
      responses: { "200": { description: "Saved-view access grants", content: { "application/json": { schema: ListEnvelope(AnalyticsViewAccessSchema) } } } },
      "x-revturbine-operation": {
        exposure: "internal",
        resource: "analytics-view-access",
        persistence: {
          table: "analyticsViewAccess",
          mode: "list",
          uniqueBy: ["tenant_id", "environment_id", "view_id", "principal_type", "principal_id"]
        }
      }
    })
  },
  "/api/analytics/catalog": {
    get: operation({
      operationId: "getAnalyticsCatalog",
      summary: "Return the authorized semantic catalog",
      tags: ["analytics-views"],
      responses: { "200": { description: "Semantic catalog", content: { "application/json": { schema: AnalyticsCatalogSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "analytics-views" }
    })
  },
  "/api/analytics/catalog/search": {
    get: operation({
      operationId: "searchAnalyticsCatalog",
      requestParams: { query: CatalogSearchQuerySchema },
      summary: "Search authorized concepts, metrics, and dimensions (agent projection)",
      tags: ["analytics-views"],
      responses: { "200": { description: "Matching agent-catalog entries", content: { "application/json": { schema: AnalyticsCatalogSearchResultSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "analytics-views" }
    })
  },
  "/api/analytics/templates": {
    get: operation({
      operationId: "listAnalyticsTemplates",
      summary: "List system view templates",
      tags: ["analytics-views"],
      responses: { "200": { description: "Template summaries", content: { "application/json": { schema: ListEnvelope(AnalyticsTemplateSummarySchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "analytics-views" }
    })
  },
  "/api/analytics/views/{viewId}": {
    get: operation({
      operationId: "getAnalyticsView",
      requestParams: { path: z23.object({ viewId: z23.string() }) },
      summary: "Load a system or saved view document",
      tags: ["analytics-views"],
      responses: { "200": { description: "Canonical view document", content: { "application/json": { schema: AnalyticsViewSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "analytics-views" }
    })
  },
  "/api/analytics/query": {
    post: operation({
      operationId: "executeAnalyticsQuery",
      summary: "Execute stored-view blocks with transient filter state (partial success)",
      tags: ["analytics-views"],
      requestBody: { required: true, content: { "application/json": { schema: AnalyticsQueryRequestSchema } } },
      responses: { "200": { description: "Per-block results and errors", content: { "application/json": { schema: AnalyticsQueryResponseSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "analytics-views" }
    })
  },
  // Annotation read (plan 219 TASK-2 contract; served by TASK-4). A separate
  // endpoint on purpose: overlays are presentation, so fetching annotations
  // can never change what /api/analytics/query returns (REQ-8).
  "/api/analytics/annotations": {
    post: operation({
      operationId: "queryAnalyticsAnnotations",
      summary: "Read tenant-scoped chart annotations for a time window",
      tags: ["analytics-views"],
      requestBody: { required: true, content: { "application/json": { schema: AnalyticsAnnotationRequestSchema } } },
      responses: { "200": { description: "Annotations in the window", content: { "application/json": { schema: AnalyticsAnnotationResponseSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "analytics-views" }
    })
  }
};

// scaffold/src/analytics/models/optimization-schema.ts
import { z as z25 } from "zod";

// scaffold/src/core/providers/schema.ts
import { z as z24 } from "zod";
var { Unrestricted: Unrestricted18 } = DataClassification;
var { Transient: Transient18 } = SchemaPersistence;
var { Internal: Internal14 } = SchemaExposure;
var meta6 = (id) => ({
  id,
  "x-revturbine-schema-persistence": Transient18,
  "x-revturbine-schema-exposure": Internal14
});
var ProviderCapabilitySchema = z24.enum([
  "analytics_execution",
  "experiment_assignment",
  "experiment_evidence",
  "experiment_analysis",
  "growth_signal",
  "growth_benchmark",
  "optimization"
]).meta(meta6("ProviderCapability"));
var ProviderAvailabilitySchema = z24.enum(["available", "stale", "unavailable", "unsupported", "partial"]).meta(meta6("ProviderAvailability"));
var ProviderProvenanceSchema = z24.object({
  /** Stable handle of the provider that produced this output. */
  provider_handle: HandleField.meta(Unrestricted18),
  /** Implementation family, e.g. `native_tinybird`, `growthbook`. */
  provider_type: z24.string().min(1).max(100).meta(Unrestricted18),
  /** Version of the provider implementation itself. */
  provider_version: z24.string().min(1).max(100).meta(Unrestricted18),
  /** Version of the provider *contract* this output conforms to. */
  contract_version: z24.number().int().min(1).meta(Unrestricted18),
  /** When the output was produced. */
  generated_at: z24.string().datetime().meta(Unrestricted18),
  /** How current the underlying data is, where the source exposes it. */
  data_watermark: z24.string().datetime().optional().meta(Unrestricted18),
  /** Revision of the source artifact, where the source is versioned. */
  source_revision: z24.string().min(1).max(200).optional().meta(Unrestricted18)
}).meta(meta6("ProviderProvenance"));
var ProviderBindingRefSchema = z24.object({
  /** Resolves to a server-only `ProviderConnection`. */
  provider_handle: HandleField.meta(Unrestricted18),
  /** Which capability this binding fills. */
  capability: ProviderCapabilitySchema.meta(Unrestricted18)
}).meta(meta6("ProviderBindingRef"));

// scaffold/src/analytics/models/optimization-schema.ts
var { Unrestricted: Unrestricted19 } = DataClassification;
var { Transient: Transient19 } = SchemaPersistence;
var { Internal: Internal15 } = SchemaExposure;
var meta7 = (id) => ({
  id,
  "x-revturbine-schema-persistence": Transient19,
  "x-revturbine-schema-exposure": Internal15
});
var GrowthSignalPointSchema = z25.object({
  start: z25.string().datetime().meta(Unrestricted19),
  end: z25.string().datetime().meta(Unrestricted19),
  value: z25.number().meta(Unrestricted19),
  numerator: z25.number().optional().meta(Unrestricted19),
  denominator: z25.number().optional().meta(Unrestricted19),
  sample_size: z25.number().int().min(0).optional().meta(Unrestricted19)
}).meta(meta7("GrowthSignalPoint"));
var GrowthSignalSeriesSchema = z25.object({
  metric: AnalyticsSemanticIdSchema.meta(Unrestricted19),
  analytical_unit: AnalyticsAnalyticalUnitSchema.meta(Unrestricted19),
  source_scope: AnalyticsSourceScopeSchema.meta(Unrestricted19),
  dimensions: z25.record(AnalyticsSemanticIdSchema, z25.string()).meta(Unrestricted19),
  points: z25.array(GrowthSignalPointSchema).meta(Unrestricted19),
  provenance: ProviderProvenanceSchema.meta(Unrestricted19)
}).meta(meta7("GrowthSignalSeries"));
var GrowthSignalBundleSchema = z25.object({
  availability: ProviderAvailabilitySchema.meta(Unrestricted19),
  series: z25.array(GrowthSignalSeriesSchema).meta(Unrestricted19),
  provenance: ProviderProvenanceSchema.meta(Unrestricted19)
}).meta(meta7("GrowthSignalBundle"));
var TrendFeaturesSchema = z25.object({
  current: z25.number().meta(Unrestricted19),
  baseline: z25.number().meta(Unrestricted19),
  absolute_delta: z25.number().meta(Unrestricted19),
  relative_delta: z25.number().meta(Unrestricted19),
  short_window: z25.number().meta(Unrestricted19),
  long_window: z25.number().meta(Unrestricted19),
  slope: z25.number().meta(Unrestricted19),
  acceleration: z25.number().meta(Unrestricted19),
  volatility: z25.number().meta(Unrestricted19),
  persistence: z25.number().meta(Unrestricted19),
  seasonal_expected: z25.number().optional().meta(Unrestricted19),
  seasonal_deviation: z25.number().optional().meta(Unrestricted19),
  peer_value: z25.number().optional().meta(Unrestricted19),
  peer_gap: z25.number().optional().meta(Unrestricted19),
  sample_size: z25.number().int().min(0).optional().meta(Unrestricted19)
}).meta(meta7("TrendFeatures"));
var EvidenceRequirementSchema = z25.object({
  min_units: z25.number().int().min(0).optional().meta(Unrestricted19),
  min_events: z25.number().int().min(0).optional().meta(Unrestricted19),
  min_periods: z25.number().int().min(0).optional().meta(Unrestricted19),
  min_denominator: z25.number().min(0).optional().meta(Unrestricted19)
}).meta(meta7("EvidenceRequirement"));
var OpportunityInterpretationSchema = z25.enum([
  "increase",
  "decrease",
  "level_shift",
  "threshold",
  "peer_gap",
  "correlation"
]).meta(meta7("OpportunityInterpretation"));
var OpportunityEvidenceSchema = z25.object({
  metric: AnalyticsSemanticIdSchema.meta(Unrestricted19),
  current: z25.number().meta(Unrestricted19),
  baseline: z25.number().optional().meta(Unrestricted19),
  relative_delta: z25.number().optional().meta(Unrestricted19),
  window: z25.object({
    start: z25.string().datetime().meta(Unrestricted19),
    end: z25.string().datetime().meta(Unrestricted19)
  }).meta(Unrestricted19),
  sample_size: z25.number().int().min(0).optional().meta(Unrestricted19),
  source_scope: AnalyticsSourceScopeSchema.meta(Unrestricted19),
  interpretation: OpportunityInterpretationSchema.meta(Unrestricted19)
}).meta(meta7("OpportunityEvidence"));
var DetectorRequirementsSchema = z25.object({
  required_metrics: z25.array(AnalyticsSemanticIdSchema).min(1).meta(Unrestricted19),
  evidence: EvidenceRequirementSchema.meta(Unrestricted19)
}).meta(meta7("DetectorRequirements"));
var OpaqueStructuredPayloadSchema = z25.record(z25.string(), z25.unknown());
var OpportunityCandidateSchema = z25.object({
  detector_id: z25.string().min(1).meta(Unrestricted19),
  detector_version: z25.number().int().min(1).meta(Unrestricted19),
  opportunity_type: z25.string().min(1).meta(Unrestricted19),
  resource: z25.object({
    type: z25.string().min(1).meta(Unrestricted19),
    handle: z25.string().min(1).meta(Unrestricted19)
  }).optional().meta(Unrestricted19),
  segment_handles: z25.array(z25.string().min(1)).optional().meta(Unrestricted19),
  evidence: z25.array(OpportunityEvidenceSchema).min(1).meta(Unrestricted19),
  hypothesis: z25.string().min(1).meta(Unrestricted19),
  confidence: z25.number().min(0).max(1).meta(Unrestricted19),
  impact: OpaqueStructuredPayloadSchema.optional().meta(Unrestricted19),
  suggested_action: OpaqueStructuredPayloadSchema.optional().meta(Unrestricted19),
  suggested_experiment: OpaqueStructuredPayloadSchema.optional().meta(Unrestricted19)
}).meta(meta7("OpportunityCandidate"));

// scaffold/src/events/models/schema.ts
import { z as z26 } from "zod";
var { Unrestricted: Unrestricted20, Pii: Pii4 } = DataClassification;
var { Persisted: Persisted12, Transient: Transient20 } = SchemaPersistence;
var { Internal: Internal16, External: External11 } = SchemaExposure;
var EventSourceSchema = z26.enum(["clickstream", "telemetry", "sdk", "workflow", "system"]).meta(
  {
    id: "EventSource",
    "x-revturbine-schema-persistence": Transient20,
    "x-revturbine-schema-exposure": External11
  }
);
var EventEnvelopeSchema = IdField.extend({
  event_type: z26.string().min(1).meta(Unrestricted20),
  source: EventSourceSchema.default("sdk").meta(Unrestricted20),
  tenant_id: z26.string().min(1).optional().meta(Unrestricted20),
  /**
   * Identity keys are `Unrestricted` on EVERY lane (BL-0131, Kent's **D-19**,
   * 2026-09-25): *"Not treated as PII, but a PII leak still detectable. We
   * want our customers to use UUIDs, but if they pass an email, we need to
   * hash it consistently."*
   *
   * A `user_id` / `account_id` is the TENANT'S OWN primary key, not personal
   * data. Before BL-0131 the three ingest lanes disagreed — `TrackEvent.user_id`
   * and `TreatmentInteractionInput.account_id` were `Pii` while
   * `TrackEvent.account_id` was `Unrestricted` — so the same logical key
   * carried two classifications depending on which route it arrived through.
   *
   * The leak is handled at the BOUNDARY, not by the classification:
   * `classifyIdentityValue` / `normalizeIdentityValue` in `@revt-eng/core`
   * detect a PII-shaped value, consistently hash an email-shaped one
   * (`eml_<sha256-16>`, unsalted so every writer and reader agrees), and
   * report `identity_pii_detected` so the tenant learns to send UUIDs.
   *
   * Dropping `pii` does NOT widen browser exposure: the plan-157
   * client-context filter is an allowlist keyed on field-level `external`
   * exposure, which these fields do not carry, so they stay `server_only`.
   */
  user_id: z26.string().min(1).optional().meta(Unrestricted20),
  session_id: z26.string().min(1).optional().meta(Pii4),
  occurred_at: z26.string().datetime().meta(Unrestricted20),
  request_id: z26.string().min(1).meta(Unrestricted20),
  attributes: z26.record(z26.string(), z26.unknown()).default({}).meta(Unrestricted20),
  payload: z26.record(z26.string(), z26.unknown()).default({}).meta(Unrestricted20)
}).meta(
  {
    id: "EventEnvelope",
    "x-revturbine-schema-persistence": Transient20,
    "x-revturbine-schema-exposure": Internal16
  }
);
var IngestedEventSchema = EventEnvelopeSchema.extend({
  ingested_at: z26.string().datetime().meta(Unrestricted20)
}).meta(
  {
    id: "IngestedEvent",
    "x-revturbine-schema-persistence": Persisted12,
    "x-revturbine-schema-exposure": Internal16
  }
);
var EventIngestBatchSchema = z26.array(
  z26.object({
    id: z26.string().min(1).optional().meta(Unrestricted20),
    event_type: z26.string().min(1).meta(Unrestricted20),
    occurred_at: z26.string().datetime().optional().meta(Unrestricted20),
    tenant_id: z26.string().min(1).optional().meta(Unrestricted20),
    // Identity key — `Unrestricted` on every lane (BL-0131, D-19); see
    // `EventEnvelopeSchema.user_id`.
    user_id: z26.string().min(1).optional().meta(Unrestricted20),
    session_id: z26.string().min(1).optional().meta(Pii4),
    attributes: z26.record(z26.string(), z26.unknown()).optional().meta(Unrestricted20),
    payload: z26.record(z26.string(), z26.unknown()).optional().meta(Unrestricted20),
    message: z26.string().optional().meta(Unrestricted20),
    level: z26.string().optional().meta(Unrestricted20),
    path: z26.string().optional().meta(Unrestricted20)
  })
).meta(
  {
    id: "EventIngestBatch",
    "x-revturbine-schema-persistence": Transient20,
    "x-revturbine-schema-exposure": Internal16
  }
);
var TreatmentInteractionTypeSchema = z26.enum([
  "impression",
  "dismiss",
  "remind_me_later",
  "cta_clicked",
  "cta_completed",
  "suppress"
]).meta(
  {
    id: "TreatmentInteractionType",
    "x-revturbine-schema-persistence": Transient20,
    "x-revturbine-schema-exposure": External11
  }
);
var TreatmentInteractionInputSchema = z26.object({
  // Identity key — `Unrestricted` on every lane (BL-0131, D-19); see
  // `EventEnvelopeSchema.user_id` for the full rationale.
  user_id: z26.string().min(1).meta(Unrestricted20),
  /**
   * The account / organization the user acted on behalf of (plan 232 REQ-4).
   *
   * `placement_presentations.account_id` is an ANALYTICAL JOIN KEY, not a
   * label: `monetization_funnel` matches it against account ids drawn from
   * `events_clickstream` and `events_billing`, `cohort_rollup` reaches it
   * through the same funnel binding, and experiment analysis reads it
   * whenever `analysis_unit = 'account'`. Until this field existed the route
   * had nothing to write there and fell back to `user_id`, so those joins
   * could only match where a user id happened to equal an account id.
   *
   * Optional, and the route keeps the `user_id` fallback when it is absent,
   * so pre-232 SDKs behave exactly as before rather than writing an empty
   * key that the `account_id != ''` predicates would silently drop.
   *
   * BL-0131 (D-19) aligned this to `Unrestricted`, matching the clickstream
   * half (`TrackEvent.account_id`): an account id is a join key, not
   * personal data, and a PII-shaped value is detected and consistently
   * hashed at the ingest boundary instead of being re-labelled here.
   */
  account_id: z26.string().min(1).optional().meta(Unrestricted20),
  placement_id: z26.string().min(1).meta(Unrestricted20),
  treatment_id: z26.string().min(1).optional().meta(Unrestricted20),
  // Presentation context (plan 114) — carried so a treatment interaction can
  // be persisted as a `placement_presentations` row. Optional for back-compat:
  // callers that only record an interaction (not a full presentation) omit them.
  surface_slot_id: z26.string().min(1).optional().meta(Unrestricted20),
  surface_template_id: z26.string().min(1).optional().meta(Unrestricted20),
  payload_id: z26.string().min(1).optional().meta(Unrestricted20),
  interaction_type: TreatmentInteractionTypeSchema.meta(Unrestricted20),
  interaction_at: z26.string().datetime().optional().meta(Unrestricted20),
  // Attribution context (plan 182 TASK-2a). Without these the presentation row
  // is written with nulls and the message / experiment analytics pipes return
  // nothing at all — `message_impact` filters on an equality that a null can
  // never satisfy. Supplied by the SDK, which holds the rendered
  // `PlacementOutput` and so is the only place these are unambiguously known.
  //
  // Both message-block identifiers are carried, per the platform identity rule:
  // a `handle` is the canonical, version-stable identifier (group by it to ask
  // "how does this message perform?"), an `id` addresses one specific version
  // (group by it to ask "how did THIS version perform?" — what makes a content
  // edit measurable). Optional for back-compat: pre-182 SDKs omit them.
  message_block_handle: z26.string().min(1).optional().meta(Unrestricted20),
  message_block_id: z26.string().min(1).optional().meta(Unrestricted20),
  experiment_id: z26.string().min(1).optional().meta(Unrestricted20),
  variant_key: z26.string().min(1).optional().meta(Unrestricted20),
  /**
   * The `unique_handle` of the rule whose treatment was presented (BL-0200).
   *
   * #391 put `rule_handle` on the clickstream `placement_interaction` EVENT
   * and deliberately kept it off this wire, so the BASE
   * `placement_exposure_attribution` row this contract writes had no rule and
   * `treatment-interaction-rows.ts` hard-coded `rule_handle: null`. Only an
   * exposure that an attributed conversion later enriched carried one, which
   * is why the attribution plane's rule cut could serve conversion-grain
   * metrics and had to refuse presentation-grain ones BY NAME: computed over
   * the attributed subset, `presented_accounts` would report the accounts
   * that converted and `conversion.rate` ~100%.
   *
   * Carrying it here makes the rule a property of the EXPOSURE, known at
   * presentation time by the only party that holds the resolved
   * `PlacementOutput`, so those cuts become honestly servable.
   *
   * Optional AND nullable, the same contract #389/#391 chose and for the same
   * reason: a required field would reject every already-deployed SDK's
   * interactions at the ingest boundary. Absent = a pre-BL-0200 producer or
   * an interaction with no decision in scope, `null` = no rule matched, a
   * string = the winning rule.
   */
  rule_handle: z26.string().min(1).nullable().optional().meta(Unrestricted20),
  /**
   * Caller-declared test traffic (plan 164) — mirrors `TrackEvent.test` so
   * the presentation/interaction feed (the dashboard denominators) carries
   * the same default-excluded, `include_test`-toggleable dimension.
   */
  test: z26.boolean().optional().meta(Unrestricted20),
  metadata: z26.record(z26.string(), z26.unknown()).optional().meta(Unrestricted20)
}).meta(
  {
    id: "TreatmentInteractionInput",
    "x-revturbine-schema-persistence": Transient20,
    "x-revturbine-schema-exposure": External11
  }
);
var MAX_TREATMENT_INTERACTIONS_PER_BATCH = 500;
var TreatmentInteractionBatchSchema = z26.array(TreatmentInteractionInputSchema).min(1).max(MAX_TREATMENT_INTERACTIONS_PER_BATCH).meta(
  {
    id: "TreatmentInteractionBatch",
    "x-revturbine-schema-persistence": Transient20,
    "x-revturbine-schema-exposure": External11
  }
);
var TreatmentInteractionRequestSchema = z26.union([TreatmentInteractionInputSchema, TreatmentInteractionBatchSchema]).meta(
  {
    id: "TreatmentInteractionRequest",
    "x-revturbine-schema-persistence": Transient20,
    "x-revturbine-schema-exposure": External11
  }
);
var TriggerEventTypeSchema = z26.enum([
  "trial_midpoint",
  "trial_expiring",
  "trial_expired",
  "usage_limit_approaching",
  "usage_limit_reached",
  "credit_balance_low",
  "seat_limit_reached",
  "feature_gated",
  "cancel_intent",
  "payment_failed",
  "auto_renewal_reminder",
  "onboarding_complete",
  "invite_teammate_prompt",
  "referral_offer",
  "plan_upgrade_nudge"
]).meta(
  {
    id: "TriggerEventType",
    "x-revturbine-schema-persistence": Transient20,
    "x-revturbine-schema-exposure": External11
  }
);
var TrialTriggerPayloadSchema = z26.object({
  days_remaining: z26.number().int().min(0).optional().meta(Unrestricted20)
}).meta(
  {
    id: "TrialTriggerPayload",
    "x-revturbine-schema-persistence": Transient20,
    "x-revturbine-schema-exposure": External11
  }
);
var UsageTriggerPayloadSchema = z26.object({
  entitlement_handle: z26.string().optional().meta(Unrestricted20),
  current_usage: z26.number().min(0).optional().meta(Unrestricted20),
  usage_limit: z26.number().min(0).optional().meta(Unrestricted20),
  usage_percent: z26.number().min(0).max(100).optional().meta(Unrestricted20),
  threshold: z26.number().min(0).optional().meta(Unrestricted20),
  balance: z26.number().min(0).optional().meta(Unrestricted20),
  allocation: z26.number().min(0).optional().meta(Unrestricted20),
  seats_used: z26.number().int().min(0).optional().meta(Unrestricted20),
  seats_allowed: z26.number().int().min(0).optional().meta(Unrestricted20)
}).meta(
  {
    id: "UsageTriggerPayload",
    "x-revturbine-schema-persistence": Transient20,
    "x-revturbine-schema-exposure": External11
  }
);
var FeatureGateTriggerPayloadSchema = z26.object({
  feature: z26.string().min(1).meta(Unrestricted20)
}).meta(
  {
    id: "FeatureGateTriggerPayload",
    "x-revturbine-schema-persistence": Transient20,
    "x-revturbine-schema-exposure": External11
  }
);
var PaymentTriggerPayloadSchema = z26.object({
  retry_count: z26.number().int().min(0).optional().meta(Unrestricted20),
  renewal_date: z26.string().optional().meta(Unrestricted20)
}).meta(
  {
    id: "PaymentTriggerPayload",
    "x-revturbine-schema-persistence": Transient20,
    "x-revturbine-schema-exposure": External11
  }
);
var SemanticEventSchema = z26.object({
  event_type: z26.string().min(1).meta(Unrestricted20),
  payload: z26.record(z26.string(), z26.unknown()).default({}).meta(Unrestricted20)
}).meta(
  {
    id: "SemanticEvent",
    "x-revturbine-schema-persistence": Transient20,
    "x-revturbine-schema-exposure": External11
  }
);
var ControlPlaneEventSourceSchema = z26.enum(["system", "workflow"]).meta(
  {
    id: "ControlPlaneEventSource",
    "x-revturbine-schema-persistence": Transient20,
    "x-revturbine-schema-exposure": External11
  }
);
var ControlPlaneEventTypeSchema = (
  // DERIVED from the taxonomy (plan 181 REQ-8), never a second list: adding a
  // control-plane event means adding it to CONTROL_PLANE_EVENT_NAMES, and this
  // enum follows. The tuple is `as const`, so literal types survive.
  z26.enum(CONTROL_PLANE_EVENT_NAMES).meta(
    {
      id: "ControlPlaneEventType",
      "x-revturbine-schema-persistence": Transient20,
      "x-revturbine-schema-exposure": External11
    }
  )
);
var ControlPlaneSemanticEventSchema = z26.object({
  event_type: ControlPlaneEventTypeSchema.meta(Unrestricted20),
  source: ControlPlaneEventSourceSchema.meta(Unrestricted20),
  payload: z26.record(z26.string(), z26.unknown()).default({}).meta(Unrestricted20)
}).meta(
  {
    id: "ControlPlaneSemanticEvent",
    "x-revturbine-schema-persistence": Transient20,
    "x-revturbine-schema-exposure": External11
  }
);
var EventSearchParamsSchema = z26.object({
  q: z26.string().optional().meta(Unrestricted20),
  source: EventSourceSchema.optional().meta(Unrestricted20),
  event_type: z26.string().optional().meta(Unrestricted20),
  from: z26.string().datetime().optional().meta(Unrestricted20),
  to: z26.string().datetime().optional().meta(Unrestricted20),
  page: z26.coerce.number().int().min(1).default(1).meta(Unrestricted20),
  per_page: z26.coerce.number().int().min(1).max(100).default(25).meta(Unrestricted20)
}).meta(
  {
    id: "EventSearchParams",
    "x-revturbine-schema-persistence": Transient20,
    "x-revturbine-schema-exposure": Internal16
  }
);
var WebhookEventSourceSchema = z26.enum(["stripe", "apple", "google"]).meta(
  {
    id: "WebhookEventSource",
    "x-revturbine-schema-persistence": Transient20,
    "x-revturbine-schema-exposure": Internal16
  }
);
var WebhookEventStatusSchema = z26.enum(["processed", "failed", "skipped", "pending", "error"]).meta(
  {
    id: "WebhookEventStatus",
    "x-revturbine-schema-persistence": Transient20,
    "x-revturbine-schema-exposure": Internal16
  }
);
var WebhookEventLogSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  event_id: z26.string().min(1).meta(Unrestricted20),
  event_type: z26.string().min(1).meta(Unrestricted20),
  source: WebhookEventSourceSchema.meta(Unrestricted20),
  payload: z26.record(z26.string(), z26.unknown()).default({}).meta(Unrestricted20),
  status: WebhookEventStatusSchema.default("processed").meta(Unrestricted20),
  processed_at: z26.string().datetime().optional().meta(Unrestricted20),
  error_message: z26.string().optional().meta(Unrestricted20)
}).meta(
  {
    id: "WebhookEventLog",
    "x-revturbine-schema-persistence": Persisted12,
    "x-revturbine-schema-exposure": Internal16
  }
);
var EventIngestResponseSchema = z26.object({
  accepted: z26.number().int().min(0).meta(Unrestricted20)
}).meta(
  {
    id: "null",
    "x-revturbine-schema-persistence": Transient20,
    "x-revturbine-schema-exposure": Internal16
  }
);
var MAX_TRACK_EVENTS_PER_BATCH = 500;
var EventOriginSchema = z26.enum(["explicit", "automatic", "derived", "raw"]).meta(
  {
    id: "EventOrigin",
    "x-revturbine-schema-persistence": Transient20,
    "x-revturbine-schema-exposure": External11
  }
);
var TrackEventSchema = z26.object({
  environment_id: z26.string().min(1).meta(Unrestricted20),
  // Identity key — `Unrestricted` on every lane (BL-0131, D-19); see
  // `EventEnvelopeSchema.user_id` for the full rationale.
  user_id: z26.string().min(1).meta(Unrestricted20),
  /**
   * The account / organization the user acted on behalf of (BL-0117).
   *
   * OPTIONAL: absent means no account was identified. It is an ANALYTICAL
   * JOIN KEY, not a label — `monetization_funnel` builds its account map
   * from `events_clickstream.account_id`, and experiment analysis reads it
   * whenever `analysis_unit = 'account'`. While this field was required the
   * SDK filled it with `userContext.account_id || userId`, so every app that
   * identified no account contributed a bogus `user_id → user_id` entry to
   * that map.
   *
   * There is no absent sentinel: identity keys are hashed, not sentinelled,
   * and an unknown trait is an ABSENCE (plan 255). Empty string stays
   * rejected — `''` would pass the column's type but every consuming pipe
   * filters `account_id != ''`, so the row would land and be invisible.
   * BL-0011 (#507) made the same change on the interactions lane
   * (`TreatmentInteractionInput.account_id`); this is the clickstream half.
   */
  account_id: z26.string().min(1).optional().meta(Unrestricted20),
  event_name: z26.string().min(1).max(120).meta(Unrestricted20),
  event_ts: z26.string().datetime().meta(Unrestricted20),
  properties: z26.string().optional().meta(Unrestricted20),
  surface_slot_id: z26.string().nullable().optional().meta(Unrestricted20),
  placement_id: z26.string().nullable().optional().meta(Unrestricted20),
  payload_id: z26.string().nullable().optional().meta(Unrestricted20),
  request_id: z26.string().optional().meta(Unrestricted20),
  experiment_id: z26.string().nullable().optional().meta(Unrestricted20),
  variant_key: z26.string().nullable().optional().meta(Unrestricted20),
  tenant_id: z26.string().optional().meta(Unrestricted20),
  // ── Lifted provenance ────────────────────────────────────────────────
  //
  // `properties` is a serialized JSON string, so anything left inside it is
  // readable via JSONExtract but unindexed and scan-costly — fine for a
  // forensic lookup, not for a dashboard that groups 90 days of events. The
  // four fields below are the ones analytics actually slices by, so they
  // get named columns.
  //
  // The asymmetry that decides this: an unused column costs bytes, while a
  // missing one costs a forward-only recreate of a populated datasource
  // (the Tinybird TS SDK cannot emit FORWARD_QUERY). Lift deliberately, and
  // route genuinely new high-volume event classes to their own datasource
  // rather than widening this one.
  /** Sortable unique id minted at capture. Carried now so historical rows have it if dedup ever moves off `request_id` — a destructive sorting-key change not worth paying for while storage-layer dedup already collapses re-delivery. */
  event_id: z26.string().nullable().optional().meta(Unrestricted20),
  /** See {@link EventOriginSchema}. Low cardinality; every scoring query filters on it. */
  origin: EventOriginSchema.nullable().optional().meta(Unrestricted20),
  /** Immutable Playbook version that produced the experience. The field that makes a past decision reproducible. */
  playbook_version: z26.string().nullable().optional().meta(Unrestricted20),
  /** Correlates every event caused by one decision — a join key, not a group-by. */
  decision_id: z26.string().nullable().optional().meta(Unrestricted20),
  /**
   * Caller-declared test traffic (plan 164): set from the SDK's `test` init
   * option, stamped on every emitted event. Analytics pipes exclude
   * `test = true` rows from denominators/rollups by default, with an
   * `include_test` pipe parameter as the opt-in toggle. Distinct from the
   * placement "Test Mode" (plan 08c), which is a server-decided per-user
   * flag on DECISIONING responses — this one marks EMITTED events.
   */
  test: z26.boolean().optional().meta(Unrestricted20)
}).meta(
  {
    id: "TrackEvent",
    "x-revturbine-schema-persistence": Transient20,
    "x-revturbine-schema-exposure": External11
  }
);
var TrackIngestBatchSchema = z26.object({
  events: z26.array(TrackEventSchema).min(1).max(MAX_TRACK_EVENTS_PER_BATCH).meta(Unrestricted20)
}).meta(
  {
    id: "TrackIngestBatch",
    "x-revturbine-schema-persistence": Transient20,
    "x-revturbine-schema-exposure": External11
  }
);
var MAX_SDK_META_EVENTS_PER_BATCH = 10;
var SdkMetaEventTypeSchema = z26.enum(["sdk_init", "sdk_error", "sdk_validation_warning", "resolution_failure"]).meta(
  {
    id: "SdkMetaEventType",
    "x-revturbine-schema-persistence": Transient20,
    "x-revturbine-schema-exposure": External11
  }
);
var SdkConfigShapeSchema = z26.object({
  plans: z26.number().int().min(0).meta(Unrestricted20),
  entitlements: z26.number().int().min(0).meta(Unrestricted20),
  entitlement_rules: z26.number().int().min(0).meta(Unrestricted20),
  segments: z26.number().int().min(0).meta(Unrestricted20),
  placements: z26.number().int().min(0).meta(Unrestricted20),
  placement_payloads: z26.number().int().min(0).meta(Unrestricted20),
  content_ui_paths: z26.number().int().min(0).meta(Unrestricted20),
  surface_templates: z26.number().int().min(0).meta(Unrestricted20)
}).meta(
  {
    id: "SdkConfigShape",
    "x-revturbine-schema-persistence": Transient20,
    "x-revturbine-schema-exposure": External11
  }
);
var SdkMetaEventSchema = z26.object({
  event_type: SdkMetaEventTypeSchema.meta(Unrestricted20),
  occurred_at: z26.string().datetime().meta(Unrestricted20),
  request_id: z26.string().min(1).optional().meta(Unrestricted20),
  // One-way, non-reversible hash of a non-secret config identifier (e.g.
  // truncated SHA-256 of config_hash / bundle id). Counts distinct
  // deployments without exposing the real id (REQ-7).
  config_hash_id: z26.string().min(1).max(64).optional().meta(Unrestricted20),
  sdk_version: z26.string().min(1).max(64).optional().meta(Unrestricted20),
  runtime_mode: z26.string().min(1).max(64).optional().meta(Unrestricted20),
  schema_version: z26.string().min(1).max(64).optional().meta(Unrestricted20),
  bundle_version: z26.string().min(1).max(64).optional().meta(Unrestricted20),
  // Present for sdk_init; config-shape counts only, no user context (REQ-6).
  config_shape: SdkConfigShapeSchema.optional().meta(Unrestricted20),
  // Short non-PII diagnostic for sdk_error / sdk_validation_warning.
  message: z26.string().max(500).optional().meta(Unrestricted20),
  // Diagnostic fields for `resolution_failure` (plan 144 TASK-20; absorbed
  // plan 124 REQ-5/AC-6 — its Q-1 allow-list, append-only). Every value is
  // an AUTHOR-DEFINED handle or a closed reason code — never user-supplied
  // free text; `message` above remains the only prose field and stays
  // length-capped. Emitted from the SDK's fallback/deny sites so a
  // placement that silently resolves to nothing becomes observable.
  reason: z26.string().min(1).max(64).optional().meta(Unrestricted20),
  placement_handle: z26.string().min(1).max(64).optional().meta(Unrestricted20),
  slot_handle: z26.string().min(1).max(64).optional().meta(Unrestricted20),
  surface: z26.string().min(1).max(64).optional().meta(Unrestricted20),
  plan_handle: z26.string().min(1).max(64).optional().meta(Unrestricted20),
  entitlement_handle: z26.string().min(1).max(64).optional().meta(Unrestricted20)
}).meta(
  {
    id: "SdkMetaEvent",
    "x-revturbine-schema-persistence": Transient20,
    "x-revturbine-schema-exposure": External11
  }
);
var SdkMetaIngestBatchSchema = z26.object({
  events: z26.array(SdkMetaEventSchema).min(1).max(MAX_SDK_META_EVENTS_PER_BATCH).meta(Unrestricted20)
}).meta(
  {
    id: "SdkMetaIngestBatch",
    "x-revturbine-schema-persistence": Transient20,
    "x-revturbine-schema-exposure": External11
  }
);
var eventPaths = {
  "/api/track": {
    post: operation({
      operationId: "ingestTrackEvents",
      summary: "Ingest a batch of SDK clickstream events",
      tags: ["events"],
      requestBody: { required: true, content: { "application/json": { schema: TrackIngestBatchSchema } } },
      responses: {
        "202": { description: "Events accepted for processing", content: { "application/json": { schema: EventIngestResponseSchema } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "external", resource: "events" }
    })
  },
  "/api/sdk/meta": {
    post: operation({
      operationId: "ingestSdkMeta",
      summary: "Ingest anonymous SDK telemetry (keyless, non-authed, rate-limited)",
      description: "Accepts a small batch of anonymous, keyless SDK telemetry without a public ingest key. Carries config-shape metrics and a one-way hashed config id only \u2014 no user context, no tenant binding. Rate-limited per IP; only the SdkMetaEventType allowlist is accepted.",
      tags: ["events"],
      requestBody: { required: true, content: { "application/json": { schema: SdkMetaIngestBatchSchema } } },
      responses: {
        "202": { description: "Telemetry accepted for processing", content: { "application/json": { schema: EventIngestResponseSchema } } },
        "429": { description: "Rate limit exceeded", content: { "application/json": { schema: ErrorEnvelope } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "external", resource: "events" }
    })
  },
  "/api/events/search": {
    get: operation({
      operationId: "searchEvents",
      summary: "Search ingested events",
      tags: ["events"],
      responses: {
        "200": { description: "Paginated event results", content: { "application/json": { schema: PaginatedResponseSchema(IngestedEventSchema) } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "events" }
    })
  },
  "/api/events/interactions": {
    post: operation({
      operationId: "recordTreatmentInteraction",
      summary: "Record one placement treatment interaction, or a batch of them",
      tags: ["events"],
      requestBody: { required: true, content: { "application/json": { schema: TreatmentInteractionRequestSchema } } },
      responses: {
        "202": { description: "Interaction accepted", content: { "application/json": { schema: EventIngestResponseSchema } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "external", resource: "events" }
    })
  },
  "/api/webhook-events": {
    get: operation({
      operationId: "listWebhookEvents",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List webhook event log entries",
      tags: ["events"],
      responses: { "200": { description: "Webhook event list", content: { "application/json": { schema: ListEnvelope(WebhookEventLogSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "webhook-events", persistence: { table: "webhookEventLog", mode: "list", uniqueBy: ["tenant_id", "event_id"] } }
    }),
    post: operation({
      operationId: "createWebhookEvent",
      summary: "Record a processed webhook event",
      tags: ["events"],
      requestBody: { required: true, content: { "application/json": { schema: WebhookEventLogSchema } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: WebhookEventLogSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "webhook-events", persistence: { table: "webhookEventLog", mode: "create", uniqueBy: ["tenant_id", "event_id"] } }
    })
  }
};

// scaffold/src/events/models/segment-envelope.ts
import { z as z27 } from "zod";
var { Unrestricted: Unrestricted21, Pii: Pii5 } = DataClassification;
var { Transient: Transient21 } = SchemaPersistence;
var { Internal: Internal17, External: External12 } = SchemaExposure;
var EVENT_ENVELOPE_SCHEMA_VERSION = 2;
var MIN_READABLE_EVENT_ENVELOPE_SCHEMA_VERSION = 1;
var LEGACY_TRACK_EVENT_ENVELOPE_SCHEMA_VERSION = 1;
var FIRST_SEGMENT_EVENT_ENVELOPE_SCHEMA_VERSION = 2;
var SEGMENT_MAX_MESSAGE_BYTES = 32 * 1024;
var SEGMENT_MAX_BATCH_BYTES = 500 * 1024;
var MAX_SEGMENT_MESSAGES_PER_BATCH = 500;
var SEGMENT_MAX_MESSAGE_ID_LENGTH = 100;
var MAX_EVENT_JSON_DEPTH = 32;
var MAX_EVENT_TAGS = 32;
var MAX_EVENT_TAG_LENGTH = 64;
var PERSON_IDENTITY_ANY_OF = [{ required: ["userId"] }, { required: ["anonymousId"] }];
var isoDateTime2 = () => z27.iso.datetime({ offset: true });
var identityKey = () => z27.string().min(1);
var jsonObject = () => z27.record(z27.string(), z27.unknown());
var RevturbineIdentitySourceSchema = z27.enum(["account_primary_contact"]).meta({
  id: "RevturbineIdentitySource",
  "x-revturbine-schema-persistence": Transient21,
  "x-revturbine-schema-exposure": External12
});
var revturbineContextOptionalFields = {
  /** Server-stamped owning tenant. A caller value never chooses tenancy; ingress rejects or reconstructs a conflicting one (TASK-7). */
  tenant_id: identityKey().optional().meta(Unrestricted21),
  /** Environment the producer targets; resolved against the authenticated ingestion context, never used to infer tenancy. */
  environment_id: identityKey().optional().meta(Unrestricted21),
  /** Observation provenance — describes, never authorizes. */
  origin: EventOriginSchema.optional().meta(Unrestricted21),
  /** Caller-declared test traffic (plan 164); default-excluded from analytics denominators. */
  test: z27.boolean().optional().meta(Unrestricted21),
  /** Immutable Playbook version that produced the experience. */
  playbook_version: identityKey().optional().meta(Unrestricted21),
  /** Correlates every event one decision caused. */
  decision_id: identityKey().optional().meta(Unrestricted21),
  /** Request/correlation id — NOT the per-event identity, which is `messageId`. */
  request_id: identityKey().optional().meta(Unrestricted21),
  /** SDK session identifier; existing session privacy classification applies. */
  session_id: identityKey().optional().meta(Pii5),
  tags: z27.array(z27.string().min(1).max(MAX_EVENT_TAG_LENGTH)).max(MAX_EVENT_TAGS).optional().meta(Unrestricted21),
  surface_slot_id: identityKey().optional().meta(Unrestricted21),
  placement_id: identityKey().optional().meta(Unrestricted21),
  payload_id: identityKey().optional().meta(Unrestricted21),
  /** The experiment HANDLE, as today — not a UUID. */
  experiment_id: identityKey().optional().meta(Unrestricted21),
  variant_key: identityKey().optional().meta(Unrestricted21),
  experiment_version_id: identityKey().optional().meta(Unrestricted21),
  /** Simulation provenance; the server validates the simulation tenant/scope. `test: true` alone never authorizes simulation writes. */
  simulation_id: identityKey().optional().meta(Unrestricted21),
  simulation_scenario_id: identityKey().optional().meta(Unrestricted21),
  identity_source: RevturbineIdentitySourceSchema.optional().meta(Unrestricted21)
};
var envelopeVersion = () => z27.number().int().min(FIRST_SEGMENT_EVENT_ENVELOPE_SCHEMA_VERSION).max(EVENT_ENVELOPE_SCHEMA_VERSION);
var RevturbineEventContextSchema = z27.looseObject({
  schema_version: envelopeVersion().optional().meta(Unrestricted21),
  ...revturbineContextOptionalFields
}).meta({
  id: "RevturbineEventContext",
  "x-revturbine-schema-persistence": Transient21,
  "x-revturbine-schema-exposure": External12
});
var RevturbineProducerEventContextSchema = z27.strictObject({
  ...revturbineContextOptionalFields,
  schema_version: z27.literal(EVENT_ENVELOPE_SCHEMA_VERSION).meta(Unrestricted21),
  environment_id: identityKey().meta(Unrestricted21),
  origin: EventOriginSchema.meta(Unrestricted21)
}).meta({
  id: "RevturbineProducerEventContext",
  "x-revturbine-schema-persistence": Transient21,
  "x-revturbine-schema-exposure": External12
});
var RevturbineCanonicalEventContextSchema = z27.looseObject({
  ...revturbineContextOptionalFields,
  schema_version: envelopeVersion().meta(Unrestricted21),
  tenant_id: identityKey().meta(Unrestricted21),
  environment_id: identityKey().meta(Unrestricted21)
}).meta({
  id: "RevturbineCanonicalEventContext",
  "x-revturbine-schema-persistence": Transient21,
  "x-revturbine-schema-exposure": Internal17
});
var SegmentPageContextSchema = z27.looseObject({
  path: z27.string().optional().meta(Unrestricted21),
  referrer: z27.string().optional().meta(Unrestricted21),
  search: z27.string().optional().meta(Unrestricted21),
  title: z27.string().optional().meta(Unrestricted21),
  url: z27.string().optional().meta(Unrestricted21)
}).meta({
  id: "SegmentPageContext",
  "x-revturbine-schema-persistence": Transient21,
  "x-revturbine-schema-exposure": External12
});
var SegmentLibraryContextSchema = z27.looseObject({
  name: z27.string().min(1).optional().meta(Unrestricted21),
  version: z27.string().min(1).optional().meta(Unrestricted21)
}).meta({
  id: "SegmentLibraryContext",
  "x-revturbine-schema-persistence": Transient21,
  "x-revturbine-schema-exposure": External12
});
var segmentContextFields = {
  groupId: identityKey().optional().meta(Unrestricted21),
  traits: jsonObject().optional().meta(Pii5),
  page: SegmentPageContextSchema.optional().meta(Unrestricted21),
  library: SegmentLibraryContextSchema.optional().meta(Unrestricted21),
  ip: z27.string().min(1).optional().meta(Pii5),
  userAgent: z27.string().min(1).optional().meta(Unrestricted21),
  locale: z27.string().min(1).optional().meta(Unrestricted21),
  timezone: z27.string().min(1).optional().meta(Unrestricted21)
};
var SegmentEventContextSchema = z27.looseObject({
  ...segmentContextFields,
  revturbine: RevturbineEventContextSchema.optional().meta(Unrestricted21)
}).meta({
  id: "SegmentEventContext",
  "x-revturbine-schema-persistence": Transient21,
  "x-revturbine-schema-exposure": External12
});
var RevturbineProducerSegmentContextSchema = z27.looseObject({
  ...segmentContextFields,
  revturbine: RevturbineProducerEventContextSchema.meta(Unrestricted21)
}).meta({
  id: "RevturbineProducerSegmentContext",
  "x-revturbine-schema-persistence": Transient21,
  "x-revturbine-schema-exposure": External12
});
var CanonicalSegmentContextSchema = z27.looseObject({
  ...segmentContextFields,
  revturbine: RevturbineCanonicalEventContextSchema.meta(Unrestricted21)
}).meta({
  id: "CanonicalSegmentContext",
  "x-revturbine-schema-persistence": Transient21,
  "x-revturbine-schema-exposure": Internal17
});
function jsonPlainViolation(value, depth = 1) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return void 0;
  if (typeof value === "number") return Number.isFinite(value) ? void 0 : "non-finite number";
  if (depth > MAX_EVENT_JSON_DEPTH) return `nesting deeper than ${MAX_EVENT_JSON_DEPTH}`;
  if (Array.isArray(value)) {
    for (const item of value) {
      const problem = jsonPlainViolation(item, depth + 1);
      if (problem) return problem;
    }
    return void 0;
  }
  if (typeof value === "object") {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) return "non-plain object";
    for (const item of Object.values(value)) {
      if (item === void 0) continue;
      const problem = jsonPlainViolation(item, depth + 1);
      if (problem) return problem;
    }
    return void 0;
  }
  return `${typeof value} is not a JSON value`;
}
function refineMessage(tier) {
  return (message, ctx) => {
    if (!message.userId && !message.anonymousId) {
      ctx.addIssue({
        code: "custom",
        path: ["userId"],
        message: "Segment messages must carry userId, anonymousId, or both"
      });
    }
    const problem = jsonPlainViolation(message);
    if (problem) {
      ctx.addIssue({ code: "custom", path: [], message: `message is not JSON-plain: ${problem}` });
    }
    if (tier !== "input" && message.type === "group" && message.context?.groupId !== void 0 && message.context.groupId !== message.groupId) {
      ctx.addIssue({
        code: "custom",
        path: ["context", "groupId"],
        message: "context.groupId must equal the group call's groupId under the RevTurbine profile"
      });
    }
  };
}
var segmentCommonFields = {
  userId: identityKey().optional().meta(Unrestricted21),
  anonymousId: identityKey().optional().meta(Unrestricted21),
  messageId: z27.string().min(1).max(SEGMENT_MAX_MESSAGE_ID_LENGTH).optional().meta(Unrestricted21),
  /** Captured source-occurrence time. */
  timestamp: isoDateTime2().optional().meta(Unrestricted21),
  /** Send time — never a substitute for `timestamp`. */
  sentAt: isoDateTime2().optional().meta(Unrestricted21),
  /** Trusted receive time; server-owned on the canonical record. */
  receivedAt: isoDateTime2().optional().meta(Unrestricted21),
  originalTimestamp: isoDateTime2().optional().meta(Unrestricted21),
  channel: z27.string().min(1).optional().meta(Unrestricted21),
  integrations: jsonObject().optional().meta(Unrestricted21)
};
var inputCommonFields = {
  ...segmentCommonFields,
  context: SegmentEventContextSchema.optional().meta(Unrestricted21)
};
var producerCommonFields = {
  ...segmentCommonFields,
  messageId: z27.string().min(1).max(SEGMENT_MAX_MESSAGE_ID_LENGTH).meta(Unrestricted21),
  timestamp: isoDateTime2().meta(Unrestricted21),
  context: RevturbineProducerSegmentContextSchema.meta(Unrestricted21)
};
var canonicalCommonFields = {
  ...segmentCommonFields,
  messageId: z27.string().min(1).max(SEGMENT_MAX_MESSAGE_ID_LENGTH).meta(Unrestricted21),
  timestamp: isoDateTime2().meta(Unrestricted21),
  receivedAt: isoDateTime2().meta(Unrestricted21),
  context: CanonicalSegmentContextSchema.meta(Unrestricted21)
};
var trackFields = {
  type: z27.literal("track").meta(Unrestricted21),
  /** Exact canonical event text — preserved verbatim, never normalized or prefixed. */
  event: z27.string().min(1).meta(Unrestricted21),
  properties: jsonObject().optional().meta(Unrestricted21)
};
var identifyFields = {
  type: z27.literal("identify").meta(Unrestricted21),
  traits: jsonObject().optional().meta(Pii5)
};
var groupFields = {
  type: z27.literal("group").meta(Unrestricted21),
  /** The customer account being associated — an analytics association, never RT tenant membership. */
  groupId: identityKey().meta(Unrestricted21),
  traits: jsonObject().optional().meta(Pii5)
};
var pageFields = {
  type: z27.literal("page").meta(Unrestricted21),
  name: z27.string().min(1).optional().meta(Unrestricted21),
  /** Page `category`, where supplied, travels inside `properties`. */
  properties: jsonObject().optional().meta(Unrestricted21)
};
var screenFields = {
  type: z27.literal("screen").meta(Unrestricted21),
  name: z27.string().min(1).optional().meta(Unrestricted21),
  properties: jsonObject().optional().meta(Unrestricted21)
};
var aliasFields = {
  type: z27.literal("alias").meta(Unrestricted21),
  /** The earlier identity being associated. Identity key — hashed in the same domain as `userId`/`anonymousId` at ingress (REQ-8). */
  previousId: identityKey().meta(Unrestricted21)
};
var methodMeta = (id, exposure) => ({
  id,
  "x-revturbine-schema-persistence": Transient21,
  "x-revturbine-schema-exposure": exposure,
  anyOf: PERSON_IDENTITY_ANY_OF
});
var SegmentTrackInputSchema = z27.looseObject({ ...inputCommonFields, ...trackFields }).superRefine(refineMessage("input")).meta(methodMeta("SegmentTrackInput", External12));
var SegmentIdentifyInputSchema = z27.looseObject({ ...inputCommonFields, ...identifyFields }).superRefine(refineMessage("input")).meta(methodMeta("SegmentIdentifyInput", External12));
var SegmentGroupInputSchema = z27.looseObject({ ...inputCommonFields, ...groupFields }).superRefine(refineMessage("input")).meta(methodMeta("SegmentGroupInput", External12));
var SegmentPageInputSchema = z27.looseObject({ ...inputCommonFields, ...pageFields }).superRefine(refineMessage("input")).meta(methodMeta("SegmentPageInput", External12));
var SegmentScreenInputSchema = z27.looseObject({ ...inputCommonFields, ...screenFields }).superRefine(refineMessage("input")).meta(methodMeta("SegmentScreenInput", External12));
var SegmentAliasInputSchema = z27.looseObject({ ...inputCommonFields, ...aliasFields }).superRefine(refineMessage("input")).meta(methodMeta("SegmentAliasInput", External12));
var SegmentEventInputSchema = z27.discriminatedUnion("type", [
  SegmentTrackInputSchema,
  SegmentIdentifyInputSchema,
  SegmentGroupInputSchema,
  SegmentPageInputSchema,
  SegmentScreenInputSchema,
  SegmentAliasInputSchema
]).meta({
  id: "SegmentEventInput",
  "x-revturbine-schema-persistence": Transient21,
  "x-revturbine-schema-exposure": External12
});
var RevturbineProducerTrackEventSchema = z27.looseObject({ ...producerCommonFields, ...trackFields }).superRefine(refineMessage("producer")).meta(methodMeta("RevturbineProducerTrackEvent", External12));
var RevturbineProducerIdentifyEventSchema = z27.looseObject({ ...producerCommonFields, ...identifyFields }).superRefine(refineMessage("producer")).meta(methodMeta("RevturbineProducerIdentifyEvent", External12));
var RevturbineProducerGroupEventSchema = z27.looseObject({ ...producerCommonFields, ...groupFields }).superRefine(refineMessage("producer")).meta(methodMeta("RevturbineProducerGroupEvent", External12));
var RevturbineProducerPageEventSchema = z27.looseObject({ ...producerCommonFields, ...pageFields }).superRefine(refineMessage("producer")).meta(methodMeta("RevturbineProducerPageEvent", External12));
var RevturbineProducerScreenEventSchema = z27.looseObject({ ...producerCommonFields, ...screenFields }).superRefine(refineMessage("producer")).meta(methodMeta("RevturbineProducerScreenEvent", External12));
var RevturbineProducerAliasEventSchema = z27.looseObject({
  ...producerCommonFields,
  ...aliasFields,
  userId: identityKey().meta(Unrestricted21)
}).superRefine(refineMessage("producer")).meta({
  id: "RevturbineProducerAliasEvent",
  "x-revturbine-schema-persistence": Transient21,
  "x-revturbine-schema-exposure": External12
});
var RevturbineProducerEventSchema = z27.discriminatedUnion("type", [
  RevturbineProducerTrackEventSchema,
  RevturbineProducerIdentifyEventSchema,
  RevturbineProducerGroupEventSchema,
  RevturbineProducerPageEventSchema,
  RevturbineProducerScreenEventSchema,
  RevturbineProducerAliasEventSchema
]).meta({
  id: "RevturbineProducerEvent",
  "x-revturbine-schema-persistence": Transient21,
  "x-revturbine-schema-exposure": External12
});
var CanonicalTrackEventSchema = z27.looseObject({ ...canonicalCommonFields, ...trackFields }).superRefine(refineMessage("canonical")).meta(methodMeta("CanonicalTrackEvent", Internal17));
var CanonicalIdentifyEventSchema = z27.looseObject({ ...canonicalCommonFields, ...identifyFields }).superRefine(refineMessage("canonical")).meta(methodMeta("CanonicalIdentifyEvent", Internal17));
var CanonicalGroupEventSchema = z27.looseObject({ ...canonicalCommonFields, ...groupFields }).superRefine(refineMessage("canonical")).meta(methodMeta("CanonicalGroupEvent", Internal17));
var CanonicalPageEventSchema = z27.looseObject({ ...canonicalCommonFields, ...pageFields }).superRefine(refineMessage("canonical")).meta(methodMeta("CanonicalPageEvent", Internal17));
var CanonicalScreenEventSchema = z27.looseObject({ ...canonicalCommonFields, ...screenFields }).superRefine(refineMessage("canonical")).meta(methodMeta("CanonicalScreenEvent", Internal17));
var CanonicalAliasEventSchema = z27.looseObject({ ...canonicalCommonFields, ...aliasFields }).superRefine(refineMessage("canonical")).meta(methodMeta("CanonicalAliasEvent", Internal17));
var CanonicalAnalyticsEventSchema = z27.discriminatedUnion("type", [
  CanonicalTrackEventSchema,
  CanonicalIdentifyEventSchema,
  CanonicalGroupEventSchema,
  CanonicalPageEventSchema,
  CanonicalScreenEventSchema,
  CanonicalAliasEventSchema
]).meta({
  id: "CanonicalAnalyticsEvent",
  "x-revturbine-schema-persistence": Transient21,
  "x-revturbine-schema-exposure": Internal17
});
var SegmentIngestBatchSchema = z27.strictObject({
  batch: z27.array(SegmentEventInputSchema).min(1).max(MAX_SEGMENT_MESSAGES_PER_BATCH).meta(Unrestricted21),
  sentAt: isoDateTime2().optional().meta(Unrestricted21)
}).meta({
  id: "SegmentIngestBatch",
  "x-revturbine-schema-persistence": Transient21,
  "x-revturbine-schema-exposure": External12
});
var SEGMENT_EVENT_METHODS = ["track", "identify", "group", "page", "screen", "alias"];
function classifyTrackIngestBody(body, reader) {
  const floor = reader?.minReadableSchemaVersion ?? MIN_READABLE_EVENT_ENVELOPE_SCHEMA_VERSION;
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { format: "rejected", reason: "unrecognized_body" };
  }
  const hasBatch = Object.prototype.hasOwnProperty.call(body, "batch");
  const hasEvents = Object.prototype.hasOwnProperty.call(body, "events");
  if (hasBatch && hasEvents) return { format: "rejected", reason: "ambiguous_batch_keys" };
  if (hasBatch) return { format: "segment_batch", schemaVersion: EVENT_ENVELOPE_SCHEMA_VERSION };
  if (hasEvents) {
    return LEGACY_TRACK_EVENT_ENVELOPE_SCHEMA_VERSION < floor ? { format: "rejected", reason: "legacy_below_floor" } : { format: "legacy_track_batch", schemaVersion: LEGACY_TRACK_EVENT_ENVELOPE_SCHEMA_VERSION };
  }
  return { format: "rejected", reason: "unrecognized_body" };
}
function liftTrackEventToSegmentInput(event) {
  let properties;
  if (event.properties !== void 0) {
    let parsed2;
    try {
      parsed2 = JSON.parse(event.properties);
    } catch (error) {
      return { ok: false, reason: "properties_not_json_object", detail: error.message };
    }
    if (typeof parsed2 !== "object" || parsed2 === null || Array.isArray(parsed2)) {
      return { ok: false, reason: "properties_not_json_object", detail: `properties parsed to ${Array.isArray(parsed2) ? "array" : typeof parsed2}` };
    }
    properties = parsed2;
  }
  const revturbine = {
    schema_version: EVENT_ENVELOPE_SCHEMA_VERSION,
    environment_id: event.environment_id
  };
  const carried = {
    origin: event.origin,
    test: event.test,
    playbook_version: event.playbook_version,
    decision_id: event.decision_id,
    request_id: event.request_id,
    surface_slot_id: event.surface_slot_id,
    placement_id: event.placement_id,
    payload_id: event.payload_id,
    experiment_id: event.experiment_id,
    variant_key: event.variant_key
  };
  for (const [key, value] of Object.entries(carried)) {
    if (value !== null && value !== void 0) revturbine[key] = value;
  }
  const candidate = {
    type: "track",
    event: event.event_name,
    userId: event.user_id,
    timestamp: event.event_ts,
    context: {
      ...event.account_id !== void 0 ? { groupId: event.account_id } : {},
      revturbine
    }
  };
  if (event.event_id !== null && event.event_id !== void 0) candidate.messageId = event.event_id;
  if (properties !== void 0) candidate.properties = properties;
  const parsed = SegmentTrackInputSchema.safeParse(candidate);
  if (!parsed.success) {
    return { ok: false, reason: "lifted_message_invalid", detail: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  }
  return { ok: true, message: parsed.data };
}

// scaffold/src/customers/models/primary-contact.ts
import { z as z28 } from "zod";
var { Unrestricted: Unrestricted22 } = DataClassification;
var { Transient: Transient22 } = SchemaPersistence;
var { Internal: Internal18 } = SchemaExposure;
var PrimaryContactDesignationSchema = z28.enum(["first_user_default", "explicit"]).meta({
  id: "PrimaryContactDesignation",
  "x-revturbine-schema-persistence": Transient22,
  "x-revturbine-schema-exposure": Internal18
});
var AccountPrimaryContactBindingSchema = z28.strictObject({
  tenant_id: z28.string().min(1).meta(Unrestricted22),
  account_id: z28.string().min(1).meta(Unrestricted22),
  contact_user_id: z28.string().min(1).meta(Unrestricted22),
  designation: PrimaryContactDesignationSchema.meta(Unrestricted22),
  revision: z28.number().int().min(1).meta(Unrestricted22),
  designated_at: z28.iso.datetime({ offset: true }).meta(Unrestricted22)
}).meta({
  id: "AccountPrimaryContactBinding",
  "x-revturbine-schema-persistence": Transient22,
  "x-revturbine-schema-exposure": Internal18
});
var PrimaryContactUnresolvedReasonSchema = z28.enum(["no_binding", "ambiguous_binding", "contact_deleted", "out_of_scope"]).meta({
  id: "PrimaryContactUnresolvedReason",
  "x-revturbine-schema-persistence": Transient22,
  "x-revturbine-schema-exposure": Internal18
});
var PRIMARY_CONTACT_UNRESOLVED_CODE = "primary_contact_unresolved";
var PrimaryContactResolutionSchema = z28.discriminatedUnion("status", [
  z28.strictObject({
    status: z28.literal("resolved").meta(Unrestricted22),
    binding: AccountPrimaryContactBindingSchema.meta(Unrestricted22),
    resolved_at: z28.iso.datetime({ offset: true }).meta(Unrestricted22)
  }),
  z28.strictObject({
    status: z28.literal("unresolved").meta(Unrestricted22),
    code: z28.literal(PRIMARY_CONTACT_UNRESOLVED_CODE).meta(Unrestricted22),
    reason: PrimaryContactUnresolvedReasonSchema.meta(Unrestricted22),
    tenant_id: z28.string().min(1).meta(Unrestricted22),
    account_id: z28.string().min(1).meta(Unrestricted22),
    resolved_at: z28.iso.datetime({ offset: true }).meta(Unrestricted22)
  })
]).meta({
  id: "PrimaryContactResolution",
  "x-revturbine-schema-persistence": Transient22,
  "x-revturbine-schema-exposure": Internal18
});
function resolvePrimaryContact(bindings, scope, resolvedAt) {
  const unresolved = (reason) => ({
    status: "unresolved",
    code: PRIMARY_CONTACT_UNRESOLVED_CODE,
    reason,
    tenant_id: scope.tenant_id,
    account_id: scope.account_id,
    resolved_at: resolvedAt
  });
  const inScope2 = bindings.filter((b) => b.tenant_id === scope.tenant_id && b.account_id === scope.account_id);
  if (inScope2.length === 0) return unresolved("no_binding");
  const newest = Math.max(...inScope2.map((b) => b.revision));
  const atNewest = inScope2.filter((b) => b.revision === newest);
  const contacts = new Set(atNewest.map((b) => b.contact_user_id));
  if (contacts.size > 1) return unresolved("ambiguous_binding");
  return { status: "resolved", binding: atNewest[0], resolved_at: resolvedAt };
}
function applyPrimaryContactEnrichment(message, resolution, authenticatedTenantId) {
  if (message.userId) return { outcome: "preserved", message };
  const fail = (reason) => ({
    outcome: "unresolved",
    code: PRIMARY_CONTACT_UNRESOLVED_CODE,
    reason
  });
  if (resolution.status === "unresolved") return fail(resolution.reason);
  const { binding } = resolution;
  const accountId = message.context?.groupId;
  if (binding.tenant_id !== authenticatedTenantId || accountId === void 0 || binding.account_id !== accountId) {
    return fail("out_of_scope");
  }
  const context = message.context ?? {};
  return {
    outcome: "enriched",
    message: {
      ...message,
      userId: binding.contact_user_id,
      context: {
        ...context,
        revturbine: { ...context.revturbine ?? {}, identity_source: "account_primary_contact" }
      }
    }
  };
}

// scaffold/src/customers/models/billing-accounting.ts
import { z as z29 } from "zod";
var fin2 = { ...DataClassification.Financial, ...ServerOnly };
var ops2 = { ...DataClassification.Operational, ...ServerOnly };
var transient3 = (id) => ({
  id,
  "x-revturbine-schema-persistence": SchemaPersistence.Transient,
  "x-revturbine-schema-exposure": SchemaExposure.Internal
});
var isoDateTime3 = () => z29.iso.datetime({ offset: true });
var providerId3 = () => z29.string().min(1).max(255);
var opaqueId = () => z29.string().min(1).max(128).regex(/^[A-Za-z0-9_.:-]+$/);
var BILLING_ACCOUNTING_CONTRACT_VERSION = 1;
var BILLING_OUTPUT_KEY_PREFIX = "bout1";
var MAX_BILLING_CHECKPOINT_LIST = 250;
function billingSourceScopeKey(source) {
  const seg2 = encodeURIComponent;
  return [
    seg2(source.tenant_id),
    seg2(source.provider),
    seg2(source.account_id),
    source.livemode ? "live" : "test",
    source.simulation_id === void 0 ? "-" : `sim=${seg2(source.simulation_id)}`
  ].join(":");
}
var BillingAccountingRevisionSchema = z29.strictObject({
  revision_version: z29.literal(BILLING_ACCOUNTING_CONTRACT_VERSION).meta(ops2),
  source: BillingSourceScopeSchema.meta(ops2),
  profile: z29.enum(BILLING_PROFILE_NAMES).meta(ops2),
  kind: z29.string().min(1).max(64).meta(ops2),
  occurrence_key: z29.string().min(1).max(512).meta(ops2),
  source_revision: z29.string().min(1).max(255).meta(ops2),
  /** `occurrence_key#rev=<source_revision>` ({@link deriveBillingRevisionKey}). */
  revision_key: z29.string().min(1).max(800).meta(ops2),
  source_order: z29.number().int().min(0).nullable().meta(ops2),
  supersedes_revision: z29.string().min(1).max(255).nullable().meta(ops2),
  effective_at: isoDateTime3().meta(ops2),
  source_recorded_at: isoDateTime3().meta(ops2),
  observed_at: isoDateTime3().meta(ops2),
  /** Whether the observing account owns the movement ({@link billingEconomicOwnership}). */
  economic_ownership: z29.enum(["owner", "non_owner", "unknown"]).meta(ops2),
  legacy_billing_ref: z29.string().min(1).max(512).nullable().meta(ops2),
  /** Digest of the canonical fact bytes: `sha256:<64 hex>`. */
  fact_digest: z29.string().regex(/^sha256:[0-9a-f]{64}$/).meta(ops2)
}).superRefine((row, ctx) => {
  const expected = deriveBillingRevisionKey({ occurrence: { occurrence_key: row.occurrence_key, source_revision: row.source_revision } });
  if (row.revision_key !== expected) {
    ctx.addIssue({ code: "custom", path: ["revision_key"], message: `revision_key must be ${expected}` });
  }
  if (!row.occurrence_key.startsWith(`bo2:${encodeURIComponent(row.source.tenant_id)}:`)) {
    ctx.addIssue({ code: "custom", path: ["occurrence_key"], message: "the occurrence belongs to the row tenant" });
  }
  if (row.supersedes_revision === row.source_revision) {
    ctx.addIssue({ code: "custom", path: ["supersedes_revision"], message: "a revision cannot supersede itself" });
  }
}).meta(transient3("BillingAccountingRevision"));
function billingAccountingRevisionOf(profile, factDigest) {
  return BillingAccountingRevisionSchema.parse({
    revision_version: BILLING_ACCOUNTING_CONTRACT_VERSION,
    source: profile.source,
    profile: profile.profile,
    kind: profile.kind,
    occurrence_key: profile.occurrence.occurrence_key,
    source_revision: profile.occurrence.source_revision,
    revision_key: deriveBillingRevisionKey(profile),
    source_order: profile.occurrence.source_order ?? null,
    supersedes_revision: profile.occurrence.supersedes_revision ?? null,
    effective_at: profile.effective_at,
    source_recorded_at: profile.source_recorded_at,
    observed_at: profile.observed_at,
    economic_ownership: billingEconomicOwnership(profile),
    legacy_billing_ref: profile.occurrence.legacy_billing_ref ?? null,
    fact_digest: factDigest
  });
}
function compareAccountingRevision(stored, incoming) {
  if (stored.revision_key !== incoming.revision_key || stored.source.tenant_id !== incoming.source.tenant_id) return "different_revision";
  return stored.fact_digest === incoming.fact_digest ? "replay" : "conflict";
}
var mappingCommon = {
  mapping_version: z29.literal(BILLING_ACCOUNTING_CONTRACT_VERSION).meta(ops2),
  source: BillingSourceScopeSchema.meta(ops2),
  /** Provider customer id, qualified by `source`. */
  customer_ref: providerId3().meta(fin2),
  /** The RT customer account (`context.groupId`); null = explicitly unmapped from `effective_from`. */
  rt_account_id: z29.string().min(1).max(255).nullable().meta(ops2),
  /** Monotonic per `(source, customer_ref)`. */
  mapping_revision: z29.number().int().min(1).meta(ops2),
  effective_from: isoDateTime3().meta(ops2),
  /** Exclusive end; null = open. */
  effective_to: isoDateTime3().nullable().meta(ops2),
  observed_at: isoDateTime3().meta(ops2),
  supersedes_mapping_revision: z29.number().int().min(1).nullable().meta(ops2)
};
var BillingAccountMappingRevisionSchema = z29.discriminatedUnion("basis", [
  z29.strictObject({ ...mappingCommon, basis: z29.literal("explicit_binding").meta(ops2) }),
  z29.strictObject({ ...mappingCommon, basis: z29.literal("integration_sync").meta(ops2) }),
  z29.strictObject({
    ...mappingCommon,
    basis: z29.literal("approved_correction").meta(ops2),
    correction_generation_id: opaqueId().meta(ops2),
    restatement_reason: z29.enum(["merge", "split", "provider_migration", "reassignment", "error_correction"]).meta(ops2)
  })
]).superRefine((m, ctx) => {
  const fail = (path, message) => ctx.addIssue({ code: "custom", path: [path], message });
  if (m.effective_to !== null && Date.parse(m.effective_to) <= Date.parse(m.effective_from)) {
    fail("effective_to", "the mapping interval [effective_from, effective_to) must be non-empty");
  }
  if (m.supersedes_mapping_revision !== null && m.supersedes_mapping_revision >= m.mapping_revision) {
    fail("supersedes_mapping_revision", "a mapping revision supersedes an earlier revision");
  }
  if (m.basis !== "approved_correction" && m.supersedes_mapping_revision !== null && Date.parse(m.effective_from) < Date.parse(m.observed_at)) {
    fail("effective_from", "only an approved correction may remap history before it was observed");
  }
}).meta(transient3("BillingAccountMappingRevision"));
function resolveBillingAccountMapping(revisions, query) {
  const scope = billingSourceScopeKey(query.source);
  const at = Date.parse(query.effective_at);
  const cutoff = Date.parse(query.observed_cutoff);
  const candidates = revisions.filter(
    (r) => billingSourceScopeKey(r.source) === scope && r.customer_ref === query.customer_ref && Date.parse(r.observed_at) <= cutoff && Date.parse(r.effective_from) <= at && (r.effective_to === null || at < Date.parse(r.effective_to))
  );
  if (candidates.length === 0) return { state: "unmapped", reason: "no_mapping" };
  const top = Math.max(...candidates.map((r) => r.mapping_revision));
  const winners = candidates.filter((r) => r.mapping_revision === top);
  const accounts = new Set(winners.map((r) => r.rt_account_id));
  if (accounts.size > 1) return { state: "ambiguous", mapping_revisions: [top] };
  const account = winners[0].rt_account_id;
  if (account === null) return { state: "unmapped", reason: "explicitly_unmapped" };
  return { state: "mapped", rt_account_id: account, mapping_revision: top };
}
var BILLING_OUTPUT_KINDS = [
  "stock_snapshot",
  "committed_snapshot",
  "receivable_snapshot",
  "movement",
  "collection",
  "allocation"
];
var SNAPSHOT_KINDS = ["stock_snapshot", "committed_snapshot", "receivable_snapshot"];
function deriveBillingOutputKey(input) {
  const seg2 = encodeURIComponent;
  const instant = (value, name) => {
    const ms = Date.parse(value);
    if (!Number.isFinite(ms)) throw new Error(`${name} is not an instant: ${value}`);
    return new Date(ms).toISOString();
  };
  if (!BILLING_OUTPUT_KINDS.includes(input.output_kind)) throw new Error(`unknown output kind ${input.output_kind}`);
  if (!/^[A-Z]{3}$/.test(input.currency)) throw new Error("currency is ISO 4217 upper case");
  const snapshot = SNAPSHOT_KINDS.includes(input.output_kind);
  if (snapshot && input.subject !== void 0) throw new Error(`${input.output_kind} is keyed by instant, not by subject`);
  if (!snapshot && !input.subject) throw new Error(`${input.output_kind} needs the subject it derives from`);
  if (input.output_kind === "committed_snapshot" !== (input.horizon_at !== void 0)) {
    throw new Error("exactly committed snapshots carry a horizon");
  }
  if (input.horizon_at !== void 0 && Date.parse(input.horizon_at) < Date.parse(input.effective_at)) {
    throw new Error("a committed horizon is at or after its projection base");
  }
  const parts = [
    BILLING_OUTPUT_KEY_PREFIX,
    input.output_kind,
    billingSourceScopeKey(input.source),
    input.rt_account_id === null ? "-" : seg2(input.rt_account_id),
    input.currency,
    instant(input.effective_at, "effective_at")
  ];
  if (input.horizon_at !== void 0) parts.push(`h=${instant(input.horizon_at, "horizon_at")}`);
  if (input.subject !== void 0) parts.push(seg2(input.subject));
  return parts.join("|");
}
var BillingOutputRowKeySchema = z29.strictObject({
  tenant_id: z29.string().min(1).meta(ops2),
  policy_version: opaqueId().meta(ops2),
  generation_id: opaqueId().meta(ops2),
  output_kind: z29.enum(BILLING_OUTPUT_KINDS).meta(ops2),
  output_key: z29.string().min(1).max(1500).startsWith(`${BILLING_OUTPUT_KEY_PREFIX}|`).meta(ops2)
}).superRefine((row, ctx) => {
  if (row.output_key.split("|")[1] !== row.output_kind) {
    ctx.addIssue({ code: "custom", path: ["output_key"], message: "the output key names its own kind" });
  }
  if ((row.output_key.split("|")[2] ?? "").split(":")[0] !== encodeURIComponent(row.tenant_id)) {
    ctx.addIssue({ code: "custom", path: ["output_key"], message: "the output key belongs to the row tenant" });
  }
}).meta(transient3("BillingOutputRowKey"));
var BillingGenerationCheckpointSchema = z29.strictObject({
  /** Last revision fully applied; null before the first. */
  cursor_revision_key: z29.string().min(1).max(800).nullable().meta(ops2),
  /** `observed_at` of that revision; null before the first. */
  processed_through: isoDateTime3().nullable().meta(ops2),
  processed_revisions: z29.number().int().min(0).meta(ops2),
  /** True once every revision up to the input watermark is applied. */
  completed: z29.boolean().meta(ops2)
}).meta(transient3("BillingGenerationCheckpoint"));
var BillingReconciliationSchema = z29.discriminatedUnion("state", [
  z29.strictObject({ state: z29.literal("pending").meta(ops2) }),
  z29.strictObject({
    state: z29.literal("passed").meta(ops2),
    checked_at: isoDateTime3().meta(ops2),
    compared_with_generation_id: opaqueId().nullable().meta(ops2),
    unresolved_residuals: z29.number().int().min(0).meta(ops2)
  }),
  z29.strictObject({
    state: z29.literal("failed").meta(ops2),
    checked_at: isoDateTime3().meta(ops2),
    compared_with_generation_id: opaqueId().nullable().meta(ops2),
    failure_codes: z29.array(z29.enum(["stock_equation", "collection_conservation", "allocation_conservation", "receivable_conservation", "source_totals", "shadow_divergence"])).min(1).max(MAX_BILLING_CHECKPOINT_LIST).meta(ops2)
  })
]).meta(transient3("BillingReconciliation"));
var generationCommon = {
  generation_version: z29.literal(BILLING_ACCOUNTING_CONTRACT_VERSION).meta(ops2),
  tenant_id: z29.string().min(1).meta(ops2),
  generation_id: opaqueId().meta(ops2),
  source: BillingSourceScopeSchema.meta(ops2),
  /** The pinned policy set's identity (part of every output row key tuple). */
  policy_version: opaqueId().meta(ops2),
  /** The individual policies it pins, e.g. `{ recognition: 1, movement: 1 }` — compatibility is per dependency (revenue-accounting §9). */
  policy_pins: z29.record(z29.string().regex(/^[a-z][a-z0-9_]{0,63}$/), z29.number().int().min(1)).meta(ops2),
  /** Observation cutoff `k`: only revisions observed at or before it are inputs. */
  input_watermark: isoDateTime3().meta(ops2),
  created_at: isoDateTime3().meta(ops2),
  checkpoint: BillingGenerationCheckpointSchema.meta(ops2)
};
var BillingCompletedGenerationCheckpointSchema = BillingGenerationCheckpointSchema.extend({
  completed: z29.literal(true).meta(ops2)
}).meta(transient3("BillingCompletedGenerationCheckpoint"));
var completedCheckpoint = BillingCompletedGenerationCheckpointSchema;
var passedReconciliation = BillingReconciliationSchema.options[1];
var BillingGenerationSchema = z29.discriminatedUnion("status", [
  z29.strictObject({ ...generationCommon, status: z29.literal("building").meta(ops2), reconciliation: BillingReconciliationSchema.meta(ops2) }),
  z29.strictObject({ ...generationCommon, status: z29.literal("shadow").meta(ops2), reconciliation: BillingReconciliationSchema.meta(ops2) }),
  z29.strictObject({
    ...generationCommon,
    status: z29.literal("active").meta(ops2),
    checkpoint: completedCheckpoint.meta(ops2),
    reconciliation: passedReconciliation.meta(ops2),
    activated_at: isoDateTime3().meta(ops2)
  }),
  z29.strictObject({
    ...generationCommon,
    status: z29.literal("superseded").meta(ops2),
    checkpoint: completedCheckpoint.meta(ops2),
    reconciliation: passedReconciliation.meta(ops2),
    activated_at: isoDateTime3().meta(ops2),
    superseded_at: isoDateTime3().meta(ops2),
    superseded_by_generation_id: opaqueId().meta(ops2)
  }),
  z29.strictObject({
    ...generationCommon,
    status: z29.literal("failed").meta(ops2),
    reconciliation: BillingReconciliationSchema.meta(ops2),
    failure_code: z29.string().min(1).max(128).meta(ops2)
  })
]).superRefine((g, ctx) => {
  const fail = (path, message) => ctx.addIssue({ code: "custom", path: [path], message });
  if (g.source.tenant_id !== g.tenant_id) fail("source", "a generation is scoped to its own tenant");
  const through = g.checkpoint.processed_through;
  if (through !== null && Date.parse(through) > Date.parse(g.input_watermark)) {
    fail("checkpoint", "a checkpoint never passes the input watermark");
  }
  if (g.checkpoint.cursor_revision_key === null !== (g.checkpoint.processed_revisions === 0)) {
    fail("checkpoint", "the cursor is null exactly when nothing has been processed");
  }
  if (g.status === "superseded" && g.superseded_by_generation_id === g.generation_id) {
    fail("superseded_by_generation_id", "a generation is superseded by a different generation");
  }
}).meta(transient3("BillingGeneration"));
function canActivateBillingGeneration(generation) {
  if (generation.status !== "shadow") return { ok: false, reason: "not_shadow" };
  if (!generation.checkpoint.completed) return { ok: false, reason: "checkpoint_incomplete" };
  if (generation.reconciliation.state === "pending") return { ok: false, reason: "reconciliation_pending" };
  if (generation.reconciliation.state === "failed") return { ok: false, reason: "reconciliation_failed" };
  return { ok: true };
}
var BILLING_COVERAGE_FAMILIES = [
  "subscription_stock",
  "movement_history",
  "schedule_phases",
  "invoices",
  "invoice_payments",
  "payments",
  "adjustments",
  "balances",
  "losses",
  "receivables",
  "account_mappings",
  "cohort_membership"
];
var BillingOpeningSeedSchema = z29.strictObject({
  as_of: isoDateTime3().meta(ops2),
  basis: z29.enum(["imported_opening_balance", "verified_snapshot"]).meta(ops2)
}).meta(transient3("BillingOpeningSeed"));
var BillingCoverageGapReasonSchema = z29.enum(["partial_hydration", "missing_history", "ambiguous_revision", "missing_price_terms", "unmapped_customer", "missing_linkage", "missing_ownership", "provider_error", "retention_window"]).meta(transient3("BillingCoverageGapReason"));
var BillingCoverageUnavailableReasonSchema = z29.enum(["uninitialized", "not_connected", "hydration_in_progress", "history_unavailable", "provider_error"]).meta(transient3("BillingCoverageUnavailableReason"));
var BillingCoverageGapRangeSchema = z29.strictObject({
  from: isoDateTime3().meta(ops2),
  to: isoDateTime3().nullable().meta(ops2),
  reason: BillingCoverageGapReasonSchema.meta(ops2)
}).meta(transient3("BillingCoverageGapRange"));
var coverageCommon = {
  checkpoint_version: z29.literal(BILLING_ACCOUNTING_CONTRACT_VERSION).meta(ops2),
  source: BillingSourceScopeSchema.meta(ops2),
  /** Null = the whole source scope; else one RT account. */
  rt_account_id: z29.string().min(1).max(255).nullable().meta(ops2),
  family: z29.enum(BILLING_COVERAGE_FAMILIES).meta(ops2),
  recorded_at: isoDateTime3().meta(ops2)
};
var BillingCoverageCheckpointSchema = z29.discriminatedUnion("state", [
  z29.strictObject({
    ...coverageCommon,
    state: z29.literal("complete").meta(ops2),
    /** Complete coverage starts here; earlier history is outside it, not zero. */
    earliest_complete_at: isoDateTime3().meta(ops2),
    /** Observation watermark the family is complete through. */
    covered_through: isoDateTime3().meta(ops2),
    opening_seed: BillingOpeningSeedSchema.nullable().meta(ops2)
  }),
  z29.strictObject({
    ...coverageCommon,
    state: z29.literal("partial").meta(ops2),
    earliest_complete_at: isoDateTime3().nullable().meta(ops2),
    covered_through: isoDateTime3().meta(ops2),
    opening_seed: BillingOpeningSeedSchema.nullable().meta(ops2),
    gaps: z29.array(BillingCoverageGapRangeSchema).min(1).max(MAX_BILLING_CHECKPOINT_LIST).meta(ops2)
  }),
  z29.strictObject({
    ...coverageCommon,
    state: z29.literal("unavailable").meta(ops2),
    reason: BillingCoverageUnavailableReasonSchema.meta(ops2),
    last_observed_at: isoDateTime3().nullable().meta(ops2)
  })
]).superRefine((c, ctx) => {
  const fail = (path, message) => ctx.addIssue({ code: "custom", path: [path], message });
  if (c.state !== "unavailable" && c.earliest_complete_at !== null && Date.parse(c.covered_through) < Date.parse(c.earliest_complete_at)) {
    fail("covered_through", "coverage cannot end before it begins");
  }
  if (c.state !== "unavailable" && c.opening_seed !== null && c.earliest_complete_at !== null && c.opening_seed.as_of !== c.earliest_complete_at) {
    fail("opening_seed", "an opening seed sits exactly where complete coverage begins");
  }
  if (c.state === "partial") {
    c.gaps.forEach((gap, i) => {
      if (gap.to !== null && Date.parse(gap.to) <= Date.parse(gap.from)) {
        ctx.addIssue({ code: "custom", path: ["gaps", i, "to"], message: "a gap [from, to) is non-empty" });
      }
    });
  }
}).meta(transient3("BillingCoverageCheckpoint"));
function summarizeInvoicePaymentAllocations(profiles) {
  const { occurrences, ambiguous } = collapseBillingRevisions(profiles);
  const facts = [...occurrences.values()];
  const payments = /* @__PURE__ */ new Map();
  const invoices = /* @__PURE__ */ new Map();
  const collections = /* @__PURE__ */ new Map();
  const nonOwner = [];
  const paymentEntry = (scope, paymentId, currency) => {
    const key = `${scope}|${paymentId}`;
    let entry = payments.get(key);
    if (!entry) {
      entry = { scope, payment_id: paymentId, currency, captured_minor: null, allocated_minor: "0", unapplied_minor: null, allocations_coverage: "unknown" };
      payments.set(key, entry);
    }
    return entry;
  };
  const invoiceEntry = (scope, invoiceId, currency) => {
    const key = `${scope}|${invoiceId}`;
    let entry = invoices.get(key);
    if (!entry) {
      entry = { scope, invoice_id: invoiceId, currency, allocated_from_payments_minor: "0", out_of_band_minor: "0", payments_coverage: "unknown" };
      invoices.set(key, entry);
    }
    return entry;
  };
  const add = (a, b) => (BigInt(a) + BigInt(b)).toString();
  for (const fact of facts) {
    const scope = billingSourceScopeKey(fact.source);
    if (fact.profile === "transaction" && fact.kind === "payment_captured") {
      if (billingEconomicOwnership(fact) === "non_owner") {
        nonOwner.push(fact.payment_id);
        continue;
      }
      const entry = paymentEntry(scope, fact.payment_id, fact.currency);
      entry.captured_minor = fact.amount_captured_minor;
      entry.allocations_coverage = fact.allocations_coverage ?? "unknown";
      collections.set(fact.currency, (collections.get(fact.currency) ?? 0n) + BigInt(fact.amount_captured_minor));
    } else if (fact.profile === "invoice" && fact.kind === "payment_allocation" && fact.status === "paid" && fact.amount_paid_minor !== null) {
      const invoice = invoiceEntry(scope, fact.invoice_id, fact.currency);
      if (fact.payment.type === "out_of_band") {
        invoice.out_of_band_minor = add(invoice.out_of_band_minor, fact.amount_paid_minor);
      } else {
        invoice.allocated_from_payments_minor = add(invoice.allocated_from_payments_minor, fact.amount_paid_minor);
        const payment = paymentEntry(scope, fact.payment.payment_id, fact.currency);
        payment.allocated_minor = add(payment.allocated_minor, fact.amount_paid_minor);
      }
    } else if (fact.profile === "invoice" && fact.kind === "finalized" && fact.payments_coverage !== void 0) {
      invoiceEntry(scope, fact.invoice_id, fact.currency).payments_coverage = fact.payments_coverage;
    }
  }
  const overAllocated = [];
  for (const entry of payments.values()) {
    if (entry.captured_minor === null) continue;
    if (BigInt(entry.allocated_minor) > BigInt(entry.captured_minor)) {
      overAllocated.push({ scope: entry.scope, payment_id: entry.payment_id });
    } else if (entry.allocations_coverage === "complete") {
      entry.unapplied_minor = (BigInt(entry.captured_minor) - BigInt(entry.allocated_minor)).toString();
    }
  }
  const byKey = (a, b, id) => `${a.scope}|${String(a[id])}`.localeCompare(`${b.scope}|${String(b[id])}`);
  return {
    payments: [...payments.values()].sort((a, b) => byKey(a, b, "payment_id")),
    invoices: [...invoices.values()].sort((a, b) => byKey(a, b, "invoice_id")),
    collections_minor: Object.fromEntries([...collections.entries()].sort().map(([c, v]) => [c, v.toString()])),
    over_allocated: overAllocated,
    ambiguous,
    non_owner_payment_ids: nonOwner.sort()
  };
}

// scaffold/src/events/models/b2b-semantics.ts
import { z as z30 } from "zod";
var { Unrestricted: Unrestricted23, Pii: Pii6 } = DataClassification;
var external = (id) => ({
  id,
  "x-revturbine-schema-persistence": SchemaPersistence.Transient,
  "x-revturbine-schema-exposure": SchemaExposure.External
});
var B2B_SEMANTIC_MAP_VERSION = 1;
var B2B_SEGMENT_EVENT_NAMES = [
  "Account Created",
  "Account Deleted",
  "Signed Up",
  "Signed In",
  "Signed Out",
  "Invite Sent",
  "Account Added User",
  "Account Removed User",
  "Trial Started",
  "Trial Ended"
];
var B2BSegmentEventNameSchema = z30.enum(B2B_SEGMENT_EVENT_NAMES).meta(external("B2BSegmentEventName"));
var B2B_INPUT_SYNONYMS = {
  "User Signed Up": "Signed Up",
  "User Signed In": "Signed In",
  "User Signed Out": "Signed Out"
};
function canonicalB2BEventName(event) {
  if (B2B_SEGMENT_EVENT_NAMES.includes(event)) return event;
  return B2B_INPUT_SYNONYMS[event];
}
var isoDateTime4 = () => z30.iso.datetime({ offset: true });
var optText = (classification) => z30.string().min(1).optional().meta(classification);
var B2B_TRIAL_OUTCOMES = ["converted", "expired", "reverted", "revoked"];
var segmentProperties = {
  "Account Created": { account_name: optText(Pii6) },
  "Account Deleted": { account_name: optText(Pii6) },
  "Signed Up": {
    type: optText(Unrestricted23),
    first_name: optText(Pii6),
    last_name: optText(Pii6),
    email: optText(Pii6),
    phone: optText(Pii6),
    username: optText(Pii6),
    title: optText(Unrestricted23)
  },
  "Signed In": { username: optText(Pii6) },
  "Signed Out": { username: optText(Pii6) },
  "Invite Sent": {
    invitee_email: optText(Pii6),
    invitee_first_name: optText(Pii6),
    invitee_last_name: optText(Pii6),
    invitee_role: optText(Unrestricted23)
  },
  "Account Added User": { role: optText(Unrestricted23) },
  "Account Removed User": {},
  "Trial Started": {
    trial_start_date: isoDateTime4().optional().meta(Unrestricted23),
    trial_end_date: isoDateTime4().optional().meta(Unrestricted23),
    trial_plan_name: optText(Unrestricted23)
  },
  "Trial Ended": {
    trial_start_date: isoDateTime4().optional().meta(Unrestricted23),
    trial_end_date: isoDateTime4().optional().meta(Unrestricted23),
    trial_plan_name: optText(Unrestricted23),
    trial_outcome: z30.enum(B2B_TRIAL_OUTCOMES).optional().meta(Unrestricted23)
  }
};
var B2B_RT_REQUIRED_PROPERTIES = {
  "Account Created": [],
  "Account Deleted": [],
  "Signed Up": [],
  "Signed In": [],
  "Signed Out": [],
  "Invite Sent": [],
  "Account Added User": [],
  "Account Removed User": [],
  "Trial Started": ["trial_start_date", "trial_end_date", "trial_plan_name"],
  "Trial Ended": ["trial_start_date", "trial_end_date", "trial_plan_name", "trial_outcome"]
};
var B2B_PII_PROPERTIES = Object.fromEntries(
  B2B_SEGMENT_EVENT_NAMES.map((name) => [
    name,
    Object.entries(segmentProperties[name]).filter(([, schema]) => schema.meta()?.["x-revturbine-data-classification"] === "pii").map(([key]) => key)
  ])
);
var PERSON_IDENTITY_ANY_OF2 = [{ required: ["userId"] }, { required: ["anonymousId"] }];
var envelopeFields = {
  type: z30.literal("track").meta(Unrestricted23),
  userId: z30.string().min(1).optional().meta(Unrestricted23),
  anonymousId: z30.string().min(1).optional().meta(Unrestricted23),
  messageId: z30.string().min(1).max(100).optional().meta(Unrestricted23),
  timestamp: isoDateTime4().optional().meta(Unrestricted23)
};
var trialOrder = (properties, ctx) => {
  const start = properties?.trial_start_date;
  const end = properties?.trial_end_date;
  if (typeof start === "string" && typeof end === "string" && Date.parse(end) < Date.parse(start)) {
    ctx.addIssue({ code: "custom", path: ["properties", "trial_end_date"], message: "trial_end_date precedes trial_start_date" });
  }
};
var personIdentity = (message, ctx) => {
  if (!message.userId && !message.anonymousId) {
    ctx.addIssue({ code: "custom", path: ["userId"], message: "Segment messages must carry userId, anonymousId, or both" });
  }
};
function segmentMember(name) {
  return z30.looseObject({
    ...envelopeFields,
    event: z30.literal(name).meta(Unrestricted23),
    context: z30.looseObject({ groupId: z30.string().min(1).optional().meta(Unrestricted23) }).optional().meta(Unrestricted23),
    properties: z30.looseObject(segmentProperties[name]).optional().meta(Unrestricted23)
  }).meta({ anyOf: PERSON_IDENTITY_ANY_OF2 });
}
function rtMember(name) {
  const required = new Set(B2B_RT_REQUIRED_PROPERTIES[name]);
  const props = Object.fromEntries(
    Object.entries(segmentProperties[name]).map(([key, schema]) => [
      key,
      required.has(key) ? schema.unwrap().meta(schema.meta() ?? {}) : schema
    ])
  );
  return z30.looseObject({
    ...envelopeFields,
    event: z30.literal(name).meta(Unrestricted23),
    /** The owned B2B profile requires a real account association. */
    context: z30.looseObject({ groupId: z30.string().min(1).meta(Unrestricted23) }).meta(Unrestricted23),
    properties: (required.size > 0 ? z30.looseObject(props) : z30.looseObject(props).optional()).meta(Unrestricted23)
  }).meta({ anyOf: PERSON_IDENTITY_ANY_OF2 });
}
var refineB2B = (message, ctx) => {
  personIdentity(message, ctx);
  trialOrder(message.properties, ctx);
};
var SegmentB2BTrackEventSchema = z30.discriminatedUnion("event", B2B_SEGMENT_EVENT_NAMES.map(segmentMember)).superRefine(refineB2B).meta(external("SegmentB2BTrackEvent"));
var RevturbineB2BTrackEventSchema = z30.discriminatedUnion("event", B2B_SEGMENT_EVENT_NAMES.map(rtMember)).superRefine(refineB2B).meta(external("RevturbineB2BTrackEvent"));
var issueText = (error) => error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`);
function validateB2BTrack(message, profile = "revturbine") {
  const event = message?.event;
  if (typeof event !== "string" || canonicalB2BEventName(event) !== event) return { ok: false, reason: "not_b2b_event" };
  const segment = SegmentB2BTrackEventSchema.safeParse(message);
  if (!segment.success) return { ok: false, reason: "segment_violation", issues: issueText(segment.error) };
  if (profile === "segment") return { ok: true, profile, event };
  const rt = RevturbineB2BTrackEventSchema.safeParse(message);
  if (!rt.success) return { ok: false, reason: "rt_requirement", event, issues: issueText(rt.error) };
  return { ok: true, profile, event };
}
var B2B_SOURCE_MAPPINGS = [
  { source_event: "account_created", b2b_event: "Account Created", derivation_discriminator: "b2b:account_created", note: "Registered customer account creation (plan 276 REQ-3 evidence when carried)." },
  { source_event: "user_signed_up", b2b_event: "Signed Up", derivation_discriminator: "b2b:signed_up", note: "Customer-product signup, organic or invited." },
  { source_event: "web_signed_up", b2b_event: "Signed Up", derivation_discriminator: "b2b:signed_up", note: "Dogfood control-plane signup via the web app (RevTurbine is the customer account)." },
  { source_event: "cli_signed_up", b2b_event: "Signed Up", derivation_discriminator: "b2b:signed_up", note: "Dogfood control-plane signup via the CLI device flow." },
  { source_event: "web_signed_in", b2b_event: "Signed In", derivation_discriminator: "b2b:signed_in", note: "Dogfood control-plane sign-in via the web app." },
  { source_event: "cli_signed_in", b2b_event: "Signed In", derivation_discriminator: "b2b:signed_in", note: "Dogfood control-plane CLI authentication." },
  { source_event: "trial_started", b2b_event: "Trial Started", derivation_discriminator: "b2b:trial_started", note: "Provider-derived trial grant (plan 228 R-2 billing band)." },
  { source_event: "trial_converted", b2b_event: "Trial Ended", trial_outcome: "converted", derivation_discriminator: "b2b:trial_ended", note: "Provider-derived conversion ends the trial; the conversion/payment fact stays separate." },
  { source_event: "trial_expired", b2b_event: "Trial Ended", trial_outcome: "expired", derivation_discriminator: "b2b:trial_ended", note: "Provider-derived expiry." },
  { source_event: "trial_revision", b2b_event: "Trial Started", when: { field: "revision", equals: ["started"] }, derivation_discriminator: "b2b:trial_started", note: "App-owned trial episode start (plan 276 R-1(b))." },
  { source_event: "trial_revision", b2b_event: "Trial Ended", when: { field: "revision", equals: ["converted"] }, trial_outcome: "converted", derivation_discriminator: "b2b:trial_ended", note: "App-owned episode conversion." },
  { source_event: "trial_revision", b2b_event: "Trial Ended", when: { field: "revision", equals: ["expired"] }, trial_outcome: "expired", derivation_discriminator: "b2b:trial_ended", note: "App-owned episode expiry, evidenced (never the clock, R-1(c))." },
  { source_event: "trial_revision", b2b_event: "Trial Ended", when: { field: "revision", equals: ["reverted"] }, trial_outcome: "reverted", derivation_discriminator: "b2b:trial_ended", note: "App-owned reverse-trial reversion." },
  { source_event: "trial_revision", b2b_event: "Trial Ended", when: { field: "revision", equals: ["revoked"] }, trial_outcome: "revoked", derivation_discriminator: "b2b:trial_ended", note: "App-owned episode revocation." }
];
var B2B_NON_AUTHORITATIVE_OBSERVATIONS = [
  "clickstream_trial_expired",
  "trial_midpoint",
  "trial_expiring"
];
var B2B_PENDING_PRODUCERS = {
  "Account Deleted": "TASK-17 \u2014 instrument only if a supported account-deletion transition exists; otherwise declared unsupported.",
  "Signed Out": "TASK-16 \u2014 capture the prior identity before the SDK/adapter reset.",
  "Invite Sent": "TASK-17 \u2014 after the invitation is committed/sent.",
  "Account Added User": "TASK-17 \u2014 after membership addition / invite acceptance.",
  "Account Removed User": "TASK-17 \u2014 after membership removal, capturing user/account first."
};
var EXCLUDED_SURFACE_NAMES = /* @__PURE__ */ new Set(["sdk_init", "sdk_error", "sdk_validation_warning", "resolution_failure"]);
function classifyTaxonomyEvent(name) {
  if (!PLATFORM_EVENT_TAXONOMY.events.some((e) => e.name === name)) return void 0;
  if (EXCLUDED_SURFACE_NAMES.has(name)) return "excluded";
  if (B2B_SOURCE_MAPPINGS.some((m) => m.source_event === name)) return "standard";
  return "custom";
}
function deriveB2BEvent(sourceEvent, payload = {}) {
  const mapping = B2B_SOURCE_MAPPINGS.find(
    (m) => m.source_event === sourceEvent && (!m.when || m.when.equals.includes(String(payload[m.when.field])))
  );
  if (!mapping) return void 0;
  return {
    b2b_event: mapping.b2b_event,
    derivation_discriminator: mapping.derivation_discriminator,
    ...mapping.trial_outcome ? { trial_outcome: mapping.trial_outcome } : {}
  };
}
function buildB2BMappingReport() {
  return {
    map_version: B2B_SEMANTIC_MAP_VERSION,
    taxonomy_version: PLATFORM_EVENT_TAXONOMY.version,
    events: B2B_SEGMENT_EVENT_NAMES.map((name) => {
      const sources = [...new Set(B2B_SOURCE_MAPPINGS.filter((m) => m.b2b_event === name).map((m) => m.source_event))].sort();
      const pending2 = B2B_PENDING_PRODUCERS[name];
      return pending2 ? { b2b_event: name, sources, pending: pending2 } : { b2b_event: name, sources };
    }),
    classification: PLATFORM_EVENT_TAXONOMY.events.map((e) => ({ event: e.name, class: classifyTaxonomyEvent(e.name) })).sort((a, b) => a.event < b.event ? -1 : a.event > b.event ? 1 : 0),
    non_authoritative: B2B_NON_AUTHORITATIVE_OBSERVATIONS.map((event) => ({
      event,
      maps_to: deriveB2BEvent(event)?.b2b_event ?? null
    }))
  };
}

// scaffold/src/events/models/webhook-delivery.ts
import { z as z31 } from "zod";
var privateField2 = { ...DataClassification.Operational, ...ServerOnly, readOnly: true };
var privatePayload = { ...DataClassification.Financial, ...ServerOnly, readOnly: true };
var transient4 = (id) => ({
  id,
  "x-revturbine-schema-persistence": SchemaPersistence.Transient,
  "x-revturbine-schema-exposure": SchemaExposure.Internal
});
var optionalTime2 = () => z31.string().datetime().nullable().optional().meta(privateField2);
var attempts = () => z31.number().int().min(0).default(0).meta(privateField2);
var WebhookReplayEnvelopeSchema = z31.object({
  version: z31.literal(1).meta(privateField2),
  payload_style: z31.enum(["snapshot", "thin_normalized"]).meta(privateField2),
  event: z31.object({
    id: z31.string().min(1).meta(privateField2),
    type: z31.string().min(1).meta(privateField2),
    created: z31.number().int().min(0).meta(privateField2),
    account: z31.string().min(1).nullable().optional().meta(privateField2),
    context: z31.string().min(1).nullable().optional().meta(privateField2),
    api_version: z31.string().min(1).nullable().optional().meta(privateField2),
    livemode: z31.boolean().optional().meta(privateField2),
    data: z31.object({
      object: z31.record(z31.string(), z31.unknown()).meta(privatePayload),
      previous_attributes: z31.record(z31.string(), z31.unknown()).optional().meta(privatePayload)
    }).strict().meta(privatePayload)
  }).strict().meta(privatePayload)
}).strict().meta(transient4("WebhookReplayEnvelope"));
var WebhookProcessingStatusSchema = z31.enum([
  "unknown",
  "pending",
  "processing",
  "completed",
  "failed",
  "terminal",
  "not_required"
]).meta(transient4("WebhookProcessingStatus"));
var WebhookDispatchStatusSchema = z31.enum([
  "unknown",
  "pending",
  "dispatching",
  "ambiguous",
  "accepted",
  "failed",
  "terminal",
  "not_required"
]).meta(transient4("WebhookDispatchStatus"));
var WebhookDeliverySchema = IdField.merge(TenantIdField).merge(TimestampFields).extend({
  receipt_version: z31.literal(1).meta(privateField2),
  event_id: z31.string().min(1).meta(privateField2),
  event_type: z31.string().min(1).meta(privateField2),
  source: WebhookEventSourceSchema.meta(privateField2),
  received_at: z31.string().datetime().meta(privateField2),
  envelope_status: z31.enum(["legacy_incomplete", "complete"]).default("legacy_incomplete").meta(privateField2),
  envelope: WebhookReplayEnvelopeSchema.nullable().optional().meta(privatePayload),
  processing_status: WebhookProcessingStatusSchema.default("unknown").meta(privateField2),
  dispatch_status: WebhookDispatchStatusSchema.default("unknown").meta(privateField2),
  downstream_status: WebhookProcessingStatusSchema.default("unknown").meta(privateField2),
  processing_attempts: attempts(),
  dispatch_attempts: attempts(),
  downstream_attempts: attempts(),
  next_attempt_at: optionalTime2(),
  lease_stage: z31.enum(["processing", "dispatch", "downstream"]).nullable().optional().meta(privateField2),
  lease_token: z31.string().min(1).max(200).nullable().optional().meta(privateField2),
  lease_generation: z31.number().int().min(0).default(0).meta(privateField2),
  lease_expires_at: optionalTime2(),
  processing_completed_at: optionalTime2(),
  dispatch_accepted_at: optionalTime2(),
  downstream_completed_at: optionalTime2(),
  terminal_at: optionalTime2(),
  last_error_code: z31.string().min(1).max(128).nullable().optional().meta(privateField2),
  last_error_message: z31.string().max(1e3).nullable().optional().describe("Sanitized diagnostic only; exclude credentials, headers and provider payloads.").meta(privateField2),
  effect_checkpoints: z31.record(z31.string().min(1).max(100), z31.string().datetime()).default({}).meta(privateField2),
  replay_count: attempts(),
  last_replayed_at: optionalTime2()
}).strict().superRefine((receipt, ctx) => {
  const fail = (field2, message) => ctx.addIssue({ code: "custom", path: [field2], message });
  const statuses = [receipt.processing_status, receipt.dispatch_status, receipt.downstream_status];
  const lease = [receipt.lease_stage, receipt.lease_token, receipt.lease_expires_at];
  const hasLease = lease.some((value) => value != null);
  if (hasLease && (lease.some((value) => value == null) || receipt.lease_generation < 1)) {
    fail("lease_token", "An active lease requires stage, token, expiry and a positive fencing generation.");
  }
  const leaseHoldingStages = [
    ["processing", receipt.processing_status === "processing", receipt.processing_attempts],
    ["dispatch", ["dispatching", "ambiguous"].includes(receipt.dispatch_status), receipt.dispatch_attempts],
    ["downstream", receipt.downstream_status === "processing", receipt.downstream_attempts]
  ];
  for (const [stage, holds, count] of leaseHoldingStages) {
    if (holds && (!hasLease || receipt.lease_stage !== stage || count < 1)) {
      fail("lease_stage", "In-flight or unresolved work requires its own fenced lease and positive attempt count.");
    }
    if (hasLease && receipt.lease_stage === stage && (!holds || statuses.includes("terminal"))) {
      fail("lease_stage", "A lease cannot own inactive, completed or terminal work.");
    }
  }
  if (receipt.envelope_status === "legacy_incomplete") {
    if (receipt.envelope != null || statuses.some((status) => status !== "unknown")) {
      fail("envelope_status", "Legacy evidence has no replay envelope or verified processing/delivery status.");
    }
    if (hasLease || receipt.next_attempt_at != null || receipt.processing_attempts || receipt.dispatch_attempts || receipt.downstream_attempts || receipt.replay_count || receipt.lease_generation || Object.keys(receipt.effect_checkpoints).length || receipt.last_replayed_at != null) {
      fail("envelope_status", "Incomplete legacy evidence cannot be leased, retried or replayed.");
    }
  } else {
    if (!receipt.envelope) fail("envelope", "Complete receipts require a captured replay envelope.");
    if (statuses.includes("unknown")) fail("envelope_status", "Complete receipts require explicit stage states.");
    if (receipt.envelope && (receipt.envelope.event.id !== receipt.event_id || receipt.envelope.event.type !== receipt.event_type)) {
      fail("envelope", "Replay identity and type must match the receipt.");
    }
  }
  const completions = [
    ["processing_completed_at", receipt.processing_status === "completed", receipt.processing_completed_at],
    ["dispatch_accepted_at", receipt.dispatch_status === "accepted", receipt.dispatch_accepted_at],
    ["downstream_completed_at", receipt.downstream_status === "completed", receipt.downstream_completed_at],
    ["terminal_at", statuses.includes("terminal"), receipt.terminal_at]
  ];
  for (const [field2, complete, time] of completions) {
    if (complete !== (time != null)) fail(field2, "Completion/terminal timestamps must agree with the recorded stage status.");
  }
  if (["dispatching", "ambiguous", "accepted"].includes(receipt.dispatch_status) && !["completed", "not_required"].includes(receipt.processing_status)) {
    fail("dispatch_status", "Dispatch follows completed or explicitly unnecessary business processing.");
  }
  if (["processing", "completed", "failed", "terminal"].includes(receipt.downstream_status) && receipt.dispatch_status !== "accepted") {
    fail("downstream_status", "Downstream execution requires accepted dispatch.");
  }
  if (receipt.next_attempt_at != null && statuses.includes("terminal")) {
    fail("next_attempt_at", "Terminal work requires explicit operator replay, not an automatic retry time.");
  }
}).meta({
  id: "WebhookDelivery",
  "x-revturbine-schema-persistence": SchemaPersistence.Persisted,
  "x-revturbine-schema-exposure": SchemaExposure.Internal,
  ...schemaFacets(SchemaContext.EventIngestion, { sdkInput: false, source: SchemaSource.Runtime }),
  "x-revturbine-persistence": {
    table: "webhookDelivery",
    uniqueBy: ["tenant_id", "event_id"],
    indexes: [["processing_status", "next_attempt_at"], ["dispatch_status", "next_attempt_at"], ["lease_expires_at"]]
  }
});

// scaffold/src/trials/models/schema.ts
import { z as z32 } from "zod";
var { Unrestricted: Unrestricted24 } = DataClassification;
var { Persisted: Persisted13, Transient: Transient23 } = SchemaPersistence;
var { Internal: Internal19 } = SchemaExposure;
var PLAYBOOK_SDK_FACETS6 = schemaFacets(SchemaContext.Playbook, { sdkInput: true });
var PENDING_PLAYBOOK_SDK_FACETS2 = schemaFacets(SchemaContext.Playbook, {
  inConfig: false,
  sdkInput: true
});
var TrialStatusSchema = z32.enum(["not_started", "active", "expired", "converted", "cancelled"]).meta(
  { id: "TrialStatus", "x-revturbine-schema-persistence": Transient23, "x-revturbine-schema-exposure": Internal19 }
);
var TrialLimitTypeSchema = z32.enum(["time", "usage"]).meta(
  { id: "TrialLimitType", "x-revturbine-schema-persistence": Transient23, "x-revturbine-schema-exposure": Internal19 }
);
var FreeTrialRuleCoreFieldsSchema = z32.object({
  name: NameField.meta(Unrestricted24),
  handle: HandleField.meta(Unrestricted24),
  // plan_id null = "All plans" — see plans-entitlements-studio-ui.md §2.4.1.
  plan_id: z32.string().nullable().optional().meta(Unrestricted24),
  segment_id: z32.string().nullable().optional().meta(Unrestricted24),
  // Defaults to 'time' so every pre-existing rule keeps its current
  // duration-based semantics. Set to 'usage' to scope the trial by
  // consumption of `usage_entitlement_handle` up to
  // `usage_limit_value`; the time fields below are then ignored.
  trial_limit_type: TrialLimitTypeSchema.default("time").meta(Unrestricted24),
  // Time-based: rule is skipped at runtime when null/blank. The
  // Default Trial Length global was removed (no fallback exists).
  duration_days: z32.number().int().min(1).max(365).nullable().optional().meta(Unrestricted24),
  grace_period_days: z32.number().int().min(0).default(0).meta(Unrestricted24),
  // Usage-based: the entitlement whose consumption gates the trial,
  // and the cap. Both required when `trial_limit_type === 'usage'`;
  // otherwise ignored. Cross-field validation is done at the API
  // boundary (web app's POST handler) rather than here so partial
  // drafts stay round-trippable.
  usage_entitlement_handle: z32.string().min(1).optional().meta(Unrestricted24),
  usage_limit_value: z32.number().int().min(1).optional().meta(Unrestricted24),
  require_payment_method: z32.boolean().default(false).meta(Unrestricted24),
  auto_convert: z32.boolean().default(true).meta(Unrestricted24),
  /**
   * Post-trial destination plans. At end of trial the control plane
   * places the user on either:
   *   - `convert_to_plan_id` — typically a PAID plan; the user must
   *     already have a payment method on file (require_payment_method
   *     usually implies this). Used when `auto_convert: true` AND
   *     the user has met any conversion preconditions.
   *   - `fallback_plan_id` — typically a FREE plan (the company's
   *     Free tier or equivalent "no plan"). Used when the user did
   *     not convert (auto_convert: false, missing payment method,
   *     declined upsell, etc.). When unset the user reverts to
   *     "no plan" / pre-trial state.
   */
  convert_to_plan_id: z32.string().optional().meta(Unrestricted24),
  fallback_plan_id: z32.string().optional().meta(Unrestricted24),
  limit_per_customer: z32.number().int().min(1).default(1).meta(Unrestricted24),
  is_active: z32.boolean().default(true).meta(Unrestricted24),
  metadata: MetadataField.meta(Unrestricted24)
});
var FreeTrialRuleSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z32.string().min(1).meta({ ...Unrestricted24, readOnly: true })
}).merge(FreeTrialRuleCoreFieldsSchema).meta(
  { id: "FreeTrialRule", "x-revturbine-schema-persistence": Persisted13, "x-revturbine-schema-exposure": Internal19, ...PLAYBOOK_SDK_FACETS6, ...namedIdentity() }
);
var FreeTrialRuleAnchorSchema = makeAnchor("FreeTrialRuleAnchor");
var ReverseTrialStartPolicySchema = z32.enum(["signup", "first_premium_access", "manual"]).meta(
  { id: "ReverseTrialStartPolicy", "x-revturbine-schema-persistence": Transient23, "x-revturbine-schema-exposure": Internal19 }
);
var ReverseTrialRuleCoreFieldsSchema = z32.object({
  name: NameField.meta(Unrestricted24),
  handle: HandleField.meta(Unrestricted24),
  premium_plan_id: z32.string().min(1).meta(Unrestricted24),
  fallback_plan_id: z32.string().min(1).meta(Unrestricted24),
  segment_id: z32.string().nullable().optional().meta(Unrestricted24),
  trial_limit_type: TrialLimitTypeSchema.default("time").meta(Unrestricted24),
  duration_days: z32.number().int().min(1).max(365).nullable().optional().meta(Unrestricted24),
  usage_entitlement_handle: z32.string().min(1).optional().meta(Unrestricted24),
  usage_limit_value: z32.number().int().min(1).optional().meta(Unrestricted24),
  start_policy: ReverseTrialStartPolicySchema.default("signup").meta(Unrestricted24),
  show_upgrade_prompt_at_day: z32.number().int().min(0).optional().meta(Unrestricted24),
  entitlements_during_trial: z32.array(z32.string()).default([]).meta(Unrestricted24),
  is_active: z32.boolean().default(true).meta(Unrestricted24),
  metadata: MetadataField.meta(Unrestricted24)
});
var ReverseTrialRuleSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z32.string().min(1).meta({ ...Unrestricted24, readOnly: true })
}).merge(ReverseTrialRuleCoreFieldsSchema).meta(
  { id: "ReverseTrialRule", "x-revturbine-schema-persistence": Persisted13, "x-revturbine-schema-exposure": Internal19, ...PLAYBOOK_SDK_FACETS6, ...namedIdentity() }
);
var ReverseTrialRuleAnchorSchema = makeAnchor("ReverseTrialRuleAnchor");
var TrialLimitPolicySchema = z32.enum(["1_per_lifetime", "1_per_plan", "1_per_year", "unlimited"]).meta(
  { id: "TrialLimitPolicy", "x-revturbine-schema-persistence": Transient23, "x-revturbine-schema-exposure": Internal19 }
);
var TrialEligibilityScopeSchema = z32.enum(["per_customer", "per_email_domain"]).meta(
  { id: "TrialEligibilityScope", "x-revturbine-schema-persistence": Transient23, "x-revturbine-schema-exposure": Internal19 }
);
var FreeTrialSettingsSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  trial_limit_policy: TrialLimitPolicySchema.default("1_per_lifetime").meta(Unrestricted24),
  eligibility_scope: TrialEligibilityScopeSchema.default("per_customer").meta(Unrestricted24)
}).meta(
  { id: "FreeTrialSettings", "x-revturbine-schema-persistence": Persisted13, "x-revturbine-schema-exposure": Internal19, ...PENDING_PLAYBOOK_SDK_FACETS2 }
);
var ReverseTrialSettingsSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  trial_limit_policy: TrialLimitPolicySchema.default("1_per_lifetime").meta(Unrestricted24),
  eligibility_scope: TrialEligibilityScopeSchema.default("per_customer").meta(Unrestricted24)
}).meta(
  { id: "ReverseTrialSettings", "x-revturbine-schema-persistence": Persisted13, "x-revturbine-schema-exposure": Internal19, ...PENDING_PLAYBOOK_SDK_FACETS2 }
);
var TrialInstanceSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  customer_id: z32.string().min(1).meta(Unrestricted24),
  rule_id: z32.string().min(1).meta(Unrestricted24),
  rule_type: z32.enum(["free_trial", "reverse_trial"]).meta(Unrestricted24),
  plan_id: z32.string().min(1).meta(Unrestricted24),
  status: TrialStatusSchema.default("active").meta(Unrestricted24),
  started_at: z32.string().datetime().meta({ ...Unrestricted24, readOnly: true }),
  /**
   * Time-based expiry. Required for time-based trials; null for
   * pure usage-based trials (which expire when consumption crosses
   * `usage_limit_value` regardless of clock time).
   */
  expires_at: z32.string().datetime().nullable().optional().meta(Unrestricted24),
  /**
   * Snapshot of the rule's `trial_limit_type` at the moment the
   * instance was created. Persisted so subsequent changes to the
   * rule's mode don't retroactively alter the user's trial
   * semantics. Defaults to 'time' for backward compatibility with
   * pre-existing instances.
   */
  trial_limit_type: TrialLimitTypeSchema.default("time").meta(Unrestricted24),
  /**
   * Snapshot of the rule's `usage_entitlement_handle` for
   * usage-based trials. Server queries the user's current
   * consumption of this entitlement to derive
   * `UserTrialStatus.usage_consumed` at read time.
   */
  usage_entitlement_handle: z32.string().min(1).optional().meta(Unrestricted24),
  /**
   * Snapshot of the rule's `usage_limit_value`. Persisted so
   * mid-trial limit changes on the rule don't shrink/expand a
   * user's in-flight trial.
   */
  usage_limit_value: z32.number().int().min(1).optional().meta(Unrestricted24),
  converted_at: NullableDatetimeField.meta(Unrestricted24),
  cancelled_at: NullableDatetimeField.meta(Unrestricted24),
  /**
   * Stable identity of the trial EPISODE this row represents
   * (BL-0247 / plan 276 TASK-12). A customer can run more than one
   * trial, and a subscription can re-enter `trialing`, so the
   * (customer, subscription) pair does not name an occurrence. The
   * billing lane already discriminates an episode by the Stripe
   * subscription id plus its `trial_start`; this column persists
   * that same discriminator so a fact about one episode can be
   * written to exactly that episode's row.
   *
   * Nullable: rows created before the column existed, and rows
   * created by paths that have no Stripe evidence to mint an id
   * from, carry NULL. NULL means "this episode has no first-class
   * identity", never "episode zero" — and Postgres treats NULLs as
   * distinct, so the composite UNIQUE below does not collapse them.
   */
  trial_episode_id: z32.string().min(1).nullable().optional().meta(Unrestricted24),
  /**
   * The Stripe subscription this episode belongs to — the binding
   * that lets a Stripe fact resolve one episode without guessing
   * (BL-0245 carried this in `metadata.stripe_subscription_id`).
   * Nullable because a trial need not originate from Stripe at all.
   */
  stripe_subscription_id: z32.string().min(1).nullable().optional().meta(Unrestricted24),
  /**
   * The EVIDENCED end of the episode: the moment a provider fact
   * said the trial actually stopped. Distinct from `expires_at`,
   * which is the SCHEDULED end and must stay distinguishable
   * (plan 276 R-1 — no clock authority; an elapsed `expires_at`
   * with no fact behind it is not an end). Null until a fact
   * proves one.
   */
  actual_end_at: NullableDatetimeField.meta(Unrestricted24),
  metadata: MetadataField.meta(Unrestricted24)
}).meta(
  { id: "TrialInstance", "x-revturbine-schema-persistence": Persisted13, "x-revturbine-schema-exposure": Internal19 }
);
var trialPaths = {
  "/api/free-trial-rule-anchors": {
    get: operation({
      operationId: "listFreeTrialRuleAnchors",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List free trial rule anchors (identity registry)",
      tags: ["trials"],
      responses: {
        "200": { description: "Free trial rule anchor list", content: { "application/json": { schema: ListEnvelope(FreeTrialRuleAnchorSchema) } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "free-trial-rule-anchors", persistence: { table: "freeTrialRules", mode: "list" } }
    })
  },
  "/api/trials/free-rules": {
    get: operation({
      operationId: "listFreeTrialRules",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List free trial rules",
      tags: ["trials"],
      responses: { "200": { description: "Free trial rule list", content: { "application/json": { schema: ListEnvelope(FreeTrialRuleSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-rules", persistence: { table: "freeTrialRuleVersions", mode: "list" } }
    }),
    post: operation({
      operationId: "createFreeTrialRule",
      summary: "Create free trial rule",
      tags: ["trials"],
      requestBody: { required: true, content: { "application/json": { schema: FreeTrialRuleSchema } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: FreeTrialRuleSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-rules", persistence: { table: "freeTrialRuleVersions", mode: "create" } }
    })
  },
  "/api/trials/free-rules/{ruleId}": {
    get: operation({
      operationId: "getFreeTrialRule",
      requestParams: { path: z32.object({ ruleId: z32.string() }) },
      summary: "Get free trial rule",
      tags: ["trials"],
      responses: { "200": { description: "Free trial rule", content: { "application/json": { schema: FreeTrialRuleSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-rules", persistence: { table: "freeTrialRuleVersions", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateFreeTrialRule",
      requestParams: { path: z32.object({ ruleId: z32.string() }) },
      summary: "Update free trial rule",
      tags: ["trials"],
      requestBody: { required: true, content: { "application/json": { schema: FreeTrialRuleSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: FreeTrialRuleSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-rules", persistence: { table: "freeTrialRuleVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteFreeTrialRule",
      requestParams: { path: z32.object({ ruleId: z32.string() }) },
      summary: "Delete free trial rule",
      tags: ["trials"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-rules", persistence: { table: "freeTrialRuleVersions", mode: "delete" } }
    })
  },
  "/api/reverse-trial-rule-anchors": {
    get: operation({
      operationId: "listReverseTrialRuleAnchors",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List reverse trial rule anchors (identity registry)",
      tags: ["trials"],
      responses: {
        "200": { description: "Reverse trial rule anchor list", content: { "application/json": { schema: ListEnvelope(ReverseTrialRuleAnchorSchema) } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "reverse-trial-rule-anchors", persistence: { table: "reverseTrialRules", mode: "list" } }
    })
  },
  "/api/trials/reverse-rules": {
    get: operation({
      operationId: "listReverseTrialRules",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List reverse trial rules",
      tags: ["trials"],
      responses: { "200": { description: "Reverse trial rule list", content: { "application/json": { schema: ListEnvelope(ReverseTrialRuleSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "reverse-trial-rules", persistence: { table: "reverseTrialRuleVersions", mode: "list" } }
    }),
    post: operation({
      operationId: "createReverseTrialRule",
      summary: "Create reverse trial rule",
      tags: ["trials"],
      requestBody: { required: true, content: { "application/json": { schema: ReverseTrialRuleSchema } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: ReverseTrialRuleSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "reverse-trial-rules", persistence: { table: "reverseTrialRuleVersions", mode: "create" } }
    })
  },
  "/api/trials/reverse-rules/{ruleId}": {
    get: operation({
      operationId: "getReverseTrialRule",
      requestParams: { path: z32.object({ ruleId: z32.string() }) },
      summary: "Get reverse trial rule",
      tags: ["trials"],
      responses: { "200": { description: "Reverse trial rule", content: { "application/json": { schema: ReverseTrialRuleSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "reverse-trial-rules", persistence: { table: "reverseTrialRuleVersions", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateReverseTrialRule",
      requestParams: { path: z32.object({ ruleId: z32.string() }) },
      summary: "Update reverse trial rule",
      tags: ["trials"],
      requestBody: { required: true, content: { "application/json": { schema: ReverseTrialRuleSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: ReverseTrialRuleSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "reverse-trial-rules", persistence: { table: "reverseTrialRuleVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteReverseTrialRule",
      requestParams: { path: z32.object({ ruleId: z32.string() }) },
      summary: "Delete reverse trial rule",
      tags: ["trials"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "reverse-trial-rules", persistence: { table: "reverseTrialRuleVersions", mode: "delete" } }
    })
  },
  "/api/trials/free-settings": {
    get: operation({
      operationId: "listFreeTrialSettings",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List free trial settings (one row per tenant)",
      tags: ["trials"],
      responses: { "200": { description: "Free trial settings list", content: { "application/json": { schema: ListEnvelope(FreeTrialSettingsSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "free-trial-settings", persistence: { table: "freeTrialSettings", mode: "list" } }
    }),
    post: operation({
      operationId: "createFreeTrialSettings",
      summary: "Create free trial settings",
      tags: ["trials"],
      requestBody: { required: true, content: { "application/json": { schema: FreeTrialSettingsSchema } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: FreeTrialSettingsSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "free-trial-settings", persistence: { table: "freeTrialSettings", mode: "create" } }
    })
  },
  "/api/trials/free-settings/{settingsId}": {
    get: operation({
      operationId: "getFreeTrialSettings",
      requestParams: { path: z32.object({ settingsId: z32.string() }) },
      summary: "Get free trial settings",
      tags: ["trials"],
      responses: { "200": { description: "Free trial settings", content: { "application/json": { schema: FreeTrialSettingsSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "free-trial-settings", persistence: { table: "freeTrialSettings", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateFreeTrialSettings",
      requestParams: { path: z32.object({ settingsId: z32.string() }) },
      summary: "Update free trial settings",
      tags: ["trials"],
      requestBody: { required: true, content: { "application/json": { schema: FreeTrialSettingsSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: FreeTrialSettingsSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "free-trial-settings", persistence: { table: "freeTrialSettings", mode: "update" } }
    })
  },
  "/api/trials/reverse-settings": {
    get: operation({
      operationId: "listReverseTrialSettings",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List reverse trial settings (one row per tenant)",
      tags: ["trials"],
      responses: { "200": { description: "Reverse trial settings list", content: { "application/json": { schema: ListEnvelope(ReverseTrialSettingsSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "reverse-trial-settings", persistence: { table: "reverseTrialSettings", mode: "list" } }
    }),
    post: operation({
      operationId: "createReverseTrialSettings",
      summary: "Create reverse trial settings",
      tags: ["trials"],
      requestBody: { required: true, content: { "application/json": { schema: ReverseTrialSettingsSchema } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: ReverseTrialSettingsSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "reverse-trial-settings", persistence: { table: "reverseTrialSettings", mode: "create" } }
    })
  },
  "/api/trials/reverse-settings/{settingsId}": {
    get: operation({
      operationId: "getReverseTrialSettings",
      requestParams: { path: z32.object({ settingsId: z32.string() }) },
      summary: "Get reverse trial settings",
      tags: ["trials"],
      responses: { "200": { description: "Reverse trial settings", content: { "application/json": { schema: ReverseTrialSettingsSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "reverse-trial-settings", persistence: { table: "reverseTrialSettings", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateReverseTrialSettings",
      requestParams: { path: z32.object({ settingsId: z32.string() }) },
      summary: "Update reverse trial settings",
      tags: ["trials"],
      requestBody: { required: true, content: { "application/json": { schema: ReverseTrialSettingsSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: ReverseTrialSettingsSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "reverse-trial-settings", persistence: { table: "reverseTrialSettings", mode: "update" } }
    })
  },
  "/api/trials/instances": {
    get: operation({
      operationId: "listTrialInstances",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List trial instances",
      tags: ["trials"],
      responses: { "200": { description: "Trial instance list", content: { "application/json": { schema: ListEnvelope(TrialInstanceSchema) } } } },
      // One row per trial EPISODE (BL-0247 / plan 276 TASK-12). This is the
      // ON CONFLICT target the Stripe binding writer upserts against, so a
      // re-delivered `customer.subscription.*` event updates the episode it
      // already created instead of minting a duplicate. NULL episode ids are
      // distinct in Postgres, so pre-existing and non-Stripe rows are unaffected.
      "x-revturbine-operation": { exposure: "internal", resource: "trial-instances", persistence: { table: "trialInstances", mode: "list", uniqueBy: ["tenant_id", "customer_id", "trial_episode_id"] } }
    })
  },
  "/api/trials/instances/{instanceId}": {
    get: operation({
      operationId: "getTrialInstance",
      requestParams: { path: z32.object({ instanceId: z32.string() }) },
      summary: "Get trial instance",
      tags: ["trials"],
      responses: { "200": { description: "Trial instance", content: { "application/json": { schema: TrialInstanceSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-instances", persistence: { table: "trialInstances", mode: "get" } }
    })
  },
  "/api/trials/instances/{instanceId}/cancel": {
    post: operation({
      operationId: "cancelTrialInstance",
      requestParams: { path: z32.object({ instanceId: z32.string() }) },
      summary: "Cancel an active trial",
      tags: ["trials"],
      responses: { "200": { description: "Cancelled", content: { "application/json": { schema: TrialInstanceSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-instances", persistence: { table: "trialInstances", mode: "update" } }
    })
  },
  "/api/trials/instances/{instanceId}/convert": {
    post: operation({
      operationId: "convertTrialInstance",
      requestParams: { path: z32.object({ instanceId: z32.string() }) },
      summary: "Convert trial to paid subscription",
      tags: ["trials"],
      requestBody: { required: true, content: { "application/json": { schema: z32.object({ plan_id: z32.string().optional() }) } } },
      responses: { "200": { description: "Converted", content: { "application/json": { schema: TrialInstanceSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-instances", persistence: { table: "trialInstances", mode: "update" } }
    })
  }
};

// scaffold/src/trials/models/trial-revision.ts
var TRIAL_REVISION_KINDS = [
  "started",
  "extended",
  "converted",
  "reverted",
  "expired",
  "revoked"
];
var TRIAL_PENDING_UNKNOWN_REASONS = [
  /** No authoritative fact of any kind about this episode. */
  "no_authoritative_fact",
  /** The scheduled end passed and nothing evidenced an end. The R-1(c) case. */
  "elapsed_deadline_without_fact",
  /** The episode is open and its scheduled end has not passed. */
  "episode_open",
  /** A usage-metered episode ended without exhaustion or end evidence. */
  "usage_expiry_requires_exhaustion_evidence",
  /** A commitment exists but began before the episode's evidenced end. */
  "commitment_precedes_actual_end",
  /** The evidence closing the episode carries no effective time. */
  "end_evidence_without_effective_time"
];
function atOrAfter(a, b) {
  return a >= b;
}
function pending(reason, facts) {
  return { status: "pending_unknown", reason, grants_account_access: grantsAccount(facts) };
}
function grantsAccount(facts) {
  return facts.subject_scope === "account";
}
function resolved(revision, effective_at, evidence, facts, commitment_ref = null) {
  return {
    status: "revision",
    revision,
    effective_at,
    evidence,
    grants_account_access: grantsAccount(facts),
    commitment_ref
  };
}
function classifyTrialRevision(facts) {
  if (facts.revocation) {
    return resolved("revoked", facts.revocation.occurred_at, facts.revocation, facts);
  }
  if (!facts.enrollment) return pending("no_authoritative_fact", facts);
  const closed = facts.end_evidence !== null || facts.actual_end_at !== null;
  if (!closed) {
    if (facts.extension) {
      return resolved("extended", facts.extension.occurred_at, facts.extension, facts);
    }
    const deadline = facts.scheduled_end_at;
    const observed = facts.observed_through ?? null;
    if (deadline && observed && atOrAfter(observed, deadline)) {
      return pending("elapsed_deadline_without_fact", facts);
    }
    if (facts.started_at) {
      return resolved("started", facts.started_at, facts.enrollment, facts);
    }
    return pending("episode_open", facts);
  }
  const end = facts.end_evidence;
  if (!end) return pending("end_evidence_without_effective_time", facts);
  const actualEnd = facts.actual_end_at ?? end.occurred_at;
  const commitment = facts.commitment;
  if (commitment && commitment.trial_episode_id === facts.trial_episode_id) {
    if (atOrAfter(commitment.started_at, actualEnd)) {
      return resolved("converted", commitment.started_at, end, facts, commitment.ref);
    }
    return pending("commitment_precedes_actual_end", facts);
  }
  if (facts.limit_type === "usage") {
    const exhaustion = facts.exhaustion ?? (end.kind === "usage_exhaustion" ? end : null);
    if (!exhaustion) return pending("usage_expiry_requires_exhaustion_evidence", facts);
    return resolved("expired", facts.actual_end_at ?? exhaustion.occurred_at, exhaustion, facts);
  }
  if (facts.fallback) {
    return resolved("reverted", facts.fallback.occurred_at, facts.fallback, facts);
  }
  return resolved("expired", actualEnd, end, facts);
}

// scaffold/src/customers/models/account-creation-evidence.ts
var ACCOUNT_CREATION_SOURCES = [
  /** Someone created the account themselves. */
  "self_serve_signup",
  /** The account came into existence when an invite was accepted into it. */
  "invite_accepted",
  /** An operator or automation provisioned it. */
  "provisioned",
  /** It arrived through a bulk import or migration. */
  "import"
];
var USER_GRAIN_NON_CREATION_SOURCES = ["user_signup", "user_signed_up", "first_seen"];
var ACCOUNT_CREATION_PENDING_REASONS = [
  "no_evidence",
  "no_account_grain",
  "no_creation_time",
  /** The claim rests on a user signup or a first observation (R-2). */
  "user_grain_signup_is_not_account_creation",
  "unrecognized_source"
];
function isAccountCreationSource(value) {
  return ACCOUNT_CREATION_SOURCES.includes(value);
}
function classifyAccountCreation(facts) {
  if (!facts.source) return { status: "pending_unknown", reason: "unrecognized_source" };
  if (USER_GRAIN_NON_CREATION_SOURCES.includes(facts.source)) {
    return { status: "pending_unknown", reason: "user_grain_signup_is_not_account_creation" };
  }
  if (!isAccountCreationSource(facts.source)) {
    return { status: "pending_unknown", reason: "unrecognized_source" };
  }
  if (!facts.evidence) return { status: "pending_unknown", reason: "no_evidence" };
  if (!facts.account_id) return { status: "pending_unknown", reason: "no_account_grain" };
  if (!facts.created_at) return { status: "pending_unknown", reason: "no_creation_time" };
  return {
    status: "account_created",
    account_id: facts.account_id,
    created_at: facts.created_at,
    source: facts.source,
    evidence: facts.evidence
  };
}

// scaffold/src/experiments/models/schema.ts
import { z as z33 } from "zod";

// scaffold/src/core/bundle/canonical-json.ts
function canonicalizeJson(value) {
  if (value === null) return "null";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`canonicalizeJson: non-finite number ${value} not representable in JSON`);
    }
    return JSON.stringify(value);
  }
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return "[" + value.map((item) => canonicalizeJson(item)).join(",") + "]";
  }
  if (typeof value === "object") {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      throw new Error(
        `canonicalizeJson: unsupported object ${value.constructor?.name ?? "instance"} \u2014 convert to a plain JSON value before canonicalizing`
      );
    }
    const obj = value;
    const keys = Object.keys(obj).sort();
    const parts = [];
    for (const k of keys) {
      const v = obj[k];
      if (v === void 0) continue;
      parts.push(JSON.stringify(k) + ":" + canonicalizeJson(v));
    }
    return "{" + parts.join(",") + "}";
  }
  throw new Error(`canonicalizeJson: unsupported value type ${typeof value}`);
}

// scaffold/src/experiments/models/schema.ts
var { Unrestricted: Unrestricted25, Financial: Financial4 } = DataClassification;
var { Persisted: Persisted14, Transient: Transient24 } = SchemaPersistence;
var { Internal: Internal20 } = SchemaExposure;
var PENDING_PLAYBOOK_SDK_FACETS3 = schemaFacets(SchemaContext.Playbook, {
  inConfig: false,
  sdkInput: true
});
var EXPERIMENT_RESULT_FACETS = schemaFacets(SchemaContext.CustomerOperations, {
  sdkInput: false
});
var ExperimentStatusSchema = z33.enum(["draft", "ramping", "winning", "neutral", "needs_attention", "paused", "complete"]).meta(
  { id: "ExperimentStatus", "x-revturbine-schema-persistence": Transient24, "x-revturbine-schema-exposure": Internal20 }
);
var ExperimentTypeSchema = z33.enum(["placement_ab", "entitlement_ab", "plan_ab", "pricing_ab", "custom"]).meta(
  { id: "ExperimentType", "x-revturbine-schema-persistence": Transient24, "x-revturbine-schema-exposure": Internal20 }
);
var ExperimentAllocationModeSchema = z33.enum(["managed", "observed"]).meta(
  { id: "ExperimentAllocationMode", "x-revturbine-schema-persistence": Persisted14, "x-revturbine-schema-exposure": Internal20 }
);
var ExperimentAssignmentSourceSchema = z33.enum(["native", "customer_sdk"]).meta(
  {
    id: "ExperimentAssignmentSource",
    "x-revturbine-schema-persistence": Persisted14,
    "x-revturbine-schema-exposure": Internal20,
    ...PENDING_PLAYBOOK_SDK_FACETS3
  }
);
var ExperimentVariantTargetSchema = z33.discriminatedUnion("kind", [
  z33.object({
    kind: z33.literal("placement"),
    placement_handle: z33.string().min(1),
    placement_payload_handle: z33.string().min(1).optional()
  }),
  z33.object({
    kind: z33.literal("entitlement"),
    entitlement_handle: z33.string().min(1),
    rule_handle: z33.string().min(1).optional()
  }),
  z33.object({
    kind: z33.literal("plan"),
    plan_handle: z33.string().min(1),
    plan_variation_handle: z33.string().min(1).optional()
  }),
  z33.object({
    kind: z33.literal("pricing"),
    plan_variation_handle: z33.string().min(1),
    promotion_handle: z33.string().min(1).optional()
  }),
  z33.object({
    kind: z33.literal("custom"),
    provider_payload: z33.record(z33.string(), z33.json())
  })
]).meta(
  { id: "ExperimentVariantTarget", "x-revturbine-schema-persistence": Persisted14, "x-revturbine-schema-exposure": Internal20, ...PENDING_PLAYBOOK_SDK_FACETS3 }
);
var ExperimentVariantSchema = z33.object({
  variant_id: z33.string().min(1),
  name: NameField,
  weight: z33.number().min(0).max(1).default(0.5),
  is_control: z33.boolean().default(false),
  targets: z33.array(ExperimentVariantTargetSchema).min(1).optional(),
  config: z33.record(z33.string(), z33.unknown()).default({})
}).meta(
  { id: "ExperimentVariant", "x-revturbine-schema-persistence": Persisted14, "x-revturbine-schema-exposure": Internal20, ...PENDING_PLAYBOOK_SDK_FACETS3 }
);
var ExperimentSequentialConfigSchema = z33.object({
  method: z33.literal("always_valid"),
  look_count: z33.number().int().positive(),
  alpha: z33.number().positive().lt(1).default(0.05)
}).strict();
var ExperimentPracticalSignificanceConfigSchema = z33.object({
  minimum_revenue_effect: z33.number().min(0)
}).strict();
var ExperimentVarianceReductionSchema = z33.discriminatedUnion("method", [
  z33.object({
    method: z33.literal("cuped"),
    covariate_metric: AnalyticsSemanticIdSchema,
    lookback_days: z33.number().int().positive()
  }),
  z33.object({
    method: z33.literal("regression_adjustment"),
    covariate_metric: AnalyticsSemanticIdSchema,
    lookback_days: z33.number().int().positive()
  })
]);
var ExperimentMultipleComparisonsConfigSchema = z33.object({
  method: z33.literal("holm"),
  family_scope: z33.literal("primary_and_guardrails_separate")
});
var ExperimentAnalysisConfigSchema = z33.object({
  methodology: z33.enum(["frequentist", "bayesian"]),
  analysis_unit: AnalyticsAnalyticalUnitSchema,
  sequential: ExperimentSequentialConfigSchema.optional(),
  multiple_comparisons: ExperimentMultipleComparisonsConfigSchema.optional(),
  variance_reduction: ExperimentVarianceReductionSchema.optional(),
  practical_significance: ExperimentPracticalSignificanceConfigSchema.optional()
}).meta(
  { id: "ExperimentAnalysisConfig", "x-revturbine-schema-persistence": Persisted14, "x-revturbine-schema-exposure": Internal20, ...PENDING_PLAYBOOK_SDK_FACETS3 }
);
var RUNNING_EXPERIMENT_STATUSES = /* @__PURE__ */ new Set([
  "ramping",
  "winning",
  "neutral",
  "needs_attention"
]);
var ExperimentAnalysisConfigVersionError = class extends Error {
  constructor() {
    super("Analysis configuration is immutable for a running experiment version; mint a new version to change methodology or analysis settings.");
    this.name = "ExperimentAnalysisConfigVersionError";
  }
};
function assertExperimentAnalysisConfigUpdateAllowed(current, nextAnalysisConfig) {
  if (!RUNNING_EXPERIMENT_STATUSES.has(current.status)) return;
  if (canonicalizeJson(current.analysis_config ?? null) === canonicalizeJson(nextAnalysisConfig ?? null)) {
    return;
  }
  throw new ExperimentAnalysisConfigVersionError();
}
var ExperimentDecisionPrimarySuccessSchema = z33.discriminatedUnion("method", [
  z33.object({
    method: z33.literal("frequentist"),
    require_statistical_significance: z33.boolean(),
    require_practical_significance: z33.boolean().optional()
  }),
  z33.object({
    method: z33.literal("bayesian"),
    minimum_probability_positive: z33.number().min(0).max(1),
    maximum_expected_loss: z33.number().min(0).optional()
  })
]);
var ExperimentDecisionPolicySchema = z33.object({
  schema_version: z33.number().int().min(1),
  minimum_runtime: z33.object({
    days: z33.number().int().min(0).optional(),
    analysis_units: z33.number().int().min(0).optional()
  }).optional(),
  validity: z33.object({
    /** Consumes `health.sample_ratio_mismatch`. */
    fail_on_srm: z33.boolean(),
    /** Consumes assignment-collision findings (§9.4). */
    fail_on_assignment_collision: z33.boolean(),
    /** Consumes exposure diagnostics (§9.3). */
    fail_on_exposure_integrity: z33.boolean(),
    /** Consumes carryover health (§15). */
    fail_on_carryover: z33.boolean()
  }),
  primary_success: ExperimentDecisionPrimarySuccessSchema,
  guardrails: z33.object({
    require_no_material_harm: z33.boolean(),
    allowed_guardrail_failures: z33.number().int().min(0).default(0).optional()
  }),
  segments: z33.object({
    allow_segment_decisions: z33.boolean(),
    /** Predeclared segment handles only. */
    allowed_segments: z33.array(HandleField).optional()
  }),
  inconclusive: z33.object({
    action: z33.enum(["hold_inconclusive", "iterate_followup"])
  })
}).meta(
  { id: "ExperimentDecisionPolicy", "x-revturbine-schema-persistence": Persisted14, "x-revturbine-schema-exposure": Internal20, ...PENDING_PLAYBOOK_SDK_FACETS3 }
);
var ExperimentDecisionPolicyVersionError = class extends Error {
  constructor() {
    super("Decision policy is immutable for a running experiment version; mint a new version to change decision settings.");
    this.name = "ExperimentDecisionPolicyVersionError";
  }
};
function assertExperimentDecisionPolicyUpdateAllowed(current, nextDecisionPolicy) {
  if (!RUNNING_EXPERIMENT_STATUSES.has(current.status)) return;
  if (canonicalizeJson(current.decision_policy ?? null) === canonicalizeJson(nextDecisionPolicy ?? null)) {
    return;
  }
  throw new ExperimentDecisionPolicyVersionError();
}
var transientExperimentMeta = (id) => ({
  id,
  "x-revturbine-schema-persistence": Transient24,
  "x-revturbine-schema-exposure": Internal20
});
var VariantSummaryIdentitySchema = z33.object({
  variant_id: z33.string().min(1).meta(Unrestricted25)
});
var ExperimentClusterAggregateSchema = z33.object({
  n: z33.number().int().positive().meta(Unrestricted25),
  sum_numerator: z33.number().meta(Unrestricted25),
  sum_denominator: z33.number().positive().meta(Unrestricted25),
  sum_covariate: z33.number().optional().meta(Unrestricted25)
}).meta(transientExperimentMeta("ExperimentClusterAggregate"));
var ExperimentClusteredSufficientStatisticsSchema = z33.object({
  assignment_unit: AnalyticsAnalyticalUnitSchema.meta(Unrestricted25),
  clusters: z33.array(ExperimentClusterAggregateSchema).min(2).meta(Unrestricted25)
}).meta(transientExperimentMeta("ExperimentClusteredSufficientStatistics"));
var ClusteredSummaryShape = {
  clustered: ExperimentClusteredSufficientStatisticsSchema.optional().meta(Unrestricted25)
};
var MeanVariantStatisticalSummarySchema = VariantSummaryIdentitySchema.extend({
  statistic_type: z33.literal("mean").meta(Unrestricted25),
  n: z33.number().int().min(0).meta(Unrestricted25),
  sum_y: z33.number().meta(Unrestricted25),
  sum_y2: z33.number().min(0).meta(Unrestricted25),
  ...ClusteredSummaryShape
}).meta(transientExperimentMeta("MeanVariantStatisticalSummary"));
var BinaryVariantStatisticalSummarySchema = VariantSummaryIdentitySchema.extend({
  statistic_type: z33.literal("binary").meta(Unrestricted25),
  n: z33.number().int().min(0).meta(Unrestricted25),
  successes: z33.number().int().min(0).meta(Unrestricted25),
  ...ClusteredSummaryShape
}).meta(transientExperimentMeta("BinaryVariantStatisticalSummary"));
var RatioVariantStatisticalSummarySchema = VariantSummaryIdentitySchema.extend({
  statistic_type: z33.literal("ratio").meta(Unrestricted25),
  n: z33.number().int().min(0).meta(Unrestricted25),
  sum_numerator: z33.number().meta(Unrestricted25),
  sum_denominator: z33.number().meta(Unrestricted25),
  sum_numerator2: z33.number().min(0).meta(Unrestricted25),
  sum_denominator2: z33.number().min(0).meta(Unrestricted25),
  sum_cross: z33.number().meta(Unrestricted25),
  ...ClusteredSummaryShape
}).meta(transientExperimentMeta("RatioVariantStatisticalSummary"));
var CovarianceVariantStatisticalSummarySchema = VariantSummaryIdentitySchema.extend({
  statistic_type: z33.literal("covariance").meta(Unrestricted25),
  n: z33.number().int().min(0).meta(Unrestricted25),
  sum_x: z33.number().meta(Unrestricted25),
  sum_y: z33.number().meta(Unrestricted25),
  sum_x2: z33.number().min(0).meta(Unrestricted25),
  sum_y2: z33.number().min(0).meta(Unrestricted25),
  sum_xy: z33.number().meta(Unrestricted25),
  ...ClusteredSummaryShape
}).meta(transientExperimentMeta("CovarianceVariantStatisticalSummary"));
var VariantStatisticalSummarySchema = z33.discriminatedUnion("statistic_type", [
  MeanVariantStatisticalSummarySchema,
  BinaryVariantStatisticalSummarySchema,
  RatioVariantStatisticalSummarySchema,
  CovarianceVariantStatisticalSummarySchema
]).meta(transientExperimentMeta("VariantStatisticalSummary"));
var ExperimentObservationWindowSchema = z33.object({
  start: z33.string().datetime().meta(Unrestricted25),
  end: z33.string().datetime().meta(Unrestricted25)
}).meta(transientExperimentMeta("ExperimentObservationWindow"));
var ExperimentCovariateProvenanceSchema = z33.object({
  metric: AnalyticsSemanticIdSchema.meta(Unrestricted25),
  observation_window: ExperimentObservationWindowSchema.meta(Unrestricted25)
}).meta(transientExperimentMeta("ExperimentCovariateProvenance"));
var ExperimentEvidenceSchema = z33.object({
  schema_version: z33.number().int().min(1).meta(Unrestricted25),
  experiment_handle: HandleField.meta(Unrestricted25),
  experiment_version: z33.number().int().min(1).meta(Unrestricted25),
  metric: AnalyticsSemanticIdSchema.meta(Unrestricted25),
  analysis_unit: AnalyticsAnalyticalUnitSchema.meta(Unrestricted25),
  variants: z33.array(VariantStatisticalSummarySchema).min(1).meta(Unrestricted25),
  observation_window: ExperimentObservationWindowSchema.meta(Unrestricted25),
  covariate: ExperimentCovariateProvenanceSchema.optional().meta(Unrestricted25),
  data_watermark: z33.string().datetime().meta(Unrestricted25),
  source_scope: AnalyticsSourceScopeSchema.meta(Unrestricted25),
  provider: ProviderProvenanceSchema.meta(Unrestricted25)
}).meta(transientExperimentMeta("ExperimentEvidence"));
var ExperimentSampleRatioMismatchSchema = z33.object({
  status: z33.enum(["not_evaluated", "pass", "fail"]).meta(Unrestricted25),
  p_value: z33.number().min(0).max(1).optional().meta(Unrestricted25),
  chi_squared: z33.number().min(0).optional().meta(Unrestricted25),
  variants: z33.array(z33.object({
    variant_id: z33.string().min(1).meta(Unrestricted25),
    observed_count: z33.number().int().min(0).meta(Unrestricted25),
    expected_count: z33.number().min(0).meta(Unrestricted25)
  })).default([]).meta(Unrestricted25),
  reason: z33.string().min(1).max(500).optional().meta(Unrestricted25)
}).meta(transientExperimentMeta("ExperimentSampleRatioMismatch"));
var ExperimentHealthSchema = z33.object({
  status: z33.enum(["healthy", "warning", "unhealthy", "insufficient_data"]).meta(Unrestricted25),
  sample_ratio_mismatch: ExperimentSampleRatioMismatchSchema.optional().meta(Unrestricted25),
  issues: z33.array(z33.object({
    code: z33.string().min(1).max(100).meta(Unrestricted25),
    message: z33.string().min(1).max(500).meta(Unrestricted25)
  })).default([]).meta(Unrestricted25)
}).meta(transientExperimentMeta("ExperimentHealth"));
var ExperimentConfidenceIntervalSchema = z33.object({
  lower: z33.number().meta(Unrestricted25),
  upper: z33.number().meta(Unrestricted25),
  level: z33.number().min(0).max(1).meta(Unrestricted25)
}).meta(transientExperimentMeta("ExperimentConfidenceInterval"));
var ExperimentSequentialResultSchema = z33.object({
  method: z33.literal("always_valid").meta(Unrestricted25),
  status: z33.enum(["continue", "significant_positive", "significant_negative"]).meta(Unrestricted25),
  look_count: z33.number().int().min(1).meta(Unrestricted25),
  spending_state: z33.object({
    alpha: z33.number().positive().lt(1).meta(Unrestricted25),
    look_alpha: z33.number().positive().lt(1).meta(Unrestricted25),
    cumulative_alpha_spent: z33.number().positive().lt(1).meta(Unrestricted25),
    alpha_remaining: z33.number().positive().lt(1).meta(Unrestricted25),
    unadjusted_p_value: z33.number().min(0).max(1).optional().meta(Unrestricted25)
  }).meta(Unrestricted25)
}).meta(transientExperimentMeta("ExperimentSequentialResult"));
var ExperimentPracticalSignificanceResultSchema = z33.object({
  minimum_revenue_effect: z33.number().min(0).meta(Financial4),
  revenue_effect: z33.number().meta(Financial4),
  status: z33.enum([
    "meaningful_positive",
    "meaningful_negative",
    "not_demonstrated"
  ]).meta(Unrestricted25)
}).meta(transientExperimentMeta("ExperimentPracticalSignificanceResult"));
var ExperimentMultipleComparisonResultSchema = z33.object({
  method: z33.literal("holm").meta(Unrestricted25),
  family: z33.enum(["primary", "guardrails"]).meta(Unrestricted25),
  family_size: z33.number().int().positive().meta(Unrestricted25),
  unadjusted_p_value: z33.number().min(0).max(1).meta(Unrestricted25)
}).meta(transientExperimentMeta("ExperimentMultipleComparisonResult"));
var ExperimentMetricResultSchema = z33.object({
  metric: AnalyticsSemanticIdSchema.meta(Unrestricted25),
  control_variant_id: z33.string().min(1).meta(Unrestricted25),
  variant_id: z33.string().min(1).meta(Unrestricted25),
  estimator: z33.string().min(1).max(100).meta(Unrestricted25),
  estimator_version: z33.string().min(1).max(100).meta(Unrestricted25),
  estimate: z33.number().meta(Unrestricted25),
  control_estimate: z33.number().meta(Unrestricted25),
  absolute_effect: z33.number().meta(Unrestricted25),
  relative_effect: z33.number().optional().meta(Unrestricted25),
  standard_error: z33.number().min(0).optional().meta(Unrestricted25),
  confidence_interval: ExperimentConfidenceIntervalSchema.optional().meta(Unrestricted25),
  p_value: z33.number().min(0).max(1).optional().meta(Unrestricted25),
  multiple_comparison: ExperimentMultipleComparisonResultSchema.optional().meta(Unrestricted25),
  probability_positive: z33.number().min(0).max(1).optional().meta(Unrestricted25),
  expected_loss: z33.number().min(0).optional().meta(Unrestricted25),
  sequential: ExperimentSequentialResultSchema.optional().meta(Unrestricted25),
  practical_significance: ExperimentPracticalSignificanceResultSchema.optional().meta(Unrestricted25),
  sample_size: z33.number().int().min(0).optional().meta(Unrestricted25)
}).meta(transientExperimentMeta("ExperimentMetricResult"));
var ExperimentEvidenceProvenanceSchema = z33.object({
  metric: AnalyticsSemanticIdSchema.meta(Unrestricted25),
  summary_schema_version: z33.number().int().min(1).meta(Unrestricted25),
  data_watermark: z33.string().datetime().meta(Unrestricted25),
  provider: ProviderProvenanceSchema.meta(Unrestricted25)
}).meta(transientExperimentMeta("ExperimentEvidenceProvenance"));
var AnalysisProvenanceSchema = z33.object({
  provider: ProviderProvenanceSchema.meta(Unrestricted25),
  evidence: z33.array(ExperimentEvidenceProvenanceSchema).min(1).meta(Unrestricted25)
}).meta(transientExperimentMeta("AnalysisProvenance"));
var ExperimentAnalysisResultSchema = z33.object({
  schema_version: z33.number().int().min(1).meta(Unrestricted25),
  engine: z33.string().min(1).max(100).meta(Unrestricted25),
  engine_version: z33.string().min(1).max(100).meta(Unrestricted25),
  methodology: z33.string().min(1).max(100).meta(Unrestricted25),
  metrics: z33.array(ExperimentMetricResultSchema).meta(Unrestricted25),
  health: ExperimentHealthSchema.meta(Unrestricted25),
  provenance: AnalysisProvenanceSchema.meta(Unrestricted25)
}).meta(transientExperimentMeta("ExperimentAnalysisResult"));
var ExperimentSnapshotIdentitySchema = IdField.merge(TenantIdField).extend({
  created_at: z33.string().datetime().meta({ ...Unrestricted25, readOnly: true }),
  experiment_handle: HandleField.meta(Unrestricted25),
  experiment_version: z33.number().int().min(1).meta(Unrestricted25),
  metric_semantic_id: AnalyticsSemanticIdSchema.meta(Unrestricted25),
  metric_catalog_version: z33.string().min(1).max(64).meta(Unrestricted25),
  endpoint_version: z33.string().min(1).max(100).meta(Unrestricted25),
  query_hash: z33.string().min(1).max(128).meta(Unrestricted25),
  evidence_provider_handle: HandleField.meta(Unrestricted25),
  evidence_provider_type: z33.string().min(1).max(100).meta(Unrestricted25),
  evidence_provider_version: z33.string().min(1).max(100).meta(Unrestricted25),
  evidence_provider_contract_version: z33.number().int().min(1).meta(Unrestricted25),
  summary_schema_version: z33.number().int().min(1).meta(Unrestricted25),
  observation_window_start: z33.string().datetime().meta(Unrestricted25),
  observation_window_end: z33.string().datetime().meta(Unrestricted25),
  data_watermark: z33.string().datetime().meta(Unrestricted25)
});
var ExperimentEvidenceSnapshotSchema = ExperimentSnapshotIdentitySchema.extend({
  analysis_unit: AnalyticsAnalyticalUnitSchema.meta(Unrestricted25),
  evidence: ExperimentEvidenceSchema.meta(Unrestricted25)
}).meta({ id: "ExperimentEvidenceSnapshot", "x-revturbine-schema-persistence": Persisted14, "x-revturbine-schema-exposure": Internal20, ...EXPERIMENT_RESULT_FACETS });
var ExperimentAnalysisResultRecordSchema = ExperimentSnapshotIdentitySchema.extend({
  evidence_snapshot_id: z33.string().min(1).meta(Unrestricted25),
  analysis_provider_handle: HandleField.meta(Unrestricted25),
  analysis_provider_type: z33.string().min(1).max(100).meta(Unrestricted25),
  analysis_provider_version: z33.string().min(1).max(100).meta(Unrestricted25),
  analysis_provider_contract_version: z33.number().int().min(1).meta(Unrestricted25),
  engine: z33.string().min(1).max(100).meta(Unrestricted25),
  engine_version: z33.string().min(1).max(100).meta(Unrestricted25),
  estimator: z33.string().min(1).max(100).meta(Unrestricted25),
  estimator_version: z33.string().min(1).max(100).meta(Unrestricted25),
  analysis_config: ExperimentAnalysisConfigSchema.meta(Unrestricted25),
  result: ExperimentAnalysisResultSchema.meta(Unrestricted25)
}).meta({ id: "ExperimentAnalysisResultRecord", "x-revturbine-schema-persistence": Persisted14, "x-revturbine-schema-exposure": Internal20, ...EXPERIMENT_RESULT_FACETS });
var ExperimentAnalysisVariantDefinitionSchema = z33.object({
  variant_id: z33.string().min(1).meta(Unrestricted25),
  weight: z33.number().min(0).max(1).meta(Unrestricted25),
  is_control: z33.boolean().default(false).meta(Unrestricted25)
}).meta(transientExperimentMeta("ExperimentAnalysisVariantDefinition"));
var ExperimentAssignmentCountSchema = z33.object({
  variant_id: z33.string().min(1).meta(Unrestricted25),
  assigned_count: z33.number().int().min(0).meta(Unrestricted25)
}).meta(transientExperimentMeta("ExperimentAssignmentCount"));
var ExperimentAnalysisDefinitionSchema = z33.object({
  experiment_handle: HandleField.meta(Unrestricted25),
  experiment_version: z33.number().int().min(1).meta(Unrestricted25),
  variants: z33.array(ExperimentAnalysisVariantDefinitionSchema).min(2).meta(Unrestricted25),
  assignment_counts: z33.array(ExperimentAssignmentCountSchema).default([]).meta(Unrestricted25),
  analysis_provider: ProviderProvenanceSchema.meta(Unrestricted25),
  assignment_unit: AnalyticsAnalyticalUnitSchema.optional().meta(Unrestricted25),
  primary_metric: AnalyticsSemanticIdSchema.optional().meta(Unrestricted25),
  guardrail_metrics: z33.array(AnalyticsSemanticIdSchema).default([]).meta(Unrestricted25)
}).superRefine((definition, ctx) => {
  const identifiers = definition.variants.map((variant) => variant.variant_id);
  if (new Set(identifiers).size !== identifiers.length) {
    ctx.addIssue({ code: "custom", path: ["variants"], message: "variant identifiers must be unique" });
  }
  const controlCount = definition.variants.filter((variant) => variant.is_control).length;
  if (controlCount !== 1) {
    ctx.addIssue({ code: "custom", path: ["variants"], message: "an analysis definition requires exactly one control variant" });
  }
  const weightTotal = definition.variants.reduce((total, variant) => total + variant.weight, 0);
  if (weightTotal <= 0) {
    ctx.addIssue({ code: "custom", path: ["variants"], message: "variant weights must have a positive total" });
  }
  const countIdentifiers = definition.assignment_counts.map((count) => count.variant_id);
  if (new Set(countIdentifiers).size !== countIdentifiers.length) {
    ctx.addIssue({ code: "custom", path: ["assignment_counts"], message: "assignment-count variant identifiers must be unique" });
  }
  if (countIdentifiers.some((identifier) => !identifiers.includes(identifier))) {
    ctx.addIssue({ code: "custom", path: ["assignment_counts"], message: "assignment counts contain a variant absent from the definition" });
  }
}).meta(transientExperimentMeta("ExperimentAnalysisDefinition"));
var ExperimentDecisionTypeSchema = z33.enum([
  "ship_all",
  "ship_segment",
  "ramp_with_guardrails",
  "iterate_followup",
  "hold_inconclusive",
  "reject_harm",
  "neutral_no_material_effect",
  "invalid_experiment",
  "redesign_randomization"
]).meta(transientExperimentMeta("ExperimentDecisionType"));
var ExperimentDecisionFindingCodeSchema = z33.enum([
  "srm_fail",
  "guardrail_harm",
  "exposure_integrity_failure",
  "assignment_collision",
  "immature_observation",
  "carryover_fail",
  "validity_signal_unavailable",
  "followup_required"
]).meta(transientExperimentMeta("ExperimentDecisionFindingCode"));
var ExperimentDecisionFindingSchema = z33.object({
  code: ExperimentDecisionFindingCodeSchema.meta(Unrestricted25),
  severity: z33.enum(["info", "warning", "blocking"]).meta(Unrestricted25),
  /** Catalog metric id the finding is about, where metric-scoped. */
  metric: AnalyticsSemanticIdSchema.optional().meta(Unrestricted25),
  message: z33.string().min(1).max(500).meta(Unrestricted25)
}).meta(transientExperimentMeta("ExperimentDecisionFinding"));
var ExperimentDecisionRecordSchema = IdField.merge(TenantIdField).extend({
  created_at: z33.string().datetime().meta({ ...Unrestricted25, readOnly: true }),
  experiment_handle: HandleField.meta(Unrestricted25),
  experiment_version: z33.number().int().min(1).meta(Unrestricted25),
  decision: ExperimentDecisionTypeSchema.meta(Unrestricted25),
  selected_variant_keys: z33.array(z33.string().min(1)).optional().meta(Unrestricted25),
  /** Segment handles a `ship_segment` decision is scoped to. */
  selected_segments: z33.array(HandleField).optional().meta(Unrestricted25),
  /** Persisted ExperimentAnalysisResultRecord ids the decision consumed. */
  analysis_result_ids: z33.array(z33.string().min(1)).meta(Unrestricted25),
  policy_schema_version: z33.number().int().min(1).meta(Unrestricted25),
  health_state: z33.string().min(1).max(100).meta(Unrestricted25),
  findings: z33.array(ExperimentDecisionFindingSchema).meta(Unrestricted25),
  /** Caller-supplied decision time — never the evaluator's wall clock. */
  decided_at: z33.string().datetime().meta(Unrestricted25),
  evaluator: z33.object({
    name: z33.string().min(1).max(100).meta(Unrestricted25),
    version: z33.string().min(1).max(100).meta(Unrestricted25)
  }).meta(Unrestricted25)
}).meta({ id: "ExperimentDecisionRecord", "x-revturbine-schema-persistence": Persisted14, "x-revturbine-schema-exposure": Internal20, ...EXPERIMENT_RESULT_FACETS });
var ObservationMaturitySchema = z33.object({
  /** Simulated or real data watermark the maturity was computed at. */
  observed_through: z33.string().datetime().meta(Unrestricted25),
  runtime_days: z33.number().min(0).meta(Unrestricted25),
  complete_windows: z33.array(z33.string().min(1)).meta(Unrestricted25),
  incomplete_windows: z33.array(z33.string().min(1)).meta(Unrestricted25),
  eligible_for_decision: z33.boolean().meta(Unrestricted25),
  reasons: z33.array(z33.string().min(1)).meta(Unrestricted25)
}).meta(transientExperimentMeta("ObservationMaturity"));
var ExperimentAssignmentFactSchema = z33.object({
  schema_version: z33.literal(1).meta(Unrestricted25),
  tenant_id: z33.string().min(1).meta(Unrestricted25),
  environment_id: z33.string().min(1).meta(Unrestricted25),
  /** Idempotency key: hash(tenant, handle, version, unit, subject). */
  assignment_id: z33.string().min(1).meta(Unrestricted25),
  experiment_handle: HandleField.meta(Unrestricted25),
  experiment_version: z33.number().int().min(1).meta(Unrestricted25),
  assignment_unit: AnalyticsAnalyticalUnitSchema.meta(Unrestricted25),
  /** Stable identifier for the declared assignment unit. */
  subject_id: z33.string().min(1).meta(Unrestricted25),
  variant_key: z33.string().min(1).meta(Unrestricted25),
  /** Allocation provenance (native provider handle/version, or adapter). */
  provider: ProviderProvenanceSchema.meta(Unrestricted25),
  assigned_at: z33.string().datetime().meta(Unrestricted25),
  playbook_version: z33.string().min(1).optional().meta(Unrestricted25),
  decision_id: z33.string().min(1).optional().meta(Unrestricted25),
  /** Simulation dataset identity (war-games spec §11.4), absent in production. */
  simulation_id: z33.string().min(1).optional().meta(Unrestricted25),
  test: z33.boolean().optional().meta(Unrestricted25)
}).meta(transientExperimentMeta("ExperimentAssignmentFact"));
var ExperimentMetricEvidencePlanSchema = z33.object({
  metric: AnalyticsSemanticIdSchema.meta(Unrestricted25),
  role: z33.enum(["primary", "guardrail", "diagnostic", "exploratory"]).meta(Unrestricted25),
  statistical_type: AnalyticsMetricStatisticalTypeSchema.meta(Unrestricted25),
  analysis_unit: AnalyticsAnalyticalUnitSchema.meta(Unrestricted25),
  source_scope: AnalyticsSourceScopeSchema.meta(Unrestricted25),
  numerator_metric: AnalyticsSemanticIdSchema.optional().meta(Unrestricted25),
  denominator_metric: AnalyticsSemanticIdSchema.optional().meta(Unrestricted25),
  observation_window: ExperimentObservationWindowSchema.meta(Unrestricted25),
  provider_query: z33.object({
    /** Versioned summary endpoint name, e.g. `experiment_binary_summary_v1`. */
    endpoint: z33.string().min(1).max(100).meta(Unrestricted25),
    version: z33.number().int().min(1).meta(Unrestricted25),
    parameters: z33.record(z33.string(), z33.json()).meta(Unrestricted25)
  }).meta(Unrestricted25)
}).meta(transientExperimentMeta("ExperimentMetricEvidencePlan"));
var WarGameScenarioIdField = z33.string().regex(/^WG-[A-Z0-9_]+-\d{3}$/);
var WarGameQualificationLevelSchema = z33.enum(["evidence_replay", "event_replay", "interactive"]).meta(transientExperimentMeta("WarGameQualificationLevel"));
var WarGameCategorySchema = z33.enum([
  "content",
  "placement",
  "entitlement",
  "packaging",
  "pricing",
  "trial",
  "promotion",
  "activation",
  "collaboration",
  "retention",
  "validity",
  "custom"
]).meta(transientExperimentMeta("WarGameCategory"));
var WarGameCapabilityRequirementsSchema = z33.object({
  level: WarGameQualificationLevelSchema.meta(Unrestricted25),
  assignment_units: z33.array(AnalyticsAnalyticalUnitSchema).meta(Unrestricted25),
  treatments: z33.array(z33.enum(["placement", "entitlement", "plan", "pricing", "custom"])).meta(Unrestricted25),
  evidence: z33.array(AnalyticsMetricStatisticalTypeSchema).meta(Unrestricted25),
  analysis: z33.array(z33.string().min(1)).meta(Unrestricted25),
  decisions: z33.array(z33.string().min(1)).meta(Unrestricted25),
  advanced: z33.array(z33.string().min(1)).meta(Unrestricted25)
}).meta(transientExperimentMeta("WarGameCapabilityRequirements"));
var WarGameScenarioSchema = z33.object({
  /** `WG-<CATEGORY>-<NNN>`. */
  id: WarGameScenarioIdField.meta(Unrestricted25),
  version: z33.number().int().min(1).meta(Unrestricted25),
  title: z33.string().min(1).max(300).meta(Unrestricted25),
  description: z33.string().max(2e3).meta(Unrestricted25),
  /** War-game taxonomy; experiments under test keep canonical `experiment_type`. */
  category: WarGameCategorySchema.meta(Unrestricted25),
  qualification_level: WarGameQualificationLevelSchema.meta(Unrestricted25),
  hypothesis: z33.string().min(1).max(2e3).meta(Unrestricted25),
  /** Experiments defined in the scenario's public manifest. */
  experiment_handles: z33.array(HandleField).min(1).meta(Unrestricted25),
  /** WarGamePopulationDefinition — extends the shipped latent model (§11.2). */
  population: z33.record(z33.string(), z33.json()).meta(Unrestricted25),
  /** WarGameObservationPolicy — windows + predeclared analysis looks. */
  observation: z33.record(z33.string(), z33.json()).meta(Unrestricted25),
  /** WarGameFaultInjection entries (§12). */
  faults: z33.array(z33.record(z33.string(), z33.json())).optional().meta(Unrestricted25),
  requires: WarGameCapabilityRequirementsSchema.meta(Unrestricted25),
  seed: z33.string().min(1).meta(Unrestricted25),
  /** Dataset identity minted with the scenario; every emitted fact carries it (§11.4). */
  simulation_id: z33.string().min(1).meta(Unrestricted25)
}).strict().meta(transientExperimentMeta("WarGameScenario"));
var WarGameOracleSchema = z33.object({
  scenario_id: WarGameScenarioIdField.meta(Unrestricted25),
  scenario_version: z33.number().int().min(1).meta(Unrestricted25),
  statistical_truth: z33.object({
    /** Per metric id, per variant. */
    treatment_effects: z33.array(z33.record(z33.string(), z33.json())).meta(Unrestricted25),
    interactions: z33.array(z33.record(z33.string(), z33.json())).optional().meta(Unrestricted25),
    delayed_effects: z33.array(z33.record(z33.string(), z33.json())).optional().meta(Unrestricted25),
    contamination: z33.record(z33.string(), z33.json()).optional().meta(Unrestricted25),
    validity_faults: z33.array(z33.record(z33.string(), z33.json())).optional().meta(Unrestricted25)
  }).meta(Unrestricted25),
  business_truth: z33.object({
    expected_decision: ExperimentDecisionTypeSchema.meta(Unrestricted25),
    acceptable_alternatives: z33.array(ExperimentDecisionTypeSchema).optional().meta(Unrestricted25),
    forbidden_decisions: z33.array(ExperimentDecisionTypeSchema).optional().meta(Unrestricted25),
    /** Finding codes (§8.3) the decision must surface. */
    required_findings: z33.array(ExperimentDecisionFindingCodeSchema).optional().meta(Unrestricted25),
    /** Segment handles a segment decision must be scoped to. */
    required_segments: z33.array(HandleField).optional().meta(Unrestricted25)
  }).meta(Unrestricted25),
  observability_truth: z33.object({
    /** Simulated time before which no ship decision can be correct. */
    earliest_valid_decision_at: z33.string().datetime().optional().meta(Unrestricted25),
    required_windows: z33.array(z33.string().min(1)).optional().meta(Unrestricted25),
    intentionally_missing_signals: z33.array(z33.string().min(1)).optional().meta(Unrestricted25)
  }).meta(Unrestricted25)
}).strict().meta(transientExperimentMeta("WarGameOracle"));
var WarGameGradeSchema = z33.object({
  scenario_id: WarGameScenarioIdField.meta(Unrestricted25),
  passed: z33.boolean().meta(Unrestricted25),
  hard_failure: z33.boolean().meta(Unrestricted25),
  score: z33.number().min(0).max(100).meta(Unrestricted25),
  sections: z33.object({
    validity: z33.number().min(0).max(20).meta(Unrestricted25),
    causal_conclusion: z33.number().min(0).max(25).meta(Unrestricted25),
    business_decision: z33.number().min(0).max(20).meta(Unrestricted25),
    guardrails: z33.number().min(0).max(15).meta(Unrestricted25),
    heterogeneity: z33.number().min(0).max(10).meta(Unrestricted25),
    delayed_outcomes: z33.number().min(0).max(5).meta(Unrestricted25),
    /** Findings/evidence completeness. */
    explanation: z33.number().min(0).max(5).meta(Unrestricted25)
  }).meta(Unrestricted25),
  failures: z33.array(z33.string().min(1)).meta(Unrestricted25),
  warnings: z33.array(z33.string().min(1)).meta(Unrestricted25)
}).strict().meta(transientExperimentMeta("WarGameGrade"));
var ExperimentSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z33.string().min(1).meta({ ...Unrestricted25, readOnly: true }),
  name: NameField.meta(Unrestricted25),
  handle: HandleField.meta(Unrestricted25),
  description: z33.string().max(1e3).optional().meta(Unrestricted25),
  experiment_type: ExperimentTypeSchema.meta(Unrestricted25),
  status: ExperimentStatusSchema.default("draft").meta(Unrestricted25),
  target_resource_id: z33.string().optional().meta(Unrestricted25),
  /** Canonical segment-handle references. */
  target_segments: z33.array(z33.string()).optional().meta(Unrestricted25),
  variants: z33.array(ExperimentVariantSchema).min(2).meta(Unrestricted25),
  primary_metric: AnalyticsSemanticIdSchema.meta(Unrestricted25),
  guardrail_metrics: z33.array(AnalyticsSemanticIdSchema).optional().meta(Unrestricted25),
  assignment_unit: AnalyticsAnalyticalUnitSchema.optional().meta(Unrestricted25),
  /**
   * Assignment ownership for new authoring. Omitted legacy rows are resolved
   * during the additive migration/read window; SDK clients remain compatible.
   */
  assignment_source: ExperimentAssignmentSourceSchema.optional().meta(Unrestricted25),
  /** @deprecated Client assignment is configured in SDK initialization. */
  assignment_provider_binding: ProviderBindingRefSchema.extend({
    capability: z33.literal("experiment_assignment"),
    allocation_mode: ExperimentAllocationModeSchema
  }).optional().meta({ ...Unrestricted25, deprecated: true, readOnly: true }),
  evidence_provider_binding: ProviderBindingRefSchema.extend({
    capability: z33.literal("experiment_evidence")
  }).optional().meta(Unrestricted25),
  analysis_provider_binding: ProviderBindingRefSchema.extend({
    capability: z33.literal("experiment_analysis")
  }).optional().meta(Unrestricted25),
  analysis_config: ExperimentAnalysisConfigSchema.optional().meta(Unrestricted25),
  /**
   * Deterministic business-decision policy (war-games spec §8.1). Immutable
   * while the version is running — see
   * {@link assertExperimentDecisionPolicyUpdateAllowed}.
   */
  decision_policy: ExperimentDecisionPolicySchema.optional().meta(Unrestricted25),
  // Lift below control that triggers the "Experiment trending negative"
  // Needs Attention rule (plan 02c). 0.05 = 5% relative lift below control.
  metric_threshold: z33.number().default(0.05).meta(Unrestricted25),
  secondary_metrics: z33.array(AnalyticsSemanticIdSchema).default([]).meta(Unrestricted25),
  /**
   * Explanatory-only metrics (war-games spec §8.4): analyzed for context,
   * never able to promote a winner or block shipment. Additive beside
   * `guardrail_metrics` / `secondary_metrics` (which are exploratory).
   */
  diagnostic_metrics: z33.array(AnalyticsSemanticIdSchema).default([]).meta(Unrestricted25),
  traffic_allocation: z33.number().min(0).max(1).default(1).meta(Unrestricted25),
  started_at: NullableDatetimeField.meta(Unrestricted25),
  ended_at: NullableDatetimeField.meta(Unrestricted25),
  confidence_threshold: z33.number().min(0).max(1).default(0.95).meta(Unrestricted25),
  winning_variant_id: z33.string().nullable().default(null).meta(Unrestricted25),
  metadata: MetadataField.meta(Unrestricted25)
}).meta(
  { id: "Experiment", "x-revturbine-schema-persistence": Persisted14, "x-revturbine-schema-exposure": Internal20, ...PENDING_PLAYBOOK_SDK_FACETS3, ...namedIdentity() }
);
var ExperimentAnchorSchema = makeAnchor("ExperimentAnchor");
var SuggestionSeveritySchema = SeveritySchema;
var OptimizationSuggestionSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  experiment_id: z33.string().optional().meta(Unrestricted25),
  resource_type: z33.string().min(1).meta(Unrestricted25),
  resource_id: z33.string().min(1).meta(Unrestricted25),
  severity: SuggestionSeveritySchema.default("info").meta(Unrestricted25),
  title: z33.string().min(1).max(300).meta(Unrestricted25),
  description: z33.string().max(2e3).meta(Unrestricted25),
  suggested_action: z33.string().max(1e3).optional().meta(Unrestricted25),
  estimated_impact: z33.number().optional().meta(Unrestricted25),
  detector_id: z33.string().min(1).nullable().optional().meta(Unrestricted25),
  detector_version: z33.number().int().min(1).nullable().optional().meta(Unrestricted25),
  opportunity_type: z33.string().min(1).nullable().optional().meta(Unrestricted25),
  evidence: z33.array(OpportunityEvidenceSchema).nullable().optional().meta(Unrestricted25),
  hypothesis: z33.string().min(1).nullable().optional().meta(Unrestricted25),
  confidence: z33.number().min(0).max(1).nullable().optional().meta(Unrestricted25),
  is_dismissed: z33.boolean().default(false).meta(Unrestricted25),
  metadata: MetadataField.meta(Unrestricted25)
}).meta(
  { id: "OptimizationSuggestion", "x-revturbine-schema-persistence": Persisted14, "x-revturbine-schema-exposure": Internal20 }
);
var experimentPaths = {
  "/api/experiment-evidence-snapshots": {
    get: operation({
      operationId: "listExperimentEvidenceSnapshots",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List immutable experiment evidence snapshots",
      tags: ["experiments"],
      responses: { "200": { description: "Experiment evidence snapshots", content: { "application/json": { schema: ListEnvelope(ExperimentEvidenceSnapshotSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiment-evidence-snapshots", persistence: { table: "experimentEvidenceSnapshots", mode: "list" } }
    })
  },
  "/api/experiment-analysis-results": {
    get: operation({
      operationId: "listExperimentAnalysisResults",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List immutable experiment analysis results",
      tags: ["experiments"],
      responses: { "200": { description: "Experiment analysis results", content: { "application/json": { schema: ListEnvelope(ExperimentAnalysisResultRecordSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiment-analysis-results", persistence: { table: "experimentAnalysisResults", mode: "list" } }
    })
  },
  "/api/experiment-decision-records": {
    get: operation({
      operationId: "listExperimentDecisionRecords",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List immutable experiment decision records",
      tags: ["experiments"],
      responses: { "200": { description: "Experiment decision records", content: { "application/json": { schema: ListEnvelope(ExperimentDecisionRecordSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiment-decision-records", persistence: { table: "experimentDecisionRecords", mode: "list" } }
    })
  },
  "/api/experiment-anchors": {
    get: operation({
      operationId: "listExperimentAnchors",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List experiment anchors (identity registry)",
      tags: ["experiments"],
      responses: {
        "200": { description: "Experiment anchor list", content: { "application/json": { schema: ListEnvelope(ExperimentAnchorSchema) } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "experiment-anchors", persistence: { table: "experiments", mode: "list" } }
    })
  },
  "/api/experiments": {
    get: operation({
      operationId: "listExperiments",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List experiments",
      tags: ["experiments"],
      responses: { "200": { description: "Experiment list", content: { "application/json": { schema: ListEnvelope(ExperimentSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiments", persistence: { table: "experimentVersions", mode: "list" } }
    }),
    post: operation({
      operationId: "createExperiment",
      summary: "Create experiment",
      tags: ["experiments"],
      requestBody: { required: true, content: { "application/json": { schema: ExperimentSchema } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: ExperimentSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiments", persistence: { table: "experimentVersions", mode: "create" } }
    })
  },
  "/api/experiments/{experimentId}": {
    get: operation({
      operationId: "getExperiment",
      requestParams: { path: z33.object({ experimentId: z33.string() }) },
      summary: "Get experiment",
      tags: ["experiments"],
      responses: { "200": { description: "Experiment", content: { "application/json": { schema: ExperimentSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiments", persistence: { table: "experimentVersions", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateExperiment",
      requestParams: { path: z33.object({ experimentId: z33.string() }) },
      summary: "Update experiment",
      tags: ["experiments"],
      requestBody: { required: true, content: { "application/json": { schema: ExperimentSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: ExperimentSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiments", persistence: { table: "experimentVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteExperiment",
      requestParams: { path: z33.object({ experimentId: z33.string() }) },
      summary: "Delete experiment",
      tags: ["experiments"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiments", persistence: { table: "experimentVersions", mode: "delete" } }
    })
  },
  "/api/experiments/{experimentId}/start": {
    post: operation({
      operationId: "startExperiment",
      requestParams: { path: z33.object({ experimentId: z33.string() }) },
      summary: "Start experiment (begin traffic allocation)",
      tags: ["experiments"],
      responses: { "200": { description: "Started", content: { "application/json": { schema: ExperimentSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiments", persistence: { table: "experimentVersions", mode: "update" } }
    })
  },
  "/api/experiments/{experimentId}/pause": {
    post: operation({
      operationId: "pauseExperiment",
      requestParams: { path: z33.object({ experimentId: z33.string() }) },
      summary: "Pause running experiment",
      tags: ["experiments"],
      responses: { "200": { description: "Paused", content: { "application/json": { schema: ExperimentSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiments", persistence: { table: "experimentVersions", mode: "update" } }
    })
  },
  "/api/experiments/{experimentId}/complete": {
    post: operation({
      operationId: "completeExperiment",
      requestParams: { path: z33.object({ experimentId: z33.string() }) },
      summary: "Complete experiment and declare winner",
      tags: ["experiments"],
      requestBody: { required: true, content: { "application/json": { schema: z33.object({ winning_variant_id: z33.string() }) } } },
      responses: { "200": { description: "Completed", content: { "application/json": { schema: ExperimentSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiments", persistence: { table: "experimentVersions", mode: "update" } }
    })
  },
  "/api/optimization-suggestions": {
    get: operation({
      operationId: "listOptimizationSuggestions",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List optimization suggestions",
      tags: ["experiments"],
      responses: { "200": { description: "Suggestion list", content: { "application/json": { schema: ListEnvelope(OptimizationSuggestionSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "optimization-suggestions", persistence: { table: "optimizationSuggestions", mode: "list" } }
    })
  },
  "/api/optimization-suggestions/{suggestionId}/dismiss": {
    post: operation({
      operationId: "dismissOptimizationSuggestion",
      requestParams: { path: z33.object({ suggestionId: z33.string() }) },
      summary: "Dismiss an optimization suggestion",
      tags: ["experiments"],
      responses: { "200": { description: "Dismissed", content: { "application/json": { schema: OptimizationSuggestionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "optimization-suggestions", persistence: { table: "optimizationSuggestions", mode: "update" } }
    })
  }
};

// scaffold/src/promotions/models/schema.ts
import { z as z34 } from "zod";
var { Unrestricted: Unrestricted26, Financial: Financial5 } = DataClassification;
var { Persisted: Persisted15, Transient: Transient25 } = SchemaPersistence;
var { Internal: Internal21 } = SchemaExposure;
var PLAYBOOK_SDK_FACETS7 = schemaFacets(SchemaContext.Playbook, { sdkInput: true });
var PromotionStatusSchema = z34.enum(["draft", "scheduled", "live", "expired", "archived"]).meta(
  { id: "PromotionStatus", "x-revturbine-schema-persistence": Transient25, "x-revturbine-schema-exposure": Internal21 }
);
var DiscountTypeSchema = z34.enum(["percentage", "fixed_amount", "free_months"]).meta(
  { id: "DiscountType", "x-revturbine-schema-persistence": Transient25, "x-revturbine-schema-exposure": Internal21 }
);
var PromotionSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z34.string().min(1).meta({ ...Unrestricted26, readOnly: true }),
  name: NameField.meta(Unrestricted26),
  handle: HandleField.meta(Unrestricted26),
  description: z34.string().max(1e3).optional().meta(Unrestricted26),
  rt_status: PromotionStatusSchema.default("draft").meta(Unrestricted26),
  discount_type: DiscountTypeSchema.meta(Unrestricted26),
  discount_value: z34.number().min(0).meta(Financial5),
  currency: z34.string().length(3).default("USD").meta(Financial5),
  applicable_plan_ids: z34.array(z34.string()).default([]).meta(Unrestricted26),
  applicable_addon_ids: z34.array(z34.string()).default([]).meta(Unrestricted26),
  target_segment_ids: z34.array(z34.string()).default([]).meta(Unrestricted26),
  max_redemptions: z34.number().int().min(0).nullable().default(null).meta(Unrestricted26),
  current_redemptions: z34.number().int().min(0).default(0).meta({ ...Unrestricted26, readOnly: true }),
  coupon_code: z34.string().max(100).optional().meta(Unrestricted26),
  starts_at: NullableDatetimeField.meta(Unrestricted26),
  ends_at: NullableDatetimeField.meta(Unrestricted26),
  // Stripe integration
  stripe_coupon_id: z34.string().nullable().default(null).meta(Unrestricted26),
  stripe_promotion_code_id: z34.string().nullable().default(null).meta(Unrestricted26),
  auto_sync_stripe: z34.boolean().default(false).meta(Unrestricted26),
  metadata: MetadataField.meta(Unrestricted26)
}).meta(
  { id: "Promotion", "x-revturbine-schema-persistence": Persisted15, "x-revturbine-schema-exposure": Internal21, ...PLAYBOOK_SDK_FACETS7, ...namedIdentity() }
);
var PromotionAnchorSchema = makeAnchor("PromotionAnchor");
var promotionPaths = {
  "/api/promotion-anchors": {
    get: operation({
      operationId: "listPromotionAnchors",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List promotion anchors (identity registry)",
      tags: ["promotions"],
      responses: {
        "200": { description: "Promotion anchor list", content: { "application/json": { schema: ListEnvelope(PromotionAnchorSchema) } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "promotion-anchors", persistence: { table: "promotions", mode: "list" } }
    })
  },
  "/api/promotions": {
    get: operation({
      operationId: "listPromotions",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List promotions",
      tags: ["promotions"],
      responses: { "200": { description: "Promotion list", content: { "application/json": { schema: ListEnvelope(PromotionSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "promotions", persistence: { table: "promotionVersions", mode: "list" } }
    }),
    post: operation({
      operationId: "createPromotion",
      summary: "Create promotion",
      tags: ["promotions"],
      requestBody: { required: true, content: { "application/json": { schema: PromotionSchema } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: PromotionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "promotions", persistence: { table: "promotionVersions", mode: "create" } }
    })
  },
  "/api/promotions/{promotionId}": {
    get: operation({
      operationId: "getPromotion",
      requestParams: { path: z34.object({ promotionId: z34.string() }) },
      summary: "Get promotion",
      tags: ["promotions"],
      responses: { "200": { description: "Promotion", content: { "application/json": { schema: PromotionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "promotions", persistence: { table: "promotionVersions", mode: "get" } }
    }),
    patch: operation({
      operationId: "updatePromotion",
      requestParams: { path: z34.object({ promotionId: z34.string() }) },
      summary: "Update promotion",
      tags: ["promotions"],
      requestBody: { required: true, content: { "application/json": { schema: PromotionSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: PromotionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "promotions", persistence: { table: "promotionVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deletePromotion",
      requestParams: { path: z34.object({ promotionId: z34.string() }) },
      summary: "Delete (archive) promotion",
      tags: ["promotions"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "promotions", persistence: { table: "promotionVersions", mode: "delete" } }
    })
  },
  "/api/promotions/{promotionId}/sync-stripe": {
    post: operation({
      operationId: "syncPromotionToStripe",
      requestParams: { path: z34.object({ promotionId: z34.string() }) },
      summary: "Sync promotion to Stripe as coupon/promotion code",
      tags: ["promotions"],
      responses: { "200": { description: "Synced", content: { "application/json": { schema: PromotionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "promotions", persistence: { table: "promotionVersions", mode: "update" } }
    })
  },
  "/api/promotions/{promotionId}/duplicate": {
    post: operation({
      operationId: "duplicatePromotion",
      requestParams: { path: z34.object({ promotionId: z34.string() }) },
      summary: "Duplicate promotion",
      tags: ["promotions"],
      responses: { "201": { description: "Duplicated", content: { "application/json": { schema: PromotionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "promotions", persistence: { table: "promotionVersions", mode: "create" } }
    })
  }
};

// scaffold/src/config/models/schema.ts
import { z as z35 } from "zod";
var { Unrestricted: Unrestricted27 } = DataClassification;
var { Persisted: Persisted16, Transient: Transient26 } = SchemaPersistence;
var { Internal: Internal22, External: External13 } = SchemaExposure;
var PLAYBOOK_SDK_FACETS8 = schemaFacets(SchemaContext.Playbook, { sdkInput: true });
var PLAYBOOK_AUTHORING_FACETS2 = schemaFacets(SchemaContext.Playbook, { sdkInput: false });
var PENDING_PLAYBOOK_FACETS4 = schemaFacets(SchemaContext.Playbook, {
  inConfig: false,
  sdkInput: false
});
var PENDING_PLAYBOOK_SDK_FACETS4 = schemaFacets(SchemaContext.Playbook, {
  inConfig: false,
  sdkInput: true
});
var PLAYBOOK_VERSION_HEADER_FACETS = schemaFacets(SchemaContext.Playbook, {
  inConfig: false,
  sdkInput: true,
  source: SchemaSource.CodeConstant
});
var PLAYBOOK_PROVENANCE_HEADER_FACETS = schemaFacets(SchemaContext.Playbook, {
  inConfig: false,
  sdkInput: true,
  source: SchemaSource.Runtime
});
var PLAYBOOK_TARGET_FACETS = schemaFacets(SchemaContext.Playbook, {
  inConfig: false,
  sdkInput: false,
  source: SchemaSource.Runtime
});
var BILLING_FACETS2 = schemaFacets(SchemaContext.Billing, { sdkInput: false });
var METERING_FACETS = schemaFacets(SchemaContext.Metering, { sdkInput: false });
var LEGACY_BRANDING_FACETS = schemaFacets(SchemaContext.Branding, {
  inConfig: true,
  sdkInput: true
});
var BRANDING_FACETS2 = schemaFacets(SchemaContext.Branding, { sdkInput: false });
var PLAYBOOK_FORMAT_VERSION = "1.0.0";
var SeatTypeSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z35.string().min(1).meta({ ...Unrestricted27, readOnly: true }),
  name: NameField.meta(Unrestricted27),
  handle: HandleField.meta(Unrestricted27),
  description: DescriptionField.meta(Unrestricted27),
  is_default: z35.boolean().default(false).meta(Unrestricted27),
  entitlement_ids: z35.array(z35.string()).default([]).meta(Unrestricted27),
  metadata: MetadataField.meta(Unrestricted27)
}).meta(
  { id: "SeatType", "x-revturbine-schema-persistence": Persisted16, "x-revturbine-schema-exposure": Internal22, ...PENDING_PLAYBOOK_FACETS4, ...namedIdentity() }
);
var SeatTypeAnchorSchema = makeAnchor("SeatTypeAnchor");
var PersonalizationTokenSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z35.string().min(1).meta({ ...Unrestricted27, readOnly: true }),
  handle: HandleField.meta(Unrestricted27),
  label: z35.string().min(1).meta(Unrestricted27),
  description: z35.string().nullable().default(null).meta(Unrestricted27),
  category: z35.enum(["user", "plan", "usage", "trial", "billing", "promotion", "custom"]).meta(Unrestricted27),
  data_source: z35.string().nullable().default(null).meta(Unrestricted27),
  example_value: z35.string().nullable().default(null).meta(Unrestricted27),
  value_map: z35.record(z35.string(), z35.string()).default({}).meta(Unrestricted27),
  format: z35.enum(["string", "number", "currency", "percentage", "date"]).nullable().default(null).meta(Unrestricted27),
  metadata: MetadataField.meta(Unrestricted27)
}).meta(
  { id: "PersonalizationToken", "x-revturbine-schema-persistence": Persisted16, "x-revturbine-schema-exposure": Internal22, ...PENDING_PLAYBOOK_FACETS4, ...namedIdentity() }
);
var PersonalizationTokenAnchorSchema = makeAnchor("PersonalizationTokenAnchor");
var ObjectiveSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z35.string().min(1).meta({ ...Unrestricted27, readOnly: true }),
  handle: HandleField.meta(Unrestricted27),
  name: NameField.meta(Unrestricted27),
  description: DescriptionField.meta(Unrestricted27),
  metadata: MetadataField.meta(Unrestricted27)
}).meta(
  { id: "Objective", "x-revturbine-schema-persistence": Persisted16, "x-revturbine-schema-exposure": Internal22, ...PLAYBOOK_AUTHORING_FACETS2, ...namedIdentity() }
);
var ObjectiveAnchorSchema = makeAnchor("ObjectiveAnchor");
var OnboardingStateSchema = z35.enum(["not_started", "started", "details_submitted", "charges_enabled", "activated", "deauthorized"]).meta({ id: "OnboardingState", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": Internal22 });
var StripeIntegrationConfigSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  handle: HandleField.meta({ ...Unrestricted27, readOnly: true }),
  stripe_account_id: z35.string().min(1).meta(Unrestricted27),
  live_mode: z35.boolean().default(false).meta(Unrestricted27),
  /** Funnel state for the Connect onboarding pipeline. */
  onboarding_state: OnboardingStateSchema.default("not_started").meta({ ...Unrestricted27, readOnly: true }),
  /** Connect onboarding status — tracks whether hosted onboarding is complete. */
  onboarding_complete: z35.boolean().default(false).meta({ ...Unrestricted27, readOnly: true }),
  /** Whether the connected account can process charges (read from Stripe). */
  charges_enabled: z35.boolean().default(false).meta({ ...Unrestricted27, readOnly: true }),
  /** Whether the connected account has details submitted (read from Stripe). */
  details_submitted: z35.boolean().default(false).meta({ ...Unrestricted27, readOnly: true }),
  /** Whether the connected account can receive payouts (read from Stripe). */
  payouts_enabled: z35.boolean().default(false).meta({ ...Unrestricted27, readOnly: true }),
  webhook_secret_set: z35.boolean().default(false).meta({ ...Unrestricted27, readOnly: true }),
  sync_products: z35.boolean().default(true).meta(Unrestricted27),
  sync_prices: z35.boolean().default(true).meta(Unrestricted27),
  sync_subscriptions: z35.boolean().default(true).meta(Unrestricted27),
  sync_invoices: z35.boolean().default(false).meta(Unrestricted27),
  default_currency: z35.string().length(3).default("USD").meta(Unrestricted27),
  tax_behavior: z35.enum(["inclusive", "exclusive", "unspecified"]).default("unspecified").meta(Unrestricted27),
  /** ISO timestamp of the last successful full data sync from Stripe. */
  last_sync_at: z35.string().optional().meta({ ...Unrestricted27, readOnly: true }),
  metadata: MetadataField.meta(Unrestricted27)
}).meta(
  { id: "StripeIntegrationConfig", "x-revturbine-schema-persistence": Persisted16, "x-revturbine-schema-exposure": Internal22, ...BILLING_FACETS2, ...mintedIdentity() }
);
var BrandingConfigSchema = z35.object({
  theme: z35.record(z35.string(), z35.unknown()).optional().meta(Unrestricted27),
  workspace_name: z35.string().optional().meta(Unrestricted27),
  logo_url: z35.string().optional().meta(Unrestricted27),
  support_email: z35.string().optional().meta(Unrestricted27)
}).meta(
  {
    id: "BrandingConfig",
    "x-revturbine-schema-persistence": Transient26,
    "x-revturbine-schema-exposure": External13,
    ...BRANDING_FACETS2
  }
);
var MeteringConfigSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  handle: HandleField.meta({ ...Unrestricted27, readOnly: true }),
  entitlement_id: z35.string().min(1).meta(Unrestricted27),
  meter_key: z35.string().min(1).max(100).meta(Unrestricted27),
  aggregation_type: z35.enum(["sum", "count", "max", "last_value"]).default("sum").meta(Unrestricted27),
  reset_period: z35.enum(["none", "daily", "weekly", "monthly", "yearly"]).default("monthly").meta(Unrestricted27),
  stripe_meter_id: z35.string().nullable().default(null).meta(Unrestricted27),
  is_active: z35.boolean().default(true).meta(Unrestricted27),
  metadata: MetadataField.meta(Unrestricted27)
}).meta(
  { id: "MeteringConfig", "x-revturbine-schema-persistence": Persisted16, "x-revturbine-schema-exposure": Internal22, ...METERING_FACETS, ...mintedIdentity() }
);
var EnforcementActionSchema = z35.enum(["block", "warn", "downgrade", "throttle", "notify_admin", "custom"]).meta(
  { id: "EnforcementAction", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": Internal22 }
);
var UsageEnforcementSettingsSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z35.string().min(1).meta({ ...Unrestricted27, readOnly: true }),
  handle: HandleField.meta({ ...Unrestricted27, readOnly: true }),
  entitlement_id: z35.string().min(1).meta(Unrestricted27),
  soft_limit_percent: z35.number().min(0).max(100).default(80).meta(Unrestricted27),
  hard_limit_percent: z35.number().min(0).max(100).default(100).meta(Unrestricted27),
  soft_limit_action: EnforcementActionSchema.default("warn").meta(Unrestricted27),
  hard_limit_action: EnforcementActionSchema.default("block").meta(Unrestricted27),
  grace_period_hours: z35.number().int().min(0).default(0).meta(Unrestricted27),
  notification_channels: z35.array(z35.enum(["email", "in_app", "webhook"])).default(["in_app"]).meta(Unrestricted27),
  is_active: z35.boolean().default(true).meta(Unrestricted27)
}).meta(
  { id: "UsageEnforcementSettings", "x-revturbine-schema-persistence": Persisted16, "x-revturbine-schema-exposure": Internal22, ...PENDING_PLAYBOOK_SDK_FACETS4, ...mintedIdentity() }
);
var UsageEnforcementSettingsAnchorSchema = makeAnchor("UsageEnforcementSettingsAnchor");
var PlacementSettingsCapRuleGroupItemSchema = z35.object({
  kind: z35.enum(["template", "slot"]).meta(Unrestricted27),
  id: z35.string().min(1).meta(Unrestricted27),
  label: z35.string().min(1).optional().meta(Unrestricted27)
}).meta(
  { id: "PlacementSettingsCapRuleGroupItem", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": Internal22 }
);
var PlacementSettingsCapRuleSchema = z35.object({
  id: z35.string().min(1).meta(Unrestricted27),
  group: z35.array(PlacementSettingsCapRuleGroupItemSchema).min(1).meta(Unrestricted27),
  cap: z35.object({
    count: z35.number().int().min(1).meta(Unrestricted27),
    period: z35.enum(["session", "day", "week", "month"]).meta(Unrestricted27)
  }).meta(Unrestricted27)
}).meta(
  { id: "PlacementSettingsCapRule", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": Internal22 }
);
var PlacementTestModeSchema = z35.enum(["off", "test_users", "all_traffic"]).meta(
  { id: "PlacementTestMode", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": Internal22 }
);
var PlacementSettingsCapStateSchema = z35.object({
  capRules: z35.array(PlacementSettingsCapRuleSchema).default([]).meta(Unrestricted27),
  sessionCooldownMinutes: z35.number().int().min(0).default(30).meta(Unrestricted27),
  // Tenant-level default remind-me-later (defer) window, in minutes. A
  // per-payload `remind_later_minutes` overrides it when set (plan 167 REQ-6,
  // Q-3). Rides in this global_frequency_cap jsonb wrapper — no column/`.fbs`.
  remindLaterMinutes: z35.number().int().min(0).default(60).meta(Unrestricted27),
  testMode: PlacementTestModeSchema.default("off").meta(Unrestricted27)
}).meta(
  { id: "PlacementSettingsCapState", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": Internal22 }
);
var PlacementSettingsSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z35.string().min(1).meta({ ...Unrestricted27, readOnly: true }),
  handle: HandleField.meta({ ...Unrestricted27, readOnly: true }),
  global_frequency_cap: PlacementSettingsCapStateSchema.nullable().default(null).meta(Unrestricted27),
  // Legacy companion column kept for migration continuity. The new
  // wrapper-object encoding above carries period information per
  // cap rule; this column is always null in v0.1.20+ writes.
  global_frequency_cap_period: z35.enum(["hour", "day", "week", "month", "session"]).nullable().default(null).meta(Unrestricted27),
  suppress_for_paid: z35.boolean().default(false).meta(Unrestricted27),
  suppress_for_trial: z35.boolean().default(false).meta(Unrestricted27),
  // `default_dismiss_cooldown_hours` removed (plan 167 Q-2): the dismiss
  // cooldown is defined per-payload in days (`cooldown_after_dismiss_days`).
  allow_stacking: z35.boolean().default(false).meta(Unrestricted27),
  priority_collision_strategy: z35.enum(["highest_priority", "most_recent", "random"]).default("highest_priority").meta(Unrestricted27)
}).meta(
  { id: "PlacementSettings", "x-revturbine-schema-persistence": Persisted16, "x-revturbine-schema-exposure": Internal22, ...PENDING_PLAYBOOK_SDK_FACETS4, ...mintedIdentity() }
);
var PlacementSettingsAnchorSchema = makeAnchor("PlacementSettingsAnchor");
var RevTurbineConfigSegmentsItemPredicatesItemSchema = z35.object({
  field: z35.string().min(1).meta(Unrestricted27),
  operator: z35.enum(["eq", "neq", "gt", "lt", "gte", "lte", "contains", "in"]).meta(Unrestricted27),
  value: z35.string().meta(Unrestricted27)
}).meta(
  { id: "RevTurbineConfigSegmentsItemPredicatesItem", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13 }
);
var RevTurbineConfigSegmentsItemSchema = z35.object({
  // Plan 120 TASK-4: the config carries the handle as its sole logical
  // identifier — the redundant config-level `id` is dropped. The physical
  // UUID primary key stays in the persisted (Drizzle) row, never the config.
  name: z35.string().min(1).meta(Unrestricted27),
  handle: z35.string().min(1).meta(Unrestricted27),
  predicates: z35.array(RevTurbineConfigSegmentsItemPredicatesItemSchema).optional().meta(Unrestricted27),
  // Dimension this segment belongs to (plan #39 REQ-28 / Route A). Optional
  // for back-compat: pre-plan-39 RevTurbineConfigs and segments not yet
  // categorised lack it. The entitlement-rule evaluator uses this to
  // apply intra-dimension OR + cross-dimension AND per spec §2.5; when
  // missing across all of a rule's segment_ids, the evaluator falls
  // back to flat-OR (legacy single-segment behaviour).
  dimension_id: z35.string().optional().meta(Unrestricted27),
  // Experiment enrollment carries the canonical, version-stable handle.
  experiment_handle: z35.string().min(1).optional().meta(Unrestricted27)
}).meta(
  { id: "RevTurbineConfigSegmentsItem", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigPlansItemSchema = z35.object({
  // Plan 120 TASK-4: `unique_handle` is the sole logical identifier; the
  // redundant config-level `id` is dropped (physical UUID PK stays in the row).
  unique_handle: z35.string().min(1).meta(Unrestricted27),
  name: z35.string().min(1).meta(Unrestricted27),
  tier_position: z35.number().int().min(0).default(0).meta(Unrestricted27),
  sort_order: z35.number().int().min(0).default(0).meta(Unrestricted27),
  // Plan-level visibility (to_do/91 Part B). Lives on the plan, not a
  // priced variation, so a free/custom tier with no variation can still be
  // marked unlisted/legacy and round-trip. Variations may still carry their
  // own visibility for per-price overrides; this is the plan's default.
  visibility: PlanVisibilitySchema.default("public").meta(Unrestricted27)
}).meta(
  { id: "RevTurbineConfigPlansItem", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigAddonsItemSchema = z35.object({
  // Plan 120 TASK-4: `unique_handle` is the sole logical identifier; the
  // redundant config-level `id` is dropped (physical UUID PK stays in the row).
  unique_handle: z35.string().min(1).meta(Unrestricted27),
  name: z35.string().min(1).meta(Unrestricted27),
  sort_order: z35.number().int().min(0).default(0).meta(Unrestricted27),
  // Add-on visibility (to_do/91 Part B) — same rationale as plans: metadata,
  // not price, so it lives in the config independent of addon_variations.
  visibility: PlanVisibilitySchema.default("public").meta(Unrestricted27)
}).meta(
  { id: "RevTurbineConfigAddonsItem", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigPlanVariationsItemSchema = z35.object({
  handle: z35.string().min(1).meta(Unrestricted27),
  plan_handle: z35.string().min(1).meta(Unrestricted27),
  billing_period: z35.enum(["monthly", "annual", "one_time", "custom"]).meta(Unrestricted27),
  segment_handle: z35.string().nullable().default(null).meta(Unrestricted27),
  price_amount: z35.number().min(0).meta(Unrestricted27),
  currency: CurrencySchema.meta(Unrestricted27),
  pricing_model: PricingModelSchema.meta(Unrestricted27),
  visibility: PlanVisibilitySchema.default("public").meta(Unrestricted27),
  stripe_price_id: z35.string().nullable().default(null).meta(Unrestricted27),
  price_source: PriceSourceSchema.meta(Unrestricted27)
}).meta(
  { id: "RevTurbineConfigPlanVariationsItem", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigAddonVariationsItemSchema = z35.object({
  handle: z35.string().min(1).meta(Unrestricted27),
  addon_handle: z35.string().min(1).meta(Unrestricted27),
  billing_period: z35.enum(["monthly", "annual", "one_time", "custom"]).meta(Unrestricted27),
  segment_handle: z35.string().nullable().default(null).meta(Unrestricted27),
  price_amount: z35.number().min(0).meta(Unrestricted27),
  currency: CurrencySchema.meta(Unrestricted27),
  pricing_model: PricingModelSchema.meta(Unrestricted27),
  visibility: PlanVisibilitySchema.default("public").meta(Unrestricted27),
  stripe_price_id: z35.string().nullable().default(null).meta(Unrestricted27),
  price_source: PriceSourceSchema.meta(Unrestricted27)
}).meta(
  { id: "RevTurbineConfigAddonVariationsItem", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigSeatTypesItemSchema = z35.object({
  handle: z35.string().min(1).meta(Unrestricted27),
  name: z35.string().min(1).meta(Unrestricted27),
  description: z35.string().nullable().default(null).meta(Unrestricted27),
  is_default: z35.boolean().default(false).meta(Unrestricted27),
  entitlement_handles: z35.array(z35.string()).default([]).meta(Unrestricted27)
}).meta(
  { id: "RevTurbineConfigSeatTypesItem", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigEnforcementDefaultsItemSchema = z35.object({
  handle: z35.string().min(1).meta(Unrestricted27),
  entitlement_handle: z35.string().nullable().default(null).meta(Unrestricted27),
  soft_limit_percent: z35.number().int().min(0).nullable().default(null).meta(Unrestricted27),
  hard_limit_percent: z35.number().int().min(0).nullable().default(null).meta(Unrestricted27),
  soft_limit_action: z35.string().meta(Unrestricted27),
  hard_limit_action: z35.string().meta(Unrestricted27),
  grace_period_hours: z35.number().int().min(0).nullable().default(null).meta(Unrestricted27),
  notification_channels: z35.array(z35.string()).default([]).meta(Unrestricted27),
  is_active: z35.boolean().default(true).meta(Unrestricted27)
}).meta(
  { id: "RevTurbineConfigEnforcementDefaultsItem", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigPlacementSettingsItemSchema = z35.object({
  handle: z35.string().min(1).meta(Unrestricted27),
  global_frequency_cap: PlacementSettingsCapStateSchema.nullable().default(null).meta(Unrestricted27),
  global_frequency_cap_period: z35.enum(["hour", "day", "week", "month", "session"]).nullable().default(null).meta(Unrestricted27),
  suppress_for_paid: z35.boolean().default(false).meta(Unrestricted27),
  suppress_for_trial: z35.boolean().default(false).meta(Unrestricted27),
  // `default_dismiss_cooldown_hours` removed (plan 167 Q-2).
  allow_stacking: z35.boolean().default(false).meta(Unrestricted27),
  priority_collision_strategy: z35.string().nullable().default(null).meta(Unrestricted27)
}).meta(
  { id: "RevTurbineConfigPlacementSettingsItem", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigSegmentDimensionsItemSchema = z35.object({
  handle: z35.string().min(1).meta(Unrestricted27),
  name: z35.string().min(1).meta(Unrestricted27),
  category: z35.string().nullable().default(null).meta(Unrestricted27),
  visibility_toggle: z35.boolean().default(true).meta(Unrestricted27),
  source_type: z35.string().nullable().default(null).meta(Unrestricted27)
}).meta(
  { id: "RevTurbineConfigSegmentDimensionsItem", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigMeterBindingsItemSchema = z35.object({
  handle: z35.string().min(1).meta(Unrestricted27),
  entitlement_handle: z35.string().min(1).meta(Unrestricted27),
  meter_handle: z35.string().min(1).meta(Unrestricted27),
  limit: z35.number().int().min(0).nullable().default(null).meta(Unrestricted27),
  reset_period: z35.string().nullable().default(null).meta(Unrestricted27)
}).meta(
  { id: "RevTurbineConfigMeterBindingsItem", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigEntitlementsItemSchema = z35.object({
  // Plan 120 TASK-4: `unique_handle` is the sole logical identifier; the
  // redundant config-level `id` is dropped (physical UUID PK stays in the row).
  unique_handle: z35.string().min(1).meta(Unrestricted27),
  name: z35.string().min(1).meta(Unrestricted27),
  type: EntitlementTypeSchema.meta(Unrestricted27),
  unit: z35.string().optional().meta(Unrestricted27),
  // Ordered tier ladder for a `capability_tier` entitlement — projection of
  // the authored `EntitlementSchema.tier_definitions` (plan 138 TASK-4).
  // ARRAY ORDER IS THE RANK: the `entitlement_gate.tier_threshold` placement
  // trigger fires when the user's current tier ranks below the threshold tier
  // on this ladder. `name`/`description` are UI-helper denormalizations (plan
  // 118); the runtime gate reads only the ordered `handle`s.
  tier_definitions: z35.array(z35.object({
    name: z35.string(),
    handle: z35.string(),
    description: z35.string().optional()
  })).optional().meta(Unrestricted27)
}).meta(
  { id: "RevTurbineConfigEntitlementsItem", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigEntitlementRulesItemSchema = z35.object({
  id: z35.string().min(1).meta(Unrestricted27),
  entitlement_id: z35.string().min(1).meta(Unrestricted27),
  targets: z35.array(EntitlementRuleTargetSchema).min(1).meta(Unrestricted27),
  // Plan #39 REQ-1: multi-segment scoping per spec §2.5. Empty array
  // means "match all users" (replaces the singular `segment_id` field
  // and its 'all'/null sentinels).
  segment_ids: z35.array(z35.string()).default([]).meta(Unrestricted27),
  // ── Derived denormalizations from the parent entitlement (plan 147, OQ-6).
  // Resolved via `entitlement_id` on export; ignored on import (the entitlement
  // is authoritative). `readOnly` → excluded from round-trip obligations: they
  // are computed, not authored, so requiring a sentinel to preserve them would
  // test derivation rather than authoring fidelity.
  kind: EntitlementTypeSchema.optional().meta({ ...Unrestricted27, readOnly: true }),
  unit: z35.string().optional().meta({ ...Unrestricted27, readOnly: true }),
  tier_name: z35.string().optional().meta({ ...Unrestricted27, readOnly: true }),
  tier_description: z35.string().optional().meta({ ...Unrestricted27, readOnly: true }),
  // ── Flat per-rule fields (plan 147, OQ-6) — single-sourced from the persisted
  // `EntitlementRuleSchema` under its canonical names (REQ-1/REQ-2), replacing
  // the deleted nested `type_fields` union. Null-stripped on export. The
  // evaluated subset lowers into `TypeFieldsIR`; the persisted-not-evaluated
  // fields (`amount_cents`/`currency`/`rate_value`/`period_scope`/…) round-trip
  // via web import/export for content rendering (OQ-7), not the bundle.
  ...EntitlementRuleSchema.pick({
    enabled: true,
    limit_value: true,
    enforcement: true,
    tier_value: true,
    period_scope: true,
    included_count: true,
    seat_type_id: true,
    initial_grant: true,
    allowance_value: true,
    rollover_enabled: true,
    max_balance: true,
    reset_period: true,
    max_seats: true,
    rate_value: true,
    amount_cents: true,
    currency: true
  }).shape,
  current_usage: z35.number().default(0).meta(Unrestricted27),
  /** How usage is partitioned across the identity hierarchy. */
  allocation: UsageAllocationSchema.optional().meta(Unrestricted27),
  /** Optional business objective, by `objectives[].handle` (VAL-OBJ-01). Config-only. */
  objective: ObjectiveField.meta(Unrestricted27)
}).meta(
  { id: "RevTurbineConfigEntitlementRulesItem", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigSlotConfigsItemSchema = z35.object({
  slot_id: z35.string().min(1).meta(Unrestricted27),
  active: z35.boolean().meta(Unrestricted27),
  triggers: z35.array(z35.string()).meta(Unrestricted27)
}).meta(
  { id: "RevTurbineConfigSlotConfigsItem", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigPlacementSlotsItemSchema = z35.object({
  id: z35.string().min(1).meta(Unrestricted27),
  label: z35.string().min(1).meta(Unrestricted27),
  description: z35.string().meta(Unrestricted27),
  surface_type: z35.string().meta(Unrestricted27),
  placement_handle: z35.string().min(1).meta(Unrestricted27),
  template: z35.string().optional().meta(Unrestricted27)
}).meta(
  { id: "RevTurbineConfigPlacementSlotsItem", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigSurfaceTemplatesItemFieldsItemSchema = z35.object({
  name: z35.string().min(1).meta(Unrestricted27),
  type: z35.string().optional().meta(Unrestricted27),
  required: z35.boolean().optional().meta(Unrestricted27)
}).meta(
  { id: "RevTurbineConfigSurfaceTemplatesItemFieldsItem", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13 }
);
var RevTurbineConfigSurfaceTemplatesItemSchema = z35.object({
  id: z35.string().min(1).meta(Unrestricted27),
  surface_type: z35.string().meta(Unrestricted27),
  fields: z35.array(RevTurbineConfigSurfaceTemplatesItemFieldsItemSchema).optional().meta(Unrestricted27)
}).meta(
  { id: "RevTurbineConfigSurfaceTemplatesItem", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigUiPathActionTypeSchema = z35.enum([
  "open_checkout_modal",
  "navigate_to_plans",
  "open_upgrade_modal",
  "open_placement",
  "book_demo",
  "open_feature_tour",
  "extend_trial",
  "switch_billing_period",
  "custom_url",
  "dismiss",
  // Additional client-side action types (aligned with CtaPathTypeSchema)
  "contact_sales",
  "complete_onboarding",
  "invite_teammate",
  "refer_friend",
  "verify_work_email",
  "update_payment_method",
  "enable_auto_renewal",
  "manage_subscription",
  // Authored `snooze` resolves through to the SDK's remind-later path
  // (plan 167 windows); previously it fell through as an invalid type
  // (plan 174 TASK-6 / Q-5, spec-check F-65a).
  "snooze"
]).meta(
  { id: "RevTurbineConfigUiPathActionType", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13 }
);
var ContentUiPathSchema = z35.object({
  name: z35.string().min(1).meta(Unrestricted27),
  action_type: RevTurbineConfigUiPathActionTypeSchema.meta(Unrestricted27),
  plan_handle: z35.string().optional().meta(Unrestricted27),
  promotion_id: z35.string().optional().meta(Unrestricted27),
  placement_handle: z35.string().optional().meta(Unrestricted27),
  url: z35.string().optional().meta(Unrestricted27),
  tour_id: z35.string().optional().meta(Unrestricted27),
  target_billing_period: z35.enum(["monthly", "annual"]).optional().meta(Unrestricted27),
  description: z35.string().optional().meta(Unrestricted27)
}).meta(
  { id: "ContentUiPath", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13, ...PLAYBOOK_SDK_FACETS8 }
);
var ContentPromotionSchema = z35.object({
  id: z35.string().meta(Unrestricted27),
  name: z35.string().meta(Unrestricted27),
  discount: z35.string().meta(Unrestricted27),
  type: z35.string().meta(Unrestricted27),
  status: z35.string().meta(Unrestricted27)
}).meta(
  { id: "ContentPromotion", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigPersonalizationTokensItemSchema = z35.object({
  token: z35.string().regex(/^[a-z][a-z0-9_]*$/).meta(Unrestricted27),
  label: z35.string().min(1).meta(Unrestricted27),
  description: z35.string().optional().meta(Unrestricted27),
  category: z35.enum(["user", "plan", "usage", "trial", "billing", "promotion", "custom"]).meta(Unrestricted27),
  data_source: z35.string().optional().meta(Unrestricted27),
  example_value: z35.string().optional().meta(Unrestricted27),
  value_map: z35.record(z35.string(), z35.string()).optional().meta(Unrestricted27),
  format: z35.enum(["string", "number", "currency", "percentage", "date"]).optional().meta(Unrestricted27)
}).meta(
  { id: "RevTurbineConfigPersonalizationTokensItem", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigObjectivesItemSchema = z35.object({
  handle: HandleField.meta(Unrestricted27),
  name: NameField.meta(Unrestricted27),
  description: DescriptionField.meta(Unrestricted27)
}).meta(
  { id: "RevTurbineConfigObjectivesItem", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13, ...PLAYBOOK_AUTHORING_FACETS2 }
);
var MessageBlockContentSchema = z35.object({
  header: z35.string().optional().meta(Unrestricted27),
  body: z35.string().optional().meta(Unrestricted27),
  cta_label: z35.string().optional().meta(Unrestricted27),
  secondary_cta_label: z35.string().optional().meta(Unrestricted27)
}).catchall(z35.unknown()).meta(
  { id: "MessageBlockContent", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13 }
);
var MessageBlockSchema = z35.object({
  block_id: z35.string().min(1).meta(Unrestricted27),
  tenant_id: z35.string().min(1).meta(Unrestricted27),
  name: z35.string().min(1).meta(Unrestricted27),
  surface_template_id: z35.string().optional().meta(Unrestricted27),
  default_content: MessageBlockContentSchema.meta(Unrestricted27),
  segment_overrides: z35.array(z35.object({
    segment_value_id: z35.string(),
    content: MessageBlockContentSchema
  })).optional().meta(Unrestricted27),
  child_blocks: z35.array(z35.object({
    slot: z35.string(),
    block_id: z35.string()
  })).optional().meta(Unrestricted27),
  tokens_used: z35.array(z35.string()).optional().meta(Unrestricted27),
  status: z35.enum(["draft", "active", "archived"]).meta(Unrestricted27),
  created_at: z35.string().datetime().meta({ ...Unrestricted27, readOnly: true }),
  updated_at: z35.string().datetime().meta({ ...Unrestricted27, readOnly: true })
}).meta(
  { id: "MessageBlock", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigStudioCtaConfigSchema = z35.object({
  label: z35.string().meta(Unrestricted27),
  path: CtaActionTypeSchema.meta(Unrestricted27),
  config: z35.record(z35.string(), z35.string()).optional().meta(Unrestricted27)
}).meta(
  { id: "RevTurbineConfigStudioCtaConfig", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13 }
);
var RevTurbineConfigStudioPayloadSurfaceSchema = z35.object({
  template_id: z35.string().min(1).meta(Unrestricted27),
  fields: z35.record(z35.string(), z35.string()).meta(Unrestricted27),
  ctas: z35.array(RevTurbineConfigStudioCtaConfigSchema).meta(Unrestricted27)
}).meta(
  { id: "RevTurbineConfigStudioPayloadSurface", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13 }
);
var RevTurbineConfigStudioPayloadTargetSchema = z35.object({
  plan_ids: z35.array(z35.string()).meta(Unrestricted27),
  // Billing-cadence dimension of the Plan Filter (spec §3.1.1 Target).
  // Empty/absent = no cadence filter. Optional so pre-plan-76 exports parse.
  billing_cadences: z35.array(z35.string()).optional().meta(Unrestricted27),
  segment_chips: z35.array(z35.string()).meta(Unrestricted27)
}).meta(
  { id: "RevTurbineConfigStudioPayloadTarget", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13 }
);
var RevTurbineConfigPeriodCapSchema = z35.object({
  count: z35.number().int().min(1).meta(Unrestricted27),
  period: z35.enum(["session", "day", "week", "month", "lifetime"]).meta(Unrestricted27)
}).meta(
  { id: "RevTurbineConfigPeriodCap", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13 }
);
var RevTurbineConfigStudioPayloadCapsSchema = z35.object({
  max_per_period: RevTurbineConfigPeriodCapSchema.optional().meta(Unrestricted27),
  cooldown_days: z35.number().int().min(0).optional().meta(Unrestricted27)
}).meta(
  { id: "RevTurbineConfigStudioPayloadCaps", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13 }
);
var RevTurbineConfigStudioPayloadSchema = z35.object({
  id: z35.string().min(1).meta(Unrestricted27),
  target: RevTurbineConfigStudioPayloadTargetSchema.meta(Unrestricted27),
  surfaces: z35.array(RevTurbineConfigStudioPayloadSurfaceSchema).meta(Unrestricted27),
  caps: RevTurbineConfigStudioPayloadCapsSchema.optional().meta(Unrestricted27),
  // Optional slot targeting (spec §3.1.1): empty/absent = any compatible slot.
  surface_slot_ids: z35.array(z35.string()).optional().meta(Unrestricted27),
  // Per-payload remind-me-later override (minutes); absent = inherit tenant default (plan 167 Q-3).
  remind_later_minutes: z35.number().int().min(0).nullable().optional().meta(Unrestricted27),
  created_at: z35.string().optional().meta({ ...Unrestricted27, readOnly: true }),
  recommendation_strategy: z35.enum(["next_tier_up", "best_value", "custom"]).optional().default("next_tier_up").meta(Unrestricted27),
  recommendation_plan_override: z35.string().optional().meta(Unrestricted27)
}).meta(
  { id: "RevTurbineConfigStudioPayload", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13 }
);
var RevTurbineConfigPlacementTriggerSchema = z35.discriminatedUnion("type", [
  z35.object({ type: z35.literal("surface_render"), slot_id: z35.string().min(1) }),
  z35.object({ type: z35.literal("entitlement_gate"), entitlement_handle: z35.string().min(1), tier_threshold: z35.string().optional() }),
  z35.object({ type: z35.literal("usage_threshold"), entitlement_handle: z35.string().min(1), threshold_percent: ThresholdPercentField }),
  z35.object({ type: z35.literal("credit_threshold"), entitlement_handle: z35.string().min(1), threshold_percent: ThresholdPercentField }),
  z35.object({ type: z35.literal("seat_threshold"), entitlement_handle: z35.string().min(1), threshold_percent: ThresholdPercentField }),
  z35.object({ type: z35.literal("trial_started"), trial_type: z35.enum(["free", "reverse"]).optional() }),
  z35.object({ type: z35.literal("trial_progress"), progress_percent: z35.number().min(1).max(100) }),
  z35.object({ type: z35.literal("trial_ending"), days_before_end: z35.number().int().min(0) }),
  z35.object({ type: z35.literal("trial_ended") }),
  z35.object({ type: z35.literal("trial_converted") }),
  z35.object({ type: z35.literal("qualifier"), qualifier: z35.string().min(1) })
]).meta(
  { id: "RevTurbineConfigPlacementTrigger", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13 }
);
var RevTurbineConfigPlacementCategorySchema = z35.enum(["fixed", "gated", "usage_credit_seat", "trials", "other_conversion", "retention"]).meta(
  { id: "RevTurbineConfigPlacementCategory", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13 }
);
var RevTurbineConfigPlacementItemSchema = z35.object({
  id: z35.string().min(1).meta(Unrestricted27),
  name: z35.string().min(1).meta(Unrestricted27),
  category: RevTurbineConfigPlacementCategorySchema.meta(Unrestricted27),
  trigger: RevTurbineConfigPlacementTriggerSchema.meta(Unrestricted27),
  payloads: z35.array(RevTurbineConfigStudioPayloadSchema).meta(Unrestricted27),
  order: z35.number().int().min(0).meta(Unrestricted27),
  /** Optional business objective, by `objectives[].handle` (VAL-OBJ-01). Config-only. */
  objective: ObjectiveField.meta(Unrestricted27)
}).meta(
  { id: "RevTurbineConfigPlacementItem", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigPlacementPayloadItemSchema = z35.object({
  payload_id: z35.string().min(1).meta(Unrestricted27),
  placement_id: z35.string().min(1).meta(Unrestricted27),
  target: RevTurbineConfigStudioPayloadTargetSchema.meta(Unrestricted27),
  caps: RevTurbineConfigStudioPayloadCapsSchema.optional().meta(Unrestricted27),
  // Per-payload remind-me-later override (minutes); absent = inherit tenant default (plan 167 Q-3).
  remind_later_minutes: z35.number().int().min(0).nullable().optional().meta(Unrestricted27),
  created_at: z35.string().meta({ ...Unrestricted27, readOnly: true }),
  updated_at: z35.string().datetime().optional().meta({ ...Unrestricted27, readOnly: true }),
  source_mode: z35.enum(["inline", "content_linked"]).meta(Unrestricted27),
  surfaces: z35.array(RevTurbineConfigStudioPayloadSurfaceSchema).optional().meta(Unrestricted27),
  // Optional slot targeting (spec §3.1.1): empty/absent = any compatible slot.
  surface_slot_ids: z35.array(z35.string()).optional().meta(Unrestricted27),
  content_link: z35.object({
    message_block_id: z35.string().optional(),
    ui_path_id: z35.string().optional(),
    promotion_id: z35.string().optional(),
    content_payload_id: z35.string().optional()
  }).optional().meta(Unrestricted27)
}).meta(
  { id: "RevTurbineConfigPlacementPayloadItem", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigExtensionRulesItemSchema = z35.object({
  kind: z35.string().min(1).meta(Unrestricted27),
  schema_version: z35.number().int().nonnegative().meta(Unrestricted27),
  config: z35.unknown().meta(Unrestricted27)
}).meta(
  { id: "RevTurbineConfigExtensionRulesItem", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigFreeTrialRuleItemSchema = IdField.merge(FreeTrialRuleCoreFieldsSchema).meta(
  { id: "RevTurbineConfigFreeTrialRuleItem", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13, ...PENDING_PLAYBOOK_FACETS4 }
);
var RevTurbineConfigReverseTrialRuleItemSchema = IdField.merge(ReverseTrialRuleCoreFieldsSchema).meta(
  { id: "RevTurbineConfigReverseTrialRuleItem", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": External13, ...PENDING_PLAYBOOK_FACETS4 }
);
var PlaybookBodySchema = z35.object({
  plans: z35.array(RevTurbineConfigPlansItemSchema).meta({ ...Unrestricted27, ...PLAYBOOK_SDK_FACETS8 }),
  // Optional for back-compat: pre-plan-88 configs (and the live export until web
  // adopts the new @revt-eng/schema) omit it. Add-on definitions only; pricing
  // (addon_variations) stays in the Stripe layer, like plan_variations.
  addons: z35.array(RevTurbineConfigAddonsItemSchema).optional().meta({ ...Unrestricted27, ...PLAYBOOK_SDK_FACETS8 }),
  entitlements: z35.array(RevTurbineConfigEntitlementsItemSchema).meta({ ...Unrestricted27, ...PLAYBOOK_SDK_FACETS8 }),
  entitlement_rules: z35.array(RevTurbineConfigEntitlementRulesItemSchema).meta({ ...Unrestricted27, ...PLAYBOOK_SDK_FACETS8 }),
  segments: z35.array(RevTurbineConfigSegmentsItemSchema).meta({ ...Unrestricted27, ...PLAYBOOK_SDK_FACETS8 }),
  content_ui_paths: z35.array(ContentUiPathSchema).meta({ ...Unrestricted27, ...PLAYBOOK_SDK_FACETS8 }),
  slot_configs: z35.array(RevTurbineConfigSlotConfigsItemSchema).optional().meta({
    ...Unrestricted27,
    ...PLAYBOOK_SDK_FACETS8,
    ...schemaDeprecation({
      since: "0.1.117",
      replacement: "SDK-local activation/trigger state",
      removeAfter: "one compatibility window",
      reason: "Slot activation moved to SDK-local state (plan 118 TASK-6); no longer a Playbook authoring input."
    })
  }),
  content_overrides: z35.record(z35.string(), z35.record(z35.string(), z35.string())).optional().meta({
    ...Unrestricted27,
    ...PLAYBOOK_SDK_FACETS8,
    ...schemaDeprecation({
      since: "0.1.117",
      replacement: "Message Block / Placement Payload content",
      removeAfter: "one compatibility window",
      reason: "Content overrides moved to Message Block / Payload content (plan 118 TASK-6); no longer a Playbook authoring input."
    })
  }),
  theme: z35.record(z35.string(), z35.unknown()).optional().meta({
    ...Unrestricted27,
    ...LEGACY_BRANDING_FACETS,
    ...schemaDeprecation({
      since: "0.1.111",
      replacement: "SDK branding argument",
      removeAfter: "one compatibility window",
      reason: "Branding is independently owned and is not Playbook strategy."
    })
  }),
  placement_slots: z35.array(RevTurbineConfigPlacementSlotsItemSchema).optional().meta({ ...Unrestricted27, ...PLAYBOOK_SDK_FACETS8 }),
  message_blocks: z35.array(MessageBlockSchema).optional().meta({ ...Unrestricted27, ...PLAYBOOK_SDK_FACETS8 }),
  placement_payloads: z35.array(RevTurbineConfigPlacementPayloadItemSchema).optional().meta({ ...Unrestricted27, ...PLAYBOOK_SDK_FACETS8 }),
  placements: z35.array(RevTurbineConfigPlacementItemSchema).optional().meta({ ...Unrestricted27, ...PLAYBOOK_SDK_FACETS8 }),
  content_promotions: z35.array(ContentPromotionSchema).optional().meta({ ...Unrestricted27, ...PLAYBOOK_SDK_FACETS8 }),
  personalization_tokens: z35.array(RevTurbineConfigPersonalizationTokensItemSchema).optional().meta({ ...Unrestricted27, ...PLAYBOOK_SDK_FACETS8 }),
  surface_templates: z35.array(RevTurbineConfigSurfaceTemplatesItemSchema).optional().meta({ ...Unrestricted27, ...PLAYBOOK_SDK_FACETS8 }),
  /**
   * Free + reverse trial rule configurations (plan 43). Optional so
   * pre-trial-runtime configs continue to parse. /api/config/import
   * applies these to the tenant's free_trial_rules / reverse_trial_rules
   * tables; /api/config/export reads them out for round-trip.
   */
  free_trial_rules: z35.array(RevTurbineConfigFreeTrialRuleItemSchema).optional().meta({ ...Unrestricted27, ...PLAYBOOK_AUTHORING_FACETS2 }),
  reverse_trial_rules: z35.array(RevTurbineConfigReverseTrialRuleItemSchema).optional().meta({ ...Unrestricted27, ...PLAYBOOK_AUTHORING_FACETS2 }),
  /**
   * Business objectives (BL-0176 / BL-0178, ruling D-15). Optional so every
   * Playbook authored before objectives existed still parses. Placements and
   * entitlement rules reference an entry by `handle` through their optional
   * `objective` field. Authoring-only: no runtime decision reads it, so it is
   * not an SDK input and never lowers into the IR.
   */
  objectives: z35.array(RevTurbineConfigObjectivesItemSchema).optional().meta({ ...Unrestricted27, ...PLAYBOOK_AUTHORING_FACETS2 }),
  // Plan / add-on variation prices carried by handle (plan 118 TASK-16). These
  // live on the legacy schema (not just the canonical Playbook body) so that a
  // legacy `version`-shaped config — the shape the demo-data configs and the
  // pre-sales/CLI upload flow still use — can carry variation prices through
  // normalization instead of having them stripped. Pending until web
  // import/export activates them (TASK-21).
  plan_variations: z35.array(RevTurbineConfigPlanVariationsItemSchema).optional().meta({ ...Unrestricted27, ...PLAYBOOK_SDK_FACETS8 }),
  addon_variations: z35.array(RevTurbineConfigAddonVariationsItemSchema).optional().meta({ ...Unrestricted27, ...PLAYBOOK_SDK_FACETS8 }),
  /**
   * Tagged-opaque rule entries (Phase 3 / strategy 2). Each entry is
   * dispatched to the corresponding `RuleAuthoringModule.kind` at
   * compile time; unknown kinds are skipped silently so authoring can
   * stage new kinds before the runtime catches up.
   */
  extension_rules: z35.array(RevTurbineConfigExtensionRulesItemSchema).optional().meta({ ...Unrestricted27, ...PLAYBOOK_SDK_FACETS8 }),
  // Authored-config projections carried as active SDK inputs (plan 118
  // TASK-13/18). Declared here (not only on PlaybookBody) so the Bundle
  // compiler — which lowers the legacy `RevTurbineConfig` view — reads them
  // with proper types. Projected into the RuleBundle; see core/bundle.
  seat_types: z35.array(RevTurbineConfigSeatTypesItemSchema).optional().meta({ ...Unrestricted27, ...PLAYBOOK_SDK_FACETS8 }),
  enforcement_defaults: z35.array(RevTurbineConfigEnforcementDefaultsItemSchema).optional().meta({ ...Unrestricted27, ...PLAYBOOK_SDK_FACETS8 }),
  placement_settings: z35.array(RevTurbineConfigPlacementSettingsItemSchema).optional().meta({ ...Unrestricted27, ...PLAYBOOK_SDK_FACETS8 }),
  segment_dimensions: z35.array(RevTurbineConfigSegmentDimensionsItemSchema).optional().meta({ ...Unrestricted27, ...PLAYBOOK_SDK_FACETS8 }),
  meter_bindings: z35.array(RevTurbineConfigMeterBindingsItemSchema).optional().meta({ ...Unrestricted27, ...PLAYBOOK_SDK_FACETS8 }),
  experiments: z35.array(z35.unknown()).max(0).optional().meta({
    ...Unrestricted27,
    ...PENDING_PLAYBOOK_FACETS4
  }),
  // Reserved like `experiments` above: claim the key now, ship the
  // semantics later. A Playbook will eventually pin the Signal Catalog
  // version its targeting was interpreted under, so a decision stays
  // reproducible after the event taxonomy moves on. Reserving costs one
  // schema change; adding a top-level Playbook key after the fact costs a
  // second breaking cascade through the IR, the CLI, demo data, and every
  // SDK port.
  //
  // Empty-object-only until a consumer exists — `.strict()` rejects a
  // populated `{ id, version }` rather than letting it round-trip as
  // config nothing reads. Catalog *definitions* stay server-side and must
  // never reach the browser Playbook; only the reference will live here.
  signal_catalog: z35.object({}).strict().optional().meta({
    ...Unrestricted27,
    ...PENDING_PLAYBOOK_FACETS4
  })
}).meta(
  {
    id: "PlaybookBody",
    "x-revturbine-schema-persistence": Transient26,
    "x-revturbine-schema-exposure": External13,
    ...PLAYBOOK_SDK_FACETS8
  }
);
var PlaybookHeaderSchema = z35.object({
  artifact_type: z35.literal("playbook").meta({
    ...Unrestricted27,
    ...PLAYBOOK_VERSION_HEADER_FACETS,
    readOnly: true
  }),
  format_version: z35.literal(PLAYBOOK_FORMAT_VERSION).meta({
    ...Unrestricted27,
    ...PLAYBOOK_VERSION_HEADER_FACETS,
    readOnly: true
  }),
  playbook_handle: z35.string().min(1).default("default").meta({
    ...Unrestricted27,
    ...PLAYBOOK_VERSION_HEADER_FACETS
  }),
  playbook_version_id: z35.string().nullable().default(null).meta({
    ...Unrestricted27,
    ...PLAYBOOK_PROVENANCE_HEADER_FACETS,
    readOnly: true
  }),
  // Origin target identity (plan 131 TASK-10). Optional so a hand-authored /
  // legacy `export-config.json` (which carries no target) parses unchanged —
  // the plan 147 TASK-1 header reconciliation: the one config schema must
  // absorb legacy files that predate target stamping. Stamped by the server
  // on export when present.
  tenant_id: z35.string().min(1).optional().meta({
    ...Unrestricted27,
    ...PLAYBOOK_TARGET_FACETS,
    readOnly: true
  }),
  environment_id: z35.string().min(1).optional().meta({
    ...Unrestricted27,
    ...PLAYBOOK_TARGET_FACETS,
    readOnly: true
  }),
  project_id: z35.string().min(1).optional().meta({
    ...Unrestricted27,
    ...PLAYBOOK_TARGET_FACETS,
    readOnly: true
  }),
  exported_at: z35.string().datetime().optional().meta({
    ...Unrestricted27,
    ...PLAYBOOK_PROVENANCE_HEADER_FACETS,
    readOnly: true
  }),
  schema_version: z35.string().min(1).optional().meta({
    ...Unrestricted27,
    ...PLAYBOOK_VERSION_HEADER_FACETS,
    readOnly: true
  }),
  bundle_schema_version: z35.number().int().nonnegative().optional().meta({
    ...Unrestricted27,
    ...PLAYBOOK_VERSION_HEADER_FACETS,
    readOnly: true
  }),
  // Plan 177 TASK-3: the writer's declaration of the oldest reader
  // `SCHEMA_VERSION` that can correctly evaluate this payload. A runtime
  // refuses the payload when this floor exceeds the version it supports,
  // instead of partially applying config it cannot fully parse. Stamped by
  // the payload producer (`buildPlaybookPayload`); absent on hand-authored
  // configs, where readers treat the floor as `bundle_schema_version`.
  bundle_min_readable_schema_version: z35.number().int().nonnegative().optional().meta({
    ...Unrestricted27,
    ...PLAYBOOK_VERSION_HEADER_FACETS,
    readOnly: true
  })
}).meta(
  {
    id: "PlaybookHeader",
    "x-revturbine-schema-persistence": Transient26,
    "x-revturbine-schema-exposure": External13,
    ...PLAYBOOK_PROVENANCE_HEADER_FACETS
  }
);
var PlaybookObjectSchema = PlaybookHeaderSchema.extend(PlaybookBodySchema.shape).meta(
  {
    "x-revturbine-schema-persistence": Transient26,
    "x-revturbine-schema-exposure": External13,
    ...PLAYBOOK_SDK_FACETS8
  }
);
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function normalizeConfigHeaderInput(input) {
  if (!isRecord(input)) return input;
  const next = { ...input };
  if (!("artifact_type" in next)) {
    next.artifact_type = "playbook";
  }
  if ("version" in next) {
    if (!("format_version" in next)) next.format_version = next.version;
    delete next.version;
  }
  if ("change_set_id" in next) {
    if (!("playbook_version_id" in next)) next.playbook_version_id = next.change_set_id;
    delete next.change_set_id;
  }
  return next;
}
var PlaybookSchema = z35.preprocess(normalizeConfigHeaderInput, PlaybookObjectSchema).meta({
  id: "Playbook",
  "x-revturbine-schema-persistence": Transient26,
  "x-revturbine-schema-exposure": External13,
  ...PLAYBOOK_SDK_FACETS8
});
var PlaybookStrictSchema = z35.preprocess(normalizeConfigHeaderInput, PlaybookObjectSchema.strict()).meta({
  id: "PlaybookStrict",
  "x-revturbine-schema-persistence": Transient26,
  "x-revturbine-schema-exposure": External13,
  ...PLAYBOOK_SDK_FACETS8
});
var RevTurbineConfigSchema = PlaybookSchema;
function normalizeLegacyConfig(input) {
  if (isRecord(input) && ("artifact_type" in input || "format_version" in input)) {
    throw new Error("normalizeLegacyConfig accepts only the legacy RevTurbineConfig wire shape");
  }
  return PlaybookSchema.parse(input);
}
function parsePlaybook(input) {
  return PlaybookSchema.parse(input);
}
var configPaths = {
  "/api/seat-type-anchors": {
    get: operation({
      operationId: "listSeatTypeAnchors",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List seat type anchors (identity registry)",
      tags: ["config"],
      responses: {
        "200": { description: "Seat type anchor list", content: { "application/json": { schema: ListEnvelope(SeatTypeAnchorSchema) } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "seat-type-anchors", persistence: { table: "seatTypes", mode: "list" } }
    })
  },
  "/api/config/seat-types": {
    get: operation({
      operationId: "listSeatTypes",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List seat types",
      tags: ["config"],
      responses: { "200": { description: "Seat type list", content: { "application/json": { schema: ListEnvelope(SeatTypeSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "seat-types", persistence: { table: "seatTypeVersions", mode: "list" } }
    }),
    post: operation({
      operationId: "createSeatType",
      summary: "Create seat type",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(SeatTypeSchema) } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: SeatTypeSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "seat-types", persistence: { table: "seatTypeVersions", mode: "create" } }
    })
  },
  "/api/config/seat-types/{id}": {
    patch: operation({
      operationId: "updateSeatType",
      requestParams: { path: z35.object({ id: z35.string() }) },
      summary: "Update seat type",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: SeatTypeSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: SeatTypeSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "seat-types", persistence: { table: "seatTypeVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteSeatType",
      requestParams: { path: z35.object({ id: z35.string() }) },
      summary: "Delete seat type",
      tags: ["config"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "seat-types", persistence: { table: "seatTypeVersions", mode: "delete" } }
    })
  },
  "/api/personalization-token-anchors": {
    get: operation({
      operationId: "listPersonalizationTokenAnchors",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List personalization token anchors (identity registry)",
      tags: ["config"],
      responses: {
        "200": { description: "Personalization token anchor list", content: { "application/json": { schema: ListEnvelope(PersonalizationTokenAnchorSchema) } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "personalization-token-anchors", persistence: { table: "personalizationTokens", mode: "list" } }
    })
  },
  "/api/config/personalization-tokens": {
    get: operation({
      operationId: "listPersonalizationTokens",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List personalization tokens",
      tags: ["config"],
      responses: { "200": { description: "Personalization token list", content: { "application/json": { schema: ListEnvelope(PersonalizationTokenSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "personalization-tokens", persistence: { table: "personalizationTokenVersions", mode: "list" } }
    }),
    post: operation({
      operationId: "createPersonalizationToken",
      summary: "Create personalization token",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(PersonalizationTokenSchema) } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: PersonalizationTokenSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "personalization-tokens", persistence: { table: "personalizationTokenVersions", mode: "create" } }
    })
  },
  "/api/config/personalization-tokens/{id}": {
    patch: operation({
      operationId: "updatePersonalizationToken",
      requestParams: { path: z35.object({ id: z35.string() }) },
      summary: "Update personalization token",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: PersonalizationTokenSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: PersonalizationTokenSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "personalization-tokens", persistence: { table: "personalizationTokenVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deletePersonalizationToken",
      requestParams: { path: z35.object({ id: z35.string() }) },
      summary: "Delete personalization token",
      tags: ["config"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "personalization-tokens", persistence: { table: "personalizationTokenVersions", mode: "delete" } }
    })
  },
  "/api/objective-anchors": {
    get: operation({
      operationId: "listObjectiveAnchors",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List objective anchors (identity registry)",
      tags: ["config"],
      responses: {
        "200": { description: "Objective anchor list", content: { "application/json": { schema: ListEnvelope(ObjectiveAnchorSchema) } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "objective-anchors", persistence: { table: "objectives", mode: "list" } }
    })
  },
  "/api/config/objectives": {
    get: operation({
      operationId: "listObjectives",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List objectives",
      tags: ["config"],
      responses: { "200": { description: "Objective list", content: { "application/json": { schema: ListEnvelope(ObjectiveSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "objectives", persistence: { table: "objectiveVersions", mode: "list" } }
    }),
    post: operation({
      operationId: "createObjective",
      summary: "Create objective",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(ObjectiveSchema) } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: ObjectiveSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "objectives", persistence: { table: "objectiveVersions", mode: "create" } }
    })
  },
  "/api/config/objectives/{id}": {
    patch: operation({
      operationId: "updateObjective",
      requestParams: { path: z35.object({ id: z35.string() }) },
      summary: "Update objective",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: ObjectiveSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: ObjectiveSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "objectives", persistence: { table: "objectiveVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteObjective",
      requestParams: { path: z35.object({ id: z35.string() }) },
      summary: "Delete objective",
      tags: ["config"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "objectives", persistence: { table: "objectiveVersions", mode: "delete" } }
    })
  },
  "/api/config/stripe": {
    get: operation({
      operationId: "getStripeIntegrationConfig",
      summary: "Get Stripe integration configuration",
      tags: ["config"],
      responses: { "200": { description: "Stripe config", content: { "application/json": { schema: StripeIntegrationConfigSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "stripe-config", persistence: { table: "stripeIntegrationConfig", mode: "get" } }
    }),
    put: operation({
      operationId: "upsertStripeIntegrationConfig",
      summary: "Create or update Stripe integration config",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: toWritableSchema(StripeIntegrationConfigSchema) } } },
      responses: { "200": { description: "Saved", content: { "application/json": { schema: StripeIntegrationConfigSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "stripe-config", persistence: { table: "stripeIntegrationConfig", mode: "upsert" } }
    })
  },
  "/api/config/metering": {
    get: operation({
      operationId: "listMeteringConfigs",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List metering configurations",
      tags: ["config"],
      responses: { "200": { description: "Metering config list", content: { "application/json": { schema: ListEnvelope(MeteringConfigSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "metering-config", persistence: { table: "meteringConfigs", mode: "list" } }
    }),
    post: operation({
      operationId: "createMeteringConfig",
      summary: "Create metering configuration",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(MeteringConfigSchema) } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: MeteringConfigSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "metering-config", persistence: { table: "meteringConfigs", mode: "create" } }
    })
  },
  "/api/config/metering/{meteringId}": {
    patch: operation({
      operationId: "updateMeteringConfig",
      requestParams: { path: z35.object({ meteringId: z35.string() }) },
      summary: "Update metering configuration",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: MeteringConfigSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: MeteringConfigSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "metering-config", persistence: { table: "meteringConfigs", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteMeteringConfig",
      requestParams: { path: z35.object({ meteringId: z35.string() }) },
      summary: "Delete metering configuration",
      tags: ["config"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "metering-config", persistence: { table: "meteringConfigs", mode: "delete" } }
    })
  },
  "/api/usage-enforcement-setting-anchors": {
    get: operation({
      operationId: "listUsageEnforcementSettingsAnchors",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List usage enforcement setting anchors (identity registry)",
      tags: ["config"],
      responses: {
        "200": { description: "Usage enforcement setting anchor list", content: { "application/json": { schema: ListEnvelope(UsageEnforcementSettingsAnchorSchema) } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "usage-enforcement-setting-anchors", persistence: { table: "usageEnforcementSettings", mode: "list" } }
    })
  },
  "/api/config/usage-enforcement": {
    get: operation({
      operationId: "listUsageEnforcementSettings",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List usage enforcement settings",
      tags: ["config"],
      responses: { "200": { description: "Enforcement settings", content: { "application/json": { schema: ListEnvelope(UsageEnforcementSettingsSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "usage-enforcement", persistence: { table: "usageEnforcementSettingVersions", mode: "list" } }
    }),
    post: operation({
      operationId: "createUsageEnforcementSettings",
      summary: "Create usage enforcement settings",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(UsageEnforcementSettingsSchema) } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: UsageEnforcementSettingsSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "usage-enforcement", persistence: { table: "usageEnforcementSettingVersions", mode: "create" } }
    })
  },
  "/api/config/usage-enforcement/{settingsId}": {
    patch: operation({
      operationId: "updateUsageEnforcementSettings",
      requestParams: { path: z35.object({ settingsId: z35.string() }) },
      summary: "Update usage enforcement settings",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: UsageEnforcementSettingsSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: UsageEnforcementSettingsSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "usage-enforcement", persistence: { table: "usageEnforcementSettingVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteUsageEnforcementSettings",
      requestParams: { path: z35.object({ settingsId: z35.string() }) },
      summary: "Delete usage enforcement settings",
      tags: ["config"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "usage-enforcement", persistence: { table: "usageEnforcementSettingVersions", mode: "delete" } }
    })
  },
  "/api/placement-setting-anchors": {
    get: operation({
      operationId: "listPlacementSettingsAnchors",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List placement setting anchors (identity registry)",
      tags: ["config"],
      responses: {
        "200": { description: "Placement setting anchor list", content: { "application/json": { schema: ListEnvelope(PlacementSettingsAnchorSchema) } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "placement-setting-anchors", persistence: { table: "placementSettings", mode: "list" } }
    })
  },
  "/api/config/placement-settings": {
    get: operation({
      operationId: "getPlacementSettings",
      summary: "Get global placement settings",
      tags: ["config"],
      responses: { "200": { description: "Placement settings", content: { "application/json": { schema: PlacementSettingsSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "placement-settings", persistence: { table: "placementSettingVersions", mode: "get" } }
    }),
    put: operation({
      operationId: "upsertPlacementSettings",
      summary: "Create or update global placement settings",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: toWritableSchema(PlacementSettingsSchema) } } },
      responses: { "200": { description: "Saved", content: { "application/json": { schema: PlacementSettingsSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "placement-settings", persistence: { table: "placementSettingVersions", mode: "upsert" } }
    })
  }
};

// scaffold/src/changemgmt/models/changelog-schema.ts
import { z as z36 } from "zod";
var { Unrestricted: Unrestricted28 } = DataClassification;
var { Persisted: Persisted17 } = SchemaPersistence;
var { Internal: Internal23 } = SchemaExposure;
var ChangeLogActionSchema = z36.enum(["create", "update", "delete", "archive", "restore", "reorder", "duplicate", "sync", "publish"]).meta(
  { id: "ChangeLogAction", "x-revturbine-schema-persistence": Persisted17, "x-revturbine-schema-exposure": Internal23 }
);
var ChangeLogEntrySchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  action: ChangeLogActionSchema.meta(Unrestricted28),
  resource_type: z36.string().min(1).max(100).meta(Unrestricted28),
  resource_id: z36.string().min(1).meta(Unrestricted28),
  resource_name: z36.string().max(200).optional().meta(Unrestricted28),
  actor_id: z36.string().min(1).meta(Unrestricted28),
  actor_email: z36.string().email().optional().meta(Unrestricted28),
  diff: z36.object({
    before: z36.record(z36.string(), z36.unknown()).optional(),
    after: z36.record(z36.string(), z36.unknown()).optional()
  }).optional().meta(Unrestricted28),
  summary: z36.string().max(1e3).optional().meta(Unrestricted28),
  metadata: MetadataField.meta(Unrestricted28)
}).meta(
  { id: "ChangeLogEntry", "x-revturbine-schema-persistence": Persisted17, "x-revturbine-schema-exposure": Internal23 }
);
var changelogPaths = {
  "/api/changelog": {
    get: operation({
      operationId: "listChangeLogEntries",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List change log entries",
      tags: ["changelog"],
      responses: { "200": { description: "Change log entries", content: { "application/json": { schema: ListEnvelope(ChangeLogEntrySchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "changelog", persistence: { table: "changeLogEntries", mode: "list" } }
    })
  },
  "/api/changelog/{entryId}": {
    get: operation({
      operationId: "getChangeLogEntry",
      requestParams: { path: z36.object({ entryId: z36.string() }) },
      summary: "Get change log entry by ID",
      tags: ["changelog"],
      responses: { "200": { description: "Change log entry", content: { "application/json": { schema: ChangeLogEntrySchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "changelog", persistence: { table: "changeLogEntries", mode: "get" } }
    })
  }
};

// scaffold/src/core/tenant/schema.ts
import { z as z37 } from "zod";
var { Unrestricted: Unrestricted29 } = DataClassification;
var { Persisted: Persisted18, Transient: Transient27 } = SchemaPersistence;
var { Internal: Internal24 } = SchemaExposure;
var TenantStatusSchema = z37.enum(["active", "suspended", "archived"]).meta(
  { id: "TenantStatus", "x-revturbine-schema-persistence": Transient27, "x-revturbine-schema-exposure": Internal24 }
);
var TenantSchema = IdField.merge(TimestampFields).extend({
  name: NameField.meta(Unrestricted29),
  handle: HandleField.meta(Unrestricted29),
  status: TenantStatusSchema.default("active").meta(Unrestricted29),
  metadata: MetadataField.meta(Unrestricted29)
}).meta(
  { id: "Tenant", "x-revturbine-schema-persistence": Persisted18, "x-revturbine-schema-exposure": Internal24 }
);
var tenantPaths = {
  "/api/tenants": {
    get: operation({
      operationId: "listTenants",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List tenants",
      tags: ["tenants"],
      responses: { "200": { description: "Tenant list", content: { "application/json": { schema: ListEnvelope(TenantSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "tenants", persistence: { table: "tenants", mode: "list" } }
    }),
    post: operation({
      operationId: "createTenant",
      summary: "Create tenant",
      tags: ["tenants"],
      requestBody: { required: true, content: { "application/json": { schema: TenantSchema } } },
      responses: {
        "201": { description: "Created", content: { "application/json": { schema: TenantSchema } } },
        default: { description: "Error", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "tenants", persistence: { table: "tenants", mode: "create" } }
    })
  },
  "/api/tenants/{tenantId}": {
    get: operation({
      operationId: "getTenant",
      requestParams: { path: z37.object({ tenantId: z37.string() }) },
      summary: "Get tenant by ID",
      tags: ["tenants"],
      responses: { "200": { description: "Tenant", content: { "application/json": { schema: TenantSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "tenants", persistence: { table: "tenants", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateTenant",
      requestParams: { path: z37.object({ tenantId: z37.string() }) },
      summary: "Update tenant",
      tags: ["tenants"],
      requestBody: { required: true, content: { "application/json": { schema: TenantSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: TenantSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "tenants", persistence: { table: "tenants", mode: "update" } }
    })
  },
  "/api/tenants/{tenantId}/suspend": {
    post: operation({
      operationId: "suspendTenant",
      requestParams: { path: z37.object({ tenantId: z37.string() }) },
      summary: "Suspend tenant (disables all API access)",
      tags: ["tenants"],
      responses: { "200": { description: "Suspended", content: { "application/json": { schema: TenantSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "tenants", persistence: { table: "tenants", mode: "update" } }
    })
  },
  "/api/tenants/{tenantId}/reactivate": {
    post: operation({
      operationId: "reactivateTenant",
      requestParams: { path: z37.object({ tenantId: z37.string() }) },
      summary: "Reactivate a suspended tenant",
      tags: ["tenants"],
      responses: { "200": { description: "Reactivated", content: { "application/json": { schema: TenantSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "tenants", persistence: { table: "tenants", mode: "update" } }
    })
  }
};

// scaffold/src/core/environment/schema.ts
import { z as z38 } from "zod";
var { Unrestricted: Unrestricted30 } = DataClassification;
var { Persisted: Persisted19, Transient: Transient28 } = SchemaPersistence;
var { Internal: Internal25 } = SchemaExposure;
var EnvironmentStatusSchema = z38.enum(["active", "archived", "locked"]).meta(
  { id: "EnvironmentStatus", "x-revturbine-schema-persistence": Transient28, "x-revturbine-schema-exposure": Internal25 }
);
var EnvironmentSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  name: NameField.meta(Unrestricted30),
  handle: HandleField.meta(Unrestricted30),
  description: DescriptionField.meta(Unrestricted30),
  is_production: z38.boolean().default(false).meta({ ...Unrestricted30, readOnly: true }),
  status: EnvironmentStatusSchema.default("active").meta(Unrestricted30),
  // Branching lineage
  cloned_from_environment_id: z38.string().nullable().default(null).meta({ ...Unrestricted30, readOnly: true }),
  cloned_at: NullableDatetimeField.meta({ ...Unrestricted30, readOnly: true }),
  cloned_at_sequence: z38.number().int().min(0).nullable().default(null).meta({ ...Unrestricted30, readOnly: true }),
  // Protection settings (analogous to protected branches)
  requires_approval: z38.boolean().default(false).meta(Unrestricted30),
  auto_deploy_on_approval: z38.boolean().default(false).meta(Unrestricted30),
  // Audit
  created_by: z38.string().optional().meta(Unrestricted30),
  metadata: MetadataField.meta(Unrestricted30)
}).meta(
  { id: "Environment", "x-revturbine-schema-persistence": Persisted19, "x-revturbine-schema-exposure": Internal25 }
);
var EnvironmentPromotionRequestSchema = z38.object({
  source_environment_id: z38.string().min(1),
  target_environment_id: z38.string().min(1),
  playbook_version_ids: z38.array(z38.string()).optional(),
  strategy: z38.enum(["all_current", "selected_playbook_versions"]).default("all_current")
}).meta(
  { id: "EnvironmentPromotionRequest", "x-revturbine-schema-persistence": Transient28, "x-revturbine-schema-exposure": Internal25 }
);
var environmentPaths = {
  "/api/environments": {
    get: operation({
      operationId: "listEnvironments",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List environments",
      tags: ["environments"],
      responses: { "200": { description: "Environment list", content: { "application/json": { schema: ListEnvelope(EnvironmentSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "environments", persistence: { table: "environments", mode: "list" } }
    }),
    post: operation({
      operationId: "createEnvironment",
      summary: "Create environment (optionally cloned from another)",
      tags: ["environments"],
      requestBody: { required: true, content: { "application/json": { schema: z38.object({
        name: z38.string().min(1).max(200),
        handle: z38.string().min(1).max(100),
        description: z38.string().max(500).optional(),
        clone_from_environment_id: z38.string().optional(),
        requires_approval: z38.boolean().optional()
      }) } } },
      responses: {
        "201": { description: "Created", content: { "application/json": { schema: EnvironmentSchema } } },
        default: { description: "Error", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "environments", persistence: { table: "environments", mode: "create" } }
    })
  },
  "/api/environments/{environmentId}": {
    get: operation({
      operationId: "getEnvironment",
      requestParams: { path: z38.object({ environmentId: z38.string() }) },
      summary: "Get environment by ID",
      tags: ["environments"],
      responses: { "200": { description: "Environment", content: { "application/json": { schema: EnvironmentSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "environments", persistence: { table: "environments", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateEnvironment",
      requestParams: { path: z38.object({ environmentId: z38.string() }) },
      summary: "Update environment settings",
      tags: ["environments"],
      requestBody: { required: true, content: { "application/json": { schema: EnvironmentSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: EnvironmentSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "environments", persistence: { table: "environments", mode: "update" } }
    })
  },
  "/api/environments/{environmentId}/archive": {
    post: operation({
      operationId: "archiveEnvironment",
      requestParams: { path: z38.object({ environmentId: z38.string() }) },
      summary: "Archive environment (production cannot be archived)",
      tags: ["environments"],
      responses: {
        "200": { description: "Archived", content: { "application/json": { schema: EnvironmentSchema } } },
        default: { description: "Error", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "environments", persistence: { table: "environments", mode: "update" } }
    })
  },
  "/api/environments/promote": {
    post: operation({
      operationId: "promoteEnvironment",
      summary: "Promote (merge) changes from one environment to another",
      tags: ["environments"],
      requestBody: { required: true, content: { "application/json": { schema: EnvironmentPromotionRequestSchema } } },
      responses: {
        "200": { description: "Promotion result", content: { "application/json": { schema: z38.object({
          promoted_count: z38.number().int(),
          conflict_count: z38.number().int(),
          conflicts: z38.array(z38.object({
            handle: z38.string(),
            resource_type: z38.string(),
            source_sequence: z38.number().int(),
            target_sequence: z38.number().int()
          }))
        }) } } },
        default: { description: "Error", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "environments", persistence: { table: "environments", mode: "promote" } }
    })
  }
};

// scaffold/src/decisions/models/schema.ts
import { z as z39 } from "zod";
var { Unrestricted: Unrestricted31, Pii: Pii7 } = DataClassification;
var { Transient: Transient29, Persisted: Persisted20 } = SchemaPersistence;
var { External: External14 } = SchemaExposure;
var SupersessionReasonSchema = z39.enum(["milestone_version", "milestone_order"]).meta({ id: "SupersessionReason", "x-revturbine-schema-persistence": Transient29, "x-revturbine-schema-exposure": External14 });
var SupersessionRecordSchema = z39.object({
  superseded_output_id: z39.string().min(1).meta(Unrestricted31),
  superseded_by: z39.string().min(1).meta(Unrestricted31),
  reason: SupersessionReasonSchema.meta(Unrestricted31)
}).meta({
  id: "SupersessionRecord",
  "x-revturbine-schema-persistence": Persisted20,
  "x-revturbine-schema-exposure": External14,
  ...DataClassification.Operational
});
var EntitlementStatusSchema = z39.enum(ENTITLEMENT_STATUS_VALUES).meta({ id: "EntitlementStatus", "x-revturbine-schema-persistence": Transient29, "x-revturbine-schema-exposure": External14 });
var PlacementDecisionOutputSchema = z39.object({
  output_id: z39.string().meta(Unrestricted31),
  category: z39.string().meta(Unrestricted31),
  surface: z39.object({
    template: z39.string().optional().meta(Unrestricted31),
    type: SurfaceTypeSchema.meta(Unrestricted31),
    slot_id: z39.string().optional().meta(Unrestricted31)
  }).meta(Unrestricted31),
  content: z39.record(z39.string(), z39.unknown()).meta(Unrestricted31),
  promotion: z39.record(z39.string(), z39.unknown()).optional().meta(Unrestricted31),
  cta_path: z39.record(z39.string(), z39.unknown()).optional().meta(Unrestricted31),
  /** @deprecated Use cta_path. Kept for compatibility with older SDK consumers. */
  ui_path: z39.record(z39.string(), z39.unknown()).optional().meta(Unrestricted31),
  rule_id: z39.string().meta(Unrestricted31),
  decision_id: z39.string().meta(Unrestricted31),
  config_version: z39.string().meta(Unrestricted31),
  present_upsell: z39.boolean().meta(Unrestricted31),
  /**
   * Canonical, version-stable handle of the message block whose content was
   * rendered. Analytics groups on this value across message edits (plan 182).
   */
  message_block_handle: z39.string().optional().meta(Unrestricted31),
  /**
   * Immutable message-block version id, when the resolver has one. The
   * current Playbook projection carries only the canonical handle, so local
   * decisions omit this field rather than mislabelling a handle as a version.
   */
  message_block_id: z39.string().optional().meta(Unrestricted31),
  /**
   * Experiment this decision belonged to, as the experiment's **handle** —
   * canonical and version-stable, so editing an experiment does not break the
   * reference (plan 183 REQ-10).
   *
   * Absent means **not enrolled**, which is deliberately distinct from being
   * in the control arm: control is an assignment like any other and reports a
   * `variant_key`. Never populated for a user the ExperimentProvider did not
   * assign, so a holdout stays analysable rather than collapsing into the
   * unenrolled population (REQ-6).
   */
  experiment_id: z39.string().optional().meta(Unrestricted31),
  /** Assigned arm within `experiment_id`, as the variant's handle. Present iff `experiment_id` is. */
  variant_key: z39.string().optional().meta(Unrestricted31),
  /**
   * Version of the experiment definition that produced this decision, where
   * known. `experiment_id` answers "how is this experiment performing" across
   * edits; this answers "which definition produced this result", which is what
   * makes a mid-flight edit analysable instead of silently corrupting the
   * series (REQ-10).
   */
  experiment_version_id: z39.string().optional().meta(Unrestricted31)
}).meta({ id: "PlacementDecisionOutput", "x-revturbine-schema-persistence": Transient29, "x-revturbine-schema-exposure": External14 });
var EntitlementCheckResultSchema = z39.object({
  status: EntitlementStatusSchema.meta(Unrestricted31),
  allowed: z39.boolean().meta(Unrestricted31),
  reason: z39.string().optional().meta(Unrestricted31),
  current_tier: z39.string().optional().meta(Unrestricted31),
  /**
   * Effective numeric limit from the matched entitlement rule (or usage
   * snapshot) — plan 133. Present only on limit-bearing outcomes
   * (usage_limit / credits); absence means limit-agnostic, not unlimited.
   */
  limit: z39.number().optional().meta(Unrestricted31),
  /** Consumed amount the evaluation applied against `limit`. */
  used: z39.number().optional().meta(Unrestricted31),
  /** `max(0, limit - used)`. */
  remaining: z39.number().optional().meta(Unrestricted31),
  /**
   * The `unique_handle` of the entitlement rule this verdict came from —
   * the winner of the §2.6.5 most-permissive selection (BL-0062, gap G3).
   * Absent when no rule produced the verdict (unknown handle, no plan
   * identity, default policy). This is the value an SDK stamps as the
   * gate event's `rule_handle`, grounding the analytics rule slice.
   */
  rule_handle: z39.string().optional().meta(Unrestricted31),
  /** Upsell placement to render when entitlement is denied. */
  placement: PlacementDecisionOutputSchema.optional().meta(Unrestricted31)
}).meta({ id: "EntitlementCheckResult", "x-revturbine-schema-persistence": Transient29, "x-revturbine-schema-exposure": External14 });
var RuntimePromotionSnapshotSchema = z39.object({
  id: z39.string().meta(Unrestricted31),
  name: z39.string().optional().meta(Unrestricted31),
  discount: z39.string().optional().meta(Unrestricted31),
  type: z39.string().optional().meta(Unrestricted31),
  status: z39.string().optional().meta(Unrestricted31)
}).meta({ id: "RuntimePromotionSnapshot", "x-revturbine-schema-persistence": Transient29, "x-revturbine-schema-exposure": External14 });
var ServerEvaluationPayloadUserSchema = z39.object({
  id: z39.string().meta(Pii7),
  anonymous_id: z39.string().optional().meta(Unrestricted31),
  traits: z39.record(z39.string(), z39.unknown()).optional().meta(Pii7)
}).meta({ id: "ServerEvaluationPayloadUser", "x-revturbine-schema-persistence": Transient29, "x-revturbine-schema-exposure": External14 });
var ServerEvaluationPayloadDecisionsItemSchema = z39.object({
  slot_id: z39.string().optional().meta(Unrestricted31),
  entitlement_handle: z39.string().optional().meta(Unrestricted31),
  plan_handle: z39.string().optional().meta(Unrestricted31),
  placement_handle: z39.string().optional().meta(Unrestricted31),
  visible: z39.boolean().meta(Unrestricted31),
  output: PlacementDecisionOutputSchema.optional().meta(Unrestricted31),
  reason_codes: z39.array(z39.string()).optional().meta(Unrestricted31)
}).meta({ id: "ServerEvaluationPayloadDecisionsItem", "x-revturbine-schema-persistence": Transient29, "x-revturbine-schema-exposure": External14 });
var ServerEvaluationPayloadEntitlementsValueSchema = EntitlementCheckResultSchema;
var ServerEvaluationPayloadTrialStatusSchema = UserTrialStatusSchema.meta({ id: "ServerEvaluationPayloadTrialStatus", "x-revturbine-schema-persistence": Transient29, "x-revturbine-schema-exposure": External14 });
var ServerEvaluationPayloadUserContextSchema = z39.object({
  segments: z39.array(z39.string()).optional().meta(Unrestricted31),
  traits: z39.record(z39.string(), z39.unknown()).optional().meta(Pii7),
  usage_balances: z39.record(z39.string(), z39.number()).optional().meta(Unrestricted31)
}).meta({ id: "ServerEvaluationPayloadUserContext", "x-revturbine-schema-persistence": Transient29, "x-revturbine-schema-exposure": External14 });
var ServerEvaluationPayloadSchema = z39.object({
  version: z39.literal("1.0.0").meta(Unrestricted31),
  request_id: z39.string().meta(Unrestricted31),
  tenant_id: z39.string().meta(Unrestricted31),
  evaluated_at: z39.string().datetime().meta(Unrestricted31),
  ttl_seconds: z39.number().int().min(0).max(86400).meta(Unrestricted31),
  user: ServerEvaluationPayloadUserSchema.meta(Pii7),
  decisions: z39.array(ServerEvaluationPayloadDecisionsItemSchema).meta(Unrestricted31),
  entitlements: z39.record(z39.string(), ServerEvaluationPayloadEntitlementsValueSchema).optional().meta(Unrestricted31),
  theme: z39.record(z39.string(), z39.unknown()).optional().meta(Unrestricted31),
  trial_status: ServerEvaluationPayloadTrialStatusSchema.optional().meta(Unrestricted31),
  user_context: ServerEvaluationPayloadUserContextSchema.optional().meta(Pii7)
}).meta({ id: "ServerEvaluationPayload", "x-revturbine-schema-persistence": Transient29, "x-revturbine-schema-exposure": External14 });

// scaffold/src/changemgmt/models/changesets-schema.ts
import { z as z40 } from "zod";
var { Unrestricted: Unrestricted32 } = DataClassification;
var { Persisted: Persisted21, Transient: Transient30 } = SchemaPersistence;
var { Internal: Internal26 } = SchemaExposure;
var PlaybookVersionStatusSchema = z40.enum([
  "draft",
  "awaiting_approval",
  "approved",
  "deploying",
  "deployed",
  "rejected",
  "archived"
]).meta(
  { id: "PlaybookVersionStatus", "x-revturbine-schema-persistence": Transient30, "x-revturbine-schema-exposure": Internal26 }
);
var PlaybookVersionSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  environment_id: z40.string().min(1).meta(Unrestricted32),
  name: NameField.meta(Unrestricted32),
  description: z40.string().max(2e3).optional().meta(Unrestricted32),
  status: PlaybookVersionStatusSchema.default("draft").meta(Unrestricted32),
  labels: z40.array(z40.string()).default([]).meta(Unrestricted32),
  // People
  created_by: z40.string().min(1).meta(Unrestricted32),
  submitted_by: z40.string().nullable().default(null).meta({ ...Unrestricted32, readOnly: true }),
  reviewed_by: z40.string().nullable().default(null).meta({ ...Unrestricted32, readOnly: true }),
  deployed_by: z40.string().nullable().default(null).meta({ ...Unrestricted32, readOnly: true }),
  // Dates
  submitted_at: NullableDatetimeField.meta({ ...Unrestricted32, readOnly: true }),
  reviewed_at: NullableDatetimeField.meta({ ...Unrestricted32, readOnly: true }),
  deployed_at: NullableDatetimeField.meta({ ...Unrestricted32, readOnly: true }),
  // Snapshot (analogous to HEAD at branch creation)
  base_snapshot_sequence: z40.number().int().min(0).default(0).meta({ ...Unrestricted32, readOnly: true }),
  // Computed counts
  entry_count: z40.number().int().min(0).default(0).meta({ ...Unrestricted32, readOnly: true }),
  conflict_count: z40.number().int().min(0).default(0).meta({ ...Unrestricted32, readOnly: true }),
  // Lineage
  rollback_of_playbook_version_id: z40.string().nullable().default(null).meta(Unrestricted32),
  cherry_picked_from_playbook_version_id: z40.string().nullable().default(null).meta(Unrestricted32),
  // Review
  review_notes: z40.string().max(2e3).optional().meta(Unrestricted32),
  rejection_reason: z40.string().max(2e3).optional().meta(Unrestricted32),
  // Immutable frozen artifacts, written once when the playbook version is activated
  // (plan 70): `snapshot` is the fully-rendered RevTurbineConfig JSON; `bundle`
  // is the compiled FlatBuffer bundle, base64-encoded (the Zod→drizzle
  // generator has no bytea type). `bundle_sha256` is the lowercase content
  // address used for tenant-scoped lookup. readOnly — only the activation
  // path writes them, and never overwrites a populated value.
  snapshot: z40.record(z40.string(), z40.unknown()).nullable().default(null).meta({ ...Unrestricted32, readOnly: true }),
  bundle: z40.string().nullable().default(null).meta({ ...Unrestricted32, readOnly: true }),
  bundle_sha256: z40.string().regex(/^[a-f0-9]{64}$/).nullable().default(null).meta({ ...Unrestricted32, readOnly: true }),
  metadata: MetadataField.meta(Unrestricted32)
}).meta(
  { id: "PlaybookVersion", "x-revturbine-schema-persistence": Persisted21, "x-revturbine-schema-exposure": Internal26 }
);
var PlaybookVersionEntrySummarySchema = z40.object({
  handle: z40.string().meta(Unrestricted32),
  resource_type: z40.string().meta(Unrestricted32),
  resource_name: z40.string().optional().meta(Unrestricted32),
  action: z40.enum(["create", "update", "delete"]).meta(Unrestricted32),
  has_conflict: z40.boolean().meta(Unrestricted32)
}).meta(
  { id: "PlaybookVersionEntrySummary", "x-revturbine-schema-persistence": Transient30, "x-revturbine-schema-exposure": Internal26 }
);
var PlaybookVersionDiffSchema = z40.object({
  playbook_version_id: z40.string().meta(Unrestricted32),
  entries: z40.array(PlaybookVersionEntrySummarySchema).meta(Unrestricted32),
  total_entries: z40.number().int().min(0).meta(Unrestricted32),
  total_conflicts: z40.number().int().min(0).meta(Unrestricted32),
  deployable: z40.boolean().meta(Unrestricted32)
}).meta(
  { id: "PlaybookVersionDiff", "x-revturbine-schema-persistence": Transient30, "x-revturbine-schema-exposure": Internal26 }
);
var PlaybookVersionDeployResultSchema = z40.object({
  playbook_version_id: z40.string().meta(Unrestricted32),
  deployed_count: z40.number().int().min(0).meta(Unrestricted32),
  superseded_count: z40.number().int().min(0).meta(Unrestricted32),
  skipped_conflicts: z40.number().int().min(0).meta(Unrestricted32),
  deployed_at: z40.string().datetime().meta(Unrestricted32)
}).meta(
  { id: "PlaybookVersionDeployResult", "x-revturbine-schema-persistence": Transient30, "x-revturbine-schema-exposure": Internal26 }
);
var playbookVersionPaths = {
  // ── Lifecycle transitions ────────────────────────────────────────────────
  "/api/playbook-versions/{playbookVersionId}/submit": {
    post: operation({
      operationId: "submitPlaybookVersion",
      requestParams: { path: z40.object({ playbookVersionId: z40.string() }) },
      summary: "Submit playbook version for approval",
      tags: ["playbook-versions"],
      responses: {
        "200": { description: "Submitted", content: { "application/json": { schema: PlaybookVersionSchema } } },
        default: { description: "Error", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "playbook-versions", persistence: { table: "playbookVersions", mode: "update" } }
    })
  },
  "/api/playbook-versions/{playbookVersionId}/approve": {
    post: operation({
      operationId: "approvePlaybookVersion",
      requestParams: { path: z40.object({ playbookVersionId: z40.string() }) },
      summary: "Approve playbook version (may auto-deploy if environment allows)",
      tags: ["playbook-versions"],
      requestBody: { required: true, content: { "application/json": { schema: z40.object({ review_notes: z40.string().max(2e3).optional() }) } } },
      responses: {
        "200": { description: "Approved", content: { "application/json": { schema: PlaybookVersionSchema } } },
        default: { description: "Error", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "playbook-versions", persistence: { table: "playbookVersions", mode: "update" } }
    })
  },
  "/api/playbook-versions/{playbookVersionId}/reject": {
    post: operation({
      operationId: "rejectPlaybookVersion",
      requestParams: { path: z40.object({ playbookVersionId: z40.string() }) },
      summary: "Reject playbook version",
      tags: ["playbook-versions"],
      requestBody: { required: true, content: { "application/json": { schema: z40.object({ rejection_reason: z40.string().max(2e3) }) } } },
      responses: {
        "200": { description: "Rejected", content: { "application/json": { schema: PlaybookVersionSchema } } },
        default: { description: "Error", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "playbook-versions", persistence: { table: "playbookVersions", mode: "update" } }
    })
  },
  "/api/playbook-versions/{playbookVersionId}/deploy": {
    post: operation({
      operationId: "deployPlaybookVersion",
      requestParams: { path: z40.object({ playbookVersionId: z40.string() }) },
      summary: "Deploy playbook version \u2014 activates all entries, supersedes previous versions",
      tags: ["playbook-versions"],
      requestBody: { required: true, content: { "application/json": { schema: z40.object({ force: z40.boolean().default(false) }) } } },
      responses: {
        "200": { description: "Deploy result", content: { "application/json": { schema: PlaybookVersionDeployResultSchema } } },
        default: { description: "Error (conflicts exist)", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "playbook-versions", persistence: { table: "playbookVersions", mode: "deploy" } }
    })
  },
  "/api/playbook-versions/{playbookVersionId}/archive": {
    post: operation({
      operationId: "archivePlaybookVersion",
      requestParams: { path: z40.object({ playbookVersionId: z40.string() }) },
      summary: "Archive (abandon) a playbook version",
      tags: ["playbook-versions"],
      responses: { "200": { description: "Archived", content: { "application/json": { schema: PlaybookVersionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "playbook-versions", persistence: { table: "playbookVersions", mode: "update" } }
    })
  },
  // ── Inspection ───────────────────────────────────────────────────────────
  "/api/playbook-versions/{playbookVersionId}/preview": {
    get: operation({
      operationId: "previewPlaybookVersion",
      requestParams: { path: z40.object({ playbookVersionId: z40.string() }) },
      summary: "Preview diff of all entries vs current state (dry-run deploy)",
      tags: ["playbook-versions"],
      responses: { "200": { description: "Diff preview", content: { "application/json": { schema: PlaybookVersionDiffSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "playbook-versions", persistence: { table: "playbookVersions", mode: "preview" } }
    })
  },
  "/api/playbook-versions/{playbookVersionId}/conflicts": {
    get: operation({
      operationId: "listPlaybookVersionConflicts",
      requestParams: { path: z40.object({ playbookVersionId: z40.string() }), query: ListQueryParamsSchema },
      summary: "List entries with sequence conflicts (base_sequence \u2260 current)",
      tags: ["playbook-versions"],
      responses: { "200": { description: "Conflict list", content: { "application/json": { schema: ListEnvelope(PlaybookVersionEntrySummarySchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "playbook-versions", persistence: { table: "playbookVersions", mode: "list" } }
    })
  },
  // ── Advanced operations ──────────────────────────────────────────────────
  "/api/playbook-versions/{playbookVersionId}/rollback": {
    post: operation({
      operationId: "rollbackPlaybookVersion",
      requestParams: { path: z40.object({ playbookVersionId: z40.string() }) },
      summary: "Create a rollback playbook version that reverts a deployed one",
      tags: ["playbook-versions"],
      requestBody: { required: true, content: { "application/json": { schema: z40.object({
        name: z40.string().min(1).max(200).optional()
      }) } } },
      responses: {
        "201": { description: "Rollback PlaybookVersion created", content: { "application/json": { schema: PlaybookVersionSchema } } },
        default: { description: "Error", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "playbook-versions", persistence: { table: "playbookVersions", mode: "create" } }
    })
  },
  "/api/playbook-versions/{playbookVersionId}/cherry-pick": {
    post: operation({
      operationId: "cherryPickEntries",
      requestParams: { path: z40.object({ playbookVersionId: z40.string() }) },
      summary: "Cherry-pick individual entries from this PlaybookVersion into another",
      tags: ["playbook-versions"],
      requestBody: { required: true, content: { "application/json": { schema: z40.object({
        handles: z40.array(z40.string()).min(1),
        target_playbook_version_id: z40.string().min(1)
      }) } } },
      responses: {
        "200": { description: "Cherry-picked", content: { "application/json": { schema: z40.object({ copied_count: z40.number().int() }) } } },
        default: { description: "Error", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "playbook-versions", persistence: { table: "playbookVersions", mode: "update" } }
    })
  }
};

// scaffold/src/settings/models/schema.ts
import { z as z41 } from "zod";
var { Unrestricted: Unrestricted33 } = DataClassification;
var { Persisted: Persisted22 } = SchemaPersistence;
var { Internal: Internal27 } = SchemaExposure;
var PROVIDER_CONNECTION_FACETS = schemaFacets(SchemaContext.CustomerOperations, {
  sdkInput: false,
  source: SchemaSource.Customer
});
var DEFAULT_ANALYTICS_RETENTION_DAYS = 365;
var ProviderConnectionSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  provider_handle: HandleField.meta(Unrestricted33),
  provider_type: HandleField.meta(Unrestricted33),
  endpoint: z41.string().url().max(2048).nullable().default(null).meta(Unrestricted33),
  credential_reference: z41.string().min(1).max(255).nullable().default(null).meta({ ...Unrestricted33, readOnly: true }),
  environment_id: z41.string().min(1).max(200).default("production").meta(Unrestricted33),
  health_state: ProviderAvailabilitySchema.default("unavailable").meta({ ...Unrestricted33, readOnly: true }),
  last_health_check_at: NullableDatetimeField.meta({ ...Unrestricted33, readOnly: true }),
  supported_capability_versions: z41.record(
    z41.string().min(1).max(100),
    z41.array(z41.number().int().min(1)).min(1)
  ).default({}).meta({ ...Unrestricted33, readOnly: true }),
  external_project_id: z41.string().min(1).max(255).nullable().default(null).meta(Unrestricted33),
  external_workspace_id: z41.string().min(1).max(255).nullable().default(null).meta(Unrestricted33),
  timeout_ms: z41.number().int().min(1).max(12e4).default(1e4).meta(Unrestricted33),
  stale_after_ms: z41.number().int().min(1).default(3e5).meta(Unrestricted33),
  unavailable_after_failures: z41.number().int().min(1).max(100).default(3).meta(Unrestricted33)
}).meta({ id: "ProviderConnection", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal27, ...PROVIDER_CONNECTION_FACETS });
var FlagValueTypeSchema = z41.enum(["boolean", "string", "number", "json"]).meta({ id: "FlagValueType", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal27 });
var FeatureFlagSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  key: z41.string().min(1).max(100).meta(Unrestricted33),
  value_type: FlagValueTypeSchema.default("boolean").meta(Unrestricted33),
  value: z41.string().max(4e3).default("false").meta(Unrestricted33),
  description: DescriptionField.meta(Unrestricted33),
  enabled: z41.boolean().default(true).meta(Unrestricted33)
}).meta({ id: "FeatureFlag", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal27 });
var TenantConfigSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  workspace_name: z41.string().min(1).max(200).meta(Unrestricted33),
  support_email: z41.string().email().nullable().default(null).meta(Unrestricted33),
  timezone: z41.string().max(50).default("UTC").meta(Unrestricted33),
  default_currency: z41.string().length(3).default("USD").meta(Unrestricted33),
  logo_url: z41.string().url().nullable().default(null).meta(Unrestricted33),
  // ── Activity thresholds (plan 180 D4/D5) ─────────────────────────────
  // Tenant-level settings applied AT CONTEXT RETRIEVAL against the
  // persisted `user_contexts.activity_score` to derive the activity level
  // (`deriveActivityLevel`). The window governs the score job's counting
  // period; the mins are the level cut points (score ≥ high_min → high,
  // ≥ medium_min → medium, ≥ low_min → low, else inactive; no score → new).
  activity_window_days: z41.number().int().min(1).default(DEFAULT_ACTIVITY_THRESHOLDS.window_days).meta(Unrestricted33),
  activity_high_min: z41.number().int().min(1).default(DEFAULT_ACTIVITY_THRESHOLDS.high_min).meta(Unrestricted33),
  activity_medium_min: z41.number().int().min(1).default(DEFAULT_ACTIVITY_THRESHOLDS.medium_min).meta(Unrestricted33),
  activity_low_min: z41.number().int().min(1).default(DEFAULT_ACTIVITY_THRESHOLDS.low_min).meta(Unrestricted33),
  // Shared retention policy for activity-scaled analytics artifacts. Plan
  // 200 applies it to experiment evidence/results; plan 210 reuses it for
  // saved-view revisions instead of defining another tenant setting.
  analytics_retention_days: z41.number().int().min(1).default(DEFAULT_ANALYTICS_RETENTION_DAYS).meta(Unrestricted33)
}).meta({ id: "TenantConfig", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal27 });
var McpConfigSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  /** @deprecated Plan 28 ships a hosted MCP server at `/api/mcp/streamable-http`; no outbound server URL is needed. Column remains for backward compatibility. */
  server_url: z41.string().url().max(500).meta(Unrestricted33),
  /** @deprecated Plan 28 mints per-tenant MCP tokens at Settings → MCP and stores only a SHA-256 hash; this free-text hint is unused. Column remains for backward compatibility. */
  api_token_hint: z41.string().max(50).nullable().default(null).meta(Unrestricted33),
  allow_write_actions: z41.boolean().default(false).meta(Unrestricted33),
  enabled_tools: z41.array(z41.string().max(100)).default([]).meta(Unrestricted33),
  enabled: z41.boolean().default(false).meta(Unrestricted33)
}).meta({ id: "McpConfig", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal27 });
var OnboardingChecklistSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  step_key: z41.string().min(1).max(100).meta(Unrestricted33),
  label: z41.string().min(1).max(200).meta(Unrestricted33),
  done: z41.boolean().default(false).meta(Unrestricted33),
  completed_at: NullableDatetimeField.meta({ ...Unrestricted33, readOnly: true })
}).meta({ id: "OnboardingChecklist", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal27 });
var AuditActorTypeSchema = z41.enum(["user", "agent", "system", "webhook"]).meta({ id: "AuditActorType", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal27 });
var AuditEventSchema = IdField.merge(TenantIdField).extend({
  environment_id: z41.string().min(1).default("production").meta(Unrestricted33),
  actor_type: AuditActorTypeSchema.meta(Unrestricted33),
  actor_id: z41.string().nullable().default(null).meta(Unrestricted33),
  action: z41.string().min(1).max(120).meta(Unrestricted33),
  object_type: z41.string().max(120).nullable().default(null).meta(Unrestricted33),
  object_id: z41.string().max(200).nullable().default(null).meta(Unrestricted33),
  payload: z41.record(z41.string(), z41.unknown()).nullable().default(null).meta(Unrestricted33),
  occurred_at: z41.string().datetime().meta({ ...Unrestricted33, readOnly: true })
}).meta({ id: "AuditEvent", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal27 });
var PlacementTestUserIdentifierTypeSchema = z41.enum(["user_id", "account_id", "email"]).meta({ id: "PlacementTestUserIdentifierType", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal27 });
var PlacementTestUserSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  handle: HandleField.meta({ ...Unrestricted33, readOnly: true }),
  identifier: z41.string().min(1).max(200).meta(Unrestricted33),
  identifier_type: PlacementTestUserIdentifierTypeSchema.default("user_id").meta(Unrestricted33),
  note: z41.string().max(500).nullable().default(null).meta(Unrestricted33),
  added_by: z41.string().meta(Unrestricted33)
}).meta({ id: "PlacementTestUser", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal27, ...mintedIdentity() });
var settingsPaths = {
  // ── Feature Flags ────────────────────────────────────────────────────────
  "/api/flags": {
    get: operation({
      operationId: "listFeatureFlags",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List feature flags for the tenant",
      tags: ["settings"],
      responses: { "200": { description: "Feature flags", content: { "application/json": { schema: ListEnvelope(FeatureFlagSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "feature-flags", persistence: { table: "featureFlags", mode: "list" } }
    }),
    post: operation({
      operationId: "createFeatureFlag",
      summary: "Create a feature flag",
      tags: ["settings"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(FeatureFlagSchema) } } },
      responses: { "201": { description: "Feature flag created", content: { "application/json": { schema: FeatureFlagSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "feature-flags", persistence: { table: "featureFlags", mode: "create", writeSchema: "FeatureFlagSchema#writable" } }
    })
  },
  "/api/flags/{flagId}": {
    get: operation({
      operationId: "getFeatureFlag",
      requestParams: { path: z41.object({ flagId: z41.string() }) },
      summary: "Get a feature flag",
      tags: ["settings"],
      responses: { "200": { description: "Feature flag", content: { "application/json": { schema: FeatureFlagSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "feature-flags", persistence: { table: "featureFlags", mode: "get" } }
    }),
    put: operation({
      operationId: "updateFeatureFlag",
      requestParams: { path: z41.object({ flagId: z41.string() }) },
      summary: "Update a feature flag",
      tags: ["settings"],
      requestBody: { required: true, content: { "application/json": { schema: toWritableSchema(FeatureFlagSchema).partial() } } },
      responses: { "200": { description: "Feature flag updated", content: { "application/json": { schema: FeatureFlagSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "feature-flags", persistence: { table: "featureFlags", mode: "update", writeSchema: "FeatureFlagSchema#writable" } }
    }),
    delete: operation({
      operationId: "deleteFeatureFlag",
      requestParams: { path: z41.object({ flagId: z41.string() }) },
      summary: "Delete a feature flag",
      tags: ["settings"],
      responses: { "200": { description: "Feature flag deleted", content: { "application/json": { schema: FeatureFlagSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "feature-flags", persistence: { table: "featureFlags", mode: "delete" } }
    })
  },
  // ── Tenant Config ────────────────────────────────────────────────────────
  "/api/settings/tenant-config": {
    get: operation({
      operationId: "getTenantConfig",
      summary: "Get tenant configuration",
      tags: ["settings"],
      responses: { "200": { description: "Tenant config", content: { "application/json": { schema: TenantConfigSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "tenant-config", persistence: { table: "tenantConfigs", mode: "get" } }
    }),
    put: operation({
      operationId: "updateTenantConfig",
      summary: "Update tenant configuration",
      tags: ["settings"],
      requestBody: { required: true, content: { "application/json": { schema: toWritableSchema(TenantConfigSchema).partial() } } },
      responses: { "200": { description: "Tenant config updated", content: { "application/json": { schema: TenantConfigSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "tenant-config", persistence: { table: "tenantConfigs", mode: "update", writeSchema: "TenantConfigSchema#writable" } }
    })
  },
  // ── MCP Config ───────────────────────────────────────────────────────────
  "/api/settings/mcp": {
    get: operation({
      operationId: "getMcpConfig",
      summary: "Get MCP config",
      tags: ["settings"],
      responses: { "200": { description: "MCP config", content: { "application/json": { schema: McpConfigSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "mcp-config", persistence: { table: "mcpConfigs", mode: "get" } }
    }),
    put: operation({
      operationId: "updateMcpConfig",
      summary: "Update MCP config",
      tags: ["settings"],
      requestBody: { required: true, content: { "application/json": { schema: toWritableSchema(McpConfigSchema).partial() } } },
      responses: { "200": { description: "MCP config updated", content: { "application/json": { schema: McpConfigSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "mcp-config", persistence: { table: "mcpConfigs", mode: "update", writeSchema: "McpConfigSchema#writable" } }
    })
  },
  // ── Onboarding Checklist ─────────────────────────────────────────────────
  "/api/settings/onboarding": {
    get: operation({
      operationId: "listOnboardingSteps",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List onboarding checklist steps",
      tags: ["settings"],
      responses: { "200": { description: "Onboarding steps", content: { "application/json": { schema: ListEnvelope(OnboardingChecklistSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "onboarding", persistence: { table: "onboardingChecklist", mode: "list" } }
    })
  },
  "/api/settings/onboarding/{stepId}": {
    get: operation({
      operationId: "getOnboardingStep",
      requestParams: { path: z41.object({ stepId: z41.string() }) },
      summary: "Get an onboarding step",
      tags: ["settings"],
      responses: { "200": { description: "Onboarding step", content: { "application/json": { schema: OnboardingChecklistSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "onboarding", persistence: { table: "onboardingChecklist", mode: "get" } }
    }),
    put: operation({
      operationId: "updateOnboardingStep",
      requestParams: { path: z41.object({ stepId: z41.string() }) },
      summary: "Update an onboarding step",
      tags: ["settings"],
      requestBody: { required: true, content: { "application/json": { schema: toWritableSchema(OnboardingChecklistSchema).partial() } } },
      responses: { "200": { description: "Onboarding step updated", content: { "application/json": { schema: OnboardingChecklistSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "onboarding", persistence: { table: "onboardingChecklist", mode: "update", writeSchema: "OnboardingChecklistSchema#writable" } }
    })
  },
  // ── Audit Events ─────────────────────────────────────────────────────────
  "/api/settings/audit-events": {
    get: operation({
      operationId: "listAuditEvents",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List audit events for the tenant",
      tags: ["settings"],
      responses: { "200": { description: "Audit events", content: { "application/json": { schema: ListEnvelope(AuditEventSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "audit-events", persistence: { table: "auditEvents", mode: "list" } }
    })
  },
  // ── Placement Test Users (per-customer Test Mode list) ───────────────────
  "/api/config/placement-test-users": {
    get: operation({
      operationId: "listPlacementTestUsers",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List placement test users for the tenant",
      tags: ["settings"],
      responses: { "200": { description: "Placement test users", content: { "application/json": { schema: ListEnvelope(PlacementTestUserSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "placement-test-users", persistence: { table: "placementTestUsers", mode: "list" } }
    }),
    post: operation({
      operationId: "createPlacementTestUser",
      summary: "Add a placement test user",
      tags: ["settings"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(PlacementTestUserSchema) } } },
      responses: { "201": { description: "Placement test user created", content: { "application/json": { schema: PlacementTestUserSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "placement-test-users", persistence: { table: "placementTestUsers", mode: "create", writeSchema: "PlacementTestUserSchema#writable" } }
    })
  },
  "/api/config/placement-test-users/{testUserId}": {
    delete: operation({
      operationId: "deletePlacementTestUser",
      requestParams: { path: z41.object({ testUserId: z41.string() }) },
      summary: "Remove a placement test user",
      tags: ["settings"],
      responses: { "200": { description: "Placement test user removed", content: { "application/json": { schema: PlacementTestUserSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "placement-test-users", persistence: { table: "placementTestUsers", mode: "delete" } }
    })
  },
  // ── Provider Connections ────────────────────────────────────────────────
  "/api/settings/provider-connections": {
    get: operation({
      operationId: "listProviderConnections",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List provider connections for the tenant",
      tags: ["settings"],
      responses: { "200": { description: "Provider connections", content: { "application/json": { schema: ListEnvelope(ProviderConnectionSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "provider-connections", persistence: { table: "providerConnections", mode: "list" } }
    }),
    post: operation({
      operationId: "createProviderConnection",
      summary: "Create a provider connection",
      tags: ["settings"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(ProviderConnectionSchema) } } },
      responses: { "201": { description: "Provider connection created", content: { "application/json": { schema: ProviderConnectionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "provider-connections", persistence: { table: "providerConnections", mode: "create", writeSchema: "ProviderConnectionSchema#writable" } }
    })
  },
  "/api/settings/provider-connections/{connectionId}": {
    get: operation({
      operationId: "getProviderConnection",
      requestParams: { path: z41.object({ connectionId: z41.string() }) },
      summary: "Get a provider connection",
      tags: ["settings"],
      responses: { "200": { description: "Provider connection", content: { "application/json": { schema: ProviderConnectionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "provider-connections", persistence: { table: "providerConnections", mode: "get" } }
    }),
    put: operation({
      operationId: "updateProviderConnection",
      requestParams: { path: z41.object({ connectionId: z41.string() }) },
      summary: "Update a provider connection",
      tags: ["settings"],
      requestBody: { required: true, content: { "application/json": { schema: toWritableSchema(ProviderConnectionSchema).partial() } } },
      responses: { "200": { description: "Provider connection updated", content: { "application/json": { schema: ProviderConnectionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "provider-connections", persistence: { table: "providerConnections", mode: "update", writeSchema: "ProviderConnectionSchema#writable" } }
    }),
    delete: operation({
      operationId: "deleteProviderConnection",
      requestParams: { path: z41.object({ connectionId: z41.string() }) },
      summary: "Delete a provider connection",
      tags: ["settings"],
      responses: { "200": { description: "Provider connection deleted", content: { "application/json": { schema: ProviderConnectionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "provider-connections", persistence: { table: "providerConnections", mode: "delete" } }
    })
  }
};

// scaffold/src/core/auth/schema.ts
import { z as z42 } from "zod";
var { Unrestricted: Unrestricted34, Pii: Pii8 } = DataClassification;
var { Persisted: Persisted23, Transient: Transient31 } = SchemaPersistence;
var { Internal: Internal28 } = SchemaExposure;
var UserRoleSchema = z42.enum(["user", "admin"]).meta({ id: "UserRole", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal28 });
var AuthUserSchema = IdField.merge(TimestampFields).extend({
  name: NameField.meta(Unrestricted34),
  email: z42.string().email().meta(Pii8),
  email_verified: z42.boolean().default(false).meta(Unrestricted34),
  image: z42.string().url().nullable().default(null).meta(Pii8),
  role: UserRoleSchema.default("user").meta(Unrestricted34),
  banned: z42.boolean().default(false).meta({ ...Unrestricted34, readOnly: true }),
  ban_reason: z42.string().nullable().default(null).meta({ ...Unrestricted34, readOnly: true }),
  ban_expires: NullableDatetimeField.meta({ ...Unrestricted34, readOnly: true }),
  two_factor_enabled: z42.boolean().default(false).meta({ ...Unrestricted34, readOnly: true })
}).meta({ id: "AuthUser", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal28 });
var AuthSessionSchema = IdField.merge(TimestampFields).extend({
  expires_at: z42.string().datetime().meta(Unrestricted34),
  token: z42.string().min(1).meta({ ...Pii8, readOnly: true }),
  ip_address: z42.string().nullable().default(null).meta(Pii8),
  user_agent: z42.string().nullable().default(null).meta(Pii8),
  user_id: z42.string().min(1).meta({ ...Unrestricted34, readOnly: true }),
  active_organization_id: z42.string().nullable().default(null).meta(Unrestricted34),
  impersonated_by: z42.string().nullable().default(null).meta({ ...Unrestricted34, readOnly: true })
}).meta({ id: "AuthSession", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal28 });
var AuthAccountSchema = IdField.merge(TimestampFields).extend({
  account_id: z42.string().min(1).meta(Unrestricted34),
  provider_id: z42.string().min(1).meta(Unrestricted34),
  user_id: z42.string().min(1).meta({ ...Unrestricted34, readOnly: true }),
  access_token: z42.string().nullable().default(null).meta({ ...Pii8, readOnly: true }),
  refresh_token: z42.string().nullable().default(null).meta({ ...Pii8, readOnly: true }),
  id_token: z42.string().nullable().default(null).meta({ ...Pii8, readOnly: true }),
  access_token_expires_at: NullableDatetimeField.meta({ ...Unrestricted34, readOnly: true }),
  refresh_token_expires_at: NullableDatetimeField.meta({ ...Unrestricted34, readOnly: true }),
  scope: z42.string().nullable().default(null).meta(Unrestricted34),
  password: z42.string().nullable().default(null).meta({ ...Pii8, readOnly: true })
}).meta({ id: "AuthAccount", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal28 });
var AuthVerificationSchema = IdField.merge(TimestampFields).extend({
  identifier: z42.string().min(1).meta(Pii8),
  value: z42.string().min(1).meta({ ...Pii8, readOnly: true }),
  expires_at: z42.string().datetime().meta(Unrestricted34)
}).meta({ id: "AuthVerification", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal28 });
var AuthTwoFactorSchema = IdField.extend({
  secret: z42.string().min(1).meta({ ...Pii8, readOnly: true }),
  backup_codes: z42.string().min(1).meta({ ...Pii8, readOnly: true }),
  user_id: z42.string().min(1).meta({ ...Unrestricted34, readOnly: true }),
  verified: z42.boolean().default(false).meta({ ...Unrestricted34, readOnly: true })
}).meta({ id: "AuthTwoFactor", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal28 });
var AuthOrganizationSchema = IdField.extend({
  name: NameField.meta(Unrestricted34),
  slug: z42.string().min(1).max(100).nullable().default(null).meta(Unrestricted34),
  logo: z42.string().url().nullable().default(null).meta(Unrestricted34),
  created_at: z42.string().datetime().meta({ ...Unrestricted34, readOnly: true }),
  metadata: z42.string().nullable().default(null).meta(Unrestricted34)
}).meta({ id: "AuthOrganization", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal28 });
var RoleSchema = z42.enum(["viewer", "collaborator", "approver", "admin"]).meta({ id: "Role", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal28 });
var ROLE_RANK = {
  viewer: 0,
  collaborator: 1,
  approver: 2,
  admin: 3
};
var PermissionResourceSchema = z42.enum([
  "tenant",
  "users",
  "plans",
  "entitlements",
  "placements",
  "targeting",
  "content",
  "experiments",
  "billing",
  "audit",
  "mcp",
  "api_tokens",
  "settings"
]).meta({ id: "PermissionResource", "x-revturbine-schema-persistence": Transient31, "x-revturbine-schema-exposure": Internal28 });
var PermissionActionSchema = z42.enum([
  "read",
  "create",
  "update",
  "delete",
  "publish",
  "approve",
  "invite",
  "manage_roles"
]).meta({ id: "PermissionAction", "x-revturbine-schema-persistence": Transient31, "x-revturbine-schema-exposure": Internal28 });
var PermissionSchema = z42.object({
  resource: PermissionResourceSchema,
  action: PermissionActionSchema
}).meta({ id: "Permission", "x-revturbine-schema-persistence": Transient31, "x-revturbine-schema-exposure": Internal28 });
var VIEWER_RESOURCES = [
  "tenant",
  "plans",
  "entitlements",
  "placements",
  "targeting",
  "content",
  "experiments",
  "audit",
  "settings"
];
var COLLAB_WRITABLE = [
  "plans",
  "entitlements",
  "placements",
  "targeting",
  "content",
  "experiments"
];
var APPROVER_PUBLISHABLE = [
  "plans",
  "entitlements",
  "placements",
  "targeting",
  "content",
  "experiments"
];
var ADMIN_FULL = [
  "tenant",
  "users",
  "plans",
  "entitlements",
  "placements",
  "targeting",
  "content",
  "experiments",
  "billing",
  "audit",
  "mcp",
  "api_tokens",
  "settings"
];
var ADMIN_ACTIONS = [
  "read",
  "create",
  "update",
  "delete",
  "publish",
  "approve",
  "invite",
  "manage_roles"
];
function expand(resources, actions) {
  return resources.flatMap((resource) => actions.map((action) => ({ resource, action })));
}
var VIEWER_PERMS = expand(VIEWER_RESOURCES, ["read"]);
var COLLAB_PERMS = [
  ...VIEWER_PERMS,
  ...expand(COLLAB_WRITABLE, ["create", "update"])
];
var APPROVER_PERMS = [
  ...COLLAB_PERMS,
  ...expand(APPROVER_PUBLISHABLE, ["publish", "approve", "delete"])
];
var ADMIN_PERMS = expand(ADMIN_FULL, ADMIN_ACTIONS);
var ROLE_PERMISSIONS = {
  viewer: VIEWER_PERMS,
  collaborator: COLLAB_PERMS,
  approver: APPROVER_PERMS,
  admin: ADMIN_PERMS
};
var SCOPE_VALUES = PermissionResourceSchema.options.flatMap(
  (resource) => PermissionActionSchema.options.map((action) => `${resource}:${action}`)
);
var McpTokenScopeSchema = z42.enum(SCOPE_VALUES).meta({ id: "McpTokenScope", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal28 });
function scopesSubsetOfRole(scopes, role) {
  const granted = ROLE_PERMISSIONS[role];
  return scopes.every((scope) => {
    const [resource, action] = scope.split(":");
    return granted.some((p) => p.resource === resource && p.action === action);
  });
}
var INGEST_WRITE_SCOPE = "ingest:write";
var OrgMemberRoleSchema = RoleSchema;
var AuthMemberSchema = IdField.extend({
  organization_id: z42.string().min(1).meta({ ...Unrestricted34, readOnly: true }),
  user_id: z42.string().min(1).meta({ ...Unrestricted34, readOnly: true }),
  role: RoleSchema.default("viewer").meta(Unrestricted34),
  created_at: z42.string().datetime().meta({ ...Unrestricted34, readOnly: true })
}).meta({ id: "AuthMember", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal28 });
var InvitationStatusSchema = z42.enum(["pending", "accepted", "rejected", "canceled", "expired"]).meta({ id: "InvitationStatus", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal28 });
var AuthInvitationSchema = IdField.extend({
  organization_id: z42.string().min(1).meta({ ...Unrestricted34, readOnly: true }),
  email: z42.string().email().meta(Pii8),
  role: RoleSchema.nullable().default(null).meta(Unrestricted34),
  status: InvitationStatusSchema.default("pending").meta(Unrestricted34),
  expires_at: z42.string().datetime().meta(Unrestricted34),
  created_at: z42.string().datetime().meta({ ...Unrestricted34, readOnly: true }),
  inviter_id: z42.string().min(1).meta({ ...Unrestricted34, readOnly: true })
}).meta({ id: "AuthInvitation", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal28 });
var AuthPasskeySchema = IdField.extend({
  name: z42.string().max(200).nullable().default(null).meta(Unrestricted34),
  public_key: z42.string().min(1).meta({ ...Pii8, readOnly: true }),
  user_id: z42.string().min(1).meta({ ...Unrestricted34, readOnly: true }),
  credential_id: z42.string().min(1).meta({ ...Unrestricted34, readOnly: true }),
  counter: z42.number().int().default(0).meta({ ...Unrestricted34, readOnly: true }),
  device_type: z42.string().min(1).meta(Unrestricted34),
  backed_up: z42.boolean().default(false).meta(Unrestricted34),
  transports: z42.string().nullable().default(null).meta(Unrestricted34),
  created_at: z42.string().datetime().meta({ ...Unrestricted34, readOnly: true }),
  aaguid: z42.string().nullable().default(null).meta(Unrestricted34)
}).meta({ id: "AuthPasskey", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal28 });
var AuthApiKeySchema = IdField.merge(TimestampFields).extend({
  config_id: z42.string().min(1).meta(Unrestricted34),
  name: z42.string().max(200).nullable().default(null).meta(Unrestricted34),
  start: z42.string().nullable().default(null).meta(Unrestricted34),
  reference_id: z42.string().min(1).meta(Unrestricted34),
  prefix: z42.string().nullable().default(null).meta(Unrestricted34),
  key: z42.string().min(1).meta({ ...Pii8, readOnly: true }),
  refill_interval: z42.number().int().nullable().default(null).meta(Unrestricted34),
  refill_amount: z42.number().int().nullable().default(null).meta(Unrestricted34),
  last_refill_at: NullableDatetimeField.meta({ ...Unrestricted34, readOnly: true }),
  enabled: z42.boolean().default(true).meta(Unrestricted34),
  rate_limit_enabled: z42.boolean().default(false).meta(Unrestricted34),
  rate_limit_time_window: z42.number().int().nullable().default(null).meta(Unrestricted34),
  rate_limit_max: z42.number().int().nullable().default(null).meta(Unrestricted34),
  request_count: z42.number().int().default(0).meta({ ...Unrestricted34, readOnly: true }),
  remaining: z42.number().int().nullable().default(null).meta({ ...Unrestricted34, readOnly: true }),
  last_request: NullableDatetimeField.meta({ ...Unrestricted34, readOnly: true }),
  expires_at: NullableDatetimeField.meta(Unrestricted34),
  permissions: z42.string().nullable().default(null).meta(Unrestricted34),
  metadata: z42.string().nullable().default(null).meta(Unrestricted34)
}).meta({ id: "AuthApiKey", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal28 });
var AuthSsoProviderSchema = IdField.extend({
  issuer: z42.string().min(1).meta(Unrestricted34),
  oidc_config: z42.string().nullable().default(null).meta(Unrestricted34),
  saml_config: z42.string().nullable().default(null).meta(Unrestricted34),
  user_id: z42.string().min(1).meta({ ...Unrestricted34, readOnly: true }),
  provider_id: z42.string().min(1).meta(Unrestricted34),
  organization_id: z42.string().nullable().default(null).meta(Unrestricted34),
  domain: z42.string().min(1).meta(Unrestricted34)
}).meta({ id: "AuthSsoProvider", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal28 });
export {
  ACCOUNT_CREATION_PENDING_REASONS,
  ACCOUNT_CREATION_SOURCES,
  ANALYTICS_ANNOTATION_KINDS,
  ANALYTICS_DATE_RANGE_FILTER_VALUE_TYPE,
  ANALYTICS_VALIDATION_CODES,
  ANALYTICS_VIEW_SCHEMA_VERSION,
  AccountPrimaryContactBindingSchema,
  ActivityLevelSchema,
  AddOnSchema,
  AddOnVariationSchema,
  AlertSchema,
  AnalysisProvenanceSchema,
  AnalyticsAgentCatalogEntryKindSchema,
  AnalyticsAgentCatalogEntrySchema,
  AnalyticsAnalyticalUnitSchema,
  AnalyticsAnnotationKindSchema,
  AnalyticsAnnotationMarkerSchema,
  AnalyticsAnnotationRequestSchema,
  AnalyticsAnnotationResponseSchema,
  AnalyticsAnnotationSchema,
  AnalyticsAnnotationSourceSchema,
  AnalyticsBlockErrorSchema,
  AnalyticsBlockResultSchema,
  AnalyticsCardinalityClassSchema,
  AnalyticsCatalogAnnotationKindSchema,
  AnalyticsCatalogConceptSchema,
  AnalyticsCatalogDeprecationSchema,
  AnalyticsCatalogDimensionSchema,
  AnalyticsCatalogMetricSchema,
  AnalyticsCatalogMetricValidatedSchema,
  AnalyticsCatalogProvenanceKindSchema,
  AnalyticsCatalogProvenanceSchema,
  AnalyticsCatalogSchema,
  AnalyticsCatalogSearchResultSchema,
  AnalyticsCatalogSourceSchema,
  AnalyticsClassificationSchema,
  AnalyticsCompareDeltaSchema,
  AnalyticsCompareExperimentSchema,
  AnalyticsCompareModeSchema,
  AnalyticsCompareSegmentSchema,
  AnalyticsCompileResolutionSchema,
  AnalyticsCoverageSchema,
  AnalyticsCustomizationCapabilitySchema,
  AnalyticsCustomizationPolicySchema,
  AnalyticsDimensionCapabilitySchema,
  AnalyticsDimensionTypeSchema,
  AnalyticsFieldTypeSchema,
  AnalyticsFilterControlSchema,
  AnalyticsFilterOperatorSchema,
  AnalyticsFilterStateSchema,
  AnalyticsFilterValueSchema,
  AnalyticsFormatSpecSchema,
  AnalyticsHistoricalModeSchema,
  AnalyticsMetricAggregationSemanticsSchema,
  AnalyticsMetricDirectionSchema,
  AnalyticsMetricStatisticalTypeSchema,
  AnalyticsPeriodCompareModeSchema,
  AnalyticsQueryFamilySchema,
  AnalyticsQueryOverridesSchema,
  AnalyticsQueryRequestSchema,
  AnalyticsQueryResponseSchema,
  AnalyticsRenderCartesianSchema,
  AnalyticsRenderFunnelSchema,
  AnalyticsRenderMetricSchema,
  AnalyticsRenderRecommendationsSchema,
  AnalyticsRenderSpecSchema,
  AnalyticsRenderTableSchema,
  AnalyticsRenderTimelineSchema,
  AnalyticsResultFieldSchema,
  AnalyticsResultMetaSchema,
  AnalyticsResultSchema,
  AnalyticsSafeChartOptionsSchema,
  AnalyticsSavedViewSchema,
  AnalyticsSemanticFilterSchema,
  AnalyticsSemanticIdSchema,
  AnalyticsSourceScopeSchema,
  AnalyticsSuggestedPatchOpSchema,
  AnalyticsTemplateSummarySchema,
  AnalyticsTimeGrainSchema,
  AnalyticsValidationIssueSchema,
  AnalyticsValidationResultSchema,
  AnalyticsViewAccessRoleSchema,
  AnalyticsViewAccessSchema,
  AnalyticsViewBlockDraftSchema,
  AnalyticsViewBlockSchema,
  AnalyticsViewDraftSchema,
  AnalyticsViewFilterDraftSchema,
  AnalyticsViewFilterSchema,
  AnalyticsViewHandoffDraftSchema,
  AnalyticsViewHandoffSchema,
  AnalyticsViewLayoutSchema,
  AnalyticsViewQuerySchema,
  AnalyticsViewRevisionSchema,
  AnalyticsViewSchema,
  AnalyticsViewVisibilitySchema,
  AnalyticsWarningSchema,
  AnchorFields,
  AuditActorTypeSchema,
  AuditEventSchema,
  AuthAccountSchema,
  AuthApiKeySchema,
  AuthInvitationSchema,
  AuthMemberSchema,
  AuthOrganizationSchema,
  AuthPasskeySchema,
  AuthSessionSchema,
  AuthSsoProviderSchema,
  AuthTwoFactorSchema,
  AuthUserSchema,
  AuthVerificationSchema,
  B2BSegmentEventNameSchema,
  B2B_INPUT_SYNONYMS,
  B2B_NON_AUTHORITATIVE_OBSERVATIONS,
  B2B_PENDING_PRODUCERS,
  B2B_PII_PROPERTIES,
  B2B_RT_REQUIRED_PROPERTIES,
  B2B_SEGMENT_EVENT_NAMES,
  B2B_SEMANTIC_MAP_VERSION,
  B2B_SOURCE_MAPPINGS,
  B2B_TRIAL_OUTCOMES,
  BILLING_ACCOUNTING_CONTRACT_VERSION,
  BILLING_COVERAGE_FAMILIES,
  BILLING_ITEM_JOIN_KEYS,
  BILLING_OCCURRENCE_IDENTITY,
  BILLING_OCCURRENCE_IDENTITY_VERSION,
  BILLING_OCCURRENCE_KEY_PREFIX,
  BILLING_OCCURRENCE_RULES,
  BILLING_OUTPUT_KEY_PREFIX,
  BILLING_OUTPUT_KINDS,
  BILLING_PROFILE_KINDS,
  BILLING_PROFILE_NAMES,
  BILLING_PROFILE_VERSION,
  BILLING_UNIQUE_KEYS,
  BUILT_IN_TEMPLATE_COMPONENT_TYPES,
  BillingAccountMappingRevisionSchema,
  BillingAccountingRevisionSchema,
  BillingAllocationSchema,
  BillingBalanceProfileSchema,
  BillingCadenceSchema,
  BillingCompletedGenerationCheckpointSchema,
  BillingCoverageCheckpointSchema,
  BillingCoverageGapRangeSchema,
  BillingCoverageGapReasonSchema,
  BillingCoverageUnavailableReasonSchema,
  BillingCreditNoteLineSchema,
  BillingCreditProfileSchema,
  BillingCreditSettlementSchema,
  BillingEconomicOwnerSchema,
  BillingGenerationCheckpointSchema,
  BillingGenerationSchema,
  BillingHealthStatusSchema,
  BillingInvoicePaymentSourceSchema,
  BillingInvoiceProfileSchema,
  BillingLossProfileSchema,
  BillingOccurrenceSchema,
  BillingOpeningSeedSchema,
  BillingOutputRowKeySchema,
  BillingPriceTermsSchema,
  BillingPriceTierSchema,
  BillingProfileSchema,
  BillingReconciliationSchema,
  BillingRecurrenceSchema,
  BillingRecurringPriceSchema,
  BillingRefundProfileSchema,
  BillingRepeatableOccurrenceSchema,
  BillingScheduleProfileSchema,
  BillingSettlementAmountSchema,
  BillingSourceScopeSchema,
  BillingSubscriptionItemSnapshotSchema,
  BillingSubscriptionProfileSchema,
  BillingTransactionProfileSchema,
  BrandingConfigSchema,
  CONTROL_PLANE_EVENT_NAMES,
  CanonicalAliasEventSchema,
  CanonicalAnalyticsEventSchema,
  CanonicalGroupEventSchema,
  CanonicalIdentifyEventSchema,
  CanonicalPageEventSchema,
  CanonicalScreenEventSchema,
  CanonicalSegmentContextSchema,
  CanonicalTrackEventSchema,
  CapPeriodSchema,
  ChangeLogActionSchema,
  ChangeLogEntrySchema,
  ClientContextSchema,
  ClientSafe,
  CohortMonthSchema,
  ComponentTypeSchema,
  ContentPayloadSegmentEntrySchema,
  ContentPlacementPayloadSchema,
  ContentPromotionSchema,
  ContentUiPathSchema,
  ContextVisibility,
  ControlPlaneEventSourceSchema,
  ControlPlaneEventTypeSchema,
  ControlPlaneSemanticEventSchema,
  CtaActionTypeSchema,
  CtaObjectSchema,
  CtaPathSchema,
  CtaPathTypeSchema,
  CurrencySchema,
  CustomerOverrideDurationSchema,
  CustomerOverrideSchema,
  CustomerOverrideStatusSchema,
  CustomerOverrideTypeSchema,
  CustomerSchema,
  DEFAULT_ANALYTICS_RETENTION_DAYS,
  DEFAULT_TEMPLATE_COMPONENT_TYPES,
  DEPRECATED_EVENT_NAMES,
  DOGFOOD_CLIENT_EVENT_NAMES,
  DataClassification,
  DecisionOnly,
  DefaultTemplateIdsSchema,
  DeleteProtectionDecisionSchema,
  DescriptionField,
  DetectorRequirementsSchema,
  DimensionCategorySchema,
  DimensionSourceTypeSchema,
  DiscountTypeSchema,
  DriftReportSchema,
  ENTITLEMENT_STATUS_VALUES,
  EVENT_ENVELOPE_SCHEMA_VERSION,
  EVENT_PAYLOAD_CONTRACTS,
  EVENT_PAYLOAD_EVENT_NAMES,
  EVENT_PREFIX_FAMILIES,
  EnforcementActionSchema,
  EnforcementModeSchema,
  EntitlementCheckResultSchema,
  EntitlementGrantSchema,
  EntitlementGrantSetSchema,
  EntitlementGrantSourceSchema,
  EntitlementGrantStatusSchema,
  EntitlementRulePeriodUnitSchema,
  EntitlementRuleSchema,
  EntitlementRuleTargetKindSchema,
  EntitlementRuleTargetSchema,
  EntitlementRuleValidatedSchema,
  EntitlementRuleVariantSchema,
  EntitlementSchema,
  EntitlementStatusSchema,
  EntitlementTypeSchema,
  EnvironmentPromotionRequestSchema,
  EnvironmentSchema,
  EnvironmentStatusSchema,
  EventEnvelopeSchema,
  EventIngestBatchSchema,
  EventPrefixFamilySchema,
  EventSearchParamsSchema,
  EventSourceSchema,
  EventStabilitySchema,
  EventSurfaceSchema,
  EventTaxonomyEntrySchema,
  EventTaxonomySchema,
  EvidenceCoverageStateSchema,
  EvidenceReasonColumnSchema,
  EvidenceRequirementSchema,
  ExperimentAnalysisConfigSchema,
  ExperimentAnalysisConfigVersionError,
  ExperimentAnalysisDefinitionSchema,
  ExperimentAnalysisResultRecordSchema,
  ExperimentAnalysisResultSchema,
  ExperimentAssignmentFactSchema,
  ExperimentAssignmentSourceSchema,
  ExperimentDecisionFindingCodeSchema,
  ExperimentDecisionPolicySchema,
  ExperimentDecisionPolicyVersionError,
  ExperimentDecisionRecordSchema,
  ExperimentDecisionTypeSchema,
  ExperimentEvidenceSchema,
  ExperimentEvidenceSnapshotSchema,
  ExperimentHealthSchema,
  ExperimentMetricEvidencePlanSchema,
  ExperimentMetricResultSchema,
  ExperimentSchema,
  ExperimentStatusSchema,
  ExperimentTypeSchema,
  ExperimentVariantSchema,
  ExperimentVariantTargetSchema,
  RevTurbineConfigPlacementItemSchema as ExportedConfigPlacementItemSchema,
  RevTurbineConfigSchema as ExportedConfigSchema,
  RevTurbineConfigSegmentsItemPredicatesItemSchema as ExportedConfigSegmentsItemPredicatesItemSchema,
  RevTurbineConfigSegmentsItemSchema as ExportedConfigSegmentsItemSchema,
  RevTurbineConfigUiPathActionTypeSchema as ExportedConfigUiPathActionTypeSchema,
  FAMILY_RENDER_COMPATIBILITY,
  FIRST_SEGMENT_EVENT_ENVELOPE_SCHEMA_VERSION,
  FIXTURE_ANALYTICS_CATALOG,
  FeatureFlagSchema,
  FeatureFlagValueSchema,
  FeatureGateTriggerPayloadSchema,
  FieldDefinitionSchema,
  FlagValueTypeSchema,
  FreeTrialRuleSchema,
  FreeTrialSettingsSchema,
  FunnelStepSchema,
  GrowthSignalBundleSchema,
  GrowthSignalPointSchema,
  GrowthSignalSeriesSchema,
  HANDLE_PATTERN,
  HandleField,
  INGEST_WRITE_SCOPE,
  INVOICE_RECEIVABLE_TRANSITIONS,
  IdField,
  IdentityKind,
  IdentitySchema,
  IngestedEventSchema,
  InvitationStatusSchema,
  InvoicePaymentStatusSchema,
  InvoiceSettlementBasisSchema,
  InvoiceStatusSchema,
  KpiAggregateSchema,
  LEGACY_BILLING_OCCURRENCE_IDENTITY_VERSION,
  LEGACY_TRACK_EVENT_ENVELOPE_SCHEMA_VERSION,
  LocalizedTextSchema,
  MAX_BILLING_CHECKPOINT_LIST,
  MAX_BILLING_PRICE_TIERS,
  MAX_BILLING_PROFILE_LIST,
  MAX_EVENT_JSON_DEPTH,
  MAX_EVENT_TAGS,
  MAX_EVENT_TAG_LENGTH,
  MAX_SEGMENT_MESSAGES_PER_BATCH,
  MAX_TREATMENT_INTERACTIONS_PER_BATCH,
  MIN_READABLE_EVENT_ENVELOPE_SCHEMA_VERSION,
  McpConfigSchema,
  McpTokenScopeSchema,
  MessageBlockContentSchema,
  MessageBlockRecordSchema,
  MessageBlockSchema,
  MessageSchema,
  MetadataField,
  MeteringConfigSchema,
  NON_RETRYABLE_EVIDENCE_REASONS,
  NameField,
  NullableDatetimeField,
  ObjectiveField,
  ObjectiveSchema,
  ObservationMaturitySchema,
  OnboardingChecklistSchema,
  OnboardingStateSchema,
  OpportunityCandidateSchema,
  OpportunityEvidenceSchema,
  OpportunityInterpretationSchema,
  OptimizationSuggestionSchema,
  OrgMemberRoleSchema,
  PERSISTED_SCHEMA_FACET_EXEMPTIONS,
  PLATFORM_EMITTED_EVENT_NAMES,
  PLATFORM_EVENT_TAXONOMY,
  PLAYBOOK_FORMAT_VERSION,
  PRIMARY_CONTACT_UNRESOLVED_CODE,
  PROTECTED_SUBSCRIPTION_SAMPLE_LIMIT,
  PaginatedResponseSchema,
  PaginationParamsSchema,
  PaymentTriggerPayloadSchema,
  PermissionActionSchema,
  PermissionResourceSchema,
  PermissionSchema,
  PersonalizationTokenSchema,
  PlacementCapRuleSchema,
  PlacementCategorySchema,
  PlacementDecisionOutputSchema,
  PlacementPayloadSchema,
  PlacementPerformanceRowSchema,
  PlacementSchema,
  PlacementSettingsCapRuleGroupItemSchema,
  PlacementSettingsCapRuleSchema,
  PlacementSettingsCapStateSchema,
  PlacementSettingsSchema,
  PlacementTestModeSchema,
  PlacementTestUserIdentifierTypeSchema,
  PlacementTestUserSchema,
  PlacementWarningCodeSchema,
  PlacementWarningSchema,
  PlanSchema,
  PlanVariationSchema,
  PlanVisibilitySchema,
  PlaybookBodySchema,
  PlaybookHeaderSchema,
  PlaybookObjectSchema,
  RevTurbineConfigPlacementItemSchema as PlaybookPlacementItemSchema,
  PlaybookSchema,
  RevTurbineConfigSegmentsItemPredicatesItemSchema as PlaybookSegmentsItemPredicatesItemSchema,
  RevTurbineConfigSegmentsItemSchema as PlaybookSegmentsItemSchema,
  PlaybookStrictSchema,
  RevTurbineConfigUiPathActionTypeSchema as PlaybookUiPathActionTypeSchema,
  PlaybookVersionDeployResultSchema,
  PlaybookVersionDiffSchema,
  PlaybookVersionEntrySummarySchema,
  PlaybookVersionSchema,
  PlaybookVersionStatusSchema,
  PresentationOutcomeSchema,
  PriceSourceSchema,
  PricingModelSchema,
  PrimaryContactDesignationSchema,
  PrimaryContactResolutionSchema,
  PrimaryContactUnresolvedReasonSchema,
  PromotionSchema,
  PromotionStatusSchema,
  ProviderAvailabilitySchema,
  ProviderBindingRefSchema,
  ProviderCapabilitySchema,
  ProviderConnectionSchema,
  ProviderProvenanceSchema,
  ROLE_PERMISSIONS,
  ROLE_RANK,
  RevTurbineConfigAddonVariationsItemSchema,
  RevTurbineConfigAddonsItemSchema,
  RevTurbineConfigEnforcementDefaultsItemSchema,
  RevTurbineConfigEntitlementRulesItemSchema,
  RevTurbineConfigEntitlementsItemSchema,
  RevTurbineConfigMeterBindingsItemSchema,
  RevTurbineConfigObjectivesItemSchema,
  RevTurbineConfigPeriodCapSchema,
  RevTurbineConfigPersonalizationTokensItemSchema,
  RevTurbineConfigPlacementCategorySchema,
  RevTurbineConfigPlacementItemSchema,
  RevTurbineConfigPlacementPayloadItemSchema,
  RevTurbineConfigPlacementSettingsItemSchema,
  RevTurbineConfigPlacementSlotsItemSchema,
  RevTurbineConfigPlacementTriggerSchema,
  RevTurbineConfigPlanVariationsItemSchema,
  RevTurbineConfigPlansItemSchema,
  RevTurbineConfigSchema,
  RevTurbineConfigSeatTypesItemSchema,
  RevTurbineConfigSegmentDimensionsItemSchema,
  RevTurbineConfigSegmentsItemPredicatesItemSchema,
  RevTurbineConfigSegmentsItemSchema,
  RevTurbineConfigSlotConfigsItemSchema,
  RevTurbineConfigStudioCtaConfigSchema,
  RevTurbineConfigStudioPayloadCapsSchema,
  RevTurbineConfigStudioPayloadSchema,
  RevTurbineConfigStudioPayloadSurfaceSchema,
  RevTurbineConfigStudioPayloadTargetSchema,
  RevTurbineConfigSurfaceTemplatesItemFieldsItemSchema,
  RevTurbineConfigSurfaceTemplatesItemSchema,
  RevTurbineConfigUiPathActionTypeSchema,
  RevenueMetricSchema,
  ReverseTrialRuleSchema,
  ReverseTrialSettingsSchema,
  ReverseTrialStartPolicySchema,
  RevturbineB2BTrackEventSchema,
  RevturbineCanonicalEventContextSchema,
  RevturbineEventContextSchema,
  RevturbineIdentitySourceSchema,
  RevturbineProducerAliasEventSchema,
  RevturbineProducerEventContextSchema,
  RevturbineProducerEventSchema,
  RevturbineProducerGroupEventSchema,
  RevturbineProducerIdentifyEventSchema,
  RevturbineProducerPageEventSchema,
  RevturbineProducerScreenEventSchema,
  RevturbineProducerSegmentContextSchema,
  RevturbineProducerTrackEventSchema,
  RoleSchema,
  RuleVisibilitySchema,
  RuntimePromotionSnapshotSchema,
  SDK_AUTOMATIC_NON_EMITTED_NAMES,
  SDK_CLIENT_EVENT_NAMES,
  SDK_META_EVENT_NAMES,
  SDK_SERVER_EVENT_NAMES,
  SEGMENT_EVENT_METHODS,
  SEGMENT_MAX_BATCH_BYTES,
  SEGMENT_MAX_MESSAGE_BYTES,
  SEGMENT_MAX_MESSAGE_ID_LENGTH,
  SEMANTIC_ID_PATTERN,
  STRIPE_SUBSCRIPTION_STATUS_VALUES,
  SUBSCRIPTION_BLOCKER_ENTITY,
  SUBSCRIPTION_EVIDENCE_UNAVAILABLE_CODE,
  SUBSCRIPTION_EVIDENCE_UNAVAILABLE_REASONS,
  SUBSCRIPTION_REFERENCE_EXISTS_CODE,
  SUBSCRIPTION_STATUS_PROTECTION,
  SURFACE_SLOT_ROUTE_MAX_LENGTH,
  SURFACE_SLOT_STATUS_VALUES,
  SchemaContext,
  SchemaExposure,
  SchemaPersistence,
  SchemaSource,
  SdkConfigShapeSchema,
  SdkMetaEventSchema,
  SdkMetaEventTypeSchema,
  SdkMetaIngestBatchSchema,
  SeatTypeSchema,
  SegmentAliasInputSchema,
  SegmentB2BTrackEventSchema,
  SegmentDimensionSchema,
  SegmentEventContextSchema,
  SegmentEventInputSchema,
  SegmentGroupInputSchema,
  SegmentIdentifyInputSchema,
  SegmentIngestBatchSchema,
  SegmentLibraryContextSchema,
  SegmentPageContextSchema,
  SegmentPageInputSchema,
  SegmentSchema,
  SegmentScreenInputSchema,
  SegmentTrackInputSchema,
  SegmentValueSchema,
  SemanticEventSchema,
  ServerEvaluationPayloadDecisionsItemSchema,
  ServerEvaluationPayloadEntitlementsValueSchema,
  ServerEvaluationPayloadSchema,
  ServerEvaluationPayloadTrialStatusSchema,
  ServerEvaluationPayloadUserContextSchema,
  ServerEvaluationPayloadUserSchema,
  ServerOnly,
  SeveritySchema,
  StripeBillingScopeSchema,
  StripeIntegrationConfigSchema,
  StripePriceBillingPeriodSchema,
  StripePriceMockBillingPeriodSchema,
  StripePriceMockSchema,
  StripePriceSchema,
  StripePriceScopeSchema,
  StripeSubscriptionEvidenceSchema,
  StripeSubscriptionItemSchema,
  StripeSubscriptionStatusSchema,
  StudioSurfaceTypeSchema,
  SubscriptionEvidenceKnownSchema,
  SubscriptionEvidenceResultSchema,
  SubscriptionEvidenceUnavailableReasonSchema,
  SubscriptionEvidenceUnavailableSchema,
  SubscriptionProtectionSchema,
  SuggestionSeveritySchema,
  SupersessionReasonSchema,
  SupersessionRecordSchema,
  SurfaceSlotSchema,
  SurfaceSlotStatusSchema,
  SurfaceTemplateSchema,
  SurfaceTypeCapRuleSchema,
  SurfaceTypeSchema,
  TERMINAL_SUBSCRIPTION_STATUSES,
  TRIAL_PENDING_UNKNOWN_REASONS,
  TRIAL_REVISION_KINDS,
  TemplateFieldTypeSchema,
  TenantConfigSchema,
  TenantIdField,
  TenantSchema,
  TenantStatusSchema,
  ThemeSchema,
  TimestampFields,
  TrackEventSchema,
  TrackIngestBatchSchema,
  TreatmentInteractionBatchSchema,
  TreatmentInteractionInputSchema,
  TreatmentInteractionRequestSchema,
  TreatmentInteractionTypeSchema,
  TrendFeaturesSchema,
  TrialEligibilityScopeSchema,
  TrialInstanceSchema,
  TrialLimitPolicySchema,
  TrialStatusSchema,
  TrialTriggerPayloadSchema,
  TriggerEventTypeSchema,
  USER_GRAIN_NON_CREATION_SOURCES,
  UiPreferenceSchema,
  UsageAllocationSchema,
  UsageEnforcementSettingsSchema,
  UsagePeriodScopeSchema,
  UsageTriggerPayloadSchema,
  UserBuiltinDimensionsSchema,
  UserContextSchema,
  UserInstanceContextSchema,
  UserPlanContextSchema,
  UserRoleSchema,
  UserTrialStatusSchema,
  UserUsageEntrySchema,
  VIEW_ELEMENT_ID_PATTERN,
  VariantStatisticalSummarySchema,
  VersionFields,
  WEBHOOK_DERIVED_EVENT_NAMES,
  WarGameCapabilityRequirementsSchema,
  WarGameCategorySchema,
  WarGameGradeSchema,
  WarGameOracleSchema,
  WarGameQualificationLevelSchema,
  WarGameScenarioSchema,
  WebhookDeliverySchema,
  WebhookDispatchStatusSchema,
  WebhookEventLogSchema,
  WebhookEventSourceSchema,
  WebhookEventStatusSchema,
  WebhookProcessingStatusSchema,
  WebhookReplayEnvelopeSchema,
  analyticsPaths,
  analyticsViewPaths,
  applyPrimaryContactEnrichment,
  assertExperimentAnalysisConfigUpdateAllowed,
  assertExperimentDecisionPolicyUpdateAllowed,
  billingAccountingRevisionOf,
  billingEconomicOwnership,
  billingProfileCoverageGaps,
  billingSourceScopeKey,
  boundBillingProfileKinds,
  buildAgentCatalogProjection,
  buildB2BMappingReport,
  canActivateBillingGeneration,
  canonicalB2BEventName,
  changelogPaths,
  classifyAccountCreation,
  classifyInvoiceTransition,
  classifySubscriptionStatus,
  classifyTaxonomyEvent,
  classifyTrackIngestBody,
  classifyTrialRevision,
  collapseBillingRevisions,
  collectPersistedSchemas,
  collectVersionedConfigEntities,
  compareAccountingRevision,
  compileAnalyticsDraft,
  configPaths,
  contentPaths,
  createFixtureAnalyticsCatalog,
  createInMemoryAnalyticsCatalog,
  customerPaths,
  decideDeleteProtection,
  defaultRenderForQuery,
  deriveB2BEvent,
  deriveBillingAllocationKey,
  deriveBillingOccurrenceKey,
  deriveBillingOutputKey,
  deriveBillingRevisionKey,
  entitlementPaths,
  environmentPaths,
  eventPaths,
  experimentPaths,
  filterExternalSchemas,
  filterPersistedSchemas,
  getFieldClassification,
  getFieldVisibility,
  getObjectFieldClassifications,
  getObjectFieldVisibilities,
  getSchemaClassification,
  getSchemaDeprecation,
  getSchemaExposure,
  getSchemaFacets,
  getSchemaIdentity,
  getSchemaPersistence,
  isAnalyticsDateRangeFilterValue,
  isEvidencedAccountCreation,
  isLegacyDateRangeArray,
  isRetryableEvidenceReason,
  isVersionedConfigEntity,
  jsonPlainViolation,
  liftTrackEventToSegmentInput,
  makeAnchor,
  mintedIdentity,
  namedIdentity,
  namespacePlatformCollision,
  normalizeLegacyConfig,
  parsePlaybook,
  placementPaths,
  planPaths,
  playbookVersionPaths,
  projectClientSafe,
  promotionPaths,
  requireSchemaFacets,
  resolveBillingAccountMapping,
  resolveComponentType,
  resolvePrimaryContact,
  resolveSubscriptionEvidence,
  schemaDeprecation,
  schemaFacets,
  scopesSubsetOfRole,
  searchAgentCatalog,
  segmentPaths,
  settingsPaths,
  summarizeInvoicePaymentAllocations,
  summarizeProtectedSubscriptions,
  tenantPaths,
  toCreateSchema,
  toWritableSchema,
  trialPaths,
  uiPreferencePaths,
  unavailableEvidence,
  userContextPaths,
  validateAnalyticsQuery,
  validateAnalyticsView,
  validateB2BTrack,
  validateBillingProfileForEvent,
  validateEventPayload,
  validatePlacementThresholdWarnings
};
