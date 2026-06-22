# revturbine-cli (`revt-config`)

Verify [RevTurbine](https://www.revturbine.com) **ExportedConfig** files and ship
them to a RevTurbine instance through the Change Set lifecycle — from the
terminal, the same operations the in-app Pre-Sales Agent performs.

`revt-config` is the command-line counterpart to the RevTurbine control plane. It
schema-validates a config offline, authenticates to an instance via the browser
(RFC 8628 device flow), and stages / deploys configs as Change Sets so every
change is reviewable and rollback-able.

## Install

```bash
npm i -g revt-config         # global `revt-config` binary
# or run without installing:
npx revt-config --help
```

Requires Node ≥ 20.

## Quick start

```bash
revt-config verify ./export-config.json      # schema-validate locally (no network)
revt-config login                            # authorize this machine (device flow)
revt-config diff ./export-config.json        # dry-run: live config vs local, no writes
revt-config upload ./export-config.json      # stage as a draft Change Set
revt-config deploy <change-set-id>           # submit → approve → deploy (go live)
```

`revt-config <command> --help` documents every flag.

## Commands

| Command | What it does |
|---|---|
| `login` / `logout` | Device-flow auth; tokens stored at `~/.revturbine/credentials.json` (mode 0600). |
| `verify` | Schema-validate a config offline against the bundled schema. |
| `diff` | Non-destructive: download the live config, diff against local, dry-run the import. |
| `upload` | Stage a config as a draft Change Set (`--deploy` to also activate). |
| `deploy` | Activate a staged draft: submit → approve → deploy. |
| `validate` | Run config-validation against a staged draft. |
| `export` | Download the live config (stdout, or `--save`). |
| `status` | Show the active draft and recent releases. |
| `discard` / `rollback` | Archive an open draft / revert a deployed change set. |
| `evaluate` | Run the live config's placement/entitlement decisions for a user context. |
| `preview` | Runtime-impact preview of a draft change set. |
| `promote` | Promote a compiled config from one environment to another. |

## Schema validation

Validation is **mandatory** and runs fully offline against a vendored,
version-stamped snapshot of RevTurbine's `ExportedConfigSchema`
(`src/schema/`, regenerated from the canonical schema via
`npm run generate:schema`). The CLI never uploads a config it could not
validate. `revt-config --version` reports both the CLI version and the schema
snapshot version.

## License

MIT — see [LICENSE](./LICENSE).
