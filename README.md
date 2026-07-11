# revturbine-cli (`revturbine`)

Verify [RevTurbine](https://revturbine.com) **ExportedConfig** files and ship
them to a RevTurbine instance through the playbook-version lifecycle — from the
terminal, the same operations the in-app Pre-Sales Agent performs.

`revturbine` is the command-line counterpart to the RevTurbine control plane. It
schema-validates a config offline, authenticates to an instance via the browser
(RFC 8628 device flow), and stages / deploys configs as playbook versions so
every change is reviewable and rollback-able.

## Install

```bash
npm i -g @revturbine/cli   # global `revturbine` binary
# or run without installing:
npx @revturbine/cli --help
```

The published npm package is `@revturbine/cli`; the installed command is
`revturbine`.

Requires Node ≥ 20.

## Quick start

```bash
revturbine signup                           # create an account (email + password + emailed code)
revturbine verify ./export-config.json      # schema-validate locally (no network)
revturbine login                            # authorize this machine (device flow)
revturbine diff ./export-config.json        # dry-run: live config vs local, no writes
revturbine upload ./export-config.json      # stage as a draft playbook version
revturbine deploy <playbook-version-id>     # submit → approve → deploy (go live)
```

`revturbine <command> --help` documents every flag.

## Commands

| Command | What it does |
|---|---|
| `signup` | Create an account headlessly: email + password, then an emailed one-time code to verify, then a token is stored. A business-email domain already claimed by a workspace exits with "an admin must invite you" (no token). |
| `login` / `logout` | Device-flow auth; tokens stored at `~/.revturbine/credentials.json` (mode 0600). |
| `verify` | Schema-validate a config offline against the bundled schema. |
| `diff` | Non-destructive: download the live config, diff against local, dry-run the import. |
| `upload` | Stage a config as a draft playbook version (`--deploy` to also activate). |
| `deploy` | Activate a staged draft: submit → approve → deploy. |
| `validate` | Run config-validation against a staged draft. |
| `export` | Download the live config (stdout, or `--save`). |
| `status` | Show the active draft and recent releases. |
| `discard` / `rollback` | Archive an open draft / revert a deployed playbook version. |
| `evaluate` | Run the live config's placement/entitlement decisions for a user context. |
| `preview` | Runtime-impact preview of a draft playbook version. |
| `promote` | Promote a compiled config from one environment to another. |

## Schema validation

Validation is **mandatory** and runs fully offline against a vendored,
version-stamped snapshot of RevTurbine's `ExportedConfigSchema`
(`src/schema/`, regenerated from the canonical schema via
`npm run generate:schema`). The CLI never uploads a config it could not
validate. `revturbine --version` reports both the CLI version and the schema
snapshot version.

## License

MIT — see [LICENSE](./LICENSE).
