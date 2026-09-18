import { describe, expect, it } from 'vitest';

import {
  SKILLS_SOURCE,
  START_HERE_SKILL,
  detectHarness,
  finalOutputLines,
  isAgentId,
  skillsAddArgs,
} from '../src/lib/init-skills';

describe('detectHarness', () => {
  it('recognizes Claude Code and gives a slash-command invocation', () => {
    const h = detectHarness({ CLAUDECODE: '1' });
    expect(h.label).toBe('Claude Code');
    expect(h.agentId).toBe('claude-code');
    expect(h.invocation).toContain(`/${START_HERE_SKILL}`);
  });

  it('recognizes Cursor and gives an @-mention invocation', () => {
    const h = detectHarness({ CURSOR_TRACE_ID: 'abc' });
    expect(h.label).toBe('Cursor');
    expect(h.agentId).toBe('cursor');
    expect(h.invocation).toContain(`@${START_HERE_SKILL}`);
  });

  it('falls back to a harness-neutral ask when unknown', () => {
    // A wrong invocation is worse than a neutral one — an entry line that
    // silently does not resolve breaks the whole hand-off.
    const h = detectHarness({});
    expect(h.label).toBeNull();
    expect(h.agentId).toBeNull();
    expect(h.invocation).toContain(START_HERE_SKILL);
    expect(h.invocation).not.toContain('/');
    expect(h.invocation).not.toContain('@');
  });

  it('recognizes Codex and honors an explicit target over inherited environment signals', () => {
    const h = detectHarness({ CODEX_THREAD_ID: 'thread' });
    expect(h.agentId).toBe('codex');
    expect(h.invocation).toContain(`$${START_HERE_SKILL}`);
    expect(detectHarness({ CLAUDECODE: '1' }, 'codex')).toEqual(h);
  });

  it('does not infer a running agent merely from an installed tools directory', () => {
    expect(detectHarness({ CODEX_HOME: '/tools/codex' }).agentId).toBeNull();
  });
});

describe('skillsAddArgs', () => {
  it('delegates to npx skills add for the public source, non-interactively, copying', () => {
    expect(skillsAddArgs('claude-code')).toEqual(['--yes', 'skills', 'add', SKILLS_SOURCE, '-y', '--copy', '-a', 'claude-code']);
  });

  it.each(['claude-code', 'cursor', 'codex'] as const)('always passes one valid target: %s', (agent) => {
    expect(skillsAddArgs(agent).slice(-2)).toEqual(['-a', agent]);
    expect(isAgentId(agent)).toBe(true);
  });

  it.each(['*', 'Claude Code', 'codex cursor', 'codex&echo-bad', '', '--all'])('rejects unsafe or unsupported selection %j', (value) => {
    expect(isAgentId(value)).toBe(false);
  });
});

describe('finalOutputLines', () => {
  const base = {
    managerLabel: 'npm',
    installedSdkAndCli: true,
    cliVersion: '0.8.0',
    playbookAdded: true,
    skills: 'installed' as const,
    harness: { agentId: 'claude-code' as const, label: 'Claude Code', invocation: `Run the skill:  /${START_HERE_SKILL}` },
  };

  it('names the harness-native entry point as the closing step', () => {
    const out = finalOutputLines(base).join('\n');
    expect(out).toContain(`/${START_HERE_SKILL}`);
    expect(out).toContain('Next step:');
    expect(out).toContain('create playbook → app wiring → billing → verify → launch');
  });

  it('reflects each step that actually happened', () => {
    const out = finalOutputLines(base).join('\n');
    expect(out).toContain('pinned the CLI (0.8.0)');
    expect(out).toContain('starter playbook');
    expect(out).toContain('Installed the Agent Skills');
  });

  it('surfaces a skills failure honestly rather than claiming success', () => {
    const out = finalOutputLines({ ...base, skills: 'failed' }).join('\n');
    expect(out).toContain('not installed');
    expect(out).not.toContain('✓ Installed the Agent Skills');
  });

  it('says skills were skipped under --no-skills', () => {
    const out = finalOutputLines({ ...base, skills: 'skipped' }).join('\n');
    expect(out).toContain('Skipped the Agent Skills');
  });

  it('shows no "(detected …)" line when the harness is unknown', () => {
    const out = finalOutputLines({
      ...base,
      harness: { agentId: null, label: null, invocation: `Ask your coding agent to run the "${START_HERE_SKILL}" skill.` },
    }).join('\n');
    expect(out).not.toContain('(detected');
    expect(out).toContain(START_HERE_SKILL);
  });

  it('explains an unknown-target skip without attributing it to --no-skills', () => {
    const out = finalOutputLines({ ...base, skills: 'unknown' }).join('\n');
    expect(out).toContain('--agent');
    expect(out).not.toContain('--no-skills');
    expect(out).not.toContain('✓ Installed the Agent Skills');
  });
});
