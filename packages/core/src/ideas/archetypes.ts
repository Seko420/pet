import type { EffortLevel, Genre, MonetizationModel, RiskLevel } from '../types/common';
import type { IdeaRisk } from '../types/idea';

/**
 * Concept archetype library. Every genre from types/common.ts has at least
 * two archetypes. All content is original; user-facing strings are German.
 *
 * The `fantasy` sentence MUST contain the `{place}` placeholder - the
 * generator substitutes the theme's prepositional phrase there.
 */
export interface MonetizationAngle {
  model: MonetizationModel;
  description: string;
}

export interface IdeaArchetype {
  /** Unique key, `${genre}_${slug}`. */
  key: string;
  genre: Genre;
  /** Full German sentence in second person, contains `{place}`. */
  fantasy: string;
  /** Short German noun phrase naming the concept's essence (fits after "auf ..."). */
  essence: string;
  /** 4-6 German core loop steps. */
  coreLoop: readonly string[];
  usp: string;
  /** Social/progression hook sentence used as the pitch closer. */
  hook: string;
  /** Full twist sentences; one is picked per idea. */
  twists: readonly string[];
  /** Mixed-platform monetization angles; filtered by target platform. */
  monetization: readonly MonetizationAngle[];
  risks: readonly IdeaRisk[];
  successReasons: readonly string[];
  failReasons: readonly string[];
  /** Concrete sharpening moves for the improved version (noun phrases with final verb). */
  improvements: readonly string[];
  effort: { min: EffortLevel; typical: EffortLevel };
  multiplayer: 'required' | 'optional' | 'solo';
  /** Concept signals for the ConceptProfile, e.g. 'pets', 'pvp', 'ugc'. */
  tags: readonly string[];
}

const angle = (model: MonetizationModel, description: string): MonetizationAngle => ({
  model,
  description,
});

const risk = (title: string, level: RiskLevel, mitigation: string): IdeaRisk => ({
  title,
  level,
  mitigation,
});

/** Fallback descriptions when a focus model is not covered by an archetype. */
export const GENERIC_MONETIZATION: Record<MonetizationModel, string> = {
  game_passes:
    'Einmalige Game Passes schalten dauerhafte Komfort- und Prestige-Vorteile frei, ohne die Balance zu kippen.',
  developer_products:
    'Wiederkaufbare Developer Products für Beschleuniger und Event-Tickets, klar gekennzeichnet und ohne Kaufzwang.',
  premium_payouts:
    'Lange, fesselnde Sessions für Premium-Mitglieder steigern die Premium Payouts spürbar.',
  cosmetics: 'Rein kosmetische Skins, Effekte und Emotes – Status statt Spielstärke.',
  battle_pass:
    'Saisonaler Fortschrittspass mit Gratis- und Premium-Zweig, der ausschließlich Kosmetik und Komfort belohnt.',
  rewarded_ads:
    'Optionale Rewarded Ads als Bonus-Booster – nie verpflichtend, immer mit klarem Gegenwert.',
  interstitial_ads:
    'Sparsame Interstitials nur an natürlichen Pausenpunkten, mit hartem Frequenz-Deckel pro Session.',
  iap_consumables:
    'Verbrauchbare Booster und Ressourcenpakete in kleinen, transparenten Preisstufen.',
  iap_non_consumables:
    'Dauerhafte Einmalkäufe wie Werbefreiheit oder Erweiterungspakete mit bleibendem Wert.',
  subscription:
    'Ein optionales Abo bündelt tägliche Boni und exklusive Kosmetik – jederzeit kündbar.',
  paid_app: 'Faire Premium-App ohne weitere Kaufhürden – der volle Umfang steckt im Kaufpreis.',
};

export const ARCHETYPES: readonly IdeaArchetype[] = [
  // ---------------------------------------------------------------- simulator
  {
    key: 'simulator_creature_ranch',
    genre: 'simulator',
    fantasy:
      'Du eröffnest {place} eine Ranch für eigenwillige Kreaturen, die du aufziehst, gezielt kreuzt und für Besucher in Szene setzt.',
    essence: 'Sammel- und Zuchttiefe',
    coreLoop: [
      'Eier ausbrüten und neue Kreaturen entdecken',
      'Kreaturen füttern, pflegen und ihre Eigenheiten kennenlernen',
      'Ressourcen ernten und Gehege ausbauen',
      'Seltene Merkmale gezielt miteinander kreuzen',
      'Ranch für Besucher öffnen und Belohnungen kassieren',
    ],
    usp: 'Jede Kreatur besteht aus sichtbaren, vererbbaren Merkmalen – Zuchtergebnisse sind planbar statt reine Glückssache.',
    hook: 'Seltene Merkmalskombinationen werden serverweit angekündigt und machen erfolgreiche Züchterinnen und Züchter berühmt.',
    twists: [
      'Der Clou: Kreaturen verändern ihr Aussehen je nach Umgebung, in der sie aufwachsen.',
      'Der Clou: Ausgewilderte Kreaturen besuchen die Ranches anderer Spieler und bringen Geschenke mit.',
      'Der Clou: Ein Wettersystem bestimmt, welche Merkmale bei der Zucht dominieren.',
    ],
    monetization: [
      angle(
        'game_passes',
        'Der „Zuchtmeister“-Pass schaltet ein zusätzliches Gehege und eine Vererbungs-Vorschau frei.',
      ),
      angle(
        'developer_products',
        'Brut-Beschleuniger und Besucher-Magnete als faire, wiederkaufbare Produkte.',
      ),
      angle('cosmetics', 'Halsbänder, Fellmuster und Gehege-Deko – rein kosmetisch.'),
      angle(
        'rewarded_ads',
        'Optionale Werbung verdoppelt die Besucher-Einnahmen der letzten Öffnungszeit.',
      ),
      angle('iap_consumables', 'Futterpakete und seltene Eierschalen in kleinen Preisstufen.'),
    ],
    risks: [
      risk(
        'Zuchtsystem wird als Glücksspiel wahrgenommen',
        'high',
        'Vererbung transparent anzeigen, Pity-Regeln einbauen und planbare Ergebnisse statt reiner Zufallsboxen liefern.',
      ),
      risk(
        'Content-Hunger nach neuen Kreaturen',
        'medium',
        'Merkmals-Baukasten statt handgebauter Einzeltiere: Kombinationen erzeugen Vielfalt automatisch.',
      ),
      risk(
        'Früher Grind schreckt Gelegenheitsspieler ab',
        'medium',
        'Erste Zuchterfolge in Minute fünf garantieren und Systemtiefe erst später öffnen.',
      ),
    ],
    successReasons: [
      'Sammeln plus Züchten trifft einen dauerhaft starken Motivationskern',
      'Sichtbare Vererbung hebt das Spiel klar von Standard-Pet-Simulatoren ab',
      'Die Besucher-Mechanik erzeugt soziale Bindung ganz ohne PvP-Druck',
      'Merkmals-Kombinatorik skaliert Content günstig über Jahre',
    ],
    failReasons: [
      'Ohne laufende Meta-Ziele flacht die Motivation nach der ersten Sammelwelle ab',
      'Zucht-Balancing ist aufwendig – kaputte Kombinationen ruinieren die Ökonomie',
      'Der Markt für Kreaturen-Spiele ist dicht besetzt und lauffreudig',
      'Zu leicht erreichbare seltene Merkmale entwerten das Prestige komplett',
    ],
    improvements: [
      'Vererbungs-Vorschau schon im Onboarding zeigen',
      'Wöchentliche Schaulauf-Events mit Community-Voting ergänzen',
      'Handelsplatz mit Preisanker und Betrugsschutz einbauen',
      'Startphase auf drei klare Ziele in zehn Minuten verdichten',
      'Foto-Modus mit teilbaren Kreaturen-Steckbriefen ergänzen',
    ],
    effort: { min: 'small', typical: 'medium' },
    multiplayer: 'optional',
    tags: ['pets', 'collection', 'breeding', 'cozy', 'social'],
  },
  {
    key: 'simulator_delivery_fleet',
    genre: 'simulator',
    fantasy:
      'Du steuerst {place} eine wachsende Lieferflotte: erst fliegst du jede Route selbst, später orchestrierst du ein automatisiertes Netz aus Kurieren.',
    essence: 'Routen-Optimierung und Automatisierung',
    coreLoop: [
      'Aufträge annehmen und Fracht einsammeln',
      'Routen selbst fliegen und Abkürzungen entdecken',
      'Einnahmen in neue Kuriere und Upgrades stecken',
      'Routen an die Automatik übergeben und überwachen',
      'Engpässe beheben und das Liefernetz erweitern',
    ],
    usp: 'Der Wechsel von Handarbeit zu Automatisierung ist stufenlos – jede selbst geflogene Route wird zur Blaupause für die eigene Flotte.',
    hook: 'Ein Live-Ticker zeigt, wessen Netz gerade die meisten Pakete pro Minute schafft – Optimierer bleiben für Wochen beschäftigt.',
    twists: [
      'Der Clou: Wetterfronten verändern täglich die schnellsten Routen.',
      'Der Clou: Zerbrechliche Spezialfracht verlangt Handarbeit trotz Vollautomatisierung.',
      'Der Clou: Konkurrenzunternehmen kaufen Routen auf, wenn man sie vernachlässigt.',
    ],
    monetization: [
      angle('game_passes', 'Der „Flottenchef“-Pass erweitert die Kurier-Kapazität dauerhaft um zwei Slots.'),
      angle('developer_products', 'Express-Verträge als wiederkaufbare Einnahme-Booster mit klarer Laufzeit.'),
      angle('cosmetics', 'Lackierungen, Anhänger und Hupen für die Flotte – reiner Stil.'),
      angle('rewarded_ads', 'Optionale Werbespots schalten einen 10-Minuten-Rückenwind-Boost frei.'),
      angle('iap_non_consumables', 'Einmalkauf „Werkstatt-Erweiterung“ mit dauerhaft drittem Upgrade-Slot.'),
    ],
    risks: [
      risk(
        'Automatisierung macht das Spiel zu früh passiv',
        'high',
        'Handgeflogene Routen dauerhaft attraktiv halten: Spezialfracht, Zeitrennen und Entdecker-Boni.',
      ),
      risk(
        'Wirtschafts-Balancing kippt durch Exploits',
        'medium',
        'Serverseitige Preisberechnung und weiche Obergrenzen pro Spieltag einziehen.',
      ),
      risk(
        'Monotonie bei zu ähnlichen Aufträgen',
        'medium',
        'Auftrags-Modifikatoren (zerbrechlich, eilig, geheim) und wöchentliche Sondervertrags-Rotation.',
      ),
    ],
    successReasons: [
      'Optimierer-Fantasie mit sichtbarem, wachsendem Netz motiviert langfristig',
      'Stufenlose Automatisierung bedient Casuals und Min-Maxer zugleich',
      'Tägliche Wetterrotation liefert kostenlosen Wiederspielwert',
      'Das Thema Lieferlogistik ist verständlich und selten gut umgesetzt',
    ],
    failReasons: [
      'Ohne starke frühe Stunde wirkt das Spiel wie eine Tabellenkalkulation',
      'Idle-Anteil kann die aktive Spielzeit und damit die Bindung kannibalisieren',
      'UI-Komplexität wächst schnell über den Mobile-Komfort hinaus',
      'Fehlende soziale Anker senken die Rückkehrquote',
    ],
    improvements: [
      'Erste Automatisierung bereits nach fünf Minuten freischalten',
      'Wöchentliche Logistik-Wettbewerbe mit Bestenlisten ergänzen',
      'Engpass-Alarm mit konkreten Handlungsvorschlägen einbauen',
      'Koop-Verträge für Duos mit geteilter Prämie einführen',
    ],
    effort: { min: 'small', typical: 'medium' },
    multiplayer: 'optional',
    tags: ['automation', 'vehicles', 'optimization', 'progression'],
  },

  // ------------------------------------------------------------------ tycoon
  {
    key: 'tycoon_conveyor_factory',
    genre: 'tycoon',
    fantasy:
      'Du errichtest {place} eine Fabrik aus Förderbändern, Pressen und Sortierern, die aus Rohstoffen immer wertvollere Waren macht.',
    essence: 'sichtbaren Produktionsfluss',
    coreLoop: [
      'Rohstoffquelle anzapfen und erstes Band verlegen',
      'Maschinen kaufen und in Reihe schalten',
      'Produkte verkaufen und Engpässe erkennen',
      'Layout umbauen und Durchsatz steigern',
      'Neue Produktionsstufen und Areale freischalten',
    ],
    usp: 'Jede Optimierung ist physisch sichtbar: Waren stauen sich wirklich, Bänder ruckeln wirklich – die Fabrik ist das Interface.',
    hook: 'Besucher können durch fremde Fabriken laufen und ein „Beeindruckend“-Siegel vergeben, das seltene Baupläne freischaltet.',
    twists: [
      'Der Clou: Einmal pro Stunde wechselt die Nachfrage – wer flexibel baut, verdient doppelt.',
      'Der Clou: Ausschussware landet in einem Recycling-Kreislauf mit eigener Produktlinie.',
      'Der Clou: Nachtschichten laufen offline weiter, aber nur so gut, wie das Layout wirklich ist.',
    ],
    monetization: [
      angle('game_passes', 'Der „Ingenieur“-Pass schaltet Blaupausen-Speicher und ein Statistik-Dashboard frei.'),
      angle('developer_products', 'Zeitlich begrenzte Nachfrage-Booster als wiederkaufbare Produkte.'),
      angle('cosmetics', 'Bandfarben, Maschinen-Skins und Fabrik-Maskottchen ohne Spielvorteil.'),
      angle('rewarded_ads', 'Optionale Werbung verlängert den Offline-Ertrag um zwei Stunden.'),
      angle('iap_consumables', 'Baustoff-Pakete für Großprojekte in transparenten Preisstufen.'),
      angle('battle_pass', 'Saison-Pass mit kosmetischen Fabrik-Themen und Komfort-Blaupausen.'),
    ],
    risks: [
      risk(
        'Performance bricht bei großen Fabriken ein',
        'high',
        'Warenströme ab Sichtweite aggregieren statt simulieren; hartes Budget pro Areal.',
      ),
      risk(
        'Umbauen fühlt sich strafend an',
        'medium',
        'Kostenloses Versetzen, Blaupausen-Kopien und ein Sandbox-Planungsmodus.',
      ),
      risk(
        'Frühe Progression zu langsam',
        'medium',
        'Erste komplette Produktionskette in unter vier Minuten erlebbar machen.',
      ),
    ],
    successReasons: [
      'Sichtbarer Durchsatz belohnt Optimieren unmittelbar und befriedigend',
      'Das Genre hat eine treue, zahlungsbereite Kernzielgruppe',
      'Nachfrage-Rotation erzeugt tägliche Rückkehr-Anlässe',
      'Blaupausen und Besucher-Siegel schaffen soziale Tiefe ohne PvP',
    ],
    failReasons: [
      'Technische Schuld bei der Simulation rächt sich spät und teuer',
      'Zu viel Komplexität am Anfang vergrault Neueinsteiger',
      'Ohne markantes Thema wirkt es wie jeder andere Fabrik-Tycoon',
      'Offline-Erträge können die aktive Session entwerten',
    ],
    improvements: [
      'Engpass-Anzeige mit Heatmap direkt ins Basis-Spiel legen',
      'Wöchentliche Bauaufgaben mit Community-Ranking ergänzen',
      'Areal-Prestige mit dauerhaften Effizienz-Boni einführen',
      'Onboarding auf eine geführte erste Produktionskette verdichten',
      'Foto-taugliche Fabrik-Aussichtsplattform einbauen',
    ],
    effort: { min: 'small', typical: 'medium' },
    multiplayer: 'optional',
    tags: ['automation', 'base_building', 'optimization', 'progression'],
  },
  {
    key: 'tycoon_guest_resort',
    genre: 'tycoon',
    fantasy:
      'Du baust {place} ein Resort für reisende Gäste mit sehr speziellen Wünschen – vom Zimmer über die Küche bis zum Abendprogramm.',
    essence: 'Gäste-Zufriedenheit als Wirtschaftsmotor',
    coreLoop: [
      'Gäste empfangen und ihre Wünsche lesen',
      'Zimmer, Küche und Attraktionen ausbauen',
      'Personal einstellen und Abläufe verbessern',
      'Bewertungen sammeln und den Ruf steigern',
      'Neue Gästetypen und Resort-Flügel freischalten',
    ],
    usp: 'Gäste sind keine Zahlenkolonnen, sondern kleine Charaktere mit Marotten – wer sie beobachtet, verdient mehr als wer nur baut.',
    hook: 'Stammgäste erzählen anderen Spielern von ihrem Aufenthalt und bringen deren Spezialwünsche als neue Aufträge mit.',
    twists: [
      'Der Clou: Einmal pro Woche reist ein anonymer Kritiker an, dessen Bewertung das Ranking dominiert.',
      'Der Clou: Jahreszeiten verändern, welche Gäste anreisen und was sie erwarten.',
      'Der Clou: Gäste hinterlassen Fundsachen, die zu Sammelquests werden.',
    ],
    monetization: [
      angle('game_passes', 'Der „Concierge“-Pass schaltet einen VIP-Flügel mit anspruchsvollen Gästen frei.'),
      angle('developer_products', 'Marketing-Kampagnen als wiederkaufbare Gäste-Booster.'),
      angle('cosmetics', 'Möbel-Sets, Fassaden und Uniformen – rein dekorativ.'),
      angle('rewarded_ads', 'Optionale Werbung beschleunigt den nächsten Gäste-Bus.'),
      angle('iap_non_consumables', 'Einmalkauf „Ballsaal“ als dauerhafte Resort-Erweiterung.'),
    ],
    risks: [
      risk(
        'Simulationstiefe frisst Entwicklungszeit',
        'medium',
        'Gäste-KI als einfache Bedürfnis-Checkliste starten und erst nach Marktvalidierung vertiefen.',
      ),
      risk(
        'Management-UI überfordert auf kleinen Bildschirmen',
        'medium',
        'Eine-Sorge-pro-Karte-Prinzip: immer nur das dringendste Problem prominent zeigen.',
      ),
      risk(
        'Cozy-Zielgruppe reagiert allergisch auf Druck',
        'low',
        'Keine harten Fail-States – schlechte Bewertungen kosten Tempo, nie Fortschritt.',
      ),
    ],
    successReasons: [
      'Cozy-Management hat eine breite, unterversorgte Zielgruppe',
      'Charaktervolle Gäste erzeugen erzählbare Momente für Social Media',
      'Saisonale Gäste-Rotation ist ein natürlicher LiveOps-Motor',
      'Deko-Monetarisierung passt perfekt zum Kern des Spiels',
    ],
    failReasons: [
      'Ohne charmante Ausstrahlung wirkt es wie ein Excel-Hotel',
      'Zu seichte Simulation langweilt Management-Fans schnell',
      'Content-Bedarf an Möbeln und Gästen ist dauerhaft hoch',
      'Der Mittelweg zwischen cozy und fordernd ist schwer zu treffen',
    ],
    improvements: [
      'Kritiker-Besuch als wöchentliches Event-Highlight inszenieren',
      'Gäste-Alben mit Sammelcharakter einführen',
      'Foto-Modus für Zimmer-Designs mit Teilen-Funktion ergänzen',
      'Erste zufriedene Bewertung in Minute drei garantieren',
    ],
    effort: { min: 'medium', typical: 'medium' },
    multiplayer: 'optional',
    tags: ['management', 'cozy', 'decoration', 'social', 'seasonal'],
  },

  // -------------------------------------------------------------------- obby
  {
    key: 'obby_builder_tower',
    genre: 'obby',
    fantasy:
      'Du kletterst {place} einen endlosen Turm hinauf, an dem alle mitbauen: Nach jedem Lauf darfst du genau ein Element ergänzen.',
    essence: 'Community-gebauten Schwierigkeitsgrad',
    coreLoop: [
      'Turmabschnitt anlaufen und Checkpoints sichern',
      'An Community-Passagen scheitern und dazulernen',
      'Persönliche Bestmarke verbessern',
      'Nach dem Lauf ein eigenes Bauteil platzieren',
      'Bewertungen für faire, kreative Bauteile sammeln',
    ],
    usp: 'Der Parcours gehört der Community: Jeder Lauf endet mit einem Bau-Zug, und die besten Passagen überleben per Abstimmung.',
    hook: 'Wer ein Bauteil setzt, das viele meistern und mögen, verewigt seinen Namen dauerhaft im Turm.',
    twists: [
      'Der Clou: Jede Woche stürzt der unbeliebteste Abschnitt ein und macht Platz für Neues.',
      'Der Clou: Gefährliche Bauteile bringen dem Erbauer nur Punkte, wenn sie schaffbar bleiben.',
      'Der Clou: Ein täglicher „Geisterlauf“ zeigt die Route des besten Spielers zum Nachlaufen.',
    ],
    monetization: [
      angle('game_passes', 'Der „Baumeister“-Pass erweitert die Bauteil-Palette um Premium-Formen ohne Gameplay-Vorteil.'),
      angle('developer_products', 'Checkpoint-Herzen für Wiederholversuche als faire Verbrauchsprodukte.'),
      angle('cosmetics', 'Trails, Sprungeffekte und Sieger-Emotes – reiner Stil.'),
      angle('rewarded_ads', 'Optionale Werbung schaltet einen zusätzlichen Bau-Zug pro Tag frei.'),
      angle('iap_consumables', 'Kleine Herz-Pakete für hartnäckige Passagen.'),
    ],
    risks: [
      risk(
        'Trolle bauen unfaire Passagen',
        'high',
        'Bauteile erst nach bestandener Auto-Prüfung (schaffbar in x Versuchen) live schalten, plus Abstimmung.',
      ),
      risk(
        'Schwierigkeitskurve gerät außer Kontrolle',
        'medium',
        'Turm in Ringe mit Schwierigkeits-Budget einteilen; Matchmaking nach Skill-Ring.',
      ),
      risk(
        'Frust ohne sichtbaren Fortschritt',
        'medium',
        'Checkpoints großzügig setzen und Scheitern mit Bau-Punkten belohnen.',
      ),
    ],
    successReasons: [
      'UGC hält den Content-Nachschub kostenlos am Laufen',
      'Der eigene Name im Turm ist ein starker Rückkehr-Magnet',
      'Obby-Kernmechanik ist sofort verständlich und mobile-tauglich',
      'Wöchentlicher Einsturz erzeugt verlässliche Event-Momente',
    ],
    failReasons: [
      'Moderations-Aufwand für Bauteile wird unterschätzt',
      'Ohne kritische Spielermasse wirkt der Turm leer und statisch',
      'Hardcore-Passagen können Gelegenheitsspieler aussperren',
      'Die Bau-Mechanik kann den flotten Lauf-Kern verwässern',
    ],
    improvements: [
      'Skill-Ringe mit eigenem Matchmaking von Anfang an einbauen',
      'Bauteil-Editor auf zwölf geprüfte Grundformen begrenzen',
      'Wochen-Einsturz als Live-Event mit Countdown inszenieren',
      'Geisterlauf-Wetten mit Kosmetik-Prämien ergänzen',
    ],
    effort: { min: 'tiny', typical: 'small' },
    multiplayer: 'optional',
    tags: ['parkour', 'ugc', 'competition', 'community'],
  },
  {
    key: 'obby_tether_duo',
    genre: 'obby',
    fantasy:
      'Du meisterst {place} einen Parcours, bei dem du mit einem Partner durch ein elastisches Seil verbunden bist – Timing schlägt Tempo.',
    essence: 'Koop-Präzision zu zweit',
    coreLoop: [
      'Partner finden und Seil-Länge wählen',
      'Passagen mit Schwung- und Pendeltechniken lösen',
      'Sterne für Stil und Synchronität sammeln',
      'Neue Seil-Typen und Routen freischalten',
      'Bestzeiten im Duo-Leaderboard verteidigen',
    ],
    usp: 'Das Seil macht aus jedem Sprung ein Gespräch: Ohne Absprache pendelt man ins Leere, mit Absprache fliegt man.',
    hook: 'Perfekt synchrone Läufe erzeugen automatisch teilbare Replay-Clips mit beiden Namen im Abspann.',
    twists: [
      'Der Clou: Das Seil kann kurzzeitig versteift werden und wird so zur Stange oder Brücke.',
      'Der Clou: Zufalls-Partnertage koppeln Fremde – wer zusammen ankommt, bleibt oft als Duo.',
      'Der Clou: Manche Passagen lassen sich nur lösen, wenn genau einer von beiden fällt.',
    ],
    monetization: [
      angle('game_passes', 'Der „Duo“-Pass schaltet Spezial-Seile mit rein visuellen Effekten und Replay-Extras frei.'),
      angle('developer_products', 'Routen-Tickets für Premium-Kurse als wiederkaufbare Produkte.'),
      angle('cosmetics', 'Seil-Skins, Funken-Trails und Duo-Emotes.'),
      angle('rewarded_ads', 'Optionale Werbung schaltet einen Wiederholversuch am letzten Checkpoint frei.'),
      angle('iap_non_consumables', 'Einmalkauf „Kurs-Paket Alpen-Set“ mit fünf handgebauten Routen.'),
    ],
    risks: [
      risk(
        'Partnerabhängigkeit frustriert Solo-Spieler',
        'high',
        'Bot-Partner mit ehrlicher Kennzeichnung und ein Solo-Modus mit Anker-Mechanik.',
      ),
      risk(
        'Physik-Seil ist technisch heikel',
        'medium',
        'Seil deterministisch simulieren und serverseitig validieren, sonst leidet das Vertrauen in Bestzeiten.',
      ),
      risk(
        'Toxisches Verhalten bei Fehlern des Partners',
        'medium',
        'Keine Schuld-Anzeige, gemeinsame Belohnungen und schnelle Redo-Buttons.',
      ),
    ],
    successReasons: [
      'Koop-Momente erzeugen Lachanfälle und organische Empfehlungen',
      'Das Seil ist ein sofort verständliches, seltenes Alleinstellungsmerkmal',
      'Replay-Clips sind geborenes Social-Media-Material',
      'Kurze Läufe passen perfekt zu mobilen Sessions',
    ],
    failReasons: [
      'Ohne zuverlässiges Matchmaking bleibt der Kern unerreichbar',
      'Physik-Bugs zerstören das Präzisionsgefühl sofort',
      'Content-Bedarf an handgebauten Kursen ist hoch',
      'Solo-Fallback kann sich wie ein anderes, schwächeres Spiel anfühlen',
    ],
    improvements: [
      'Zufalls-Partnertag als festes Wochenevent etablieren',
      'Versteifen-Mechanik schon im Tutorial unterrichten',
      'Kurs-Editor für die Community nachrüsten',
      'Synchron-Bonus sichtbar als Stil-Punkte einblenden',
    ],
    effort: { min: 'tiny', typical: 'small' },
    multiplayer: 'required',
    tags: ['parkour', 'coop', 'social', 'physics'],
  },

  // ---------------------------------------------------------------- rpg_lite
  {
    key: 'rpg_lite_relic_hunters',
    genre: 'rpg_lite',
    fantasy:
      'Du ziehst {place} als Relikt-Jägerin oder Relikt-Jäger los, erfüllst Aufträge der Bewohner und rüstest dich mit Fundstücken immer weiter aus.',
    essence: 'Loot-Spirale mit Begleiter-Bindung',
    coreLoop: [
      'Auftrag im Lager annehmen',
      'Zone erkunden und Gegner-Gruppen bezwingen',
      'Relikte looten und Begleiter verstärken',
      'Ausrüstung verbessern und Build anpassen',
      'Schwierigere Zonen und Auftraggeber freischalten',
    ],
    usp: 'Statt Skilltrees levelst du einen tierischen Begleiter, dessen Fähigkeiten deinen Spielstil sichtbar verändern.',
    hook: 'Begleiter erinnern sich an gemeinsame Abenteuer und schalten dadurch persönliche Quest-Reihen frei.',
    twists: [
      'Der Clou: Relikte haben Nebenwirkungen – Stärke gibt es nie umsonst.',
      'Der Clou: Besiegte Bosse hinterlassen Eier, aus denen neue Begleiter-Arten schlüpfen.',
      'Der Clou: Zonen altern sichtbar mit jedem Besuch und verändern ihre Gegner.',
    ],
    monetization: [
      angle('game_passes', 'Der „Expedition“-Pass schaltet einen zweiten Begleiter-Slot frei.'),
      angle('developer_products', 'Vorrats-Kisten mit Tränken als faire Verbrauchsprodukte.'),
      angle('cosmetics', 'Rüstungs-Farbschemata und Begleiter-Accessoires.'),
      angle('battle_pass', 'Saisonale Jagd-Lizenzen mit kosmetischen Meilenstein-Belohnungen.'),
      angle('iap_consumables', 'Trank- und Köder-Pakete in kleinen Preisstufen.'),
      angle('rewarded_ads', 'Optionale Werbung gewährt eine zweite Loot-Rolle nach Bosskämpfen.'),
    ],
    risks: [
      risk(
        'Scope-Explosion beim RPG-Anteil',
        'high',
        'Strikt drei Systeme (Kampf, Loot, Begleiter) – Story nur über Auftragstexte erzählen.',
      ),
      risk(
        'Loot-Inflation entwertet Fortschritt',
        'medium',
        'Relikt-Nebenwirkungen als natürliches Machtlimit einsetzen und Duplikate zu Materialien machen.',
      ),
      risk(
        'Kampfgefühl auf Mobile zu schwammig',
        'medium',
        'Auto-Aim mit manuellem Ausweichen kombinieren und früh mit echten Geräten testen.',
      ),
    ],
    successReasons: [
      'Begleiter-Bindung erzeugt emotionale Langzeitmotivation',
      'Loot-Spiralen sind ein bewährter Retention-Motor',
      'Nebenwirkungs-Relikte erzeugen echte Build-Entscheidungen',
      'Zonen-Struktur erlaubt planbare Content-Erweiterungen',
    ],
    failReasons: [
      'RPG-Erwartungen übersteigen schnell das Lite-Budget',
      'Ohne knackiges Kampfgefühl trägt die Loot-Spirale nicht',
      'Begleiter-Balancing ist doppelter Aufwand',
      'Zu viel Menü-Zeit erstickt das Abenteuer-Gefühl',
    ],
    improvements: [
      'Erste Begleiter-Entwicklung in Session eins erlebbar machen',
      'Wöchentliche Mutations-Zonen mit Sonderregeln ergänzen',
      'Build-Vorlagen zum schnellen Ausprobieren einführen',
      'Boss-Eier als sichtbares Sammelziel im Lager ausstellen',
      'Auftragstexte auf Zwei-Zeilen-Format kürzen',
    ],
    effort: { min: 'medium', typical: 'large' },
    multiplayer: 'optional',
    tags: ['loot', 'quests', 'pets', 'builds', 'combat'],
  },
  {
    key: 'rpg_lite_kitchen_quests',
    genre: 'rpg_lite',
    fantasy:
      'Du führst {place} eine Abenteurer-Küche: Zutaten sammelst du auf kleinen Expeditionen, und deine Gerichte machen aus Gästen Verbündete.',
    essence: 'Sammeln, Kochen und Beziehungen',
    coreLoop: [
      'Expedition planen und Zutaten sammeln',
      'Rezepte entdecken und Gerichte kochen',
      'Gäste bewirten und ihre Geschichten hören',
      'Beziehungen vertiefen und Boni erhalten',
      'Küche ausbauen und neue Regionen öffnen',
    ],
    usp: 'Gerichte sind das Questsystem: Wer den richtigen Eintopf serviert, öffnet Türen, die kein Schwert öffnet.',
    hook: 'Stammgäste geben Rezept-Fragmente weiter, die nur durch Kombinieren mit anderen Spielern vollständig werden.',
    twists: [
      'Der Clou: Zutaten haben Frischefenster – Expeditionsplanung ist das eigentliche Puzzle.',
      'Der Clou: Misslungene Gerichte werden zu skurrilen Sammelobjekten mit eigener Fangemeinde.',
      'Der Clou: Saisonale Märkte bringen Zutaten, die es nur wenige Tage gibt.',
    ],
    monetization: [
      angle('game_passes', 'Der „Chefkoch“-Pass schaltet eine zweite Herdzeile und Rezept-Favoriten frei.'),
      angle('developer_products', 'Markt-Gutscheine für seltene Zutaten als Verbrauchsprodukte.'),
      angle('cosmetics', 'Küchen-Deko, Schürzen und Tellerdesigns.'),
      angle('rewarded_ads', 'Optionale Werbung hält die Frische einer Expedition doppelt so lange.'),
      angle('iap_non_consumables', 'Einmalkauf „Gewürzregal“ mit dauerhaftem Lager-Slot.'),
    ],
    risks: [
      risk(
        'Zwei Spielhälften konkurrieren um Aufmerksamkeit',
        'medium',
        'Expedition und Küche über Frischefenster mechanisch fest verzahnen.',
      ),
      risk(
        'Rezept-Content erschöpft sich',
        'medium',
        'Zutaten-Kombinatorik mit prozeduralen Geschmacksprofilen statt reiner Rezeptliste.',
      ),
      risk(
        'Cozy-Erwartung kollidiert mit Zeitdruck',
        'low',
        'Frischeverlust kostet nur Bonus-Qualität, niemals das Gericht selbst.',
      ),
    ],
    successReasons: [
      'Kochen plus Abenteuer ist eine charmante, seltene Kombination',
      'Beziehungssystem liefert erzählerische Tiefe zum kleinen Preis',
      'Saison-Zutaten sind ein natürlicher LiveOps-Kalender',
      'Breite Cozy-Zielgruppe auf beiden Plattformen',
    ],
    failReasons: [
      'Ohne Charme in Text und Optik fällt das Konzept flach',
      'Zwei Kernschleifen bedeuten doppelte Tutorial-Last',
      'Frische-Mechanik kann als Stress missverstanden werden',
      'Multiplayer-Rezepttausch braucht kritische Masse',
    ],
    improvements: [
      'Signature-Gericht pro Spieler als Identitätsanker einführen',
      'Expeditionen auf Fünf-Minuten-Happen zuschneiden',
      'Gäste-Geschichten als sammelbares Album gestalten',
      'Rezept-Fragmente auch solo über Wochenmärkte erreichbar machen',
    ],
    effort: { min: 'medium', typical: 'large' },
    multiplayer: 'optional',
    tags: ['crafting', 'cozy', 'quests', 'collection', 'social'],
  },

  // ---------------------------------------------------------------- survival
  {
    key: 'survival_rising_tide',
    genre: 'survival',
    fantasy:
      'Du kämpfst {place} gegen eine unaufhaltsam steigende Flut: Sammle, baue in die Höhe und rette, was dir wichtig ist.',
    essence: 'vertikalen Basisbau unter Zeitdruck',
    coreLoop: [
      'Bei Ebbe Ressourcen aus den Tiefen bergen',
      'Basis aufstocken und abdichten',
      'Werkzeuge und Rettungsgeräte craften',
      'Flutwelle überstehen und Schäden begutachten',
      'Höhere Ebenen und Technologien freischalten',
    ],
    usp: 'Die Flut ist ein ehrlicher, sichtbarer Gegner: Jede Welle steht als Markierung an der Wand deiner Basis.',
    hook: 'Nach jeder überstandenen Flut vergleicht der Server, wessen Basis am elegantesten überlebt hat – nicht nur, wessen überhaupt.',
    twists: [
      'Der Clou: Das Wasser bringt auch Gutes – Treibgut-Schwemmen sind die beste Loot-Quelle.',
      'Der Clou: Gerettete Tiere ziehen in die Basis ein und helfen beim nächsten Zyklus.',
      'Der Clou: Wer taucht, findet die wertvollsten Materialien in den überfluteten Ebenen von gestern.',
    ],
    monetization: [
      angle('game_passes', 'Der „Leuchtturm“-Pass schaltet eine Beobachtungsplattform mit Flut-Vorhersage frei.'),
      angle('developer_products', 'Notfall-Kits nach verlorenen Wellen als faire Wiedereinstiegs-Hilfe.'),
      angle('cosmetics', 'Baustile, Flaggen und Lampen für die Basis.'),
      angle('battle_pass', 'Gezeiten-Saisonpass mit kosmetischen Meilenstein-Belohnungen.'),
      angle('rewarded_ads', 'Optionale Werbung gewährt eine Treibgut-Vorschau vor der nächsten Welle.'),
      angle('iap_consumables', 'Material-Pakete für Wiederaufbau in kleinen Stufen.'),
    ],
    risks: [
      risk(
        'Verlust-Frust nach zerstörten Basen',
        'high',
        'Kernstruktur bleibt immer erhalten; die Flut nimmt Ressourcen, nie die Identität der Basis.',
      ),
      risk(
        'Zyklus wird nach Stunden vorhersehbar',
        'medium',
        'Flut-Modifikatoren (Strömung, Nebel, Springflut) wöchentlich rotieren.',
      ),
      risk(
        'Bau-Steuerung auf Touch zu fummelig',
        'medium',
        'Raster-Snapping und große Bauteile als Standard, Feinbau optional.',
      ),
    ],
    successReasons: [
      'Der Gezeiten-Rhythmus erzeugt natürliche Session-Struktur',
      'Sichtbare Flutmarken erzählen die eigene Überlebensgeschichte',
      'Koop-Basenbau ist ein starker sozialer Kitt',
      'Eleganz-Wertung differenziert vom üblichen Survival-Einerlei',
    ],
    failReasons: [
      'Zerstörungs-Mechanik kann Casuals dauerhaft vergraulen',
      'Survival-Genre verlangt viel Balancing-Feinschliff',
      'Ohne Koop-Freunde fehlt ein Teil des Reizes',
      'Wasser-Rendering und Physik kosten Performance-Budget',
    ],
    improvements: [
      'Erste Flutwelle als geskriptetes Lernerlebnis inszenieren',
      'Tier-Rettungen als emotionale Meilensteine hervorheben',
      'Springflut-Events mit Server-Bestenliste etablieren',
      'Wiederaufbau-Bonusrunde nach jeder Welle einführen',
    ],
    effort: { min: 'medium', typical: 'large' },
    multiplayer: 'optional',
    tags: ['base_building', 'coop', 'waves', 'crafting'],
  },
  {
    key: 'survival_night_swarm',
    genre: 'survival',
    fantasy:
      'Du sicherst {place} tagsüber Vorräte und Verteidigungen, denn nachts kriecht ein Schwarm aus den Schatten, der jede Lücke findet.',
    essence: 'Tag-Nacht-Spannung mit Verteidigungsbau',
    coreLoop: [
      'Bei Tageslicht sammeln und erkunden',
      'Barrikaden, Fallen und Lichtquellen bauen',
      'Nachtangriff abwehren und Schwachstellen erkennen',
      'Beute des Schwarms einsammeln und forschen',
      'Tiefere Gebiete mit besseren Ressourcen wagen',
    ],
    usp: 'Der Schwarm lernt: Er greift bevorzugt dort an, wo er letzte Nacht Erfolg hatte – Verteidigung ist ein Dialog, kein Rezept.',
    hook: 'Überlebende Nächte werden als Serie gezählt – lange Serien schalten Erzähler-Fragmente über die Herkunft des Schwarms frei.',
    twists: [
      'Der Clou: Licht ist Ressource und Waffe zugleich – wer zu hell baut, lockt größere Schwärme.',
      'Der Clou: Einzelne Schwarmtiere lassen sich zähmen und als Wächter einsetzen.',
      'Der Clou: Mondphasen verändern Stärke und Verhalten des Schwarms planbar.',
    ],
    monetization: [
      angle('game_passes', 'Der „Wächter“-Pass schaltet einen Baubereich für Speziallampen frei.'),
      angle('developer_products', 'Forschungs-Beschleuniger als wiederkaufbare Produkte.'),
      angle('cosmetics', 'Lampen-Designs, Barrikaden-Stile und Umhänge.'),
      angle('rewarded_ads', 'Optionale Werbung zeigt die Angriffsrichtung der kommenden Nacht.'),
      angle('iap_consumables', 'Fallen-Pakete und Reparatur-Kits in kleinen Stufen.'),
    ],
    risks: [
      risk(
        'Lern-KI wirkt unfair statt clever',
        'high',
        'Angriffs-Vorlieben des Schwarms sichtbar machen (Spuren, Markierungen) statt sie zu verstecken.',
      ),
      risk(
        'Nacht-Gameplay zu hektisch für die Zielgruppe',
        'medium',
        'Verteidigung vorbereitungslastig halten – nachts zählt Beobachten mehr als Klicken.',
      ),
      risk(
        'Grusel-Faktor kollidiert mit jungen Zielgruppen',
        'medium',
        'Schwarm stilisiert statt realistisch gestalten und Helligkeit-Optionen anbieten.',
      ),
    ],
    successReasons: [
      'Tag-Nacht-Wechsel gibt jeder Session einen klaren Spannungsbogen',
      'Lernender Gegner ist ein echtes Alleinstellungsmerkmal',
      'Zähmbare Schwarmtiere verbinden Survival mit Sammel-Motivation',
      'Serien-Zähler erzeugt starken „nur noch eine Nacht“-Sog',
    ],
    failReasons: [
      'Schwierigkeits-Spirale kann Neulinge nach Nacht drei verlieren',
      'KI-Verhalten ist teuer zu entwickeln und zu testen',
      'Horror-Anleihen begrenzen die jüngste Zielgruppe',
      'Ohne Koop kann die Nachtabwehr einsam und zäh wirken',
    ],
    improvements: [
      'Schwarm-Spuren als lesbares Vorwarnsystem ausbauen',
      'Zähmung als frühes Erfolgserlebnis in Nacht zwei platzieren',
      'Mondphasen-Kalender prominent ins HUD legen',
      'Koop-Schichtdienst: Freunde können eine Nacht Wache übernehmen',
    ],
    effort: { min: 'medium', typical: 'large' },
    multiplayer: 'optional',
    tags: ['waves', 'crafting', 'coop', 'tension'],
  },

  // --------------------------------------------------------------- roguelite
  {
    key: 'roguelite_vault_dash',
    genre: 'roguelite',
    fantasy:
      'Du stürzt dich {place} in ein Gewölbe aus wechselnden Kammern, sammelst mutierende Segnungen und kommst jedes Mal ein Stück weiter.',
    essence: 'schnelle Läufe mit mutierenden Boni',
    coreLoop: [
      'Lauf starten und Startbonus wählen',
      'Kammern räumen und Segnungen einsammeln',
      'Synergien zwischen Segnungen ausreizen',
      'Am Ende Essenz für dauerhafte Boni sichern',
      'Neue Kammertypen und Startklassen freischalten',
    ],
    usp: 'Segnungen mutieren beim Aufheben abhängig von dem, was du schon trägst – kein Lauf-Guide der Welt kann dir das vorrechnen.',
    hook: 'Der Todesbildschirm erzeugt eine teilbare „Lauf-DNA“, mit der Freunde exakt denselben Lauf nachspielen können.',
    twists: [
      'Der Clou: Jede dritte Kammer bietet einen Handel an: Segnung abgeben und dafür Raumwahl erhalten.',
      'Der Clou: Ein Rivale-Geist läuft parallel und klaut Segnungen, wenn man trödelt.',
      'Der Clou: Bosse übernehmen Mutationen aus deinem letzten gescheiterten Lauf.',
    ],
    monetization: [
      angle('game_passes', 'Der „Gewölbe“-Pass schaltet zwei zusätzliche Startklassen frei, balanciert seitwärts statt stärker.'),
      angle('developer_products', 'Wiederbelebungs-Anker als seltene, bewusst teure Verbrauchsprodukte.'),
      angle('cosmetics', 'Waffen-Skins, Todesanimationen und Lauf-Banner.'),
      angle('battle_pass', 'Saisonale Prüfungen mit kosmetischen Belohnungspfaden.'),
      angle('rewarded_ads', 'Optionale Werbung bietet nach dem Tod einen einmaligen Weiterlauf mit halber Energie.'),
      angle('iap_non_consumables', 'Einmalkauf „Kammer-Paket Tiefenerz“ mit neuen Raumtypen.'),
    ],
    risks: [
      risk(
        'Balancing der Mutationen läuft aus dem Ruder',
        'high',
        'Synergien datengetrieben überwachen und Ausreißer per Server-Config nachjustieren.',
      ),
      risk(
        'Läufe fühlen sich zu ähnlich an',
        'medium',
        'Kammer-Biome mit eigenen Regeln rotieren und tägliche Modifikatoren einführen.',
      ),
      risk(
        'Meta-Progression entwertet Können',
        'medium',
        'Dauerboni auf Komfort und Vielfalt begrenzen, nicht auf rohe Stärke.',
      ),
    ],
    successReasons: [
      'Kurze Läufe passen perfekt zu mobilen Sessions',
      'Mutations-System erzeugt Gesprächsstoff und Theorycrafting',
      'Lauf-DNA ist ein eingebauter Viral-Mechanismus',
      'Genre-Fans sind treu und geben gutem Balancing eine Chance',
    ],
    failReasons: [
      'Roguelite-Markt ist voll mit polierten Vorbildern',
      'Schwaches Kampfgefühl killt die Wiederspielmotivation sofort',
      'Mutations-Kombinatorik ist teuer zu testen',
      'Zu harte Anfangsläufe schrecken Casuals ab',
    ],
    improvements: [
      'Ersten Sieg über Startboss in Lauf eins bis drei kalibrieren',
      'Tägliche Herausforderung mit fixem Seed einführen',
      'Rivale-Geist optional zuschaltbar machen',
      'Segnungs-Lexikon mit Fundorten als Sammelziel ergänzen',
    ],
    effort: { min: 'small', typical: 'medium' },
    multiplayer: 'optional',
    tags: ['runs', 'builds', 'replayability', 'combat'],
  },
  {
    key: 'roguelite_gadget_decks',
    genre: 'roguelite',
    fantasy:
      'Du testest {place} als Feld-Erfinderin oder Feld-Erfinder verrückte Gadget-Sets: Jeder Einsatz mischt deine Ausrüstung neu.',
    essence: 'improvisierte Gadget-Kombos',
    coreLoop: [
      'Einsatz mit zufälligem Gadget-Set beginnen',
      'Hindernisse mit Gadget-Kombos überwinden',
      'Bauteile bergen und Gadgets im Feld modifizieren',
      'Einsatzziel erfüllen und Prototypen sichern',
      'Werkstatt ausbauen und Gadget-Pool erweitern',
    ],
    usp: 'Nicht du wirst stärker, dein Erfindergeist wird es: Der Gadget-Pool wächst, aber jedes Set bleibt eine Improvisationsaufgabe.',
    hook: 'Die kuriosesten Gadget-Kombos der Woche werden im „Erfinderjournal“ des Servers mit Namen verewigt.',
    twists: [
      'Der Clou: Gadgets haben Fehlfunktionen, die sich als Geheimtechniken entpuppen.',
      'Der Clou: Zwei beliebige Gadgets lassen sich einmal pro Einsatz zusammenschweißen.',
      'Der Clou: Das Einsatzgebiet reagiert auf Lärm – laute Gadgets wecken Wächter.',
    ],
    monetization: [
      angle('game_passes', 'Der „Patentamt“-Pass schaltet die Werkbank für kosmetische Gadget-Lackierungen frei.'),
      angle('developer_products', 'Einsatz-Lizenzen für Bonus-Missionen als Verbrauchsprodukte.'),
      angle('cosmetics', 'Gadget-Skins, Werkstatt-Deko und Erfinder-Outfits.'),
      angle('rewarded_ads', 'Optionale Werbung erlaubt einen Neuwurf des Start-Sets.'),
      angle('iap_consumables', 'Bauteil-Kisten in kleinen, klar beschrifteten Stufen.'),
    ],
    risks: [
      risk(
        'Zufalls-Sets fühlen sich unfair an',
        'high',
        'Jedes Set gegen Lösbarkeits-Regeln generieren: mindestens ein Bewegungs-, ein Interaktions-Gadget.',
      ),
      risk(
        'Gadget-Entwicklung frisst Content-Budget',
        'medium',
        'Wenige Gadgets mit vielen Modifikator-Ebenen statt vieler Einweg-Gadgets.',
      ),
      risk(
        'Physik-Interaktionen destabilisieren sich gegenseitig',
        'medium',
        'Kombinationsmatrix automatisiert testen und Chaos-Fälle als Features kennzeichnen.',
      ),
    ],
    successReasons: [
      'Improvisation erzeugt einzigartige, erzählbare Momente',
      'Fehlfunktions-Design macht selbst Bugs zu Verkaufsargumenten',
      'Werkstatt-Meta gibt Langzeitspielern ein Zuhause',
      'Klare Abgrenzung von kampflastigen Genre-Kollegen',
    ],
    failReasons: [
      'Ohne präzises Feedback wirken Kombos wie Zufall',
      'Lösbarkeits-Garantien sind schwer wasserdicht zu bauen',
      'Puzzle-Fans und Action-Fans erwarten Unterschiedliches',
      'Der Erklärungsbedarf im Store ist hoch',
    ],
    improvements: [
      'Zusammenschweißen-Moment als Kern-Feature ins Tutorial ziehen',
      'Wochen-Einsatz mit festem Set für faire Vergleiche einführen',
      'Erfinderjournal um Replay-Ansicht erweitern',
      'Lärm-System mit sichtbaren Schallwellen lesbar machen',
    ],
    effort: { min: 'small', typical: 'medium' },
    multiplayer: 'optional',
    tags: ['runs', 'gadgets', 'physics', 'replayability'],
  },

  // -------------------------------------------------------------------- idle
  {
    key: 'idle_expedition_teams',
    genre: 'idle',
    fantasy:
      'Du leitest {place} eine Expeditionszentrale: Teams ziehen selbstständig los, du planst Routen, Ausrüstung und wann ein Neuanfang lohnt.',
    essence: 'Planungs-Idle mit Prestige-Reisen',
    coreLoop: [
      'Teams zusammenstellen und ausrüsten',
      'Expeditionen auf Routen mit Risikoprofil schicken',
      'Funde sichten und Zentrale ausbauen',
      'Routen mit Erkenntnissen effizienter machen',
      'Prestige-Neustart mit dauerhaften Kartenboni',
    ],
    usp: 'Offline-Zeit ist keine Wartezeit, sondern Erzählzeit: Expeditionen kommen mit illustrierten Reiseberichten zurück.',
    hook: 'Seltene Funde tragen den Namen ihres Entdeckers und tauchen in den Reiseberichten anderer Spieler auf.',
    twists: [
      'Der Clou: Teams entwickeln Persönlichkeiten und weigern sich, mit zerstrittenen Kollegen zu reisen.',
      'Der Clou: Jede Karte hat weiße Flecken, die nur nach echten Offline-Stunden erkundbar sind.',
      'Der Clou: Fehlgeschlagene Expeditionen hinterlassen Wracks, die spätere Teams bergen können.',
    ],
    monetization: [
      angle('game_passes', 'Der „Kartograf“-Pass schaltet ein viertes Expeditionsteam frei.'),
      angle('developer_products', 'Proviant-Kisten als wiederkaufbare Expeditions-Booster.'),
      angle('cosmetics', 'Zentrale-Deko, Team-Uniformen und Berichts-Rahmen.'),
      angle('rewarded_ads', 'Optionale Werbung verdoppelt den Ertrag der letzten Rückkehr.'),
      angle('iap_non_consumables', 'Einmalkauf „Archivflügel“ mit dauerhafter Berichte-Galerie.'),
      angle('subscription', 'Ein Forscherclub-Abo bündelt tägliche Kartenhinweise und exklusive Rahmen.'),
    ],
    risks: [
      risk(
        'Zahlenrauschen ohne Gefühl',
        'medium',
        'Reiseberichte und Persönlichkeiten in den Mittelpunkt stellen, Zahlen in die zweite Ebene.',
      ),
      risk(
        'Prestige-Timing unverständlich',
        'medium',
        'Neustart-Empfehlung mit klarer Vorher-Nachher-Vorschau anbieten.',
      ),
      risk(
        'Offline-Mechanik lädt zu Uhrzeit-Tricks ein',
        'low',
        'Serverzeit als einzige Wahrheit; lokale Uhr nur für Anzeige.',
      ),
    ],
    successReasons: [
      'Idle-Kern mit erzählerischer Belohnung hebt sich vom Genre ab',
      'Team-Persönlichkeiten machen aus Zahlen Figuren',
      'Prestige-Kartenboni geben Neustarts echten Sinn',
      'Sehr niedrige Einstiegshürde, ideal für breite Zielgruppen',
    ],
    failReasons: [
      'Idle-Markt ist gnadenlos umkämpft',
      'Berichte-Content muss lange frisch bleiben',
      'Zu passives Design lässt Sessions unter eine Minute fallen',
      'Ohne visuelle Identität austauschbar',
    ],
    improvements: [
      'Ersten illustrierten Reisebericht nach fünf Minuten liefern',
      'Zerstrittene-Teams-Drama als wiederkehrendes Event nutzen',
      'Wrack-Bergungen als Community-Ziele aufziehen',
      'Prestige-Vorschau direkt an den Neustart-Knopf koppeln',
    ],
    effort: { min: 'tiny', typical: 'small' },
    multiplayer: 'optional',
    tags: ['idle', 'offline_progress', 'collection', 'prestige'],
  },
  {
    key: 'idle_symbiosis_garden',
    genre: 'idle',
    fantasy:
      'Du kultivierst {place} einen Garten, in dem Pflanzen einander verstärken: Die richtige Nachbarschaft ist wertvoller als jeder Dünger.',
    essence: 'Nachbarschafts-Synergien statt Klickzwang',
    coreLoop: [
      'Samen setzen und Wachstum beobachten',
      'Synergie-Paare entdecken und dokumentieren',
      'Beete umplanen für stärkere Kreisläufe',
      'Erträge ernten und neue Arten erforschen',
      'Gartenareale erweitern und Prestige-Samen ziehen',
    ],
    usp: 'Der Fortschritt steckt im Layout: Ein kluger Garten produziert exponentiell, ein wilder nur linear – ganz ohne Hektik.',
    hook: 'Die schönsten Symbiose-Gärten erscheinen als begehbare Schaugärten für andere Spieler mit Trinkgeld-Funktion.',
    twists: [
      'Der Clou: Nachtaktive Pflanzen bilden einen zweiten, versteckten Garten in denselben Beeten.',
      'Der Clou: Bestäuber-Insekten wandern zwischen Gärten befreundeter Spieler.',
      'Der Clou: Manche Arten gedeihen nur, wenn man sie bewusst vernachlässigt.',
    ],
    monetization: [
      angle('game_passes', 'Der „Botanik“-Pass schaltet das Gewächshaus für Klima-Experimente frei.'),
      angle('developer_products', 'Saatgut-Raritäten als gelegentliche Kaufoption mit klarer Anzeige.'),
      angle('cosmetics', 'Beet-Einfassungen, Wege und Deko-Statuen.'),
      angle('rewarded_ads', 'Optionale Werbung lässt eine Pflanze sofort eine Wachstumsstufe überspringen.'),
      angle('iap_non_consumables', 'Einmalkauf „Terrassen-Erweiterung“ mit dauerhaftem Areal.'),
    ],
    risks: [
      risk(
        'Synergie-System zu opak',
        'medium',
        'Entdeckte Paare automatisch im Gartenbuch festhalten und Wirkung visualisieren.',
      ),
      risk(
        'Zu wenig Handlungsdruck lässt Spieler abwandern',
        'medium',
        'Tägliche Blüh-Fenster und saisonale Arten als sanfte Rückkehr-Anker.',
      ),
      risk(
        'Deko und Funktion konkurrieren ums Raster',
        'low',
        'Deko-Ebene vom Funktions-Raster entkoppeln.',
      ),
    ],
    successReasons: [
      'Entspannter Kern mit echter Denk-Tiefe ist selten im Idle-Genre',
      'Schaugärten erzeugen organische soziale Bindung',
      'Layout-Puzzle motiviert Optimierer über Monate',
      'Sehr gut für kurze Mobile-Sessions geeignet',
    ],
    failReasons: [
      'Wirkt auf Screenshots leicht ereignislos',
      'Synergie-Balancing ist verstecktes Schwergewicht',
      'Zu langsamer Start kann die ersten zehn Minuten kosten',
      'Kern-Zielgruppe ist leise und schwer zu bewerben',
    ],
    improvements: [
      'Erste Synergie-Entdeckung ins Tutorial legen',
      'Nachtgarten als Überraschungsmoment in Session zwei enthüllen',
      'Gartenbuch mit Sammel-Fortschritt prominent machen',
      'Freundes-Bestäuber mit kleinen Geschenken verknüpfen',
    ],
    effort: { min: 'small', typical: 'small' },
    multiplayer: 'optional',
    tags: ['idle', 'cozy', 'optimization', 'prestige', 'social'],
  },

  // ------------------------------------------------------------- hypercasual
  {
    key: 'hypercasual_one_tap_stack',
    genre: 'hypercasual',
    fantasy:
      'Du stapelst {place} mit einem einzigen Fingertipp schwebende Segmente zu einem immer kühneren Turm – ein Tick zu früh, und alles wackelt.',
    essence: 'ein perfektes Timing-Gefühl',
    coreLoop: [
      'Segment im richtigen Moment stoppen',
      'Perfekt-Treffer zu Combos verketten',
      'Höhenrekord jagen und Münzen sammeln',
      'Neue Segment-Stile freischalten',
      'Tages-Challenge mit Sonderregel spielen',
    ],
    usp: 'Perfekte Treffer verbreitern den Turm wieder – wer im Rhythmus bleibt, erlebt einen sichtbaren Flow-Rausch.',
    hook: 'Jeder Rekord erzeugt ein Mini-Video des finalen Wackel-Moments, perfekt zum Teilen.',
    twists: [
      'Der Clou: Ab Stufe 50 dreht sich die Kamera langsam – das Timing wandert mit.',
      'Der Clou: Windböen kündigen sich akustisch an, nicht visuell.',
      'Der Clou: Ein Bonus-Segment pro Runde ist aus Glas und zählt doppelt, bricht aber bei Fast-Treffern.',
    ],
    monetization: [
      angle('rewarded_ads', 'Optionale Werbung gewährt einen Weiterbau nach dem ersten Absturz.'),
      angle('interstitial_ads', 'Interstitials höchstens alle drei Runden, nie nach Rekorden.'),
      angle('iap_non_consumables', 'Einmalkauf „Werbefrei“ zum kleinen Festpreis.'),
      angle('cosmetics', 'Segment-Designs und Hintergrund-Stimmungen.'),
      angle('game_passes', 'Der „Baukran“-Pass schaltet den Zen-Modus ohne Absturz frei.'),
      angle('developer_products', 'Tages-Challenge-Wiederholungen als Kleinstprodukt.'),
    ],
    risks: [
      risk(
        'Kurzlebigkeit nach wenigen Tagen',
        'high',
        'Tages-Challenges mit Sonderregeln und wöchentliche Stil-Drops einplanen.',
      ),
      risk(
        'Werbedruck zerstört den Flow',
        'medium',
        'Harte Frequenz-Deckel und niemals Werbung nach Bestleistungen.',
      ),
      risk(
        'Klon-Gefahr durch simple Mechanik',
        'medium',
        'Signature-Elemente (Kameradrehung, Glas-Segment) früh etablieren und markant gestalten.',
      ),
    ],
    successReasons: [
      'Sofort verständlich – ideale Conversion aus Store-Videos',
      'Sehr geringe Produktionskosten und schnelle Iteration',
      'Flow-Mechanik erzeugt echte „eine Runde noch“-Momente',
      'Rekord-Clips sind eingebautes Marketing',
    ],
    failReasons: [
      'Ohne UA-Budget kaum organische Sichtbarkeit',
      'Retention über Tag 7 ist im Genre notorisch schwach',
      'Werbe-Monetarisierung braucht hohe Nutzerzahlen',
      'Mechanik ist in Tagen kopierbar',
    ],
    improvements: [
      'Zen-Modus als entspannte Zweitschleife ergänzen',
      'Wackel-Video-Export mit einem Tipp teilen lassen',
      'Wochenrangliste mit Freundesfokus statt globaler Liste',
      'Haptisches Feedback für Perfekt-Treffer feintunen',
    ],
    effort: { min: 'tiny', typical: 'tiny' },
    multiplayer: 'optional',
    tags: ['one_touch', 'short_sessions', 'flow', 'score_chase'],
  },
  {
    key: 'hypercasual_crowd_swipe',
    genre: 'hypercasual',
    fantasy:
      'Du lotst {place} eine wuselnde Schar per Wischgeste durch Engstellen, Tore und Fallen – je größer die Gruppe, desto schwerer die Kurven.',
    essence: 'wachsende Schwarm-Dynamik',
    coreLoop: [
      'Schar durch Multiplikator-Tore steuern',
      'Hindernissen ausweichen und Nachzügler retten',
      'Level-Finale mit Masse-Bonus abschließen',
      'Neue Streckentypen freischalten',
      'Tägliche Sonderstrecke meistern',
    ],
    usp: 'Die Schar ist physisch: Sie staut sich, quetscht sich und flutet Engstellen – Masse ist Taktik, nicht nur Anzeige.',
    hook: 'Am Ziel formt die Schar ein Bild aus allen Überlebenden – je voller, desto spektakulärer der Schlussmoment.',
    twists: [
      'Der Clou: Manche Tore teilen die Schar in zwei Wege, die man parallel im Blick behalten muss.',
      'Der Clou: Gerettete Nachzügler folgen dir als Glücksbringer in die nächsten Level.',
      'Der Clou: Im Finale zählt nicht nur Masse, sondern die Formation der Schar.',
    ],
    monetization: [
      angle('rewarded_ads', 'Optionale Werbung startet das Level mit doppelter Startschar.'),
      angle('interstitial_ads', 'Interstitials nur zwischen Welten, mit klarer Ankündigung.'),
      angle('iap_non_consumables', 'Einmalkauf „Werbefrei plus Bonuswelt“.'),
      angle('cosmetics', 'Schar-Farben, Hüte und Ziel-Feuerwerke.'),
      angle('developer_products', 'Sonderstrecken-Tickets als Kleinstprodukte.'),
    ],
    risks: [
      risk(
        'Performance bei großen Scharen',
        'high',
        'Instanzen ab Schwellwert visuell klumpen und Logik auf Gruppenebene rechnen.',
      ),
      risk(
        'Level-Content nutzt sich schnell ab',
        'medium',
        'Strecken aus geprüften Bausteinen prozedural mischen.',
      ),
      risk(
        'Zu simpel für Langzeitbindung',
        'medium',
        'Formations-Finale als Skill-Ebene für Fortgeschrittene ausbauen.',
      ),
    ],
    successReasons: [
      'Masse-Wachstum ist visuell sofort belohnend',
      'Wischsteuerung funktioniert blind auf jedem Gerät',
      'Schlussbild-Moment ist ein natürlicher Share-Trigger',
      'Prozedurale Strecken halten die Kosten niedrig',
    ],
    failReasons: [
      'Genre lebt und stirbt mit Werbe-Ökonomie',
      'Geringe Alleinstellung ohne die Physik-Schar',
      'Tag-30-Retention strukturell schwach',
      'Technik-Risiko bei schwachen Geräten',
    ],
    improvements: [
      'Nachzügler-Glücksbringer als Sammelsystem ausbauen',
      'Formations-Bewertung mit Sternen einführen',
      'Wochen-Welt mit eigenem Streckenthema etablieren',
      'Geräte-Benchmark beim Start für stabile Bildrate nutzen',
    ],
    effort: { min: 'tiny', typical: 'small' },
    multiplayer: 'optional',
    tags: ['crowd', 'short_sessions', 'one_touch', 'physics'],
  },

  // ------------------------------------------------------------ hybridcasual
  {
    key: 'hybridcasual_runner_base',
    genre: 'hybridcasual',
    fantasy:
      'Du sammelst {place} im Lauf Ressourcen ein und baust damit zwischen den Läufen eine Basis, die jeden weiteren Lauf stärker macht.',
    essence: 'die Doppelschleife aus Lauf und Basis',
    coreLoop: [
      'Lauf starten und Ressourcen einsammeln',
      'Hindernisse meistern und Abzweigungen wählen',
      'Beute in Basis-Ausbauten investieren',
      'Neue Laufstrecken durch Gebäude freischalten',
      'Meilenstein-Aufträge für Extra-Boni erfüllen',
    ],
    usp: 'Jedes Gebäude verändert den Lauf spürbar: Die Basis ist kein Menü, sondern die Werkbank deiner Strecke.',
    hook: 'Freunde können deine Basis besuchen und dort einen Gast-Lauf mit deinen Boni absolvieren – Bestzeiten inklusive.',
    twists: [
      'Der Clou: Abzweigungen im Lauf entsprechen Gebäuden – wer die Bäckerei baut, öffnet den Ofen-Tunnel.',
      'Der Clou: Ein Rückweg-Modus lässt dich eingesammelte Fracht heil nach Hause bringen.',
      'Der Clou: Basis-Bewohner feuern dich im Lauf an und werfen Hilfsgegenstände.',
    ],
    monetization: [
      angle('rewarded_ads', 'Optionale Werbung verdoppelt die Fracht eines abgeschlossenen Laufs.'),
      angle('iap_consumables', 'Baustoff-Pakete in kleinen, klaren Stufen.'),
      angle('battle_pass', 'Saison-Pass mit Streckenkosmetik und Basis-Deko.'),
      angle('cosmetics', 'Lauf-Outfits, Trails und Gebäude-Stile.'),
      angle('game_passes', 'Der „Stadtplaner“-Pass schaltet einen zweiten Bauplatz-Ring frei.'),
      angle('developer_products', 'Expresslieferungen für Bauprojekte als Verbrauchsprodukte.'),
    ],
    risks: [
      risk(
        'Zwei Schleifen verdoppeln die Tuning-Arbeit',
        'high',
        'Ressourcen-Fluss zwischen Lauf und Basis mit einem einzigen Wechselkurs starten.',
      ),
      risk(
        'Basis verkommt zum Zahlenmenü',
        'medium',
        'Jedes Gebäude muss einen sichtbaren Effekt im Lauf haben – sonst wird es gestrichen.',
      ),
      risk(
        'Frühphase zu grindig',
        'medium',
        'Erste drei Gebäude in den ersten drei Läufen garantieren.',
      ),
    ],
    successReasons: [
      'Hybrid-Modelle zeigen die beste Retention im Casual-Markt',
      'Lauf-Feedback plus Bau-Fortschritt bedient zwei Motivationen',
      'Gast-Läufe erzeugen soziale Verbindlichkeit',
      'Klar planbare Content-Roadmap über Gebäude',
    ],
    failReasons: [
      'Konkurrenz durch stark finanzierte Marktführer',
      'Unausgewogene Ökonomie zerstört beide Schleifen zugleich',
      'Zu viel Meta erschlägt die Kern-Zielgruppe',
      'Werbeabhängigkeit bei schwachen IAP-Werten',
    ],
    improvements: [
      'Ofen-Tunnel-Moment (Gebäude öffnet Strecke) ins Tutorial legen',
      'Rückweg-Modus als riskante Bonus-Option ausbauen',
      'Wochen-Aufträge mit Nachbarschafts-Zielen ergänzen',
      'Basis-Bewohner mit Sammelkarten-Charme ausstatten',
    ],
    effort: { min: 'small', typical: 'medium' },
    multiplayer: 'optional',
    tags: ['runner_meta', 'base_building', 'progression', 'social'],
  },
  {
    key: 'hybridcasual_merge_squad',
    genre: 'hybridcasual',
    fantasy:
      'Du fusionierst {place} kleine Helfer zu immer stärkeren Einheiten und schickst sie in knackige Auto-Gefechte gegen anrückende Wellen.',
    essence: 'Merge-Vorbereitung und Wellen-Bewährung',
    coreLoop: [
      'Helfer auf dem Brett zusammenführen',
      'Squad für die nächste Welle positionieren',
      'Gefecht beobachten und Schwächen notieren',
      'Belohnungen einsammeln und Brett erweitern',
      'Neue Helfer-Klassen und Bosswellen freischalten',
    ],
    usp: 'Positionierung schlägt Stufenhöhe: Ein cleveres Squad aus Stufe-3-Helfern schlägt stumpfe Stufe-5-Kolosse.',
    hook: 'Nach Bosswellen erhält dein bestes Squad eine teilbare Aufstellungs-Karte, die Freunde herausfordern können.',
    twists: [
      'Der Clou: Fehlfusionen erzeugen skurrile Hybrid-Helfer mit Überraschungsfähigkeiten.',
      'Der Clou: Das Merge-Brett ist gleichzeitig das Schlachtfeld – wo du baust, kämpfst du.',
      'Der Clou: Gegnerwellen spiegeln dein eigenes Squad von vor drei Runden.',
    ],
    monetization: [
      angle('rewarded_ads', 'Optionale Werbung liefert einen zusätzlichen Start-Helfer pro Sitzung.'),
      angle('iap_consumables', 'Helfer-Kisten mit transparenter Inhaltsliste.'),
      angle('battle_pass', 'Saison-Pass mit kosmetischen Helfer-Familien.'),
      angle('cosmetics', 'Brett-Themen und Helfer-Skins.'),
      angle('game_passes', 'Der „Kommandant“-Pass schaltet die Aufstellungs-Bibliothek frei.'),
    ],
    risks: [
      risk(
        'Auto-Kampf wirkt einflusslos',
        'high',
        'Positionierung, Timing der Fähigkeiten und Terrain sichtbar entscheidend machen.',
      ),
      risk(
        'Merge-Grind ermüdet',
        'medium',
        'Fehlfusionen und Spiegelwellen als Überraschungs-Taktgeber einsetzen.',
      ),
      risk(
        'Komplexität wächst schleichend',
        'medium',
        'Pro Woche maximal ein neues System, altes zuerst polieren.',
      ),
    ],
    successReasons: [
      'Merge und Auto-Battle sind einzeln bewährt, kombiniert differenzierend',
      'Aufstellungs-Karten erzeugen soziale Wettkampf-Schleifen',
      'Sehr gute Werbeplatz-Integration ohne Flow-Bruch',
      'Brett-gleich-Schlachtfeld ist ein klarer USP',
    ],
    failReasons: [
      'Balancing-Fehler werden sofort als Pay-to-win gelesen',
      'Genre-Kenner erwarten hohes Tuning-Niveau',
      'Spiegelwellen können frustrieren statt motivieren',
      'Content-Bedarf an Helfer-Klassen ist hoch',
    ],
    improvements: [
      'Erste Fehlfusion als geplantes Aha-Erlebnis skripten',
      'Terrain-Felder mit taktischen Boni einführen',
      'Freundes-Herausforderungen mit Revanche-Knopf verketten',
      'Wellen-Vorschau mit Bedrohungs-Symbolen ergänzen',
    ],
    effort: { min: 'small', typical: 'medium' },
    multiplayer: 'optional',
    tags: ['merge', 'combat', 'progression', 'strategy'],
  },

  // ------------------------------------------------------------------ puzzle
  {
    key: 'puzzle_light_paths',
    genre: 'puzzle',
    fantasy:
      'Du lenkst {place} Lichtstrahlen mit Spiegeln, Prismen und Linsen durch verwinkelte Räume, bis jede Blüte aus Licht erblüht.',
    essence: 'meditatives Licht-Knobeln',
    coreLoop: [
      'Raum betreten und Lichtquellen sichten',
      'Spiegel und Prismen platzieren und drehen',
      'Strahlen teilen, färben und bündeln',
      'Alle Ziele gleichzeitig erleuchten',
      'Sterne sammeln und neue Optik-Bauteile freischalten',
    ],
    usp: 'Licht verhält sich physikalisch ehrlich – Lösungen fühlen sich entdeckt an, nicht erraten.',
    hook: 'Gelöste Räume bleiben als leuchtende Galerie begehbar – dein Fortschritt ist ein wachsendes Lichtkunstwerk.',
    twists: [
      'Der Clou: Farbmischung ist Teil der Lösung – zwei Strahlen ergeben eine dritte Antwort.',
      'Der Clou: Manche Wände sind Vorhänge, die Licht dämpfen statt blocken.',
      'Der Clou: In Spätleveln wirfst du selbst einen Schatten, der Strahlen blockiert.',
    ],
    monetization: [
      angle('iap_non_consumables', 'Einmalkauf-Kapitel mit je 20 handgebauten Räumen.'),
      angle('rewarded_ads', 'Optionale Werbung schaltet einen sanften Hinweis frei.'),
      angle('paid_app', 'Alternativ als faire Premium-App ohne Werbung.'),
      angle('cosmetics', 'Strahlfarben-Paletten und Galerie-Rahmen.'),
      angle('game_passes', 'Der „Optiker“-Pass schaltet den Baukasten für eigene Räume frei.'),
      angle('developer_products', 'Hinweis-Pakete als bewusst kleine Verbrauchsprodukte.'),
    ],
    risks: [
      risk(
        'Schwierigkeitskurve springt',
        'medium',
        'Jedes neue Bauteil bekommt drei Lern-Level vor der ersten Kombination.',
      ),
      risk(
        'Hinweissystem untergräbt Stolz',
        'low',
        'Hinweise zeigen Richtungen, nie Platzierungen.',
      ),
      risk(
        'Geringe Viralität leiser Puzzles',
        'medium',
        'Galerie-Momente und Foto-Export als Share-Anker gestalten.',
      ),
    ],
    successReasons: [
      'Zeitlose Mechanik mit hoher wahrgenommener Eleganz',
      'Premium-Publikum zahlt für werbefreie Qualität',
      'Galerie-Meta gibt Fortschritt emotionale Bedeutung',
      'Sehr planbarer, modularer Content-Ausbau',
    ],
    failReasons: [
      'Puzzle-Charts sind schwer zu knacken',
      'Level-Design von Hand ist zeitintensiv',
      'Ohne Sog-Mechanik kurze Spielzeit pro Tag',
      'Physik-Edge-Cases können Lösungen brechen',
    ],
    improvements: [
      'Community-Baukasten mit kuratierter Wochenauswahl ergänzen',
      'Farbmischung früher einführen und feiern',
      'Tages-Raum mit weltweit gleicher Lösung etablieren',
      'Sanfte Umgebungsgeräusche als Fokus-Feature ausbauen',
    ],
    effort: { min: 'tiny', typical: 'small' },
    multiplayer: 'solo',
    tags: ['logic', 'relaxing', 'levels', 'physics'],
  },
  {
    key: 'puzzle_gravity_rooms',
    genre: 'puzzle',
    fantasy:
      'Du kippst {place} ganze Räume: Die Schwerkraft folgt deiner Drehung, und alles Lose rollt, rutscht und stapelt sich neu.',
    essence: 'Raumdrehung als einziges Werkzeug',
    coreLoop: [
      'Raum analysieren und Drehung planen',
      'Raum kippen und Objekte rollen lassen',
      'Schalter, Türen und Zielzonen kombinieren',
      'Mit minimalen Drehungen die Bestlösung finden',
      'Neue Raumtypen und Objektarten freischalten',
    ],
    usp: 'Eine einzige Geste – drehen – erzeugt endlose Tiefe: Der Raum ist das Puzzle, nicht die Objekte.',
    hook: 'Die Drehungs-Bestwerte aller Spieler erscheinen als dezente Sternenkarte über jedem gelösten Raum.',
    twists: [
      'Der Clou: Zerbrechliche Objekte überstehen nur weiche Landungen auf anderen Objekten.',
      'Der Clou: Manche Räume enthalten einen zweiten, verschachtelten Mini-Raum mit eigener Schwerkraft.',
      'Der Clou: Wasser bleibt bei Drehungen träge und schwappt zeitversetzt hinterher.',
    ],
    monetization: [
      angle('iap_non_consumables', 'Kapitel-Pakete als dauerhafte Einmalkäufe.'),
      angle('rewarded_ads', 'Optionale Werbung zeigt die erste Drehung der Bestlösung.'),
      angle('cosmetics', 'Raum-Materialien und Objekt-Themen.'),
      angle('game_passes', 'Der „Architekt“-Pass schaltet den Spiegelmodus mit Bonus-Sternen frei.'),
      angle('developer_products', 'Hinweis-Kontingente als kleine Verbrauchsprodukte.'),
    ],
    risks: [
      risk(
        'Physik-Determinismus wackelt',
        'high',
        'Feste Physik-Schrittweite und aufgezeichnete Referenzlösungen als Regressionstests.',
      ),
      risk(
        'Motion-Sickness bei Drehungen',
        'medium',
        'Drehungen kurz halten, Horizontlinie stabilisieren, Komfort-Optionen anbieten.',
      ),
      risk(
        'Bestwert-Jagd bleibt Nische',
        'low',
        'Sternenkarte dezent halten; Kern bleibt das Lösen, nicht das Optimieren.',
      ),
    ],
    successReasons: [
      'Griffige Ein-Gesten-Mechanik mit hohem Aha-Faktor',
      'Trailer-Momente entstehen von selbst (alles rollt)',
      'Klare Erweiterbarkeit über Objekt- und Raumtypen',
      'Skill-Ausdruck über Minimal-Drehungen für Kenner',
    ],
    failReasons: [
      'Physik-Bugs zerstören Puzzle-Vertrauen unmittelbar',
      'Handgebaute Räume skalieren teuer',
      'Zu clevere Räume überfordern die breite Masse',
      'Geringe Session-Länge drückt Werbe-Erlöse',
    ],
    improvements: [
      'Verschachtelte Räume als Kapitel-Finale inszenieren',
      'Replay-Geist der eigenen ersten Lösung anzeigen',
      'Wasser-Räume als eigenes Kapitel bündeln',
      'Fotomodus für kuriose Endstapel einbauen',
    ],
    effort: { min: 'small', typical: 'small' },
    multiplayer: 'solo',
    tags: ['physics', 'logic', 'levels', 'minimalism'],
  },

  // ------------------------------------------------------------ tower_defense
  {
    key: 'td_path_diggers',
    genre: 'tower_defense',
    fantasy:
      'Du gräbst {place} den Pfad der Angreifer selbst: Wer klug schaufelt, verwandelt jede Welle in einen Spießrutenlauf durch die eigenen Türme.',
    essence: 'selbstgebaute Gegnerwege',
    coreLoop: [
      'Gelände sondieren und Pfad vorgraben',
      'Türme entlang der Engstellen setzen',
      'Welle abwehren und Verhalten studieren',
      'Pfad umgraben und Layout verfeinern',
      'Neue Turm- und Bodentypen freischalten',
    ],
    usp: 'Das Terrain ist deine stärkste Waffe: Der Pfad gehört dir, nicht der Karte.',
    hook: 'Die effizientesten Labyrinthe der Woche werden als Blaupausen geteilt – mit Namensnennung der Erbauer.',
    twists: [
      'Der Clou: Manche Gegner graben zurück und legen Abkürzungen, die du versiegeln musst.',
      'Der Clou: Unterirdische Wasseradern geben Türmen Boni, wenn der Pfad sie freilegt.',
      'Der Clou: Der Aushub ist Baumaterial – wer gräbt, kann auch Mauern türmen.',
    ],
    monetization: [
      angle('game_passes', 'Der „Vorarbeiter“-Pass schaltet Blaupausen-Speicher und Statistik frei.'),
      angle('developer_products', 'Spezialwellen-Tickets für Bonus-Belohnungen.'),
      angle('cosmetics', 'Turm-Skins, Schaufel-Designs und Bodentexturen.'),
      angle('battle_pass', 'Saison-Pass mit kosmetischen Turm-Familien.'),
      angle('rewarded_ads', 'Optionale Werbung gewährt eine Wellen-Vorschau mit Gegnerliste.'),
      angle('iap_consumables', 'Notfall-Barrikaden als kleine Verbrauchsprodukte.'),
    ],
    risks: [
      risk(
        'Dominante Einheitslösungen (ein Labyrinth für alles)',
        'high',
        'Gegner mit Weg-Präferenzen und grabende Einheiten als Meta-Brecher rotieren.',
      ),
      risk(
        'Umgraben zu träge im Gefecht',
        'medium',
        'Grab-Aktionen zwischen Wellen kostenlos, im Gefecht teuer aber möglich.',
      ),
      risk(
        'Einstieg komplexer als klassisches TD',
        'medium',
        'Erste Karten mit vorgegrabenen Teilpfaden als sanfte Rampe.',
      ),
    ],
    successReasons: [
      'Pfad-Bau verleiht dem TD-Genre echte kreative Autorschaft',
      'Blaupausen-Teilen erzeugt Community-Wissen und Bindung',
      'Terrain-Twists halten die Meta über Monate in Bewegung',
      'Koop-Graben ist ein natürlicher Mehrspieler-Anker',
    ],
    failReasons: [
      'Balance zwischen Freiheit und Herausforderung ist heikel',
      'Pathfinding-Technik muss absolut robust sein',
      'TD-Kenner vergleichen mit sehr polierten Klassikern',
      'Zu viel Freiheit kann Anfänger lähmen',
    ],
    improvements: [
      'Aushub-zu-Mauer-Mechanik ins Kern-Tutorial holen',
      'Wochenkarte mit fixem Terrain für faire Ranglisten',
      'Rückgrabende Gegner mit klarer Warn-Telegrafie versehen',
      'Koop-Modus mit getrennten Grab- und Turm-Rollen testen',
    ],
    effort: { min: 'small', typical: 'medium' },
    multiplayer: 'optional',
    tags: ['strategy', 'waves', 'building', 'coop'],
  },
  {
    key: 'td_beast_keepers',
    genre: 'tower_defense',
    fantasy:
      'Du verteidigst {place} mit dressierten Wächter-Tieren statt Türmen: Jedes Tier hat Vorlieben, Launen und ein eigenes Entwicklungs-Potenzial.',
    essence: 'lebende Türme mit Persönlichkeit',
    coreLoop: [
      'Wächter-Tiere platzieren und füttern',
      'Wellen abwehren und Tier-Erfahrung sammeln',
      'Tiere entwickeln und Spezialisierungen wählen',
      'Team-Synergien zwischen Arten ausreizen',
      'Neue Arten zähmen und Gehege ausbauen',
    ],
    usp: 'Deine Verteidigung altert, lernt und entwickelt Marotten – ein Turm-Roster wie ein Lieblingsteam.',
    hook: 'Veteranen-Tiere mit hundert überstandenen Wellen bekommen Ehrentafeln, die Besucher bestaunen können.',
    twists: [
      'Der Clou: Satte Tiere kämpfen besser, verwöhnte werden wählerisch – Fütterung ist Taktik.',
      'Der Clou: Zwischen den Wellen spielen Tiere miteinander und entwickeln Duo-Fähigkeiten.',
      'Der Clou: Besiegte Gegner können als Rekruten ins eigene Team wechseln.',
    ],
    monetization: [
      angle('game_passes', 'Der „Tierpfleger“-Pass schaltet ein fünftes aktives Tier frei, seitwärts balanciert.'),
      angle('developer_products', 'Leckerli-Körbe als Verbrauchsprodukte mit klarer Wirkung.'),
      angle('cosmetics', 'Halstücher, Gehege-Deko und Sieger-Posen.'),
      angle('battle_pass', 'Saison-Pass mit kosmetischen Tier-Familien.'),
      angle('iap_consumables', 'Trainings-Snacks in kleinen Stufen.'),
      angle('rewarded_ads', 'Optionale Werbung beschleunigt die Erholung müder Tiere.'),
    ],
    risks: [
      risk(
        'Pflege-Mikromanagement nervt TD-Puristen',
        'medium',
        'Pflege optional halten: Basiskampfkraft stimmt immer, Pflege gibt nur Bonus.',
      ),
      risk(
        'Tier-Entwicklung sprengt Balancing-Budget',
        'high',
        'Spezialisierungen als Dreiecks-System (Tempo/Fläche/Fokus) strikt begrenzen.',
      ),
      risk(
        'Emotionale Bindung kollidiert mit Niederlagen',
        'low',
        'Tiere werden nie verletzt, nur müde – Niederlagen kosten Zeit, keine Gefährten.',
      ),
    ],
    successReasons: [
      'Sammel- und Pflege-Motivation erweitert die TD-Zielgruppe',
      'Duo-Fähigkeiten belohnen Experimentierfreude',
      'Ehrentafeln machen Langzeit-Fortschritt sichtbar und teilbar',
      'Rekruten-Twist erzeugt einzigartige Team-Historien',
    ],
    failReasons: [
      'Zwei Genres bedeuten doppelte Erwartungshaltung',
      'Zu niedliche Optik kann Strategie-Kenner abschrecken',
      'Persönlichkeits-Simulation kostet Entwicklungszeit',
      'Wellen-Design gegen lebende Türme ist schwer prognostizierbar',
    ],
    improvements: [
      'Duo-Fähigkeiten-Entdeckung als Kernmoment inszenieren',
      'Wellen-Editor für Community-Herausforderungen ergänzen',
      'Veteranen-Status mit sichtbaren Alterungs-Details feiern',
      'Rekrutierungs-Chance transparent anzeigen',
    ],
    effort: { min: 'small', typical: 'medium' },
    multiplayer: 'optional',
    tags: ['strategy', 'pets', 'collection', 'waves'],
  },

  // ------------------------------------------------------------ battle_arena
  {
    key: 'arena_rotation_rumble',
    genre: 'battle_arena',
    fantasy:
      'Du trittst {place} in schnellen Runden gegen bis zu acht Kontrahenten an – und jede Runde gilt ein anderer verrückter Modifikator.',
    essence: 'kurzweilige Runden mit Regel-Roulette',
    coreLoop: [
      'Lobby beitreten und Modifikator der Runde lesen',
      'Ausrüstung im Schnellzugriff anpassen',
      'Drei-Minuten-Runde um Punkte kämpfen',
      'Platzierung in Saison-Wertung ummünzen',
      'Neue Modifikatoren und Arenen freischalten',
    ],
    usp: 'Der Modifikator-Wurf macht jede Runde zur neuen Disziplin – Allrounder schlagen Einseitige.',
    hook: 'Wer eine Runde unter einem seltenen Modifikator gewinnt, trägt dessen Emblem bis zum nächsten Sieg eines anderen.',
    twists: [
      'Der Clou: Die Verlierer der Vorrunde stimmen über den nächsten Modifikator ab.',
      'Der Clou: Arena-Elemente (Böden, Fallen) wechseln mitten in der Runde die Besitzer.',
      'Der Clou: Ein „Doppelwurf“-Ereignis kombiniert zwei Modifikatoren zu absurden Regeln.',
    ],
    monetization: [
      angle('cosmetics', 'Skins, Sieger-Emotes und Arena-Einzüge – strikt ohne Spielvorteil.'),
      angle('battle_pass', 'Saison-Pass mit kosmetischen Meilensteinen entlang der Rundenwertung.'),
      angle('game_passes', 'Der „Veranstalter“-Pass schaltet private Lobbys mit Regel-Editor frei.'),
      angle('developer_products', 'Turnier-Tickets für Wochenend-Cups.'),
      angle('iap_non_consumables', 'Einmalkauf „Emblem-Vitrine“ für die Profilseite.'),
    ],
    risks: [
      risk(
        'Matchmaking-Qualität bei kleiner Population',
        'critical',
        'Bot-Auffüllung mit ehrlicher Kennzeichnung und enge Region-Zusammenlegung.',
      ),
      risk(
        'Modifikatoren zerstören Kompetitivität',
        'medium',
        'Ranked-Playlist mit kuratiertem Modifikator-Pool, Fun-Playlist mit allem.',
      ),
      risk(
        'Toxisches Verhalten in Rundenpausen',
        'medium',
        'Schnelles Muting, positive Schnell-Reaktionen und Abstimmungs-Fokus.',
      ),
    ],
    successReasons: [
      'Kurze Runden passen perfekt in mobile Zeitfenster',
      'Regel-Roulette liefert eingebaute Abwechslung ohne Content-Kosten',
      'Embleme erzeugen begehrte, flüchtige Trophäen',
      'Zuschauerfreundlich für Streams und Clips',
    ],
    failReasons: [
      'PvP lebt oder stirbt mit gleichzeitiger Spielerzahl',
      'Balancing unter Modifikatoren ist kaum je fertig',
      'Frust-Momente sind PvP-inhärent und kosten Retention',
      'Cosmetics-only braucht große Population für Umsatz',
    ],
    improvements: [
      'Abstimmungs-Mechanik der Verlierer prominent inszenieren',
      'Tägliche Emblem-Jagd als Einstiegs-Ritual etablieren',
      'Zuschauer-Modus mit Clip-Export früh einbauen',
      'Einsteiger-Playlist mit sanften Modifikatoren anbieten',
    ],
    effort: { min: 'medium', typical: 'medium' },
    multiplayer: 'required',
    tags: ['pvp', 'rounds', 'competitive', 'seasonal'],
  },
  {
    key: 'arena_crystal_clash',
    genre: 'battle_arena',
    fantasy:
      'Du kämpfst {place} in 3-gegen-3-Gefechten um instabile Kristallkerne, die ihre Träger stärken und zugleich verraten.',
    essence: 'Objektiv-Gefechte mit Risiko-Buffs',
    coreLoop: [
      'Team bilden und Rollen abstimmen',
      'Kristallkerne sichern und transportieren',
      'Träger schützen oder gegnerische Träger jagen',
      'Runden gewinnen und Ausrüstung freischalten',
      'Ranked-Stufen mit dem Stamm-Team erklimmen',
    ],
    usp: 'Der Kristall macht stark und sichtbar zugleich: Wer trägt, glüht – Macht hat immer eine Adresse.',
    hook: 'Team-Kombos werden benannt und in der Match-Historie geführt – Stammteams bauen sich einen Ruf auf.',
    twists: [
      'Der Clou: Kerne lassen sich zuwerfen – Pässe sind riskant, aber spielentscheidend.',
      'Der Clou: Überladene Kerne explodieren nach 90 Sekunden – halten oder abgeben wird zum Nervenspiel.',
      'Der Clou: Die Arena verdunkelt sich zum Ende – nur Kristallträger spenden Licht.',
    ],
    monetization: [
      angle('cosmetics', 'Skins, Kern-Effekte und Team-Banner ohne Spielvorteil.'),
      angle('battle_pass', 'Saison-Pass mit kosmetischen Belohnungen entlang der Ranked-Reise.'),
      angle('game_passes', 'Der „Kapitän“-Pass schaltet Team-Statistiken und Trainingsarena frei.'),
      angle('developer_products', 'Turnier-Anmeldungen für Wochenend-Ligen.'),
      angle('iap_non_consumables', 'Einmalkauf „Bannergestaltung“ mit erweitertem Editor.'),
    ],
    risks: [
      risk(
        'Team-Abhängigkeit frustriert Solo-Queue',
        'high',
        'Bot-Mitspieler mit ehrlicher Kennzeichnung und Solo-Wertung getrennt führen.',
      ),
      risk(
        'Netzwerk-Präzision beim Kern-Passen',
        'high',
        'Serverseitige Wurfvalidierung und großzügige Fang-Fenster einbauen.',
      ),
      risk(
        'Rollen-Meta erstarrt',
        'medium',
        'Kern-Verhalten saisonal variieren statt Charakterwerte umzuwerfen.',
      ),
    ],
    successReasons: [
      'Objektiv-Fokus erzeugt Teamgefühl statt reiner Frag-Jagd',
      'Sichtbare Träger-Mechanik ist leicht zu lesen und zu casten',
      'Pass-Spielzüge produzieren Highlight-Clips',
      'Stammteam-Identität bindet Gruppen langfristig',
    ],
    failReasons: [
      'Es braucht konstant genug Spieler für faire 3v3-Matches',
      'Kompetitive Erwartungen an Netcode sind hoch',
      'Einstiegshürde für Neulinge in eingespielten Lobbys',
      'Cosmetics-Umsatz skaliert erst mit großer Basis',
    ],
    improvements: [
      'Pass-Tutorial mit Bot-Team als Pflicht-Erlebnis gestalten',
      'Kern-Explosion mit deutlicher Klang-Telegrafie versehen',
      'Wochenend-Ligen mit Einsteiger-Division starten',
      'Team-Findungs-Board im Hauptmenü integrieren',
    ],
    effort: { min: 'medium', typical: 'large' },
    multiplayer: 'optional',
    tags: ['pvp', 'teams', 'objective', 'competitive'],
  },

  // ------------------------------------------------------------------ racing
  {
    key: 'racing_scrap_karts',
    genre: 'racing',
    fantasy:
      'Du schraubst {place} aus Fundteilen eigenwillige Karts zusammen und jagst damit über Strecken voller Abkürzungen und Schikanen.',
    essence: 'Bastel-Karts mit spürbaren Teilen',
    coreLoop: [
      'Teile sammeln, tauschen und verbauen',
      'Kart auf Streckentyp abstimmen',
      'Rennen fahren und Fahrstil verfeinern',
      'Preisgelder in seltene Teile investieren',
      'Neue Ligen und Streckenpakete freischalten',
    ],
    usp: 'Jedes Teil verändert das Fahrgefühl hörbar und sichtbar – dein Kart klappert, weil es deins ist.',
    hook: 'Nach jedem Rennen können Gegner ein Teil deines Karts „bewundern“ – oft der Beginn von Tauschgeschäften.',
    twists: [
      'Der Clou: Teile nutzen sich sichtbar ab und entwickeln dabei Charakter-Boni.',
      'Der Clou: Auf jeder Strecke liegt genau ein Unikat-Teil versteckt.',
      'Der Clou: Boxenstopps sind Minispiele, bei denen Mitfahrer helfen können.',
    ],
    monetization: [
      angle('cosmetics', 'Lackierungen, Aufkleber und Hupen ohne Fahrvorteil.'),
      angle('battle_pass', 'Saison-Pass mit kosmetischen Teile-Sets.'),
      angle('game_passes', 'Der „Chefmechaniker“-Pass schaltet die zweite Garage frei.'),
      angle('developer_products', 'Liga-Tickets für Sonderturniere.'),
      angle('rewarded_ads', 'Optionale Werbung gewährt eine zusätzliche Teil-Auswahl nach dem Rennen.'),
      angle('iap_consumables', 'Ersatzteil-Kisten mit transparenter Ausschüttung.'),
    ],
    risks: [
      risk(
        'Teile-Vorteile driften in Pay-to-win',
        'high',
        'Kaufbare Inhalte strikt kosmetisch; Leistungs-Teile nur erspielbar.',
      ),
      risk(
        'Fahrphysik-Feintuning unterschätzt',
        'high',
        'Fahrgefühl vor Content: erst drei perfekte Strecken, dann Masse.',
      ),
      risk(
        'Tausch-Ökonomie öffnet Betrugsfläche',
        'medium',
        'Tauschgeschäfte serverseitig eskrowed und mit Werteanzeige absichern.',
      ),
    ],
    successReasons: [
      'Basteln plus Fahren verbindet zwei starke Motivationen',
      'Klapperndes Unikat-Kart erzeugt Besitzerstolz',
      'Tausch-Kultur schafft Community-Momente',
      'Boxenstopp-Minispiele geben Rennen soziale Würze',
    ],
    failReasons: [
      'Rennspiel-Erwartungen an Steuerung sind unerbittlich',
      'Teile-Balancing ist ein Dauerprojekt',
      'Streckenbau ist teurer Dauer-Content',
      'Mobile-Steuerung kann Präzisionsfahrer enttäuschen',
    ],
    improvements: [
      'Unikat-Teil-Jagd als Streckenerkundungs-Anreiz ausbauen',
      'Rivalen-System mit wiederkehrenden Gegnern einführen',
      'Geisterfahrten der Freunde als Standard-Vergleich anbieten',
      'Kart-Sound-Designer für eigene Klapper-Profile ergänzen',
    ],
    effort: { min: 'small', typical: 'medium' },
    multiplayer: 'optional',
    tags: ['vehicles', 'customization', 'competition', 'trading'],
  },
  {
    key: 'racing_glide_currents',
    genre: 'racing',
    fantasy:
      'Du gleitest {place} auf Luft- und Wasserströmungen bergab ins Ziel – wer die unsichtbaren Ströme liest, fliegt allen davon.',
    essence: 'Strömungs-Lesen statt Gasgeben',
    coreLoop: [
      'Startpunkt und Gleiter wählen',
      'Strömungen erspüren und Linien planen',
      'Im Flug Boosts aus Aufwinden ziehen',
      'Bestzeiten und Stil-Punkte sammeln',
      'Neue Gleiter und Panorama-Strecken freischalten',
    ],
    usp: 'Es gibt kein Gaspedal: Geschwindigkeit ist Belohnung fürs Lesen der Welt, nicht fürs Drücken eines Knopfs.',
    hook: 'Deine schönste Linie wird als farbige Spur in der Welt sichtbar, der andere nachfliegen können.',
    twists: [
      'Der Clou: Vögel und Blätter verraten die Strömungen – die Natur ist das HUD.',
      'Der Clou: Tageszeiten drehen die Windrichtungen und damit die Ideallinien um.',
      'Der Clou: Ein Foto-Finish-Modus belohnt knappe Manöver mit Stil-Multiplikatoren.',
    ],
    monetization: [
      angle('cosmetics', 'Gleiter-Designs, Spurenfarben und Anzüge.'),
      angle('iap_non_consumables', 'Einmalkauf-Panorama-Strecken als dauerhafte Erweiterungen.'),
      angle('game_passes', 'Der „Aufwind“-Pass schaltet den Fotomodus mit Spuren-Editor frei.'),
      angle('rewarded_ads', 'Optionale Werbung zeigt eine Strömungs-Vorschau der Strecke.'),
      angle('developer_products', 'Zeitfahr-Events mit Sonderwertung.'),
      angle('battle_pass', 'Saisonale Flugreise mit kosmetischen Meilensteinen.'),
    ],
    risks: [
      risk(
        'Unsichtbare Mechanik bleibt unverständlich',
        'high',
        'Natur-Hinweise (Vögel, Blätter) konsequent als Lesbarkeits-System ausbauen.',
      ),
      risk(
        'Entspannungs- und Wettkampf-Publikum kollidieren',
        'medium',
        'Getrennte Modi: Panoramaflug ohne Timer, Zeitfahren mit Ideallinien.',
      ),
      risk(
        'Streckenbau mit Strömungsfeldern ist aufwendig',
        'medium',
        'Wiederverwendbare Strömungs-Module und Tageszeit-Varianten derselben Strecke.',
      ),
    ],
    successReasons: [
      'Beruhigend und kompetitiv zugleich – seltene Marktlücke',
      'Sichtbare Nachflieg-Spuren sind sozialer Klebstoff',
      'Tageszeiten verdoppeln den Streckenwert ohne Neubau',
      'Hohe visuelle Attraktivität für Stores und Clips',
    ],
    failReasons: [
      'Kein klassischer Renn-Kick – Fehlkauf-Rezensionen drohen',
      'Strömungs-Tuning braucht viele Iterationen',
      'Nische zwischen Genres erschwert Store-Kategorisierung',
      'High-End-Optik kollidiert mit schwachen Geräten',
    ],
    improvements: [
      'Onboarding als geführter Panoramaflug ohne Timer gestalten',
      'Wochen-Windlage serverweit rotieren',
      'Spuren-Galerie mit Likes und Nachflug-Zähler einführen',
      'Stil-System mit benannten Manövern ausbauen',
    ],
    effort: { min: 'small', typical: 'medium' },
    multiplayer: 'optional',
    tags: ['racing', 'movement', 'relaxing', 'competition'],
  },

  // ------------------------------------------------------------------ horror
  {
    key: 'horror_shadow_seeker',
    genre: 'horror',
    fantasy:
      'Du versteckst dich {place} vor einem Sucher, der Geräusche jagt – oder du bist selbst der Sucher und lauschst dem Server beim Atmen.',
    essence: 'asymmetrisches Lausch-Versteckspiel',
    coreLoop: [
      'Rolle erhalten: Verstecker oder Sucher',
      'Als Verstecker Geräuschquellen manipulieren',
      'Als Sucher Klangspuren deuten und zuschlagen',
      'Runden überleben und Ausrüstung freischalten',
      'Karten-Geheimnisse für beide Rollen entdecken',
    ],
    usp: 'Gejagt wird mit den Ohren: Wer die Klanglandschaft beherrscht, beherrscht die Runde – auf beiden Seiten.',
    hook: 'Nach jeder Runde zeigt eine Klang-Replay-Karte, welcher Ton dich verraten hat – Lerneffekt mit Gänsehaut.',
    twists: [
      'Der Clou: Verstecker können Geräusche aufnehmen und als Köder woanders abspielen.',
      'Der Clou: Das Gebäude selbst knarrt – wer still steht, wird Teil seiner Geräuschkulisse.',
      'Der Clou: Der Sucher sieht nur Schemen, hört aber in Stereo-Detailtiefe.',
    ],
    monetization: [
      angle('cosmetics', 'Laternen, Umhänge und Sucher-Silhouetten ohne Spielvorteil.'),
      angle('game_passes', 'Der „Archivar“-Pass schaltet die Klang-Replay-Galerie vergangener Runden frei.'),
      angle('battle_pass', 'Saison-Pass mit kosmetischen Grusel-Sets.'),
      angle('developer_products', 'Event-Tickets für Sonderkarten-Nächte.'),
      angle('iap_non_consumables', 'Einmalkauf „Kartenpaket Nebeltrakt“.'),
    ],
    risks: [
      risk(
        'Audio-Kern scheitert an schlechten Lautsprechern',
        'high',
        'Visuelle Klang-Wellen als barrierefreie Zweitanzeige anbieten.',
      ),
      risk(
        'Sucher-Rolle zu stark oder zu schwach',
        'high',
        'Rollen-Winraten live überwachen und Hörradius serverseitig justieren.',
      ),
      risk(
        'Jugendschutz und Plattformregeln bei Horror',
        'medium',
        'Auf Andeutung statt Schock setzen; Altersfreigaben früh prüfen.',
      ),
    ],
    successReasons: [
      'Audio-Fokus ist ein frisches Alleinstellungsmerkmal im Genre',
      'Asymmetrie erzeugt zwei Spielgefühle in einem Produkt',
      'Runden-Geschichten sind perfektes Stream-Material',
      'Klang-Replay macht Niederlagen lehrreich statt billig',
    ],
    failReasons: [
      'Population nötig – leere Lobbys töten Grusel sofort',
      'Sound-Design in dieser Tiefe ist teuer',
      'Griefing-Potenzial in Verstecker-Teams',
      'Horror begrenzt die jüngere Zielgruppe strukturell',
    ],
    improvements: [
      'Köder-Aufnahme-Mechanik ins Tutorial beider Rollen legen',
      'KI-Sucher für Übungsrunden und Randzeiten einbauen',
      'Kurze Rundenzeiten von vier Minuten strikt halten',
      'Grusel-Grad-Regler für jüngere Spieler anbieten',
    ],
    effort: { min: 'small', typical: 'medium' },
    multiplayer: 'required',
    tags: ['tension', 'pvp', 'social', 'audio'],
  },
  {
    key: 'horror_lantern_crew',
    genre: 'horror',
    fantasy:
      'Du erkundest {place} mit deiner Crew ein Areal, in dem Licht die einzige Währung ist: Jede Laterne brennt vom selben, geteilten Vorrat.',
    essence: 'geteiltes Licht-Budget unter Druck',
    coreLoop: [
      'Expedition planen und Lichtvorrat verteilen',
      'Areale erkunden und Fundstücke bergen',
      'Lichtquellen taktisch setzen und opfern',
      'Rückweg vor dem Verlöschen schaffen',
      'Basis ausbauen und tiefere Areale öffnen',
    ],
    usp: 'Angst wird geteilt: Der Licht-Vorrat gehört allen – jede Entscheidung über Helligkeit ist eine Gruppenentscheidung.',
    hook: 'Wer sein Licht für andere opfert, erhält den sichtbaren „Laternenträger“-Status mit eigener Aura.',
    twists: [
      'Der Clou: Dunkelheit löscht nicht das Leben, sondern Erinnerungen – wer zu lange im Schatten war, vergisst Kartenwissen.',
      'Der Clou: Manche Kreaturen fressen Licht und folgen den hellsten Spielern.',
      'Der Clou: Notsignale kosten den halben Restvorrat der gesamten Crew.',
    ],
    monetization: [
      angle('cosmetics', 'Laternen-Formen, Lichtfarben und Crew-Abzeichen.'),
      angle('game_passes', 'Der „Expeditionsleiter“-Pass schaltet Planungs-Karten und Crew-Statistiken frei.'),
      angle('developer_products', 'Expeditions-Lizenzen für Bonus-Areale.'),
      angle('battle_pass', 'Saisonale Expeditionsreihe mit kosmetischen Belohnungen.'),
      angle('iap_consumables', 'Signalfackeln als seltene Verbrauchsprodukte.'),
      angle('rewarded_ads', 'Optionale Werbung gewährt eine Kartenskizze des nächsten Areals.'),
    ],
    risks: [
      risk(
        'Trolle verschwenden das Gruppenlicht',
        'high',
        'Licht-Anteile persönlich reservieren; nur Überschuss ist gemeinsam.',
      ),
      risk(
        'Vergessen-Mechanik wirkt unfair',
        'medium',
        'Erinnerungsverlust visuell ankündigen und auf Kartenwissen begrenzen.',
      ),
      risk(
        'Grusel nutzt sich bei Wiederholung ab',
        'medium',
        'Areal-Layouts prozedural variieren und Kreaturen-Verhalten rotieren.',
      ),
    ],
    successReasons: [
      'Geteiltes Budget erzeugt echte soziale Spannung statt Jumpscares',
      'Laternenträger-Status belohnt Heldentum sichtbar',
      'Koop-Grusel hat treue, wortstarke Fangemeinde',
      'Erinnerungs-Twist ist erzählerisch einzigartig',
    ],
    failReasons: [
      'Ohne eingespielte Gruppen zerfällt die Kern-Dynamik',
      'Zufalls-Crews können das Erlebnis ruinieren',
      'Atmosphäre-Anspruch treibt Art-Kosten',
      'Horror-Kennzeichnung begrenzt Plattform-Reichweite',
    ],
    improvements: [
      'Solo-Modus mit KI-Gefährten als Einstieg anbieten',
      'Licht-Verbrauchs-Anzeige pro Person transparent machen',
      'Kurze Story-Funde als Sammelalbum strukturieren',
      'Wöchentliche Groß-Expedition als Server-Event etablieren',
    ],
    effort: { min: 'small', typical: 'medium' },
    multiplayer: 'optional',
    tags: ['coop', 'exploration', 'tension', 'resource_management'],
  },

  // ---------------------------------------------------------- social_hangout
  {
    key: 'social_cozy_harbor',
    genre: 'social_hangout',
    fantasy:
      'Du triffst dich {place} mit Freunden, übernimmst kleine Schichten in Läden und Cafés und richtest dir ein eigenes Eckchen ein.',
    essence: 'gemeinsames Dasein mit sanften Aufgaben',
    coreLoop: [
      'Ankommen und Freunde treffen',
      'Mini-Schichten in Läden übernehmen',
      'Verdienst in das eigene Eckchen stecken',
      'Gemeinsame Rituale (Feierabend, Markttag) erleben',
      'Saisonale Feste und neue Orte entdecken',
    ],
    usp: 'Aufgaben sind Gesprächsanlässe, kein Pflichtprogramm: Wer nur dasitzen und reden will, verpasst nichts.',
    hook: 'Feste Tagesrituale wie der gemeinsame Feierabend um Punkt acht erzeugen verlässliche Wiedersehens-Momente.',
    twists: [
      'Der Clou: Schichten funktionieren zu zweit besser – jede Arbeit ist ein Koop-Minispiel.',
      'Der Clou: Das eigene Eckchen wandert mit: Es ist auf jedem Server dein Zuhause.',
      'Der Clou: Wetter und Jahreszeit verändern, welche Orte gerade der Treffpunkt sind.',
    ],
    monetization: [
      angle('cosmetics', 'Outfits, Möbel und Deko fürs eigene Eckchen.'),
      angle('game_passes', 'Der „Stammgast“-Pass schaltet ein größeres Eckchen und Gastgeber-Werkzeuge frei.'),
      angle('developer_products', 'Fest-Tickets mit kosmetischen Andenken.'),
      angle('premium_payouts', 'Lange, gemütliche Sessions zahlen über Premium Payouts direkt ein.'),
      angle('battle_pass', 'Saisonale Feste-Reihe mit kosmetischen Erinnerungsstücken.'),
    ],
    risks: [
      risk(
        'Moderation sozialer Räume',
        'critical',
        'Räume klein halten, starke Melde-Werkzeuge und aktive Community-Betreuung von Tag eins.',
      ),
      risk(
        'Leere Server töten die Stimmung',
        'high',
        'Server-Zusammenlegung zu Stoßzeiten und NPCs als Grundbelebung.',
      ),
      risk(
        'Ohne Aufgaben fehlt Neuen der Einstieg',
        'medium',
        'Schichten als niedrigschwellige „Was mache ich hier?“-Antwort prominent anbieten.',
      ),
    ],
    successReasons: [
      'Hangouts gehören zu den meistgespielten Kategorien überhaupt',
      'Rituale erzeugen habituelle, tägliche Rückkehr',
      'Deko-Monetarisierung ist hier natürlich und akzeptiert',
      'Koop-Schichten senken die Hürde, Fremde kennenzulernen',
    ],
    failReasons: [
      'Aufbau einer Anfangs-Community ist das härteste Stück',
      'Moderationskosten skalieren mit dem Erfolg',
      'Trends bei Hangout-Ästhetik drehen schnell',
      'Ohne stetige Saison-Inhalte wandert die Szene weiter',
    ],
    improvements: [
      'Feierabend-Ritual mit serverweitem Ereignis inszenieren',
      'Gastgeber-Rolle mit Moderations-Miniwerkzeugen stärken',
      'Eckchen-Besuche mit Gästebuch-Funktion ergänzen',
      'Saisonkalender öffentlich aushängen',
    ],
    effort: { min: 'small', typical: 'medium' },
    multiplayer: 'required',
    tags: ['social', 'cozy', 'roleplay', 'seasonal', 'decoration'],
  },
  {
    key: 'social_photo_islands',
    genre: 'social_hangout',
    fantasy:
      'Du erkundest {place} eine Inselwelt voller Foto-Spots, sammelst Posen und Filter und kuratierst dein eigenes kleines Fotoalbum.',
    essence: 'gemeinsames Entdecken und Inszenieren',
    coreLoop: [
      'Neue Foto-Spots entdecken',
      'Posen, Emotes und Filter kombinieren',
      'Gemeinsame Gruppenfotos arrangieren',
      'Alben kuratieren und ausstellen',
      'Saisonale Spots und Requisiten freischalten',
    ],
    usp: 'Die Kamera ist das Spiel: Spots verändern Licht und Bühne, und die beste Aufnahme entsteht fast immer gemeinsam.',
    hook: 'Wöchentliche Foto-Themen küren Community-Lieblinge, die als Postkarten in der Spielwelt hängen.',
    twists: [
      'Der Clou: Manche Spots öffnen sich nur für Gruppen ab drei Personen.',
      'Der Clou: Wildtiere posieren mit, wenn man ihre Gewohnheiten lernt.',
      'Der Clou: Goldene Stunde ist echt: Licht-Ereignisse gelten serverweit für Minuten.',
    ],
    monetization: [
      angle('cosmetics', 'Outfits, Posen-Pakete und Filter-Kollektionen.'),
      angle('game_passes', 'Der „Kurator“-Pass schaltet die große Galerie und Layout-Werkzeuge frei.'),
      angle('developer_products', 'Requisiten-Sets für Themen-Wochen.'),
      angle('battle_pass', 'Saisonale Foto-Reise mit kosmetischen Meilensteinen.'),
      angle('premium_payouts', 'Ausgedehnte Erkundungs-Sessions stärken Premium Payouts.'),
    ],
    risks: [
      risk(
        'Missbrauch von Foto-Funktionen',
        'high',
        'Nur kuratierte Posen und Requisiten, keine Freiform-Texte in Bildern, klare Moderationswege.',
      ),
      risk(
        'Content-Zyklus der Spots ermüdet',
        'medium',
        'Licht-Ereignisse und Tier-Verhalten variieren bestehende Spots kostenlos.',
      ),
      risk(
        'Sammel-Meta bleibt zu dünn',
        'medium',
        'Posen-Sammlung mit Set-Boni und Fundorten wie ein Sammelalbum strukturieren.',
      ),
    ],
    successReasons: [
      'Foto-Kultur ist plattformübergreifend riesig',
      'Gruppen-Spots erzwingen positive soziale Interaktion',
      'Saisonales Licht- und Themen-Design ist günstiger Dauer-Content',
      'Cosmetics passen hier perfekt zum Kern',
    ],
    failReasons: [
      'Ohne stetige Themen-Pflege schläft die Community ein',
      'Moderationsaufwand für nutzergenerierte Bilder',
      'Kern-Gameplay kann Kritikern zu dünn erscheinen',
      'Starke Konkurrenz um dieselbe Zielgruppe',
    ],
    improvements: [
      'Wildtier-Gewohnheiten als Entdecker-System vertiefen',
      'Postkarten-Kürung als Wochen-Event zelebrieren',
      'Foto-Quests mit Kompositions-Aufgaben einführen',
      'Galerie-Besuche mit Reaktions-Stickern beleben',
    ],
    effort: { min: 'small', typical: 'medium' },
    multiplayer: 'required',
    tags: ['social', 'collection', 'seasonal', 'creative', 'ugc'],
  },

  // ----------------------------------------------------------------- sandbox
  {
    key: 'sandbox_physics_blocks',
    genre: 'sandbox',
    fantasy:
      'Du baust {place} aus physikalischen Bauteilen Maschinen, Brücken und Kettenreaktionen – und lässt sie dann genüsslich kollabieren.',
    essence: 'Bauen, Testen, Krachen-Lassen',
    coreLoop: [
      'Bauteile wählen und Konstruktion planen',
      'Gelenke, Antriebe und Auslöser verbinden',
      'Testlauf starten und Versagen analysieren',
      'Konstruktion verstärken oder eleganter machen',
      'Werke teilen und fremde Maschinen erkunden',
    ],
    usp: 'Scheitern ist Spektakel: Der Kollaps ist so unterhaltsam wie der Erfolg – und beides ist teilbar.',
    hook: 'Jede geteilte Konstruktion trägt eine Bau-Genealogie: Remixe zeigen ihre Vorfahren, Originale sammeln Ruhm.',
    twists: [
      'Der Clou: Wöchentliche Material-Launen (Gummi-Woche, Eis-Woche) verändern die Physik aller Welten.',
      'Der Clou: Ein Belastungs-Orakel prophezeit die Bruchstelle – wetten, dass es sich irrt?',
      'Der Clou: Zuschauer können bei Testläufen kleine Störungen kaufen und einwerfen.',
    ],
    monetization: [
      angle('game_passes', 'Der „Statiker“-Pass schaltet Analyse-Overlays und Zeitlupen-Replay frei.'),
      angle('cosmetics', 'Material-Texturen, Effekt-Partikel und Bauplatz-Themen.'),
      angle('developer_products', 'Störungs-Tokens für Zuschauer-Interaktionen.'),
      angle('premium_payouts', 'Lange Bau-Sessions stärken Premium Payouts.'),
      angle('iap_non_consumables', 'Einmalkauf „Antriebs-Paket“ mit Motoren-Familie.'),
      angle('rewarded_ads', 'Optionale Werbung schaltet einen Bonus-Testplatz frei.'),
    ],
    risks: [
      risk(
        'Physik-Performance bei Riesenbauten',
        'high',
        'Teile-Budget pro Welt mit sichtbarem Zähler und Optimierungs-Hinweisen.',
      ),
      risk(
        'Leeres-Blatt-Lähmung bei Neulingen',
        'medium',
        'Herausforderungs-Karten („Baue eine Brücke über X“) als Einstiegsrampe.',
      ),
      risk(
        'Remix-Kultur kann Originale entwerten',
        'low',
        'Genealogie-Anzeige und Original-Boni fest verankern.',
      ),
    ],
    successReasons: [
      'Kettenreaktions-Videos sind geborener viraler Content',
      'Remix-Kultur skaliert Content durch die Community',
      'Material-Launen halten Physik-Veteranen neugierig',
      'Kreativ-Publikum ist loyal und ausdauernd',
    ],
    failReasons: [
      'Ohne starke Editor-UX bricht die Masse weg',
      'Physik-Chaos ist schwer zu moderieren',
      'Server-Kosten für persistente Welten',
      'Kreativ-Spiele monetarisieren oft unterdurchschnittlich',
    ],
    improvements: [
      'Belastungs-Orakel als Signatur-Feature ins Zentrum rücken',
      'Wochen-Baukontest mit Jury aus Community-Lieblingen',
      'Einsteiger-Blaupausen mit Lückentext-Prinzip anbieten',
      'Zeitlupen-Replay mit einem Tipp teilbar machen',
    ],
    effort: { min: 'medium', typical: 'large' },
    multiplayer: 'optional',
    tags: ['ugc', 'building', 'physics', 'creative', 'community'],
  },
  {
    key: 'sandbox_terraform_isles',
    genre: 'sandbox',
    fantasy:
      'Du formst {place} deine eigene Insel: Berge auftürmen, Flüsse ziehen, Biome pflanzen – und dann Besucher durch dein Werk wandern lassen.',
    essence: 'Landschafts-Gestaltung als Ausdruck',
    coreLoop: [
      'Terrain heben, senken und glätten',
      'Wasserläufe und Biome anlegen',
      'Flora, Fauna und Wege ansiedeln',
      'Insel für Besucher öffnen und Feedback sammeln',
      'Neue Werkzeuge und Klimazonen freischalten',
    ],
    usp: 'Die Welt reagiert ökologisch: Wasser sucht sich Wege, Pflanzen wandern, Tiere ziehen ein – deine Insel lebt weiter, wenn du schläfst.',
    hook: 'Besucher hinterlassen Wanderstempel an Lieblingsorten – Heatmaps zeigen, welche Ecke deiner Insel Herzen gewinnt.',
    twists: [
      'Der Clou: Jahreszeiten ziehen wirklich über die Insel und verwandeln ihre Stimmung.',
      'Der Clou: Seltene Tierarten stellen Ansprüche – wer sie anlocken will, gestaltet für sie.',
      'Der Clou: Nachbarinseln beeinflussen sich: Dein Fluss kann beim Nachbarn münden.',
    ],
    monetization: [
      angle('game_passes', 'Der „Geologe“-Pass schaltet Feinwerkzeuge und Klima-Regler frei.'),
      angle('cosmetics', 'Deko-Sets, Brücken-Stile und Wegmaterialien.'),
      angle('developer_products', 'Saatgut-Sortimente für exotische Biome.'),
      angle('premium_payouts', 'Ausgedehnte Gestaltungs-Sessions stärken Premium Payouts.'),
      angle('iap_non_consumables', 'Einmalkauf „Archipel-Erweiterung“ mit zweiter Insel.'),
      angle('subscription', 'Ein Gärtnerbund-Abo liefert monatliche Werkzeug- und Deko-Kollektionen.'),
    ],
    risks: [
      risk(
        'Simulationstiefe frisst Performance',
        'high',
        'Ökologie in Zonen-Ticks statt Echtzeit rechnen; Sichtbares priorisieren.',
      ),
      risk(
        'Gestalter-Nische bleibt klein',
        'medium',
        'Besucher-Loop und Wanderstempel als soziale Verstärker ausbauen.',
      ),
      risk(
        'Werkzeug-UX auf Touch anspruchsvoll',
        'medium',
        'Werkzeuge radikal reduzieren und Gesten-Standards früh testen.',
      ),
    ],
    successReasons: [
      'Lebende Welten erzeugen einzigartige Besitzerbindung',
      'Besucher-Feedback macht einsames Gestalten sozial',
      'Jahreszeiten vervierfachen den ästhetischen Wert jeder Insel',
      'Ruhige Kreativ-Zielgruppe ist zahlungsbereit für Deko',
    ],
    failReasons: [
      'Ohne Ziele kann die Motivation schnell verpuffen',
      'Ökosimulation ist technisch ambitioniert',
      'Content-Erwartung an Flora/Fauna wächst stetig',
      'Schwer zu vermarkten ohne spektakuläre Momente',
    ],
    improvements: [
      'Tier-Ansiedlung als Quest-artiges Zielsystem nutzen',
      'Insel-Zeitraffer als teilbares Video exportieren',
      'Saisonale Gestaltungs-Wettbewerbe etablieren',
      'Nachbarschafts-Flüsse als Koop-Ritual feiern',
    ],
    effort: { min: 'medium', typical: 'large' },
    multiplayer: 'optional',
    tags: ['building', 'creative', 'cozy', 'seasonal', 'ugc'],
  },

  // ------------------------------------------------------------ card_battler
  {
    key: 'cards_fusion_beasts',
    genre: 'card_battler',
    fantasy:
      'Du duellierst dich {place} mit Kreaturenkarten, die du mitten im Match zu neuen Wesen verschmelzen kannst – dein Deck ist nie fertig.',
    essence: 'Fusion als Kern-Entscheidung',
    coreLoop: [
      'Deck aus Basis-Kreaturen bauen',
      'Im Match Karten ausspielen und fusionieren',
      'Fusions-Rezepte entdecken und dokumentieren',
      'Belohnungen in neue Karten investieren',
      'Ranglisten und Fusions-Lexikon aufsteigen',
    ],
    usp: 'Fusion passiert im Match, nicht im Menü: Jede Partie stellt die Frage neu, ob zwei gute Karten eine bessere ergeben.',
    hook: 'Wer eine noch nie gesehene Fusion entdeckt, wird als Erstentdecker im Lexikon aller Spieler geführt.',
    twists: [
      'Der Clou: Fusionen erben je eine Eigenschaft beider Eltern – Reihenfolge entscheidet.',
      'Der Clou: Gegnerische Kreaturen lassen sich in seltenen Momenten mit den eigenen fusionieren.',
      'Der Clou: Fehlgeschlagene Fusionen erzeugen instabile Wesen mit Countdown.',
    ],
    monetization: [
      angle('cosmetics', 'Kartenrücken, Arena-Böden und Fusions-Effekte.'),
      angle('battle_pass', 'Saison-Pass mit kosmetischen Karten-Rahmen.'),
      angle('game_passes', 'Der „Archiv“-Pass schaltet erweiterte Deck-Slots und Statistiken frei.'),
      angle('developer_products', 'Turnier-Tickets für Wochenend-Formate.'),
      angle('iap_non_consumables', 'Einmalkauf-Kartensets mit festem, sichtbarem Inhalt – keine Zufallspacks.'),
      angle('rewarded_ads', 'Optionale Werbung gewährt einen zweiten Belohnungs-Pick nach Matches.'),
    ],
    risks: [
      risk(
        'Fusions-Kombinatorik wird unbalancierbar',
        'critical',
        'Vererbungs-Slots strikt begrenzen und Fusionen serverseitig simulierbar halten.',
      ),
      risk(
        'Zufallspack-Erwartung des Genres',
        'medium',
        'Bewusst mit festen Sets dagegenhalten und Fairness aktiv vermarkten.',
      ),
      risk(
        'Einstiegshürde für Karten-Neulinge',
        'medium',
        'Starterdecks mit geführten Fusions-Lektionen ausliefern.',
      ),
    ],
    successReasons: [
      'Match-interne Fusion ist ein echter Genre-Twist',
      'Erstentdecker-Lexikon erzeugt Forscher-Motivation',
      'Feste Kaufsets bauen Vertrauen bei Eltern und Presse auf',
      'Theorycrafting-Community trägt das Marketing mit',
    ],
    failReasons: [
      'Karten-Genre verlangt enormes Balancing-Handwerk',
      'Ohne Zufallspacks fehlt eine bewährte Umsatzsäule',
      'Kompetitive Szene braucht stetige Format-Pflege',
      'Instabile Fusionen können als Glücksspiel-Gefühl kippen',
    ],
    improvements: [
      'Fusions-Vorschau bei gedrückter Karte einführen',
      'Wochen-Format mit eingeschränktem Kartenpool rotieren',
      'Erstentdeckungen mit Namenswahl-Recht belohnen',
      'Zuschauer-Modus mit Fusions-Prognosen ausstatten',
    ],
    effort: { min: 'medium', typical: 'large' },
    multiplayer: 'optional',
    tags: ['cards', 'collection', 'pvp', 'strategy'],
  },
  {
    key: 'cards_dungeon_decks',
    genre: 'card_battler',
    fantasy:
      'Du steigst {place} mit einem wachsenden Deck in Etagen-Dungeons hinab: Jede Karte ist Waffe, Werkzeug und Proviant zugleich.',
    essence: 'Solo-Deckbau als Expedition',
    coreLoop: [
      'Etage betreten und Ereignisse wählen',
      'Kämpfe mit Karten-Kombos bestreiten',
      'Deck unterwegs verschlanken und verstärken',
      'Etagen-Boss bezwingen und Schätze wählen',
      'Aufstieg abschließen und Meta-Boni freischalten',
    ],
    usp: 'Karten sind Mehrzweck-Ressourcen: Der Feuerball wärmt auch das Lager – wegwerfen heißt verzichten lernen.',
    hook: 'Jeder abgeschlossene Aufstieg prägt eine Siegel-Karte mit deiner Lauf-Statistik, sammelbar und vorzeigbar.',
    twists: [
      'Der Clou: Karten nutzen sich ab und erzählen über Gebrauchsspuren ihre Geschichte.',
      'Der Clou: Händler kaufen auch Karten – Verkaufen ist Deck-Verschlankung mit Gewinn.',
      'Der Clou: Etagen-Bosse spielen erkennbare eigene Decks mit lesbaren Mustern.',
    ],
    monetization: [
      angle('iap_non_consumables', 'Charakter- und Kartensets als feste Einmalkäufe.'),
      angle('battle_pass', 'Saisonale Aufstiegs-Reihe mit kosmetischen Siegeln.'),
      angle('cosmetics', 'Kartenrücken, Tisch-Themen und Abnutzungs-Stile.'),
      angle('game_passes', 'Der „Kartograph“-Pass schaltet alternative Dungeon-Routen frei.'),
      angle('rewarded_ads', 'Optionale Werbung erlaubt einen Bonus-Schatzwurf nach Bossen.'),
      angle('developer_products', 'Herausforderungs-Schlüssel für Sonder-Etagen.'),
    ],
    risks: [
      risk(
        'Mehrzweck-Karten überfordern Neulinge',
        'medium',
        'Nutzungs-Icons klar trennen und erste Etage nur mit Kampf-Nutzung starten.',
      ),
      risk(
        'Solo-Fokus begrenzt soziale Bindung',
        'medium',
        'Tägliche Sprints mit identischem Seed und Freundes-Vergleich ergänzen.',
      ),
      risk(
        'Genre-Sättigung bei Deck-Rogueliten',
        'medium',
        'Mehrzweck-Mechanik und Abnutzungs-Erzählung konsequent als USP zuspitzen.',
      ),
    ],
    successReasons: [
      'Deck-Roguelite-Fans probieren Neues mit klarem Twist gern aus',
      'Mehrzweck-Entscheidungen erzeugen dauerhafte Spannung',
      'Solo-Kern ist netzwerkunabhängig und mobil perfekt',
      'Siegel-Sammlung macht Erfolge dauerhaft sichtbar',
    ],
    failReasons: [
      'Sehr starke Genre-Konkurrenz mit Kult-Titeln',
      'Balance zwischen drei Karten-Nutzungen ist heikel',
      'Ohne starke Kartentexte fehlt die Persönlichkeit',
      'Content-Nachschub an Etagen und Karten ist Pflicht',
    ],
    improvements: [
      'Verkaufen-als-Verschlanken früh im Tutorial verankern',
      'Boss-Muster-Lesebuch als freischaltbares Hilfsmittel',
      'Tages-Seed-Sprint mit Freundes-Bestenliste einführen',
      'Abnutzungs-Optik als Prestige-Feature ausbauen',
    ],
    effort: { min: 'medium', typical: 'medium' },
    multiplayer: 'solo',
    tags: ['cards', 'runs', 'strategy', 'collection'],
  },

  // ------------------------------------------------------------------- merge
  {
    key: 'merge_robot_workshop',
    genre: 'merge',
    fantasy:
      'Du verschmilzt {place} Ersatzteile zu Baugruppen und erweckst damit Stück für Stück liebenswerte Alt-Roboter wieder zum Leben.',
    essence: 'Reparatur-Geschichten auf dem Merge-Brett',
    coreLoop: [
      'Teile-Quellen anzapfen und Brett füllen',
      'Teile zu höheren Baugruppen verschmelzen',
      'Roboter-Aufträge mit Baugruppen erfüllen',
      'Reparierte Roboter einweihen und Werkstatt ausbauen',
      'Neue Teil-Familien und Auftragsreihen freischalten',
    ],
    usp: 'Jede Merge-Kette endet in einer Figur mit Gesicht: Du produzierst keine Zahlen, du weckst Persönlichkeiten.',
    hook: 'Reparierte Roboter bleiben in der Werkstatt, helfen beim Sortieren und erzählen Fragmente ihrer früheren Leben.',
    twists: [
      'Der Clou: Roboter erinnern sich an falsche Teile – charmante Macken bleiben absichtlich erhalten.',
      'Der Clou: Ein Bauteil pro Tag ist ein „Fundstück“ mit Geschichte und Bonus.',
      'Der Clou: Fertige Roboter wünschen sich gelegentlich Upgrades und bringen dafür Geschenke.',
    ],
    monetization: [
      angle('iap_consumables', 'Energie- und Teile-Pakete in transparenten Stufen.'),
      angle('rewarded_ads', 'Optionale Werbung füllt die Teile-Quelle sofort auf.'),
      angle('battle_pass', 'Saisonale Auftragsreihe mit kosmetischen Werkstatt-Deko-Meilensteinen.'),
      angle('cosmetics', 'Werkstatt-Themen und Roboter-Lackierungen.'),
      angle('game_passes', 'Der „Meisterbrief“-Pass schaltet ein größeres Brett frei.'),
      angle('developer_products', 'Auftrags-Booster als kleine Verbrauchsprodukte.'),
    ],
    risks: [
      risk(
        'Energie-Systeme wirken schnell geizig',
        'medium',
        'Großzügige Gratis-Schleifen und Energie nur als Tempo-, nie als Fortschritts-Bremse.',
      ),
      risk(
        'Brett-Chaos frustriert Ordnungsliebende',
        'low',
        'Auto-Sortieren und Lager-Slots früh freischalten.',
      ),
      risk(
        'Merge-Markt ist von Giganten besetzt',
        'high',
        'Roboter-Persönlichkeiten und Erzähl-Momente als klaren Unterschied ausspielen.',
      ),
    ],
    successReasons: [
      'Merge-Kernschleife ist bewährt eingängig',
      'Reparatur-Fantasie gibt dem Grind ein warmes Ziel',
      'Roboter-Charaktere sind Marketing-Gesichter',
      'Sehr gute Eignung für kurze Sessions',
    ],
    failReasons: [
      'User-Acquisition-Kosten im Merge-Genre sind brutal',
      'Ohne Story-Charme bleibt nur Standard-Merge',
      'Content-Bedarf an Teil-Familien wächst stetig',
      'Energie-Balancing entscheidet über Bewertungen',
    ],
    improvements: [
      'Ersten Roboter bereits in Minute fünf erwachen lassen',
      'Fundstück-des-Tages als Login-Ritual gestalten',
      'Roboter-Album mit Erinnerungs-Fragmenten einführen',
      'Werkstatt-Helfer als spürbare Komfort-Progression ausbauen',
    ],
    effort: { min: 'tiny', typical: 'small' },
    multiplayer: 'solo',
    tags: ['merge', 'cozy', 'collection', 'story'],
  },
  {
    key: 'merge_habitat_grove',
    genre: 'merge',
    fantasy:
      'Du kombinierst {place} Samen, Nester und Quellen zu wachsenden Lebensräumen, in die nach und nach scheue Tierarten einziehen.',
    essence: 'Lebensräume statt Gegenstände',
    coreLoop: [
      'Naturelemente auf dem Brett verschmelzen',
      'Lebensräume zu Biotopen verbinden',
      'Tierarten anlocken und beobachten',
      'Biotop-Wünsche erfüllen und Areal erweitern',
      'Seltene Arten und Jahreszeiten freischalten',
    ],
    usp: 'Das Brett ist ein lebendes Diorama: Fusionen bauen keine Items, sondern ein Ökosystem, das sichtbar zwitschert und blüht.',
    hook: 'Eingezogene Tiere lassen sich im Beobachtungs-Modus belauschen – Geduld wird mit Verhaltens-Entdeckungen belohnt.',
    twists: [
      'Der Clou: Tiere interagieren – der Fuchs zieht erst ein, wenn die Mäuse ein Versteck haben.',
      'Der Clou: Regenwolken sind Merge-Objekte, die Wachstum in ihrem Radius beschleunigen.',
      'Der Clou: Nachts verwandelt sich das Brett und nachtaktive Ketten werden möglich.',
    ],
    monetization: [
      angle('iap_consumables', 'Samen- und Wolken-Pakete in kleinen Stufen.'),
      angle('rewarded_ads', 'Optionale Werbung lockt einen Besucher-Schwarm an.'),
      angle('battle_pass', 'Saisonale Arten-Reihe mit kosmetischen Beobachtungs-Hütten.'),
      angle('cosmetics', 'Zaun-Stile, Wege und Beobachtungs-Deko.'),
      angle('game_passes', 'Der „Ranger“-Pass schaltet das Fernglas mit Detail-Ansichten frei.'),
    ],
    risks: [
      risk(
        'Ökosystem-Regeln zu komplex fürs Genre',
        'medium',
        'Abhängigkeiten als einfache Wunsch-Sprechblasen kommunizieren.',
      ),
      risk(
        'Ruhiges Konzept ohne Umsatzdruck-Momente',
        'medium',
        'Saisonarten und Beobachtungs-Sammlung als sanfte Kaufanlässe nutzen.',
      ),
      risk(
        'Brett-Verwandlung bei Nacht verwirrt',
        'low',
        'Weiche Übergänge und getrennte Fortschritts-Anzeigen je Tageszeit.',
      ),
    ],
    successReasons: [
      'Naturbeobachtung trifft einen wachsenden Entspannungs-Trend',
      'Tier-Interaktionen erzeugen echte Aha-Momente',
      'Diorama-Optik hebt sich stark von Merge-Standardware ab',
      'Saisonale Artenvielfalt ist ein natürlicher Event-Kalender',
    ],
    failReasons: [
      'Kern-Merge-Fans könnten das Tempo zu ruhig finden',
      'Verhaltens-Animationen sind aufwendig',
      'Ohne klare Ziele droht Beliebigkeit',
      'Genre-Marketing setzt auf Dringlichkeit, die hier fehlt',
    ],
    improvements: [
      'Fuchs-und-Mäuse-Moment als Tutorial-Höhepunkt setzen',
      'Beobachtungs-Tagebuch mit Sammel-Belohnungen führen',
      'Nacht-Brett als Überraschung der zweiten Session heben',
      'Foto-Funktion für Diorama-Ausschnitte einbauen',
    ],
    effort: { min: 'small', typical: 'small' },
    multiplayer: 'optional',
    tags: ['merge', 'cozy', 'animals', 'collection', 'seasonal'],
  },

  // ------------------------------------------------------------------ runner
  {
    key: 'runner_wall_dash',
    genre: 'runner',
    fantasy:
      'Du sprintest {place} senkrechte Wände hinauf, schwingst dich am Enterhaken durch Schluchten und jagst die perfekte Linie nach oben.',
    essence: 'vertikales Tempo mit Enterhaken-Flow',
    coreLoop: [
      'Aufstieg starten und Route wählen',
      'Wallruns, Sprünge und Hakenwürfe verketten',
      'Combo-Flow halten und Tempo aufbauen',
      'Gipfel erreichen und Stil-Wertung kassieren',
      'Neue Routen, Haken und Anzüge freischalten',
    ],
    usp: 'Der Enterhaken hat Physik-Momentum: Wer den Schwung versteht, fliegt Linien, die niemand vorgezeichnet hat.',
    hook: 'Die Top-Linien der Woche hängen als leuchtende Geister-Spuren an der Wand – lauf gegen die Legende.',
    twists: [
      'Der Clou: Combo-Flow verlangsamt subjektiv die Zeit – Meisterschaft fühlt sich wie Zeitlupe an.',
      'Der Clou: Abkürzungen sind sichtbar, aber nur mit riskanten Hakenmanövern erreichbar.',
      'Der Clou: Wetterwechsel machen Wände rutschig oder griffig – die Ideallinie lebt.',
    ],
    monetization: [
      angle('cosmetics', 'Anzüge, Haken-Skins und Spurenfarben.'),
      angle('battle_pass', 'Saison-Aufstieg mit kosmetischen Meilensteinen.'),
      angle('rewarded_ads', 'Optionale Werbung gewährt einen Neustart am letzten Höhen-Checkpoint.'),
      angle('game_passes', 'Der „Seilmeister“-Pass schaltet den Replay-Editor frei.'),
      angle('iap_non_consumables', 'Einmalkauf „Gipfel-Paket“ mit drei Bonus-Bergen.'),
      angle('developer_products', 'Zeitrennen-Tickets für Wochen-Events.'),
    ],
    risks: [
      risk(
        'Steuerung auf Touch zu anspruchsvoll',
        'high',
        'Auto-Grip als Standard, Profi-Steuerung optional; beides früh testen.',
      ),
      risk(
        'Skill-Decke schreckt Gelegenheitsspieler ab',
        'medium',
        'Routen in klaren Schwierigkeits-Farben und garantierte Gipfel-Wege anbieten.',
      ),
      risk(
        'Content-Bedarf an Bergen',
        'medium',
        'Wetter- und Tageszeit-Varianten bestehender Routen als Multiplikator.',
      ),
    ],
    successReasons: [
      'Movement-Flow erzeugt hohe Clip-Tauglichkeit',
      'Geister-Spuren verwandeln Solo-Läufe in Duelle',
      'Stil-Wertung belohnt Kreativität statt nur Tempo',
      'Vertikalität hebt sich vom Endless-Runner-Einerlei ab',
    ],
    failReasons: [
      'Physik-Enterhaken ist schwer massentauglich zu tunen',
      'Frust bei Abstürzen ohne faire Checkpoints',
      'Kern-Publikum ist klein, wenn Casual-Rampe fehlt',
      'Bewegungs-Erwartungen von Genre-Meistern sind hoch',
    ],
    improvements: [
      'Zeitlupen-Flow-Moment ins erste Level legen',
      'Geister-Duelle gegen Freunde mit einem Tipp starten',
      'Wöchentlichen Berg mit fixem Wetter für Ranglisten festlegen',
      'Sturz-Momente mit sofortigem Respawn entschärfen',
    ],
    effort: { min: 'tiny', typical: 'small' },
    multiplayer: 'optional',
    tags: ['movement', 'short_sessions', 'competition', 'flow'],
  },
  {
    key: 'runner_relay_shift',
    genre: 'runner',
    fantasy:
      'Du wechselst {place} mitten im Lauf zwischen drei Läufern mit eigenen Talenten – der Staffelstab-Moment entscheidet über alles.',
    essence: 'Charakterwechsel als Kern-Skill',
    coreLoop: [
      'Team aus drei Läufern zusammenstellen',
      'Streckenabschnitte dem passenden Talent zuordnen',
      'Im Lauf punktgenau wechseln',
      'Staffel-Boni kassieren und Team verbessern',
      'Neue Läufer-Talente und Strecken freischalten',
    ],
    usp: 'Der Wechsel ist das Manöver: Wer im richtigen Schritt übergibt, nimmt den Schwung des Vorgängers mit.',
    hook: 'Perfekte Staffelketten füllen ein Team-Emblem auf, das im Ziel als Feuerwerk aller drei Läufer explodiert.',
    twists: [
      'Der Clou: Inaktive Läufer erholen sich und laden Spezialfähigkeiten auf.',
      'Der Clou: Manche Hindernisse sind nur für ein Talent passierbar – Routenplanung ist Pflicht.',
      'Der Clou: Im Duo-Modus steuern zwei Spieler abwechselnd dasselbe Team.',
    ],
    monetization: [
      angle('cosmetics', 'Trikots, Staffelstab-Skins und Ziel-Feuerwerke.'),
      angle('rewarded_ads', 'Optionale Werbung gewährt einen Talent-Neuwurf vor dem Lauf.'),
      angle('iap_consumables', 'Trainings-Pakete für Läufer-Fortschritt in kleinen Stufen.'),
      angle('battle_pass', 'Saison-Staffel mit kosmetischen Team-Sets.'),
      angle('game_passes', 'Der „Trainer“-Pass schaltet die Team-Analyse mit Wechsel-Statistiken frei.'),
    ],
    risks: [
      risk(
        'Wechsel-Timing überfordert Einsteiger',
        'medium',
        'Großzügige Wechselfenster am Anfang, Präzisions-Boni erst für Fortgeschrittene.',
      ),
      risk(
        'Drei Charaktere verdreifachen Animations-Aufwand',
        'medium',
        'Gemeinsames Rig mit Talent-Auren statt komplett eigener Bewegungs-Sets.',
      ),
      risk(
        'Runner-Markt ist übersättigt',
        'high',
        'Staffel-Mechanik als klaren, bewerbbaren Unterschied zuspitzen.',
      ),
    ],
    successReasons: [
      'Wechsel-Mechanik gibt dem Genre eine Denk-Ebene',
      'Team-Aufbau erzeugt Sammel- und Ausbau-Motivation',
      'Duo-Modus ist ein origineller Koop-Anker',
      'Kurze Läufe passen in jede Alltagslücke',
    ],
    failReasons: [
      'Ohne präzises Wechselgefühl bleibt nur Standard-Runner',
      'Talent-Balancing kann Strecken trivialisieren',
      'Genre-Müdigkeit bei Spielern und Presse',
      'Team-Progression kann grindig kippen',
    ],
    improvements: [
      'Schwung-Mitnahme visuell und haptisch spürbar machen',
      'Tages-Staffel mit fester Team-Vorgabe einführen',
      'Duo-Modus mit Freundes-Einladung im Hauptmenü verankern',
      'Routen-Vorschau mit Talent-Symbolen anbieten',
    ],
    effort: { min: 'small', typical: 'small' },
    multiplayer: 'optional',
    tags: ['movement', 'characters', 'coop', 'short_sessions'],
  },

  // ------------------------------------------------------------------ sports
  {
    key: 'sports_turmball',
    genre: 'sports',
    fantasy:
      'Du spielst {place} Turmball: zwei Teams, ein springender Ball und Türme, die während des Matches wachsen, wenn ihr Punkte stapelt.',
    essence: 'einen erfundenen Sport mit Bau-Element',
    coreLoop: [
      'Match finden und Team-Rollen wählen',
      'Ballwechsel gewinnen und Punkte stapeln',
      'Turm-Etagen setzen und Spielfeld verändern',
      'Matches gewinnen und Liga aufsteigen',
      'Neue Arenen und Team-Rituale freischalten',
    ],
    usp: 'Punkte sind Bausteine: Jeder gewonnene Ballwechsel verändert die Arena physisch – kein Match gleicht dem anderen.',
    hook: 'Siegerteams hinterlassen ihren fertigen Turm für einen Tag in der Arena-Galerie des Servers.',
    twists: [
      'Der Clou: Der Ball nimmt Effet aus Turm-Kanten – Baustil ist Spielstil.',
      'Der Clou: In der Schlussminute dürfen beide Teams eine Etage des Gegners versetzen.',
      'Der Clou: Fan-NPCs strömen zu spektakulären Türmen und geben Heimvorteil.',
    ],
    monetization: [
      angle('cosmetics', 'Trikots, Ball-Designs und Turm-Baustile.'),
      angle('battle_pass', 'Saison-Liga mit kosmetischen Fan-Artikeln.'),
      angle('game_passes', 'Der „Vereinsheim“-Pass schaltet Team-Räume und Taktiktafel frei.'),
      angle('developer_products', 'Turnier-Startgelder für Wochenend-Cups.'),
      angle('iap_non_consumables', 'Einmalkauf „Arena-Paket Uferpark“.'),
      angle('rewarded_ads', 'Optionale Werbung zeigt die Taktik-Analyse des letzten Matches.'),
    ],
    risks: [
      risk(
        'Erfundene Sportregeln muss man erst lernen',
        'medium',
        'Regel-Einführung in 90 Sekunden spielbar machen; Zuschauen vor Mitspielen erlauben.',
      ),
      risk(
        'Physik-Fairness bei Ball und Türmen',
        'high',
        'Deterministische Ballphysik serverseitig, Replays als Beweis-System.',
      ),
      risk(
        'Team-Population für faire Matches',
        'high',
        'Bots mit ehrlicher Kennzeichnung und flexible Teamgrößen (2v2 bis 4v4).',
      ),
    ],
    successReasons: [
      'Eigener Sport bedeutet keine Lizenzkosten und volle Design-Freiheit',
      'Bau-Element macht jedes Match erzählenswert',
      'Turm-Galerie belohnt Sieg mit sichtbarem Denkmal',
      'Kurze Matches passen in mobile Zeitfenster',
    ],
    failReasons: [
      'Neue Sportarten haben es im Marketing schwer',
      'Kompetitive Physik-Erwartungen sind hoch',
      'Ohne Population keine Ligen-Dynamik',
      'Regel-Komplexität kann Zuschauer verwirren',
    ],
    improvements: [
      'Effet-aus-Kanten-Mechanik im Training erlebbar machen',
      'Schlussminuten-Versetzung als dramaturgisches Highlight promoten',
      'Vereins-System mit wöchentlichen Ritualen einführen',
      'Zuschauer-Modus mit Wett-Stickern ohne Echtgeld ergänzen',
    ],
    effort: { min: 'small', typical: 'medium' },
    multiplayer: 'required',
    tags: ['teams', 'pvp', 'physical', 'building'],
  },
  {
    key: 'sports_island_precision_golf',
    genre: 'sports',
    fantasy:
      'Du schlägst {place} Präzisionsbälle über Abgründe, Windkanten und bewegliche Plattformen – ein Kurs, den die Welt selbst umbaut.',
    essence: 'Präzision in lebender Kulisse',
    coreLoop: [
      'Kurs lesen und Wind einschätzen',
      'Schlagstärke und Effet dosieren',
      'Weltbewegungen für Trickschläge nutzen',
      'Runden abschließen und Bestwerte setzen',
      'Neue Kurse und Schläger-Stile freischalten',
    ],
    usp: 'Die Bahn lebt: Plattformen schwenken, Wind dreht, Tiere spazieren durchs Grün – Timing ist der halbe Schlag.',
    hook: 'Asynchrone Duelle: Du spielst gegen die aufgezeichnete Runde deiner Freunde, Schlag für Schlag als Geist neben dir.',
    twists: [
      'Der Clou: Ein Vertrauens-Schlag pro Runde ignoriert den Wind – wann du ihn nutzt, ist die Meta.',
      'Der Clou: Bälle bekommen Reisekratzer und erzählen ihre Lieblingsbahnen.',
      'Der Clou: Zur vollen Stunde ordnen sich alle beweglichen Elemente einmal komplett neu.',
    ],
    monetization: [
      angle('cosmetics', 'Ball-Designs, Schläger-Stile und Flugspuren.'),
      angle('iap_non_consumables', 'Kurs-Pakete als dauerhafte Einmalkäufe.'),
      angle('rewarded_ads', 'Optionale Werbung gewährt eine Wind-Vorschau für ein Loch.'),
      angle('game_passes', 'Der „Platzwart“-Pass schaltet den Kurs-Editor frei.'),
      angle('battle_pass', 'Saison-Tour mit kosmetischen Souvenirs.'),
      angle('developer_products', 'Turnier-Einschreibungen für Wochenend-Touren.'),
    ],
    risks: [
      risk(
        'Bewegliche Elemente wirken willkürlich',
        'medium',
        'Alle Bewegungen auf sichtbare Rhythmen takten; Vorschau-Geist beim Zielen.',
      ),
      risk(
        'Golf-Nische auf jungen Plattformen',
        'medium',
        'Fantasy-Kulisse und kurze Neun-Loch-Runden statt Sport-Simulation vermarkten.',
      ),
      risk(
        'Asynchrone Duelle brauchen Anti-Cheat',
        'medium',
        'Runden serverseitig aufzeichnen und physikalisch validieren.',
      ),
    ],
    successReasons: [
      'Asynchrones PvP funktioniert ohne kritische Masse',
      'Lebende Kurse liefern täglich neue Screenshots',
      'Präzisions-Gameplay altert nicht',
      'Kurs-Editor verlängert die Lebenszeit durch Community',
    ],
    failReasons: [
      'Golf-Skeptiker geben dem Spiel keine erste Chance',
      'Physik-Feinheit ist auf Touch schwer zu dosieren',
      'Kurs-Design in lebender Kulisse ist teuer',
      'Ohne Social-Layer bleibt es ein stilles Solospiel',
    ],
    improvements: [
      'Vertrauens-Schlag als Signature-Moment bewerben',
      'Stunden-Umbau als Server-Ereignis mit Countdown feiern',
      'Freundes-Geister standardmäßig aktivieren',
      'Ball-Reisetagebuch als Sammelalbum ausbauen',
    ],
    effort: { min: 'small', typical: 'medium' },
    multiplayer: 'optional',
    tags: ['precision', 'async', 'competition', 'relaxing'],
  },
];
