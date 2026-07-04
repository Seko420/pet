import { spawn, type ChildProcess } from 'node:child_process';
import type { BuildExitEvent, BuildOutputEvent, BuildRequest } from '../../shared/ipc';
import { createId, nowIso } from '@egf/core';
import type { Db } from '../db/database';
import type { ProjectsService } from './projects';
import type { RobloxService } from './roblox';

type BuildSink = (event: { type: 'output'; payload: BuildOutputEvent } | { type: 'exit'; payload: BuildExitEvent }) => void;

/**
 * Build console backend. Only a FIXED set of tasks can run - never a
 * free-form shell string from the renderer. Output streams line-by-line
 * to the UI; results land in build_records for the dashboard.
 */
export class BuildService {
  private sink: BuildSink = () => {};
  private running = new Map<string, ChildProcess>();

  constructor(
    private readonly db: Db,
    private readonly projects: ProjectsService,
    private readonly roblox: RobloxService,
  ) {}

  setSink(sink: BuildSink): void {
    this.sink = sink;
  }

  run(request: BuildRequest): { runId: string } {
    const project = this.projects.require(request.projectId);
    const runId = createId('run');

    const emitInfo = (line: string): void =>
      this.sink({ type: 'output', payload: { runId, projectId: project.id, stream: 'info', line } });

    if (request.task === 'validate_project') {
      // Synchronous validation - no external process involved.
      setTimeout(() => {
        try {
          emitInfo('Validiere Roblox-Projekt…');
          const result = this.roblox.validate(project.id);
          for (const issue of result.issues) {
            this.sink({
              type: 'output',
              payload: { runId, projectId: project.id, stream: issue.severity === 'error' ? 'stderr' : 'stdout', line: `[${issue.severity}] ${issue.message}` },
            });
          }
          const summary = result.ok
            ? `Validierung ok (${result.checkedFiles} Dateien geprüft)`
            : `Validierung fehlgeschlagen (${result.issues.filter((i) => i.severity === 'error').length} Fehler)`;
          this.record(project.id, 'test', result.ok, summary);
          this.sink({ type: 'exit', payload: { runId, projectId: project.id, ok: result.ok, exitCode: result.ok ? 0 : 1, summary } });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          this.sink({ type: 'exit', payload: { runId, projectId: project.id, ok: false, exitCode: 1, summary: message } });
        }
      }, 10);
      return { runId };
    }

    let command: string;
    let args: string[];
    let cwd: string;
    let installHint: string;

    if (request.task === 'rojo_build' || request.task === 'rojo_sourcemap') {
      const rojoPath = project.roblox?.rojoProjectPath;
      if (!rojoPath) throw new Error('Kein Rojo-Projekt vorhanden - zuerst im Roblox-Tab generieren.');
      command = 'rojo';
      args =
        request.task === 'rojo_build'
          ? ['build', '-o', `build/${project.slug}.rbxlx`]
          : ['sourcemap', '-o', 'sourcemap.json'];
      cwd = rojoPath;
      installHint = 'rojo wurde nicht gefunden. Installation: aftman install im Rojo-Projektordner (aftman: https://github.com/LPGhatguy/aftman) oder rojo.space/docs.';
    } else {
      const godotPath = project.mobile?.godotProjectPath;
      if (!godotPath) throw new Error('Kein Godot-Projekt vorhanden - zuerst im Mobile-Tab generieren.');
      command = 'godot';
      args = ['--headless', '--check-only', '--path', godotPath];
      cwd = godotPath;
      installHint = 'godot wurde nicht gefunden. Godot 4.3+ von godotengine.org laden und die ausführbare Datei in den PATH legen (oder als "godot" verlinken).';
    }

    emitInfo(`> ${command} ${args.join(' ')}`);
    let child: ChildProcess;
    try {
      child = spawn(command, args, { cwd, shell: false });
    } catch {
      throw new Error(installHint);
    }
    this.running.set(runId, child);

    const forward = (stream: 'stdout' | 'stderr') => (chunk: Buffer) => {
      for (const line of chunk.toString('utf-8').split('\n')) {
        if (line.trim().length === 0) continue;
        this.sink({ type: 'output', payload: { runId, projectId: project.id, stream, line } });
      }
    };
    child.stdout?.on('data', forward('stdout'));
    child.stderr?.on('data', forward('stderr'));

    child.on('error', (err: NodeJS.ErrnoException) => {
      this.running.delete(runId);
      const summary = err.code === 'ENOENT' ? installHint : `Prozessfehler: ${err.message}`;
      this.record(project.id, 'build', false, summary);
      this.sink({ type: 'exit', payload: { runId, projectId: project.id, ok: false, exitCode: null, summary } });
    });

    child.on('exit', (code) => {
      this.running.delete(runId);
      const ok = code === 0;
      const summary = ok ? `${command} erfolgreich abgeschlossen` : `${command} beendet mit Exit-Code ${code}`;
      this.record(project.id, 'build', ok, summary);
      this.sink({ type: 'exit', payload: { runId, projectId: project.id, ok, exitCode: code, summary } });
    });

    return { runId };
  }

  cancel(runId: string): void {
    const child = this.running.get(runId);
    if (child) {
      child.kill('SIGTERM');
      this.running.delete(runId);
    }
  }

  private record(projectId: string, kind: 'build' | 'test', ok: boolean, summary: string): void {
    this.db
      .prepare('INSERT INTO build_records (id, project_id, kind, ok, at, summary) VALUES (?, ?, ?, ?, ?, ?)')
      .run(createId('bld'), projectId, kind, ok ? 1 : 0, nowIso(), summary.slice(0, 500));
  }
}
