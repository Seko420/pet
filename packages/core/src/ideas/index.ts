import type {
  EffortLevel,
  Genre,
  MonetizationModel,
  QualityTarget,
  TargetPlatform,
} from '../types/common';
import { AUDIENCE_LABELS, GENRE_LABELS } from '../types/common';
import type { GameIdea, IdeaBrief, IdeaRisk } from '../types/idea';
import type { ConceptProfile, ImprovementSuggestion, QualityScores } from '../types/scores';
import { createRng, seedFromString, type Rng } from '../util/random';
import { createId, nowIso } from '../util/ids';
import { evaluateConcept, suggestImprovements } from '../scoring/index';
import {
  ARCHETYPES,
  GENERIC_MONETIZATION,
  type IdeaArchetype,
  type MonetizationAngle,
} from './archetypes';
import { AUDIENCE_ADAPTATIONS, orderThemesForBrief, type ThemeDef } from './themes';
import { buildImprovedTitle, buildTitle } from './naming';

const EFFORT_ORDER: readonly EffortLevel[] = ['tiny', 'small', 'medium', 'large', 'very_large'];

function effortIndex(level: EffortLevel): number {
  const idx = EFFORT_ORDER.indexOf(level);
  return idx >= 0 ? idx : 2;
}

/** Monetization models that actually exist on each target platform. */
const ROBLOX_MODELS: readonly MonetizationModel[] = [
  'game_passes',
  'developer_products',
  'premium_payouts',
  'cosmetics',
  'battle_pass',
];

const MOBILE_MODELS: readonly MonetizationModel[] = [
  'rewarded_ads',
  'interstitial_ads',
  'iap_consumables',
  'iap_non_consumables',
  'cosmetics',
  'battle_pass',
  'subscription',
  'paid_app',
];

/** For cross-platform ideas we exclude ad formats (not available on Roblox). */
const CROSS_MODELS: readonly MonetizationModel[] = [
  'game_passes',
  'developer_products',
  'premium_payouts',
  'cosmetics',
  'battle_pass',
  'iap_consumables',
  'iap_non_consumables',
  'subscription',
];

function allowedModels(platform: TargetPlatform): readonly MonetizationModel[] {
  if (platform === 'roblox') return ROBLOX_MODELS;
  if (platform === 'mobile') return MOBILE_MODELS;
  return CROSS_MODELS;
}

const EFFORT_SCOPE: Record<EffortLevel, string> = {
  tiny: 'Ca. 1–2 Wochen bis zum spielbaren Kern',
  small: 'Ca. 3–5 Wochen bis zur ersten veröffentlichungsfähigen Version',
  medium: 'Ca. 2–3 Monate inklusive Soft-Launch-Politur',
  large: 'Ca. 4–6 Monate mit stabiler Content-Pipeline',
  very_large: 'Über 6 Monate – nur mit klarer Meilenstein-Disziplin zu stemmen',
};

const EFFORT_SPLITS: readonly string[] = [
  'Design 15 %, Code 40 %, Art 25 %, Balancing & QA 20 %',
  'Design 20 %, Code 35 %, Art 25 %, LiveOps-Vorbereitung 20 %',
  'Design 15 %, Code 45 %, Art 20 %, QA & Store-Setup 20 %',
];

function clampCount(count: number): number {
  const raw = Number.isFinite(count) ? Math.round(count) : 3;
  return Math.min(10, Math.max(1, raw));
}

function cyclePick<T>(items: readonly T[], index: number): T {
  const item = items[index % items.length];
  if (item === undefined) {
    throw new Error('Interner Fehler: Leerer Auswahlpool im Ideen-Generator.');
  }
  return item;
}

/**
 * Filter the archetype library by brief constraints. Every filter falls back
 * to the previous pool if it would empty the selection, so a valid brief
 * always produces ideas (effort is still clamped afterwards).
 */
function selectArchetypePool(brief: IdeaBrief): IdeaArchetype[] {
  const genreSet = new Set<Genre>(
    brief.genres.length > 0 ? brief.genres : (Object.keys(GENRE_LABELS) as Genre[]),
  );
  let pool = ARCHETYPES.filter((a) => genreSet.has(a.genre));

  const byMultiplayer = pool.filter((a) => {
    if (brief.multiplayer === 'required' || brief.multiplayer === 'preferred') {
      return a.multiplayer !== 'solo';
    }
    if (brief.multiplayer === 'no') return a.multiplayer !== 'required';
    return true;
  });
  if (byMultiplayer.length > 0) pool = byMultiplayer;

  const maxIdx = effortIndex(brief.maxEffort);
  const byEffort = pool.filter((a) => effortIndex(a.effort.min) <= maxIdx);
  if (byEffort.length > 0) pool = byEffort;

  return [...pool];
}

function resolveMultiplayer(rng: Rng, brief: IdeaBrief, archetype: IdeaArchetype): boolean {
  if (brief.multiplayer === 'required') return true;
  if (brief.multiplayer === 'no') return false;
  if (archetype.multiplayer === 'required') return true;
  if (archetype.multiplayer === 'solo') return false;
  return brief.multiplayer === 'preferred' ? true : rng.chance(0.6);
}

function resolveEffort(
  rng: Rng,
  archetype: IdeaArchetype,
  maxEffort: EffortLevel,
): { effort: EffortLevel; reducedScope: boolean } {
  const maxIdx = effortIndex(maxEffort);
  const minIdx = effortIndex(archetype.effort.min);
  const typIdx = effortIndex(archetype.effort.typical);

  let idx = Math.min(typIdx, maxIdx);
  const reducedScope = idx < minIdx;
  // Occasionally scope down for variety, but never below the archetype minimum.
  if (!reducedScope && idx > minIdx && rng.chance(0.25)) idx -= 1;

  const effort = EFFORT_ORDER[Math.max(0, Math.min(idx, EFFORT_ORDER.length - 1))] ?? maxEffort;
  return { effort, reducedScope };
}

function pickMonetization(
  rng: Rng,
  archetype: IdeaArchetype,
  platform: TargetPlatform,
  focus: readonly MonetizationModel[],
): { model: MonetizationModel; description: string }[] {
  const allowed = allowedModels(platform);
  const allowedSet = new Set(allowed);
  const pool = archetype.monetization.filter((m) => allowedSet.has(m.model));

  const chosen: MonetizationAngle[] = [];
  const usedModels = new Set<MonetizationModel>();

  // Honor the brief's monetization focus first (platform-valid models only).
  for (const model of focus) {
    if (chosen.length >= 3) break;
    if (!allowedSet.has(model) || usedModels.has(model)) continue;
    const fromPool = pool.find((p) => p.model === model);
    chosen.push(fromPool ?? { model, description: GENERIC_MONETIZATION[model] });
    usedModels.add(model);
  }

  const rest = rng.shuffle(pool.filter((p) => !usedModels.has(p.model)));
  const target = Math.max(2, Math.min(4, chosen.length + rng.int(2, 3)));
  for (const entry of rest) {
    if (chosen.length >= target) break;
    chosen.push(entry);
    usedModels.add(entry.model);
  }

  // Guarantee at least two entries even for exotic archetype/platform combos.
  if (chosen.length < 2) {
    for (const model of allowed) {
      if (chosen.length >= 2) break;
      if (usedModels.has(model)) continue;
      chosen.push({ model, description: GENERIC_MONETIZATION[model] });
      usedModels.add(model);
    }
  }

  return chosen.slice(0, 4).map((m) => ({ model: m.model, description: m.description }));
}

function resolveQualityTarget(effort: EffortLevel): QualityTarget {
  const idx = effortIndex(effort);
  if (idx <= 1) return 'prototype';
  if (idx >= 4) return 'premium';
  return 'polished';
}

function buildIdea(
  rng: Rng,
  brief: IdeaBrief,
  archetype: IdeaArchetype,
  theme: ThemeDef,
  usedTitles: Set<string>,
): GameIdea {
  const hintText = brief.themeHints?.trim() || undefined;

  const title = buildTitle(rng, theme.titleNouns, archetype.genre, usedTitles);
  const twist = rng.pick(archetype.twists);
  const elevatorPitch =
    `${archetype.fantasy.replace('{place}', theme.place)} ${twist} ${archetype.hook}` +
    (hintText
      ? ` Deine Themen-Wünsche („${hintText}“) fließen direkt in Setting, Items und Events ein.`
      : '');

  const { effort, reducedScope } = resolveEffort(rng, archetype, brief.maxEffort);
  const multiplayer = resolveMultiplayer(rng, brief, archetype);
  const monetization = pickMonetization(rng, archetype, brief.platform, brief.monetizationFocus);

  const risks: IdeaRisk[] = rng
    .pickMany(archetype.risks, rng.int(2, Math.min(4, archetype.risks.length)))
    .map((r) => ({ ...r }));

  const whyItCouldSucceed = rng.pickMany(
    archetype.successReasons,
    rng.int(3, Math.min(4, archetype.successReasons.length)),
  );
  const whyItCouldFail = rng.pickMany(
    archetype.failReasons,
    rng.int(3, Math.min(4, archetype.failReasons.length)),
  );

  const models = monetization.map((m) => m.model);
  const tags = Array.from(
    new Set([
      ...archetype.tags,
      ...theme.tags,
      ...(multiplayer ? ['social'] : []),
      ...(models.includes('battle_pass') ? ['seasonal'] : []),
    ]),
  );

  const profile: ConceptProfile = {
    platform: brief.platform,
    genre: archetype.genre,
    audience: brief.audience,
    monetization: models,
    multiplayer,
    effort,
    qualityTarget: resolveQualityTarget(effort),
    themeHints: brief.themeHints,
    tags,
  };
  const scores: QualityScores = evaluateConcept(profile);
  const suggestions: ImprovementSuggestion[] = suggestImprovements(profile, scores);

  const baseChanges = rng.pickMany(archetype.improvements, 3);
  const suggestedChanges = suggestions
    .filter((s) => s.impact >= 4)
    .slice(0, 2)
    .map((s) => s.title);
  const changes = Array.from(new Set([...baseChanges, ...suggestedChanges])).slice(0, 5);

  const improvedTitle = buildImprovedTitle(rng, title, theme.titleNouns, archetype.genre);
  const firstChange = changes[0] ?? 'Fokus auf die Kernmechanik legen';
  const secondChange = changes[1];
  const improvedPitch =
    `„${improvedTitle}“ verdichtet das Konzept auf ${archetype.essence}. ` +
    `Wichtigste Schärfungen: ${firstChange}${secondChange ? `; ${secondChange}` : ''}. ` +
    'So wird der Kernreiz früher erlebbar und trägt deutlich länger.';

  const adapt = AUDIENCE_ADAPTATIONS[brief.audience];
  const audienceNotes = `Zielgruppe ${AUDIENCE_LABELS[brief.audience]}: ${adapt.notes} ${adapt.monetizationNote}`;

  const effortBreakdown =
    `${EFFORT_SCOPE[effort]}. Der Plan konzentriert die Ressourcen auf ${archetype.essence}. ` +
    `Grobe Verteilung: ${rng.pick(EFFORT_SPLITS)}.` +
    (reducedScope
      ? ' Hinweis: bewusst als MVP-Schnitt unterhalb des typischen Umfangs dieses Konzepts geplant – Kernschleife zuerst, Ausbau nach Marktsignalen.'
      : '');

  const theme_ = `${theme.name} – ${theme.flavor}${hintText ? ` · Wunsch-Motive: ${hintText}` : ''}`;

  return {
    id: createId('idea'),
    createdAt: nowIso(),
    brief: { ...brief, genres: [...brief.genres], monetizationFocus: [...brief.monetizationFocus] },
    title,
    elevatorPitch,
    coreLoop: [...archetype.coreLoop],
    audience: brief.audience,
    audienceNotes,
    usp: archetype.usp,
    genre: archetype.genre,
    platform: brief.platform,
    theme: theme_,
    monetization,
    risks,
    developmentEffort: effort,
    effortBreakdown,
    whyItCouldSucceed,
    whyItCouldFail,
    improvedVersion: {
      title: improvedTitle,
      changes,
      pitch: improvedPitch,
    },
    scores,
    projectId: null,
  };
}

/**
 * Generate fully worked-out game ideas for a brief.
 * Deterministic: the same brief (or the same explicit seed) always produces
 * the same ideas, apart from the non-semantic `id`/`createdAt` fields.
 */
export function generateIdeas(brief: IdeaBrief): GameIdea[] {
  const seed = brief.seed ?? seedFromString(JSON.stringify(brief));
  const rng = createRng(seed);
  const count = clampCount(brief.count);

  const pool = selectArchetypePool(brief);
  if (pool.length === 0) {
    throw new Error('Für dieses Briefing wurden keine passenden Konzept-Archetypen gefunden.');
  }

  const archetypeOrder = rng.shuffle(pool);
  const themeOrder = orderThemesForBrief(rng, brief.themeHints);
  const usedTitles = new Set<string>();

  const ideas: GameIdea[] = [];
  for (let i = 0; i < count; i++) {
    const archetype = cyclePick(archetypeOrder, i);
    const theme = cyclePick(themeOrder, i);
    ideas.push(buildIdea(rng, brief, archetype, theme, usedTitles));
  }
  return ideas;
}
