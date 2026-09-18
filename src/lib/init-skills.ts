/**
 * The Agent-Skills half of `revturbine init` (plan 142 TASK-6 / TASK-7).
 *
 * Skills are installed by delegating to the open ecosystem tool `npx skills`
 * (plan 142 REQ-8) — this CLI vendors no skill files and writes no
 * `skills-lock.json` itself. Always supply a validated installer target:
 * an unscoped non-interactive install can write to every detected agent.
 *
 * Pure and env-injected, so the harness table and the final-output block are
 * unit-tested without spawning anything.
 */

export const SKILLS_SOURCE = 'revt-eng/revturbine-skills';
export const START_HERE_SKILL = 'revturbine-start-here';
export const SUPPORTED_AGENTS = ['claude-code', 'cursor', 'codex'] as const;
export type AgentId = (typeof SUPPORTED_AGENTS)[number];

export function isAgentId(value: string): value is AgentId {
  return SUPPORTED_AGENTS.some((id) => id === value);
}

export type Harness = {
  agentId: AgentId | null;
  /** Short label for display; null when the harness is unknown. */
  label: string | null;
  /** Exactly how to invoke the start-here skill in this harness. */
  invocation: string;
};

/**
 * The installer IDs are the upstream `skills --agent` identifiers, not labels.
 * Explicit selection wins; an unknown environment never starts an unscoped install.
 */
export function detectHarness(env: Record<string, string | undefined>, explicit?: AgentId): Harness {
  let agentId = explicit;
  if (!agentId) {
    if (env['CLAUDECODE'] || env['CLAUDE_CODE_SESSION_ID'] || env['CLAUDE_CODE_ENTRYPOINT']) agentId = 'claude-code';
    else if (env['CURSOR_TRACE_ID'] || env['CURSOR']) agentId = 'cursor';
    else if (env['CODEX_THREAD_ID']) agentId = 'codex';
  }
  if (agentId === 'claude-code') {
    return { agentId, label: 'Claude Code', invocation: `Run the skill:  /${START_HERE_SKILL}` };
  }
  if (agentId === 'cursor') {
    return { agentId, label: 'Cursor', invocation: `Mention the skill:  @${START_HERE_SKILL}` };
  }
  if (agentId === 'codex') {
    return { agentId, label: 'Codex', invocation: `Run the skill:  $${START_HERE_SKILL}` };
  }
  return {
    agentId: null,
    label: null,
    invocation: `Ask your coding agent to run the "${START_HERE_SKILL}" skill.`,
  };
}

/**
 * The `npx skills add …` argv. `-y` for non-interactive/CI; `--copy` because a
 * committed customer repo wants real files, not symlinks (which are fragile on
 * Windows). The required agent prevents upstream's all-agent fallback.
 */
export function skillsAddArgs(agent: AgentId): string[] {
  return ['--yes', 'skills', 'add', SKILLS_SOURCE, '-y', '--copy', '-a', agent];
}

/** How the skills step resolved — drives both the output and the JSON. */
export type SkillsOutcome = 'installed' | 'skipped' | 'unknown' | 'failed';

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
  } else if (params.skills === 'unknown') {
    lines.push('  • Agent Skills not installed — select a target with --agent');
  } else {
    lines.push('  ⚠ Agent Skills not installed — see above to add them by hand');
  }

  lines.push('', 'Next step:');
  lines.push(`  ${params.harness.invocation}`);
  if (params.harness.label) lines.push(`  (${params.harness.label})`);

  lines.push('', 'Your setup path:');
  lines.push('  create playbook → app wiring → billing → verify → launch');
  lines.push('', 'Docs: https://revturbine.com/docs', '');

  return lines;
}
