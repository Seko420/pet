import { describe, expect, it } from 'vitest';
import { evaluateConcept, profileFromProject, suggestImprovements } from '../src/scoring/index';
import { generateContentPlan, generateTaskPlan } from '../src/tasks/index';
import { getChecklistsForProject } from '../src/checklists/index';
import { generateAnalyticsPlan } from '../src/analytics/index';
import type { ConceptProfile } from '../src/types/scores';
import type { GameProject } from '../src/types/project';

const baseProfile: ConceptProfile = {
  platform: 'roblox',
  genre: 'simulator',
  audience: 'kids_8_12',
  monetization: ['game_passes', 'cosmetics'],
  multiplayer: true,
  effort: 'medium',
};

function makeProject(patch: Partial<GameProject> = {}): GameProject {
  return {
    id: 'prj_test1',
    name: 'Testspiel',
    slug: 'testspiel',
    platform: 'both',
    genre: 'tycoon',
    audience: 'teens_13_17',
    status: 'concept',
    monetization: ['game_passes', 'iap_consumables'],
    artStyle: 'low_poly',
    multiplayer: true,
    qualityTarget: 'polished',
    mvpGoal: 'Spielbarer Kern-Loop',
    releaseGoal: 'Veröffentlichung auf Roblox und Android',
    description: 'Ein Tycoon mit Pets und Season-Battle-Pass',
    workspacePath: null,
    ideaId: null,
    scores: null,
    roblox: null,
    mobile: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...patch,
  };
}

describe('scoring', () => {
  it('is deterministic and within bounds', () => {
    const a = evaluateConcept(baseProfile);
    const b = evaluateConcept(baseProfile);
    expect(a).toEqual(b);
    for (const [k, v] of Object.entries(a)) {
      if (k === 'overall') continue;
      const s = v as { value: number; reason: string };
      expect(s.value).toBeGreaterThanOrEqual(0);
      expect(s.value).toBeLessThanOrEqual(100);
      expect(s.reason.length).toBeGreaterThan(5);
    }
    expect(a.overall).toBeGreaterThanOrEqual(0);
    expect(a.overall).toBeLessThanOrEqual(100);
  });

  it('penalizes ads for a kids audience', () => {
    const withAds = evaluateConcept({
      ...baseProfile,
      platform: 'mobile',
      monetization: ['rewarded_ads'],
    });
    const withoutAds = evaluateConcept({
      ...baseProfile,
      platform: 'mobile',
      monetization: ['cosmetics'],
    });
    expect(withAds.monetization.value).toBeLessThan(withoutAds.monetization.value);
  });

  it('suggests 5-8 prioritized improvements', () => {
    const scores = evaluateConcept(baseProfile);
    const suggestions = suggestImprovements(baseProfile, scores);
    expect(suggestions.length).toBeGreaterThanOrEqual(5);
    expect(suggestions.length).toBeLessThanOrEqual(8);
    expect(suggestions.some((s) => s.category === 'engagement_fairness')).toBe(true);
  });

  it('extracts tags from project texts', () => {
    const profile = profileFromProject(makeProject());
    expect(profile.tags).toContain('pets');
    expect(profile.tags).toContain('seasonal');
  });
});

describe('task & content plans', () => {
  it('includes platform-specific tasks only for matching platforms', () => {
    const robloxTasks = generateTaskPlan(makeProject({ platform: 'roblox' }));
    const mobileTasks = generateTaskPlan(makeProject({ platform: 'mobile' }));
    expect(robloxTasks.some((t) => t.title.includes('Rojo'))).toBe(true);
    expect(robloxTasks.some((t) => t.title.includes('Godot'))).toBe(false);
    expect(mobileTasks.some((t) => t.title.includes('Godot'))).toBe(true);
    expect(mobileTasks.some((t) => t.title.includes('Rojo'))).toBe(false);
  });

  it('orders milestones MVP -> Beta -> Release and fills all fields', () => {
    const tasks = generateTaskPlan(makeProject());
    expect(tasks.length).toBeGreaterThanOrEqual(25);
    const order = { MVP: 0, Beta: 1, Release: 2 } as Record<string, number>;
    for (let i = 1; i < tasks.length; i++) {
      expect(order[tasks[i]!.milestone]!).toBeGreaterThanOrEqual(order[tasks[i - 1]!.milestone]!);
    }
    for (const t of tasks) {
      expect(t.projectId).toBe('prj_test1');
      expect(t.title.length).toBeGreaterThan(3);
      expect(t.status).toBe('todo');
    }
  });

  it('generates a non-empty deterministic content plan', () => {
    const a = generateContentPlan(makeProject());
    const b = generateContentPlan(makeProject());
    expect(a.length).toBeGreaterThanOrEqual(15);
    expect(a.map((i) => i.name)).toEqual(b.map((i) => i.name));
    expect(a.every((i) => i.projectId === 'prj_test1')).toBe(true);
  });
});

describe('checklists', () => {
  it('filters lists by platform', () => {
    const roblox = getChecklistsForProject(makeProject({ platform: 'roblox' }));
    const mobile = getChecklistsForProject(makeProject({ platform: 'mobile' }));
    expect(roblox.some((c) => c.kind === 'roblox_publishing')).toBe(true);
    expect(roblox.some((c) => c.kind === 'app_store')).toBe(false);
    expect(mobile.some((c) => c.kind === 'app_store')).toBe(true);
    expect(mobile.some((c) => c.kind === 'roblox_publishing')).toBe(false);
  });

  it('adds COPPA requirements for kid audiences', () => {
    const kids = getChecklistsForProject(makeProject({ audience: 'kids_8_12' }));
    const privacy = kids.find((c) => c.kind === 'privacy');
    expect(privacy?.items.some((i) => i.id === 'priv_coppa' && i.required)).toBe(true);
    const adults = getChecklistsForProject(makeProject({ audience: 'adults_25_plus' }));
    expect(adults.find((c) => c.kind === 'privacy')?.items.some((i) => i.id === 'priv_coppa')).toBe(false);
  });
});

describe('analytics plan', () => {
  it('contains required events and respects platform exclusives', () => {
    const both = generateAnalyticsPlan(makeProject({ platform: 'both' }));
    const names = both.events.map((e) => e.name);
    for (const required of ['tutorial_started', 'tutorial_completed', 'first_win', 'level_completed', 'shop_opened', 'daily_return', 'funnel_drop']) {
      expect(names).toContain(required);
    }
    const mobileOnly = generateAnalyticsPlan(makeProject({ platform: 'mobile' }));
    expect(mobileOnly.events.some((e) => e.name === 'game_pass_purchase')).toBe(false);
    const robloxOnly = generateAnalyticsPlan(makeProject({ platform: 'roblox' }));
    expect(robloxOnly.events.some((e) => e.name === 'iap_purchase')).toBe(false);
    expect(robloxOnly.events.some((e) => e.name === 'game_pass_purchase')).toBe(true);
  });

  it('plans 12 weeks with a season arc, deterministically', () => {
    const a = generateAnalyticsPlan(makeProject());
    const b = generateAnalyticsPlan(makeProject());
    expect(a.liveOpsCalendar).toEqual(b.liveOpsCalendar);
    expect(a.liveOpsCalendar).toHaveLength(12);
    expect(a.liveOpsCalendar.some((e) => e.kind === 'season_start')).toBe(true);
    expect(a.liveOpsCalendar.some((e) => e.kind === 'season_end')).toBe(true);
    expect(a.abTests.length).toBeGreaterThanOrEqual(3);
    expect(a.balancingNotes.length).toBeGreaterThanOrEqual(3);
  });
});
