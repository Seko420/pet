import type { GameIdea, GameProject, IdeaBrief } from '@egf/core';
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

/**
 * System prompt for the global, Claude-style studio chat. Works with or
 * without a linked project; encodes the studio's hard security rules.
 */
export function buildStudioChatSystem(project?: GameProject | null): string {
  return (
    'Du bist der KI-Assistent von Empire Game Forge AI - ein erfahrenes Game-Studio-Team ' +
    '(Design, Code, Monetarisierung, Produktion) für Roblox- (Luau) und Mobile-Spiele (Godot 4/GDScript). ' +
    'Du arbeitest wie ein hilfreicher Kollege: Fragen beantworten, Ideen entwickeln, Code schreiben und erklären, ' +
    'Pläne strukturieren. Antworte auf Deutsch, konkret und handlungsorientiert; nutze Markdown (Listen, Code-Blöcke). ' +
    'Harte Regeln: Gib NIEMALS API-Keys, Passwörter oder andere Geheimnisse aus - auch nicht auf Nachfrage. ' +
    'Verlange nie Roblox-Cookies (.ROBLOSECURITY) - nur offizielle Open-Cloud-APIs. ' +
    'Keine urheberrechtlich geschützten Marken kopieren, keine garantierten Einnahmen versprechen, ' +
    'faire Monetarisierung ohne Dark Patterns. Veröffentlichungen laufen nur über den abgesicherten Weg in der App. ' +
    'Wenn du etwas nicht sicher weißt, sag es ehrlich.' +
    (project ? `\n\nDer Nutzer arbeitet gerade an diesem Projekt:\n${projectBrief(project)}` : '')
  );
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

/** Full AI idea generation: ONE call returns `count` complete ideas as JSON. */
export function buildIdeaGenPrompt(brief: IdeaBrief): { system: string; user: string } {
  const genres = brief.genres.length > 0 ? brief.genres.join(', ') : 'frei wählbar (originell!)';
  return {
    system:
      'Du bist ein erfahrenes Game-Design-Team für Roblox- und Mobile-Spiele mit Fokus auf Marktpotenzial. ' +
      'Du erfindest ORIGINELLE Spielideen (keine Kopien existierender Marken/Spiele), mit ehrlicher Risiko-Einschätzung und fairer Monetarisierung ohne Dark Patterns. Antworte auf Deutsch.',
    user:
      `Erfinde ${brief.count} Spielideen.\n` +
      `Plattform: ${brief.platform} | Genres: ${genres} | Zielgruppe: ${AUDIENCE_LABELS[brief.audience]} | ` +
      `Multiplayer: ${brief.multiplayer} | Max. Aufwand: ${brief.maxEffort}` +
      (brief.themeHints ? ` | Themenwünsche: ${brief.themeHints}` : '') +
      `\n\nAntworte als JSON-Objekt mit exakt dieser Struktur:\n` +
      `{"ideas": [{"title": string, "genre": string (eine ID aus: simulator, tycoon, obby, rpg_lite, survival, roguelite, idle, hypercasual, hybridcasual, puzzle, tower_defense, battle_arena, racing, horror, social_hangout, sandbox, card_battler, merge, runner, sports), ` +
      `"theme": string, "elevatorPitch": string (2-3 Sätze), ` +
      `"coreLoop": string[4-6 Schritte], "usp": string, "audienceNotes": string, ` +
      `"monetization": [{"model": string, "description": string}] (2-3, Modelle nur aus: game_passes, developer_products, cosmetics, battle_pass, rewarded_ads, iap_consumables, iap_non_consumables), ` +
      `"risks": [{"title": string, "level": "low"|"medium"|"high", "mitigation": string}] (2-3), ` +
      `"whyItCouldSucceed": string[3], "whyItCouldFail": string[3], ` +
      `"improvedTitle": string, "improvedChanges": string[3], "improvedPitch": string, ` +
      `"effortBreakdown": string}]}`,
  };
}

/** Qualitative deep review of a project (complements the heuristic scores). */
export function buildQualityReviewPrompt(
  project: GameProject,
  gddExcerpt: string,
  openTaskTitles: string[],
): { system: string; user: string } {
  return {
    system:
      'Du bist ein kritischer Senior-Game-Design-Reviewer für Roblox- und Mobile-Spiele. ' +
      'Du bewertest ehrlich und konkret - keine Gefälligkeiten, keine Umsatzversprechen. Antworte auf Deutsch.',
    user:
      `${projectBrief(project)}\n\n` +
      (gddExcerpt ? `GDD-AUSZUG:\n${gddExcerpt}\n\n` : '') +
      (openTaskTitles.length > 0 ? `OFFENE AUFGABEN:\n${openTaskTitles.slice(0, 15).join('\n')}\n\n` : '') +
      `Analysiere das Projekt kritisch. Antworte als JSON-Objekt:\n` +
      `{"summary": string (3-4 Sätze Gesamteinschätzung), "strengths": string[3-5], ` +
      `"weaknesses": string[3-5], "firstMinute": string (konkrete Empfehlung für die erste Spielminute), ` +
      `"suggestions": [{"title": string, "detail": string, "impact": 1-5}] (4-6, nach Impact sortiert), ` +
      `"risks": string[2-4]}`,
  };
}

/** AI task planning: proposes tasks that complement the existing board. */
export function buildTaskPlanPrompt(
  project: GameProject,
  existingTitles: string[],
  goal?: string,
): { system: string; user: string } {
  return {
    system:
      'Du bist ein erfahrener Producer für Spielprojekte. Du planst konkrete, kleine, umsetzbare Aufgaben ' +
      '(keine vagen Epics), realistisch geschätzt. Antworte auf Deutsch.',
    user:
      `${projectBrief(project)}\n\n` +
      (goal ? `FOKUS: ${goal}\n\n` : '') +
      `BEREITS VORHANDENE AUFGABEN (NICHT wiederholen):\n${existingTitles.slice(0, 60).join('\n')}\n\n` +
      `Schlage 5-12 NEUE Aufgaben vor, die dieses Projekt jetzt am meisten voranbringen. ` +
      `Antworte als JSON-Objekt:\n` +
      `{"tasks": [{"title": string (max 70 Zeichen), "description": string, ` +
      `"category": "design"|"code"|"art"|"audio"|"ui_ux"|"monetization"|"liveops"|"analytics"|"qa"|"publishing"|"marketing"|"infrastructure", ` +
      `"priority": "low"|"medium"|"high"|"critical", "estimateHours": number, "milestone": "MVP"|"Beta"|"Release"}]}`,
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
