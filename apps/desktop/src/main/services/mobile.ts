import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { MobileProjectConfig } from '@egf/core';
import { buildGodotScaffold } from '@egf/mobile-kit';
import type { MobileScaffoldResult } from '../../shared/ipc';
import type { ProjectsService } from './projects';

export class MobileService {
  constructor(private readonly projects: ProjectsService) {}

  getConfig(projectId: string): MobileProjectConfig | null {
    return this.projects.require(projectId).mobile;
  }

  saveConfig(projectId: string, patch: Partial<MobileProjectConfig>): MobileProjectConfig {
    const project = this.projects.require(projectId);
    if (!project.mobile) {
      throw new Error('Dieses Projekt ist kein Mobile-Projekt (Plattform anpassen, falls gewünscht).');
    }
    if (patch.packageId !== undefined && patch.packageId !== null) {
      if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(patch.packageId)) {
        throw new Error('Ungültige Package-ID. Format: com.studio.spielname (Kleinbuchstaben, Punkte, keine Sonderzeichen).');
      }
    }
    const { engine: _engine, godotProjectPath: _gp, ...safePatch } = patch;
    const next: MobileProjectConfig = { ...project.mobile, ...safePatch };
    this.projects.update(projectId, { mobile: next });
    return next;
  }

  scaffold(projectId: string): MobileScaffoldResult {
    const project = this.projects.require(projectId);
    if (!project.mobile) throw new Error('Dieses Projekt ist kein Mobile-Projekt.');
    if (!project.workspacePath) {
      throw new Error('Zuerst den Projektordner erzeugen (Übersicht → "Projektordner erzeugen").');
    }
    const targetRoot = join(project.workspacePath, 'godot');
    const files = buildGodotScaffold({
      projectName: project.name,
      slug: project.slug,
      genre: project.genre,
      packageId: project.mobile.packageId ?? 'com.empireforge.game',
      orientation: project.mobile.orientation,
      targetFps: project.mobile.performanceBudget.targetFps,
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
    this.projects.update(projectId, { mobile: { ...project.mobile, godotProjectPath: targetRoot } });
    return { projectPath: targetRoot, filesCreated: created };
  }
}
