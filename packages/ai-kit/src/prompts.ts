import type { GameIdea, GameProject } from '@egf/core';
import { AUDIENCE_LABELS, GENRE_LABELS, MONETIZATION_LABELS } from '@egf/core';

/**
 * Prompt builders. All user-facing generation happens in German; prompts
 * embed real project context so the model acts like a senior game team,
 * not a generic assistant.
 */

function projectBrief(project: GameProject): string {
  return [
    `Projekt: ${project.name}`,
    `Plattform: ${project.platform} | Genre: ${GENRE_LABELS[project.genre]} | Zielgruppe: ${AUDIENCE_LABELS[project.audience]}`,
    `Monetarisierung: ${project.monetization.map((m) => MONETIZATION_LABELS[m]).join(', ') || 'offen'}`,
    `Multiplayer: ${project.multiplayer ? 'ja' : 'nein'} | Qualitätsziel: ${project.qualityTarget}`,
    `MVP-Ziel: ${project.mvpGoal}`,
    `Beschreibung: ${project.description || '-'}`,
  ].join('\n');
}

export function buildIdeaRefinePrompt(idea: GameIdea): { system: string; user: string } {
  return {
    system:
      'Du bist ein erfahrenes Game-Design-Team (Design + Monetarisierung + Produktion) für Roblox- und Mobile-Spiele. ' +
      'Du verfeinerst Spielideen: schärfer, konkreter, ehrlicher. Keine Umsatzversprechen, keine kopierten Marken. ' +
      'Faire Monetarisierung ohne Dark Patterns ist Pflicht. Antworte auf Deutsch.',
    user:
      `Verfeinere die Textfelder dieser Spielidee. Behalte die Grundrichtung, mache Pitch, USP und Risiken konkreter und origineller.\n\n` +
      `Idee (JSON):\n${JSON.stringify(
        {
          title: idea.title,
          elevatorPitch: idea.elevatorPitch,
          usp: idea.usp,
          coreLoop: idea.coreLoop,
          theme: idea.theme,
          audienceNotes: idea.audienceNotes,
          whyItCouldSucceed: idea.whyItCouldSucceed,
          whyItCouldFail: idea.whyItCouldFail,
        },
        null,
        2,
      )}\n\n` +
      `Antworte als JSON-Objekt mit GENAU diesen optionalen Feldern (nur Felder, die du verbesserst): ` +
      `{"title": string, "elevatorPitch": string, "usp": string, "audienceNotes": string, "whyItCouldSucceed": string[], "whyItCouldFail": string[]}`,
  };
}

export function buildGddSectionPrompt(
  project: GameProject,
  sectionTitle: string,
  draft: string,
): { system: string; user: string } {
  return {
    system:
      'Du bist Lead Game Designer und schreibst Game-Design-Dokumente in professionellem deutschen Markdown. ' +
      'Konkret statt generisch: Zahlen, Tabellen, Beispiele. Faire Monetarisierung, keine fremde IP.',
    user:
      `${projectBrief(project)}\n\n` +
      `Überarbeite die GDD-Sektion „${sectionTitle}". Behalte die Struktur, verbessere Substanz und Konkretheit.\n\n` +
      `Aktueller Entwurf:\n---\n${draft}\n---\n\n` +
      `Antworte NUR mit dem verbesserten Markdown der Sektion (ohne die Sektionsüberschrift).`,
  };
}

export function buildAgentChatSystem(project: GameProject): string {
  return (
    'Du bist der Studio-Assistent von Empire Game Forge AI - ein erfahrener Game-Engineer und Designer. ' +
    'Du hilfst beim Projekt unten: Architektur erklären, Luau/GDScript-Fragen beantworten, Design- und Balancing-Entscheidungen durchdenken, Bugs eingrenzen. ' +
    'Regeln: Antworte auf Deutsch, präzise und handlungsorientiert. Keine Umsatzversprechen. Keine fremde IP. ' +
    'Roblox: Server-autoritative Logik, Remotes validieren, nur offizielle APIs. Mobile: Godot 4 / GDScript, Touch-first, Performance-Budgets respektieren. ' +
    'Wenn du etwas nicht sicher weißt, sag es ehrlich.\n\n' +
    projectBrief(project)
  );
}

export function buildAgentPlanPrompt(
  goal: string,
  fileTree: string,
  fileExcerpts: { path: string; content: string }[],
): { system: string; user: string } {
  const excerpts = fileExcerpts
    .map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
    .join('\n\n');
  return {
    system:
      'Du bist ein sorgfältiger Code-Agent für Spielprojekte (Luau für Roblox-Pfade, GDScript für Godot-Pfade, sonst passend zur Dateiendung). ' +
      'Du änderst NIE blind: Du lieferst einen Plan mit vollständigen neuen Dateiinhalten, der erst nach menschlicher Freigabe angewendet wird. ' +
      'Harte Regeln: Nur Dateien innerhalb des Projekt-Workspace. Keine Secrets/API-Keys erzeugen oder einfügen. ' +
      'Roblox: Server-Autorität wahren, Remotes validieren, keine loadstring-Nutzung. Erkläre Risiken offen in warnings.',
    user:
      `ZIEL:\n${goal}\n\n` +
      `DATEIBAUM DES PROJEKTS:\n${fileTree}\n\n` +
      (excerpts ? `RELEVANTE DATEIEN:\n${excerpts}\n\n` : '') +
      `Antworte als einzelnes JSON-Objekt mit exakt dieser Struktur:\n` +
      `{"understanding": string, "steps": string[], ` +
      `"affectedFiles": [{"path": string, "kind": "create"|"modify"|"delete", "reason": string}], ` +
      `"checksSuggested": string[], "warnings": string[], ` +
      `"changes": [{"path": string, "kind": "create"|"modify"|"delete", "summary": string, "newContent": string|null}]}\n` +
      `Für kind "create"/"modify" MUSS newContent den vollständigen neuen Dateiinhalt enthalten; für "delete" ist newContent null.`,
  };
}

export function buildCommitMessagePrompt(
  diffStat: string,
  changedFiles: string[],
): { system: string; user: string } {
  return {
    system:
      'Du schreibst prägnante Conventional-Commit-Nachrichten (feat/fix/refactor/chore/docs). Titelzeile max. 72 Zeichen, englisch; Body optional, stichpunktartig.',
    user:
      `Geänderte Dateien:\n${changedFiles.join('\n')}\n\nDiff-Statistik:\n${diffStat}\n\n` +
      `Antworte als JSON: {"message": string, "body": string}`,
  };
}
