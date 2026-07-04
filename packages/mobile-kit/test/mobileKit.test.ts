import { describe, expect, it } from 'vitest';
import {
  buildGodotScaffold,
  defaultPackageId,
  defaultPerformanceBudget,
  type MobileScaffoldInput,
} from '../src/index';

const baseInput: MobileScaffoldInput = {
  projectName: 'Wolkenwerft Runner',
  slug: 'wolkenwerft-runner',
  genre: 'runner',
  packageId: 'com.empireforge.wolkenwerft',
  orientation: 'portrait',
  targetFps: 60,
  monetization: ['rewarded_ads'],
};

describe('godot scaffold', () => {
  it('registers autoloads and the main scene in project.godot', () => {
    const files = buildGodotScaffold(baseInput);
    const project = files.find((f) => f.path === 'project.godot')!.content;
    expect(project).toContain('run/main_scene="res://scenes/main.tscn"');
    expect(project).toContain('GameState=');
    expect(project).toContain('Analytics=');
    expect(project).toContain('renderer/rendering_method="mobile"');
  });

  it('selects different gameplay templates per genre', () => {
    const runner = buildGodotScaffold(baseInput).map((f) => f.path);
    const idle = buildGodotScaffold({ ...baseInput, genre: 'idle' }).map((f) => f.path);
    const puzzle = buildGodotScaffold({ ...baseInput, genre: 'puzzle' }).map((f) => f.path);
    expect(runner).toContain('scripts/gameplay_runner.gd');
    expect(idle).toContain('scripts/gameplay_idle.gd');
    expect(puzzle).toContain('scripts/gameplay_puzzle.gd');
  });

  it('omits monetization autoload when no monetization is planned', () => {
    const none = buildGodotScaffold({ ...baseInput, monetization: [] });
    expect(none.map((f) => f.path)).not.toContain('scripts/autoload/monetization.gd');
    expect(none.find((f) => f.path === 'project.godot')!.content).not.toContain('Monetization=');
    const withIap = buildGodotScaffold({ ...baseInput, monetization: ['iap_consumables'] });
    expect(withIap.map((f) => f.path)).toContain('scripts/autoload/monetization.gd');
  });
});

describe('defaults', () => {
  it('sanitizes package ids', () => {
    expect(defaultPackageId('Mein Spiel!')).toBe('com.empireforge.meinspiel');
    expect(defaultPackageId('123-cool')).toBe('com.empireforge.cool');
    expect(defaultPackageId('')).toBe('com.empireforge.game');
  });

  it('returns plausible budgets', () => {
    for (const genre of ['runner', 'idle', 'rpg_lite'] as const) {
      const budget = defaultPerformanceBudget(genre);
      expect([30, 60]).toContain(budget.targetFps);
      expect(budget.maxMemoryMb).toBeGreaterThan(100);
      expect(budget.maxApkSizeMb).toBeGreaterThan(10);
    }
  });
});
