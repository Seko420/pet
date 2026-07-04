import { describe, expect, it } from 'vitest';
import {
  buildRobloxScaffold,
  createMockOpenCloudClient,
  createOpenCloudClient,
  OpenCloudError,
  validateRobloxProject,
  type RobloxScaffoldInput,
} from '../src/index';

const SECRET = 'rbx-open-cloud-key-geheim-000111222333';

const baseInput: RobloxScaffoldInput = {
  projectName: 'Pilzwald Tycoon',
  slug: 'pilzwald-tycoon',
  genre: 'tycoon',
  multiplayer: false,
  monetization: ['game_passes'],
};

describe('roblox scaffold', () => {
  it('contains the core project structure', () => {
    const files = buildRobloxScaffold(baseInput);
    const paths = files.map((f) => f.path);
    expect(paths).toContain('default.project.json');
    expect(paths).toContain('src/server/Services/DataService.luau');
    expect(paths).toContain('src/server/Services/AntiExploitService.luau');
    expect(paths).toContain('src/shared/Net.luau');
    expect(JSON.parse(files.find((f) => f.path === 'default.project.json')!.content).tree).toBeTruthy();
  });

  it('toggles MatchService with the multiplayer flag', () => {
    const solo = buildRobloxScaffold(baseInput).map((f) => f.path);
    const multi = buildRobloxScaffold({ ...baseInput, multiplayer: true }).map((f) => f.path);
    expect(solo).not.toContain('src/server/Services/MatchService.luau');
    expect(multi).toContain('src/server/Services/MatchService.luau');
  });

  it('differs by genre and validates cleanly', () => {
    const tycoon = buildRobloxScaffold(baseInput);
    const obby = buildRobloxScaffold({ ...baseInput, genre: 'obby' });
    const tycoonConfig = tycoon.find((f) => f.path === 'src/shared/Config.luau')!.content;
    const obbyConfig = obby.find((f) => f.path === 'src/shared/Config.luau')!.content;
    expect(tycoonConfig).not.toEqual(obbyConfig);
    expect(tycoonConfig).toContain('Cash');
    expect(obbyConfig).toContain('Stars');
    expect(validateRobloxProject(tycoon).ok).toBe(true);
  });
});

describe('validation', () => {
  it('detects injected secrets', () => {
    const files = buildRobloxScaffold(baseInput);
    files.push({
      path: 'src/server/Evil.luau',
      content: 'local key = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"\n',
    });
    const result = validateRobloxProject(files);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.severity === 'error' && i.message.includes('Evil.luau'))).toBe(true);
  });

  it('rejects http calls in client code and loadstring anywhere', () => {
    const result = validateRobloxProject([
      { path: 'default.project.json', content: '{"name":"x","tree":{}}' },
      { path: 'src/server/Main.server.luau', content: 'loadstring("x")()' },
      { path: 'src/client/Bad.luau', content: 'game:GetService("HttpService"):GetAsync("https://x")' },
    ]);
    expect(result.ok).toBe(false);
    expect(result.issues.filter((i) => i.severity === 'error').length).toBeGreaterThanOrEqual(2);
  });
});

describe('open cloud client', () => {
  const validXml = new TextEncoder().encode('<roblox version="4">' + 'x'.repeat(64) + '</roblox>');

  it('publishes via the official endpoint and returns the version', async () => {
    let capturedUrl = '';
    let capturedKey = '';
    const client = createOpenCloudClient({
      apiKey: SECRET,
      fetchFn: (async (...args: Parameters<typeof fetch>) => {
        const [url, init] = args;
        capturedUrl = String(url);
        capturedKey = (init?.headers as Record<string, string>)['x-api-key'] ?? '';
        return new Response(JSON.stringify({ versionNumber: 7 }), { status: 200 });
      }) as typeof fetch,
    });
    const result = await client.publishPlace({
      universeId: '111',
      placeId: '222',
      fileContent: validXml,
      fileType: 'rbxlx',
      versionType: 'Published',
    });
    expect(result.versionNumber).toBe(7);
    expect(capturedUrl).toContain('apis.roblox.com/universes/v1/111/places/222/versions');
    expect(capturedUrl).toContain('versionType=Published');
    expect(capturedKey).toBe(SECRET);
  });

  it('maps 401 to auth error without leaking the key', async () => {
    const client = createOpenCloudClient({
      apiKey: SECRET,
      fetchFn: (async () => new Response('{}', { status: 401 })) as typeof fetch,
    });
    try {
      await client.getUniverse('123');
      expect.unreachable();
    } catch (err) {
      const e = err as OpenCloudError;
      expect(e).toBeInstanceOf(OpenCloudError);
      expect(e.kind).toBe('auth');
      expect(e.message).not.toContain(SECRET);
    }
  });

  it('rejects invalid place files before any upload', async () => {
    const client = createMockOpenCloudClient();
    await expect(
      client.publishPlace({
        universeId: '1',
        placeId: '2',
        fileContent: new Uint8Array(4),
        fileType: 'rbxl',
        versionType: 'Saved',
      }),
    ).rejects.toMatchObject({ kind: 'invalid_file' });
  });
});
