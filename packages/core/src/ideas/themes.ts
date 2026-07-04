import type { Audience } from '../types/common';
import type { Rng } from '../util/random';

/**
 * Original setting pool for the idea generator.
 * All settings are invented for this product - no borrowed IPs.
 */
export interface ThemeDef {
  /** Display name shown in the idea, e.g. "Leuchtender Pilzwald". */
  name: string;
  /** Complete prepositional phrase usable inside a German sentence. */
  place: string;
  /** Short atmospheric clause appended to the theme string. */
  flavor: string;
  /** Compact nouns used by the title builder. */
  titleNouns: readonly string[];
  /** Lowercased German keywords used to match free-text theme hints. */
  matchWords: readonly string[];
  /** Free-form concept signals fed into the ConceptProfile tags. */
  tags: readonly string[];
}

export const THEMES: readonly ThemeDef[] = [
  {
    name: 'Leuchtender Pilzwald',
    place: 'in einem leuchtenden Pilzwald',
    flavor: 'biolumineszente Sporen tauchen alles in sanftes Licht',
    titleNouns: ['Sporenhain', 'Glimmerwald'],
    matchWords: ['pilz', 'wald', 'natur', 'glow', 'leucht'],
    tags: ['nature', 'glow', 'cozy'],
  },
  {
    name: 'Versunkene Tiefsee-Station',
    place: 'in einer versunkenen Tiefsee-Station',
    flavor: 'Druckschleusen, Korallenbewuchs und das ferne Leuchten der Tiefe',
    titleNouns: ['Tiefsee', 'Korallenwerft'],
    matchWords: ['unterwasser', 'meer', 'ozean', 'tiefsee', 'wasser', 'koralle'],
    tags: ['underwater', 'exploration'],
  },
  {
    name: 'Schwebende Inselkette',
    place: 'auf einer Kette schwebender Inseln',
    flavor: 'Hängebrücken, Windströme und Abgründe voller Wolken',
    titleNouns: ['Wolkeninseln', 'Himmelsarchipel'],
    matchWords: ['insel', 'himmel', 'fliegen', 'luft', 'wolke', 'schweben'],
    tags: ['sky', 'exploration'],
  },
  {
    name: 'Zeitreise-Werkstatt',
    place: 'in einer Werkstatt zwischen den Zeitepochen',
    flavor: 'Dampfmaschinen neben Hologrammen, und jede Tür führt in ein anderes Jahrhundert',
    titleNouns: ['Zeitwerk', 'Epochenschmiede'],
    matchWords: ['zeit', 'zeitreise', 'retro', 'epoche', 'vergangenheit', 'zukunft'],
    tags: ['time', 'crafting'],
  },
  {
    name: 'Kristallhöhlen',
    place: 'in weit verzweigten Kristallhöhlen',
    flavor: 'jeder Schlag lässt Facetten aufblitzen und Echos durch die Gänge rollen',
    titleNouns: ['Kristallgrund', 'Funkelschlucht'],
    matchWords: ['kristall', 'höhle', 'hoehle', 'mine', 'edelstein'],
    tags: ['mining', 'glow'],
  },
  {
    name: 'Wolkenhafen',
    place: 'in einem geschäftigen Wolkenhafen',
    flavor: 'Luftschiffe legen an, Kräne schwenken, Fracht wechselt über den Wolken die Besitzer',
    titleNouns: ['Wolkenhafen', 'Himmelsdock'],
    matchWords: ['hafen', 'schiff', 'wolke', 'handel', 'luftschiff'],
    tags: ['trade', 'sky'],
  },
  {
    name: 'Vulkanschmiede',
    place: 'am Rand einer aktiven Vulkanschmiede',
    flavor: 'Lavaströme treiben Hämmer an, und Funken regnen auf glühende Ambosse',
    titleNouns: ['Glutschmiede', 'Lavawerk'],
    matchWords: ['vulkan', 'feuer', 'lava', 'schmiede', 'glut'],
    tags: ['fire', 'crafting'],
  },
  {
    name: 'Polar-Außenposten',
    place: 'auf einem Forschungsaußenposten im ewigen Eis',
    flavor: 'Schneestürme, Generatorbrummen und Polarlichter über der Station',
    titleNouns: ['Frostposten', 'Eismeer'],
    matchWords: ['eis', 'schnee', 'polar', 'winter', 'arktis', 'frost'],
    tags: ['ice', 'survival'],
  },
  {
    name: 'Dschungel-Ruinenstadt',
    place: 'in einer überwucherten Ruinenstadt im Dschungel',
    flavor: 'Lianen über eingestürzten Torbögen und Mechanismen, die seit Jahrhunderten warten',
    titleNouns: ['Rankenstadt', 'Dschungelruinen'],
    matchWords: ['dschungel', 'ruine', 'tempel', 'abenteuer', 'expedition'],
    tags: ['jungle', 'exploration'],
  },
  {
    name: 'Neon-Nachtmarkt',
    place: 'auf einem flirrenden Neon-Nachtmarkt',
    flavor: 'Leuchtreklamen, dampfende Garküchen und Drohnen zwischen den Ständen',
    titleNouns: ['Neonmarkt', 'Nachtbasar'],
    matchWords: ['neon', 'stadt', 'cyber', 'markt', 'nacht', 'anime', 'manga'],
    tags: ['urban', 'neon'],
  },
  {
    name: 'Uhrwerk-Stadt',
    place: 'in einer Stadt aus Zahnrädern und Uhrwerken',
    flavor: 'ganze Stadtviertel drehen sich zur vollen Stunde in neue Positionen',
    titleNouns: ['Zahnradstadt', 'Uhrwerk'],
    matchWords: ['uhrwerk', 'steampunk', 'zahnrad', 'maschine', 'mechanik'],
    tags: ['clockwork', 'crafting'],
  },
  {
    name: 'Süßwaren-Manufaktur',
    place: 'in einer überdrehten Süßwaren-Manufaktur',
    flavor: 'Karamellflüsse, Zuckerwattewolken und Maschinen mit zu viel Schwung',
    titleNouns: ['Zuckerwerk', 'Bonbonfabrik'],
    matchWords: ['süß', 'suess', 'candy', 'zucker', 'essen', 'bonbon'],
    tags: ['food', 'cozy'],
  },
  {
    name: 'Verwunschene Bibliothek',
    place: 'in einer verwunschenen, endlosen Bibliothek',
    flavor: 'Regale wandern, Bücher flüstern, und manche Kapitel sind begehbar',
    titleNouns: ['Bücherlabyrinth', 'Tintenreich'],
    matchWords: ['buch', 'magie', 'bibliothek', 'zauber', 'mystisch'],
    tags: ['magic', 'mystery'],
  },
  {
    name: 'Mini-Planeten-Archipel',
    place: 'auf einem Archipel aus Mini-Planeten',
    flavor: 'jede Kugel hat eigene Schwerkraft, eigenes Wetter und eigene Bewohner',
    titleNouns: ['Planetenring', 'Sternenfeld'],
    matchWords: ['weltraum', 'planet', 'stern', 'space', 'galaxie', 'all'],
    tags: ['space', 'exploration'],
  },
  {
    name: 'Roboter-Flohmarkt',
    place: 'auf einem Flohmarkt für ausgemusterte Roboter',
    flavor: 'zwischen Ersatzteilkisten piepsen halb reparierte Maschinen um Aufmerksamkeit',
    titleNouns: ['Schrottbasar', 'Roboterhof'],
    matchWords: ['roboter', 'technik', 'schrott', 'maschine', 'mech'],
    tags: ['robots', 'crafting'],
  },
  {
    name: 'Bienen-Metropole',
    place: 'in einer summenden Bienen-Metropole',
    flavor: 'Wabentürme, Nektarbörsen und Pollen-Lieferrouten im Berufsverkehr',
    titleNouns: ['Wabenstadt', 'Honigturm'],
    matchWords: ['biene', 'honig', 'insekt', 'tier', 'wiese'],
    tags: ['animals', 'cozy'],
  },
  {
    name: 'Treibende Marktflotte',
    place: 'auf einer treibenden Flotte aus Marktbooten',
    flavor: 'vertäute Boote bilden schwimmende Gassen, die sich mit der Strömung neu ordnen',
    titleNouns: ['Flussflotte', 'Bootsmarkt'],
    matchWords: ['boot', 'fluss', 'wasser', 'handel', 'schiff', 'flotte'],
    tags: ['water', 'trade'],
  },
  {
    name: 'Geisterbahnhof',
    place: 'an einem Bahnhof zwischen den Welten',
    flavor: 'Züge ohne Fahrplan, Nebel auf Gleis sieben und Ansagen, die niemand macht',
    titleNouns: ['Nebelgleis', 'Geisterexpress'],
    matchWords: ['geist', 'zug', 'bahnhof', 'grusel', 'spuk', 'horror'],
    tags: ['spooky', 'mystery'],
  },
  {
    name: 'Origami-Faltwelt',
    place: 'in einer Welt aus gefaltetem Papier',
    flavor: 'Berge aus Knicken, Flüsse aus Tinte und Bewohner mit scharfen Kanten',
    titleNouns: ['Faltreich', 'Papierwelt'],
    matchWords: ['papier', 'origami', 'falten', 'kunst', 'basteln'],
    tags: ['paper', 'creative'],
  },
  {
    name: 'Unterirdische Gewächshaus-Kolonie',
    place: 'in einer unterirdischen Gewächshaus-Kolonie',
    flavor: 'Kunstlicht-Terrassen voller Pflanzen, tief unter der Oberfläche',
    titleNouns: ['Wurzelstadt', 'Tiefgarten'],
    matchWords: ['pflanze', 'garten', 'gewächshaus', 'gewaechshaus', 'farm', 'anbau'],
    tags: ['plants', 'cozy'],
  },
  {
    name: 'Sternenobservatorium',
    place: 'in einem uralten Sternenobservatorium',
    flavor: 'Messing-Teleskope, Sternkarten an den Wänden und ein Dach, das sich zur Nacht öffnet',
    titleNouns: ['Sternwarte', 'Kometenhalle'],
    matchWords: ['stern', 'teleskop', 'nacht', 'astronomie', 'komet'],
    tags: ['space', 'mystery'],
  },
  {
    name: 'Wüsten-Karawanserei',
    place: 'in einer lebhaften Wüsten-Karawanserei',
    flavor: 'Händler, Dünenschiffe und Geschichten, die mit dem Sand weiterziehen',
    titleNouns: ['Dünenrast', 'Karawanenhof'],
    matchWords: ['wüste', 'wueste', 'sand', 'karawane', 'düne', 'duene'],
    tags: ['desert', 'trade'],
  },
  {
    name: 'Wolken-Tierpension',
    place: 'in einer Tierpension über den Wolken',
    flavor: 'flauschige Gäste mit eigenwilligen Wünschen und Zimmern voller Spielzeug',
    titleNouns: ['Flauschhof', 'Wolkenpension'],
    matchWords: ['pet', 'pets', 'tier', 'haustier', 'welpe', 'katze', 'hund'],
    tags: ['pets', 'cozy'],
  },
];

/** Audience-specific design and monetization guidance (user-facing German). */
export interface AudienceAdaptation {
  notes: string;
  monetizationNote: string;
}

export const AUDIENCE_ADAPTATIONS: Record<Audience, AudienceAdaptation> = {
  kids_8_12: {
    notes:
      'Sehr klare Ziele, große Symbole und kaum Fließtext – Belohnungen im Minutentakt halten die Motivation hoch. Frust-Spitzen abfedern, Fehler nie bestrafen, sondern in neue Versuche umlenken.',
    monetizationNote:
      'Monetarisierung strikt fair: keine Lootbox-Mechaniken, alle Kaufinhalte vorab sichtbar und auch für Eltern nachvollziehbar.',
  },
  teens_13_17: {
    notes:
      'Status und Vergleichbarkeit zählen: Leaderboards, seltene Cosmetics und clip-taugliche Momente für Social Media. Tägliche, sichtbare Fortschrittssprünge sind wichtiger als lange Sessions.',
    monetizationNote:
      'Cosmetics und Saison-Pässe funktionieren hier am besten – Stärke kaufen zerstört die Glaubwürdigkeit sofort.',
  },
  young_adults_18_24: {
    notes:
      'Kompetenz und Meisterschaft stehen im Vordergrund: Skill-Ausdruck, Builds und Ranked-Ambitionen. Typische Sessions liegen abends bei 20 bis 40 Minuten.',
    monetizationNote:
      'Monetarisierung über Convenience und Style akzeptiert, Pay-to-win wird gnadenlos abgestraft.',
  },
  adults_25_plus: {
    notes:
      'Respekt vor der Zeit der Spielenden: klare Sessions von 10 bis 20 Minuten, Offline-Fortschritt und kein künstlicher FOMO-Druck. Tiefe Systeme schlagen Reaktionstests.',
    monetizationNote:
      'Faire Einmalkäufe und Abos mit echtem Mehrwert werden akzeptiert, aggressive Timer nicht.',
  },
  family: {
    notes:
      'Gemeinsames Spielen muss ohne Erklärung funktionieren – auf einem Sofa genauso wie über Geräte hinweg. Inhalte durchgehend freundlich, Konflikte ohne Gewaltspitzen.',
    monetizationNote:
      'Käufe transparent halten, ideal mit Familienfreigabe und klaren Preisstufen.',
  },
  core_gamers: {
    notes:
      'Systemtiefe, Balancing und Meta-Diskussionen sind Teil des Spiels. Diese Zielgruppe verzeiht schlichte Grafik, aber keine unfairen oder seichten Mechaniken.',
    monetizationNote:
      'Nur Kosmetik und echte Erweiterungen monetarisieren – alles andere kippt die Community.',
  },
  casual_broad: {
    notes:
      'In unter 30 Sekunden im Spiel, ohne Tutorial-Wände. Kurze Sessions mit klarem Endpunkt, aber optionalem „eine Runde noch“-Sog.',
    monetizationNote:
      'Werbung nur als freiwillige Belohnungsoption, dazu sanfte, kleine Kaufangebote.',
  },
};

/**
 * Order themes for a brief: deterministic shuffle first, then a stable sort
 * that floats hint-matching themes to the front (stable sort keeps the
 * shuffled order within equal match scores).
 */
export function orderThemesForBrief(rng: Rng, themeHints: string | undefined): ThemeDef[] {
  const shuffled = rng.shuffle(THEMES);
  const hints = themeHints?.trim().toLowerCase();
  if (!hints) return shuffled;

  const tokens = hints.split(/[^a-zäöüß]+/u).filter((t) => t.length >= 3);
  if (tokens.length === 0) return shuffled;

  const score = (theme: ThemeDef): number => {
    let s = 0;
    for (const token of tokens) {
      if (theme.name.toLowerCase().includes(token)) s += 2;
      for (const word of theme.matchWords) {
        if (word === token) s += 2;
        else if (word.includes(token) || token.includes(word)) s += 1;
      }
    }
    return s;
  };
  return [...shuffled].sort((a, b) => score(b) - score(a));
}
