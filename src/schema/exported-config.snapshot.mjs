// GENERATED — do not edit by hand.
// Vendored ExportedConfigSchema snapshot bundled from @revt-eng/schema@0.1.261
// (revturbine-scaffold/src/core/zod/index.ts). Regenerate with:
//   node scripts/generate-schema-snapshot.mjs


// ../scaffold/src/core/common.ts
import { z as z2 } from "zod";

// ../scaffold/src/core/classification.ts
import { z } from "zod";

// ../scaffold/src/core/handle-pattern.ts
var HANDLE_PATTERN = /^[a-z0-9._]{1,100}$/;

// ../scaffold/src/core/classification.ts
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
  const meta6 = schema.meta();
  const persistence = meta6?.[SCHEMA_PERSISTENCE_META_KEY];
  const exposure = meta6?.[SCHEMA_EXPOSURE_META_KEY];
  if ((persistence === SchemaPersistence.Persisted || persistence === SchemaPersistence.Transient) && (exposure === SchemaExposure.Internal || exposure === SchemaExposure.External)) {
    return {
      persistence,
      exposure
    };
  }
  return void 0;
}
function getFieldClassification(schema) {
  const meta6 = schema.meta();
  const classification = meta6?.[DATA_CLASSIFICATION_META_KEY];
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
  const meta6 = schema.meta();
  const exposure = meta6?.[SCHEMA_EXPOSURE_META_KEY];
  if (exposure === SchemaExposure.Internal || exposure === SchemaExposure.External) {
    return exposure;
  }
  return void 0;
}
function getSchemaPersistence(schema) {
  const meta6 = schema.meta();
  const persistence = meta6?.[SCHEMA_PERSISTENCE_META_KEY];
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
  const meta6 = schema.meta() ?? {};
  if (meta6[DECISION_ONLY_META_KEY] === true) {
    return ContextVisibility.DecisionOnly;
  }
  const dataClass = meta6[DATA_CLASSIFICATION_META_KEY];
  if (dataClass === "pii" || dataClass === "financial") {
    return ContextVisibility.ServerOnly;
  }
  if (meta6[SCHEMA_EXPOSURE_META_KEY] === SchemaExposure.External) {
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

// ../scaffold/src/core/common.ts
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
var CurrencySchema = z2.enum(["usd", "eur", "gbp"]).default("usd").meta(
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

// ../scaffold/src/core/facets.ts
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
  const meta6 = schema.meta();
  const context = meta6?.[SCHEMA_CONTEXT_META_KEY];
  const inConfig = meta6?.[SCHEMA_IN_CONFIG_META_KEY];
  const sdkInput = meta6?.[SCHEMA_SDK_INPUT_META_KEY];
  const source = meta6?.[SCHEMA_SOURCE_META_KEY];
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
  const meta6 = schema.meta();
  if (meta6?.deprecated !== true) return void 0;
  const value = meta6[SCHEMA_DEPRECATION_META_KEY];
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
  const persisted = {};
  for (const [name, value] of Object.entries(allExports)) {
    if (isZodSchema(value) && value.meta()?.["x-revturbine-schema-persistence"] === "persisted") {
      persisted[name] = value;
    }
  }
  return persisted;
}
var PERSISTED_SCHEMA_FACET_EXEMPTIONS = {
  AlertSchema: "Operational analytics output is not authored portable configuration.",
  ApiKeySchema: "Tenant credential infrastructure is not authored portable configuration.",
  ApiKeyStatusSchema: "Tenant credential lifecycle state is not authored portable configuration.",
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

// ../scaffold/src/core/identity.ts
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

// ../scaffold/src/plans/models/schema.ts
import { z as z5 } from "zod";

// ../scaffold/src/core/openapi/helpers.ts
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

// ../scaffold/src/plans/models/schema.ts
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

// ../scaffold/src/entitlements/models/schema.ts
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

// ../scaffold/src/placements/models/schema.ts
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
var SurfaceSlotSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  surface_slot_handle: z7.string().min(1).max(200).meta(Unrestricted4),
  surface_type: SurfaceTypeSchema.meta(Unrestricted4),
  surface_template_ids: z7.array(z7.string()).default([]).meta(Unrestricted4),
  surface_slot_category: z7.enum(["fixed", "gated", "triggered"]).default("fixed").meta(Unrestricted4),
  first_seen: z7.string().datetime().meta({ ...Unrestricted4, readOnly: true }),
  last_seen: z7.string().datetime().meta({ ...Unrestricted4, readOnly: true }),
  status: z7.enum(["active", "inactive", "new"]).default("new").meta(Unrestricted4),
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

// ../scaffold/src/user/models/schema.ts
import { z as z9 } from "zod";

// ../scaffold/src/customers/models/schema.ts
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

// ../scaffold/src/user/models/schema.ts
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
   * Transient personalization token map.
   *
   * Holds SDK-derived tokens (plan_name, usage_current, etc.) merged with
   * app-provided tokens.  Not persisted to the backend — rebuilt on each
   * SDK session from context + exported config.
   */
  personalization: z9.record(z9.string(), z9.union([z9.string(), z9.number()])).default({}).meta({ ...Unrestricted6, "x-revturbine-schema-persistence": Transient6 }),
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
var ClientContextSchema = z9.object({
  /** The end-user subject the client token was minted for (carried by the token, not the request). */
  subject: z9.string().min(1).meta({ ...Unrestricted6, ...ClientSafe }),
  /** Opaque version stamp of the underlying context snapshot. */
  context_version: z9.string().optional().meta({ ...Unrestricted6, ...ClientSafe }),
  trial: ClientContextTrialSchema.optional().meta({ ...Unrestricted6, ...ClientSafe }),
  billing: ClientContextBillingSchema.optional().meta({ ...Unrestricted6, ...ClientSafe }),
  plan: ClientContextPlanSchema.optional().meta({ ...Unrestricted6, ...ClientSafe }),
  capabilities: ClientContextCapabilitiesSchema.optional().meta({ ...Unrestricted6, ...ClientSafe })
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

// ../scaffold/src/segments/models/schema.ts
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
  /** @deprecated Read-only compatibility alias for `experiment_handle`. */
  experiment_id: z10.string().min(1).optional().meta(Unrestricted7),
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

// ../scaffold/src/content/models/schema.ts
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

// ../scaffold/src/ui/models/schema.ts
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

// ../scaffold/src/analytics/models/schema.ts
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

// ../scaffold/src/analytics/models/view-schema.ts
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
var AnalyticsCompareModeSchema = z14.enum(["none", "previous_period", "previous_year"]).meta(meta("AnalyticsCompareMode"));
var AnalyticsFilterOperatorSchema = z14.enum(["eq", "neq", "in", "not_in", "between", "gte", "lte", "is_null", "is_not_null", "contains"]).meta(meta("AnalyticsFilterOperator"));
var AnalyticsFilterControlSchema = z14.enum(["date_range", "single_select", "multi_select", "search_select", "number_range"]).meta(meta("AnalyticsFilterControl"));
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
  "raw_expression"
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
    compare: AnalyticsCompareModeSchema.optional().meta(Unrestricted11)
  }),
  z14.strictObject({
    min: z14.number().optional().meta(Unrestricted11),
    max: z14.number().optional().meta(Unrestricted11)
  })
]).meta(meta("AnalyticsFilterValue"));
var AnalyticsSemanticFilterSchema = z14.strictObject({
  dimension: SemanticIdField.meta(Unrestricted11),
  operator: AnalyticsFilterOperatorSchema.meta(Unrestricted11),
  value: AnalyticsFilterValueSchema.optional().meta(Unrestricted11)
}).meta(meta("AnalyticsSemanticFilter"));
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
  deprecation: CatalogDeprecation.optional().meta(Unrestricted11)
}).meta(meta("AnalyticsCatalogMetric"));
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
  deprecation: CatalogDeprecation.optional().meta(Unrestricted11)
}).meta(meta("AnalyticsCatalogConcept"));
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
  applies_to: z14.union([z14.literal("all"), z14.array(ElementIdField).min(1).max(24)]).default("all").meta(Unrestricted11)
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

// ../scaffold/src/analytics/models/saved-view-schema.ts
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

// ../scaffold/src/analytics/models/catalog-schema.ts
import { z as z16 } from "zod";
var { Unrestricted: Unrestricted13 } = DataClassification;
var { Transient: Transient13 } = SchemaPersistence;
var { Internal: Internal11 } = SchemaExposure;
var meta2 = (id) => ({
  id,
  "x-revturbine-schema-persistence": Transient13,
  "x-revturbine-schema-exposure": Internal11
});
var AnalyticsCatalogSourceSchema = z16.enum(["fixture", "generated"]).meta(meta2("AnalyticsCatalogSource"));
var AnalyticsCatalogProvenanceKindSchema = z16.enum(["event_taxonomy", "openapi_identity", "tinybird_project"]).meta(meta2("AnalyticsCatalogProvenanceKind"));
var AnalyticsCatalogProvenanceSchema = z16.object({
  kind: AnalyticsCatalogProvenanceKindSchema.meta(Unrestricted13),
  location: z16.string().min(1).max(240).meta(Unrestricted13),
  version: z16.string().min(1).max(64).optional().meta(Unrestricted13),
  entry_count: z16.number().int().nonnegative().meta(Unrestricted13)
}).meta(meta2("AnalyticsCatalogProvenance"));
var AnalyticsCatalogSchema = z16.object({
  catalog_version: z16.string().min(1).max(64).meta(Unrestricted13),
  source: AnalyticsCatalogSourceSchema.meta(Unrestricted13),
  generated_at: z16.string().datetime().optional().meta(Unrestricted13),
  provenance: z16.array(AnalyticsCatalogProvenanceSchema).optional().meta(Unrestricted13),
  concepts: z16.array(AnalyticsCatalogConceptSchema).min(1).meta(Unrestricted13),
  dimensions: z16.array(AnalyticsCatalogDimensionSchema).min(1).meta(Unrestricted13),
  metrics: z16.array(AnalyticsCatalogMetricSchema).min(1).meta(Unrestricted13)
}).meta(meta2("AnalyticsCatalog"));
var AnalyticsAgentCatalogEntryKindSchema = z16.enum(["concept", "dimension", "metric", "query_family"]).meta(meta2("AnalyticsAgentCatalogEntryKind"));
var AnalyticsAgentCatalogEntrySchema = z16.object({
  id: AnalyticsSemanticIdSchema.meta(Unrestricted13),
  kind: AnalyticsAgentCatalogEntryKindSchema.meta(Unrestricted13),
  label: z16.string().min(1).max(120).meta(Unrestricted13),
  description: z16.string().min(1).max(500).meta(Unrestricted13),
  when_to_use: z16.string().max(500).optional().meta(Unrestricted13),
  do_not_use_for: z16.string().max(500).optional().meta(Unrestricted13),
  value_type: AnalyticsFieldTypeSchema.optional().meta(Unrestricted13),
  format: AnalyticsFormatSpecSchema.optional().meta(Unrestricted13),
  capabilities: z16.array(AnalyticsDimensionCapabilitySchema).optional().meta(Unrestricted13),
  compatible_concepts: z16.array(AnalyticsSemanticIdSchema).optional().meta(Unrestricted13),
  compatible_families: z16.array(AnalyticsQueryFamilySchema).optional().meta(Unrestricted13),
  analytical_units: z16.array(AnalyticsAnalyticalUnitSchema).optional().meta(Unrestricted13),
  source_scope: AnalyticsSourceScopeSchema.optional().meta(Unrestricted13),
  example: z16.string().max(2e3).optional().meta(Unrestricted13),
  deprecation: AnalyticsCatalogDeprecationSchema.optional().meta(Unrestricted13)
}).meta(meta2("AnalyticsAgentCatalogEntry"));
var AnalyticsCatalogSearchResultSchema = z16.object({
  catalog_version: z16.string().min(1).max(64).meta(Unrestricted13),
  query: z16.string().min(1).max(200).meta(Unrestricted13),
  entries: z16.array(AnalyticsAgentCatalogEntrySchema).max(50).meta(Unrestricted13)
}).meta(meta2("AnalyticsCatalogSearchResult"));

// ../scaffold/src/analytics/catalog/in-memory.ts
var byId = (items) => [...items].sort((a, b) => a.id.localeCompare(b.id, "en"));
function createInMemoryAnalyticsCatalog(data) {
  const catalog = AnalyticsCatalogSchema.parse(data);
  const problems = [];
  if (catalog.source === "generated") {
    const provenanceKinds = new Set(catalog.provenance?.map((entry) => entry.kind) ?? []);
    for (const kind of ["event_taxonomy", "openapi_identity", "tinybird_project"]) {
      if (!provenanceKinds.has(kind)) problems.push(`generated catalog is missing ${kind} provenance`);
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
  }
  if (problems.length > 0) {
    throw new Error(`analytics catalog integrity check failed:
- ${[...problems].sort().join("\n- ")}`);
  }
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
    metricsFor: (conceptId) => (concepts.get(conceptId)?.metrics ?? []).flatMap((id) => metrics.get(id) ?? [])
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

// ../scaffold/src/analytics/catalog/fixture.ts
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
  catalog_version: "fixture-11",
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
    { id: "acquisition.signup_count", label: "Signups", value_type: "number", source_scope: "total" },
    { id: "activation.rate", label: "Activation rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total" },
    { id: "activation.time_to_value_seconds", label: "Time to value", value_type: "number", format: { type: "duration" }, source_scope: "total" },
    { id: "retention.d7_rate", label: "D7 retention rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total" },
    { id: "funnel.entry_count", label: "Funnel step entries", value_type: "number", source_scope: "total" },
    { id: "funnel.completion_rate", label: "Funnel step completion rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total" },
    { id: "funnel.elapsed_seconds", label: "Funnel step elapsed time", value_type: "number", format: { type: "duration" }, source_scope: "total" },
    { id: "funnel.error_rate", label: "Funnel step error rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total" },
    { id: "trial.start_count", label: "Trial starts", value_type: "number", source_scope: "total" },
    { id: "trial.conversion_rate", label: "Trial-to-paid conversion rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total" },
    { id: "trial.activation_rate", label: "Trial activation rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total" },
    { id: "reactivation.previously_healthy_account_count", label: "Previously healthy accounts", value_type: "number", source_scope: "total" },
    { id: "reactivation.inactive_previously_healthy_rate", label: "Inactive previously healthy rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total" },
    { id: "reactivation.reactivated_rate", label: "Reactivated account rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total" },
    { id: "entitlement.granted_account_count", label: "Granted accounts", value_type: "number", source_scope: "total" },
    { id: "entitlement.adoption_rate", label: "Entitlement adoption rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total" },
    { id: "entitlement.adopter_retention_lift", label: "Adopter retention lift", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total" },
    { id: "entitlement.denied_account_count", label: "Denied accounts", value_type: "number", source_scope: "revturbine_tracked" },
    { id: "entitlement.denied_attempts_per_account", label: "Denied attempts per account", value_type: "number", source_scope: "revturbine_tracked" },
    { id: "entitlement.denied_upgrade_conversion_rate", label: "Denied-account upgrade conversion rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "revturbine_influenced" },
    { id: "usage.metered_per_account", label: "Metered usage per account", value_type: "number", source_scope: "total" },
    { id: "usage.expansion_mrr_per_unit", label: "Expansion MRR per usage unit", value_type: "currency", source_scope: "total" },
    { id: "revenue.expansion_mrr", label: "Expansion MRR", value_type: "currency", source_scope: "total" },
    { id: "usage.projected_bill_to_historical_ratio", label: "Projected bill to historical ratio", value_type: "number", source_scope: "total" },
    { id: "usage.acceleration_rate", label: "Usage acceleration rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total" },
    { id: "usage.alert_coverage_rate", label: "Usage alert coverage rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total" },
    { id: "usage.utilization_rate", label: "Usage utilization rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total" },
    { id: "usage.growth_rate", label: "Usage growth rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total" },
    { id: "pricing.entry_tier_account_share", label: "Entry-tier account share", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total" },
    { id: "pricing.self_serve_upgrade_rate", label: "Self-serve upgrade rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total" },
    { id: "pricing.plan_churn_rate", label: "Plan churn rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total" },
    { id: "promotion.discount_use_rate", label: "Promotion discount use rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "revturbine_tracked" },
    { id: "promotion.full_price_conversion_rate", label: "Full-price conversion rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total" },
    { id: "promotion.net_revenue_lift_rate", label: "Promotion net revenue lift", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "revturbine_influenced" },
    { id: "retention.active_users_per_account", label: "Active users per account", value_type: "number", source_scope: "total" },
    { id: "retention.core_action_frequency", label: "Core action frequency", value_type: "number", source_scope: "total" },
    { id: "retention.active_days_rate", label: "Active days rate", value_type: "percent", format: { type: "percent", decimals: 1 }, source_scope: "total" },
    { id: "decision.eligible_accounts", label: "Eligible accounts", value_type: "number" },
    { id: "decision.reached_accounts", label: "Reached accounts", value_type: "number" },
    { id: "placement.presented_accounts", label: "Presented accounts", value_type: "number" },
    { id: "conversion.paid_accounts", label: "Converted accounts", value_type: "number" },
    {
      id: "conversion.rate",
      label: "Conversion rate",
      when_to_use: "Converted over eligible accounts under the attribution window.",
      value_type: "percent",
      format: { type: "percent", decimals: 1 },
      source_scope: "revturbine_tracked"
    },
    { id: "revenue.attributed_mrr", label: "Attributed MRR", value_type: "currency", source_scope: "revturbine_influenced" },
    { id: "retention.retained_mrr_30d", label: "Retained MRR (30d)", value_type: "currency" },
    {
      id: "revenue.mrr",
      label: "MRR",
      do_not_use_for: "Environment-scoped cuts \u2014 billing facts are tenant-global.",
      value_type: "currency",
      source_scope: "total"
    },
    { id: "revenue.net_new_mrr", label: "Net new MRR", value_type: "currency", source_scope: "total" },
    { id: "placement.impressions", label: "Impressions", value_type: "number" },
    { id: "placement.clicks", label: "Clicks", value_type: "number" },
    { id: "placement.conversions", label: "Conversions", value_type: "number" },
    { id: "conversion.paid_count", label: "Paid conversions", value_type: "number", when_to_use: "Billing-fact conversion events (subscription created), not distinct accounts." },
    { id: "placement.ctr", label: "Click-through rate", value_type: "percent", format: { type: "percent", decimals: 1 } },
    { id: "placement.presentations_per_account", label: "Presentations per account", value_type: "number", source_scope: "revturbine_tracked" },
    { id: "event.count", label: "Event count", value_type: "number" },
    {
      id: "placement.last_presented_at",
      label: "Last presented",
      when_to_use: "Recency over ALL retained history \u2014 drives the payload Runtime Status derivation.",
      value_type: "datetime"
    },
    {
      id: "revenue.attributed_amount",
      label: "Attributed amount",
      when_to_use: "Per-conversion attributed revenue (last-touch, 1h window).",
      value_type: "currency",
      source_scope: "revturbine_influenced"
    },
    {
      id: "experiment.absolute_effect",
      label: "Absolute effect",
      description: "Absolute treatment effect exactly as persisted by the experiment analysis engine. Its unit is determined by experiment.metric; it is never assumed to be currency.",
      when_to_use: "Only with a validated immutable experiment result and its recorded metric, methodology, window, and uncertainty.",
      do_not_use_for: "Descriptive attribution, recomputed estimates, or missing/invalid experiment evidence.",
      value_type: "number",
      source_scope: "revturbine_influenced"
    },
    { id: "coverage.matched_paid_accounts", label: "Matched paid accounts", value_type: "number" },
    {
      id: "opportunity.candidate_count",
      label: "Opportunity candidates",
      description: "Count of current persisted detector candidates; reading it never reruns a detector.",
      value_type: "number",
      source_scope: "revturbine_tracked"
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
      metrics: [
        "acquisition.signup_count",
        "activation.rate",
        "activation.time_to_value_seconds",
        "retention.d7_rate"
      ],
      query_families: ["scalar", "timeseries", "breakdown", "table"],
      source_scope: "total"
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
      metrics: [
        "funnel.entry_count",
        "funnel.completion_rate",
        "funnel.elapsed_seconds",
        "funnel.error_rate"
      ],
      query_families: ["scalar", "timeseries", "breakdown", "funnel", "table"],
      source_scope: "total"
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
      metrics: ["trial.start_count", "trial.activation_rate", "trial.conversion_rate"],
      query_families: ["scalar", "timeseries", "breakdown", "funnel", "table"],
      source_scope: "total"
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
      metrics: [
        "reactivation.previously_healthy_account_count",
        "reactivation.inactive_previously_healthy_rate",
        "reactivation.reactivated_rate"
      ],
      query_families: ["scalar", "timeseries", "breakdown", "table"],
      source_scope: "total"
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
      dimensions: ["time.occurred_at", "entitlement.entitlement", "commercial.plan", "targeting.segment"],
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
      source_scope: "total"
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
      source_scope: "total"
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
      coverage_metric: "coverage.matched_paid_accounts"
    },
    {
      id: "revenue.movement",
      version: 1,
      label: "Revenue movement",
      description: "MRR levels and movement from billing facts. Billing facts carry no environment scope, so this concept is tenant-global.",
      do_not_use_for: "Per-environment revenue cuts.",
      grain: ["tenant", "day"],
      analytical_units: ["account"],
      primary_time_dimension: "time.occurred_at",
      historical_mode: "current",
      dimensions: ["time.occurred_at", "commercial.plan", "commercial.billing_period", "revenue.currency"],
      metrics: ["revenue.mrr", "revenue.net_new_mrr", "revenue.attributed_mrr", "conversion.paid_count"],
      query_families: ["scalar", "timeseries", "breakdown"],
      source_scope: "total"
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
        "release.playbook_version"
      ],
      metrics: [
        "placement.impressions",
        "placement.clicks",
        "placement.ctr",
        "placement.presentations_per_account",
        "placement.conversions",
        "conversion.rate",
        "revenue.attributed_mrr",
        "placement.last_presented_at"
      ],
      query_families: ["scalar", "timeseries", "breakdown", "table"],
      source_scope: "revturbine_tracked",
      coverage_metric: "coverage.matched_paid_accounts"
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
      metrics: ["revenue.attributed_amount"],
      query_families: ["table"],
      source_scope: "revturbine_influenced"
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
      metrics: ["experiment.absolute_effect"],
      query_families: ["table"],
      source_scope: "revturbine_influenced"
    },
    {
      id: "customer.timeline",
      version: 1,
      label: "Customer timeline",
      description: "Ordered fact events for a scoped population.",
      when_to_use: "What happened to an account or cohort, in order.",
      grain: ["tenant", "environment", "account", "event"],
      analytical_units: ["account", "user"],
      primary_time_dimension: "time.occurred_at",
      historical_mode: "as_of_event",
      dimensions: ["time.occurred_at", "customer.account", "customer.user", "event.type", "commercial.plan", "targeting.segment"],
      metrics: ["event.count"],
      query_families: ["timeline", "table"],
      source_scope: "revturbine_tracked"
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
      metrics: ["opportunity.candidate_count"],
      query_families: ["table"],
      source_scope: "revturbine_tracked"
    }
  ]
};
function createFixtureAnalyticsCatalog() {
  return createInMemoryAnalyticsCatalog(FIXTURE_ANALYTICS_CATALOG);
}

// ../scaffold/src/analytics/compile/defaults.ts
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

// ../scaffold/src/analytics/validation/semantic.ts
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
  "TEMPLATE_LOCKED_PROPERTY_CHANGED"
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
  const requireField = (field, path) => {
    if (!fields.has(field)) {
      issues.push(issue(
        "RENDER_FIELD_NOT_IN_QUERY",
        path,
        `Field ${field} is not produced by this block's query.`,
        {
          actual: field,
          allowed: [...fields].sort()
        }
      ));
    }
  };
  const requireConceptDimension = (field, path) => {
    if (!catalog.getDimension(field)) {
      issues.push(issue(
        "UNKNOWN_DIMENSION",
        path,
        `Dimension ${field} is not in the catalog.`,
        { actual: field }
      ));
    } else if (!concept.dimensions.includes(field)) {
      issues.push(issue(
        "DIMENSION_NOT_IN_CONCEPT",
        path,
        `Dimension ${field} is not available on concept ${concept.id}.`,
        {
          actual: field,
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
function validateTemplateLocks(view, base, policy) {
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
  const baseBlocks = new Map(base.blocks.map((b) => [b.id, b]));
  for (const capability of policy.deny) {
    switch (capability) {
      case "title":
        locked(capability, "/title", !same(view.title, base.title));
        break;
      case "layout":
        locked(capability, "/layout", !same(view.layout, base.layout));
        break;
      case "filter_defaults":
        locked(capability, "/filters", !same(
          view.filters.map((f) => ({ id: f.id, default_value: f.default_value })),
          base.filters.map((f) => ({ id: f.id, default_value: f.default_value }))
        ));
        break;
      case "metric_selection":
        locked(capability, "/blocks", !same(
          view.blocks.map((b) => ({ id: b.id, metrics: b.query.metrics })),
          base.blocks.map((b) => ({ id: b.id, metrics: b.query.metrics }))
        ));
        break;
      case "grouping":
        locked(capability, "/blocks", !same(
          view.blocks.map((b) => ({ id: b.id, group_by: b.query.group_by ?? [] })),
          base.blocks.map((b) => ({ id: b.id, group_by: b.query.group_by ?? [] }))
        ));
        break;
      case "compatible_renderer":
        locked(capability, "/blocks", !same(
          view.blocks.map((b) => ({ id: b.id, render: b.render })),
          base.blocks.map((b) => ({ id: b.id, render: b.render }))
        ));
        break;
      case "sort":
        locked(capability, "/blocks", !same(
          view.blocks.map((b) => ({ id: b.id, order_by: b.query.order_by ?? [] })),
          base.blocks.map((b) => ({ id: b.id, order_by: b.query.order_by ?? [] }))
        ));
        break;
      case "limit":
        locked(capability, "/blocks", !same(
          view.blocks.map((b) => ({ id: b.id, limit: b.query.limit ?? null })),
          base.blocks.map((b) => ({ id: b.id, limit: b.query.limit ?? null }))
        ));
        break;
      case "block_visibility":
        locked(capability, "/blocks", !same(
          view.blocks.map((b) => b.id),
          base.blocks.map((b) => b.id)
        ));
        break;
      case "handoff_target":
        locked(capability, "/handoffs", !same(view.handoffs ?? [], base.handoffs ?? []));
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

// ../scaffold/src/analytics/compile/compile.ts
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
function uniqueId(base, used) {
  let candidate = base;
  let n = 2;
  while (used.has(candidate)) candidate = `${base}-${n++}`;
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

// ../scaffold/src/analytics/models/api-schema.ts
import { z as z17 } from "zod";
var { Unrestricted: Unrestricted14 } = DataClassification;
var { Transient: Transient14 } = SchemaPersistence;
var { Internal: Internal12 } = SchemaExposure;
var meta3 = (id) => ({
  id,
  "x-revturbine-schema-persistence": Transient14,
  "x-revturbine-schema-exposure": Internal12
});
var ElementIdField2 = z17.string().regex(VIEW_ELEMENT_ID_PATTERN);
var AnalyticsFilterStateSchema = z17.strictObject({
  filter_id: ElementIdField2.meta(Unrestricted14),
  value: AnalyticsFilterValueSchema.nullable().meta(Unrestricted14)
}).meta(meta3("AnalyticsFilterState"));
var AnalyticsQueryRequestSchema = z17.strictObject({
  view_id: ElementIdField2.meta(Unrestricted14),
  revision: z17.number().int().min(1).optional().meta(Unrestricted14),
  block_ids: z17.array(ElementIdField2).min(1).max(24).optional().meta(Unrestricted14),
  filter_state: z17.array(AnalyticsFilterStateSchema).max(20).optional().meta(Unrestricted14)
}).meta(meta3("AnalyticsQueryRequest"));
var AnalyticsBlockErrorSchema = z17.object({
  block_id: ElementIdField2.meta(Unrestricted14),
  code: z17.string().regex(/^[A-Z][A-Z0-9_]{2,79}$/).meta(Unrestricted14),
  message: z17.string().min(1).max(500).meta(Unrestricted14)
}).meta(meta3("AnalyticsBlockError"));
var AnalyticsBlockResultSchema = z17.object({
  block_id: ElementIdField2.meta(Unrestricted14),
  result: AnalyticsResultSchema.meta(Unrestricted14)
}).meta(meta3("AnalyticsBlockResult"));
var AnalyticsQueryResponseSchema = z17.object({
  view_id: ElementIdField2.meta(Unrestricted14),
  revision: z17.number().int().min(1).meta(Unrestricted14),
  catalog_version: z17.string().min(1).max(64).meta(Unrestricted14),
  results: z17.array(AnalyticsBlockResultSchema).meta(Unrestricted14),
  errors: z17.array(AnalyticsBlockErrorSchema).default([]).meta(Unrestricted14)
}).meta(meta3("AnalyticsQueryResponse"));
var AnalyticsTemplateSummarySchema = z17.object({
  id: ElementIdField2.meta(Unrestricted14),
  version: z17.number().int().min(1).meta(Unrestricted14),
  title: LocalizedTextSchema.meta(Unrestricted14),
  description: LocalizedTextSchema.optional().meta(Unrestricted14),
  block_count: z17.number().int().min(1).meta(Unrestricted14)
}).meta(meta3("AnalyticsTemplateSummary"));
var CatalogSearchQuerySchema = z17.object({
  q: z17.string().min(1).max(200),
  limit: z17.coerce.number().int().min(1).max(50).optional()
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
      requestParams: { path: z17.object({ viewId: z17.string() }) },
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
  }
};

// ../scaffold/src/analytics/models/optimization-schema.ts
import { z as z19 } from "zod";

// ../scaffold/src/core/providers/schema.ts
import { z as z18 } from "zod";
var { Unrestricted: Unrestricted15 } = DataClassification;
var { Transient: Transient15 } = SchemaPersistence;
var { Internal: Internal13 } = SchemaExposure;
var meta4 = (id) => ({
  id,
  "x-revturbine-schema-persistence": Transient15,
  "x-revturbine-schema-exposure": Internal13
});
var ProviderCapabilitySchema = z18.enum([
  "analytics_execution",
  "experiment_assignment",
  "experiment_evidence",
  "experiment_analysis",
  "growth_signal",
  "growth_benchmark",
  "optimization"
]).meta(meta4("ProviderCapability"));
var ProviderAvailabilitySchema = z18.enum(["available", "stale", "unavailable", "unsupported", "partial"]).meta(meta4("ProviderAvailability"));
var ProviderProvenanceSchema = z18.object({
  /** Stable handle of the provider that produced this output. */
  provider_handle: HandleField.meta(Unrestricted15),
  /** Implementation family, e.g. `native_tinybird`, `growthbook`. */
  provider_type: z18.string().min(1).max(100).meta(Unrestricted15),
  /** Version of the provider implementation itself. */
  provider_version: z18.string().min(1).max(100).meta(Unrestricted15),
  /** Version of the provider *contract* this output conforms to. */
  contract_version: z18.number().int().min(1).meta(Unrestricted15),
  /** When the output was produced. */
  generated_at: z18.string().datetime().meta(Unrestricted15),
  /** How current the underlying data is, where the source exposes it. */
  data_watermark: z18.string().datetime().optional().meta(Unrestricted15),
  /** Revision of the source artifact, where the source is versioned. */
  source_revision: z18.string().min(1).max(200).optional().meta(Unrestricted15)
}).meta(meta4("ProviderProvenance"));
var ProviderBindingRefSchema = z18.object({
  /** Resolves to a server-only `ProviderConnection`. */
  provider_handle: HandleField.meta(Unrestricted15),
  /** Which capability this binding fills. */
  capability: ProviderCapabilitySchema.meta(Unrestricted15)
}).meta(meta4("ProviderBindingRef"));

// ../scaffold/src/analytics/models/optimization-schema.ts
var { Unrestricted: Unrestricted16 } = DataClassification;
var { Transient: Transient16 } = SchemaPersistence;
var { Internal: Internal14 } = SchemaExposure;
var meta5 = (id) => ({
  id,
  "x-revturbine-schema-persistence": Transient16,
  "x-revturbine-schema-exposure": Internal14
});
var GrowthSignalPointSchema = z19.object({
  start: z19.string().datetime().meta(Unrestricted16),
  end: z19.string().datetime().meta(Unrestricted16),
  value: z19.number().meta(Unrestricted16),
  numerator: z19.number().optional().meta(Unrestricted16),
  denominator: z19.number().optional().meta(Unrestricted16),
  sample_size: z19.number().int().min(0).optional().meta(Unrestricted16)
}).meta(meta5("GrowthSignalPoint"));
var GrowthSignalSeriesSchema = z19.object({
  metric: AnalyticsSemanticIdSchema.meta(Unrestricted16),
  analytical_unit: AnalyticsAnalyticalUnitSchema.meta(Unrestricted16),
  source_scope: AnalyticsSourceScopeSchema.meta(Unrestricted16),
  dimensions: z19.record(AnalyticsSemanticIdSchema, z19.string()).meta(Unrestricted16),
  points: z19.array(GrowthSignalPointSchema).meta(Unrestricted16),
  provenance: ProviderProvenanceSchema.meta(Unrestricted16)
}).meta(meta5("GrowthSignalSeries"));
var GrowthSignalBundleSchema = z19.object({
  availability: ProviderAvailabilitySchema.meta(Unrestricted16),
  series: z19.array(GrowthSignalSeriesSchema).meta(Unrestricted16),
  provenance: ProviderProvenanceSchema.meta(Unrestricted16)
}).meta(meta5("GrowthSignalBundle"));
var TrendFeaturesSchema = z19.object({
  current: z19.number().meta(Unrestricted16),
  baseline: z19.number().meta(Unrestricted16),
  absolute_delta: z19.number().meta(Unrestricted16),
  relative_delta: z19.number().meta(Unrestricted16),
  short_window: z19.number().meta(Unrestricted16),
  long_window: z19.number().meta(Unrestricted16),
  slope: z19.number().meta(Unrestricted16),
  acceleration: z19.number().meta(Unrestricted16),
  volatility: z19.number().meta(Unrestricted16),
  persistence: z19.number().meta(Unrestricted16),
  seasonal_expected: z19.number().optional().meta(Unrestricted16),
  seasonal_deviation: z19.number().optional().meta(Unrestricted16),
  peer_value: z19.number().optional().meta(Unrestricted16),
  peer_gap: z19.number().optional().meta(Unrestricted16),
  sample_size: z19.number().int().min(0).optional().meta(Unrestricted16)
}).meta(meta5("TrendFeatures"));
var EvidenceRequirementSchema = z19.object({
  min_units: z19.number().int().min(0).optional().meta(Unrestricted16),
  min_events: z19.number().int().min(0).optional().meta(Unrestricted16),
  min_periods: z19.number().int().min(0).optional().meta(Unrestricted16),
  min_denominator: z19.number().min(0).optional().meta(Unrestricted16)
}).meta(meta5("EvidenceRequirement"));
var OpportunityInterpretationSchema = z19.enum([
  "increase",
  "decrease",
  "level_shift",
  "threshold",
  "peer_gap",
  "correlation"
]).meta(meta5("OpportunityInterpretation"));
var OpportunityEvidenceSchema = z19.object({
  metric: AnalyticsSemanticIdSchema.meta(Unrestricted16),
  current: z19.number().meta(Unrestricted16),
  baseline: z19.number().optional().meta(Unrestricted16),
  relative_delta: z19.number().optional().meta(Unrestricted16),
  window: z19.object({
    start: z19.string().datetime().meta(Unrestricted16),
    end: z19.string().datetime().meta(Unrestricted16)
  }).meta(Unrestricted16),
  sample_size: z19.number().int().min(0).optional().meta(Unrestricted16),
  source_scope: AnalyticsSourceScopeSchema.meta(Unrestricted16),
  interpretation: OpportunityInterpretationSchema.meta(Unrestricted16)
}).meta(meta5("OpportunityEvidence"));
var DetectorRequirementsSchema = z19.object({
  required_metrics: z19.array(AnalyticsSemanticIdSchema).min(1).meta(Unrestricted16),
  evidence: EvidenceRequirementSchema.meta(Unrestricted16)
}).meta(meta5("DetectorRequirements"));
var OpaqueStructuredPayloadSchema = z19.record(z19.string(), z19.unknown());
var OpportunityCandidateSchema = z19.object({
  detector_id: z19.string().min(1).meta(Unrestricted16),
  detector_version: z19.number().int().min(1).meta(Unrestricted16),
  opportunity_type: z19.string().min(1).meta(Unrestricted16),
  resource: z19.object({
    type: z19.string().min(1).meta(Unrestricted16),
    handle: z19.string().min(1).meta(Unrestricted16)
  }).optional().meta(Unrestricted16),
  segment_handles: z19.array(z19.string().min(1)).optional().meta(Unrestricted16),
  evidence: z19.array(OpportunityEvidenceSchema).min(1).meta(Unrestricted16),
  hypothesis: z19.string().min(1).meta(Unrestricted16),
  confidence: z19.number().min(0).max(1).meta(Unrestricted16),
  impact: OpaqueStructuredPayloadSchema.optional().meta(Unrestricted16),
  suggested_action: OpaqueStructuredPayloadSchema.optional().meta(Unrestricted16),
  suggested_experiment: OpaqueStructuredPayloadSchema.optional().meta(Unrestricted16)
}).meta(meta5("OpportunityCandidate"));

// ../scaffold/src/events/models/schema.ts
import { z as z21 } from "zod";

// ../scaffold/src/events/models/taxonomy.ts
import { z as z20 } from "zod";
var { Unrestricted: Unrestricted17 } = DataClassification;
var { Transient: Transient17 } = SchemaPersistence;
var { External: External9 } = SchemaExposure;
var EventSurfaceSchema = z20.enum(["sdk_client", "sdk_server", "control_plane", "webhook_derived"]).meta({
  id: "EventSurface",
  "x-revturbine-schema-persistence": Transient17,
  "x-revturbine-schema-exposure": External9
});
var EventStabilitySchema = z20.enum(["stable", "internal", "deprecated"]).meta({
  id: "EventStability",
  "x-revturbine-schema-persistence": Transient17,
  "x-revturbine-schema-exposure": External9
});
var EventTaxonomyEntrySchema = z20.object({
  name: z20.string().regex(/^[a-z][a-z0-9_]*$/).meta(Unrestricted17),
  surface: EventSurfaceSchema.meta(Unrestricted17),
  purpose: z20.string().min(1).max(300).meta(Unrestricted17),
  stability: EventStabilitySchema.meta(Unrestricted17)
}).meta({
  id: "EventTaxonomyEntry",
  "x-revturbine-schema-persistence": Transient17,
  "x-revturbine-schema-exposure": External9
});
var EventPrefixFamilySchema = z20.object({
  prefix: z20.string().regex(/^[a-z][a-z0-9_]*_$/).meta(Unrestricted17),
  surface: EventSurfaceSchema.meta(Unrestricted17),
  purpose: z20.string().min(1).max(300).meta(Unrestricted17)
}).meta({
  id: "EventPrefixFamily",
  "x-revturbine-schema-persistence": Transient17,
  "x-revturbine-schema-exposure": External9
});
var EventTaxonomySchema = z20.object({
  version: z20.number().int().min(1).meta(Unrestricted17),
  events: z20.array(EventTaxonomyEntrySchema).min(1).meta(Unrestricted17),
  prefix_families: z20.array(EventPrefixFamilySchema).meta(Unrestricted17)
}).meta({
  id: "EventTaxonomy",
  "x-revturbine-schema-persistence": Transient17,
  "x-revturbine-schema-exposure": External9
});
var CONTROL_PLANE_EVENT_NAMES = [
  "web_signed_up",
  "web_signed_in",
  "cli_signed_up",
  "cli_signed_in",
  "cli_command_executed",
  "changeset_submitted",
  "changeset_approved",
  "changeset_rejected",
  "changeset_deployed",
  "changeset_launched",
  "changeset_parked",
  "changeset_resumed",
  "changeset_discarded",
  "changeset_archived",
  "config_imported",
  "config_exported",
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
  "user_context_observed",
  "page_view"
];
var SDK_META_EVENT_NAMES = [
  "sdk_init",
  "sdk_error",
  "sdk_validation_warning",
  "resolution_failure"
];
var DOGFOOD_CLIENT_EVENT_NAMES = ["area_viewed", "feature_gated"];
var EVENT_METADATA = {
  // Control plane — identity
  web_signed_up: { purpose: "An operator created a control-plane account via the web app.", stability: "stable" },
  web_signed_in: { purpose: "An operator signed in to the web app.", stability: "stable" },
  cli_signed_up: { purpose: "An operator created an account through the CLI device flow.", stability: "stable" },
  cli_signed_in: { purpose: "An operator authenticated the CLI.", stability: "stable" },
  cli_command_executed: { purpose: "A CLI command ran; the command name rides on payload.command.", stability: "stable" },
  // Control plane — playbook version lifecycle
  changeset_submitted: { purpose: "A playbook version was submitted for review.", stability: "stable" },
  changeset_approved: { purpose: "A playbook version was approved.", stability: "stable" },
  changeset_rejected: { purpose: "A playbook version was rejected.", stability: "stable" },
  changeset_deployed: { purpose: "A playbook version was compiled and activated.", stability: "stable" },
  changeset_launched: { purpose: "A deployed playbook version was launched to traffic.", stability: "stable" },
  changeset_parked: { purpose: "A playbook version was parked.", stability: "stable" },
  changeset_resumed: { purpose: "A parked playbook version resumed.", stability: "stable" },
  changeset_discarded: { purpose: "A draft playbook version was discarded.", stability: "stable" },
  changeset_archived: { purpose: "A playbook version was archived.", stability: "stable" },
  // Control plane — config + CRUD
  config_imported: { purpose: "A Playbook was imported as a staged change set.", stability: "stable" },
  config_exported: { purpose: "A Playbook was exported.", stability: "stable" },
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
  user_context_observed: { purpose: "Reserved: the NAMES of custom user-context fields set on identify/setUserContext. Names only, never values.", stability: "internal" },
  page_view: { purpose: "A route change tracked by the SDK router integration.", stability: "stable" },
  // SDK meta lane — anonymous, no tenant or user
  sdk_init: { purpose: "One anonymous adoption beacon per SDK startup.", stability: "internal" },
  sdk_error: { purpose: "The SDK itself malfunctioned; distinct from a decision producing nothing.", stability: "internal" },
  sdk_validation_warning: { purpose: "The SDK found a config or usage problem worth surfacing.", stability: "internal" },
  resolution_failure: { purpose: "A decision produced nothing; allow-listed handles and closed reason codes only.", stability: "internal" }
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
  version: 2,
  events: [
    ...entriesFor(CONTROL_PLANE_EVENT_NAMES, "control_plane"),
    ...entriesFor(DOGFOOD_CLIENT_EVENT_NAMES, "control_plane"),
    ...entriesFor(SDK_CLIENT_EVENT_NAMES, "sdk_client"),
    ...entriesFor(SDK_META_EVENT_NAMES, "sdk_client")
  ],
  prefix_families: [...EVENT_PREFIX_FAMILIES]
};
var PLATFORM_EMITTED_EVENT_NAMES = PLATFORM_EVENT_TAXONOMY.events.map((entry) => entry.name);
var DEPRECATED_EVENT_NAMES = PLATFORM_EVENT_TAXONOMY.events.filter((e) => e.stability === "deprecated").map((e) => e.name);

// ../scaffold/src/events/models/schema.ts
var { Unrestricted: Unrestricted18, Pii: Pii4 } = DataClassification;
var { Persisted: Persisted12, Transient: Transient18 } = SchemaPersistence;
var { Internal: Internal15, External: External10 } = SchemaExposure;
var EventSourceSchema = z21.enum(["clickstream", "telemetry", "sdk", "workflow", "system"]).meta(
  {
    id: "EventSource",
    "x-revturbine-schema-persistence": Transient18,
    "x-revturbine-schema-exposure": External10
  }
);
var EventEnvelopeSchema = IdField.extend({
  event_type: z21.string().min(1).meta(Unrestricted18),
  source: EventSourceSchema.default("sdk").meta(Unrestricted18),
  tenant_id: z21.string().min(1).optional().meta(Unrestricted18),
  user_id: z21.string().min(1).optional().meta(Pii4),
  session_id: z21.string().min(1).optional().meta(Pii4),
  occurred_at: z21.string().datetime().meta(Unrestricted18),
  request_id: z21.string().min(1).meta(Unrestricted18),
  attributes: z21.record(z21.string(), z21.unknown()).default({}).meta(Unrestricted18),
  payload: z21.record(z21.string(), z21.unknown()).default({}).meta(Unrestricted18)
}).meta(
  {
    id: "EventEnvelope",
    "x-revturbine-schema-persistence": Transient18,
    "x-revturbine-schema-exposure": Internal15
  }
);
var IngestedEventSchema = EventEnvelopeSchema.extend({
  ingested_at: z21.string().datetime().meta(Unrestricted18)
}).meta(
  {
    id: "IngestedEvent",
    "x-revturbine-schema-persistence": Persisted12,
    "x-revturbine-schema-exposure": Internal15
  }
);
var EventIngestBatchSchema = z21.array(
  z21.object({
    id: z21.string().min(1).optional().meta(Unrestricted18),
    event_type: z21.string().min(1).meta(Unrestricted18),
    occurred_at: z21.string().datetime().optional().meta(Unrestricted18),
    tenant_id: z21.string().min(1).optional().meta(Unrestricted18),
    user_id: z21.string().min(1).optional().meta(Pii4),
    session_id: z21.string().min(1).optional().meta(Pii4),
    attributes: z21.record(z21.string(), z21.unknown()).optional().meta(Unrestricted18),
    payload: z21.record(z21.string(), z21.unknown()).optional().meta(Unrestricted18),
    message: z21.string().optional().meta(Unrestricted18),
    level: z21.string().optional().meta(Unrestricted18),
    path: z21.string().optional().meta(Unrestricted18)
  })
).meta(
  {
    id: "EventIngestBatch",
    "x-revturbine-schema-persistence": Transient18,
    "x-revturbine-schema-exposure": Internal15
  }
);
var TreatmentInteractionTypeSchema = z21.enum([
  "impression",
  "dismiss",
  "remind_me_later",
  "cta_clicked",
  "cta_completed",
  "suppress"
]).meta(
  {
    id: "TreatmentInteractionType",
    "x-revturbine-schema-persistence": Transient18,
    "x-revturbine-schema-exposure": External10
  }
);
var TreatmentInteractionInputSchema = z21.object({
  user_id: z21.string().min(1).meta(Pii4),
  placement_id: z21.string().min(1).meta(Unrestricted18),
  treatment_id: z21.string().min(1).optional().meta(Unrestricted18),
  // Presentation context (plan 114) — carried so a treatment interaction can
  // be persisted as a `placement_presentations` row. Optional for back-compat:
  // callers that only record an interaction (not a full presentation) omit them.
  surface_slot_id: z21.string().min(1).optional().meta(Unrestricted18),
  surface_template_id: z21.string().min(1).optional().meta(Unrestricted18),
  payload_id: z21.string().min(1).optional().meta(Unrestricted18),
  interaction_type: TreatmentInteractionTypeSchema.meta(Unrestricted18),
  interaction_at: z21.string().datetime().optional().meta(Unrestricted18),
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
  message_block_handle: z21.string().min(1).optional().meta(Unrestricted18),
  message_block_id: z21.string().min(1).optional().meta(Unrestricted18),
  experiment_id: z21.string().min(1).optional().meta(Unrestricted18),
  variant_key: z21.string().min(1).optional().meta(Unrestricted18),
  /**
   * Caller-declared test traffic (plan 164) — mirrors `TrackEvent.test` so
   * the presentation/interaction feed (the dashboard denominators) carries
   * the same default-excluded, `include_test`-toggleable dimension.
   */
  test: z21.boolean().optional().meta(Unrestricted18),
  metadata: z21.record(z21.string(), z21.unknown()).optional().meta(Unrestricted18)
}).meta(
  {
    id: "TreatmentInteractionInput",
    "x-revturbine-schema-persistence": Transient18,
    "x-revturbine-schema-exposure": External10
  }
);
var TriggerEventTypeSchema = z21.enum([
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
    "x-revturbine-schema-persistence": Transient18,
    "x-revturbine-schema-exposure": External10
  }
);
var TrialTriggerPayloadSchema = z21.object({
  days_remaining: z21.number().int().min(0).optional().meta(Unrestricted18)
}).meta(
  {
    id: "TrialTriggerPayload",
    "x-revturbine-schema-persistence": Transient18,
    "x-revturbine-schema-exposure": External10
  }
);
var UsageTriggerPayloadSchema = z21.object({
  entitlement_handle: z21.string().optional().meta(Unrestricted18),
  current_usage: z21.number().min(0).optional().meta(Unrestricted18),
  usage_limit: z21.number().min(0).optional().meta(Unrestricted18),
  usage_percent: z21.number().min(0).max(100).optional().meta(Unrestricted18),
  threshold: z21.number().min(0).optional().meta(Unrestricted18),
  balance: z21.number().min(0).optional().meta(Unrestricted18),
  allocation: z21.number().min(0).optional().meta(Unrestricted18),
  seats_used: z21.number().int().min(0).optional().meta(Unrestricted18),
  seats_allowed: z21.number().int().min(0).optional().meta(Unrestricted18)
}).meta(
  {
    id: "UsageTriggerPayload",
    "x-revturbine-schema-persistence": Transient18,
    "x-revturbine-schema-exposure": External10
  }
);
var FeatureGateTriggerPayloadSchema = z21.object({
  feature: z21.string().min(1).meta(Unrestricted18)
}).meta(
  {
    id: "FeatureGateTriggerPayload",
    "x-revturbine-schema-persistence": Transient18,
    "x-revturbine-schema-exposure": External10
  }
);
var PaymentTriggerPayloadSchema = z21.object({
  retry_count: z21.number().int().min(0).optional().meta(Unrestricted18),
  renewal_date: z21.string().optional().meta(Unrestricted18)
}).meta(
  {
    id: "PaymentTriggerPayload",
    "x-revturbine-schema-persistence": Transient18,
    "x-revturbine-schema-exposure": External10
  }
);
var SemanticEventSchema = z21.object({
  event_type: z21.string().min(1).meta(Unrestricted18),
  payload: z21.record(z21.string(), z21.unknown()).default({}).meta(Unrestricted18)
}).meta(
  {
    id: "SemanticEvent",
    "x-revturbine-schema-persistence": Transient18,
    "x-revturbine-schema-exposure": External10
  }
);
var ControlPlaneEventSourceSchema = z21.enum(["system", "workflow"]).meta(
  {
    id: "ControlPlaneEventSource",
    "x-revturbine-schema-persistence": Transient18,
    "x-revturbine-schema-exposure": External10
  }
);
var ControlPlaneEventTypeSchema = (
  // DERIVED from the taxonomy (plan 181 REQ-8), never a second list: adding a
  // control-plane event means adding it to CONTROL_PLANE_EVENT_NAMES, and this
  // enum follows. The tuple is `as const`, so literal types survive.
  z21.enum(CONTROL_PLANE_EVENT_NAMES).meta(
    {
      id: "ControlPlaneEventType",
      "x-revturbine-schema-persistence": Transient18,
      "x-revturbine-schema-exposure": External10
    }
  )
);
var ControlPlaneSemanticEventSchema = z21.object({
  event_type: ControlPlaneEventTypeSchema.meta(Unrestricted18),
  source: ControlPlaneEventSourceSchema.meta(Unrestricted18),
  payload: z21.record(z21.string(), z21.unknown()).default({}).meta(Unrestricted18)
}).meta(
  {
    id: "ControlPlaneSemanticEvent",
    "x-revturbine-schema-persistence": Transient18,
    "x-revturbine-schema-exposure": External10
  }
);
var EventSearchParamsSchema = z21.object({
  q: z21.string().optional().meta(Unrestricted18),
  source: EventSourceSchema.optional().meta(Unrestricted18),
  event_type: z21.string().optional().meta(Unrestricted18),
  from: z21.string().datetime().optional().meta(Unrestricted18),
  to: z21.string().datetime().optional().meta(Unrestricted18),
  page: z21.coerce.number().int().min(1).default(1).meta(Unrestricted18),
  per_page: z21.coerce.number().int().min(1).max(100).default(25).meta(Unrestricted18)
}).meta(
  {
    id: "EventSearchParams",
    "x-revturbine-schema-persistence": Transient18,
    "x-revturbine-schema-exposure": Internal15
  }
);
var WebhookEventSourceSchema = z21.enum(["stripe", "apple", "google"]).meta(
  {
    id: "WebhookEventSource",
    "x-revturbine-schema-persistence": Transient18,
    "x-revturbine-schema-exposure": Internal15
  }
);
var WebhookEventStatusSchema = z21.enum(["processed", "failed", "skipped"]).meta(
  {
    id: "WebhookEventStatus",
    "x-revturbine-schema-persistence": Transient18,
    "x-revturbine-schema-exposure": Internal15
  }
);
var WebhookEventLogSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  event_id: z21.string().min(1).meta(Unrestricted18),
  event_type: z21.string().min(1).meta(Unrestricted18),
  source: WebhookEventSourceSchema.meta(Unrestricted18),
  payload: z21.record(z21.string(), z21.unknown()).default({}).meta(Unrestricted18),
  status: WebhookEventStatusSchema.default("processed").meta(Unrestricted18),
  processed_at: z21.string().datetime().optional().meta(Unrestricted18),
  error_message: z21.string().optional().meta(Unrestricted18)
}).meta(
  {
    id: "WebhookEventLog",
    "x-revturbine-schema-persistence": Persisted12,
    "x-revturbine-schema-exposure": Internal15
  }
);
var EventIngestResponseSchema = z21.object({
  accepted: z21.number().int().min(0).meta(Unrestricted18)
}).meta(
  {
    id: "null",
    "x-revturbine-schema-persistence": Transient18,
    "x-revturbine-schema-exposure": Internal15
  }
);
var MAX_TRACK_EVENTS_PER_BATCH = 500;
var EventOriginSchema = z21.enum(["explicit", "automatic", "derived", "raw"]).meta(
  {
    id: "EventOrigin",
    "x-revturbine-schema-persistence": Transient18,
    "x-revturbine-schema-exposure": External10
  }
);
var TrackEventSchema = z21.object({
  environment_id: z21.string().min(1).meta(Unrestricted18),
  user_id: z21.string().min(1).meta(Pii4),
  account_id: z21.string().min(1).meta(Unrestricted18),
  event_name: z21.string().min(1).max(120).meta(Unrestricted18),
  event_ts: z21.string().datetime().meta(Unrestricted18),
  properties: z21.string().optional().meta(Unrestricted18),
  surface_slot_id: z21.string().nullable().optional().meta(Unrestricted18),
  placement_id: z21.string().nullable().optional().meta(Unrestricted18),
  payload_id: z21.string().nullable().optional().meta(Unrestricted18),
  request_id: z21.string().optional().meta(Unrestricted18),
  experiment_id: z21.string().nullable().optional().meta(Unrestricted18),
  variant_key: z21.string().nullable().optional().meta(Unrestricted18),
  tenant_id: z21.string().optional().meta(Unrestricted18),
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
  event_id: z21.string().nullable().optional().meta(Unrestricted18),
  /** See {@link EventOriginSchema}. Low cardinality; every scoring query filters on it. */
  origin: EventOriginSchema.nullable().optional().meta(Unrestricted18),
  /** Immutable Playbook version that produced the experience. The field that makes a past decision reproducible. */
  playbook_version: z21.string().nullable().optional().meta(Unrestricted18),
  /** Correlates every event caused by one decision — a join key, not a group-by. */
  decision_id: z21.string().nullable().optional().meta(Unrestricted18),
  /**
   * Caller-declared test traffic (plan 164): set from the SDK's `test` init
   * option, stamped on every emitted event. Analytics pipes exclude
   * `test = true` rows from denominators/rollups by default, with an
   * `include_test` pipe parameter as the opt-in toggle. Distinct from the
   * placement "Test Mode" (plan 08c), which is a server-decided per-user
   * flag on DECISIONING responses — this one marks EMITTED events.
   */
  test: z21.boolean().optional().meta(Unrestricted18)
}).meta(
  {
    id: "TrackEvent",
    "x-revturbine-schema-persistence": Transient18,
    "x-revturbine-schema-exposure": External10
  }
);
var TrackIngestBatchSchema = z21.object({
  events: z21.array(TrackEventSchema).min(1).max(MAX_TRACK_EVENTS_PER_BATCH).meta(Unrestricted18)
}).meta(
  {
    id: "TrackIngestBatch",
    "x-revturbine-schema-persistence": Transient18,
    "x-revturbine-schema-exposure": External10
  }
);
var MAX_SDK_META_EVENTS_PER_BATCH = 10;
var SdkMetaEventTypeSchema = z21.enum(["sdk_init", "sdk_error", "sdk_validation_warning", "resolution_failure"]).meta(
  {
    id: "SdkMetaEventType",
    "x-revturbine-schema-persistence": Transient18,
    "x-revturbine-schema-exposure": External10
  }
);
var SdkConfigShapeSchema = z21.object({
  plans: z21.number().int().min(0).meta(Unrestricted18),
  entitlements: z21.number().int().min(0).meta(Unrestricted18),
  entitlement_rules: z21.number().int().min(0).meta(Unrestricted18),
  segments: z21.number().int().min(0).meta(Unrestricted18),
  placements: z21.number().int().min(0).meta(Unrestricted18),
  placement_payloads: z21.number().int().min(0).meta(Unrestricted18),
  content_ui_paths: z21.number().int().min(0).meta(Unrestricted18),
  surface_templates: z21.number().int().min(0).meta(Unrestricted18)
}).meta(
  {
    id: "SdkConfigShape",
    "x-revturbine-schema-persistence": Transient18,
    "x-revturbine-schema-exposure": External10
  }
);
var SdkMetaEventSchema = z21.object({
  event_type: SdkMetaEventTypeSchema.meta(Unrestricted18),
  occurred_at: z21.string().datetime().meta(Unrestricted18),
  request_id: z21.string().min(1).optional().meta(Unrestricted18),
  // One-way, non-reversible hash of a non-secret config identifier (e.g.
  // truncated SHA-256 of config_hash / bundle id). Counts distinct
  // deployments without exposing the real id (REQ-7).
  config_hash_id: z21.string().min(1).max(64).optional().meta(Unrestricted18),
  sdk_version: z21.string().min(1).max(64).optional().meta(Unrestricted18),
  runtime_mode: z21.string().min(1).max(64).optional().meta(Unrestricted18),
  schema_version: z21.string().min(1).max(64).optional().meta(Unrestricted18),
  bundle_version: z21.string().min(1).max(64).optional().meta(Unrestricted18),
  // Present for sdk_init; config-shape counts only, no user context (REQ-6).
  config_shape: SdkConfigShapeSchema.optional().meta(Unrestricted18),
  // Short non-PII diagnostic for sdk_error / sdk_validation_warning.
  message: z21.string().max(500).optional().meta(Unrestricted18),
  // Diagnostic fields for `resolution_failure` (plan 144 TASK-20; absorbed
  // plan 124 REQ-5/AC-6 — its Q-1 allow-list, append-only). Every value is
  // an AUTHOR-DEFINED handle or a closed reason code — never user-supplied
  // free text; `message` above remains the only prose field and stays
  // length-capped. Emitted from the SDK's fallback/deny sites so a
  // placement that silently resolves to nothing becomes observable.
  reason: z21.string().min(1).max(64).optional().meta(Unrestricted18),
  placement_handle: z21.string().min(1).max(64).optional().meta(Unrestricted18),
  slot_handle: z21.string().min(1).max(64).optional().meta(Unrestricted18),
  surface: z21.string().min(1).max(64).optional().meta(Unrestricted18),
  plan_handle: z21.string().min(1).max(64).optional().meta(Unrestricted18),
  entitlement_handle: z21.string().min(1).max(64).optional().meta(Unrestricted18)
}).meta(
  {
    id: "SdkMetaEvent",
    "x-revturbine-schema-persistence": Transient18,
    "x-revturbine-schema-exposure": External10
  }
);
var SdkMetaIngestBatchSchema = z21.object({
  events: z21.array(SdkMetaEventSchema).min(1).max(MAX_SDK_META_EVENTS_PER_BATCH).meta(Unrestricted18)
}).meta(
  {
    id: "SdkMetaIngestBatch",
    "x-revturbine-schema-persistence": Transient18,
    "x-revturbine-schema-exposure": External10
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
      summary: "Record a placement treatment interaction",
      tags: ["events"],
      requestBody: { required: true, content: { "application/json": { schema: TreatmentInteractionInputSchema } } },
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
      "x-revturbine-operation": { exposure: "internal", resource: "webhook-events", persistence: { table: "webhookEventLog", mode: "list" } }
    }),
    post: operation({
      operationId: "createWebhookEvent",
      summary: "Record a processed webhook event",
      tags: ["events"],
      requestBody: { required: true, content: { "application/json": { schema: WebhookEventLogSchema } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: WebhookEventLogSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "webhook-events", persistence: { table: "webhookEventLog", mode: "create" } }
    })
  }
};

// ../scaffold/src/trials/models/schema.ts
import { z as z22 } from "zod";
var { Unrestricted: Unrestricted19 } = DataClassification;
var { Persisted: Persisted13, Transient: Transient19 } = SchemaPersistence;
var { Internal: Internal16 } = SchemaExposure;
var PLAYBOOK_SDK_FACETS6 = schemaFacets(SchemaContext.Playbook, { sdkInput: true });
var PENDING_PLAYBOOK_SDK_FACETS2 = schemaFacets(SchemaContext.Playbook, {
  inConfig: false,
  sdkInput: true
});
var TrialStatusSchema = z22.enum(["not_started", "active", "expired", "converted", "cancelled"]).meta(
  { id: "TrialStatus", "x-revturbine-schema-persistence": Transient19, "x-revturbine-schema-exposure": Internal16 }
);
var TrialLimitTypeSchema = z22.enum(["time", "usage"]).meta(
  { id: "TrialLimitType", "x-revturbine-schema-persistence": Transient19, "x-revturbine-schema-exposure": Internal16 }
);
var FreeTrialRuleCoreFieldsSchema = z22.object({
  name: NameField.meta(Unrestricted19),
  handle: HandleField.meta(Unrestricted19),
  // plan_id null = "All plans" — see plans-entitlements-studio-ui.md §2.4.1.
  plan_id: z22.string().nullable().optional().meta(Unrestricted19),
  segment_id: z22.string().nullable().optional().meta(Unrestricted19),
  // Defaults to 'time' so every pre-existing rule keeps its current
  // duration-based semantics. Set to 'usage' to scope the trial by
  // consumption of `usage_entitlement_handle` up to
  // `usage_limit_value`; the time fields below are then ignored.
  trial_limit_type: TrialLimitTypeSchema.default("time").meta(Unrestricted19),
  // Time-based: rule is skipped at runtime when null/blank. The
  // Default Trial Length global was removed (no fallback exists).
  duration_days: z22.number().int().min(1).max(365).nullable().optional().meta(Unrestricted19),
  grace_period_days: z22.number().int().min(0).default(0).meta(Unrestricted19),
  // Usage-based: the entitlement whose consumption gates the trial,
  // and the cap. Both required when `trial_limit_type === 'usage'`;
  // otherwise ignored. Cross-field validation is done at the API
  // boundary (web app's POST handler) rather than here so partial
  // drafts stay round-trippable.
  usage_entitlement_handle: z22.string().min(1).optional().meta(Unrestricted19),
  usage_limit_value: z22.number().int().min(1).optional().meta(Unrestricted19),
  require_payment_method: z22.boolean().default(false).meta(Unrestricted19),
  auto_convert: z22.boolean().default(true).meta(Unrestricted19),
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
  convert_to_plan_id: z22.string().optional().meta(Unrestricted19),
  fallback_plan_id: z22.string().optional().meta(Unrestricted19),
  limit_per_customer: z22.number().int().min(1).default(1).meta(Unrestricted19),
  is_active: z22.boolean().default(true).meta(Unrestricted19),
  metadata: MetadataField.meta(Unrestricted19)
});
var FreeTrialRuleSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z22.string().min(1).meta({ ...Unrestricted19, readOnly: true })
}).merge(FreeTrialRuleCoreFieldsSchema).meta(
  { id: "FreeTrialRule", "x-revturbine-schema-persistence": Persisted13, "x-revturbine-schema-exposure": Internal16, ...PLAYBOOK_SDK_FACETS6, ...namedIdentity() }
);
var FreeTrialRuleAnchorSchema = makeAnchor("FreeTrialRuleAnchor");
var ReverseTrialStartPolicySchema = z22.enum(["signup", "first_premium_access", "manual"]).meta(
  { id: "ReverseTrialStartPolicy", "x-revturbine-schema-persistence": Transient19, "x-revturbine-schema-exposure": Internal16 }
);
var ReverseTrialRuleCoreFieldsSchema = z22.object({
  name: NameField.meta(Unrestricted19),
  handle: HandleField.meta(Unrestricted19),
  premium_plan_id: z22.string().min(1).meta(Unrestricted19),
  fallback_plan_id: z22.string().min(1).meta(Unrestricted19),
  segment_id: z22.string().nullable().optional().meta(Unrestricted19),
  trial_limit_type: TrialLimitTypeSchema.default("time").meta(Unrestricted19),
  duration_days: z22.number().int().min(1).max(365).nullable().optional().meta(Unrestricted19),
  usage_entitlement_handle: z22.string().min(1).optional().meta(Unrestricted19),
  usage_limit_value: z22.number().int().min(1).optional().meta(Unrestricted19),
  start_policy: ReverseTrialStartPolicySchema.default("signup").meta(Unrestricted19),
  show_upgrade_prompt_at_day: z22.number().int().min(0).optional().meta(Unrestricted19),
  entitlements_during_trial: z22.array(z22.string()).default([]).meta(Unrestricted19),
  is_active: z22.boolean().default(true).meta(Unrestricted19),
  metadata: MetadataField.meta(Unrestricted19)
});
var ReverseTrialRuleSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z22.string().min(1).meta({ ...Unrestricted19, readOnly: true })
}).merge(ReverseTrialRuleCoreFieldsSchema).meta(
  { id: "ReverseTrialRule", "x-revturbine-schema-persistence": Persisted13, "x-revturbine-schema-exposure": Internal16, ...PLAYBOOK_SDK_FACETS6, ...namedIdentity() }
);
var ReverseTrialRuleAnchorSchema = makeAnchor("ReverseTrialRuleAnchor");
var TrialLimitPolicySchema = z22.enum(["1_per_lifetime", "1_per_plan", "1_per_year", "unlimited"]).meta(
  { id: "TrialLimitPolicy", "x-revturbine-schema-persistence": Transient19, "x-revturbine-schema-exposure": Internal16 }
);
var TrialEligibilityScopeSchema = z22.enum(["per_customer", "per_email_domain"]).meta(
  { id: "TrialEligibilityScope", "x-revturbine-schema-persistence": Transient19, "x-revturbine-schema-exposure": Internal16 }
);
var FreeTrialSettingsSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  trial_limit_policy: TrialLimitPolicySchema.default("1_per_lifetime").meta(Unrestricted19),
  eligibility_scope: TrialEligibilityScopeSchema.default("per_customer").meta(Unrestricted19)
}).meta(
  { id: "FreeTrialSettings", "x-revturbine-schema-persistence": Persisted13, "x-revturbine-schema-exposure": Internal16, ...PENDING_PLAYBOOK_SDK_FACETS2 }
);
var ReverseTrialSettingsSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  trial_limit_policy: TrialLimitPolicySchema.default("1_per_lifetime").meta(Unrestricted19),
  eligibility_scope: TrialEligibilityScopeSchema.default("per_customer").meta(Unrestricted19)
}).meta(
  { id: "ReverseTrialSettings", "x-revturbine-schema-persistence": Persisted13, "x-revturbine-schema-exposure": Internal16, ...PENDING_PLAYBOOK_SDK_FACETS2 }
);
var TrialInstanceSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  customer_id: z22.string().min(1).meta(Unrestricted19),
  rule_id: z22.string().min(1).meta(Unrestricted19),
  rule_type: z22.enum(["free_trial", "reverse_trial"]).meta(Unrestricted19),
  plan_id: z22.string().min(1).meta(Unrestricted19),
  status: TrialStatusSchema.default("active").meta(Unrestricted19),
  started_at: z22.string().datetime().meta({ ...Unrestricted19, readOnly: true }),
  /**
   * Time-based expiry. Required for time-based trials; null for
   * pure usage-based trials (which expire when consumption crosses
   * `usage_limit_value` regardless of clock time).
   */
  expires_at: z22.string().datetime().nullable().optional().meta(Unrestricted19),
  /**
   * Snapshot of the rule's `trial_limit_type` at the moment the
   * instance was created. Persisted so subsequent changes to the
   * rule's mode don't retroactively alter the user's trial
   * semantics. Defaults to 'time' for backward compatibility with
   * pre-existing instances.
   */
  trial_limit_type: TrialLimitTypeSchema.default("time").meta(Unrestricted19),
  /**
   * Snapshot of the rule's `usage_entitlement_handle` for
   * usage-based trials. Server queries the user's current
   * consumption of this entitlement to derive
   * `UserTrialStatus.usage_consumed` at read time.
   */
  usage_entitlement_handle: z22.string().min(1).optional().meta(Unrestricted19),
  /**
   * Snapshot of the rule's `usage_limit_value`. Persisted so
   * mid-trial limit changes on the rule don't shrink/expand a
   * user's in-flight trial.
   */
  usage_limit_value: z22.number().int().min(1).optional().meta(Unrestricted19),
  converted_at: NullableDatetimeField.meta(Unrestricted19),
  cancelled_at: NullableDatetimeField.meta(Unrestricted19),
  metadata: MetadataField.meta(Unrestricted19)
}).meta(
  { id: "TrialInstance", "x-revturbine-schema-persistence": Persisted13, "x-revturbine-schema-exposure": Internal16 }
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
      requestParams: { path: z22.object({ ruleId: z22.string() }) },
      summary: "Get free trial rule",
      tags: ["trials"],
      responses: { "200": { description: "Free trial rule", content: { "application/json": { schema: FreeTrialRuleSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-rules", persistence: { table: "freeTrialRuleVersions", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateFreeTrialRule",
      requestParams: { path: z22.object({ ruleId: z22.string() }) },
      summary: "Update free trial rule",
      tags: ["trials"],
      requestBody: { required: true, content: { "application/json": { schema: FreeTrialRuleSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: FreeTrialRuleSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-rules", persistence: { table: "freeTrialRuleVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteFreeTrialRule",
      requestParams: { path: z22.object({ ruleId: z22.string() }) },
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
      requestParams: { path: z22.object({ ruleId: z22.string() }) },
      summary: "Get reverse trial rule",
      tags: ["trials"],
      responses: { "200": { description: "Reverse trial rule", content: { "application/json": { schema: ReverseTrialRuleSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "reverse-trial-rules", persistence: { table: "reverseTrialRuleVersions", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateReverseTrialRule",
      requestParams: { path: z22.object({ ruleId: z22.string() }) },
      summary: "Update reverse trial rule",
      tags: ["trials"],
      requestBody: { required: true, content: { "application/json": { schema: ReverseTrialRuleSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: ReverseTrialRuleSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "reverse-trial-rules", persistence: { table: "reverseTrialRuleVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteReverseTrialRule",
      requestParams: { path: z22.object({ ruleId: z22.string() }) },
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
      requestParams: { path: z22.object({ settingsId: z22.string() }) },
      summary: "Get free trial settings",
      tags: ["trials"],
      responses: { "200": { description: "Free trial settings", content: { "application/json": { schema: FreeTrialSettingsSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "free-trial-settings", persistence: { table: "freeTrialSettings", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateFreeTrialSettings",
      requestParams: { path: z22.object({ settingsId: z22.string() }) },
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
      requestParams: { path: z22.object({ settingsId: z22.string() }) },
      summary: "Get reverse trial settings",
      tags: ["trials"],
      responses: { "200": { description: "Reverse trial settings", content: { "application/json": { schema: ReverseTrialSettingsSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "reverse-trial-settings", persistence: { table: "reverseTrialSettings", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateReverseTrialSettings",
      requestParams: { path: z22.object({ settingsId: z22.string() }) },
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
      "x-revturbine-operation": { exposure: "internal", resource: "trial-instances", persistence: { table: "trialInstances", mode: "list" } }
    })
  },
  "/api/trials/instances/{instanceId}": {
    get: operation({
      operationId: "getTrialInstance",
      requestParams: { path: z22.object({ instanceId: z22.string() }) },
      summary: "Get trial instance",
      tags: ["trials"],
      responses: { "200": { description: "Trial instance", content: { "application/json": { schema: TrialInstanceSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-instances", persistence: { table: "trialInstances", mode: "get" } }
    })
  },
  "/api/trials/instances/{instanceId}/cancel": {
    post: operation({
      operationId: "cancelTrialInstance",
      requestParams: { path: z22.object({ instanceId: z22.string() }) },
      summary: "Cancel an active trial",
      tags: ["trials"],
      responses: { "200": { description: "Cancelled", content: { "application/json": { schema: TrialInstanceSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-instances", persistence: { table: "trialInstances", mode: "update" } }
    })
  },
  "/api/trials/instances/{instanceId}/convert": {
    post: operation({
      operationId: "convertTrialInstance",
      requestParams: { path: z22.object({ instanceId: z22.string() }) },
      summary: "Convert trial to paid subscription",
      tags: ["trials"],
      requestBody: { required: true, content: { "application/json": { schema: z22.object({ plan_id: z22.string().optional() }) } } },
      responses: { "200": { description: "Converted", content: { "application/json": { schema: TrialInstanceSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-instances", persistence: { table: "trialInstances", mode: "update" } }
    })
  }
};

// ../scaffold/src/experiments/models/schema.ts
import { z as z23 } from "zod";

// ../scaffold/src/core/bundle/canonical-json.ts
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

// ../scaffold/src/experiments/models/schema.ts
var { Unrestricted: Unrestricted20, Financial: Financial4 } = DataClassification;
var { Persisted: Persisted14, Transient: Transient20 } = SchemaPersistence;
var { Internal: Internal17 } = SchemaExposure;
var PENDING_PLAYBOOK_SDK_FACETS3 = schemaFacets(SchemaContext.Playbook, {
  inConfig: false,
  sdkInput: true
});
var EXPERIMENT_RESULT_FACETS = schemaFacets(SchemaContext.CustomerOperations, {
  sdkInput: false
});
var ExperimentStatusSchema = z23.enum(["draft", "ramping", "winning", "neutral", "needs_attention", "paused", "complete"]).meta(
  { id: "ExperimentStatus", "x-revturbine-schema-persistence": Transient20, "x-revturbine-schema-exposure": Internal17 }
);
var ExperimentTypeSchema = z23.enum(["placement_ab", "entitlement_ab", "plan_ab", "pricing_ab", "custom"]).meta(
  { id: "ExperimentType", "x-revturbine-schema-persistence": Transient20, "x-revturbine-schema-exposure": Internal17 }
);
var ExperimentAllocationModeSchema = z23.enum(["managed", "observed"]).meta(
  { id: "ExperimentAllocationMode", "x-revturbine-schema-persistence": Persisted14, "x-revturbine-schema-exposure": Internal17 }
);
var ExperimentVariantTargetSchema = z23.discriminatedUnion("kind", [
  z23.object({
    kind: z23.literal("placement"),
    placement_handle: z23.string().min(1),
    placement_payload_handle: z23.string().min(1).optional()
  }),
  z23.object({
    kind: z23.literal("entitlement"),
    entitlement_handle: z23.string().min(1),
    rule_handle: z23.string().min(1).optional()
  }),
  z23.object({
    kind: z23.literal("plan"),
    plan_handle: z23.string().min(1),
    plan_variation_handle: z23.string().min(1).optional()
  }),
  z23.object({
    kind: z23.literal("pricing"),
    plan_variation_handle: z23.string().min(1),
    promotion_handle: z23.string().min(1).optional()
  }),
  z23.object({
    kind: z23.literal("custom"),
    provider_payload: z23.record(z23.string(), z23.json())
  })
]).meta(
  { id: "ExperimentVariantTarget", "x-revturbine-schema-persistence": Persisted14, "x-revturbine-schema-exposure": Internal17, ...PENDING_PLAYBOOK_SDK_FACETS3 }
);
var ExperimentVariantSchema = z23.object({
  variant_id: z23.string().min(1),
  name: NameField,
  weight: z23.number().min(0).max(1).default(0.5),
  is_control: z23.boolean().default(false),
  targets: z23.array(ExperimentVariantTargetSchema).min(1).optional(),
  config: z23.record(z23.string(), z23.unknown()).default({})
}).meta(
  { id: "ExperimentVariant", "x-revturbine-schema-persistence": Persisted14, "x-revturbine-schema-exposure": Internal17, ...PENDING_PLAYBOOK_SDK_FACETS3 }
);
var ExperimentSequentialConfigSchema = z23.object({
  method: z23.literal("always_valid"),
  look_count: z23.number().int().positive(),
  alpha: z23.number().positive().lt(1).default(0.05)
}).strict();
var ExperimentPracticalSignificanceConfigSchema = z23.object({
  minimum_revenue_effect: z23.number().min(0)
}).strict();
var ExperimentVarianceReductionSchema = z23.discriminatedUnion("method", [
  z23.object({
    method: z23.literal("cuped"),
    covariate_metric: AnalyticsSemanticIdSchema,
    lookback_days: z23.number().int().positive()
  }),
  z23.object({
    method: z23.literal("regression_adjustment"),
    covariate_metric: AnalyticsSemanticIdSchema,
    lookback_days: z23.number().int().positive()
  })
]);
var ExperimentMultipleComparisonsConfigSchema = z23.object({
  method: z23.literal("holm"),
  family_scope: z23.literal("primary_and_guardrails_separate")
});
var ExperimentAnalysisConfigSchema = z23.object({
  methodology: z23.enum(["frequentist", "bayesian"]),
  analysis_unit: AnalyticsAnalyticalUnitSchema,
  sequential: ExperimentSequentialConfigSchema.optional(),
  multiple_comparisons: ExperimentMultipleComparisonsConfigSchema.optional(),
  variance_reduction: ExperimentVarianceReductionSchema.optional(),
  practical_significance: ExperimentPracticalSignificanceConfigSchema.optional()
}).meta(
  { id: "ExperimentAnalysisConfig", "x-revturbine-schema-persistence": Persisted14, "x-revturbine-schema-exposure": Internal17, ...PENDING_PLAYBOOK_SDK_FACETS3 }
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
var transientExperimentMeta = (id) => ({
  id,
  "x-revturbine-schema-persistence": Transient20,
  "x-revturbine-schema-exposure": Internal17
});
var VariantSummaryIdentitySchema = z23.object({
  variant_id: z23.string().min(1).meta(Unrestricted20)
});
var ExperimentClusterAggregateSchema = z23.object({
  n: z23.number().int().positive().meta(Unrestricted20),
  sum_numerator: z23.number().meta(Unrestricted20),
  sum_denominator: z23.number().positive().meta(Unrestricted20),
  sum_covariate: z23.number().optional().meta(Unrestricted20)
}).meta(transientExperimentMeta("ExperimentClusterAggregate"));
var ExperimentClusteredSufficientStatisticsSchema = z23.object({
  assignment_unit: AnalyticsAnalyticalUnitSchema.meta(Unrestricted20),
  clusters: z23.array(ExperimentClusterAggregateSchema).min(2).meta(Unrestricted20)
}).meta(transientExperimentMeta("ExperimentClusteredSufficientStatistics"));
var ClusteredSummaryShape = {
  clustered: ExperimentClusteredSufficientStatisticsSchema.optional().meta(Unrestricted20)
};
var MeanVariantStatisticalSummarySchema = VariantSummaryIdentitySchema.extend({
  statistic_type: z23.literal("mean").meta(Unrestricted20),
  n: z23.number().int().min(0).meta(Unrestricted20),
  sum_y: z23.number().meta(Unrestricted20),
  sum_y2: z23.number().min(0).meta(Unrestricted20),
  ...ClusteredSummaryShape
}).meta(transientExperimentMeta("MeanVariantStatisticalSummary"));
var BinaryVariantStatisticalSummarySchema = VariantSummaryIdentitySchema.extend({
  statistic_type: z23.literal("binary").meta(Unrestricted20),
  n: z23.number().int().min(0).meta(Unrestricted20),
  successes: z23.number().int().min(0).meta(Unrestricted20),
  ...ClusteredSummaryShape
}).meta(transientExperimentMeta("BinaryVariantStatisticalSummary"));
var RatioVariantStatisticalSummarySchema = VariantSummaryIdentitySchema.extend({
  statistic_type: z23.literal("ratio").meta(Unrestricted20),
  n: z23.number().int().min(0).meta(Unrestricted20),
  sum_numerator: z23.number().meta(Unrestricted20),
  sum_denominator: z23.number().meta(Unrestricted20),
  sum_numerator2: z23.number().min(0).meta(Unrestricted20),
  sum_denominator2: z23.number().min(0).meta(Unrestricted20),
  sum_cross: z23.number().meta(Unrestricted20),
  ...ClusteredSummaryShape
}).meta(transientExperimentMeta("RatioVariantStatisticalSummary"));
var CovarianceVariantStatisticalSummarySchema = VariantSummaryIdentitySchema.extend({
  statistic_type: z23.literal("covariance").meta(Unrestricted20),
  n: z23.number().int().min(0).meta(Unrestricted20),
  sum_x: z23.number().meta(Unrestricted20),
  sum_y: z23.number().meta(Unrestricted20),
  sum_x2: z23.number().min(0).meta(Unrestricted20),
  sum_y2: z23.number().min(0).meta(Unrestricted20),
  sum_xy: z23.number().meta(Unrestricted20),
  ...ClusteredSummaryShape
}).meta(transientExperimentMeta("CovarianceVariantStatisticalSummary"));
var VariantStatisticalSummarySchema = z23.discriminatedUnion("statistic_type", [
  MeanVariantStatisticalSummarySchema,
  BinaryVariantStatisticalSummarySchema,
  RatioVariantStatisticalSummarySchema,
  CovarianceVariantStatisticalSummarySchema
]).meta(transientExperimentMeta("VariantStatisticalSummary"));
var ExperimentObservationWindowSchema = z23.object({
  start: z23.string().datetime().meta(Unrestricted20),
  end: z23.string().datetime().meta(Unrestricted20)
}).meta(transientExperimentMeta("ExperimentObservationWindow"));
var ExperimentCovariateProvenanceSchema = z23.object({
  metric: AnalyticsSemanticIdSchema.meta(Unrestricted20),
  observation_window: ExperimentObservationWindowSchema.meta(Unrestricted20)
}).meta(transientExperimentMeta("ExperimentCovariateProvenance"));
var ExperimentEvidenceSchema = z23.object({
  schema_version: z23.number().int().min(1).meta(Unrestricted20),
  experiment_handle: HandleField.meta(Unrestricted20),
  experiment_version: z23.number().int().min(1).meta(Unrestricted20),
  metric: AnalyticsSemanticIdSchema.meta(Unrestricted20),
  analysis_unit: AnalyticsAnalyticalUnitSchema.meta(Unrestricted20),
  variants: z23.array(VariantStatisticalSummarySchema).min(1).meta(Unrestricted20),
  observation_window: ExperimentObservationWindowSchema.meta(Unrestricted20),
  covariate: ExperimentCovariateProvenanceSchema.optional().meta(Unrestricted20),
  data_watermark: z23.string().datetime().meta(Unrestricted20),
  source_scope: AnalyticsSourceScopeSchema.meta(Unrestricted20),
  provider: ProviderProvenanceSchema.meta(Unrestricted20)
}).meta(transientExperimentMeta("ExperimentEvidence"));
var ExperimentSampleRatioMismatchSchema = z23.object({
  status: z23.enum(["not_evaluated", "pass", "fail"]).meta(Unrestricted20),
  p_value: z23.number().min(0).max(1).optional().meta(Unrestricted20),
  chi_squared: z23.number().min(0).optional().meta(Unrestricted20),
  variants: z23.array(z23.object({
    variant_id: z23.string().min(1).meta(Unrestricted20),
    observed_count: z23.number().int().min(0).meta(Unrestricted20),
    expected_count: z23.number().min(0).meta(Unrestricted20)
  })).default([]).meta(Unrestricted20),
  reason: z23.string().min(1).max(500).optional().meta(Unrestricted20)
}).meta(transientExperimentMeta("ExperimentSampleRatioMismatch"));
var ExperimentHealthSchema = z23.object({
  status: z23.enum(["healthy", "warning", "unhealthy", "insufficient_data"]).meta(Unrestricted20),
  sample_ratio_mismatch: ExperimentSampleRatioMismatchSchema.optional().meta(Unrestricted20),
  issues: z23.array(z23.object({
    code: z23.string().min(1).max(100).meta(Unrestricted20),
    message: z23.string().min(1).max(500).meta(Unrestricted20)
  })).default([]).meta(Unrestricted20)
}).meta(transientExperimentMeta("ExperimentHealth"));
var ExperimentConfidenceIntervalSchema = z23.object({
  lower: z23.number().meta(Unrestricted20),
  upper: z23.number().meta(Unrestricted20),
  level: z23.number().min(0).max(1).meta(Unrestricted20)
}).meta(transientExperimentMeta("ExperimentConfidenceInterval"));
var ExperimentSequentialResultSchema = z23.object({
  method: z23.literal("always_valid").meta(Unrestricted20),
  status: z23.enum(["continue", "significant_positive", "significant_negative"]).meta(Unrestricted20),
  look_count: z23.number().int().min(1).meta(Unrestricted20),
  spending_state: z23.object({
    alpha: z23.number().positive().lt(1).meta(Unrestricted20),
    look_alpha: z23.number().positive().lt(1).meta(Unrestricted20),
    cumulative_alpha_spent: z23.number().positive().lt(1).meta(Unrestricted20),
    alpha_remaining: z23.number().positive().lt(1).meta(Unrestricted20),
    unadjusted_p_value: z23.number().min(0).max(1).optional().meta(Unrestricted20)
  }).meta(Unrestricted20)
}).meta(transientExperimentMeta("ExperimentSequentialResult"));
var ExperimentPracticalSignificanceResultSchema = z23.object({
  minimum_revenue_effect: z23.number().min(0).meta(Financial4),
  revenue_effect: z23.number().meta(Financial4),
  status: z23.enum([
    "meaningful_positive",
    "meaningful_negative",
    "not_demonstrated"
  ]).meta(Unrestricted20)
}).meta(transientExperimentMeta("ExperimentPracticalSignificanceResult"));
var ExperimentMultipleComparisonResultSchema = z23.object({
  method: z23.literal("holm").meta(Unrestricted20),
  family: z23.enum(["primary", "guardrails"]).meta(Unrestricted20),
  family_size: z23.number().int().positive().meta(Unrestricted20),
  unadjusted_p_value: z23.number().min(0).max(1).meta(Unrestricted20)
}).meta(transientExperimentMeta("ExperimentMultipleComparisonResult"));
var ExperimentMetricResultSchema = z23.object({
  metric: AnalyticsSemanticIdSchema.meta(Unrestricted20),
  control_variant_id: z23.string().min(1).meta(Unrestricted20),
  variant_id: z23.string().min(1).meta(Unrestricted20),
  estimator: z23.string().min(1).max(100).meta(Unrestricted20),
  estimator_version: z23.string().min(1).max(100).meta(Unrestricted20),
  estimate: z23.number().meta(Unrestricted20),
  control_estimate: z23.number().meta(Unrestricted20),
  absolute_effect: z23.number().meta(Unrestricted20),
  relative_effect: z23.number().optional().meta(Unrestricted20),
  standard_error: z23.number().min(0).optional().meta(Unrestricted20),
  confidence_interval: ExperimentConfidenceIntervalSchema.optional().meta(Unrestricted20),
  p_value: z23.number().min(0).max(1).optional().meta(Unrestricted20),
  multiple_comparison: ExperimentMultipleComparisonResultSchema.optional().meta(Unrestricted20),
  probability_positive: z23.number().min(0).max(1).optional().meta(Unrestricted20),
  expected_loss: z23.number().min(0).optional().meta(Unrestricted20),
  sequential: ExperimentSequentialResultSchema.optional().meta(Unrestricted20),
  practical_significance: ExperimentPracticalSignificanceResultSchema.optional().meta(Unrestricted20),
  sample_size: z23.number().int().min(0).optional().meta(Unrestricted20)
}).meta(transientExperimentMeta("ExperimentMetricResult"));
var ExperimentEvidenceProvenanceSchema = z23.object({
  metric: AnalyticsSemanticIdSchema.meta(Unrestricted20),
  summary_schema_version: z23.number().int().min(1).meta(Unrestricted20),
  data_watermark: z23.string().datetime().meta(Unrestricted20),
  provider: ProviderProvenanceSchema.meta(Unrestricted20)
}).meta(transientExperimentMeta("ExperimentEvidenceProvenance"));
var AnalysisProvenanceSchema = z23.object({
  provider: ProviderProvenanceSchema.meta(Unrestricted20),
  evidence: z23.array(ExperimentEvidenceProvenanceSchema).min(1).meta(Unrestricted20)
}).meta(transientExperimentMeta("AnalysisProvenance"));
var ExperimentAnalysisResultSchema = z23.object({
  schema_version: z23.number().int().min(1).meta(Unrestricted20),
  engine: z23.string().min(1).max(100).meta(Unrestricted20),
  engine_version: z23.string().min(1).max(100).meta(Unrestricted20),
  methodology: z23.string().min(1).max(100).meta(Unrestricted20),
  metrics: z23.array(ExperimentMetricResultSchema).meta(Unrestricted20),
  health: ExperimentHealthSchema.meta(Unrestricted20),
  provenance: AnalysisProvenanceSchema.meta(Unrestricted20)
}).meta(transientExperimentMeta("ExperimentAnalysisResult"));
var ExperimentSnapshotIdentitySchema = IdField.merge(TenantIdField).extend({
  created_at: z23.string().datetime().meta({ ...Unrestricted20, readOnly: true }),
  experiment_handle: HandleField.meta(Unrestricted20),
  experiment_version: z23.number().int().min(1).meta(Unrestricted20),
  metric_semantic_id: AnalyticsSemanticIdSchema.meta(Unrestricted20),
  metric_catalog_version: z23.string().min(1).max(64).meta(Unrestricted20),
  endpoint_version: z23.string().min(1).max(100).meta(Unrestricted20),
  query_hash: z23.string().min(1).max(128).meta(Unrestricted20),
  evidence_provider_handle: HandleField.meta(Unrestricted20),
  evidence_provider_type: z23.string().min(1).max(100).meta(Unrestricted20),
  evidence_provider_version: z23.string().min(1).max(100).meta(Unrestricted20),
  evidence_provider_contract_version: z23.number().int().min(1).meta(Unrestricted20),
  summary_schema_version: z23.number().int().min(1).meta(Unrestricted20),
  observation_window_start: z23.string().datetime().meta(Unrestricted20),
  observation_window_end: z23.string().datetime().meta(Unrestricted20),
  data_watermark: z23.string().datetime().meta(Unrestricted20)
});
var ExperimentEvidenceSnapshotSchema = ExperimentSnapshotIdentitySchema.extend({
  analysis_unit: AnalyticsAnalyticalUnitSchema.meta(Unrestricted20),
  evidence: ExperimentEvidenceSchema.meta(Unrestricted20)
}).meta({ id: "ExperimentEvidenceSnapshot", "x-revturbine-schema-persistence": Persisted14, "x-revturbine-schema-exposure": Internal17, ...EXPERIMENT_RESULT_FACETS });
var ExperimentAnalysisResultRecordSchema = ExperimentSnapshotIdentitySchema.extend({
  evidence_snapshot_id: z23.string().min(1).meta(Unrestricted20),
  analysis_provider_handle: HandleField.meta(Unrestricted20),
  analysis_provider_type: z23.string().min(1).max(100).meta(Unrestricted20),
  analysis_provider_version: z23.string().min(1).max(100).meta(Unrestricted20),
  analysis_provider_contract_version: z23.number().int().min(1).meta(Unrestricted20),
  engine: z23.string().min(1).max(100).meta(Unrestricted20),
  engine_version: z23.string().min(1).max(100).meta(Unrestricted20),
  estimator: z23.string().min(1).max(100).meta(Unrestricted20),
  estimator_version: z23.string().min(1).max(100).meta(Unrestricted20),
  analysis_config: ExperimentAnalysisConfigSchema.meta(Unrestricted20),
  result: ExperimentAnalysisResultSchema.meta(Unrestricted20)
}).meta({ id: "ExperimentAnalysisResultRecord", "x-revturbine-schema-persistence": Persisted14, "x-revturbine-schema-exposure": Internal17, ...EXPERIMENT_RESULT_FACETS });
var ExperimentSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z23.string().min(1).meta({ ...Unrestricted20, readOnly: true }),
  name: NameField.meta(Unrestricted20),
  handle: HandleField.meta(Unrestricted20),
  description: z23.string().max(1e3).optional().meta(Unrestricted20),
  experiment_type: ExperimentTypeSchema.meta(Unrestricted20),
  status: ExperimentStatusSchema.default("draft").meta(Unrestricted20),
  target_resource_id: z23.string().optional().meta(Unrestricted20),
  /** Canonical segment-handle references (plan 199 alias window). */
  target_segments: z23.array(z23.string()).optional().meta(Unrestricted20),
  /** @deprecated Read-only compatibility alias for `target_segments`. */
  target_segment_ids: z23.array(z23.string()).default([]).meta(Unrestricted20),
  variants: z23.array(ExperimentVariantSchema).min(2).meta(Unrestricted20),
  primary_metric: AnalyticsSemanticIdSchema.meta(Unrestricted20),
  guardrail_metrics: z23.array(AnalyticsSemanticIdSchema).optional().meta(Unrestricted20),
  assignment_unit: AnalyticsAnalyticalUnitSchema.optional().meta(Unrestricted20),
  assignment_provider_binding: ProviderBindingRefSchema.extend({
    capability: z23.literal("experiment_assignment"),
    allocation_mode: ExperimentAllocationModeSchema
  }).optional().meta(Unrestricted20),
  evidence_provider_binding: ProviderBindingRefSchema.extend({
    capability: z23.literal("experiment_evidence")
  }).optional().meta(Unrestricted20),
  analysis_provider_binding: ProviderBindingRefSchema.extend({
    capability: z23.literal("experiment_analysis")
  }).optional().meta(Unrestricted20),
  analysis_config: ExperimentAnalysisConfigSchema.optional().meta(Unrestricted20),
  // Lift below control that triggers the "Experiment trending negative"
  // Needs Attention rule (plan 02c). 0.05 = 5% relative lift below control.
  metric_threshold: z23.number().default(0.05).meta(Unrestricted20),
  secondary_metrics: z23.array(AnalyticsSemanticIdSchema).default([]).meta(Unrestricted20),
  traffic_allocation: z23.number().min(0).max(1).default(1).meta(Unrestricted20),
  started_at: NullableDatetimeField.meta(Unrestricted20),
  ended_at: NullableDatetimeField.meta(Unrestricted20),
  confidence_threshold: z23.number().min(0).max(1).default(0.95).meta(Unrestricted20),
  winning_variant_id: z23.string().nullable().default(null).meta(Unrestricted20),
  metadata: MetadataField.meta(Unrestricted20)
}).meta(
  { id: "Experiment", "x-revturbine-schema-persistence": Persisted14, "x-revturbine-schema-exposure": Internal17, ...PENDING_PLAYBOOK_SDK_FACETS3, ...namedIdentity() }
);
var ExperimentAnchorSchema = makeAnchor("ExperimentAnchor");
var SuggestionSeveritySchema = SeveritySchema;
var OptimizationSuggestionSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  experiment_id: z23.string().optional().meta(Unrestricted20),
  resource_type: z23.string().min(1).meta(Unrestricted20),
  resource_id: z23.string().min(1).meta(Unrestricted20),
  severity: SuggestionSeveritySchema.default("info").meta(Unrestricted20),
  title: z23.string().min(1).max(300).meta(Unrestricted20),
  description: z23.string().max(2e3).meta(Unrestricted20),
  suggested_action: z23.string().max(1e3).optional().meta(Unrestricted20),
  estimated_impact: z23.number().optional().meta(Unrestricted20),
  detector_id: z23.string().min(1).nullable().optional().meta(Unrestricted20),
  detector_version: z23.number().int().min(1).nullable().optional().meta(Unrestricted20),
  opportunity_type: z23.string().min(1).nullable().optional().meta(Unrestricted20),
  evidence: z23.array(OpportunityEvidenceSchema).nullable().optional().meta(Unrestricted20),
  hypothesis: z23.string().min(1).nullable().optional().meta(Unrestricted20),
  confidence: z23.number().min(0).max(1).nullable().optional().meta(Unrestricted20),
  is_dismissed: z23.boolean().default(false).meta(Unrestricted20),
  metadata: MetadataField.meta(Unrestricted20)
}).meta(
  { id: "OptimizationSuggestion", "x-revturbine-schema-persistence": Persisted14, "x-revturbine-schema-exposure": Internal17 }
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
      requestParams: { path: z23.object({ experimentId: z23.string() }) },
      summary: "Get experiment",
      tags: ["experiments"],
      responses: { "200": { description: "Experiment", content: { "application/json": { schema: ExperimentSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiments", persistence: { table: "experimentVersions", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateExperiment",
      requestParams: { path: z23.object({ experimentId: z23.string() }) },
      summary: "Update experiment",
      tags: ["experiments"],
      requestBody: { required: true, content: { "application/json": { schema: ExperimentSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: ExperimentSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiments", persistence: { table: "experimentVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteExperiment",
      requestParams: { path: z23.object({ experimentId: z23.string() }) },
      summary: "Delete experiment",
      tags: ["experiments"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiments", persistence: { table: "experimentVersions", mode: "delete" } }
    })
  },
  "/api/experiments/{experimentId}/start": {
    post: operation({
      operationId: "startExperiment",
      requestParams: { path: z23.object({ experimentId: z23.string() }) },
      summary: "Start experiment (begin traffic allocation)",
      tags: ["experiments"],
      responses: { "200": { description: "Started", content: { "application/json": { schema: ExperimentSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiments", persistence: { table: "experimentVersions", mode: "update" } }
    })
  },
  "/api/experiments/{experimentId}/pause": {
    post: operation({
      operationId: "pauseExperiment",
      requestParams: { path: z23.object({ experimentId: z23.string() }) },
      summary: "Pause running experiment",
      tags: ["experiments"],
      responses: { "200": { description: "Paused", content: { "application/json": { schema: ExperimentSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiments", persistence: { table: "experimentVersions", mode: "update" } }
    })
  },
  "/api/experiments/{experimentId}/complete": {
    post: operation({
      operationId: "completeExperiment",
      requestParams: { path: z23.object({ experimentId: z23.string() }) },
      summary: "Complete experiment and declare winner",
      tags: ["experiments"],
      requestBody: { required: true, content: { "application/json": { schema: z23.object({ winning_variant_id: z23.string() }) } } },
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
      requestParams: { path: z23.object({ suggestionId: z23.string() }) },
      summary: "Dismiss an optimization suggestion",
      tags: ["experiments"],
      responses: { "200": { description: "Dismissed", content: { "application/json": { schema: OptimizationSuggestionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "optimization-suggestions", persistence: { table: "optimizationSuggestions", mode: "update" } }
    })
  }
};

// ../scaffold/src/promotions/models/schema.ts
import { z as z24 } from "zod";
var { Unrestricted: Unrestricted21, Financial: Financial5 } = DataClassification;
var { Persisted: Persisted15, Transient: Transient21 } = SchemaPersistence;
var { Internal: Internal18 } = SchemaExposure;
var PLAYBOOK_SDK_FACETS7 = schemaFacets(SchemaContext.Playbook, { sdkInput: true });
var PromotionStatusSchema = z24.enum(["draft", "scheduled", "live", "expired", "archived"]).meta(
  { id: "PromotionStatus", "x-revturbine-schema-persistence": Transient21, "x-revturbine-schema-exposure": Internal18 }
);
var DiscountTypeSchema = z24.enum(["percentage", "fixed_amount", "free_months"]).meta(
  { id: "DiscountType", "x-revturbine-schema-persistence": Transient21, "x-revturbine-schema-exposure": Internal18 }
);
var PromotionSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z24.string().min(1).meta({ ...Unrestricted21, readOnly: true }),
  name: NameField.meta(Unrestricted21),
  handle: HandleField.meta(Unrestricted21),
  description: z24.string().max(1e3).optional().meta(Unrestricted21),
  rt_status: PromotionStatusSchema.default("draft").meta(Unrestricted21),
  discount_type: DiscountTypeSchema.meta(Unrestricted21),
  discount_value: z24.number().min(0).meta(Financial5),
  currency: z24.string().length(3).default("USD").meta(Financial5),
  applicable_plan_ids: z24.array(z24.string()).default([]).meta(Unrestricted21),
  applicable_addon_ids: z24.array(z24.string()).default([]).meta(Unrestricted21),
  target_segment_ids: z24.array(z24.string()).default([]).meta(Unrestricted21),
  max_redemptions: z24.number().int().min(0).nullable().default(null).meta(Unrestricted21),
  current_redemptions: z24.number().int().min(0).default(0).meta({ ...Unrestricted21, readOnly: true }),
  coupon_code: z24.string().max(100).optional().meta(Unrestricted21),
  starts_at: NullableDatetimeField.meta(Unrestricted21),
  ends_at: NullableDatetimeField.meta(Unrestricted21),
  // Stripe integration
  stripe_coupon_id: z24.string().nullable().default(null).meta(Unrestricted21),
  stripe_promotion_code_id: z24.string().nullable().default(null).meta(Unrestricted21),
  auto_sync_stripe: z24.boolean().default(false).meta(Unrestricted21),
  metadata: MetadataField.meta(Unrestricted21)
}).meta(
  { id: "Promotion", "x-revturbine-schema-persistence": Persisted15, "x-revturbine-schema-exposure": Internal18, ...PLAYBOOK_SDK_FACETS7, ...namedIdentity() }
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
      requestParams: { path: z24.object({ promotionId: z24.string() }) },
      summary: "Get promotion",
      tags: ["promotions"],
      responses: { "200": { description: "Promotion", content: { "application/json": { schema: PromotionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "promotions", persistence: { table: "promotionVersions", mode: "get" } }
    }),
    patch: operation({
      operationId: "updatePromotion",
      requestParams: { path: z24.object({ promotionId: z24.string() }) },
      summary: "Update promotion",
      tags: ["promotions"],
      requestBody: { required: true, content: { "application/json": { schema: PromotionSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: PromotionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "promotions", persistence: { table: "promotionVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deletePromotion",
      requestParams: { path: z24.object({ promotionId: z24.string() }) },
      summary: "Delete (archive) promotion",
      tags: ["promotions"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "promotions", persistence: { table: "promotionVersions", mode: "delete" } }
    })
  },
  "/api/promotions/{promotionId}/sync-stripe": {
    post: operation({
      operationId: "syncPromotionToStripe",
      requestParams: { path: z24.object({ promotionId: z24.string() }) },
      summary: "Sync promotion to Stripe as coupon/promotion code",
      tags: ["promotions"],
      responses: { "200": { description: "Synced", content: { "application/json": { schema: PromotionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "promotions", persistence: { table: "promotionVersions", mode: "update" } }
    })
  },
  "/api/promotions/{promotionId}/duplicate": {
    post: operation({
      operationId: "duplicatePromotion",
      requestParams: { path: z24.object({ promotionId: z24.string() }) },
      summary: "Duplicate promotion",
      tags: ["promotions"],
      responses: { "201": { description: "Duplicated", content: { "application/json": { schema: PromotionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "promotions", persistence: { table: "promotionVersions", mode: "create" } }
    })
  }
};

// ../scaffold/src/config/models/schema.ts
import { z as z25 } from "zod";
var { Unrestricted: Unrestricted22 } = DataClassification;
var { Persisted: Persisted16, Transient: Transient22 } = SchemaPersistence;
var { Internal: Internal19, External: External11 } = SchemaExposure;
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
  anchor_id: z25.string().min(1).meta({ ...Unrestricted22, readOnly: true }),
  name: NameField.meta(Unrestricted22),
  handle: HandleField.meta(Unrestricted22),
  description: DescriptionField.meta(Unrestricted22),
  is_default: z25.boolean().default(false).meta(Unrestricted22),
  entitlement_ids: z25.array(z25.string()).default([]).meta(Unrestricted22),
  metadata: MetadataField.meta(Unrestricted22)
}).meta(
  { id: "SeatType", "x-revturbine-schema-persistence": Persisted16, "x-revturbine-schema-exposure": Internal19, ...PENDING_PLAYBOOK_FACETS4, ...namedIdentity() }
);
var SeatTypeAnchorSchema = makeAnchor("SeatTypeAnchor");
var PersonalizationTokenSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z25.string().min(1).meta({ ...Unrestricted22, readOnly: true }),
  handle: HandleField.meta(Unrestricted22),
  label: z25.string().min(1).meta(Unrestricted22),
  description: z25.string().nullable().default(null).meta(Unrestricted22),
  category: z25.enum(["user", "plan", "usage", "trial", "billing", "promotion", "custom"]).meta(Unrestricted22),
  data_source: z25.string().nullable().default(null).meta(Unrestricted22),
  example_value: z25.string().nullable().default(null).meta(Unrestricted22),
  value_map: z25.record(z25.string(), z25.string()).default({}).meta(Unrestricted22),
  format: z25.enum(["string", "number", "currency", "percentage", "date"]).nullable().default(null).meta(Unrestricted22),
  metadata: MetadataField.meta(Unrestricted22)
}).meta(
  { id: "PersonalizationToken", "x-revturbine-schema-persistence": Persisted16, "x-revturbine-schema-exposure": Internal19, ...PENDING_PLAYBOOK_FACETS4, ...namedIdentity() }
);
var PersonalizationTokenAnchorSchema = makeAnchor("PersonalizationTokenAnchor");
var OnboardingStateSchema = z25.enum(["not_started", "started", "details_submitted", "charges_enabled", "activated", "deauthorized"]).meta({ id: "OnboardingState", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": Internal19 });
var StripeIntegrationConfigSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  handle: HandleField.meta({ ...Unrestricted22, readOnly: true }),
  stripe_account_id: z25.string().min(1).meta(Unrestricted22),
  live_mode: z25.boolean().default(false).meta(Unrestricted22),
  /** Funnel state for the Connect onboarding pipeline. */
  onboarding_state: OnboardingStateSchema.default("not_started").meta({ ...Unrestricted22, readOnly: true }),
  /** Connect onboarding status — tracks whether hosted onboarding is complete. */
  onboarding_complete: z25.boolean().default(false).meta({ ...Unrestricted22, readOnly: true }),
  /** Whether the connected account can process charges (read from Stripe). */
  charges_enabled: z25.boolean().default(false).meta({ ...Unrestricted22, readOnly: true }),
  /** Whether the connected account has details submitted (read from Stripe). */
  details_submitted: z25.boolean().default(false).meta({ ...Unrestricted22, readOnly: true }),
  /** Whether the connected account can receive payouts (read from Stripe). */
  payouts_enabled: z25.boolean().default(false).meta({ ...Unrestricted22, readOnly: true }),
  webhook_secret_set: z25.boolean().default(false).meta({ ...Unrestricted22, readOnly: true }),
  sync_products: z25.boolean().default(true).meta(Unrestricted22),
  sync_prices: z25.boolean().default(true).meta(Unrestricted22),
  sync_subscriptions: z25.boolean().default(true).meta(Unrestricted22),
  sync_invoices: z25.boolean().default(false).meta(Unrestricted22),
  default_currency: z25.string().length(3).default("USD").meta(Unrestricted22),
  tax_behavior: z25.enum(["inclusive", "exclusive", "unspecified"]).default("unspecified").meta(Unrestricted22),
  /** ISO timestamp of the last successful full data sync from Stripe. */
  last_sync_at: z25.string().optional().meta({ ...Unrestricted22, readOnly: true }),
  metadata: MetadataField.meta(Unrestricted22)
}).meta(
  { id: "StripeIntegrationConfig", "x-revturbine-schema-persistence": Persisted16, "x-revturbine-schema-exposure": Internal19, ...BILLING_FACETS2, ...mintedIdentity() }
);
var BrandingConfigSchema = z25.object({
  theme: z25.record(z25.string(), z25.unknown()).optional().meta(Unrestricted22),
  workspace_name: z25.string().optional().meta(Unrestricted22),
  logo_url: z25.string().optional().meta(Unrestricted22),
  support_email: z25.string().optional().meta(Unrestricted22)
}).meta(
  {
    id: "BrandingConfig",
    "x-revturbine-schema-persistence": Transient22,
    "x-revturbine-schema-exposure": External11,
    ...BRANDING_FACETS2
  }
);
var MeteringConfigSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  handle: HandleField.meta({ ...Unrestricted22, readOnly: true }),
  entitlement_id: z25.string().min(1).meta(Unrestricted22),
  meter_key: z25.string().min(1).max(100).meta(Unrestricted22),
  aggregation_type: z25.enum(["sum", "count", "max", "last_value"]).default("sum").meta(Unrestricted22),
  reset_period: z25.enum(["none", "daily", "weekly", "monthly", "yearly"]).default("monthly").meta(Unrestricted22),
  stripe_meter_id: z25.string().nullable().default(null).meta(Unrestricted22),
  is_active: z25.boolean().default(true).meta(Unrestricted22),
  metadata: MetadataField.meta(Unrestricted22)
}).meta(
  { id: "MeteringConfig", "x-revturbine-schema-persistence": Persisted16, "x-revturbine-schema-exposure": Internal19, ...METERING_FACETS, ...mintedIdentity() }
);
var EnforcementActionSchema = z25.enum(["block", "warn", "downgrade", "throttle", "notify_admin", "custom"]).meta(
  { id: "EnforcementAction", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": Internal19 }
);
var UsageEnforcementSettingsSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z25.string().min(1).meta({ ...Unrestricted22, readOnly: true }),
  handle: HandleField.meta({ ...Unrestricted22, readOnly: true }),
  entitlement_id: z25.string().min(1).meta(Unrestricted22),
  soft_limit_percent: z25.number().min(0).max(100).default(80).meta(Unrestricted22),
  hard_limit_percent: z25.number().min(0).max(100).default(100).meta(Unrestricted22),
  soft_limit_action: EnforcementActionSchema.default("warn").meta(Unrestricted22),
  hard_limit_action: EnforcementActionSchema.default("block").meta(Unrestricted22),
  grace_period_hours: z25.number().int().min(0).default(0).meta(Unrestricted22),
  notification_channels: z25.array(z25.enum(["email", "in_app", "webhook"])).default(["in_app"]).meta(Unrestricted22),
  is_active: z25.boolean().default(true).meta(Unrestricted22)
}).meta(
  { id: "UsageEnforcementSettings", "x-revturbine-schema-persistence": Persisted16, "x-revturbine-schema-exposure": Internal19, ...PENDING_PLAYBOOK_SDK_FACETS4, ...mintedIdentity() }
);
var UsageEnforcementSettingsAnchorSchema = makeAnchor("UsageEnforcementSettingsAnchor");
var PlacementSettingsCapRuleGroupItemSchema = z25.object({
  kind: z25.enum(["template", "slot"]).meta(Unrestricted22),
  id: z25.string().min(1).meta(Unrestricted22),
  label: z25.string().min(1).optional().meta(Unrestricted22)
}).meta(
  { id: "PlacementSettingsCapRuleGroupItem", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": Internal19 }
);
var PlacementSettingsCapRuleSchema = z25.object({
  id: z25.string().min(1).meta(Unrestricted22),
  group: z25.array(PlacementSettingsCapRuleGroupItemSchema).min(1).meta(Unrestricted22),
  cap: z25.object({
    count: z25.number().int().min(1).meta(Unrestricted22),
    period: z25.enum(["session", "day", "week", "month"]).meta(Unrestricted22)
  }).meta(Unrestricted22)
}).meta(
  { id: "PlacementSettingsCapRule", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": Internal19 }
);
var PlacementTestModeSchema = z25.enum(["off", "test_users", "all_traffic"]).meta(
  { id: "PlacementTestMode", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": Internal19 }
);
var PlacementSettingsCapStateSchema = z25.object({
  capRules: z25.array(PlacementSettingsCapRuleSchema).default([]).meta(Unrestricted22),
  sessionCooldownMinutes: z25.number().int().min(0).default(30).meta(Unrestricted22),
  // Tenant-level default remind-me-later (defer) window, in minutes. A
  // per-payload `remind_later_minutes` overrides it when set (plan 167 REQ-6,
  // Q-3). Rides in this global_frequency_cap jsonb wrapper — no column/`.fbs`.
  remindLaterMinutes: z25.number().int().min(0).default(60).meta(Unrestricted22),
  testMode: PlacementTestModeSchema.default("off").meta(Unrestricted22)
}).meta(
  { id: "PlacementSettingsCapState", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": Internal19 }
);
var PlacementSettingsSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z25.string().min(1).meta({ ...Unrestricted22, readOnly: true }),
  handle: HandleField.meta({ ...Unrestricted22, readOnly: true }),
  global_frequency_cap: PlacementSettingsCapStateSchema.nullable().default(null).meta(Unrestricted22),
  // Legacy companion column kept for migration continuity. The new
  // wrapper-object encoding above carries period information per
  // cap rule; this column is always null in v0.1.20+ writes.
  global_frequency_cap_period: z25.enum(["hour", "day", "week", "month", "session"]).nullable().default(null).meta(Unrestricted22),
  suppress_for_paid: z25.boolean().default(false).meta(Unrestricted22),
  suppress_for_trial: z25.boolean().default(false).meta(Unrestricted22),
  // `default_dismiss_cooldown_hours` removed (plan 167 Q-2): the dismiss
  // cooldown is defined per-payload in days (`cooldown_after_dismiss_days`).
  allow_stacking: z25.boolean().default(false).meta(Unrestricted22),
  priority_collision_strategy: z25.enum(["highest_priority", "most_recent", "random"]).default("highest_priority").meta(Unrestricted22)
}).meta(
  { id: "PlacementSettings", "x-revturbine-schema-persistence": Persisted16, "x-revturbine-schema-exposure": Internal19, ...PENDING_PLAYBOOK_SDK_FACETS4, ...mintedIdentity() }
);
var PlacementSettingsAnchorSchema = makeAnchor("PlacementSettingsAnchor");
var RevTurbineConfigSegmentsItemPredicatesItemSchema = z25.object({
  field: z25.string().min(1).meta(Unrestricted22),
  operator: z25.enum(["eq", "neq", "gt", "lt", "gte", "lte", "contains", "in"]).meta(Unrestricted22),
  value: z25.string().meta(Unrestricted22)
}).meta(
  { id: "RevTurbineConfigSegmentsItemPredicatesItem", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigSegmentsItemSchema = z25.object({
  // Plan 120 TASK-4: the config carries the handle as its sole logical
  // identifier — the redundant config-level `id` is dropped. The physical
  // UUID primary key stays in the persisted (Drizzle) row, never the config.
  name: z25.string().min(1).meta(Unrestricted22),
  handle: z25.string().min(1).meta(Unrestricted22),
  predicates: z25.array(RevTurbineConfigSegmentsItemPredicatesItemSchema).optional().meta(Unrestricted22),
  // Dimension this segment belongs to (plan #39 REQ-28 / Route A). Optional
  // for back-compat: pre-plan-39 RevTurbineConfigs and segments not yet
  // categorised lack it. The entitlement-rule evaluator uses this to
  // apply intra-dimension OR + cross-dimension AND per spec §2.5; when
  // missing across all of a rule's segment_ids, the evaluator falls
  // back to flat-OR (legacy single-segment behaviour).
  dimension_id: z25.string().optional().meta(Unrestricted22),
  // Experiment enrollment carries the canonical, version-stable handle.
  // The old name stays readable through plan 199's alias window.
  experiment_handle: z25.string().min(1).optional().meta(Unrestricted22),
  /** @deprecated Read-only compatibility alias for `experiment_handle`. */
  experiment_id: z25.string().min(1).optional().meta(Unrestricted22)
}).meta(
  { id: "RevTurbineConfigSegmentsItem", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigPlansItemSchema = z25.object({
  // Plan 120 TASK-4: `unique_handle` is the sole logical identifier; the
  // redundant config-level `id` is dropped (physical UUID PK stays in the row).
  unique_handle: z25.string().min(1).meta(Unrestricted22),
  name: z25.string().min(1).meta(Unrestricted22),
  tier_position: z25.number().int().min(0).default(0).meta(Unrestricted22),
  sort_order: z25.number().int().min(0).default(0).meta(Unrestricted22),
  // Plan-level visibility (to_do/91 Part B). Lives on the plan, not a
  // priced variation, so a free/custom tier with no variation can still be
  // marked unlisted/legacy and round-trip. Variations may still carry their
  // own visibility for per-price overrides; this is the plan's default.
  visibility: PlanVisibilitySchema.default("public").meta(Unrestricted22)
}).meta(
  { id: "RevTurbineConfigPlansItem", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigAddonsItemSchema = z25.object({
  // Plan 120 TASK-4: `unique_handle` is the sole logical identifier; the
  // redundant config-level `id` is dropped (physical UUID PK stays in the row).
  unique_handle: z25.string().min(1).meta(Unrestricted22),
  name: z25.string().min(1).meta(Unrestricted22),
  sort_order: z25.number().int().min(0).default(0).meta(Unrestricted22),
  // Add-on visibility (to_do/91 Part B) — same rationale as plans: metadata,
  // not price, so it lives in the config independent of addon_variations.
  visibility: PlanVisibilitySchema.default("public").meta(Unrestricted22)
}).meta(
  { id: "RevTurbineConfigAddonsItem", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11, ...PLAYBOOK_AUTHORING_FACETS2 }
);
var RevTurbineConfigPlanVariationsItemSchema = z25.object({
  handle: z25.string().min(1).meta(Unrestricted22),
  plan_handle: z25.string().min(1).meta(Unrestricted22),
  billing_period: z25.enum(["monthly", "annual", "one_time", "custom"]).meta(Unrestricted22),
  segment_handle: z25.string().nullable().default(null).meta(Unrestricted22),
  price_amount: z25.number().min(0).meta(Unrestricted22),
  pricing_model: PricingModelSchema.meta(Unrestricted22),
  visibility: PlanVisibilitySchema.default("public").meta(Unrestricted22),
  stripe_price_id: z25.string().nullable().default(null).meta(Unrestricted22),
  price_source: PriceSourceSchema.meta(Unrestricted22)
}).meta(
  { id: "RevTurbineConfigPlanVariationsItem", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11, ...PENDING_PLAYBOOK_FACETS4 }
);
var RevTurbineConfigAddonVariationsItemSchema = z25.object({
  handle: z25.string().min(1).meta(Unrestricted22),
  addon_handle: z25.string().min(1).meta(Unrestricted22),
  billing_period: z25.enum(["monthly", "annual", "one_time", "custom"]).meta(Unrestricted22),
  segment_handle: z25.string().nullable().default(null).meta(Unrestricted22),
  price_amount: z25.number().min(0).meta(Unrestricted22),
  pricing_model: PricingModelSchema.meta(Unrestricted22),
  visibility: PlanVisibilitySchema.default("public").meta(Unrestricted22),
  stripe_price_id: z25.string().nullable().default(null).meta(Unrestricted22),
  price_source: PriceSourceSchema.meta(Unrestricted22)
}).meta(
  { id: "RevTurbineConfigAddonVariationsItem", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11, ...PENDING_PLAYBOOK_FACETS4 }
);
var RevTurbineConfigSeatTypesItemSchema = z25.object({
  handle: z25.string().min(1).meta(Unrestricted22),
  name: z25.string().min(1).meta(Unrestricted22),
  description: z25.string().nullable().default(null).meta(Unrestricted22),
  is_default: z25.boolean().default(false).meta(Unrestricted22),
  entitlement_handles: z25.array(z25.string()).default([]).meta(Unrestricted22)
}).meta(
  { id: "RevTurbineConfigSeatTypesItem", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigEnforcementDefaultsItemSchema = z25.object({
  handle: z25.string().min(1).meta(Unrestricted22),
  entitlement_handle: z25.string().nullable().default(null).meta(Unrestricted22),
  soft_limit_percent: z25.number().int().min(0).nullable().default(null).meta(Unrestricted22),
  hard_limit_percent: z25.number().int().min(0).nullable().default(null).meta(Unrestricted22),
  soft_limit_action: z25.string().meta(Unrestricted22),
  hard_limit_action: z25.string().meta(Unrestricted22),
  grace_period_hours: z25.number().int().min(0).nullable().default(null).meta(Unrestricted22),
  notification_channels: z25.array(z25.string()).default([]).meta(Unrestricted22),
  is_active: z25.boolean().default(true).meta(Unrestricted22)
}).meta(
  { id: "RevTurbineConfigEnforcementDefaultsItem", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigPlacementSettingsItemSchema = z25.object({
  handle: z25.string().min(1).meta(Unrestricted22),
  global_frequency_cap: PlacementSettingsCapStateSchema.nullable().default(null).meta(Unrestricted22),
  global_frequency_cap_period: z25.enum(["hour", "day", "week", "month", "session"]).nullable().default(null).meta(Unrestricted22),
  suppress_for_paid: z25.boolean().default(false).meta(Unrestricted22),
  suppress_for_trial: z25.boolean().default(false).meta(Unrestricted22),
  // `default_dismiss_cooldown_hours` removed (plan 167 Q-2).
  allow_stacking: z25.boolean().default(false).meta(Unrestricted22),
  priority_collision_strategy: z25.string().nullable().default(null).meta(Unrestricted22)
}).meta(
  { id: "RevTurbineConfigPlacementSettingsItem", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigSegmentDimensionsItemSchema = z25.object({
  handle: z25.string().min(1).meta(Unrestricted22),
  name: z25.string().min(1).meta(Unrestricted22),
  category: z25.string().nullable().default(null).meta(Unrestricted22),
  visibility_toggle: z25.boolean().default(true).meta(Unrestricted22),
  source_type: z25.string().nullable().default(null).meta(Unrestricted22)
}).meta(
  { id: "RevTurbineConfigSegmentDimensionsItem", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigMeterBindingsItemSchema = z25.object({
  handle: z25.string().min(1).meta(Unrestricted22),
  entitlement_handle: z25.string().min(1).meta(Unrestricted22),
  meter_handle: z25.string().min(1).meta(Unrestricted22),
  limit: z25.number().int().min(0).nullable().default(null).meta(Unrestricted22),
  reset_period: z25.string().nullable().default(null).meta(Unrestricted22)
}).meta(
  { id: "RevTurbineConfigMeterBindingsItem", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigEntitlementsItemSchema = z25.object({
  // Plan 120 TASK-4: `unique_handle` is the sole logical identifier; the
  // redundant config-level `id` is dropped (physical UUID PK stays in the row).
  unique_handle: z25.string().min(1).meta(Unrestricted22),
  name: z25.string().min(1).meta(Unrestricted22),
  type: EntitlementTypeSchema.meta(Unrestricted22),
  unit: z25.string().optional().meta(Unrestricted22),
  // Ordered tier ladder for a `capability_tier` entitlement — projection of
  // the authored `EntitlementSchema.tier_definitions` (plan 138 TASK-4).
  // ARRAY ORDER IS THE RANK: the `entitlement_gate.tier_threshold` placement
  // trigger fires when the user's current tier ranks below the threshold tier
  // on this ladder. `name`/`description` are UI-helper denormalizations (plan
  // 118); the runtime gate reads only the ordered `handle`s.
  tier_definitions: z25.array(z25.object({
    name: z25.string(),
    handle: z25.string(),
    description: z25.string().optional()
  })).optional().meta(Unrestricted22)
}).meta(
  { id: "RevTurbineConfigEntitlementsItem", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigEntitlementRulesItemSchema = z25.object({
  id: z25.string().min(1).meta(Unrestricted22),
  entitlement_id: z25.string().min(1).meta(Unrestricted22),
  targets: z25.array(EntitlementRuleTargetSchema).min(1).meta(Unrestricted22),
  // Plan #39 REQ-1: multi-segment scoping per spec §2.5. Empty array
  // means "match all users" (replaces the singular `segment_id` field
  // and its 'all'/null sentinels).
  segment_ids: z25.array(z25.string()).default([]).meta(Unrestricted22),
  // ── Derived denormalizations from the parent entitlement (plan 147, OQ-6).
  // Resolved via `entitlement_id` on export; ignored on import (the entitlement
  // is authoritative). `readOnly` → excluded from round-trip obligations: they
  // are computed, not authored, so requiring a sentinel to preserve them would
  // test derivation rather than authoring fidelity.
  kind: EntitlementTypeSchema.optional().meta({ ...Unrestricted22, readOnly: true }),
  unit: z25.string().optional().meta({ ...Unrestricted22, readOnly: true }),
  tier_name: z25.string().optional().meta({ ...Unrestricted22, readOnly: true }),
  tier_description: z25.string().optional().meta({ ...Unrestricted22, readOnly: true }),
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
  current_usage: z25.number().default(0).meta(Unrestricted22),
  /** How usage is partitioned across the identity hierarchy. */
  allocation: UsageAllocationSchema.optional().meta(Unrestricted22)
}).meta(
  { id: "RevTurbineConfigEntitlementRulesItem", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigSlotConfigsItemSchema = z25.object({
  slot_id: z25.string().min(1).meta(Unrestricted22),
  active: z25.boolean().meta(Unrestricted22),
  triggers: z25.array(z25.string()).meta(Unrestricted22)
}).meta(
  { id: "RevTurbineConfigSlotConfigsItem", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigPlacementSlotsItemSchema = z25.object({
  id: z25.string().min(1).meta(Unrestricted22),
  label: z25.string().min(1).meta(Unrestricted22),
  description: z25.string().meta(Unrestricted22),
  surface_type: z25.string().meta(Unrestricted22),
  placement_handle: z25.string().min(1).meta(Unrestricted22),
  template: z25.string().optional().meta(Unrestricted22)
}).meta(
  { id: "RevTurbineConfigPlacementSlotsItem", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigSurfaceTemplatesItemFieldsItemSchema = z25.object({
  name: z25.string().min(1).meta(Unrestricted22),
  type: z25.string().optional().meta(Unrestricted22),
  required: z25.boolean().optional().meta(Unrestricted22)
}).meta(
  { id: "RevTurbineConfigSurfaceTemplatesItemFieldsItem", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigSurfaceTemplatesItemSchema = z25.object({
  id: z25.string().min(1).meta(Unrestricted22),
  surface_type: z25.string().meta(Unrestricted22),
  fields: z25.array(RevTurbineConfigSurfaceTemplatesItemFieldsItemSchema).optional().meta(Unrestricted22)
}).meta(
  { id: "RevTurbineConfigSurfaceTemplatesItem", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigUiPathActionTypeSchema = z25.enum([
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
  { id: "RevTurbineConfigUiPathActionType", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11 }
);
var ContentUiPathSchema = z25.object({
  name: z25.string().min(1).meta(Unrestricted22),
  action_type: RevTurbineConfigUiPathActionTypeSchema.meta(Unrestricted22),
  plan_handle: z25.string().optional().meta(Unrestricted22),
  promotion_id: z25.string().optional().meta(Unrestricted22),
  placement_handle: z25.string().optional().meta(Unrestricted22),
  url: z25.string().optional().meta(Unrestricted22),
  tour_id: z25.string().optional().meta(Unrestricted22),
  target_billing_period: z25.enum(["monthly", "annual"]).optional().meta(Unrestricted22),
  description: z25.string().optional().meta(Unrestricted22)
}).meta(
  { id: "ContentUiPath", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11, ...PLAYBOOK_SDK_FACETS8 }
);
var ContentPromotionSchema = z25.object({
  id: z25.string().meta(Unrestricted22),
  name: z25.string().meta(Unrestricted22),
  discount: z25.string().meta(Unrestricted22),
  type: z25.string().meta(Unrestricted22),
  status: z25.string().meta(Unrestricted22)
}).meta(
  { id: "ContentPromotion", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigPersonalizationTokensItemSchema = z25.object({
  token: z25.string().regex(/^[a-z][a-z0-9_]*$/).meta(Unrestricted22),
  label: z25.string().min(1).meta(Unrestricted22),
  description: z25.string().optional().meta(Unrestricted22),
  category: z25.enum(["user", "plan", "usage", "trial", "billing", "promotion", "custom"]).meta(Unrestricted22),
  data_source: z25.string().optional().meta(Unrestricted22),
  example_value: z25.string().optional().meta(Unrestricted22),
  value_map: z25.record(z25.string(), z25.string()).optional().meta(Unrestricted22),
  format: z25.enum(["string", "number", "currency", "percentage", "date"]).optional().meta(Unrestricted22)
}).meta(
  { id: "RevTurbineConfigPersonalizationTokensItem", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11, ...PLAYBOOK_SDK_FACETS8 }
);
var MessageBlockContentSchema = z25.object({
  header: z25.string().optional().meta(Unrestricted22),
  body: z25.string().optional().meta(Unrestricted22),
  cta_label: z25.string().optional().meta(Unrestricted22),
  secondary_cta_label: z25.string().optional().meta(Unrestricted22)
}).catchall(z25.unknown()).meta(
  { id: "MessageBlockContent", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11 }
);
var MessageBlockSchema = z25.object({
  block_id: z25.string().min(1).meta(Unrestricted22),
  tenant_id: z25.string().min(1).meta(Unrestricted22),
  name: z25.string().min(1).meta(Unrestricted22),
  surface_template_id: z25.string().optional().meta(Unrestricted22),
  default_content: MessageBlockContentSchema.meta(Unrestricted22),
  segment_overrides: z25.array(z25.object({
    segment_value_id: z25.string(),
    content: MessageBlockContentSchema
  })).optional().meta(Unrestricted22),
  child_blocks: z25.array(z25.object({
    slot: z25.string(),
    block_id: z25.string()
  })).optional().meta(Unrestricted22),
  tokens_used: z25.array(z25.string()).optional().meta(Unrestricted22),
  status: z25.enum(["draft", "active", "archived"]).meta(Unrestricted22),
  created_at: z25.string().datetime().meta({ ...Unrestricted22, readOnly: true }),
  updated_at: z25.string().datetime().meta({ ...Unrestricted22, readOnly: true })
}).meta(
  { id: "MessageBlock", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigStudioCtaConfigSchema = z25.object({
  label: z25.string().meta(Unrestricted22),
  path: CtaActionTypeSchema.meta(Unrestricted22),
  config: z25.record(z25.string(), z25.string()).optional().meta(Unrestricted22)
}).meta(
  { id: "RevTurbineConfigStudioCtaConfig", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigStudioPayloadSurfaceSchema = z25.object({
  template_id: z25.string().min(1).meta(Unrestricted22),
  fields: z25.record(z25.string(), z25.string()).meta(Unrestricted22),
  ctas: z25.array(RevTurbineConfigStudioCtaConfigSchema).meta(Unrestricted22)
}).meta(
  { id: "RevTurbineConfigStudioPayloadSurface", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigStudioPayloadTargetSchema = z25.object({
  plan_ids: z25.array(z25.string()).meta(Unrestricted22),
  // Billing-cadence dimension of the Plan Filter (spec §3.1.1 Target).
  // Empty/absent = no cadence filter. Optional so pre-plan-76 exports parse.
  billing_cadences: z25.array(z25.string()).optional().meta(Unrestricted22),
  segment_chips: z25.array(z25.string()).meta(Unrestricted22)
}).meta(
  { id: "RevTurbineConfigStudioPayloadTarget", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigPeriodCapSchema = z25.object({
  count: z25.number().int().min(1).meta(Unrestricted22),
  period: z25.enum(["session", "day", "week", "month", "lifetime"]).meta(Unrestricted22)
}).meta(
  { id: "RevTurbineConfigPeriodCap", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigStudioPayloadCapsSchema = z25.object({
  max_per_period: RevTurbineConfigPeriodCapSchema.optional().meta(Unrestricted22),
  cooldown_days: z25.number().int().min(0).optional().meta(Unrestricted22)
}).meta(
  { id: "RevTurbineConfigStudioPayloadCaps", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigStudioPayloadSchema = z25.object({
  id: z25.string().min(1).meta(Unrestricted22),
  target: RevTurbineConfigStudioPayloadTargetSchema.meta(Unrestricted22),
  surfaces: z25.array(RevTurbineConfigStudioPayloadSurfaceSchema).meta(Unrestricted22),
  caps: RevTurbineConfigStudioPayloadCapsSchema.optional().meta(Unrestricted22),
  // Optional slot targeting (spec §3.1.1): empty/absent = any compatible slot.
  surface_slot_ids: z25.array(z25.string()).optional().meta(Unrestricted22),
  // Per-payload remind-me-later override (minutes); absent = inherit tenant default (plan 167 Q-3).
  remind_later_minutes: z25.number().int().min(0).nullable().optional().meta(Unrestricted22),
  created_at: z25.string().optional().meta({ ...Unrestricted22, readOnly: true }),
  recommendation_strategy: z25.enum(["next_tier_up", "best_value", "custom"]).optional().default("next_tier_up").meta(Unrestricted22),
  recommendation_plan_override: z25.string().optional().meta(Unrestricted22)
}).meta(
  { id: "RevTurbineConfigStudioPayload", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigPlacementTriggerSchema = z25.discriminatedUnion("type", [
  z25.object({ type: z25.literal("surface_render"), slot_id: z25.string().min(1) }),
  z25.object({ type: z25.literal("entitlement_gate"), entitlement_handle: z25.string().min(1), tier_threshold: z25.string().optional() }),
  z25.object({ type: z25.literal("usage_threshold"), entitlement_handle: z25.string().min(1), threshold_percent: ThresholdPercentField }),
  z25.object({ type: z25.literal("credit_threshold"), entitlement_handle: z25.string().min(1), threshold_percent: ThresholdPercentField }),
  z25.object({ type: z25.literal("seat_threshold"), entitlement_handle: z25.string().min(1), threshold_percent: ThresholdPercentField }),
  z25.object({ type: z25.literal("trial_started"), trial_type: z25.enum(["free", "reverse"]).optional() }),
  z25.object({ type: z25.literal("trial_progress"), progress_percent: z25.number().min(1).max(100) }),
  z25.object({ type: z25.literal("trial_ending"), days_before_end: z25.number().int().min(0) }),
  z25.object({ type: z25.literal("trial_ended") }),
  z25.object({ type: z25.literal("trial_converted") }),
  z25.object({ type: z25.literal("qualifier"), qualifier: z25.string().min(1) })
]).meta(
  { id: "RevTurbineConfigPlacementTrigger", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigPlacementCategorySchema = z25.enum(["fixed", "gated", "usage_credit_seat", "trials", "other_conversion", "retention"]).meta(
  { id: "RevTurbineConfigPlacementCategory", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigPlacementItemSchema = z25.object({
  id: z25.string().min(1).meta(Unrestricted22),
  name: z25.string().min(1).meta(Unrestricted22),
  category: RevTurbineConfigPlacementCategorySchema.meta(Unrestricted22),
  trigger: RevTurbineConfigPlacementTriggerSchema.meta(Unrestricted22),
  payloads: z25.array(RevTurbineConfigStudioPayloadSchema).meta(Unrestricted22),
  order: z25.number().int().min(0).meta(Unrestricted22)
}).meta(
  { id: "RevTurbineConfigPlacementItem", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigPlacementPayloadItemSchema = z25.object({
  payload_id: z25.string().min(1).meta(Unrestricted22),
  placement_id: z25.string().min(1).meta(Unrestricted22),
  target: RevTurbineConfigStudioPayloadTargetSchema.meta(Unrestricted22),
  caps: RevTurbineConfigStudioPayloadCapsSchema.optional().meta(Unrestricted22),
  // Per-payload remind-me-later override (minutes); absent = inherit tenant default (plan 167 Q-3).
  remind_later_minutes: z25.number().int().min(0).nullable().optional().meta(Unrestricted22),
  created_at: z25.string().meta({ ...Unrestricted22, readOnly: true }),
  updated_at: z25.string().datetime().optional().meta({ ...Unrestricted22, readOnly: true }),
  source_mode: z25.enum(["inline", "content_linked"]).meta(Unrestricted22),
  surfaces: z25.array(RevTurbineConfigStudioPayloadSurfaceSchema).optional().meta(Unrestricted22),
  // Optional slot targeting (spec §3.1.1): empty/absent = any compatible slot.
  surface_slot_ids: z25.array(z25.string()).optional().meta(Unrestricted22),
  content_link: z25.object({
    message_block_id: z25.string().optional(),
    ui_path_id: z25.string().optional(),
    promotion_id: z25.string().optional(),
    content_payload_id: z25.string().optional()
  }).optional().meta(Unrestricted22)
}).meta(
  { id: "RevTurbineConfigPlacementPayloadItem", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigExtensionRulesItemSchema = z25.object({
  kind: z25.string().min(1).meta(Unrestricted22),
  schema_version: z25.number().int().nonnegative().meta(Unrestricted22),
  config: z25.unknown().meta(Unrestricted22)
}).meta(
  { id: "RevTurbineConfigExtensionRulesItem", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11, ...PLAYBOOK_SDK_FACETS8 }
);
var RevTurbineConfigFreeTrialRuleItemSchema = IdField.merge(FreeTrialRuleCoreFieldsSchema).meta(
  { id: "RevTurbineConfigFreeTrialRuleItem", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11, ...PENDING_PLAYBOOK_FACETS4 }
);
var RevTurbineConfigReverseTrialRuleItemSchema = IdField.merge(ReverseTrialRuleCoreFieldsSchema).meta(
  { id: "RevTurbineConfigReverseTrialRuleItem", "x-revturbine-schema-persistence": Transient22, "x-revturbine-schema-exposure": External11, ...PENDING_PLAYBOOK_FACETS4 }
);
var PlaybookBodySchema = z25.object({
  plans: z25.array(RevTurbineConfigPlansItemSchema).meta({ ...Unrestricted22, ...PLAYBOOK_SDK_FACETS8 }),
  // Optional for back-compat: pre-plan-88 configs (and the live export until web
  // adopts the new @revt-eng/schema) omit it. Add-on definitions only; pricing
  // (addon_variations) stays in the Stripe layer, like plan_variations.
  addons: z25.array(RevTurbineConfigAddonsItemSchema).optional().meta({ ...Unrestricted22, ...PLAYBOOK_AUTHORING_FACETS2 }),
  entitlements: z25.array(RevTurbineConfigEntitlementsItemSchema).meta({ ...Unrestricted22, ...PLAYBOOK_SDK_FACETS8 }),
  entitlement_rules: z25.array(RevTurbineConfigEntitlementRulesItemSchema).meta({ ...Unrestricted22, ...PLAYBOOK_SDK_FACETS8 }),
  segments: z25.array(RevTurbineConfigSegmentsItemSchema).meta({ ...Unrestricted22, ...PLAYBOOK_SDK_FACETS8 }),
  content_ui_paths: z25.array(ContentUiPathSchema).meta({ ...Unrestricted22, ...PLAYBOOK_SDK_FACETS8 }),
  slot_configs: z25.array(RevTurbineConfigSlotConfigsItemSchema).optional().meta({
    ...Unrestricted22,
    ...PLAYBOOK_SDK_FACETS8,
    ...schemaDeprecation({
      since: "0.1.117",
      replacement: "SDK-local activation/trigger state",
      removeAfter: "one compatibility window",
      reason: "Slot activation moved to SDK-local state (plan 118 TASK-6); no longer a Playbook authoring input."
    })
  }),
  content_overrides: z25.record(z25.string(), z25.record(z25.string(), z25.string())).optional().meta({
    ...Unrestricted22,
    ...PLAYBOOK_SDK_FACETS8,
    ...schemaDeprecation({
      since: "0.1.117",
      replacement: "Message Block / Placement Payload content",
      removeAfter: "one compatibility window",
      reason: "Content overrides moved to Message Block / Payload content (plan 118 TASK-6); no longer a Playbook authoring input."
    })
  }),
  theme: z25.record(z25.string(), z25.unknown()).optional().meta({
    ...Unrestricted22,
    ...LEGACY_BRANDING_FACETS,
    ...schemaDeprecation({
      since: "0.1.111",
      replacement: "SDK branding argument",
      removeAfter: "one compatibility window",
      reason: "Branding is independently owned and is not Playbook strategy."
    })
  }),
  placement_slots: z25.array(RevTurbineConfigPlacementSlotsItemSchema).optional().meta({ ...Unrestricted22, ...PLAYBOOK_SDK_FACETS8 }),
  message_blocks: z25.array(MessageBlockSchema).optional().meta({ ...Unrestricted22, ...PLAYBOOK_SDK_FACETS8 }),
  placement_payloads: z25.array(RevTurbineConfigPlacementPayloadItemSchema).optional().meta({ ...Unrestricted22, ...PLAYBOOK_SDK_FACETS8 }),
  placements: z25.array(RevTurbineConfigPlacementItemSchema).optional().meta({ ...Unrestricted22, ...PLAYBOOK_SDK_FACETS8 }),
  content_promotions: z25.array(ContentPromotionSchema).optional().meta({ ...Unrestricted22, ...PLAYBOOK_SDK_FACETS8 }),
  personalization_tokens: z25.array(RevTurbineConfigPersonalizationTokensItemSchema).optional().meta({ ...Unrestricted22, ...PLAYBOOK_SDK_FACETS8 }),
  surface_templates: z25.array(RevTurbineConfigSurfaceTemplatesItemSchema).optional().meta({ ...Unrestricted22, ...PLAYBOOK_SDK_FACETS8 }),
  /**
   * Free + reverse trial rule configurations (plan 43). Optional so
   * pre-trial-runtime configs continue to parse. /api/config/import
   * applies these to the tenant's free_trial_rules / reverse_trial_rules
   * tables; /api/config/export reads them out for round-trip.
   */
  free_trial_rules: z25.array(RevTurbineConfigFreeTrialRuleItemSchema).optional().meta({ ...Unrestricted22, ...PLAYBOOK_AUTHORING_FACETS2 }),
  reverse_trial_rules: z25.array(RevTurbineConfigReverseTrialRuleItemSchema).optional().meta({ ...Unrestricted22, ...PLAYBOOK_AUTHORING_FACETS2 }),
  // Plan / add-on variation prices carried by handle (plan 118 TASK-16). These
  // live on the legacy schema (not just the canonical Playbook body) so that a
  // legacy `version`-shaped config — the shape the demo-data configs and the
  // pre-sales/CLI upload flow still use — can carry variation prices through
  // normalization instead of having them stripped. Pending until web
  // import/export activates them (TASK-21).
  plan_variations: z25.array(RevTurbineConfigPlanVariationsItemSchema).optional().meta({ ...Unrestricted22, ...PLAYBOOK_AUTHORING_FACETS2 }),
  addon_variations: z25.array(RevTurbineConfigAddonVariationsItemSchema).optional().meta({ ...Unrestricted22, ...PLAYBOOK_AUTHORING_FACETS2 }),
  /**
   * Tagged-opaque rule entries (Phase 3 / strategy 2). Each entry is
   * dispatched to the corresponding `RuleAuthoringModule.kind` at
   * compile time; unknown kinds are skipped silently so authoring can
   * stage new kinds before the runtime catches up.
   */
  extension_rules: z25.array(RevTurbineConfigExtensionRulesItemSchema).optional().meta({ ...Unrestricted22, ...PLAYBOOK_SDK_FACETS8 }),
  // Authored-config projections carried as active SDK inputs (plan 118
  // TASK-13/18). Declared here (not only on PlaybookBody) so the Bundle
  // compiler — which lowers the legacy `RevTurbineConfig` view — reads them
  // with proper types. Projected into the RuleBundle; see core/bundle.
  seat_types: z25.array(RevTurbineConfigSeatTypesItemSchema).optional().meta({ ...Unrestricted22, ...PLAYBOOK_SDK_FACETS8 }),
  enforcement_defaults: z25.array(RevTurbineConfigEnforcementDefaultsItemSchema).optional().meta({ ...Unrestricted22, ...PLAYBOOK_SDK_FACETS8 }),
  placement_settings: z25.array(RevTurbineConfigPlacementSettingsItemSchema).optional().meta({ ...Unrestricted22, ...PLAYBOOK_SDK_FACETS8 }),
  segment_dimensions: z25.array(RevTurbineConfigSegmentDimensionsItemSchema).optional().meta({ ...Unrestricted22, ...PLAYBOOK_SDK_FACETS8 }),
  meter_bindings: z25.array(RevTurbineConfigMeterBindingsItemSchema).optional().meta({ ...Unrestricted22, ...PLAYBOOK_SDK_FACETS8 }),
  experiments: z25.array(z25.unknown()).max(0).optional().meta({
    ...Unrestricted22,
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
  signal_catalog: z25.object({}).strict().optional().meta({
    ...Unrestricted22,
    ...PENDING_PLAYBOOK_FACETS4
  })
}).meta(
  {
    id: "PlaybookBody",
    "x-revturbine-schema-persistence": Transient22,
    "x-revturbine-schema-exposure": External11,
    ...PLAYBOOK_SDK_FACETS8
  }
);
var PlaybookHeaderSchema = z25.object({
  artifact_type: z25.literal("playbook").meta({
    ...Unrestricted22,
    ...PLAYBOOK_VERSION_HEADER_FACETS,
    readOnly: true
  }),
  format_version: z25.literal(PLAYBOOK_FORMAT_VERSION).meta({
    ...Unrestricted22,
    ...PLAYBOOK_VERSION_HEADER_FACETS,
    readOnly: true
  }),
  playbook_handle: z25.string().min(1).default("default").meta({
    ...Unrestricted22,
    ...PLAYBOOK_VERSION_HEADER_FACETS
  }),
  playbook_version_id: z25.string().nullable().default(null).meta({
    ...Unrestricted22,
    ...PLAYBOOK_PROVENANCE_HEADER_FACETS,
    readOnly: true
  }),
  // Origin target identity (plan 131 TASK-10). Optional so a hand-authored /
  // legacy `export-config.json` (which carries no target) parses unchanged —
  // the plan 147 TASK-1 header reconciliation: the one config schema must
  // absorb legacy files that predate target stamping. Stamped by the server
  // on export when present.
  tenant_id: z25.string().min(1).optional().meta({
    ...Unrestricted22,
    ...PLAYBOOK_TARGET_FACETS,
    readOnly: true
  }),
  environment_id: z25.string().min(1).optional().meta({
    ...Unrestricted22,
    ...PLAYBOOK_TARGET_FACETS,
    readOnly: true
  }),
  project_id: z25.string().min(1).optional().meta({
    ...Unrestricted22,
    ...PLAYBOOK_TARGET_FACETS,
    readOnly: true
  }),
  exported_at: z25.string().datetime().optional().meta({
    ...Unrestricted22,
    ...PLAYBOOK_PROVENANCE_HEADER_FACETS,
    readOnly: true
  }),
  schema_version: z25.string().min(1).optional().meta({
    ...Unrestricted22,
    ...PLAYBOOK_VERSION_HEADER_FACETS,
    readOnly: true
  }),
  bundle_schema_version: z25.number().int().nonnegative().optional().meta({
    ...Unrestricted22,
    ...PLAYBOOK_VERSION_HEADER_FACETS,
    readOnly: true
  }),
  // Plan 177 TASK-3: the writer's declaration of the oldest reader
  // `SCHEMA_VERSION` that can correctly evaluate this payload. A runtime
  // refuses the payload when this floor exceeds the version it supports,
  // instead of partially applying config it cannot fully parse. Stamped by
  // the payload producer (`buildPlaybookPayload`); absent on hand-authored
  // configs, where readers treat the floor as `bundle_schema_version`.
  bundle_min_readable_schema_version: z25.number().int().nonnegative().optional().meta({
    ...Unrestricted22,
    ...PLAYBOOK_VERSION_HEADER_FACETS,
    readOnly: true
  })
}).meta(
  {
    id: "PlaybookHeader",
    "x-revturbine-schema-persistence": Transient22,
    "x-revturbine-schema-exposure": External11,
    ...PLAYBOOK_PROVENANCE_HEADER_FACETS
  }
);
var PlaybookObjectSchema = PlaybookHeaderSchema.extend(PlaybookBodySchema.shape).meta(
  {
    "x-revturbine-schema-persistence": Transient22,
    "x-revturbine-schema-exposure": External11,
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
var PlaybookSchema = z25.preprocess(normalizeConfigHeaderInput, PlaybookObjectSchema).meta({
  id: "Playbook",
  "x-revturbine-schema-persistence": Transient22,
  "x-revturbine-schema-exposure": External11,
  ...PLAYBOOK_SDK_FACETS8
});
var PlaybookStrictSchema = z25.preprocess(normalizeConfigHeaderInput, PlaybookObjectSchema.strict()).meta({
  id: "PlaybookStrict",
  "x-revturbine-schema-persistence": Transient22,
  "x-revturbine-schema-exposure": External11,
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
      requestParams: { path: z25.object({ id: z25.string() }) },
      summary: "Update seat type",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: SeatTypeSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: SeatTypeSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "seat-types", persistence: { table: "seatTypeVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteSeatType",
      requestParams: { path: z25.object({ id: z25.string() }) },
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
      requestParams: { path: z25.object({ id: z25.string() }) },
      summary: "Update personalization token",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: PersonalizationTokenSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: PersonalizationTokenSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "personalization-tokens", persistence: { table: "personalizationTokenVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deletePersonalizationToken",
      requestParams: { path: z25.object({ id: z25.string() }) },
      summary: "Delete personalization token",
      tags: ["config"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "personalization-tokens", persistence: { table: "personalizationTokenVersions", mode: "delete" } }
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
      requestParams: { path: z25.object({ meteringId: z25.string() }) },
      summary: "Update metering configuration",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: MeteringConfigSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: MeteringConfigSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "metering-config", persistence: { table: "meteringConfigs", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteMeteringConfig",
      requestParams: { path: z25.object({ meteringId: z25.string() }) },
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
      requestParams: { path: z25.object({ settingsId: z25.string() }) },
      summary: "Update usage enforcement settings",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: UsageEnforcementSettingsSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: UsageEnforcementSettingsSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "usage-enforcement", persistence: { table: "usageEnforcementSettingVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteUsageEnforcementSettings",
      requestParams: { path: z25.object({ settingsId: z25.string() }) },
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

// ../scaffold/src/changemgmt/models/changelog-schema.ts
import { z as z26 } from "zod";
var { Unrestricted: Unrestricted23 } = DataClassification;
var { Persisted: Persisted17 } = SchemaPersistence;
var { Internal: Internal20 } = SchemaExposure;
var ChangeLogActionSchema = z26.enum(["create", "update", "delete", "archive", "restore", "reorder", "duplicate", "sync", "publish"]).meta(
  { id: "ChangeLogAction", "x-revturbine-schema-persistence": Persisted17, "x-revturbine-schema-exposure": Internal20 }
);
var ChangeLogEntrySchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  action: ChangeLogActionSchema.meta(Unrestricted23),
  resource_type: z26.string().min(1).max(100).meta(Unrestricted23),
  resource_id: z26.string().min(1).meta(Unrestricted23),
  resource_name: z26.string().max(200).optional().meta(Unrestricted23),
  actor_id: z26.string().min(1).meta(Unrestricted23),
  actor_email: z26.string().email().optional().meta(Unrestricted23),
  diff: z26.object({
    before: z26.record(z26.string(), z26.unknown()).optional(),
    after: z26.record(z26.string(), z26.unknown()).optional()
  }).optional().meta(Unrestricted23),
  summary: z26.string().max(1e3).optional().meta(Unrestricted23),
  metadata: MetadataField.meta(Unrestricted23)
}).meta(
  { id: "ChangeLogEntry", "x-revturbine-schema-persistence": Persisted17, "x-revturbine-schema-exposure": Internal20 }
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
      requestParams: { path: z26.object({ entryId: z26.string() }) },
      summary: "Get change log entry by ID",
      tags: ["changelog"],
      responses: { "200": { description: "Change log entry", content: { "application/json": { schema: ChangeLogEntrySchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "changelog", persistence: { table: "changeLogEntries", mode: "get" } }
    })
  }
};

// ../scaffold/src/core/tenant/schema.ts
import { z as z27 } from "zod";
var { Unrestricted: Unrestricted24 } = DataClassification;
var { Persisted: Persisted18, Transient: Transient23 } = SchemaPersistence;
var { Internal: Internal21 } = SchemaExposure;
var TenantStatusSchema = z27.enum(["active", "suspended", "archived"]).meta(
  { id: "TenantStatus", "x-revturbine-schema-persistence": Transient23, "x-revturbine-schema-exposure": Internal21 }
);
var TenantSchema = IdField.merge(TimestampFields).extend({
  name: NameField.meta(Unrestricted24),
  handle: HandleField.meta(Unrestricted24),
  status: TenantStatusSchema.default("active").meta(Unrestricted24),
  metadata: MetadataField.meta(Unrestricted24)
}).meta(
  { id: "Tenant", "x-revturbine-schema-persistence": Persisted18, "x-revturbine-schema-exposure": Internal21 }
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
      requestParams: { path: z27.object({ tenantId: z27.string() }) },
      summary: "Get tenant by ID",
      tags: ["tenants"],
      responses: { "200": { description: "Tenant", content: { "application/json": { schema: TenantSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "tenants", persistence: { table: "tenants", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateTenant",
      requestParams: { path: z27.object({ tenantId: z27.string() }) },
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
      requestParams: { path: z27.object({ tenantId: z27.string() }) },
      summary: "Suspend tenant (disables all API access)",
      tags: ["tenants"],
      responses: { "200": { description: "Suspended", content: { "application/json": { schema: TenantSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "tenants", persistence: { table: "tenants", mode: "update" } }
    })
  },
  "/api/tenants/{tenantId}/reactivate": {
    post: operation({
      operationId: "reactivateTenant",
      requestParams: { path: z27.object({ tenantId: z27.string() }) },
      summary: "Reactivate a suspended tenant",
      tags: ["tenants"],
      responses: { "200": { description: "Reactivated", content: { "application/json": { schema: TenantSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "tenants", persistence: { table: "tenants", mode: "update" } }
    })
  }
};

// ../scaffold/src/core/environment/schema.ts
import { z as z28 } from "zod";
var { Unrestricted: Unrestricted25 } = DataClassification;
var { Persisted: Persisted19, Transient: Transient24 } = SchemaPersistence;
var { Internal: Internal22 } = SchemaExposure;
var EnvironmentStatusSchema = z28.enum(["active", "archived", "locked"]).meta(
  { id: "EnvironmentStatus", "x-revturbine-schema-persistence": Transient24, "x-revturbine-schema-exposure": Internal22 }
);
var EnvironmentSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  name: NameField.meta(Unrestricted25),
  handle: HandleField.meta(Unrestricted25),
  description: DescriptionField.meta(Unrestricted25),
  is_production: z28.boolean().default(false).meta({ ...Unrestricted25, readOnly: true }),
  status: EnvironmentStatusSchema.default("active").meta(Unrestricted25),
  // Branching lineage
  cloned_from_environment_id: z28.string().nullable().default(null).meta({ ...Unrestricted25, readOnly: true }),
  cloned_at: NullableDatetimeField.meta({ ...Unrestricted25, readOnly: true }),
  cloned_at_sequence: z28.number().int().min(0).nullable().default(null).meta({ ...Unrestricted25, readOnly: true }),
  // Protection settings (analogous to protected branches)
  requires_approval: z28.boolean().default(false).meta(Unrestricted25),
  auto_deploy_on_approval: z28.boolean().default(false).meta(Unrestricted25),
  // Audit
  created_by: z28.string().optional().meta(Unrestricted25),
  metadata: MetadataField.meta(Unrestricted25)
}).meta(
  { id: "Environment", "x-revturbine-schema-persistence": Persisted19, "x-revturbine-schema-exposure": Internal22 }
);
var EnvironmentPromotionRequestSchema = z28.object({
  source_environment_id: z28.string().min(1),
  target_environment_id: z28.string().min(1),
  playbook_version_ids: z28.array(z28.string()).optional(),
  strategy: z28.enum(["all_current", "selected_playbook_versions"]).default("all_current")
}).meta(
  { id: "EnvironmentPromotionRequest", "x-revturbine-schema-persistence": Transient24, "x-revturbine-schema-exposure": Internal22 }
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
      requestBody: { required: true, content: { "application/json": { schema: z28.object({
        name: z28.string().min(1).max(200),
        handle: z28.string().min(1).max(100),
        description: z28.string().max(500).optional(),
        clone_from_environment_id: z28.string().optional(),
        requires_approval: z28.boolean().optional()
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
      requestParams: { path: z28.object({ environmentId: z28.string() }) },
      summary: "Get environment by ID",
      tags: ["environments"],
      responses: { "200": { description: "Environment", content: { "application/json": { schema: EnvironmentSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "environments", persistence: { table: "environments", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateEnvironment",
      requestParams: { path: z28.object({ environmentId: z28.string() }) },
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
      requestParams: { path: z28.object({ environmentId: z28.string() }) },
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
        "200": { description: "Promotion result", content: { "application/json": { schema: z28.object({
          promoted_count: z28.number().int(),
          conflict_count: z28.number().int(),
          conflicts: z28.array(z28.object({
            handle: z28.string(),
            resource_type: z28.string(),
            source_sequence: z28.number().int(),
            target_sequence: z28.number().int()
          }))
        }) } } },
        default: { description: "Error", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "environments", persistence: { table: "environments", mode: "promote" } }
    })
  }
};

// ../scaffold/src/decisions/models/schema.ts
import { z as z29 } from "zod";
var { Unrestricted: Unrestricted26, Pii: Pii5 } = DataClassification;
var { Transient: Transient25, Persisted: Persisted20 } = SchemaPersistence;
var { External: External12 } = SchemaExposure;
var SupersessionReasonSchema = z29.enum(["milestone_version", "milestone_order"]).meta({ id: "SupersessionReason", "x-revturbine-schema-persistence": Transient25, "x-revturbine-schema-exposure": External12 });
var SupersessionRecordSchema = z29.object({
  superseded_output_id: z29.string().min(1).meta(Unrestricted26),
  superseded_by: z29.string().min(1).meta(Unrestricted26),
  reason: SupersessionReasonSchema.meta(Unrestricted26)
}).meta({
  id: "SupersessionRecord",
  "x-revturbine-schema-persistence": Persisted20,
  "x-revturbine-schema-exposure": External12,
  ...DataClassification.Operational
});
var EntitlementStatusSchema = z29.enum(ENTITLEMENT_STATUS_VALUES).meta({ id: "EntitlementStatus", "x-revturbine-schema-persistence": Transient25, "x-revturbine-schema-exposure": External12 });
var PlacementDecisionOutputSchema = z29.object({
  output_id: z29.string().meta(Unrestricted26),
  category: z29.string().meta(Unrestricted26),
  surface: z29.object({
    template: z29.string().optional().meta(Unrestricted26),
    type: SurfaceTypeSchema.meta(Unrestricted26),
    slot_id: z29.string().optional().meta(Unrestricted26)
  }).meta(Unrestricted26),
  content: z29.record(z29.string(), z29.unknown()).meta(Unrestricted26),
  promotion: z29.record(z29.string(), z29.unknown()).optional().meta(Unrestricted26),
  cta_path: z29.record(z29.string(), z29.unknown()).optional().meta(Unrestricted26),
  /** @deprecated Use cta_path. Kept for compatibility with older SDK consumers. */
  ui_path: z29.record(z29.string(), z29.unknown()).optional().meta(Unrestricted26),
  rule_id: z29.string().meta(Unrestricted26),
  decision_id: z29.string().meta(Unrestricted26),
  config_version: z29.string().meta(Unrestricted26),
  present_upsell: z29.boolean().meta(Unrestricted26),
  /**
   * Canonical, version-stable handle of the message block whose content was
   * rendered. Analytics groups on this value across message edits (plan 182).
   */
  message_block_handle: z29.string().optional().meta(Unrestricted26),
  /**
   * Immutable message-block version id, when the resolver has one. The
   * current Playbook projection carries only the canonical handle, so local
   * decisions omit this field rather than mislabelling a handle as a version.
   */
  message_block_id: z29.string().optional().meta(Unrestricted26),
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
  experiment_id: z29.string().optional().meta(Unrestricted26),
  /** Assigned arm within `experiment_id`, as the variant's handle. Present iff `experiment_id` is. */
  variant_key: z29.string().optional().meta(Unrestricted26),
  /**
   * Version of the experiment definition that produced this decision, where
   * known. `experiment_id` answers "how is this experiment performing" across
   * edits; this answers "which definition produced this result", which is what
   * makes a mid-flight edit analysable instead of silently corrupting the
   * series (REQ-10).
   */
  experiment_version_id: z29.string().optional().meta(Unrestricted26)
}).meta({ id: "PlacementDecisionOutput", "x-revturbine-schema-persistence": Transient25, "x-revturbine-schema-exposure": External12 });
var EntitlementCheckResultSchema = z29.object({
  status: EntitlementStatusSchema.meta(Unrestricted26),
  allowed: z29.boolean().meta(Unrestricted26),
  reason: z29.string().optional().meta(Unrestricted26),
  current_tier: z29.string().optional().meta(Unrestricted26),
  /**
   * Effective numeric limit from the matched entitlement rule (or usage
   * snapshot) — plan 133. Present only on limit-bearing outcomes
   * (usage_limit / credits); absence means limit-agnostic, not unlimited.
   */
  limit: z29.number().optional().meta(Unrestricted26),
  /** Consumed amount the evaluation applied against `limit`. */
  used: z29.number().optional().meta(Unrestricted26),
  /** `max(0, limit - used)`. */
  remaining: z29.number().optional().meta(Unrestricted26),
  /** Upsell placement to render when entitlement is denied. */
  placement: PlacementDecisionOutputSchema.optional().meta(Unrestricted26)
}).meta({ id: "EntitlementCheckResult", "x-revturbine-schema-persistence": Transient25, "x-revturbine-schema-exposure": External12 });
var RuntimePromotionSnapshotSchema = z29.object({
  id: z29.string().meta(Unrestricted26),
  name: z29.string().optional().meta(Unrestricted26),
  discount: z29.string().optional().meta(Unrestricted26),
  type: z29.string().optional().meta(Unrestricted26),
  status: z29.string().optional().meta(Unrestricted26)
}).meta({ id: "RuntimePromotionSnapshot", "x-revturbine-schema-persistence": Transient25, "x-revturbine-schema-exposure": External12 });
var ServerEvaluationPayloadUserSchema = z29.object({
  id: z29.string().meta(Pii5),
  anonymous_id: z29.string().optional().meta(Unrestricted26),
  traits: z29.record(z29.string(), z29.unknown()).optional().meta(Pii5)
}).meta({ id: "ServerEvaluationPayloadUser", "x-revturbine-schema-persistence": Transient25, "x-revturbine-schema-exposure": External12 });
var ServerEvaluationPayloadDecisionsItemSchema = z29.object({
  slot_id: z29.string().optional().meta(Unrestricted26),
  entitlement_handle: z29.string().optional().meta(Unrestricted26),
  plan_handle: z29.string().optional().meta(Unrestricted26),
  placement_handle: z29.string().optional().meta(Unrestricted26),
  visible: z29.boolean().meta(Unrestricted26),
  output: PlacementDecisionOutputSchema.optional().meta(Unrestricted26),
  reason_codes: z29.array(z29.string()).optional().meta(Unrestricted26)
}).meta({ id: "ServerEvaluationPayloadDecisionsItem", "x-revturbine-schema-persistence": Transient25, "x-revturbine-schema-exposure": External12 });
var ServerEvaluationPayloadEntitlementsValueSchema = EntitlementCheckResultSchema;
var ServerEvaluationPayloadTrialStatusSchema = UserTrialStatusSchema.meta({ id: "ServerEvaluationPayloadTrialStatus", "x-revturbine-schema-persistence": Transient25, "x-revturbine-schema-exposure": External12 });
var ServerEvaluationPayloadUserContextSchema = z29.object({
  segments: z29.array(z29.string()).optional().meta(Unrestricted26),
  traits: z29.record(z29.string(), z29.unknown()).optional().meta(Pii5),
  usage_balances: z29.record(z29.string(), z29.number()).optional().meta(Unrestricted26)
}).meta({ id: "ServerEvaluationPayloadUserContext", "x-revturbine-schema-persistence": Transient25, "x-revturbine-schema-exposure": External12 });
var ServerEvaluationPayloadSchema = z29.object({
  version: z29.literal("1.0.0").meta(Unrestricted26),
  request_id: z29.string().meta(Unrestricted26),
  tenant_id: z29.string().meta(Unrestricted26),
  evaluated_at: z29.string().datetime().meta(Unrestricted26),
  ttl_seconds: z29.number().int().min(0).max(86400).meta(Unrestricted26),
  user: ServerEvaluationPayloadUserSchema.meta(Pii5),
  decisions: z29.array(ServerEvaluationPayloadDecisionsItemSchema).meta(Unrestricted26),
  entitlements: z29.record(z29.string(), ServerEvaluationPayloadEntitlementsValueSchema).optional().meta(Unrestricted26),
  theme: z29.record(z29.string(), z29.unknown()).optional().meta(Unrestricted26),
  trial_status: ServerEvaluationPayloadTrialStatusSchema.optional().meta(Unrestricted26),
  user_context: ServerEvaluationPayloadUserContextSchema.optional().meta(Pii5)
}).meta({ id: "ServerEvaluationPayload", "x-revturbine-schema-persistence": Transient25, "x-revturbine-schema-exposure": External12 });

// ../scaffold/src/changemgmt/models/changesets-schema.ts
import { z as z30 } from "zod";
var { Unrestricted: Unrestricted27 } = DataClassification;
var { Persisted: Persisted21, Transient: Transient26 } = SchemaPersistence;
var { Internal: Internal23 } = SchemaExposure;
var PlaybookVersionStatusSchema = z30.enum([
  "draft",
  "awaiting_approval",
  "approved",
  "deploying",
  "deployed",
  "rejected",
  "archived"
]).meta(
  { id: "PlaybookVersionStatus", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": Internal23 }
);
var PlaybookVersionSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  environment_id: z30.string().min(1).meta(Unrestricted27),
  name: NameField.meta(Unrestricted27),
  description: z30.string().max(2e3).optional().meta(Unrestricted27),
  status: PlaybookVersionStatusSchema.default("draft").meta(Unrestricted27),
  labels: z30.array(z30.string()).default([]).meta(Unrestricted27),
  // People
  created_by: z30.string().min(1).meta(Unrestricted27),
  submitted_by: z30.string().nullable().default(null).meta({ ...Unrestricted27, readOnly: true }),
  reviewed_by: z30.string().nullable().default(null).meta({ ...Unrestricted27, readOnly: true }),
  deployed_by: z30.string().nullable().default(null).meta({ ...Unrestricted27, readOnly: true }),
  // Dates
  submitted_at: NullableDatetimeField.meta({ ...Unrestricted27, readOnly: true }),
  reviewed_at: NullableDatetimeField.meta({ ...Unrestricted27, readOnly: true }),
  deployed_at: NullableDatetimeField.meta({ ...Unrestricted27, readOnly: true }),
  // Snapshot (analogous to HEAD at branch creation)
  base_snapshot_sequence: z30.number().int().min(0).default(0).meta({ ...Unrestricted27, readOnly: true }),
  // Computed counts
  entry_count: z30.number().int().min(0).default(0).meta({ ...Unrestricted27, readOnly: true }),
  conflict_count: z30.number().int().min(0).default(0).meta({ ...Unrestricted27, readOnly: true }),
  // Lineage
  rollback_of_playbook_version_id: z30.string().nullable().default(null).meta(Unrestricted27),
  cherry_picked_from_playbook_version_id: z30.string().nullable().default(null).meta(Unrestricted27),
  // Review
  review_notes: z30.string().max(2e3).optional().meta(Unrestricted27),
  rejection_reason: z30.string().max(2e3).optional().meta(Unrestricted27),
  // Immutable frozen artifacts, written once when the playbook version is activated
  // (plan 70): `snapshot` is the fully-rendered RevTurbineConfig JSON; `bundle`
  // is the compiled FlatBuffer bundle, base64-encoded (the Zod→drizzle
  // generator has no bytea type). readOnly — only the activation path writes
  // them, and never overwrites a populated value.
  snapshot: z30.record(z30.string(), z30.unknown()).nullable().default(null).meta({ ...Unrestricted27, readOnly: true }),
  bundle: z30.string().nullable().default(null).meta({ ...Unrestricted27, readOnly: true }),
  metadata: MetadataField.meta(Unrestricted27)
}).meta(
  { id: "PlaybookVersion", "x-revturbine-schema-persistence": Persisted21, "x-revturbine-schema-exposure": Internal23 }
);
var PlaybookVersionEntrySummarySchema = z30.object({
  handle: z30.string().meta(Unrestricted27),
  resource_type: z30.string().meta(Unrestricted27),
  resource_name: z30.string().optional().meta(Unrestricted27),
  action: z30.enum(["create", "update", "delete"]).meta(Unrestricted27),
  has_conflict: z30.boolean().meta(Unrestricted27)
}).meta(
  { id: "PlaybookVersionEntrySummary", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": Internal23 }
);
var PlaybookVersionDiffSchema = z30.object({
  playbook_version_id: z30.string().meta(Unrestricted27),
  entries: z30.array(PlaybookVersionEntrySummarySchema).meta(Unrestricted27),
  total_entries: z30.number().int().min(0).meta(Unrestricted27),
  total_conflicts: z30.number().int().min(0).meta(Unrestricted27),
  deployable: z30.boolean().meta(Unrestricted27)
}).meta(
  { id: "PlaybookVersionDiff", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": Internal23 }
);
var PlaybookVersionDeployResultSchema = z30.object({
  playbook_version_id: z30.string().meta(Unrestricted27),
  deployed_count: z30.number().int().min(0).meta(Unrestricted27),
  superseded_count: z30.number().int().min(0).meta(Unrestricted27),
  skipped_conflicts: z30.number().int().min(0).meta(Unrestricted27),
  deployed_at: z30.string().datetime().meta(Unrestricted27)
}).meta(
  { id: "PlaybookVersionDeployResult", "x-revturbine-schema-persistence": Transient26, "x-revturbine-schema-exposure": Internal23 }
);
var playbookVersionPaths = {
  // ── Lifecycle transitions ────────────────────────────────────────────────
  "/api/playbook-versions/{playbookVersionId}/submit": {
    post: operation({
      operationId: "submitPlaybookVersion",
      requestParams: { path: z30.object({ playbookVersionId: z30.string() }) },
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
      requestParams: { path: z30.object({ playbookVersionId: z30.string() }) },
      summary: "Approve playbook version (may auto-deploy if environment allows)",
      tags: ["playbook-versions"],
      requestBody: { required: true, content: { "application/json": { schema: z30.object({ review_notes: z30.string().max(2e3).optional() }) } } },
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
      requestParams: { path: z30.object({ playbookVersionId: z30.string() }) },
      summary: "Reject playbook version",
      tags: ["playbook-versions"],
      requestBody: { required: true, content: { "application/json": { schema: z30.object({ rejection_reason: z30.string().max(2e3) }) } } },
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
      requestParams: { path: z30.object({ playbookVersionId: z30.string() }) },
      summary: "Deploy playbook version \u2014 activates all entries, supersedes previous versions",
      tags: ["playbook-versions"],
      requestBody: { required: true, content: { "application/json": { schema: z30.object({ force: z30.boolean().default(false) }) } } },
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
      requestParams: { path: z30.object({ playbookVersionId: z30.string() }) },
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
      requestParams: { path: z30.object({ playbookVersionId: z30.string() }) },
      summary: "Preview diff of all entries vs current state (dry-run deploy)",
      tags: ["playbook-versions"],
      responses: { "200": { description: "Diff preview", content: { "application/json": { schema: PlaybookVersionDiffSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "playbook-versions", persistence: { table: "playbookVersions", mode: "preview" } }
    })
  },
  "/api/playbook-versions/{playbookVersionId}/conflicts": {
    get: operation({
      operationId: "listPlaybookVersionConflicts",
      requestParams: { path: z30.object({ playbookVersionId: z30.string() }), query: ListQueryParamsSchema },
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
      requestParams: { path: z30.object({ playbookVersionId: z30.string() }) },
      summary: "Create a rollback playbook version that reverts a deployed one",
      tags: ["playbook-versions"],
      requestBody: { required: true, content: { "application/json": { schema: z30.object({
        name: z30.string().min(1).max(200).optional()
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
      requestParams: { path: z30.object({ playbookVersionId: z30.string() }) },
      summary: "Cherry-pick individual entries from this PlaybookVersion into another",
      tags: ["playbook-versions"],
      requestBody: { required: true, content: { "application/json": { schema: z30.object({
        handles: z30.array(z30.string()).min(1),
        target_playbook_version_id: z30.string().min(1)
      }) } } },
      responses: {
        "200": { description: "Cherry-picked", content: { "application/json": { schema: z30.object({ copied_count: z30.number().int() }) } } },
        default: { description: "Error", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "playbook-versions", persistence: { table: "playbookVersions", mode: "update" } }
    })
  }
};

// ../scaffold/src/settings/models/schema.ts
import { z as z31 } from "zod";
var { Unrestricted: Unrestricted28, Pii: Pii6 } = DataClassification;
var { Persisted: Persisted22 } = SchemaPersistence;
var { Internal: Internal24 } = SchemaExposure;
var PROVIDER_CONNECTION_FACETS = schemaFacets(SchemaContext.CustomerOperations, {
  sdkInput: false,
  source: SchemaSource.Customer
});
var DEFAULT_ANALYTICS_RETENTION_DAYS = 365;
var ProviderConnectionSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  provider_handle: HandleField.meta(Unrestricted28),
  provider_type: HandleField.meta(Unrestricted28),
  endpoint: z31.string().url().max(2048).nullable().default(null).meta(Unrestricted28),
  credential_reference: z31.string().min(1).max(255).nullable().default(null).meta({ ...Unrestricted28, readOnly: true }),
  environment_id: z31.string().min(1).max(200).default("production").meta(Unrestricted28),
  health_state: ProviderAvailabilitySchema.default("unavailable").meta({ ...Unrestricted28, readOnly: true }),
  last_health_check_at: NullableDatetimeField.meta({ ...Unrestricted28, readOnly: true }),
  supported_capability_versions: z31.record(
    z31.string().min(1).max(100),
    z31.array(z31.number().int().min(1)).min(1)
  ).default({}).meta({ ...Unrestricted28, readOnly: true }),
  external_project_id: z31.string().min(1).max(255).nullable().default(null).meta(Unrestricted28),
  external_workspace_id: z31.string().min(1).max(255).nullable().default(null).meta(Unrestricted28),
  timeout_ms: z31.number().int().min(1).max(12e4).default(1e4).meta(Unrestricted28),
  stale_after_ms: z31.number().int().min(1).default(3e5).meta(Unrestricted28),
  unavailable_after_failures: z31.number().int().min(1).max(100).default(3).meta(Unrestricted28)
}).meta({ id: "ProviderConnection", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal24, ...PROVIDER_CONNECTION_FACETS });
var ApiKeyStatusSchema = z31.enum(["active", "revoked", "rotating"]).meta({ id: "ApiKeyStatus", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal24 });
var ApiKeySchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  name: NameField.meta(Unrestricted28),
  key_hash: z31.string().min(1).meta({ ...Pii6, readOnly: true }),
  key_prefix: z31.string().min(1).max(20).meta({ ...Unrestricted28, readOnly: true }),
  key_last4: z31.string().length(4).meta({ ...Unrestricted28, readOnly: true }),
  status: ApiKeyStatusSchema.default("active").meta(Unrestricted28),
  last_used_at: NullableDatetimeField.meta({ ...Unrestricted28, readOnly: true }),
  expires_at: NullableDatetimeField.meta(Unrestricted28)
}).meta({ id: "ApiKey", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal24 });
var FlagValueTypeSchema = z31.enum(["boolean", "string", "number", "json"]).meta({ id: "FlagValueType", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal24 });
var FeatureFlagSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  key: z31.string().min(1).max(100).meta(Unrestricted28),
  value_type: FlagValueTypeSchema.default("boolean").meta(Unrestricted28),
  value: z31.string().max(4e3).default("false").meta(Unrestricted28),
  description: DescriptionField.meta(Unrestricted28),
  enabled: z31.boolean().default(true).meta(Unrestricted28)
}).meta({ id: "FeatureFlag", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal24 });
var TenantConfigSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  workspace_name: z31.string().min(1).max(200).meta(Unrestricted28),
  support_email: z31.string().email().nullable().default(null).meta(Unrestricted28),
  timezone: z31.string().max(50).default("UTC").meta(Unrestricted28),
  default_currency: z31.string().length(3).default("USD").meta(Unrestricted28),
  logo_url: z31.string().url().nullable().default(null).meta(Unrestricted28),
  // ── Activity thresholds (plan 180 D4/D5) ─────────────────────────────
  // Tenant-level settings applied AT CONTEXT RETRIEVAL against the
  // persisted `user_contexts.activity_score` to derive the activity level
  // (`deriveActivityLevel`). The window governs the score job's counting
  // period; the mins are the level cut points (score ≥ high_min → high,
  // ≥ medium_min → medium, ≥ low_min → low, else inactive; no score → new).
  activity_window_days: z31.number().int().min(1).default(DEFAULT_ACTIVITY_THRESHOLDS.window_days).meta(Unrestricted28),
  activity_high_min: z31.number().int().min(1).default(DEFAULT_ACTIVITY_THRESHOLDS.high_min).meta(Unrestricted28),
  activity_medium_min: z31.number().int().min(1).default(DEFAULT_ACTIVITY_THRESHOLDS.medium_min).meta(Unrestricted28),
  activity_low_min: z31.number().int().min(1).default(DEFAULT_ACTIVITY_THRESHOLDS.low_min).meta(Unrestricted28),
  // Shared retention policy for activity-scaled analytics artifacts. Plan
  // 200 applies it to experiment evidence/results; plan 210 reuses it for
  // saved-view revisions instead of defining another tenant setting.
  analytics_retention_days: z31.number().int().min(1).default(DEFAULT_ANALYTICS_RETENTION_DAYS).meta(Unrestricted28)
}).meta({ id: "TenantConfig", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal24 });
var McpConfigSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  /** @deprecated Plan 28 ships a hosted MCP server at `/api/mcp/streamable-http`; no outbound server URL is needed. Column remains for backward compatibility. */
  server_url: z31.string().url().max(500).meta(Unrestricted28),
  /** @deprecated Plan 28 mints per-tenant MCP tokens at Settings → MCP and stores only a SHA-256 hash; this free-text hint is unused. Column remains for backward compatibility. */
  api_token_hint: z31.string().max(50).nullable().default(null).meta(Unrestricted28),
  allow_write_actions: z31.boolean().default(false).meta(Unrestricted28),
  enabled_tools: z31.array(z31.string().max(100)).default([]).meta(Unrestricted28),
  enabled: z31.boolean().default(false).meta(Unrestricted28)
}).meta({ id: "McpConfig", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal24 });
var OnboardingChecklistSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  step_key: z31.string().min(1).max(100).meta(Unrestricted28),
  label: z31.string().min(1).max(200).meta(Unrestricted28),
  done: z31.boolean().default(false).meta(Unrestricted28),
  completed_at: NullableDatetimeField.meta({ ...Unrestricted28, readOnly: true })
}).meta({ id: "OnboardingChecklist", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal24 });
var AuditActorTypeSchema = z31.enum(["user", "agent", "system", "webhook"]).meta({ id: "AuditActorType", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal24 });
var AuditEventSchema = IdField.merge(TenantIdField).extend({
  environment_id: z31.string().min(1).default("production").meta(Unrestricted28),
  actor_type: AuditActorTypeSchema.meta(Unrestricted28),
  actor_id: z31.string().nullable().default(null).meta(Unrestricted28),
  action: z31.string().min(1).max(120).meta(Unrestricted28),
  object_type: z31.string().max(120).nullable().default(null).meta(Unrestricted28),
  object_id: z31.string().max(200).nullable().default(null).meta(Unrestricted28),
  payload: z31.record(z31.string(), z31.unknown()).nullable().default(null).meta(Unrestricted28),
  occurred_at: z31.string().datetime().meta({ ...Unrestricted28, readOnly: true })
}).meta({ id: "AuditEvent", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal24 });
var PlacementTestUserIdentifierTypeSchema = z31.enum(["user_id", "account_id", "email"]).meta({ id: "PlacementTestUserIdentifierType", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal24 });
var PlacementTestUserSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  handle: HandleField.meta({ ...Unrestricted28, readOnly: true }),
  identifier: z31.string().min(1).max(200).meta(Unrestricted28),
  identifier_type: PlacementTestUserIdentifierTypeSchema.default("user_id").meta(Unrestricted28),
  note: z31.string().max(500).nullable().default(null).meta(Unrestricted28),
  added_by: z31.string().meta(Unrestricted28)
}).meta({ id: "PlacementTestUser", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal24, ...mintedIdentity() });
var settingsPaths = {
  // ── API Keys ─────────────────────────────────────────────────────────────
  "/api/settings/api-keys": {
    get: operation({
      operationId: "listApiKeys",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List API keys for the tenant",
      tags: ["settings"],
      responses: { "200": { description: "API keys", content: { "application/json": { schema: ListEnvelope(ApiKeySchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "api-keys", persistence: { table: "apiKeys", mode: "list" } }
    }),
    post: operation({
      operationId: "createApiKey",
      summary: "Create a new API key",
      tags: ["settings"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(ApiKeySchema) } } },
      responses: { "201": { description: "API key created", content: { "application/json": { schema: ApiKeySchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "api-keys", persistence: { table: "apiKeys", mode: "create", writeSchema: "ApiKeySchema#writable" } }
    })
  },
  "/api/settings/api-keys/{keyId}": {
    delete: operation({
      operationId: "revokeApiKey",
      requestParams: { path: z31.object({ keyId: z31.string() }) },
      summary: "Revoke an API key",
      tags: ["settings"],
      responses: { "200": { description: "API key revoked", content: { "application/json": { schema: ApiKeySchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "api-keys", persistence: { table: "apiKeys", mode: "delete" } }
    })
  },
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
      requestParams: { path: z31.object({ flagId: z31.string() }) },
      summary: "Get a feature flag",
      tags: ["settings"],
      responses: { "200": { description: "Feature flag", content: { "application/json": { schema: FeatureFlagSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "feature-flags", persistence: { table: "featureFlags", mode: "get" } }
    }),
    put: operation({
      operationId: "updateFeatureFlag",
      requestParams: { path: z31.object({ flagId: z31.string() }) },
      summary: "Update a feature flag",
      tags: ["settings"],
      requestBody: { required: true, content: { "application/json": { schema: toWritableSchema(FeatureFlagSchema).partial() } } },
      responses: { "200": { description: "Feature flag updated", content: { "application/json": { schema: FeatureFlagSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "feature-flags", persistence: { table: "featureFlags", mode: "update", writeSchema: "FeatureFlagSchema#writable" } }
    }),
    delete: operation({
      operationId: "deleteFeatureFlag",
      requestParams: { path: z31.object({ flagId: z31.string() }) },
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
      requestParams: { path: z31.object({ stepId: z31.string() }) },
      summary: "Get an onboarding step",
      tags: ["settings"],
      responses: { "200": { description: "Onboarding step", content: { "application/json": { schema: OnboardingChecklistSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "onboarding", persistence: { table: "onboardingChecklist", mode: "get" } }
    }),
    put: operation({
      operationId: "updateOnboardingStep",
      requestParams: { path: z31.object({ stepId: z31.string() }) },
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
      requestParams: { path: z31.object({ testUserId: z31.string() }) },
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
      requestParams: { path: z31.object({ connectionId: z31.string() }) },
      summary: "Get a provider connection",
      tags: ["settings"],
      responses: { "200": { description: "Provider connection", content: { "application/json": { schema: ProviderConnectionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "provider-connections", persistence: { table: "providerConnections", mode: "get" } }
    }),
    put: operation({
      operationId: "updateProviderConnection",
      requestParams: { path: z31.object({ connectionId: z31.string() }) },
      summary: "Update a provider connection",
      tags: ["settings"],
      requestBody: { required: true, content: { "application/json": { schema: toWritableSchema(ProviderConnectionSchema).partial() } } },
      responses: { "200": { description: "Provider connection updated", content: { "application/json": { schema: ProviderConnectionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "provider-connections", persistence: { table: "providerConnections", mode: "update", writeSchema: "ProviderConnectionSchema#writable" } }
    }),
    delete: operation({
      operationId: "deleteProviderConnection",
      requestParams: { path: z31.object({ connectionId: z31.string() }) },
      summary: "Delete a provider connection",
      tags: ["settings"],
      responses: { "200": { description: "Provider connection deleted", content: { "application/json": { schema: ProviderConnectionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "provider-connections", persistence: { table: "providerConnections", mode: "delete" } }
    })
  }
};

// ../scaffold/src/core/auth/schema.ts
import { z as z32 } from "zod";
var { Unrestricted: Unrestricted29, Pii: Pii7 } = DataClassification;
var { Persisted: Persisted23, Transient: Transient27 } = SchemaPersistence;
var { Internal: Internal25 } = SchemaExposure;
var UserRoleSchema = z32.enum(["user", "admin"]).meta({ id: "UserRole", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal25 });
var AuthUserSchema = IdField.merge(TimestampFields).extend({
  name: NameField.meta(Unrestricted29),
  email: z32.string().email().meta(Pii7),
  email_verified: z32.boolean().default(false).meta(Unrestricted29),
  image: z32.string().url().nullable().default(null).meta(Pii7),
  role: UserRoleSchema.default("user").meta(Unrestricted29),
  banned: z32.boolean().default(false).meta({ ...Unrestricted29, readOnly: true }),
  ban_reason: z32.string().nullable().default(null).meta({ ...Unrestricted29, readOnly: true }),
  ban_expires: NullableDatetimeField.meta({ ...Unrestricted29, readOnly: true }),
  two_factor_enabled: z32.boolean().default(false).meta({ ...Unrestricted29, readOnly: true })
}).meta({ id: "AuthUser", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal25 });
var AuthSessionSchema = IdField.merge(TimestampFields).extend({
  expires_at: z32.string().datetime().meta(Unrestricted29),
  token: z32.string().min(1).meta({ ...Pii7, readOnly: true }),
  ip_address: z32.string().nullable().default(null).meta(Pii7),
  user_agent: z32.string().nullable().default(null).meta(Pii7),
  user_id: z32.string().min(1).meta({ ...Unrestricted29, readOnly: true }),
  active_organization_id: z32.string().nullable().default(null).meta(Unrestricted29),
  impersonated_by: z32.string().nullable().default(null).meta({ ...Unrestricted29, readOnly: true })
}).meta({ id: "AuthSession", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal25 });
var AuthAccountSchema = IdField.merge(TimestampFields).extend({
  account_id: z32.string().min(1).meta(Unrestricted29),
  provider_id: z32.string().min(1).meta(Unrestricted29),
  user_id: z32.string().min(1).meta({ ...Unrestricted29, readOnly: true }),
  access_token: z32.string().nullable().default(null).meta({ ...Pii7, readOnly: true }),
  refresh_token: z32.string().nullable().default(null).meta({ ...Pii7, readOnly: true }),
  id_token: z32.string().nullable().default(null).meta({ ...Pii7, readOnly: true }),
  access_token_expires_at: NullableDatetimeField.meta({ ...Unrestricted29, readOnly: true }),
  refresh_token_expires_at: NullableDatetimeField.meta({ ...Unrestricted29, readOnly: true }),
  scope: z32.string().nullable().default(null).meta(Unrestricted29),
  password: z32.string().nullable().default(null).meta({ ...Pii7, readOnly: true })
}).meta({ id: "AuthAccount", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal25 });
var AuthVerificationSchema = IdField.merge(TimestampFields).extend({
  identifier: z32.string().min(1).meta(Pii7),
  value: z32.string().min(1).meta({ ...Pii7, readOnly: true }),
  expires_at: z32.string().datetime().meta(Unrestricted29)
}).meta({ id: "AuthVerification", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal25 });
var AuthTwoFactorSchema = IdField.extend({
  secret: z32.string().min(1).meta({ ...Pii7, readOnly: true }),
  backup_codes: z32.string().min(1).meta({ ...Pii7, readOnly: true }),
  user_id: z32.string().min(1).meta({ ...Unrestricted29, readOnly: true }),
  verified: z32.boolean().default(false).meta({ ...Unrestricted29, readOnly: true })
}).meta({ id: "AuthTwoFactor", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal25 });
var AuthOrganizationSchema = IdField.extend({
  name: NameField.meta(Unrestricted29),
  slug: z32.string().min(1).max(100).nullable().default(null).meta(Unrestricted29),
  logo: z32.string().url().nullable().default(null).meta(Unrestricted29),
  created_at: z32.string().datetime().meta({ ...Unrestricted29, readOnly: true }),
  metadata: z32.string().nullable().default(null).meta(Unrestricted29)
}).meta({ id: "AuthOrganization", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal25 });
var RoleSchema = z32.enum(["viewer", "collaborator", "approver", "admin"]).meta({ id: "Role", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal25 });
var ROLE_RANK = {
  viewer: 0,
  collaborator: 1,
  approver: 2,
  admin: 3
};
var PermissionResourceSchema = z32.enum([
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
]).meta({ id: "PermissionResource", "x-revturbine-schema-persistence": Transient27, "x-revturbine-schema-exposure": Internal25 });
var PermissionActionSchema = z32.enum([
  "read",
  "create",
  "update",
  "delete",
  "publish",
  "approve",
  "invite",
  "manage_roles"
]).meta({ id: "PermissionAction", "x-revturbine-schema-persistence": Transient27, "x-revturbine-schema-exposure": Internal25 });
var PermissionSchema = z32.object({
  resource: PermissionResourceSchema,
  action: PermissionActionSchema
}).meta({ id: "Permission", "x-revturbine-schema-persistence": Transient27, "x-revturbine-schema-exposure": Internal25 });
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
var McpTokenScopeSchema = z32.enum(SCOPE_VALUES).meta({ id: "McpTokenScope", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal25 });
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
  organization_id: z32.string().min(1).meta({ ...Unrestricted29, readOnly: true }),
  user_id: z32.string().min(1).meta({ ...Unrestricted29, readOnly: true }),
  role: RoleSchema.default("viewer").meta(Unrestricted29),
  created_at: z32.string().datetime().meta({ ...Unrestricted29, readOnly: true })
}).meta({ id: "AuthMember", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal25 });
var InvitationStatusSchema = z32.enum(["pending", "accepted", "rejected", "canceled", "expired"]).meta({ id: "InvitationStatus", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal25 });
var AuthInvitationSchema = IdField.extend({
  organization_id: z32.string().min(1).meta({ ...Unrestricted29, readOnly: true }),
  email: z32.string().email().meta(Pii7),
  role: RoleSchema.nullable().default(null).meta(Unrestricted29),
  status: InvitationStatusSchema.default("pending").meta(Unrestricted29),
  expires_at: z32.string().datetime().meta(Unrestricted29),
  created_at: z32.string().datetime().meta({ ...Unrestricted29, readOnly: true }),
  inviter_id: z32.string().min(1).meta({ ...Unrestricted29, readOnly: true })
}).meta({ id: "AuthInvitation", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal25 });
var AuthPasskeySchema = IdField.extend({
  name: z32.string().max(200).nullable().default(null).meta(Unrestricted29),
  public_key: z32.string().min(1).meta({ ...Pii7, readOnly: true }),
  user_id: z32.string().min(1).meta({ ...Unrestricted29, readOnly: true }),
  credential_id: z32.string().min(1).meta({ ...Unrestricted29, readOnly: true }),
  counter: z32.number().int().default(0).meta({ ...Unrestricted29, readOnly: true }),
  device_type: z32.string().min(1).meta(Unrestricted29),
  backed_up: z32.boolean().default(false).meta(Unrestricted29),
  transports: z32.string().nullable().default(null).meta(Unrestricted29),
  created_at: z32.string().datetime().meta({ ...Unrestricted29, readOnly: true }),
  aaguid: z32.string().nullable().default(null).meta(Unrestricted29)
}).meta({ id: "AuthPasskey", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal25 });
var AuthApiKeySchema = IdField.merge(TimestampFields).extend({
  config_id: z32.string().min(1).meta(Unrestricted29),
  name: z32.string().max(200).nullable().default(null).meta(Unrestricted29),
  start: z32.string().nullable().default(null).meta(Unrestricted29),
  reference_id: z32.string().min(1).meta(Unrestricted29),
  prefix: z32.string().nullable().default(null).meta(Unrestricted29),
  key: z32.string().min(1).meta({ ...Pii7, readOnly: true }),
  refill_interval: z32.number().int().nullable().default(null).meta(Unrestricted29),
  refill_amount: z32.number().int().nullable().default(null).meta(Unrestricted29),
  last_refill_at: NullableDatetimeField.meta({ ...Unrestricted29, readOnly: true }),
  enabled: z32.boolean().default(true).meta(Unrestricted29),
  rate_limit_enabled: z32.boolean().default(false).meta(Unrestricted29),
  rate_limit_time_window: z32.number().int().nullable().default(null).meta(Unrestricted29),
  rate_limit_max: z32.number().int().nullable().default(null).meta(Unrestricted29),
  request_count: z32.number().int().default(0).meta({ ...Unrestricted29, readOnly: true }),
  remaining: z32.number().int().nullable().default(null).meta({ ...Unrestricted29, readOnly: true }),
  last_request: NullableDatetimeField.meta({ ...Unrestricted29, readOnly: true }),
  expires_at: NullableDatetimeField.meta(Unrestricted29),
  permissions: z32.string().nullable().default(null).meta(Unrestricted29),
  metadata: z32.string().nullable().default(null).meta(Unrestricted29)
}).meta({ id: "AuthApiKey", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal25 });
var AuthSsoProviderSchema = IdField.extend({
  issuer: z32.string().min(1).meta(Unrestricted29),
  oidc_config: z32.string().nullable().default(null).meta(Unrestricted29),
  saml_config: z32.string().nullable().default(null).meta(Unrestricted29),
  user_id: z32.string().min(1).meta({ ...Unrestricted29, readOnly: true }),
  provider_id: z32.string().min(1).meta(Unrestricted29),
  organization_id: z32.string().nullable().default(null).meta(Unrestricted29),
  domain: z32.string().min(1).meta(Unrestricted29)
}).meta({ id: "AuthSsoProvider", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal25 });
export {
  ANALYTICS_VALIDATION_CODES,
  ANALYTICS_VIEW_SCHEMA_VERSION,
  ActivityLevelSchema,
  AddOnSchema,
  AddOnVariationSchema,
  AlertSchema,
  AnalysisProvenanceSchema,
  AnalyticsAgentCatalogEntryKindSchema,
  AnalyticsAgentCatalogEntrySchema,
  AnalyticsAnalyticalUnitSchema,
  AnalyticsBlockErrorSchema,
  AnalyticsBlockResultSchema,
  AnalyticsCardinalityClassSchema,
  AnalyticsCatalogConceptSchema,
  AnalyticsCatalogDeprecationSchema,
  AnalyticsCatalogDimensionSchema,
  AnalyticsCatalogMetricSchema,
  AnalyticsCatalogProvenanceKindSchema,
  AnalyticsCatalogProvenanceSchema,
  AnalyticsCatalogSchema,
  AnalyticsCatalogSearchResultSchema,
  AnalyticsCatalogSourceSchema,
  AnalyticsClassificationSchema,
  AnalyticsCompareModeSchema,
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
  AnalyticsQueryFamilySchema,
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
  ApiKeySchema,
  ApiKeyStatusSchema,
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
  BUILT_IN_TEMPLATE_COMPONENT_TYPES,
  BillingCadenceSchema,
  BillingHealthStatusSchema,
  BrandingConfigSchema,
  CONTROL_PLANE_EVENT_NAMES,
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
  DescriptionField,
  DetectorRequirementsSchema,
  DimensionCategorySchema,
  DimensionSourceTypeSchema,
  DiscountTypeSchema,
  DriftReportSchema,
  ENTITLEMENT_STATUS_VALUES,
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
  EvidenceRequirementSchema,
  ExperimentAnalysisConfigSchema,
  ExperimentAnalysisConfigVersionError,
  ExperimentAnalysisResultRecordSchema,
  ExperimentAnalysisResultSchema,
  ExperimentEvidenceSchema,
  ExperimentEvidenceSnapshotSchema,
  ExperimentHealthSchema,
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
  IdField,
  IdentityKind,
  IdentitySchema,
  IngestedEventSchema,
  InvitationStatusSchema,
  KpiAggregateSchema,
  LocalizedTextSchema,
  McpConfigSchema,
  McpTokenScopeSchema,
  MessageBlockContentSchema,
  MessageBlockRecordSchema,
  MessageBlockSchema,
  MessageSchema,
  MetadataField,
  MeteringConfigSchema,
  NameField,
  NullableDatetimeField,
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
  PlaybookSchema,
  PlaybookStrictSchema,
  PlaybookVersionDeployResultSchema,
  PlaybookVersionDiffSchema,
  PlaybookVersionEntrySummarySchema,
  PlaybookVersionSchema,
  PlaybookVersionStatusSchema,
  PresentationOutcomeSchema,
  PriceSourceSchema,
  PricingModelSchema,
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
  RoleSchema,
  RuleVisibilitySchema,
  RuntimePromotionSnapshotSchema,
  SDK_AUTOMATIC_NON_EMITTED_NAMES,
  SDK_CLIENT_EVENT_NAMES,
  SDK_META_EVENT_NAMES,
  SEMANTIC_ID_PATTERN,
  SchemaContext,
  SchemaExposure,
  SchemaPersistence,
  SchemaSource,
  SdkConfigShapeSchema,
  SdkMetaEventSchema,
  SdkMetaEventTypeSchema,
  SdkMetaIngestBatchSchema,
  SeatTypeSchema,
  SegmentDimensionSchema,
  SegmentSchema,
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
  StripeIntegrationConfigSchema,
  StripePriceBillingPeriodSchema,
  StripePriceMockBillingPeriodSchema,
  StripePriceMockSchema,
  StripePriceSchema,
  StudioSurfaceTypeSchema,
  SuggestionSeveritySchema,
  SupersessionReasonSchema,
  SupersessionRecordSchema,
  SurfaceSlotSchema,
  SurfaceTemplateSchema,
  SurfaceTypeCapRuleSchema,
  SurfaceTypeSchema,
  TemplateFieldTypeSchema,
  TenantConfigSchema,
  TenantIdField,
  TenantSchema,
  TenantStatusSchema,
  ThemeSchema,
  TimestampFields,
  TrackEventSchema,
  TrackIngestBatchSchema,
  TreatmentInteractionInputSchema,
  TreatmentInteractionTypeSchema,
  TrendFeaturesSchema,
  TrialEligibilityScopeSchema,
  TrialInstanceSchema,
  TrialLimitPolicySchema,
  TrialStatusSchema,
  TrialTriggerPayloadSchema,
  TriggerEventTypeSchema,
  UiPreferenceSchema,
  UsageAllocationSchema,
  UsageEnforcementSettingsSchema,
  UsagePeriodScopeSchema,
  UsageTriggerPayloadSchema,
  UserContextSchema,
  UserInstanceContextSchema,
  UserPlanContextSchema,
  UserRoleSchema,
  UserTrialStatusSchema,
  UserUsageEntrySchema,
  VIEW_ELEMENT_ID_PATTERN,
  VariantStatisticalSummarySchema,
  VersionFields,
  WebhookEventLogSchema,
  WebhookEventSourceSchema,
  WebhookEventStatusSchema,
  analyticsPaths,
  analyticsViewPaths,
  assertExperimentAnalysisConfigUpdateAllowed,
  buildAgentCatalogProjection,
  changelogPaths,
  collectPersistedSchemas,
  collectVersionedConfigEntities,
  compileAnalyticsDraft,
  configPaths,
  contentPaths,
  createFixtureAnalyticsCatalog,
  createInMemoryAnalyticsCatalog,
  customerPaths,
  defaultRenderForQuery,
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
  isVersionedConfigEntity,
  makeAnchor,
  mintedIdentity,
  namedIdentity,
  normalizeLegacyConfig,
  parsePlaybook,
  placementPaths,
  planPaths,
  playbookVersionPaths,
  projectClientSafe,
  promotionPaths,
  requireSchemaFacets,
  resolveComponentType,
  schemaDeprecation,
  schemaFacets,
  scopesSubsetOfRole,
  searchAgentCatalog,
  segmentPaths,
  settingsPaths,
  tenantPaths,
  toCreateSchema,
  toWritableSchema,
  trialPaths,
  uiPreferencePaths,
  userContextPaths,
  validateAnalyticsQuery,
  validateAnalyticsView,
  validatePlacementThresholdWarnings
};
