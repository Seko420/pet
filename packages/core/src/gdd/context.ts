import type { GameIdea } from '../types/idea';
import type { GameProject } from '../types/project';
import type { Rng } from '../util/random';
import type { GenreContent } from './genreContent';

/**
 * Everything a section builder needs. Built once per document generation in
 * index.ts and passed through all builders in a fixed order, so the seeded
 * Rng produces identical output for identical inputs.
 */
export interface GddContext {
  project: GameProject;
  idea: GameIdea | null;
  rng: Rng;
  /** Genre-specific building blocks (progression, economy, examples, ...). */
  content: GenreContent;
  /** True when platform is 'roblox' or 'both'. */
  isRoblox: boolean;
  /** True when platform is 'mobile' or 'both'. */
  isMobile: boolean;
}

/** A single section builder: returns the markdown body (without the H2 title). */
export type SectionBuilder = (ctx: GddContext) => string;

/** Name of the primary (soft/fortschritt) currency, with a safe fallback. */
export function primaryCurrencyName(ctx: GddContext): string {
  return ctx.content.currencies[0]?.name ?? 'Münzen';
}

/** Name of the secondary currency, if the genre defines one. */
export function secondaryCurrencyName(ctx: GddContext): string | null {
  return ctx.content.currencies[1]?.name ?? null;
}

/** Core loop steps: prefer the idea's loop, fall back to the genre default. */
export function coreLoopSteps(ctx: GddContext): string[] {
  if (ctx.idea && ctx.idea.coreLoop.length > 0) return [...ctx.idea.coreLoop];
  return [...ctx.content.coreLoop];
}
