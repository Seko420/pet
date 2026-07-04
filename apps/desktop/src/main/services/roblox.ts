import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import type { GameProject, RobloxProjectConfig, ScaffoldFile } from '@egf/core';
import { nowIso } from '@egf/core';
import {
  buildRobloxScaffold,
  createMockOpenCloudClient,
  createOpenCloudClient,
  OpenCloudError,
  validateRobloxProject,
  type OpenCloudClient,
} from '@egf/roblox-kit';
import type {
  RobloxPublishRequest,
  RobloxPublishResult,
  RobloxScaffoldResult,
  RobloxValidationResult,
} from '../../shared/ipc';
import type { ProjectsService } from './projects';
import type { SecretsService } from './secrets';

/**
 * Roblox module backend.
 *
 * PUBLISHING GATE (enforced HERE, not in the UI):
 *   1. Universe ID, Place ID and API key configured
 *   2. Project validation passes without errors
 *   3. A successful dry run happened in this app session
 *   4. The request carries confirmed === true (typed confirmation dialog)
 * Only then does a real upload happen - via the official Open Cloud API.
 */
export class RobloxService {
  /** projectId -> timestamp of last successful dry run (this session). */
  private dryRunPassedAt = new Map<string, number>();

  constructor(
    private readonly projects: ProjectsService,
    private readonly secrets: SecretsService,
    /** Test hook: inject a mock Open Cloud client. */
    private readonly clientFactory: (apiKey: string) => OpenCloudClient = (apiKey) =>
      apiKey === 'mock' ? createMockOpenCloudClient() : createOpenCloudClient({ apiKey }),
  ) {}

  private requireRobloxProject(projectId: string): { project: GameProject; config: RobloxProjectConfig } {
    const project = this.projects.require(projectId);
    if (!project.roblox) {
      throw new Error('Dieses Projekt ist kein Roblox-Projekt (Plattform anpassen, falls gewünscht).');
    }
    return { project, config: project.roblox };
  }

  getConfig(projectId: string): RobloxProjectConfig | null {
    return this.projects.require(projectId).roblox;
  }

  saveConfig(
    projectId: string,
    patch: Partial<Pick<RobloxProjectConfig, 'universeId' | 'placeId' | 'apiKeySecretId'>>,
  ): RobloxProjectConfig {
    const { config } = this.requireRobloxProject(projectId);
    const clean = (v: string | null | undefined): string | null => {
      if (v === undefined || v === null || v === '') return null;
      if (!/^\d{1,20}$/.test(v)) throw new Error('Universe/Place ID muss eine Zahl sein (aus dem Creator Dashboard kopieren).');
      return v;
    };
    const next: RobloxProjectConfig = {
      ...config,
      universeId: 'universeId' in patch ? clean(patch.universeId) : config.universeId,
      placeId: 'placeId' in patch ? clean(patch.placeId) : config.placeId,
      apiKeySecretId: 'apiKeySecretId' in patch ? (patch.apiKeySecretId ?? null) : config.apiKeySecretId,
    };
    this.projects.update(projectId, { roblox: next });
    return next;
  }

  scaffold(projectId: string): RobloxScaffoldResult {
    const { project, config } = this.requireRobloxProject(projectId);
    if (!project.workspacePath) {
      throw new Error('Zuerst den Projektordner erzeugen (Übersicht → "Projektordner erzeugen").');
    }
    const targetRoot = join(project.workspacePath, 'roblox');
    const files = buildRobloxScaffold({
      projectName: project.name,
      slug: project.slug,
      genre: project.genre,
      multiplayer: project.multiplayer,
      monetization: project.monetization,
    });
    const created: string[] = [];
    for (const file of files) {
      const absolute = join(targetRoot, ...file.path.split('/'));
      if (existsSync(absolute)) continue; // never overwrite user edits
      mkdirSync(dirname(absolute), { recursive: true });
      writeFileSync(absolute, file.content, 'utf-8');
      created.push(file.path);
    }
    this.projects.update(projectId, { roblox: { ...config, rojoProjectPath: targetRoot } });
    return { projectPath: targetRoot, filesCreated: created };
  }

  private readProjectFiles(rojoPath: string): ScaffoldFile[] {
    const files: ScaffoldFile[] = [];
    const walk = (dir: string): void => {
      for (const name of readdirSync(dir)) {
        if (name === 'build' || name.startsWith('.')) continue;
        const absolute = join(dir, name);
        const stat = statSync(absolute);
        if (stat.isDirectory()) walk(absolute);
        else if (/\.(luau|lua|json|toml|md)$/.test(name) && stat.size < 2 * 1024 * 1024) {
          files.push({
            path: relative(rojoPath, absolute).split(sep).join('/'),
            content: readFileSync(absolute, 'utf-8'),
          });
        }
      }
    };
    walk(rojoPath);
    return files;
  }

  validate(projectId: string): RobloxValidationResult {
    const { config } = this.requireRobloxProject(projectId);
    if (!config.rojoProjectPath || !existsSync(config.rojoProjectPath)) {
      throw new Error('Kein Rojo-Projekt gefunden - zuerst "Roblox-Projekt generieren".');
    }
    const files = this.readProjectFiles(config.rojoProjectPath);
    const result = validateRobloxProject(files);
    this.projects.update(projectId, {
      roblox: {
        ...config,
        lastValidation: { at: nowIso(), ok: result.ok, issues: result.issues.map((i) => `[${i.severity}] ${i.message}`) },
      },
    });
    return result;
  }

  async testConnection(projectId: string): Promise<{ ok: boolean; message: string }> {
    const { config } = this.requireRobloxProject(projectId);
    if (!config.universeId) return { ok: false, message: 'Universe ID fehlt.' };
    if (!config.apiKeySecretId) return { ok: false, message: 'Kein API-Key zugeordnet (Einstellungen → API-Schlüssel).' };
    try {
      const client = this.clientFactory(this.secrets.getPlaintext(config.apiKeySecretId));
      const universe = await client.getUniverse(config.universeId);
      return { ok: true, message: `Verbunden: „${universe.displayName}" (Universe ${universe.id}).` };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, message };
    }
  }

  private findBuildArtifact(rojoPath: string, slug: string): { path: string; fileType: 'rbxl' | 'rbxlx' } | null {
    for (const ext of ['rbxlx', 'rbxl'] as const) {
      const candidate = join(rojoPath, 'build', `${slug}.${ext}`);
      if (existsSync(candidate)) return { path: candidate, fileType: ext };
    }
    return null;
  }

  async publish(request: RobloxPublishRequest): Promise<RobloxPublishResult> {
    const { project, config } = this.requireRobloxProject(request.projectId);
    const issues: string[] = [];

    // Gate 1: configuration complete
    if (!config.universeId) issues.push('Universe ID fehlt.');
    if (!config.placeId) issues.push('Place ID fehlt.');
    if (!config.apiKeySecretId) issues.push('Kein Open-Cloud-API-Key zugeordnet.');
    if (!config.rojoProjectPath) issues.push('Kein Rojo-Projekt generiert.');

    // Gate 2: validation
    let validationOk = false;
    if (config.rojoProjectPath && existsSync(config.rojoProjectPath)) {
      const validation = this.validate(request.projectId);
      validationOk = validation.ok;
      if (!validation.ok) {
        issues.push(...validation.issues.filter((i) => i.severity === 'error').map((i) => `Validierung: ${i.message}`));
      }
    }

    // Build artifact
    const artifact = config.rojoProjectPath ? this.findBuildArtifact(config.rojoProjectPath, project.slug) : null;
    if (!artifact) {
      issues.push(`Kein Build-Artefakt gefunden (build/${project.slug}.rbxlx). Zuerst "Rojo Build" ausführen.`);
    }

    const record = (mode: 'dry_run' | 'published', ok: boolean, message: string, versionNumber: number | null): void => {
      const freshConfig = this.projects.require(request.projectId).roblox;
      if (!freshConfig || !config.placeId) return;
      this.projects.update(request.projectId, {
        roblox: {
          ...freshConfig,
          publishHistory: [
            { at: nowIso(), placeId: config.placeId, versionNumber, mode, ok, message },
            ...freshConfig.publishHistory,
          ].slice(0, 25),
        },
      });
    };

    if (request.dryRun) {
      const ok = issues.length === 0 && validationOk;
      const message = ok
        ? `Dry-Run erfolgreich: „${project.name}" würde als ${request.versionType} auf Place ${config.placeId} hochgeladen (${artifact?.fileType}).`
        : `Dry-Run fehlgeschlagen: ${issues.length} Problem(e).`;
      if (ok) this.dryRunPassedAt.set(request.projectId, Date.now());
      if (config.placeId) record('dry_run', ok, message, null);
      return { ok, mode: 'dry_run', message, versionNumber: null, issues };
    }

    // ---- real publish gates
    if (request.confirmed !== true) {
      throw new Error('Veröffentlichung abgelehnt: Bestätigung fehlt (Projektname im Dialog eintippen).');
    }
    if (!this.dryRunPassedAt.has(request.projectId)) {
      throw new Error('Veröffentlichung abgelehnt: Zuerst einen erfolgreichen Dry-Run ausführen.');
    }
    if (issues.length > 0 || !validationOk || !artifact || !config.universeId || !config.placeId || !config.apiKeySecretId) {
      return { ok: false, mode: 'published', message: 'Voraussetzungen nicht erfüllt.', versionNumber: null, issues };
    }

    try {
      const client = this.clientFactory(this.secrets.getPlaintext(config.apiKeySecretId));
      const bytes = readFileSync(artifact.path);
      const result = await client.publishPlace({
        universeId: config.universeId,
        placeId: config.placeId,
        fileContent: new Uint8Array(bytes),
        fileType: artifact.fileType,
        versionType: request.versionType,
      });
      const message = `Erfolgreich veröffentlicht: Version ${result.versionNumber} (${request.versionType}) auf Place ${config.placeId}.`;
      record('published', true, message, result.versionNumber);
      this.dryRunPassedAt.delete(request.projectId);
      return { ok: true, mode: 'published', message, versionNumber: result.versionNumber, issues: [] };
    } catch (err) {
      const message = err instanceof OpenCloudError ? err.message : `Upload fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`;
      record('published', false, message, null);
      return { ok: false, mode: 'published', message, versionNumber: null, issues: [message] };
    }
  }
}
