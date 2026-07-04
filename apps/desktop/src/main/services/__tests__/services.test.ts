import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { NewProjectInput } from '@egf/core';
import { openDatabase, type Db } from '../../db/database';
import { SecretsService, type SecretsCipher } from '../secrets';
import { ProjectsService } from '../projects';
import { TasksService, ChecklistsService } from '../studio';
import { FilesService } from '../files';
import { RobloxService } from '../roblox';
import { PlaytestsService } from '../playtests';
import { TransferService } from '../transfer';
import { SettingsService } from '../settings';
import { AiService } from '../ai';
import type { OpenCloudClient } from '@egf/roblox-kit';

const fakeCipher: SecretsCipher = {
  isAvailable: () => true,
  encrypt: (plaintext) => Buffer.from(`enc:${plaintext}`, 'utf-8'),
  decrypt: (ciphertext) => ciphertext.toString('utf-8').replace(/^enc:/, ''),
};

let tempRoot: string;
let db: Db;
let projects: ProjectsService;

const newProjectInput: NewProjectInput = {
  name: 'Testspiel Alpha',
  platform: 'both',
  genre: 'tycoon',
  audience: 'teens_13_17',
  monetization: ['game_passes', 'cosmetics'],
  artStyle: 'low_poly',
  multiplayer: true,
  qualityTarget: 'polished',
  mvpGoal: 'Kern-Loop spielbar',
  releaseGoal: 'Roblox + Android Release',
};

beforeEach(() => {
  tempRoot = mkdtempSync(join(tmpdir(), 'egf-test-'));
  db = openDatabase(join(tempRoot, 'test.sqlite'));
  projects = new ProjectsService(db, tempRoot);
});

afterEach(() => {
  db.close();
  rmSync(tempRoot, { recursive: true, force: true });
});

describe('projects service', () => {
  it('creates, reads, updates and deletes projects with JSON integrity', () => {
    const project = projects.create(newProjectInput);
    expect(project.roblox).not.toBeNull();
    expect(project.mobile).not.toBeNull();
    expect(project.mobile?.packageId).toMatch(/^com\.empireforge\./);

    const loaded = projects.get(project.id);
    expect(loaded).toEqual(project);

    const updated = projects.update(project.id, { status: 'prototype' });
    expect(updated.status).toBe('prototype');
    expect(projects.get(project.id)?.status).toBe('prototype');

    projects.delete(project.id);
    expect(projects.get(project.id)).toBeNull();
  });

  it('rejects invalid input and protects identity fields', () => {
    expect(() => projects.create({ ...newProjectInput, name: 'ab' })).toThrow(/3 Zeichen/);
    expect(() => projects.create({ ...newProjectInput, monetization: [] })).toThrow(/Monetarisierung/);
    const project = projects.create(newProjectInput);
    const updated = projects.update(project.id, { id: 'prj_hacked', slug: 'hacked' } as never);
    expect(updated.id).toBe(project.id);
    expect(updated.slug).toBe(project.slug);
  });
});

describe('tasks service', () => {
  it('generates a plan without duplicating titles on second run', () => {
    const project = projects.create(newProjectInput);
    const tasks = new TasksService(db, projects);
    const first = tasks.generateForProject(project.id);
    const second = tasks.generateForProject(project.id);
    expect(second.length).toBe(first.length);
    const titles = second.map((t) => t.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe('checklists service', () => {
  it('persists toggle state', () => {
    const project = projects.create(newProjectInput);
    const checklists = new ChecklistsService(db, projects);
    const before = checklists.getForProject(project.id);
    const release = before.find((c) => c.checklist.kind === 'release')!;
    expect(release.completedItemIds).toHaveLength(0);
    const after = checklists.toggleItem(project.id, 'release', release.checklist.items[0]!.id, true);
    expect(after.find((c) => c.checklist.kind === 'release')!.completedItemIds).toContain(
      release.checklist.items[0]!.id,
    );
  });
});

describe('secrets service', () => {
  it('stores encrypted values with hint and roundtrips plaintext internally', () => {
    const secrets = new SecretsService(db, fakeCipher);
    const ref = secrets.set('Roblox Key', 'roblox_open_cloud', 'super-geheimer-key-1234');
    expect(ref.hint).toBe('…1234');
    const stored = db.prepare('SELECT ciphertext FROM secrets WHERE id = ?').get(ref.id) as { ciphertext: Buffer };
    expect(stored.ciphertext.toString('utf-8')).not.toContain('super-geheimer-key-1234'.slice(0, 10) + 'X');
    expect(stored.ciphertext.toString('utf-8')).toBe('enc:super-geheimer-key-1234');
    expect(secrets.getPlaintext(ref.id)).toBe('super-geheimer-key-1234');
    expect(secrets.list()).toHaveLength(1);
    secrets.delete(ref.id);
    expect(secrets.list()).toHaveLength(0);
  });

  it('refuses to store when encryption is unavailable', () => {
    const unavailable: SecretsCipher = { ...fakeCipher, isAvailable: () => false };
    const secrets = new SecretsService(db, unavailable);
    expect(() => secrets.set('X', 'anthropic', 'aaaabbbbcccc')).toThrow(/safeStorage/);
  });
});

describe('files service (security)', () => {
  it('blocks path traversal and absolute paths', () => {
    const project = projects.create(newProjectInput);
    projects.scaffoldWorkspace(project.id);
    const files = new FilesService(projects);
    expect(() => files.read(project.id, '../outside.txt')).toThrow(/außerhalb/);
    expect(() => files.write(project.id, '../../evil.txt', 'x')).toThrow(/außerhalb/);
    expect(() => files.read(project.id, '/etc/passwd')).toThrow();
    // Legitimate access works.
    files.write(project.id, 'notes/test.md', '# ok');
    expect(files.read(project.id, 'notes/test.md').content).toBe('# ok');
  });
});

describe('playtests service', () => {
  it('captures findings and converts them into linked board tasks exactly once', () => {
    const project = projects.create(newProjectInput);
    const tasks = new TasksService(db, projects);
    const playtests = new PlaytestsService(db, projects, tasks);

    const session = playtests.create({ projectId: project.id, title: 'Erster Test', playedAt: '2026-07-04', testerCount: 5 });
    const withFinding = playtests.addFinding(session.id, {
      category: 'confusion',
      severity: 'high',
      description: 'Tester fanden den Shop-Button nicht',
      location: 'HUD',
    });
    expect(withFinding.findings).toHaveLength(1);

    const findingId = withFinding.findings[0]!.id;
    const { session: converted, task } = playtests.convertFindingToTask(session.id, findingId);
    expect(converted.findings[0]!.convertedTaskId).toBe(task.id);
    expect(task.category).toBe('ui_ux');
    expect(task.priority).toBe('high');
    expect(tasks.listForProject(project.id).some((t) => t.id === task.id)).toBe(true);
    // Second conversion must be rejected.
    expect(() => playtests.convertFindingToTask(session.id, findingId)).toThrow(/bereits/);
  });
});

describe('transfer service (export/import)', () => {
  it('roundtrips a full project bundle with remapped ids and reset machine-local state', () => {
    const project = projects.create(newProjectInput);
    const tasks = new TasksService(db, projects);
    tasks.generateForProject(project.id);
    const secrets = new SecretsService(db, fakeCipher);
    const keyRef = secrets.set('Key', 'roblox_open_cloud', 'test-api-key-0001');
    const roblox = new RobloxService(projects, secrets, () => ({ getUniverse: async (id) => ({ id, displayName: 'x' }), publishPlace: async () => ({ versionNumber: 1 }) }));
    roblox.saveConfig(project.id, { universeId: '123', placeId: '456', apiKeySecretId: keyRef.id });

    const transfer = new TransferService(db, projects);
    const bundlePath = join(tempRoot, 'export.egf.json');
    transfer.exportToFile(project.id, bundlePath);

    const imported = transfer.importFromFile(bundlePath);
    expect(imported.id).not.toBe(project.id);
    expect(imported.name).toBe(project.name);
    expect(imported.slug).not.toBe(project.slug); // collision-safe
    // Machine-local state must not travel: key reference and paths reset.
    expect(imported.roblox?.apiKeySecretId).toBeNull();
    expect(imported.workspacePath).toBeNull();
    // Universe/Place IDs stay (they are project facts, not machine facts).
    expect(imported.roblox?.universeId).toBe('123');
    const importedTasks = new TasksService(db, projects).listForProject(imported.id);
    expect(importedTasks.length).toBeGreaterThan(20);
    expect(importedTasks.every((t) => t.projectId === imported.id)).toBe(true);
  });

  it('rejects foreign or broken files with a clear error', () => {
    const transfer = new TransferService(db, projects);
    const badPath = join(tempRoot, 'bad.json');
    writeFileSync(badPath, '{"kind":"something-else"}');
    expect(() => transfer.importFromFile(badPath)).toThrow(/kein Empire-Game-Forge/);
  });
});

describe('ai provider selection', () => {
  it('resolves auto -> mock without keys, explicit provider with key, and honors mock override', async () => {
    const secrets = new SecretsService(db, fakeCipher);
    const settings = new SettingsService(db);
    const ai = new AiService(secrets, settings);

    expect((await ai.status()).provider).toBe('mock');

    secrets.set('OpenAI', 'openai', 'sk-test-openai-123456');
    ai.invalidate();
    expect(ai.getProvider().name).toBe('openai');

    ai.setConfig({ provider: 'mock', model: null, customBaseUrl: null });
    expect(ai.getProvider().name).toBe('mock');

    // custom_ai without base URL falls back to mock instead of crashing
    ai.setConfig({ provider: 'custom_ai', model: 'llama3', customBaseUrl: null });
    secrets.set('Custom', 'custom_ai', 'ck-test-123456');
    ai.invalidate();
    expect(ai.getProvider().name).toBe('mock');
  });
});

describe('roblox publishing gates', () => {
  function makeMockClient(): OpenCloudClient {
    return {
      getUniverse: async (id) => ({ id, displayName: 'Test Universe' }),
      publishPlace: async () => ({ versionNumber: 42 }),
    };
  }

  function prepareConnectedProject(): { projectId: string; roblox: RobloxService } {
    const project = projects.create(newProjectInput);
    projects.scaffoldWorkspace(project.id);
    const secrets = new SecretsService(db, fakeCipher);
    const keyRef = secrets.set('Key', 'roblox_open_cloud', 'test-api-key-0001');
    const roblox = new RobloxService(projects, secrets, () => makeMockClient());
    roblox.scaffold(project.id);
    roblox.saveConfig(project.id, { universeId: '123', placeId: '456', apiKeySecretId: keyRef.id });
    return { projectId: project.id, roblox };
  }

  it('rejects a real publish without confirmation and without prior dry run', async () => {
    const { projectId, roblox } = prepareConnectedProject();
    await expect(
      roblox.publish({ projectId, dryRun: false, confirmed: false, versionType: 'Published' }),
    ).rejects.toThrow(/Bestätigung/);
    await expect(
      roblox.publish({ projectId, dryRun: false, confirmed: true, versionType: 'Published' }),
    ).rejects.toThrow(/Dry-Run/);
  });

  it('publishes only after a successful dry run with build artifact', async () => {
    const { projectId, roblox } = prepareConnectedProject();
    const config = roblox.getConfig(projectId)!;
    // Dry run without build artifact fails with a clear issue.
    const failedDry = await roblox.publish({ projectId, dryRun: true, confirmed: false, versionType: 'Published' });
    expect(failedDry.ok).toBe(false);
    expect(failedDry.issues.join(' ')).toContain('Build-Artefakt');

    // Create the build artifact, dry run passes, then real publish succeeds.
    const project = projects.get(projectId)!;
    mkdirSync(join(config.rojoProjectPath!, 'build'), { recursive: true });
    writeFileSync(join(config.rojoProjectPath!, 'build', `${project.slug}.rbxlx`), `<roblox version="4">${'x'.repeat(64)}</roblox>`);
    const dry = await roblox.publish({ projectId, dryRun: true, confirmed: false, versionType: 'Published' });
    expect(dry.ok).toBe(true);

    const published = await roblox.publish({ projectId, dryRun: false, confirmed: true, versionType: 'Published' });
    expect(published.ok).toBe(true);
    expect(published.versionNumber).toBe(42);
    const history = roblox.getConfig(projectId)!.publishHistory;
    expect(history[0]?.mode).toBe('published');
    expect(history[0]?.ok).toBe(true);
  });

  it('validates the generated scaffold successfully', () => {
    const { projectId, roblox } = prepareConnectedProject();
    const result = roblox.validate(projectId);
    expect(result.ok).toBe(true);
    expect(result.checkedFiles).toBeGreaterThan(10);
  });
});
