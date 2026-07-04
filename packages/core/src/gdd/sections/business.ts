import type { MonetizationModel } from '../../types/common';
import { MONETIZATION_LABELS } from '../../types/common';
import type { GddContext } from '../context';
import { primaryCurrencyName, secondaryCurrencyName } from '../context';
import { blocks, bullets, mdTable } from '../markdown';

function monetizationDetail(model: MonetizationModel, ctx: GddContext): string {
  const soft = primaryCurrencyName(ctx);
  const hard = secondaryCurrencyName(ctx) ?? 'Premium-Währung';
  switch (model) {
    case 'game_passes':
      return `Dauerhafte Komfort- und Ausdrucks-Pässe (z. B. zusätzlicher Ausrüstungs-Slot, exklusive Animationen). Preisstaffel: 2–3 Pässe zwischen 99 und 499 Robux; kein Pass verkauft Spielstärke, die andere im direkten Vergleich schlägt.`;
    case 'developer_products':
      return `Wiederkaufbare Produkte mit klarem Gegenwert (z. B. ${soft}-Pakete oder ein Zeitsprung mit festem Deckel). Jeder Kauf zeigt vor Abschluss exakt, was er enthält – keine Zufallsboxen.`;
    case 'premium_payouts':
      return 'Premium-Payouts entstehen als Nebeneffekt guter Engagement-Zeit von Premium-Mitgliedern – kein Design-Ziel, das Sessions künstlich streckt, sondern ein Bonus für ehrlich gute Inhalte.';
    case 'cosmetics':
      return `Skins, Effekte und Ausdrucks-Items entlang der Sammlungen aus der Items-Sektion. Rotierendes, aber wiederkehrendes Angebot – „einmalig und nie wieder" wird bewusst vermieden.`;
    case 'battle_pass':
      return `Saisonpass mit kostenloser und Premium-Spur. Alle spielrelevanten Belohnungen liegen auf der Gratis-Spur; die Premium-Spur enthält Kosmetik und ${hard}. Pass-Fortschritt ist in normaler Spielzeit ohne Grind-Zwang schaffbar.`;
    case 'rewarded_ads':
      return `Rein optionale Werbung mit klar beschriftetem Gegenwert (z. B. Boost oder Bonus-${soft}), nie als Pflicht-Gate. Frequenz-Deckel pro Session; jede Stelle ist auch ohne Werbung spielbar.`;
    case 'interstitial_ads':
      return 'Interstitials nur an natürlichen Pausenpunkten (Rundenende), nie mitten in der Aktion; strikter Frequenz-Deckel (max. 1 pro X Minuten) und komplett abschaltbar über einen fairen Einmalkauf.';
    case 'iap_consumables':
      return `Verbrauchsgüter wie ${soft}-Pakete oder Boosts in transparenten Stückelungen. Keine „Best Value"-Manipulation mit künstlich schlechten Ankerpreisen – jede Stufe ist ehrlich bepreist.`;
    case 'iap_non_consumables':
      return 'Dauerhafte Einmalkäufe (z. B. Werbefreiheit, Deko-Themen, Erweiterungs-Kapitel). Käufe sind wiederherstellbar (Restore Purchases) und geräteübergreifend gültig.';
    case 'subscription':
      return 'Optionales Abo mit Komfort-Charakter (z. B. täglicher Bonus, exklusive Kosmetik-Serie). Kündigung jederzeit, voller Funktionsumfang auch ohne Abo; der Preis ist vor Abschluss unmissverständlich sichtbar.';
    case 'paid_app':
      return 'Fairer Einmalpreis für das komplette Spiel – dafür keine Werbung und keine In-App-Kaufschleifen. Inhalts-Updates sind im Kaufpreis enthalten.';
  }
}

/** Section: monetization (Monetarisierung). */
export function buildMonetization(ctx: GddContext): string {
  const { project, idea } = ctx;

  const modelBlocks =
    project.monetization.length > 0
      ? project.monetization
          .map((model) => {
            const ideaNote = idea?.monetization.find((m) => m.model === model)?.description;
            return blocks(
              `### ${MONETIZATION_LABELS[model]}`,
              monetizationDetail(model, ctx),
              ideaNote ? `> Aus der Idee übernommen: ${ideaNote}` : null,
            );
          })
          .join('\n\n')
      : 'Für dieses Projekt ist zum Start **bewusst keine Monetarisierung** geplant. Der Fokus liegt auf Spielspaß und Retention; Monetarisierung wird erst nach validiertem Kern-Loop ergänzt – dann nach denselben Fairness-Regeln wie unten beschrieben.';

  const kidsExtra =
    project.audience === 'kids_8_12' || project.audience === 'family'
      ? [
          'Verschärfte Regeln für die junge Zielgruppe: keine Kaufaufforderungen durch Spielfiguren, keine Verknappungs-Countdowns, altersgerechte Preiskommunikation.',
        ]
      : [];

  return blocks(
    modelBlocks,
    '### Faire Monetarisierung',
    bullets([
      'Kein Pay-to-Win: Käufe verschaffen niemals einen Vorteil, den sich Nicht-Zahlende nicht erspielen können – besonders wichtig, wenn Kinder mitspielen.',
      'Transparente Preise: Jeder Kauf zeigt vor Abschluss den exakten Inhalt und den realen Geldwert; keine verschleiernden Zwischenwährungs-Kaskaden.',
      'Keine manipulativen Timer: keine künstlichen Wartezeiten, die nur existieren, um ihren Abkauf zu verkaufen, und keine Angst-Countdowns („nur noch 5 Minuten!").',
      'Keine Zufalls-Käufe mit Echtgeld (Lootbox-Verzicht); Zufallselemente im Spiel sind mit erspielter Währung zugänglich und zeigen Wahrscheinlichkeiten an.',
      'Ausgaben-Freundlichkeit: klare Kaufbestätigungen, wiederherstellbare Käufe und ein Design, das Sessions nicht künstlich verlängert.',
      ...kidsExtra,
    ]),
  );
}

/** Section: liveops. */
export function buildLiveops(ctx: GddContext): string {
  const { content, project } = ctx;

  const cadence = mdTable(
    ['Rhythmus', 'Inhalt'],
    [
      ['Täglich', 'Tagesziele/Quests rotieren; kleiner Login-Moment ohne Straf-Mechanik.'],
      ['Wöchentlich', 'Wochenziel plus ein leichter Modifikator (siehe Events-Sektion).'],
      ['Monatlich', 'Content-Drop: neue Inhalte entlang der Items-/Quests-Pipelines.'],
      [
        'Saisonal',
        project.qualityTarget === 'premium'
          ? 'Volle Saison-Struktur mit Thema, Belohnungsschiene und Abschluss-Event.'
          : 'Leichte Saison-Akzente (Deko, Themen-Event) – volle Saisons erst nach stabilem LiveOps-Betrieb.',
      ],
    ],
  );

  return blocks(
    '### Kadenz',
    cadence,
    '### Retention-Anker',
    bullets(content.retentionHooks),
    '### Content-Pipeline',
    bullets([
      'Inhalte (Items, Quests, Events) sind datengetrieben definiert – neue Einträge brauchen keine Code-Änderung.',
      'Jeder LiveOps-Beat wird vor Veröffentlichung auf einem Testserver/Testbuild verifiziert.',
      'Ein leichtgewichtiger Redaktionskalender (4 Wochen Vorlauf) verhindert Content-Löcher.',
    ]),
  );
}

/** Section: events. */
export function buildEvents(ctx: GddContext): string {
  const { content, rng } = ctx;
  const ordered = rng.shuffle(content.eventIdeas);

  const table = mdTable(
    ['Event', 'Konzept'],
    ordered.map((e) => [e.name, e.concept]),
  );

  return blocks(
    '### Event-Ideen (Startkatalog)',
    table,
    '### Event-Bauplan',
    bullets([
      'Dauer: Wochenend-Events 2–3 Tage, Themen-Events 7 Tage; Start und Ende werden im Spiel angekündigt.',
      'Belohnungen: mindestens ein Ausdrucks-Item (Kosmetik) plus Währung; Event-exklusive Spielstärke gibt es nicht.',
      'Nachholbarkeit: Event-Belohnungen kehren später in anderer Form zurück – kein hartes FOMO, besonders mit Blick auf junge Spielende.',
      'Jedes Event testet genau eine Hypothese (z. B. „Modifikator X erhöht Session-Länge") und wird per Analytics ausgewertet.',
    ]),
  );
}

/** Section: analytics. */
export function buildAnalytics(ctx: GddContext): string {
  const { content, rng, project } = ctx;
  const d1 = rng.int(35, 45);
  const d7 = rng.int(12, 18);
  const ftue = rng.int(70, 85);
  const sessionMin = content.sessionMinutes[0];
  const sessionMax = content.sessionMinutes[1];

  const kpis = mdTable(
    ['KPI', 'Zielwert (Start)', 'Anmerkung'],
    [
      ['D1-Retention', `${d1} %`, 'Wichtigster Frühindikator für den Kern-Loop'],
      ['D7-Retention', `${d7} %`, 'Zeigt, ob die Meta-Progression trägt'],
      ['FTUE-Abschlussquote', `${ftue} %`, 'Erste Minute bis erste Belohnung'],
      ['Session-Länge (Median)', `${sessionMin}–${sessionMax} Min`, 'Genre-Zielkorridor'],
      ['Crash-freie Sessions', '99,5 %', 'Technische Basisqualität'],
    ],
  );

  return blocks(
    '### Ziel-KPIs',
    kpis,
    'Die Zielwerte sind Startannahmen und werden nach den ersten Kohorten kalibriert – gemessen wird gegen die eigene Vorwoche, nicht gegen Branchen-Mythen.',
    '### Kern-Events (Tracking-Plan)',
    bullets([
      '`session_start` / `session_end` – Basis für Session-Länge und Tagesrhythmus (Parameter: Dauer, Einstiegspunkt).',
      '`ftue_step_completed` – jeder Onboarding-Schritt einzeln (Parameter: Schritt-Nummer) für eine präzise Abbruch-Analyse.',
      '`core_loop_completed` – ein voller Micro-Loop (Parameter: Dauer, Ergebnis) als Herzschlag-Metrik.',
      '`economy_earn` / `economy_spend` – jede Währungsbewegung (Parameter: Währung, Quelle/Sink, Betrag) für die Sink/Source-Bilanz.',
      '`progression_milestone` – erreichte Meilensteine (Parameter: Meilenstein-Id) gegen die Progressions-Kurve.',
      project.monetization.length > 0
        ? '`purchase_completed` – nur nach erfolgreichem Kauf, ohne personenbezogene Zahlungsdaten (Parameter: Produkt-Id, Preisstufe).'
        : '`monetization`-Events entfallen vorerst – das Projekt startet ohne Monetarisierung.',
      '`churn_signal` – definierte Frust-Marker (z. B. dreimal am selben Hindernis gescheitert) als Frühwarnsystem.',
    ]),
    '### Datenschutz',
    'Es werden nur pseudonyme Spiel-Ereignisse erfasst, keine Klarnamen oder Kontaktdaten. Für junge Zielgruppen gelten die jeweiligen Plattform-Regeln (u. a. keine personalisierte Werbung) als harte Grenze.',
  );
}
