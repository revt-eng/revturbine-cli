// GENERATED — do not edit by hand.
// Vendored ExportedConfigSchema snapshot bundled from @revt-eng/schema@0.1.108
// (revturbine-scaffold/src/core/zod/index.ts). Regenerate with:
//   node scripts/generate-schema-snapshot.mjs


// ../revturbine-scaffold/src/core/common.ts
import { z as z2 } from "zod";

// ../revturbine-scaffold/src/core/classification.ts
import { z } from "zod";

// ../revturbine-scaffold/src/core/handle-pattern.ts
var HANDLE_PATTERN = /^[a-z0-9._]{1,100}$/;

// ../revturbine-scaffold/src/core/classification.ts
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
  Unrestricted: { "x-revturbine-data-classification": "unrestricted" }
};
var DATA_CLASSIFICATION_META_KEY = "x-revturbine-data-classification";
var SCHEMA_PERSISTENCE_META_KEY = "x-revturbine-schema-persistence";
var SCHEMA_EXPOSURE_META_KEY = "x-revturbine-schema-exposure";
var READ_ONLY_META_KEY = "readOnly";
function getSchemaClassification(schema) {
  const meta = schema.meta();
  const persistence = meta?.[SCHEMA_PERSISTENCE_META_KEY];
  const exposure = meta?.[SCHEMA_EXPOSURE_META_KEY];
  if ((persistence === SchemaPersistence.Persisted || persistence === SchemaPersistence.Transient) && (exposure === SchemaExposure.Internal || exposure === SchemaExposure.External)) {
    return {
      persistence,
      exposure
    };
  }
  return void 0;
}
function getFieldClassification(schema) {
  const meta = schema.meta();
  const classification = meta?.[DATA_CLASSIFICATION_META_KEY];
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
  const meta = schema.meta();
  const exposure = meta?.[SCHEMA_EXPOSURE_META_KEY];
  if (exposure === SchemaExposure.Internal || exposure === SchemaExposure.External) {
    return exposure;
  }
  return void 0;
}
function getSchemaPersistence(schema) {
  const meta = schema.meta();
  const persistence = meta?.[SCHEMA_PERSISTENCE_META_KEY];
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

// ../revturbine-scaffold/src/core/common.ts
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
var SurfaceTypeSchema = z2.enum([
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
]).meta(
  { id: "SurfaceType", "x-revturbine-schema-persistence": Transient, "x-revturbine-schema-exposure": External }
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
var StudioSurfaceTypeSchema = z2.enum([
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
]).meta({ id: "StudioSurfaceType", "x-revturbine-schema-persistence": Transient, "x-revturbine-schema-exposure": Internal });
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

// ../revturbine-scaffold/src/core/identity.ts
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

// ../revturbine-scaffold/src/plans/models/schema.ts
import { z as z5 } from "zod";

// ../revturbine-scaffold/src/core/openapi/helpers.ts
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

// ../revturbine-scaffold/src/plans/models/schema.ts
var { Unrestricted: Unrestricted2, Financial } = DataClassification;
var { Persisted: Persisted2, Transient: Transient2 } = SchemaPersistence;
var { External: External2 } = SchemaExposure;
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
  metadata: MetadataField.meta(Unrestricted2)
}).meta(
  {
    id: "Plan",
    "x-revturbine-schema-persistence": Persisted2,
    "x-revturbine-schema-exposure": External2,
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
  stripe_price_id: z5.string().optional().meta(Unrestricted2),
  price_source: PriceSourceSchema.default("static").meta(Unrestricted2)
}).meta(
  {
    id: "PlanVariation",
    "x-revturbine-schema-persistence": Persisted2,
    "x-revturbine-schema-exposure": External2,
    ...mintedIdentity()
  }
);
var PlanVariationAnchorSchema = makeAnchor("PlanVariationAnchor");
var AddOnSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z5.string().min(1).meta({ ...Unrestricted2, readOnly: true }),
  name: NameField.meta(Unrestricted2),
  handle: HandleField.meta(Unrestricted2),
  sort_order: z5.number().int().default(0).meta(Unrestricted2),
  metadata: MetadataField.meta(Unrestricted2)
}).meta(
  {
    id: "AddOn",
    "x-revturbine-schema-persistence": Persisted2,
    "x-revturbine-schema-exposure": External2,
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
  stripe_price_id: z5.string().optional().meta(Unrestricted2),
  price_source: PriceSourceSchema.default("static").meta(Unrestricted2)
}).meta(
  {
    id: "AddOnVariation",
    "x-revturbine-schema-persistence": Persisted2,
    "x-revturbine-schema-exposure": External2,
    ...mintedIdentity()
  }
);
var AddOnVariationAnchorSchema = makeAnchor("AddOnVariationAnchor");
var StripePriceMockBillingPeriodSchema = z5.enum(["monthly", "annual", "one_time", "custom"]).meta({
  id: "StripePriceMockBillingPeriod",
  "x-revturbine-schema-persistence": Transient2,
  "x-revturbine-schema-exposure": External2
});
var StripePriceMockSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  stripe_price_id: z5.string().min(1).meta(Unrestricted2),
  stripe_product_id: z5.string().min(1).meta(Unrestricted2),
  billing_period: StripePriceMockBillingPeriodSchema.meta(Unrestricted2),
  unit_amount_cents: z5.number().int().min(0).nullable().default(null).meta(Financial),
  currency: CurrencySchema.meta(Financial),
  pricing_model: PricingModelSchema.meta(Unrestricted2),
  nickname: z5.string().nullable().default(null).meta(Unrestricted2)
}).meta({
  id: "StripePriceMock",
  "x-revturbine-schema-persistence": Persisted2,
  "x-revturbine-schema-exposure": External2
});
var PlanWriteSchema = toWritableSchema(PlanSchema);
var PlanVariationWriteSchema = toWritableSchema(PlanVariationSchema);
var AddOnWriteSchema = toWritableSchema(AddOnSchema);
var AddOnVariationWriteSchema = toWritableSchema(AddOnVariationSchema);
var StripePriceMockWriteSchema = toWritableSchema(StripePriceMockSchema);
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
  "/api/stripe-prices-mock": {
    get: operation({
      operationId: "listStripePriceMocks",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List Stripe price mocks",
      tags: ["plans"],
      responses: { "200": { description: "Stripe price mock list", content: { "application/json": { schema: ListEnvelope(StripePriceMockSchema) } } } },
      "x-revturbine-operation": { exposure: "external", resource: "stripe-prices-mock", persistence: { table: "stripePricesMock", mode: "list" } }
    }),
    post: operation({
      operationId: "createStripePriceMock",
      summary: "Create Stripe price mock",
      tags: ["plans"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(StripePriceMockSchema) } } },
      responses: { "201": { description: "Created Stripe price mock", content: { "application/json": { schema: StripePriceMockSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "stripe-prices-mock", persistence: { table: "stripePricesMock", mode: "create" } }
    })
  },
  "/api/stripe-prices-mock/{id}": {
    get: operation({
      operationId: "getStripePriceMock",
      requestParams: { path: z5.object({ id: z5.string() }) },
      summary: "Get Stripe price mock by ID",
      tags: ["plans"],
      responses: { "200": { description: "Stripe price mock detail", content: { "application/json": { schema: StripePriceMockSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "stripe-prices-mock", persistence: { table: "stripePricesMock", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateStripePriceMock",
      requestParams: { path: z5.object({ id: z5.string() }) },
      summary: "Update Stripe price mock",
      tags: ["plans"],
      requestBody: { required: true, content: { "application/json": { schema: StripePriceMockWriteSchema } } },
      responses: { "200": { description: "Updated Stripe price mock", content: { "application/json": { schema: StripePriceMockSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "stripe-prices-mock", persistence: { table: "stripePricesMock", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteStripePriceMock",
      requestParams: { path: z5.object({ id: z5.string() }) },
      summary: "Delete Stripe price mock",
      tags: ["plans"],
      responses: { "204": { description: "Stripe price mock deleted" } },
      "x-revturbine-operation": { exposure: "external", resource: "stripe-prices-mock", persistence: { table: "stripePricesMock", mode: "delete" } }
    })
  }
};

// ../revturbine-scaffold/src/entitlements/models/schema.ts
import { z as z6 } from "zod";
var { Unrestricted: Unrestricted3 } = DataClassification;
var { Persisted: Persisted3, Transient: Transient3 } = SchemaPersistence;
var { Internal: Internal2, External: External3 } = SchemaExposure;
var UsagePeriodScopeSchema = z6.enum(["per_month", "per_year", "per_billing_period", "lifetime", "concurrent", "per_instance", "per_second", "per_minute", "per_hour", "per_6_hours", "per_day", "per_week"]).meta(
  { id: "UsagePeriodScope", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": External3 }
);
var UsageAllocationSchema = z6.enum(["account_pool", "per_instance", "per_user", "per_user_pooled"]).meta(
  { id: "UsageAllocation", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": External3 }
);
var EntitlementGrantStatusSchema = z6.enum(["allowed", "limited", "denied"]).meta(
  { id: "EntitlementGrantStatus", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": External3 }
);
var EntitlementGrantSourceSchema = z6.enum(["rule", "user_context", "override"]).meta(
  { id: "EntitlementGrantSource", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": External3 }
);
var EnforcementModeSchema = z6.enum(["hard_block", "soft_block", "degrade", "allow_overage"]).meta(
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
    "x-revturbine-data-classification": "operational"
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
    "x-revturbine-data-classification": "operational"
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
var EntitlementRulePeriodUnitSchema = z6.enum(["month", "day", "week", "quarter", "year", "billing_period", "on_purchase", "hour", "six_hours"]).meta(
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
    ...namedIdentity()
  }
);
var EntitlementAnchorSchema = makeAnchor("EntitlementAnchor");
var PlanEntitlementSchema = TenantIdField.merge(AnchorFields).merge(VersionFields).extend({
  handle: HandleField.meta({ ...Unrestricted3, readOnly: true }),
  id: z6.number().int().meta({ ...Unrestricted3, readOnly: true }),
  plan_id: z6.string().min(1).meta(Unrestricted3),
  entitlement_id: z6.string().min(1).meta(Unrestricted3),
  value: z6.union([z6.boolean(), z6.number(), z6.string()]).meta(Unrestricted3),
  override_label: z6.string().max(200).optional().meta(Unrestricted3)
}).meta(
  {
    id: "PlanEntitlement",
    "x-revturbine-schema-persistence": Persisted3,
    "x-revturbine-schema-exposure": Internal2,
    ...mintedIdentity()
  }
);
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
  // Credits reset cadence ("refills every"). `billing_period` resolves at
  // runtime to the customer's Variation billing period; structural guard below.
  reset_period: EntitlementRulePeriodUnitSchema.optional().meta(Unrestricted3),
  // Type-specific fields (populated based on entitlement type)
  limit_value: z6.union([z6.number(), z6.literal("unlimited")]).optional().meta(Unrestricted3),
  enforcement: EnforcementModeSchema.optional().meta(Unrestricted3),
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
  stripe_metered_price_id: z6.string().optional().meta(Unrestricted3)
}).meta(
  {
    id: "EntitlementRule",
    "x-revturbine-schema-persistence": Persisted3,
    "x-revturbine-schema-exposure": Internal2,
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
    ...mintedIdentity()
  }
);
var EntitlementWriteSchema = toWritableSchema(EntitlementSchema);
var EntitlementRuleWriteSchema = toWritableSchema(EntitlementRuleSchema);
var PlanEntitlementWriteSchema = toWritableSchema(PlanEntitlementSchema);
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
  },
  "/api/plan-entitlements": {
    get: operation({
      operationId: "listPlanEntitlements",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List plan \u2194 entitlement mappings",
      tags: ["entitlements"],
      responses: { "200": { description: "Plan entitlement list", content: { "application/json": { schema: ListEnvelope(PlanEntitlementSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "plan-entitlements", persistence: { table: "planEntitlements", mode: "list" } }
    }),
    post: operation({
      operationId: "createPlanEntitlement",
      summary: "Create plan \u2194 entitlement mapping",
      tags: ["entitlements"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(PlanEntitlementSchema) } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: PlanEntitlementSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "plan-entitlements", persistence: { table: "planEntitlements", mode: "create" } }
    })
  },
  "/api/plan-entitlements/{id}": {
    get: operation({
      operationId: "getPlanEntitlement",
      requestParams: { path: z6.object({ id: z6.string() }) },
      summary: "Get plan \u2194 entitlement mapping",
      tags: ["entitlements"],
      responses: { "200": { description: "Plan entitlement detail", content: { "application/json": { schema: PlanEntitlementSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "plan-entitlements", persistence: { table: "planEntitlements", mode: "get" } }
    }),
    put: operation({
      operationId: "updatePlanEntitlement",
      requestParams: { path: z6.object({ id: z6.string() }) },
      summary: "Update plan \u2194 entitlement mapping",
      tags: ["entitlements"],
      requestBody: { required: true, content: { "application/json": { schema: PlanEntitlementWriteSchema } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: PlanEntitlementSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "plan-entitlements", persistence: { table: "planEntitlements", mode: "update" } }
    }),
    delete: operation({
      operationId: "deletePlanEntitlement",
      requestParams: { path: z6.object({ id: z6.string() }) },
      summary: "Delete plan \u2194 entitlement mapping",
      tags: ["entitlements"],
      responses: { "204": { description: "Deleted" }, default: { description: "Error", content: { "application/json": { schema: ErrorEnvelope } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "plan-entitlements", persistence: { table: "planEntitlements", mode: "delete" } }
    })
  }
};

// ../revturbine-scaffold/src/placements/models/schema.ts
import { z as z7 } from "zod";
var { Unrestricted: Unrestricted4 } = DataClassification;
var { Persisted: Persisted4, Transient: Transient4 } = SchemaPersistence;
var { External: External4, Internal: Internal3 } = SchemaExposure;
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
    "x-revturbine-data-classification": "operational"
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
  threshold_percent: z7.number().min(0).max(100).optional().meta(Unrestricted4),
  trial_type: z7.enum(["free", "reverse"]).optional().meta(Unrestricted4),
  trigger_type: z7.string().optional().meta(Unrestricted4),
  trial_progress_percent: z7.number().min(0).max(100).optional().meta(Unrestricted4),
  days_before_end: z7.number().int().min(0).optional().meta(Unrestricted4),
  qualifier: z7.enum(["none_always_on", "overage_vs_upgrade", "time_bound", "payment_failed", "payment_at_risk"]).optional().meta(Unrestricted4),
  activation_window_start: z7.string().datetime().optional().meta(Unrestricted4),
  activation_window_end: z7.string().datetime().optional().meta(Unrestricted4),
  metadata: MetadataField.meta(Unrestricted4)
}).meta(
  {
    id: "Placement",
    "x-revturbine-schema-persistence": Persisted4,
    "x-revturbine-schema-exposure": External4,
    ...namedIdentity()
  }
);
var PlacementAnchorSchema = makeAnchor("PlacementAnchor");
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
  recommendation_strategy: z7.enum(["next_tier_up", "best_value", "custom"]).optional().default("next_tier_up").meta(Unrestricted4),
  recommendation_plan_override: z7.string().optional().meta(Unrestricted4)
}).meta(
  {
    id: "PlacementPayload",
    "x-revturbine-schema-persistence": Persisted4,
    "x-revturbine-schema-exposure": External4,
    // KENT-REVIEW (plan 121): defaulted to Bucket 2 on (placement_id, drag_order)
    // — a payload's ordinal within its placement. This is the strongest Bucket-3
    // candidate (reordering a key edit would fork history); if lineage must survive
    // reordering it should become the first Bucket-3 member with its own surrogate,
    // which then needs a REQ-6 carve-out from the "canonical_id drops everywhere".
    ...mintedIdentity()
  }
);
var PlacementPayloadAnchorSchema = makeAnchor("PlacementPayloadAnchor");
var PlacementVariantSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  handle: HandleField.meta({ ...Unrestricted4, readOnly: true }),
  placement_payload_id: z7.string().min(1).meta(Unrestricted4),
  experiment_id: z7.string().min(1).meta(Unrestricted4),
  variant_name: z7.string().min(1).max(200).meta(Unrestricted4),
  is_control: z7.boolean().default(false).meta(Unrestricted4),
  traffic_allocation_percent: z7.number().min(0).max(100).meta(Unrestricted4),
  override_fields: z7.record(z7.string(), z7.unknown()).default({}).meta(Unrestricted4),
  status: z7.enum(["active", "paused", "complete"]).default("active").meta(Unrestricted4)
}).meta(
  {
    id: "PlacementVariant",
    "x-revturbine-schema-persistence": Persisted4,
    "x-revturbine-schema-exposure": Internal3,
    ...mintedIdentity()
  }
);
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
      responses: { "201": { description: "Created", content: { "application/json": { schema: PlacementSchema } } } },
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
      responses: { "200": { description: "Updated", content: { "application/json": { schema: PlacementSchema } } } },
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

// ../revturbine-scaffold/src/user/models/schema.ts
import { z as z8 } from "zod";
var { Unrestricted: Unrestricted5, Pii } = DataClassification;
var { Persisted: Persisted5, Transient: Transient5 } = SchemaPersistence;
var { External: External5 } = SchemaExposure;
var UserTrialStatusSchema = z8.object({
  in_trial: z8.boolean().meta(Unrestricted5),
  trial_type: z8.string().optional().meta(Unrestricted5),
  plan_handle: z8.string().optional().meta(Unrestricted5),
  // 'converted' reflects a server-side analytic-event transition
  // (typically a Stripe webhook like `customer.subscription.created`
  // or `invoice.payment_succeeded` against a trialing subscription)
  // that the control plane processes to flip TrialInstance.status.
  // The SDK reads this state from the decision-API response — it does
  // NOT derive 'converted' client-side. trial_lifecycle.v1 rules
  // matching on 'trial_converted' fire while the user's status carries
  // this value, enabling conversion-celebration / receipt placements.
  state: z8.enum(["active", "running_out", "expired", "converted", "none"]).optional().meta(Unrestricted5),
  /**
   * Trial limit model — mirrors the rule's `trial_limit_type`. The
   * SDK uses this to decide which numeric fields below to surface;
   * the placement-resolver gates `trial_ending(days_before_end)`
   * only when `trial_limit_type === 'time'`.
   */
  trial_limit_type: z8.enum(["time", "usage"]).optional().meta(Unrestricted5),
  /**
   * Universal progress metric, 0..100. Computed by
   * `deriveLocalTrialStatusFromInstance` from elapsed days
   * (time-based) or consumed/limit (usage-based). Trial rule
   * modules + placement-resolver supersession consume this field
   * so they don't have to branch on the limit type.
   */
  progress_percent: z8.number().min(0).max(100).optional().meta(Unrestricted5),
  // Time-based numeric fields. Populated when trial_limit_type='time'.
  day_number: z8.number().int().min(0).optional().meta(Unrestricted5),
  days_remaining: z8.number().int().min(0).optional().meta(Unrestricted5),
  // Usage-based numeric fields. Populated when trial_limit_type='usage'.
  usage_entitlement_handle: z8.string().optional().meta(Unrestricted5),
  usage_consumed: z8.number().int().min(0).optional().meta(Unrestricted5),
  usage_remaining: z8.number().int().min(0).optional().meta(Unrestricted5),
  usage_limit: z8.number().int().min(0).optional().meta(Unrestricted5)
}).meta(
  { id: "UserTrialStatus", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External5 }
);
var UserUsageEntrySchema = z8.object({
  entitlement_handle: z8.string().min(1).meta(Unrestricted5),
  unit: z8.string().min(1).meta(Unrestricted5),
  amount: z8.number().min(0).meta(Unrestricted5),
  limit: z8.number().min(0).optional().meta(Unrestricted5),
  reset_date: z8.string().optional().meta(Unrestricted5)
}).meta(
  { id: "UserUsageEntry", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External5 }
);
var UserPlanContextSchema = z8.object({
  id: z8.string().min(1).meta(Unrestricted5),
  name: z8.string().min(1).meta(Unrestricted5),
  price: z8.string().optional().meta(Unrestricted5),
  billing_period: z8.enum(["monthly", "annual", "none"]).optional().meta(Unrestricted5)
}).meta(
  { id: "UserPlanContext", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External5 }
);
var UserInstanceContextSchema = z8.object({
  product_instance_id: z8.string().min(1).meta(Unrestricted5),
  user_id: z8.string().min(1).meta(Pii),
  plan: UserPlanContextSchema.optional().meta(Unrestricted5),
  /** Usage entries for this instance, keyed by entitlement handle. */
  usage: z8.record(z8.string(), UserUsageEntrySchema).default({}).meta(Unrestricted5),
  trial: UserTrialStatusSchema.optional().meta(Unrestricted5),
  /** Entitlements resolved at this instance level, keyed by handle. */
  entitlements: z8.record(z8.string(), z8.union([z8.boolean(), EntitlementGrantSchema])).default({}).meta(Unrestricted5)
}).meta(
  {
    id: "UserInstanceContext",
    "x-revturbine-schema-persistence": Persisted5,
    "x-revturbine-schema-exposure": External5
  }
);
var UserContextSchema = IdField.merge(TenantIdField).merge(TimestampFields).extend({
  user_id: z8.string().min(1).meta(Pii),
  account_id: z8.string().min(1).nullable().optional().meta(Pii),
  email: z8.string().email().nullable().optional().meta(Pii),
  /** Optional email classification (e.g. `business`, `personal`). */
  email_type: z8.string().optional().meta(Unrestricted5),
  plan: UserPlanContextSchema.optional().meta(Unrestricted5),
  /** Aggregate usage entries across all instances, keyed by handle. */
  usage: z8.record(z8.string(), UserUsageEntrySchema).default({}).meta(Unrestricted5),
  trial: UserTrialStatusSchema.optional().meta(Unrestricted5),
  /** Account-level entitlements, keyed by handle. */
  entitlements: z8.record(z8.string(), z8.union([z8.boolean(), EntitlementGrantSchema])).default({}).meta(Unrestricted5),
  /** Per-instance breakdowns when the account has multiple product instances. */
  instances: z8.array(UserInstanceContextSchema).optional().meta(Unrestricted5),
  /** Customer-defined fields: role, app-level permissions, display prefs. */
  custom: z8.record(z8.string(), z8.union([z8.string(), z8.number(), z8.boolean(), z8.null()])).default({}).meta(Pii),
  /**
   * Transient personalization token map.
   *
   * Holds SDK-derived tokens (plan_name, usage_current, etc.) merged with
   * app-provided tokens.  Not persisted to the backend — rebuilt on each
   * SDK session from context + exported config.
   */
  personalization: z8.record(z8.string(), z8.union([z8.string(), z8.number()])).default({}).meta({ ...Unrestricted5, "x-revturbine-schema-persistence": Transient5 }),
  // ── Derived-entitlement cache (plan 74 REQ-12/REQ-13) ──────────────
  // `entitlements` above is the rule-evaluated projection — a CACHE, not
  // source of truth. These stamps record what it was computed against so a
  // read can detect staleness: recompute when the active config version
  // moved on OR the context hash changed.
  /** Active config version (activated change-set id / compiled-bundle stamp) the cache was computed against. */
  derived_config_version: z8.string().nullable().optional().meta(Unrestricted5),
  /** Deterministic `computeUserContextHash` of the inputs the cache was computed from (REQ-13 ETag value). */
  context_hash: z8.string().nullable().optional().meta(Unrestricted5),
  /** When the cached entitlements were last (re)computed. */
  derived_computed_at: NullableDatetimeField.meta(Unrestricted5)
}).meta(
  { id: "UserContext", "x-revturbine-schema-persistence": Persisted5, "x-revturbine-schema-exposure": External5 }
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
      "x-revturbine-operation": { exposure: "internal", resource: "user-contexts", persistence: { table: "userContexts", mode: "create" } }
    })
  },
  "/api/user-contexts/{userContextId}": {
    get: operation({
      operationId: "getUserContext",
      requestParams: { path: z8.object({ userContextId: z8.string() }) },
      summary: "Get user context",
      tags: ["users"],
      responses: { "200": { description: "User context", content: { "application/json": { schema: UserContextSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "user-contexts", persistence: { table: "userContexts", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateUserContext",
      requestParams: { path: z8.object({ userContextId: z8.string() }) },
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
      requestParams: { path: z8.object({ userContextId: z8.string() }) },
      summary: "Delete a user context",
      tags: ["users"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "user-contexts", persistence: { table: "userContexts", mode: "delete" } }
    })
  }
};

// ../revturbine-scaffold/src/customers/models/schema.ts
import { z as z9 } from "zod";
var { Unrestricted: Unrestricted6, Pii: Pii2 } = DataClassification;
var { Persisted: Persisted6, Transient: Transient6 } = SchemaPersistence;
var { Internal: Internal4 } = SchemaExposure;
var IdentitySchema = z9.object({
  external_id: z9.string().min(1).meta(Pii2),
  traits: z9.record(z9.string(), z9.unknown()).default({}).meta(Pii2),
  plan_id: z9.string().optional().meta(Unrestricted6)
}).meta(
  {
    id: "Identity",
    "x-revturbine-schema-persistence": Persisted6,
    "x-revturbine-schema-exposure": Internal4
  }
);
var CustomerSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  external_id: z9.string().min(1).meta(Pii2),
  identity: IdentitySchema.meta(Pii2),
  stripe_customer_id: z9.string().optional().meta(Unrestricted6),
  current_plan_id: z9.string().optional().meta(Unrestricted6),
  subscription_status: z9.enum(["active", "past_due", "canceled", "trialing", "unpaid", "none"]).default("none").meta(Unrestricted6),
  status: z9.enum(["active", "churned", "trial", "suspended"]).default("active").meta(Unrestricted6),
  metadata: MetadataField.meta(Unrestricted6)
}).meta(
  {
    id: "Customer",
    "x-revturbine-schema-persistence": Persisted6,
    "x-revturbine-schema-exposure": Internal4
  }
);
var CustomerOverrideDurationSchema = z9.enum([
  "permanent",
  "for_duration"
]).meta(
  {
    id: "CustomerOverrideDuration",
    "x-revturbine-schema-persistence": Transient6,
    "x-revturbine-schema-exposure": Internal4
  }
);
var CustomerOverrideTypeSchema = z9.enum(["grant_plan", "grant_addon", "grant_entitlement"]).meta(
  { id: "CustomerOverrideType", "x-revturbine-schema-persistence": Transient6, "x-revturbine-schema-exposure": Internal4 }
);
var CustomerOverrideStatusSchema = z9.enum(["active", "expired", "revoked"]).meta(
  { id: "CustomerOverrideStatus", "x-revturbine-schema-persistence": Transient6, "x-revturbine-schema-exposure": Internal4 }
);
var CustomerOverrideSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  handle: HandleField.meta({ ...Unrestricted6, readOnly: true }),
  customer_id: z9.string().min(1).meta(Pii2),
  customer_id_list: z9.array(z9.string()).optional().meta(Pii2),
  override_type: CustomerOverrideTypeSchema.meta(Unrestricted6),
  target_id: z9.string().min(1).meta(Unrestricted6),
  value: z9.record(z9.string(), z9.unknown()).default({}).meta(Unrestricted6),
  duration_type: CustomerOverrideDurationSchema.default("permanent").meta(Unrestricted6),
  duration_value: z9.string().optional().meta(Unrestricted6),
  expiry_date: NullableDatetimeField.meta(Unrestricted6),
  status: CustomerOverrideStatusSchema.default("active").meta(Unrestricted6),
  reason: z9.string().max(500).optional().meta(Unrestricted6),
  created_by: z9.string().optional().meta(Unrestricted6)
}).meta(
  {
    id: "CustomerOverride",
    "x-revturbine-schema-persistence": Persisted6,
    "x-revturbine-schema-exposure": Internal4,
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
      requestParams: { path: z9.object({ customerId: z9.string() }) },
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
      requestParams: { path: z9.object({ overrideId: z9.string() }) },
      summary: "Get customer override",
      tags: ["customers"],
      responses: { "200": { description: "Override", content: { "application/json": { schema: CustomerOverrideSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "customer-overrides", persistence: { table: "customerOverrides", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateCustomerOverride",
      requestParams: { path: z9.object({ overrideId: z9.string() }) },
      summary: "Update customer override",
      tags: ["customers"],
      requestBody: { required: true, content: { "application/json": { schema: CustomerOverrideSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: CustomerOverrideSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "customer-overrides", persistence: { table: "customerOverrides", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteCustomerOverride",
      requestParams: { path: z9.object({ overrideId: z9.string() }) },
      summary: "Delete customer override",
      tags: ["customers"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "customer-overrides", persistence: { table: "customerOverrides", mode: "delete" } }
    })
  },
  "/api/customer-overrides/{overrideId}/revoke": {
    post: operation({
      operationId: "revokeCustomerOverride",
      requestParams: { path: z9.object({ overrideId: z9.string() }) },
      summary: "Revoke an active customer override",
      tags: ["customers"],
      responses: { "200": { description: "Revoked", content: { "application/json": { schema: CustomerOverrideSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "customer-overrides", persistence: { table: "customerOverrides", mode: "update" } }
    })
  },
  "/api/customer-overrides/{overrideId}/duplicate": {
    post: operation({
      operationId: "duplicateCustomerOverride",
      requestParams: { path: z9.object({ overrideId: z9.string() }) },
      summary: "Duplicate customer override for another customer",
      tags: ["customers"],
      requestBody: { required: true, content: { "application/json": { schema: z9.object({ customer_id: z9.string() }) } } },
      responses: { "201": { description: "Duplicated", content: { "application/json": { schema: CustomerOverrideSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "customer-overrides", persistence: { table: "customerOverrides", mode: "create" } }
    })
  }
};

// ../revturbine-scaffold/src/segments/models/schema.ts
import { z as z10 } from "zod";
var { Unrestricted: Unrestricted7 } = DataClassification;
var { Persisted: Persisted7, Transient: Transient7 } = SchemaPersistence;
var { Internal: Internal5 } = SchemaExposure;
var DimensionCategorySchema = z10.enum(["default", "custom"]).meta(
  { id: "DimensionCategory", "x-revturbine-schema-persistence": Transient7, "x-revturbine-schema-exposure": Internal5 }
);
var DimensionSourceTypeSchema = z10.enum(["system", "sdk_trait", "sdk_trait_enum", "cdp_property", "manual_list"]).meta(
  { id: "DimensionSourceType", "x-revturbine-schema-persistence": Transient7, "x-revturbine-schema-exposure": Internal5 }
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
    "x-revturbine-schema-exposure": Internal5,
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
    "x-revturbine-schema-exposure": Internal5,
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
  is_active: z10.boolean().default(true).meta(Unrestricted7),
  estimated_size: z10.number().int().min(0).nullable().default(null).meta(Unrestricted7),
  metadata: MetadataField.meta(Unrestricted7)
}).meta(
  {
    id: "Segment",
    "x-revturbine-schema-persistence": Persisted7,
    "x-revturbine-schema-exposure": Internal5,
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

// ../revturbine-scaffold/src/content/models/schema.ts
import { z as z11 } from "zod";
var { Unrestricted: Unrestricted8 } = DataClassification;
var { Persisted: Persisted8, Transient: Transient8 } = SchemaPersistence;
var { External: External6 } = SchemaExposure;
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
  { id: "Message", "x-revturbine-schema-persistence": Persisted8, "x-revturbine-schema-exposure": External6, ...mintedIdentity() }
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
  { id: "CtaPath", "x-revturbine-schema-persistence": Persisted8, "x-revturbine-schema-exposure": External6, ...namedIdentity() }
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
  { id: "TemplateFieldType", "x-revturbine-schema-persistence": Persisted8, "x-revturbine-schema-exposure": External6 }
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
  { id: "FieldDefinition", "x-revturbine-schema-persistence": Persisted8, "x-revturbine-schema-exposure": External6 }
);
var SurfaceTemplateSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z11.string().min(1).meta({ ...Unrestricted8, readOnly: true }),
  name: NameField.meta(Unrestricted8),
  handle: HandleField.meta(Unrestricted8),
  surface_type: StudioSurfaceTypeSchema.meta(Unrestricted8),
  field_definitions: z11.array(FieldDefinitionSchema).default([]).meta(Unrestricted8),
  description: DescriptionField.meta(Unrestricted8)
}).meta(
  { id: "SurfaceTemplate", "x-revturbine-schema-persistence": Persisted8, "x-revturbine-schema-exposure": External6, ...namedIdentity() }
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
  { id: "MessageBlockRecord", "x-revturbine-schema-persistence": Persisted8, "x-revturbine-schema-exposure": External6, ...namedIdentity() }
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

// ../revturbine-scaffold/src/ui/models/schema.ts
import { z as z12 } from "zod";
var { Unrestricted: Unrestricted9, Pii: Pii3 } = DataClassification;
var { Persisted: Persisted9, Transient: Transient9 } = SchemaPersistence;
var { Internal: Internal6, External: External7 } = SchemaExposure;
var ThemeSchema = z12.object({
  id: z12.string().min(1).meta({ ...Unrestricted9, readOnly: true }),
  name: z12.string().min(1).max(120).meta(Unrestricted9),
  mode: z12.enum(["light", "dark", "system"]).default("system").meta(Unrestricted9),
  tokens: z12.record(z12.string(), z12.string()).default({}).meta(Unrestricted9)
}).meta(
  {
    id: "Theme",
    "x-revturbine-schema-persistence": Persisted9,
    "x-revturbine-schema-exposure": External7
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
    "x-revturbine-schema-exposure": Internal6
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

// ../revturbine-scaffold/src/analytics/models/schema.ts
import { z as z13 } from "zod";
var { Unrestricted: Unrestricted10, Financial: Financial2 } = DataClassification;
var { Persisted: Persisted10, Transient: Transient10 } = SchemaPersistence;
var { External: External8, Internal: Internal7 } = SchemaExposure;
var CohortMonthSchema = z13.object({
  month: z13.string().meta(Unrestricted10),
  cohort_size: z13.number().int().min(0).meta(Unrestricted10),
  retained: z13.number().int().min(0).meta(Unrestricted10),
  retention_rate: z13.number().min(0).max(1).meta(Unrestricted10),
  revenue_cents: z13.number().int().min(0).meta(Financial2)
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
  revenue_cents: z13.number().int().min(0).meta(Financial2)
}).meta(
  { id: "PlacementPerformanceRow", "x-revturbine-schema-persistence": Transient10, "x-revturbine-schema-exposure": External8 }
);
var RevenueMetricSchema = z13.object({
  date: z13.string().meta(Unrestricted10),
  mrr_cents: z13.number().int().min(0).meta(Financial2),
  arr_cents: z13.number().int().min(0).meta(Financial2),
  new_mrr_cents: z13.number().int().min(0).meta(Financial2),
  churned_mrr_cents: z13.number().int().min(0).meta(Financial2),
  expansion_mrr_cents: z13.number().int().min(0).meta(Financial2),
  net_new_mrr_cents: z13.number().int().meta(Financial2)
}).meta(
  { id: "RevenueMetric", "x-revturbine-schema-persistence": Transient10, "x-revturbine-schema-exposure": External8 }
);
var KpiAggregateSchema = z13.object({
  metric_key: z13.string().min(1).meta(Unrestricted10),
  label: z13.string().meta(Unrestricted10),
  current_value: z13.number().meta(Financial2),
  previous_value: z13.number().nullable().default(null).meta(Financial2),
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
  { id: "DriftReport", "x-revturbine-schema-persistence": Persisted10, "x-revturbine-schema-exposure": Internal7 }
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
  { id: "Alert", "x-revturbine-schema-persistence": Persisted10, "x-revturbine-schema-exposure": Internal7 }
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

// ../revturbine-scaffold/src/events/models/schema.ts
import { z as z14 } from "zod";
var { Unrestricted: Unrestricted11, Pii: Pii4 } = DataClassification;
var { Persisted: Persisted11, Transient: Transient11 } = SchemaPersistence;
var { Internal: Internal8, External: External9 } = SchemaExposure;
var EventSourceSchema = z14.enum(["clickstream", "telemetry", "sdk", "workflow", "system"]).meta(
  {
    id: "EventSource",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var EventEnvelopeSchema = IdField.extend({
  event_type: z14.string().min(1).meta(Unrestricted11),
  source: EventSourceSchema.default("sdk").meta(Unrestricted11),
  tenant_id: z14.string().min(1).optional().meta(Unrestricted11),
  user_id: z14.string().min(1).optional().meta(Pii4),
  session_id: z14.string().min(1).optional().meta(Pii4),
  occurred_at: z14.string().datetime().meta(Unrestricted11),
  request_id: z14.string().min(1).meta(Unrestricted11),
  attributes: z14.record(z14.string(), z14.unknown()).default({}).meta(Unrestricted11),
  payload: z14.record(z14.string(), z14.unknown()).default({}).meta(Unrestricted11)
}).meta(
  {
    id: "EventEnvelope",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": Internal8
  }
);
var IngestedEventSchema = EventEnvelopeSchema.extend({
  ingested_at: z14.string().datetime().meta(Unrestricted11)
}).meta(
  {
    id: "IngestedEvent",
    "x-revturbine-schema-persistence": Persisted11,
    "x-revturbine-schema-exposure": Internal8
  }
);
var EventIngestBatchSchema = z14.array(
  z14.object({
    id: z14.string().min(1).optional().meta(Unrestricted11),
    event_type: z14.string().min(1).meta(Unrestricted11),
    occurred_at: z14.string().datetime().optional().meta(Unrestricted11),
    tenant_id: z14.string().min(1).optional().meta(Unrestricted11),
    user_id: z14.string().min(1).optional().meta(Pii4),
    session_id: z14.string().min(1).optional().meta(Pii4),
    attributes: z14.record(z14.string(), z14.unknown()).optional().meta(Unrestricted11),
    payload: z14.record(z14.string(), z14.unknown()).optional().meta(Unrestricted11),
    message: z14.string().optional().meta(Unrestricted11),
    level: z14.string().optional().meta(Unrestricted11),
    path: z14.string().optional().meta(Unrestricted11)
  })
).meta(
  {
    id: "EventIngestBatch",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": Internal8
  }
);
var TreatmentInteractionTypeSchema = z14.enum([
  "impression",
  "dismiss",
  "remind_me_later",
  "cta_clicked",
  "cta_completed",
  "suppress"
]).meta(
  {
    id: "TreatmentInteractionType",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var TreatmentInteractionInputSchema = z14.object({
  user_id: z14.string().min(1).meta(Pii4),
  placement_id: z14.string().min(1).meta(Unrestricted11),
  treatment_id: z14.string().min(1).optional().meta(Unrestricted11),
  // Presentation context (plan 114) — carried so a treatment interaction can
  // be persisted as a `placement_presentations` row. Optional for back-compat:
  // callers that only record an interaction (not a full presentation) omit them.
  surface_slot_id: z14.string().min(1).optional().meta(Unrestricted11),
  surface_template_id: z14.string().min(1).optional().meta(Unrestricted11),
  payload_id: z14.string().min(1).optional().meta(Unrestricted11),
  interaction_type: TreatmentInteractionTypeSchema.meta(Unrestricted11),
  interaction_at: z14.string().datetime().optional().meta(Unrestricted11),
  metadata: z14.record(z14.string(), z14.unknown()).optional().meta(Unrestricted11)
}).meta(
  {
    id: "TreatmentInteractionInput",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var TriggerEventTypeSchema = z14.enum([
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
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var TrialTriggerPayloadSchema = z14.object({
  days_remaining: z14.number().int().min(0).optional().meta(Unrestricted11)
}).meta(
  {
    id: "TrialTriggerPayload",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var UsageTriggerPayloadSchema = z14.object({
  entitlement_handle: z14.string().optional().meta(Unrestricted11),
  current_usage: z14.number().min(0).optional().meta(Unrestricted11),
  usage_limit: z14.number().min(0).optional().meta(Unrestricted11),
  usage_percent: z14.number().min(0).max(100).optional().meta(Unrestricted11),
  threshold: z14.number().min(0).optional().meta(Unrestricted11),
  balance: z14.number().min(0).optional().meta(Unrestricted11),
  allocation: z14.number().min(0).optional().meta(Unrestricted11),
  seats_used: z14.number().int().min(0).optional().meta(Unrestricted11),
  seats_allowed: z14.number().int().min(0).optional().meta(Unrestricted11)
}).meta(
  {
    id: "UsageTriggerPayload",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var FeatureGateTriggerPayloadSchema = z14.object({
  feature: z14.string().min(1).meta(Unrestricted11)
}).meta(
  {
    id: "FeatureGateTriggerPayload",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var PaymentTriggerPayloadSchema = z14.object({
  retry_count: z14.number().int().min(0).optional().meta(Unrestricted11),
  renewal_date: z14.string().optional().meta(Unrestricted11)
}).meta(
  {
    id: "PaymentTriggerPayload",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var SemanticEventSchema = z14.object({
  event_type: z14.string().min(1).meta(Unrestricted11),
  payload: z14.record(z14.string(), z14.unknown()).default({}).meta(Unrestricted11)
}).meta(
  {
    id: "SemanticEvent",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var ControlPlaneEventSourceSchema = z14.enum(["system", "workflow"]).meta(
  {
    id: "ControlPlaneEventSource",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var ControlPlaneEventTypeSchema = z14.enum([
  // Identity / auth — source: system
  "web_signed_up",
  "web_signed_in",
  "cli_signed_up",
  "cli_signed_in",
  // CLI commands — source: system; the command name rides on payload.command
  "cli_command_executed",
  // Change-set lifecycle — source: workflow
  "changeset_submitted",
  "changeset_approved",
  "changeset_rejected",
  "changeset_deployed",
  "changeset_launched",
  "changeset_parked",
  "changeset_resumed",
  "changeset_discarded",
  "changeset_archived",
  // Config — source: workflow
  "config_imported",
  "config_exported",
  // Product-entity CRUD — source: workflow; the resource rides on payload.resource
  "entity_created",
  "entity_updated",
  "entity_deleted"
]).meta(
  {
    id: "ControlPlaneEventType",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var ControlPlaneSemanticEventSchema = z14.object({
  event_type: ControlPlaneEventTypeSchema.meta(Unrestricted11),
  source: ControlPlaneEventSourceSchema.meta(Unrestricted11),
  payload: z14.record(z14.string(), z14.unknown()).default({}).meta(Unrestricted11)
}).meta(
  {
    id: "ControlPlaneSemanticEvent",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var EventSearchParamsSchema = z14.object({
  q: z14.string().optional().meta(Unrestricted11),
  source: EventSourceSchema.optional().meta(Unrestricted11),
  event_type: z14.string().optional().meta(Unrestricted11),
  from: z14.string().datetime().optional().meta(Unrestricted11),
  to: z14.string().datetime().optional().meta(Unrestricted11),
  page: z14.coerce.number().int().min(1).default(1).meta(Unrestricted11),
  per_page: z14.coerce.number().int().min(1).max(100).default(25).meta(Unrestricted11)
}).meta(
  {
    id: "EventSearchParams",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": Internal8
  }
);
var WebhookEventSourceSchema = z14.enum(["stripe", "apple", "google"]).meta(
  {
    id: "WebhookEventSource",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": Internal8
  }
);
var WebhookEventStatusSchema = z14.enum(["processed", "failed", "skipped"]).meta(
  {
    id: "WebhookEventStatus",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": Internal8
  }
);
var WebhookEventLogSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  event_id: z14.string().min(1).meta(Unrestricted11),
  event_type: z14.string().min(1).meta(Unrestricted11),
  source: WebhookEventSourceSchema.meta(Unrestricted11),
  payload: z14.record(z14.string(), z14.unknown()).default({}).meta(Unrestricted11),
  status: WebhookEventStatusSchema.default("processed").meta(Unrestricted11),
  processed_at: z14.string().datetime().optional().meta(Unrestricted11),
  error_message: z14.string().optional().meta(Unrestricted11)
}).meta(
  {
    id: "WebhookEventLog",
    "x-revturbine-schema-persistence": Persisted11,
    "x-revturbine-schema-exposure": Internal8
  }
);
var EventIngestResponseSchema = z14.object({
  accepted: z14.number().int().min(0).meta(Unrestricted11)
}).meta(
  {
    id: "null",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": Internal8
  }
);
var MAX_TRACK_EVENTS_PER_BATCH = 500;
var TrackEventSchema = z14.object({
  environment_id: z14.string().min(1).meta(Unrestricted11),
  user_id: z14.string().min(1).meta(Pii4),
  account_id: z14.string().min(1).meta(Unrestricted11),
  event_name: z14.string().min(1).max(120).meta(Unrestricted11),
  event_ts: z14.string().datetime().meta(Unrestricted11),
  properties: z14.string().optional().meta(Unrestricted11),
  surface_slot_id: z14.string().nullable().optional().meta(Unrestricted11),
  placement_id: z14.string().nullable().optional().meta(Unrestricted11),
  payload_id: z14.string().nullable().optional().meta(Unrestricted11),
  request_id: z14.string().optional().meta(Unrestricted11),
  experiment_id: z14.string().nullable().optional().meta(Unrestricted11),
  variant_key: z14.string().nullable().optional().meta(Unrestricted11),
  tenant_id: z14.string().optional().meta(Unrestricted11)
}).meta(
  {
    id: "TrackEvent",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var TrackIngestBatchSchema = z14.object({
  events: z14.array(TrackEventSchema).min(1).max(MAX_TRACK_EVENTS_PER_BATCH).meta(Unrestricted11)
}).meta(
  {
    id: "TrackIngestBatch",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var MAX_SDK_META_EVENTS_PER_BATCH = 10;
var SdkMetaEventTypeSchema = z14.enum(["sdk_init", "sdk_error", "sdk_validation_warning"]).meta(
  {
    id: "SdkMetaEventType",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var SdkConfigShapeSchema = z14.object({
  plans: z14.number().int().min(0).meta(Unrestricted11),
  entitlements: z14.number().int().min(0).meta(Unrestricted11),
  entitlement_rules: z14.number().int().min(0).meta(Unrestricted11),
  segments: z14.number().int().min(0).meta(Unrestricted11),
  placements: z14.number().int().min(0).meta(Unrestricted11),
  placement_payloads: z14.number().int().min(0).meta(Unrestricted11),
  content_ui_paths: z14.number().int().min(0).meta(Unrestricted11),
  surface_templates: z14.number().int().min(0).meta(Unrestricted11)
}).meta(
  {
    id: "SdkConfigShape",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var SdkMetaEventSchema = z14.object({
  event_type: SdkMetaEventTypeSchema.meta(Unrestricted11),
  occurred_at: z14.string().datetime().meta(Unrestricted11),
  request_id: z14.string().min(1).optional().meta(Unrestricted11),
  // One-way, non-reversible hash of a non-secret config identifier (e.g.
  // truncated SHA-256 of config_hash / bundle id). Counts distinct
  // deployments without exposing the real id (REQ-7).
  config_hash_id: z14.string().min(1).max(64).optional().meta(Unrestricted11),
  sdk_version: z14.string().min(1).max(64).optional().meta(Unrestricted11),
  runtime_mode: z14.string().min(1).max(64).optional().meta(Unrestricted11),
  schema_version: z14.string().min(1).max(64).optional().meta(Unrestricted11),
  bundle_version: z14.string().min(1).max(64).optional().meta(Unrestricted11),
  // Present for sdk_init; config-shape counts only, no user context (REQ-6).
  config_shape: SdkConfigShapeSchema.optional().meta(Unrestricted11),
  // Short non-PII diagnostic for sdk_error / sdk_validation_warning.
  message: z14.string().max(500).optional().meta(Unrestricted11)
}).meta(
  {
    id: "SdkMetaEvent",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var SdkMetaIngestBatchSchema = z14.object({
  events: z14.array(SdkMetaEventSchema).min(1).max(MAX_SDK_META_EVENTS_PER_BATCH).meta(Unrestricted11)
}).meta(
  {
    id: "SdkMetaIngestBatch",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
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

// ../revturbine-scaffold/src/trials/models/schema.ts
import { z as z15 } from "zod";
var { Unrestricted: Unrestricted12 } = DataClassification;
var { Persisted: Persisted12, Transient: Transient12 } = SchemaPersistence;
var { Internal: Internal9 } = SchemaExposure;
var TrialStatusSchema = z15.enum(["not_started", "active", "expired", "converted", "cancelled"]).meta(
  { id: "TrialStatus", "x-revturbine-schema-persistence": Transient12, "x-revturbine-schema-exposure": Internal9 }
);
var TrialLimitTypeSchema = z15.enum(["time", "usage"]).meta(
  { id: "TrialLimitType", "x-revturbine-schema-persistence": Transient12, "x-revturbine-schema-exposure": Internal9 }
);
var FreeTrialRuleCoreFieldsSchema = z15.object({
  name: NameField.meta(Unrestricted12),
  handle: HandleField.meta(Unrestricted12),
  // plan_id null = "All plans" — see plans-entitlements-studio-ui.md §2.4.1.
  plan_id: z15.string().nullable().optional().meta(Unrestricted12),
  segment_id: z15.string().nullable().optional().meta(Unrestricted12),
  // Defaults to 'time' so every pre-existing rule keeps its current
  // duration-based semantics. Set to 'usage' to scope the trial by
  // consumption of `usage_entitlement_handle` up to
  // `usage_limit_value`; the time fields below are then ignored.
  trial_limit_type: TrialLimitTypeSchema.default("time").meta(Unrestricted12),
  // Time-based: rule is skipped at runtime when null/blank. The
  // Default Trial Length global was removed (no fallback exists).
  duration_days: z15.number().int().min(1).max(365).nullable().optional().meta(Unrestricted12),
  grace_period_days: z15.number().int().min(0).default(0).meta(Unrestricted12),
  // Usage-based: the entitlement whose consumption gates the trial,
  // and the cap. Both required when `trial_limit_type === 'usage'`;
  // otherwise ignored. Cross-field validation is done at the API
  // boundary (web app's POST handler) rather than here so partial
  // drafts stay round-trippable.
  usage_entitlement_handle: z15.string().min(1).optional().meta(Unrestricted12),
  usage_limit_value: z15.number().int().min(1).optional().meta(Unrestricted12),
  require_payment_method: z15.boolean().default(false).meta(Unrestricted12),
  auto_convert: z15.boolean().default(true).meta(Unrestricted12),
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
  convert_to_plan_id: z15.string().optional().meta(Unrestricted12),
  fallback_plan_id: z15.string().optional().meta(Unrestricted12),
  limit_per_customer: z15.number().int().min(1).default(1).meta(Unrestricted12),
  is_active: z15.boolean().default(true).meta(Unrestricted12),
  metadata: MetadataField.meta(Unrestricted12)
});
var FreeTrialRuleSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z15.string().min(1).meta({ ...Unrestricted12, readOnly: true })
}).merge(FreeTrialRuleCoreFieldsSchema).meta(
  { id: "FreeTrialRule", "x-revturbine-schema-persistence": Persisted12, "x-revturbine-schema-exposure": Internal9, ...namedIdentity() }
);
var FreeTrialRuleAnchorSchema = makeAnchor("FreeTrialRuleAnchor");
var ReverseTrialStartPolicySchema = z15.enum(["signup", "first_premium_access", "manual"]).meta(
  { id: "ReverseTrialStartPolicy", "x-revturbine-schema-persistence": Transient12, "x-revturbine-schema-exposure": Internal9 }
);
var ReverseTrialRuleCoreFieldsSchema = z15.object({
  name: NameField.meta(Unrestricted12),
  handle: HandleField.meta(Unrestricted12),
  premium_plan_id: z15.string().min(1).meta(Unrestricted12),
  fallback_plan_id: z15.string().min(1).meta(Unrestricted12),
  segment_id: z15.string().nullable().optional().meta(Unrestricted12),
  trial_limit_type: TrialLimitTypeSchema.default("time").meta(Unrestricted12),
  duration_days: z15.number().int().min(1).max(365).nullable().optional().meta(Unrestricted12),
  usage_entitlement_handle: z15.string().min(1).optional().meta(Unrestricted12),
  usage_limit_value: z15.number().int().min(1).optional().meta(Unrestricted12),
  start_policy: ReverseTrialStartPolicySchema.default("signup").meta(Unrestricted12),
  show_upgrade_prompt_at_day: z15.number().int().min(0).optional().meta(Unrestricted12),
  entitlements_during_trial: z15.array(z15.string()).default([]).meta(Unrestricted12),
  is_active: z15.boolean().default(true).meta(Unrestricted12),
  metadata: MetadataField.meta(Unrestricted12)
});
var ReverseTrialRuleSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z15.string().min(1).meta({ ...Unrestricted12, readOnly: true })
}).merge(ReverseTrialRuleCoreFieldsSchema).meta(
  { id: "ReverseTrialRule", "x-revturbine-schema-persistence": Persisted12, "x-revturbine-schema-exposure": Internal9, ...namedIdentity() }
);
var ReverseTrialRuleAnchorSchema = makeAnchor("ReverseTrialRuleAnchor");
var TrialLimitPolicySchema = z15.enum(["1_per_lifetime", "1_per_plan", "1_per_year", "unlimited"]).meta(
  { id: "TrialLimitPolicy", "x-revturbine-schema-persistence": Transient12, "x-revturbine-schema-exposure": Internal9 }
);
var TrialEligibilityScopeSchema = z15.enum(["per_customer", "per_email_domain"]).meta(
  { id: "TrialEligibilityScope", "x-revturbine-schema-persistence": Transient12, "x-revturbine-schema-exposure": Internal9 }
);
var FreeTrialSettingsSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  trial_limit_policy: TrialLimitPolicySchema.default("1_per_lifetime").meta(Unrestricted12),
  eligibility_scope: TrialEligibilityScopeSchema.default("per_customer").meta(Unrestricted12)
}).meta(
  { id: "FreeTrialSettings", "x-revturbine-schema-persistence": Persisted12, "x-revturbine-schema-exposure": Internal9 }
);
var ReverseTrialSettingsSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  trial_limit_policy: TrialLimitPolicySchema.default("1_per_lifetime").meta(Unrestricted12),
  eligibility_scope: TrialEligibilityScopeSchema.default("per_customer").meta(Unrestricted12)
}).meta(
  { id: "ReverseTrialSettings", "x-revturbine-schema-persistence": Persisted12, "x-revturbine-schema-exposure": Internal9 }
);
var TrialInstanceSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  customer_id: z15.string().min(1).meta(Unrestricted12),
  rule_id: z15.string().min(1).meta(Unrestricted12),
  rule_type: z15.enum(["free_trial", "reverse_trial"]).meta(Unrestricted12),
  plan_id: z15.string().min(1).meta(Unrestricted12),
  status: TrialStatusSchema.default("active").meta(Unrestricted12),
  started_at: z15.string().datetime().meta({ ...Unrestricted12, readOnly: true }),
  /**
   * Time-based expiry. Required for time-based trials; null for
   * pure usage-based trials (which expire when consumption crosses
   * `usage_limit_value` regardless of clock time).
   */
  expires_at: z15.string().datetime().nullable().optional().meta(Unrestricted12),
  /**
   * Snapshot of the rule's `trial_limit_type` at the moment the
   * instance was created. Persisted so subsequent changes to the
   * rule's mode don't retroactively alter the user's trial
   * semantics. Defaults to 'time' for backward compatibility with
   * pre-existing instances.
   */
  trial_limit_type: TrialLimitTypeSchema.default("time").meta(Unrestricted12),
  /**
   * Snapshot of the rule's `usage_entitlement_handle` for
   * usage-based trials. Server queries the user's current
   * consumption of this entitlement to derive
   * `UserTrialStatus.usage_consumed` at read time.
   */
  usage_entitlement_handle: z15.string().min(1).optional().meta(Unrestricted12),
  /**
   * Snapshot of the rule's `usage_limit_value`. Persisted so
   * mid-trial limit changes on the rule don't shrink/expand a
   * user's in-flight trial.
   */
  usage_limit_value: z15.number().int().min(1).optional().meta(Unrestricted12),
  converted_at: NullableDatetimeField.meta(Unrestricted12),
  cancelled_at: NullableDatetimeField.meta(Unrestricted12),
  metadata: MetadataField.meta(Unrestricted12)
}).meta(
  { id: "TrialInstance", "x-revturbine-schema-persistence": Persisted12, "x-revturbine-schema-exposure": Internal9 }
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
      requestParams: { path: z15.object({ ruleId: z15.string() }) },
      summary: "Get free trial rule",
      tags: ["trials"],
      responses: { "200": { description: "Free trial rule", content: { "application/json": { schema: FreeTrialRuleSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-rules", persistence: { table: "freeTrialRuleVersions", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateFreeTrialRule",
      requestParams: { path: z15.object({ ruleId: z15.string() }) },
      summary: "Update free trial rule",
      tags: ["trials"],
      requestBody: { required: true, content: { "application/json": { schema: FreeTrialRuleSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: FreeTrialRuleSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-rules", persistence: { table: "freeTrialRuleVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteFreeTrialRule",
      requestParams: { path: z15.object({ ruleId: z15.string() }) },
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
      requestParams: { path: z15.object({ ruleId: z15.string() }) },
      summary: "Get reverse trial rule",
      tags: ["trials"],
      responses: { "200": { description: "Reverse trial rule", content: { "application/json": { schema: ReverseTrialRuleSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "reverse-trial-rules", persistence: { table: "reverseTrialRuleVersions", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateReverseTrialRule",
      requestParams: { path: z15.object({ ruleId: z15.string() }) },
      summary: "Update reverse trial rule",
      tags: ["trials"],
      requestBody: { required: true, content: { "application/json": { schema: ReverseTrialRuleSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: ReverseTrialRuleSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "reverse-trial-rules", persistence: { table: "reverseTrialRuleVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteReverseTrialRule",
      requestParams: { path: z15.object({ ruleId: z15.string() }) },
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
      requestParams: { path: z15.object({ settingsId: z15.string() }) },
      summary: "Get free trial settings",
      tags: ["trials"],
      responses: { "200": { description: "Free trial settings", content: { "application/json": { schema: FreeTrialSettingsSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "free-trial-settings", persistence: { table: "freeTrialSettings", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateFreeTrialSettings",
      requestParams: { path: z15.object({ settingsId: z15.string() }) },
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
      requestParams: { path: z15.object({ settingsId: z15.string() }) },
      summary: "Get reverse trial settings",
      tags: ["trials"],
      responses: { "200": { description: "Reverse trial settings", content: { "application/json": { schema: ReverseTrialSettingsSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "reverse-trial-settings", persistence: { table: "reverseTrialSettings", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateReverseTrialSettings",
      requestParams: { path: z15.object({ settingsId: z15.string() }) },
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
      requestParams: { path: z15.object({ instanceId: z15.string() }) },
      summary: "Get trial instance",
      tags: ["trials"],
      responses: { "200": { description: "Trial instance", content: { "application/json": { schema: TrialInstanceSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-instances", persistence: { table: "trialInstances", mode: "get" } }
    })
  },
  "/api/trials/instances/{instanceId}/cancel": {
    post: operation({
      operationId: "cancelTrialInstance",
      requestParams: { path: z15.object({ instanceId: z15.string() }) },
      summary: "Cancel an active trial",
      tags: ["trials"],
      responses: { "200": { description: "Cancelled", content: { "application/json": { schema: TrialInstanceSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-instances", persistence: { table: "trialInstances", mode: "update" } }
    })
  },
  "/api/trials/instances/{instanceId}/convert": {
    post: operation({
      operationId: "convertTrialInstance",
      requestParams: { path: z15.object({ instanceId: z15.string() }) },
      summary: "Convert trial to paid subscription",
      tags: ["trials"],
      requestBody: { required: true, content: { "application/json": { schema: z15.object({ plan_id: z15.string().optional() }) } } },
      responses: { "200": { description: "Converted", content: { "application/json": { schema: TrialInstanceSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-instances", persistence: { table: "trialInstances", mode: "update" } }
    })
  }
};

// ../revturbine-scaffold/src/experiments/models/schema.ts
import { z as z16 } from "zod";
var { Unrestricted: Unrestricted13 } = DataClassification;
var { Persisted: Persisted13, Transient: Transient13 } = SchemaPersistence;
var { Internal: Internal10 } = SchemaExposure;
var ExperimentStatusSchema = z16.enum(["draft", "ramping", "winning", "neutral", "needs_attention", "paused", "complete"]).meta(
  { id: "ExperimentStatus", "x-revturbine-schema-persistence": Transient13, "x-revturbine-schema-exposure": Internal10 }
);
var ExperimentTypeSchema = z16.enum(["placement_ab", "entitlement_ab", "plan_ab", "pricing_ab", "custom"]).meta(
  { id: "ExperimentType", "x-revturbine-schema-persistence": Transient13, "x-revturbine-schema-exposure": Internal10 }
);
var ExperimentVariantSchema = z16.object({
  variant_id: z16.string().min(1),
  name: NameField,
  weight: z16.number().min(0).max(1).default(0.5),
  is_control: z16.boolean().default(false),
  config: z16.record(z16.string(), z16.unknown()).default({})
}).meta(
  { id: "ExperimentVariant", "x-revturbine-schema-persistence": Persisted13, "x-revturbine-schema-exposure": Internal10 }
);
var ExperimentSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z16.string().min(1).meta({ ...Unrestricted13, readOnly: true }),
  name: NameField.meta(Unrestricted13),
  handle: HandleField.meta(Unrestricted13),
  description: z16.string().max(1e3).optional().meta(Unrestricted13),
  experiment_type: ExperimentTypeSchema.meta(Unrestricted13),
  status: ExperimentStatusSchema.default("draft").meta(Unrestricted13),
  target_resource_id: z16.string().optional().meta(Unrestricted13),
  target_segment_ids: z16.array(z16.string()).default([]).meta(Unrestricted13),
  variants: z16.array(ExperimentVariantSchema).min(2).meta(Unrestricted13),
  primary_metric: z16.string().min(1).meta(Unrestricted13),
  // Lift below control that triggers the "Experiment trending negative"
  // Needs Attention rule (plan 02c). 0.05 = 5% relative lift below control.
  metric_threshold: z16.number().default(0.05).meta(Unrestricted13),
  secondary_metrics: z16.array(z16.string()).default([]).meta(Unrestricted13),
  traffic_allocation: z16.number().min(0).max(1).default(1).meta(Unrestricted13),
  started_at: NullableDatetimeField.meta(Unrestricted13),
  ended_at: NullableDatetimeField.meta(Unrestricted13),
  confidence_threshold: z16.number().min(0).max(1).default(0.95).meta(Unrestricted13),
  winning_variant_id: z16.string().nullable().default(null).meta(Unrestricted13),
  metadata: MetadataField.meta(Unrestricted13)
}).meta(
  { id: "Experiment", "x-revturbine-schema-persistence": Persisted13, "x-revturbine-schema-exposure": Internal10, ...namedIdentity() }
);
var ExperimentAnchorSchema = makeAnchor("ExperimentAnchor");
var SuggestionSeveritySchema = SeveritySchema;
var OptimizationSuggestionSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  experiment_id: z16.string().optional().meta(Unrestricted13),
  resource_type: z16.string().min(1).meta(Unrestricted13),
  resource_id: z16.string().min(1).meta(Unrestricted13),
  severity: SuggestionSeveritySchema.default("info").meta(Unrestricted13),
  title: z16.string().min(1).max(300).meta(Unrestricted13),
  description: z16.string().max(2e3).meta(Unrestricted13),
  suggested_action: z16.string().max(1e3).optional().meta(Unrestricted13),
  estimated_impact: z16.number().optional().meta(Unrestricted13),
  is_dismissed: z16.boolean().default(false).meta(Unrestricted13),
  metadata: MetadataField.meta(Unrestricted13)
}).meta(
  { id: "OptimizationSuggestion", "x-revturbine-schema-persistence": Persisted13, "x-revturbine-schema-exposure": Internal10 }
);
var experimentPaths = {
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
      requestParams: { path: z16.object({ experimentId: z16.string() }) },
      summary: "Get experiment",
      tags: ["experiments"],
      responses: { "200": { description: "Experiment", content: { "application/json": { schema: ExperimentSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiments", persistence: { table: "experimentVersions", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateExperiment",
      requestParams: { path: z16.object({ experimentId: z16.string() }) },
      summary: "Update experiment",
      tags: ["experiments"],
      requestBody: { required: true, content: { "application/json": { schema: ExperimentSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: ExperimentSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiments", persistence: { table: "experimentVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteExperiment",
      requestParams: { path: z16.object({ experimentId: z16.string() }) },
      summary: "Delete experiment",
      tags: ["experiments"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiments", persistence: { table: "experimentVersions", mode: "delete" } }
    })
  },
  "/api/experiments/{experimentId}/start": {
    post: operation({
      operationId: "startExperiment",
      requestParams: { path: z16.object({ experimentId: z16.string() }) },
      summary: "Start experiment (begin traffic allocation)",
      tags: ["experiments"],
      responses: { "200": { description: "Started", content: { "application/json": { schema: ExperimentSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiments", persistence: { table: "experimentVersions", mode: "update" } }
    })
  },
  "/api/experiments/{experimentId}/pause": {
    post: operation({
      operationId: "pauseExperiment",
      requestParams: { path: z16.object({ experimentId: z16.string() }) },
      summary: "Pause running experiment",
      tags: ["experiments"],
      responses: { "200": { description: "Paused", content: { "application/json": { schema: ExperimentSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiments", persistence: { table: "experimentVersions", mode: "update" } }
    })
  },
  "/api/experiments/{experimentId}/complete": {
    post: operation({
      operationId: "completeExperiment",
      requestParams: { path: z16.object({ experimentId: z16.string() }) },
      summary: "Complete experiment and declare winner",
      tags: ["experiments"],
      requestBody: { required: true, content: { "application/json": { schema: z16.object({ winning_variant_id: z16.string() }) } } },
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
      requestParams: { path: z16.object({ suggestionId: z16.string() }) },
      summary: "Dismiss an optimization suggestion",
      tags: ["experiments"],
      responses: { "200": { description: "Dismissed", content: { "application/json": { schema: OptimizationSuggestionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "optimization-suggestions", persistence: { table: "optimizationSuggestions", mode: "update" } }
    })
  }
};

// ../revturbine-scaffold/src/promotions/models/schema.ts
import { z as z17 } from "zod";
var { Unrestricted: Unrestricted14, Financial: Financial3 } = DataClassification;
var { Persisted: Persisted14, Transient: Transient14 } = SchemaPersistence;
var { Internal: Internal11 } = SchemaExposure;
var PromotionStatusSchema = z17.enum(["draft", "scheduled", "live", "expired", "archived"]).meta(
  { id: "PromotionStatus", "x-revturbine-schema-persistence": Transient14, "x-revturbine-schema-exposure": Internal11 }
);
var DiscountTypeSchema = z17.enum(["percentage", "fixed_amount", "free_months"]).meta(
  { id: "DiscountType", "x-revturbine-schema-persistence": Transient14, "x-revturbine-schema-exposure": Internal11 }
);
var PromotionSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z17.string().min(1).meta({ ...Unrestricted14, readOnly: true }),
  name: NameField.meta(Unrestricted14),
  handle: HandleField.meta(Unrestricted14),
  description: z17.string().max(1e3).optional().meta(Unrestricted14),
  rt_status: PromotionStatusSchema.default("draft").meta(Unrestricted14),
  discount_type: DiscountTypeSchema.meta(Unrestricted14),
  discount_value: z17.number().min(0).meta(Financial3),
  currency: z17.string().length(3).default("USD").meta(Financial3),
  applicable_plan_ids: z17.array(z17.string()).default([]).meta(Unrestricted14),
  applicable_addon_ids: z17.array(z17.string()).default([]).meta(Unrestricted14),
  target_segment_ids: z17.array(z17.string()).default([]).meta(Unrestricted14),
  max_redemptions: z17.number().int().min(0).nullable().default(null).meta(Unrestricted14),
  current_redemptions: z17.number().int().min(0).default(0).meta({ ...Unrestricted14, readOnly: true }),
  coupon_code: z17.string().max(100).optional().meta(Unrestricted14),
  starts_at: NullableDatetimeField.meta(Unrestricted14),
  ends_at: NullableDatetimeField.meta(Unrestricted14),
  // Stripe integration
  stripe_coupon_id: z17.string().nullable().default(null).meta(Unrestricted14),
  stripe_promotion_code_id: z17.string().nullable().default(null).meta(Unrestricted14),
  auto_sync_stripe: z17.boolean().default(false).meta(Unrestricted14),
  metadata: MetadataField.meta(Unrestricted14)
}).meta(
  { id: "Promotion", "x-revturbine-schema-persistence": Persisted14, "x-revturbine-schema-exposure": Internal11, ...namedIdentity() }
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
      requestParams: { path: z17.object({ promotionId: z17.string() }) },
      summary: "Get promotion",
      tags: ["promotions"],
      responses: { "200": { description: "Promotion", content: { "application/json": { schema: PromotionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "promotions", persistence: { table: "promotionVersions", mode: "get" } }
    }),
    patch: operation({
      operationId: "updatePromotion",
      requestParams: { path: z17.object({ promotionId: z17.string() }) },
      summary: "Update promotion",
      tags: ["promotions"],
      requestBody: { required: true, content: { "application/json": { schema: PromotionSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: PromotionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "promotions", persistence: { table: "promotionVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deletePromotion",
      requestParams: { path: z17.object({ promotionId: z17.string() }) },
      summary: "Delete (archive) promotion",
      tags: ["promotions"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "promotions", persistence: { table: "promotionVersions", mode: "delete" } }
    })
  },
  "/api/promotions/{promotionId}/sync-stripe": {
    post: operation({
      operationId: "syncPromotionToStripe",
      requestParams: { path: z17.object({ promotionId: z17.string() }) },
      summary: "Sync promotion to Stripe as coupon/promotion code",
      tags: ["promotions"],
      responses: { "200": { description: "Synced", content: { "application/json": { schema: PromotionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "promotions", persistence: { table: "promotionVersions", mode: "update" } }
    })
  },
  "/api/promotions/{promotionId}/duplicate": {
    post: operation({
      operationId: "duplicatePromotion",
      requestParams: { path: z17.object({ promotionId: z17.string() }) },
      summary: "Duplicate promotion",
      tags: ["promotions"],
      responses: { "201": { description: "Duplicated", content: { "application/json": { schema: PromotionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "promotions", persistence: { table: "promotionVersions", mode: "create" } }
    })
  }
};

// ../revturbine-scaffold/src/core/runtime-api/schema.ts
import { z as z18 } from "zod";
var { Unrestricted: Unrestricted15, Pii: Pii5 } = DataClassification;
var { Persisted: Persisted15, Transient: Transient15 } = SchemaPersistence;
var { Internal: Internal12, External: External10 } = SchemaExposure;
var PresentationRecordSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  customer_id: z18.string().min(1).meta(Pii5),
  placement_id: z18.string().min(1).meta(Unrestricted15),
  payload_id: z18.string().nullable().default(null).meta(Unrestricted15),
  variant_id: z18.string().nullable().default(null).meta(Unrestricted15),
  surface_type: z18.string().meta(Unrestricted15),
  presented_at: z18.string().datetime().meta({ ...Unrestricted15, readOnly: true }),
  dismissed_at: NullableDatetimeField.meta(Unrestricted15),
  cta_clicked_at: NullableDatetimeField.meta(Unrestricted15),
  cta_action_type: z18.string().nullable().default(null).meta(Unrestricted15),
  converted: z18.boolean().default(false).meta(Unrestricted15),
  session_id: z18.string().optional().meta(Unrestricted15),
  metadata: MetadataField.meta(Unrestricted15)
}).meta(
  { id: "PresentationRecord", "x-revturbine-schema-persistence": Persisted15, "x-revturbine-schema-exposure": Internal12 }
);
var DecisionLogSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  customer_id: z18.string().min(1).meta(Pii5),
  placement_id: z18.string().min(1).meta(Unrestricted15),
  decision: z18.enum(["show", "suppress", "defer"]).meta(Unrestricted15),
  reason: z18.string().max(500).meta(Unrestricted15),
  matched_rules: z18.array(z18.object({
    rule_id: z18.string(),
    rule_type: z18.string(),
    matched: z18.boolean()
  })).default([]).meta(Unrestricted15),
  experiment_id: z18.string().nullable().default(null).meta(Unrestricted15),
  variant_id: z18.string().nullable().default(null).meta(Unrestricted15),
  latency_ms: z18.number().min(0).optional().meta(Unrestricted15)
}).meta(
  { id: "DecisionLog", "x-revturbine-schema-persistence": Persisted15, "x-revturbine-schema-exposure": Internal12 }
);
var EntitlementEvalLogSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  customer_id: z18.string().min(1).meta(Pii5),
  entitlement_handle: z18.string().min(1).meta(Unrestricted15),
  entitlement_type: z18.string().meta(Unrestricted15),
  result: z18.enum(["granted", "denied", "limited", "metered"]).meta(Unrestricted15),
  current_usage: z18.number().nullable().default(null).meta(Unrestricted15),
  limit: z18.number().nullable().default(null).meta(Unrestricted15),
  source: z18.enum(["plan", "addon", "override", "trial"]).meta(Unrestricted15),
  source_id: z18.string().min(1).meta(Unrestricted15),
  latency_ms: z18.number().min(0).optional().meta(Unrestricted15)
}).meta(
  { id: "EntitlementEvalLog", "x-revturbine-schema-persistence": Persisted15, "x-revturbine-schema-exposure": Internal12 }
);
var runtimePaths = {
  "/api/presentation-records": {
    get: operation({
      operationId: "listPresentationRecords",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List presentation records",
      tags: ["runtime"],
      responses: { "200": { description: "Presentation records", content: { "application/json": { schema: ListEnvelope(PresentationRecordSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "presentation-records", persistence: { table: "presentationRecords", mode: "list" } }
    })
  },
  "/api/decision-logs": {
    get: operation({
      operationId: "listDecisionLogs",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List decision logs",
      tags: ["runtime"],
      responses: { "200": { description: "Decision logs", content: { "application/json": { schema: ListEnvelope(DecisionLogSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "decision-logs", persistence: { table: "decisionLogs", mode: "list" } }
    })
  },
  "/api/entitlement-eval-logs": {
    get: operation({
      operationId: "listEntitlementEvalLogs",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List entitlement evaluation logs",
      tags: ["runtime"],
      responses: { "200": { description: "Entitlement eval logs", content: { "application/json": { schema: ListEnvelope(EntitlementEvalLogSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "entitlement-eval-logs", persistence: { table: "entitlementEvalLogs", mode: "list" } }
    })
  }
};

// ../revturbine-scaffold/src/config/models/schema.ts
import { z as z19 } from "zod";
var { Unrestricted: Unrestricted16 } = DataClassification;
var { Persisted: Persisted16, Transient: Transient16 } = SchemaPersistence;
var { Internal: Internal13, External: External11 } = SchemaExposure;
var ApplicationSurfaceSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  name: NameField.meta(Unrestricted16),
  handle: HandleField.meta(Unrestricted16),
  surface_type: StudioSurfaceTypeSchema.meta(Unrestricted16),
  description: DescriptionField.meta(Unrestricted16),
  is_active: z19.boolean().default(true).meta(Unrestricted16),
  ui_path: z19.string().optional().meta(Unrestricted16),
  metadata: MetadataField.meta(Unrestricted16)
}).meta(
  { id: "ApplicationSurface", "x-revturbine-schema-persistence": Persisted16, "x-revturbine-schema-exposure": Internal13, ...namedIdentity() }
);
var SeatTypeSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z19.string().min(1).meta({ ...Unrestricted16, readOnly: true }),
  name: NameField.meta(Unrestricted16),
  handle: HandleField.meta(Unrestricted16),
  description: DescriptionField.meta(Unrestricted16),
  is_default: z19.boolean().default(false).meta(Unrestricted16),
  entitlement_ids: z19.array(z19.string()).default([]).meta(Unrestricted16),
  metadata: MetadataField.meta(Unrestricted16)
}).meta(
  { id: "SeatType", "x-revturbine-schema-persistence": Persisted16, "x-revturbine-schema-exposure": Internal13, ...namedIdentity() }
);
var SeatTypeAnchorSchema = makeAnchor("SeatTypeAnchor");
var OnboardingStateSchema = z19.enum(["not_started", "started", "details_submitted", "charges_enabled", "activated", "deauthorized"]).meta({ id: "OnboardingState", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": Internal13 });
var StripeIntegrationConfigSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  handle: HandleField.meta({ ...Unrestricted16, readOnly: true }),
  stripe_account_id: z19.string().min(1).meta(Unrestricted16),
  live_mode: z19.boolean().default(false).meta(Unrestricted16),
  /** Funnel state for the Connect onboarding pipeline. */
  onboarding_state: OnboardingStateSchema.default("not_started").meta({ ...Unrestricted16, readOnly: true }),
  /** Connect onboarding status — tracks whether hosted onboarding is complete. */
  onboarding_complete: z19.boolean().default(false).meta({ ...Unrestricted16, readOnly: true }),
  /** Whether the connected account can process charges (read from Stripe). */
  charges_enabled: z19.boolean().default(false).meta({ ...Unrestricted16, readOnly: true }),
  /** Whether the connected account has details submitted (read from Stripe). */
  details_submitted: z19.boolean().default(false).meta({ ...Unrestricted16, readOnly: true }),
  /** Whether the connected account can receive payouts (read from Stripe). */
  payouts_enabled: z19.boolean().default(false).meta({ ...Unrestricted16, readOnly: true }),
  webhook_secret_set: z19.boolean().default(false).meta({ ...Unrestricted16, readOnly: true }),
  sync_products: z19.boolean().default(true).meta(Unrestricted16),
  sync_prices: z19.boolean().default(true).meta(Unrestricted16),
  sync_subscriptions: z19.boolean().default(true).meta(Unrestricted16),
  sync_invoices: z19.boolean().default(false).meta(Unrestricted16),
  default_currency: z19.string().length(3).default("USD").meta(Unrestricted16),
  tax_behavior: z19.enum(["inclusive", "exclusive", "unspecified"]).default("unspecified").meta(Unrestricted16),
  /** ISO timestamp of the last successful full data sync from Stripe. */
  last_sync_at: z19.string().optional().meta({ ...Unrestricted16, readOnly: true }),
  metadata: MetadataField.meta(Unrestricted16)
}).meta(
  { id: "StripeIntegrationConfig", "x-revturbine-schema-persistence": Persisted16, "x-revturbine-schema-exposure": Internal13, ...mintedIdentity() }
);
var MeteringConfigSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  handle: HandleField.meta({ ...Unrestricted16, readOnly: true }),
  entitlement_id: z19.string().min(1).meta(Unrestricted16),
  meter_key: z19.string().min(1).max(100).meta(Unrestricted16),
  aggregation_type: z19.enum(["sum", "count", "max", "last_value"]).default("sum").meta(Unrestricted16),
  reset_period: z19.enum(["none", "daily", "weekly", "monthly", "yearly"]).default("monthly").meta(Unrestricted16),
  stripe_meter_id: z19.string().nullable().default(null).meta(Unrestricted16),
  is_active: z19.boolean().default(true).meta(Unrestricted16),
  metadata: MetadataField.meta(Unrestricted16)
}).meta(
  { id: "MeteringConfig", "x-revturbine-schema-persistence": Persisted16, "x-revturbine-schema-exposure": Internal13, ...mintedIdentity() }
);
var EnforcementActionSchema = z19.enum(["block", "warn", "downgrade", "throttle", "notify_admin", "custom"]).meta(
  { id: "EnforcementAction", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": Internal13 }
);
var UsageEnforcementSettingsSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z19.string().min(1).meta({ ...Unrestricted16, readOnly: true }),
  handle: HandleField.meta({ ...Unrestricted16, readOnly: true }),
  entitlement_id: z19.string().min(1).meta(Unrestricted16),
  soft_limit_percent: z19.number().min(0).max(100).default(80).meta(Unrestricted16),
  hard_limit_percent: z19.number().min(0).max(100).default(100).meta(Unrestricted16),
  soft_limit_action: EnforcementActionSchema.default("warn").meta(Unrestricted16),
  hard_limit_action: EnforcementActionSchema.default("block").meta(Unrestricted16),
  grace_period_hours: z19.number().int().min(0).default(0).meta(Unrestricted16),
  notification_channels: z19.array(z19.enum(["email", "in_app", "webhook"])).default(["in_app"]).meta(Unrestricted16),
  is_active: z19.boolean().default(true).meta(Unrestricted16)
}).meta(
  { id: "UsageEnforcementSettings", "x-revturbine-schema-persistence": Persisted16, "x-revturbine-schema-exposure": Internal13, ...mintedIdentity() }
);
var UsageEnforcementSettingsAnchorSchema = makeAnchor("UsageEnforcementSettingsAnchor");
var PlacementSettingsCapRuleGroupItemSchema = z19.object({
  kind: z19.enum(["template", "slot"]).meta(Unrestricted16),
  id: z19.string().min(1).meta(Unrestricted16),
  label: z19.string().min(1).optional().meta(Unrestricted16)
}).meta(
  { id: "PlacementSettingsCapRuleGroupItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": Internal13 }
);
var PlacementSettingsCapRuleSchema = z19.object({
  id: z19.string().min(1).meta(Unrestricted16),
  group: z19.array(PlacementSettingsCapRuleGroupItemSchema).min(1).meta(Unrestricted16),
  cap: z19.object({
    count: z19.number().int().min(1).meta(Unrestricted16),
    period: z19.enum(["session", "day", "week", "month"]).meta(Unrestricted16)
  }).meta(Unrestricted16)
}).meta(
  { id: "PlacementSettingsCapRule", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": Internal13 }
);
var PlacementTestModeSchema = z19.enum(["off", "test_users", "all_traffic"]).meta(
  { id: "PlacementTestMode", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": Internal13 }
);
var PlacementSettingsCapStateSchema = z19.object({
  capRules: z19.array(PlacementSettingsCapRuleSchema).default([]).meta(Unrestricted16),
  sessionCooldownMinutes: z19.number().int().min(0).default(30).meta(Unrestricted16),
  testMode: PlacementTestModeSchema.default("off").meta(Unrestricted16)
}).meta(
  { id: "PlacementSettingsCapState", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": Internal13 }
);
var PlacementSettingsSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z19.string().min(1).meta({ ...Unrestricted16, readOnly: true }),
  handle: HandleField.meta({ ...Unrestricted16, readOnly: true }),
  global_frequency_cap: PlacementSettingsCapStateSchema.nullable().default(null).meta(Unrestricted16),
  // Legacy companion column kept for migration continuity. The new
  // wrapper-object encoding above carries period information per
  // cap rule; this column is always null in v0.1.20+ writes.
  global_frequency_cap_period: z19.enum(["hour", "day", "week", "month", "session"]).nullable().default(null).meta(Unrestricted16),
  suppress_for_paid: z19.boolean().default(false).meta(Unrestricted16),
  suppress_for_trial: z19.boolean().default(false).meta(Unrestricted16),
  default_dismiss_cooldown_hours: z19.number().int().min(0).default(24).meta(Unrestricted16),
  allow_stacking: z19.boolean().default(false).meta(Unrestricted16),
  priority_collision_strategy: z19.enum(["highest_priority", "most_recent", "random"]).default("highest_priority").meta(Unrestricted16)
}).meta(
  { id: "PlacementSettings", "x-revturbine-schema-persistence": Persisted16, "x-revturbine-schema-exposure": Internal13, ...mintedIdentity() }
);
var PlacementSettingsAnchorSchema = makeAnchor("PlacementSettingsAnchor");
var RevTurbineConfigSegmentsItemPredicatesItemSchema = z19.object({
  field: z19.string().min(1).meta(Unrestricted16),
  operator: z19.enum(["eq", "neq", "gt", "lt", "gte", "lte", "contains", "in"]).meta(Unrestricted16),
  value: z19.string().meta(Unrestricted16)
}).meta(
  { id: "RevTurbineConfigSegmentsItemPredicatesItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigSegmentsItemSchema = z19.object({
  // Plan 120 TASK-4: the config carries the handle as its sole logical
  // identifier — the redundant config-level `id` is dropped. The physical
  // UUID primary key stays in the persisted (Drizzle) row, never the config.
  name: z19.string().min(1).meta(Unrestricted16),
  handle: z19.string().min(1).meta(Unrestricted16),
  predicates: z19.array(RevTurbineConfigSegmentsItemPredicatesItemSchema).optional().meta(Unrestricted16),
  // Dimension this segment belongs to (plan #39 REQ-28 / Route A). Optional
  // for back-compat: pre-plan-39 RevTurbineConfigs and segments not yet
  // categorised lack it. The entitlement-rule evaluator uses this to
  // apply intra-dimension OR + cross-dimension AND per spec §2.5; when
  // missing across all of a rule's segment_ids, the evaluator falls
  // back to flat-OR (legacy single-segment behaviour).
  dimension_id: z19.string().optional().meta(Unrestricted16)
}).meta(
  { id: "RevTurbineConfigSegmentsItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigPlansItemSchema = z19.object({
  // Plan 120 TASK-4: `unique_handle` is the sole logical identifier; the
  // redundant config-level `id` is dropped (physical UUID PK stays in the row).
  unique_handle: z19.string().min(1).meta(Unrestricted16),
  name: z19.string().min(1).meta(Unrestricted16),
  tier_position: z19.number().int().min(0).default(0).meta(Unrestricted16),
  sort_order: z19.number().int().min(0).default(0).meta(Unrestricted16),
  // Plan-level visibility (to_do/91 Part B). Lives on the plan, not a
  // priced variation, so a free/custom tier with no variation can still be
  // marked unlisted/legacy and round-trip. Variations may still carry their
  // own visibility for per-price overrides; this is the plan's default.
  visibility: PlanVisibilitySchema.default("public").meta(Unrestricted16)
}).meta(
  { id: "RevTurbineConfigPlansItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigAddonsItemSchema = z19.object({
  // Plan 120 TASK-4: `unique_handle` is the sole logical identifier; the
  // redundant config-level `id` is dropped (physical UUID PK stays in the row).
  unique_handle: z19.string().min(1).meta(Unrestricted16),
  name: z19.string().min(1).meta(Unrestricted16),
  sort_order: z19.number().int().min(0).default(0).meta(Unrestricted16),
  // Add-on visibility (to_do/91 Part B) — same rationale as plans: metadata,
  // not price, so it lives in the config independent of addon_variations.
  visibility: PlanVisibilitySchema.default("public").meta(Unrestricted16)
}).meta(
  { id: "RevTurbineConfigAddonsItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigEntitlementsItemSchema = z19.object({
  // Plan 120 TASK-4: `unique_handle` is the sole logical identifier; the
  // redundant config-level `id` is dropped (physical UUID PK stays in the row).
  unique_handle: z19.string().min(1).meta(Unrestricted16),
  name: z19.string().min(1).meta(Unrestricted16),
  type: EntitlementTypeSchema.meta(Unrestricted16),
  unit: z19.string().optional().meta(Unrestricted16)
}).meta(
  { id: "RevTurbineConfigEntitlementsItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigEntitlementRulesItemSchema = z19.object({
  id: z19.string().min(1).meta(Unrestricted16),
  entitlement_id: z19.string().min(1).meta(Unrestricted16),
  targets: z19.array(EntitlementRuleTargetSchema).min(1).meta(Unrestricted16),
  // Plan #39 REQ-1: multi-segment scoping per spec §2.5. Empty array
  // means "match all users" (replaces the singular `segment_id` field
  // and its 'all'/null sentinels).
  segment_ids: z19.array(z19.string()).default([]).meta(Unrestricted16),
  type_fields: z19.record(z19.string(), z19.unknown()).default({}).meta(Unrestricted16),
  current_usage: z19.number().default(0).meta(Unrestricted16),
  /** How usage is partitioned across the identity hierarchy. */
  allocation: UsageAllocationSchema.optional().meta(Unrestricted16)
}).meta(
  { id: "RevTurbineConfigEntitlementRulesItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigSlotConfigsItemSchema = z19.object({
  slot_id: z19.string().min(1).meta(Unrestricted16),
  active: z19.boolean().meta(Unrestricted16),
  triggers: z19.array(z19.string()).meta(Unrestricted16)
}).meta(
  { id: "RevTurbineConfigSlotConfigsItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigPlacementSlotsItemSchema = z19.object({
  id: z19.string().min(1).meta(Unrestricted16),
  label: z19.string().min(1).meta(Unrestricted16),
  description: z19.string().meta(Unrestricted16),
  surface_type: z19.string().meta(Unrestricted16),
  placement_handle: z19.string().min(1).meta(Unrestricted16),
  template: z19.string().optional().meta(Unrestricted16)
}).meta(
  { id: "RevTurbineConfigPlacementSlotsItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigSurfaceTemplatesItemFieldsItemSchema = z19.object({
  name: z19.string().min(1).meta(Unrestricted16),
  type: z19.string().optional().meta(Unrestricted16),
  required: z19.boolean().optional().meta(Unrestricted16)
}).meta(
  { id: "RevTurbineConfigSurfaceTemplatesItemFieldsItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigSurfaceTemplatesItemSchema = z19.object({
  id: z19.string().min(1).meta(Unrestricted16),
  surface_type: z19.string().meta(Unrestricted16),
  fields: z19.array(RevTurbineConfigSurfaceTemplatesItemFieldsItemSchema).optional().meta(Unrestricted16)
}).meta(
  { id: "RevTurbineConfigSurfaceTemplatesItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigUiPathActionTypeSchema = z19.enum([
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
  "manage_subscription"
]).meta(
  { id: "RevTurbineConfigUiPathActionType", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var ContentUiPathSchema = z19.object({
  name: z19.string().min(1).meta(Unrestricted16),
  action_type: RevTurbineConfigUiPathActionTypeSchema.meta(Unrestricted16),
  plan_handle: z19.string().optional().meta(Unrestricted16),
  promotion_id: z19.string().optional().meta(Unrestricted16),
  placement_handle: z19.string().optional().meta(Unrestricted16),
  url: z19.string().optional().meta(Unrestricted16),
  tour_id: z19.string().optional().meta(Unrestricted16),
  target_billing_period: z19.enum(["monthly", "annual"]).optional().meta(Unrestricted16),
  description: z19.string().optional().meta(Unrestricted16)
}).meta(
  { id: "ContentUiPath", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var ContentPromotionSchema = z19.object({
  id: z19.string().meta(Unrestricted16),
  name: z19.string().meta(Unrestricted16),
  discount: z19.string().meta(Unrestricted16),
  type: z19.string().meta(Unrestricted16),
  status: z19.string().meta(Unrestricted16)
}).meta(
  { id: "ContentPromotion", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var PersonalizationTokenSchema = z19.object({
  token: z19.string().regex(/^[a-z][a-z0-9_]*$/).meta(Unrestricted16),
  label: z19.string().min(1).meta(Unrestricted16),
  description: z19.string().optional().meta(Unrestricted16),
  category: z19.enum(["user", "plan", "usage", "trial", "billing", "promotion", "custom"]).meta(Unrestricted16),
  data_source: z19.string().optional().meta(Unrestricted16),
  example_value: z19.string().optional().meta(Unrestricted16),
  value_map: z19.record(z19.string(), z19.string()).optional().meta(Unrestricted16),
  format: z19.enum(["string", "number", "currency", "percentage", "date"]).optional().meta(Unrestricted16)
}).meta(
  { id: "PersonalizationToken", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var MessageBlockContentSchema = z19.object({
  header: z19.string().optional().meta(Unrestricted16),
  body: z19.string().optional().meta(Unrestricted16),
  cta_label: z19.string().optional().meta(Unrestricted16),
  secondary_cta_label: z19.string().optional().meta(Unrestricted16)
}).catchall(z19.unknown()).meta(
  { id: "MessageBlockContent", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var MessageBlockSchema = z19.object({
  block_id: z19.string().min(1).meta(Unrestricted16),
  tenant_id: z19.string().min(1).meta(Unrestricted16),
  name: z19.string().min(1).meta(Unrestricted16),
  surface_template_id: z19.string().optional().meta(Unrestricted16),
  default_content: MessageBlockContentSchema.meta(Unrestricted16),
  segment_overrides: z19.array(z19.object({
    segment_value_id: z19.string(),
    content: MessageBlockContentSchema
  })).optional().meta(Unrestricted16),
  child_blocks: z19.array(z19.object({
    slot: z19.string(),
    block_id: z19.string()
  })).optional().meta(Unrestricted16),
  tokens_used: z19.array(z19.string()).optional().meta(Unrestricted16),
  status: z19.enum(["draft", "active", "archived"]).meta(Unrestricted16),
  created_at: z19.string().datetime().meta({ ...Unrestricted16, readOnly: true }),
  updated_at: z19.string().datetime().meta({ ...Unrestricted16, readOnly: true })
}).meta(
  { id: "MessageBlock", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigStudioCtaConfigSchema = z19.object({
  label: z19.string().meta(Unrestricted16),
  path: CtaActionTypeSchema.meta(Unrestricted16),
  config: z19.record(z19.string(), z19.string()).optional().meta(Unrestricted16)
}).meta(
  { id: "RevTurbineConfigStudioCtaConfig", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigStudioPayloadSurfaceSchema = z19.object({
  template_id: z19.string().min(1).meta(Unrestricted16),
  fields: z19.record(z19.string(), z19.string()).meta(Unrestricted16),
  ctas: z19.array(RevTurbineConfigStudioCtaConfigSchema).meta(Unrestricted16)
}).meta(
  { id: "RevTurbineConfigStudioPayloadSurface", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigStudioPayloadTargetSchema = z19.object({
  plan_ids: z19.array(z19.string()).meta(Unrestricted16),
  // Billing-cadence dimension of the Plan Filter (spec §3.1.1 Target).
  // Empty/absent = no cadence filter. Optional so pre-plan-76 exports parse.
  billing_cadences: z19.array(z19.string()).optional().meta(Unrestricted16),
  segment_chips: z19.array(z19.string()).meta(Unrestricted16)
}).meta(
  { id: "RevTurbineConfigStudioPayloadTarget", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigPeriodCapSchema = z19.object({
  count: z19.number().int().min(1).meta(Unrestricted16),
  period: z19.enum(["session", "day", "week", "month", "lifetime"]).meta(Unrestricted16)
}).meta(
  { id: "RevTurbineConfigPeriodCap", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigStudioPayloadCapsSchema = z19.object({
  max_per_period: RevTurbineConfigPeriodCapSchema.optional().meta(Unrestricted16),
  cooldown_days: z19.number().int().min(0).optional().meta(Unrestricted16)
}).meta(
  { id: "RevTurbineConfigStudioPayloadCaps", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigStudioPayloadSchema = z19.object({
  id: z19.string().min(1).meta(Unrestricted16),
  target: RevTurbineConfigStudioPayloadTargetSchema.meta(Unrestricted16),
  surfaces: z19.array(RevTurbineConfigStudioPayloadSurfaceSchema).meta(Unrestricted16),
  caps: RevTurbineConfigStudioPayloadCapsSchema.optional().meta(Unrestricted16),
  // Optional slot targeting (spec §3.1.1): empty/absent = any compatible slot.
  surface_slot_ids: z19.array(z19.string()).optional().meta(Unrestricted16),
  created_at: z19.string().optional().meta({ ...Unrestricted16, readOnly: true }),
  recommendation_strategy: z19.enum(["next_tier_up", "best_value", "custom"]).optional().default("next_tier_up").meta(Unrestricted16),
  recommendation_plan_override: z19.string().optional().meta(Unrestricted16)
}).meta(
  { id: "RevTurbineConfigStudioPayload", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigPlacementTriggerSchema = z19.discriminatedUnion("type", [
  z19.object({ type: z19.literal("surface_render"), slot_id: z19.string().min(1) }),
  z19.object({ type: z19.literal("entitlement_gate"), entitlement_handle: z19.string().min(1), tier_threshold: z19.string().optional() }),
  z19.object({ type: z19.literal("usage_threshold"), entitlement_handle: z19.string().min(1), threshold_percent: z19.number().min(1).max(100) }),
  z19.object({ type: z19.literal("credit_threshold"), entitlement_handle: z19.string().min(1), threshold_percent: z19.number().min(1).max(100) }),
  z19.object({ type: z19.literal("seat_threshold"), entitlement_handle: z19.string().min(1), threshold_percent: z19.number().min(1).max(100) }),
  z19.object({ type: z19.literal("trial_started"), trial_type: z19.enum(["free", "reverse"]).optional() }),
  z19.object({ type: z19.literal("trial_progress"), progress_percent: z19.number().min(1).max(100) }),
  z19.object({ type: z19.literal("trial_ending"), days_before_end: z19.number().int().min(0) }),
  z19.object({ type: z19.literal("trial_ended") }),
  z19.object({ type: z19.literal("trial_converted") }),
  z19.object({ type: z19.literal("qualifier"), qualifier: z19.string().min(1) })
]).meta(
  { id: "RevTurbineConfigPlacementTrigger", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigPlacementCategorySchema = z19.enum(["fixed", "gated", "usage_credit_seat", "trials", "other_conversion", "retention"]).meta(
  { id: "RevTurbineConfigPlacementCategory", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigPlacementItemSchema = z19.object({
  id: z19.string().min(1).meta(Unrestricted16),
  name: z19.string().min(1).meta(Unrestricted16),
  category: RevTurbineConfigPlacementCategorySchema.meta(Unrestricted16),
  trigger: RevTurbineConfigPlacementTriggerSchema.meta(Unrestricted16),
  payloads: z19.array(RevTurbineConfigStudioPayloadSchema).meta(Unrestricted16),
  order: z19.number().int().min(0).meta(Unrestricted16)
}).meta(
  { id: "RevTurbineConfigPlacementItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigPlacementPayloadItemSchema = z19.object({
  payload_id: z19.string().min(1).meta(Unrestricted16),
  placement_id: z19.string().min(1).meta(Unrestricted16),
  target: RevTurbineConfigStudioPayloadTargetSchema.meta(Unrestricted16),
  caps: RevTurbineConfigStudioPayloadCapsSchema.optional().meta(Unrestricted16),
  created_at: z19.string().meta({ ...Unrestricted16, readOnly: true }),
  updated_at: z19.string().datetime().optional().meta({ ...Unrestricted16, readOnly: true }),
  source_mode: z19.enum(["inline", "content_linked"]).meta(Unrestricted16),
  surfaces: z19.array(RevTurbineConfigStudioPayloadSurfaceSchema).optional().meta(Unrestricted16),
  // Optional slot targeting (spec §3.1.1): empty/absent = any compatible slot.
  surface_slot_ids: z19.array(z19.string()).optional().meta(Unrestricted16),
  content_link: z19.object({
    message_block_id: z19.string().optional(),
    ui_path_id: z19.string().optional(),
    promotion_id: z19.string().optional(),
    content_payload_id: z19.string().optional()
  }).optional().meta(Unrestricted16)
}).meta(
  { id: "RevTurbineConfigPlacementPayloadItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigExtensionRulesItemSchema = z19.object({
  kind: z19.string().min(1).meta(Unrestricted16),
  schema_version: z19.number().int().nonnegative().meta(Unrestricted16),
  config: z19.unknown().meta(Unrestricted16)
}).meta(
  { id: "RevTurbineConfigExtensionRulesItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigFreeTrialRuleItemSchema = IdField.merge(FreeTrialRuleCoreFieldsSchema).meta(
  { id: "RevTurbineConfigFreeTrialRuleItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigReverseTrialRuleItemSchema = IdField.merge(ReverseTrialRuleCoreFieldsSchema).meta(
  { id: "RevTurbineConfigReverseTrialRuleItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var RevTurbineConfigSchema = z19.object({
  version: z19.string().meta(Unrestricted16),
  exported_at: z19.string().datetime().optional().meta({ ...Unrestricted16, readOnly: true }),
  // The @revt-eng/schema package version this config was generated with.
  schema_version: z19.string().optional().meta({ ...Unrestricted16, readOnly: true }),
  // The compiled-bundle wire-format SCHEMA_VERSION (core/bundle/ir.ts).
  bundle_schema_version: z19.number().int().optional().meta({ ...Unrestricted16, readOnly: true }),
  // The change set this export represents: the active change set by default,
  // or a specific change set when one is requested. Null for an unscoped export.
  change_set_id: z19.string().nullable().default(null).meta({ ...Unrestricted16, readOnly: true }),
  // Origin target identity (plan 131 TASK-10, cli.md "Target-aware, portable"):
  // stamped by the server on export so a downloaded Config File records where
  // it came from; upload tooling targets these by default and flags a tenant
  // mismatch against the session before sending. Optional — hand-authored and
  // pre-existing configs carry no target.
  tenant_id: z19.string().optional().meta({ ...Unrestricted16, readOnly: true }),
  environment_id: z19.string().optional().meta({ ...Unrestricted16, readOnly: true }),
  plans: z19.array(RevTurbineConfigPlansItemSchema).meta(Unrestricted16),
  // Optional for back-compat: pre-plan-88 configs (and the live export until web
  // adopts the new @revt-eng/schema) omit it. Add-on definitions only; pricing
  // (addon_variations) stays in the Stripe layer, like plan_variations.
  addons: z19.array(RevTurbineConfigAddonsItemSchema).optional().meta(Unrestricted16),
  entitlements: z19.array(RevTurbineConfigEntitlementsItemSchema).meta(Unrestricted16),
  entitlement_rules: z19.array(RevTurbineConfigEntitlementRulesItemSchema).meta(Unrestricted16),
  segments: z19.array(RevTurbineConfigSegmentsItemSchema).meta(Unrestricted16),
  content_ui_paths: z19.array(ContentUiPathSchema).meta(Unrestricted16),
  slot_configs: z19.array(RevTurbineConfigSlotConfigsItemSchema).optional().meta(Unrestricted16),
  content_overrides: z19.record(z19.string(), z19.record(z19.string(), z19.string())).optional().meta(Unrestricted16),
  theme: z19.record(z19.string(), z19.unknown()).optional().meta(Unrestricted16),
  placement_slots: z19.array(RevTurbineConfigPlacementSlotsItemSchema).optional().meta(Unrestricted16),
  message_blocks: z19.array(MessageBlockSchema).optional().meta(Unrestricted16),
  placement_payloads: z19.array(RevTurbineConfigPlacementPayloadItemSchema).optional().meta(Unrestricted16),
  placements: z19.array(RevTurbineConfigPlacementItemSchema).optional().meta(Unrestricted16),
  content_promotions: z19.array(ContentPromotionSchema).optional().meta(Unrestricted16),
  personalization_tokens: z19.array(PersonalizationTokenSchema).optional().meta(Unrestricted16),
  surface_templates: z19.array(RevTurbineConfigSurfaceTemplatesItemSchema).optional().meta(Unrestricted16),
  /**
   * Free + reverse trial rule configurations (plan 43). Optional so
   * pre-trial-runtime configs continue to parse. /api/config/import
   * applies these to the tenant's free_trial_rules / reverse_trial_rules
   * tables; /api/config/export reads them out for round-trip.
   */
  free_trial_rules: z19.array(RevTurbineConfigFreeTrialRuleItemSchema).optional().meta(Unrestricted16),
  reverse_trial_rules: z19.array(RevTurbineConfigReverseTrialRuleItemSchema).optional().meta(Unrestricted16),
  /**
   * Tagged-opaque rule entries (Phase 3 / strategy 2). Each entry is
   * dispatched to the corresponding `RuleAuthoringModule.kind` at
   * compile time; unknown kinds are skipped silently so authoring can
   * stage new kinds before the runtime catches up.
   */
  extension_rules: z19.array(RevTurbineConfigExtensionRulesItemSchema).optional().meta(Unrestricted16)
}).meta(
  { id: "RevTurbineConfig", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var configPaths = {
  "/api/config/application-surfaces": {
    get: operation({
      operationId: "listApplicationSurfaces",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List application surfaces",
      tags: ["config"],
      responses: { "200": { description: "Surface list", content: { "application/json": { schema: ListEnvelope(ApplicationSurfaceSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "application-surfaces", persistence: { table: "applicationSurfaces", mode: "list" } }
    }),
    post: operation({
      operationId: "createApplicationSurface",
      summary: "Create application surface",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(ApplicationSurfaceSchema) } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: ApplicationSurfaceSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "application-surfaces", persistence: { table: "applicationSurfaces", mode: "create" } }
    })
  },
  "/api/config/application-surfaces/{id}": {
    get: operation({
      operationId: "getApplicationSurface",
      requestParams: { path: z19.object({ id: z19.string() }) },
      summary: "Get application surface by ID",
      tags: ["config"],
      responses: { "200": { description: "Application surface detail", content: { "application/json": { schema: ApplicationSurfaceSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "application-surfaces", persistence: { table: "applicationSurfaces", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateApplicationSurface",
      requestParams: { path: z19.object({ id: z19.string() }) },
      summary: "Update application surface",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: ApplicationSurfaceSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: ApplicationSurfaceSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "application-surfaces", persistence: { table: "applicationSurfaces", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteApplicationSurface",
      requestParams: { path: z19.object({ id: z19.string() }) },
      summary: "Delete application surface",
      tags: ["config"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "application-surfaces", persistence: { table: "applicationSurfaces", mode: "delete" } }
    })
  },
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
      requestParams: { path: z19.object({ id: z19.string() }) },
      summary: "Update seat type",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: SeatTypeSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: SeatTypeSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "seat-types", persistence: { table: "seatTypeVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteSeatType",
      requestParams: { path: z19.object({ id: z19.string() }) },
      summary: "Delete seat type",
      tags: ["config"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "seat-types", persistence: { table: "seatTypeVersions", mode: "delete" } }
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
      requestParams: { path: z19.object({ meteringId: z19.string() }) },
      summary: "Update metering configuration",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: MeteringConfigSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: MeteringConfigSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "metering-config", persistence: { table: "meteringConfigs", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteMeteringConfig",
      requestParams: { path: z19.object({ meteringId: z19.string() }) },
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
      requestParams: { path: z19.object({ settingsId: z19.string() }) },
      summary: "Update usage enforcement settings",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: UsageEnforcementSettingsSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: UsageEnforcementSettingsSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "usage-enforcement", persistence: { table: "usageEnforcementSettingVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteUsageEnforcementSettings",
      requestParams: { path: z19.object({ settingsId: z19.string() }) },
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

// ../revturbine-scaffold/src/changemgmt/models/changelog-schema.ts
import { z as z20 } from "zod";
var { Unrestricted: Unrestricted17 } = DataClassification;
var { Persisted: Persisted17 } = SchemaPersistence;
var { Internal: Internal14 } = SchemaExposure;
var ChangeLogActionSchema = z20.enum(["create", "update", "delete", "archive", "restore", "reorder", "duplicate", "sync", "publish"]).meta(
  { id: "ChangeLogAction", "x-revturbine-schema-persistence": Persisted17, "x-revturbine-schema-exposure": Internal14 }
);
var ChangeLogEntrySchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  action: ChangeLogActionSchema.meta(Unrestricted17),
  resource_type: z20.string().min(1).max(100).meta(Unrestricted17),
  resource_id: z20.string().min(1).meta(Unrestricted17),
  resource_name: z20.string().max(200).optional().meta(Unrestricted17),
  actor_id: z20.string().min(1).meta(Unrestricted17),
  actor_email: z20.string().email().optional().meta(Unrestricted17),
  diff: z20.object({
    before: z20.record(z20.string(), z20.unknown()).optional(),
    after: z20.record(z20.string(), z20.unknown()).optional()
  }).optional().meta(Unrestricted17),
  summary: z20.string().max(1e3).optional().meta(Unrestricted17),
  metadata: MetadataField.meta(Unrestricted17)
}).meta(
  { id: "ChangeLogEntry", "x-revturbine-schema-persistence": Persisted17, "x-revturbine-schema-exposure": Internal14 }
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
      requestParams: { path: z20.object({ entryId: z20.string() }) },
      summary: "Get change log entry by ID",
      tags: ["changelog"],
      responses: { "200": { description: "Change log entry", content: { "application/json": { schema: ChangeLogEntrySchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "changelog", persistence: { table: "changeLogEntries", mode: "get" } }
    })
  }
};

// ../revturbine-scaffold/src/core/tenant/schema.ts
import { z as z21 } from "zod";
var { Unrestricted: Unrestricted18 } = DataClassification;
var { Persisted: Persisted18, Transient: Transient17 } = SchemaPersistence;
var { Internal: Internal15 } = SchemaExposure;
var TenantStatusSchema = z21.enum(["active", "suspended", "archived"]).meta(
  { id: "TenantStatus", "x-revturbine-schema-persistence": Transient17, "x-revturbine-schema-exposure": Internal15 }
);
var TenantSchema = IdField.merge(TimestampFields).extend({
  name: NameField.meta(Unrestricted18),
  handle: HandleField.meta(Unrestricted18),
  status: TenantStatusSchema.default("active").meta(Unrestricted18),
  metadata: MetadataField.meta(Unrestricted18)
}).meta(
  { id: "Tenant", "x-revturbine-schema-persistence": Persisted18, "x-revturbine-schema-exposure": Internal15 }
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
      requestParams: { path: z21.object({ tenantId: z21.string() }) },
      summary: "Get tenant by ID",
      tags: ["tenants"],
      responses: { "200": { description: "Tenant", content: { "application/json": { schema: TenantSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "tenants", persistence: { table: "tenants", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateTenant",
      requestParams: { path: z21.object({ tenantId: z21.string() }) },
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
      requestParams: { path: z21.object({ tenantId: z21.string() }) },
      summary: "Suspend tenant (disables all API access)",
      tags: ["tenants"],
      responses: { "200": { description: "Suspended", content: { "application/json": { schema: TenantSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "tenants", persistence: { table: "tenants", mode: "update" } }
    })
  },
  "/api/tenants/{tenantId}/reactivate": {
    post: operation({
      operationId: "reactivateTenant",
      requestParams: { path: z21.object({ tenantId: z21.string() }) },
      summary: "Reactivate a suspended tenant",
      tags: ["tenants"],
      responses: { "200": { description: "Reactivated", content: { "application/json": { schema: TenantSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "tenants", persistence: { table: "tenants", mode: "update" } }
    })
  }
};

// ../revturbine-scaffold/src/core/environment/schema.ts
import { z as z22 } from "zod";
var { Unrestricted: Unrestricted19 } = DataClassification;
var { Persisted: Persisted19, Transient: Transient18 } = SchemaPersistence;
var { Internal: Internal16 } = SchemaExposure;
var EnvironmentStatusSchema = z22.enum(["active", "archived", "locked"]).meta(
  { id: "EnvironmentStatus", "x-revturbine-schema-persistence": Transient18, "x-revturbine-schema-exposure": Internal16 }
);
var EnvironmentSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  name: NameField.meta(Unrestricted19),
  handle: HandleField.meta(Unrestricted19),
  description: DescriptionField.meta(Unrestricted19),
  is_production: z22.boolean().default(false).meta({ ...Unrestricted19, readOnly: true }),
  status: EnvironmentStatusSchema.default("active").meta(Unrestricted19),
  // Branching lineage
  cloned_from_environment_id: z22.string().nullable().default(null).meta({ ...Unrestricted19, readOnly: true }),
  cloned_at: NullableDatetimeField.meta({ ...Unrestricted19, readOnly: true }),
  cloned_at_sequence: z22.number().int().min(0).nullable().default(null).meta({ ...Unrestricted19, readOnly: true }),
  // Protection settings (analogous to protected branches)
  requires_approval: z22.boolean().default(false).meta(Unrestricted19),
  auto_deploy_on_approval: z22.boolean().default(false).meta(Unrestricted19),
  // Audit
  created_by: z22.string().optional().meta(Unrestricted19),
  metadata: MetadataField.meta(Unrestricted19)
}).meta(
  { id: "Environment", "x-revturbine-schema-persistence": Persisted19, "x-revturbine-schema-exposure": Internal16 }
);
var EnvironmentPromotionRequestSchema = z22.object({
  source_environment_id: z22.string().min(1),
  target_environment_id: z22.string().min(1),
  playbook_version_ids: z22.array(z22.string()).optional(),
  strategy: z22.enum(["all_current", "selected_playbook_versions"]).default("all_current")
}).meta(
  { id: "EnvironmentPromotionRequest", "x-revturbine-schema-persistence": Transient18, "x-revturbine-schema-exposure": Internal16 }
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
      requestBody: { required: true, content: { "application/json": { schema: z22.object({
        name: z22.string().min(1).max(200),
        handle: z22.string().min(1).max(100),
        description: z22.string().max(500).optional(),
        clone_from_environment_id: z22.string().optional(),
        requires_approval: z22.boolean().optional()
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
      requestParams: { path: z22.object({ environmentId: z22.string() }) },
      summary: "Get environment by ID",
      tags: ["environments"],
      responses: { "200": { description: "Environment", content: { "application/json": { schema: EnvironmentSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "environments", persistence: { table: "environments", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateEnvironment",
      requestParams: { path: z22.object({ environmentId: z22.string() }) },
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
      requestParams: { path: z22.object({ environmentId: z22.string() }) },
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
        "200": { description: "Promotion result", content: { "application/json": { schema: z22.object({
          promoted_count: z22.number().int(),
          conflict_count: z22.number().int(),
          conflicts: z22.array(z22.object({
            handle: z22.string(),
            resource_type: z22.string(),
            source_sequence: z22.number().int(),
            target_sequence: z22.number().int()
          }))
        }) } } },
        default: { description: "Error", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "environments", persistence: { table: "environments", mode: "promote" } }
    })
  }
};

// ../revturbine-scaffold/src/decisions/models/schema.ts
import { z as z23 } from "zod";
var { Unrestricted: Unrestricted20, Pii: Pii6 } = DataClassification;
var { Transient: Transient19, Persisted: Persisted20 } = SchemaPersistence;
var { External: External12 } = SchemaExposure;
var SupersessionReasonSchema = z23.enum(["milestone_version", "milestone_order"]).meta({ id: "SupersessionReason", "x-revturbine-schema-persistence": Transient19, "x-revturbine-schema-exposure": External12 });
var SupersessionRecordSchema = z23.object({
  superseded_output_id: z23.string().min(1).meta(Unrestricted20),
  superseded_by: z23.string().min(1).meta(Unrestricted20),
  reason: SupersessionReasonSchema.meta(Unrestricted20)
}).meta({
  id: "SupersessionRecord",
  "x-revturbine-schema-persistence": Persisted20,
  "x-revturbine-schema-exposure": External12,
  "x-revturbine-data-classification": "operational"
});
var EntitlementStatusSchema = z23.enum(["allowed", "limited", "denied"]).meta({ id: "EntitlementStatus", "x-revturbine-schema-persistence": Transient19, "x-revturbine-schema-exposure": External12 });
var PlacementDecisionOutputSchema = z23.object({
  output_id: z23.string().meta(Unrestricted20),
  category: z23.string().meta(Unrestricted20),
  surface: z23.object({
    template: z23.string().optional().meta(Unrestricted20),
    type: SurfaceTypeSchema.meta(Unrestricted20),
    slot_id: z23.string().optional().meta(Unrestricted20)
  }).meta(Unrestricted20),
  content: z23.record(z23.string(), z23.unknown()).meta(Unrestricted20),
  promotion: z23.record(z23.string(), z23.unknown()).optional().meta(Unrestricted20),
  cta_path: z23.record(z23.string(), z23.unknown()).optional().meta(Unrestricted20),
  /** @deprecated Use cta_path. Kept for compatibility with older SDK consumers. */
  ui_path: z23.record(z23.string(), z23.unknown()).optional().meta(Unrestricted20),
  rule_id: z23.string().meta(Unrestricted20),
  decision_id: z23.string().meta(Unrestricted20),
  config_version: z23.string().meta(Unrestricted20),
  present_upsell: z23.boolean().meta(Unrestricted20)
}).meta({ id: "PlacementDecisionOutput", "x-revturbine-schema-persistence": Transient19, "x-revturbine-schema-exposure": External12 });
var EntitlementCheckResultSchema = z23.object({
  status: EntitlementStatusSchema.meta(Unrestricted20),
  allowed: z23.boolean().meta(Unrestricted20),
  reason: z23.string().optional().meta(Unrestricted20),
  current_tier: z23.string().optional().meta(Unrestricted20),
  /** Upsell placement to render when entitlement is denied. */
  placement: PlacementDecisionOutputSchema.optional().meta(Unrestricted20)
}).meta({ id: "EntitlementCheckResult", "x-revturbine-schema-persistence": Transient19, "x-revturbine-schema-exposure": External12 });
var RuntimePromotionSnapshotSchema = z23.object({
  id: z23.string().meta(Unrestricted20),
  name: z23.string().optional().meta(Unrestricted20),
  discount: z23.string().optional().meta(Unrestricted20),
  type: z23.string().optional().meta(Unrestricted20),
  status: z23.string().optional().meta(Unrestricted20)
}).meta({ id: "RuntimePromotionSnapshot", "x-revturbine-schema-persistence": Transient19, "x-revturbine-schema-exposure": External12 });
var ServerEvaluationPayloadUserSchema = z23.object({
  id: z23.string().meta(Pii6),
  anonymous_id: z23.string().optional().meta(Unrestricted20),
  traits: z23.record(z23.string(), z23.unknown()).optional().meta(Pii6)
}).meta({ id: "ServerEvaluationPayloadUser", "x-revturbine-schema-persistence": Transient19, "x-revturbine-schema-exposure": External12 });
var ServerEvaluationPayloadDecisionsItemSchema = z23.object({
  slot_id: z23.string().optional().meta(Unrestricted20),
  entitlement_handle: z23.string().optional().meta(Unrestricted20),
  plan_handle: z23.string().optional().meta(Unrestricted20),
  placement_handle: z23.string().optional().meta(Unrestricted20),
  visible: z23.boolean().meta(Unrestricted20),
  output: PlacementDecisionOutputSchema.optional().meta(Unrestricted20),
  reason_codes: z23.array(z23.string()).optional().meta(Unrestricted20)
}).meta({ id: "ServerEvaluationPayloadDecisionsItem", "x-revturbine-schema-persistence": Transient19, "x-revturbine-schema-exposure": External12 });
var ServerEvaluationPayloadEntitlementsValueSchema = EntitlementCheckResultSchema;
var ServerEvaluationPayloadTrialStatusSchema = UserTrialStatusSchema.meta({ id: "ServerEvaluationPayloadTrialStatus", "x-revturbine-schema-persistence": Transient19, "x-revturbine-schema-exposure": External12 });
var ServerEvaluationPayloadUserContextSchema = z23.object({
  segments: z23.array(z23.string()).optional().meta(Unrestricted20),
  traits: z23.record(z23.string(), z23.unknown()).optional().meta(Pii6),
  usage_balances: z23.record(z23.string(), z23.number()).optional().meta(Unrestricted20)
}).meta({ id: "ServerEvaluationPayloadUserContext", "x-revturbine-schema-persistence": Transient19, "x-revturbine-schema-exposure": External12 });
var ServerEvaluationPayloadSchema = z23.object({
  version: z23.literal("1.0.0").meta(Unrestricted20),
  request_id: z23.string().meta(Unrestricted20),
  tenant_id: z23.string().meta(Unrestricted20),
  evaluated_at: z23.string().datetime().meta(Unrestricted20),
  ttl_seconds: z23.number().int().min(0).max(86400).meta(Unrestricted20),
  user: ServerEvaluationPayloadUserSchema.meta(Pii6),
  decisions: z23.array(ServerEvaluationPayloadDecisionsItemSchema).meta(Unrestricted20),
  entitlements: z23.record(z23.string(), ServerEvaluationPayloadEntitlementsValueSchema).optional().meta(Unrestricted20),
  theme: z23.record(z23.string(), z23.unknown()).optional().meta(Unrestricted20),
  trial_status: ServerEvaluationPayloadTrialStatusSchema.optional().meta(Unrestricted20),
  user_context: ServerEvaluationPayloadUserContextSchema.optional().meta(Pii6)
}).meta({ id: "ServerEvaluationPayload", "x-revturbine-schema-persistence": Transient19, "x-revturbine-schema-exposure": External12 });

// ../revturbine-scaffold/src/changemgmt/models/changesets-schema.ts
import { z as z24 } from "zod";
var { Unrestricted: Unrestricted21 } = DataClassification;
var { Persisted: Persisted21, Transient: Transient20 } = SchemaPersistence;
var { Internal: Internal17 } = SchemaExposure;
var PlaybookVersionStatusSchema = z24.enum([
  "draft",
  "awaiting_approval",
  "approved",
  "deploying",
  "deployed",
  "rejected",
  "archived"
]).meta(
  { id: "PlaybookVersionStatus", "x-revturbine-schema-persistence": Transient20, "x-revturbine-schema-exposure": Internal17 }
);
var PlaybookVersionSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  environment_id: z24.string().min(1).meta(Unrestricted21),
  name: NameField.meta(Unrestricted21),
  description: z24.string().max(2e3).optional().meta(Unrestricted21),
  status: PlaybookVersionStatusSchema.default("draft").meta(Unrestricted21),
  labels: z24.array(z24.string()).default([]).meta(Unrestricted21),
  // People
  created_by: z24.string().min(1).meta(Unrestricted21),
  submitted_by: z24.string().nullable().default(null).meta({ ...Unrestricted21, readOnly: true }),
  reviewed_by: z24.string().nullable().default(null).meta({ ...Unrestricted21, readOnly: true }),
  deployed_by: z24.string().nullable().default(null).meta({ ...Unrestricted21, readOnly: true }),
  // Dates
  submitted_at: NullableDatetimeField.meta({ ...Unrestricted21, readOnly: true }),
  reviewed_at: NullableDatetimeField.meta({ ...Unrestricted21, readOnly: true }),
  deployed_at: NullableDatetimeField.meta({ ...Unrestricted21, readOnly: true }),
  // Snapshot (analogous to HEAD at branch creation)
  base_snapshot_sequence: z24.number().int().min(0).default(0).meta({ ...Unrestricted21, readOnly: true }),
  // Computed counts
  entry_count: z24.number().int().min(0).default(0).meta({ ...Unrestricted21, readOnly: true }),
  conflict_count: z24.number().int().min(0).default(0).meta({ ...Unrestricted21, readOnly: true }),
  // Lineage
  rollback_of_playbook_version_id: z24.string().nullable().default(null).meta(Unrestricted21),
  cherry_picked_from_playbook_version_id: z24.string().nullable().default(null).meta(Unrestricted21),
  // Review
  review_notes: z24.string().max(2e3).optional().meta(Unrestricted21),
  rejection_reason: z24.string().max(2e3).optional().meta(Unrestricted21),
  // Immutable frozen artifacts, written once when the playbook version is activated
  // (plan 70): `snapshot` is the fully-rendered RevTurbineConfig JSON; `bundle`
  // is the compiled FlatBuffer bundle, base64-encoded (the Zod→drizzle
  // generator has no bytea type). readOnly — only the activation path writes
  // them, and never overwrites a populated value.
  snapshot: z24.record(z24.string(), z24.unknown()).nullable().default(null).meta({ ...Unrestricted21, readOnly: true }),
  bundle: z24.string().nullable().default(null).meta({ ...Unrestricted21, readOnly: true }),
  metadata: MetadataField.meta(Unrestricted21)
}).meta(
  { id: "PlaybookVersion", "x-revturbine-schema-persistence": Persisted21, "x-revturbine-schema-exposure": Internal17 }
);
var PlaybookVersionEntrySummarySchema = z24.object({
  handle: z24.string().meta(Unrestricted21),
  resource_type: z24.string().meta(Unrestricted21),
  resource_name: z24.string().optional().meta(Unrestricted21),
  action: z24.enum(["create", "update", "delete"]).meta(Unrestricted21),
  has_conflict: z24.boolean().meta(Unrestricted21)
}).meta(
  { id: "PlaybookVersionEntrySummary", "x-revturbine-schema-persistence": Transient20, "x-revturbine-schema-exposure": Internal17 }
);
var PlaybookVersionDiffSchema = z24.object({
  playbook_version_id: z24.string().meta(Unrestricted21),
  entries: z24.array(PlaybookVersionEntrySummarySchema).meta(Unrestricted21),
  total_entries: z24.number().int().min(0).meta(Unrestricted21),
  total_conflicts: z24.number().int().min(0).meta(Unrestricted21),
  deployable: z24.boolean().meta(Unrestricted21)
}).meta(
  { id: "PlaybookVersionDiff", "x-revturbine-schema-persistence": Transient20, "x-revturbine-schema-exposure": Internal17 }
);
var PlaybookVersionDeployResultSchema = z24.object({
  playbook_version_id: z24.string().meta(Unrestricted21),
  deployed_count: z24.number().int().min(0).meta(Unrestricted21),
  superseded_count: z24.number().int().min(0).meta(Unrestricted21),
  skipped_conflicts: z24.number().int().min(0).meta(Unrestricted21),
  deployed_at: z24.string().datetime().meta(Unrestricted21)
}).meta(
  { id: "PlaybookVersionDeployResult", "x-revturbine-schema-persistence": Transient20, "x-revturbine-schema-exposure": Internal17 }
);
var playbookVersionPaths = {
  // ── Lifecycle transitions ────────────────────────────────────────────────
  "/api/playbook-versions/{playbookVersionId}/submit": {
    post: operation({
      operationId: "submitPlaybookVersion",
      requestParams: { path: z24.object({ playbookVersionId: z24.string() }) },
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
      requestParams: { path: z24.object({ playbookVersionId: z24.string() }) },
      summary: "Approve playbook version (may auto-deploy if environment allows)",
      tags: ["playbook-versions"],
      requestBody: { required: true, content: { "application/json": { schema: z24.object({ review_notes: z24.string().max(2e3).optional() }) } } },
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
      requestParams: { path: z24.object({ playbookVersionId: z24.string() }) },
      summary: "Reject playbook version",
      tags: ["playbook-versions"],
      requestBody: { required: true, content: { "application/json": { schema: z24.object({ rejection_reason: z24.string().max(2e3) }) } } },
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
      requestParams: { path: z24.object({ playbookVersionId: z24.string() }) },
      summary: "Deploy playbook version \u2014 activates all entries, supersedes previous versions",
      tags: ["playbook-versions"],
      requestBody: { required: true, content: { "application/json": { schema: z24.object({ force: z24.boolean().default(false) }) } } },
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
      requestParams: { path: z24.object({ playbookVersionId: z24.string() }) },
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
      requestParams: { path: z24.object({ playbookVersionId: z24.string() }) },
      summary: "Preview diff of all entries vs current state (dry-run deploy)",
      tags: ["playbook-versions"],
      responses: { "200": { description: "Diff preview", content: { "application/json": { schema: PlaybookVersionDiffSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "playbook-versions", persistence: { table: "playbookVersions", mode: "preview" } }
    })
  },
  "/api/playbook-versions/{playbookVersionId}/conflicts": {
    get: operation({
      operationId: "listPlaybookVersionConflicts",
      requestParams: { path: z24.object({ playbookVersionId: z24.string() }), query: ListQueryParamsSchema },
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
      requestParams: { path: z24.object({ playbookVersionId: z24.string() }) },
      summary: "Create a rollback playbook version that reverts a deployed one",
      tags: ["playbook-versions"],
      requestBody: { required: true, content: { "application/json": { schema: z24.object({
        name: z24.string().min(1).max(200).optional()
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
      requestParams: { path: z24.object({ playbookVersionId: z24.string() }) },
      summary: "Cherry-pick individual entries from this PlaybookVersion into another",
      tags: ["playbook-versions"],
      requestBody: { required: true, content: { "application/json": { schema: z24.object({
        handles: z24.array(z24.string()).min(1),
        target_playbook_version_id: z24.string().min(1)
      }) } } },
      responses: {
        "200": { description: "Cherry-picked", content: { "application/json": { schema: z24.object({ copied_count: z24.number().int() }) } } },
        default: { description: "Error", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "playbook-versions", persistence: { table: "playbookVersions", mode: "update" } }
    })
  }
};

// ../revturbine-scaffold/src/settings/models/schema.ts
import { z as z25 } from "zod";
var { Unrestricted: Unrestricted22, Pii: Pii7 } = DataClassification;
var { Persisted: Persisted22 } = SchemaPersistence;
var { Internal: Internal18 } = SchemaExposure;
var ApiKeyStatusSchema = z25.enum(["active", "revoked", "rotating"]).meta({ id: "ApiKeyStatus", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal18 });
var ApiKeySchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  name: NameField.meta(Unrestricted22),
  key_hash: z25.string().min(1).meta({ ...Pii7, readOnly: true }),
  key_prefix: z25.string().min(1).max(20).meta({ ...Unrestricted22, readOnly: true }),
  key_last4: z25.string().length(4).meta({ ...Unrestricted22, readOnly: true }),
  status: ApiKeyStatusSchema.default("active").meta(Unrestricted22),
  last_used_at: NullableDatetimeField.meta({ ...Unrestricted22, readOnly: true }),
  expires_at: NullableDatetimeField.meta(Unrestricted22)
}).meta({ id: "ApiKey", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal18 });
var FlagValueTypeSchema = z25.enum(["boolean", "string", "number", "json"]).meta({ id: "FlagValueType", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal18 });
var FeatureFlagSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  key: z25.string().min(1).max(100).meta(Unrestricted22),
  value_type: FlagValueTypeSchema.default("boolean").meta(Unrestricted22),
  value: z25.string().max(4e3).default("false").meta(Unrestricted22),
  description: DescriptionField.meta(Unrestricted22),
  enabled: z25.boolean().default(true).meta(Unrestricted22)
}).meta({ id: "FeatureFlag", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal18 });
var TenantConfigSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  workspace_name: z25.string().min(1).max(200).meta(Unrestricted22),
  support_email: z25.string().email().nullable().default(null).meta(Unrestricted22),
  timezone: z25.string().max(50).default("UTC").meta(Unrestricted22),
  default_currency: z25.string().length(3).default("USD").meta(Unrestricted22),
  logo_url: z25.string().url().nullable().default(null).meta(Unrestricted22)
}).meta({ id: "TenantConfig", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal18 });
var McpConfigSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  /** @deprecated Plan 28 ships a hosted MCP server at `/api/mcp/streamable-http`; no outbound server URL is needed. Column remains for backward compatibility. */
  server_url: z25.string().url().max(500).meta(Unrestricted22),
  /** @deprecated Plan 28 mints per-tenant MCP tokens at Settings → MCP and stores only a SHA-256 hash; this free-text hint is unused. Column remains for backward compatibility. */
  api_token_hint: z25.string().max(50).nullable().default(null).meta(Unrestricted22),
  allow_write_actions: z25.boolean().default(false).meta(Unrestricted22),
  enabled_tools: z25.array(z25.string().max(100)).default([]).meta(Unrestricted22),
  enabled: z25.boolean().default(false).meta(Unrestricted22)
}).meta({ id: "McpConfig", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal18 });
var OnboardingChecklistSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  step_key: z25.string().min(1).max(100).meta(Unrestricted22),
  label: z25.string().min(1).max(200).meta(Unrestricted22),
  done: z25.boolean().default(false).meta(Unrestricted22),
  completed_at: NullableDatetimeField.meta({ ...Unrestricted22, readOnly: true })
}).meta({ id: "OnboardingChecklist", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal18 });
var AuditActorTypeSchema = z25.enum(["user", "agent", "system", "webhook"]).meta({ id: "AuditActorType", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal18 });
var AuditEventSchema = IdField.merge(TenantIdField).extend({
  environment_id: z25.string().min(1).default("production").meta(Unrestricted22),
  actor_type: AuditActorTypeSchema.meta(Unrestricted22),
  actor_id: z25.string().nullable().default(null).meta(Unrestricted22),
  action: z25.string().min(1).max(120).meta(Unrestricted22),
  object_type: z25.string().max(120).nullable().default(null).meta(Unrestricted22),
  object_id: z25.string().max(200).nullable().default(null).meta(Unrestricted22),
  payload: z25.record(z25.string(), z25.unknown()).nullable().default(null).meta(Unrestricted22),
  occurred_at: z25.string().datetime().meta({ ...Unrestricted22, readOnly: true })
}).meta({ id: "AuditEvent", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal18 });
var PlacementTestUserIdentifierTypeSchema = z25.enum(["user_id", "account_id", "email"]).meta({ id: "PlacementTestUserIdentifierType", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal18 });
var PlacementTestUserSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  handle: HandleField.meta({ ...Unrestricted22, readOnly: true }),
  identifier: z25.string().min(1).max(200).meta(Unrestricted22),
  identifier_type: PlacementTestUserIdentifierTypeSchema.default("user_id").meta(Unrestricted22),
  note: z25.string().max(500).nullable().default(null).meta(Unrestricted22),
  added_by: z25.string().meta(Unrestricted22)
}).meta({ id: "PlacementTestUser", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal18, ...mintedIdentity() });
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
      requestParams: { path: z25.object({ keyId: z25.string() }) },
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
      requestParams: { path: z25.object({ flagId: z25.string() }) },
      summary: "Get a feature flag",
      tags: ["settings"],
      responses: { "200": { description: "Feature flag", content: { "application/json": { schema: FeatureFlagSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "feature-flags", persistence: { table: "featureFlags", mode: "get" } }
    }),
    put: operation({
      operationId: "updateFeatureFlag",
      requestParams: { path: z25.object({ flagId: z25.string() }) },
      summary: "Update a feature flag",
      tags: ["settings"],
      requestBody: { required: true, content: { "application/json": { schema: toWritableSchema(FeatureFlagSchema).partial() } } },
      responses: { "200": { description: "Feature flag updated", content: { "application/json": { schema: FeatureFlagSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "feature-flags", persistence: { table: "featureFlags", mode: "update", writeSchema: "FeatureFlagSchema#writable" } }
    }),
    delete: operation({
      operationId: "deleteFeatureFlag",
      requestParams: { path: z25.object({ flagId: z25.string() }) },
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
      requestParams: { path: z25.object({ stepId: z25.string() }) },
      summary: "Get an onboarding step",
      tags: ["settings"],
      responses: { "200": { description: "Onboarding step", content: { "application/json": { schema: OnboardingChecklistSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "onboarding", persistence: { table: "onboardingChecklist", mode: "get" } }
    }),
    put: operation({
      operationId: "updateOnboardingStep",
      requestParams: { path: z25.object({ stepId: z25.string() }) },
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
      requestParams: { path: z25.object({ testUserId: z25.string() }) },
      summary: "Remove a placement test user",
      tags: ["settings"],
      responses: { "200": { description: "Placement test user removed", content: { "application/json": { schema: PlacementTestUserSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "placement-test-users", persistence: { table: "placementTestUsers", mode: "delete" } }
    })
  }
};

// ../revturbine-scaffold/src/core/auth/schema.ts
import { z as z26 } from "zod";
var { Unrestricted: Unrestricted23, Pii: Pii8 } = DataClassification;
var { Persisted: Persisted23, Transient: Transient21 } = SchemaPersistence;
var { Internal: Internal19 } = SchemaExposure;
var UserRoleSchema = z26.enum(["user", "admin"]).meta({ id: "UserRole", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal19 });
var AuthUserSchema = IdField.merge(TimestampFields).extend({
  name: NameField.meta(Unrestricted23),
  email: z26.string().email().meta(Pii8),
  email_verified: z26.boolean().default(false).meta(Unrestricted23),
  image: z26.string().url().nullable().default(null).meta(Pii8),
  role: UserRoleSchema.default("user").meta(Unrestricted23),
  banned: z26.boolean().default(false).meta({ ...Unrestricted23, readOnly: true }),
  ban_reason: z26.string().nullable().default(null).meta({ ...Unrestricted23, readOnly: true }),
  ban_expires: NullableDatetimeField.meta({ ...Unrestricted23, readOnly: true }),
  two_factor_enabled: z26.boolean().default(false).meta({ ...Unrestricted23, readOnly: true })
}).meta({ id: "AuthUser", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal19 });
var AuthSessionSchema = IdField.merge(TimestampFields).extend({
  expires_at: z26.string().datetime().meta(Unrestricted23),
  token: z26.string().min(1).meta({ ...Pii8, readOnly: true }),
  ip_address: z26.string().nullable().default(null).meta(Pii8),
  user_agent: z26.string().nullable().default(null).meta(Pii8),
  user_id: z26.string().min(1).meta({ ...Unrestricted23, readOnly: true }),
  active_organization_id: z26.string().nullable().default(null).meta(Unrestricted23),
  impersonated_by: z26.string().nullable().default(null).meta({ ...Unrestricted23, readOnly: true })
}).meta({ id: "AuthSession", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal19 });
var AuthAccountSchema = IdField.merge(TimestampFields).extend({
  account_id: z26.string().min(1).meta(Unrestricted23),
  provider_id: z26.string().min(1).meta(Unrestricted23),
  user_id: z26.string().min(1).meta({ ...Unrestricted23, readOnly: true }),
  access_token: z26.string().nullable().default(null).meta({ ...Pii8, readOnly: true }),
  refresh_token: z26.string().nullable().default(null).meta({ ...Pii8, readOnly: true }),
  id_token: z26.string().nullable().default(null).meta({ ...Pii8, readOnly: true }),
  access_token_expires_at: NullableDatetimeField.meta({ ...Unrestricted23, readOnly: true }),
  refresh_token_expires_at: NullableDatetimeField.meta({ ...Unrestricted23, readOnly: true }),
  scope: z26.string().nullable().default(null).meta(Unrestricted23),
  password: z26.string().nullable().default(null).meta({ ...Pii8, readOnly: true })
}).meta({ id: "AuthAccount", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal19 });
var AuthVerificationSchema = IdField.merge(TimestampFields).extend({
  identifier: z26.string().min(1).meta(Pii8),
  value: z26.string().min(1).meta({ ...Pii8, readOnly: true }),
  expires_at: z26.string().datetime().meta(Unrestricted23)
}).meta({ id: "AuthVerification", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal19 });
var AuthTwoFactorSchema = IdField.extend({
  secret: z26.string().min(1).meta({ ...Pii8, readOnly: true }),
  backup_codes: z26.string().min(1).meta({ ...Pii8, readOnly: true }),
  user_id: z26.string().min(1).meta({ ...Unrestricted23, readOnly: true }),
  verified: z26.boolean().default(false).meta({ ...Unrestricted23, readOnly: true })
}).meta({ id: "AuthTwoFactor", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal19 });
var AuthOrganizationSchema = IdField.extend({
  name: NameField.meta(Unrestricted23),
  slug: z26.string().min(1).max(100).nullable().default(null).meta(Unrestricted23),
  logo: z26.string().url().nullable().default(null).meta(Unrestricted23),
  created_at: z26.string().datetime().meta({ ...Unrestricted23, readOnly: true }),
  metadata: z26.string().nullable().default(null).meta(Unrestricted23)
}).meta({ id: "AuthOrganization", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal19 });
var RoleSchema = z26.enum(["viewer", "collaborator", "approver", "admin"]).meta({ id: "Role", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal19 });
var ROLE_RANK = {
  viewer: 0,
  collaborator: 1,
  approver: 2,
  admin: 3
};
var PermissionResourceSchema = z26.enum([
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
]).meta({ id: "PermissionResource", "x-revturbine-schema-persistence": Transient21, "x-revturbine-schema-exposure": Internal19 });
var PermissionActionSchema = z26.enum([
  "read",
  "create",
  "update",
  "delete",
  "publish",
  "approve",
  "invite",
  "manage_roles"
]).meta({ id: "PermissionAction", "x-revturbine-schema-persistence": Transient21, "x-revturbine-schema-exposure": Internal19 });
var PermissionSchema = z26.object({
  resource: PermissionResourceSchema,
  action: PermissionActionSchema
}).meta({ id: "Permission", "x-revturbine-schema-persistence": Transient21, "x-revturbine-schema-exposure": Internal19 });
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
var McpTokenScopeSchema = z26.enum(SCOPE_VALUES).meta({ id: "McpTokenScope", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal19 });
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
  organization_id: z26.string().min(1).meta({ ...Unrestricted23, readOnly: true }),
  user_id: z26.string().min(1).meta({ ...Unrestricted23, readOnly: true }),
  role: RoleSchema.default("viewer").meta(Unrestricted23),
  created_at: z26.string().datetime().meta({ ...Unrestricted23, readOnly: true })
}).meta({ id: "AuthMember", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal19 });
var InvitationStatusSchema = z26.enum(["pending", "accepted", "rejected", "canceled", "expired"]).meta({ id: "InvitationStatus", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal19 });
var AuthInvitationSchema = IdField.extend({
  organization_id: z26.string().min(1).meta({ ...Unrestricted23, readOnly: true }),
  email: z26.string().email().meta(Pii8),
  role: RoleSchema.nullable().default(null).meta(Unrestricted23),
  status: InvitationStatusSchema.default("pending").meta(Unrestricted23),
  expires_at: z26.string().datetime().meta(Unrestricted23),
  created_at: z26.string().datetime().meta({ ...Unrestricted23, readOnly: true }),
  inviter_id: z26.string().min(1).meta({ ...Unrestricted23, readOnly: true })
}).meta({ id: "AuthInvitation", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal19 });
var AuthPasskeySchema = IdField.extend({
  name: z26.string().max(200).nullable().default(null).meta(Unrestricted23),
  public_key: z26.string().min(1).meta({ ...Pii8, readOnly: true }),
  user_id: z26.string().min(1).meta({ ...Unrestricted23, readOnly: true }),
  credential_id: z26.string().min(1).meta({ ...Unrestricted23, readOnly: true }),
  counter: z26.number().int().default(0).meta({ ...Unrestricted23, readOnly: true }),
  device_type: z26.string().min(1).meta(Unrestricted23),
  backed_up: z26.boolean().default(false).meta(Unrestricted23),
  transports: z26.string().nullable().default(null).meta(Unrestricted23),
  created_at: z26.string().datetime().meta({ ...Unrestricted23, readOnly: true }),
  aaguid: z26.string().nullable().default(null).meta(Unrestricted23)
}).meta({ id: "AuthPasskey", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal19 });
var AuthApiKeySchema = IdField.merge(TimestampFields).extend({
  config_id: z26.string().min(1).meta(Unrestricted23),
  name: z26.string().max(200).nullable().default(null).meta(Unrestricted23),
  start: z26.string().nullable().default(null).meta(Unrestricted23),
  reference_id: z26.string().min(1).meta(Unrestricted23),
  prefix: z26.string().nullable().default(null).meta(Unrestricted23),
  key: z26.string().min(1).meta({ ...Pii8, readOnly: true }),
  refill_interval: z26.number().int().nullable().default(null).meta(Unrestricted23),
  refill_amount: z26.number().int().nullable().default(null).meta(Unrestricted23),
  last_refill_at: NullableDatetimeField.meta({ ...Unrestricted23, readOnly: true }),
  enabled: z26.boolean().default(true).meta(Unrestricted23),
  rate_limit_enabled: z26.boolean().default(false).meta(Unrestricted23),
  rate_limit_time_window: z26.number().int().nullable().default(null).meta(Unrestricted23),
  rate_limit_max: z26.number().int().nullable().default(null).meta(Unrestricted23),
  request_count: z26.number().int().default(0).meta({ ...Unrestricted23, readOnly: true }),
  remaining: z26.number().int().nullable().default(null).meta({ ...Unrestricted23, readOnly: true }),
  last_request: NullableDatetimeField.meta({ ...Unrestricted23, readOnly: true }),
  expires_at: NullableDatetimeField.meta(Unrestricted23),
  permissions: z26.string().nullable().default(null).meta(Unrestricted23),
  metadata: z26.string().nullable().default(null).meta(Unrestricted23)
}).meta({ id: "AuthApiKey", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal19 });
var AuthSsoProviderSchema = IdField.extend({
  issuer: z26.string().min(1).meta(Unrestricted23),
  oidc_config: z26.string().nullable().default(null).meta(Unrestricted23),
  saml_config: z26.string().nullable().default(null).meta(Unrestricted23),
  user_id: z26.string().min(1).meta({ ...Unrestricted23, readOnly: true }),
  provider_id: z26.string().min(1).meta(Unrestricted23),
  organization_id: z26.string().nullable().default(null).meta(Unrestricted23),
  domain: z26.string().min(1).meta(Unrestricted23)
}).meta({ id: "AuthSsoProvider", "x-revturbine-schema-persistence": Persisted23, "x-revturbine-schema-exposure": Internal19 });
export {
  AddOnSchema,
  AddOnVariationSchema,
  AlertSchema,
  AnchorFields,
  ApiKeySchema,
  ApiKeyStatusSchema,
  ApplicationSurfaceSchema,
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
  BillingCadenceSchema,
  CapPeriodSchema,
  ChangeLogActionSchema,
  ChangeLogEntrySchema,
  CohortMonthSchema,
  ContentPayloadSegmentEntrySchema,
  ContentPlacementPayloadSchema,
  ContentPromotionSchema,
  ContentUiPathSchema,
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
  DataClassification,
  DecisionLogSchema,
  DescriptionField,
  DimensionCategorySchema,
  DimensionSourceTypeSchema,
  DiscountTypeSchema,
  DriftReportSchema,
  EnforcementActionSchema,
  EnforcementModeSchema,
  EntitlementCheckResultSchema,
  EntitlementEvalLogSchema,
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
  EventSearchParamsSchema,
  EventSourceSchema,
  ExperimentSchema,
  ExperimentStatusSchema,
  ExperimentTypeSchema,
  ExperimentVariantSchema,
  RevTurbineConfigPlacementItemSchema as ExportedConfigPlacementItemSchema,
  RevTurbineConfigSchema as ExportedConfigSchema,
  RevTurbineConfigSegmentsItemPredicatesItemSchema as ExportedConfigSegmentsItemPredicatesItemSchema,
  RevTurbineConfigSegmentsItemSchema as ExportedConfigSegmentsItemSchema,
  RevTurbineConfigUiPathActionTypeSchema as ExportedConfigUiPathActionTypeSchema,
  FeatureFlagSchema,
  FeatureFlagValueSchema,
  FeatureGateTriggerPayloadSchema,
  FieldDefinitionSchema,
  FlagValueTypeSchema,
  FreeTrialRuleSchema,
  FreeTrialSettingsSchema,
  FunnelStepSchema,
  HANDLE_PATTERN,
  HandleField,
  INGEST_WRITE_SCOPE,
  IdField,
  IdentityKind,
  IdentitySchema,
  IngestedEventSchema,
  InvitationStatusSchema,
  KpiAggregateSchema,
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
  OptimizationSuggestionSchema,
  OrgMemberRoleSchema,
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
  PlacementVariantSchema,
  PlanEntitlementSchema,
  PlanSchema,
  PlanVariationSchema,
  PlanVisibilitySchema,
  PlaybookVersionDeployResultSchema,
  PlaybookVersionDiffSchema,
  PlaybookVersionEntrySummarySchema,
  PlaybookVersionSchema,
  PlaybookVersionStatusSchema,
  PresentationRecordSchema,
  PriceSourceSchema,
  PricingModelSchema,
  PromotionSchema,
  PromotionStatusSchema,
  ROLE_PERMISSIONS,
  ROLE_RANK,
  RevTurbineConfigAddonsItemSchema,
  RevTurbineConfigEntitlementRulesItemSchema,
  RevTurbineConfigEntitlementsItemSchema,
  RevTurbineConfigPeriodCapSchema,
  RevTurbineConfigPlacementCategorySchema,
  RevTurbineConfigPlacementItemSchema,
  RevTurbineConfigPlacementPayloadItemSchema,
  RevTurbineConfigPlacementSlotsItemSchema,
  RevTurbineConfigPlacementTriggerSchema,
  RevTurbineConfigPlansItemSchema,
  RevTurbineConfigSchema,
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
  SchemaExposure,
  SchemaPersistence,
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
  SeveritySchema,
  StripeIntegrationConfigSchema,
  StripePriceMockBillingPeriodSchema,
  StripePriceMockSchema,
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
  VersionFields,
  WebhookEventLogSchema,
  WebhookEventSourceSchema,
  WebhookEventStatusSchema,
  analyticsPaths,
  changelogPaths,
  collectVersionedConfigEntities,
  configPaths,
  contentPaths,
  customerPaths,
  entitlementPaths,
  environmentPaths,
  eventPaths,
  experimentPaths,
  filterExternalSchemas,
  filterPersistedSchemas,
  getFieldClassification,
  getObjectFieldClassifications,
  getSchemaClassification,
  getSchemaExposure,
  getSchemaIdentity,
  getSchemaPersistence,
  isVersionedConfigEntity,
  makeAnchor,
  mintedIdentity,
  namedIdentity,
  placementPaths,
  planPaths,
  playbookVersionPaths,
  promotionPaths,
  runtimePaths,
  scopesSubsetOfRole,
  segmentPaths,
  settingsPaths,
  tenantPaths,
  toCreateSchema,
  toWritableSchema,
  trialPaths,
  uiPreferencePaths,
  userContextPaths
};
