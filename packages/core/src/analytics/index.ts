import type {
  AbTestIdea,
  AnalyticsEventSpec,
  AnalyticsPlan,
  LiveOpsCalendarEntry,
} from '../types/analytics';
import type { GameProject } from '../types/project';
import { createRng, seedFromString } from '../util/random';

/**
 * Analytics & LiveOps planning. Deterministic per project id.
 * Every event answers a concrete design question (rationale) - the plan is
 * intentionally small enough to actually get implemented.
 */

export function generateAnalyticsPlan(project: GameProject): AnalyticsPlan {
  const rng = createRng(seedFromString(project.id + ':analytics'));
  const wantsRoblox = project.platform === 'roblox' || project.platform === 'both';
  const wantsMobile = project.platform === 'mobile' || project.platform === 'both';
  const platforms = [project.platform];

  const events: AnalyticsEventSpec[] = [
    {
      name: 'tutorial_started', category: 'onboarding', platforms,
      description: 'Spieler betritt den ersten Tutorial-Schritt.',
      parameters: { entry_point: 'Woher kam der Spieler (fresh, returning)' },
      rationale: 'Basis des Onboarding-Funnels - ohne Start keine Abschlussquote.',
    },
    {
      name: 'tutorial_completed', category: 'onboarding', platforms,
      description: 'Letzter Tutorial-Schritt abgeschlossen.',
      parameters: { duration_s: 'Sekunden seit tutorial_started', skipped_steps: 'Anzahl übersprungener Schritte' },
      rationale: 'Abschlussquote < 80% => Tutorial kürzen oder belohnender machen.',
    },
    {
      name: 'first_win', category: 'onboarding', platforms,
      description: 'Erster Kern-Erfolg (Sieg, erster Kauf im Loop, erstes Level).',
      parameters: { seconds_since_start: 'Zeit bis zum Erfolgserlebnis' },
      rationale: 'Muss unter 60-120s liegen - direktester Hebel für D1-Retention.',
    },
    {
      name: 'first_death', category: 'progression', platforms,
      description: 'Erster Fehlschlag/Tod des Spielers.',
      parameters: { location: 'Level/Zone', seconds_since_start: 'Zeitpunkt' },
      rationale: 'Zu früher Fehlschlag frustriert; zu später langweilt - Schwierigkeitskurve kalibrieren.',
    },
    {
      name: 'level_completed', category: 'progression', platforms,
      description: 'Level/Abschnitt abgeschlossen.',
      parameters: { level_id: 'Kennung', duration_s: 'Dauer', attempts: 'Versuche', stars: 'Wertung falls vorhanden' },
      rationale: 'Attempts-Spitzen zeigen Balancing-Wände; Drop nach Level X zeigt Content-Löcher.',
    },
    {
      name: 'quest_completed', category: 'engagement', platforms,
      description: 'Quest/Tagesziel abgeschlossen.',
      parameters: { quest_id: 'Kennung', quest_type: 'daily/weekly/story' },
      rationale: 'Misst, ob das Zielsystem trägt - Quests sind der LiveOps-Motor.',
    },
    {
      name: 'shop_opened', category: 'monetization', platforms,
      description: 'Shop-UI geöffnet.',
      parameters: { source: 'Button/Angebot/Quest-Belohnung' },
      rationale: 'Shop-Öffnungsrate trennt Sichtbarkeitsproblem von Angebotsproblem.',
    },
    {
      name: 'item_purchased', category: 'monetization', platforms,
      description: 'Kauf mit Ingame-Währung.',
      parameters: { item_id: 'Kennung', currency: 'Währung', price: 'Preis', balance_after: 'Kontostand danach' },
      rationale: 'Sink-Analyse: Was wird gekauft, was ignoriert? Grundlage jeder Economy-Anpassung.',
    },
    {
      name: 'session_end', category: 'engagement', platforms,
      description: 'Session endet (App-Close/Leave).',
      parameters: { duration_s: 'Sessionlänge', screens_visited: 'Anzahl besuchter Bereiche' },
      rationale: 'Sessionlänge x Sessions/Tag ist die ehrlichste Engagement-Metrik.',
    },
    {
      name: 'daily_return', category: 'engagement', platforms,
      description: 'Spieler kehrt an einem neuen Kalendertag zurück.',
      parameters: { days_since_install: 'Alter des Accounts', consecutive_days: 'Tage in Folge' },
      rationale: 'D1/D7/D30-Retention - die Kennzahl, an der alles hängt.',
    },
    {
      name: 'funnel_drop', category: 'churn_signal', platforms,
      description: 'Spieler bricht einen definierten Flow ab (Tutorial-Schritt, Kauf-Dialog, Levelstart).',
      parameters: { funnel: 'Name des Flows', step: 'Schritt-Kennung' },
      rationale: 'Zeigt die konkrete Stelle, an der Spieler verloren gehen - direkt behebbar.',
    },
  ];

  if (wantsMobile) {
    events.push(
      {
        name: 'ad_watched', category: 'monetization', platforms,
        description: 'Rewarded Ad vollständig angesehen.',
        parameters: { placement: 'Stelle im Spiel', reward_id: 'Ausgeschüttete Belohnung' },
        rationale: 'Placement-Vergleich: Wo sind Ads Bonus, wo nerven sie? (Nur Mobile)',
      },
      {
        name: 'iap_purchase', category: 'monetization', platforms,
        description: 'Echtgeld-Kauf abgeschlossen.',
        parameters: { product_id: 'Store-Produkt', price_tier: 'Preisstufe', first_purchase: 'Erstkauf ja/nein' },
        rationale: 'Erstkauf-Konversion ist der wichtigste Monetarisierungs-Hebel. (Nur Mobile)',
      },
    );
  }
  if (wantsRoblox) {
    events.push(
      {
        name: 'dev_product_purchase', category: 'monetization', platforms,
        description: 'Developer Product gekauft (Robux).',
        parameters: { product_id: 'Roblox-Produkt-ID', robux: 'Preis in Robux' },
        rationale: 'Verbrauchskäufe zeigen, welche Beschleuniger wirklich Wert haben. (Nur Roblox)',
      },
      {
        name: 'game_pass_purchase', category: 'monetization', platforms,
        description: 'Game Pass gekauft.',
        parameters: { pass_id: 'Game-Pass-ID' },
        rationale: 'Dauerkäufe messen wahrgenommenen Langzeitwert der Experience. (Nur Roblox)',
      },
    );
  }

  // Genre-specific extras
  const genreEvents: Record<string, AnalyticsEventSpec[]> = {
    tycoon: [{ name: 'rebirth_triggered', category: 'progression', platforms, description: 'Prestige/Rebirth ausgelöst.', parameters: { rebirth_count: 'Wievielter Rebirth', minutes_since_last: 'Abstand' }, rationale: 'Rebirth-Takt zeigt, ob die Meta-Schleife trägt.' }],
    idle: [{ name: 'offline_earnings_collected', category: 'engagement', platforms, description: 'Offline-Einnahmen abgeholt.', parameters: { hours_away: 'Abwesenheit', amount: 'Betrag' }, rationale: 'Comeback-Belohnung ist der Kern-Retention-Hebel bei Idle.' }],
    roguelite: [{ name: 'run_ended', category: 'progression', platforms, description: 'Run beendet.', parameters: { result: 'win/loss/abandon', duration_s: 'Dauer', build_tags: 'Gewählte Upgrades' }, rationale: 'Abandon-Quote und Build-Verteilung steuern Balancing.' }],
    battle_arena: [{ name: 'match_ended', category: 'progression', platforms, description: 'Match beendet.', parameters: { result: 'win/loss', duration_s: 'Dauer', afk_detected: 'AFK-Verdacht' }, rationale: 'Matchdauer + AFK-Quote zeigen Frust und Snowball-Probleme.' }],
    horror: [{ name: 'scare_event', category: 'engagement', platforms, description: 'Schreckmoment ausgelöst.', parameters: { scare_id: 'Kennung', players_present: 'Anzahl Spieler' }, rationale: 'Welche Momente werden geteilt/wiederholt? Viralitäts-Treiber.' }],
  };
  events.push(...(genreEvents[project.genre] ?? []));

  // ------------------------------------------------------- liveops calendar
  const liveOpsCalendar: LiveOpsCalendarEntry[] = [
    { week: 0, kind: 'event', title: 'Launch-Event', description: 'Begrüßungs-Belohnung für alle Spieler der ersten Woche + Login-Leiste.' },
    { week: 1, kind: 'ab_test', title: 'A/B: Erste Minute', description: 'Variante A: aktueller Start. Variante B: verkürzter Einstieg. Metrik: D1-Retention.' },
    { week: 2, kind: 'content_drop', title: 'Content-Drop 1', description: rng.pick(['Neue Zone/Level-Paket', 'Neues Sammelset', 'Neuer Gegnertyp + Quest-Kette']) },
    { week: 3, kind: 'sale', title: 'Cosmetic-Aktion', description: 'Rotierendes Cosmetic-Angebot - fair kommuniziert, mit Nachhol-Fenster.' },
    { week: 4, kind: 'season_start', title: 'Season 1 startet', description: 'Season-Ziele, exklusive (aber später wiederkehrende) Cosmetics, Season-Quests.' },
    { week: 5, kind: 'event', title: 'Community-Wochenende', description: 'Gemeinschaftsziel: alle Spieler zahlen auf einen Fortschrittsbalken ein.' },
    { week: 6, kind: 'content_drop', title: 'Content-Drop 2', description: 'Erweiterung des beliebtesten Systems laut Analytics (Quests/Zone/Sammelset).' },
    { week: 7, kind: 'ab_test', title: 'A/B: Quest-Belohnungen', description: 'Belohnungshöhe der Weeklys variieren. Metrik: Quest-Abschlussrate + D7.' },
    { week: 8, kind: 'event', title: 'Themen-Event', description: rng.pick(['Fundstück-Jagd mit Sammelalbum', 'Zeitrennen-Woche mit Bestenliste', 'Boss-Rush-Woche']) },
    { week: 9, kind: 'sale', title: 'Bundle-Angebot', description: 'Starter-Bundle für Neueinsteiger; transparent, ohne Countdown-Druck.' },
    { week: 10, kind: 'content_drop', title: 'Content-Drop 3', description: 'Vorbereitung Season-Finale: neuer Meilenstein + Teaser.' },
    { week: 11, kind: 'season_end', title: 'Season-1-Finale', description: 'Abschluss-Event, Belohnungsausschüttung, Rückblick + Ausblick auf Season 2.' },
  ];

  const abTests: AbTestIdea[] = [
    {
      name: 'Tutorial-Länge',
      hypothesis: 'Ein um 40% kürzeres Tutorial erhöht die D1-Retention, ohne die D7-Kompetenz zu senken.',
      variantA: 'Vollständiges Tutorial (alle Mechaniken).',
      variantB: 'Nur Kernmechanik; Rest als Teach-on-demand im Spiel.',
      primaryMetric: 'D1-Retention (sekundär: tutorial_completed-Quote)',
    },
    {
      name: 'Erste Belohnung',
      hypothesis: 'Eine seltene (statt gewöhnliche) erste Belohnung erhöht die Kauf-Neugier ohne Umsatzdruck.',
      variantA: 'Standard-Belohnung nach dem ersten Ziel.',
      variantB: 'Auffällige seltene Belohnung + Vorschau auf das Sammelsystem.',
      primaryMetric: 'shop_opened-Rate in Session 1',
    },
    {
      name: 'Daily-Quest-Anzahl',
      hypothesis: '3 kurze Tagesziele halten besser als 5 lange.',
      variantA: '5 Tagesziele à ~5 Minuten.',
      variantB: '3 Tagesziele à ~2 Minuten.',
      primaryMetric: 'daily_return (D7)',
    },
  ];

  const balancingByGenre: Record<string, string[]> = {
    tycoon: ['Erste Aufwertung nach ≤30s, danach Kostenkurve ×1.6 pro Stufe', 'Rebirth ab ~45 Minuten Gesamtspielzeit attraktiv machen', 'Offline-Einnahmen bei 8h kappen (Comeback-Anreiz, kein Muss)'],
    simulator: ['Kern-Aktion alle 2-4s belohnen (Zahl + Sound + Partikel)', 'Neues Gebiet alle ~20 Minuten Spielzeit in Woche 1', 'Sammel-Set-Abschluss ≤ 2 Sessions für das erste Set'],
    idle: ['Prestige-Punkt bei ×10-Verlangsamung setzen', 'Generator-Kosten ×1.15 pro Kauf als Startwert', 'Offline-Earnings 50% der Online-Rate'],
    hypercasual: ['Run-Länge 30-60s anpeilen', 'Fail-Rate Level 1-3 unter 20% halten', 'Schwierigkeitsanstieg pro Level ≤ 8%'],
    battle_arena: ['Match-Länge 3-5 Minuten', 'Comeback-Mechanik: max. 15% Vorteil pro Kill-Serie', 'Neue Spieler erste 3 Matches gegen Bots (unmarkiert fair)'],
    roguelite: ['Run-Länge 8-15 Minuten', 'Meta-Upgrade nach jedem Run leistbar', 'Win-Rate Ziel: 5% (Run 1-10) bis 40% (erfahren)'],
  };
  const balancingNotes = balancingByGenre[project.genre] ?? [
    'Erste Belohnung ≤ 60s, erste Meta-Entscheidung ≤ Session 2',
    'Schwierigkeitskurve: Fehlschlag frühestens Minute 3, spätestens Minute 10',
    'Economy: Earn-Rate so setzen, dass der erste Wunsch-Kauf 1-2 Sessions dauert',
    'Session-Ziel: natürlicher Endpunkt nach 5-10 Minuten mit Rückkehr-Haken',
  ];

  return { projectId: project.id, events, liveOpsCalendar, abTests, balancingNotes };
}
