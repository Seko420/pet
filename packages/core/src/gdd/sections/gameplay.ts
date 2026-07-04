import type { GddContext } from '../context';
import { blocks, bullets, mdTable } from '../markdown';

/** Section: progression. */
export function buildProgression(ctx: GddContext): string {
  const { content, project } = ctx;

  const qualityNote =
    project.qualityTarget === 'prototype'
      ? 'Für das Prototyp-Ziel wird nur der erste Abschnitt der Kurve gebaut – genug, um das Fortschrittsgefühl in Playtests zu validieren.'
      : project.qualityTarget === 'polished'
        ? 'Für das Ziel „Poliert" wird die volle Kurve umgesetzt, inklusive sauberer Übergänge zwischen den Meilensteinen.'
        : 'Für das Premium-Ziel kommt zusätzlich eine Saison-/Prestige-Schicht auf die Kurve, damit auch Vielspieler über Monate Ziele haben.';

  return blocks(
    `### Progressionsmodell: ${content.progressionModel}`,
    content.progressionCurve,
    '### Meilensteine (Spielerreise)',
    bullets(content.milestones),
    '### Meta-Progression',
    content.metaProgression,
    `> ${qualityNote}`,
  );
}

/** Section: level_design (Leveldesign). */
export function buildLevelDesign(ctx: GddContext): string {
  const { content, isRoblox, isMobile } = ctx;

  const platformNotes: string[] = [];
  if (isRoblox) {
    platformNotes.push(
      'Roblox: Welt in streamingfreundliche Abschnitte gliedern (StreamingEnabled); Spawn-Bereiche übersichtlich und geschützt halten.',
    );
  }
  if (isMobile) {
    platformNotes.push(
      'Mobile: Alle Interaktionspunkte groß genug für Touch; Sichtweiten und Objektdichte am Performance-Budget ausrichten.',
    );
  }

  return blocks(
    '### Gestaltungsprinzipien',
    bullets(content.levelDesignNotes),
    platformNotes.length > 0 ? '### Plattform-Hinweise' : null,
    platformNotes.length > 0 ? bullets(platformNotes) : null,
    '### Lesbarkeit',
    'Gefahren, Belohnungen und Wege müssen sich in Silhouette und Farbe unterscheiden. Faustregel: Ein Screenshot aus 5 Metern Distanz muss ohne UI erklären, was hier zu tun ist.',
  );
}

/** Section: balancing. */
export function buildBalancing(ctx: GddContext): string {
  const { content } = ctx;

  const table = mdTable(
    ['Parameter', 'Startwert', 'Hinweis'],
    content.balancing.map((b) => [b.parameter, b.start, b.note]),
  );

  return blocks(
    '### Balancing-Startwerte',
    table,
    '### Vorgehen',
    bullets([
      'Alle Werte oben sind **Startwerte für Playtests**, keine finalen Zahlen – nach jedem Playtest-Zyklus werden sie gegen die Zielmetriken geprüft und angepasst.',
      'Werte leben in einer zentralen, datengetriebenen Konfiguration (keine Magic Numbers im Code), damit Tuning ohne Code-Änderung möglich ist.',
      'Pro Playtest nur wenige Werte gleichzeitig ändern, sonst ist die Wirkung nicht zuordenbar.',
      'Ein Änderungs-Log für Balancing-Werte führen: Datum, alter Wert, neuer Wert, Grund.',
    ]),
  );
}
