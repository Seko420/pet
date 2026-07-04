import type {
  Audience,
  EffortLevel,
  Genre,
  MonetizationModel,
  TargetPlatform,
} from '../types/common';
import type { GameProject } from '../types/project';
import type {
  ConceptProfile,
  ImprovementSuggestion,
  QualityScores,
  ScoreDimension,
  SuggestionCategory,
} from '../types/scores';

/**
 * Heuristic quality & market-potential engine.
 * Pure and deterministic: same profile -> same scores. Every dimension keeps
 * track of its strongest modifier so the UI can show a real justification,
 * not a canned phrase.
 *
 * technicalRisk is encoded as a SAFETY score (high = low risk), see
 * SCORE_DIMENSION_LABELS in types/scores.ts.
 */

type Dim = ScoreDimension;

const DIMS: Dim[] = [
  'fun',
  'retention',
  'monetization',
  'viralPotential',
  'productionFeasibility',
  'robloxFit',
  'mobileFit',
  'technicalRisk',
  'contentScalability',
  'multiplayerPotential',
  'liveOpsPotential',
];

/** Genre base values; unlisted dimensions default to 55. */
const GENRE_BASE: Record<Genre, Partial<Record<Dim, number>>> = {
  simulator: { fun: 62, retention: 72, robloxFit: 85, liveOpsPotential: 75, contentScalability: 78, monetization: 68, mobileFit: 55 },
  tycoon: { fun: 64, retention: 74, robloxFit: 82, liveOpsPotential: 72, contentScalability: 75, monetization: 66, mobileFit: 62 },
  obby: { fun: 60, retention: 52, robloxFit: 80, viralPotential: 62, productionFeasibility: 78, contentScalability: 62, mobileFit: 45 },
  rpg_lite: { fun: 68, retention: 70, contentScalability: 72, liveOpsPotential: 70, productionFeasibility: 42, technicalRisk: 45, monetization: 64 },
  survival: { fun: 66, retention: 62, viralPotential: 60, robloxFit: 68, productionFeasibility: 48, multiplayerPotential: 70 },
  roguelite: { fun: 70, retention: 66, mobileFit: 68, contentScalability: 68, productionFeasibility: 50, viralPotential: 52 },
  idle: { fun: 52, retention: 70, mobileFit: 85, productionFeasibility: 80, monetization: 66, viralPotential: 40, robloxFit: 42 },
  hypercasual: { fun: 58, retention: 38, mobileFit: 88, viralPotential: 72, productionFeasibility: 85, monetization: 50, liveOpsPotential: 35, robloxFit: 35 },
  hybridcasual: { fun: 62, retention: 58, mobileFit: 84, viralPotential: 64, productionFeasibility: 68, monetization: 62, robloxFit: 40 },
  puzzle: { fun: 60, retention: 60, mobileFit: 82, productionFeasibility: 75, viralPotential: 48, multiplayerPotential: 35, robloxFit: 40 },
  tower_defense: { fun: 64, retention: 62, mobileFit: 70, robloxFit: 66, contentScalability: 66, productionFeasibility: 60 },
  battle_arena: { fun: 70, retention: 64, robloxFit: 78, multiplayerPotential: 88, viralPotential: 70, productionFeasibility: 42, technicalRisk: 42, monetization: 68 },
  racing: { fun: 64, retention: 55, viralPotential: 55, multiplayerPotential: 66, productionFeasibility: 55, mobileFit: 60 },
  horror: { fun: 66, retention: 48, viralPotential: 80, robloxFit: 76, multiplayerPotential: 68, monetization: 52, liveOpsPotential: 48 },
  social_hangout: { fun: 58, retention: 66, robloxFit: 88, viralPotential: 74, multiplayerPotential: 90, monetization: 62, mobileFit: 40, contentScalability: 72 },
  sandbox: { fun: 66, retention: 70, robloxFit: 84, contentScalability: 82, multiplayerPotential: 76, productionFeasibility: 45, technicalRisk: 45 },
  card_battler: { fun: 62, retention: 64, mobileFit: 72, monetization: 70, contentScalability: 74, viralPotential: 45, productionFeasibility: 52 },
  merge: { fun: 56, retention: 62, mobileFit: 84, monetization: 64, productionFeasibility: 74, viralPotential: 42, robloxFit: 38 },
  runner: { fun: 58, retention: 44, mobileFit: 86, viralPotential: 60, productionFeasibility: 82, monetization: 48, robloxFit: 40 },
  sports: { fun: 62, retention: 56, multiplayerPotential: 70, viralPotential: 55, productionFeasibility: 55, mobileFit: 58 },
};

const EFFORT_FEASIBILITY: Record<EffortLevel, number> = {
  tiny: 22,
  small: 12,
  medium: 0,
  large: -14,
  very_large: -26,
};

const EFFORT_RISK: Record<EffortLevel, number> = {
  tiny: 14,
  small: 8,
  medium: 0,
  large: -12,
  very_large: -22,
};

interface Mod {
  dim: Dim;
  delta: number;
  reason: string;
}

function audienceMods(audience: Audience, genre: Genre): Mod[] {
  const mods: Mod[] = [];
  const kidFriendly: Genre[] = ['simulator', 'tycoon', 'obby', 'social_hangout', 'sandbox', 'runner', 'merge'];
  const matureLeaning: Genre[] = ['horror', 'survival', 'battle_arena', 'roguelite', 'card_battler'];

  if ((audience === 'kids_8_12' || audience === 'family') && kidFriendly.includes(genre)) {
    mods.push({ dim: 'retention', delta: 8, reason: `Genre passt sehr gut zur Zielgruppe ${audience === 'family' ? 'Familie' : 'Kinder'}` });
    mods.push({ dim: 'robloxFit', delta: 6, reason: 'Kernzielgruppe von Roblox' });
  }
  if (audience === 'kids_8_12' && matureLeaning.includes(genre)) {
    mods.push({ dim: 'fun', delta: -10, reason: 'Genre-Härte kollidiert mit junger Zielgruppe' });
    mods.push({ dim: 'retention', delta: -8, reason: 'Genre bindet junge Zielgruppe schlecht' });
  }
  if ((audience === 'teens_13_17' || audience === 'young_adults_18_24') && (genre === 'horror' || genre === 'battle_arena')) {
    mods.push({ dim: 'viralPotential', delta: 10, reason: 'Teens teilen Horror/PvP-Momente stark (Clips, Streams)' });
  }
  if (audience === 'core_gamers' && (genre === 'hypercasual' || genre === 'runner' || genre === 'merge')) {
    mods.push({ dim: 'retention', delta: -10, reason: 'Core-Gamer springen bei zu flacher Mechanik schnell ab' });
  }
  if (audience === 'casual_broad') {
    mods.push({ dim: 'mobileFit', delta: 6, reason: 'Breite Casual-Zielgruppe spielt vor allem mobil' });
  }
  return mods;
}

function monetizationMods(profile: ConceptProfile): Mod[] {
  const mods: Mod[] = [];
  const m = profile.monetization;
  const isKids = profile.audience === 'kids_8_12' || profile.audience === 'family';
  const hasAds = m.includes('rewarded_ads') || m.includes('interstitial_ads');

  if (m.length === 0) {
    mods.push({ dim: 'monetization', delta: -25, reason: 'Kein Monetarisierungsmodell definiert' });
  }
  if (hasAds && isKids) {
    mods.push({ dim: 'monetization', delta: -18, reason: 'Werbung bei Kinder-Zielgruppe: rechtlich heikel (COPPA/Families Policy) und wenig akzeptiert' });
  }
  if (m.includes('battle_pass') || m.includes('cosmetics')) {
    mods.push({ dim: 'monetization', delta: 8, reason: 'Cosmetics/Battle Pass: bewährt, fair und retention-freundlich' });
    mods.push({ dim: 'liveOpsPotential', delta: 8, reason: 'Battle Pass/Cosmetics tragen Seasons und Events' });
  }
  if ((profile.platform === 'roblox' || profile.platform === 'both') && (m.includes('game_passes') || m.includes('developer_products'))) {
    mods.push({ dim: 'monetization', delta: 8, reason: 'Game Passes/Developer Products sind der native Roblox-Umsatzpfad' });
  }
  if (profile.platform === 'roblox' && hasAds) {
    mods.push({ dim: 'monetization', delta: -12, reason: 'Klassische Mobile-Ads existieren auf Roblox nicht als Umsatzpfad' });
  }
  if (m.includes('subscription') && profile.effort !== 'large' && profile.effort !== 'very_large') {
    mods.push({ dim: 'monetization', delta: -6, reason: 'Abo braucht kontinuierlichen Content-Nachschub, der im geplanten Umfang knapp ist' });
  }
  return mods;
}

function tagMods(tags: string[]): Mod[] {
  const mods: Mod[] = [];
  const has = (t: string): boolean => tags.includes(t);
  if (has('pets')) {
    mods.push({ dim: 'retention', delta: 6, reason: 'Sammel-/Pet-Systeme sind starke Bindungs- und Sammelmotive' });
    mods.push({ dim: 'monetization', delta: 5, reason: 'Pets tragen faire Cosmetic-Monetarisierung' });
  }
  if (has('ugc')) {
    mods.push({ dim: 'contentScalability', delta: 12, reason: 'Nutzer-generierte Inhalte skalieren Content ohne Team-Aufwand' });
    mods.push({ dim: 'robloxFit', delta: 6, reason: 'UGC ist Kern-DNA von Roblox' });
  }
  if (has('seasonal')) {
    mods.push({ dim: 'liveOpsPotential', delta: 10, reason: 'Season-Struktur ist bereits im Konzept angelegt' });
  }
  if (has('social')) {
    mods.push({ dim: 'viralPotential', delta: 8, reason: 'Soziale Mechaniken erzeugen Einladungen und geteilte Momente' });
  }
  if (has('pvp')) {
    mods.push({ dim: 'multiplayerPotential', delta: 8, reason: 'PvP-Kern trägt Wettbewerb und Wiederspielwert' });
    mods.push({ dim: 'technicalRisk', delta: -6, reason: 'PvP erhöht Anforderungen an Netzwerk-Sicherheit und Balancing' });
  }
  return mods;
}

function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function evaluateConcept(profile: ConceptProfile): QualityScores {
  const base = GENRE_BASE[profile.genre] ?? {};
  const values = {} as Record<Dim, number>;
  const strongest = {} as Record<Dim, Mod | null>;
  for (const d of DIMS) {
    values[d] = base[d] ?? 55;
    strongest[d] = null;
  }

  const mods: Mod[] = [
    ...audienceMods(profile.audience, profile.genre),
    ...monetizationMods(profile),
    ...tagMods(profile.tags ?? []),
  ];

  // Platform fit: the off-platform fit is informational, the on-platform one matters.
  if (profile.platform === 'roblox') {
    mods.push({ dim: 'mobileFit', delta: -10, reason: 'Nicht als Mobile-Produkt geplant (nur informativ)' });
  } else if (profile.platform === 'mobile') {
    mods.push({ dim: 'robloxFit', delta: -10, reason: 'Nicht als Roblox-Produkt geplant (nur informativ)' });
  }

  // Multiplayer trade-off
  if (profile.multiplayer) {
    mods.push({ dim: 'multiplayerPotential', delta: 15, reason: 'Multiplayer ist fest eingeplant' });
    mods.push({ dim: 'viralPotential', delta: 8, reason: 'Gemeinsames Spielen bringt organische Einladungen' });
    mods.push({ dim: 'productionFeasibility', delta: -10, reason: 'Multiplayer erhöht Produktionsaufwand deutlich' });
    mods.push({ dim: 'technicalRisk', delta: -10, reason: 'Netzwerk, Sync und Exploits erhöhen das technische Risiko' });
  } else {
    mods.push({ dim: 'multiplayerPotential', delta: -20, reason: 'Bewusst Singleplayer - Multiplayer-Potenzial ungenutzt' });
  }

  // Effort
  mods.push({
    dim: 'productionFeasibility',
    delta: EFFORT_FEASIBILITY[profile.effort],
    reason:
      EFFORT_FEASIBILITY[profile.effort] >= 0
        ? 'Kompakter Produktionsumfang ist realistisch lieferbar'
        : 'Großer Produktionsumfang gefährdet die Fertigstellung',
  });
  mods.push({
    dim: 'technicalRisk',
    delta: EFFORT_RISK[profile.effort],
    reason:
      EFFORT_RISK[profile.effort] >= 0
        ? 'Kleiner Umfang hält das technische Risiko niedrig'
        : 'Umfang bringt viele technische Unbekannte mit',
  });
  if (profile.qualityTarget === 'premium') {
    mods.push({ dim: 'fun', delta: 5, reason: 'Premium-Qualitätsziel hebt Polish und Spielgefühl' });
    mods.push({ dim: 'productionFeasibility', delta: -6, reason: 'Premium-Anspruch kostet zusätzliche Produktionszeit' });
  }

  for (const mod of mods) {
    values[mod.dim] += mod.delta;
    const cur = strongest[mod.dim];
    if (!cur || Math.abs(mod.delta) > Math.abs(cur.delta)) strongest[mod.dim] = mod;
  }

  const baseReason: Record<Dim, string> = {
    fun: `Genre-Basiswert für ${profile.genre}`,
    retention: `Typische Bindungskraft des Genres ${profile.genre}`,
    monetization: 'Monetarisierungs-Basispotenzial des Genres',
    viralPotential: 'Teilbarkeit und Sichtbarkeit des Genres',
    productionFeasibility: 'Typischer Produktionsaufwand des Genres',
    robloxFit: 'Passung zu Roblox-Publikum und -Plattform',
    mobileFit: 'Passung zu mobilen Sessions und Touch-Bedienung',
    technicalRisk: 'Technische Komplexität des Genres',
    contentScalability: 'Wie gut sich Content seriell erweitern lässt',
    multiplayerPotential: 'Multiplayer-Eignung des Genres',
    liveOpsPotential: 'Eignung für Events, Seasons und laufende Updates',
  };

  const labeled = (d: Dim): { value: number; reason: string } => ({
    value: clamp(values[d]),
    reason: strongest[d] ? (strongest[d] as Mod).reason : baseReason[d],
  });

  const scores: QualityScores = {
    fun: labeled('fun'),
    retention: labeled('retention'),
    monetization: labeled('monetization'),
    viralPotential: labeled('viralPotential'),
    productionFeasibility: labeled('productionFeasibility'),
    robloxFit: labeled('robloxFit'),
    mobileFit: labeled('mobileFit'),
    technicalRisk: labeled('technicalRisk'),
    contentScalability: labeled('contentScalability'),
    multiplayerPotential: labeled('multiplayerPotential'),
    liveOpsPotential: labeled('liveOpsPotential'),
    overall: 0,
  };
  scores.overall = computeOverall(scores, profile.platform);
  return scores;
}

function computeOverall(s: QualityScores, platform: TargetPlatform): number {
  const platformFit =
    platform === 'roblox'
      ? s.robloxFit.value
      : platform === 'mobile'
        ? s.mobileFit.value
        : (s.robloxFit.value + s.mobileFit.value) / 2;
  const sum =
    s.fun.value * 0.18 +
    s.retention.value * 0.16 +
    s.monetization.value * 0.12 +
    s.viralPotential.value * 0.1 +
    s.productionFeasibility.value * 0.12 +
    platformFit * 0.1 +
    s.technicalRisk.value * 0.06 +
    s.contentScalability.value * 0.06 +
    s.multiplayerPotential.value * 0.04 +
    s.liveOpsPotential.value * 0.06;
  return clamp(sum);
}

// ---------------------------------------------------------------------------
// Improvement suggestions
// ---------------------------------------------------------------------------

interface SuggestionTemplate {
  category: SuggestionCategory;
  /** Dimension whose weakness triggers this suggestion (null = always relevant). */
  triggerDim: Dim | null;
  threshold: number;
  build(profile: ConceptProfile): { title: string; detail: string; impact: 1 | 2 | 3 | 4 | 5; effort: 1 | 2 | 3 | 4 | 5 };
}

const TEMPLATES: SuggestionTemplate[] = [
  {
    category: 'first_minute',
    triggerDim: 'retention',
    threshold: 101, // always when retention is not perfect
    build: (p) => ({
      title: 'Erste Minute radikal verdichten',
      detail:
        p.genre === 'idle' || p.genre === 'tycoon' || p.genre === 'simulator'
          ? 'Starte mit sofort sichtbarem Einkommen und dem ersten Kauf innerhalb von 30 Sekunden - kein Menü, kein Text-Tutorial. Die erste Aufwertung muss in unter 60 Sekunden passieren.'
          : 'Der Spieler muss in unter 60 Sekunden die Kernbelohnung erleben: direkt in der Action starten, erste Erfolgs-Fanfare früh, Erklärungen erst nach dem ersten Erfolgserlebnis.',
      impact: 5,
      effort: 2,
    }),
  },
  {
    category: 'tutorial',
    triggerDim: 'retention',
    threshold: 70,
    build: () => ({
      title: 'Tutorial in spielbare Häppchen zerlegen',
      detail:
        'Kein Blocktutorial: jede Mechanik genau dann erklären, wenn sie zum ersten Mal gebraucht wird ("teach on demand"). Jeder Tutorial-Schritt endet mit einer Belohnung. Abschlussquote als Analytics-Event messen.',
      impact: 4,
      effort: 2,
    }),
  },
  {
    category: 'retention',
    triggerDim: 'retention',
    threshold: 65,
    build: (p) => ({
      title: 'Tägliche Rückkehr-Schleife einbauen',
      detail:
        p.platform === 'roblox'
          ? 'Daily-Login-Belohnung mit sichtbarer 7-Tage-Leiste, tägliche Quests mit exklusiver Währung und ein Freunde-Bonus (mehr Belohnung, wenn Freunde online sind).'
          : 'Daily Rewards mit Vorschau auf Tag 7, kurze Tagesziele (3 Quests à 2 Minuten) und sanfte Comeback-Belohnung statt Streak-Bestrafung.',
      impact: 4,
      effort: 3,
    }),
  },
  {
    category: 'monetization',
    triggerDim: 'monetization',
    threshold: 65,
    build: (p) => ({
      title: 'Monetarisierung auf faire Selbstausdrucks-Käufe fokussieren',
      detail:
        p.platform === 'roblox' || p.platform === 'both'
          ? 'Cosmetics + 2-3 Game Passes mit dauerhaftem Komfortwert (z.B. +1 Begleiter-Slot) statt Pay-to-Win. Developer Products nur für Beschleunigung, nie für exklusive Macht.'
          : 'Ein klarer No-Ads-Kauf, Cosmetics für Selbstausdruck und ein fairer Battle Pass. Rewarded Ads nur als optionaler Bonus, nie als Fortschritts-Blocker.',
      impact: 4,
      effort: 3,
    }),
  },
  {
    category: 'cut_feature',
    triggerDim: 'productionFeasibility',
    threshold: 55,
    build: () => ({
      title: 'MVP-Schnitt: eine Kernmechanik, ein Modus',
      detail:
        'Streiche für den ersten Release alles, was nicht die Kernschleife trägt (Zweitmodi, Housing, Trading, Clans). Ein exzellenter Loop schlägt fünf halbfertige Features. Gestrichenes wandert sichtbar auf die Post-Launch-Roadmap.',
      impact: 5,
      effort: 1,
    }),
  },
  {
    category: 'high_impact_feature',
    triggerDim: 'viralPotential',
    threshold: 60,
    build: (p) => ({
      title: 'Einen teilbaren Moment einbauen',
      detail:
        p.multiplayer
          ? 'Ein gemeinsam erlebter Höhepunkt pro Session (Boss-Finale, Foto-Moment, knappe Rettung) plus einfache Einladungs-Belohnung: "Bring einen Freund mit, ihr bekommt beide X".'
          : 'Ein Ergebnis-Screen, den man zeigen will (Run-Statistik, Basis-Panorama, Rekord-Vergleich) - Screenshots sind die günstigste Werbung.',
      impact: 3,
      effort: 2,
    }),
  },
  {
    category: 'risk',
    triggerDim: 'technicalRisk',
    threshold: 55,
    build: (p) => ({
      title: 'Technisches Risiko früh entschärfen',
      detail:
        p.platform === 'roblox' || p.platform === 'both'
          ? 'In Woche 1 einen Walking Skeleton bauen: DataStore-Speichern, ein Remote-Roundtrip mit Validierung und 20 Spieler im Stresstest - bevor Content entsteht.'
          : 'In Woche 1 einen Geräte-Smoketest aufsetzen: niedrigstes Zielgerät definieren, Kernszene mit Ziel-FPS messen, Speicherbudget einhalten - bevor Content entsteht.',
      impact: 4,
      effort: 2,
    }),
  },
  {
    category: 'engagement_fairness',
    triggerDim: null,
    threshold: 0,
    build: (p) => ({
      title: 'Bindung ja - Ausbeutung nein',
      detail:
        (p.audience === 'kids_8_12' || p.audience === 'family'
          ? 'Kinder-Zielgruppe: keine Echtgeld-Zufallskäufe, keine ablaufenden Kauf-Timer, Preise in einer Sitzung überschaubar. '
          : '') +
        'Motivation über Ziele und Fortschritt statt Verlustangst: Tagesziele statt Streak-Strafen, Events mit Nachhol-Möglichkeit, transparente Preise. Das schützt Bewertungen, Plattform-Konformität und langfristige Retention.',
      impact: 3,
      effort: 2,
    }),
  },
  {
    category: 'high_impact_feature',
    triggerDim: 'liveOpsPotential',
    threshold: 60,
    build: () => ({
      title: 'LiveOps-Gerüst von Anfang an mitdenken',
      detail:
        'Events, Quests und Shop-Rotation datengetrieben bauen (Konfiguration statt Code). Dann kostet ein neues Wochenend-Event Stunden statt Tage - der wichtigste Hebel für langlebige Spiele.',
      impact: 4,
      effort: 3,
    }),
  },
];

export function suggestImprovements(
  profile: ConceptProfile,
  scores: QualityScores,
): ImprovementSuggestion[] {
  const dimValue = (d: Dim): number => scores[d].value;
  const picked: ImprovementSuggestion[] = [];
  const skipped: ImprovementSuggestion[] = [];
  for (const t of TEMPLATES) {
    const relevant = t.triggerDim === null || dimValue(t.triggerDim) < t.threshold;
    const built = { category: t.category, ...t.build(profile) };
    (relevant ? picked : skipped).push(built);
  }
  // Strong concepts trigger few templates; still deliver at least 5 levers -
  // the next-best untriggered ideas remain genuinely useful.
  while (picked.length < 5 && skipped.length > 0) {
    picked.push(skipped.shift() as ImprovementSuggestion);
  }
  const weight = (s: ImprovementSuggestion): number => s.impact * 2 - s.effort;
  picked.sort((a, b) => weight(b) - weight(a));
  return picked.slice(0, 8);
}

// ---------------------------------------------------------------------------
// Profile extraction
// ---------------------------------------------------------------------------

const EFFORT_BY_QUALITY: Record<NonNullable<GameProject['qualityTarget']>, EffortLevel> = {
  prototype: 'small',
  polished: 'medium',
  premium: 'large',
};

export function profileFromProject(project: GameProject): ConceptProfile {
  const tags: string[] = [];
  const text = `${project.description} ${project.mvpGoal} ${project.releaseGoal}`.toLowerCase();
  if (/\bpets?\b|haustier/.test(text)) tags.push('pets');
  if (/\bugc\b|nutzer.?generiert|user.?generated/.test(text)) tags.push('ugc');
  if (/season|saison|battle.?pass/.test(text)) tags.push('seasonal');
  if (/freund|social|zusammen|coop|co-op/.test(text)) tags.push('social');
  if (/pvp|versus|duell|arena/.test(text)) tags.push('pvp');

  const monetization: MonetizationModel[] = project.monetization;
  return {
    platform: project.platform,
    genre: project.genre,
    audience: project.audience,
    monetization,
    multiplayer: project.multiplayer,
    effort: EFFORT_BY_QUALITY[project.qualityTarget] ?? 'medium',
    qualityTarget: project.qualityTarget,
    themeHints: project.description || undefined,
    tags,
  };
}
