import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import type { FileContent, FileNode } from '../../shared/ipc';
import type { ProjectsService } from './projects';

/**
 * Workspace-scoped filesystem access for the editor and the code agent.
 * SECURITY: every path is resolved against the project workspace and must
 * stay inside it (no traversal, no symlink following, no absolute paths).
 */

const MAX_EDITABLE_BYTES = 1.5 * 1024 * 1024;
const HIDDEN_DIRS = new Set(['node_modules', '.git', '.godot', 'build']);
const MAX_NODES = 2000;
const MAX_DEPTH = 8;

const LANGUAGE_BY_EXT: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.json': 'json',
  '.md': 'markdown',
  '.lua': 'lua',
  '.luau': 'lua',
  '.gd': 'plaintext',
  '.tscn': 'ini',
  '.toml': 'ini',
  '.cfg': 'ini',
  '.godot': 'ini',
  '.html': 'html',
  '.css': 'css',
  '.xml': 'xml',
  '.yml': 'yaml',
  '.yaml': 'yaml',
};

export class FilesService {
  constructor(private readonly projects: ProjectsService) {}

  /** Resolve a workspace-relative path; throws on any escape attempt. */
  resolveInWorkspace(projectId: string, relativePath: string): { root: string; absolute: string } {
    const project = this.projects.require(projectId);
    if (!project.workspacePath) {
      throw new Error('Dieses Projekt hat noch keinen Projektordner. Übersicht → "Projektordner erzeugen".');
    }
    const root = resolve(project.workspacePath);
    const absolute = resolve(root, relativePath);
    if (absolute !== root && !absolute.startsWith(root + sep)) {
      throw new Error('Pfad liegt außerhalb des Projektordners - Zugriff verweigert.');
    }
    // Symlink in a PARENT segment could still escape (resolve() does not
    // follow links) - re-check containment on the real filesystem path.
    let probe = absolute;
    while (!existsSync(probe)) probe = dirname(probe);
    const realProbe = realpathSync(probe);
    const realRoot = realpathSync(root);
    if (realProbe !== realRoot && !realProbe.startsWith(realRoot + sep)) {
      throw new Error('Pfad liegt außerhalb des Projektordners - Zugriff verweigert.');
    }
    return { root, absolute };
  }

  tree(projectId: string): FileNode | null {
    const project = this.projects.require(projectId);
    if (!project.workspacePath || !existsSync(project.workspacePath)) return null;
    const root = resolve(project.workspacePath);
    let nodeCount = 0;

    const walk = (dir: string, depth: number): FileNode[] => {
      if (depth > MAX_DEPTH || nodeCount > MAX_NODES) return [];
      let entries: string[];
      try {
        entries = readdirSync(dir);
      } catch {
        return [];
      }
      const nodes: FileNode[] = [];
      for (const name of entries.sort((a, b) => a.localeCompare(b))) {
        if (HIDDEN_DIRS.has(name) || name.startsWith('.')) continue;
        const absolute = join(dir, name);
        let stat;
        try {
          stat = lstatSync(absolute);
        } catch {
          continue;
        }
        if (stat.isSymbolicLink()) continue; // never follow symlinks
        nodeCount++;
        const relPath = relative(root, absolute).split(sep).join('/');
        if (stat.isDirectory()) {
          nodes.push({ name, path: relPath, kind: 'directory', children: walk(absolute, depth + 1) });
        } else if (stat.isFile()) {
          nodes.push({ name, path: relPath, kind: 'file' });
        }
      }
      nodes.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'directory' ? -1 : 1));
      return nodes;
    };

    return { name: project.slug, path: '', kind: 'directory', children: walk(root, 0) };
  }

  read(projectId: string, relativePath: string): FileContent {
    const { absolute } = this.resolveInWorkspace(projectId, relativePath);
    const stat = lstatSync(absolute);
    if (stat.isSymbolicLink()) throw new Error('Symbolische Links werden nicht geöffnet.');
    if (!stat.isFile()) throw new Error('Pfad ist keine Datei.');
    const ext = absolute.slice(absolute.lastIndexOf('.')).toLowerCase();
    const language = LANGUAGE_BY_EXT[ext] ?? 'plaintext';
    if (stat.size > MAX_EDITABLE_BYTES) {
      return {
        path: relativePath,
        content: `Datei ist zu groß für den Editor (${Math.round(stat.size / 1024)} kB).`,
        language: 'plaintext',
        readOnly: true,
      };
    }
    return { path: relativePath, content: readFileSync(absolute, 'utf-8'), language, readOnly: false };
  }

  write(projectId: string, relativePath: string, content: string): void {
    const { absolute } = this.resolveInWorkspace(projectId, relativePath);
    if (existsSync(absolute) && lstatSync(absolute).isSymbolicLink()) {
      throw new Error('Symbolische Links werden nicht beschrieben.');
    }
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, content, 'utf-8');
  }

  deleteFile(projectId: string, relativePath: string): void {
    const { absolute } = this.resolveInWorkspace(projectId, relativePath);
    if (existsSync(absolute) && lstatSync(absolute).isFile()) unlinkSync(absolute);
  }

  exists(projectId: string, relativePath: string): boolean {
    const { absolute } = this.resolveInWorkspace(projectId, relativePath);
    return existsSync(absolute);
  }
}
