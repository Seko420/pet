import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  AnalyticsPlan,
  ContentItem,
  GameIdea,
  Genre,
  GddDocument,
  IdeaBrief,
  MonetizationModel,
  RiskLevel,
  ScoreEvaluation,
  TaskCategory,
  TaskItem,
  TaskPriority,
} from '@egf/core';
import {
  GDD_SECTION_TITLES,
  GENRE_LABELS,
  MONETIZATION_LABELS,
  TASK_CATEGORY_LABELS,
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
import {
  buildGddSectionPrompt,
  buildIdeaGenPrompt,
  buildQualityReviewPrompt,
  buildTaskPlanPrompt,
} from '@egf/ai-kit';
import type { AiQualityReview, ChecklistState, TaskCreateInput, TaskUpdateInput } from '../../shared/ipc';
import type { Db } from '../db/database';
import type { AiService } from './ai';
import type { ProjectsService } from './projects';

/** Robustly extracts the first balanced top-level JSON object from a reply. */
function extractJsonObject(text: string): Record<string, unknown> {
  const start = text.indexOf('{');
  if (start < 0) throw new Error('KI-Antwort enthielt kein JSON-Objekt.');
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1)) as Record<string, unknown>;
        } catch {
          break;
        }
      }
    }
  }
  throw new Error('KI-Antwort war kein gültiges JSON - bitte erneut versuchen.');
}

const strArr = (v: unknown, max = 8): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).slice(0, max) : [];

/**
 * Thin persistence layer over the deterministic engines in @egf/core.
 * Everything here is synchronous SQLite work - no network, no side quests.
 */

// ---------------------------------------------------------------------------
// Ideas
// ---------------------------------------------------------------------------

export class IdeasService {
  constructor(
    private readonly db: Db,
    private readonly ai?: AiService,
  ) {}

  async generate(brief: IdeaBrief): Promise<GameIdea[]> {
    if (brief.useAi && this.ai?.isConfigured()) {
      try {
        return await this.generateWithAi(brief);
      } catch (err) {
        console.error('[Ideas] KI-Generierung fehlgeschlagen, Fallback auf Heuristik:', err instanceof Error ? err.message : err);
      }
    }
    return generateIdeas(brief);
  }

  /** ONE AI call produces all requested ideas; invalid pieces fall back to safe defaults. */
  private async generateWithAi(brief: IdeaBrief): Promise<GameIdea[]> {
    const ai = this.ai as AiService;
    const { system, user } = buildIdeaGenPrompt(brief);
    const result = await ai.run('idea_gen', {
      system,
      messages: [{ role: 'user', content: user }],
      jsonMode: true,
      maxTokens: 6000,
    });
    const parsed = extractJsonObject(result.text);
    const rawIdeas = Array.isArray(parsed.ideas) ? (parsed.ideas as Record<string, unknown>[]) : [];
    if (rawIdeas.length === 0) throw new Error('KI lieferte keine Ideen.');

    const validGenres = Object.keys(GENRE_LABELS) as Genre[];
    const validMonetization = Object.keys(MONETIZATION_LABELS) as MonetizationModel[];
    const fallbackGenre: Genre = brief.genres[0] ?? 'simulator';

    return rawIdeas.slice(0, Math.max(1, Math.min(brief.count, 10))).map((raw) => {
      const genre = validGenres.includes(raw.genre as Genre) ? (raw.genre as Genre) : fallbackGenre;
      const monetization = (Array.isArray(raw.monetization) ? (raw.monetization as Record<string, unknown>[]) : [])
        .filter((m) => validMonetization.includes(m.model as MonetizationModel) && typeof m.description === 'string')
        .map((m) => ({ model: m.model as MonetizationModel, description: m.description as string }))
        .slice(0, 4);
      const risks = (Array.isArray(raw.risks) ? (raw.risks as Record<string, unknown>[]) : [])
        .filter((r) => typeof r.title === 'string' && typeof r.mitigation === 'string')
        .map((r) => ({
          title: r.title as string,
          level: (['low', 'medium', 'high', 'critical'].includes(r.level as string) ? r.level : 'medium') as RiskLevel,
          mitigation: r.mitigation as string,
        }))
        .slice(0, 4);
      const multiplayer = brief.multiplayer === 'required' || brief.multiplayer === 'preferred';
      const scores = evaluateConcept({
        platform: brief.platform,
        genre,
        audience: brief.audience,
        monetization: monetization.map((m) => m.model),
        multiplayer,
        effort: brief.maxEffort,
        themeHints: typeof raw.theme === 'string' ? raw.theme : brief.themeHints,
        tags: [],
      });
      const str = (v: unknown, fallback: string): string => (typeof v === 'string' && v.trim() ? v : fallback);
      return {
        id: createId('idea'),
        createdAt: nowIso(),
        brief,
        title: str(raw.title, 'Unbenannte Idee'),
        elevatorPitch: str(raw.elevatorPitch, '–'),
        coreLoop: strArr(raw.coreLoop, 6),
        audience: brief.audience,
        audienceNotes: str(raw.audienceNotes, ''),
        usp: str(raw.usp, ''),
        genre,
        platform: brief.platform,
        theme: str(raw.theme, brief.themeHints ?? ''),
        monetization,
        risks,
        developmentEffort: brief.maxEffort,
        effortBreakdown: str(raw.effortBreakdown, ''),
        whyItCouldSucceed: strArr(raw.whyItCouldSucceed, 4),
        whyItCouldFail: strArr(raw.whyItCouldFail, 4),
        improvedVersion: {
          title: str(raw.improvedTitle, str(raw.title, 'Variante')),
          changes: strArr(raw.improvedChanges, 5),
          pitch: str(raw.improvedPitch, ''),
        },
        scores,
        source: 'ai',
      } satisfies GameIdea;
    });
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
    private readonly ai?: AiService,
  ) {}

  /** AI improvement of one section (requires a real provider). */
  async improveSection(projectId: string, sectionId: string): Promise<GddDocument> {
    if (!this.ai) throw new Error('KI-Dienst nicht verfügbar.');
    this.ai.requireRealProvider();
    const project = this.projects.require(projectId);
    const doc = this.getForProject(projectId);
    if (!doc) throw new Error('Für dieses Projekt existiert noch kein GDD - zuerst generieren.');
    const section = doc.sections.find((s) => s.id === sectionId);
    if (!section) throw new Error(`Unbekannte GDD-Sektion: ${sectionId}`);

    const { system, user } = buildGddSectionPrompt(project, GDD_SECTION_TITLES[section.id], section.markdown);
    const result = await this.ai.run('gdd_improve', {
      system,
      messages: [{ role: 'user', content: user }],
      maxTokens: 4000,
    });
    const markdown = result.text.trim().replace(/^```(?:markdown)?\n?|\n?```$/g, '');
    if (markdown.length < 50) {
      throw new Error('KI-Antwort war zu kurz - Sektion wurde nicht verändert. Bitte erneut versuchen.');
    }
    return this.saveSection(projectId, sectionId, markdown);
  }

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
    private readonly ai?: AiService,
  ) {}

  /** AI task planning: appends validated AI-proposed tasks (skips duplicates). */
  async aiPlan(projectId: string, goal?: string): Promise<TaskItem[]> {
    if (!this.ai) throw new Error('KI-Dienst nicht verfügbar.');
    this.ai.requireRealProvider();
    const project = this.projects.require(projectId);
    const existing = this.listForProject(projectId);
    const existingTitles = new Set(existing.map((t) => t.title.trim().toLowerCase()));

    const { system, user } = buildTaskPlanPrompt(project, existing.map((t) => t.title), goal);
    const result = await this.ai.run('task_plan', {
      system,
      messages: [{ role: 'user', content: user }],
      jsonMode: true,
      maxTokens: 3000,
    });
    const raw = extractJsonObject(result.text);
    const validCategories = Object.keys(TASK_CATEGORY_LABELS) as TaskCategory[];
    const validPriorities: TaskPriority[] = ['low', 'medium', 'high', 'critical'];
    const proposals = (Array.isArray(raw.tasks) ? (raw.tasks as Record<string, unknown>[]) : [])
      .filter((t) => typeof t.title === 'string' && t.title.trim().length > 2)
      .slice(0, 12);
    if (proposals.length === 0) throw new Error('Die KI hat keine verwertbaren Aufgaben geliefert - bitte erneut versuchen.');

    for (const t of proposals) {
      const title = (t.title as string).trim().slice(0, 80);
      if (existingTitles.has(title.toLowerCase())) continue;
      existingTitles.add(title.toLowerCase());
      const estimate = Number(t.estimateHours);
      this.create({
        projectId,
        title,
        description: typeof t.description === 'string' ? t.description : '',
        category: validCategories.includes(t.category as TaskCategory) ? (t.category as TaskCategory) : 'design',
        priority: validPriorities.includes(t.priority as TaskPriority) ? (t.priority as TaskPriority) : 'medium',
        milestone: ['MVP', 'Beta', 'Release'].includes(t.milestone as string) ? (t.milestone as string) : 'MVP',
        estimateHours: Number.isFinite(estimate) && estimate > 0 ? Math.round(estimate) : null,
      });
    }
    return this.listForProject(projectId);
  }

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
  constructor(
    private readonly projects: ProjectsService,
    private readonly db?: Db,
    private readonly ai?: AiService,
  ) {}

  evaluateProject(projectId: string): ScoreEvaluation {
    const project = this.projects.require(projectId);
    const profile = profileFromProject(project);
    const scores = evaluateConcept(profile);
    const suggestions = suggestImprovements(profile, scores);
    this.projects.update(projectId, { scores });
    return { scores, suggestions, evaluatedAt: nowIso() };
  }

  getAiReview(projectId: string): AiQualityReview | null {
    if (!this.db) return null;
    const row = this.db.prepare('SELECT data FROM ai_reviews WHERE project_id = ?').get(projectId) as
      | { data: string }
      | undefined;
    return row ? (JSON.parse(row.data) as AiQualityReview) : null;
  }

  /** Qualitative AI deep-review, persisted per project. */
  async aiReview(projectId: string): Promise<AiQualityReview> {
    if (!this.ai || !this.db) throw new Error('KI-Dienst nicht verfügbar.');
    this.ai.requireRealProvider();
    const project = this.projects.require(projectId);

    // Small, bounded context: GDD overview + core loop, open task titles.
    let gddExcerpt = '';
    const gddRow = this.db.prepare('SELECT data FROM gdds WHERE project_id = ?').get(projectId) as
      | { data: string }
      | undefined;
    if (gddRow) {
      const gdd = JSON.parse(gddRow.data) as GddDocument;
      gddExcerpt = gdd.sections
        .filter((s) => s.id === 'overview' || s.id === 'core_loop' || s.id === 'monetization')
        .map((s) => `## ${GDD_SECTION_TITLES[s.id]}\n${s.markdown.slice(0, 600)}`)
        .join('\n\n');
    }
    const taskRows = this.db
      .prepare("SELECT data FROM tasks WHERE project_id = ? AND status != 'done' ORDER BY sort_order LIMIT 15")
      .all(projectId) as { data: string }[];
    const openTitles = taskRows.map((r) => (JSON.parse(r.data) as TaskItem).title);

    const { system, user } = buildQualityReviewPrompt(project, gddExcerpt, openTitles);
    const result = await this.ai.run('quality_review', {
      system,
      messages: [{ role: 'user', content: user }],
      jsonMode: true,
      maxTokens: 3000,
    });
    const raw = extractJsonObject(result.text);
    const suggestions = (Array.isArray(raw.suggestions) ? (raw.suggestions as Record<string, unknown>[]) : [])
      .filter((s) => typeof s.title === 'string' && typeof s.detail === 'string')
      .map((s) => ({
        title: s.title as string,
        detail: s.detail as string,
        impact: Math.max(1, Math.min(5, Math.round(Number(s.impact) || 3))),
      }))
      .slice(0, 8);

    const review: AiQualityReview = {
      summary: typeof raw.summary === 'string' ? raw.summary : 'Keine Zusammenfassung geliefert.',
      strengths: strArr(raw.strengths, 6),
      weaknesses: strArr(raw.weaknesses, 6),
      firstMinute: typeof raw.firstMinute === 'string' ? raw.firstMinute : '',
      suggestions,
      risks: strArr(raw.risks, 5),
      createdAt: nowIso(),
      model: result.model,
    };
    this.db
      .prepare('INSERT INTO ai_reviews (project_id, at, data) VALUES (?, ?, ?) ON CONFLICT(project_id) DO UPDATE SET at = excluded.at, data = excluded.data')
      .run(projectId, review.createdAt, JSON.stringify(review));
    return review;
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
