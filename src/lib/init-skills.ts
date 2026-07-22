/**
 * The Agent-Skills half of `revturbine init` (plan 142 TASK-6 / TASK-7).
 *
 * Skills are installed by delegating to the open ecosystem tool `npx skills`
 * (plan 142 REQ-8) — this CLI vendors no skill files and writes no
 * `skills-lock.json` itself. `npx skills` already auto-detects the coding agent
 * across ~70 harnesses, so it owns the install target; this module only needs
 * to (a) build the delegation command and (b) print the harness-native way to
 * invoke the start-here skill, which the ecosystem tool can't know.
 *
 * Pure and env-injected, so the harness table and the final-output block are
 * unit-tested without spawning anything.
 */

export const SKILLS_SOURCE = 'revt-eng/revturbine-skills';
export const START_HERE_SKILL = 'revturbine-start-here';

export type Harness = {
  /** Short label for display; null when the harness is unknown. */
  label: string | null;
  /** Exactly how to invoke the start-here skill in this harness. */
  invocation: string;
};

/**
 * Identify the coding agent from its environment, for the final-output line
 * only. Conservative on purpose: a WRONG invocation is worse than a neutral one
 * (an entry line that silently doesn't resolve breaks the whole hand-off), so
 * anything not confidently recognized falls back to a harness-neutral ask.
 */
export function detectHarness(env: Record<string, string | undefined>): Harness {
  if (env['CLAUDECODE'] || env['CLAUDE_CODE_SESSION_ID'] || env['CLAUDE_CODE_ENTRYPOINT']) {
    return { label: 'Claude Code', invocation: `Run the skill:  /${START_HERE_SKILL}` };
  }
  if (env['CURSOR_TRACE_ID'] || env['CURSOR']) {
    return { label: 'Cursor', invocation: `Mention the skill:  @${START_HERE_SKILL}` };
  }
  return {
    label: null,
    invocation: `Ask your coding agent to run the "${START_HERE_SKILL}" skill.`,
  };
}

/**
 * The `npx skills add …` argv. `-y` for non-interactive/CI; `--copy` because a
 * committed customer repo wants real files, not symlinks (which are fragile on
 * Windows). The agent target is left to `npx skills`' own auto-detection.
 */
export function skillsAddArgs(source: string = SKILLS_SOURCE): string[] {
  return ['--yes', 'skills', 'add', source, '-y', '--copy'];
}

/** How the skills step resolved — drives both the output and the JSON. */
export type SkillsOutcome = 'installed' | 'skipped' | 'failed';

/**
 * The closing summary a builder sees (plan 142 REQ-12) — the last words the
 * generator says, which are the skill entry point. Returned as lines so the
 * caller controls the stream and tests can assert exact content.
 */
export function finalOutputLines(params: {
  managerLabel: string;
  installedSdkAndCli: boolean;
  cliVersion: string;
  playbookAdded: boolean;
  skills: SkillsOutcome;
  harness: Harness;
}): string[] {
  const lines: string[] = ['', 'RevTurbine is set up.', ''];

  if (params.installedSdkAndCli) {
    lines.push(`  ✓ Installed the SDK and pinned the CLI (${params.cliVersion}) to this repo`);
  }
  if (params.playbookAdded) {
    lines.push('  ✓ Added a starter playbook (local mode — no account needed)');
  }
  if (params.skills === 'installed') {
    lines.push('  ✓ Installed the Agent Skills');
  } else if (params.skills === 'skipped') {
    lines.push('  • Skipped the Agent Skills (--no-skills)');
  } else {
    lines.push('  ⚠ Agent Skills not installed — see above to add them by hand');
  }

  lines.push('', 'Next step:');
  lines.push(`  ${params.harness.invocation}`);
  if (params.harness.label) lines.push(`  (detected ${params.harness.label})`);

  lines.push('', 'Your setup path:');
  lines.push('  create playbook → billing → app wiring → verify → launch');
  lines.push('', 'Docs: https://revturbine.com/docs', '');

  return lines;
}
