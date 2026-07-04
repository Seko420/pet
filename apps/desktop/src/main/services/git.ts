import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { buildCommitMessagePrompt } from '@egf/ai-kit';
import type { CommitSuggestion, GitStatusInfo } from '../../shared/ipc';
import type { AiService } from './ai';
import type { ProjectsService } from './projects';

const execFileAsync = promisify(execFile);

/**
 * Git integration via the system git binary.
 * SECURITY: execFile with argument arrays only - no shell, no string
 * interpolation of user input into commands.
 */
export class GitService {
  constructor(
    private readonly projects: ProjectsService,
    private readonly ai: AiService,
  ) {}

  private workspace(projectId: string): string {
    const project = this.projects.require(projectId);
    if (!project.workspacePath) {
      throw new Error('Dieses Projekt hat noch keinen Projektordner. Übersicht → "Projektordner erzeugen".');
    }
    return project.workspacePath;
  }

  private async git(cwd: string, args: string[]): Promise<string> {
    try {
      const { stdout } = await execFileAsync('git', args, { cwd, timeout: 20000 });
      return stdout;
    } catch (err) {
      const e = err as NodeJS.ErrnoException & { stderr?: string };
      if (e.code === 'ENOENT') {
        throw new Error('git wurde nicht gefunden. Bitte Git installieren (git-scm.com) und die App neu starten.');
      }
      throw new Error(`Git-Fehler: ${(e.stderr || e.message || '').toString().trim().slice(0, 400)}`);
    }
  }

  async status(projectId: string): Promise<GitStatusInfo> {
    const cwd = this.workspace(projectId);
    try {
      await execFileAsync('git', ['rev-parse', '--is-inside-work-tree'], { cwd, timeout: 10000 });
    } catch {
      return { isRepo: false, branch: null, staged: [], unstaged: [], untracked: [], ahead: 0, behind: 0, lastCommits: [] };
    }

    const branch = (await this.git(cwd, ['rev-parse', '--abbrev-ref', 'HEAD'])).trim();
    const porcelain = await this.git(cwd, ['status', '--porcelain']);
    const staged: string[] = [];
    const unstaged: string[] = [];
    const untracked: string[] = [];
    for (const line of porcelain.split('\n')) {
      if (!line.trim()) continue;
      const x = line[0] ?? ' ';
      const y = line[1] ?? ' ';
      const file = line.slice(3);
      if (x === '?' && y === '?') untracked.push(file);
      else {
        if (x !== ' ') staged.push(file);
        if (y !== ' ') unstaged.push(file);
      }
    }
    let lastCommits: GitStatusInfo['lastCommits'] = [];
    try {
      const log = await this.git(cwd, ['log', '-10', '--pretty=format:%h%x1f%s%x1f%ci']);
      lastCommits = log
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const [hash = '', message = '', date = ''] = line.split('\x1f');
          return { hash, message, date };
        });
    } catch {
      // Fresh repo without commits - fine.
    }
    return { isRepo: true, branch, staged, unstaged, untracked, ahead: 0, behind: 0, lastCommits };
  }

  async init(projectId: string): Promise<GitStatusInfo> {
    const cwd = this.workspace(projectId);
    await this.git(cwd, ['init']);
    return this.status(projectId);
  }

  async suggestCommit(projectId: string): Promise<CommitSuggestion> {
    const cwd = this.workspace(projectId);
    const status = await this.status(projectId);
    if (!status.isRepo) throw new Error('Noch kein Git-Repository - zuerst "Git initialisieren".');
    const files = [...new Set([...status.staged, ...status.unstaged, ...status.untracked])];
    if (files.length === 0) {
      return { message: 'chore: no changes', body: 'Keine Änderungen zum Committen gefunden.', files: [] };
    }
    let diffStat = '';
    try {
      diffStat = await this.git(cwd, ['diff', '--stat']);
    } catch {
      /* ignore */
    }

    // Try AI, fall back to a heuristic - never block the workflow on the model.
    const provider = this.ai.getProvider();
    const providerStatus = await provider.status();
    if (providerStatus.configured) {
      try {
        const { system, user } = buildCommitMessagePrompt(diffStat, files);
        const result = await provider.complete({
          system,
          messages: [{ role: 'user', content: user }],
          jsonMode: true,
          maxTokens: 500,
        });
        const parsed = JSON.parse(result.text) as { message?: string; body?: string };
        if (parsed.message) {
          return { message: parsed.message.slice(0, 72), body: parsed.body ?? '', files };
        }
      } catch {
        // fall through to heuristic
      }
    }
    const topDir = files[0]?.split('/')[0] ?? 'project';
    return {
      message: `feat(${topDir}): update ${files.length} file${files.length === 1 ? '' : 's'}`,
      body: files.slice(0, 15).map((f) => `- ${f}`).join('\n'),
      files,
    };
  }

  async commit(projectId: string, message: string): Promise<GitStatusInfo> {
    const cwd = this.workspace(projectId);
    if (!message.trim()) throw new Error('Commit-Nachricht darf nicht leer sein.');
    await this.git(cwd, ['add', '-A']);
    await this.git(cwd, ['commit', '-m', message.trim()]);
    return this.status(projectId);
  }
}
