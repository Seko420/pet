import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  AnalyticsPlan,
  ContentItem,
  GameIdea,
  GddDocument,
  IdeaBrief,
  ScoreEvaluation,
  TaskItem,
} from '@egf/core';
import {
  createId,
  evaluateConcept,
  gddToMarkdown,
  generateAnalyticsPlan,
  generateContentPlan,
  generateGddSections,
  generateIdeas,
  generateTaskPlan,
  getChecklistsForProject,
  nowIso,
  profileFromProject,
  suggestImprovements,
} from '@egf/core';
import type { ChecklistState, TaskCreateInput, TaskUpdateInput } from '../../shared/ipc';
import type { Db } from '../db/database';
import type { ProjectsService } from './projects';

/**
 * Thin persistence layer over the deterministic engines in @egf/core.
 * Everything here is synchronous SQLite work - no network, no side quests.
 */

// ---------------------------------------------------------------------------
// Ideas
// ---------------------------------------------------------------------------

export class IdeasService {
  constructor(private readonly db: Db) {}

  generate(brief: IdeaBrief): GameIdea[] {
    return generateIdeas(brief);
  }

  save(idea: GameIdea): GameIdea {
    this.db
      .prepare('INSERT OR REPLACE INTO ideas (id, created_at, data) VALUES (?, ?, ?)')
      .run(idea.id, idea.createdAt, JSON.stringify(idea));
    return idea;
  }

  list(): GameIdea[] {
    const rows = this.db.prepare('SELECT data FROM ideas ORDER BY created_at DESC').all() as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as GameIdea);
  }

  get(id: string): GameIdea | null {
    const row = this.db.prepare('SELECT data FROM ideas WHERE id = ?').get(id) as { data: string } | undefined;
    return row ? (JSON.parse(row.data) as GameIdea) : null;
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM ideas WHERE id = ?').run(id);
  }
}

// ---------------------------------------------------------------------------
// GDD
// ---------------------------------------------------------------------------

export class GddService {
  constructor(
    private readonly db: Db,
    private readonly projects: ProjectsService,
    private readonly ideas: IdeasService,
    private readonly documentsPath: string,
  ) {}

  getForProject(projectId: string): GddDocument | null {
    const row = this.db.prepare('SELECT data FROM gdds WHERE project_id = ?').get(projectId) as
      | { data: string }
      | undefined;
    return row ? (JSON.parse(row.data) as GddDocument) : null;
  }

  generate(projectId: string): GddDocument {
    const project = this.projects.require(projectId);
    const idea = project.ideaId ? this.ideas.get(project.ideaId) : null;
    const sections = generateGddSections(project, idea);
    const existing = this.getForProject(projectId);
    const now = nowIso();
    const doc: GddDocument = {
      id: existing?.id ?? createId('gdd'),
      projectId,
      version: (existing?.version ?? 0) + 1,
      sections,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.persist(doc);
    return doc;
  }

  saveSection(projectId: string, sectionId: string, markdown: string): GddDocument {
    const doc = this.getForProject(projectId);
    if (!doc) throw new Error('Für dieses Projekt existiert noch kein GDD - zuerst generieren.');
    const section = doc.sections.find((s) => s.id === sectionId);
    if (!section) throw new Error(`Unbekannte GDD-Sektion: ${sectionId}`);
    section.markdown = markdown;
    doc.version += 1;
    doc.updatedAt = nowIso();
    this.persist(doc);
    return doc;
  }

  exportMarkdown(projectId: string): { path: string } {
    const project = this.projects.require(projectId);
    const doc = this.getForProject(projectId);
    if (!doc) throw new Error('Für dieses Projekt existiert noch kein GDD - zuerst generieren.');
    const markdown = gddToMarkdown(doc.sections, project.name);
    const dir = project.workspacePath ? join(project.workspacePath, 'docs') : join(this.documentsPath, 'EmpireGameForge');
    const filePath = join(dir, `GDD-${project.slug}.md`);
    try {
      writeFileSync(filePath, markdown, 'utf-8');
    } catch {
      throw new Error(
        'GDD-Export fehlgeschlagen. Existiert der Projektordner? (Übersicht → Projektordner erzeugen)',
      );
    }
    return { path: filePath };
  }

  private persist(doc: GddDocument): void {
    this.db
      .prepare('INSERT OR REPLACE INTO gdds (id, project_id, version, updated_at, data) VALUES (?, ?, ?, ?, ?)')
      .run(doc.id, doc.projectId, doc.version, doc.updatedAt, JSON.stringify(doc));
  }
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export class TasksService {
  constructor(
    private readonly db: Db,
    private readonly projects: ProjectsService,
  ) {}

  listForProject(projectId: string): TaskItem[] {
    const rows = this.db
      .prepare('SELECT data FROM tasks WHERE project_id = ? ORDER BY sort_order ASC')
      .all(projectId) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as TaskItem);
  }

  create(input: TaskCreateInput): TaskItem {
    this.projects.require(input.projectId);
    const maxRow = this.db
      .prepare('SELECT MAX(sort_order) AS m FROM tasks WHERE project_id = ?')
      .get(input.projectId) as { m: number | null };
    const now = nowIso();
    const task: TaskItem = {
      id: createId('task'),
      projectId: input.projectId,
      title: input.title.trim(),
      description: input.description?.trim() ?? '',
      status: 'todo',
      category: input.category,
      priority: input.priority,
      estimateHours: input.estimateHours ?? null,
      milestone: input.milestone?.trim() || 'MVP',
      sortOrder: (maxRow.m ?? -1) + 1,
      createdAt: now,
      updatedAt: now,
    };
    if (!task.title) throw new Error('Aufgaben brauchen einen Titel.');
    this.persist(task, true);
    return task;
  }

  update(input: TaskUpdateInput): TaskItem {
    const row = this.db.prepare('SELECT data FROM tasks WHERE id = ?').get(input.id) as { data: string } | undefined;
    if (!row) throw new Error('Aufgabe nicht gefunden.');
    const task = JSON.parse(row.data) as TaskItem;
    const { id: _id, ...patch } = input;
    const next: TaskItem = { ...task, ...patch, updatedAt: nowIso() };
    this.persist(next, false);
    return next;
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  }

  /** Add the generated plan, skipping tasks whose title already exists. */
  generateForProject(projectId: string): TaskItem[] {
    const project = this.projects.require(projectId);
    const existingTitles = new Set(this.listForProject(projectId).map((t) => t.title));
    const plan = generateTaskPlan(project).filter((t) => !existingTitles.has(t.title));
    const maxRow = this.db
      .prepare('SELECT MAX(sort_order) AS m FROM tasks WHERE project_id = ?')
      .get(projectId) as { m: number | null };
    let order = (maxRow.m ?? -1) + 1;
    const insert = this.db.transaction((tasks: TaskItem[]) => {
      for (const task of tasks) {
        task.sortOrder = order++;
        this.persist(task, true);
      }
    });
    insert(plan);
    return this.listForProject(projectId);
  }

  private persist(task: TaskItem, isNew: boolean): void {
    if (isNew) {
      this.db
        .prepare('INSERT INTO tasks (id, project_id, status, sort_order, data) VALUES (?, ?, ?, ?, ?)')
        .run(task.id, task.projectId, task.status, task.sortOrder, JSON.stringify(task));
    } else {
      this.db
        .prepare('UPDATE tasks SET status = ?, sort_order = ?, data = ? WHERE id = ?')
        .run(task.status, task.sortOrder, JSON.stringify(task), task.id);
    }
  }
}

// ---------------------------------------------------------------------------
// Scores
// ---------------------------------------------------------------------------

export class ScoresService {
  constructor(private readonly projects: ProjectsService) {}

  evaluateProject(projectId: string): ScoreEvaluation {
    const project = this.projects.require(projectId);
    const profile = profileFromProject(project);
    const scores = evaluateConcept(profile);
    const suggestions = suggestImprovements(profile, scores);
    this.projects.update(projectId, { scores });
    return { scores, suggestions, evaluatedAt: nowIso() };
  }
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export class ContentService {
  constructor(
    private readonly db: Db,
    private readonly projects: ProjectsService,
  ) {}

  listForProject(projectId: string): ContentItem[] {
    const rows = this.db.prepare('SELECT data FROM content_items WHERE project_id = ?').all(projectId) as {
      data: string;
    }[];
    return rows.map((r) => JSON.parse(r.data) as ContentItem);
  }

  generatePlan(projectId: string): ContentItem[] {
    const project = this.projects.require(projectId);
    const existingNames = new Set(this.listForProject(projectId).map((i) => `${i.category}:${i.name}`));
    const plan = generateContentPlan(project).filter((i) => !existingNames.has(`${i.category}:${i.name}`));
    const insert = this.db.transaction((items: ContentItem[]) => {
      for (const item of items) {
        this.db
          .prepare('INSERT INTO content_items (id, project_id, data) VALUES (?, ?, ?)')
          .run(item.id, item.projectId, JSON.stringify(item));
      }
    });
    insert(plan);
    return this.listForProject(projectId);
  }

  update(id: string, patch: Partial<ContentItem>): ContentItem {
    const row = this.db.prepare('SELECT data FROM content_items WHERE id = ?').get(id) as { data: string } | undefined;
    if (!row) throw new Error('Content-Eintrag nicht gefunden.');
    const item = JSON.parse(row.data) as ContentItem;
    const { id: _id, projectId: _p, ...safePatch } = patch;
    const next: ContentItem = { ...item, ...safePatch, updatedAt: nowIso() };
    this.db.prepare('UPDATE content_items SET data = ? WHERE id = ?').run(JSON.stringify(next), id);
    return next;
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM content_items WHERE id = ?').run(id);
  }
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export class AnalyticsService {
  constructor(
    private readonly db: Db,
    private readonly projects: ProjectsService,
  ) {}

  getPlan(projectId: string): AnalyticsPlan | null {
    const row = this.db.prepare('SELECT data FROM analytics_plans WHERE project_id = ?').get(projectId) as
      | { data: string }
      | undefined;
    return row ? (JSON.parse(row.data) as AnalyticsPlan) : null;
  }

  generatePlan(projectId: string): AnalyticsPlan {
    const project = this.projects.require(projectId);
    const plan = generateAnalyticsPlan(project);
    this.db
      .prepare('INSERT OR REPLACE INTO analytics_plans (project_id, data) VALUES (?, ?)')
      .run(projectId, JSON.stringify(plan));
    return plan;
  }
}

// ---------------------------------------------------------------------------
// Checklists
// ---------------------------------------------------------------------------

export class ChecklistsService {
  constructor(
    private readonly db: Db,
    private readonly projects: ProjectsService,
  ) {}

  getForProject(projectId: string): ChecklistState[] {
    const project = this.projects.require(projectId);
    const lists = getChecklistsForProject(project);
    const rows = this.db
      .prepare('SELECT checklist_kind, item_id FROM checklist_state WHERE project_id = ? AND done = 1')
      .all(projectId) as { checklist_kind: string; item_id: string }[];
    const doneByKind = new Map<string, Set<string>>();
    for (const row of rows) {
      const set = doneByKind.get(row.checklist_kind) ?? new Set<string>();
      set.add(row.item_id);
      doneByKind.set(row.checklist_kind, set);
    }
    return lists.map((checklist) => ({
      checklist,
      completedItemIds: checklist.items
        .map((i) => i.id)
        .filter((id) => doneByKind.get(checklist.kind)?.has(id) ?? false),
    }));
  }

  toggleItem(projectId: string, checklistKind: string, itemId: string, done: boolean): ChecklistState[] {
    this.projects.require(projectId);
    this.db
      .prepare(
        'INSERT INTO checklist_state (project_id, checklist_kind, item_id, done) VALUES (?, ?, ?, ?) ON CONFLICT(project_id, checklist_kind, item_id) DO UPDATE SET done = excluded.done',
      )
      .run(projectId, checklistKind, itemId, done ? 1 : 0);
    return this.getForProject(projectId);
  }
}
