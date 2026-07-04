import type { GddSection, GddSectionId } from '../types/gdd';
import { GDD_SECTION_TITLES } from '../types/gdd';
import type { GameIdea } from '../types/idea';
import type { GameProject } from '../types/project';
import { createRng, seedFromString } from '../util/random';
import type { GddContext, SectionBuilder } from './context';
import { GENRE_CONTENT } from './genreContent';
import { buildAnalytics, buildEvents, buildLiveops, buildMonetization } from './sections/business';
import { buildEconomy, buildEnemies, buildItems, buildQuests } from './sections/content';
import { buildMultiplayer, buildUiUx } from './sections/experience';
import { buildBalancing, buildLevelDesign, buildProgression } from './sections/gameplay';
import { buildCoreLoop, buildOverview, buildStorySetting } from './sections/overview';
import {
  buildMobileImplementation,
  buildRobloxImplementation,
  buildTechnicalArchitecture,
} from './sections/platform';
import { buildFullReleaseScope, buildMvpScope } from './sections/scope';

export type { GddContext } from './context';
export type { GenreContent } from './genreContent';
export { GENRE_CONTENT } from './genreContent';

const SECTION_BUILDERS: Record<GddSectionId, SectionBuilder> = {
  overview: buildOverview,
  story_setting: buildStorySetting,
  core_loop: buildCoreLoop,
  progression: buildProgression,
  level_design: buildLevelDesign,
  economy: buildEconomy,
  items: buildItems,
  enemies: buildEnemies,
  quests: buildQuests,
  multiplayer: buildMultiplayer,
  ui_ux: buildUiUx,
  monetization: buildMonetization,
  liveops: buildLiveops,
  events: buildEvents,
  analytics: buildAnalytics,
  balancing: buildBalancing,
  roblox_implementation: buildRobloxImplementation,
  mobile_implementation: buildMobileImplementation,
  technical_architecture: buildTechnicalArchitecture,
  mvp_scope: buildMvpScope,
  full_release_scope: buildFullReleaseScope,
};

/**
 * Generate all 21 GDD sections for a project, optionally enriched by the
 * idea it was promoted from. Deterministic: the same project id always
 * produces the same document (seeded RNG via seedFromString(project.id)).
 */
export function generateGddSections(project: GameProject, idea: GameIdea | null): GddSection[] {
  const rng = createRng(seedFromString(project.id));
  const ctx: GddContext = {
    project,
    idea,
    rng,
    content: GENRE_CONTENT[project.genre],
    isRoblox: project.platform === 'roblox' || project.platform === 'both',
    isMobile: project.platform === 'mobile' || project.platform === 'both',
  };

  // Object.keys preserves the declaration order of GDD_SECTION_TITLES, which
  // is the canonical section order. Builders run in this fixed order so the
  // shared RNG stays deterministic.
  const ids = Object.keys(GDD_SECTION_TITLES) as GddSectionId[];
  return ids.map((id) => ({
    id,
    title: GDD_SECTION_TITLES[id],
    markdown: SECTION_BUILDERS[id](ctx).trim(),
  }));
}

/**
 * Render a full GDD as one markdown document: a title block, then one H2 per
 * section, separated by horizontal rules. Intentionally date-free so the
 * output is stable for a given input.
 */
export function gddToMarkdown(sections: GddSection[], projectName: string): string {
  const titleBlock = [
    `# ${projectName} – Game Design Document`,
    '',
    '*Automatisch generierter Entwurf. Ein lebendes Dokument: Nach jedem Playtest überarbeiten.*',
  ].join('\n');

  const sectionBlocks = sections.map((s) => `## ${s.title}\n\n${s.markdown.trim()}`);
  return [titleBlock, ...sectionBlocks].join('\n\n---\n\n') + '\n';
}
