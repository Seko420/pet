import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  GameProject,
  NewProjectInput,
  ProjectDashboardSummary,
} from '@egf/core';
import {
  AUDIENCE_LABELS,
  GENRE_LABELS,
  MONETIZATION_LABELS,
  createId,
  nowIso,
  slugify,
} from '@egf/core';
import { defaultPackageId, defaultPerformanceBudget } from '@egf/mobile-kit';
import type { Db } from '../db/database';

export class ProjectsService {
  constructor(
    private readonly db: Db,
    private readonly documentsPath: string,
  ) {}

  private parse(row: { data: string }): GameProject {
    return JSON.parse(row.data) as GameProject;
  }

  list(): GameProject[] {
    const rows = this.db.prepare('SELECT data FROM projects ORDER BY updated_at DESC').all() as { data: string }[];
    return rows.map((r) => this.parse(r));
  }

  get(id: string): GameProject | null {
    const row = this.db.prepare('SELECT data FROM projects WHERE id = ?').get(id) as { data: string } | undefined;
    return row ? this.parse(row) : null;
  }

  require(id: string): GameProject {
    const project = this.get(id);
    if (!project) throw new Error('Projekt nicht gefunden - wurde es gelöscht?');
    return project;
  }

  create(input: NewProjectInput): GameProject {
    const name = input.name.trim();
    if (name.length < 3) throw new Error('Der Projektname braucht mindestens 3 Zeichen.');
    if (input.monetization.length === 0) {
      throw new Error('Bitte mindestens ein Monetarisierungsmodell wählen (oder bewusst "cosmetics" als fairen Standard).');
    }
    const now = nowIso();
    const wantsRoblox = input.platform === 'roblox' || input.platform === 'both';
    const wantsMobile = input.platform === 'mobile' || input.platform === 'both';
    const slug = this.uniqueSlug(slugify(name));

    const project: GameProject = {
      id: createId('prj'),
      name,
      slug,
      platform: input.platform,
      genre: input.genre,
      audience: input.audience,
      status: 'concept',
      monetization: input.monetization,
      artStyle: input.artStyle,
      multiplayer: input.multiplayer,
      qualityTarget: input.qualityTarget,
      mvpGoal: input.mvpGoal.trim(),
      releaseGoal: input.releaseGoal.trim(),
      description: input.description?.trim() ?? '',
      workspacePath: null,
      ideaId: input.ideaId ?? null,
      scores: null,
      roblox: wantsRoblox
        ? {
            universeId: null,
            placeId: null,
            apiKeySecretId: null,
            rojoProjectPath: null,
            lastValidation: null,
            publishHistory: [],
          }
        : null,
      mobile: wantsMobile
        ? {
            engine: 'godot',
            packageId: defaultPackageId(slug),
            orientation: 'portrait',
            minAndroidSdk: 24,
            performanceBudget: defaultPerformanceBudget(input.genre),
            godotProjectPath: null,
            completedChecklistItems: [],
          }
        : null,
      createdAt: now,
      updatedAt: now,
    };
    this.persist(project, true);
    return project;
  }

  private uniqueSlug(base: string): string {
    const taken = new Set(this.list().map((p) => p.slug));
    if (!taken.has(base)) return base;
    for (let i = 2; i < 100; i++) {
      if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
    }
    return `${base}-${Date.now().toString(36)}`;
  }

  update(id: string, patch: Partial<GameProject>): GameProject {
    const current = this.require(id);
    // Identity and bookkeeping fields cannot be patched from the renderer.
    const { id: _id, slug: _slug, createdAt: _createdAt, ...safePatch } = patch;
    const next: GameProject = { ...current, ...safePatch, id: current.id, slug: current.slug, createdAt: current.createdAt, updatedAt: nowIso() };
    this.persist(next, false);
    return next;
  }

  persist(project: GameProject, isNew: boolean): void {
    const payload = JSON.stringify(project);
    if (isNew) {
      this.db
        .prepare('INSERT INTO projects (id, name, status, platform, updated_at, data) VALUES (?, ?, ?, ?, ?, ?)')
        .run(project.id, project.name, project.status, project.platform, project.updatedAt, payload);
    } else {
      this.db
        .prepare('UPDATE projects SET name = ?, status = ?, platform = ?, updated_at = ?, data = ? WHERE id = ?')
        .run(project.name, project.status, project.platform, project.updatedAt, payload, project.id);
    }
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  }

  /** Create the on-disk workspace folder for a project (idempotent). */
  scaffoldWorkspace(id: string): { workspacePath: string } {
    const project = this.require(id);
    if (project.workspacePath && existsSync(project.workspacePath)) {
      return { workspacePath: project.workspacePath };
    }
    const root = join(this.documentsPath, 'EmpireGameForge', project.slug);
    mkdirSync(join(root, 'docs'), { recursive: true });
    mkdirSync(join(root, 'assets'), { recursive: true });
    mkdirSync(join(root, 'notes'), { recursive: true });
    const readme = `# ${project.name}

| Feld | Wert |
| --- | --- |
| Plattform | ${project.platform} |
| Genre | ${GENRE_LABELS[project.genre]} |
| Zielgruppe | ${AUDIENCE_LABELS[project.audience]} |
| Monetarisierung | ${project.monetization.map((m) => MONETIZATION_LABELS[m]).join(', ')} |
| Multiplayer | ${project.multiplayer ? 'ja' : 'nein'} |

MVP-Ziel: ${project.mvpGoal}

Release-Ziel: ${project.releaseGoal}

Verwaltet mit Empire Game Forge AI. Unterordner:
- \`roblox/\` — generiertes Rojo/Luau-Projekt (Roblox-Tab)
- \`godot/\` — generiertes Godot-Projekt (Mobile-Tab)
- \`docs/\` — exportierte GDDs und Notizen
`;
    writeFileSync(join(root, 'README.md'), readme, 'utf-8');
    this.update(id, { workspacePath: root });
    return { workspacePath: root };
  }

  dashboard(): ProjectDashboardSummary[] {
    const projects = this.list();
    const taskCounts = this.db
      .prepare("SELECT project_id, SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS done, COUNT(*) AS total FROM tasks GROUP BY project_id")
      .all() as { project_id: string; done: number; total: number }[];
    const countsByProject = new Map(taskCounts.map((c) => [c.project_id, c]));

    const lastRecord = this.db.prepare(
      'SELECT ok, at, summary FROM build_records WHERE project_id = ? AND kind = ? ORDER BY at DESC LIMIT 1',
    );

    return projects.map((project) => {
      const counts = countsByProject.get(project.id);
      const total = counts?.total ?? 0;
      const done = counts?.done ?? 0;
      const build = lastRecord.get(project.id, 'build') as { ok: number; at: string; summary: string } | undefined;
      const test = lastRecord.get(project.id, 'test') as { ok: number; at: string; summary: string } | undefined;
      return {
        project,
        openTasks: total - done,
        doneTasks: done,
        totalTasks: total,
        progress: total === 0 ? 0 : Math.round((done / total) * 100),
        robloxConnected: Boolean(
          project.roblox?.universeId && project.roblox?.placeId && project.roblox?.apiKeySecretId,
        ),
        lastBuild: build ? { at: build.at, ok: build.ok === 1, summary: build.summary } : null,
        lastTest: test ? { at: test.at, ok: test.ok === 1, summary: test.summary } : null,
      };
    });
  }
}
