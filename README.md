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
revturbine signup                             # create an account (email + password + emailed code)
revturbine login                              # authorize this machine (device flow)
revturbine download --live --save ./revturbine.playbook.json
# …edit ./revturbine.playbook.json…
revturbine validate ./revturbine.playbook.json             # schema-validate locally (no network)
revturbine diff ./revturbine.playbook.json --live          # what would change (no writes)
revturbine launch ./revturbine.playbook.json               # upload, gate, and go live
```

`revturbine <command> --help` documents every flag.

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
| `init` (alias `create`) | Scaffold RevTurbine into this app: detect the package manager and stack, install the SDK, pin the CLI exactly, drop a starter Playbook, and install the Agent Skills. In a directory with no `package.json` it offers to start a new project (`--yes` to skip the prompt); `--dir`, `--dry-run`, `--no-skills`, `--json`. Runs the invoked CLI even inside a repo that pins a different one — setup establishes the pin, so it never delegates. |
| `signup` | Create an account headlessly: email + password, then an emailed one-time code to verify, then a token is stored. |
| `login` / `logout` | Device-flow auth; tokens stored at `~/.revturbine/credentials.json` (mode 0600). |
| `whoami` | The resolved instance, tenant, credentials source, and whether the stored token works. |
| `schema` | Emit the bundled `RevTurbineConfig` JSON schema (for agents to author against). |
| `docs` | Print the canonical documentation URL. |
| `download` | Fetch a config version (`--live` / `--draft` / `--release <id>`); `--save`. |
| `validate` | Offline schema validation of a `<file>`, or the full server catalog against the open draft (`--draft`). |
| `diff` | Compare any two versions (dry-run, no writes). A file vs `--draft`/`--live`/`--release` previews the launch — the server side is the base, so `+`/`-` read as created/pruned on launch. |
| `show <kind>` | Summary tables: `plans` · `entitlements` · `segments` · `placements` · `trials` for any version. |
| `upload` | Stage a Playbook file as the open draft. |
| `launch` | Take a config live: validate (launch gate) → submit → approve → deploy. `launch <file>` or `launch --draft`. |
| `discard` | Archive the open draft (`--yes`). |
| `restore` | Stage a draft that restores a past release from its frozen snapshot; `--launch` takes it live. Halts if a draft is open. |
| `status` | The live Release and the open draft, side by side. |
| `history` | The Release Version Log, newest first. |
| `preview` | The open draft's staged changes. |
| `evaluate` | Run a config version's placement/entitlement decisions locally for a user context. Use `--slot` with optional `--component-type`; deprecated `--surface-type` remains an alias. |
| `generate types` | Generate a TypeScript module of typed Playbook handles from any config version — `Entitlements` (namespaced by type, with the `EntitlementHandle` union for type-safe `can()`/`gate()`/`checkEntitlement()` call sites), plus `Plans`, `Segments`, `SurfaceTemplates`, and `UiPathActionTypes`. Const objects + literal-union types (erasable — no enums). `--out <path>` writes the file; the generated header records the exact command to regenerate it. `--json` for the raw handle map. |
| `analytics catalog\|templates\|views\|view\|create\|preview\|query` | Work with the hosted Semantic Catalog and canonical analytics-view documents. Create and preview pass the document through unchanged to the same server contract used by the web editor and MCP tools; preview remains subject to the server's query limits. |
| `ingest-keys create` (alias `mint`) | Mint a tenant-bound public ingest token for browser SDK use. Requires one or more `--origin` values; optional `--ip` restrictions. The full token is returned once. `ingest-keys list` shows ids/previews and `ingest-keys revoke <id>` invalidates one. |

`--json` on read commands emits machine-readable output. Results go to stdout,
diagnostics to stderr.

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

## Schema validation

Validation is **mandatory** and runs fully offline against a vendored,
version-stamped snapshot of RevTurbine's `RevTurbineConfigSchema`
(`src/schema/`, regenerated from the canonical schema via
`npm run generate:schema`). The CLI never uploads a config it could not
validate. `revturbine --version` reports both the CLI version and the schema
snapshot version.

## License

MIT — see [LICENSE](./LICENSE).
