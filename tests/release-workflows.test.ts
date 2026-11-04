/**
 * BUG-1189 / ST-1453 TASK-5 — a scaffold schema publish ends in a CLI patch
 * release with no human step. The behaviour itself runs in GitHub Actions; this
 * pins the wiring so a refactor cannot silently cut the chain:
 * snapshot merge (version.ts changes) -> patch bump on main -> publish-on-main.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflow = (name: string) =>
  readFileSync(new URL(`../.github/workflows/${name}`, import.meta.url), 'utf8');

describe('snapshot -> patch release chain', () => {
  const snapshot = workflow('snapshot-patch-release.yml');
  const publish = workflow('publish-on-main.yml');

  it('starts when a merged snapshot changes the bundled schema version on main', () => {
    expect(snapshot).toMatch(/branches: \[main\]/);
    expect(snapshot).toContain("- 'src/schema/version.ts'");
  });

  it('only bumps when the current version is already on npm, and touches package files only', () => {
    expect(snapshot).toContain('npm view "@revturbine/cli@$VERSION"');
    expect(snapshot).toContain('npm version patch --no-git-tag-version');
    expect(snapshot).toContain('git add package.json package-lock.json');
  });

  it('hands off to the existing publish workflow by dispatch, not by a PAT', () => {
    expect(snapshot).toContain('gh workflow run publish-on-main.yml --ref main');
    expect(snapshot).not.toMatch(/\$\{\{\s*secrets\./);
    expect(publish).toMatch(/^ {2}workflow_dispatch:/m);
  });

  it('keeps publishing idempotent against the registry', () => {
    expect(publish).toContain('npm view "@revturbine/cli@$VERSION"');
  });
});
