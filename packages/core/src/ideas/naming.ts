import type { Genre } from '../types/common';
import type { Rng } from '../util/random';

/**
 * Title combinatorics: theme nouns are combined with genre-specific
 * suffixes and subtitles. All parts are original German building blocks.
 */
interface GenreNaming {
  suffixes: readonly string[];
  subtitles: readonly string[];
}

export const GENRE_NAMING: Record<Genre, GenreNaming> = {
  simulator: {
    suffixes: ['Simulator', 'Sim', 'Alltag'],
    subtitles: ['Erste Schicht', 'Volle Hände', 'Der große Auftrag', 'Saisonstart'],
  },
  tycoon: {
    suffixes: ['Tycoon', 'Imperium', 'Fabrik'],
    subtitles: ['Vom Stand zum Imperium', 'Expansion', 'Goldene Zeiten', 'Neueröffnung'],
  },
  obby: {
    suffixes: ['Obby', 'Parkour', 'Sprint'],
    subtitles: ['Turm der Prüfungen', 'Checkpoint-Jagd', 'Über den Wolken', 'Letzte Etappe'],
  },
  rpg_lite: {
    suffixes: ['Quest', 'Saga', 'Chroniken'],
    subtitles: ['Das erste Kapitel', 'Ruf der Relikte', 'Gefährten gesucht', 'Neue Helden'],
  },
  survival: {
    suffixes: ['Survival', 'Zuflucht', 'Nachtwache'],
    subtitles: ['Die erste Nacht', 'Steigende Flut', 'Gegen den Sturm', 'Letzte Bastion'],
  },
  roguelite: {
    suffixes: ['Dash', 'Spirale', 'Tiefen'],
    subtitles: ['Noch ein Versuch', 'Der nächste Lauf', 'Räume des Zufalls', 'Glück und Können'],
  },
  idle: {
    suffixes: ['Idle', 'Werke', 'Kolonie'],
    subtitles: ['Wächst von allein', 'Über Nacht reich', 'Das stille Imperium', 'Prestige-Zeit'],
  },
  hypercasual: {
    suffixes: ['Rush', 'Tap', 'Drop'],
    subtitles: ['Ein Fingertipp', 'Nur noch ein Versuch', 'Perfektes Timing', 'Höher hinaus'],
  },
  hybridcasual: {
    suffixes: ['Squad', 'Rush', 'Basis'],
    subtitles: ['Lauf und Baue', 'Sammeln und Siegen', 'Vom Lauf zur Basis', 'Doppelte Schleife'],
  },
  puzzle: {
    suffixes: ['Puzzle', 'Rätsel', 'Logik'],
    subtitles: ['Licht an', 'Um die Ecke gedacht', 'Stück für Stück', 'Der stille Knoten'],
  },
  tower_defense: {
    suffixes: ['Defense', 'Wacht', 'Bollwerk'],
    subtitles: ['Die Wellen kommen', 'Letzte Linie', 'Pfad der Gegner', 'Halte stand'],
  },
  battle_arena: {
    suffixes: ['Arena', 'Clash', 'Rumble'],
    subtitles: ['Runde eins', 'Kampf um den Kern', 'Sieger der Saison', 'Drei gegen Drei'],
  },
  racing: {
    suffixes: ['Racing', 'Rallye', 'Cup'],
    subtitles: ['Startampel', 'Windschatten', 'Letzte Kurve', 'Bergab'],
  },
  horror: {
    suffixes: ['Grusel', 'Schatten', 'Nachtschicht'],
    subtitles: ['Licht aus', 'Wer sucht, findet', 'Die letzte Laterne', 'Flüstern im Dunkeln'],
  },
  social_hangout: {
    suffixes: ['Treff', 'Lounge', 'Plaza'],
    subtitles: ['Komm vorbei', 'Goldene Stunde', 'Zwischen Freunden', 'Saisoneröffnung'],
  },
  sandbox: {
    suffixes: ['Sandbox', 'Bauwelt', 'Werkbank'],
    subtitles: ['Bau es dir', 'Grenzenlos', 'Aus eigenen Händen', 'Formen und Teilen'],
  },
  card_battler: {
    suffixes: ['Karten', 'Duell', 'Deck'],
    subtitles: ['Das erste Deck', 'Fusion', 'Zug um Zug', 'Asse im Ärmel'],
  },
  merge: {
    suffixes: ['Merge', 'Fusion', 'Werkstatt'],
    subtitles: ['Zwei werden eins', 'Stufe für Stufe', 'Ordnung im Chaos', 'Volle Reihen'],
  },
  runner: {
    suffixes: ['Runner', 'Sprint', 'Dash'],
    subtitles: ['Lauf los', 'Ohne anzuhalten', 'Die perfekte Linie', 'Immer schneller'],
  },
  sports: {
    suffixes: ['Liga', 'Cup', 'Arena'],
    subtitles: ['Anpfiff', 'Saisonfinale', 'Um jeden Punkt', 'Aufstiegsspiel'],
  },
};

function toRoman(n: number): string {
  const table: readonly [number, string][] = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let rest = Math.max(1, Math.floor(n));
  let out = '';
  for (const [value, symbol] of table) {
    while (rest >= value) {
      out += symbol;
      rest -= value;
    }
  }
  return out;
}

/**
 * Build a unique title from theme nouns and genre parts.
 * Mutates `used` so repeated calls within one generation never collide.
 */
export function buildTitle(
  rng: Rng,
  themeNouns: readonly string[],
  genre: Genre,
  used: Set<string>,
): string {
  const naming = GENRE_NAMING[genre];
  for (let attempt = 0; attempt < 16; attempt++) {
    const noun = rng.pick(themeNouns);
    const pattern = rng.int(0, 3);
    const candidate =
      pattern === 0 || pattern === 1
        ? `${noun}-${rng.pick(naming.suffixes)}`
        : pattern === 2
          ? `${noun}: ${rng.pick(naming.subtitles)}`
          : `Projekt ${noun}`;
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }
  // Deterministic fallback: roman-numbered edition of the first combination.
  const base = `${themeNouns[0] ?? 'Neues Spiel'}-${naming.suffixes[0] ?? 'Edition'}`;
  for (let i = 2; ; i++) {
    const candidate = `${base} ${toRoman(i)}`;
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }
}

/** Sharper variant title for the improved version; always differs from the base title. */
export function buildImprovedTitle(
  rng: Rng,
  baseTitle: string,
  themeNouns: readonly string[],
  genre: Genre,
): string {
  const naming = GENRE_NAMING[genre];
  for (let attempt = 0; attempt < 12; attempt++) {
    const candidate = `${rng.pick(themeNouns)}: ${rng.pick(naming.subtitles)}`;
    if (candidate !== baseTitle) return candidate;
  }
  return `${baseTitle} – Neuschnitt`;
}
