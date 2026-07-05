import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { NewProjectInput } from '@egf/core';
import { openDatabase, type Db } from '../../db/database';
import { SecretsService, type SecretsCipher } from '../secrets';
import { ProjectsService } from '../projects';
import {
  AnalyticsService,
  ChecklistsService,
  ContentService,
  GddService,
  IdeasService,
  ScoresService,
  TasksService,
} from '../studio';
import { FilesService } from '../files';
import { RobloxService } from '../roblox';
import { PlaytestsService } from '../playtests';
import { TransferService } from '../transfer';
import { SettingsService } from '../settings';
import { AiService } from '../ai';
import { ChatService, parseChatActions } from '../chat';
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

    ai.setConfig({ provider: 'mock', model: null, customBaseUrl: null, temperature: null, maxTokens: null });
    expect(ai.getProvider().name).toBe('mock');

    // custom_ai without base URL falls back to mock instead of crashing
    ai.setConfig({ provider: 'custom_ai', model: 'llama3', customBaseUrl: null, temperature: null, maxTokens: null });
    secrets.set('Custom', 'custom_ai', 'ck-test-123456');
    ai.invalidate();
    expect(ai.getProvider().name).toBe('mock');
  });
});

describe('chat service (global, Claude-style)', () => {
  function makeChat(): { chat: ChatService; tasks: TasksService } {
    const secrets = new SecretsService(db, fakeCipher);
    const settings = new SettingsService(db);
    const ai = new AiService(secrets, settings, db);
    const ideas = new IdeasService(db, ai);
    const tasks = new TasksService(db, projects, ai);
    const gdd = new GddService(db, projects, ideas, tempRoot, ai);
    const scores = new ScoresService(projects, db, ai);
    const analytics = new AnalyticsService(db, projects);
    const content = new ContentService(db, projects);
    return { chat: new ChatService(db, projects, ai, { tasks, gdd, ideas, scores, analytics, content }), tasks };
  }

  /** Simulates a persisted assistant reply with proposed actions. */
  function insertAssistantMessage(conversationId: string, actionsJson: string): string {
    const id = `cmsg_test_${Math.random().toString(36).slice(2)}`;
    db.prepare(
      'INSERT INTO ai_chat_messages (id, conversation_id, role, content, created_at, actions) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(id, conversationId, 'assistant', 'Vorschlag folgt.', new Date().toISOString(), actionsJson);
    return id;
  }

  it('creates, renames, re-links and deletes conversations', () => {
    const { chat } = makeChat();
    const project = projects.create(newProjectInput);

    const conversation = chat.create(null);
    expect(conversation.title).toBe('Neuer Chat');
    expect(conversation.projectId).toBeNull();
    expect(chat.list()).toHaveLength(1);

    expect(() => chat.rename(conversation.id, '   ')).toThrow(/leer/);
    expect(chat.rename(conversation.id, 'Boss-Design').title).toBe('Boss-Design');

    expect(chat.setProject(conversation.id, project.id).projectId).toBe(project.id);
    // Deleting the project unlinks the chat instead of deleting it.
    projects.delete(project.id);
    expect(chat.list()[0]!.projectId).toBeNull();

    chat.delete(conversation.id);
    expect(chat.list()).toHaveLength(0);
    expect(() => chat.messages(conversation.id)).toThrow(/nicht gefunden/);
  });

  it('streams a reply in mock mode, persists both messages and auto-titles', async () => {
    const { chat } = makeChat();
    const conversation = chat.create(null);

    const chunks: string[] = [];
    const done = new Promise<{ ok: boolean; conversationId: string }>((resolvePromise) => {
      chat.setSink((event) => {
        if (event.type === 'chunk') chunks.push(event.payload.delta);
        else resolvePromise({ ok: event.payload.ok, conversationId: event.payload.conversationId });
      });
    });

    const { requestId } = chat.sendStream(conversation.id, 'Wie balanciere ich meinen Tycoon-Shop?');
    expect(requestId).toMatch(/^req/);
    const result = await done;
    expect(result.ok).toBe(true);
    expect(result.conversationId).toBe(conversation.id);
    expect(chunks.length).toBeGreaterThan(0);

    const messages = chat.messages(conversation.id);
    expect(messages).toHaveLength(2);
    expect(messages[0]!.role).toBe('user');
    expect(messages[1]!.role).toBe('assistant');
    expect(messages[1]!.content.length).toBeGreaterThan(0);

    const listed = chat.list()[0]!;
    expect(listed.title).toBe('Wie balanciere ich meinen Tycoon-Shop?'.slice(0, 48));
    expect(listed.messageCount).toBe(2);
    expect(listed.lastSnippet).not.toBeNull();
  });

  it('parses egf-action blocks: strips the block, validates kinds, survives malformed JSON', () => {
    const good = parseChatActions(
      'Hier mein Plan.\n```egf-action\n{"actions":[' +
        '{"kind":"create_task","title":"Shop-UI bauen","priority":"high","milestone":"MVP"},' +
        '{"kind":"unbekannt","x":1},' +
        '{"kind":"generate_ideas","count":99}' +
        ']}\n```',
    );
    expect(good.content).toBe('Hier mein Plan.');
    expect(good.actions).toHaveLength(2);
    expect(good.actions[0]!.kind).toBe('create_task');
    expect(good.actions[0]!.summary).toContain('Shop-UI bauen');
    expect(good.actions[0]!.status).toBe('proposed');
    expect(good.actions[1]!.summary).toContain('5 Spielideen'); // count clamped 1..5

    const malformed = parseChatActions('Antwort.\n```egf-action\n{kaputt\n```');
    expect(malformed.content).toBe('Antwort.');
    expect(malformed.actions).toHaveLength(0);
  });

  it('executes a confirmed create_task action exactly once, on the linked project', async () => {
    const { chat, tasks } = makeChat();
    const project = projects.create(newProjectInput);
    const conversation = chat.create(project.id);
    const messageId = insertAssistantMessage(
      conversation.id,
      JSON.stringify([
        {
          kind: 'create_task',
          summary: 'Aufgabe anlegen: „Boss-Kampf designen"',
          params: { kind: 'create_task', title: 'Boss-Kampf designen', category: 'design', priority: 'high', milestone: 'Beta' },
          status: 'proposed',
          resultNote: null,
        },
      ]),
    );

    const updated = await chat.executeAction(messageId, 0);
    const executed = updated.find((m) => m.id === messageId)!.actions[0]!;
    expect(executed.status).toBe('executed');
    expect(executed.resultNote).toContain('Boss-Kampf designen');
    expect(tasks.listForProject(project.id).some((t) => t.title === 'Boss-Kampf designen' && t.priority === 'high')).toBe(true);
    // The result is reported as a new assistant message.
    expect(updated[updated.length - 1]!.content).toContain('✅');
    // Double execution is refused.
    await expect(chat.executeAction(messageId, 0)).rejects.toThrow(/bereits behandelt/);
  });

  it('fails honestly without a linked project and supports reject', async () => {
    const { chat } = makeChat();
    const conversation = chat.create(null);
    const actionJson = JSON.stringify([
      {
        kind: 'create_task',
        summary: 'Aufgabe anlegen: „X"',
        params: { kind: 'create_task', title: 'X-Task' },
        status: 'proposed',
        resultNote: null,
      },
    ]);

    const failId = insertAssistantMessage(conversation.id, actionJson);
    const afterFail = await chat.executeAction(failId, 0);
    const failed = afterFail.find((m) => m.id === failId)!.actions[0]!;
    expect(failed.status).toBe('failed');
    expect(failed.resultNote).toContain('Kein Projekt verknüpft');

    const rejectId = insertAssistantMessage(conversation.id, actionJson);
    const afterReject = chat.rejectAction(rejectId, 0);
    expect(afterReject.find((m) => m.id === rejectId)!.actions[0]!.status).toBe('rejected');
  });

  it('save_gdd_section generates a missing GDD instead of failing', async () => {
    const { chat } = makeChat();
    const project = projects.create(newProjectInput); // no wizard pipeline -> no GDD yet
    const conversation = chat.create(project.id);
    const messageId = insertAssistantMessage(
      conversation.id,
      JSON.stringify([
        {
          kind: 'save_gdd_section',
          summary: 'GDD-Sektion überschreiben: „Monetarisierung"',
          params: { kind: 'save_gdd_section', sectionId: 'monetization', markdown: '## Faire Monetarisierung\nNur Cosmetics und 2 Game Passes.' },
          status: 'proposed',
          resultNote: null,
        },
      ]),
    );
    const updated = await chat.executeAction(messageId, 0);
    expect(updated.find((m) => m.id === messageId)!.actions[0]!.status).toBe('executed');
    const gddRow = db.prepare('SELECT data FROM gdds WHERE project_id = ?').get(project.id) as { data: string };
    const doc = JSON.parse(gddRow.data) as { sections: { id: string; markdown: string }[] };
    expect(doc.sections.find((s) => s.id === 'monetization')!.markdown).toContain('Faire Monetarisierung');
  });

  it('creates a full project via action and links the conversation to it', async () => {
    const { chat } = makeChat();
    const conversation = chat.create(null);
    const messageId = insertAssistantMessage(
      conversation.id,
      JSON.stringify([
        {
          kind: 'create_project',
          summary: 'Neues Projekt anlegen: „Pet Paradise"',
          params: {
            kind: 'create_project',
            name: 'Pet Paradise',
            platform: 'roblox',
            genre: 'simulator',
            audience: 'kids_8_12',
            monetization: ['game_passes', 'quatsch'],
            multiplayer: true,
          },
          status: 'proposed',
          resultNote: null,
        },
      ]),
    );

    const updated = await chat.executeAction(messageId, 0);
    expect(updated.find((m) => m.id === messageId)!.actions[0]!.status).toBe('executed');
    const created = projects.list().find((p) => p.name === 'Pet Paradise');
    expect(created).toBeDefined();
    expect(created!.monetization).toEqual(['game_passes']); // invalid entries filtered
    // Wizard pipeline ran: board + GDD exist.
    expect(db.prepare('SELECT COUNT(*) AS c FROM tasks WHERE project_id = ?').get(created!.id)).toMatchObject({ c: expect.any(Number) });
    expect(db.prepare('SELECT COUNT(*) AS c FROM gdds WHERE project_id = ?').get(created!.id)).toMatchObject({ c: 1 });
    // Conversation is now linked to the new project.
    expect(chat.list()[0]!.projectId).toBe(created!.id);
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
