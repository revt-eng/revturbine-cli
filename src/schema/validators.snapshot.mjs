// GENERATED — do not edit by hand.
// Vendored validation engine bundled from @revt-eng/schema@0.1.261
// (revturbine-scaffold/src/core/validation/index.ts). Regenerate with:
//   node scripts/generate-schema-snapshot.mjs


// ../scaffold/src/core/validation/types.ts
import { z } from "zod";
var SeveritySchema = z.enum([
  "error_draft",
  "error_launch",
  "warning",
  "ai_check"
]);
var CallSiteSchema = z.enum([
  "studio",
  // inline studio editing / modal commit
  "publish",
  // the launch gate (literal kept as 'publish' — see NOTE above)
  "ingestion",
  // external ingestion — CLI / MCP / agents
  "compile"
  // compile / activate backstop
]);
var TargetRefSchema = z.object({
  object_type: z.string().optional(),
  object_id: z.string().optional(),
  field: z.string().optional(),
  /** Studio key the UI resolves a deep-link against. */
  studio: z.string().optional(),
  /** A free-form deep-link target the UI can resolve into a URL. */
  href: z.string().optional(),
  /** Zod issue path, for structural-tier findings. */
  path: z.array(z.union([z.string(), z.number()])).optional()
});
var ValidationFindingSchema = z.object({
  /** Stable rule ID (e.g. `VAL-PLN-01`); for schema findings, the Zod issue code. */
  code: z.string(),
  severity: SeveritySchema,
  targetRef: TargetRefSchema,
  /** Single user-facing message — same string at the gate, modal, and CLI. */
  message: z.string(),
  /** Pointer to the originating spec rule. Beta inspection aid — remove post-beta. */
  specRef: z.string().optional(),
  /** Optional extended context (preserved from the old `ValidationIssue.detail`). */
  detail: z.string().optional(),
  /**
   * Set by `evaluate` when a `focus` is supplied and this finding touches the
   * focused object — surfaces use it to spotlight inline. Never narrows what is
   * checked (spec §3.1).
   */
  spotlight: z.boolean().optional()
});

// ../scaffold/src/core/validation/catalog.ts
var CATALOG = {
  // no-Stripe-price. Interim `warning` (does not block): a plan price that has
  // all its billing info but is entered statically rather than synced from
  // Stripe is valid to launch — it should warn, not block. The stricter
  // three-way model (block if billing info is INCOMPLETE; warn if complete-but-
  // static; pass if complete-and-Stripe-connected) is a tracked follow-up
  // (static-pricing plan). Spec §5.3's blanket error_launch is superseded by
  // that follow-up; see the plan.
  "VAL-PLN-01": {
    id: "VAL-PLN-01",
    severity: "warning",
    message: "Plan '{plan}' has no Stripe price linked.",
    specRef: "optimization-studio-ui.md \xA73.1; plans-entitlements-studio-ui.md \xA72.2"
  },
  // entitlement-rule overlap. Origin: the `rule.overlap` check (plan 40);
  // scoped to same-entitlement pairs per §5.8 (plan 179 / devkit #597).
  "VAL-PLN-05": {
    id: "VAL-PLN-05",
    severity: "warning",
    message: "These rules for the same entitlement target the same plan and segment \u2014 only one will apply.",
    specRef: "config-validation.md \xA75.3 (provisional \u2014 plan 73 Q-1)"
  },
  // limit rule with unset enforcement. Promoted from §5.8 (plan 179 Q-6,
  // Kent 2026-08-12): unset enforcement silently means "hard-block at the
  // cap" (evaluator default since plan 34) — an author who wanted degrade or
  // allow_overage gets a hard stop without being told. Explicitness warn on
  // the corrected premise (the old "never blocks" mechanism was the SDK
  // ignoring allowed:false, fixed in sdk 0.2.75).
  "VAL-PLN-07": {
    id: "VAL-PLN-07",
    severity: "warning",
    message: "This limit rule sets no enforcement \u2014 at the cap it blocks by default. Set enforcement explicitly (hard_block, block_with_upsell, degrade, allow_overage) if that isn't the intent.",
    specRef: "config-validation.md \xA75.8 (promoted \u2014 plan 179 Q-6)"
  },
  // segment → experiment reference (plan 183). Handle, not id.
  "VAL-SEG-01": {
    id: "VAL-SEG-01",
    severity: "warning",
    message: "This segment enrols users into an experiment that does not exist.",
    specRef: "config-validation.md \xA75.3 (plan 183)"
  },
  // experiment metric → Semantic Catalog reference (plan 199). The identifier
  // is structurally valid, but the active catalog does not declare it.
  "VAL-EXP-01": {
    id: "VAL-EXP-01",
    severity: "warning",
    message: "This experiment references a metric the active Semantic Catalog does not declare.",
    specRef: "target_analytics_experimentation_architecture.md \xA76.8 (plan 199)"
  },
  // multiple public variations. Origin: `*_variation.multiple_public`.
  "VAL-PLN-06": {
    id: "VAL-PLN-06",
    severity: "error_draft",
    message: "Only one public variation is allowed per billing period and segment.",
    specRef: "config-validation.md \xA75.3 (provisional \u2014 plan 73 Q-1)"
  },
  // more-than-two CTAs on a payload surface. Promoted from §5.8 (plan 174
  // TASK-7 / devkit #584): the decision output carries ONE cta_path (from
  // ctas[0]); ctas[1] contributes secondary_cta_label only; ctas[2..] are
  // dropped at resolution with no finding.
  "VAL-PLC-05": {
    id: "VAL-PLC-05",
    severity: "warning",
    message: "Payload '{payload}' authors {count} CTAs, but the decision output carries one primary path and one secondary label \u2014 the third and later CTAs are dropped at resolution.",
    specRef: "config-validation.md \xA75.8 (promoted \u2014 plan 174 TASK-7)"
  },
  // widest-possible-audience trial rule. Promoted from §5.8 (plan 174 TASK-7 /
  // devkit #584): plan and segment on a free trial rule NARROW, so null on
  // both means every user on every plan — legal and occasionally intended,
  // but indistinguishable from an unfinished rule after authoring. Reverse
  // trial rules can't hit this (premium_plan_id is required).
  "VAL-TRL-04": {
    id: "VAL-TRL-04",
    severity: "warning",
    message: "Trial rule '{rule}' targets every user on every plan (no plan, no segment). Confirm the widest possible audience is intended.",
    specRef: "config-validation.md \xA75.8 (promoted \u2014 plan 174 TASK-7)"
  }
};
function getCatalogEntry(id) {
  return CATALOG[id];
}
function listCatalogIds() {
  return Object.keys(CATALOG);
}

// ../scaffold/src/core/validation/disposition.ts
function disposition(finding2, callSite) {
  if (finding2.severity === "error_draft") return "block";
  if (finding2.severity === "error_launch" && callSite === "publish") return "block";
  return "advise";
}

// ../scaffold/src/core/validation/rules.ts
var SEMANTIC_RULE_CODES = [
  "VAL-PLN-01",
  "VAL-PLN-05",
  "VAL-PLN-06",
  "VAL-PLN-07",
  "VAL-PLC-05",
  "VAL-TRL-04",
  "VAL-SEG-01",
  "VAL-EXP-01"
];
function runSemanticRules(graph, opts = {}) {
  return [
    ...checkPlansHaveStripePrice(graph),
    ...checkRuleOverlaps(graph),
    ...checkLimitRuleEnforcement(graph),
    ...checkPublicVariationCollisions(graph),
    ...checkPayloadCtaOverflow(graph),
    ...checkTrialRuleWidestAudience(graph),
    ...checkSegmentExperimentRefs(graph),
    ...checkExperimentMetricRefs(graph, opts.knownMetricIds)
  ];
}
function checkLimitRuleEnforcement(graph) {
  const findings = [];
  const CAP_FIELDS = ["limit_value", "allowance_value", "included_count"];
  for (const rule of graph.entitlement_rules ?? []) {
    if (rule.enforcement !== void 0 && rule.enforcement !== null) continue;
    const cappedField = CAP_FIELDS.find((f) => typeof rule[f] === "number" && Number.isFinite(rule[f]));
    if (!cappedField) continue;
    const id = String(rule.handle ?? rule.id ?? "");
    const name = String(rule.name ?? id);
    findings.push(
      finding(
        "VAL-PLN-07",
        { object_type: "entitlement_rule", object_id: id, field: "enforcement", studio: "plans-entitlements" },
        {
          message: `Limit rule '${name}' sets no enforcement \u2014 at the cap it blocks by default. Set enforcement explicitly (hard_block, block_with_upsell, degrade, allow_overage) if that isn't the intent.`
        }
      )
    );
  }
  return findings;
}
function surfaceCtas(surface) {
  if (!surface || typeof surface !== "object") return 0;
  const ctas = surface.ctas;
  return Array.isArray(ctas) ? ctas.length : 0;
}
function checkPayloadCtaOverflow(graph) {
  const findings = [];
  const flag = (payloadId, count, objectType) => {
    findings.push(
      finding("VAL-PLC-05", { object_type: objectType, object_id: payloadId, field: "ctas", studio: "placements" }, {
        message: `Payload '${payloadId}' authors ${count} CTAs, but the decision output carries one primary path and one secondary label \u2014 the third and later CTAs are dropped at resolution.`
      })
    );
  };
  for (const placement of graph.placements ?? []) {
    const payloads = Array.isArray(placement.payloads) ? placement.payloads : [];
    for (const payload of payloads) {
      const payloadId = String(payload.id ?? placement.id ?? "");
      const surfaces = Array.isArray(payload.surfaces) ? payload.surfaces : [];
      for (const surface of surfaces) {
        const count = surfaceCtas(surface);
        if (count > 2) flag(payloadId, count, "placement_payload");
      }
    }
  }
  for (const payload of graph.placement_payloads ?? []) {
    const payloadId = String(payload.payload_id ?? payload.id ?? "");
    const surfaces = Array.isArray(payload.surfaces) ? payload.surfaces : [];
    for (const surface of surfaces) {
      const count = surfaceCtas(surface);
      if (count > 2) flag(payloadId, count, "placement_payload");
    }
  }
  return findings;
}
function checkTrialRuleWidestAudience(graph) {
  const findings = [];
  for (const rule of graph.free_trial_rules ?? []) {
    const planId = rule.plan_id;
    const segmentId = rule.segment_id;
    const planUnset = planId === null || planId === void 0 || planId === "";
    const segmentUnset = segmentId === null || segmentId === void 0 || segmentId === "";
    if (!planUnset || !segmentUnset) continue;
    const ruleId = String(rule.handle ?? rule.id ?? "");
    findings.push(
      finding("VAL-TRL-04", { object_type: "free_trial_rule", object_id: ruleId, studio: "trials" }, {
        message: `Trial rule '${ruleId || "unnamed"}' targets every user on every plan (no plan, no segment). Confirm the widest possible audience is intended.`
      })
    );
  }
  return findings;
}
var ID_HANDLE_PARITY_TABLES = [
  { table: "plans", handleField: "unique_handle", objectType: "plan" },
  { table: "addons", handleField: "unique_handle", objectType: "addon" },
  { table: "entitlements", handleField: "unique_handle", objectType: "entitlement" },
  { table: "segments", handleField: "handle", objectType: "segment" }
];
function checkIdHandleParity(graph) {
  const findings = [];
  for (const { table, handleField, objectType } of ID_HANDLE_PARITY_TABLES) {
    for (const row of graph[table] ?? []) {
      const id = typeof row.id === "string" ? row.id : "";
      if (!id) continue;
      const handleRaw = row[handleField];
      const handle = typeof handleRaw === "string" ? handleRaw : void 0;
      if (handle === id) continue;
      findings.push({
        code: "VAL-ID-01",
        severity: "error_draft",
        targetRef: {
          object_type: objectType,
          object_id: id,
          field: handleField,
          studio: "plans-entitlements"
        },
        message: handle === void 0 ? `${objectType} '${id}' has no ${handleField} \u2014 its id and handle must match before the plan-120 identity collapse.` : `${objectType} '${id}' has a diverging ${handleField} ('${handle}') \u2014 id and handle must match before the plan-120 identity collapse.`,
        detail: "Plan 120 collapses the config id and handle into a single identifier. Converge them (id === handle) so the redundant one can be dropped losslessly."
      });
    }
  }
  return findings;
}
function checkSegmentExperimentRefs(graph) {
  const segments = graph.segments;
  if (!segments?.length) return [];
  const knownHandles = /* @__PURE__ */ new Set();
  for (const exp of graph.experiments ?? []) {
    const handle = typeof exp.handle === "string" ? exp.handle : "";
    if (handle) knownHandles.add(handle);
  }
  const findings = [];
  for (const segment of segments) {
    const ref = segment.experiment_handle ?? segment.experiment_id;
    if (typeof ref !== "string" || ref.length === 0) continue;
    if (knownHandles.has(ref)) continue;
    const segmentId = String(segment.handle ?? segment.id ?? "");
    findings.push(
      finding(
        "VAL-SEG-01",
        { object_type: "segment", object_id: segmentId, field: "experiment_handle", studio: "targeting" },
        {
          message: `Segment '${segmentId}' enrols users into experiment '${ref}', which no experiment declares.`,
          detail: "`experiment_handle` must be an experiment's handle, not its id. A reference that matches nothing never enrols anyone, so the experiment appears live and silently collects no traffic."
        }
      )
    );
  }
  return findings;
}
function checkExperimentMetricRefs(graph, knownMetricIds) {
  if (!knownMetricIds) return [];
  const findings = [];
  for (const experiment of graph.experiments ?? []) {
    const experimentId = String(experiment.handle ?? experiment.id ?? "");
    const fields = [
      ["primary_metric", experiment.primary_metric],
      ["secondary_metrics", experiment.secondary_metrics],
      ["guardrail_metrics", experiment.guardrail_metrics]
    ];
    for (const [field, raw] of fields) {
      const values = Array.isArray(raw) ? raw : [raw];
      for (const value of new Set(values.filter((item) => typeof item === "string" && item.length > 0))) {
        if (knownMetricIds.has(value)) continue;
        findings.push(
          finding(
            "VAL-EXP-01",
            { object_type: "experiment", object_id: experimentId, field, studio: "optimization" },
            { message: `Experiment '${experimentId}' references metric '${value}', which the active Semantic Catalog does not declare.` }
          )
        );
      }
    }
  }
  return findings;
}
function finding(catalogId, target, opts = {}) {
  const entry = getCatalogEntry(catalogId);
  const severity = entry?.severity ?? "warning";
  return {
    code: catalogId,
    severity,
    targetRef: target,
    message: opts.message ?? entry?.message ?? catalogId,
    ...entry?.specRef ? { specRef: entry.specRef } : {},
    ...opts.detail ? { detail: opts.detail } : {}
  };
}
function checkPlansHaveStripePrice(graph) {
  const plans = graph.plans;
  if (!plans?.length) return [];
  const plansWithVariations = /* @__PURE__ */ new Set();
  const pricedPlanIds = /* @__PURE__ */ new Set();
  for (const v of graph.plan_variations ?? []) {
    const planId = String(v.plan_id ?? "");
    if (!planId) continue;
    plansWithVariations.add(planId);
    const priceId = v.stripe_price_id;
    if (typeof priceId === "string" && priceId.length > 0) pricedPlanIds.add(planId);
  }
  const findings = [];
  for (const row of plans) {
    const planKeys = [String(row.handle ?? ""), String(row.id ?? "")].filter(Boolean);
    const hasVariations = planKeys.some((k) => plansWithVariations.has(k));
    if (!hasVariations) continue;
    const hasStripePrice = planKeys.some((k) => pricedPlanIds.has(k));
    if (hasStripePrice) continue;
    const id = String(row.handle ?? row.id ?? "");
    const name = String(row.name ?? id);
    findings.push(
      finding(
        "VAL-PLN-01",
        {
          object_type: "plan",
          object_id: id,
          field: "plan_variations",
          studio: "plans-entitlements"
        },
        {
          message: `Plan '${name}' has no Stripe price linked.`,
          detail: "Link a Plan Variation to a Stripe Price before activating the plan for paid customers."
        }
      )
    );
  }
  return findings;
}
function checkRuleOverlaps(graph) {
  const rules = graph.entitlement_rules;
  if (!rules?.length) return [];
  const segmentDimensions = /* @__PURE__ */ new Map();
  for (const seg of graph.segments ?? []) {
    const segId = String(seg.handle ?? seg.id ?? "");
    const dim = typeof seg.dimension_id === "string" ? seg.dimension_id : "";
    if (segId) segmentDimensions.set(segId, dim);
  }
  const sigs = [];
  for (const rule of rules) {
    const id = String(rule.handle ?? rule.id ?? "");
    const entitlementId = typeof rule.entitlement_id === "string" ? rule.entitlement_id : "";
    const targetIds = /* @__PURE__ */ new Set();
    if (Array.isArray(rule.targets)) {
      for (const t of rule.targets) {
        if (t && typeof t === "object") {
          const obj = t;
          if (typeof obj.id === "string") {
            const kind = typeof obj.kind === "string" ? obj.kind : "plan";
            targetIds.add(`${kind}:${obj.id}`);
          }
        }
      }
    } else if (Array.isArray(rule.plan_ids)) {
      for (const pid of rule.plan_ids) {
        if (typeof pid === "string") targetIds.add(`plan:${pid}`);
      }
    } else if (rule.plan_id !== void 0 && rule.plan_id !== null) {
      targetIds.add(`plan:${String(rule.plan_id)}`);
    }
    const segmentIds = Array.isArray(rule.segment_ids) ? rule.segment_ids.filter((s) => typeof s === "string") : [];
    const segmentPairs = /* @__PURE__ */ new Set();
    for (const segId of segmentIds) {
      const dim = segmentDimensions.get(segId) ?? "";
      segmentPairs.add(`${dim}::${segId}`);
    }
    sigs.push({
      rule,
      id,
      entitlementId,
      targetIds,
      segmentPairs,
      matchesAllSegments: segmentIds.length === 0
    });
  }
  const overlapping = /* @__PURE__ */ new Set();
  for (let i = 0; i < sigs.length; i++) {
    for (let j = i + 1; j < sigs.length; j++) {
      const a = sigs[i];
      const b = sigs[j];
      if (!a.entitlementId || a.entitlementId !== b.entitlementId) continue;
      let sharedTarget = false;
      for (const t of a.targetIds) {
        if (b.targetIds.has(t)) {
          sharedTarget = true;
          break;
        }
      }
      if (!sharedTarget) continue;
      let overlaps = false;
      if (a.matchesAllSegments || b.matchesAllSegments) {
        overlaps = true;
      } else {
        for (const pair of a.segmentPairs) {
          if (b.segmentPairs.has(pair)) {
            overlaps = true;
            break;
          }
        }
      }
      if (overlaps) {
        overlapping.add(i);
        overlapping.add(j);
      }
    }
  }
  const findings = [];
  for (const idx of overlapping) {
    const sig = sigs[idx];
    const name = String(sig.rule.name ?? sig.id);
    findings.push(
      finding(
        "VAL-PLN-05",
        {
          object_type: "entitlement_rule",
          object_id: sig.id,
          studio: "plans-entitlements"
        },
        {
          message: `Entitlement rule '${name}' overlaps another rule for the same entitlement on a shared target and segment \u2014 only one will apply.`,
          detail: "Where rules overlap, the most permissive value applies (plans-entitlements-studio-ui.md \xA72.3.2). Adjust the segment selection if this is unintended."
        }
      )
    );
  }
  return findings;
}
function checkPublicVariationCollisions(graph) {
  return [
    ...collectPublicCollisions(graph.plan_variations, "plan_variation", "plan_id"),
    ...collectPublicCollisions(graph.addon_variations, "addon_variation", "addon_id")
  ];
}
function collectPublicCollisions(rows, objectType, parentField) {
  if (!rows?.length) return [];
  const publicByTuple = /* @__PURE__ */ new Map();
  for (const row of rows) {
    if (row.is_current === false) continue;
    if (String(row.visibility ?? "public") !== "public") continue;
    const tenant = String(row.tenant_id ?? "");
    const parent = String(row[parentField] ?? "");
    const period = String(row.billing_period ?? "");
    const segment = row.segment_id == null ? "_default" : String(row.segment_id);
    const key = `${tenant} ${parent} ${period} ${segment}`;
    const id = String(row.handle ?? row.id ?? "");
    const bucket = publicByTuple.get(key);
    if (bucket) bucket.ids.push(id);
    else publicByTuple.set(key, { ids: [id], parent, period, segment });
  }
  const findings = [];
  for (const bucket of publicByTuple.values()) {
    if (bucket.ids.length < 2) continue;
    const allIds = [...bucket.ids].sort();
    const segmentLabel = bucket.segment === "_default" ? "no segment" : `segment ${bucket.segment}`;
    const parentLabel = parentField === "plan_id" ? "plan" : "add-on";
    for (const id of bucket.ids) {
      findings.push(
        finding(
          "VAL-PLN-06",
          {
            object_type: objectType,
            object_id: id,
            field: "visibility",
            studio: "plans-entitlements"
          },
          {
            message: `Variation '${id}' is one of ${bucket.ids.length} marked Public for the same ${parentLabel}, billing period '${bucket.period}', and ${segmentLabel} \u2014 only one may be Public.`,
            detail: `Set all but one of [${allIds.join(", ")}] to Unlisted or Legacy before deploying.`
          }
        )
      );
    }
  }
  return findings;
}

// ../scaffold/src/core/validation/zod-adapter.ts
function fieldLabel(path) {
  if (!path || path.length === 0) return "This value";
  return String(path[path.length - 1]);
}
function messageForZodIssue(issue) {
  const field = fieldLabel(issue.path);
  switch (issue.code) {
    case "invalid_type":
      return issue.input === void 0 ? `${field} is required.` : `${field} must be a ${issue.expected ?? "valid value"}.`;
    case "invalid_value": {
      const values = (issue.values ?? []).filter(
        (v) => ["string", "number", "boolean"].includes(typeof v)
      );
      return values.length > 0 ? `${field} must be one of: ${values.map((v) => `'${String(v)}'`).join(", ")}.` : `${field} must be one of the allowed values.`;
    }
    case "invalid_format":
      return `${field} isn't in a valid format.`;
    case "too_small":
      return `${field} is too small.`;
    case "too_big":
      return `${field} is too large.`;
    case "unrecognized_keys":
      return `${field} isn't a recognized setting.`;
    default:
      return issue.message ?? `${field} is invalid.`;
  }
}
function targetRefForIssue(issue, basePath) {
  const path = [...basePath, ...issue.path ?? []].map(
    (seg) => typeof seg === "number" ? seg : String(seg)
  );
  return { path };
}
function zodErrorToFindings(error, opts = {}) {
  const basePath = opts.basePath ?? [];
  return error.issues.map((issue) => ({
    code: issue.code ?? "invalid",
    severity: "error_draft",
    targetRef: targetRefForIssue(issue, basePath),
    message: messageForZodIssue(issue),
    ...opts.specRef ? { specRef: opts.specRef } : {}
  }));
}

// ../scaffold/src/core/validation/evaluate.ts
function spotlights(finding2, focus) {
  if (!focus) return false;
  const { object_type, object_id } = finding2.targetRef;
  if (focus.object_id != null && object_id !== focus.object_id) return false;
  if (focus.object_type != null && object_type !== focus.object_type) return false;
  return focus.object_id != null || focus.object_type != null;
}
function evaluate(graph, opts = {}) {
  const findings = [];
  if (opts.structuralErrors) {
    const errors = Array.isArray(opts.structuralErrors) ? opts.structuralErrors : [opts.structuralErrors];
    for (const error of errors) findings.push(...zodErrorToFindings(error));
  }
  findings.push(...runSemanticRules(graph, { knownMetricIds: opts.knownMetricIds }));
  if (!opts.focus) return findings;
  return findings.map((f) => spotlights(f, opts.focus) ? { ...f, spotlight: true } : f);
}

// ../scaffold/src/config/models/schema.ts
import { z as z9 } from "zod";

// ../scaffold/src/core/common.ts
import { z as z3 } from "zod";

// ../scaffold/src/core/classification.ts
import { z as z2 } from "zod";

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
var SCHEMA_EXPOSURE_META_KEY = "x-revturbine-schema-exposure";
var READ_ONLY_META_KEY = "readOnly";
var DECISION_ONLY_META_KEY = "x-revturbine-decision-only";
var DecisionOnly = { [DECISION_ONLY_META_KEY]: true };
var ClientSafe = { [SCHEMA_EXPOSURE_META_KEY]: SchemaExposure.External };
var ServerOnly = { [SCHEMA_EXPOSURE_META_KEY]: SchemaExposure.Internal };
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
  return z2.object(writableShape);
}
function toCreateSchema(schema) {
  const writable = toWritableSchema(schema);
  const handleField = writable.shape["handle"];
  if (handleField && typeof handleField.regex === "function") {
    return writable.extend({ handle: handleField.regex(HANDLE_PATTERN) });
  }
  return writable;
}

// ../scaffold/src/core/common.ts
var { Unrestricted } = DataClassification;
var { Transient, Persisted } = SchemaPersistence;
var { Internal, External } = SchemaExposure;
var PaginationParamsSchema = z3.object({
  page: z3.coerce.number().int().min(1).default(1).meta(Unrestricted),
  per_page: z3.coerce.number().int().min(1).max(100).default(25).meta(Unrestricted)
}).meta(
  {
    id: "PaginationParams",
    "x-revturbine-schema-persistence": Transient,
    "x-revturbine-schema-exposure": External
  }
);
var TimestampFields = z3.object({
  created_at: z3.string().datetime().meta({ ...Unrestricted, readOnly: true }),
  updated_at: z3.string().datetime().meta({ ...Unrestricted, readOnly: true })
}).meta(
  {
    id: "null",
    "x-revturbine-schema-persistence": Transient,
    "x-revturbine-schema-exposure": External
  }
);
var IdField = z3.object({
  id: z3.string().min(1).meta({ ...Unrestricted, readOnly: true })
}).meta(
  {
    id: "null",
    "x-revturbine-schema-persistence": Transient,
    "x-revturbine-schema-exposure": External
  }
);
var TenantIdField = z3.object({
  tenant_id: z3.string().min(1, "tenant_id is required").meta({ ...Unrestricted, readOnly: true })
}).meta(
  {
    id: "null",
    "x-revturbine-schema-persistence": Transient,
    "x-revturbine-schema-exposure": Internal
  }
);
var BillingCadenceSchema = z3.enum([
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
var ComponentTypeSchema = z3.enum(COMPONENT_TYPE_VALUES).meta({ id: "ComponentType", "x-revturbine-schema-persistence": Transient, "x-revturbine-schema-exposure": External });
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
var DefaultTemplateIdsSchema = z3.enum(DEFAULT_TEMPLATE_IDS).meta({ id: "DefaultTemplateIds", "x-revturbine-schema-persistence": Transient, "x-revturbine-schema-exposure": Internal });
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
var ENTITLEMENT_STATUS_VALUES = ["allowed", "limited", "denied"];
var PresentationOutcomeSchema = z3.enum(["presented", "clicked", "converted", "dismissed", "reminded", "suppressed"]).meta(
  { id: "PresentationOutcome", "x-revturbine-schema-persistence": Transient, "x-revturbine-schema-exposure": External }
);
var EntitlementTypeSchema = z3.enum([
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
var CurrencySchema = z3.enum(["usd", "eur", "gbp"]).default("usd").meta(
  {
    id: "Currency",
    "x-revturbine-schema-persistence": Transient,
    "x-revturbine-schema-exposure": External
  }
);
var FeatureFlagValueSchema = z3.union([
  z3.boolean(),
  z3.number(),
  z3.string()
]).meta(
  {
    id: "FeatureFlagValue",
    "x-revturbine-schema-persistence": Transient,
    "x-revturbine-schema-exposure": Internal
  }
);
var NameField = z3.string().min(1).max(200);
var HandleField = z3.string().min(1).max(100);
var DescriptionField = z3.string().max(500).optional();
var MetadataField = z3.record(z3.string(), z3.unknown()).default({});
var ThresholdPercentField = z3.number().int().min(10).max(100).multipleOf(10);
var NullableDatetimeField = z3.string().datetime().nullable().default(null);
var AnchorFields = z3.object({
  environment_id: z3.string().min(1).default("production").meta({ ...Unrestricted, readOnly: true })
}).meta({ id: "null", "x-revturbine-schema-persistence": Transient, "x-revturbine-schema-exposure": Internal });
var VersionFields = z3.object({
  // Which playbook version (the review/deploy unit — was `change_set_id`) staged
  // this ledger row; null once it is the deployed live row.
  playbook_version_id: z3.string().nullable().default(null).meta(Unrestricted),
  is_current: z3.boolean().default(true).meta({ ...Unrestricted, readOnly: true }),
  is_deleted: z3.boolean().default(false).meta({ ...Unrestricted, readOnly: true }),
  delete_date: z3.string().datetime().nullable().default(null).meta({ ...Unrestricted, readOnly: true }),
  // Monotonic version number within a lineage (v1, v2, v3 …); `base_sequence` is
  // the live sequence this version was forked from (null for the first version),
  // so a stale draft is detected when live has moved past it.
  sequence: z3.number().int().min(1).default(1).meta({ ...Unrestricted, readOnly: true }),
  base_sequence: z3.number().int().nullable().default(null).meta({ ...Unrestricted, readOnly: true })
}).meta({ id: "null", "x-revturbine-schema-persistence": Transient, "x-revturbine-schema-exposure": Internal });
var AnchorBaseSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).extend({
  handle: HandleField.meta({ ...Unrestricted, readOnly: true }),
  active: z3.boolean().default(true).meta({ ...Unrestricted, readOnly: true })
});
function makeAnchor(id) {
  return AnchorBaseSchema.meta({
    id,
    "x-revturbine-schema-persistence": Persisted,
    "x-revturbine-schema-exposure": Internal
  });
}
var SeveritySchema2 = z3.enum(["info", "warning", "critical"]).meta({ id: "Severity", "x-revturbine-schema-persistence": Transient, "x-revturbine-schema-exposure": Internal });
var CtaActionTypeSchema = z3.enum([
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

// ../scaffold/src/core/identity.ts
import { z as z4 } from "zod";
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
function getSchemaDeprecation(schema) {
  const meta = schema.meta();
  if (meta?.deprecated !== true) return void 0;
  const value = meta[SCHEMA_DEPRECATION_META_KEY];
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

// ../scaffold/src/entitlements/models/schema.ts
import { z as z6 } from "zod";

// ../scaffold/src/core/openapi/helpers.ts
import { z as z5 } from "zod";
var ListEnvelope = (itemSchema) => z5.object({
  items: z5.array(itemSchema)
});
var ErrorEnvelope = z5.object({
  error: z5.string(),
  code: z5.string(),
  request_id: z5.string()
});
var operation = (op) => op;
var ListQueryParamsSchema = z5.object({
  page: z5.number().int().min(1).default(1).optional(),
  per_page: z5.number().int().min(1).max(100).default(25).optional(),
  sort: z5.string().optional(),
  order: z5.enum(["asc", "desc"]).default("asc").optional(),
  include_deleted: z5.boolean().default(false).optional()
});

// ../scaffold/src/entitlements/models/schema.ts
var { Unrestricted: Unrestricted2 } = DataClassification;
var { Persisted: Persisted2, Transient: Transient2 } = SchemaPersistence;
var { Internal: Internal2, External: External2 } = SchemaExposure;
var PLAYBOOK_SDK_FACETS = schemaFacets(SchemaContext.Playbook, { sdkInput: true });
var PENDING_PLAYBOOK_FACETS = schemaFacets(SchemaContext.Playbook, {
  inConfig: false,
  sdkInput: false
});
var UsagePeriodScopeSchema = z6.enum(["per_month", "per_year", "per_billing_period", "lifetime", "concurrent", "per_instance", "per_second", "per_minute", "per_hour", "per_6_hours", "per_day", "per_week"]).meta(
  { id: "UsagePeriodScope", "x-revturbine-schema-persistence": Transient2, "x-revturbine-schema-exposure": External2 }
);
var UsageAllocationSchema = z6.enum(["account_pool", "per_instance", "per_user", "per_user_pooled"]).meta(
  { id: "UsageAllocation", "x-revturbine-schema-persistence": Transient2, "x-revturbine-schema-exposure": External2 }
);
var EntitlementGrantStatusSchema = z6.enum(ENTITLEMENT_STATUS_VALUES).meta(
  { id: "EntitlementGrantStatus", "x-revturbine-schema-persistence": Transient2, "x-revturbine-schema-exposure": External2 }
);
var EntitlementGrantSourceSchema = z6.enum(["rule", "user_context", "override"]).meta(
  { id: "EntitlementGrantSource", "x-revturbine-schema-persistence": Transient2, "x-revturbine-schema-exposure": External2 }
);
var EnforcementModeSchema = z6.enum(["hard_block", "block_with_upsell", "degrade", "allow_overage"]).meta(
  { id: "EnforcementMode", "x-revturbine-schema-persistence": Transient2, "x-revturbine-schema-exposure": External2 }
);
var EntitlementGrantSchema = z6.object({
  entitlement_id: z6.string().min(1).meta(Unrestricted2),
  entitlement_handle: z6.string().min(1).meta(Unrestricted2),
  status: EntitlementGrantStatusSchema.meta(Unrestricted2),
  limit: z6.number().optional().meta(Unrestricted2),
  used: z6.number().optional().meta(Unrestricted2),
  allocation: UsageAllocationSchema.optional().meta(Unrestricted2),
  enforcement: EnforcementModeSchema.optional().meta(Unrestricted2),
  /** How this grant was derived. */
  source: EntitlementGrantSourceSchema.optional().meta(Unrestricted2),
  // ── Derivation context (populated when source = 'rule') ──
  /** The plan that activated this rule-derived grant. */
  plan_id: z6.string().optional().meta(Unrestricted2),
  /** The segment that matched for this rule-derived grant. */
  segment_id: z6.string().optional().meta(Unrestricted2),
  /** The seat type that qualified this grant (when allocation is per-seat). */
  seat_type_id: z6.string().optional().meta(Unrestricted2),
  /** The entitlement rule id that produced this grant. */
  rule_id: z6.string().optional().meta(Unrestricted2)
}).meta(
  {
    id: "EntitlementGrant",
    "x-revturbine-schema-persistence": Transient2,
    "x-revturbine-schema-exposure": External2,
    ...DataClassification.Operational
  }
);
var EntitlementGrantSetSchema = z6.object({
  account: z6.record(z6.string(), EntitlementGrantSchema).optional().meta(Unrestricted2),
  instance: z6.record(z6.string(), EntitlementGrantSchema).optional().meta(Unrestricted2),
  user: z6.record(z6.string(), EntitlementGrantSchema).optional().meta(Unrestricted2)
}).meta(
  {
    id: "EntitlementGrantSet",
    "x-revturbine-schema-persistence": Transient2,
    "x-revturbine-schema-exposure": External2,
    ...DataClassification.Operational
  }
);
var RuleVisibilitySchema = z6.enum(["public", "non_public"]).meta(
  { id: "RuleVisibility", "x-revturbine-schema-persistence": Transient2, "x-revturbine-schema-exposure": External2 }
);
var EntitlementRuleTargetKindSchema = z6.enum(["plan", "plan_variation", "addon", "addon_variation"]).meta(
  { id: "EntitlementRuleTargetKind", "x-revturbine-schema-persistence": Transient2, "x-revturbine-schema-exposure": External2 }
);
var EntitlementRuleTargetSchema = z6.object({
  kind: EntitlementRuleTargetKindSchema.meta(Unrestricted2),
  id: z6.string().min(1).meta(Unrestricted2)
}).meta(
  { id: "EntitlementRuleTarget", "x-revturbine-schema-persistence": Transient2, "x-revturbine-schema-exposure": External2 }
);
var EntitlementRulePeriodUnitSchema = z6.enum(["month", "day", "week", "quarter", "year", "billing_period", "hour", "six_hours"]).meta(
  { id: "EntitlementRulePeriodUnit", "x-revturbine-schema-persistence": Transient2, "x-revturbine-schema-exposure": External2 }
);
var EntitlementSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z6.string().min(1).meta({ ...Unrestricted2, readOnly: true }),
  name: NameField.meta(Unrestricted2),
  handle: HandleField.meta(Unrestricted2),
  customer_facing_description: z6.string().max(500).optional().meta(Unrestricted2),
  type: EntitlementTypeSchema.meta(Unrestricted2),
  unit: z6.string().max(100).optional().meta(Unrestricted2),
  period_scope: UsagePeriodScopeSchema.optional().meta(Unrestricted2),
  allocation: UsageAllocationSchema.optional().meta(Unrestricted2),
  tier_definitions: z6.array(z6.object({
    name: z6.string(),
    handle: z6.string(),
    description: z6.string().optional()
  })).optional().meta(Unrestricted2),
  sort_order: z6.number().int().default(0).meta(Unrestricted2),
  metadata: MetadataField.meta(Unrestricted2)
}).meta(
  {
    id: "Entitlement",
    "x-revturbine-schema-persistence": Persisted2,
    "x-revturbine-schema-exposure": External2,
    ...PLAYBOOK_SDK_FACETS,
    ...namedIdentity()
  }
);
var EntitlementAnchorSchema = makeAnchor("EntitlementAnchor");
var EntitlementRuleSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z6.string().min(1).meta({ ...Unrestricted2, readOnly: true }),
  handle: HandleField.meta({ ...Unrestricted2, readOnly: true }),
  entitlement_id: z6.string().min(1).meta(Unrestricted2),
  targets: z6.array(EntitlementRuleTargetSchema).min(1).meta(Unrestricted2),
  // Segment scoping per spec §2.5: array of segment IDs interpreted with
  // intra-dimension OR + cross-dimension AND at evaluation time. The
  // dimensions registry resolves each ID → dimension. Empty array means
  // "match all users" (replaces the legacy 'all' sentinel).
  segment_ids: z6.array(z6.string()).default([]).meta(Unrestricted2),
  visibility: RuleVisibilitySchema.default("public").meta(Unrestricted2),
  // Usage-Limit "measured over" window, rule-level (plan #55). Rate Limit
  // keeps its entitlement-level `period_scope`; this is the per-rule one.
  period_scope: UsagePeriodScopeSchema.optional().meta(Unrestricted2),
  // Optional instance label, surfaced when `period_scope = 'per_instance'` (F-1).
  instance: z6.string().max(100).optional().meta(Unrestricted2),
  // Credits reset cadence ("refills every"): governs only the per-period
  // `allowance_value` refill. `billing_period` resolves at runtime to the
  // customer's Variation billing period; structural guard below. Absent means
  // one-time only — an `initial_grant` with no recurring refill (plan 147
  // REQ-6; `on_purchase` retired from the enum).
  reset_period: EntitlementRulePeriodUnitSchema.optional().meta(Unrestricted2),
  // Type-specific fields (populated based on entitlement type)
  limit_value: z6.union([z6.number(), z6.literal("unlimited")]).optional().meta(Unrestricted2),
  enforcement: EnforcementModeSchema.optional().meta(Unrestricted2),
  // Usage-warning emitter (plan 138 REQ-13): the percent at which this rule
  // emits a usage-warning crossing event. 10% increments so a placement's
  // `threshold_percent` (same field type) can align with — "should match one
  // of those global values" (placement-studio-ui.md §3.4). Optional; a rule
  // with no warning threshold emits none.
  warning_threshold_percent: ThresholdPercentField.optional().meta(Unrestricted2),
  overage_price_ref: z6.string().optional().meta(Unrestricted2),
  grace_period_hours: z6.number().int().min(0).optional().meta(Unrestricted2),
  tier_value: z6.string().optional().meta(Unrestricted2),
  rate_value: z6.number().optional().meta(Unrestricted2),
  initial_grant: z6.number().optional().meta(Unrestricted2),
  allowance_value: z6.union([z6.number(), z6.literal("unlimited")]).optional().meta(Unrestricted2),
  rollover_enabled: z6.boolean().optional().meta(Unrestricted2),
  // Ceiling on total balance — refills clipped, add-on top-ups bypass.
  // NOT NULL JSONB at the DB level; JSON-null value means "no ceiling."
  max_balance: z6.union([z6.number(), z6.literal("unlimited")]).nullable().default(null).meta(Unrestricted2),
  seat_type_id: z6.string().optional().meta(Unrestricted2),
  included_count: z6.union([z6.number().int(), z6.literal("unlimited")]).optional().meta(Unrestricted2),
  at_limit_behavior: z6.enum(["hard_cap", "auto_upgrade_at_renewal"]).optional().meta(Unrestricted2),
  stripe_metered_price_id: z6.string().optional().meta(Unrestricted2),
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
  enabled: z6.boolean().optional().meta(Unrestricted2),
  // How this rule partitions usage across the identity hierarchy. Rule-level in
  // the IR (`encode.ts` maps `r.allocation`); may default from the parent
  // entitlement's `allocation` when unset.
  allocation: UsageAllocationSchema.optional().meta(Unrestricted2),
  // Seat ceiling. null = unlimited (plan 72); the 999999 export sentinel maps
  // back to null at the compile boundary.
  max_seats: z6.union([z6.number(), z6.literal("unlimited")]).nullable().optional().meta(Unrestricted2),
  // price_per_unit content-rendering fields (OQ-7: persisted-and-rendered, NOT
  // evaluated — no IR/evaluator branch). `unit` derives from the entitlement;
  // `period` maps onto the existing `period_scope` column.
  amount_cents: z6.number().int().optional().meta(Unrestricted2),
  currency: z6.string().optional().meta(Unrestricted2)
}).meta(
  {
    id: "EntitlementRule",
    "x-revturbine-schema-persistence": Persisted2,
    "x-revturbine-schema-exposure": Internal2,
    ...PLAYBOOK_SDK_FACETS,
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
  { id: "EntitlementRuleWarningCode", "x-revturbine-schema-persistence": Transient2, "x-revturbine-schema-exposure": External2 }
);
var EntitlementRuleWarningSchema = z6.object({
  code: EntitlementRuleWarningCodeSchema.meta(Unrestricted2),
  message: z6.string().min(1).meta(Unrestricted2),
  /** Optional dotted field path the warning relates to (e.g. `['targets']`). */
  path: z6.array(z6.union([z6.string(), z6.number().int()])).optional().meta(Unrestricted2)
}).meta(
  { id: "EntitlementRuleWarning", "x-revturbine-schema-persistence": Transient2, "x-revturbine-schema-exposure": External2 }
);
var EntitlementRuleWriteResponseSchema = EntitlementRuleSchema.extend({
  warnings: z6.array(EntitlementRuleWarningSchema).optional().meta(Unrestricted2)
}).meta(
  {
    id: "EntitlementRuleWriteResponse",
    "x-revturbine-schema-persistence": Transient2,
    "x-revturbine-schema-exposure": External2
  }
);
var EntitlementRuleVariantSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  handle: HandleField.meta({ ...Unrestricted2, readOnly: true }),
  rule_id: z6.string().min(1).meta(Unrestricted2),
  experiment_id: z6.string().min(1).meta(Unrestricted2),
  variant_name: z6.string().min(1).max(200).meta(Unrestricted2),
  is_control: z6.boolean().default(false).meta(Unrestricted2),
  override_fields: z6.record(z6.string(), z6.unknown()).default({}).meta(Unrestricted2)
}).meta(
  {
    id: "EntitlementRuleVariant",
    "x-revturbine-schema-persistence": Persisted2,
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

// ../scaffold/src/trials/models/schema.ts
import { z as z7 } from "zod";
var { Unrestricted: Unrestricted3 } = DataClassification;
var { Persisted: Persisted3, Transient: Transient3 } = SchemaPersistence;
var { Internal: Internal3 } = SchemaExposure;
var PLAYBOOK_SDK_FACETS2 = schemaFacets(SchemaContext.Playbook, { sdkInput: true });
var PENDING_PLAYBOOK_SDK_FACETS = schemaFacets(SchemaContext.Playbook, {
  inConfig: false,
  sdkInput: true
});
var TrialStatusSchema = z7.enum(["not_started", "active", "expired", "converted", "cancelled"]).meta(
  { id: "TrialStatus", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": Internal3 }
);
var TrialLimitTypeSchema = z7.enum(["time", "usage"]).meta(
  { id: "TrialLimitType", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": Internal3 }
);
var FreeTrialRuleCoreFieldsSchema = z7.object({
  name: NameField.meta(Unrestricted3),
  handle: HandleField.meta(Unrestricted3),
  // plan_id null = "All plans" — see plans-entitlements-studio-ui.md §2.4.1.
  plan_id: z7.string().nullable().optional().meta(Unrestricted3),
  segment_id: z7.string().nullable().optional().meta(Unrestricted3),
  // Defaults to 'time' so every pre-existing rule keeps its current
  // duration-based semantics. Set to 'usage' to scope the trial by
  // consumption of `usage_entitlement_handle` up to
  // `usage_limit_value`; the time fields below are then ignored.
  trial_limit_type: TrialLimitTypeSchema.default("time").meta(Unrestricted3),
  // Time-based: rule is skipped at runtime when null/blank. The
  // Default Trial Length global was removed (no fallback exists).
  duration_days: z7.number().int().min(1).max(365).nullable().optional().meta(Unrestricted3),
  grace_period_days: z7.number().int().min(0).default(0).meta(Unrestricted3),
  // Usage-based: the entitlement whose consumption gates the trial,
  // and the cap. Both required when `trial_limit_type === 'usage'`;
  // otherwise ignored. Cross-field validation is done at the API
  // boundary (web app's POST handler) rather than here so partial
  // drafts stay round-trippable.
  usage_entitlement_handle: z7.string().min(1).optional().meta(Unrestricted3),
  usage_limit_value: z7.number().int().min(1).optional().meta(Unrestricted3),
  require_payment_method: z7.boolean().default(false).meta(Unrestricted3),
  auto_convert: z7.boolean().default(true).meta(Unrestricted3),
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
  convert_to_plan_id: z7.string().optional().meta(Unrestricted3),
  fallback_plan_id: z7.string().optional().meta(Unrestricted3),
  limit_per_customer: z7.number().int().min(1).default(1).meta(Unrestricted3),
  is_active: z7.boolean().default(true).meta(Unrestricted3),
  metadata: MetadataField.meta(Unrestricted3)
});
var FreeTrialRuleSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z7.string().min(1).meta({ ...Unrestricted3, readOnly: true })
}).merge(FreeTrialRuleCoreFieldsSchema).meta(
  { id: "FreeTrialRule", "x-revturbine-schema-persistence": Persisted3, "x-revturbine-schema-exposure": Internal3, ...PLAYBOOK_SDK_FACETS2, ...namedIdentity() }
);
var FreeTrialRuleAnchorSchema = makeAnchor("FreeTrialRuleAnchor");
var ReverseTrialStartPolicySchema = z7.enum(["signup", "first_premium_access", "manual"]).meta(
  { id: "ReverseTrialStartPolicy", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": Internal3 }
);
var ReverseTrialRuleCoreFieldsSchema = z7.object({
  name: NameField.meta(Unrestricted3),
  handle: HandleField.meta(Unrestricted3),
  premium_plan_id: z7.string().min(1).meta(Unrestricted3),
  fallback_plan_id: z7.string().min(1).meta(Unrestricted3),
  segment_id: z7.string().nullable().optional().meta(Unrestricted3),
  trial_limit_type: TrialLimitTypeSchema.default("time").meta(Unrestricted3),
  duration_days: z7.number().int().min(1).max(365).nullable().optional().meta(Unrestricted3),
  usage_entitlement_handle: z7.string().min(1).optional().meta(Unrestricted3),
  usage_limit_value: z7.number().int().min(1).optional().meta(Unrestricted3),
  start_policy: ReverseTrialStartPolicySchema.default("signup").meta(Unrestricted3),
  show_upgrade_prompt_at_day: z7.number().int().min(0).optional().meta(Unrestricted3),
  entitlements_during_trial: z7.array(z7.string()).default([]).meta(Unrestricted3),
  is_active: z7.boolean().default(true).meta(Unrestricted3),
  metadata: MetadataField.meta(Unrestricted3)
});
var ReverseTrialRuleSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z7.string().min(1).meta({ ...Unrestricted3, readOnly: true })
}).merge(ReverseTrialRuleCoreFieldsSchema).meta(
  { id: "ReverseTrialRule", "x-revturbine-schema-persistence": Persisted3, "x-revturbine-schema-exposure": Internal3, ...PLAYBOOK_SDK_FACETS2, ...namedIdentity() }
);
var ReverseTrialRuleAnchorSchema = makeAnchor("ReverseTrialRuleAnchor");
var TrialLimitPolicySchema = z7.enum(["1_per_lifetime", "1_per_plan", "1_per_year", "unlimited"]).meta(
  { id: "TrialLimitPolicy", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": Internal3 }
);
var TrialEligibilityScopeSchema = z7.enum(["per_customer", "per_email_domain"]).meta(
  { id: "TrialEligibilityScope", "x-revturbine-schema-persistence": Transient3, "x-revturbine-schema-exposure": Internal3 }
);
var FreeTrialSettingsSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  trial_limit_policy: TrialLimitPolicySchema.default("1_per_lifetime").meta(Unrestricted3),
  eligibility_scope: TrialEligibilityScopeSchema.default("per_customer").meta(Unrestricted3)
}).meta(
  { id: "FreeTrialSettings", "x-revturbine-schema-persistence": Persisted3, "x-revturbine-schema-exposure": Internal3, ...PENDING_PLAYBOOK_SDK_FACETS }
);
var ReverseTrialSettingsSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  trial_limit_policy: TrialLimitPolicySchema.default("1_per_lifetime").meta(Unrestricted3),
  eligibility_scope: TrialEligibilityScopeSchema.default("per_customer").meta(Unrestricted3)
}).meta(
  { id: "ReverseTrialSettings", "x-revturbine-schema-persistence": Persisted3, "x-revturbine-schema-exposure": Internal3, ...PENDING_PLAYBOOK_SDK_FACETS }
);
var TrialInstanceSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  customer_id: z7.string().min(1).meta(Unrestricted3),
  rule_id: z7.string().min(1).meta(Unrestricted3),
  rule_type: z7.enum(["free_trial", "reverse_trial"]).meta(Unrestricted3),
  plan_id: z7.string().min(1).meta(Unrestricted3),
  status: TrialStatusSchema.default("active").meta(Unrestricted3),
  started_at: z7.string().datetime().meta({ ...Unrestricted3, readOnly: true }),
  /**
   * Time-based expiry. Required for time-based trials; null for
   * pure usage-based trials (which expire when consumption crosses
   * `usage_limit_value` regardless of clock time).
   */
  expires_at: z7.string().datetime().nullable().optional().meta(Unrestricted3),
  /**
   * Snapshot of the rule's `trial_limit_type` at the moment the
   * instance was created. Persisted so subsequent changes to the
   * rule's mode don't retroactively alter the user's trial
   * semantics. Defaults to 'time' for backward compatibility with
   * pre-existing instances.
   */
  trial_limit_type: TrialLimitTypeSchema.default("time").meta(Unrestricted3),
  /**
   * Snapshot of the rule's `usage_entitlement_handle` for
   * usage-based trials. Server queries the user's current
   * consumption of this entitlement to derive
   * `UserTrialStatus.usage_consumed` at read time.
   */
  usage_entitlement_handle: z7.string().min(1).optional().meta(Unrestricted3),
  /**
   * Snapshot of the rule's `usage_limit_value`. Persisted so
   * mid-trial limit changes on the rule don't shrink/expand a
   * user's in-flight trial.
   */
  usage_limit_value: z7.number().int().min(1).optional().meta(Unrestricted3),
  converted_at: NullableDatetimeField.meta(Unrestricted3),
  cancelled_at: NullableDatetimeField.meta(Unrestricted3),
  metadata: MetadataField.meta(Unrestricted3)
}).meta(
  { id: "TrialInstance", "x-revturbine-schema-persistence": Persisted3, "x-revturbine-schema-exposure": Internal3 }
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
      requestParams: { path: z7.object({ ruleId: z7.string() }) },
      summary: "Get free trial rule",
      tags: ["trials"],
      responses: { "200": { description: "Free trial rule", content: { "application/json": { schema: FreeTrialRuleSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-rules", persistence: { table: "freeTrialRuleVersions", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateFreeTrialRule",
      requestParams: { path: z7.object({ ruleId: z7.string() }) },
      summary: "Update free trial rule",
      tags: ["trials"],
      requestBody: { required: true, content: { "application/json": { schema: FreeTrialRuleSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: FreeTrialRuleSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-rules", persistence: { table: "freeTrialRuleVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteFreeTrialRule",
      requestParams: { path: z7.object({ ruleId: z7.string() }) },
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
      requestParams: { path: z7.object({ ruleId: z7.string() }) },
      summary: "Get reverse trial rule",
      tags: ["trials"],
      responses: { "200": { description: "Reverse trial rule", content: { "application/json": { schema: ReverseTrialRuleSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "reverse-trial-rules", persistence: { table: "reverseTrialRuleVersions", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateReverseTrialRule",
      requestParams: { path: z7.object({ ruleId: z7.string() }) },
      summary: "Update reverse trial rule",
      tags: ["trials"],
      requestBody: { required: true, content: { "application/json": { schema: ReverseTrialRuleSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: ReverseTrialRuleSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "reverse-trial-rules", persistence: { table: "reverseTrialRuleVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteReverseTrialRule",
      requestParams: { path: z7.object({ ruleId: z7.string() }) },
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
      requestParams: { path: z7.object({ settingsId: z7.string() }) },
      summary: "Get free trial settings",
      tags: ["trials"],
      responses: { "200": { description: "Free trial settings", content: { "application/json": { schema: FreeTrialSettingsSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "free-trial-settings", persistence: { table: "freeTrialSettings", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateFreeTrialSettings",
      requestParams: { path: z7.object({ settingsId: z7.string() }) },
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
      requestParams: { path: z7.object({ settingsId: z7.string() }) },
      summary: "Get reverse trial settings",
      tags: ["trials"],
      responses: { "200": { description: "Reverse trial settings", content: { "application/json": { schema: ReverseTrialSettingsSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "reverse-trial-settings", persistence: { table: "reverseTrialSettings", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateReverseTrialSettings",
      requestParams: { path: z7.object({ settingsId: z7.string() }) },
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
      requestParams: { path: z7.object({ instanceId: z7.string() }) },
      summary: "Get trial instance",
      tags: ["trials"],
      responses: { "200": { description: "Trial instance", content: { "application/json": { schema: TrialInstanceSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-instances", persistence: { table: "trialInstances", mode: "get" } }
    })
  },
  "/api/trials/instances/{instanceId}/cancel": {
    post: operation({
      operationId: "cancelTrialInstance",
      requestParams: { path: z7.object({ instanceId: z7.string() }) },
      summary: "Cancel an active trial",
      tags: ["trials"],
      responses: { "200": { description: "Cancelled", content: { "application/json": { schema: TrialInstanceSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-instances", persistence: { table: "trialInstances", mode: "update" } }
    })
  },
  "/api/trials/instances/{instanceId}/convert": {
    post: operation({
      operationId: "convertTrialInstance",
      requestParams: { path: z7.object({ instanceId: z7.string() }) },
      summary: "Convert trial to paid subscription",
      tags: ["trials"],
      requestBody: { required: true, content: { "application/json": { schema: z7.object({ plan_id: z7.string().optional() }) } } },
      responses: { "200": { description: "Converted", content: { "application/json": { schema: TrialInstanceSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "trial-instances", persistence: { table: "trialInstances", mode: "update" } }
    })
  }
};

// ../scaffold/src/plans/models/schema.ts
import { z as z8 } from "zod";
var { Unrestricted: Unrestricted4, Financial } = DataClassification;
var { Persisted: Persisted4, Transient: Transient4 } = SchemaPersistence;
var { External: External3 } = SchemaExposure;
var PLAYBOOK_SDK_FACETS3 = schemaFacets(SchemaContext.Playbook, { sdkInput: true });
var PLAYBOOK_AUTHORING_FACETS = schemaFacets(SchemaContext.Playbook, { sdkInput: false });
var BILLING_FACETS = schemaFacets(SchemaContext.Billing, { sdkInput: false });
var PlanVisibilitySchema = z8.enum(["public", "unlisted", "legacy"]).meta(
  {
    id: "PlanVisibility",
    "x-revturbine-schema-persistence": Transient4,
    "x-revturbine-schema-exposure": External3
  }
);
var PricingModelSchema = z8.enum(["flat", "per_unit", "tiered", "metered"]).meta(
  {
    id: "PricingModel",
    "x-revturbine-schema-persistence": Transient4,
    "x-revturbine-schema-exposure": External3
  }
);
var PriceSourceSchema = z8.enum(["stripe", "static"]).meta(
  {
    id: "PriceSource",
    "x-revturbine-schema-persistence": Transient4,
    "x-revturbine-schema-exposure": External3
  }
);
var PlanSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z8.string().min(1).meta({ ...Unrestricted4, readOnly: true }),
  name: NameField.meta(Unrestricted4),
  handle: HandleField.meta(Unrestricted4),
  tier_position: z8.number().int().min(0).default(0).meta(Unrestricted4),
  sort_order: z8.number().int().default(0).meta(Unrestricted4),
  // Plan-level visibility default (plan 91 Part B). Distinct from the
  // per-variation `PlanVariationSchema.visibility`: a free/custom tier with no
  // priced variation can still be unlisted/legacy. Persisted so it round-trips
  // (plan 146 found it was declared on the portable config but had no column).
  visibility: PlanVisibilitySchema.default("public").meta(Unrestricted4),
  metadata: MetadataField.meta(Unrestricted4)
}).meta(
  {
    id: "Plan",
    "x-revturbine-schema-persistence": Persisted4,
    "x-revturbine-schema-exposure": External3,
    ...PLAYBOOK_SDK_FACETS3,
    ...namedIdentity()
  }
);
var PlanAnchorSchema = makeAnchor("PlanAnchor");
var PlanVariationSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z8.string().min(1).meta({ ...Unrestricted4, readOnly: true }),
  handle: HandleField.meta({ ...Unrestricted4, readOnly: true }),
  plan_id: z8.string().min(1).meta(Unrestricted4),
  billing_period: z8.enum(["monthly", "annual", "one_time", "custom"]).meta(Unrestricted4),
  segment_id: z8.string().nullable().default(null).meta(Unrestricted4),
  price_amount: z8.number().min(0).meta(Financial),
  pricing_model: PricingModelSchema.meta(Unrestricted4),
  visibility: PlanVisibilitySchema.default("public").meta(Unrestricted4),
  // Soft reference → StripePrice.stripe_price_id (the backend Stripe-price mirror).
  // No DB foreign key: stripe_price_id lives on the append-only version tables and
  // a hard FK would block plan-122 price-deletion sync (plan 118 FK decision, devkit #472).
  stripe_price_id: z8.string().optional().meta(Unrestricted4),
  price_source: PriceSourceSchema.default("static").meta(Unrestricted4)
}).meta(
  {
    id: "PlanVariation",
    "x-revturbine-schema-persistence": Persisted4,
    "x-revturbine-schema-exposure": External3,
    ...BILLING_FACETS,
    ...mintedIdentity()
  }
);
var PlanVariationAnchorSchema = makeAnchor("PlanVariationAnchor");
var AddOnSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z8.string().min(1).meta({ ...Unrestricted4, readOnly: true }),
  name: NameField.meta(Unrestricted4),
  handle: HandleField.meta(Unrestricted4),
  sort_order: z8.number().int().default(0).meta(Unrestricted4),
  // Add-on visibility default — same rationale as PlanSchema (plan 91 Part B);
  // metadata, not price, so it lives on the add-on independent of variations.
  visibility: PlanVisibilitySchema.default("public").meta(Unrestricted4),
  metadata: MetadataField.meta(Unrestricted4)
}).meta(
  {
    id: "AddOn",
    "x-revturbine-schema-persistence": Persisted4,
    "x-revturbine-schema-exposure": External3,
    ...PLAYBOOK_AUTHORING_FACETS,
    ...namedIdentity()
  }
);
var AddOnAnchorSchema = makeAnchor("AddOnAnchor");
var AddOnVariationSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z8.string().min(1).meta({ ...Unrestricted4, readOnly: true }),
  handle: HandleField.meta({ ...Unrestricted4, readOnly: true }),
  addon_id: z8.string().min(1).meta(Unrestricted4),
  // 'one_time' is first-class — Stripe one-time Prices (credit packs,
  // expansion packages) bind here without coercion to 'custom'.
  billing_period: z8.enum(["monthly", "annual", "one_time", "custom"]).meta(Unrestricted4),
  segment_id: z8.string().nullable().default(null).meta(Unrestricted4),
  price_amount: z8.number().min(0).meta(Financial),
  pricing_model: PricingModelSchema.meta(Unrestricted4),
  visibility: PlanVisibilitySchema.default("public").meta(Unrestricted4),
  // Soft reference → StripePrice.stripe_price_id (the backend Stripe-price mirror).
  // No DB foreign key: stripe_price_id lives on the append-only version tables and
  // a hard FK would block plan-122 price-deletion sync (plan 118 FK decision, devkit #472).
  stripe_price_id: z8.string().optional().meta(Unrestricted4),
  price_source: PriceSourceSchema.default("static").meta(Unrestricted4)
}).meta(
  {
    id: "AddOnVariation",
    "x-revturbine-schema-persistence": Persisted4,
    "x-revturbine-schema-exposure": External3,
    ...BILLING_FACETS,
    ...mintedIdentity()
  }
);
var AddOnVariationAnchorSchema = makeAnchor("AddOnVariationAnchor");
var StripePriceBillingPeriodSchema = z8.enum(["monthly", "annual", "one_time", "custom"]).meta({
  id: "StripePriceBillingPeriod",
  "x-revturbine-schema-persistence": Transient4,
  "x-revturbine-schema-exposure": External3
});
var StripePriceSchema = IdField.merge(TimestampFields).merge(TenantIdField).extend({
  stripe_price_id: z8.string().min(1).meta(Unrestricted4),
  stripe_product_id: z8.string().min(1).meta(Unrestricted4),
  billing_period: StripePriceBillingPeriodSchema.meta(Unrestricted4),
  unit_amount_cents: z8.number().int().min(0).nullable().default(null).meta(Financial),
  currency: CurrencySchema.meta(Financial),
  pricing_model: PricingModelSchema.meta(Unrestricted4),
  nickname: z8.string().nullable().default(null).meta(Unrestricted4),
  // Placeholder/seed price (demo or pre-integration tenants) vs a real
  // Stripe-synced mirror row. Migration backfills existing seed rows to true.
  is_mock: z8.boolean().default(false).meta(Unrestricted4),
  // Timestamp of the last successful sync from Stripe; null for rows that were
  // never sourced from a real Stripe Price (seeds/mocks).
  last_updated_from_stripe: NullableDatetimeField.meta(Unrestricted4)
}).meta({
  id: "StripePrice",
  "x-revturbine-schema-persistence": Persisted4,
  "x-revturbine-schema-exposure": External3,
  ...BILLING_FACETS
});
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
      requestParams: { path: z8.object({ planId: z8.string() }) },
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
      requestParams: { path: z8.object({ planId: z8.string() }) },
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
      requestParams: { path: z8.object({ planId: z8.string() }) },
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
      requestBody: { required: true, content: { "application/json": { schema: z8.object({ ids: z8.array(z8.string()) }) } } },
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
      requestParams: { path: z8.object({ planId: z8.string() }), query: ListQueryParamsSchema },
      summary: "List plan variations",
      tags: ["plans"],
      responses: { "200": { description: "Plan variations", content: { "application/json": { schema: ListEnvelope(PlanVariationSchema) } } } },
      "x-revturbine-operation": { exposure: "external", resource: "plan-variations", persistence: { table: "planVariationVersions", mode: "list" } }
    }),
    post: operation({
      operationId: "createPlanVariation",
      requestParams: { path: z8.object({ planId: z8.string() }) },
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
      requestParams: { path: z8.object({ variationId: z8.string() }) },
      summary: "Get plan variation by ID",
      tags: ["plans"],
      responses: { "200": { description: "Plan variation detail", content: { "application/json": { schema: PlanVariationSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "plan-variations", persistence: { table: "planVariationVersions", mode: "get" } }
    }),
    patch: operation({
      operationId: "updatePlanVariation",
      requestParams: { path: z8.object({ variationId: z8.string() }) },
      summary: "Update plan variation",
      tags: ["plans"],
      requestBody: { required: true, content: { "application/json": { schema: PlanVariationWriteSchema } } },
      responses: { "200": { description: "Updated plan variation", content: { "application/json": { schema: PlanVariationSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "plan-variations", persistence: { table: "planVariationVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deletePlanVariation",
      requestParams: { path: z8.object({ variationId: z8.string() }) },
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
      requestParams: { path: z8.object({ addonId: z8.string() }) },
      summary: "Get add-on by ID",
      tags: ["plans"],
      responses: { "200": { description: "Add-on detail", content: { "application/json": { schema: AddOnSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "addons", persistence: { table: "addonVersions", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateAddOn",
      requestParams: { path: z8.object({ addonId: z8.string() }) },
      summary: "Update add-on",
      tags: ["plans"],
      requestBody: { required: true, content: { "application/json": { schema: AddOnWriteSchema } } },
      responses: { "200": { description: "Updated add-on", content: { "application/json": { schema: AddOnSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "addons", persistence: { table: "addonVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteAddOn",
      requestParams: { path: z8.object({ addonId: z8.string() }) },
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
      requestParams: { path: z8.object({ addonId: z8.string() }), query: ListQueryParamsSchema },
      summary: "List add-on variations",
      tags: ["plans"],
      responses: { "200": { description: "Add-on variations", content: { "application/json": { schema: ListEnvelope(AddOnVariationSchema) } } } },
      "x-revturbine-operation": { exposure: "external", resource: "addon-variations", persistence: { table: "addonVariationVersions", mode: "list" } }
    }),
    post: operation({
      operationId: "createAddOnVariation",
      requestParams: { path: z8.object({ addonId: z8.string() }) },
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
      requestParams: { path: z8.object({ variationId: z8.string() }) },
      summary: "Get add-on variation by ID",
      tags: ["plans"],
      responses: { "200": { description: "Add-on variation detail", content: { "application/json": { schema: AddOnVariationSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "addon-variations", persistence: { table: "addonVariationVersions", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateAddOnVariation",
      requestParams: { path: z8.object({ variationId: z8.string() }) },
      summary: "Update add-on variation",
      tags: ["plans"],
      requestBody: { required: true, content: { "application/json": { schema: AddOnVariationWriteSchema } } },
      responses: { "200": { description: "Updated variation", content: { "application/json": { schema: AddOnVariationSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "addon-variations", persistence: { table: "addonVariationVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteAddOnVariation",
      requestParams: { path: z8.object({ variationId: z8.string() }) },
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
      requestParams: { path: z8.object({ id: z8.string() }) },
      summary: "Get Stripe price by ID",
      tags: ["plans"],
      responses: { "200": { description: "Stripe price detail", content: { "application/json": { schema: StripePriceSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "stripe-prices", persistence: { table: "stripePrices", mode: "get" } }
    }),
    patch: operation({
      operationId: "updateStripePrice",
      requestParams: { path: z8.object({ id: z8.string() }) },
      summary: "Update Stripe price",
      tags: ["plans"],
      requestBody: { required: true, content: { "application/json": { schema: StripePriceWriteSchema } } },
      responses: { "200": { description: "Updated Stripe price", content: { "application/json": { schema: StripePriceSchema } } } },
      "x-revturbine-operation": { exposure: "external", resource: "stripe-prices", persistence: { table: "stripePrices", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteStripePrice",
      requestParams: { path: z8.object({ id: z8.string() }) },
      summary: "Delete Stripe price",
      tags: ["plans"],
      responses: { "204": { description: "Stripe price deleted" } },
      "x-revturbine-operation": { exposure: "external", resource: "stripe-prices", persistence: { table: "stripePrices", mode: "delete" } }
    })
  }
};

// ../scaffold/src/config/models/schema.ts
var { Unrestricted: Unrestricted5 } = DataClassification;
var { Persisted: Persisted5, Transient: Transient5 } = SchemaPersistence;
var { Internal: Internal4, External: External4 } = SchemaExposure;
var PLAYBOOK_SDK_FACETS4 = schemaFacets(SchemaContext.Playbook, { sdkInput: true });
var PLAYBOOK_AUTHORING_FACETS2 = schemaFacets(SchemaContext.Playbook, { sdkInput: false });
var PENDING_PLAYBOOK_FACETS2 = schemaFacets(SchemaContext.Playbook, {
  inConfig: false,
  sdkInput: false
});
var PENDING_PLAYBOOK_SDK_FACETS2 = schemaFacets(SchemaContext.Playbook, {
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
var BRANDING_FACETS = schemaFacets(SchemaContext.Branding, { sdkInput: false });
var PLAYBOOK_FORMAT_VERSION = "1.0.0";
var SeatTypeSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z9.string().min(1).meta({ ...Unrestricted5, readOnly: true }),
  name: NameField.meta(Unrestricted5),
  handle: HandleField.meta(Unrestricted5),
  description: DescriptionField.meta(Unrestricted5),
  is_default: z9.boolean().default(false).meta(Unrestricted5),
  entitlement_ids: z9.array(z9.string()).default([]).meta(Unrestricted5),
  metadata: MetadataField.meta(Unrestricted5)
}).meta(
  { id: "SeatType", "x-revturbine-schema-persistence": Persisted5, "x-revturbine-schema-exposure": Internal4, ...PENDING_PLAYBOOK_FACETS2, ...namedIdentity() }
);
var SeatTypeAnchorSchema = makeAnchor("SeatTypeAnchor");
var PersonalizationTokenSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z9.string().min(1).meta({ ...Unrestricted5, readOnly: true }),
  handle: HandleField.meta(Unrestricted5),
  label: z9.string().min(1).meta(Unrestricted5),
  description: z9.string().nullable().default(null).meta(Unrestricted5),
  category: z9.enum(["user", "plan", "usage", "trial", "billing", "promotion", "custom"]).meta(Unrestricted5),
  data_source: z9.string().nullable().default(null).meta(Unrestricted5),
  example_value: z9.string().nullable().default(null).meta(Unrestricted5),
  value_map: z9.record(z9.string(), z9.string()).default({}).meta(Unrestricted5),
  format: z9.enum(["string", "number", "currency", "percentage", "date"]).nullable().default(null).meta(Unrestricted5),
  metadata: MetadataField.meta(Unrestricted5)
}).meta(
  { id: "PersonalizationToken", "x-revturbine-schema-persistence": Persisted5, "x-revturbine-schema-exposure": Internal4, ...PENDING_PLAYBOOK_FACETS2, ...namedIdentity() }
);
var PersonalizationTokenAnchorSchema = makeAnchor("PersonalizationTokenAnchor");
var OnboardingStateSchema = z9.enum(["not_started", "started", "details_submitted", "charges_enabled", "activated", "deauthorized"]).meta({ id: "OnboardingState", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": Internal4 });
var StripeIntegrationConfigSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  handle: HandleField.meta({ ...Unrestricted5, readOnly: true }),
  stripe_account_id: z9.string().min(1).meta(Unrestricted5),
  live_mode: z9.boolean().default(false).meta(Unrestricted5),
  /** Funnel state for the Connect onboarding pipeline. */
  onboarding_state: OnboardingStateSchema.default("not_started").meta({ ...Unrestricted5, readOnly: true }),
  /** Connect onboarding status — tracks whether hosted onboarding is complete. */
  onboarding_complete: z9.boolean().default(false).meta({ ...Unrestricted5, readOnly: true }),
  /** Whether the connected account can process charges (read from Stripe). */
  charges_enabled: z9.boolean().default(false).meta({ ...Unrestricted5, readOnly: true }),
  /** Whether the connected account has details submitted (read from Stripe). */
  details_submitted: z9.boolean().default(false).meta({ ...Unrestricted5, readOnly: true }),
  /** Whether the connected account can receive payouts (read from Stripe). */
  payouts_enabled: z9.boolean().default(false).meta({ ...Unrestricted5, readOnly: true }),
  webhook_secret_set: z9.boolean().default(false).meta({ ...Unrestricted5, readOnly: true }),
  sync_products: z9.boolean().default(true).meta(Unrestricted5),
  sync_prices: z9.boolean().default(true).meta(Unrestricted5),
  sync_subscriptions: z9.boolean().default(true).meta(Unrestricted5),
  sync_invoices: z9.boolean().default(false).meta(Unrestricted5),
  default_currency: z9.string().length(3).default("USD").meta(Unrestricted5),
  tax_behavior: z9.enum(["inclusive", "exclusive", "unspecified"]).default("unspecified").meta(Unrestricted5),
  /** ISO timestamp of the last successful full data sync from Stripe. */
  last_sync_at: z9.string().optional().meta({ ...Unrestricted5, readOnly: true }),
  metadata: MetadataField.meta(Unrestricted5)
}).meta(
  { id: "StripeIntegrationConfig", "x-revturbine-schema-persistence": Persisted5, "x-revturbine-schema-exposure": Internal4, ...BILLING_FACETS2, ...mintedIdentity() }
);
var BrandingConfigSchema = z9.object({
  theme: z9.record(z9.string(), z9.unknown()).optional().meta(Unrestricted5),
  workspace_name: z9.string().optional().meta(Unrestricted5),
  logo_url: z9.string().optional().meta(Unrestricted5),
  support_email: z9.string().optional().meta(Unrestricted5)
}).meta(
  {
    id: "BrandingConfig",
    "x-revturbine-schema-persistence": Transient5,
    "x-revturbine-schema-exposure": External4,
    ...BRANDING_FACETS
  }
);
var MeteringConfigSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  handle: HandleField.meta({ ...Unrestricted5, readOnly: true }),
  entitlement_id: z9.string().min(1).meta(Unrestricted5),
  meter_key: z9.string().min(1).max(100).meta(Unrestricted5),
  aggregation_type: z9.enum(["sum", "count", "max", "last_value"]).default("sum").meta(Unrestricted5),
  reset_period: z9.enum(["none", "daily", "weekly", "monthly", "yearly"]).default("monthly").meta(Unrestricted5),
  stripe_meter_id: z9.string().nullable().default(null).meta(Unrestricted5),
  is_active: z9.boolean().default(true).meta(Unrestricted5),
  metadata: MetadataField.meta(Unrestricted5)
}).meta(
  { id: "MeteringConfig", "x-revturbine-schema-persistence": Persisted5, "x-revturbine-schema-exposure": Internal4, ...METERING_FACETS, ...mintedIdentity() }
);
var EnforcementActionSchema = z9.enum(["block", "warn", "downgrade", "throttle", "notify_admin", "custom"]).meta(
  { id: "EnforcementAction", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": Internal4 }
);
var UsageEnforcementSettingsSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z9.string().min(1).meta({ ...Unrestricted5, readOnly: true }),
  handle: HandleField.meta({ ...Unrestricted5, readOnly: true }),
  entitlement_id: z9.string().min(1).meta(Unrestricted5),
  soft_limit_percent: z9.number().min(0).max(100).default(80).meta(Unrestricted5),
  hard_limit_percent: z9.number().min(0).max(100).default(100).meta(Unrestricted5),
  soft_limit_action: EnforcementActionSchema.default("warn").meta(Unrestricted5),
  hard_limit_action: EnforcementActionSchema.default("block").meta(Unrestricted5),
  grace_period_hours: z9.number().int().min(0).default(0).meta(Unrestricted5),
  notification_channels: z9.array(z9.enum(["email", "in_app", "webhook"])).default(["in_app"]).meta(Unrestricted5),
  is_active: z9.boolean().default(true).meta(Unrestricted5)
}).meta(
  { id: "UsageEnforcementSettings", "x-revturbine-schema-persistence": Persisted5, "x-revturbine-schema-exposure": Internal4, ...PENDING_PLAYBOOK_SDK_FACETS2, ...mintedIdentity() }
);
var UsageEnforcementSettingsAnchorSchema = makeAnchor("UsageEnforcementSettingsAnchor");
var PlacementSettingsCapRuleGroupItemSchema = z9.object({
  kind: z9.enum(["template", "slot"]).meta(Unrestricted5),
  id: z9.string().min(1).meta(Unrestricted5),
  label: z9.string().min(1).optional().meta(Unrestricted5)
}).meta(
  { id: "PlacementSettingsCapRuleGroupItem", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": Internal4 }
);
var PlacementSettingsCapRuleSchema = z9.object({
  id: z9.string().min(1).meta(Unrestricted5),
  group: z9.array(PlacementSettingsCapRuleGroupItemSchema).min(1).meta(Unrestricted5),
  cap: z9.object({
    count: z9.number().int().min(1).meta(Unrestricted5),
    period: z9.enum(["session", "day", "week", "month"]).meta(Unrestricted5)
  }).meta(Unrestricted5)
}).meta(
  { id: "PlacementSettingsCapRule", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": Internal4 }
);
var PlacementTestModeSchema = z9.enum(["off", "test_users", "all_traffic"]).meta(
  { id: "PlacementTestMode", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": Internal4 }
);
var PlacementSettingsCapStateSchema = z9.object({
  capRules: z9.array(PlacementSettingsCapRuleSchema).default([]).meta(Unrestricted5),
  sessionCooldownMinutes: z9.number().int().min(0).default(30).meta(Unrestricted5),
  // Tenant-level default remind-me-later (defer) window, in minutes. A
  // per-payload `remind_later_minutes` overrides it when set (plan 167 REQ-6,
  // Q-3). Rides in this global_frequency_cap jsonb wrapper — no column/`.fbs`.
  remindLaterMinutes: z9.number().int().min(0).default(60).meta(Unrestricted5),
  testMode: PlacementTestModeSchema.default("off").meta(Unrestricted5)
}).meta(
  { id: "PlacementSettingsCapState", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": Internal4 }
);
var PlacementSettingsSchema = IdField.merge(TimestampFields).merge(TenantIdField).merge(AnchorFields).merge(VersionFields).extend({
  anchor_id: z9.string().min(1).meta({ ...Unrestricted5, readOnly: true }),
  handle: HandleField.meta({ ...Unrestricted5, readOnly: true }),
  global_frequency_cap: PlacementSettingsCapStateSchema.nullable().default(null).meta(Unrestricted5),
  // Legacy companion column kept for migration continuity. The new
  // wrapper-object encoding above carries period information per
  // cap rule; this column is always null in v0.1.20+ writes.
  global_frequency_cap_period: z9.enum(["hour", "day", "week", "month", "session"]).nullable().default(null).meta(Unrestricted5),
  suppress_for_paid: z9.boolean().default(false).meta(Unrestricted5),
  suppress_for_trial: z9.boolean().default(false).meta(Unrestricted5),
  // `default_dismiss_cooldown_hours` removed (plan 167 Q-2): the dismiss
  // cooldown is defined per-payload in days (`cooldown_after_dismiss_days`).
  allow_stacking: z9.boolean().default(false).meta(Unrestricted5),
  priority_collision_strategy: z9.enum(["highest_priority", "most_recent", "random"]).default("highest_priority").meta(Unrestricted5)
}).meta(
  { id: "PlacementSettings", "x-revturbine-schema-persistence": Persisted5, "x-revturbine-schema-exposure": Internal4, ...PENDING_PLAYBOOK_SDK_FACETS2, ...mintedIdentity() }
);
var PlacementSettingsAnchorSchema = makeAnchor("PlacementSettingsAnchor");
var RevTurbineConfigSegmentsItemPredicatesItemSchema = z9.object({
  field: z9.string().min(1).meta(Unrestricted5),
  operator: z9.enum(["eq", "neq", "gt", "lt", "gte", "lte", "contains", "in"]).meta(Unrestricted5),
  value: z9.string().meta(Unrestricted5)
}).meta(
  { id: "RevTurbineConfigSegmentsItemPredicatesItem", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4 }
);
var RevTurbineConfigSegmentsItemSchema = z9.object({
  // Plan 120 TASK-4: the config carries the handle as its sole logical
  // identifier — the redundant config-level `id` is dropped. The physical
  // UUID primary key stays in the persisted (Drizzle) row, never the config.
  name: z9.string().min(1).meta(Unrestricted5),
  handle: z9.string().min(1).meta(Unrestricted5),
  predicates: z9.array(RevTurbineConfigSegmentsItemPredicatesItemSchema).optional().meta(Unrestricted5),
  // Dimension this segment belongs to (plan #39 REQ-28 / Route A). Optional
  // for back-compat: pre-plan-39 RevTurbineConfigs and segments not yet
  // categorised lack it. The entitlement-rule evaluator uses this to
  // apply intra-dimension OR + cross-dimension AND per spec §2.5; when
  // missing across all of a rule's segment_ids, the evaluator falls
  // back to flat-OR (legacy single-segment behaviour).
  dimension_id: z9.string().optional().meta(Unrestricted5),
  // Experiment enrollment carries the canonical, version-stable handle.
  // The old name stays readable through plan 199's alias window.
  experiment_handle: z9.string().min(1).optional().meta(Unrestricted5),
  /** @deprecated Read-only compatibility alias for `experiment_handle`. */
  experiment_id: z9.string().min(1).optional().meta(Unrestricted5)
}).meta(
  { id: "RevTurbineConfigSegmentsItem", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4, ...PLAYBOOK_SDK_FACETS4 }
);
var RevTurbineConfigPlansItemSchema = z9.object({
  // Plan 120 TASK-4: `unique_handle` is the sole logical identifier; the
  // redundant config-level `id` is dropped (physical UUID PK stays in the row).
  unique_handle: z9.string().min(1).meta(Unrestricted5),
  name: z9.string().min(1).meta(Unrestricted5),
  tier_position: z9.number().int().min(0).default(0).meta(Unrestricted5),
  sort_order: z9.number().int().min(0).default(0).meta(Unrestricted5),
  // Plan-level visibility (to_do/91 Part B). Lives on the plan, not a
  // priced variation, so a free/custom tier with no variation can still be
  // marked unlisted/legacy and round-trip. Variations may still carry their
  // own visibility for per-price overrides; this is the plan's default.
  visibility: PlanVisibilitySchema.default("public").meta(Unrestricted5)
}).meta(
  { id: "RevTurbineConfigPlansItem", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4, ...PLAYBOOK_SDK_FACETS4 }
);
var RevTurbineConfigAddonsItemSchema = z9.object({
  // Plan 120 TASK-4: `unique_handle` is the sole logical identifier; the
  // redundant config-level `id` is dropped (physical UUID PK stays in the row).
  unique_handle: z9.string().min(1).meta(Unrestricted5),
  name: z9.string().min(1).meta(Unrestricted5),
  sort_order: z9.number().int().min(0).default(0).meta(Unrestricted5),
  // Add-on visibility (to_do/91 Part B) — same rationale as plans: metadata,
  // not price, so it lives in the config independent of addon_variations.
  visibility: PlanVisibilitySchema.default("public").meta(Unrestricted5)
}).meta(
  { id: "RevTurbineConfigAddonsItem", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4, ...PLAYBOOK_AUTHORING_FACETS2 }
);
var RevTurbineConfigPlanVariationsItemSchema = z9.object({
  handle: z9.string().min(1).meta(Unrestricted5),
  plan_handle: z9.string().min(1).meta(Unrestricted5),
  billing_period: z9.enum(["monthly", "annual", "one_time", "custom"]).meta(Unrestricted5),
  segment_handle: z9.string().nullable().default(null).meta(Unrestricted5),
  price_amount: z9.number().min(0).meta(Unrestricted5),
  pricing_model: PricingModelSchema.meta(Unrestricted5),
  visibility: PlanVisibilitySchema.default("public").meta(Unrestricted5),
  stripe_price_id: z9.string().nullable().default(null).meta(Unrestricted5),
  price_source: PriceSourceSchema.meta(Unrestricted5)
}).meta(
  { id: "RevTurbineConfigPlanVariationsItem", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4, ...PENDING_PLAYBOOK_FACETS2 }
);
var RevTurbineConfigAddonVariationsItemSchema = z9.object({
  handle: z9.string().min(1).meta(Unrestricted5),
  addon_handle: z9.string().min(1).meta(Unrestricted5),
  billing_period: z9.enum(["monthly", "annual", "one_time", "custom"]).meta(Unrestricted5),
  segment_handle: z9.string().nullable().default(null).meta(Unrestricted5),
  price_amount: z9.number().min(0).meta(Unrestricted5),
  pricing_model: PricingModelSchema.meta(Unrestricted5),
  visibility: PlanVisibilitySchema.default("public").meta(Unrestricted5),
  stripe_price_id: z9.string().nullable().default(null).meta(Unrestricted5),
  price_source: PriceSourceSchema.meta(Unrestricted5)
}).meta(
  { id: "RevTurbineConfigAddonVariationsItem", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4, ...PENDING_PLAYBOOK_FACETS2 }
);
var RevTurbineConfigSeatTypesItemSchema = z9.object({
  handle: z9.string().min(1).meta(Unrestricted5),
  name: z9.string().min(1).meta(Unrestricted5),
  description: z9.string().nullable().default(null).meta(Unrestricted5),
  is_default: z9.boolean().default(false).meta(Unrestricted5),
  entitlement_handles: z9.array(z9.string()).default([]).meta(Unrestricted5)
}).meta(
  { id: "RevTurbineConfigSeatTypesItem", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4, ...PLAYBOOK_SDK_FACETS4 }
);
var RevTurbineConfigEnforcementDefaultsItemSchema = z9.object({
  handle: z9.string().min(1).meta(Unrestricted5),
  entitlement_handle: z9.string().nullable().default(null).meta(Unrestricted5),
  soft_limit_percent: z9.number().int().min(0).nullable().default(null).meta(Unrestricted5),
  hard_limit_percent: z9.number().int().min(0).nullable().default(null).meta(Unrestricted5),
  soft_limit_action: z9.string().meta(Unrestricted5),
  hard_limit_action: z9.string().meta(Unrestricted5),
  grace_period_hours: z9.number().int().min(0).nullable().default(null).meta(Unrestricted5),
  notification_channels: z9.array(z9.string()).default([]).meta(Unrestricted5),
  is_active: z9.boolean().default(true).meta(Unrestricted5)
}).meta(
  { id: "RevTurbineConfigEnforcementDefaultsItem", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4, ...PLAYBOOK_SDK_FACETS4 }
);
var RevTurbineConfigPlacementSettingsItemSchema = z9.object({
  handle: z9.string().min(1).meta(Unrestricted5),
  global_frequency_cap: PlacementSettingsCapStateSchema.nullable().default(null).meta(Unrestricted5),
  global_frequency_cap_period: z9.enum(["hour", "day", "week", "month", "session"]).nullable().default(null).meta(Unrestricted5),
  suppress_for_paid: z9.boolean().default(false).meta(Unrestricted5),
  suppress_for_trial: z9.boolean().default(false).meta(Unrestricted5),
  // `default_dismiss_cooldown_hours` removed (plan 167 Q-2).
  allow_stacking: z9.boolean().default(false).meta(Unrestricted5),
  priority_collision_strategy: z9.string().nullable().default(null).meta(Unrestricted5)
}).meta(
  { id: "RevTurbineConfigPlacementSettingsItem", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4, ...PLAYBOOK_SDK_FACETS4 }
);
var RevTurbineConfigSegmentDimensionsItemSchema = z9.object({
  handle: z9.string().min(1).meta(Unrestricted5),
  name: z9.string().min(1).meta(Unrestricted5),
  category: z9.string().nullable().default(null).meta(Unrestricted5),
  visibility_toggle: z9.boolean().default(true).meta(Unrestricted5),
  source_type: z9.string().nullable().default(null).meta(Unrestricted5)
}).meta(
  { id: "RevTurbineConfigSegmentDimensionsItem", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4, ...PLAYBOOK_SDK_FACETS4 }
);
var RevTurbineConfigMeterBindingsItemSchema = z9.object({
  handle: z9.string().min(1).meta(Unrestricted5),
  entitlement_handle: z9.string().min(1).meta(Unrestricted5),
  meter_handle: z9.string().min(1).meta(Unrestricted5),
  limit: z9.number().int().min(0).nullable().default(null).meta(Unrestricted5),
  reset_period: z9.string().nullable().default(null).meta(Unrestricted5)
}).meta(
  { id: "RevTurbineConfigMeterBindingsItem", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4, ...PLAYBOOK_SDK_FACETS4 }
);
var RevTurbineConfigEntitlementsItemSchema = z9.object({
  // Plan 120 TASK-4: `unique_handle` is the sole logical identifier; the
  // redundant config-level `id` is dropped (physical UUID PK stays in the row).
  unique_handle: z9.string().min(1).meta(Unrestricted5),
  name: z9.string().min(1).meta(Unrestricted5),
  type: EntitlementTypeSchema.meta(Unrestricted5),
  unit: z9.string().optional().meta(Unrestricted5),
  // Ordered tier ladder for a `capability_tier` entitlement — projection of
  // the authored `EntitlementSchema.tier_definitions` (plan 138 TASK-4).
  // ARRAY ORDER IS THE RANK: the `entitlement_gate.tier_threshold` placement
  // trigger fires when the user's current tier ranks below the threshold tier
  // on this ladder. `name`/`description` are UI-helper denormalizations (plan
  // 118); the runtime gate reads only the ordered `handle`s.
  tier_definitions: z9.array(z9.object({
    name: z9.string(),
    handle: z9.string(),
    description: z9.string().optional()
  })).optional().meta(Unrestricted5)
}).meta(
  { id: "RevTurbineConfigEntitlementsItem", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4, ...PLAYBOOK_SDK_FACETS4 }
);
var RevTurbineConfigEntitlementRulesItemSchema = z9.object({
  id: z9.string().min(1).meta(Unrestricted5),
  entitlement_id: z9.string().min(1).meta(Unrestricted5),
  targets: z9.array(EntitlementRuleTargetSchema).min(1).meta(Unrestricted5),
  // Plan #39 REQ-1: multi-segment scoping per spec §2.5. Empty array
  // means "match all users" (replaces the singular `segment_id` field
  // and its 'all'/null sentinels).
  segment_ids: z9.array(z9.string()).default([]).meta(Unrestricted5),
  // ── Derived denormalizations from the parent entitlement (plan 147, OQ-6).
  // Resolved via `entitlement_id` on export; ignored on import (the entitlement
  // is authoritative). `readOnly` → excluded from round-trip obligations: they
  // are computed, not authored, so requiring a sentinel to preserve them would
  // test derivation rather than authoring fidelity.
  kind: EntitlementTypeSchema.optional().meta({ ...Unrestricted5, readOnly: true }),
  unit: z9.string().optional().meta({ ...Unrestricted5, readOnly: true }),
  tier_name: z9.string().optional().meta({ ...Unrestricted5, readOnly: true }),
  tier_description: z9.string().optional().meta({ ...Unrestricted5, readOnly: true }),
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
  current_usage: z9.number().default(0).meta(Unrestricted5),
  /** How usage is partitioned across the identity hierarchy. */
  allocation: UsageAllocationSchema.optional().meta(Unrestricted5)
}).meta(
  { id: "RevTurbineConfigEntitlementRulesItem", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4, ...PLAYBOOK_SDK_FACETS4 }
);
var RevTurbineConfigSlotConfigsItemSchema = z9.object({
  slot_id: z9.string().min(1).meta(Unrestricted5),
  active: z9.boolean().meta(Unrestricted5),
  triggers: z9.array(z9.string()).meta(Unrestricted5)
}).meta(
  { id: "RevTurbineConfigSlotConfigsItem", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4, ...PLAYBOOK_SDK_FACETS4 }
);
var RevTurbineConfigPlacementSlotsItemSchema = z9.object({
  id: z9.string().min(1).meta(Unrestricted5),
  label: z9.string().min(1).meta(Unrestricted5),
  description: z9.string().meta(Unrestricted5),
  surface_type: z9.string().meta(Unrestricted5),
  placement_handle: z9.string().min(1).meta(Unrestricted5),
  template: z9.string().optional().meta(Unrestricted5)
}).meta(
  { id: "RevTurbineConfigPlacementSlotsItem", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4, ...PLAYBOOK_SDK_FACETS4 }
);
var RevTurbineConfigSurfaceTemplatesItemFieldsItemSchema = z9.object({
  name: z9.string().min(1).meta(Unrestricted5),
  type: z9.string().optional().meta(Unrestricted5),
  required: z9.boolean().optional().meta(Unrestricted5)
}).meta(
  { id: "RevTurbineConfigSurfaceTemplatesItemFieldsItem", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4 }
);
var RevTurbineConfigSurfaceTemplatesItemSchema = z9.object({
  id: z9.string().min(1).meta(Unrestricted5),
  surface_type: z9.string().meta(Unrestricted5),
  fields: z9.array(RevTurbineConfigSurfaceTemplatesItemFieldsItemSchema).optional().meta(Unrestricted5)
}).meta(
  { id: "RevTurbineConfigSurfaceTemplatesItem", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4, ...PLAYBOOK_SDK_FACETS4 }
);
var RevTurbineConfigUiPathActionTypeSchema = z9.enum([
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
  { id: "RevTurbineConfigUiPathActionType", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4 }
);
var ContentUiPathSchema = z9.object({
  name: z9.string().min(1).meta(Unrestricted5),
  action_type: RevTurbineConfigUiPathActionTypeSchema.meta(Unrestricted5),
  plan_handle: z9.string().optional().meta(Unrestricted5),
  promotion_id: z9.string().optional().meta(Unrestricted5),
  placement_handle: z9.string().optional().meta(Unrestricted5),
  url: z9.string().optional().meta(Unrestricted5),
  tour_id: z9.string().optional().meta(Unrestricted5),
  target_billing_period: z9.enum(["monthly", "annual"]).optional().meta(Unrestricted5),
  description: z9.string().optional().meta(Unrestricted5)
}).meta(
  { id: "ContentUiPath", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4, ...PLAYBOOK_SDK_FACETS4 }
);
var ContentPromotionSchema = z9.object({
  id: z9.string().meta(Unrestricted5),
  name: z9.string().meta(Unrestricted5),
  discount: z9.string().meta(Unrestricted5),
  type: z9.string().meta(Unrestricted5),
  status: z9.string().meta(Unrestricted5)
}).meta(
  { id: "ContentPromotion", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4, ...PLAYBOOK_SDK_FACETS4 }
);
var RevTurbineConfigPersonalizationTokensItemSchema = z9.object({
  token: z9.string().regex(/^[a-z][a-z0-9_]*$/).meta(Unrestricted5),
  label: z9.string().min(1).meta(Unrestricted5),
  description: z9.string().optional().meta(Unrestricted5),
  category: z9.enum(["user", "plan", "usage", "trial", "billing", "promotion", "custom"]).meta(Unrestricted5),
  data_source: z9.string().optional().meta(Unrestricted5),
  example_value: z9.string().optional().meta(Unrestricted5),
  value_map: z9.record(z9.string(), z9.string()).optional().meta(Unrestricted5),
  format: z9.enum(["string", "number", "currency", "percentage", "date"]).optional().meta(Unrestricted5)
}).meta(
  { id: "RevTurbineConfigPersonalizationTokensItem", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4, ...PLAYBOOK_SDK_FACETS4 }
);
var MessageBlockContentSchema = z9.object({
  header: z9.string().optional().meta(Unrestricted5),
  body: z9.string().optional().meta(Unrestricted5),
  cta_label: z9.string().optional().meta(Unrestricted5),
  secondary_cta_label: z9.string().optional().meta(Unrestricted5)
}).catchall(z9.unknown()).meta(
  { id: "MessageBlockContent", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4 }
);
var MessageBlockSchema = z9.object({
  block_id: z9.string().min(1).meta(Unrestricted5),
  tenant_id: z9.string().min(1).meta(Unrestricted5),
  name: z9.string().min(1).meta(Unrestricted5),
  surface_template_id: z9.string().optional().meta(Unrestricted5),
  default_content: MessageBlockContentSchema.meta(Unrestricted5),
  segment_overrides: z9.array(z9.object({
    segment_value_id: z9.string(),
    content: MessageBlockContentSchema
  })).optional().meta(Unrestricted5),
  child_blocks: z9.array(z9.object({
    slot: z9.string(),
    block_id: z9.string()
  })).optional().meta(Unrestricted5),
  tokens_used: z9.array(z9.string()).optional().meta(Unrestricted5),
  status: z9.enum(["draft", "active", "archived"]).meta(Unrestricted5),
  created_at: z9.string().datetime().meta({ ...Unrestricted5, readOnly: true }),
  updated_at: z9.string().datetime().meta({ ...Unrestricted5, readOnly: true })
}).meta(
  { id: "MessageBlock", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4, ...PLAYBOOK_SDK_FACETS4 }
);
var RevTurbineConfigStudioCtaConfigSchema = z9.object({
  label: z9.string().meta(Unrestricted5),
  path: CtaActionTypeSchema.meta(Unrestricted5),
  config: z9.record(z9.string(), z9.string()).optional().meta(Unrestricted5)
}).meta(
  { id: "RevTurbineConfigStudioCtaConfig", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4 }
);
var RevTurbineConfigStudioPayloadSurfaceSchema = z9.object({
  template_id: z9.string().min(1).meta(Unrestricted5),
  fields: z9.record(z9.string(), z9.string()).meta(Unrestricted5),
  ctas: z9.array(RevTurbineConfigStudioCtaConfigSchema).meta(Unrestricted5)
}).meta(
  { id: "RevTurbineConfigStudioPayloadSurface", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4 }
);
var RevTurbineConfigStudioPayloadTargetSchema = z9.object({
  plan_ids: z9.array(z9.string()).meta(Unrestricted5),
  // Billing-cadence dimension of the Plan Filter (spec §3.1.1 Target).
  // Empty/absent = no cadence filter. Optional so pre-plan-76 exports parse.
  billing_cadences: z9.array(z9.string()).optional().meta(Unrestricted5),
  segment_chips: z9.array(z9.string()).meta(Unrestricted5)
}).meta(
  { id: "RevTurbineConfigStudioPayloadTarget", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4 }
);
var RevTurbineConfigPeriodCapSchema = z9.object({
  count: z9.number().int().min(1).meta(Unrestricted5),
  period: z9.enum(["session", "day", "week", "month", "lifetime"]).meta(Unrestricted5)
}).meta(
  { id: "RevTurbineConfigPeriodCap", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4 }
);
var RevTurbineConfigStudioPayloadCapsSchema = z9.object({
  max_per_period: RevTurbineConfigPeriodCapSchema.optional().meta(Unrestricted5),
  cooldown_days: z9.number().int().min(0).optional().meta(Unrestricted5)
}).meta(
  { id: "RevTurbineConfigStudioPayloadCaps", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4 }
);
var RevTurbineConfigStudioPayloadSchema = z9.object({
  id: z9.string().min(1).meta(Unrestricted5),
  target: RevTurbineConfigStudioPayloadTargetSchema.meta(Unrestricted5),
  surfaces: z9.array(RevTurbineConfigStudioPayloadSurfaceSchema).meta(Unrestricted5),
  caps: RevTurbineConfigStudioPayloadCapsSchema.optional().meta(Unrestricted5),
  // Optional slot targeting (spec §3.1.1): empty/absent = any compatible slot.
  surface_slot_ids: z9.array(z9.string()).optional().meta(Unrestricted5),
  // Per-payload remind-me-later override (minutes); absent = inherit tenant default (plan 167 Q-3).
  remind_later_minutes: z9.number().int().min(0).nullable().optional().meta(Unrestricted5),
  created_at: z9.string().optional().meta({ ...Unrestricted5, readOnly: true }),
  recommendation_strategy: z9.enum(["next_tier_up", "best_value", "custom"]).optional().default("next_tier_up").meta(Unrestricted5),
  recommendation_plan_override: z9.string().optional().meta(Unrestricted5)
}).meta(
  { id: "RevTurbineConfigStudioPayload", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4 }
);
var RevTurbineConfigPlacementTriggerSchema = z9.discriminatedUnion("type", [
  z9.object({ type: z9.literal("surface_render"), slot_id: z9.string().min(1) }),
  z9.object({ type: z9.literal("entitlement_gate"), entitlement_handle: z9.string().min(1), tier_threshold: z9.string().optional() }),
  z9.object({ type: z9.literal("usage_threshold"), entitlement_handle: z9.string().min(1), threshold_percent: ThresholdPercentField }),
  z9.object({ type: z9.literal("credit_threshold"), entitlement_handle: z9.string().min(1), threshold_percent: ThresholdPercentField }),
  z9.object({ type: z9.literal("seat_threshold"), entitlement_handle: z9.string().min(1), threshold_percent: ThresholdPercentField }),
  z9.object({ type: z9.literal("trial_started"), trial_type: z9.enum(["free", "reverse"]).optional() }),
  z9.object({ type: z9.literal("trial_progress"), progress_percent: z9.number().min(1).max(100) }),
  z9.object({ type: z9.literal("trial_ending"), days_before_end: z9.number().int().min(0) }),
  z9.object({ type: z9.literal("trial_ended") }),
  z9.object({ type: z9.literal("trial_converted") }),
  z9.object({ type: z9.literal("qualifier"), qualifier: z9.string().min(1) })
]).meta(
  { id: "RevTurbineConfigPlacementTrigger", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4 }
);
var RevTurbineConfigPlacementCategorySchema = z9.enum(["fixed", "gated", "usage_credit_seat", "trials", "other_conversion", "retention"]).meta(
  { id: "RevTurbineConfigPlacementCategory", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4 }
);
var RevTurbineConfigPlacementItemSchema = z9.object({
  id: z9.string().min(1).meta(Unrestricted5),
  name: z9.string().min(1).meta(Unrestricted5),
  category: RevTurbineConfigPlacementCategorySchema.meta(Unrestricted5),
  trigger: RevTurbineConfigPlacementTriggerSchema.meta(Unrestricted5),
  payloads: z9.array(RevTurbineConfigStudioPayloadSchema).meta(Unrestricted5),
  order: z9.number().int().min(0).meta(Unrestricted5)
}).meta(
  { id: "RevTurbineConfigPlacementItem", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4, ...PLAYBOOK_SDK_FACETS4 }
);
var RevTurbineConfigPlacementPayloadItemSchema = z9.object({
  payload_id: z9.string().min(1).meta(Unrestricted5),
  placement_id: z9.string().min(1).meta(Unrestricted5),
  target: RevTurbineConfigStudioPayloadTargetSchema.meta(Unrestricted5),
  caps: RevTurbineConfigStudioPayloadCapsSchema.optional().meta(Unrestricted5),
  // Per-payload remind-me-later override (minutes); absent = inherit tenant default (plan 167 Q-3).
  remind_later_minutes: z9.number().int().min(0).nullable().optional().meta(Unrestricted5),
  created_at: z9.string().meta({ ...Unrestricted5, readOnly: true }),
  updated_at: z9.string().datetime().optional().meta({ ...Unrestricted5, readOnly: true }),
  source_mode: z9.enum(["inline", "content_linked"]).meta(Unrestricted5),
  surfaces: z9.array(RevTurbineConfigStudioPayloadSurfaceSchema).optional().meta(Unrestricted5),
  // Optional slot targeting (spec §3.1.1): empty/absent = any compatible slot.
  surface_slot_ids: z9.array(z9.string()).optional().meta(Unrestricted5),
  content_link: z9.object({
    message_block_id: z9.string().optional(),
    ui_path_id: z9.string().optional(),
    promotion_id: z9.string().optional(),
    content_payload_id: z9.string().optional()
  }).optional().meta(Unrestricted5)
}).meta(
  { id: "RevTurbineConfigPlacementPayloadItem", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4, ...PLAYBOOK_SDK_FACETS4 }
);
var RevTurbineConfigExtensionRulesItemSchema = z9.object({
  kind: z9.string().min(1).meta(Unrestricted5),
  schema_version: z9.number().int().nonnegative().meta(Unrestricted5),
  config: z9.unknown().meta(Unrestricted5)
}).meta(
  { id: "RevTurbineConfigExtensionRulesItem", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4, ...PLAYBOOK_SDK_FACETS4 }
);
var RevTurbineConfigFreeTrialRuleItemSchema = IdField.merge(FreeTrialRuleCoreFieldsSchema).meta(
  { id: "RevTurbineConfigFreeTrialRuleItem", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4, ...PENDING_PLAYBOOK_FACETS2 }
);
var RevTurbineConfigReverseTrialRuleItemSchema = IdField.merge(ReverseTrialRuleCoreFieldsSchema).meta(
  { id: "RevTurbineConfigReverseTrialRuleItem", "x-revturbine-schema-persistence": Transient5, "x-revturbine-schema-exposure": External4, ...PENDING_PLAYBOOK_FACETS2 }
);
var PlaybookBodySchema = z9.object({
  plans: z9.array(RevTurbineConfigPlansItemSchema).meta({ ...Unrestricted5, ...PLAYBOOK_SDK_FACETS4 }),
  // Optional for back-compat: pre-plan-88 configs (and the live export until web
  // adopts the new @revt-eng/schema) omit it. Add-on definitions only; pricing
  // (addon_variations) stays in the Stripe layer, like plan_variations.
  addons: z9.array(RevTurbineConfigAddonsItemSchema).optional().meta({ ...Unrestricted5, ...PLAYBOOK_AUTHORING_FACETS2 }),
  entitlements: z9.array(RevTurbineConfigEntitlementsItemSchema).meta({ ...Unrestricted5, ...PLAYBOOK_SDK_FACETS4 }),
  entitlement_rules: z9.array(RevTurbineConfigEntitlementRulesItemSchema).meta({ ...Unrestricted5, ...PLAYBOOK_SDK_FACETS4 }),
  segments: z9.array(RevTurbineConfigSegmentsItemSchema).meta({ ...Unrestricted5, ...PLAYBOOK_SDK_FACETS4 }),
  content_ui_paths: z9.array(ContentUiPathSchema).meta({ ...Unrestricted5, ...PLAYBOOK_SDK_FACETS4 }),
  slot_configs: z9.array(RevTurbineConfigSlotConfigsItemSchema).optional().meta({
    ...Unrestricted5,
    ...PLAYBOOK_SDK_FACETS4,
    ...schemaDeprecation({
      since: "0.1.117",
      replacement: "SDK-local activation/trigger state",
      removeAfter: "one compatibility window",
      reason: "Slot activation moved to SDK-local state (plan 118 TASK-6); no longer a Playbook authoring input."
    })
  }),
  content_overrides: z9.record(z9.string(), z9.record(z9.string(), z9.string())).optional().meta({
    ...Unrestricted5,
    ...PLAYBOOK_SDK_FACETS4,
    ...schemaDeprecation({
      since: "0.1.117",
      replacement: "Message Block / Placement Payload content",
      removeAfter: "one compatibility window",
      reason: "Content overrides moved to Message Block / Payload content (plan 118 TASK-6); no longer a Playbook authoring input."
    })
  }),
  theme: z9.record(z9.string(), z9.unknown()).optional().meta({
    ...Unrestricted5,
    ...LEGACY_BRANDING_FACETS,
    ...schemaDeprecation({
      since: "0.1.111",
      replacement: "SDK branding argument",
      removeAfter: "one compatibility window",
      reason: "Branding is independently owned and is not Playbook strategy."
    })
  }),
  placement_slots: z9.array(RevTurbineConfigPlacementSlotsItemSchema).optional().meta({ ...Unrestricted5, ...PLAYBOOK_SDK_FACETS4 }),
  message_blocks: z9.array(MessageBlockSchema).optional().meta({ ...Unrestricted5, ...PLAYBOOK_SDK_FACETS4 }),
  placement_payloads: z9.array(RevTurbineConfigPlacementPayloadItemSchema).optional().meta({ ...Unrestricted5, ...PLAYBOOK_SDK_FACETS4 }),
  placements: z9.array(RevTurbineConfigPlacementItemSchema).optional().meta({ ...Unrestricted5, ...PLAYBOOK_SDK_FACETS4 }),
  content_promotions: z9.array(ContentPromotionSchema).optional().meta({ ...Unrestricted5, ...PLAYBOOK_SDK_FACETS4 }),
  personalization_tokens: z9.array(RevTurbineConfigPersonalizationTokensItemSchema).optional().meta({ ...Unrestricted5, ...PLAYBOOK_SDK_FACETS4 }),
  surface_templates: z9.array(RevTurbineConfigSurfaceTemplatesItemSchema).optional().meta({ ...Unrestricted5, ...PLAYBOOK_SDK_FACETS4 }),
  /**
   * Free + reverse trial rule configurations (plan 43). Optional so
   * pre-trial-runtime configs continue to parse. /api/config/import
   * applies these to the tenant's free_trial_rules / reverse_trial_rules
   * tables; /api/config/export reads them out for round-trip.
   */
  free_trial_rules: z9.array(RevTurbineConfigFreeTrialRuleItemSchema).optional().meta({ ...Unrestricted5, ...PLAYBOOK_AUTHORING_FACETS2 }),
  reverse_trial_rules: z9.array(RevTurbineConfigReverseTrialRuleItemSchema).optional().meta({ ...Unrestricted5, ...PLAYBOOK_AUTHORING_FACETS2 }),
  // Plan / add-on variation prices carried by handle (plan 118 TASK-16). These
  // live on the legacy schema (not just the canonical Playbook body) so that a
  // legacy `version`-shaped config — the shape the demo-data configs and the
  // pre-sales/CLI upload flow still use — can carry variation prices through
  // normalization instead of having them stripped. Pending until web
  // import/export activates them (TASK-21).
  plan_variations: z9.array(RevTurbineConfigPlanVariationsItemSchema).optional().meta({ ...Unrestricted5, ...PLAYBOOK_AUTHORING_FACETS2 }),
  addon_variations: z9.array(RevTurbineConfigAddonVariationsItemSchema).optional().meta({ ...Unrestricted5, ...PLAYBOOK_AUTHORING_FACETS2 }),
  /**
   * Tagged-opaque rule entries (Phase 3 / strategy 2). Each entry is
   * dispatched to the corresponding `RuleAuthoringModule.kind` at
   * compile time; unknown kinds are skipped silently so authoring can
   * stage new kinds before the runtime catches up.
   */
  extension_rules: z9.array(RevTurbineConfigExtensionRulesItemSchema).optional().meta({ ...Unrestricted5, ...PLAYBOOK_SDK_FACETS4 }),
  // Authored-config projections carried as active SDK inputs (plan 118
  // TASK-13/18). Declared here (not only on PlaybookBody) so the Bundle
  // compiler — which lowers the legacy `RevTurbineConfig` view — reads them
  // with proper types. Projected into the RuleBundle; see core/bundle.
  seat_types: z9.array(RevTurbineConfigSeatTypesItemSchema).optional().meta({ ...Unrestricted5, ...PLAYBOOK_SDK_FACETS4 }),
  enforcement_defaults: z9.array(RevTurbineConfigEnforcementDefaultsItemSchema).optional().meta({ ...Unrestricted5, ...PLAYBOOK_SDK_FACETS4 }),
  placement_settings: z9.array(RevTurbineConfigPlacementSettingsItemSchema).optional().meta({ ...Unrestricted5, ...PLAYBOOK_SDK_FACETS4 }),
  segment_dimensions: z9.array(RevTurbineConfigSegmentDimensionsItemSchema).optional().meta({ ...Unrestricted5, ...PLAYBOOK_SDK_FACETS4 }),
  meter_bindings: z9.array(RevTurbineConfigMeterBindingsItemSchema).optional().meta({ ...Unrestricted5, ...PLAYBOOK_SDK_FACETS4 }),
  experiments: z9.array(z9.unknown()).max(0).optional().meta({
    ...Unrestricted5,
    ...PENDING_PLAYBOOK_FACETS2
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
  signal_catalog: z9.object({}).strict().optional().meta({
    ...Unrestricted5,
    ...PENDING_PLAYBOOK_FACETS2
  })
}).meta(
  {
    id: "PlaybookBody",
    "x-revturbine-schema-persistence": Transient5,
    "x-revturbine-schema-exposure": External4,
    ...PLAYBOOK_SDK_FACETS4
  }
);
var PlaybookHeaderSchema = z9.object({
  artifact_type: z9.literal("playbook").meta({
    ...Unrestricted5,
    ...PLAYBOOK_VERSION_HEADER_FACETS,
    readOnly: true
  }),
  format_version: z9.literal(PLAYBOOK_FORMAT_VERSION).meta({
    ...Unrestricted5,
    ...PLAYBOOK_VERSION_HEADER_FACETS,
    readOnly: true
  }),
  playbook_handle: z9.string().min(1).default("default").meta({
    ...Unrestricted5,
    ...PLAYBOOK_VERSION_HEADER_FACETS
  }),
  playbook_version_id: z9.string().nullable().default(null).meta({
    ...Unrestricted5,
    ...PLAYBOOK_PROVENANCE_HEADER_FACETS,
    readOnly: true
  }),
  // Origin target identity (plan 131 TASK-10). Optional so a hand-authored /
  // legacy `export-config.json` (which carries no target) parses unchanged —
  // the plan 147 TASK-1 header reconciliation: the one config schema must
  // absorb legacy files that predate target stamping. Stamped by the server
  // on export when present.
  tenant_id: z9.string().min(1).optional().meta({
    ...Unrestricted5,
    ...PLAYBOOK_TARGET_FACETS,
    readOnly: true
  }),
  environment_id: z9.string().min(1).optional().meta({
    ...Unrestricted5,
    ...PLAYBOOK_TARGET_FACETS,
    readOnly: true
  }),
  project_id: z9.string().min(1).optional().meta({
    ...Unrestricted5,
    ...PLAYBOOK_TARGET_FACETS,
    readOnly: true
  }),
  exported_at: z9.string().datetime().optional().meta({
    ...Unrestricted5,
    ...PLAYBOOK_PROVENANCE_HEADER_FACETS,
    readOnly: true
  }),
  schema_version: z9.string().min(1).optional().meta({
    ...Unrestricted5,
    ...PLAYBOOK_VERSION_HEADER_FACETS,
    readOnly: true
  }),
  bundle_schema_version: z9.number().int().nonnegative().optional().meta({
    ...Unrestricted5,
    ...PLAYBOOK_VERSION_HEADER_FACETS,
    readOnly: true
  }),
  // Plan 177 TASK-3: the writer's declaration of the oldest reader
  // `SCHEMA_VERSION` that can correctly evaluate this payload. A runtime
  // refuses the payload when this floor exceeds the version it supports,
  // instead of partially applying config it cannot fully parse. Stamped by
  // the payload producer (`buildPlaybookPayload`); absent on hand-authored
  // configs, where readers treat the floor as `bundle_schema_version`.
  bundle_min_readable_schema_version: z9.number().int().nonnegative().optional().meta({
    ...Unrestricted5,
    ...PLAYBOOK_VERSION_HEADER_FACETS,
    readOnly: true
  })
}).meta(
  {
    id: "PlaybookHeader",
    "x-revturbine-schema-persistence": Transient5,
    "x-revturbine-schema-exposure": External4,
    ...PLAYBOOK_PROVENANCE_HEADER_FACETS
  }
);
var PlaybookObjectSchema = PlaybookHeaderSchema.extend(PlaybookBodySchema.shape).meta(
  {
    "x-revturbine-schema-persistence": Transient5,
    "x-revturbine-schema-exposure": External4,
    ...PLAYBOOK_SDK_FACETS4
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
var PlaybookSchema = z9.preprocess(normalizeConfigHeaderInput, PlaybookObjectSchema).meta({
  id: "Playbook",
  "x-revturbine-schema-persistence": Transient5,
  "x-revturbine-schema-exposure": External4,
  ...PLAYBOOK_SDK_FACETS4
});
var PlaybookStrictSchema = z9.preprocess(normalizeConfigHeaderInput, PlaybookObjectSchema.strict()).meta({
  id: "PlaybookStrict",
  "x-revturbine-schema-persistence": Transient5,
  "x-revturbine-schema-exposure": External4,
  ...PLAYBOOK_SDK_FACETS4
});
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
      requestParams: { path: z9.object({ id: z9.string() }) },
      summary: "Update seat type",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: SeatTypeSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: SeatTypeSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "seat-types", persistence: { table: "seatTypeVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteSeatType",
      requestParams: { path: z9.object({ id: z9.string() }) },
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
      requestParams: { path: z9.object({ id: z9.string() }) },
      summary: "Update personalization token",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: PersonalizationTokenSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: PersonalizationTokenSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "personalization-tokens", persistence: { table: "personalizationTokenVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deletePersonalizationToken",
      requestParams: { path: z9.object({ id: z9.string() }) },
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
      requestParams: { path: z9.object({ meteringId: z9.string() }) },
      summary: "Update metering configuration",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: MeteringConfigSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: MeteringConfigSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "metering-config", persistence: { table: "meteringConfigs", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteMeteringConfig",
      requestParams: { path: z9.object({ meteringId: z9.string() }) },
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
      requestParams: { path: z9.object({ settingsId: z9.string() }) },
      summary: "Update usage enforcement settings",
      tags: ["config"],
      requestBody: { required: true, content: { "application/json": { schema: UsageEnforcementSettingsSchema.partial() } } },
      responses: { "200": { description: "Updated", content: { "application/json": { schema: UsageEnforcementSettingsSchema } } } },
      "x-revturbine-operation": { exposure: "internal", resource: "usage-enforcement", persistence: { table: "usageEnforcementSettingVersions", mode: "update" } }
    }),
    delete: operation({
      operationId: "deleteUsageEnforcementSettings",
      requestParams: { path: z9.object({ settingsId: z9.string() }) },
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

// ../scaffold/src/core/validation/deprecation-repair.ts
var DEPRECATED_FIELD_REPAIR_CODE = "VAL-DEP-01";
function isRecord2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function readShape(schema) {
  const shape = schema.shape;
  if (shape && typeof shape === "object") {
    return shape;
  }
  return void 0;
}
function repairFinding(field, deprecation) {
  return {
    code: DEPRECATED_FIELD_REPAIR_CODE,
    severity: "warning",
    targetRef: { field, path: [field] },
    message: `Deprecated field '${field}' was removed from the config so it stays valid. ${deprecation.reason} Use ${deprecation.replacement} instead (the field is scheduled for removal after ${deprecation.removeAfter}).`,
    specRef: "config-validation.md deprecation repair (plan 147 REQ-4, AC-3)",
    detail: `Field deprecated since ${deprecation.since}. The config was repaired by absorbing (removing) this field rather than being rejected for carrying it; supply '${deprecation.replacement}' through its current owner instead.`
  };
}
function repairDeprecatedFields(config, schema = PlaybookObjectSchema) {
  if (!isRecord2(config)) return { config, findings: [] };
  const shape = readShape(schema);
  if (!shape) return { config, findings: [] };
  const findings = [];
  let repaired;
  for (const [field, fieldSchema] of Object.entries(shape)) {
    const deprecation = getSchemaDeprecation(fieldSchema);
    if (!deprecation) continue;
    if (!Object.prototype.hasOwnProperty.call(config, field)) continue;
    repaired ??= { ...config };
    delete repaired[field];
    findings.push(repairFinding(field, deprecation));
  }
  return { config: repaired ?? config, findings };
}

// ../scaffold/src/core/validation/catalog-drift.ts
var REFINE_RULE_CODES = [];
var RENAMED_SEVERITIES = ["error_publish"];
function checkCatalogDrift(ownedCodes = [...SEMANTIC_RULE_CODES, ...REFINE_RULE_CODES], catalogIds = listCatalogIds(), severityOptions = SeveritySchema.options, catalogSeverities = listCatalogIds().map(
  (id) => ({ id, severity: CATALOG[id].severity })
)) {
  const issues = [];
  const catalogSet = new Set(catalogIds);
  const ownedSet = new Set(ownedCodes);
  for (const code of ownedCodes) {
    if (!catalogSet.has(code)) {
      issues.push({
        severity: "error",
        code,
        message: `rule code "${code}" has no catalog entry`
      });
    }
  }
  for (const id of catalogIds) {
    if (!ownedSet.has(id)) {
      issues.push({
        severity: "error",
        code: id,
        message: `catalog id "${id}" is orphaned \u2014 no rule or refine emits it`
      });
    }
  }
  const severitySet = new Set(severityOptions);
  for (const old of RENAMED_SEVERITIES) {
    if (severitySet.has(old)) {
      issues.push({
        severity: "error",
        code: old,
        message: `severity "${old}" was renamed (plan 104 \u2192 error_launch) but still appears in SeveritySchema`
      });
    }
  }
  for (const { id, severity } of catalogSeverities) {
    if (!severitySet.has(severity)) {
      issues.push({
        severity: "error",
        code: id,
        message: `catalog entry "${id}" uses unknown severity "${severity}" (renamed or invalid)`
      });
    }
  }
  return issues;
}
function assertCatalogInSync() {
  const issues = checkCatalogDrift();
  if (issues.length === 0) return;
  throw new Error(
    `Catalog drift detected:
${issues.map((i) => `  - ${i.message}`).join("\n")}`
  );
}

// ../scaffold/src/core/validation/error-map.ts
import { z as z10 } from "zod";
function installValidationErrorMap() {
  z10.config({
    customError: (issue) => messageForZodIssue(issue)
  });
}
export {
  CATALOG,
  CallSiteSchema,
  DEPRECATED_FIELD_REPAIR_CODE,
  REFINE_RULE_CODES,
  SEMANTIC_RULE_CODES,
  SeveritySchema,
  TargetRefSchema,
  ValidationFindingSchema,
  assertCatalogInSync,
  checkCatalogDrift,
  checkIdHandleParity,
  disposition,
  evaluate,
  getCatalogEntry,
  installValidationErrorMap,
  listCatalogIds,
  messageForZodIssue,
  repairDeprecatedFields,
  runSemanticRules,
  zodErrorToFindings
};
