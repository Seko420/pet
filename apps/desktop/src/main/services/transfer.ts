import { readFileSync, writeFileSync } from 'node:fs';
import type {
  AnalyticsPlan,
  ContentItem,
  GameProject,
  GddDocument,
  PlaytestSession,
  TaskItem,
} from '@egf/core';
import { createId, nowIso, slugify } from '@egf/core';
import type { Db } from '../db/database';
import type { ProjectsService } from './projects';

/**
 * Project export/import as a single JSON bundle - the foundation for
 * sharing, templates and later team features. IDs are remapped on import
 * so a bundle can be imported repeatedly without collisions.
 */

const BUNDLE_KIND = 'egf-project-bundle';
const BUNDLE_VERSION = 1;

interface ProjectBundle {
  kind: typeof BUNDLE_KIND;
  version: number;
  exportedAt: string;
  project: GameProject;
  gdd: GddDocument | null;
  tasks: TaskItem[];
  content: ContentItem[];
  analytics: AnalyticsPlan | null;
  checklistState: { checklistKind: string; itemId: string; done: boolean }[];
  playtests: PlaytestSession[];
}

export class TransferService {
  constructor(
    private readonly db: Db,
    private readonly projects: ProjectsService,
  ) {}

  buildBundle(projectId: string): ProjectBundle {
    const project = this.projects.require(projectId);
    const one = <T>(sql: string): T | null => {
      const row = this.db.prepare(sql).get(projectId) as { data: string } | undefined;
      return row ? (JSON.parse(row.data) as T) : null;
    };
    const many = <T>(sql: string): T[] => {
      const rows = this.db.prepare(sql).all(projectId) as { data: string }[];
      return rows.map((r) => JSON.parse(r.data) as T);
    };
    const checklistState = this.db
      .prepare('SELECT checklist_kind, item_id, done FROM checklist_state WHERE project_id = ?')
      .all(projectId) as { checklist_kind: string; item_id: string; done: number }[];

    return {
      kind: BUNDLE_KIND,
      version: BUNDLE_VERSION,
      exportedAt: nowIso(),
      project,
      gdd: one<GddDocument>('SELECT data FROM gdds WHERE project_id = ?'),
      tasks: many<TaskItem>('SELECT data FROM tasks WHERE project_id = ? ORDER BY sort_order'),
      content: many<ContentItem>('SELECT data FROM content_items WHERE project_id = ?'),
      analytics: one<AnalyticsPlan>('SELECT data FROM analytics_plans WHERE project_id = ?'),
      checklistState: checklistState.map((r) => ({ checklistKind: r.checklist_kind, itemId: r.item_id, done: r.done === 1 })),
      playtests: many<PlaytestSession>('SELECT data FROM playtest_sessions WHERE project_id = ?'),
    };
  }

  exportToFile(projectId: string, filePath: string): void {
    const bundle = this.buildBundle(projectId);
    writeFileSync(filePath, JSON.stringify(bundle, null, 2), 'utf-8');
  }

  /** Dialog-free export - used by the web mode for browser downloads. */
  exportData(projectId: string): { fileName: string; json: string } {
    const bundle = this.buildBundle(projectId);
    return { fileName: `${bundle.project.slug}.egf.json`, json: JSON.stringify(bundle, null, 2) };
  }

  importFromFile(filePath: string): GameProject {
    let text: string;
    try {
      text = readFileSync(filePath, 'utf-8');
    } catch {
      throw new Error('Die Datei konnte nicht gelesen werden.');
    }
    return this.importData(text);
  }

  /** Dialog-free import - used by the web mode for browser uploads. */
  importData(json: string): GameProject {
    let raw: unknown;
    try {
      raw = JSON.parse(json);
    } catch {
      throw new Error('Die Datei ist kein gültiges JSON.');
    }
    const bundle = raw as Partial<ProjectBundle>;
    if (bundle.kind !== BUNDLE_KIND || !bundle.project) {
      throw new Error('Die Datei ist kein Empire-Game-Forge-Projektpaket (.egf.json).');
    }
    if ((bundle.version ?? 0) > BUNDLE_VERSION) {
      throw new Error('Das Projektpaket stammt aus einer neueren App-Version - bitte App aktualisieren.');
    }

    const now = nowIso();
    const newId = createId('prj');
    const existingSlugs = new Set(this.projects.list().map((p) => p.slug));
    let slug = slugify(bundle.project.name);
    for (let i = 2; existingSlugs.has(slug); i++) slug = `${slugify(bundle.project.name)}-${i}`;

    const project: GameProject = {
      ...bundle.project,
      id: newId,
      slug,
      // Machine-local state does not travel: paths and key references reset.
      workspacePath: null,
      roblox: bundle.project.roblox
        ? { ...bundle.project.roblox, apiKeySecretId: null, rojoProjectPath: null }
        : null,
      mobile: bundle.project.mobile ? { ...bundle.project.mobile, godotProjectPath: null } : null,
      createdAt: now,
      updatedAt: now,
    };

    const insertAll = this.db.transaction(() => {
      this.projects.persist(project, true);
      if (bundle.gdd) {
        const gdd: GddDocument = { ...bundle.gdd, id: createId('gdd'), projectId: newId };
        this.db
          .prepare('INSERT INTO gdds (id, project_id, version, updated_at, data) VALUES (?, ?, ?, ?, ?)')
          .run(gdd.id, newId, gdd.version, now, JSON.stringify(gdd));
      }
      for (const [i, task] of (bundle.tasks ?? []).entries()) {
        const next: TaskItem = { ...task, id: createId('task'), projectId: newId, sortOrder: i };
        this.db
          .prepare('INSERT INTO tasks (id, project_id, status, sort_order, data) VALUES (?, ?, ?, ?, ?)')
          .run(next.id, newId, next.status, i, JSON.stringify(next));
      }
      for (const item of bundle.content ?? []) {
        const next: ContentItem = { ...item, id: createId('cnt'), projectId: newId };
        this.db
          .prepare('INSERT INTO content_items (id, project_id, data) VALUES (?, ?, ?)')
          .run(next.id, newId, JSON.stringify(next));
      }
      if (bundle.analytics) {
        this.db
          .prepare('INSERT INTO analytics_plans (project_id, data) VALUES (?, ?)')
          .run(newId, JSON.stringify({ ...bundle.analytics, projectId: newId }));
      }
      for (const state of bundle.checklistState ?? []) {
        this.db
          .prepare('INSERT INTO checklist_state (project_id, checklist_kind, item_id, done) VALUES (?, ?, ?, ?)')
          .run(newId, state.checklistKind, state.itemId, state.done ? 1 : 0);
      }
      for (const session of bundle.playtests ?? []) {
        const next: PlaytestSession = {
          ...session,
          id: createId('pt'),
          projectId: newId,
          // Task links reference the old project's tasks - reset them.
          findings: session.findings.map((f) => ({ ...f, id: createId('ptf'), convertedTaskId: null })),
        };
        this.db
          .prepare('INSERT INTO playtest_sessions (id, project_id, created_at, data) VALUES (?, ?, ?, ?)')
          .run(next.id, newId, next.createdAt, JSON.stringify(next));
      }
    });
    insertAll();
    return project;
  }
}
