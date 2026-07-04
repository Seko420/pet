import type { PlaytestFinding, PlaytestSession, TaskItem } from '@egf/core';
import { createId, nowIso, PLAYTEST_CATEGORY_LABELS } from '@egf/core';
import type { Db } from '../db/database';
import type { ProjectsService } from './projects';
import type { TasksService } from './studio';

/**
 * Playtest feedback: sessions + findings, with one-click conversion of a
 * finding into a task on the board.
 */
export class PlaytestsService {
  constructor(
    private readonly db: Db,
    private readonly projects: ProjectsService,
    private readonly tasks: TasksService,
  ) {}

  listForProject(projectId: string): PlaytestSession[] {
    const rows = this.db
      .prepare('SELECT data FROM playtest_sessions WHERE project_id = ? ORDER BY created_at DESC')
      .all(projectId) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as PlaytestSession);
  }

  private getSession(id: string): PlaytestSession {
    const row = this.db.prepare('SELECT data FROM playtest_sessions WHERE id = ?').get(id) as
      | { data: string }
      | undefined;
    if (!row) throw new Error('Playtest-Session nicht gefunden.');
    return JSON.parse(row.data) as PlaytestSession;
  }

  private persist(session: PlaytestSession, isNew: boolean): void {
    session.updatedAt = nowIso();
    if (isNew) {
      this.db
        .prepare('INSERT INTO playtest_sessions (id, project_id, created_at, data) VALUES (?, ?, ?, ?)')
        .run(session.id, session.projectId, session.createdAt, JSON.stringify(session));
    } else {
      this.db.prepare('UPDATE playtest_sessions SET data = ? WHERE id = ?').run(JSON.stringify(session), session.id);
    }
  }

  create(input: {
    projectId: string;
    title: string;
    playedAt: string;
    testerCount: number;
    buildLabel?: string;
    notes?: string;
  }): PlaytestSession {
    this.projects.require(input.projectId);
    if (!input.title.trim()) throw new Error('Die Session braucht einen Titel.');
    const now = nowIso();
    const session: PlaytestSession = {
      id: createId('pt'),
      projectId: input.projectId,
      title: input.title.trim(),
      playedAt: input.playedAt.trim() || now.slice(0, 10),
      testerCount: Math.max(1, Math.floor(input.testerCount || 1)),
      buildLabel: input.buildLabel?.trim() ?? '',
      notes: input.notes?.trim() ?? '',
      findings: [],
      createdAt: now,
      updatedAt: now,
    };
    this.persist(session, true);
    return session;
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM playtest_sessions WHERE id = ?').run(id);
  }

  addFinding(
    sessionId: string,
    finding: Omit<PlaytestFinding, 'id' | 'convertedTaskId'>,
  ): PlaytestSession {
    const session = this.getSession(sessionId);
    if (!finding.description.trim()) throw new Error('Das Finding braucht eine Beschreibung.');
    session.findings.push({
      ...finding,
      description: finding.description.trim(),
      location: finding.location.trim(),
      id: createId('ptf'),
      convertedTaskId: null,
    });
    this.persist(session, false);
    return session;
  }

  removeFinding(sessionId: string, findingId: string): PlaytestSession {
    const session = this.getSession(sessionId);
    session.findings = session.findings.filter((f) => f.id !== findingId);
    this.persist(session, false);
    return session;
  }

  /** Turn a finding into a board task and link it back. */
  convertFindingToTask(sessionId: string, findingId: string): { session: PlaytestSession; task: TaskItem } {
    const session = this.getSession(sessionId);
    const finding = session.findings.find((f) => f.id === findingId);
    if (!finding) throw new Error('Finding nicht gefunden.');
    if (finding.convertedTaskId) throw new Error('Dieses Finding wurde bereits in eine Aufgabe übernommen.');

    const categoryMap = {
      bug: 'qa',
      confusion: 'ui_ux',
      frustration: 'design',
      boredom: 'design',
      delight: 'design',
      suggestion: 'design',
    } as const;
    const priorityMap = { low: 'low', medium: 'medium', high: 'high' } as const;

    const task = this.tasks.create({
      projectId: session.projectId,
      title: `Playtest: ${finding.description.slice(0, 70)}${finding.description.length > 70 ? '…' : ''}`,
      description: `Aus Playtest „${session.title}" (${session.playedAt})\nKategorie: ${PLAYTEST_CATEGORY_LABELS[finding.category]}\nOrt: ${finding.location || 'unbekannt'}\n\n${finding.description}`,
      category: categoryMap[finding.category],
      priority: priorityMap[finding.severity],
      milestone: 'MVP',
    });
    finding.convertedTaskId = task.id;
    this.persist(session, false);
    return { session, task };
  }
}
