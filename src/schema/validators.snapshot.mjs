// GENERATED — do not edit by hand.
// Vendored validation engine bundled from @revt-eng/schema@0.1.143
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
  // entitlement-rule overlap. Origin: the `rule.overlap` check (plan 40).
  "VAL-PLN-05": {
    id: "VAL-PLN-05",
    severity: "warning",
    message: "These entitlement rules target the same plan and segment \u2014 only one will apply.",
    specRef: "config-validation.md \xA75.3 (provisional \u2014 plan 73 Q-1)"
  },
  // multiple public variations. Origin: `*_variation.multiple_public`.
  "VAL-PLN-06": {
    id: "VAL-PLN-06",
    severity: "error_draft",
    message: "Only one public variation is allowed per billing period and segment.",
    specRef: "config-validation.md \xA75.3 (provisional \u2014 plan 73 Q-1)"
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
var SEMANTIC_RULE_CODES = ["VAL-PLN-01", "VAL-PLN-05", "VAL-PLN-06"];
function runSemanticRules(graph) {
  return [
    ...checkPlansHaveStripePrice(graph),
    ...checkRuleOverlaps(graph),
    ...checkPublicVariationCollisions(graph)
  ];
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
          message: `Entitlement rule '${name}' overlaps another rule on a shared target and segment \u2014 only one will apply.`,
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
    case "invalid_value":
      return `${field} must be one of the allowed values.`;
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
  findings.push(...runSemanticRules(graph));
  if (!opts.focus) return findings;
  return findings.map((f) => spotlights(f, opts.focus) ? { ...f, spotlight: true } : f);
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
import { z as z2 } from "zod";
function installValidationErrorMap() {
  z2.config({
    customError: (issue) => messageForZodIssue(issue)
  });
}
export {
  CATALOG,
  CallSiteSchema,
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
  runSemanticRules,
  zodErrorToFindings
};
