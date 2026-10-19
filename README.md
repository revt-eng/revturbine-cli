# revturbine-cli (`revturbine`)

Validate [RevTurbine](https://revturbine.com) **Playbooks** and ship them to
a RevTurbine instance through the playbook-version lifecycle (draft → Release) —
from the terminal, the same operations the in-app studios perform.

`revturbine` is the command-line counterpart to the RevTurbine control plane. It
schema-validates a config offline, authenticates to an instance via the browser
(RFC 8628 device flow), and stages / launches configs as playbook versions so
every change is reviewable and rollback-able.

## Install

Pin it to the repo it operates on:

```bash
npm install -D @revturbine/cli    # or: pnpm add -D / yarn add -D
npx revturbine --help
```

The CLI bundles a **version-stamped snapshot** of the RevTurbine schema, so
CLI↔config compatibility is a property of the repo rather than of the machine —
which is why it belongs in your lockfile. Pinning also means CI and coding-agent
sandboxes need no global install.

```bash
npm i -g @revturbine/cli   # optional: a global `revturbine` for ad-hoc use
npx @revturbine/cli --help # or run it without installing at all
```

The published npm package is `@revturbine/cli`; the installed command is
`revturbine`.

Requires Node ≥ 22.13. Source builds use the npm 11.18.0 version declared in
`package.json`.

## Quick start

```bash
revturbine signup                             # create an operator login (email + password + emailed code)
revturbine login                              # authorize this machine (device flow)
revturbine download --live --save ./revturbine.playbook.json
# …edit ./revturbine.playbook.json…
revturbine validate ./revturbine.playbook.json             # schema-validate locally (no network)
revturbine diff ./revturbine.playbook.json --live          # what would change (no writes)
revturbine launch ./revturbine.playbook.json               # upload, gate, and go live
```

`revturbine <command> --help` documents every flag.

## Customer application provisioning with Clerk Billing

`signup` creates a RevTurbine operator login. `customer-accounts` and
`customer-users` create records for **your application's customers**. They never
create operator logins. A customer account can represent a Clerk organization or
a personal Clerk user; a customer user represents an application user.

The `customer-accounts`, `customer-users`, `plans`, and `plan-variations` groups
each provide `create <file>`, `list`, `get <key>`, `link <key> <file>`, and
`links <key>`. Use `--json` for automation and `list --all` to follow all pages
(`--page`, `--per-page`, maximum 100). Every command accepts `--url` and
`--tenant-id` using the existing operator credentials.

Catalog commands require `--environment <handle>` (for example `production`, never the environment database row ID) and exactly one of `--draft`,
`--live`, or `--release <id>`. Creates accept only `--draft` and do not launch.
Links additionally require `--provider-instance <Clerk-instance-id>`; identity
links have no Playbook selector. Keys are your application IDs or stable catalog
handles, never version-row IDs. Catalog reads use the selected environment's
draft or frozen release and return 404 if that version is absent.
Operators can disable this endpoint family with the `customer-provisioning`
feature flag in the admin UI; disabled endpoints return 503. It defaults to enabled.

Clerk Billing manages its plans, prices, and subscriptions; these are not Stripe
Billing catalog records. Use Clerk's CLI/API or dashboard to provision those
entities, then record their IDs in RevTurbine. Stripe CLI is optional for payment
inspection. RevTurbine stores manually authored price snapshots with
`price_source: "clerk"`, monthly/annual billing, and no `stripe_price_id`.
See [Clerk Billing overview](https://clerk.com/docs/guides/billing/overview),
[Clerk CLI](https://clerk.com/docs/cli), and the
[PowerShell walkthrough](docs/clerk-customer-provisioning.md).

Links are scoped to tenant, environment, and Clerk instance and are always
`unverified`. Recording an ID does not contact Clerk, create a subscription,
prove payment, or grant entitlements. Exact account/user/link retries return
the existing record; conflicting associations return 409. Existing user context
fields are preserved. Rebinding and unlinking are not supported.

Catalog creates can mint handles. If a response is lost, the CLI does not retry:
list the selected draft and reconcile the returned handles before another
create. Links survive catalog version changes, but reads revalidate the selected
target: missing/discarded targets return 404 and incompatible prices return 409.

## Version selectors

Commands that read a config name the version explicitly — there is no default:

| Selector | Meaning |
|---|---|
| `<file>` / `--file <path>` | a local Playbook file |
| `--draft` | the tenant's single open draft (resolved automatically) |
| `--live` | the current live Release |
| `--release <id>` | a specific playbook version / Release |

## Commands

| Command | What it does |
|---|---|
| `init` (alias `create`) | Set up RevTurbine while preserving existing integrations: install missing packages, pin the CLI exactly, create a starter for a fresh integration, and install skills for one agent. Use `--scaffold` to create a missing root starter explicitly; existing files are never overwritten. `--agent claude-code\|cursor\|codex` overrides environment detection; an unknown agent skips skills and prints the selection command. Also supports `--dir`, `--dry-run`, `--no-skills`, `--json`. With no `package.json`, offers a new project (`--yes` for noninteractive creation). Runs the invoked CLI even inside a repo that pins a different one. |
| `signup` | Create a RevTurbine operator login headlessly: email + password, then an emailed one-time code to verify, then a token is stored. |
| `login` / `logout` | Device-flow auth; tokens stored at `~/.revturbine/credentials.json` (mode 0600). For CI, skip login and set `REVTURBINE_TOKEN` (see [CI / non-interactive use](#ci--non-interactive-use)). |
| `whoami` | Authentication state first: not logged in, credentials accepted, credentials rejected for the selected instance/tenant, or verification unavailable. Then shows instance, tenant, and credentials source; configured tenant information alone does not prove login. Verification and subsequent telemetry each time out after 3 seconds. Status reports exit 0. `--json` retains its seven fields: `instance`, `tenant` (`null` when `REVTURBINE_TOKEN` is set without `-t`: the server resolves the token user's own tenant, and `tenant_source` names the variable), `tenant_source`, `credentials_dir`, `credentials_source`, `token_present` (boolean), and `token_valid` (`true` for 2xx, `false` for 401/403, `null` when absent or unverified, including redirects, other HTTP errors, timeouts and network failures). |
| `schema` | Emit the bundled `RevTurbineConfig` JSON schema (for agents to author against). |
| `docs` | Print the canonical documentation URL. |
| `download` | Fetch a config version (`--live` / `--draft` / `--release <id>`); `--save`. |
| `validate` | Offline schema validation of a `<file>`, or the full server catalog against the open draft (`--draft`). |
| `diff` | Compare any two versions (dry-run, no writes). A file vs `--draft`/`--live`/`--release` previews the launch — the server side is the base, so `+`/`-` read as created/pruned on launch. `--exit-code` makes the status machine-readable: `0` no differences, `1` differences, anything else an error (an unexpected internal error exits `70` so `1` always means "differences"). Every top-level Playbook collection is compared. |
| `show <kind>` | Summary tables: `plans` · `entitlements` · `segments` · `placements` · `trials` for any version. |
| `upload` | Stage a Playbook file as the open draft. |
| `launch` | Take a config live: validate (launch gate) → submit → approve → deploy. `launch <file>` or `launch --draft`. |
| `discard` | Archive the open draft (`--yes`). |
| `restore` | Stage a draft that restores a past release from its frozen snapshot; `--launch` takes it live. Halts if a draft is open. |
| `status` | The live Release and the open draft, side by side. |
| `history` | The Release Version Log, newest first. |
| `preview` | The open draft's staged changes. |
| `evaluate` | Run a config version's placement/entitlement decisions locally for a user context. Use `--slot` with optional `--component-type`; deprecated `--surface-type` remains an alias. The ctx file carries the whole decision context — `plan_handle`, `traits`, `usage`, `trial` (or `trial_instances` + `now_iso`) — and `--usage` / `--trial-status` / `--now` override those keys, so usage-threshold and trial placements decide here exactly as they do in an app. Output reports `payload_ids`: which authored payload the resolver chose per placement, plus the SDK's `personalization_tokens`. |
| `generate types` | Generate a TypeScript module of typed Playbook handles from any config version — `Entitlements` (namespaced by type, with the `EntitlementHandle` union for type-safe `can()`/`gate()`/`checkEntitlement()` call sites), plus `Plans`, `Segments`, `SurfaceTemplates`, and `UiPathActionTypes`. Const objects + literal-union types (erasable — no enums). `--out <path>` writes the file; the generated header records the exact command to regenerate it. `--json` for the raw handle map. |
| `analytics catalog\|templates\|views\|view\|create\|preview\|query` | Work with the hosted Semantic Catalog and canonical analytics-view documents. Create and preview pass the document through unchanged to the same server contract used by the web editor and MCP tools; preview remains subject to the server's query limits. |
| `ingest-keys create` (alias `mint`) | Mint a tenant-bound public ingest token for browser SDK use. Requires one or more `--origin` values; optional `--ip` restrictions. The full token is returned once. `ingest-keys list` shows ids/previews and `ingest-keys revoke <id>` invalidates one. |
| `events track` | Send analytics events to the ingest pipeline with your own login — no ingest key and no browser origin required. Takes `--file <path>` (JSON array, `{ "events": [...] }` envelope, or NDJSON) or `--event <json>`. Batches over 500 events are chunked automatically. Reports accepted, quarantined, rejected and dropped counts separately. |

`init` preserves declared SDK/CLI versions and application code. It skips a new root
Playbook when the SDK is already declared in `dependencies` or `devDependencies`,
or project source imports the SDK, or a non-root canonical Playbook is found.
Detection ignores hidden directories, symlinks, dependencies and build outputs.
If the integration is intentionally incomplete, `--scaffold` creates only the missing
`revturbine.playbook.json`; it never replaces an existing one. `--dry-run --json`
reports `playbook: "present"`, `"skipped"`, or the filename to create, and
`skills_agent` identifies the single installer target (or `null` when skipped).
`--no-skills` takes precedence over a detected or explicitly selected valid agent.

`revturbine --version` and `init` check the latest stable `@revturbine/sdk` on
public npm and recommend a concrete version on stderr. The installed project SDK
takes precedence over its declared range; if it cannot be resolved, the advice
explicitly falls back to the declaration. Current or newer versions receive no
downgrade advice. `init --dir` checks that target project. Existing dependencies
are never upgraded automatically. A missing SDK installs the checked version, or
`@latest` when the check is unavailable, using your package manager's save-prefix
settings. The CLI remains an exactly pinned dev dependency.

The registry check has a three-second total timeout, including the response body.
Offline, invalid, or unavailable metadata produces an advisory without changing
the command's stdout/JSON or exit status. `--version` makes no registry request
without a declared SDK; validation and unrelated commands make no SDK version check.

`--json` on read commands emits machine-readable output. Results go to stdout,
diagnostics to stderr.

### Send analytics events

```bash
revturbine login
revturbine events track --file ./events.ndjson

# or a single event inline
revturbine events track --event '{"environment_id":"production","user_id":"u-1","account_id":"a-1","event_name":"product_used","event_ts":"2026-09-10T00:00:00.000Z"}'
```

Every event needs `environment_id`, `user_id`, `account_id`, `event_name` and
`event_ts`; anything else you include is carried through. Local validation
reports every malformed event at once and sends nothing until they are fixed.

This authenticates with your device-auth token rather than an ingest key, so
it works from a terminal or CI where there is no browser origin to allowlist.
Quarantined and rejected counts are reported separately from accepted — a
load is not clean merely because the server returned `202`.

### Mint a publishable ingest token

```bash
revturbine login
revturbine ingest-keys mint --origin https://app.example.com --json
# Store the once-only token, then use the returned id when it is no longer needed:
revturbine ingest-keys revoke <ingest-key-id> --yes
```

Public ingest tokens are intentionally embeddable but remain tenant-bound,
origin-restricted, and optionally IP-restricted. They cannot mint other tokens
or access private control-plane APIs.

## CI / non-interactive use

`login` and `signup` are interactive. In CI, supply the token through the
environment instead:

| Variable | Meaning |
|---|---|
| `REVTURBINE_TOKEN` | Bearer token for every request. Wins over any stored credential (which is then ignored). With it set and no `-t/--tenant-id`, **no `x-tenant-id` header is sent** and the server resolves the token user's own tenant; `-t` still sends one (it must be that tenant). |
| `REVTURBINE_HTTP_HEADERS` | A JSON object of extra headers added to every request to the RevTurbine instance, e.g. `{"x-vercel-protection-bypass":"…"}` to reach a protection-gated preview/staging deployment. It may not set `Authorization`, `x-tenant-id`, `x-rt-tenant-id` or `Content-Type`. A malformed value exits `2`. |

Neither the token nor any header value is ever logged, echoed in an error, or
sent as telemetry: diagnostics name only the variable and the header names, and
any stderr line that would contain a registered secret shows `<redacted>`.

```bash
export REVTURBINE_TOKEN="$RT_TOKEN"
export REVTURBINE_HTTP_HEADERS="{\"x-vercel-protection-bypass\":\"$VERCEL_BYPASS\"}"
URL=https://staging.example.com/app
if revturbine diff ./seed.playbook.json --live --url "$URL" --exit-code; then
  echo "no changes: skip launch"
else
  status=$?
  [ "$status" -eq 1 ] || exit "$status"   # 2-7 / 70 = a real error
  revturbine launch ./seed.playbook.json --url "$URL"
fi
```

## Exit-code classes

```
0  success
1  unexpected error (catch-all)
2  bad usage — unknown command, flag, argument, or missing version selector
3  authentication or permission denied
4  validation blocked (schema failure, blocking findings, unknown id)
5  conflict or stale state (e.g. a draft is already open)
6  network or transient failure
7  server error
```

`diff --exit-code` is the one exception: `1` means "differences" there, and an
unexpected internal error exits `70` instead.

## Schema validation

Validation is **mandatory** and runs fully offline against a vendored,
version-stamped snapshot of RevTurbine's `RevTurbineConfigSchema`
(`src/schema/`, regenerated from the canonical schema via
`npm run generate:schema`). The CLI never uploads a config it could not
validate. `revturbine --version` reports both the CLI version and the schema
snapshot version.

## License

MIT — see [LICENSE](./LICENSE).
