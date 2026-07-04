import { describe, expect, it } from 'vitest';
import { generateIdeas } from '../src/ideas/index';
import type { GameIdea, IdeaBrief } from '../src/types/idea';
import type { EffortLevel, MonetizationModel } from '../src/types/common';

const EFFORT_ORDER: readonly EffortLevel[] = ['tiny', 'small', 'medium', 'large', 'very_large'];
const effortIndex = (level: EffortLevel): number => EFFORT_ORDER.indexOf(level);

const ROBLOX_MODELS: readonly MonetizationModel[] = [
  'game_passes',
  'developer_products',
  'premium_payouts',
  'cosmetics',
  'battle_pass',
];

const AD_MODELS: readonly MonetizationModel[] = ['rewarded_ads', 'interstitial_ads'];

function makeBrief(overrides: Partial<IdeaBrief> = {}): IdeaBrief {
  return {
    platform: 'mobile',
    genres: [],
    audience: 'casual_broad',
    monetizationFocus: [],
    maxEffort: 'large',
    multiplayer: 'any',
    count: 5,
    seed: 1234,
    ...overrides,
  };
}

/** Remove the intentionally non-deterministic fields before comparison. */
function stripVolatile(idea: GameIdea): Omit<GameIdea, 'id' | 'createdAt'> {
  const { id: _id, createdAt: _createdAt, ...rest } = idea;
  return rest;
}

describe('generateIdeas', () => {
  it('is deterministic for the same explicit seed', () => {
    const brief = makeBrief({ seed: 42, count: 6, platform: 'both' });
    const a = generateIdeas(brief).map(stripVolatile);
    const b = generateIdeas(brief).map(stripVolatile);
    expect(a).toEqual(b);
  });

  it('is deterministic without an explicit seed (derived from the brief)', () => {
    const briefA = makeBrief({ count: 4 });
    delete briefA.seed;
    const briefB = makeBrief({ count: 4 });
    delete briefB.seed;
    const a = generateIdeas(briefA).map(stripVolatile);
    const b = generateIdeas(briefB).map(stripVolatile);
    expect(a).toEqual(b);
  });

  it('produces different ideas for different seeds', () => {
    const a = generateIdeas(makeBrief({ seed: 1 }));
    const b = generateIdeas(makeBrief({ seed: 2 }));
    expect(a.map((i) => i.title)).not.toEqual(b.map((i) => i.title));
  });

  it('respects the requested count', () => {
    expect(generateIdeas(makeBrief({ count: 1 }))).toHaveLength(1);
    expect(generateIdeas(makeBrief({ count: 7 }))).toHaveLength(7);
  });

  it('clamps count into the 1..10 range', () => {
    expect(generateIdeas(makeBrief({ count: 0 }))).toHaveLength(1);
    expect(generateIdeas(makeBrief({ count: -5 }))).toHaveLength(1);
    expect(generateIdeas(makeBrief({ count: 25 }))).toHaveLength(10);
  });

  it('never emits ad monetization for a Roblox brief', () => {
    const ideas = generateIdeas(makeBrief({ platform: 'roblox', count: 10, seed: 99 }));
    for (const idea of ideas) {
      for (const entry of idea.monetization) {
        expect(AD_MODELS).not.toContain(entry.model);
        expect(ROBLOX_MODELS).toContain(entry.model);
      }
    }
  });

  it('honors the monetization focus when platform-valid', () => {
    const ideas = generateIdeas(
      makeBrief({ platform: 'roblox', monetizationFocus: ['game_passes'], count: 6, seed: 7 }),
    );
    for (const idea of ideas) {
      expect(idea.monetization.map((m) => m.model)).toContain('game_passes');
    }
  });

  it('fills every mandatory field with substantial content', () => {
    const ideas = generateIdeas(makeBrief({ count: 8, seed: 314, platform: 'both' }));
    for (const idea of ideas) {
      expect(idea.id).toMatch(/^idea_/);
      expect(idea.createdAt.length).toBeGreaterThan(0);
      expect(idea.title.trim().length).toBeGreaterThan(0);
      expect(idea.elevatorPitch.trim().length).toBeGreaterThan(40);
      expect(idea.coreLoop.length).toBeGreaterThanOrEqual(4);
      expect(idea.coreLoop.length).toBeLessThanOrEqual(6);
      for (const step of idea.coreLoop) expect(step.trim().length).toBeGreaterThan(0);
      expect(idea.usp.trim().length).toBeGreaterThan(0);
      expect(idea.theme.trim().length).toBeGreaterThan(0);
      expect(idea.audienceNotes.trim().length).toBeGreaterThan(0);
      expect(idea.effortBreakdown.trim().length).toBeGreaterThan(0);

      expect(idea.monetization.length).toBeGreaterThanOrEqual(2);
      expect(idea.monetization.length).toBeLessThanOrEqual(4);
      for (const entry of idea.monetization) {
        expect(entry.description.trim().length).toBeGreaterThan(0);
      }

      expect(idea.risks.length).toBeGreaterThanOrEqual(2);
      expect(idea.risks.length).toBeLessThanOrEqual(4);
      for (const r of idea.risks) {
        expect(r.title.trim().length).toBeGreaterThan(0);
        expect(r.mitigation.trim().length).toBeGreaterThan(0);
        expect(['low', 'medium', 'high', 'critical']).toContain(r.level);
      }

      expect(idea.whyItCouldSucceed.length).toBeGreaterThanOrEqual(3);
      expect(idea.whyItCouldSucceed.length).toBeLessThanOrEqual(4);
      expect(idea.whyItCouldFail.length).toBeGreaterThanOrEqual(3);
      expect(idea.whyItCouldFail.length).toBeLessThanOrEqual(4);

      expect(idea.improvedVersion.title.trim().length).toBeGreaterThan(0);
      expect(idea.improvedVersion.title).not.toBe(idea.title);
      expect(idea.improvedVersion.changes.length).toBeGreaterThanOrEqual(3);
      expect(idea.improvedVersion.changes.length).toBeLessThanOrEqual(5);
      expect(idea.improvedVersion.pitch.trim().length).toBeGreaterThan(0);

      expect(typeof idea.scores.overall).toBe('number');
      expect(idea.scores.fun.value).toBeGreaterThanOrEqual(0);
      expect(idea.scores.fun.value).toBeLessThanOrEqual(100);
      expect(idea.projectId).toBeNull();
    }
  });

  it('never exceeds maxEffort', () => {
    for (const maxEffort of EFFORT_ORDER) {
      const ideas = generateIdeas(makeBrief({ maxEffort, count: 10, seed: 5 }));
      for (const idea of ideas) {
        expect(effortIndex(idea.developmentEffort)).toBeLessThanOrEqual(effortIndex(maxEffort));
      }
    }
  });

  it('restricts ideas to the requested genres', () => {
    const ideas = generateIdeas(makeBrief({ genres: ['idle', 'merge'], count: 6, seed: 11 }));
    for (const idea of ideas) {
      expect(['idle', 'merge']).toContain(idea.genre);
    }
  });

  it('covers all genres when the genre list is empty', () => {
    const ideas = generateIdeas(makeBrief({ genres: [], count: 10, seed: 21 }));
    const genres = new Set(ideas.map((i) => i.genre));
    expect(genres.size).toBeGreaterThan(3);
  });

  it('weaves theme hints into theme and pitch', () => {
    const ideas = generateIdeas(makeBrief({ themeHints: 'Unterwasser', count: 3, seed: 8 }));
    for (const idea of ideas) {
      expect(idea.theme).toContain('Unterwasser');
      expect(idea.elevatorPitch).toContain('Unterwasser');
    }
    // Hint matching should surface the underwater setting for the first idea.
    const first = ideas[0];
    expect(first).toBeDefined();
    expect(first?.theme.toLowerCase()).toContain('tiefsee');
  });

  it('produces unique titles and varied archetypes within one call', () => {
    const ideas = generateIdeas(makeBrief({ count: 10, seed: 77 }));
    const titles = new Set(ideas.map((i) => i.title));
    expect(titles.size).toBe(ideas.length);
    const pitches = new Set(ideas.map((i) => i.elevatorPitch));
    expect(pitches.size).toBe(ideas.length);
  });

  it('carries the brief (with copied arrays) on every idea', () => {
    const brief = makeBrief({ genres: ['tycoon'], monetizationFocus: ['cosmetics'], count: 2 });
    const ideas = generateIdeas(brief);
    for (const idea of ideas) {
      expect(idea.brief.genres).toEqual(['tycoon']);
      expect(idea.brief.genres).not.toBe(brief.genres);
      expect(idea.brief.monetizationFocus).not.toBe(brief.monetizationFocus);
      expect(idea.platform).toBe(brief.platform);
      expect(idea.audience).toBe(brief.audience);
    }
  });
});
