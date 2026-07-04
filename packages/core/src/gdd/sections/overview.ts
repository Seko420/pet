import { AUDIENCE_LABELS, GENRE_LABELS, MONETIZATION_LABELS } from '../../types/common';
import type { GddContext } from '../context';
import { coreLoopSteps } from '../context';
import {
  ART_STYLE_LABELS_DE,
  AUDIENCE_TONE_NOTES,
  PLATFORM_LABELS_DE,
  QUALITY_TARGET_LABELS_DE,
} from '../labels';
import { blocks, bullets, mdTable, numbered } from '../markdown';

/** Section: overview (Spielübersicht). */
export function buildOverview(ctx: GddContext): string {
  const { project, idea } = ctx;
  const monetization =
    project.monetization.length > 0
      ? project.monetization.map((m) => MONETIZATION_LABELS[m]).join(', ')
      : 'Noch offen (bewusst ohne Monetarisierung starten)';

  const facts = mdTable(
    ['Merkmal', 'Wert'],
    [
      ['Genre', GENRE_LABELS[project.genre]],
      ['Plattform', PLATFORM_LABELS_DE[project.platform]],
      ['Zielgruppe', AUDIENCE_LABELS[project.audience]],
      ['Art Style', ART_STYLE_LABELS_DE[project.artStyle]],
      ['Monetarisierung', monetization],
      ['Multiplayer', project.multiplayer ? 'Ja' : 'Nein (Solo-Erlebnis)'],
      ['Qualitätsziel', QUALITY_TARGET_LABELS_DE[project.qualityTarget]],
    ],
  );

  const pitch = idea?.elevatorPitch ?? ctx.content.pitch;
  const description = project.description.trim().length > 0 ? project.description.trim() : null;

  return blocks(
    `**Pitch:** ${pitch}`,
    description ? `**Projektbeschreibung:** ${description}` : null,
    idea ? `**Alleinstellungsmerkmal (USP):** ${idea.usp}` : null,
    facts,
    '### Ziele',
    bullets([
      `**MVP-Ziel:** ${project.mvpGoal}`,
      `**Release-Ziel:** ${project.releaseGoal}`,
    ]),
  );
}

/** Section: story_setting (Story & Setting). */
export function buildStorySetting(ctx: GddContext): string {
  const { idea, rng, content, project } = ctx;
  const theme = idea?.theme ?? rng.pick(content.themes);
  const firstMilestone = content.milestones[0] ?? 'dem ersten Meilenstein';

  const beats = [
    `**Einstieg:** Die Spielenden kommen mitten in „${theme}" an – die erste Aufgabe erklärt die Welt nebenbei, ohne Textwand.`,
    `**Verankerung:** Rund um ${firstMilestone.toLowerCase()} wird sichtbar, wie die Welt auf den eigenen Fortschritt reagiert.`,
    `**Langzeit-Bogen:** ${content.metaProgression}`,
  ];

  return blocks(
    `### Setting`,
    `Das Spiel spielt in einem originellen Szenario: **${theme}**. Das Setting liefert die Bühne für den ${GENRE_LABELS[project.genre]}-Kern – jede Mechanik bekommt eine passende Erklärung in der Welt, damit sich Systeme nie abstrakt anfühlen.`,
    `### Ton & Stimmung`,
    `${AUDIENCE_TONE_NOTES[project.audience]} Der Art Style (${ART_STYLE_LABELS_DE[project.artStyle]}) unterstreicht diesen Ton in Farbwahl und Formsprache.`,
    `### Erzählstruktur`,
    bullets(beats),
    `Wichtig: Alle Figuren, Orte und Namen sind Originalschöpfungen – keine Anleihen an bestehende Marken oder fremde Spielwelten.`,
  );
}

/** Section: core_loop (Core Gameplay Loop). */
export function buildCoreLoop(ctx: GddContext): string {
  const { content, rng } = ctx;
  const steps = coreLoopSteps(ctx);
  const sessionTarget = rng.int(content.sessionMinutes[0], content.sessionMinutes[1]);

  const loopTable = mdTable(
    ['Ebene', 'Dauer', 'Inhalt'],
    [
      ['Micro-Loop', '10–60 Sekunden', `Eine Runde durch die Kernaktion: ${steps[0] ?? 'Kernaktion ausführen'} → sofortiges Feedback.`],
      ['Session-Loop', `ca. ${sessionTarget} Minuten`, 'Mehrere Micro-Loops plus mindestens eine Fortschritts-Entscheidung (Kauf, Freischaltung, Zielwahl).'],
      ['Meta-Loop', 'Tage bis Wochen', content.metaProgression],
    ],
  );

  return blocks(
    '### Der Loop in Schritten',
    numbered(steps),
    '### Loop-Ebenen',
    loopTable,
    '### Warum der Loop trägt',
    bullets([
      'Jeder Schritt erzeugt sichtbaren Fortschritt – kein Schritt ist reine Wartezeit.',
      `Die Ziel-Session von ca. ${sessionTarget} Minuten endet immer an einem natürlichen Stopp-Punkt mit Ausblick auf das nächste Ziel.`,
      'Der letzte Schritt füttert den ersten: Belohnungen des Loops sind der Treibstoff für die nächste Runde.',
    ]),
  );
}
