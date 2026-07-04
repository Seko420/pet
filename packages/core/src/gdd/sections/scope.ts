import { MONETIZATION_LABELS } from '../../types/common';
import type { GddContext } from '../context';
import { primaryCurrencyName, secondaryCurrencyName } from '../context';
import { RISK_LEVEL_LABELS_DE } from '../labels';
import { blocks, bullets, mdTable } from '../markdown';

/** Section: mvp_scope (MVP-Scope). */
export function buildMvpScope(ctx: GddContext): string {
  const { project, idea, content, rng } = ctx;
  const soft = primaryCurrencyName(ctx);
  const itemCount = rng.int(4, 6);
  const ftueTarget = rng.int(65, 80);
  const firstModel = project.monetization[0] ?? null;
  const firstMilestones = content.milestones.slice(0, 2);

  const inScope = [
    `Vollständiger Kern-Loop (alle Schritte aus der Core-Loop-Sektion, spielbar ohne Platzhalter)`,
    `Erste Progressions-Etappe: ${firstMilestones.length > 0 ? firstMilestones.join(' und ') : 'die ersten beiden Meilensteine'}`,
    `Genau eine Währung (${soft}) mit funktionierendem Earn/Spend-Kreislauf`,
    `${itemCount} Items aus der Beispielliste, handverlesen für den Loop`,
    'FTUE: erste Minute bis zur ersten Belohnung, wie in UI/UX beschrieben',
    'Speichern/Laden ohne Datenverlust (inkl. App-/Server-Neustart)',
    'Minimal-Analytics: session_start/end, ftue_step_completed, core_loop_completed',
    firstModel
      ? `Monetarisierung nur als schmaler Testkanal: ${MONETIZATION_LABELS[firstModel]} (fair, wie in der Monetarisierungs-Sektion definiert)`
      : 'Keine Monetarisierung im MVP – reine Spielspaß-Validierung',
  ];

  const outOfScope = [
    secondaryCurrencyName(ctx) ? `Zweite Währung (${secondaryCurrencyName(ctx)}) und alle zugehörigen Sinks` : 'Weitere Währungen',
    'Events, Saisons und der LiveOps-Kalender',
    project.multiplayer ? 'Erweiterte Multiplayer-Features (Zuschauen, Ranglisten-Saisons) – nur der Kern-Mehrspielermodus ist drin' : 'Jegliche Multiplayer-/Social-Features über lokale Bestenlisten hinaus',
    'Vollständiger Item-/Gegner-/Quest-Katalog (kommt mit dem Full Release)',
    project.monetization.length > 1 ? 'Alle weiteren Monetarisierungs-Modelle' : 'Ausbau der Monetarisierung',
    'Lokalisierung über Deutsch hinaus',
    'Handel zwischen Spielenden (falls je geplant, erst nach Missbrauchs-Analyse)',
  ];

  const dod = [
    `15 Minuten Dauerspielbetrieb ohne Absturz und ohne Blocker-Bugs`,
    `FTUE-Abschlussquote über ${ftueTarget} % im Playtest (mind. 10 Testpersonen der Zielgruppe)`,
    'Alle Balancing-Startwerte aus der zentralen Konfiguration geladen (keine Magic Numbers)',
    ctx.isMobile ? 'Performance-Budget auf dem Referenzgerät eingehalten' : 'Stabile Performance auf Zielhardware (keine Frame-Einbrüche im Kern-Loop)',
    'Speicherstand übersteht Neustart und Versions-Update (schemaVersion getestet)',
    'Checkliste „Faire Monetarisierung" vollständig bestanden (auch wenn das MVP nichts verkauft)',
  ];

  const riskTable =
    idea && idea.risks.length > 0
      ? mdTable(
          ['Risiko', 'Stufe', 'Gegenmaßnahme'],
          idea.risks.map((r) => [r.title, RISK_LEVEL_LABELS_DE[r.level], r.mitigation]),
        )
      : null;

  return blocks(
    `**MVP-Ziel:** ${project.mvpGoal}`,
    '### Drin (verbindlich)',
    bullets(inScope),
    '### Draußen (bewusst geschnitten)',
    bullets(outOfScope),
    '### Definition of Done',
    bullets(dod),
    riskTable ? '### Risiken & Gegenmaßnahmen (aus der Idee übernommen)' : null,
    riskTable,
  );
}

/** Section: full_release_scope (Full-Release-Scope). */
export function buildFullReleaseScope(ctx: GddContext): string {
  const { project, idea, content } = ctx;
  const remainingMilestones = content.milestones.slice(2);

  const expansions = [
    `Progression komplett: ${remainingMilestones.length > 0 ? remainingMilestones.join('; ') : 'alle restlichen Meilensteine'} plus Meta-Ebene (${content.progressionModel})`,
    'Vollständige Economy mit allen Währungen aus der Economy-Sektion inklusive Sink/Source-Monitoring',
    'Kompletter Content-Katalog: alle Items, Gegner/Herausforderungen und Quest-Strukturen aus den jeweiligen Sektionen',
    project.monetization.length > 0
      ? `Monetarisierung vollständig: ${project.monetization.map((m) => MONETIZATION_LABELS[m]).join(', ')} – jeweils nach den Fairness-Regeln`
      : 'Entscheidung über Monetarisierung auf Basis der MVP-Daten',
    project.multiplayer ? 'Multiplayer-Ausbau: Komfort-Features, Zuschauen, saisonale Wertungen' : 'Asynchrone Social-Schicht (Bestenlisten, teilbare Momente)',
    'Lokalisierung: Deutsch und Englisch zum Release, weitere Sprachen datenbasiert',
    'Barrierefreiheit-Feinschliff: alle Punkte aus UI/UX verifiziert mit echten Testpersonen',
  ];

  const liveOpsStart = [
    'Woche 1: Launch-Begleitung – tägliches KPI-Review, Hotfix-Bereitschaft, erstes Community-Feedback einarbeiten',
    `Woche 2: erstes leichtes Event aus dem Katalog (${content.eventIdeas[0]?.name ?? 'Startevent'}) als LiveOps-Generalprobe`,
    'Woche 3: erster Content-Drop (neue Items/Quests aus der Pipeline) plus Balancing-Pass auf Basis der Daten',
    'Woche 4: Rückblick und Roadmap-Update – was die Daten sagen, entscheidet über die nächste Saison',
  ];

  const improvedBlock =
    idea && idea.improvedVersion.changes.length > 0
      ? blocks(
          `### Impulse aus der geschärften Idee („${idea.improvedVersion.title}")`,
          bullets(idea.improvedVersion.changes),
          `> ${idea.improvedVersion.pitch}`,
        )
      : null;

  return blocks(
    `**Release-Ziel:** ${project.releaseGoal}`,
    '### Erweiterungen gegenüber dem MVP',
    bullets(expansions),
    '### LiveOps-Start (erste vier Wochen)',
    bullets(liveOpsStart),
    improvedBlock,
    '### Erfolgs-Kriterium',
    'Der Full Release gilt als gelungen, wenn die MVP-Kern-KPIs (Retention, FTUE, Session-Länge) stabil bleiben oder steigen, während der Content-Umfang wächst – Wachstum darf den Kern nie verwässern.',
  );
}
