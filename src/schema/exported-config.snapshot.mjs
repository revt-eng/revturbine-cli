// GENERATED — do not edit by hand.
// Vendored ExportedConfigSchema snapshot bundled from @revt-eng/schema@0.1.84
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
var { Transient } = SchemaPersistence;
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
var ConfigVersionFields = z2.object({
  environment_id: z2.string().min(1).default("production").meta({ ...Unrestricted, readOnly: true }),
  canonical_id: z2.string().min(1).nullable().default(null).meta({ ...Unrestricted, readOnly: true }),
  change_set_id: z2.string().nullable().default(null).meta(Unrestricted),
  is_current: z2.boolean().default(true).meta({ ...Unrestricted, readOnly: true }),
  sequence: z2.number().int().min(1).default(1).meta({ ...Unrestricted, readOnly: true }),
  base_sequence: z2.number().int().min(0).nullable().default(null).meta(Unrestricted)
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

// ../revturbine-scaffold/src/plans/models/schema.ts
import { z as z4 } from "zod";

// ../revturbine-scaffold/src/core/openapi/helpers.ts
import { z as z3 } from "zod";
var ListEnvelope = (itemSchema) => z3.object({
  items: z3.array(itemSchema)
});
var ErrorEnvelope = z3.object({
  error: z3.string(),
  code: z3.string(),
  request_id: z3.string()
});
var operation = (op) => op;
var ListQueryParamsSchema = z3.object({
  page: z3.number().int().min(1).default(1).optional(),
  per_page: z3.number().int().min(1).max(100).default(25).optional(),
  sort: z3.string().optional(),
  order: z3.enum(["asc", "desc"]).default("asc").optional(),
  include_deleted: z3.boolean().default(false).optional()
});

// ../revturbine-scaffold/src/plans/models/schema.ts
var { Unrestricted: Unrestricted2, Financial } = DataClassification;
var { Persisted, Transient: Transient2 } = SchemaPersistence;
var { External: External2 } = SchemaExposure;
var PlanVisibilitySchema = z4.enum(["public", "unlisted", "legacy"]).meta(
  {
    id: "PlanVisibility",
    "x-revturbine-schema-persistence": Transient2,
    "x-revturbine-schema-exposure": External2
  }
);
var PricingModelSchema = z4.enum(["flat", "per_unit", "tiered", "metered"]).meta(
  {
    id: "PricingModel",
    "x-revturbine-schema-persistence": Transient2,
    "x-revturbine-schema-exposure": External2
  }
);
var PlanSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).extend({
  name: NameField.meta(Unrestricted2),
  handle: HandleField.meta(Unrestricted2),
  tier_position: z4.number().int().min(0).default(0).meta(Unrestricted2),
  sort_order: z4.number().int().default(0).meta(Unrestricted2),
  metadata: MetadataField.meta(Unrestricted2)
}).meta(
  {
    id: "Plan",
    "x-revturbine-schema-persistence": Persisted,
    "x-revturbine-schema-exposure": External2
  }
);
var PlanVariationSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).extend({
  plan_id: z4.string().min(1).meta(Unrestricted2),
  billing_period: z4.enum(["monthly", "annual", "one_time", "custom"]).meta(Unrestricted2),
  segment_id: z4.string().nullable().default(null).meta(Unrestricted2),
  price_amount: z4.number().min(0).meta(Financial),
  pricing_model: PricingModelSchema.meta(Unrestricted2),
  visibility: PlanVisibilitySchema.default("public").meta(Unrestricted2),
  stripe_price_id: z4.string().optional().meta(Unrestricted2)
}).meta(
  {
    id: "PlanVariation",
    "x-revturbine-schema-persistence": Persisted,
    "x-revturbine-schema-exposure": External2
  }
);
var AddOnSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).extend({
  name: NameField.meta(Unrestricted2),
  handle: HandleField.meta(Unrestricted2),
  sort_order: z4.number().int().default(0).meta(Unrestricted2),
  metadata: MetadataField.meta(Unrestricted2)
}).meta(
  {
    id: "AddOn",
    "x-revturbine-schema-persistence": Persisted,
    "x-revturbine-schema-exposure": External2
  }
);
var AddOnVariationSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).extend({
  addon_id: z4.string().min(1).meta(Unrestricted2),
  // 'one_time' is first-class — Stripe one-time Prices (credit packs,
  // expansion packages) bind here without coercion to 'custom'.
  billing_period: z4.enum(["monthly", "annual", "one_time", "custom"]).meta(Unrestricted2),
  segment_id: z4.string().nullable().default(null).meta(Unrestricted2),
  price_amount: z4.number().min(0).meta(Financial),
  pricing_model: PricingModelSchema.meta(Unrestricted2),
  visibility: PlanVisibilitySchema.default("public").meta(Unrestricted2),
  stripe_price_id: z4.string().optional().meta(Unrestricted2)
}).meta(
  {
    id: "AddOnVariation",
    "x-revturbine-schema-persistence": Persisted,
    "x-revturbine-schema-exposure": External2
  }
);
var StripePriceMockBillingPeriodSchema = z4.enum(["monthly", "annual", "one_time", "custom"]).meta({
  id: "StripePriceMockBillingPeriod",
  "x-revturbine-schema-persistence": Transient2,
  "x-revturbine-schema-exposure": External2
});
var StripePriceMockSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  stripe_price_id: z4.string().min(1).meta(Unrestricted2),
  stripe_product_id: z4.string().min(1).meta(Unrestricted2),
  billing_period: StripePriceMockBillingPeriodSchema.meta(Unrestricted2),
  unit_amount_cents: z4.number().int().min(0).nullable().default(null).meta(Financial),
  currency: CurrencySchema.meta(Financial),
  pricing_model: PricingModelSchema.meta(Unrestricted2),
  nickname: z4.string().nullable().default(null).meta(Unrestricted2)
}).meta({
  id: "StripePriceMock",
  "x-revturbine-schema-persistence": Persisted,
  "x-revturbine-schema-exposure": External2
});
var PlanWriteSchema = toWritableSchema(PlanSchema);
var PlanVariationWriteSchema = toWritableSchema(PlanVariationSchema);
var AddOnWriteSchema = toWritableSchema(AddOnSchema);
var AddOnVariationWriteSchema = toWritableSchema(AddOnVariationSchema);
var StripePriceMockWriteSchema = toWritableSchema(StripePriceMockSchema);
var planPaths = {
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
      "x-revturbine-operation": { exposure: "external", resource: "plans", persistence: { table: "plans", mode: "list" } }
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
      "x-revturbine-operation": { exposure: "external", resource: "plans", persistence: { table: "plans", mode: "create" } }
    })
  },
  "/api/plans/{planId}": {
    get: operation({
      operationId: "getPlan",
      requestParams: { path: z4.object({ planId: z4.string() }) },
      summary: "Get plan by ID",
      tags: ["plans"],
      responses: {
        "200": { description: "Plan detail", content: { "application/json": { schema: PlanSchema } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "external", resource: "plans", persistence: { table: "plans", mode: "get" } }
    }),
    patch: operation({
      operationId: "updatePlan",
      requestParams: { path: z4.object({ planId: z4.string() }) },
      summary: "Update plan",
      tags: ["plans"],
      requestBody: { required: true, content: { "application/json": { schema: PlanWriteSchema } } },
      responses: {
        "200": { description: "Updated plan", content: { "application/json": { schema: PlanSchema } } },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "external", resource: "plans", persistence: { table: "plans", mode: "update" } }
    }),
    delete: operation({
      operationId: "deletePlan",
      requestParams: { path: z4.object({ planId: z4.string() }) },
      summary: "Delete plan",
      tags: ["plans"],
      responses: {
        "204": { description: "Plan deleted" },
        default: { description: "Error response", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "external", resource: "plans", persistence: { table: "plans", mode: "delete" } }
    })
  },
  "/api/plans/reorder": {
    post: operation({
      operationId: "reorderPlans",
      summary: "Reorder plans",
      tags: ["plans"],
      requestBody: { required: true, content: { "application/json": { schema: z4.object({ ids: z4.array(z4.string()) }) } } },
      responses: { "200": { description: "Reordered" } },
      "x-revturbine-operation": { exposure: "external", resource: "plans", persistence: { table: "plans", mode: "reorder" } }
    })
  },
  "/api/plans/{planId}/variations": {
    get: operation({
      operationId: "listPlanVariations",
      requestParams: { path: z4.object({ planId: z4.string() }), query: ListQueryParamsSchema },
      summary: "List plan variations",
      tags: ["plans"],
      responses: { "200": { description: "Plan variations", content: { "application/json": { schema: ListEnvelope(PlanVariationSchema) } } } },
      "x-revturbine-operation": { exposure: "external", resource: "plan-variations", persistence: { table: "planVariations", mode: "list" } }
    }),
    post: operation({
      operationId: "createPlanVariation",
      requestParams: { path: z4.object({ planId: z4.string() }) },
      summary: "Create plan variation",
      tags: ["plans"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(PlanVariationSchema) } } },
      responses: { "201": { description: "Created plan variation", content: { "application/json": { schema: PlanVariationSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "plan-variations", persistence: { table: "planVariations", mode: "create" } }
    })
  },
  "/api/plan-variations/{variationId}": {
    get: operation({
      operationId: "getPlanVariation",
      requestParams: { path: z4.object({ variationId: z4.string() }) },
      summary: "Get plan variation by ID",
      tags: ["plans"],
      responses: { "200": { description: "Plan variation detail", content: { "application/json": { schema: PlanVariationSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "plan-variations", persistence: { table: "planVariations", mode: "get" } }
    }),
    patch: operation({
      operationId: "updatePlanVariation",
      requestParams: { path: z4.object({ variationId: z4.string() }) },
      summary: "Update plan variation",
      tags: ["plans"],
      requestBody: { required: true, content: { "application/json": { schema: PlanVariationWriteSchema } } },
      responses: { "200": { description: "Updated plan variation", content: { "application/json": { schema: PlanVariationSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "plan-variations", persistence: { table: "planVariations", mode: "update" } }
    }),
    delete: operation({
      operationId: "deletePlanVariation",
      requestParams: { path: z4.object({ variationId: z4.string() }) },
      summary: "Delete plan variation",
      tags: ["plans"],
      responses: { "204": { description: "Plan variation deleted" } },
      "x-revturbine-operation": { exposure: "external", resource: "plan-variations", persistence: { table: "planVariations", mode: "delete" } }
    })
  },
  "/api/addons": {
    get: operation({
      operationId: "listAddOns",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List add-ons",
      tags: ["plans"],
      responses: { "200": { description: "Add-on list", content: { "application/json": { schema: ListEnvelope(AddOnSchema) } } } },
      "x-revturbine-operation": { exposure: "external", resource: "addons", persistence: { table: "addons", mode: "list" } }
    }),
    post: operation({
      operationId: "createAddOn",
      summary: "Create add-on",
      tags: ["plans"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(AddOnSchema) } } },
      responses: { "201": { description: "Created add-on", content: { "application/json": { schema: AddOnSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "addons", persistence: { table: "addons", mode: "create" } }
    })
  },
  "/api/addons/{addonId}": {
    get: operation({
      operationId: "getAddOn",
      requestParams: { path: z4.object({ addonId: z4.string() }) },
      summary: "Get add-on by ID",
      tags: ["plans"],
      responses: { "200": { description: "Add-on detail", content: { "application/json": { schema: AddOnSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "addons", persistence: { table: "addons", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateAddOn",
      requestParams: { path: z4.object({ addonId: z4.string() }) },
      summary: "Update add-on",
      tags: ["plans"],
      requestBody: { required: true, content: { "application/json": { schema: AddOnWriteSchema } } },
      responses: { "200": { description: "Updated add-on", content: { "application/json": { schema: AddOnSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "addons", persistence: { table: "addons", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteAddOn",
      requestParams: { path: z4.object({ addonId: z4.string() }) },
      summary: "Delete add-on",
      tags: ["plans"],
      responses: { "204": { description: "Add-on deleted" } },
      "x-revturbine-operation": { exposure: "external", resource: "addons", persistence: { table: "addons", mode: "delete" } }
    })
  },
  "/api/addons/{addonId}/variations": {
    get: operation({
      operationId: "listAddOnVariations",
      requestParams: { path: z4.object({ addonId: z4.string() }), query: ListQueryParamsSchema },
      summary: "List add-on variations",
      tags: ["plans"],
      responses: { "200": { description: "Add-on variations", content: { "application/json": { schema: ListEnvelope(AddOnVariationSchema) } } } },
      "x-revturbine-operation": { exposure: "external", resource: "addon-variations", persistence: { table: "addonVariations", mode: "list" } }
    }),
    post: operation({
      operationId: "createAddOnVariation",
      requestParams: { path: z4.object({ addonId: z4.string() }) },
      summary: "Create add-on variation",
      tags: ["plans"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(AddOnVariationSchema) } } },
      responses: { "201": { description: "Created variation", content: { "application/json": { schema: AddOnVariationSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "addon-variations", persistence: { table: "addonVariations", mode: "create" } }
    })
  },
  "/api/addon-variations/{variationId}": {
    get: operation({
      operationId: "getAddOnVariation",
      requestParams: { path: z4.object({ variationId: z4.string() }) },
      summary: "Get add-on variation by ID",
      tags: ["plans"],
      responses: { "200": { description: "Add-on variation detail", content: { "application/json": { schema: AddOnVariationSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "addon-variations", persistence: { table: "addonVariations", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateAddOnVariation",
      requestParams: { path: z4.object({ variationId: z4.string() }) },
      summary: "Update add-on variation",
      tags: ["plans"],
      requestBody: { required: true, content: { "application/json": { schema: AddOnVariationWriteSchema } } },
      responses: { "200": { description: "Updated variation", content: { "application/json": { schema: AddOnVariationSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "addon-variations", persistence: { table: "addonVariations", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteAddOnVariation",
      requestParams: { path: z4.object({ variationId: z4.string() }) },
      summary: "Delete add-on variation",
      tags: ["plans"],
      responses: { "204": { description: "Variation deleted" } },
      "x-revturbine-operation": { exposure: "external", resource: "addon-variations", persistence: { table: "addonVariations", mode: "delete" } }
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
      requestParams: { path: z4.object({ id: z4.string() }) },
      summary: "Get Stripe price mock by ID",
      tags: ["plans"],
      responses: { "200": { description: "Stripe price mock detail", content: { "application/json": { schema: StripePriceMockSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "stripe-prices-mock", persistence: { table: "stripePricesMock", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateStripePriceMock",
      requestParams: { path: z4.object({ id: z4.string() }) },
      summary: "Update Stripe price mock",
      tags: ["plans"],
      requestBody: { required: true, content: { "application/json": { schema: StripePriceMockWriteSchema } } },
      responses: { "200": { description: "Updated Stripe price mock", content: { "application/json": { schema: StripePriceMockSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "stripe-prices-mock", persistence: { table: "stripePricesMock", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteStripePriceMock",
      requestParams: { path: z4.object({ id: z4.string() }) },
      summary: "Delete Stripe price mock",
      tags: ["plans"],
      responses: { "204": { description: "Stripe price mock deleted" } },
      "x-revturbine-operation": { exposure: "external", resource: "stripe-prices-mock", persistence: { table: "stripePricesMock", mode: "delete" } }
    })
  }
};

// ../revturbine-scaffold/src/entitlements/models/schema.ts
import { z as z5 } from "zod";
var { Unrestricted: Unrestricted3 } = DataClassification;
var { Persisted: Persisted2, Transient: Transient3 } = SchemaPersistence;
var { Internal: Internal2, External: External3 } = SchemaExposure;
var UsagePeriodScopeSchema = z5.enum(["per_month", "per_year", "per_billing_period", "lifetime", "concurrent", "per_instance", "per_second", "per_minute", "per_hour", "per_6_hours", "per_day", "per_week"]).meta(
  { id: "UsagePeriodScope", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": External3 }
);
var UsageAllocationSchema = z5.enum(["account_pool", "per_instance", "per_user", "per_user_pooled"]).meta(
  { id: "UsageAllocation", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": External3 }
);
var EntitlementGrantStatusSchema = z5.enum(["allowed", "limited", "denied"]).meta(
  { id: "EntitlementGrantStatus", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": External3 }
);
var EntitlementGrantSourceSchema = z5.enum(["rule", "user_context", "override"]).meta(
  { id: "EntitlementGrantSource", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": External3 }
);
var EnforcementModeSchema = z5.enum(["hard_block", "soft_block", "degrade", "allow_overage"]).meta(
  { id: "EnforcementMode", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": External3 }
);
var EntitlementGrantSchema = z5.object({
  entitlement_id: z5.string().min(1).meta(Unrestricted3),
  entitlement_handle: z5.string().min(1).meta(Unrestricted3),
  status: EntitlementGrantStatusSchema.meta(Unrestricted3),
  limit: z5.number().optional().meta(Unrestricted3),
  used: z5.number().optional().meta(Unrestricted3),
  allocation: UsageAllocationSchema.optional().meta(Unrestricted3),
  enforcement: EnforcementModeSchema.optional().meta(Unrestricted3),
  /** How this grant was derived. */
  source: EntitlementGrantSourceSchema.optional().meta(Unrestricted3),
  // ── Derivation context (populated when source = 'rule') ──
  /** The plan that activated this rule-derived grant. */
  plan_id: z5.string().optional().meta(Unrestricted3),
  /** The segment that matched for this rule-derived grant. */
  segment_id: z5.string().optional().meta(Unrestricted3),
  /** The seat type that qualified this grant (when allocation is per-seat). */
  seat_type_id: z5.string().optional().meta(Unrestricted3),
  /** The entitlement rule id that produced this grant. */
  rule_id: z5.string().optional().meta(Unrestricted3)
}).meta(
  {
    id: "EntitlementGrant",
    "x-revturbine-schema-persistence": Transient3,
    "x-revturbine-schema-exposure": External3,
    "x-revturbine-data-classification": "operational"
  }
);
var EntitlementGrantSetSchema = z5.object({
  account: z5.record(z5.string(), EntitlementGrantSchema).optional().meta(Unrestricted3),
  instance: z5.record(z5.string(), EntitlementGrantSchema).optional().meta(Unrestricted3),
  user: z5.record(z5.string(), EntitlementGrantSchema).optional().meta(Unrestricted3)
}).meta(
  {
    id: "EntitlementGrantSet",
    "x-revturbine-schema-persistence": Transient3,
    "x-revturbine-schema-exposure": External3,
    "x-revturbine-data-classification": "operational"
  }
);
var RuleVisibilitySchema = z5.enum(["public", "non_public"]).meta(
  { id: "RuleVisibility", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": External3 }
);
var EntitlementRuleTargetKindSchema = z5.enum(["plan", "plan_variation", "addon", "addon_variation"]).meta(
  { id: "EntitlementRuleTargetKind", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": External3 }
);
var EntitlementRuleTargetSchema = z5.object({
  kind: EntitlementRuleTargetKindSchema.meta(Unrestricted3),
  id: z5.string().min(1).meta(Unrestricted3)
}).meta(
  { id: "EntitlementRuleTarget", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": External3 }
);
var EntitlementRulePeriodUnitSchema = z5.enum(["month", "day", "week", "quarter", "year", "billing_period", "on_purchase", "hour", "six_hours"]).meta(
  { id: "EntitlementRulePeriodUnit", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": External3 }
);
var EntitlementSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).extend({
  name: NameField.meta(Unrestricted3),
  handle: HandleField.meta(Unrestricted3),
  customer_facing_description: z5.string().max(500).optional().meta(Unrestricted3),
  type: EntitlementTypeSchema.meta(Unrestricted3),
  unit: z5.string().max(100).optional().meta(Unrestricted3),
  period_scope: UsagePeriodScopeSchema.optional().meta(Unrestricted3),
  allocation: UsageAllocationSchema.optional().meta(Unrestricted3),
  tier_definitions: z5.array(z5.object({
    name: z5.string(),
    handle: z5.string(),
    description: z5.string().optional()
  })).optional().meta(Unrestricted3),
  sort_order: z5.number().int().default(0).meta(Unrestricted3),
  metadata: MetadataField.meta(Unrestricted3)
}).meta(
  {
    id: "Entitlement",
    "x-revturbine-schema-persistence": Persisted2,
    "x-revturbine-schema-exposure": External3
  }
);
var PlanEntitlementSchema = TenantIdField.merge(ConfigVersionFields).extend({
  id: z5.number().int().meta({ ...Unrestricted3, readOnly: true }),
  plan_id: z5.string().min(1).meta(Unrestricted3),
  entitlement_id: z5.string().min(1).meta(Unrestricted3),
  value: z5.union([z5.boolean(), z5.number(), z5.string()]).meta(Unrestricted3),
  override_label: z5.string().max(200).optional().meta(Unrestricted3)
}).meta(
  {
    id: "PlanEntitlement",
    "x-revturbine-schema-persistence": Persisted2,
    "x-revturbine-schema-exposure": Internal2
  }
);
var EntitlementRuleSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).extend({
  entitlement_id: z5.string().min(1).meta(Unrestricted3),
  targets: z5.array(EntitlementRuleTargetSchema).min(1).meta(Unrestricted3),
  // Segment scoping per spec §2.5: array of segment IDs interpreted with
  // intra-dimension OR + cross-dimension AND at evaluation time. The
  // dimensions registry resolves each ID → dimension. Empty array means
  // "match all users" (replaces the legacy 'all' sentinel).
  segment_ids: z5.array(z5.string()).default([]).meta(Unrestricted3),
  visibility: RuleVisibilitySchema.default("public").meta(Unrestricted3),
  // Usage-Limit "measured over" window, rule-level (plan #55). Rate Limit
  // keeps its entitlement-level `period_scope`; this is the per-rule one.
  period_scope: UsagePeriodScopeSchema.optional().meta(Unrestricted3),
  // Optional instance label, surfaced when `period_scope = 'per_instance'` (F-1).
  instance: z5.string().max(100).optional().meta(Unrestricted3),
  // Credits reset cadence ("refills every"). `billing_period` resolves at
  // runtime to the customer's Variation billing period; structural guard below.
  reset_period: EntitlementRulePeriodUnitSchema.optional().meta(Unrestricted3),
  // Type-specific fields (populated based on entitlement type)
  limit_value: z5.union([z5.number(), z5.literal("unlimited")]).optional().meta(Unrestricted3),
  enforcement: EnforcementModeSchema.optional().meta(Unrestricted3),
  overage_price_ref: z5.string().optional().meta(Unrestricted3),
  grace_period_hours: z5.number().int().min(0).optional().meta(Unrestricted3),
  tier_value: z5.string().optional().meta(Unrestricted3),
  rate_value: z5.number().optional().meta(Unrestricted3),
  initial_grant: z5.number().optional().meta(Unrestricted3),
  allowance_value: z5.union([z5.number(), z5.literal("unlimited")]).optional().meta(Unrestricted3),
  rollover_enabled: z5.boolean().optional().meta(Unrestricted3),
  // Ceiling on total balance — refills clipped, add-on top-ups bypass.
  // NOT NULL JSONB at the DB level; JSON-null value means "no ceiling."
  max_balance: z5.union([z5.number(), z5.literal("unlimited")]).nullable().default(null).meta(Unrestricted3),
  seat_type_id: z5.string().optional().meta(Unrestricted3),
  included_count: z5.union([z5.number().int(), z5.literal("unlimited")]).optional().meta(Unrestricted3),
  at_limit_behavior: z5.enum(["hard_cap", "auto_upgrade_at_renewal"]).optional().meta(Unrestricted3),
  stripe_metered_price_id: z5.string().optional().meta(Unrestricted3)
}).meta(
  {
    id: "EntitlementRule",
    "x-revturbine-schema-persistence": Persisted2,
    "x-revturbine-schema-exposure": Internal2
  }
);
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
var EntitlementRuleWarningCodeSchema = z5.enum(["one_time_period_mismatch"]).meta(
  { id: "EntitlementRuleWarningCode", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": External3 }
);
var EntitlementRuleWarningSchema = z5.object({
  code: EntitlementRuleWarningCodeSchema.meta(Unrestricted3),
  message: z5.string().min(1).meta(Unrestricted3),
  /** Optional dotted field path the warning relates to (e.g. `['targets']`). */
  path: z5.array(z5.union([z5.string(), z5.number().int()])).optional().meta(Unrestricted3)
}).meta(
  { id: "EntitlementRuleWarning", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": External3 }
);
var EntitlementRuleWriteResponseSchema = EntitlementRuleSchema.extend({
  warnings: z5.array(EntitlementRuleWarningSchema).optional().meta(Unrestricted3)
}).meta(
  {
    id: "EntitlementRuleWriteResponse",
    "x-revturbine-schema-persistence": Transient3,
    "x-revturbine-schema-exposure": External3
  }
);
var EntitlementRuleVariantSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).extend({
  rule_id: z5.string().min(1).meta(Unrestricted3),
  experiment_id: z5.string().min(1).meta(Unrestricted3),
  variant_name: z5.string().min(1).max(200).meta(Unrestricted3),
  is_control: z5.boolean().default(false).meta(Unrestricted3),
  override_fields: z5.record(z5.string(), z5.unknown()).default({}).meta(Unrestricted3)
}).meta(
  {
    id: "EntitlementRuleVariant",
    "x-revturbine-schema-persistence": Persisted2,
    "x-revturbine-schema-exposure": Internal2
  }
);
var EntitlementWriteSchema = toWritableSchema(EntitlementSchema);
var EntitlementRuleWriteSchema = toWritableSchema(EntitlementRuleSchema);
var PlanEntitlementWriteSchema = toWritableSchema(PlanEntitlementSchema);
var entitlementPaths = {
  "/api/entitlements": {
    get: operation({
      operationId: "listEntitlements",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List entitlements",
      tags: ["entitlements"],
      responses: { "200": { description: "Entitlement list", content: { "application/json": { schema: ListEnvelope(EntitlementSchema) } } } },
      "x-revturbine-operation": { exposure: "external", resource: "entitlements", persistence: { table: "entitlements", mode: "list" } }
    }),
    post: operation({
      operationId: "createEntitlement",
      summary: "Create entitlement",
      tags: ["entitlements"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(EntitlementSchema) } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: EntitlementSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "entitlements", persistence: { table: "entitlements", mode: "create" } }
    })
  },
  "/api/entitlements/{entitlementId}": {
    get: operation({
      operationId: "getEntitlement",
      requestParams: { path: z5.object({ entitlementId: z5.string() }) },
      summary: "Get entitlement",
      tags: ["entitlements"],
      responses: { "200": { description: "Entitlement detail", content: { "application/json": { schema: EntitlementSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "entitlements", persistence: { table: "entitlements", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateEntitlement",
      requestParams: { path: z5.object({ entitlementId: z5.string() }) },
      summary: "Update entitlement",
      tags: ["entitlements"],
      requestBody: { required: true, content: { "application/json": { schema: EntitlementWriteSchema } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: EntitlementSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "entitlements", persistence: { table: "entitlements", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteEntitlement",
      requestParams: { path: z5.object({ entitlementId: z5.string() }) },
      summary: "Delete entitlement",
      tags: ["entitlements"],
      responses: { "204": { description: "Deleted" }, default: { description: "Error", content: { "application/json": { schema: ErrorEnvelope } } } },
      "x-revturbine-operation": { exposure: "external", resource: "entitlements", persistence: { table: "entitlements", mode: "delete" } }
    })
  },
  "/api/entitlements/{entitlementId}/rules": {
    get: operation({
      operationId: "listEntitlementRules",
      requestParams: { path: z5.object({ entitlementId: z5.string() }), query: ListQueryParamsSchema },
      summary: "List rules for entitlement",
      tags: ["entitlements"],
      responses: { "200": { description: "Rule list", content: { "application/json": { schema: ListEnvelope(EntitlementRuleSchema) } } } },
      "x-revturbine-operation": { exposure: "external", resource: "entitlement-rules", persistence: { table: "entitlementRules", mode: "list" } }
    }),
    post: operation({
      operationId: "createEntitlementRule",
      requestParams: { path: z5.object({ entitlementId: z5.string() }) },
      summary: "Create entitlement rule",
      tags: ["entitlements"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(EntitlementRuleSchema) } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: EntitlementRuleWriteResponseSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "entitlement-rules", persistence: { table: "entitlementRules", mode: "create" } }
    })
  },
  "/api/entitlement-rules/{ruleId}": {
    patch: operation({
      operationId: "updateEntitlementRule",
      requestParams: { path: z5.object({ ruleId: z5.string() }) },
      summary: "Update entitlement rule",
      tags: ["entitlements"],
      requestBody: { required: true, content: { "application/json": { schema: EntitlementRuleWriteSchema } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: EntitlementRuleWriteResponseSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "entitlement-rules", persistence: { table: "entitlementRules", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteEntitlementRule",
      requestParams: { path: z5.object({ ruleId: z5.string() }) },
      summary: "Delete entitlement rule",
      tags: ["entitlements"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "external", resource: "entitlement-rules", persistence: { table: "entitlementRules", mode: "delete" } }
    })
  },
  "/api/entitlement-rules/{ruleId}/duplicate": {
    post: operation({
      operationId: "duplicateEntitlementRule",
      requestParams: { path: z5.object({ ruleId: z5.string() }) },
      summary: "Duplicate entitlement rule",
      tags: ["entitlements"],
      responses: { "201": { description: "Duplicated", content: { "application/json": { schema: EntitlementRuleWriteResponseSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "entitlement-rules", persistence: { table: "entitlementRules", mode: "duplicate" } }
    })
  },
  "/api/entitlement-rules/{ruleId}/variants": {
    get: operation({
      operationId: "listEntitlementRuleVariants",
      requestParams: { path: z5.object({ ruleId: z5.string() }), query: ListQueryParamsSchema },
      summary: "List A/B variants for rule",
      tags: ["entitlements"],
      responses: { "200": { description: "Variant list", content: { "application/json": { schema: ListEnvelope(EntitlementRuleVariantSchema) } } } },
      "x-revturbine-operation": { exposure: "external", resource: "entitlement-rule-variants", persistence: { table: "entitlementRuleVariants", mode: "list" } }
    }),
    post: operation({
      operationId: "createEntitlementRuleVariant",
      requestParams: { path: z5.object({ ruleId: z5.string() }) },
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
      requestParams: { path: z5.object({ id: z5.string() }) },
      summary: "Get plan \u2194 entitlement mapping",
      tags: ["entitlements"],
      responses: { "200": { description: "Plan entitlement detail", content: { "application/json": { schema: PlanEntitlementSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "plan-entitlements", persistence: { table: "planEntitlements", mode: "get" } }
    }),
    put: operation({
      operationId: "updatePlanEntitlement",
      requestParams: { path: z5.object({ id: z5.string() }) },
      summary: "Update plan \u2194 entitlement mapping",
      tags: ["entitlements"],
      requestBody: { required: true, content: { "application/json": { schema: PlanEntitlementWriteSchema } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: PlanEntitlementSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "plan-entitlements", persistence: { table: "planEntitlements", mode: "update" } }
    }),
    delete: operation({
      operationId: "deletePlanEntitlement",
      requestParams: { path: z5.object({ id: z5.string() }) },
      summary: "Delete plan \u2194 entitlement mapping",
      tags: ["entitlements"],
      responses: { "204": { description: "Deleted" }, default: { description: "Error", content: { "application/json": { schema: ErrorEnvelope } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "plan-entitlements", persistence: { table: "planEntitlements", mode: "delete" } }
    })
  }
};

// ../revturbine-scaffold/src/placements/models/schema.ts
import { z as z6 } from "zod";
var { Unrestricted: Unrestricted4 } = DataClassification;
var { Persisted: Persisted3, Transient: Transient4 } = SchemaPersistence;
var { External: External4, Internal: Internal3 } = SchemaExposure;
var PlacementCategorySchema = z6.enum([
  "fixed",
  "gated_feature",
  "usage_limit",
  "trial",
  "other_conversion",
  "retention"
]).meta(
  { id: "PlacementCategory", "x-revturbine-schema-persistence": Transient4, "x-revturbine-schema-exposure": External4 }
);
var CapPeriodSchema = z6.enum(["session", "day", "week", "month", "lifetime"]).meta(
  { id: "CapPeriod", "x-revturbine-schema-persistence": Transient4, "x-revturbine-schema-exposure": External4 }
);
var PlacementCapRuleSchema = z6.object({
  count: z6.number().int().positive().meta(Unrestricted4),
  period: CapPeriodSchema.meta(Unrestricted4)
}).meta(
  { id: "PlacementCapRule", "x-revturbine-schema-persistence": Transient4, "x-revturbine-schema-exposure": External4 }
);
var SurfaceTypeCapRuleSchema = z6.object({
  surface_type: z6.string().min(1).meta(Unrestricted4),
  rules: z6.array(PlacementCapRuleSchema).meta(Unrestricted4),
  cooldown_ms: z6.number().int().nonnegative().optional().meta(Unrestricted4)
}).meta(
  {
    id: "SurfaceTypeCapRule",
    "x-revturbine-schema-persistence": Persisted3,
    "x-revturbine-schema-exposure": External4,
    "x-revturbine-data-classification": "operational"
  }
);
var CtaPathTypeSchema = z6.enum([
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
var PlacementSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).extend({
  name: NameField.meta(Unrestricted4),
  handle: HandleField.meta(Unrestricted4),
  description: DescriptionField.meta(Unrestricted4),
  category: PlacementCategorySchema.meta(Unrestricted4),
  drag_order_in_category: z6.number().int().default(0).meta(Unrestricted4),
  // Trigger config (populated based on category)
  surface_slot_id: z6.string().optional().meta(Unrestricted4),
  entitlement_id: z6.string().optional().meta(Unrestricted4),
  tier_threshold: z6.string().optional().meta(Unrestricted4),
  threshold_percent: z6.number().min(0).max(100).optional().meta(Unrestricted4),
  trial_type: z6.enum(["free", "reverse"]).optional().meta(Unrestricted4),
  trigger_type: z6.string().optional().meta(Unrestricted4),
  trial_progress_percent: z6.number().min(0).max(100).optional().meta(Unrestricted4),
  days_before_end: z6.number().int().min(0).optional().meta(Unrestricted4),
  qualifier: z6.enum(["none_always_on", "overage_vs_upgrade", "time_bound", "payment_failed", "payment_at_risk"]).optional().meta(Unrestricted4),
  activation_window_start: z6.string().datetime().optional().meta(Unrestricted4),
  activation_window_end: z6.string().datetime().optional().meta(Unrestricted4),
  metadata: MetadataField.meta(Unrestricted4)
}).meta(
  {
    id: "Placement",
    "x-revturbine-schema-persistence": Persisted3,
    "x-revturbine-schema-exposure": External4
  }
);
var CtaObjectSchema = z6.object({
  label: z6.string().min(1).max(200).meta(Unrestricted4),
  cta_path_type: CtaPathTypeSchema.meta(Unrestricted4),
  config_fields: z6.record(z6.string(), z6.unknown()).default({}).meta(Unrestricted4)
}).meta(
  { id: "CtaObject", "x-revturbine-schema-persistence": Transient4, "x-revturbine-schema-exposure": External4 }
);
var PlacementPayloadSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).extend({
  placement_id: z6.string().min(1).meta(Unrestricted4),
  drag_order: z6.number().int().default(0).meta(Unrestricted4),
  // Plan Filter (spec §3.1.1 Target): OR within each dimension, AND across.
  // Empty arrays = "All" (no filter). Cadence values mirror the selected
  // plans' Plan Variations (free-form strings, e.g. 'monthly' / 'annual').
  target_plan_ids: z6.array(z6.string()).default([]).meta(Unrestricted4),
  target_plan_billing_cadences: z6.array(z6.string()).default([]).meta(Unrestricted4),
  target_segments: z6.array(z6.string()).default([]).meta(Unrestricted4),
  // Optional slot targeting (spec §3.1.1 Surface & Content): empty = "any
  // compatible slot"; hidden for Fixed placements at the UI layer.
  surface_slot_ids: z6.array(z6.string()).default([]).meta(Unrestricted4),
  surface_template_id: z6.string().min(1).meta(Unrestricted4),
  content_fields: z6.record(z6.string(), z6.unknown()).default({}).meta(Unrestricted4),
  cta_list: z6.array(CtaObjectSchema).default([]).meta(Unrestricted4),
  max_per_period: z6.number().int().min(0).nullable().default(null).meta(Unrestricted4),
  max_period_unit: CapPeriodSchema.default("session").meta(Unrestricted4),
  cooldown_after_dismiss_days: z6.number().int().min(0).default(7).meta(Unrestricted4),
  recommendation_strategy: z6.enum(["next_tier_up", "best_value", "custom"]).optional().default("next_tier_up").meta(Unrestricted4),
  recommendation_plan_override: z6.string().optional().meta(Unrestricted4)
}).meta(
  {
    id: "PlacementPayload",
    "x-revturbine-schema-persistence": Persisted3,
    "x-revturbine-schema-exposure": External4
  }
);
var PlacementVariantSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).extend({
  placement_payload_id: z6.string().min(1).meta(Unrestricted4),
  experiment_id: z6.string().min(1).meta(Unrestricted4),
  variant_name: z6.string().min(1).max(200).meta(Unrestricted4),
  is_control: z6.boolean().default(false).meta(Unrestricted4),
  traffic_allocation_percent: z6.number().min(0).max(100).meta(Unrestricted4),
  override_fields: z6.record(z6.string(), z6.unknown()).default({}).meta(Unrestricted4),
  status: z6.enum(["active", "paused", "complete"]).default("active").meta(Unrestricted4)
}).meta(
  {
    id: "PlacementVariant",
    "x-revturbine-schema-persistence": Persisted3,
    "x-revturbine-schema-exposure": Internal3
  }
);
var SurfaceSlotSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).extend({
  surface_slot_handle: z6.string().min(1).max(200).meta(Unrestricted4),
  surface_type: SurfaceTypeSchema.meta(Unrestricted4),
  surface_template_ids: z6.array(z6.string()).default([]).meta(Unrestricted4),
  surface_slot_category: z6.enum(["fixed", "gated", "triggered"]).default("fixed").meta(Unrestricted4),
  first_seen: z6.string().datetime().meta({ ...Unrestricted4, readOnly: true }),
  last_seen: z6.string().datetime().meta({ ...Unrestricted4, readOnly: true }),
  status: z6.enum(["active", "inactive", "new"]).default("new").meta(Unrestricted4),
  placement_count: z6.number().int().min(0).default(0).meta({ ...Unrestricted4, readOnly: true })
}).meta(
  {
    id: "SurfaceSlot",
    "x-revturbine-schema-persistence": Persisted3,
    "x-revturbine-schema-exposure": External4
  }
);
var PlacementWriteSchema = toWritableSchema(PlacementSchema);
var PayloadWriteSchema = toWritableSchema(PlacementPayloadSchema);
var placementPaths = {
  "/api/placements": {
    get: operation({
      operationId: "listPlacements",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List placements",
      tags: ["placements"],
      responses: { "200": { description: "Placement list", content: { "application/json": { schema: ListEnvelope(PlacementSchema) } } } },
      "x-revturbine-operation": { exposure: "external", resource: "placements", persistence: { table: "placements", mode: "list" } }
    }),
    post: operation({
      operationId: "createPlacement",
      summary: "Create placement",
      tags: ["placements"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(PlacementSchema) } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: PlacementSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "placements", persistence: { table: "placements", mode: "create" } }
    })
  },
  "/api/placements/{placementId}": {
    get: operation({
      operationId: "getPlacement",
      requestParams: { path: z6.object({ placementId: z6.string() }) },
      summary: "Get placement",
      tags: ["placements"],
      responses: { "200": { description: "Placement detail", content: { "application/json": { schema: PlacementSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "placements", persistence: { table: "placements", mode: "get" } }
    }),
    patch: operation({
      operationId: "updatePlacement",
      requestParams: { path: z6.object({ placementId: z6.string() }) },
      summary: "Update placement",
      tags: ["placements"],
      requestBody: { required: true, content: { "application/json": { schema: PlacementWriteSchema } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: PlacementSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "placements", persistence: { table: "placements", mode: "update" } }
    }),
    delete: operation({
      operationId: "deletePlacement",
      requestParams: { path: z6.object({ placementId: z6.string() }) },
      summary: "Delete placement",
      tags: ["placements"],
      responses: { "204": { description: "Deleted" }, default: { description: "Error", content: { "application/json": { schema: ErrorEnvelope } } } },
      "x-revturbine-operation": { exposure: "external", resource: "placements", persistence: { table: "placements", mode: "delete" } }
    })
  },
  "/api/placements/{placementId}/duplicate": {
    post: operation({
      operationId: "duplicatePlacement",
      requestParams: { path: z6.object({ placementId: z6.string() }) },
      summary: "Duplicate placement",
      tags: ["placements"],
      responses: { "201": { description: "Duplicated", content: { "application/json": { schema: PlacementSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "placements", persistence: { table: "placements", mode: "duplicate" } }
    })
  },
  "/api/placements/reorder": {
    post: operation({
      operationId: "reorderPlacements",
      summary: "Reorder placements within category",
      tags: ["placements"],
      requestBody: { required: true, content: { "application/json": { schema: z6.object({ category: PlacementCategorySchema, ids: z6.array(z6.string()) }) } } },
      responses: { "200": { description: "Reordered" } },
      "x-revturbine-operation": { exposure: "external", resource: "placements", persistence: { table: "placements", mode: "reorder" } }
    })
  },
  "/api/placements/{placementId}/payloads": {
    get: operation({
      operationId: "listPlacementPayloads",
      requestParams: { path: z6.object({ placementId: z6.string() }), query: ListQueryParamsSchema },
      summary: "List placement payloads",
      tags: ["placements"],
      responses: { "200": { description: "Payload list", content: { "application/json": { schema: ListEnvelope(PlacementPayloadSchema) } } } },
      "x-revturbine-operation": { exposure: "external", resource: "placement-payloads", persistence: { table: "placementPayloads", mode: "list" } }
    }),
    post: operation({
      operationId: "createPlacementPayload",
      requestParams: { path: z6.object({ placementId: z6.string() }) },
      summary: "Create placement payload",
      tags: ["placements"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(PlacementPayloadSchema) } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: PlacementPayloadSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "placement-payloads", persistence: { table: "placementPayloads", mode: "create" } }
    })
  },
  "/api/placement-payloads/{payloadId}": {
    patch: operation({
      operationId: "updatePlacementPayload",
      requestParams: { path: z6.object({ payloadId: z6.string() }) },
      summary: "Update placement payload",
      tags: ["placements"],
      requestBody: { required: true, content: { "application/json": { schema: PayloadWriteSchema } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: PlacementPayloadSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "placement-payloads", persistence: { table: "placementPayloads", mode: "update" } }
    }),
    delete: operation({
      operationId: "deletePlacementPayload",
      requestParams: { path: z6.object({ payloadId: z6.string() }) },
      summary: "Delete placement payload",
      tags: ["placements"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "external", resource: "placement-payloads", persistence: { table: "placementPayloads", mode: "delete" } }
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
import { z as z7 } from "zod";
var { Unrestricted: Unrestricted5, Pii } = DataClassification;
var { Persisted: Persisted4, Transient: Transient5 } = SchemaPersistence;
var { External: External5 } = SchemaExposure;
var UserTrialStatusSchema = z7.object({
  in_trial: z7.boolean().meta(Unrestricted5),
  trial_type: z7.string().optional().meta(Unrestricted5),
  plan_handle: z7.string().optional().meta(Unrestricted5),
  // 'converted' reflects a server-side analytic-event transition
  // (typically a Stripe webhook like `customer.subscription.created`
  // or `invoice.payment_succeeded` against a trialing subscription)
  // that the control plane processes to flip TrialInstance.status.
  // The SDK reads this state from the decision-API response — it does
  // NOT derive 'converted' client-side. trial_lifecycle.v1 rules
  // matching on 'trial_converted' fire while the user's status carries
  // this value, enabling conversion-celebration / receipt placements.
  state: z7.enum(["active", "running_out", "expired", "converted", "none"]).optional().meta(Unrestricted5),
  /**
   * Trial limit model — mirrors the rule's `trial_limit_type`. The
   * SDK uses this to decide which numeric fields below to surface;
   * the placement-resolver gates `trial_ending(days_before_end)`
   * only when `trial_limit_type === 'time'`.
   */
  trial_limit_type: z7.enum(["time", "usage"]).optional().meta(Unrestricted5),
  /**
   * Universal progress metric, 0..100. Computed by
   * `deriveLocalTrialStatusFromInstance` from elapsed days
   * (time-based) or consumed/limit (usage-based). Trial rule
   * modules + placement-resolver supersession consume this field
   * so they don't have to branch on the limit type.
   */
  progress_percent: z7.number().min(0).max(100).optional().meta(Unrestricted5),
  // Time-based numeric fields. Populated when trial_limit_type='time'.
  day_number: z7.number().int().min(0).optional().meta(Unrestricted5),
  days_remaining: z7.number().int().min(0).optional().meta(Unrestricted5),
  // Usage-based numeric fields. Populated when trial_limit_type='usage'.
  usage_entitlement_handle: z7.string().optional().meta(Unrestricted5),
  usage_consumed: z7.number().int().min(0).optional().meta(Unrestricted5),
  usage_remaining: z7.number().int().min(0).optional().meta(Unrestricted5),
  usage_limit: z7.number().int().min(0).optional().meta(Unrestricted5)
}).meta(
  { id: "UserTrialStatus", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External5 }
);
var UserUsageEntrySchema = z7.object({
  entitlement_handle: z7.string().min(1).meta(Unrestricted5),
  unit: z7.string().min(1).meta(Unrestricted5),
  amount: z7.number().min(0).meta(Unrestricted5),
  limit: z7.number().min(0).optional().meta(Unrestricted5),
  reset_date: z7.string().optional().meta(Unrestricted5)
}).meta(
  { id: "UserUsageEntry", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External5 }
);
var UserPlanContextSchema = z7.object({
  id: z7.string().min(1).meta(Unrestricted5),
  name: z7.string().min(1).meta(Unrestricted5),
  price: z7.string().optional().meta(Unrestricted5),
  billing_period: z7.enum(["monthly", "annual", "none"]).optional().meta(Unrestricted5)
}).meta(
  { id: "UserPlanContext", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External5 }
);
var UserInstanceContextSchema = z7.object({
  product_instance_id: z7.string().min(1).meta(Unrestricted5),
  user_id: z7.string().min(1).meta(Pii),
  plan: UserPlanContextSchema.optional().meta(Unrestricted5),
  /** Usage entries for this instance, keyed by entitlement handle. */
  usage: z7.record(z7.string(), UserUsageEntrySchema).default({}).meta(Unrestricted5),
  trial: UserTrialStatusSchema.optional().meta(Unrestricted5),
  /** Entitlements resolved at this instance level, keyed by handle. */
  entitlements: z7.record(z7.string(), z7.union([z7.boolean(), EntitlementGrantSchema])).default({}).meta(Unrestricted5)
}).meta(
  {
    id: "UserInstanceContext",
    "x-revturbine-schema-persistence": Persisted4,
    "x-revturbine-schema-exposure": External5
  }
);
var UserContextSchema = IdField.merge(TenantIdField).merge(TimestampFields).extend({
  user_id: z7.string().min(1).meta(Pii),
  account_id: z7.string().min(1).nullable().optional().meta(Pii),
  email: z7.string().email().nullable().optional().meta(Pii),
  /** Optional email classification (e.g. `business`, `personal`). */
  email_type: z7.string().optional().meta(Unrestricted5),
  plan: UserPlanContextSchema.optional().meta(Unrestricted5),
  /** Aggregate usage entries across all instances, keyed by handle. */
  usage: z7.record(z7.string(), UserUsageEntrySchema).default({}).meta(Unrestricted5),
  trial: UserTrialStatusSchema.optional().meta(Unrestricted5),
  /** Account-level entitlements, keyed by handle. */
  entitlements: z7.record(z7.string(), z7.union([z7.boolean(), EntitlementGrantSchema])).default({}).meta(Unrestricted5),
  /** Per-instance breakdowns when the account has multiple product instances. */
  instances: z7.array(UserInstanceContextSchema).optional().meta(Unrestricted5),
  /** Customer-defined fields: role, app-level permissions, display prefs. */
  custom: z7.record(z7.string(), z7.union([z7.string(), z7.number(), z7.boolean(), z7.null()])).default({}).meta(Pii),
  /**
   * Transient personalization token map.
   *
   * Holds SDK-derived tokens (plan_name, usage_current, etc.) merged with
   * app-provided tokens.  Not persisted to the backend — rebuilt on each
   * SDK session from context + exported config.
   */
  personalization: z7.record(z7.string(), z7.union([z7.string(), z7.number()])).default({}).meta({ ...Unrestricted5, "x-revturbine-schema-persistence": Transient5 }),
  // ── Derived-entitlement cache (plan 74 REQ-12/REQ-13) ──────────────
  // `entitlements` above is the rule-evaluated projection — a CACHE, not
  // source of truth. These stamps record what it was computed against so a
  // read can detect staleness: recompute when the active config version
  // moved on OR the context hash changed.
  /** Active config version (activated change-set id / compiled-bundle stamp) the cache was computed against. */
  derived_config_version: z7.string().nullable().optional().meta(Unrestricted5),
  /** Deterministic `computeUserContextHash` of the inputs the cache was computed from (REQ-13 ETag value). */
  context_hash: z7.string().nullable().optional().meta(Unrestricted5),
  /** When the cached entitlements were last (re)computed. */
  derived_computed_at: NullableDatetimeField.meta(Unrestricted5)
}).meta(
  { id: "UserContext", "x-revturbine-schema-persistence": Persisted4, "x-revturbine-schema-exposure": External5 }
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
      requestParams: { path: z7.object({ userContextId: z7.string() }) },
      summary: "Get user context",
      tags: ["users"],
      responses: { "200": { description: "User context", content: { "application/json": { schema: UserContextSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "user-contexts", persistence: { table: "userContexts", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateUserContext",
      requestParams: { path: z7.object({ userContextId: z7.string() }) },
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
      requestParams: { path: z7.object({ userContextId: z7.string() }) },
      summary: "Delete a user context",
      tags: ["users"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "user-contexts", persistence: { table: "userContexts", mode: "delete" } }
    })
  }
};

// ../revturbine-scaffold/src/customers/models/schema.ts
import { z as z8 } from "zod";
var { Unrestricted: Unrestricted6, Pii: Pii2 } = DataClassification;
var { Persisted: Persisted5, Transient: Transient6 } = SchemaPersistence;
var { Internal: Internal4 } = SchemaExposure;
var IdentitySchema = z8.object({
  external_id: z8.string().min(1).meta(Pii2),
  traits: z8.record(z8.string(), z8.unknown()).default({}).meta(Pii2),
  plan_id: z8.string().optional().meta(Unrestricted6)
}).meta(
  {
    id: "Identity",
    "x-revturbine-schema-persistence": Persisted5,
    "x-revturbine-schema-exposure": Internal4
  }
);
var CustomerSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  external_id: z8.string().min(1).meta(Pii2),
  identity: IdentitySchema.meta(Pii2),
  stripe_customer_id: z8.string().optional().meta(Unrestricted6),
  current_plan_id: z8.string().optional().meta(Unrestricted6),
  subscription_status: z8.enum(["active", "past_due", "canceled", "trialing", "unpaid", "none"]).default("none").meta(Unrestricted6),
  status: z8.enum(["active", "churned", "trial", "suspended"]).default("active").meta(Unrestricted6),
  metadata: MetadataField.meta(Unrestricted6)
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
    "x-revturbine-schema-persistence": Transient6,
    "x-revturbine-schema-exposure": Internal4
  }
);
var CustomerOverrideTypeSchema = z8.enum(["grant_plan", "grant_addon", "grant_entitlement"]).meta(
  { id: "CustomerOverrideType", "x-revturbine-schema-persistence": Transient6, "x-revturbine-schema-exposure": Internal4 }
);
var CustomerOverrideStatusSchema = z8.enum(["active", "expired", "revoked"]).meta(
  { id: "CustomerOverrideStatus", "x-revturbine-schema-persistence": Transient6, "x-revturbine-schema-exposure": Internal4 }
);
var CustomerOverrideSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).extend({
  customer_id: z8.string().min(1).meta(Pii2),
  customer_id_list: z8.array(z8.string()).optional().meta(Pii2),
  override_type: CustomerOverrideTypeSchema.meta(Unrestricted6),
  target_id: z8.string().min(1).meta(Unrestricted6),
  value: z8.record(z8.string(), z8.unknown()).default({}).meta(Unrestricted6),
  duration_type: CustomerOverrideDurationSchema.default("permanent").meta(Unrestricted6),
  duration_value: z8.string().optional().meta(Unrestricted6),
  expiry_date: NullableDatetimeField.meta(Unrestricted6),
  status: CustomerOverrideStatusSchema.default("active").meta(Unrestricted6),
  reason: z8.string().max(500).optional().meta(Unrestricted6),
  created_by: z8.string().optional().meta(Unrestricted6)
}).meta(
  {
    id: "CustomerOverride",
    "x-revturbine-schema-persistence": Persisted5,
    "x-revturbine-schema-exposure": Internal4
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

// ../revturbine-scaffold/src/segments/models/schema.ts
import { z as z9 } from "zod";
var { Unrestricted: Unrestricted7 } = DataClassification;
var { Persisted: Persisted6, Transient: Transient7 } = SchemaPersistence;
var { Internal: Internal5 } = SchemaExposure;
var DimensionCategorySchema = z9.enum(["default", "custom"]).meta(
  { id: "DimensionCategory", "x-revturbine-schema-persistence": Transient7, "x-revturbine-schema-exposure": Internal5 }
);
var DimensionSourceTypeSchema = z9.enum(["system", "sdk_trait", "sdk_trait_enum", "cdp_property", "manual_list"]).meta(
  { id: "DimensionSourceType", "x-revturbine-schema-persistence": Transient7, "x-revturbine-schema-exposure": Internal5 }
);
var SegmentDimensionSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).extend({
  name: NameField.meta(Unrestricted7),
  category: DimensionCategorySchema.default("custom").meta(Unrestricted7),
  visibility_toggle: z9.boolean().default(true).meta(Unrestricted7),
  source_type: DimensionSourceTypeSchema.default("system").meta(Unrestricted7),
  estimated_size: z9.number().int().min(0).optional().meta(Unrestricted7)
}).meta(
  {
    id: "SegmentDimension",
    "x-revturbine-schema-persistence": Persisted6,
    "x-revturbine-schema-exposure": Internal5
  }
);
var SegmentValueSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).extend({
  dimension_id: z9.string().min(1).meta(Unrestricted7),
  name: NameField.meta(Unrestricted7),
  handle: HandleField.meta(Unrestricted7),
  description: DescriptionField.meta(Unrestricted7),
  definition_rule: z9.record(z9.string(), z9.unknown()).optional().meta(Unrestricted7),
  used_in_count: z9.number().int().min(0).default(0).meta({ ...Unrestricted7, readOnly: true })
}).meta(
  {
    id: "SegmentValue",
    "x-revturbine-schema-persistence": Persisted6,
    "x-revturbine-schema-exposure": Internal5
  }
);
var SegmentSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).extend({
  name: NameField.meta(Unrestricted7),
  handle: HandleField.meta(Unrestricted7),
  description: DescriptionField.meta(Unrestricted7),
  rules: z9.record(z9.string(), z9.unknown()).default({}).meta(Unrestricted7),
  is_active: z9.boolean().default(true).meta(Unrestricted7),
  estimated_size: z9.number().int().min(0).nullable().default(null).meta(Unrestricted7),
  metadata: MetadataField.meta(Unrestricted7)
}).meta(
  {
    id: "Segment",
    "x-revturbine-schema-persistence": Persisted6,
    "x-revturbine-schema-exposure": Internal5
  }
);
var segmentPaths = {
  "/api/segments": {
    get: operation({
      operationId: "listSegmentDimensions",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List segment dimensions",
      tags: ["segments"],
      responses: { "200": { description: "Dimension list", content: { "application/json": { schema: ListEnvelope(SegmentDimensionSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "segments", persistence: { table: "segmentDimensions", mode: "list" } }
    })
  },
  "/api/segments/custom": {
    post: operation({
      operationId: "createCustomDimension",
      summary: "Create custom segment dimension",
      tags: ["segments"],
      requestBody: { required: true, content: { "application/json": { schema: z9.object({ name: z9.string(), description: z9.string().optional() }) } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: SegmentDimensionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "segments", persistence: { table: "segmentDimensions", mode: "create" } }
    })
  },
  "/api/segments/{dimensionId}": {
    delete: operation({
      operationId: "deleteCustomDimension",
      requestParams: { path: z9.object({ dimensionId: z9.string() }) },
      summary: "Delete custom dimension",
      tags: ["segments"],
      responses: { "204": { description: "Deleted" }, default: { description: "Error", content: { "application/json": { schema: ErrorEnvelope } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "segments", persistence: { table: "segmentDimensions", mode: "delete" } }
    })
  },
  "/api/segments/{dimensionId}/visibility": {
    patch: operation({
      operationId: "toggleDimensionVisibility",
      requestParams: { path: z9.object({ dimensionId: z9.string() }) },
      summary: "Toggle dimension visibility",
      tags: ["segments"],
      requestBody: { required: true, content: { "application/json": { schema: z9.object({ visible: z9.boolean() }) } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: SegmentDimensionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "segments", persistence: { table: "segmentDimensions", mode: "update" } }
    })
  },
  "/api/segments/{dimensionId}/values": {
    get: operation({
      operationId: "listSegmentValues",
      requestParams: { path: z9.object({ dimensionId: z9.string() }), query: ListQueryParamsSchema },
      summary: "List segment values for dimension",
      tags: ["segments"],
      responses: { "200": { description: "Value list", content: { "application/json": { schema: ListEnvelope(SegmentValueSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "segment-values", persistence: { table: "segmentValues", mode: "list" } }
    }),
    post: operation({
      operationId: "createSegmentValue",
      requestParams: { path: z9.object({ dimensionId: z9.string() }) },
      summary: "Create segment value",
      tags: ["segments"],
      requestBody: { required: true, content: { "application/json": { schema: z9.object({ name: z9.string(), handle: z9.string(), definition_rule: z9.record(z9.string(), z9.unknown()).optional() }) } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: SegmentValueSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "segment-values", persistence: { table: "segmentValues", mode: "create" } }
    })
  },
  "/api/segment-values/{valueId}": {
    patch: operation({
      operationId: "updateSegmentValue",
      requestParams: { path: z9.object({ valueId: z9.string() }) },
      summary: "Update segment value",
      tags: ["segments"],
      requestBody: { required: true, content: { "application/json": { schema: z9.object({ name: z9.string().optional(), definition_rule: z9.record(z9.string(), z9.unknown()).optional() }) } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: SegmentValueSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "segment-values", persistence: { table: "segmentValues", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteSegmentValue",
      requestParams: { path: z9.object({ valueId: z9.string() }) },
      summary: "Delete segment value",
      tags: ["segments"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "segment-values", persistence: { table: "segmentValues", mode: "delete" } }
    })
  }
};

// ../revturbine-scaffold/src/content/models/schema.ts
import { z as z10 } from "zod";
var { Unrestricted: Unrestricted8 } = DataClassification;
var { Persisted: Persisted7, Transient: Transient8 } = SchemaPersistence;
var { External: External6 } = SchemaExposure;
var MessageSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).extend({
  name: NameField.meta(Unrestricted8),
  channel: z10.enum(["in_app", "email", "push", "sms", "webhook"]).meta(Unrestricted8),
  subject: z10.string().max(500).optional().meta(Unrestricted8),
  body: z10.string().meta(Unrestricted8),
  template_variables: z10.array(z10.string()).default([]).meta(Unrestricted8),
  metadata: MetadataField.meta(Unrestricted8)
}).meta(
  { id: "Message", "x-revturbine-schema-persistence": Persisted7, "x-revturbine-schema-exposure": External6 }
);
var CtaPathSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).extend({
  name: NameField.meta(Unrestricted8),
  handle: HandleField.meta(Unrestricted8),
  action_type: CtaActionTypeSchema.meta(Unrestricted8),
  target_url: z10.string().optional().meta(Unrestricted8),
  target_plan_id: z10.string().optional().meta(Unrestricted8),
  config_fields: z10.record(z10.string(), z10.unknown()).default({}).meta(Unrestricted8),
  metadata: MetadataField.meta(Unrestricted8)
}).meta(
  { id: "CtaPath", "x-revturbine-schema-persistence": Persisted7, "x-revturbine-schema-exposure": External6 }
);
var TemplateFieldTypeSchema = z10.enum([
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
  { id: "TemplateFieldType", "x-revturbine-schema-persistence": Persisted7, "x-revturbine-schema-exposure": External6 }
);
var FieldDefinitionSchema = z10.object({
  name: z10.string().min(1),
  field_type: TemplateFieldTypeSchema,
  required: z10.boolean().default(false),
  default_value: z10.unknown().optional(),
  // Authoring-only metadata (plan 76 TASK-9). Drives the Content Studio
  // surface-template editor: `order` sets the explicit display sequence (the
  // implicit array order stays the fallback) and `help_text` is editor
  // guidance. Neither enters the runtime bundle — SurfaceTemplateField stays
  // {name, type, required}, mirroring how `default_value` is DB-only too.
  order: z10.number().int().min(0).optional(),
  help_text: z10.string().max(500).optional()
}).meta(
  { id: "FieldDefinition", "x-revturbine-schema-persistence": Persisted7, "x-revturbine-schema-exposure": External6 }
);
var SurfaceTemplateSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).extend({
  name: NameField.meta(Unrestricted8),
  handle: HandleField.meta(Unrestricted8),
  surface_type: StudioSurfaceTypeSchema.meta(Unrestricted8),
  field_definitions: z10.array(FieldDefinitionSchema).default([]).meta(Unrestricted8),
  description: DescriptionField.meta(Unrestricted8)
}).meta(
  { id: "SurfaceTemplate", "x-revturbine-schema-persistence": Persisted7, "x-revturbine-schema-exposure": External6 }
);
var MessageBlockRecordSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).extend({
  name: NameField.meta(Unrestricted8),
  handle: HandleField.meta(Unrestricted8),
  content_fields: z10.record(z10.string(), z10.unknown()).default({}).meta(Unrestricted8),
  variation_dimension_id: z10.string().optional().meta(Unrestricted8),
  variation_values: z10.array(z10.object({
    segment_value_id: z10.string(),
    content_fields_override: z10.record(z10.string(), z10.unknown())
  })).optional().meta(Unrestricted8),
  notes: z10.string().max(1e3).optional().meta(Unrestricted8),
  used_in_count: z10.number().int().min(0).default(0).meta({ ...Unrestricted8, readOnly: true })
}).meta(
  { id: "MessageBlockRecord", "x-revturbine-schema-persistence": Persisted7, "x-revturbine-schema-exposure": External6 }
);
var ContentPayloadSegmentEntrySchema = z10.object({
  segment_id: z10.string().min(1).meta(Unrestricted8),
  message_block_id: z10.string().min(1).meta(Unrestricted8),
  ui_path_id: z10.string().optional().meta(Unrestricted8),
  promotion_id: z10.string().optional().meta(Unrestricted8)
}).meta(
  { id: "ContentPayloadSegmentEntry", "x-revturbine-schema-persistence": Transient8, "x-revturbine-schema-exposure": External6 }
);
var ContentPlacementPayloadSchema = z10.object({
  payload_id: z10.string().min(1).meta(Unrestricted8),
  tenant_id: z10.string().min(1).meta(Unrestricted8),
  name: NameField.meta(Unrestricted8),
  surface_template_id: z10.string().min(1).meta(Unrestricted8),
  default_message_block_id: z10.string().min(1).meta(Unrestricted8),
  segment_content_map: z10.array(ContentPayloadSegmentEntrySchema).optional().meta(Unrestricted8),
  ui_path_id: z10.string().optional().meta(Unrestricted8),
  promotion_id: z10.string().optional().meta(Unrestricted8),
  status: z10.enum(["draft", "active", "inactive"]).meta(Unrestricted8),
  created_at: z10.string().datetime().optional().meta({ ...Unrestricted8, readOnly: true }),
  updated_at: z10.string().datetime().optional().meta({ ...Unrestricted8, readOnly: true })
}).meta(
  { id: "ContentPlacementPayload", "x-revturbine-schema-persistence": Transient8, "x-revturbine-schema-exposure": External6 }
);
var contentPaths = {
  "/api/surface-templates": {
    get: operation({
      operationId: "listSurfaceTemplates",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List surface templates",
      tags: ["content"],
      responses: { "200": { description: "Template list", content: { "application/json": { schema: ListEnvelope(SurfaceTemplateSchema) } } } },
      "x-revturbine-operation": { exposure: "external", resource: "surface-templates", persistence: { table: "surfaceTemplates", mode: "list" } }
    }),
    post: operation({
      operationId: "createSurfaceTemplate",
      summary: "Create surface template",
      tags: ["content"],
      requestBody: { required: true, content: { "application/json": { schema: SurfaceTemplateSchema } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: SurfaceTemplateSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "surface-templates", persistence: { table: "surfaceTemplates", mode: "create" } }
    })
  },
  "/api/messages": {
    get: operation({
      operationId: "listMessageBlocks",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List message blocks",
      tags: ["content"],
      responses: { "200": { description: "Message block list", content: { "application/json": { schema: ListEnvelope(MessageBlockRecordSchema) } } } },
      "x-revturbine-operation": { exposure: "external", resource: "message-blocks", persistence: { table: "messageBlocks", mode: "list" } }
    }),
    post: operation({
      operationId: "createMessageBlock",
      summary: "Create message block",
      tags: ["content"],
      requestBody: { required: true, content: { "application/json": { schema: MessageBlockRecordSchema } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: MessageBlockRecordSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "message-blocks", persistence: { table: "messageBlocks", mode: "create" } }
    })
  },
  "/api/cta-paths": {
    get: operation({
      operationId: "listCtaPaths",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List CTA paths",
      tags: ["content"],
      responses: { "200": { description: "CTA path list", content: { "application/json": { schema: ListEnvelope(CtaPathSchema) } } } },
      "x-revturbine-operation": { exposure: "external", resource: "cta-paths", persistence: { table: "ctaPaths", mode: "list" } }
    }),
    post: operation({
      operationId: "createCtaPath",
      summary: "Create custom CTA path",
      tags: ["content"],
      requestBody: { required: true, content: { "application/json": { schema: CtaPathSchema } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: CtaPathSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "cta-paths", persistence: { table: "ctaPaths", mode: "create" } }
    })
  }
};

// ../revturbine-scaffold/src/ui/models/schema.ts
import { z as z11 } from "zod";
var { Unrestricted: Unrestricted9, Pii: Pii3 } = DataClassification;
var { Persisted: Persisted8, Transient: Transient9 } = SchemaPersistence;
var { Internal: Internal6, External: External7 } = SchemaExposure;
var ThemeSchema = z11.object({
  id: z11.string().min(1).meta({ ...Unrestricted9, readOnly: true }),
  name: z11.string().min(1).max(120).meta(Unrestricted9),
  mode: z11.enum(["light", "dark", "system"]).default("system").meta(Unrestricted9),
  tokens: z11.record(z11.string(), z11.string()).default({}).meta(Unrestricted9)
}).meta(
  {
    id: "Theme",
    "x-revturbine-schema-persistence": Persisted8,
    "x-revturbine-schema-exposure": External7
  }
);
var UiPreferenceSchema = IdField.merge(TimestampFields).extend({
  user_id: z11.string().min(1).meta(Pii3),
  scope: z11.string().min(1).meta(Unrestricted9),
  preferences: z11.record(z11.string(), z11.unknown()).default({}).meta(Unrestricted9)
}).meta(
  {
    id: "UiPreference",
    "x-revturbine-schema-persistence": Persisted8,
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
        content: { "application/json": { schema: z11.array(toWritableSchema(UiPreferenceSchema)) } }
      },
      responses: {
        "200": {
          description: "UI preferences upsert response",
          content: { "application/json": { schema: z11.object({ updated: z11.number().int().min(0) }) } }
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
import { z as z12 } from "zod";
var { Unrestricted: Unrestricted10, Financial: Financial2 } = DataClassification;
var { Persisted: Persisted9, Transient: Transient10 } = SchemaPersistence;
var { External: External8, Internal: Internal7 } = SchemaExposure;
var CohortMonthSchema = z12.object({
  month: z12.string().meta(Unrestricted10),
  cohort_size: z12.number().int().min(0).meta(Unrestricted10),
  retained: z12.number().int().min(0).meta(Unrestricted10),
  retention_rate: z12.number().min(0).max(1).meta(Unrestricted10),
  revenue_cents: z12.number().int().min(0).meta(Financial2)
}).meta(
  { id: "CohortMonth", "x-revturbine-schema-persistence": Transient10, "x-revturbine-schema-exposure": External8 }
);
var FunnelStepSchema = z12.object({
  step: z12.string().meta(Unrestricted10),
  label: z12.string().meta(Unrestricted10),
  count: z12.number().int().min(0).meta(Unrestricted10),
  conversion_rate: z12.number().min(0).max(1).meta(Unrestricted10),
  drop_off_rate: z12.number().min(0).max(1).meta(Unrestricted10)
}).meta(
  { id: "FunnelStep", "x-revturbine-schema-persistence": Transient10, "x-revturbine-schema-exposure": External8 }
);
var PlacementPerformanceRowSchema = z12.object({
  placement_id: z12.string().meta(Unrestricted10),
  placement_name: z12.string().meta(Unrestricted10),
  impressions: z12.number().int().min(0).meta(Unrestricted10),
  clicks: z12.number().int().min(0).meta(Unrestricted10),
  conversions: z12.number().int().min(0).meta(Unrestricted10),
  ctr: z12.number().min(0).meta(Unrestricted10),
  conversion_rate: z12.number().min(0).meta(Unrestricted10),
  revenue_cents: z12.number().int().min(0).meta(Financial2)
}).meta(
  { id: "PlacementPerformanceRow", "x-revturbine-schema-persistence": Transient10, "x-revturbine-schema-exposure": External8 }
);
var RevenueMetricSchema = z12.object({
  date: z12.string().meta(Unrestricted10),
  mrr_cents: z12.number().int().min(0).meta(Financial2),
  arr_cents: z12.number().int().min(0).meta(Financial2),
  new_mrr_cents: z12.number().int().min(0).meta(Financial2),
  churned_mrr_cents: z12.number().int().min(0).meta(Financial2),
  expansion_mrr_cents: z12.number().int().min(0).meta(Financial2),
  net_new_mrr_cents: z12.number().int().meta(Financial2)
}).meta(
  { id: "RevenueMetric", "x-revturbine-schema-persistence": Transient10, "x-revturbine-schema-exposure": External8 }
);
var KpiAggregateSchema = z12.object({
  metric_key: z12.string().min(1).meta(Unrestricted10),
  label: z12.string().meta(Unrestricted10),
  current_value: z12.number().meta(Financial2),
  previous_value: z12.number().nullable().default(null).meta(Financial2),
  change_percent: z12.number().nullable().default(null).meta(Unrestricted10),
  period: z12.string().meta(Unrestricted10),
  unit: z12.enum(["count", "cents", "percent", "ratio", "seconds"]).default("count").meta(Unrestricted10)
}).meta(
  { id: "KpiAggregate", "x-revturbine-schema-persistence": Transient10, "x-revturbine-schema-exposure": External8 }
);
var DriftReportSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  report_type: z12.enum(["plan_drift", "entitlement_drift", "usage_anomaly", "revenue_anomaly"]).meta(Unrestricted10),
  severity: SeveritySchema.meta(Unrestricted10),
  resource_type: z12.string().min(1).meta(Unrestricted10),
  resource_id: z12.string().min(1).meta(Unrestricted10),
  summary: z12.string().max(1e3).meta(Unrestricted10),
  expected_value: z12.unknown().optional().meta(Unrestricted10),
  actual_value: z12.unknown().optional().meta(Unrestricted10),
  affected_customer_count: z12.number().int().min(0).default(0).meta(Unrestricted10),
  is_resolved: z12.boolean().default(false).meta(Unrestricted10),
  resolved_at: NullableDatetimeField.meta(Unrestricted10),
  metadata: MetadataField.meta(Unrestricted10)
}).meta(
  { id: "DriftReport", "x-revturbine-schema-persistence": Persisted9, "x-revturbine-schema-exposure": Internal7 }
);
var AlertSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  alert_type: z12.enum(["usage_threshold", "revenue_drop", "conversion_drop", "experiment_significance", "drift_detected", "custom"]).meta(Unrestricted10),
  severity: SeveritySchema.meta(Unrestricted10),
  title: z12.string().min(1).max(300).meta(Unrestricted10),
  description: z12.string().max(2e3).meta(Unrestricted10),
  resource_type: z12.string().optional().meta(Unrestricted10),
  resource_id: z12.string().optional().meta(Unrestricted10),
  is_acknowledged: z12.boolean().default(false).meta(Unrestricted10),
  acknowledged_at: NullableDatetimeField.meta(Unrestricted10),
  acknowledged_by: z12.string().nullable().default(null).meta(Unrestricted10),
  metadata: MetadataField.meta(Unrestricted10)
}).meta(
  { id: "Alert", "x-revturbine-schema-persistence": Persisted9, "x-revturbine-schema-exposure": Internal7 }
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
      requestParams: { path: z12.object({ reportId: z12.string() }) },
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
      requestParams: { path: z12.object({ alertId: z12.string() }) },
      summary: "Acknowledge an alert",
      tags: ["analytics"],
      responses: { "200": { description: "Acknowledged", content: { "application/json": { schema: AlertSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "analytics", persistence: { table: "alerts", mode: "update" } }
    })
  }
};

// ../revturbine-scaffold/src/events/models/schema.ts
import { z as z13 } from "zod";
var { Unrestricted: Unrestricted11, Pii: Pii4 } = DataClassification;
var { Persisted: Persisted10, Transient: Transient11 } = SchemaPersistence;
var { Internal: Internal8, External: External9 } = SchemaExposure;
var EventSourceSchema = z13.enum(["clickstream", "telemetry", "sdk", "workflow", "system"]).meta(
  {
    id: "EventSource",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var EventEnvelopeSchema = IdField.extend({
  event_type: z13.string().min(1).meta(Unrestricted11),
  source: EventSourceSchema.default("sdk").meta(Unrestricted11),
  tenant_id: z13.string().min(1).optional().meta(Unrestricted11),
  user_id: z13.string().min(1).optional().meta(Pii4),
  session_id: z13.string().min(1).optional().meta(Pii4),
  occurred_at: z13.string().datetime().meta(Unrestricted11),
  request_id: z13.string().min(1).meta(Unrestricted11),
  attributes: z13.record(z13.string(), z13.unknown()).default({}).meta(Unrestricted11),
  payload: z13.record(z13.string(), z13.unknown()).default({}).meta(Unrestricted11)
}).meta(
  {
    id: "EventEnvelope",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": Internal8
  }
);
var IngestedEventSchema = EventEnvelopeSchema.extend({
  ingested_at: z13.string().datetime().meta(Unrestricted11)
}).meta(
  {
    id: "IngestedEvent",
    "x-revturbine-schema-persistence": Persisted10,
    "x-revturbine-schema-exposure": Internal8
  }
);
var EventIngestBatchSchema = z13.array(
  z13.object({
    id: z13.string().min(1).optional().meta(Unrestricted11),
    event_type: z13.string().min(1).meta(Unrestricted11),
    occurred_at: z13.string().datetime().optional().meta(Unrestricted11),
    tenant_id: z13.string().min(1).optional().meta(Unrestricted11),
    user_id: z13.string().min(1).optional().meta(Pii4),
    session_id: z13.string().min(1).optional().meta(Pii4),
    attributes: z13.record(z13.string(), z13.unknown()).optional().meta(Unrestricted11),
    payload: z13.record(z13.string(), z13.unknown()).optional().meta(Unrestricted11),
    message: z13.string().optional().meta(Unrestricted11),
    level: z13.string().optional().meta(Unrestricted11),
    path: z13.string().optional().meta(Unrestricted11)
  })
).meta(
  {
    id: "EventIngestBatch",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": Internal8
  }
);
var TreatmentInteractionTypeSchema = z13.enum([
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
var TreatmentInteractionInputSchema = z13.object({
  user_id: z13.string().min(1).meta(Pii4),
  placement_id: z13.string().min(1).meta(Unrestricted11),
  treatment_id: z13.string().min(1).optional().meta(Unrestricted11),
  interaction_type: TreatmentInteractionTypeSchema.meta(Unrestricted11),
  interaction_at: z13.string().datetime().optional().meta(Unrestricted11),
  metadata: z13.record(z13.string(), z13.unknown()).optional().meta(Unrestricted11)
}).meta(
  {
    id: "TreatmentInteractionInput",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var TriggerEventTypeSchema = z13.enum([
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
var TrialTriggerPayloadSchema = z13.object({
  days_remaining: z13.number().int().min(0).optional().meta(Unrestricted11)
}).meta(
  {
    id: "TrialTriggerPayload",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var UsageTriggerPayloadSchema = z13.object({
  entitlement_handle: z13.string().optional().meta(Unrestricted11),
  current_usage: z13.number().min(0).optional().meta(Unrestricted11),
  usage_limit: z13.number().min(0).optional().meta(Unrestricted11),
  usage_percent: z13.number().min(0).max(100).optional().meta(Unrestricted11),
  threshold: z13.number().min(0).optional().meta(Unrestricted11),
  balance: z13.number().min(0).optional().meta(Unrestricted11),
  allocation: z13.number().min(0).optional().meta(Unrestricted11),
  seats_used: z13.number().int().min(0).optional().meta(Unrestricted11),
  seats_allowed: z13.number().int().min(0).optional().meta(Unrestricted11)
}).meta(
  {
    id: "UsageTriggerPayload",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var FeatureGateTriggerPayloadSchema = z13.object({
  feature: z13.string().min(1).meta(Unrestricted11)
}).meta(
  {
    id: "FeatureGateTriggerPayload",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var PaymentTriggerPayloadSchema = z13.object({
  retry_count: z13.number().int().min(0).optional().meta(Unrestricted11),
  renewal_date: z13.string().optional().meta(Unrestricted11)
}).meta(
  {
    id: "PaymentTriggerPayload",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var SemanticEventSchema = z13.object({
  event_type: z13.string().min(1).meta(Unrestricted11),
  payload: z13.record(z13.string(), z13.unknown()).default({}).meta(Unrestricted11)
}).meta(
  {
    id: "SemanticEvent",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var EventSearchParamsSchema = z13.object({
  q: z13.string().optional().meta(Unrestricted11),
  source: EventSourceSchema.optional().meta(Unrestricted11),
  event_type: z13.string().optional().meta(Unrestricted11),
  from: z13.string().datetime().optional().meta(Unrestricted11),
  to: z13.string().datetime().optional().meta(Unrestricted11),
  page: z13.coerce.number().int().min(1).default(1).meta(Unrestricted11),
  per_page: z13.coerce.number().int().min(1).max(100).default(25).meta(Unrestricted11)
}).meta(
  {
    id: "EventSearchParams",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": Internal8
  }
);
var WebhookEventSourceSchema = z13.enum(["stripe", "apple", "google"]).meta(
  {
    id: "WebhookEventSource",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": Internal8
  }
);
var WebhookEventStatusSchema = z13.enum(["processed", "failed", "skipped"]).meta(
  {
    id: "WebhookEventStatus",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": Internal8
  }
);
var WebhookEventLogSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  event_id: z13.string().min(1).meta(Unrestricted11),
  event_type: z13.string().min(1).meta(Unrestricted11),
  source: WebhookEventSourceSchema.meta(Unrestricted11),
  payload: z13.record(z13.string(), z13.unknown()).default({}).meta(Unrestricted11),
  status: WebhookEventStatusSchema.default("processed").meta(Unrestricted11),
  processed_at: z13.string().datetime().optional().meta(Unrestricted11),
  error_message: z13.string().optional().meta(Unrestricted11)
}).meta(
  {
    id: "WebhookEventLog",
    "x-revturbine-schema-persistence": Persisted10,
    "x-revturbine-schema-exposure": Internal8
  }
);
var EventIngestResponseSchema = z13.object({
  accepted: z13.number().int().min(0).meta(Unrestricted11)
}).meta(
  {
    id: "null",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": Internal8
  }
);
var MAX_TRACK_EVENTS_PER_BATCH = 500;
var TrackEventSchema = z13.object({
  environment_id: z13.string().min(1).meta(Unrestricted11),
  user_id: z13.string().min(1).meta(Pii4),
  account_id: z13.string().min(1).meta(Unrestricted11),
  event_name: z13.string().min(1).max(120).meta(Unrestricted11),
  event_ts: z13.string().datetime().meta(Unrestricted11),
  properties: z13.string().optional().meta(Unrestricted11),
  surface_slot_id: z13.string().nullable().optional().meta(Unrestricted11),
  placement_id: z13.string().nullable().optional().meta(Unrestricted11),
  payload_id: z13.string().nullable().optional().meta(Unrestricted11),
  request_id: z13.string().optional().meta(Unrestricted11),
  experiment_id: z13.string().nullable().optional().meta(Unrestricted11),
  variant_key: z13.string().nullable().optional().meta(Unrestricted11),
  tenant_id: z13.string().optional().meta(Unrestricted11)
}).meta(
  {
    id: "TrackEvent",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var TrackIngestBatchSchema = z13.object({
  events: z13.array(TrackEventSchema).min(1).max(MAX_TRACK_EVENTS_PER_BATCH).meta(Unrestricted11)
}).meta(
  {
    id: "TrackIngestBatch",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var MAX_SDK_META_EVENTS_PER_BATCH = 10;
var SdkMetaEventTypeSchema = z13.enum(["sdk_init", "sdk_error", "sdk_validation_warning"]).meta(
  {
    id: "SdkMetaEventType",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var SdkConfigShapeSchema = z13.object({
  plans: z13.number().int().min(0).meta(Unrestricted11),
  entitlements: z13.number().int().min(0).meta(Unrestricted11),
  entitlement_rules: z13.number().int().min(0).meta(Unrestricted11),
  segments: z13.number().int().min(0).meta(Unrestricted11),
  placements: z13.number().int().min(0).meta(Unrestricted11),
  placement_payloads: z13.number().int().min(0).meta(Unrestricted11),
  content_ui_paths: z13.number().int().min(0).meta(Unrestricted11),
  surface_templates: z13.number().int().min(0).meta(Unrestricted11)
}).meta(
  {
    id: "SdkConfigShape",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var SdkMetaEventSchema = z13.object({
  event_type: SdkMetaEventTypeSchema.meta(Unrestricted11),
  occurred_at: z13.string().datetime().meta(Unrestricted11),
  request_id: z13.string().min(1).optional().meta(Unrestricted11),
  // One-way, non-reversible hash of a non-secret config identifier (e.g.
  // truncated SHA-256 of config_hash / bundle id). Counts distinct
  // deployments without exposing the real id (REQ-7).
  config_hash_id: z13.string().min(1).max(64).optional().meta(Unrestricted11),
  sdk_version: z13.string().min(1).max(64).optional().meta(Unrestricted11),
  runtime_mode: z13.string().min(1).max(64).optional().meta(Unrestricted11),
  schema_version: z13.string().min(1).max(64).optional().meta(Unrestricted11),
  bundle_version: z13.string().min(1).max(64).optional().meta(Unrestricted11),
  // Present for sdk_init; config-shape counts only, no user context (REQ-6).
  config_shape: SdkConfigShapeSchema.optional().meta(Unrestricted11),
  // Short non-PII diagnostic for sdk_error / sdk_validation_warning.
  message: z13.string().max(500).optional().meta(Unrestricted11)
}).meta(
  {
    id: "SdkMetaEvent",
    "x-revturbine-schema-persistence": Transient11,
    "x-revturbine-schema-exposure": External9
  }
);
var SdkMetaIngestBatchSchema = z13.object({
  events: z13.array(SdkMetaEventSchema).min(1).max(MAX_SDK_META_EVENTS_PER_BATCH).meta(Unrestricted11)
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
import { z as z14 } from "zod";
var { Unrestricted: Unrestricted12 } = DataClassification;
var { Persisted: Persisted11, Transient: Transient12 } = SchemaPersistence;
var { Internal: Internal9 } = SchemaExposure;
var TrialStatusSchema = z14.enum(["not_started", "active", "expired", "converted", "cancelled"]).meta(
  { id: "TrialStatus", "x-revturbine-schema-persistence": Transient12, "x-revturbine-schema-exposure": Internal9 }
);
var TrialLimitTypeSchema = z14.enum(["time", "usage"]).meta(
  { id: "TrialLimitType", "x-revturbine-schema-persistence": Transient12, "x-revturbine-schema-exposure": Internal9 }
);
var FreeTrialRuleCoreFieldsSchema = z14.object({
  name: NameField.meta(Unrestricted12),
  handle: HandleField.meta(Unrestricted12),
  // plan_id null = "All plans" — see plans-entitlements-studio-ui.md §2.4.1.
  plan_id: z14.string().nullable().optional().meta(Unrestricted12),
  segment_id: z14.string().nullable().optional().meta(Unrestricted12),
  // Defaults to 'time' so every pre-existing rule keeps its current
  // duration-based semantics. Set to 'usage' to scope the trial by
  // consumption of `usage_entitlement_handle` up to
  // `usage_limit_value`; the time fields below are then ignored.
  trial_limit_type: TrialLimitTypeSchema.default("time").meta(Unrestricted12),
  // Time-based: rule is skipped at runtime when null/blank. The
  // Default Trial Length global was removed (no fallback exists).
  duration_days: z14.number().int().min(1).max(365).nullable().optional().meta(Unrestricted12),
  grace_period_days: z14.number().int().min(0).default(0).meta(Unrestricted12),
  // Usage-based: the entitlement whose consumption gates the trial,
  // and the cap. Both required when `trial_limit_type === 'usage'`;
  // otherwise ignored. Cross-field validation is done at the API
  // boundary (web app's POST handler) rather than here so partial
  // drafts stay round-trippable.
  usage_entitlement_handle: z14.string().min(1).optional().meta(Unrestricted12),
  usage_limit_value: z14.number().int().min(1).optional().meta(Unrestricted12),
  require_payment_method: z14.boolean().default(false).meta(Unrestricted12),
  auto_convert: z14.boolean().default(true).meta(Unrestricted12),
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
  convert_to_plan_id: z14.string().optional().meta(Unrestricted12),
  fallback_plan_id: z14.string().optional().meta(Unrestricted12),
  limit_per_customer: z14.number().int().min(1).default(1).meta(Unrestricted12),
  is_active: z14.boolean().default(true).meta(Unrestricted12),
  metadata: MetadataField.meta(Unrestricted12)
});
var FreeTrialRuleSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).merge(FreeTrialRuleCoreFieldsSchema).meta(
  { id: "FreeTrialRule", "x-revturbine-schema-persistence": Persisted11, "x-revturbine-schema-exposure": Internal9 }
);
var ReverseTrialStartPolicySchema = z14.enum(["signup", "first_premium_access", "manual"]).meta(
  { id: "ReverseTrialStartPolicy", "x-revturbine-schema-persistence": Transient12, "x-revturbine-schema-exposure": Internal9 }
);
var ReverseTrialRuleCoreFieldsSchema = z14.object({
  name: NameField.meta(Unrestricted12),
  handle: HandleField.meta(Unrestricted12),
  premium_plan_id: z14.string().min(1).meta(Unrestricted12),
  fallback_plan_id: z14.string().min(1).meta(Unrestricted12),
  segment_id: z14.string().nullable().optional().meta(Unrestricted12),
  trial_limit_type: TrialLimitTypeSchema.default("time").meta(Unrestricted12),
  duration_days: z14.number().int().min(1).max(365).nullable().optional().meta(Unrestricted12),
  usage_entitlement_handle: z14.string().min(1).optional().meta(Unrestricted12),
  usage_limit_value: z14.number().int().min(1).optional().meta(Unrestricted12),
  start_policy: ReverseTrialStartPolicySchema.default("signup").meta(Unrestricted12),
  show_upgrade_prompt_at_day: z14.number().int().min(0).optional().meta(Unrestricted12),
  entitlements_during_trial: z14.array(z14.string()).default([]).meta(Unrestricted12),
  is_active: z14.boolean().default(true).meta(Unrestricted12),
  metadata: MetadataField.meta(Unrestricted12)
});
var ReverseTrialRuleSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).merge(ReverseTrialRuleCoreFieldsSchema).meta(
  { id: "ReverseTrialRule", "x-revturbine-schema-persistence": Persisted11, "x-revturbine-schema-exposure": Internal9 }
);
var TrialLimitPolicySchema = z14.enum(["1_per_lifetime", "1_per_plan", "1_per_year", "unlimited"]).meta(
  { id: "TrialLimitPolicy", "x-revturbine-schema-persistence": Transient12, "x-revturbine-schema-exposure": Internal9 }
);
var TrialEligibilityScopeSchema = z14.enum(["per_customer", "per_email_domain"]).meta(
  { id: "TrialEligibilityScope", "x-revturbine-schema-persistence": Transient12, "x-revturbine-schema-exposure": Internal9 }
);
var FreeTrialSettingsSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  trial_limit_policy: TrialLimitPolicySchema.default("1_per_lifetime").meta(Unrestricted12),
  eligibility_scope: TrialEligibilityScopeSchema.default("per_customer").meta(Unrestricted12)
}).meta(
  { id: "FreeTrialSettings", "x-revturbine-schema-persistence": Persisted11, "x-revturbine-schema-exposure": Internal9 }
);
var ReverseTrialSettingsSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  trial_limit_policy: TrialLimitPolicySchema.default("1_per_lifetime").meta(Unrestricted12),
  eligibility_scope: TrialEligibilityScopeSchema.default("per_customer").meta(Unrestricted12)
}).meta(
  { id: "ReverseTrialSettings", "x-revturbine-schema-persistence": Persisted11, "x-revturbine-schema-exposure": Internal9 }
);
var TrialInstanceSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  customer_id: z14.string().min(1).meta(Unrestricted12),
  rule_id: z14.string().min(1).meta(Unrestricted12),
  rule_type: z14.enum(["free_trial", "reverse_trial"]).meta(Unrestricted12),
  plan_id: z14.string().min(1).meta(Unrestricted12),
  status: TrialStatusSchema.default("active").meta(Unrestricted12),
  started_at: z14.string().datetime().meta({ ...Unrestricted12, readOnly: true }),
  /**
   * Time-based expiry. Required for time-based trials; null for
   * pure usage-based trials (which expire when consumption crosses
   * `usage_limit_value` regardless of clock time).
   */
  expires_at: z14.string().datetime().nullable().optional().meta(Unrestricted12),
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
  usage_entitlement_handle: z14.string().min(1).optional().meta(Unrestricted12),
  /**
   * Snapshot of the rule's `usage_limit_value`. Persisted so
   * mid-trial limit changes on the rule don't shrink/expand a
   * user's in-flight trial.
   */
  usage_limit_value: z14.number().int().min(1).optional().meta(Unrestricted12),
  converted_at: NullableDatetimeField.meta(Unrestricted12),
  cancelled_at: NullableDatetimeField.meta(Unrestricted12),
  metadata: MetadataField.meta(Unrestricted12)
}).meta(
  { id: "TrialInstance", "x-revturbine-schema-persistence": Persisted11, "x-revturbine-schema-exposure": Internal9 }
);
var trialPaths = {
  "/api/trials/free-rules": {
    get: operation({
      operationId: "listFreeTrialRules",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List free trial rules",
      tags: ["trials"],
      responses: { "200": { description: "Free trial rule list", content: { "application/json": { schema: ListEnvelope(FreeTrialRuleSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-rules", persistence: { table: "freeTrialRules", mode: "list" } }
    }),
    post: operation({
      operationId: "createFreeTrialRule",
      summary: "Create free trial rule",
      tags: ["trials"],
      requestBody: { required: true, content: { "application/json": { schema: FreeTrialRuleSchema } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: FreeTrialRuleSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-rules", persistence: { table: "freeTrialRules", mode: "create" } }
    })
  },
  "/api/trials/free-rules/{ruleId}": {
    get: operation({
      operationId: "getFreeTrialRule",
      requestParams: { path: z14.object({ ruleId: z14.string() }) },
      summary: "Get free trial rule",
      tags: ["trials"],
      responses: { "200": { description: "Free trial rule", content: { "application/json": { schema: FreeTrialRuleSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-rules", persistence: { table: "freeTrialRules", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateFreeTrialRule",
      requestParams: { path: z14.object({ ruleId: z14.string() }) },
      summary: "Update free trial rule",
      tags: ["trials"],
      requestBody: { required: true, content: { "application/json": { schema: FreeTrialRuleSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: FreeTrialRuleSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-rules", persistence: { table: "freeTrialRules", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteFreeTrialRule",
      requestParams: { path: z14.object({ ruleId: z14.string() }) },
      summary: "Delete free trial rule",
      tags: ["trials"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-rules", persistence: { table: "freeTrialRules", mode: "delete" } }
    })
  },
  "/api/trials/reverse-rules": {
    get: operation({
      operationId: "listReverseTrialRules",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List reverse trial rules",
      tags: ["trials"],
      responses: { "200": { description: "Reverse trial rule list", content: { "application/json": { schema: ListEnvelope(ReverseTrialRuleSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "reverse-trial-rules", persistence: { table: "reverseTrialRules", mode: "list" } }
    }),
    post: operation({
      operationId: "createReverseTrialRule",
      summary: "Create reverse trial rule",
      tags: ["trials"],
      requestBody: { required: true, content: { "application/json": { schema: ReverseTrialRuleSchema } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: ReverseTrialRuleSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "reverse-trial-rules", persistence: { table: "reverseTrialRules", mode: "create" } }
    })
  },
  "/api/trials/reverse-rules/{ruleId}": {
    get: operation({
      operationId: "getReverseTrialRule",
      requestParams: { path: z14.object({ ruleId: z14.string() }) },
      summary: "Get reverse trial rule",
      tags: ["trials"],
      responses: { "200": { description: "Reverse trial rule", content: { "application/json": { schema: ReverseTrialRuleSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "reverse-trial-rules", persistence: { table: "reverseTrialRules", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateReverseTrialRule",
      requestParams: { path: z14.object({ ruleId: z14.string() }) },
      summary: "Update reverse trial rule",
      tags: ["trials"],
      requestBody: { required: true, content: { "application/json": { schema: ReverseTrialRuleSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: ReverseTrialRuleSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "reverse-trial-rules", persistence: { table: "reverseTrialRules", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteReverseTrialRule",
      requestParams: { path: z14.object({ ruleId: z14.string() }) },
      summary: "Delete reverse trial rule",
      tags: ["trials"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "reverse-trial-rules", persistence: { table: "reverseTrialRules", mode: "delete" } }
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
      requestParams: { path: z14.object({ settingsId: z14.string() }) },
      summary: "Get free trial settings",
      tags: ["trials"],
      responses: { "200": { description: "Free trial settings", content: { "application/json": { schema: FreeTrialSettingsSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "free-trial-settings", persistence: { table: "freeTrialSettings", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateFreeTrialSettings",
      requestParams: { path: z14.object({ settingsId: z14.string() }) },
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
      requestParams: { path: z14.object({ settingsId: z14.string() }) },
      summary: "Get reverse trial settings",
      tags: ["trials"],
      responses: { "200": { description: "Reverse trial settings", content: { "application/json": { schema: ReverseTrialSettingsSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "reverse-trial-settings", persistence: { table: "reverseTrialSettings", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateReverseTrialSettings",
      requestParams: { path: z14.object({ settingsId: z14.string() }) },
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
      requestParams: { path: z14.object({ instanceId: z14.string() }) },
      summary: "Get trial instance",
      tags: ["trials"],
      responses: { "200": { description: "Trial instance", content: { "application/json": { schema: TrialInstanceSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-instances", persistence: { table: "trialInstances", mode: "get" } }
    })
  },
  "/api/trials/instances/{instanceId}/cancel": {
    post: operation({
      operationId: "cancelTrialInstance",
      requestParams: { path: z14.object({ instanceId: z14.string() }) },
      summary: "Cancel an active trial",
      tags: ["trials"],
      responses: { "200": { description: "Cancelled", content: { "application/json": { schema: TrialInstanceSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-instances", persistence: { table: "trialInstances", mode: "update" } }
    })
  },
  "/api/trials/instances/{instanceId}/convert": {
    post: operation({
      operationId: "convertTrialInstance",
      requestParams: { path: z14.object({ instanceId: z14.string() }) },
      summary: "Convert trial to paid subscription",
      tags: ["trials"],
      requestBody: { required: true, content: { "application/json": { schema: z14.object({ plan_id: z14.string().optional() }) } } },
      responses: { "200": { description: "Converted", content: { "application/json": { schema: TrialInstanceSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-instances", persistence: { table: "trialInstances", mode: "update" } }
    })
  }
};

// ../revturbine-scaffold/src/experiments/models/schema.ts
import { z as z15 } from "zod";
var { Unrestricted: Unrestricted13 } = DataClassification;
var { Persisted: Persisted12, Transient: Transient13 } = SchemaPersistence;
var { Internal: Internal10 } = SchemaExposure;
var ExperimentStatusSchema = z15.enum(["draft", "ramping", "winning", "neutral", "needs_attention", "paused", "complete"]).meta(
  { id: "ExperimentStatus", "x-revturbine-schema-persistence": Transient13, "x-revturbine-schema-exposure": Internal10 }
);
var ExperimentTypeSchema = z15.enum(["placement_ab", "entitlement_ab", "plan_ab", "pricing_ab", "custom"]).meta(
  { id: "ExperimentType", "x-revturbine-schema-persistence": Transient13, "x-revturbine-schema-exposure": Internal10 }
);
var ExperimentVariantSchema = z15.object({
  variant_id: z15.string().min(1),
  name: NameField,
  weight: z15.number().min(0).max(1).default(0.5),
  is_control: z15.boolean().default(false),
  config: z15.record(z15.string(), z15.unknown()).default({})
}).meta(
  { id: "ExperimentVariant", "x-revturbine-schema-persistence": Persisted12, "x-revturbine-schema-exposure": Internal10 }
);
var ExperimentSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).extend({
  name: NameField.meta(Unrestricted13),
  handle: HandleField.meta(Unrestricted13),
  description: z15.string().max(1e3).optional().meta(Unrestricted13),
  experiment_type: ExperimentTypeSchema.meta(Unrestricted13),
  status: ExperimentStatusSchema.default("draft").meta(Unrestricted13),
  target_resource_id: z15.string().optional().meta(Unrestricted13),
  target_segment_ids: z15.array(z15.string()).default([]).meta(Unrestricted13),
  variants: z15.array(ExperimentVariantSchema).min(2).meta(Unrestricted13),
  primary_metric: z15.string().min(1).meta(Unrestricted13),
  // Lift below control that triggers the "Experiment trending negative"
  // Needs Attention rule (plan 02c). 0.05 = 5% relative lift below control.
  metric_threshold: z15.number().default(0.05).meta(Unrestricted13),
  secondary_metrics: z15.array(z15.string()).default([]).meta(Unrestricted13),
  traffic_allocation: z15.number().min(0).max(1).default(1).meta(Unrestricted13),
  started_at: NullableDatetimeField.meta(Unrestricted13),
  ended_at: NullableDatetimeField.meta(Unrestricted13),
  confidence_threshold: z15.number().min(0).max(1).default(0.95).meta(Unrestricted13),
  winning_variant_id: z15.string().nullable().default(null).meta(Unrestricted13),
  metadata: MetadataField.meta(Unrestricted13)
}).meta(
  { id: "Experiment", "x-revturbine-schema-persistence": Persisted12, "x-revturbine-schema-exposure": Internal10 }
);
var SuggestionSeveritySchema = SeveritySchema;
var OptimizationSuggestionSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  experiment_id: z15.string().optional().meta(Unrestricted13),
  resource_type: z15.string().min(1).meta(Unrestricted13),
  resource_id: z15.string().min(1).meta(Unrestricted13),
  severity: SuggestionSeveritySchema.default("info").meta(Unrestricted13),
  title: z15.string().min(1).max(300).meta(Unrestricted13),
  description: z15.string().max(2e3).meta(Unrestricted13),
  suggested_action: z15.string().max(1e3).optional().meta(Unrestricted13),
  estimated_impact: z15.number().optional().meta(Unrestricted13),
  is_dismissed: z15.boolean().default(false).meta(Unrestricted13),
  metadata: MetadataField.meta(Unrestricted13)
}).meta(
  { id: "OptimizationSuggestion", "x-revturbine-schema-persistence": Persisted12, "x-revturbine-schema-exposure": Internal10 }
);
var experimentPaths = {
  "/api/experiments": {
    get: operation({
      operationId: "listExperiments",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List experiments",
      tags: ["experiments"],
      responses: { "200": { description: "Experiment list", content: { "application/json": { schema: ListEnvelope(ExperimentSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiments", persistence: { table: "experiments", mode: "list" } }
    }),
    post: operation({
      operationId: "createExperiment",
      summary: "Create experiment",
      tags: ["experiments"],
      requestBody: { required: true, content: { "application/json": { schema: ExperimentSchema } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: ExperimentSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiments", persistence: { table: "experiments", mode: "create" } }
    })
  },
  "/api/experiments/{experimentId}": {
    get: operation({
      operationId: "getExperiment",
      requestParams: { path: z15.object({ experimentId: z15.string() }) },
      summary: "Get experiment",
      tags: ["experiments"],
      responses: { "200": { description: "Experiment", content: { "application/json": { schema: ExperimentSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiments", persistence: { table: "experiments", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateExperiment",
      requestParams: { path: z15.object({ experimentId: z15.string() }) },
      summary: "Update experiment",
      tags: ["experiments"],
      requestBody: { required: true, content: { "application/json": { schema: ExperimentSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: ExperimentSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiments", persistence: { table: "experiments", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteExperiment",
      requestParams: { path: z15.object({ experimentId: z15.string() }) },
      summary: "Delete experiment",
      tags: ["experiments"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiments", persistence: { table: "experiments", mode: "delete" } }
    })
  },
  "/api/experiments/{experimentId}/start": {
    post: operation({
      operationId: "startExperiment",
      requestParams: { path: z15.object({ experimentId: z15.string() }) },
      summary: "Start experiment (begin traffic allocation)",
      tags: ["experiments"],
      responses: { "200": { description: "Started", content: { "application/json": { schema: ExperimentSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiments", persistence: { table: "experiments", mode: "update" } }
    })
  },
  "/api/experiments/{experimentId}/pause": {
    post: operation({
      operationId: "pauseExperiment",
      requestParams: { path: z15.object({ experimentId: z15.string() }) },
      summary: "Pause running experiment",
      tags: ["experiments"],
      responses: { "200": { description: "Paused", content: { "application/json": { schema: ExperimentSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiments", persistence: { table: "experiments", mode: "update" } }
    })
  },
  "/api/experiments/{experimentId}/complete": {
    post: operation({
      operationId: "completeExperiment",
      requestParams: { path: z15.object({ experimentId: z15.string() }) },
      summary: "Complete experiment and declare winner",
      tags: ["experiments"],
      requestBody: { required: true, content: { "application/json": { schema: z15.object({ winning_variant_id: z15.string() }) } } },
      responses: { "200": { description: "Completed", content: { "application/json": { schema: ExperimentSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "experiments", persistence: { table: "experiments", mode: "update" } }
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
      requestParams: { path: z15.object({ suggestionId: z15.string() }) },
      summary: "Dismiss an optimization suggestion",
      tags: ["experiments"],
      responses: { "200": { description: "Dismissed", content: { "application/json": { schema: OptimizationSuggestionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "optimization-suggestions", persistence: { table: "optimizationSuggestions", mode: "update" } }
    })
  }
};

// ../revturbine-scaffold/src/promotions/models/schema.ts
import { z as z16 } from "zod";
var { Unrestricted: Unrestricted14, Financial: Financial3 } = DataClassification;
var { Persisted: Persisted13, Transient: Transient14 } = SchemaPersistence;
var { Internal: Internal11 } = SchemaExposure;
var PromotionStatusSchema = z16.enum(["draft", "scheduled", "live", "expired", "archived"]).meta(
  { id: "PromotionStatus", "x-revturbine-schema-persistence": Transient14, "x-revturbine-schema-exposure": Internal11 }
);
var DiscountTypeSchema = z16.enum(["percentage", "fixed_amount", "free_months"]).meta(
  { id: "DiscountType", "x-revturbine-schema-persistence": Transient14, "x-revturbine-schema-exposure": Internal11 }
);
var PromotionSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).extend({
  name: NameField.meta(Unrestricted14),
  handle: HandleField.meta(Unrestricted14),
  description: z16.string().max(1e3).optional().meta(Unrestricted14),
  rt_status: PromotionStatusSchema.default("draft").meta(Unrestricted14),
  discount_type: DiscountTypeSchema.meta(Unrestricted14),
  discount_value: z16.number().min(0).meta(Financial3),
  currency: z16.string().length(3).default("USD").meta(Financial3),
  applicable_plan_ids: z16.array(z16.string()).default([]).meta(Unrestricted14),
  applicable_addon_ids: z16.array(z16.string()).default([]).meta(Unrestricted14),
  target_segment_ids: z16.array(z16.string()).default([]).meta(Unrestricted14),
  max_redemptions: z16.number().int().min(0).nullable().default(null).meta(Unrestricted14),
  current_redemptions: z16.number().int().min(0).default(0).meta({ ...Unrestricted14, readOnly: true }),
  coupon_code: z16.string().max(100).optional().meta(Unrestricted14),
  starts_at: NullableDatetimeField.meta(Unrestricted14),
  ends_at: NullableDatetimeField.meta(Unrestricted14),
  // Stripe integration
  stripe_coupon_id: z16.string().nullable().default(null).meta(Unrestricted14),
  stripe_promotion_code_id: z16.string().nullable().default(null).meta(Unrestricted14),
  auto_sync_stripe: z16.boolean().default(false).meta(Unrestricted14),
  metadata: MetadataField.meta(Unrestricted14)
}).meta(
  { id: "Promotion", "x-revturbine-schema-persistence": Persisted13, "x-revturbine-schema-exposure": Internal11 }
);
var promotionPaths = {
  "/api/promotions": {
    get: operation({
      operationId: "listPromotions",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List promotions",
      tags: ["promotions"],
      responses: { "200": { description: "Promotion list", content: { "application/json": { schema: ListEnvelope(PromotionSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "promotions", persistence: { table: "promotions", mode: "list" } }
    }),
    post: operation({
      operationId: "createPromotion",
      summary: "Create promotion",
      tags: ["promotions"],
      requestBody: { required: true, content: { "application/json": { schema: PromotionSchema } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: PromotionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "promotions", persistence: { table: "promotions", mode: "create" } }
    })
  },
  "/api/promotions/{promotionId}": {
    get: operation({
      operationId: "getPromotion",
      requestParams: { path: z16.object({ promotionId: z16.string() }) },
      summary: "Get promotion",
      tags: ["promotions"],
      responses: { "200": { description: "Promotion", content: { "application/json": { schema: PromotionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "promotions", persistence: { table: "promotions", mode: "get" } }
    }),
    patch: operation({
      operationId: "updatePromotion",
      requestParams: { path: z16.object({ promotionId: z16.string() }) },
      summary: "Update promotion",
      tags: ["promotions"],
      requestBody: { required: true, content: { "application/json": { schema: PromotionSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: PromotionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "promotions", persistence: { table: "promotions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deletePromotion",
      requestParams: { path: z16.object({ promotionId: z16.string() }) },
      summary: "Delete (archive) promotion",
      tags: ["promotions"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "promotions", persistence: { table: "promotions", mode: "delete" } }
    })
  },
  "/api/promotions/{promotionId}/sync-stripe": {
    post: operation({
      operationId: "syncPromotionToStripe",
      requestParams: { path: z16.object({ promotionId: z16.string() }) },
      summary: "Sync promotion to Stripe as coupon/promotion code",
      tags: ["promotions"],
      responses: { "200": { description: "Synced", content: { "application/json": { schema: PromotionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "promotions", persistence: { table: "promotions", mode: "update" } }
    })
  },
  "/api/promotions/{promotionId}/duplicate": {
    post: operation({
      operationId: "duplicatePromotion",
      requestParams: { path: z16.object({ promotionId: z16.string() }) },
      summary: "Duplicate promotion",
      tags: ["promotions"],
      responses: { "201": { description: "Duplicated", content: { "application/json": { schema: PromotionSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "promotions", persistence: { table: "promotions", mode: "create" } }
    })
  }
};

// ../revturbine-scaffold/src/core/runtime-api/schema.ts
import { z as z17 } from "zod";
var { Unrestricted: Unrestricted15, Pii: Pii5 } = DataClassification;
var { Persisted: Persisted14, Transient: Transient15 } = SchemaPersistence;
var { Internal: Internal12, External: External10 } = SchemaExposure;
var PresentationRecordSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  customer_id: z17.string().min(1).meta(Pii5),
  placement_id: z17.string().min(1).meta(Unrestricted15),
  payload_id: z17.string().nullable().default(null).meta(Unrestricted15),
  variant_id: z17.string().nullable().default(null).meta(Unrestricted15),
  surface_type: z17.string().meta(Unrestricted15),
  presented_at: z17.string().datetime().meta({ ...Unrestricted15, readOnly: true }),
  dismissed_at: NullableDatetimeField.meta(Unrestricted15),
  cta_clicked_at: NullableDatetimeField.meta(Unrestricted15),
  cta_action_type: z17.string().nullable().default(null).meta(Unrestricted15),
  converted: z17.boolean().default(false).meta(Unrestricted15),
  session_id: z17.string().optional().meta(Unrestricted15),
  metadata: MetadataField.meta(Unrestricted15)
}).meta(
  { id: "PresentationRecord", "x-revturbine-schema-persistence": Persisted14, "x-revturbine-schema-exposure": Internal12 }
);
var DecisionLogSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  customer_id: z17.string().min(1).meta(Pii5),
  placement_id: z17.string().min(1).meta(Unrestricted15),
  decision: z17.enum(["show", "suppress", "defer"]).meta(Unrestricted15),
  reason: z17.string().max(500).meta(Unrestricted15),
  matched_rules: z17.array(z17.object({
    rule_id: z17.string(),
    rule_type: z17.string(),
    matched: z17.boolean()
  })).default([]).meta(Unrestricted15),
  experiment_id: z17.string().nullable().default(null).meta(Unrestricted15),
  variant_id: z17.string().nullable().default(null).meta(Unrestricted15),
  latency_ms: z17.number().min(0).optional().meta(Unrestricted15)
}).meta(
  { id: "DecisionLog", "x-revturbine-schema-persistence": Persisted14, "x-revturbine-schema-exposure": Internal12 }
);
var EntitlementEvalLogSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  customer_id: z17.string().min(1).meta(Pii5),
  entitlement_handle: z17.string().min(1).meta(Unrestricted15),
  entitlement_type: z17.string().meta(Unrestricted15),
  result: z17.enum(["granted", "denied", "limited", "metered"]).meta(Unrestricted15),
  current_usage: z17.number().nullable().default(null).meta(Unrestricted15),
  limit: z17.number().nullable().default(null).meta(Unrestricted15),
  source: z17.enum(["plan", "addon", "override", "trial"]).meta(Unrestricted15),
  source_id: z17.string().min(1).meta(Unrestricted15),
  latency_ms: z17.number().min(0).optional().meta(Unrestricted15)
}).meta(
  { id: "EntitlementEvalLog", "x-revturbine-schema-persistence": Persisted14, "x-revturbine-schema-exposure": Internal12 }
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
import { z as z18 } from "zod";
var { Unrestricted: Unrestricted16 } = DataClassification;
var { Persisted: Persisted15, Transient: Transient16 } = SchemaPersistence;
var { Internal: Internal13, External: External11 } = SchemaExposure;
var ApplicationSurfaceSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).extend({
  name: NameField.meta(Unrestricted16),
  handle: HandleField.meta(Unrestricted16),
  surface_type: StudioSurfaceTypeSchema.meta(Unrestricted16),
  description: DescriptionField.meta(Unrestricted16),
  is_active: z18.boolean().default(true).meta(Unrestricted16),
  ui_path: z18.string().optional().meta(Unrestricted16),
  metadata: MetadataField.meta(Unrestricted16)
}).meta(
  { id: "ApplicationSurface", "x-revturbine-schema-persistence": Persisted15, "x-revturbine-schema-exposure": Internal13 }
);
var SeatTypeSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).extend({
  name: NameField.meta(Unrestricted16),
  handle: HandleField.meta(Unrestricted16),
  description: DescriptionField.meta(Unrestricted16),
  is_default: z18.boolean().default(false).meta(Unrestricted16),
  entitlement_ids: z18.array(z18.string()).default([]).meta(Unrestricted16),
  metadata: MetadataField.meta(Unrestricted16)
}).meta(
  { id: "SeatType", "x-revturbine-schema-persistence": Persisted15, "x-revturbine-schema-exposure": Internal13 }
);
var OnboardingStateSchema = z18.enum(["not_started", "started", "details_submitted", "charges_enabled", "activated", "deauthorized"]).meta({ id: "OnboardingState", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": Internal13 });
var StripeIntegrationConfigSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).extend({
  stripe_account_id: z18.string().min(1).meta(Unrestricted16),
  live_mode: z18.boolean().default(false).meta(Unrestricted16),
  /** Funnel state for the Connect onboarding pipeline. */
  onboarding_state: OnboardingStateSchema.default("not_started").meta({ ...Unrestricted16, readOnly: true }),
  /** Connect onboarding status — tracks whether hosted onboarding is complete. */
  onboarding_complete: z18.boolean().default(false).meta({ ...Unrestricted16, readOnly: true }),
  /** Whether the connected account can process charges (read from Stripe). */
  charges_enabled: z18.boolean().default(false).meta({ ...Unrestricted16, readOnly: true }),
  /** Whether the connected account has details submitted (read from Stripe). */
  details_submitted: z18.boolean().default(false).meta({ ...Unrestricted16, readOnly: true }),
  /** Whether the connected account can receive payouts (read from Stripe). */
  payouts_enabled: z18.boolean().default(false).meta({ ...Unrestricted16, readOnly: true }),
  webhook_secret_set: z18.boolean().default(false).meta({ ...Unrestricted16, readOnly: true }),
  sync_products: z18.boolean().default(true).meta(Unrestricted16),
  sync_prices: z18.boolean().default(true).meta(Unrestricted16),
  sync_subscriptions: z18.boolean().default(true).meta(Unrestricted16),
  sync_invoices: z18.boolean().default(false).meta(Unrestricted16),
  default_currency: z18.string().length(3).default("USD").meta(Unrestricted16),
  tax_behavior: z18.enum(["inclusive", "exclusive", "unspecified"]).default("unspecified").meta(Unrestricted16),
  /** ISO timestamp of the last successful full data sync from Stripe. */
  last_sync_at: z18.string().optional().meta({ ...Unrestricted16, readOnly: true }),
  metadata: MetadataField.meta(Unrestricted16)
}).meta(
  { id: "StripeIntegrationConfig", "x-revturbine-schema-persistence": Persisted15, "x-revturbine-schema-exposure": Internal13 }
);
var MeteringConfigSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).extend({
  entitlement_id: z18.string().min(1).meta(Unrestricted16),
  meter_key: z18.string().min(1).max(100).meta(Unrestricted16),
  aggregation_type: z18.enum(["sum", "count", "max", "last_value"]).default("sum").meta(Unrestricted16),
  reset_period: z18.enum(["none", "daily", "weekly", "monthly", "yearly"]).default("monthly").meta(Unrestricted16),
  stripe_meter_id: z18.string().nullable().default(null).meta(Unrestricted16),
  is_active: z18.boolean().default(true).meta(Unrestricted16),
  metadata: MetadataField.meta(Unrestricted16)
}).meta(
  { id: "MeteringConfig", "x-revturbine-schema-persistence": Persisted15, "x-revturbine-schema-exposure": Internal13 }
);
var EnforcementActionSchema = z18.enum(["block", "warn", "downgrade", "throttle", "notify_admin", "custom"]).meta(
  { id: "EnforcementAction", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": Internal13 }
);
var UsageEnforcementSettingsSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).extend({
  entitlement_id: z18.string().min(1).meta(Unrestricted16),
  soft_limit_percent: z18.number().min(0).max(100).default(80).meta(Unrestricted16),
  hard_limit_percent: z18.number().min(0).max(100).default(100).meta(Unrestricted16),
  soft_limit_action: EnforcementActionSchema.default("warn").meta(Unrestricted16),
  hard_limit_action: EnforcementActionSchema.default("block").meta(Unrestricted16),
  grace_period_hours: z18.number().int().min(0).default(0).meta(Unrestricted16),
  notification_channels: z18.array(z18.enum(["email", "in_app", "webhook"])).default(["in_app"]).meta(Unrestricted16),
  is_active: z18.boolean().default(true).meta(Unrestricted16)
}).meta(
  { id: "UsageEnforcementSettings", "x-revturbine-schema-persistence": Persisted15, "x-revturbine-schema-exposure": Internal13 }
);
var PlacementSettingsCapRuleGroupItemSchema = z18.object({
  kind: z18.enum(["template", "slot"]).meta(Unrestricted16),
  id: z18.string().min(1).meta(Unrestricted16),
  label: z18.string().min(1).optional().meta(Unrestricted16)
}).meta(
  { id: "PlacementSettingsCapRuleGroupItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": Internal13 }
);
var PlacementSettingsCapRuleSchema = z18.object({
  id: z18.string().min(1).meta(Unrestricted16),
  group: z18.array(PlacementSettingsCapRuleGroupItemSchema).min(1).meta(Unrestricted16),
  cap: z18.object({
    count: z18.number().int().min(1).meta(Unrestricted16),
    period: z18.enum(["session", "day", "week", "month"]).meta(Unrestricted16)
  }).meta(Unrestricted16)
}).meta(
  { id: "PlacementSettingsCapRule", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": Internal13 }
);
var PlacementTestModeSchema = z18.enum(["off", "test_users", "all_traffic"]).meta(
  { id: "PlacementTestMode", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": Internal13 }
);
var PlacementSettingsCapStateSchema = z18.object({
  capRules: z18.array(PlacementSettingsCapRuleSchema).default([]).meta(Unrestricted16),
  sessionCooldownMinutes: z18.number().int().min(0).default(30).meta(Unrestricted16),
  testMode: PlacementTestModeSchema.default("off").meta(Unrestricted16)
}).meta(
  { id: "PlacementSettingsCapState", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": Internal13 }
);
var PlacementSettingsSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).extend({
  global_frequency_cap: PlacementSettingsCapStateSchema.nullable().default(null).meta(Unrestricted16),
  // Legacy companion column kept for migration continuity. The new
  // wrapper-object encoding above carries period information per
  // cap rule; this column is always null in v0.1.20+ writes.
  global_frequency_cap_period: z18.enum(["hour", "day", "week", "month", "session"]).nullable().default(null).meta(Unrestricted16),
  suppress_for_paid: z18.boolean().default(false).meta(Unrestricted16),
  suppress_for_trial: z18.boolean().default(false).meta(Unrestricted16),
  default_dismiss_cooldown_hours: z18.number().int().min(0).default(24).meta(Unrestricted16),
  allow_stacking: z18.boolean().default(false).meta(Unrestricted16),
  priority_collision_strategy: z18.enum(["highest_priority", "most_recent", "random"]).default("highest_priority").meta(Unrestricted16)
}).meta(
  { id: "PlacementSettings", "x-revturbine-schema-persistence": Persisted15, "x-revturbine-schema-exposure": Internal13 }
);
var ExportedConfigSegmentsItemPredicatesItemSchema = z18.object({
  field: z18.string().min(1).meta(Unrestricted16),
  operator: z18.enum(["eq", "neq", "gt", "lt", "gte", "lte", "contains", "in"]).meta(Unrestricted16),
  value: z18.string().meta(Unrestricted16)
}).meta(
  { id: "ExportedConfigSegmentsItemPredicatesItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var ExportedConfigSegmentsItemSchema = z18.object({
  id: z18.string().min(1).meta(Unrestricted16),
  name: z18.string().min(1).meta(Unrestricted16),
  handle: z18.string().min(1).meta(Unrestricted16),
  predicates: z18.array(ExportedConfigSegmentsItemPredicatesItemSchema).optional().meta(Unrestricted16),
  // Dimension this segment belongs to (plan #39 REQ-28 / Route A). Optional
  // for back-compat: pre-plan-39 ExportedConfigs and segments not yet
  // categorised lack it. The entitlement-rule evaluator uses this to
  // apply intra-dimension OR + cross-dimension AND per spec §2.5; when
  // missing across all of a rule's segment_ids, the evaluator falls
  // back to flat-OR (legacy single-segment behaviour).
  dimension_id: z18.string().optional().meta(Unrestricted16)
}).meta(
  { id: "ExportedConfigSegmentsItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var ExportedConfigPlansItemSchema = z18.object({
  id: z18.string().min(1).meta(Unrestricted16),
  unique_handle: z18.string().min(1).meta(Unrestricted16),
  name: z18.string().min(1).meta(Unrestricted16),
  tier_position: z18.number().int().min(0).default(0).meta(Unrestricted16),
  sort_order: z18.number().int().min(0).default(0).meta(Unrestricted16),
  // Plan-level visibility (to_do/91 Part B). Lives on the plan, not a
  // priced variation, so a free/custom tier with no variation can still be
  // marked unlisted/legacy and round-trip. Variations may still carry their
  // own visibility for per-price overrides; this is the plan's default.
  visibility: PlanVisibilitySchema.default("public").meta(Unrestricted16)
}).meta(
  { id: "ExportedConfigPlansItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var ExportedConfigAddonsItemSchema = z18.object({
  id: z18.string().min(1).meta(Unrestricted16),
  unique_handle: z18.string().min(1).meta(Unrestricted16),
  name: z18.string().min(1).meta(Unrestricted16),
  sort_order: z18.number().int().min(0).default(0).meta(Unrestricted16),
  // Add-on visibility (to_do/91 Part B) — same rationale as plans: metadata,
  // not price, so it lives in the config independent of addon_variations.
  visibility: PlanVisibilitySchema.default("public").meta(Unrestricted16)
}).meta(
  { id: "ExportedConfigAddonsItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var ExportedConfigEntitlementsItemSchema = z18.object({
  id: z18.string().min(1).meta(Unrestricted16),
  unique_handle: z18.string().min(1).meta(Unrestricted16),
  name: z18.string().min(1).meta(Unrestricted16),
  type: EntitlementTypeSchema.meta(Unrestricted16),
  unit: z18.string().optional().meta(Unrestricted16)
}).meta(
  { id: "ExportedConfigEntitlementsItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var ExportedConfigEntitlementRulesItemSchema = z18.object({
  id: z18.string().min(1).meta(Unrestricted16),
  entitlement_id: z18.string().min(1).meta(Unrestricted16),
  targets: z18.array(EntitlementRuleTargetSchema).min(1).meta(Unrestricted16),
  // Plan #39 REQ-1: multi-segment scoping per spec §2.5. Empty array
  // means "match all users" (replaces the singular `segment_id` field
  // and its 'all'/null sentinels).
  segment_ids: z18.array(z18.string()).default([]).meta(Unrestricted16),
  type_fields: z18.record(z18.string(), z18.unknown()).default({}).meta(Unrestricted16),
  current_usage: z18.number().default(0).meta(Unrestricted16),
  /** How usage is partitioned across the identity hierarchy. */
  allocation: UsageAllocationSchema.optional().meta(Unrestricted16)
}).meta(
  { id: "ExportedConfigEntitlementRulesItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var ExportedConfigSlotConfigsItemSchema = z18.object({
  slot_id: z18.string().min(1).meta(Unrestricted16),
  active: z18.boolean().meta(Unrestricted16),
  triggers: z18.array(z18.string()).meta(Unrestricted16)
}).meta(
  { id: "ExportedConfigSlotConfigsItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var ExportedConfigPlacementSlotsItemSchema = z18.object({
  id: z18.string().min(1).meta(Unrestricted16),
  label: z18.string().min(1).meta(Unrestricted16),
  description: z18.string().meta(Unrestricted16),
  surface_type: z18.string().meta(Unrestricted16),
  placement_handle: z18.string().min(1).meta(Unrestricted16),
  template: z18.string().optional().meta(Unrestricted16)
}).meta(
  { id: "ExportedConfigPlacementSlotsItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var ExportedConfigSurfaceTemplatesItemFieldsItemSchema = z18.object({
  name: z18.string().min(1).meta(Unrestricted16),
  type: z18.string().optional().meta(Unrestricted16),
  required: z18.boolean().optional().meta(Unrestricted16)
}).meta(
  { id: "ExportedConfigSurfaceTemplatesItemFieldsItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var ExportedConfigSurfaceTemplatesItemSchema = z18.object({
  id: z18.string().min(1).meta(Unrestricted16),
  surface_type: z18.string().meta(Unrestricted16),
  fields: z18.array(ExportedConfigSurfaceTemplatesItemFieldsItemSchema).optional().meta(Unrestricted16)
}).meta(
  { id: "ExportedConfigSurfaceTemplatesItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var ExportedConfigUiPathActionTypeSchema = z18.enum([
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
  { id: "ExportedConfigUiPathActionType", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var ContentUiPathSchema = z18.object({
  name: z18.string().min(1).meta(Unrestricted16),
  action_type: ExportedConfigUiPathActionTypeSchema.meta(Unrestricted16),
  plan_handle: z18.string().optional().meta(Unrestricted16),
  promotion_id: z18.string().optional().meta(Unrestricted16),
  placement_handle: z18.string().optional().meta(Unrestricted16),
  url: z18.string().optional().meta(Unrestricted16),
  tour_id: z18.string().optional().meta(Unrestricted16),
  target_billing_period: z18.enum(["monthly", "annual"]).optional().meta(Unrestricted16),
  description: z18.string().optional().meta(Unrestricted16)
}).meta(
  { id: "ContentUiPath", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var ContentPromotionSchema = z18.object({
  id: z18.string().meta(Unrestricted16),
  name: z18.string().meta(Unrestricted16),
  discount: z18.string().meta(Unrestricted16),
  type: z18.string().meta(Unrestricted16),
  status: z18.string().meta(Unrestricted16)
}).meta(
  { id: "ContentPromotion", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var PersonalizationTokenSchema = z18.object({
  token: z18.string().regex(/^[a-z][a-z0-9_]*$/).meta(Unrestricted16),
  label: z18.string().min(1).meta(Unrestricted16),
  description: z18.string().optional().meta(Unrestricted16),
  category: z18.enum(["user", "plan", "usage", "trial", "billing", "promotion", "custom"]).meta(Unrestricted16),
  data_source: z18.string().optional().meta(Unrestricted16),
  example_value: z18.string().optional().meta(Unrestricted16),
  value_map: z18.record(z18.string(), z18.string()).optional().meta(Unrestricted16),
  format: z18.enum(["string", "number", "currency", "percentage", "date"]).optional().meta(Unrestricted16)
}).meta(
  { id: "PersonalizationToken", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var MessageBlockContentSchema = z18.object({
  header: z18.string().optional().meta(Unrestricted16),
  body: z18.string().optional().meta(Unrestricted16),
  cta_label: z18.string().optional().meta(Unrestricted16),
  secondary_cta_label: z18.string().optional().meta(Unrestricted16)
}).catchall(z18.unknown()).meta(
  { id: "MessageBlockContent", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var MessageBlockSchema = z18.object({
  block_id: z18.string().min(1).meta(Unrestricted16),
  tenant_id: z18.string().min(1).meta(Unrestricted16),
  name: z18.string().min(1).meta(Unrestricted16),
  surface_template_id: z18.string().optional().meta(Unrestricted16),
  default_content: MessageBlockContentSchema.meta(Unrestricted16),
  segment_overrides: z18.array(z18.object({
    segment_value_id: z18.string(),
    content: MessageBlockContentSchema
  })).optional().meta(Unrestricted16),
  child_blocks: z18.array(z18.object({
    slot: z18.string(),
    block_id: z18.string()
  })).optional().meta(Unrestricted16),
  tokens_used: z18.array(z18.string()).optional().meta(Unrestricted16),
  status: z18.enum(["draft", "active", "archived"]).meta(Unrestricted16),
  created_at: z18.string().datetime().meta({ ...Unrestricted16, readOnly: true }),
  updated_at: z18.string().datetime().meta({ ...Unrestricted16, readOnly: true })
}).meta(
  { id: "MessageBlock", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var ExportedConfigStudioCtaConfigSchema = z18.object({
  label: z18.string().meta(Unrestricted16),
  path: CtaActionTypeSchema.meta(Unrestricted16),
  config: z18.record(z18.string(), z18.string()).optional().meta(Unrestricted16)
}).meta(
  { id: "ExportedConfigStudioCtaConfig", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var ExportedConfigStudioPayloadSurfaceSchema = z18.object({
  template_id: z18.string().min(1).meta(Unrestricted16),
  fields: z18.record(z18.string(), z18.string()).meta(Unrestricted16),
  ctas: z18.array(ExportedConfigStudioCtaConfigSchema).meta(Unrestricted16)
}).meta(
  { id: "ExportedConfigStudioPayloadSurface", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var ExportedConfigStudioPayloadTargetSchema = z18.object({
  plan_ids: z18.array(z18.string()).meta(Unrestricted16),
  // Billing-cadence dimension of the Plan Filter (spec §3.1.1 Target).
  // Empty/absent = no cadence filter. Optional so pre-plan-76 exports parse.
  billing_cadences: z18.array(z18.string()).optional().meta(Unrestricted16),
  segment_chips: z18.array(z18.string()).meta(Unrestricted16)
}).meta(
  { id: "ExportedConfigStudioPayloadTarget", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var ExportedConfigPeriodCapSchema = z18.object({
  count: z18.number().int().min(1).meta(Unrestricted16),
  period: z18.enum(["session", "day", "week", "month", "lifetime"]).meta(Unrestricted16)
}).meta(
  { id: "ExportedConfigPeriodCap", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var ExportedConfigStudioPayloadCapsSchema = z18.object({
  max_per_period: ExportedConfigPeriodCapSchema.optional().meta(Unrestricted16),
  cooldown_days: z18.number().int().min(0).optional().meta(Unrestricted16)
}).meta(
  { id: "ExportedConfigStudioPayloadCaps", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var ExportedConfigStudioPayloadSchema = z18.object({
  id: z18.string().min(1).meta(Unrestricted16),
  target: ExportedConfigStudioPayloadTargetSchema.meta(Unrestricted16),
  surfaces: z18.array(ExportedConfigStudioPayloadSurfaceSchema).meta(Unrestricted16),
  caps: ExportedConfigStudioPayloadCapsSchema.optional().meta(Unrestricted16),
  // Optional slot targeting (spec §3.1.1): empty/absent = any compatible slot.
  surface_slot_ids: z18.array(z18.string()).optional().meta(Unrestricted16),
  created_at: z18.string().optional().meta({ ...Unrestricted16, readOnly: true }),
  recommendation_strategy: z18.enum(["next_tier_up", "best_value", "custom"]).optional().default("next_tier_up").meta(Unrestricted16),
  recommendation_plan_override: z18.string().optional().meta(Unrestricted16)
}).meta(
  { id: "ExportedConfigStudioPayload", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var ExportedConfigPlacementTriggerSchema = z18.discriminatedUnion("type", [
  z18.object({ type: z18.literal("surface_render"), slot_id: z18.string().min(1) }),
  z18.object({ type: z18.literal("entitlement_gate"), entitlement_handle: z18.string().min(1), tier_threshold: z18.string().optional() }),
  z18.object({ type: z18.literal("usage_threshold"), entitlement_handle: z18.string().min(1), threshold_percent: z18.number().min(1).max(100) }),
  z18.object({ type: z18.literal("credit_threshold"), entitlement_handle: z18.string().min(1), threshold_percent: z18.number().min(1).max(100) }),
  z18.object({ type: z18.literal("seat_threshold"), entitlement_handle: z18.string().min(1), threshold_percent: z18.number().min(1).max(100) }),
  z18.object({ type: z18.literal("trial_started"), trial_type: z18.enum(["free", "reverse"]).optional() }),
  z18.object({ type: z18.literal("trial_progress"), progress_percent: z18.number().min(1).max(100) }),
  z18.object({ type: z18.literal("trial_ending"), days_before_end: z18.number().int().min(0) }),
  z18.object({ type: z18.literal("trial_ended") }),
  z18.object({ type: z18.literal("trial_converted") }),
  z18.object({ type: z18.literal("qualifier"), qualifier: z18.string().min(1) })
]).meta(
  { id: "ExportedConfigPlacementTrigger", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var ExportedConfigPlacementCategorySchema = z18.enum(["fixed", "gated", "usage_credit_seat", "trials", "other_conversion", "retention"]).meta(
  { id: "ExportedConfigPlacementCategory", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var ExportedConfigPlacementItemSchema = z18.object({
  id: z18.string().min(1).meta(Unrestricted16),
  name: z18.string().min(1).meta(Unrestricted16),
  category: ExportedConfigPlacementCategorySchema.meta(Unrestricted16),
  trigger: ExportedConfigPlacementTriggerSchema.meta(Unrestricted16),
  payloads: z18.array(ExportedConfigStudioPayloadSchema).meta(Unrestricted16),
  order: z18.number().int().min(0).meta(Unrestricted16)
}).meta(
  { id: "ExportedConfigPlacementItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var ExportedConfigPlacementPayloadItemSchema = z18.object({
  payload_id: z18.string().min(1).meta(Unrestricted16),
  placement_id: z18.string().min(1).meta(Unrestricted16),
  target: ExportedConfigStudioPayloadTargetSchema.meta(Unrestricted16),
  caps: ExportedConfigStudioPayloadCapsSchema.optional().meta(Unrestricted16),
  created_at: z18.string().meta({ ...Unrestricted16, readOnly: true }),
  updated_at: z18.string().datetime().optional().meta({ ...Unrestricted16, readOnly: true }),
  source_mode: z18.enum(["inline", "content_linked"]).meta(Unrestricted16),
  surfaces: z18.array(ExportedConfigStudioPayloadSurfaceSchema).optional().meta(Unrestricted16),
  // Optional slot targeting (spec §3.1.1): empty/absent = any compatible slot.
  surface_slot_ids: z18.array(z18.string()).optional().meta(Unrestricted16),
  content_link: z18.object({
    message_block_id: z18.string().optional(),
    ui_path_id: z18.string().optional(),
    promotion_id: z18.string().optional(),
    content_payload_id: z18.string().optional()
  }).optional().meta(Unrestricted16)
}).meta(
  { id: "ExportedConfigPlacementPayloadItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var ExportedConfigExtensionRulesItemSchema = z18.object({
  kind: z18.string().min(1).meta(Unrestricted16),
  schema_version: z18.number().int().nonnegative().meta(Unrestricted16),
  config: z18.unknown().meta(Unrestricted16)
}).meta(
  { id: "ExportedConfigExtensionRulesItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var ExportedConfigFreeTrialRuleItemSchema = IdField.merge(FreeTrialRuleCoreFieldsSchema).meta(
  { id: "ExportedConfigFreeTrialRuleItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var ExportedConfigReverseTrialRuleItemSchema = IdField.merge(ReverseTrialRuleCoreFieldsSchema).meta(
  { id: "ExportedConfigReverseTrialRuleItem", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
);
var ExportedConfigSchema = z18.object({
  version: z18.string().meta(Unrestricted16),
  exported_at: z18.string().datetime().optional().meta({ ...Unrestricted16, readOnly: true }),
  // The @revt-eng/schema package version this config was generated with.
  schema_version: z18.string().optional().meta({ ...Unrestricted16, readOnly: true }),
  // The compiled-bundle wire-format SCHEMA_VERSION (core/bundle/ir.ts).
  bundle_schema_version: z18.number().int().optional().meta({ ...Unrestricted16, readOnly: true }),
  // The change set this export represents: the active change set by default,
  // or a specific change set when one is requested. Null for an unscoped export.
  change_set_id: z18.string().nullable().default(null).meta({ ...Unrestricted16, readOnly: true }),
  plans: z18.array(ExportedConfigPlansItemSchema).meta(Unrestricted16),
  // Optional for back-compat: pre-plan-88 configs (and the live export until web
  // adopts the new @revt-eng/schema) omit it. Add-on definitions only; pricing
  // (addon_variations) stays in the Stripe layer, like plan_variations.
  addons: z18.array(ExportedConfigAddonsItemSchema).optional().meta(Unrestricted16),
  entitlements: z18.array(ExportedConfigEntitlementsItemSchema).meta(Unrestricted16),
  entitlement_rules: z18.array(ExportedConfigEntitlementRulesItemSchema).meta(Unrestricted16),
  segments: z18.array(ExportedConfigSegmentsItemSchema).meta(Unrestricted16),
  content_ui_paths: z18.array(ContentUiPathSchema).meta(Unrestricted16),
  slot_configs: z18.array(ExportedConfigSlotConfigsItemSchema).optional().meta(Unrestricted16),
  content_overrides: z18.record(z18.string(), z18.record(z18.string(), z18.string())).optional().meta(Unrestricted16),
  theme: z18.record(z18.string(), z18.unknown()).optional().meta(Unrestricted16),
  placement_slots: z18.array(ExportedConfigPlacementSlotsItemSchema).optional().meta(Unrestricted16),
  message_blocks: z18.array(MessageBlockSchema).optional().meta(Unrestricted16),
  placement_payloads: z18.array(ExportedConfigPlacementPayloadItemSchema).optional().meta(Unrestricted16),
  placements: z18.array(ExportedConfigPlacementItemSchema).optional().meta(Unrestricted16),
  content_promotions: z18.array(ContentPromotionSchema).optional().meta(Unrestricted16),
  personalization_tokens: z18.array(PersonalizationTokenSchema).optional().meta(Unrestricted16),
  surface_templates: z18.array(ExportedConfigSurfaceTemplatesItemSchema).optional().meta(Unrestricted16),
  /**
   * Free + reverse trial rule configurations (plan 43). Optional so
   * pre-trial-runtime configs continue to parse. /api/config/import
   * applies these to the tenant's free_trial_rules / reverse_trial_rules
   * tables; /api/config/export reads them out for round-trip.
   */
  free_trial_rules: z18.array(ExportedConfigFreeTrialRuleItemSchema).optional().meta(Unrestricted16),
  reverse_trial_rules: z18.array(ExportedConfigReverseTrialRuleItemSchema).optional().meta(Unrestricted16),
  /**
   * Tagged-opaque rule entries (Phase 3 / strategy 2). Each entry is
   * dispatched to the corresponding `RuleAuthoringModule.kind` at
   * compile time; unknown kinds are skipped silently so authoring can
   * stage new kinds before the runtime catches up.
   */
  extension_rules: z18.array(ExportedConfigExtensionRulesItemSchema).optional().meta(Unrestricted16)
}).meta(
  { id: "ExportedConfig", "x-revturbine-schema-persistence": Transient16, "x-revturbine-schema-exposure": External11 }
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
      requestParams: { path: z18.object({ id: z18.string() }) },
      summary: "Get application surface by ID",
      tags: ["config"],
      responses: { "200": { description: "Application surface detail", content: { "application/json": { schema: ApplicationSurfaceSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "application-surfaces", persistence: { table: "applicationSurfaces", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateApplicationSurface",
      requestParams: { path: z18.object({ id: z18.string() }) },
      summary: "Update application surface",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: ApplicationSurfaceSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: ApplicationSurfaceSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "application-surfaces", persistence: { table: "applicationSurfaces", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteApplicationSurface",
      requestParams: { path: z18.object({ id: z18.string() }) },
      summary: "Delete application surface",
      tags: ["config"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "application-surfaces", persistence: { table: "applicationSurfaces", mode: "delete" } }
    })
  },
  "/api/config/seat-types": {
    get: operation({
      operationId: "listSeatTypes",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List seat types",
      tags: ["config"],
      responses: { "200": { description: "Seat type list", content: { "application/json": { schema: ListEnvelope(SeatTypeSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "seat-types", persistence: { table: "seatTypes", mode: "list" } }
    }),
    post: operation({
      operationId: "createSeatType",
      summary: "Create seat type",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(SeatTypeSchema) } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: SeatTypeSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "seat-types", persistence: { table: "seatTypes", mode: "create" } }
    })
  },
  "/api/config/seat-types/{id}": {
    patch: operation({
      operationId: "updateSeatType",
      requestParams: { path: z18.object({ id: z18.string() }) },
      summary: "Update seat type",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: SeatTypeSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: SeatTypeSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "seat-types", persistence: { table: "seatTypes", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteSeatType",
      requestParams: { path: z18.object({ id: z18.string() }) },
      summary: "Delete seat type",
      tags: ["config"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "seat-types", persistence: { table: "seatTypes", mode: "delete" } }
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
      requestParams: { path: z18.object({ meteringId: z18.string() }) },
      summary: "Update metering configuration",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: MeteringConfigSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: MeteringConfigSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "metering-config", persistence: { table: "meteringConfigs", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteMeteringConfig",
      requestParams: { path: z18.object({ meteringId: z18.string() }) },
      summary: "Delete metering configuration",
      tags: ["config"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "metering-config", persistence: { table: "meteringConfigs", mode: "delete" } }
    })
  },
  "/api/config/usage-enforcement": {
    get: operation({
      operationId: "listUsageEnforcementSettings",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List usage enforcement settings",
      tags: ["config"],
      responses: { "200": { description: "Enforcement settings", content: { "application/json": { schema: ListEnvelope(UsageEnforcementSettingsSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "usage-enforcement", persistence: { table: "usageEnforcementSettings", mode: "list" } }
    }),
    post: operation({
      operationId: "createUsageEnforcementSettings",
      summary: "Create usage enforcement settings",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: toCreateSchema(UsageEnforcementSettingsSchema) } } },
      responses: { "201": { description: "Created", content: { "application/json": { schema: UsageEnforcementSettingsSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "usage-enforcement", persistence: { table: "usageEnforcementSettings", mode: "create" } }
    })
  },
  "/api/config/usage-enforcement/{settingsId}": {
    patch: operation({
      operationId: "updateUsageEnforcementSettings",
      requestParams: { path: z18.object({ settingsId: z18.string() }) },
      summary: "Update usage enforcement settings",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: UsageEnforcementSettingsSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: UsageEnforcementSettingsSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "usage-enforcement", persistence: { table: "usageEnforcementSettings", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteUsageEnforcementSettings",
      requestParams: { path: z18.object({ settingsId: z18.string() }) },
      summary: "Delete usage enforcement settings",
      tags: ["config"],
      responses: { "204": { description: "Deleted" } },
      "x-revturbine-operation": { exposure: "internal", resource: "usage-enforcement", persistence: { table: "usageEnforcementSettings", mode: "delete" } }
    })
  },
  "/api/config/placement-settings": {
    get: operation({
      operationId: "getPlacementSettings",
      summary: "Get global placement settings",
      tags: ["config"],
      responses: { "200": { description: "Placement settings", content: { "application/json": { schema: PlacementSettingsSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "placement-settings", persistence: { table: "placementSettings", mode: "get" } }
    }),
    put: operation({
      operationId: "upsertPlacementSettings",
      summary: "Create or update global placement settings",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: toWritableSchema(PlacementSettingsSchema) } } },
      responses: { "200": { description: "Saved", content: { "application/json": { schema: PlacementSettingsSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "placement-settings", persistence: { table: "placementSettings", mode: "upsert" } }
    })
  }
};

// ../revturbine-scaffold/src/changemgmt/models/changelog-schema.ts
import { z as z19 } from "zod";
var { Unrestricted: Unrestricted17 } = DataClassification;
var { Persisted: Persisted16 } = SchemaPersistence;
var { Internal: Internal14 } = SchemaExposure;
var ChangeLogActionSchema = z19.enum(["create", "update", "delete", "archive", "restore", "reorder", "duplicate", "sync", "publish"]).meta(
  { id: "ChangeLogAction", "x-revturbine-schema-persistence": Persisted16, "x-revturbine-schema-exposure": Internal14 }
);
var ChangeLogEntrySchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  action: ChangeLogActionSchema.meta(Unrestricted17),
  resource_type: z19.string().min(1).max(100).meta(Unrestricted17),
  resource_id: z19.string().min(1).meta(Unrestricted17),
  resource_name: z19.string().max(200).optional().meta(Unrestricted17),
  actor_id: z19.string().min(1).meta(Unrestricted17),
  actor_email: z19.string().email().optional().meta(Unrestricted17),
  diff: z19.object({
    before: z19.record(z19.string(), z19.unknown()).optional(),
    after: z19.record(z19.string(), z19.unknown()).optional()
  }).optional().meta(Unrestricted17),
  summary: z19.string().max(1e3).optional().meta(Unrestricted17),
  metadata: MetadataField.meta(Unrestricted17)
}).meta(
  { id: "ChangeLogEntry", "x-revturbine-schema-persistence": Persisted16, "x-revturbine-schema-exposure": Internal14 }
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
      requestParams: { path: z19.object({ entryId: z19.string() }) },
      summary: "Get change log entry by ID",
      tags: ["changelog"],
      responses: { "200": { description: "Change log entry", content: { "application/json": { schema: ChangeLogEntrySchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "changelog", persistence: { table: "changeLogEntries", mode: "get" } }
    })
  }
};

// ../revturbine-scaffold/src/core/tenant/schema.ts
import { z as z20 } from "zod";
var { Unrestricted: Unrestricted18 } = DataClassification;
var { Persisted: Persisted17, Transient: Transient17 } = SchemaPersistence;
var { Internal: Internal15 } = SchemaExposure;
var TenantStatusSchema = z20.enum(["active", "suspended", "archived"]).meta(
  { id: "TenantStatus", "x-revturbine-schema-persistence": Transient17, "x-revturbine-schema-exposure": Internal15 }
);
var TenantSchema = IdField.merge(TimestampFields).extend({
  name: NameField.meta(Unrestricted18),
  handle: HandleField.meta(Unrestricted18),
  status: TenantStatusSchema.default("active").meta(Unrestricted18),
  metadata: MetadataField.meta(Unrestricted18)
}).meta(
  { id: "Tenant", "x-revturbine-schema-persistence": Persisted17, "x-revturbine-schema-exposure": Internal15 }
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
      requestParams: { path: z20.object({ tenantId: z20.string() }) },
      summary: "Get tenant by ID",
      tags: ["tenants"],
      responses: { "200": { description: "Tenant", content: { "application/json": { schema: TenantSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "tenants", persistence: { table: "tenants", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateTenant",
      requestParams: { path: z20.object({ tenantId: z20.string() }) },
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
      requestParams: { path: z20.object({ tenantId: z20.string() }) },
      summary: "Suspend tenant (disables all API access)",
      tags: ["tenants"],
      responses: { "200": { description: "Suspended", content: { "application/json": { schema: TenantSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "tenants", persistence: { table: "tenants", mode: "update" } }
    })
  },
  "/api/tenants/{tenantId}/reactivate": {
    post: operation({
      operationId: "reactivateTenant",
      requestParams: { path: z20.object({ tenantId: z20.string() }) },
      summary: "Reactivate a suspended tenant",
      tags: ["tenants"],
      responses: { "200": { description: "Reactivated", content: { "application/json": { schema: TenantSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "tenants", persistence: { table: "tenants", mode: "update" } }
    })
  }
};

// ../revturbine-scaffold/src/core/environment/schema.ts
import { z as z21 } from "zod";
var { Unrestricted: Unrestricted19 } = DataClassification;
var { Persisted: Persisted18, Transient: Transient18 } = SchemaPersistence;
var { Internal: Internal16 } = SchemaExposure;
var EnvironmentStatusSchema = z21.enum(["active", "archived", "locked"]).meta(
  { id: "EnvironmentStatus", "x-revturbine-schema-persistence": Transient18, "x-revturbine-schema-exposure": Internal16 }
);
var EnvironmentSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  name: NameField.meta(Unrestricted19),
  handle: HandleField.meta(Unrestricted19),
  description: DescriptionField.meta(Unrestricted19),
  is_production: z21.boolean().default(false).meta({ ...Unrestricted19, readOnly: true }),
  status: EnvironmentStatusSchema.default("active").meta(Unrestricted19),
  // Branching lineage
  cloned_from_environment_id: z21.string().nullable().default(null).meta({ ...Unrestricted19, readOnly: true }),
  cloned_at: NullableDatetimeField.meta({ ...Unrestricted19, readOnly: true }),
  cloned_at_sequence: z21.number().int().min(0).nullable().default(null).meta({ ...Unrestricted19, readOnly: true }),
  // Protection settings (analogous to protected branches)
  requires_approval: z21.boolean().default(false).meta(Unrestricted19),
  auto_deploy_on_approval: z21.boolean().default(false).meta(Unrestricted19),
  // Audit
  created_by: z21.string().optional().meta(Unrestricted19),
  metadata: MetadataField.meta(Unrestricted19)
}).meta(
  { id: "Environment", "x-revturbine-schema-persistence": Persisted18, "x-revturbine-schema-exposure": Internal16 }
);
var EnvironmentPromotionRequestSchema = z21.object({
  source_environment_id: z21.string().min(1),
  target_environment_id: z21.string().min(1),
  change_set_ids: z21.array(z21.string()).optional(),
  strategy: z21.enum(["all_current", "selected_changesets"]).default("all_current")
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
      requestBody: { required: true, content: { "application/json": { schema: z21.object({
        name: z21.string().min(1).max(200),
        handle: z21.string().min(1).max(100),
        description: z21.string().max(500).optional(),
        clone_from_environment_id: z21.string().optional(),
        requires_approval: z21.boolean().optional()
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
      requestParams: { path: z21.object({ environmentId: z21.string() }) },
      summary: "Get environment by ID",
      tags: ["environments"],
      responses: { "200": { description: "Environment", content: { "application/json": { schema: EnvironmentSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "environments", persistence: { table: "environments", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateEnvironment",
      requestParams: { path: z21.object({ environmentId: z21.string() }) },
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
      requestParams: { path: z21.object({ environmentId: z21.string() }) },
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
        "200": { description: "Promotion result", content: { "application/json": { schema: z21.object({
          promoted_count: z21.number().int(),
          conflict_count: z21.number().int(),
          conflicts: z21.array(z21.object({
            canonical_id: z21.string(),
            resource_type: z21.string(),
            source_sequence: z21.number().int(),
            target_sequence: z21.number().int()
          }))
        }) } } },
        default: { description: "Error", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "environments", persistence: { table: "environments", mode: "promote" } }
    })
  }
};

// ../revturbine-scaffold/src/decisions/models/schema.ts
import { z as z22 } from "zod";
var { Unrestricted: Unrestricted20, Pii: Pii6 } = DataClassification;
var { Transient: Transient19, Persisted: Persisted19 } = SchemaPersistence;
var { External: External12 } = SchemaExposure;
var SupersessionReasonSchema = z22.enum(["milestone_version", "milestone_order"]).meta({ id: "SupersessionReason", "x-revturbine-schema-persistence": Transient19, "x-revturbine-schema-exposure": External12 });
var SupersessionRecordSchema = z22.object({
  superseded_output_id: z22.string().min(1).meta(Unrestricted20),
  superseded_by: z22.string().min(1).meta(Unrestricted20),
  reason: SupersessionReasonSchema.meta(Unrestricted20)
}).meta({
  id: "SupersessionRecord",
  "x-revturbine-schema-persistence": Persisted19,
  "x-revturbine-schema-exposure": External12,
  "x-revturbine-data-classification": "operational"
});
var EntitlementStatusSchema = z22.enum(["allowed", "limited", "denied"]).meta({ id: "EntitlementStatus", "x-revturbine-schema-persistence": Transient19, "x-revturbine-schema-exposure": External12 });
var PlacementDecisionOutputSchema = z22.object({
  output_id: z22.string().meta(Unrestricted20),
  category: z22.string().meta(Unrestricted20),
  surface: z22.object({
    template: z22.string().optional().meta(Unrestricted20),
    type: SurfaceTypeSchema.meta(Unrestricted20),
    slot_id: z22.string().optional().meta(Unrestricted20)
  }).meta(Unrestricted20),
  content: z22.record(z22.string(), z22.unknown()).meta(Unrestricted20),
  promotion: z22.record(z22.string(), z22.unknown()).optional().meta(Unrestricted20),
  cta_path: z22.record(z22.string(), z22.unknown()).optional().meta(Unrestricted20),
  /** @deprecated Use cta_path. Kept for compatibility with older SDK consumers. */
  ui_path: z22.record(z22.string(), z22.unknown()).optional().meta(Unrestricted20),
  rule_id: z22.string().meta(Unrestricted20),
  decision_id: z22.string().meta(Unrestricted20),
  config_version: z22.string().meta(Unrestricted20),
  present_upsell: z22.boolean().meta(Unrestricted20)
}).meta({ id: "PlacementDecisionOutput", "x-revturbine-schema-persistence": Transient19, "x-revturbine-schema-exposure": External12 });
var EntitlementCheckResultSchema = z22.object({
  status: EntitlementStatusSchema.meta(Unrestricted20),
  allowed: z22.boolean().meta(Unrestricted20),
  reason: z22.string().optional().meta(Unrestricted20),
  current_tier: z22.string().optional().meta(Unrestricted20),
  /** Upsell placement to render when entitlement is denied. */
  placement: PlacementDecisionOutputSchema.optional().meta(Unrestricted20)
}).meta({ id: "EntitlementCheckResult", "x-revturbine-schema-persistence": Transient19, "x-revturbine-schema-exposure": External12 });
var RuntimePromotionSnapshotSchema = z22.object({
  id: z22.string().meta(Unrestricted20),
  name: z22.string().optional().meta(Unrestricted20),
  discount: z22.string().optional().meta(Unrestricted20),
  type: z22.string().optional().meta(Unrestricted20),
  status: z22.string().optional().meta(Unrestricted20)
}).meta({ id: "RuntimePromotionSnapshot", "x-revturbine-schema-persistence": Transient19, "x-revturbine-schema-exposure": External12 });
var ServerEvaluationPayloadUserSchema = z22.object({
  id: z22.string().meta(Pii6),
  anonymous_id: z22.string().optional().meta(Unrestricted20),
  traits: z22.record(z22.string(), z22.unknown()).optional().meta(Pii6)
}).meta({ id: "ServerEvaluationPayloadUser", "x-revturbine-schema-persistence": Transient19, "x-revturbine-schema-exposure": External12 });
var ServerEvaluationPayloadDecisionsItemSchema = z22.object({
  slot_id: z22.string().optional().meta(Unrestricted20),
  entitlement_handle: z22.string().optional().meta(Unrestricted20),
  plan_handle: z22.string().optional().meta(Unrestricted20),
  placement_handle: z22.string().optional().meta(Unrestricted20),
  visible: z22.boolean().meta(Unrestricted20),
  output: PlacementDecisionOutputSchema.optional().meta(Unrestricted20),
  reason_codes: z22.array(z22.string()).optional().meta(Unrestricted20)
}).meta({ id: "ServerEvaluationPayloadDecisionsItem", "x-revturbine-schema-persistence": Transient19, "x-revturbine-schema-exposure": External12 });
var ServerEvaluationPayloadEntitlementsValueSchema = EntitlementCheckResultSchema;
var ServerEvaluationPayloadTrialStatusSchema = UserTrialStatusSchema.meta({ id: "ServerEvaluationPayloadTrialStatus", "x-revturbine-schema-persistence": Transient19, "x-revturbine-schema-exposure": External12 });
var ServerEvaluationPayloadUserContextSchema = z22.object({
  segments: z22.array(z22.string()).optional().meta(Unrestricted20),
  traits: z22.record(z22.string(), z22.unknown()).optional().meta(Pii6),
  usage_balances: z22.record(z22.string(), z22.number()).optional().meta(Unrestricted20)
}).meta({ id: "ServerEvaluationPayloadUserContext", "x-revturbine-schema-persistence": Transient19, "x-revturbine-schema-exposure": External12 });
var ServerEvaluationPayloadSchema = z22.object({
  version: z22.literal("1.0.0").meta(Unrestricted20),
  request_id: z22.string().meta(Unrestricted20),
  tenant_id: z22.string().meta(Unrestricted20),
  evaluated_at: z22.string().datetime().meta(Unrestricted20),
  ttl_seconds: z22.number().int().min(0).max(86400).meta(Unrestricted20),
  user: ServerEvaluationPayloadUserSchema.meta(Pii6),
  decisions: z22.array(ServerEvaluationPayloadDecisionsItemSchema).meta(Unrestricted20),
  entitlements: z22.record(z22.string(), ServerEvaluationPayloadEntitlementsValueSchema).optional().meta(Unrestricted20),
  theme: z22.record(z22.string(), z22.unknown()).optional().meta(Unrestricted20),
  trial_status: ServerEvaluationPayloadTrialStatusSchema.optional().meta(Unrestricted20),
  user_context: ServerEvaluationPayloadUserContextSchema.optional().meta(Pii6)
}).meta({ id: "ServerEvaluationPayload", "x-revturbine-schema-persistence": Transient19, "x-revturbine-schema-exposure": External12 });

// ../revturbine-scaffold/src/changemgmt/models/changesets-schema.ts
import { z as z23 } from "zod";
var { Unrestricted: Unrestricted21 } = DataClassification;
var { Persisted: Persisted20, Transient: Transient20 } = SchemaPersistence;
var { Internal: Internal17 } = SchemaExposure;
var ChangeSetStatusSchema = z23.enum([
  "draft",
  "awaiting_approval",
  "approved",
  "deploying",
  "deployed",
  "rejected",
  "archived"
]).meta(
  { id: "ChangeSetStatus", "x-revturbine-schema-persistence": Transient20, "x-revturbine-schema-exposure": Internal17 }
);
var ChangeSetSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  environment_id: z23.string().min(1).meta(Unrestricted21),
  name: NameField.meta(Unrestricted21),
  description: z23.string().max(2e3).optional().meta(Unrestricted21),
  status: ChangeSetStatusSchema.default("draft").meta(Unrestricted21),
  labels: z23.array(z23.string()).default([]).meta(Unrestricted21),
  // People
  created_by: z23.string().min(1).meta(Unrestricted21),
  submitted_by: z23.string().nullable().default(null).meta({ ...Unrestricted21, readOnly: true }),
  reviewed_by: z23.string().nullable().default(null).meta({ ...Unrestricted21, readOnly: true }),
  deployed_by: z23.string().nullable().default(null).meta({ ...Unrestricted21, readOnly: true }),
  // Dates
  submitted_at: NullableDatetimeField.meta({ ...Unrestricted21, readOnly: true }),
  reviewed_at: NullableDatetimeField.meta({ ...Unrestricted21, readOnly: true }),
  deployed_at: NullableDatetimeField.meta({ ...Unrestricted21, readOnly: true }),
  // Snapshot (analogous to HEAD at branch creation)
  base_snapshot_sequence: z23.number().int().min(0).default(0).meta({ ...Unrestricted21, readOnly: true }),
  // Computed counts
  entry_count: z23.number().int().min(0).default(0).meta({ ...Unrestricted21, readOnly: true }),
  conflict_count: z23.number().int().min(0).default(0).meta({ ...Unrestricted21, readOnly: true }),
  // Lineage
  rollback_of_change_set_id: z23.string().nullable().default(null).meta(Unrestricted21),
  cherry_picked_from_change_set_id: z23.string().nullable().default(null).meta(Unrestricted21),
  // Review
  review_notes: z23.string().max(2e3).optional().meta(Unrestricted21),
  rejection_reason: z23.string().max(2e3).optional().meta(Unrestricted21),
  // Immutable frozen artifacts, written once when the change set is activated
  // (plan 70): `snapshot` is the fully-rendered ExportedConfig JSON; `bundle`
  // is the compiled FlatBuffer bundle, base64-encoded (the Zod→drizzle
  // generator has no bytea type). readOnly — only the activation path writes
  // them, and never overwrites a populated value.
  snapshot: z23.record(z23.string(), z23.unknown()).nullable().default(null).meta({ ...Unrestricted21, readOnly: true }),
  bundle: z23.string().nullable().default(null).meta({ ...Unrestricted21, readOnly: true }),
  metadata: MetadataField.meta(Unrestricted21)
}).meta(
  { id: "ChangeSet", "x-revturbine-schema-persistence": Persisted20, "x-revturbine-schema-exposure": Internal17 }
);
var ChangeSetEntrySummarySchema = z23.object({
  canonical_id: z23.string().meta(Unrestricted21),
  resource_type: z23.string().meta(Unrestricted21),
  resource_name: z23.string().optional().meta(Unrestricted21),
  action: z23.enum(["create", "update", "delete"]).meta(Unrestricted21),
  sequence: z23.number().int().meta(Unrestricted21),
  base_sequence: z23.number().int().nullable().meta(Unrestricted21),
  has_conflict: z23.boolean().meta(Unrestricted21),
  current_sequence: z23.number().int().nullable().meta(Unrestricted21)
}).meta(
  { id: "ChangeSetEntrySummary", "x-revturbine-schema-persistence": Transient20, "x-revturbine-schema-exposure": Internal17 }
);
var ChangeSetDiffSchema = z23.object({
  change_set_id: z23.string().meta(Unrestricted21),
  entries: z23.array(ChangeSetEntrySummarySchema).meta(Unrestricted21),
  total_entries: z23.number().int().min(0).meta(Unrestricted21),
  total_conflicts: z23.number().int().min(0).meta(Unrestricted21),
  deployable: z23.boolean().meta(Unrestricted21)
}).meta(
  { id: "ChangeSetDiff", "x-revturbine-schema-persistence": Transient20, "x-revturbine-schema-exposure": Internal17 }
);
var ChangeSetDeployResultSchema = z23.object({
  change_set_id: z23.string().meta(Unrestricted21),
  deployed_count: z23.number().int().min(0).meta(Unrestricted21),
  superseded_count: z23.number().int().min(0).meta(Unrestricted21),
  skipped_conflicts: z23.number().int().min(0).meta(Unrestricted21),
  deployed_at: z23.string().datetime().meta(Unrestricted21)
}).meta(
  { id: "ChangeSetDeployResult", "x-revturbine-schema-persistence": Transient20, "x-revturbine-schema-exposure": Internal17 }
);
var changeSetPaths = {
  "/api/changesets": {
    get: operation({
      operationId: "listChangeSets",
      requestParams: { query: ListQueryParamsSchema },
      summary: "List change sets (filter by status, environment_id)",
      tags: ["changesets"],
      responses: { "200": { description: "ChangeSet list", content: { "application/json": { schema: ListEnvelope(ChangeSetSchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "changesets", persistence: { table: "changeSets", mode: "list" } }
    }),
    post: operation({
      operationId: "createChangeSet",
      summary: "Create a new change set (draft)",
      tags: ["changesets"],
      requestBody: { required: true, content: { "application/json": { schema: z23.object({
        name: z23.string().min(1).max(200),
        description: z23.string().max(2e3).optional(),
        environment_id: z23.string().min(1),
        labels: z23.array(z23.string()).optional()
      }) } } },
      responses: {
        "201": { description: "Created", content: { "application/json": { schema: ChangeSetSchema } } },
        default: { description: "Error", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "changesets", persistence: { table: "changeSets", mode: "create" } }
    })
  },
  "/api/changesets/{changeSetId}": {
    get: operation({
      operationId: "getChangeSet",
      requestParams: { path: z23.object({ changeSetId: z23.string() }) },
      summary: "Get change set by ID",
      tags: ["changesets"],
      responses: { "200": { description: "ChangeSet", content: { "application/json": { schema: ChangeSetSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "changesets", persistence: { table: "changeSets", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateChangeSet",
      requestParams: { path: z23.object({ changeSetId: z23.string() }) },
      summary: "Update change set (name, description, labels \u2014 draft only)",
      tags: ["changesets"],
      requestBody: { required: true, content: { "application/json": { schema: z23.object({
        name: z23.string().min(1).max(200).optional(),
        description: z23.string().max(2e3).optional(),
        labels: z23.array(z23.string()).optional()
      }) } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: ChangeSetSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "changesets", persistence: { table: "changeSets", mode: "update" } }
    })
  },
  // ── Lifecycle transitions ────────────────────────────────────────────────
  "/api/changesets/{changeSetId}/submit": {
    post: operation({
      operationId: "submitChangeSet",
      requestParams: { path: z23.object({ changeSetId: z23.string() }) },
      summary: "Submit change set for approval",
      tags: ["changesets"],
      responses: {
        "200": { description: "Submitted", content: { "application/json": { schema: ChangeSetSchema } } },
        default: { description: "Error", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "changesets", persistence: { table: "changeSets", mode: "update" } }
    })
  },
  "/api/changesets/{changeSetId}/approve": {
    post: operation({
      operationId: "approveChangeSet",
      requestParams: { path: z23.object({ changeSetId: z23.string() }) },
      summary: "Approve change set (may auto-deploy if environment allows)",
      tags: ["changesets"],
      requestBody: { required: true, content: { "application/json": { schema: z23.object({ review_notes: z23.string().max(2e3).optional() }) } } },
      responses: {
        "200": { description: "Approved", content: { "application/json": { schema: ChangeSetSchema } } },
        default: { description: "Error", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "changesets", persistence: { table: "changeSets", mode: "update" } }
    })
  },
  "/api/changesets/{changeSetId}/reject": {
    post: operation({
      operationId: "rejectChangeSet",
      requestParams: { path: z23.object({ changeSetId: z23.string() }) },
      summary: "Reject change set",
      tags: ["changesets"],
      requestBody: { required: true, content: { "application/json": { schema: z23.object({ rejection_reason: z23.string().max(2e3) }) } } },
      responses: {
        "200": { description: "Rejected", content: { "application/json": { schema: ChangeSetSchema } } },
        default: { description: "Error", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "changesets", persistence: { table: "changeSets", mode: "update" } }
    })
  },
  "/api/changesets/{changeSetId}/deploy": {
    post: operation({
      operationId: "deployChangeSet",
      requestParams: { path: z23.object({ changeSetId: z23.string() }) },
      summary: "Deploy change set \u2014 activates all entries, supersedes previous versions",
      tags: ["changesets"],
      requestBody: { required: true, content: { "application/json": { schema: z23.object({ force: z23.boolean().default(false) }) } } },
      responses: {
        "200": { description: "Deploy result", content: { "application/json": { schema: ChangeSetDeployResultSchema } } },
        default: { description: "Error (conflicts exist)", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "changesets", persistence: { table: "changeSets", mode: "deploy" } }
    })
  },
  "/api/changesets/{changeSetId}/archive": {
    post: operation({
      operationId: "archiveChangeSet",
      requestParams: { path: z23.object({ changeSetId: z23.string() }) },
      summary: "Archive (abandon) a change set",
      tags: ["changesets"],
      responses: { "200": { description: "Archived", content: { "application/json": { schema: ChangeSetSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "changesets", persistence: { table: "changeSets", mode: "update" } }
    })
  },
  // ── Inspection ───────────────────────────────────────────────────────────
  "/api/changesets/{changeSetId}/preview": {
    get: operation({
      operationId: "previewChangeSet",
      requestParams: { path: z23.object({ changeSetId: z23.string() }) },
      summary: "Preview diff of all entries vs current state (dry-run deploy)",
      tags: ["changesets"],
      responses: { "200": { description: "Diff preview", content: { "application/json": { schema: ChangeSetDiffSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "changesets", persistence: { table: "changeSets", mode: "preview" } }
    })
  },
  "/api/changesets/{changeSetId}/conflicts": {
    get: operation({
      operationId: "listChangeSetConflicts",
      requestParams: { path: z23.object({ changeSetId: z23.string() }), query: ListQueryParamsSchema },
      summary: "List entries with sequence conflicts (base_sequence \u2260 current)",
      tags: ["changesets"],
      responses: { "200": { description: "Conflict list", content: { "application/json": { schema: ListEnvelope(ChangeSetEntrySummarySchema) } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "changesets", persistence: { table: "changeSets", mode: "list" } }
    })
  },
  // ── Advanced operations ──────────────────────────────────────────────────
  "/api/changesets/{changeSetId}/rollback": {
    post: operation({
      operationId: "rollbackChangeSet",
      requestParams: { path: z23.object({ changeSetId: z23.string() }) },
      summary: "Create a rollback change set that reverts a deployed one",
      tags: ["changesets"],
      requestBody: { required: true, content: { "application/json": { schema: z23.object({
        name: z23.string().min(1).max(200).optional()
      }) } } },
      responses: {
        "201": { description: "Rollback ChangeSet created", content: { "application/json": { schema: ChangeSetSchema } } },
        default: { description: "Error", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "changesets", persistence: { table: "changeSets", mode: "create" } }
    })
  },
  "/api/changesets/{changeSetId}/cherry-pick": {
    post: operation({
      operationId: "cherryPickEntries",
      requestParams: { path: z23.object({ changeSetId: z23.string() }) },
      summary: "Cherry-pick individual entries from this ChangeSet into another",
      tags: ["changesets"],
      requestBody: { required: true, content: { "application/json": { schema: z23.object({
        canonical_ids: z23.array(z23.string()).min(1),
        target_change_set_id: z23.string().min(1)
      }) } } },
      responses: {
        "200": { description: "Cherry-picked", content: { "application/json": { schema: z23.object({ copied_count: z23.number().int() }) } } },
        default: { description: "Error", content: { "application/json": { schema: ErrorEnvelope } } }
      },
      "x-revturbine-operation": { exposure: "internal", resource: "changesets", persistence: { table: "changeSets", mode: "update" } }
    })
  }
};

// ../revturbine-scaffold/src/settings/models/schema.ts
import { z as z24 } from "zod";
var { Unrestricted: Unrestricted22, Pii: Pii7 } = DataClassification;
var { Persisted: Persisted21 } = SchemaPersistence;
var { Internal: Internal18 } = SchemaExposure;
var ApiKeyStatusSchema = z24.enum(["active", "revoked", "rotating"]).meta({ id: "ApiKeyStatus", "x-revturbine-schema-persistence": Persisted21, "x-revturbine-schema-exposure": Internal18 });
var ApiKeySchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  name: NameField.meta(Unrestricted22),
  key_hash: z24.string().min(1).meta({ ...Pii7, readOnly: true }),
  key_prefix: z24.string().min(1).max(20).meta({ ...Unrestricted22, readOnly: true }),
  key_last4: z24.string().length(4).meta({ ...Unrestricted22, readOnly: true }),
  status: ApiKeyStatusSchema.default("active").meta(Unrestricted22),
  last_used_at: NullableDatetimeField.meta({ ...Unrestricted22, readOnly: true }),
  expires_at: NullableDatetimeField.meta(Unrestricted22)
}).meta({ id: "ApiKey", "x-revturbine-schema-persistence": Persisted21, "x-revturbine-schema-exposure": Internal18 });
var FlagValueTypeSchema = z24.enum(["boolean", "string", "number", "json"]).meta({ id: "FlagValueType", "x-revturbine-schema-persistence": Persisted21, "x-revturbine-schema-exposure": Internal18 });
var FeatureFlagSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  key: z24.string().min(1).max(100).meta(Unrestricted22),
  value_type: FlagValueTypeSchema.default("boolean").meta(Unrestricted22),
  value: z24.string().max(4e3).default("false").meta(Unrestricted22),
  description: DescriptionField.meta(Unrestricted22),
  enabled: z24.boolean().default(true).meta(Unrestricted22)
}).meta({ id: "FeatureFlag", "x-revturbine-schema-persistence": Persisted21, "x-revturbine-schema-exposure": Internal18 });
var TenantConfigSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  workspace_name: z24.string().min(1).max(200).meta(Unrestricted22),
  support_email: z24.string().email().nullable().default(null).meta(Unrestricted22),
  timezone: z24.string().max(50).default("UTC").meta(Unrestricted22),
  default_currency: z24.string().length(3).default("USD").meta(Unrestricted22),
  logo_url: z24.string().url().nullable().default(null).meta(Unrestricted22)
}).meta({ id: "TenantConfig", "x-revturbine-schema-persistence": Persisted21, "x-revturbine-schema-exposure": Internal18 });
var McpConfigSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  /** @deprecated Plan 28 ships a hosted MCP server at `/api/mcp/streamable-http`; no outbound server URL is needed. Column remains for backward compatibility. */
  server_url: z24.string().url().max(500).meta(Unrestricted22),
  /** @deprecated Plan 28 mints per-tenant MCP tokens at Settings → MCP and stores only a SHA-256 hash; this free-text hint is unused. Column remains for backward compatibility. */
  api_token_hint: z24.string().max(50).nullable().default(null).meta(Unrestricted22),
  allow_write_actions: z24.boolean().default(false).meta(Unrestricted22),
  enabled_tools: z24.array(z24.string().max(100)).default([]).meta(Unrestricted22),
  enabled: z24.boolean().default(false).meta(Unrestricted22)
}).meta({ id: "McpConfig", "x-revturbine-schema-persistence": Persisted21, "x-revturbine-schema-exposure": Internal18 });
var OnboardingChecklistSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  step_key: z24.string().min(1).max(100).meta(Unrestricted22),
  label: z24.string().min(1).max(200).meta(Unrestricted22),
  done: z24.boolean().default(false).meta(Unrestricted22),
  completed_at: NullableDatetimeField.meta({ ...Unrestricted22, readOnly: true })
}).meta({ id: "OnboardingChecklist", "x-revturbine-schema-persistence": Persisted21, "x-revturbine-schema-exposure": Internal18 });
var AuditActorTypeSchema = z24.enum(["user", "agent", "system", "webhook"]).meta({ id: "AuditActorType", "x-revturbine-schema-persistence": Persisted21, "x-revturbine-schema-exposure": Internal18 });
var AuditEventSchema = IdField.merge(TenantIdField).extend({
  environment_id: z24.string().min(1).default("production").meta(Unrestricted22),
  actor_type: AuditActorTypeSchema.meta(Unrestricted22),
  actor_id: z24.string().nullable().default(null).meta(Unrestricted22),
  action: z24.string().min(1).max(120).meta(Unrestricted22),
  object_type: z24.string().max(120).nullable().default(null).meta(Unrestricted22),
  object_id: z24.string().max(200).nullable().default(null).meta(Unrestricted22),
  payload: z24.record(z24.string(), z24.unknown()).nullable().default(null).meta(Unrestricted22),
  occurred_at: z24.string().datetime().meta({ ...Unrestricted22, readOnly: true })
}).meta({ id: "AuditEvent", "x-revturbine-schema-persistence": Persisted21, "x-revturbine-schema-exposure": Internal18 });
var PlacementTestUserIdentifierTypeSchema = z24.enum(["user_id", "account_id", "email"]).meta({ id: "PlacementTestUserIdentifierType", "x-revturbine-schema-persistence": Persisted21, "x-revturbine-schema-exposure": Internal18 });
var PlacementTestUserSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(ConfigVersionFields).extend({
  identifier: z24.string().min(1).max(200).meta(Unrestricted22),
  identifier_type: PlacementTestUserIdentifierTypeSchema.default("user_id").meta(Unrestricted22),
  note: z24.string().max(500).nullable().default(null).meta(Unrestricted22),
  added_by: z24.string().meta(Unrestricted22)
}).meta({ id: "PlacementTestUser", "x-revturbine-schema-persistence": Persisted21, "x-revturbine-schema-exposure": Internal18 });
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
      requestParams: { path: z24.object({ keyId: z24.string() }) },
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
      requestParams: { path: z24.object({ flagId: z24.string() }) },
      summary: "Get a feature flag",
      tags: ["settings"],
      responses: { "200": { description: "Feature flag", content: { "application/json": { schema: FeatureFlagSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "feature-flags", persistence: { table: "featureFlags", mode: "get" } }
    }),
    put: operation({
      operationId: "updateFeatureFlag",
      requestParams: { path: z24.object({ flagId: z24.string() }) },
      summary: "Update a feature flag",
      tags: ["settings"],
      requestBody: { required: true, content: { "application/json": { schema: toWritableSchema(FeatureFlagSchema).partial() } } },
      responses: { "200": { description: "Feature flag updated", content: { "application/json": { schema: FeatureFlagSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "feature-flags", persistence: { table: "featureFlags", mode: "update", writeSchema: "FeatureFlagSchema#writable" } }
    }),
    delete: operation({
      operationId: "deleteFeatureFlag",
      requestParams: { path: z24.object({ flagId: z24.string() }) },
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
      requestParams: { path: z24.object({ stepId: z24.string() }) },
      summary: "Get an onboarding step",
      tags: ["settings"],
      responses: { "200": { description: "Onboarding step", content: { "application/json": { schema: OnboardingChecklistSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "onboarding", persistence: { table: "onboardingChecklist", mode: "get" } }
    }),
    put: operation({
      operationId: "updateOnboardingStep",
      requestParams: { path: z24.object({ stepId: z24.string() }) },
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
      requestParams: { path: z24.object({ testUserId: z24.string() }) },
      summary: "Remove a placement test user",
      tags: ["settings"],
      responses: { "200": { description: "Placement test user removed", content: { "application/json": { schema: PlacementTestUserSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "placement-test-users", persistence: { table: "placementTestUsers", mode: "delete" } }
    })
  }
};

// ../revturbine-scaffold/src/core/auth/schema.ts
import { z as z25 } from "zod";
var { Unrestricted: Unrestricted23, Pii: Pii8 } = DataClassification;
var { Persisted: Persisted22, Transient: Transient21 } = SchemaPersistence;
var { Internal: Internal19 } = SchemaExposure;
var UserRoleSchema = z25.enum(["user", "admin"]).meta({ id: "UserRole", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal19 });
var AuthUserSchema = IdField.merge(TimestampFields).extend({
  name: NameField.meta(Unrestricted23),
  email: z25.string().email().meta(Pii8),
  email_verified: z25.boolean().default(false).meta(Unrestricted23),
  image: z25.string().url().nullable().default(null).meta(Pii8),
  role: UserRoleSchema.default("user").meta(Unrestricted23),
  banned: z25.boolean().default(false).meta({ ...Unrestricted23, readOnly: true }),
  ban_reason: z25.string().nullable().default(null).meta({ ...Unrestricted23, readOnly: true }),
  ban_expires: NullableDatetimeField.meta({ ...Unrestricted23, readOnly: true }),
  two_factor_enabled: z25.boolean().default(false).meta({ ...Unrestricted23, readOnly: true })
}).meta({ id: "AuthUser", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal19 });
var AuthSessionSchema = IdField.merge(TimestampFields).extend({
  expires_at: z25.string().datetime().meta(Unrestricted23),
  token: z25.string().min(1).meta({ ...Pii8, readOnly: true }),
  ip_address: z25.string().nullable().default(null).meta(Pii8),
  user_agent: z25.string().nullable().default(null).meta(Pii8),
  user_id: z25.string().min(1).meta({ ...Unrestricted23, readOnly: true }),
  active_organization_id: z25.string().nullable().default(null).meta(Unrestricted23),
  impersonated_by: z25.string().nullable().default(null).meta({ ...Unrestricted23, readOnly: true })
}).meta({ id: "AuthSession", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal19 });
var AuthAccountSchema = IdField.merge(TimestampFields).extend({
  account_id: z25.string().min(1).meta(Unrestricted23),
  provider_id: z25.string().min(1).meta(Unrestricted23),
  user_id: z25.string().min(1).meta({ ...Unrestricted23, readOnly: true }),
  access_token: z25.string().nullable().default(null).meta({ ...Pii8, readOnly: true }),
  refresh_token: z25.string().nullable().default(null).meta({ ...Pii8, readOnly: true }),
  id_token: z25.string().nullable().default(null).meta({ ...Pii8, readOnly: true }),
  access_token_expires_at: NullableDatetimeField.meta({ ...Unrestricted23, readOnly: true }),
  refresh_token_expires_at: NullableDatetimeField.meta({ ...Unrestricted23, readOnly: true }),
  scope: z25.string().nullable().default(null).meta(Unrestricted23),
  password: z25.string().nullable().default(null).meta({ ...Pii8, readOnly: true })
}).meta({ id: "AuthAccount", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal19 });
var AuthVerificationSchema = IdField.merge(TimestampFields).extend({
  identifier: z25.string().min(1).meta(Pii8),
  value: z25.string().min(1).meta({ ...Pii8, readOnly: true }),
  expires_at: z25.string().datetime().meta(Unrestricted23)
}).meta({ id: "AuthVerification", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal19 });
var AuthTwoFactorSchema = IdField.extend({
  secret: z25.string().min(1).meta({ ...Pii8, readOnly: true }),
  backup_codes: z25.string().min(1).meta({ ...Pii8, readOnly: true }),
  user_id: z25.string().min(1).meta({ ...Unrestricted23, readOnly: true }),
  verified: z25.boolean().default(false).meta({ ...Unrestricted23, readOnly: true })
}).meta({ id: "AuthTwoFactor", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal19 });
var AuthOrganizationSchema = IdField.extend({
  name: NameField.meta(Unrestricted23),
  slug: z25.string().min(1).max(100).nullable().default(null).meta(Unrestricted23),
  logo: z25.string().url().nullable().default(null).meta(Unrestricted23),
  created_at: z25.string().datetime().meta({ ...Unrestricted23, readOnly: true }),
  metadata: z25.string().nullable().default(null).meta(Unrestricted23)
}).meta({ id: "AuthOrganization", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal19 });
var RoleSchema = z25.enum(["viewer", "collaborator", "approver", "admin"]).meta({ id: "Role", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal19 });
var ROLE_RANK = {
  viewer: 0,
  collaborator: 1,
  approver: 2,
  admin: 3
};
var PermissionResourceSchema = z25.enum([
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
var PermissionActionSchema = z25.enum([
  "read",
  "create",
  "update",
  "delete",
  "publish",
  "approve",
  "invite",
  "manage_roles"
]).meta({ id: "PermissionAction", "x-revturbine-schema-persistence": Transient21, "x-revturbine-schema-exposure": Internal19 });
var PermissionSchema = z25.object({
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
var McpTokenScopeSchema = z25.enum(SCOPE_VALUES).meta({ id: "McpTokenScope", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal19 });
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
  organization_id: z25.string().min(1).meta({ ...Unrestricted23, readOnly: true }),
  user_id: z25.string().min(1).meta({ ...Unrestricted23, readOnly: true }),
  role: RoleSchema.default("viewer").meta(Unrestricted23),
  created_at: z25.string().datetime().meta({ ...Unrestricted23, readOnly: true })
}).meta({ id: "AuthMember", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal19 });
var InvitationStatusSchema = z25.enum(["pending", "accepted", "rejected", "canceled", "expired"]).meta({ id: "InvitationStatus", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal19 });
var AuthInvitationSchema = IdField.extend({
  organization_id: z25.string().min(1).meta({ ...Unrestricted23, readOnly: true }),
  email: z25.string().email().meta(Pii8),
  role: RoleSchema.nullable().default(null).meta(Unrestricted23),
  status: InvitationStatusSchema.default("pending").meta(Unrestricted23),
  expires_at: z25.string().datetime().meta(Unrestricted23),
  created_at: z25.string().datetime().meta({ ...Unrestricted23, readOnly: true }),
  inviter_id: z25.string().min(1).meta({ ...Unrestricted23, readOnly: true })
}).meta({ id: "AuthInvitation", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal19 });
var AuthPasskeySchema = IdField.extend({
  name: z25.string().max(200).nullable().default(null).meta(Unrestricted23),
  public_key: z25.string().min(1).meta({ ...Pii8, readOnly: true }),
  user_id: z25.string().min(1).meta({ ...Unrestricted23, readOnly: true }),
  credential_id: z25.string().min(1).meta({ ...Unrestricted23, readOnly: true }),
  counter: z25.number().int().default(0).meta({ ...Unrestricted23, readOnly: true }),
  device_type: z25.string().min(1).meta(Unrestricted23),
  backed_up: z25.boolean().default(false).meta(Unrestricted23),
  transports: z25.string().nullable().default(null).meta(Unrestricted23),
  created_at: z25.string().datetime().meta({ ...Unrestricted23, readOnly: true }),
  aaguid: z25.string().nullable().default(null).meta(Unrestricted23)
}).meta({ id: "AuthPasskey", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal19 });
var AuthApiKeySchema = IdField.merge(TimestampFields).extend({
  config_id: z25.string().min(1).meta(Unrestricted23),
  name: z25.string().max(200).nullable().default(null).meta(Unrestricted23),
  start: z25.string().nullable().default(null).meta(Unrestricted23),
  reference_id: z25.string().min(1).meta(Unrestricted23),
  prefix: z25.string().nullable().default(null).meta(Unrestricted23),
  key: z25.string().min(1).meta({ ...Pii8, readOnly: true }),
  refill_interval: z25.number().int().nullable().default(null).meta(Unrestricted23),
  refill_amount: z25.number().int().nullable().default(null).meta(Unrestricted23),
  last_refill_at: NullableDatetimeField.meta({ ...Unrestricted23, readOnly: true }),
  enabled: z25.boolean().default(true).meta(Unrestricted23),
  rate_limit_enabled: z25.boolean().default(false).meta(Unrestricted23),
  rate_limit_time_window: z25.number().int().nullable().default(null).meta(Unrestricted23),
  rate_limit_max: z25.number().int().nullable().default(null).meta(Unrestricted23),
  request_count: z25.number().int().default(0).meta({ ...Unrestricted23, readOnly: true }),
  remaining: z25.number().int().nullable().default(null).meta({ ...Unrestricted23, readOnly: true }),
  last_request: NullableDatetimeField.meta({ ...Unrestricted23, readOnly: true }),
  expires_at: NullableDatetimeField.meta(Unrestricted23),
  permissions: z25.string().nullable().default(null).meta(Unrestricted23),
  metadata: z25.string().nullable().default(null).meta(Unrestricted23)
}).meta({ id: "AuthApiKey", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal19 });
var AuthSsoProviderSchema = IdField.extend({
  issuer: z25.string().min(1).meta(Unrestricted23),
  oidc_config: z25.string().nullable().default(null).meta(Unrestricted23),
  saml_config: z25.string().nullable().default(null).meta(Unrestricted23),
  user_id: z25.string().min(1).meta({ ...Unrestricted23, readOnly: true }),
  provider_id: z25.string().min(1).meta(Unrestricted23),
  organization_id: z25.string().nullable().default(null).meta(Unrestricted23),
  domain: z25.string().min(1).meta(Unrestricted23)
}).meta({ id: "AuthSsoProvider", "x-revturbine-schema-persistence": Persisted22, "x-revturbine-schema-exposure": Internal19 });
export {
  AddOnSchema,
  AddOnVariationSchema,
  AlertSchema,
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
  ChangeSetDeployResultSchema,
  ChangeSetDiffSchema,
  ChangeSetEntrySummarySchema,
  ChangeSetSchema,
  ChangeSetStatusSchema,
  CohortMonthSchema,
  ConfigVersionFields,
  ContentPayloadSegmentEntrySchema,
  ContentPlacementPayloadSchema,
  ContentPromotionSchema,
  ContentUiPathSchema,
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
  ExportedConfigAddonsItemSchema,
  ExportedConfigEntitlementRulesItemSchema,
  ExportedConfigEntitlementsItemSchema,
  ExportedConfigPeriodCapSchema,
  ExportedConfigPlacementCategorySchema,
  ExportedConfigPlacementItemSchema,
  ExportedConfigPlacementPayloadItemSchema,
  ExportedConfigPlacementSlotsItemSchema,
  ExportedConfigPlacementTriggerSchema,
  ExportedConfigPlansItemSchema,
  ExportedConfigSchema,
  ExportedConfigSegmentsItemPredicatesItemSchema,
  ExportedConfigSegmentsItemSchema,
  ExportedConfigSlotConfigsItemSchema,
  ExportedConfigStudioCtaConfigSchema,
  ExportedConfigStudioPayloadCapsSchema,
  ExportedConfigStudioPayloadSchema,
  ExportedConfigStudioPayloadSurfaceSchema,
  ExportedConfigStudioPayloadTargetSchema,
  ExportedConfigSurfaceTemplatesItemFieldsItemSchema,
  ExportedConfigSurfaceTemplatesItemSchema,
  ExportedConfigUiPathActionTypeSchema,
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
  PresentationRecordSchema,
  PricingModelSchema,
  PromotionSchema,
  PromotionStatusSchema,
  ROLE_PERMISSIONS,
  ROLE_RANK,
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
  WebhookEventLogSchema,
  WebhookEventSourceSchema,
  WebhookEventStatusSchema,
  analyticsPaths,
  changeSetPaths,
  changelogPaths,
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
  getSchemaPersistence,
  placementPaths,
  planPaths,
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
