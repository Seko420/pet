import type { GddContext } from '../context';
import { coreLoopSteps, primaryCurrencyName } from '../context';
import { ART_STYLE_UI_NOTES, AUDIENCE_TONE_NOTES } from '../labels';
import { blocks, bullets, numbered } from '../markdown';

/** Section: multiplayer (Multiplayer-Konzept). */
export function buildMultiplayer(ctx: GddContext): string {
  const { project, content, isRoblox } = ctx;

  if (!project.multiplayer) {
    return blocks(
      'Dieses Projekt ist bewusst als **Solo-Erlebnis** angelegt: Der Fokus liegt auf dem Kern-Loop, nicht auf Netzwerk-Komplexität. Das reduziert Produktionsrisiko und Umfang deutlich.',
      '### Leichte soziale Schicht (asynchron)',
      bullets([
        'Optionale Bestenlisten für Freundes-Vergleiche – keine Pflicht, kein Matchmaking.',
        'Teilbare Momente (Screenshots/Replays) als virale Oberfläche ohne Server-Aufwand.',
        'Die Architektur hält eine spätere Koop-Erweiterung offen (klare Trennung von Simulation und Darstellung).',
      ]),
    );
  }

  const safetyNotes =
    project.audience === 'kids_8_12' || project.audience === 'family'
      ? bullets([
          'Sicherheits-Standard für junge Zielgruppen: kuratierte Schnellantworten statt Freitext-Chat, wo möglich.',
          'Melden, Blockieren und Stummschalten sind maximal zwei Taps entfernt.',
          'Kein Feature belohnt es, Fremde zu bedrängen (kein Betteln, kein erzwungenes Traden).',
        ])
      : bullets([
          'Melden, Blockieren und Stummschalten sind von Anfang an eingebaut, nicht nachgerüstet.',
          'Toxizität wird strukturell entschärft: keine Mechaniken, die Verlierer öffentlich vorführen.',
        ]);

  return blocks(
    '### Konzept',
    content.multiplayerAngle,
    '### Technische Leitplanken',
    bullets([
      isRoblox
        ? 'Serverautoritative Spiellogik: Der Client sendet Absichten, der Server entscheidet (siehe Roblox-Umsetzung).'
        : 'Serverautoritative bzw. deterministische Simulation, damit Schummeln unattraktiv bleibt.',
      'Verbindungsabbrüche degradieren sanft (Rejoin, Bots/Geister als Fallback) statt Fortschritt zu vernichten.',
      'Session-Größen klein halten und erst nach Playtests hochskalieren.',
    ]),
    '### Sicherheit & Fairness',
    safetyNotes,
  );
}

/** Section: ui_ux (UI / UX). */
export function buildUiUx(ctx: GddContext): string {
  const { project, content, rng, isMobile } = ctx;
  const steps = coreLoopSteps(ctx);
  const firstRewardSeconds = rng.int(45, 90);
  const currency = primaryCurrencyName(ctx);

  const hud = [
    `${currency}-Stand mit animiertem Zuwachs (Belohnung sichtbar machen)`,
    'Aktuelles Ziel bzw. aktive Quest als Einzeiler – immer genau eines im Fokus',
    'Kontextaktion(en) für den aktuellen Loop-Schritt',
    'Fortschrittsanzeige zum nächsten Meilenstein',
  ];

  return blocks(
    '### Gestaltungsrichtung',
    ART_STYLE_UI_NOTES[project.artStyle],
    '### Erste Minute (FTUE)',
    numbered([
      `Sekunde 0–10: Direkt in die Kernaktion („${steps[0] ?? 'erste Aktion'}") – kein Menü, kein Logo-Kino.`,
      `Bis Sekunde ${firstRewardSeconds}: erste echte Belohnung inklusive ${currency}-Gutschrift und hörbarem Feedback.`,
      'Danach: erste freie Entscheidung (Kauf, Wahl oder Zielauswahl) – Selbstwirksamkeit vor Tutorial-Text.',
      'Tutorial-Hinweise erscheinen kontextuell und genau einmal; alles ist später im Hilfe-Menü nachlesbar.',
    ]),
    '### HUD (Kernansicht)',
    bullets(hud),
    '### Zugänglichkeit & Komfort',
    bullets([
      `Tonalität: ${AUDIENCE_TONE_NOTES[project.audience]}`,
      'Farbenblind-sichere Signalfarben; Information nie nur über Farbe kodieren.',
      'Skalierbare Schriftgrößen; Mindest-Touchziele 44×44 pt auf Mobilgeräten.',
      isMobile
        ? `Touch-Layout: ${content.touchControls}`
        : 'Eingabe-Feedback unter 100 ms; jede Aktion hat eine sichtbare und eine hörbare Antwort.',
      'Session-Ende ohne Straf-Gefühl: Fortschritt wird laufend gespeichert, Beenden ist jederzeit okay.',
    ]),
  );
}
