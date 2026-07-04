import type { Genre } from '../types/common';

/**
 * Genre-specific building blocks for the GDD generator.
 * All display strings are German (user-facing); identifiers are English.
 * Every entry is original work - no borrowed brands, characters or IPs.
 */

export interface EconomyCurrency {
  name: string;
  kind: 'Soft' | 'Hard' | 'Fortschritt' | 'Sozial' | 'Ressource';
  earn: string[];
  spend: string[];
  /** Sink/source balance guidance for this currency. */
  balance: string;
}

export interface ExampleItem {
  name: string;
  effect: string;
  rarity: 'Gewöhnlich' | 'Selten' | 'Episch' | 'Legendär';
}

export interface ExampleEnemy {
  name: string;
  role: string;
  behavior: string;
}

export interface ExampleQuest {
  name: string;
  goal: string;
  reward: string;
}

export interface BalancingValue {
  parameter: string;
  start: string;
  note: string;
}

export interface EventIdea {
  name: string;
  concept: string;
}

/** How the "Gegner & Bosse" section should frame its entries. */
export type EnemyFraming = 'enemies' | 'obstacles' | 'rivals';

export interface GenreContent {
  /** One-sentence description of the genre experience (German). */
  pitch: string;
  /** Original setting ideas; one is picked per project. */
  themes: string[];
  /** Default core loop when the project has no linked idea. */
  coreLoop: string[];
  /** Typical target session length in minutes [min, max]. */
  sessionMinutes: readonly [number, number];
  progressionModel: string;
  progressionCurve: string;
  milestones: string[];
  metaProgression: string;
  currencies: EconomyCurrency[];
  items: ExampleItem[];
  enemyFraming: EnemyFraming;
  enemies: ExampleEnemy[];
  quests: ExampleQuest[];
  balancing: BalancingValue[];
  levelDesignNotes: string[];
  retentionHooks: string[];
  eventIdeas: EventIdea[];
  multiplayerAngle: string;
  /** Touch control scheme for the mobile implementation section. */
  touchControls: string;
}

export const GENRE_CONTENT: Record<Genre, GenreContent> = {
  simulator: {
    pitch:
      'Sammeln, verbessern, automatisieren: Die eigene Anlage wächst sichtbar mit jeder Spielminute.',
    themes: [
      'Kristallmine auf einem Schwebe-Archipel',
      'Tiefsee-Forschungsstation voller Biolumineszenz',
      'Wolkenfarm, auf der Früchte am Himmel reifen',
    ],
    coreLoop: [
      'Ressourcen an Hotspots abbauen',
      'Beute am Depot verkaufen',
      'Werkzeug und Rucksack verbessern',
      'Neue Zone freischalten',
      'Seltene Funde ins Sammelalbum legen',
    ],
    sessionMinutes: [8, 15],
    progressionModel: 'Zonen- und Werkzeugstufen mit Rebirth',
    progressionCurve:
      'Exponentielle Upgrade-Kosten (Faktor ca. 1,6 pro Stufe) gegen linear steigende Erträge; alle 15–20 Minuten steht ein spürbarer Machtsprung an, damit die Kurve nie zäh wird.',
    milestones: [
      'Minute 3: erstes Werkzeug-Upgrade gekauft',
      'Minute 10: erster Helfer automatisiert eine Sammelroute',
      'Tag 1: Zone 2 freigeschaltet',
      'Tag 3: erster legendärer Fund im Sammelalbum',
      'Woche 1: Rebirth 1 mit permanentem Multiplikator ×1,5',
    ],
    metaProgression:
      'Rebirth setzt Währung und Zonen zurück, gewährt dafür einen permanenten Ertrags-Multiplikator und exklusive Sammelalbum-Seiten.',
    currencies: [
      {
        name: 'Münzen',
        kind: 'Soft',
        earn: ['Ressourcen verkaufen', 'Tagesaufträge', 'Sammelalbum-Boni'],
        spend: ['Werkzeug-Upgrades', 'Rucksack-Erweiterung', 'Zonen-Freischaltung'],
        balance:
          'Upgrade-Kosten wachsen schneller als Erträge, damit Münzen nie lange gehortet werden.',
      },
      {
        name: 'Sternsplitter',
        kind: 'Hard',
        earn: ['Seltene Funde', 'Wochenziele', 'Events'],
        spend: ['Werkzeug-Skins', 'Zusätzliche Helfer-Slots', 'Routen-Zeitsprünge'],
        balance: 'Knapp halten: 3–5 pro aktiver Spielstunde; Sinks kosten 20–150 Stück.',
      },
    ],
    items: [
      { name: 'Kupferpickel', effect: 'Startwerkzeug, Abbautempo Basis', rarity: 'Gewöhnlich' },
      { name: 'Magnethandschuh', effect: 'Zieht Drops im Umkreis von 6 m an', rarity: 'Selten' },
      { name: 'Sammeldrohne „Pip"', effect: 'Fliegt eine Route ab und sammelt automatisch', rarity: 'Episch' },
      { name: 'Turbo-Rucksack', effect: '+40 Tragekapazität', rarity: 'Selten' },
      { name: 'Prisma-Bohrer', effect: 'Baut zwei Adern gleichzeitig ab', rarity: 'Legendär' },
      { name: 'Glimmerkompass', effect: 'Zeigt die nächste seltene Ader an', rarity: 'Episch' },
    ],
    enemyFraming: 'obstacles',
    enemies: [
      { name: 'Felsbrocken-Blockade', role: 'Wegsperre', behavior: 'Erst mit Werkzeugstufe 2 abbaubar' },
      { name: 'Giftpilz-Feld', role: 'Flächengefahr', behavior: 'Verlangsamt beim Durchqueren, sichtbar pulsierend' },
      { name: 'Dichter Sporennebel', role: 'Sichtbehinderung', behavior: 'Verdeckt Adern, zieht alle 3 Minuten weiter' },
      { name: 'Streunender Staubgeist', role: 'Ärgernis', behavior: 'Stibitzt einen Drop und flieht; Fangen gibt Bonus' },
      { name: 'Einsturzstelle', role: 'Risikozone', behavior: 'Bessere Adern, aber Timer bis zum Einsturz' },
      { name: 'Wetterumschwung', role: 'Globaler Modifikator', behavior: 'Regen halbiert Sicht, verdoppelt Pilzwachstum' },
    ],
    quests: [
      { name: 'Fleißige Hände', goal: '500 Kristalle abbauen', reward: '250 Münzen' },
      { name: 'Feine Ware', goal: '3 seltene Funde verkaufen', reward: '5 Sternsplitter' },
      { name: 'Kartograf', goal: 'Zone 2 vollständig aufdecken', reward: 'Glimmerkompass-Bauplan' },
      { name: 'Blitzschicht', goal: '100 Ressourcen in 90 Sekunden', reward: '2 Sternsplitter' },
      { name: 'Sammlerstolz', goal: 'Eine Album-Seite vervollständigen', reward: 'Permanenter Bonus +2 %' },
      { name: 'Helferherz', goal: 'Helfer 5 Routen laufen lassen', reward: '300 Münzen' },
    ],
    balancing: [
      { parameter: 'Abbauzeit pro Ressource', start: '2,0 s', note: 'Mit Werkzeugstufe bis 0,8 s sinkend' },
      { parameter: 'Basis-Verkaufswert', start: '5 Münzen', note: 'Zonen-Multiplikator ×1,4 je Zone' },
      { parameter: 'Upgrade-Kostenfaktor', start: '×1,6 pro Stufe', note: 'Kernhebel gegen Inflation' },
      { parameter: 'Rucksack-Startkapazität', start: '25 Slots', note: 'Erzwingt frühe Verkaufs-Loops' },
      { parameter: 'Rebirth-Schwelle', start: '250.000 Münzen', note: 'Erste Rebirth nach ca. 5–7 Stunden' },
      { parameter: 'Chance auf seltenen Fund', start: '2 %', note: 'Pity-Zähler: garantiert nach 80 Abbauten' },
    ],
    levelDesignNotes: [
      'Zonen ringförmig um das Depot anordnen; Laufweg zum Verkauf nie länger als 20 Sekunden.',
      'Jede Zone bekommt eine unverwechselbare Landmarke zur Orientierung.',
      'Seltene Adern glitzern sichtbar – Entdeckerfreude statt Zufallsfrust.',
      'Gesperrte Zonen sind einsehbar und machen Appetit auf den nächsten Kauf.',
    ],
    retentionHooks: ['Tagesaufträge mit Bonus-Splittern', 'Sammelalbum mit Seiten-Boni', 'Rotierende Hotspot-Zonen'],
    eventIdeas: [
      { name: 'Goldrausch-Wochenende', concept: 'Doppelte Adern-Spawns und ein exklusiver Album-Sticker.' },
      { name: 'Kometensplitter', concept: 'Zeitlich begrenzte Event-Ressource mit eigener Album-Seite.' },
      { name: 'Werkzeugmesse', concept: 'Community-Voting über den nächsten Werkzeug-Skin.' },
    ],
    multiplayerAngle:
      'Gemeinsame Welt mit persönlichen Erträgen; Koop-Bohrungen an Großadern geben allen Beteiligten einen Gruppenbonus. Direkter Handel bleibt bewusst draußen (Scam-Schutz).',
    touchControls:
      'Ein-Daumen-Spiel: Tippen und Halten baut ab, Auto-Lauf zur markierten Ader, Radialmenü für den Werkzeugwechsel.',
  },

  tycoon: {
    pitch:
      'Aus einem leeren Grundstück wird ein Betrieb: bauen, optimieren, delegieren – und beim Prestige noch einmal klüger neu starten.',
    themes: [
      'Limonadenfabrik mit verrückten Geschmacksmaschinen',
      'Raumhafen-Frachtterminal zwischen zwei Monden',
      'Selbstgebauter Freizeitpark am Stadtrand',
    ],
    coreLoop: [
      'Produktion laufen lassen',
      'Umsatz einsammeln',
      'Neue Anlage kaufen oder aufwerten',
      'Engpass im Produktionsfluss finden und beheben',
      'Meilenstein erreichen und Bonus wählen',
    ],
    sessionMinutes: [10, 20],
    progressionModel: 'Umsatz-Meilensteine mit Prestige-Neustart',
    progressionCurve:
      'Einnahmen pro Sekunde wachsen stufig mit jeder Anlage; Meilensteine bei 1.000 / 10.000 / 100.000 / 1 Mio. Umsatz schalten neue Anlagen-Klassen frei. Prestige lohnt sich, sobald die Kurve spürbar abflacht (ca. 45–60 Minuten Spielzeit).',
    milestones: [
      '1.000 Umsatz: zweite Produktionslinie',
      '10.000 Umsatz: Lager und Logistik freigeschaltet',
      '100.000 Umsatz: Automatisierungs-Manager stellt sich vor',
      '1 Mio. Umsatz: Premium-Produktlinie',
      'Prestige 1: Startkapital-Bonus +25 % dauerhaft',
    ],
    metaProgression:
      'Prestige tauscht den Betrieb gegen Aktien; Aktien kaufen permanente Boni wie Startkapital, Produktionstempo und Offline-Ertrag.',
    currencies: [
      {
        name: 'Umsatz',
        kind: 'Soft',
        earn: ['Produktverkauf pro Sekunde', 'Großaufträge', 'Meilenstein-Boni'],
        spend: ['Anlagenkauf', 'Anlagen-Upgrades', 'Grundstückserweiterung'],
        balance: 'Anlagenkosten wachsen mit Faktor 1,7 – der Kaufreflex bleibt der zentrale Sink.',
      },
      {
        name: 'Aktien',
        kind: 'Fortschritt',
        earn: ['Prestige-Neustart (1 Aktie je 50.000 Gesamtumsatz)'],
        spend: ['Permanente Boni im Prestige-Baum'],
        balance: 'Jede Prestige-Runde soll 2–4 sinnvolle Käufe ermöglichen.',
      },
      {
        name: 'Goldschrauben',
        kind: 'Hard',
        earn: ['Wochenziele', 'Events', 'Seltene Großaufträge'],
        spend: ['Deko-Objekte', 'Blaupausen-Slots', 'Manager-Skins'],
        balance: 'Rein kosmetisch/komfortabel – niemals Produktionsvorteile verkaufen.',
      },
    ],
    items: [
      { name: 'Fließband Mk I', effect: 'Basisproduktion, 2 Umsatz/s', rarity: 'Gewöhnlich' },
      { name: 'Aromamixer 3000', effect: 'Veredelt Produkte, +60 % Wert', rarity: 'Selten' },
      { name: 'Lagerbot „Stapelfix"', effect: 'Verhindert Staus am Lager', rarity: 'Selten' },
      { name: 'Expresskran', effect: 'Verbindet zwei entfernte Linien', rarity: 'Episch' },
      { name: 'Werbeholoschild', effect: '+15 % Umsatz auf dem ganzen Grundstück', rarity: 'Episch' },
      { name: 'Qualitätsscanner', effect: '5 % Chance auf Premium-Charge (×5 Wert)', rarity: 'Legendär' },
    ],
    enemyFraming: 'obstacles',
    enemies: [
      { name: 'Maschinenausfall', role: 'Störung', behavior: 'Zufällige Anlage stoppt; ein Tipp repariert sie' },
      { name: 'Materialstau', role: 'Fluss-Problem', behavior: 'Entsteht ab 85 % Auslastung einer Linie' },
      { name: 'Stromspitze', role: 'Tempo-Dämpfer', behavior: 'Halbiert 60 s lang das Produktionstempo' },
      { name: 'Inspektionsbesuch', role: 'Mini-Aufgabe', behavior: 'Drei Prüfpunkte abarbeiten, Bonus bei Bestnote' },
      { name: 'Preisverfall', role: 'Markt-Ereignis', behavior: 'Produktwert -20 % für 2 Minuten, kündigt sich an' },
      { name: 'Platzregen', role: 'Außenbereichs-Risiko', behavior: 'Außenanlagen pausieren, Hallen laufen weiter' },
    ],
    quests: [
      { name: 'Erster Gewinn', goal: '1.000 Umsatz erwirtschaften', reward: 'Meilenstein-Bonuswahl' },
      { name: 'Fließend', goal: '5 Minuten ohne Materialstau', reward: '200 Umsatz-Bonus' },
      { name: 'Ausbau', goal: '10 Anlagen gleichzeitig betreiben', reward: '3 Goldschrauben' },
      { name: 'Feinschliff', goal: 'Eine Anlage auf Stufe 5 bringen', reward: 'Blaupausen-Slot' },
      { name: 'Großauftrag', goal: '500 Einheiten in einer Session liefern', reward: '5 Goldschrauben' },
      { name: 'Neustart mit Plan', goal: 'Erstes Prestige durchführen', reward: 'Exklusive Fabrik-Fahne' },
    ],
    balancing: [
      { parameter: 'Basis-Einnahme', start: '2 Umsatz/s', note: 'Referenz für alle Anlagen-Multiplikatoren' },
      { parameter: 'Anlagen-Kostenfaktor', start: '×1,7 pro Kauf', note: 'Wichtigster Inflations-Hebel' },
      { parameter: 'Offline-Ertrag', start: '40 %, max. 6 h', note: 'Belohnt Wiederkehr ohne Online-Zwang' },
      { parameter: 'Prestige-Kurs', start: '1 Aktie je 50.000 Umsatz', note: 'Erste Prestige nach 45–60 Min anpeilen' },
      { parameter: 'Stau-Schwelle', start: '85 % Auslastung', note: 'Erzeugt das zentrale Optimierungs-Puzzle' },
      { parameter: 'Meilenstein-Abstände', start: '×10 pro Stufe', note: 'Nach Playtests ggf. auf ×8 senken' },
    ],
    levelDesignNotes: [
      'Grundstück in klar lesbare Bauzonen teilen; der Produktionsfluss bleibt aus der Standardkamera sichtbar.',
      'Erweiterungsflächen sind sichtbar, aber gesperrt – der nächste Kauf ist immer greifbar.',
      'Deko-Flächen ohne Funktionsdruck für Selbstausdruck reservieren.',
      'Besucherpfad am Rand, damit Gäste den Betrieb bestaunen können, ohne den Fluss zu stören.',
    ],
    retentionHooks: ['Meilenstein-Bonuswahl', 'Tagesauftrag „Großkunde"', 'Prestige-Sammlung mit Fabrik-Fahnen'],
    eventIdeas: [
      { name: 'Messe-Woche', concept: 'Sonderaufträge mit Themenprodukten und Deko-Belohnungen.' },
      { name: 'Nachtschicht', concept: 'Ein Wochenende lang doppelter Offline-Ertrag.' },
      { name: 'Deko-Wettbewerb', concept: 'Community kürt den schönsten Betrieb; Sieger wird im Hub ausgestellt.' },
    ],
    multiplayerAngle:
      'Nachbar-Grundstücke auf derselben Karte; Besuche geben einen kleinen Inspirations-Bonus, Bestenliste nach Umsatz pro Prestige-Stufe hält den Vergleich fair.',
    touchControls:
      'Tippen platziert Anlagen auf dem Raster, Pinch-Zoom für Übersicht, Drag verlegt Förderwege; alles einhändig im Portrait-Modus bedienbar.',
  },

  obby: {
    pitch:
      'Präzises Springen mit fairen Checkpoints: kurz scheitern, sofort neu versuchen, sichtbar besser werden.',
    themes: [
      'Vulkanwerkstatt eines schusseligen Erfinders',
      'Zuckerwatte-Wolkenland über einem Jahrmarkt',
      'Innenleben eines antiken Uhrturms voller Zahnräder',
    ],
    coreLoop: [
      'Etappe starten',
      'Hindernisfolge lesen und springen',
      'Checkpoint erreichen',
      'Sterne für Tempo und Stil kassieren',
      'Nächste Etappe angehen oder Bestzeit jagen',
    ],
    sessionMinutes: [5, 12],
    progressionModel: 'Etappen-Fortschritt mit Sterne-Wertung',
    progressionCurve:
      'Schwierigkeit steigt pro Etappe um ca. 10 %; alle drei Etappen kommt eine neue Mechanik solo, danach in Kombination. Sterne (Tempo/Fehlversuche) sind die zweite, freiwillige Progressionsachse.',
    milestones: [
      'Etappe 5: erste Kombi-Mechanik gemeistert',
      'Etappe 10: Skip-Token verdient',
      'Welt 2 freigeschaltet',
      '50 Sterne: erster Trail-Effekt',
      'Speedrun-Modus freigespielt',
    ],
    metaProgression:
      'Sterne schalten Welten, Trails und den Speedrun-Modus frei; persönliche Bestzeiten pro Etappe sind das Langzeitziel.',
    currencies: [
      {
        name: 'Sterne',
        kind: 'Fortschritt',
        earn: ['Etappen-Abschluss', 'Tempo-Bonus', 'Fehlerfreier Lauf'],
        spend: ['Welten-Freischaltung', 'Speedrun-Modus'],
        balance: 'Welten verlangen ca. 70 % der bis dahin erreichbaren Sterne – Puffer gegen Frust.',
      },
      {
        name: 'Münzen',
        kind: 'Soft',
        earn: ['Einsammeln entlang der Route', 'Tages-Etappe'],
        spend: ['Trails', 'Emotes', 'Checkpoint-Skins'],
        balance: 'Rein kosmetische Sinks; Preisspanne 50–500, damit jede Session einem Ziel dient.',
      },
    ],
    items: [
      { name: 'Kometen-Trail', effect: 'Leuchtspur beim Sprint', rarity: 'Selten' },
      { name: 'Uhrwerk-Aura', effect: 'Tickende Partikel um den Charakter', rarity: 'Episch' },
      { name: 'Wolken-Emote-Paket', effect: '3 Sieges-Emotes', rarity: 'Gewöhnlich' },
      { name: 'Neon-Checkpoint-Skin', effect: 'Eigene Checkpoint-Optik', rarity: 'Selten' },
      { name: 'Ehrenband „Etappe 10"', effect: 'Sichtbares Abzeichen am Charakter', rarity: 'Episch' },
      { name: 'Regenbogen-Landung', effect: 'Partikeleffekt bei perfekter Landung', rarity: 'Legendär' },
    ],
    enemyFraming: 'obstacles',
    enemies: [
      { name: 'Schwingender Hammer', role: 'Rhythmus-Hindernis', behavior: 'Feste Periode, laut hörbar' },
      { name: 'Verschwindende Plattform', role: 'Timing-Test', behavior: 'Blinkt zweimal, dann 1,5 s weg' },
      { name: 'Laserraster', role: 'Präzisions-Hindernis', behavior: 'Wandert in lesbarem Muster' },
      { name: 'Förderband-Kreuzung', role: 'Steuerungs-Test', behavior: 'Schiebt quer zur Laufrichtung' },
      { name: 'Windkanal', role: 'Flugpassage', behavior: 'Trägt den Charakter, Lenken nötig' },
      { name: 'Klebeschleim-Feld', role: 'Tempo-Falle', behavior: 'Halbiert Sprunghöhe, glänzt sichtbar' },
    ],
    quests: [
      { name: 'Sauber gelandet', goal: 'Eine Etappe ohne Fehlversuch', reward: '3 Bonus-Sterne' },
      { name: 'Sprinter', goal: 'Etappe unter Zielzeit abschließen', reward: '50 Münzen' },
      { name: 'Sammler', goal: 'Alle Münzen einer Etappe einsammeln', reward: '25 Bonus-Münzen' },
      { name: 'Durchbeißer', goal: '10 Etappen an einem Tag schaffen', reward: 'Emote „Puh!"' },
      { name: 'Stilpunkte', goal: '3 Sterne auf 5 Etappen holen', reward: 'Kometen-Trail' },
      { name: 'Frühaufsteher', goal: 'Die Tages-Etappe abschließen', reward: '2 Bonus-Sterne' },
    ],
    balancing: [
      { parameter: 'Respawn-Zeit', start: '1,2 s', note: 'Scheitern darf nie langweilig machen' },
      { parameter: 'Etappenlänge', start: '45–90 s', note: 'Checkpoint mindestens alle 20–30 s' },
      { parameter: 'Ziel-Fehlerrate pro Hindernis', start: '15–25 %', note: 'Darüber: Hindernis entschärfen' },
      { parameter: 'Münzen pro Etappe', start: '10–15', note: 'Davon 3 an riskanten Nebenpfaden' },
      { parameter: 'Skip-Token', start: '1 je 10 Etappen', note: 'Anti-Frust-Ventil, kein Kaufgegenstand' },
      { parameter: 'Sprungweite Standard', start: '12 Studs / 4 m', note: 'Referenz für alle Lücken-Layouts' },
    ],
    levelDesignNotes: [
      'Die Sichtlinie zeigt immer den nächsten Checkpoint – Orientierung vor Schwierigkeit.',
      'Hindernis-Rhythmus: erst lesen, dann üben, dann kombinieren.',
      'Nach schweren Passagen kurze Ruheinseln mit Münz-Belohnung.',
      'Fail-Zonen ohne lange Fallzeiten – schnelles Scheitern, schnelles Neuprobieren.',
    ],
    retentionHooks: ['Tages-Etappe mit Bonus-Sternen', 'Geist-Replays der eigenen Bestzeit', 'Trail-Sammlung'],
    eventIdeas: [
      { name: 'Blitz-Parcours', concept: 'Wochen-Etappe mit eigener Rangliste und Sonder-Trail.' },
      { name: 'Rückwärts-Tag', concept: 'Bekannte Etappen in umgekehrter Richtung.' },
      { name: 'Bau-Voting', concept: 'Community stimmt über die nächste Etappe aus drei Entwürfen ab.' },
    ],
    multiplayerAngle:
      'Parallel-Lauf ohne Kollision, Geist-Replays von Freunden und eine Wochenrangliste je Etappe – Wettbewerb ohne Schubsen.',
    touchControls:
      'Virtueller Stick links, großer Sprung-Button rechts; Kamera folgt automatisch, optionaler Tap-Jump für Einhand-Spiel.',
  },

  rpg_lite: {
    pitch:
      'Kompaktes Action-Rollenspiel: klare Builds, kurze Dungeons, dicke Beute – ohne Zahlenfriedhof.',
    themes: [
      'Verwunschener Marktflecken am Rand eines Sporenwaldes',
      'Schwebende Ruinenstadt über einem Wüstenmeer',
      'Hafenstadt, in der Sternbilder als Geister umgehen',
    ],
    coreLoop: [
      'Quest im Hub annehmen',
      'Dungeon-Abschnitt räumen',
      'Beute und Erfahrung kassieren',
      'Ausrüstung verbessern oder umschmieden',
      'Stärkeren Abschnitt freischalten',
    ],
    sessionMinutes: [12, 25],
    progressionModel: 'Charakterlevel plus Ausrüstungs-Tiers',
    progressionCurve:
      'XP-Bedarf wächst mit Stufe^1,8; Ausrüstung in Tiers T1–T5, der Gear-Score öffnet neue Gebiete. Zwei Achsen (Level und Gear) verhindern harte Wände: Wer feststeckt, farmt die jeweils andere Achse.',
    milestones: [
      'Level 5: erste Spezialisierung wählen',
      'Erstes T2-Set komplett',
      'Erster Bosssieg (Pilzkönig Morlo)',
      'Level 15: zweite Fertigkeitenreihe',
      'T3-Schmiede im Hub freigeschaltet',
    ],
    metaProgression:
      'Umschmieden überträgt Werte auf neue Optik (Transmog-Feeling ohne Grind-Verlust); Bestiarium-Einträge geben permanente Kleinstboni.',
    currencies: [
      {
        name: 'Gold',
        kind: 'Soft',
        earn: ['Beute verkaufen', 'Questbelohnungen', 'Dungeon-Truhen'],
        spend: ['Tränke', 'Reparaturen', 'Händler-Ausrüstung'],
        balance: 'Tränke und Reparaturen als Dauer-Sink; Händlerpreise 3× Verkaufswert.',
      },
      {
        name: 'Runenstaub',
        kind: 'Ressource',
        earn: ['Ausrüstung zerlegen', 'Elite-Gegner'],
        spend: ['Umschmieden', 'Sockel neu würfeln'],
        balance: 'Zerlegen statt Verkaufen soll sich ab T2 lohnen – Staubwert leicht über Goldwert.',
      },
      {
        name: 'Heldenmarken',
        kind: 'Hard',
        earn: ['Wochenquests', 'Erstabschluss-Boni'],
        spend: ['Kosmetische Rüstungs-Färbungen', 'Zusätzliche Build-Slots'],
        balance: 'Keine Kampfkraft für Marken – nur Ausdruck und Komfort.',
      },
    ],
    items: [
      { name: 'Splitterklinge des Frühlichts', effect: 'Schnelle Klinge, +10 % Tempo bei vollem Leben', rarity: 'Episch' },
      { name: 'Moosgeflochtener Rundschild', effect: 'Blocken regeneriert 2 HP/s', rarity: 'Selten' },
      { name: 'Wanderstab „Knisterast"', effect: 'Kettenblitz auf 3 Ziele', rarity: 'Episch' },
      { name: 'Amulett der stillen Schritte', effect: 'Gegner bemerken dich 30 % später', rarity: 'Selten' },
      { name: 'Sporenfeste Stiefel', effect: 'Immun gegen Verlangsamung im Moor', rarity: 'Gewöhnlich' },
      { name: 'Ring des zweiten Atems', effect: 'Einmal pro Dungeon: überlebe mit 1 HP', rarity: 'Legendär' },
    ],
    enemyFraming: 'enemies',
    enemies: [
      { name: 'Moorlurch', role: 'Tank', behavior: 'Langsam, telegrafierter Flächenschlag' },
      { name: 'Rostgolem', role: 'Brecher', behavior: 'Zerstört Deckung, Schwachpunkt am Rücken' },
      { name: 'Schattenweberin', role: 'Fernkampf', behavior: 'Wirft verlangsamende Netze, flieht bei Nähe' },
      { name: 'Stachelwühler', role: 'Rudeljäger', behavior: 'Greift nur in Gruppen ab 3 an' },
      { name: 'Irrlicht-Schwarm', role: 'Störer', behavior: 'Blendet kurz, schwach, aber zahlreich' },
      { name: 'Pilzkönig Morlo', role: 'Boss', behavior: 'Drei Phasen mit Sporenwellen und Adds' },
    ],
    quests: [
      { name: 'Lichter im Moor', goal: '5 Irrlicht-Schwärme vertreiben', reward: '120 Gold + XP' },
      { name: 'Der stumme Glockenturm', goal: 'Mechanismus im Turm reparieren', reward: 'Amulett der stillen Schritte' },
      { name: 'Rost und Rache', goal: 'Den Rostgolem der Nordruine besiegen', reward: 'T2-Waffenkiste' },
      { name: 'Kräuter für Jorunn', goal: '8 Nebelblüten sammeln', reward: '3 große Heiltränke' },
      { name: 'Das Bestiarium, Seite eins', goal: '5 Gegnertypen katalogisieren', reward: 'Permanent +1 % Schaden' },
      { name: 'Morlos Erwachen', goal: 'Den Pilzkönig bezwingen', reward: 'Runenstaub ×40 + Titel' },
    ],
    balancing: [
      { parameter: 'Spieler-HP Start', start: '100', note: '+10 pro Level' },
      { parameter: 'Kill-Zeit Standardgegner', start: '4–6 s', note: 'Elite 15–20 s, Boss 90–150 s' },
      { parameter: 'XP-Kurve', start: 'Stufe 2 = 100 XP, Exponent 1,8', note: 'Level 10 nach ca. 3 Stunden' },
      { parameter: 'Heiltrank', start: '35 % HP, 8 s Abklingzeit', note: 'Kein Trank-Spam im Bosskampf' },
      { parameter: 'Drop-Rate Selten', start: '8 %', note: 'Episch 1,5 %, Legendär nur aus Bossen' },
      { parameter: 'Dungeon-Dauer', start: '8–12 Min', note: 'Passt in eine Mobile-Session' },
    ],
    levelDesignNotes: [
      'Ein Hub, drei Biome; jedes Biom führt eine Gegner-Mechanik ein und kombiniert sie am Ende.',
      'Dungeons mit freischaltbaren Abkürzungen belohnen Wiederholung.',
      'Elite-Nischen abseits des Pfads: optionales Risiko, sichtbare Truhe.',
      'Bosse haben eine Arena mit klarer Telegrafie-Fläche am Boden.',
    ],
    retentionHooks: ['Tagesdungeon mit Modifikator', 'Bestiarium-Vervollständigung', 'Umschmiede-Ziele'],
    eventIdeas: [
      { name: 'Sternenwanderung', concept: 'Geisterbosse erscheinen nachts im Hub-Umland.' },
      { name: 'Schmiedefest', concept: 'Umschmieden vergünstigt plus ein Sonderrezept.' },
      { name: 'Invasion der Irrlichter', concept: 'Welle um Welle im Hub verteidigen, Koop empfohlen.' },
    ],
    multiplayerAngle:
      'Koop für 2–4 im Dungeon mit skalierender Gegnerzahl; Beute ist pro Spieler instanziert – kein Wegschnappen.',
    touchControls:
      'Stick links, Angriff und Ausweichrolle rechts, drei große Fertigkeits-Buttons mit Cooldown-Ring; Auto-Aim aufs nächste Ziel.',
  },

  survival: {
    pitch:
      'Landen, sammeln, überleben: Jeder Tag-Nacht-Zyklus stellt eine neue Frage, jede Basis ist eine Antwort.',
    themes: [
      'Gestrandet auf einer Gezeiteninsel mit wandernder Flut',
      'Verlassene Polarstation im Dauerfrost',
      'Übergrüntes Stadttal, aus dem sich die Menschen zurückgezogen haben',
    ],
    coreLoop: [
      'Ressourcen sammeln',
      'Werkzeuge und Nahrung herstellen',
      'Basis ausbauen und befestigen',
      'Die Nacht überstehen',
      'Neue Region erkunden',
    ],
    sessionMinutes: [15, 30],
    progressionModel: 'Werkbank-Technologiestufen plus Regionsvorstöße',
    progressionCurve:
      'Technologie T1–T4: jede Werkbank-Stufe öffnet Rezepte und eine neue Region. Die Tage werden länger und gefährlicher, sodass Basisausbau und Vorratshaltung mitwachsen müssen.',
    milestones: [
      'Tag 1: Feuer und Unterschlupf stehen',
      'T2-Werkbank gebaut',
      'Erste Expedition in die Ruinenregion',
      'T3: Metallverarbeitung',
      'Ersten Großsturm ohne Schäden überstanden',
    ],
    metaProgression:
      'Kartenwissen und entdeckte Baupläne bleiben über Neustarts erhalten – bekannte Rezepte werden im nächsten Durchlauf schneller wieder freigeschaltet.',
    currencies: [
      {
        name: 'Rohstoffe',
        kind: 'Ressource',
        earn: ['Holz schlagen', 'Fasern sammeln', 'Erz abbauen'],
        spend: ['Bauen', 'Craften', 'Reparieren'],
        balance: 'Reparatur-Kosten steigen mit Basisgröße – Expansion bleibt eine bewusste Entscheidung.',
      },
      {
        name: 'Funkenkerne',
        kind: 'Fortschritt',
        earn: ['Ruinen erkunden', 'Meteorschauer-Events'],
        spend: ['Werkbank-Stufen', 'Spezialrezepte'],
        balance: 'Pro Region 4–6 Kerne; die nächste Tech-Stufe kostet 3 – Erkunden lohnt immer.',
      },
    ],
    items: [
      { name: 'Feuerstein-Beil', effect: 'Startwerkzeug für Holz', rarity: 'Gewöhnlich' },
      { name: 'Geflochtene Wasserflasche', effect: 'Trägt 3 Portionen Wasser', rarity: 'Gewöhnlich' },
      { name: 'Signalspiegel', effect: 'Markiert Fundorte auf der Karte', rarity: 'Selten' },
      { name: 'Dörrgestell', effect: 'Macht Nahrung haltbar', rarity: 'Selten' },
      { name: 'Sturmlaterne', effect: 'Licht, das Nachtschleicher meiden', rarity: 'Episch' },
      { name: 'Verstärkte Palisade', effect: 'Basiswand mit 300 HP', rarity: 'Selten' },
    ],
    enemyFraming: 'enemies',
    enemies: [
      { name: 'Nachtschleicher', role: 'Nachtjäger', behavior: 'Erscheint nur im Dunkeln, meidet Licht' },
      { name: 'Klippenkrabbler', role: 'Gebiets-Wächter', behavior: 'Verteidigt Erzvorkommen, langsam an Land' },
      { name: 'Aasvogel-Schwarm', role: 'Dieb', behavior: 'Stiehlt unbewachte Vorräte im Freien' },
      { name: 'Morastwolf', role: 'Rudeljäger', behavior: 'Umkreist Beute, greift von hinten an' },
      { name: 'Rostwanderer', role: 'Ruinen-Wächter', behavior: 'Aktiviert sich nahe Funkenkernen' },
      { name: 'Der Gezeitenalte', role: 'Boss', behavior: 'Erscheint zur Springflut; Kampf in drei Fluten' },
    ],
    quests: [
      { name: 'Die erste Nacht', goal: 'Bis Sonnenaufgang überleben', reward: 'Bauplan: Dörrgestell' },
      { name: 'Warmes Licht', goal: 'Eine Sturmlaterne herstellen', reward: 'Funkenkern ×1' },
      { name: 'Hoch hinaus', goal: 'Den Aussichtspunkt erklimmen', reward: 'Karte der Umgebung' },
      { name: 'Vorratskammer', goal: '10 haltbare Mahlzeiten lagern', reward: 'Rezept: Eintopf' },
      { name: 'Ruinengang', goal: 'Die erste Ruine durchsuchen', reward: 'Funkenkern ×2' },
      { name: 'Sturmfest', goal: 'Ein Unwetter ohne Basisschaden überstehen', reward: 'Bauplan: Blitzableiter' },
    ],
    balancing: [
      { parameter: 'Hunger', start: '100 → 0 in 20 Min', note: 'Essen füllt 30–60 Punkte' },
      { parameter: 'Tag/Nacht-Zyklus', start: '8 Min Tag / 4 Min Nacht', note: 'Nacht wächst pro Woche um 30 s' },
      { parameter: 'Holzschlag', start: '3 Hiebe pro Baum', note: 'T2-Axt: 2 Hiebe' },
      { parameter: 'Nachtschleicher-HP', start: '60', note: 'Speer-Treffer verursacht 20' },
      { parameter: 'Palisaden-HP', start: '300', note: 'Morastwolf-Biss: 15' },
      { parameter: 'Tod', start: 'Inventar bleibt, Respawn an Basis', note: 'Kein Loot-Verlust – Spannung ja, Strafarbeit nein' },
    ],
    levelDesignNotes: [
      'Regionen ringförmig mit steigender Gefahr; die sichere Startbucht bleibt immer erreichbar.',
      'Navigation über Landmarken statt Minimap – die Welt selbst ist die Karte.',
      'Ressourcen-Biome klar unterscheidbar einfärben (Lesbarkeit vor Realismus).',
      'Ruinen als handgebaute Mini-Dungeons mit je einem Umgebungsrätsel.',
    ],
    retentionHooks: ['Tageszyklus-Rituale (Ernte, Nachtwache)', 'Bauplan-Sammlung', 'Wetterereignisse mit Vorwarnung'],
    eventIdeas: [
      { name: 'Meteorschauer', concept: 'Nacht voller Funkenkern-Einschläge – riskante Ernte.' },
      { name: 'Springflut', concept: 'Das Wasser steigt; Basen in Ufernähe werden getestet.' },
      { name: 'Zugvögel', concept: 'Ein Wanderhändler rastet drei Tage in der Nähe.' },
    ],
    multiplayerAngle:
      'Koop-Basisbau für 2–4 mit geteiltem Lager und Entnahme-Log; PvP bleibt bewusst aus – die Spannung kommt aus der Welt, nicht aus Grief-Angst.',
    touchControls:
      'Kontextsensitiver Aktions-Button (sammeln/bauen/öffnen), Bau-Modus mit Raster-Snapping, Schnellleiste mit 4 Slots; Kamera per Drag.',
  },

  roguelite: {
    pitch: 'Kurze Runs, harte Entscheidungen: Jeder Tod zahlt auf den nächsten Versuch ein.',
    themes: [
      'Traumarchiv, das nachts seine Regale neu sortiert',
      'Endloser Bahnhofsturm zwischen den Welten',
      'Alchemistenkeller, in dem Rezepte lebendig werden',
    ],
    coreLoop: [
      'Run starten und Startsegen wählen',
      'Raum räumen und Belohnung wählen',
      'Build aus Relikten formen',
      'Boss-Etage versuchen',
      'Nach dem Tod Meta-Währung investieren und neu starten',
    ],
    sessionMinutes: [8, 15],
    progressionModel: 'Meta-Progression plus Run-Loops',
    progressionCurve:
      'Im Run wächst die Macht schnell über Relikt-Synergien; die Meta-Ebene bleibt flach und permanent (+3–5 % pro Kauf). So bleibt Skill sichtbar, während Ausdauer trotzdem belohnt wird.',
    milestones: [
      'Erster Bosssieg gegen die Archivarin',
      'Zweite Startklasse freigeschaltet',
      'Aszendenz 1 aktiviert (härtere Modifikatoren)',
      'Relikt-Kompendium zu 50 % gefüllt',
      'Run unter 10 Minuten abgeschlossen',
    ],
    metaProgression:
      'Traumfunken kaufen permanente Boni und neue Startklassen; Aszendenz-Stufen erhöhen freiwillig die Schwierigkeit gegen Prestige-Belohnungen.',
    currencies: [
      {
        name: 'Scherben',
        kind: 'Soft',
        earn: ['Räume räumen', 'Elite-Gegner', 'Geheimräume'],
        spend: ['Händler im Run', 'Relikt-Rerolls'],
        balance: 'Verfallen beim Tod vollständig – jede Kaufentscheidung im Run zählt.',
      },
      {
        name: 'Traumfunken',
        kind: 'Fortschritt',
        earn: ['Run-Abschluss (Tod oder Sieg)', 'Erstleistungen', 'Tages-Herausforderung'],
        spend: ['Permanente Meta-Boni', 'Neue Startklassen'],
        balance: 'Jeder Run soll mindestens einen kleinen Meta-Kauf finanzieren (10–25 Funken).',
      },
    ],
    items: [
      { name: 'Umgekehrte Sanduhr', effect: 'Treffer reduzieren Abklingzeiten um 1 s', rarity: 'Episch' },
      { name: 'Bleistiftdolch', effect: 'Kritische Treffer markieren Gegner', rarity: 'Gewöhnlich' },
      { name: 'Flüsternde Kompassnadel', effect: 'Zeigt den Geheimraum der Etage', rarity: 'Selten' },
      { name: 'Marmeladenglas voller Blitze', effect: 'Entlädt sich bei vollem Glas auf alle Gegner', rarity: 'Episch' },
      { name: 'Gebrochener Spiegel', effect: 'Projektile splitten einmal', rarity: 'Legendär' },
      { name: 'Wollsocke des Anfängers', effect: '+15 HP zu Beginn jeder Etage', rarity: 'Gewöhnlich' },
    ],
    enemyFraming: 'enemies',
    enemies: [
      { name: 'Seitenreiter', role: 'Schnelläufer', behavior: 'Stürmt in Linien, telegrafierte Anlaufspur' },
      { name: 'Tintenwächter', role: 'Zonenverteidiger', behavior: 'Hinterlässt verlangsamende Pfützen' },
      { name: 'Regalgeist', role: 'Ambusher', behavior: 'Materialisiert aus Regalen hinter dem Spieler' },
      { name: 'Zitatsammler', role: 'Unterstützer', behavior: 'Bufft andere Gegner, Priorität-Ziel' },
      { name: 'Kapitel-Koloss', role: 'Elite', behavior: 'Langsam, spaltet den Raum mit Stoßwellen' },
      { name: 'Die Archivarin', role: 'Boss', behavior: 'Drei Phasen; sortiert die Arena zwischen den Phasen um' },
    ],
    quests: [
      { name: 'Ungeschrieben', goal: 'Bis Etage 3 ohne Schaden', reward: '30 Traumfunken' },
      { name: 'Purist', goal: 'Boss nur mit Startwaffe besiegen', reward: 'Klassen-Skin' },
      { name: 'Eiljob', goal: 'Run unter 10 Minuten', reward: '20 Traumfunken' },
      { name: 'Elitejäger', goal: '3 Elite-Räume in einem Run', reward: 'Relikt-Reroll-Token' },
      { name: 'Fremdgänger', goal: 'Sieg mit Klasse B', reward: '25 Traumfunken' },
      { name: 'Familienbande', goal: '5 Relikte einer Familie in einem Run', reward: 'Kompendium-Eintrag + Titel' },
    ],
    balancing: [
      { parameter: 'Run-Länge (Ziel)', start: '10–14 Min', note: '3 Etagen + Boss' },
      { parameter: 'Raum-Dauer', start: '30–60 s', note: 'Danach Belohnungswahl' },
      { parameter: 'Spieler-HP', start: '80', note: 'Heilung selten: 1–2 Quellen pro Etage' },
      { parameter: 'Meta-Bonus pro Kauf', start: '+4 %', note: 'Deckel bei +60 % Gesamt-Meta' },
      { parameter: 'Elite-Raum-Quote', start: '15 %', note: 'Belohnung: garantiertes Relikt' },
      { parameter: 'Ziel-Winrate (Runs 1–5)', start: '10–20 %', note: 'Nach Meta-Ausbau: 40–50 %' },
    ],
    levelDesignNotes: [
      'Handgebaute Räume, prozedural verkettet – Wiedererkennung trifft Überraschung.',
      'Türen zeigen die Belohnungsart des nächsten Raums (informierte Entscheidungen).',
      'Geheimraum-Quote 10 %, Hinweise über Risse und Soundcues.',
      'Boss-Arenen ohne Deckungs-Camping: Bewegung ist die Verteidigung.',
    ],
    retentionHooks: ['Tages-Run mit festem Seed und Rangliste', 'Relikt-Kompendium', 'Aszendenz-Leiter'],
    eventIdeas: [
      { name: 'Seltsame Woche', concept: 'Wechselnde Mutatoren (z. B. alle Relikte verflucht, aber doppelt stark).' },
      { name: 'Funkenregen', concept: 'Wochenende mit +50 % Traumfunken.' },
      { name: 'Gemeinschaftsjagd', concept: 'Globaler Boss mit geteiltem Lebensbalken über alle Runs.' },
    ],
    multiplayerAngle:
      'Optionaler Duo-Modus mit gemeinsamen Belohnungsentscheidungen; sonst asynchron über die Tages-Seed-Rangliste.',
    touchControls:
      'Twin-Stick: links laufen, rechts zielen und feuern; Ausweich-Button mit Unverwundbarkeits-Fenster, Auto-Feuer-Option für Einhand-Spiel.',
  },

  idle: {
    pitch: 'Zahlen, die wachsen, während du weg bist – und kluge Entscheidungen, wenn du zurückkommst.',
    themes: [
      'Ameisenstaat mit Berufsketten und Königinnen-Segen',
      'Interstellare Postzentrale mit Rohrpost zwischen Planeten',
      'Unterirdisches Pilznetzwerk, das einen Wald versorgt',
    ],
    coreLoop: [
      'Generatoren kaufen',
      'Erträge einsammeln',
      'Upgrades wählen',
      'Kurz-Boost aktiv spielen',
      'Prestige auslösen, wenn die Kurve abflacht',
    ],
    sessionMinutes: [3, 8],
    progressionModel: 'Generator-Ebenen mit Prestige-Schichten',
    progressionCurve:
      'Kaufkosten wachsen mit Faktor 1,15 pro Einheit; jede neue Generator-Klasse kostet grob das Tausendfache und vertausendfacht den Ertrag. Erste Prestige nach 30–45 Minuten.',
    milestones: [
      'Erster globaler Multiplikator gekauft',
      '1 Mio. Vorräte erwirtschaftet',
      'Zehn Generatoren auf Stufe 25',
      'Prestige 1: Essenz-Schicht geöffnet',
      'Automatisierung: Auto-Kauf freigeschaltet',
    ],
    metaProgression:
      'Die Prestige-Währung Essenz kauft globale Multiplikatoren und Automatisierungen (Auto-Kauf, Auto-Sammeln) – jede Schicht verändert, wie sich das Spiel spielt.',
    currencies: [
      {
        name: 'Vorräte',
        kind: 'Soft',
        earn: ['Generatoren pro Sekunde', 'Offline-Ertrag', 'Boost-Phasen'],
        spend: ['Generator-Käufe', 'Stufen-Upgrades'],
        balance: 'Kostenfaktor 1,15 hält die Kauffrequenz hoch, ohne die Anzeige explodieren zu lassen.',
      },
      {
        name: 'Essenz',
        kind: 'Fortschritt',
        earn: ['Prestige (Formel: Wurzel aus Gesamtertrag / 1 Mio.)'],
        spend: ['Globale Multiplikatoren', 'Automatisierungen'],
        balance: 'Jede Prestige-Runde soll 2–3 Essenz-Käufe erlauben.',
      },
      {
        name: 'Bernsteintropfen',
        kind: 'Hard',
        earn: ['Wochenziele', 'Events'],
        spend: ['Diorama-Deko', 'Zeitraffer (max. 2 h)'],
        balance: 'Zeitraffer gedeckelt – Komfort ja, Fortschrittskauf-Spirale nein.',
      },
    ],
    items: [
      { name: 'Fleißpheromon', effect: 'Generator-Klasse 1 produziert +100 %', rarity: 'Gewöhnlich' },
      { name: 'Doppelkiefer-Zange', effect: 'Sammel-Klicks zählen doppelt', rarity: 'Selten' },
      { name: 'Routenplaner', effect: 'Transportwege ohne Verlust', rarity: 'Selten' },
      { name: 'Königinnen-Segen', effect: 'Alle Erträge +25 % für diese Schicht', rarity: 'Episch' },
      { name: 'Nachtschicht-Protokoll', effect: 'Offline-Ertrag +20 Prozentpunkte', rarity: 'Episch' },
      { name: 'Kristallspeicher', effect: 'Offline-Deckel +4 Stunden', rarity: 'Legendär' },
    ],
    enemyFraming: 'obstacles',
    enemies: [
      { name: 'Lagerlimit', role: 'Soft-Cap', behavior: 'Volle Speicher stoppen Produktion – Ausbau nötig' },
      { name: 'Ertragsplateau', role: 'Kurven-Bremse', behavior: 'Signalisiert den richtigen Prestige-Zeitpunkt' },
      { name: 'Regenschauer', role: 'Temporäre Störung', behavior: 'Eine Route pausiert 60 s, Umleitung möglich' },
      { name: 'Blattlaus-Besuch', role: 'Ereignis', behavior: 'Stibitzt 5 % Vorräte oder wird zum Bonus gezähmt' },
      { name: 'Verstopfte Rohrpost', role: 'Mini-Interaktion', behavior: 'Drei Tipps beheben den Stau, kleiner Bonus' },
      { name: 'Energiespar-Woche', role: 'Modifikator', behavior: 'Halbe Produktion, doppelte Upgrade-Wirkung' },
    ],
    quests: [
      { name: 'Erster Multiplikator', goal: 'Einen globalen Multiplikator kaufen', reward: '1 Bernsteintropfen' },
      { name: 'Millionärin', goal: '1 Mio. Vorräte gesamt', reward: 'Diorama-Deko „Goldblatt"' },
      { name: 'Breit aufgestellt', goal: '10 Generatoren auf Stufe 25', reward: '2 Bernsteintropfen' },
      { name: 'Ausgeschlafen', goal: '8 h Offline-Ertrag abholen', reward: 'Boost-Token' },
      { name: 'Neubeginn', goal: 'Erstes Prestige durchführen', reward: 'Essenz-Bonus +10 %' },
      { name: 'Kettenreaktion', goal: '3 Boosts ohne Pause verketten', reward: '1 Bernsteintropfen' },
    ],
    balancing: [
      { parameter: 'Kaufkosten-Faktor', start: '×1,15 pro Einheit', note: 'Genre-erprobter Standardwert' },
      { parameter: 'Basis-Ertrag Generator 1', start: '1 Vorrat/s', note: 'Alle Klassen relativ dazu' },
      { parameter: 'Klassen-Sprung', start: 'Kosten ×1.000, Ertrag ×1.000', note: 'Erzeugt die Treppen-Kurve' },
      { parameter: 'Offline-Ertrag', start: '60 %, Deckel 8 h', note: 'Upgrades erhöhen beides' },
      { parameter: 'Prestige-Formel', start: '√(Gesamtertrag / 1 Mio.)', note: 'Erste Prestige: 5–8 Essenz' },
      { parameter: 'Boost', start: '×2 für 60 s', note: 'Aktivierung per Interaktion, nie nur per Werbung' },
    ],
    levelDesignNotes: [
      'Die „Bühne" ist ein Diorama, das mit jeder Generator-Klasse sichtbar wächst.',
      'Jede Prestige-Schicht färbt das Diorama um – Fortschritt bleibt fühlbar.',
      'Zahlenformatierung ab 1 Mio. in Kurzform (1,2M) mit deutschem Dezimalkomma.',
      'Kauf-Buttons zeigen immer den Ertragszuwachs pro Investition.',
    ],
    retentionHooks: ['Offline-Ertrag als Willkommensmoment', 'Tagesziel-Kette', 'Prestige-Rhythmus'],
    eventIdeas: [
      { name: 'Erntedank', concept: '24 Stunden doppelte Erträge, angekündigt im Voraus.' },
      { name: 'Expeditionswoche', concept: 'Nebenpfad mit Wahl-Upgrades, der nach 7 Tagen einklappt.' },
      { name: 'Die goldene Blattlaus', concept: 'Seltenes Klick-Ziel wandert durchs Diorama.' },
    ],
    multiplayerAngle:
      'Rein asynchron: Gilden-Sammelziele und Bestenlisten pro Prestige-Ebene, damit Vielspieler und Gelegenheitsspieler getrennt fair konkurrieren.',
    touchControls:
      'Alles einhändig: große Kauf-Buttons, Halten für Mehrfachkauf (×10/×100), Sammel-Wisch über das Diorama.',
  },

  hypercasual: {
    pitch: 'Eine Mechanik, sofort verstanden, schwer zu meistern – Sessions in Snackgröße.',
    themes: [
      'Farbwechsel-Frosch springt über Seerosen',
      'Papierflieger segelt durch einen Bürowindkanal',
      'Wassertropfen hüpft über heiße Pfannen',
    ],
    coreLoop: [
      'Tippen zum Handeln',
      'Hindernis überwinden',
      'Score steigt sichtbar',
      'Fehler bedeutet sofortigen Neustart',
      'Skin-Fortschritt sammeln',
    ],
    sessionMinutes: [2, 5],
    progressionModel: 'Highscore-Kurve mit kosmetischen Freischaltungen',
    progressionCurve:
      'Tempo steigt um 2 % je 10 Punkte bis zu einem harten Deckel; Skins schalten kumulativ über Gesamt-Punkte frei. Bewusst keine Power-Progression – jeder Run ist vergleichbar.',
    milestones: [
      'Score 25: erster Skin',
      'Score 100: „Flow-Modus"-Effekt ab 60 s Laufzeit',
      'Score 250: Goldrahmen im Hauptmenü',
      '10 Skins gesammelt',
      'Tages-Bestwert dreimal in Folge verbessert',
    ],
    metaProgression:
      'Skin-Sammlung und Tages-Bestwert; keine Upgrades, die den Score kaufen könnten – Fairness ist das Produkt.',
    currencies: [
      {
        name: 'Konfetti',
        kind: 'Soft',
        earn: ['Punkte am Run-Ende', 'Tagesziele', 'Perfekte Ausweicher'],
        spend: ['Skins', 'Hintergrund-Themen'],
        balance: 'Ein Skin alle 3–5 Sessions erreichbar – häufige kleine Belohnungen.',
      },
    ],
    items: [
      { name: 'Neon-Frosch', effect: 'Skin mit Leuchtspur', rarity: 'Gewöhnlich' },
      { name: 'Origami-Ass', effect: 'Papierflieger-Skin mit Faltgeräusch', rarity: 'Selten' },
      { name: 'Discokugel-Tropfen', effect: 'Glitzerpartikel beim Sprung', rarity: 'Episch' },
      { name: 'Karo-Klassiker', effect: 'Rückblick-Skin im Schulheft-Look', rarity: 'Gewöhnlich' },
      { name: 'Milchglas', effect: 'Halbtransparenter Skin', rarity: 'Selten' },
      { name: 'Goldrand', effect: 'Prestige-Skin für Score 500', rarity: 'Legendär' },
    ],
    enemyFraming: 'obstacles',
    enemies: [
      { name: 'Rotierender Balken', role: 'Timing-Klassiker', behavior: 'Konstante Drehung, Tempo steigt mit Score' },
      { name: 'Pulsierende Lücke', role: 'Präzisions-Test', behavior: 'Öffnet und schließt im Herzschlag-Rhythmus' },
      { name: 'Wackel-Plattform', role: 'Vertrauens-Falle', behavior: 'Kippt 0,5 s nach Landung' },
      { name: 'Tempowechsel-Zone', role: 'Rhythmus-Bruch', behavior: 'Kurzzeitig halbe oder doppelte Geschwindigkeit' },
      { name: 'Doppel-Schranke', role: 'Kombination', behavior: 'Zwei Inputs in schneller Folge nötig' },
      { name: 'Blickfang', role: 'Ablenkung', behavior: 'Visueller Effekt lockt vom eigentlichen Hindernis weg' },
    ],
    quests: [
      { name: 'Dreierpack', goal: '3 Runs über Score 50', reward: '30 Konfetti' },
      { name: 'Konfettiregen', goal: '100 Konfetti sammeln', reward: 'Skin-Rabatt-Ticket' },
      { name: 'Nervenstark', goal: 'Ein Run ohne Beinahe-Treffer', reward: '20 Konfetti' },
      { name: 'Frühsport', goal: 'Ersten Run des Tages abschließen', reward: '10 Konfetti' },
      { name: 'Zonenmeister', goal: '5 Tempowechsel-Zonen in einem Run überstehen', reward: '25 Konfetti' },
    ],
    balancing: [
      { parameter: 'Hindernis-Intervall', start: '1,4 s → min. 0,7 s', note: 'Sinkt mit dem Score' },
      { parameter: 'Eingabe-Puffer', start: '80 ms', note: 'Verhindert „unfaire" Tode' },
      { parameter: 'Tod → Neustart', start: '< 2 s', note: 'Kein Ladebildschirm zwischen Runs' },
      { parameter: 'Run-Länge (Median-Ziel)', start: '35 s', note: 'Kürzer: leichter machen, länger: härter' },
      { parameter: 'Revive', start: 'max. 1× pro Run (Rewarded Ad)', note: 'Optional und klar beschriftet' },
      { parameter: 'Skin-Preisspanne', start: '50–400 Konfetti', note: 'Erster Skin nach ca. 3 Sessions' },
    ],
    levelDesignNotes: [
      'Endlos generiert aus 20+ handgebauten Segmenten mit Schwierigkeits-Tags.',
      'Nie zwei „Spike"-Segmente hintereinander – die Flow-Kurve atmet.',
      'Ein Bildschirm, eine Blickachse: alles Relevante ist ohne Kameraschwenk sichtbar.',
      'Beinahe-Treffer bekommen ein eigenes Feedback („Knapp!") – das sind die Teil-Momente.',
    ],
    retentionHooks: ['Tagesziel', 'Skin-Serie der Woche', 'Beinahe-Treffer-Momente zum Teilen'],
    eventIdeas: [
      { name: 'Themen-Skinwoche', concept: 'Drei zusammengehörige Skins nur diese Woche erspielbar.' },
      { name: 'Blitz-Turnier', concept: 'Bester Run aus drei Versuchen, Rangliste unter Freunden.' },
      { name: 'Konfetti-Stunde', concept: 'Täglich eine angekündigte Stunde mit doppeltem Konfetti.' },
    ],
    multiplayerAngle:
      'Asynchron: Der Bestwert von Freunden erscheint als Geist-Markierung im Lauf – Rivalität ohne Wartezeit.',
    touchControls:
      'Ein-Tap-Steuerung, die gesamte Bildschirmfläche ist der Button; Portrait-Modus, perfekt einhändig.',
  },

  hybridcasual: {
    pitch:
      'Snackbarer Core wie Hypercasual, aber mit Meta: Upgrades, Sammlung und Ziele, die wiederkommen lassen.',
    themes: [
      'Roboter-Waschstraße kämpft gegen Schlammwellen',
      'Bonbon-Katapult über den Dächern einer Kleinstadt',
      'Mini-U-Boot im Labyrinth eines riesigen Aquariums',
    ],
    coreLoop: [
      'Kurzes Level spielen',
      'Belohnungskisten einsammeln',
      'Gadgets verbessern',
      'Nächstes Kapitel angehen',
      'Sammlung vervollständigen',
    ],
    sessionMinutes: [4, 10],
    progressionModel: 'Kapitel-Fortschritt mit Upgrade-Meta',
    progressionCurve:
      'Level dauern 30–60 Sekunden, alle 10 Level wartet ein Kapitelboss. Upgrade-Kosten wachsen mit Faktor 1,4; die Levelanforderungen wachsen etwas langsamer, sodass Geschick Upgrades teilweise ersetzen kann.',
    milestones: [
      'Kapitel 1 mit 3 Sternen',
      'Erstes Gadget auf Maximalstufe',
      'Kapitelboss „Matschgolem" besiegt',
      'Erstes Set (3 Gadgets) komplett',
      'Bonus-Modus freigeschaltet',
    ],
    metaProgression:
      'Gadget-Sammlung mit Set-Boni; Kapitel-Sterne schalten Bonus-Modi frei. Alles ist erspielbar – Käufe beschleunigen höchstens.',
    currencies: [
      {
        name: 'Schrauben',
        kind: 'Soft',
        earn: ['Level-Abschluss', 'Kisten', 'Tagesziele'],
        spend: ['Gadget-Upgrades', 'Level-Wiederholung mit Bonus'],
        balance: 'Ertrag pro Level 20–35; ein Upgrade alle 2–3 Level hält die Kurve straff.',
      },
      {
        name: 'Chips',
        kind: 'Hard',
        earn: ['Kapitelbosse', 'Wochenziele', 'Events'],
        spend: ['Kosmetik', 'Kisten-Vorschau', 'Zweite Gadget-Ausrüstung'],
        balance: 'Keine exklusive Spielstärke hinter Chips – Sets bleiben erspielbar.',
      },
    ],
    items: [
      { name: 'Schaumkanone', effect: 'Reinigt breite Bahnen', rarity: 'Gewöhnlich' },
      { name: 'Magnetarm', effect: 'Sammelt Kisten aus Nachbarspuren', rarity: 'Selten' },
      { name: 'Turbo-Düse', effect: 'Kurzer Sprint, einmal pro Level', rarity: 'Selten' },
      { name: 'Gummi-Stoßstange', effect: 'Ein Aufprall ohne Schaden', rarity: 'Episch' },
      { name: 'Doppelbürste', effect: 'Punkte-Combo hält 2 s länger', rarity: 'Episch' },
      { name: 'Glanzversiegelung', effect: 'Level-Ende-Bonus +25 %', rarity: 'Legendär' },
    ],
    enemyFraming: 'obstacles',
    enemies: [
      { name: 'Schlammwelle', role: 'Basis-Hindernis', behavior: 'Rollt in Bahnen an, Lücken wandern' },
      { name: 'Rostfeld', role: 'Zonen-Gefahr', behavior: 'Verlangsamt, blinkt vor Aktivierung' },
      { name: 'Enge Gasse', role: 'Präzisions-Passage', behavior: 'Nur eine Spur bleibt frei' },
      { name: 'Zeitschloss-Tor', role: 'Tempo-Test', behavior: 'Schließt nach Countdown' },
      { name: 'Klebrige Ladung', role: 'Handicap', behavior: 'Blockiert ein Gadget bis zur Reinigung' },
      { name: 'Matschgolem', role: 'Kapitelboss', behavior: 'Wirft Wellenmuster in drei Phasen' },
    ],
    quests: [
      { name: 'Sauberer Start', goal: 'Kapitel 1 abschließen', reward: '50 Schrauben' },
      { name: 'Sternenklar', goal: '9 Sterne in einem Kapitel', reward: '3 Chips' },
      { name: 'Bastelstunde', goal: '3 Upgrades kaufen', reward: 'Kiste (Selten)' },
      { name: 'Kombi-König', goal: 'Combo ×8 erreichen', reward: '30 Schrauben' },
      { name: 'Bosslauf', goal: 'Kapitelboss ohne Treffer', reward: '5 Chips' },
      { name: 'Sammelfieber', goal: 'Ein Gadget-Set vervollständigen', reward: 'Set-Rahmen (Kosmetik)' },
    ],
    balancing: [
      { parameter: 'Level-Länge', start: '45 s (Ziel-Median)', note: 'Boss-Level bis 90 s' },
      { parameter: 'Fail-Rate ab Kapitel 2', start: '20 %', note: 'Kapitel 1: unter 10 %' },
      { parameter: 'Upgrade-Kostenfaktor', start: '×1,4', note: 'Gegen Ertrag 20–35/Level tunen' },
      { parameter: 'Kisten-Öffnung', start: 'sofort', note: 'Bewusst keine Warte-Timer' },
      { parameter: 'Set-Bonus', start: '+10 % auf Set-Werte', note: 'Spürbar, nicht zwingend' },
      { parameter: 'Boss-Frequenz', start: 'alle 10 Level', note: 'Vorschau des Bosses ab Level 7' },
    ],
    levelDesignNotes: [
      'Drei-Bahnen-Lesbarkeit: jede Gefahr ist einer Spur zuordenbar.',
      'Bonus-Pfade für Risikofreudige mit sichtbarer Zusatzkiste.',
      'Kapitel wechseln die Kulisse komplett – klare „Neues Kapitel"-Momente.',
      'Boss-Vorschau in den Levels davor baut Spannung auf.',
    ],
    retentionHooks: ['Gadget-Sammlung mit Set-Boni', 'Kapitelsterne', 'Tagesziele'],
    eventIdeas: [
      { name: 'Sprint-Liga', concept: 'Wochenliga über die besten Levelzeiten.' },
      { name: 'Sammel-Safari', concept: 'Zeitlich begrenztes Event-Gadget über Sonderlevel.' },
      { name: 'Bossparade', concept: 'Alle Kapitelbosse hintereinander, Bestzeit zählt.' },
    ],
    multiplayerAngle:
      'Asynchrone Liga-Wertung nach Levelzeiten; optionaler Duo-Staffellauf, bei dem sich zwei Spieler Level abwechseln.',
    touchControls:
      'Halten/Loslassen als Kerninput, Drag für den Spurwechsel; komplette Bedienung in der Daumenzone im Portrait-Modus.',
  },

  puzzle: {
    pitch: 'Kurze Denkaufgaben mit Aha-Moment: leicht zu lernen, elegant zu lösen.',
    themes: [
      'Lichtstrahlen durch Spiegelgärten lenken',
      'Wasserleitungen in einem wachsenden Wolkenkratzer verlegen',
      'Magnetische Murmeln in einem Uhrwerk sortieren',
    ],
    coreLoop: [
      'Level ansehen und Plan fassen',
      'Züge setzen',
      'Aha-Moment erleben',
      'Sterne nach Zug-Effizienz kassieren',
      'Nächstes Level oder Perfektionierung',
    ],
    sessionMinutes: [5, 15],
    progressionModel: 'Level-Pakete mit Mechanik-Kapiteln',
    progressionCurve:
      'Jede Welt führt genau eine neue Mechanik ein: erst isoliert, dann kombiniert mit Bekanntem. Die Sterne-Summe öffnet Bonuswelten – wer knobelt, statt zu hetzen, wird belohnt.',
    milestones: [
      'Welt 1 abgeschlossen (Mechanik: Spiegel)',
      'Erstes Level mit Minimal-Zügen gelöst',
      '50 Sterne: Bonuswelt offen',
      'Meisterzirkel freigeschaltet (schwere Remixe)',
      '100 Tagesrätsel gelöst',
    ],
    metaProgression:
      'Der Sterne-Gesamtstand schaltet Bonuswelten und den „Meisterzirkel" frei – schwere Remix-Level für Kenner.',
    currencies: [
      {
        name: 'Sterne',
        kind: 'Fortschritt',
        earn: ['Level lösen (1–3 je nach Zugzahl)'],
        spend: ['Bonuswelten', 'Meisterzirkel-Zugang'],
        balance: 'Bonuswelten verlangen ca. 60 % der möglichen Sterne – kein Perfektionszwang.',
      },
      {
        name: 'Glühbirnen',
        kind: 'Soft',
        earn: ['Level ohne Hinweis lösen', 'Tagesrätsel'],
        spend: ['Hinweise (deckt einen Zug auf)'],
        balance: 'Großzügig: rechnerisch 1 Hinweis je 8–10 Level verfügbar – niemand bleibt hart stecken.',
      },
    ],
    items: [
      { name: 'Hinweis-Glühbirne', effect: 'Deckt den nächsten sinnvollen Zug auf', rarity: 'Gewöhnlich' },
      { name: 'Zug zurück', effect: 'Nimmt den letzten Zug zurück (immer gratis)', rarity: 'Gewöhnlich' },
      { name: 'Brett-Thema „Messing"', effect: 'Uhrwerk-Optik für alle Level', rarity: 'Selten' },
      { name: 'Brett-Thema „Aquarell"', effect: 'Weiche Farbverläufe', rarity: 'Selten' },
      { name: 'Lösungs-Replay', effect: 'Spielt die eigene Lösung als Animation ab', rarity: 'Episch' },
      { name: 'Meister-Siegel', effect: 'Abzeichen für Minimal-Zug-Lösungen', rarity: 'Legendär' },
    ],
    enemyFraming: 'obstacles',
    enemies: [
      { name: 'Eisblock', role: 'Mechanik', behavior: 'Schmilzt nach zwei angrenzenden Zügen' },
      { name: 'Portalpaar', role: 'Mechanik', behavior: 'Verbindet zwei Brettpunkte' },
      { name: 'Farbschalter', role: 'Mechanik', behavior: 'Ändert Zustand aller gleichfarbigen Felder' },
      { name: 'Zahnrad-Dreher', role: 'Mechanik', behavior: 'Rotiert einen 3×3-Bereich' },
      { name: 'Einbahn-Röhre', role: 'Einschränkung', behavior: 'Erlaubt Bewegung nur in eine Richtung' },
      { name: 'Nebelfeld', role: 'Informations-Hindernis', behavior: 'Verdeckt Felder bis zur ersten Berührung' },
    ],
    quests: [
      { name: 'Tagesrätsel', goal: 'Das Rätsel des Tages lösen', reward: '2 Glühbirnen' },
      { name: 'Ohne Netz', goal: '5 Level ohne Hinweis lösen', reward: '3 Glühbirnen' },
      { name: 'Effizienz', goal: '3 Level mit Minimal-Zügen', reward: 'Meister-Siegel-Fortschritt' },
      { name: 'Weltenbummler', goal: 'Ein Level aus jeder Welt lösen', reward: 'Brett-Thema-Rabatt' },
      { name: 'Serie', goal: '7 Tagesrätsel in Folge', reward: 'Exklusives Brett-Thema' },
    ],
    balancing: [
      { parameter: 'Ziel-Lösungsquote Level 1–20', start: '95 %', note: 'Kapitelenden: 70 %' },
      { parameter: 'Zug-Par pro Level', start: '5–12 Züge', note: '3 Sterne = Par, 2 = Par+2' },
      { parameter: 'Levelzeit (Median)', start: '90 s', note: 'Über 4 Min: Level vereinfachen' },
      { parameter: 'Hinweis-Wirkung', start: '1 Zug', note: 'Nie die ganze Lösung verkaufen' },
      { parameter: 'Neue Mechanik', start: 'alle 15–20 Level', note: '3 Solo-Level vor erster Kombination' },
      { parameter: 'Tagesrätsel-Schwierigkeit', start: 'Mo leicht → So schwer', note: 'Wochenrhythmus als Ritual' },
    ],
    levelDesignNotes: [
      'Eine Idee pro Level – wenn zwei drinstecken, sind es zwei Level.',
      'Schwierigkeits-Säge: nach jedem harten Level folgt ein leichtes zum Durchatmen.',
      'Tutorials ohne Text: der erste Zug ist erzwungen und erklärt sich selbst.',
      'Symmetrie und Ästhetik der Bretter sind Teil der Belohnung.',
    ],
    retentionHooks: ['Tagesrätsel-Serie (ohne Straf-Reset)', 'Sterne-Vervollständigung', 'Meisterzirkel'],
    eventIdeas: [
      { name: 'Rätselwoche', concept: 'Kuratiertes Community-Levelpaket mit Abstimmung.' },
      { name: 'Speed-Sonntag', concept: 'Bekannte Level gegen die Uhr – optional, separat gewertet.' },
      { name: 'Themen-Paket', concept: 'Saisonales Levelpaket mit eigenem Brett-Thema.' },
    ],
    multiplayerAngle:
      'Asynchron: Alle bekommen dasselbe Tagesrätsel; verglichen wird die Zugzahl im Freundeskreis, nicht die Zeit.',
    touchControls:
      'Nur Tippen und Ziehen, großzügige Hitboxen, „Zug zurück" prominent platziert; standardmäßig ohne Zeitdruck.',
  },

  tower_defense: {
    pitch: 'Wellen lesen, Wege formen, Türme kombinieren: Strategie in Zehn-Minuten-Häppchen.',
    themes: [
      'Gewürzkarawane verteidigt sich gegen naschhafte Wüstengeister',
      'Gartenzwerge beschützen das Gemüsebeet',
      'Leuchtturm-Insel gegen anrollende Nebelpiraten',
    ],
    coreLoop: [
      'Karte und Wellenvorschau prüfen',
      'Türme platzieren',
      'Welle abwehren',
      'Zwischen Zinsen und Upgrade entscheiden',
      'Bosswelle meistern',
    ],
    sessionMinutes: [10, 20],
    progressionModel: 'Kartenfortschritt mit Turm-Freischaltungen',
    progressionCurve:
      'Jede Karte führt einen neuen Turm oder Gegnertyp ein; das Wellen-Budget wächst mit Faktor 1,12 pro Welle. Karten-Sterne (Leben übrig) füttern die Meta-Ebene.',
    milestones: [
      'Karte 1 perfekt (20/20 Leben)',
      'Frostbrunnen freigeschaltet',
      'Karte 3: zweiter Bauplatz-Typ',
      'Erste Turm-Variante gekauft',
      'Endloswellen-Modus offen',
    ],
    metaProgression:
      'Turm-Sterne aus perfekten Karten kaufen permanente Turm-Varianten (Seitwärts-Upgrades, keine reinen Stat-Steigerungen).',
    currencies: [
      {
        name: 'Gold',
        kind: 'Soft',
        earn: ['Besiegte Gegner', 'Wellen-Boni', 'Zinsen auf Erspartes (5 %/Welle, gedeckelt)'],
        spend: ['Turmbau', 'Turm-Upgrades im Match'],
        balance: 'Gilt nur im Match – jede Karte startet frisch, Entscheidungen bleiben spannend.',
      },
      {
        name: 'Baupläne',
        kind: 'Fortschritt',
        earn: ['Karten-Sterne', 'Wochenkarte'],
        spend: ['Neue Türme', 'Turm-Varianten'],
        balance: 'Eine neue Freischaltung alle 2–3 gemeisterte Karten.',
      },
    ],
    items: [
      { name: 'Pfefferkanone', effect: 'Solider Einzelziel-Schaden', rarity: 'Gewöhnlich' },
      { name: 'Frostbrunnen', effect: 'Verlangsamt im Radius um 30 %', rarity: 'Selten' },
      { name: 'Harzschleuder', effect: 'Klebt Gegner kurz am Boden fest', rarity: 'Selten' },
      { name: 'Blitzobelisk', effect: 'Kettenblitz auf bis zu 4 Ziele', rarity: 'Episch' },
      { name: 'Sonnenspiegel', effect: 'Strahl, der mit Dauer stärker wird', rarity: 'Episch' },
      { name: 'Trommelturm', effect: 'Bufft Feuerrate benachbarter Türme +20 %', rarity: 'Legendär' },
    ],
    enemyFraming: 'enemies',
    enemies: [
      { name: 'Naschgeist', role: 'Läufer', behavior: 'Schnell, schwach, kommt in Trauben' },
      { name: 'Zuckerpanzer', role: 'Tank', behavior: 'Langsam, splittert in zwei Läufer' },
      { name: 'Schwarmkrümel', role: 'Schwarm', behavior: '12er-Gruppen, testet Flächenschaden' },
      { name: 'Nebelflieger', role: 'Flieger', behavior: 'Ignoriert Bodenwege, braucht Luftabwehr' },
      { name: 'Sirup-Dieb', role: 'Spezialist', behavior: 'Klaut Gold statt Leben, flieht rückwärts' },
      { name: 'Karamellkoloss', role: 'Boss', behavior: 'Zerstampft einen Bauplatz pro Phase' },
    ],
    quests: [
      { name: 'Makellos', goal: 'Karte ohne Lebensverlust', reward: '3 Turm-Sterne' },
      { name: 'Sparsam', goal: 'Sieg mit nur 3 Turmtypen', reward: '1 Bauplan' },
      { name: 'Ungebremst', goal: 'Sieg ohne Verlangsamungs-Türme', reward: '2 Turm-Sterne' },
      { name: 'Zinskönig', goal: '5 Wellen lang volle Zinsen kassieren', reward: 'Gold-Startbonus (kosmetischer Rahmen)' },
      { name: 'Luftraum sicher', goal: '50 Nebelflieger abfangen', reward: 'Blitzobelisk-Variante' },
      { name: 'Kolossbezwinger', goal: 'Karamellkoloss ohne verlorenen Bauplatz', reward: 'Titel + 2 Baupläne' },
    ],
    balancing: [
      { parameter: 'Startgold', start: '220', note: 'Reicht für 2–3 Türme' },
      { parameter: 'Leben', start: '20', note: 'Läufer kostet 1, Boss 5' },
      { parameter: 'Wellen-Budget', start: '×1,12 pro Welle', note: 'Karte 1: 10 Wellen' },
      { parameter: 'Turmkosten (Basis)', start: '60–120 Gold', note: 'Upgrade-Stufen: 80 % der Basiskosten' },
      { parameter: 'Verkaufswert', start: '70 %', note: 'Umbauen erlaubt Taktikwechsel' },
      { parameter: 'Zinsen', start: '5 % pro Welle, Deckel 50 Gold', note: 'Belohnt Sparen ohne Snowball' },
    ],
    levelDesignNotes: [
      'Wegkreuzungen schaffen Synergie-Hotspots – dort ist der Platz am knappsten.',
      'Bauflächen immer knapper als der Wunsch – Platzieren bleibt eine Entscheidung.',
      'Bosswellen werden zwei Wellen vorher angekündigt.',
      'Ab Karte 4: alternative Routen, die sich per Barrikade umlenken lassen.',
    ],
    retentionHooks: ['Karten-Sterne', 'Wochenkarte mit Mutator', 'Turm-Varianten-Sammlung'],
    eventIdeas: [
      { name: 'Nebelwoche', concept: 'Alle Karten mit Nebel-Modifikator und Bonus-Bauplänen.' },
      { name: 'Endlos-Wettbewerb', concept: 'Wer übersteht die meisten Wellen auf der Wochenkarte?' },
      { name: 'Verkehrte Welt', concept: 'Gegner laufen die Route rückwärts – alte Karten neu denken.' },
    ],
    multiplayerAngle:
      'Koop-Karten mit getrennten Bauzonen und geteiltem Lebenspool; Absprache über ein einfaches Ping-System statt Chat-Zwang.',
    touchControls:
      'Drag & Drop aus der Turmleiste, Tippen öffnet Info/Upgrade, Pinch-Zoom; Wellenstart-Button mit Countdown und Vorschau.',
  },

  battle_arena: {
    pitch: 'Schnelle Runden, klare Duelle: Können entscheidet, nicht die Spielzeit.',
    themes: [
      'Spielzeug-Arena auf einem Kinderzimmerboden bei Nacht',
      'Schwebende Dojo-Plattformen im Sonnenuntergang',
      'Neon-Sporthalle mit wechselnden Bodenfeldern',
    ],
    coreLoop: [
      'Loadout wählen',
      'Match spielen (3–5 Minuten)',
      'Rang-Punkte kassieren',
      'Meisterschafts-Fortschritt sammeln',
      'Nächstes Match',
    ],
    sessionMinutes: [10, 20],
    progressionModel: 'Saison-Rangleiter plus Meisterschaftspfade pro Loadout',
    progressionCurve:
      'Rang-Punkte (+20 Sieg / -15 Niederlage) treiben die Leiter; parallel füllt jedes Match die Meisterschaft des gespielten Loadouts (rein kosmetisch). Saisons resetten weich mit Startbonus.',
    milestones: [
      'Erste Siegesserie (3 in Folge)',
      'Rang Silber erreicht',
      'Loadout-Meisterung Stufe 10',
      'Erstes Saisonziel abgeschlossen',
      'Platzierung in der Freundes-Top-3',
    ],
    metaProgression:
      'Meisterschaft pro Loadout schaltet Titel und Skins frei; die Saison-Rücksetzung startet mit Bonus je nach Vorsaison-Rang.',
    currencies: [
      {
        name: 'Pokalpunkte',
        kind: 'Fortschritt',
        earn: ['Match-Siege', 'Saisonziele'],
        spend: ['(werden nicht ausgegeben – reine Rangwertung)'],
        balance: 'Verlust bei Niederlage kleiner als Gewinn bei Sieg – Aufstieg fühlt sich erreichbar an.',
      },
      {
        name: 'Glanzmarken',
        kind: 'Soft',
        earn: ['Matches (Sieg wie Niederlage)', 'Meisterschafts-Stufen', 'Tagesziele'],
        spend: ['Skins', 'Emotes', 'Arena-Banner'],
        balance: 'Auch Verlierer verdienen – ca. 60 % der Sieger-Rate, damit Weiterspielen belohnt bleibt.',
      },
    ],
    items: [
      { name: 'Federhammer', effect: 'Langsamer Schlag, großer Rückstoß', rarity: 'Gewöhnlich' },
      { name: 'Kreisel-Klingen', effect: 'Schnelle Nahkampf-Kombos', rarity: 'Gewöhnlich' },
      { name: 'Boomerang-Schläger', effect: 'Fernangriff mit Rückflug-Fenster', rarity: 'Selten' },
      { name: 'Sprungfeder-Stiefel', effect: 'Doppelsprung als Ausweichoption', rarity: 'Selten' },
      { name: 'Rauchknall-Kapsel', effect: 'Kurzer Sichtblocker (einmal pro Runde)', rarity: 'Episch' },
      { name: 'Anker-Kette', effect: 'Zieht Gegner aus der Distanz heran', rarity: 'Episch' },
    ],
    enemyFraming: 'rivals',
    enemies: [
      { name: 'Rusher', role: 'Aggressor', behavior: 'Sucht sofort die Distanz null – bestraft schwaches Spacing' },
      { name: 'Zoner', role: 'Distanzspieler', behavior: 'Kontrolliert Fläche mit Wurfgeschossen' },
      { name: 'Anker', role: 'Kontrolle', behavior: 'Hält Punkte, zwingt zum Herauslocken' },
      { name: 'Assassine', role: 'Flanker', behavior: 'Wartet auf isolierte Ziele' },
      { name: 'Stratege', role: 'Unterstützer', behavior: 'Spielt um Power-Up-Timer herum' },
      { name: 'Allrounder', role: 'Referenz-Archetyp', behavior: 'Ausgewogen – der Tutorial-Gegner' },
    ],
    quests: [
      { name: 'Serie', goal: '3 Siege in Folge', reward: '50 Glanzmarken' },
      { name: 'Comeback', goal: 'Rückstand von 3 Punkten drehen', reward: '30 Glanzmarken' },
      { name: 'Handwerk', goal: 'Meisterung Stufe 5 mit einem Loadout', reward: 'Loadout-Skin' },
      { name: 'Punktgenau', goal: '10 perfekte Ausweicher in einem Match', reward: 'Emote „Zu langsam!"' },
      { name: 'Allwetter', goal: 'Mit 3 verschiedenen Loadouts gewinnen', reward: '75 Glanzmarken' },
    ],
    balancing: [
      { parameter: 'Time-to-Knockout', start: '4–6 s', note: 'Fühlt sich schnell, aber lesbar an' },
      { parameter: 'Match-Dauer', start: '3–5 Min (Punktziel 10)', note: 'Overtime max. 60 s' },
      { parameter: 'Respawn', start: '3 s', note: 'Mit kurzer Schutzzeit von 1,5 s' },
      { parameter: 'Rang-Punkte', start: '+20 / -15', note: 'Anfänger-Schutz: erste 10 Matches kein Verlust' },
      { parameter: 'Matchmaking-Spanne', start: '±1 Rangstufe', note: 'Wartezeit-Deckel 30 s, dann ±2' },
      { parameter: 'Power-Up-Spawn', start: 'alle 45 s, angekündigt', note: 'Kampf um die Mitte erzwingen' },
    ],
    levelDesignNotes: [
      'Symmetrische Arenen für 1v1/2v2 – Fairness ist nicht verhandelbar.',
      'Power-Up-Spawns mit sichtbarem Timer schaffen planbare Konfliktpunkte.',
      'Offene Sichtlinien, keine Camping-Ecken.',
      'Arena-Rotation pro Saison hält das Meta frisch.',
    ],
    retentionHooks: ['Saisonziele', 'Loadout-Meisterschaft', 'Rotations-Modi am Wochenende'],
    eventIdeas: [
      { name: 'Blitzturnier', concept: 'Wochenend-Turnier in Bo3-Format mit Titel für die Top 8.' },
      { name: 'Mutations-Modus', concept: 'Eine Woche niedrige Gravitation oder Riesen-Modus.' },
      { name: 'Saisonfinale', concept: 'Letzte Woche: doppelte Meisterschaft und Abschluss-Banner.' },
    ],
    multiplayerAngle:
      'Multiplayer ist der Kern: 1v1 und 2v2 mit serverautoritativer Simulation, Zuschauer-Modus für Freunde und faires Ranglisten-Matchmaking.',
    touchControls:
      'Stick plus zwei Aktions-Buttons, Aim-Assist mit sanftem Magnetismus, Eingabepuffer für Kombos; alle Buttons skalierbar.',
  },

  racing: {
    pitch: 'Drei Minuten Vollgas: leicht zu fahren, der Drift entscheidet.',
    themes: [
      'Murmelbahn-Rennen quer durch ein Baumhaus',
      'Schwebe-Gleiter über spiegelnden Salzseen',
      'Seifenkisten-Rennen durch ein Bergdorf',
    ],
    coreLoop: [
      'Cup oder Strecke wählen',
      'Rennen fahren (Drift und Boost)',
      'Platzierung und Teile kassieren',
      'Fahrzeug tunen',
      'Nächsten Cup angehen',
    ],
    sessionMinutes: [8, 15],
    progressionModel: 'Cup-Leiter plus Fahrzeug-Tuning',
    progressionCurve:
      'Cups in vier Ligen; jede Liga verlangt Podiumsplätze. Tuning-Teile verändern das Fahrgefühl (Seitwärts-Upgrades), rohe Endgeschwindigkeit wächst nur moderat – Fahrkönnen bleibt dominant.',
    milestones: [
      'Erster Podiumsplatz',
      'Drift-Boost Stufe 3 gezündet',
      'Zweites Fahrzeug freigeschaltet',
      'Liga Silber erreicht',
      'Bestzeit-Geist einer Freundin geschlagen',
    ],
    metaProgression:
      'Fahrzeug-Sammlung mit Tuning-Slots; Saison-Ligen mit Auf- und Abstieg geben dem Fahren einen Rahmen.',
    currencies: [
      {
        name: 'Schraubenteile',
        kind: 'Soft',
        earn: ['Rennplatzierungen', 'Zeitfahren', 'Tagesziele'],
        spend: ['Tuning-Teile', 'Lackierungen'],
        balance: 'Tuning-Kosten ×1,5 je Stufe; ein Teil pro 2–3 Rennen erreichbar.',
      },
      {
        name: 'Pokale',
        kind: 'Fortschritt',
        earn: ['Cup-Siege', 'Liga-Aufstiege'],
        spend: ['Neue Cups', 'Fahrzeug-Freischaltungen'],
        balance: 'Der nächste Cup ist immer in Sichtweite: 3–5 Pokale Abstand.',
      },
    ],
    items: [
      { name: 'Flitzkiste „Rakete 7"', effect: 'Ausgewogenes Startfahrzeug', rarity: 'Gewöhnlich' },
      { name: 'Breitreifen-Satz', effect: '+Grip, -Höchsttempo', rarity: 'Gewöhnlich' },
      { name: 'Turbo-Flasche', effect: 'Längerer Drift-Boost', rarity: 'Selten' },
      { name: 'Leichtbau-Chassis', effect: 'Schnellere Beschleunigung, empfindlicher bei Kollision', rarity: 'Selten' },
      { name: 'Kurvenkralle', effect: 'Engere Drift-Linie', rarity: 'Episch' },
      { name: 'Windschnitt-Spoiler', effect: 'Stärkerer Windschatten-Effekt', rarity: 'Episch' },
    ],
    enemyFraming: 'rivals',
    enemies: [
      { name: 'Blockierer', role: 'Defensiv-KI', behavior: 'Verteidigt die Ideallinie, lässt innen Lücken' },
      { name: 'Windschatten-Jäger', role: 'Opportunist', behavior: 'Klebt am Heck und überholt spät' },
      { name: 'Frühbremser', role: 'Anfänger-KI', behavior: 'Bremst vor Kurven zu früh – Überholfenster' },
      { name: 'Risiko-Springer', role: 'Abkürzer', behavior: 'Nimmt jede Abkürzung, scheitert manchmal' },
      { name: 'Saubere Linie', role: 'Referenz-KI', behavior: 'Fährt fehlerfrei die Ideallinie – der Maßstab' },
      { name: 'Gummiband-Rivale', role: 'Spannungs-KI', behavior: 'Bleibt in Reichweite (±8 % Tempo), nur untere Ligen' },
    ],
    quests: [
      { name: 'Podium', goal: 'Top 3 in Cup 1', reward: '30 Schraubenteile' },
      { name: 'Driftkünstler', goal: 'Drift-Kombo über 5 Sekunden', reward: 'Lackierung „Flammenmeer"' },
      { name: 'Überflieger', goal: '10 Fahrer in einem Rennen überholen', reward: '20 Schraubenteile' },
      { name: 'Saubere Runde', goal: 'Runde ohne Bandenkontakt', reward: 'Tuning-Rabatt-Ticket' },
      { name: 'Geisterjagd', goal: 'Tages-Zeitfahren-Geist schlagen', reward: '1 Pokal' },
    ],
    balancing: [
      { parameter: 'Rennlänge', start: '2:30–3:30 Min', note: '3 Runden à ca. 60 s' },
      { parameter: 'Drift-Boost-Stufen', start: '0,6 / 1,2 / 2,0 s', note: 'Farbcodiert wie ein Ampelsystem' },
      { parameter: 'Gummiband-KI', start: '±8 % Tempo', note: 'Ab Liga Gold deaktiviert' },
      { parameter: 'Teile pro Rennen', start: '15–30', note: 'Platzierungsabhängig' },
      { parameter: 'Tuning-Kostenfaktor', start: '×1,5 pro Stufe', note: 'Max. 3 Stufen pro Slot' },
      { parameter: 'Kollisionsstrafe', start: '-20 % Tempo für 1 s', note: 'Rammen darf sich nicht lohnen' },
    ],
    levelDesignNotes: [
      'Jede Strecke hat 2–3 Abkürzungen mit echtem Risiko-Belohnungs-Verhältnis.',
      'Breite Ideallinie für Einsteiger, enge Bestlinie für Profis.',
      'Markante Landmarken vor jeder Kurve als Brems-Referenz.',
      'Runden um die 60–90 Sekunden – kurz genug für „eine geht noch".',
    ],
    retentionHooks: ['Tages-Zeitfahren mit Geist', 'Liga-Saison', 'Fahrzeug-Sammlung'],
    eventIdeas: [
      { name: 'Nachtrennen', concept: 'Bekannte Strecken bei Nacht mit Lichtspur-Effekten.' },
      { name: 'Spiegel-Cup', concept: 'Alle Strecken spiegelverkehrt.' },
      { name: 'Zeitfahren-Wochenende', concept: 'Globale Bestzeiten-Jagd mit Replay-Galerie.' },
    ],
    multiplayerAngle:
      'Rennen mit bis zu 8 Fahrern; bei schwacher Verbindung nahtloser Fallback auf Geister. Kollisionen zwischen Spielern abgeschwächt – kein Rammbock-Griefing.',
    touchControls:
      'Automatisches Gas, Lenken per Neigung oder Touch (wählbar), Drift-Button rechts; Boost per Wisch nach vorn.',
  },

  horror: {
    pitch: 'Spannung statt Schockfabrik: Licht, Klang und Tempo steuern die Angstkurve.',
    themes: [
      'Stillgelegtes Planetarium mit flackernder Sternenshow',
      'Nachtschicht in einem Kaufhaus voller Automaten',
      'Nebliges Küstendorf, dessen Laternen nachts wandern',
    ],
    coreLoop: [
      'Aufgabe im Gebäude finden',
      'Licht und Batterien verwalten',
      'Dem Verfolger ausweichen',
      'Hinweise kombinieren',
      'Abschnitt entkommen',
    ],
    sessionMinutes: [10, 20],
    progressionModel: 'Kapitel mit eskalierendem Verfolger-Verhalten',
    progressionCurve:
      'Fünf Kapitel; jedes gibt dem Verfolger eine neue Fähigkeit und den Spielenden ein neues Werkzeug. Die Spannungskurve pro Kapitel: ruhiger Einstieg, Eskalation, Flucht-Finale.',
    milestones: [
      'Kapitel 1: erstem Verfolger entkommen',
      'Erstes Tonband-Archiv zur Hälfte gefüllt',
      'Kapitel 3: Verfolger hört Schritte',
      'Alle Verstecke eines Kapitels genutzt',
      'Alternatives Ende freigeschaltet',
    ],
    metaProgression:
      'Gefundene Tonbänder und Notizen bleiben im Archiv; gesammelte Hinweise entscheiden über eines von drei Enden.',
    currencies: [
      {
        name: 'Batterien',
        kind: 'Ressource',
        earn: ['Schubladen durchsuchen', 'Nebenräume erkunden'],
        spend: ['Taschenlampe', 'Türsummer', 'Polaroid-Blitz'],
        balance: 'Pro Kapitel ca. 130 % des Mindestbedarfs verteilt – Erkunden entlastet, Horten lohnt nicht.',
      },
      {
        name: 'Archivseiten',
        kind: 'Fortschritt',
        earn: ['Tonbänder', 'Notizen', 'Geheimverstecke'],
        spend: ['(werden gesammelt, nicht ausgegeben – schalten Enden frei)'],
        balance: 'Ende B ab 60 %, Ende C ab 90 % der Seiten.',
      },
    ],
    items: [
      { name: 'Kurbeltaschenlampe', effect: 'Licht ohne Batterie, aber laut beim Aufladen', rarity: 'Selten' },
      { name: 'Türkeil', effect: 'Blockiert eine Tür für 10 Sekunden', rarity: 'Gewöhnlich' },
      { name: 'Wurf-Wecker', effect: 'Lenkt den Verfolger zum Aufprallort', rarity: 'Gewöhnlich' },
      { name: 'Beruhigungstee', effect: 'Dämpft den hörbaren Herzschlag 60 s', rarity: 'Selten' },
      { name: 'Dietrich-Set', effect: 'Öffnet einfache Schlösser ohne Schlüssel', rarity: 'Episch' },
      { name: 'Polaroid-Kamera', effect: 'Blitz bannt den Verfolger 3 s (einmal pro Kapitel)', rarity: 'Legendär' },
    ],
    enemyFraming: 'enemies',
    enemies: [
      { name: 'Der Lampensammler', role: 'Hauptverfolger', behavior: 'Löscht Lichtquellen und patrouilliert dazwischen' },
      { name: 'Knisterpuppen', role: 'Alarmanlage', behavior: 'Bewegungslos – knistern, wenn man rennt' },
      { name: 'Schaufenster-Schatten', role: 'Zonen-Gefahr', behavior: 'Nur im Spiegelbild sichtbar' },
      { name: 'Der summende Aufzug', role: 'Wegelagerer', behavior: 'Fährt unberechenbar, manchmal wartet etwas darin' },
      { name: 'Spiegelgänger', role: 'Kapitel-4-Schreck', behavior: 'Imitiert die Spielbewegung seitenverkehrt' },
      { name: 'Die Nachtwartin', role: 'Finale', behavior: 'Kombiniert alle Verfolger-Fähigkeiten im Endspiel' },
    ],
    quests: [
      { name: 'Generatorschlüssel', goal: 'Den Schlüsselbund im Heizungskeller finden', reward: 'Zugang Kapitel 2' },
      { name: 'Licht ins Dunkel', goal: '3 Sicherungen bei laufendem Verfolger tauschen', reward: 'Archivseite ×2' },
      { name: 'Stimmen von gestern', goal: '5 Tonbänder eines Kapitels finden', reward: 'Beruhigungstee-Rezept' },
      { name: 'Leisetreter', goal: 'Ein Kapitel ohne Rennen abschließen', reward: 'Abzeichen „Samtpfote"' },
      { name: 'Kartograf des Grauens', goal: 'Alle Räume eines Kapitels betreten', reward: 'Dietrich-Set' },
    ],
    balancing: [
      { parameter: 'Verfolger-Tempo', start: '95 % des Spielertempos', note: 'Kapitel 4+: 105 % in Sichtlinie' },
      { parameter: 'Hörradius', start: '12 m (Rennen), 4 m (Gehen)', note: 'Schleichen: 1 m' },
      { parameter: 'Batterie-Laufzeit', start: '90 s Dauerlicht', note: 'Flackern als 15-s-Warnung' },
      { parameter: 'Verstecke-Abklingzeit', start: '20 s', note: 'Verhindert Dauer-Camping im Spind' },
      { parameter: 'Schreck-Budget', start: 'max. 1 Schreckmoment / 5 Min', note: 'Spannung schlägt Schock' },
      { parameter: 'Kapitel-Länge', start: '15–20 Min', note: 'Speicherpunkt in der Mitte' },
    ],
    levelDesignNotes: [
      'Rundwege mit Abkürzungen: Wer die Karte lernt, entkommt eleganter.',
      'Sichere Zonen mit warmem Licht als Atempausen und Speicherorte.',
      'Audio kündigt Gefahr an, bevor sie sichtbar ist – Ohren sind das Radar.',
      'Fluchtwege immer paarweise: eine Tür ist keine Wahl.',
    ],
    retentionHooks: ['Kapitel-Cliffhanger', 'Archiv-Vervollständigung', 'Drei alternative Enden'],
    eventIdeas: [
      { name: 'Neumond-Nacht', concept: 'Härtemodus mit weniger Batterien, exklusives Abzeichen.' },
      { name: 'Fundbüro', concept: 'Neue Notiz-Serie erweitert die Hintergrundgeschichte.' },
      { name: 'Gemeinschaftsrätsel', concept: 'Die Community entschlüsselt gemeinsam ein Tonband-Puzzle.' },
    ],
    multiplayerAngle:
      'Optionaler Zwei-Spieler-Modus: getrennte Gebäudeflügel, verbunden nur über Funkgeräte – Angst durch Trennung, nicht durch Chaos.',
    touchControls:
      'Schleichen über Tempo-Slider, Licht per Halte-Button, kontextsensitive Interaktion; Kamera-Empfindlichkeit und Grusel-Intensität einstellbar.',
  },

  social_hangout: {
    pitch: 'Ein Ort zum Dableiben: Ausdruck, Aktivitäten und gemeinsame Räume statt Highscore-Druck.',
    themes: [
      'Dachterrassen-Café über einer verregneten Großstadt',
      'Badesee mit Bootssteg, Lagerfeuer und Sternenhimmel',
      'Nachtmarkt mit Laternen, Bühnen und Teeständen',
    ],
    coreLoop: [
      'Einloggen und Freunde treffen',
      'Aktivität starten (Minispiel, Foto, Bühne)',
      'Sich ausdrücken (Outfits, Emotes)',
      'Den eigenen Raum dekorieren',
      'Zum nächsten Event wiederkommen',
    ],
    sessionMinutes: [15, 40],
    progressionModel: 'Sozialer Ausdruck plus Raum-Ausbau',
    progressionCurve:
      'Keine Machtkurve: Fortschritt heißt mehr Ausdrucksmöglichkeiten. Deko-Kataloge, Outfit-Sammlungen und Freundschafts-Level wachsen stetig und ohne Zeitdruck.',
    milestones: [
      'Eigenes Zimmer eingerichtet',
      'Erster Bühnen-Auftritt',
      'Freundschafts-Level 5 mit gemeinsamem Emote',
      'Deko-Katalog Stufe 3',
      'Gastgeber-Abzeichen (10 Besucher)',
    ],
    metaProgression:
      'Deko-Kataloge, Outfit-Sammlungen und Freundschafts-Level mit gemeinsamen Emotes – Erinnerungen statt Ranglisten.',
    currencies: [
      {
        name: 'Marktmünzen',
        kind: 'Soft',
        earn: ['Aktivitäten', 'Tagesbesuch', 'Minispiel-Teilnahme'],
        spend: ['Deko-Objekte', 'Outfits', 'Raum-Erweiterungen'],
        balance: 'Teilnahme zählt mehr als Sieg (60/40-Verteilung) – kein Leistungsdruck.',
      },
      {
        name: 'Herzen',
        kind: 'Sozial',
        earn: ['Kuratierte Komplimente', 'Gemeinsame Aktivitäten', 'Gastgeber sein'],
        spend: ['Freundschafts-Emotes', 'Gemeinsame Deko-Objekte'],
        balance: 'Tageslimit 50 gegen Farm-Missbrauch; nur über Positiv-Interaktionen verdienbar.',
      },
    ],
    items: [
      { name: 'Laternen-Girlande', effect: 'Stimmungslicht für den eigenen Raum', rarity: 'Gewöhnlich' },
      { name: 'Plüsch-Sitzsack „Momo"', effect: 'Sitzplatz mit Kuschel-Emote', rarity: 'Selten' },
      { name: 'Bühnen-Mikro', effect: 'Startet Karaoke-Minispiel im Raum', rarity: 'Episch' },
      { name: 'Foto-Filter „Goldstunde"', effect: 'Warmes Licht für den Fotomodus', rarity: 'Selten' },
      { name: 'Teetisch für vier', effect: 'Gruppen-Sitzgelegenheit mit Teezeremonie', rarity: 'Selten' },
      { name: 'Feuerwerk-Set', effect: 'Moderiertes Feuerwerk für Raum-Events', rarity: 'Legendär' },
    ],
    enemyFraming: 'obstacles',
    enemies: [
      { name: 'Seerosen-Hüpfen', role: 'Geschicklichkeits-Minispiel', behavior: 'Wer zuerst über den See hüpft' },
      { name: 'Karaoke-Takt', role: 'Rhythmus-Minispiel', behavior: 'Timing-Tipps zur Melodie' },
      { name: 'Wer malt das?', role: 'Rate-Minispiel', behavior: 'Zeichnen und Raten in der Gruppe' },
      { name: 'Bootsrennen', role: 'Renn-Minispiel', behavior: 'Paddel-Rhythmus zu zweit' },
      { name: 'Versteckrunde', role: 'Such-Minispiel', behavior: 'Verstecken auf dem ganzen Gelände' },
      { name: 'Tablett-Balance', role: 'Geschicklichkeit', behavior: 'Bestellungen über den Markt tragen' },
    ],
    quests: [
      { name: 'Gastgeber', goal: '3 Freunde in den eigenen Raum einladen', reward: '20 Herzen' },
      { name: 'Bühnenmoment', goal: 'An einem Talentabend teilnehmen', reward: 'Emote „Verbeugung"' },
      { name: 'Deko-Debüt', goal: '10 Objekte im Raum platzieren', reward: 'Laternen-Girlande' },
      { name: 'Marktbummel', goal: 'Alle Stände des Nachtmarkts besuchen', reward: '50 Marktmünzen' },
      { name: 'Foto des Tages', goal: 'Ein Foto im Fotomodus teilen', reward: 'Filter-Probe' },
      { name: 'Stammgast', goal: 'An 3 Tagen vorbeischauen (ohne Straf-Reset)', reward: 'Sitzsack „Momo"' },
    ],
    balancing: [
      { parameter: 'Minispiel-Dauer', start: '90–180 s', note: 'Kurz genug für spontane Runden' },
      { parameter: 'Belohnungs-Verteilung', start: '60 % Teilnahme / 40 % Platzierung', note: 'Kein Winner-takes-all' },
      { parameter: 'Raum-Slots (Start)', start: '20 Deko-Objekte', note: 'Erweiterbar auf 60' },
      { parameter: 'Herzen-Tageslimit', start: '50', note: 'Anti-Farming, schützt die Währung' },
      { parameter: 'Server-Größe', start: '20–30 Personen', note: 'Groß genug für Leben, klein genug für Nähe' },
      { parameter: 'Instanz-Räume', start: 'bis 8 Gäste', note: 'Private Rückzugsorte für Gruppen' },
    ],
    levelDesignNotes: [
      'Die Plaza als Hub mit Sichtachsen zu allen Aktivitäten – nichts liegt versteckt.',
      'Ruhige Ecken bewusst einplanen: Bänke, Aussichtspunkte, Teestände.',
      'Wege zwischen Aktivitäten unter 30 Sekunden.',
      'Tag-Nacht-Stimmung im 45-Minuten-Zyklus verändert Licht und Musik.',
    ],
    retentionHooks: ['Wechselnde Wochenend-Aktivität', 'Deko-Kataloge', 'Freundschafts-Level'],
    eventIdeas: [
      { name: 'Laternenfest', concept: 'Gemeinsames Laternen-Basteln und eine Prozession über den Markt.' },
      { name: 'Talentabend', concept: 'Offene Bühne mit moderierten Auftritten und Publikums-Herzen.' },
      { name: 'Flohmarkt-Sonntag', concept: 'Deko-Objekte der Saison wechseln kuratiert die Besitzer.' },
    ],
    multiplayerAngle:
      'Multiplayer ist der Kern: Server mit 20–30 Personen, Instanz-Räume für Freundesgruppen und starke Safety-Werkzeuge (Melden, Stummschalten, Privaträume) von Tag eins an.',
    touchControls:
      'Tap-to-move mit Kontextaktionen, Emote-Rad, große kuratierte Chat-Schnellantworten – sicher auch für junge Zielgruppen.',
  },

  sandbox: {
    pitch: 'Bauen ohne Bauplan: Werkzeuge, die kreativ machen, und eine Community, die zeigt, was geht.',
    themes: [
      'Schwimmende Inselwerft, auf der Schiffe wachsen',
      'Riesiger Dachboden mit Modellbahn-Maßstab',
      'Korallenriff, in dem Architektur lebendig ist',
    ],
    coreLoop: [
      'Eigene Parzelle betreten',
      'Bauen und Formen mit Werkzeugen',
      'Neue Teile freischalten',
      'Kreation veröffentlichen',
      'Featured-Bauten besuchen und Ideen mitnehmen',
    ],
    sessionMinutes: [15, 40],
    progressionModel: 'Katalog-Freischaltung plus Werkzeug-Stufen',
    progressionCurve:
      'Bau-Zeit und Bau-Briefings schalten Katalog-Kapitel frei; Werkzeuge wachsen in Stufen (präziser, mächtiger). Kein Zeitdruck: Die Kurve misst sich an Kreationen, nicht an Stunden.',
    milestones: [
      'Erste Kreation veröffentlicht',
      '10 Reaktionen von Besuchern',
      'Werkzeug „Kurvenzieher" freigeschaltet',
      'Bau-Briefing der Woche gemeistert',
      'Feature in der Werkschau-Galerie',
    ],
    metaProgression:
      'Der Baukatalog wächst dauerhaft; die kuratierte „Werkschau"-Galerie ist das Langzeitziel für ambitionierte Bauleute.',
    currencies: [
      {
        name: 'Bauteile-Punkte',
        kind: 'Soft',
        earn: ['Bau-Briefings', 'Besucher-Reaktionen', 'Tagesziel'],
        spend: ['Katalog-Kapitel', 'Material-Farben'],
        balance: 'Briefings sind die Hauptquelle – Qualität schlägt Spielzeit.',
      },
      {
        name: 'Prisma',
        kind: 'Hard',
        earn: ['Werkschau-Features', 'Events'],
        spend: ['Deko-Themenpakete', 'Spezialeffekte (Wetter, Licht)'],
        balance: 'Reine Ausdrucks-Sinks; Bau-Power ist nie kaufbar.',
      },
    ],
    items: [
      { name: 'Kurvenzieher', effect: 'Zieht geschwungene Wände und Bögen', rarity: 'Selten' },
      { name: 'Spiegelmodus', effect: 'Baut symmetrisch in Echtzeit mit', rarity: 'Selten' },
      { name: 'Farbeimer mit Verlauf', effect: 'Zweifarbige Verläufe auf Flächen', rarity: 'Episch' },
      { name: 'Physik-Scharnier', effect: 'Bewegliche Teile: Türen, Wippen, Mühlen', rarity: 'Episch' },
      { name: 'Wetter-Schalter', effect: 'Regen, Nebel oder Abendlicht für die Parzelle', rarity: 'Legendär' },
      { name: 'Miniatur-Kamera', effect: 'Rundflug-Aufnahmen der eigenen Kreation', rarity: 'Gewöhnlich' },
    ],
    enemyFraming: 'obstacles',
    enemies: [
      { name: 'Brücke mit drei Teilen', role: 'Bau-Briefing', behavior: 'Minimalismus-Aufgabe der Woche' },
      { name: 'Haus ohne rechte Winkel', role: 'Bau-Briefing', behavior: 'Formsprache-Herausforderung' },
      { name: 'Nur-Glas-Turm', role: 'Bau-Briefing', behavior: 'Material-Beschränkung' },
      { name: 'Bewegliches Kunstwerk', role: 'Bau-Briefing', behavior: 'Physik-Scharniere pflicht' },
      { name: 'Miniatur-Welt', role: 'Bau-Briefing', behavior: 'Alles im 1:10-Maßstab' },
      { name: 'Nachtstück', role: 'Bau-Briefing', behavior: 'Nur mit Lichtquellen gestalten' },
    ],
    quests: [
      { name: 'Richtfest', goal: 'Erste Kreation veröffentlichen', reward: '50 Bauteile-Punkte' },
      { name: 'Publikum', goal: '10 Reaktionen sammeln', reward: 'Miniatur-Kamera' },
      { name: 'Wochen-Briefing', goal: 'Das aktuelle Bau-Briefing einreichen', reward: '100 Bauteile-Punkte' },
      { name: 'Farbenlehre', goal: '5 Materialfarben kombinieren', reward: 'Farbeimer mit Verlauf' },
      { name: 'Gastbauer', goal: 'Bei einem Freund mitbauen', reward: 'Kollab-Abzeichen' },
      { name: 'Galerist', goal: '10 Featured-Bauten besuchen', reward: '1 Prisma' },
    ],
    balancing: [
      { parameter: 'Parzellengröße (Start)', start: '64×64 Raster', note: 'Erweiterbar auf 128×128' },
      { parameter: 'Teile-Limit', start: '2.000 pro Parzelle', note: 'Performance-Budget, sichtbare Anzeige' },
      { parameter: 'Publish-Abklingzeit', start: '10 Min', note: 'Gibt der Moderation Luft' },
      { parameter: 'Reaktions-Gewicht', start: 'degressiv pro Besucher', note: 'Anti-Boosting' },
      { parameter: 'Katalog-Kapitel', start: '8 Kapitel à 25 Teile', note: 'Erstes Kapitel sofort offen' },
      { parameter: 'Undo-Verlauf', start: '50 Schritte', note: 'Mut zum Experiment absichern' },
    ],
    levelDesignNotes: [
      'Hub-Galerie mit Teleport zu Parzellen: Inspiration ist die halbe Miete.',
      'Vorlagen-Ecke für Einsteiger – ein halbfertiges Haus lädt zum Weiterbauen ein.',
      'Featured-Bauten wechseln wöchentlich und sind kuratiert (Qualität und Sicherheit).',
      'Parzellen-Nachbarschaften nach Themen sortieren.',
    ],
    retentionHooks: ['Wöchentliche Bau-Briefings', 'Werkschau-Features', 'Katalog-Vervollständigung'],
    eventIdeas: [
      { name: 'Themen-Bauwoche', concept: 'Alle bauen zum selben Motto; Galerie zeigt die Vielfalt.' },
      { name: 'Kollab-Bau', concept: 'Vier Bauleute, eine Parzelle, 48 Stunden.' },
      { name: 'Werkschau-Gala', concept: 'Monatliche Prämierung mit Rundflug-Video der Gewinner.' },
    ],
    multiplayerAngle:
      'Ko-Kreation: gemeinsame Bau-Sessions mit Rechteverwaltung (Besitzerin/Gast), Besuchsmodus mit Reaktionen statt Vandalismus-Risiko.',
    touchControls:
      'Zwei-Finger-Orbit-Kamera, Raster-Snapping zuschaltbar, Werkzeugleiste unten, Undo prominent; Präzisionsmodus per Lupe.',
  },

  card_battler: {
    pitch: 'Kleine Decks, große Entscheidungen: Matches in fünf Minuten, Deckbau für Wochen.',
    themes: [
      'Ateliergeister, die Kunststile gegeneinander antreten lassen',
      'Küchenschlacht der Gewürzfraktionen',
      'Insekten-Olympiade im Gartenreich',
    ],
    coreLoop: [
      'Deck wählen oder anpassen',
      'Match spielen',
      'Karten und Farbstaub kassieren',
      'Neue Karte einbauen',
      'Rangleiter oder Herausforderungs-Turm angehen',
    ],
    sessionMinutes: [8, 15],
    progressionModel: 'Rangleiter plus Sammlungs-Ausbau',
    progressionCurve:
      'Rang-Punkte pro Sieg; die Sammlung wächst über Packs mit Duplikatschutz und gezieltes Crafting. Jede Karte ist herstellbar – Sammlung ist Planung, kein Glücksspiel.',
    milestones: [
      'Erstes eigenes Deck gebaut',
      'Rang Bronze → Silber',
      'Erste Fraktion gemeistert (20 Siege)',
      'Turm-Etage 10 erreicht',
      'Erste selbst gecraftete Legendäre',
    ],
    metaProgression:
      'Sammlung plus Farbstaub-Crafting mit Duplikatschutz; Fraktions-Meisterungen schalten Kartenrücken und Arenen frei.',
    currencies: [
      {
        name: 'Farbstaub',
        kind: 'Ressource',
        earn: ['Duplikate (automatisch ab 4. Kopie)', 'Wochenziele'],
        spend: ['Gezieltes Karten-Crafting'],
        balance: 'Selten 100 / Episch 400 / Legendär 1.600 – jede Wunschkarte ist erreichbar.',
      },
      {
        name: 'Skizzenblätter',
        kind: 'Soft',
        earn: ['Matches', 'Tagesquests', 'Turm-Etagen'],
        spend: ['Packs (mit Duplikatschutz)', 'Kartenrücken'],
        balance: 'Ca. 1 Pack pro Spieltag für aktive Spielende.',
      },
    ],
    items: [
      { name: 'Aquarell-Golem', effect: 'Wächter: nimmt Treffer für Nachbarn', rarity: 'Selten' },
      { name: 'Tintenklecks-Kobold', effect: 'Billig, hinterlässt beim Tod einen Fleck-Token', rarity: 'Gewöhnlich' },
      { name: 'Pastell-Phönix', effect: 'Kehrt einmal pro Partie geschwächt zurück', rarity: 'Legendär' },
      { name: 'Radiergummi-Falle', effect: 'Entfernt den nächsten gegnerischen Effekt', rarity: 'Selten' },
      { name: 'Perspektiven-Wechsel', effect: 'Tauscht die Positionen zweier Einheiten', rarity: 'Episch' },
      { name: 'Meisterpinsel', effect: 'Verstärkt alle eigenen Farben-Effekte diese Runde', rarity: 'Episch' },
    ],
    enemyFraming: 'rivals',
    enemies: [
      { name: 'Aggro-Skizze', role: 'Tempo-Deck', behavior: 'Früher Druck, fällt in Runde 7+ ab' },
      { name: 'Kontroll-Galerie', role: 'Kontroll-Deck', behavior: 'Antworten auf alles, gewinnt spät' },
      { name: 'Kombo-Collage', role: 'Kombo-Deck', behavior: 'Baut zwei Runden auf, explodiert dann' },
      { name: 'Midrange-Mosaik', role: 'Kurven-Deck', behavior: 'Solide Werte, wenig Tricks' },
      { name: 'Mühlen-Museum', role: 'Alternative Siegbedingung', behavior: 'Leert das gegnerische Deck' },
      { name: 'Der Kurator', role: 'PvE-Boss', behavior: 'Turm-Endgegner mit eigenen Regelbrüchen' },
    ],
    quests: [
      { name: 'Fraktionstreue', goal: '3 Siege mit einer Fraktion', reward: '1 Pack' },
      { name: 'Breites Feld', goal: 'Mit 5+ Einheiten auf dem Feld gewinnen', reward: '40 Skizzenblätter' },
      { name: 'Sparfuchs', goal: 'Sieg mit 3+ ungenutztem Mana', reward: '30 Skizzenblätter' },
      { name: 'Turmwache', goal: '3 Turm-Etagen an einem Tag', reward: '80 Farbstaub' },
      { name: 'Kuratiert', goal: 'Den Kurator besiegen', reward: 'Kartenrücken „Vernissage"' },
    ],
    balancing: [
      { parameter: 'Startdeck-Winrate (Ziel)', start: '45–50 %', note: 'Gegen andere Startdecks gemessen' },
      { parameter: 'Manakurve Startdecks', start: 'Peak bei 2–3 Mana', note: 'Lernfreundlich, wenig Nichtstun' },
      { parameter: 'Match-Länge', start: '5–8 Züge', note: 'Zug-Timer 45 s' },
      { parameter: 'Duplikatschutz', start: 'ab 4. Kopie → Farbstaub', note: 'Automatisch, ohne Klickarbeit' },
      { parameter: 'Craft-Kosten', start: 'Selten 100 / Episch 400', note: 'Legendär 1.600' },
      { parameter: 'Neue Karten pro Saison', start: '40', note: 'Klein genug zum Überblicken' },
    ],
    levelDesignNotes: [
      'Drei Modi klar getrennt: Rangleiter, Herausforderungs-Turm (PvE), Freundschaftsduell.',
      'Der Turm lehrt Deckbau: Jede Etage erzwingt eine andere Antwort.',
      'Arena-Hintergründe pro Fraktion mit ruhiger Animation – Fokus bleibt auf dem Brett.',
      'Neue-Spieler-Pfad: 10 Lehrduelle mit wachsendem Regelumfang.',
    ],
    retentionHooks: ['Tagesquests', 'Turm-Etagen', 'Saison-Kartenset'],
    eventIdeas: [
      { name: 'Entwurfs-Modus', concept: 'Draft aus zufälligen Karten – Sammlung egal, Können zählt.' },
      { name: 'Fraktionswoche', concept: 'Bonus-Meisterung und Themen-Quests für eine Fraktion.' },
      { name: 'Puzzle-Bretter', concept: 'Vorgegebene Stellungen: Gewinne in einem Zug.' },
    ],
    multiplayerAngle:
      'Asynchron-freundliches PvP mit 45-Sekunden-Zügen, Rematch-Button und Zuschauen bei Freunden; Matchmaking nach Rang, nie nach Sammlung.',
    touchControls:
      'Karten per Drag ausspielen, langes Drücken zeigt Details, Zug-Bestätigung gegen Fehlklicks; Handkarten-Fächer für kleine Displays optimiert.',
  },

  merge: {
    pitch: 'Ordnung schaffen macht glücklich: mergen, freiräumen, Produktionsketten entdecken.',
    themes: [
      'Verwilderter Botanischer Garten erwacht wieder',
      'Dachboden voller halbfertiger Erfindungen',
      'Halbversunkene Hafenstadt taucht Stück für Stück auf',
    ],
    coreLoop: [
      'Objekte auf dem Brett zusammenfügen',
      'Aufträge der Bewohner erfüllen',
      'Neue Bereiche freilegen',
      'Produktionsketten erweitern',
      'Mit gefüllter Energie zurückkehren',
    ],
    sessionMinutes: [5, 15],
    progressionModel: 'Gebiets-Restaurierung plus Ketten-Ausbau',
    progressionCurve:
      'Aufträge treiben die Restaurierung; jedes Gebiet erzählt ein Story-Kapitel. Ketten wachsen bis Stufe 8 – höhere Stufen erscheinen zuerst als seltene Belohnung, dann regulär.',
    milestones: [
      'Erste Kette auf Stufe 6',
      'Erstes Gebiet vollständig restauriert',
      'Bewohnerin Oma Line zieht wieder ein',
      'Zweites Brett freigeschaltet',
      'Ketten-Kompendium zur Hälfte entdeckt',
    ],
    metaProgression:
      'Restaurierte Gebiete erzählen die Geschichte weiter; das Ketten-Kompendium sammelt jede entdeckte Stufe dauerhaft.',
    currencies: [
      {
        name: 'Energie',
        kind: 'Ressource',
        earn: ['Regeneration (1 je 90 s)', 'Level-Aufstieg (voll)', 'Tagesgeschenk'],
        spend: ['Produktions-Objekte antippen'],
        balance: 'Großzügig ausgelegt: Eine Session à 10 Minuten geht nie mitten im Auftrag aus.',
      },
      {
        name: 'Gänseblümchen-Taler',
        kind: 'Soft',
        earn: ['Aufträge', 'Verkauf überzähliger Objekte'],
        spend: ['Brett-Erweiterungen', 'Deko der Kulisse'],
        balance: 'Auftrags-Ertrag deckt Erweiterungen mit leichtem Sparziel (2–3 Tage).',
      },
      {
        name: 'Sternsamen',
        kind: 'Hard',
        earn: ['Meilensteine', 'Events'],
        spend: ['Seltene Kettenstarter', 'Kulissen-Themen'],
        balance: 'Nie für Energie einsetzbar – Zeitdruck bleibt draußen.',
      },
    ],
    items: [
      { name: 'Gießkannen-Kette', effect: 'Stufe 1–8: vom Fingerhut zum Springbrunnen', rarity: 'Gewöhnlich' },
      { name: 'Laternen-Kette', effect: 'Beleuchtet freigelegte Bereiche', rarity: 'Gewöhnlich' },
      { name: 'Beeren-Kette', effect: 'Nahrung für Aufträge der Bewohner', rarity: 'Selten' },
      { name: 'Werkzeugkisten-Kette', effect: 'Schlüssel zu Reparatur-Aufträgen', rarity: 'Selten' },
      { name: 'Bienenstock', effect: 'Produziert alle 5 Min Honig-Objekte', rarity: 'Episch' },
      { name: 'Springbrunnen „Aurelia"', effect: 'Kettenende: Schmuckstück mit Bonus-Energie 1×/Tag', rarity: 'Legendär' },
    ],
    enemyFraming: 'obstacles',
    enemies: [
      { name: 'Rankenfeld', role: 'Brett-Blockade', behavior: 'Braucht Werkzeug-Objekte zum Entfernen' },
      { name: 'Nebelzone', role: 'Verdeckter Bereich', behavior: 'Lüftet sich mit Gebiets-Fortschritt' },
      { name: 'Verschlossene Truhe', role: 'Belohnungs-Rätsel', behavior: 'Braucht Schlüssel aus der Werkzeugkette' },
      { name: 'Sperriges Wrackteil', role: 'Platzfresser', behavior: 'Nur mit Stufe-5-Werkzeug zerlegbar' },
      { name: 'Moosplatte', role: 'Feld-Zustand', behavior: 'Objekte darauf produzieren langsamer' },
      { name: 'Vogelnest', role: 'Unverrückbar', behavior: 'Bleibt bis zum Schlüpfen liegen – dann Bonus' },
    ],
    quests: [
      { name: 'Tee für Oma Line', goal: 'Beeren Stufe 4 + Wasser Stufe 3 liefern', reward: '30 Taler' },
      { name: 'Ein Pfad aus Licht', goal: '5 Laternen Stufe 3 aufstellen', reward: 'Nebelzone lüftet sich' },
      { name: 'Bienenfreund', goal: 'Den Bienenstock reparieren', reward: 'Honig-Produktion' },
      { name: 'Frühjahrsputz', goal: '3 Rankenfelder entfernen', reward: '20 Taler + 1 Sternsamen' },
      { name: 'Werkstattstolz', goal: 'Werkzeugkiste Stufe 6 bauen', reward: 'Truhen-Schlüssel' },
      { name: 'Gartenfest', goal: 'Das erste Gebiet fertig restaurieren', reward: 'Kulissen-Deko + Story-Szene' },
    ],
    balancing: [
      { parameter: 'Brettgröße', start: '7×9 Felder', note: 'Erweiterung auf 9×11' },
      { parameter: 'Energie', start: '100 max., 1 je 90 s', note: 'Level-Up füllt komplett' },
      { parameter: 'Merge-Stufen', start: '8 pro Kette', note: '5er-Merge gibt Bonus-Objekt' },
      { parameter: 'Drop-Verteilung', start: '70/25/5 (Stufe 1/2/3)', note: 'Pity: Stufe 3 nach 15 Drops' },
      { parameter: 'Auftrags-Timer', start: 'keine', note: 'Aufträge warten geduldig' },
      { parameter: 'Produktions-Abklingzeit', start: '5 Min (Bienenstock)', note: 'Sichtbarer Countdown' },
    ],
    levelDesignNotes: [
      'Brett und Kulisse teilen den Bildschirm: Unten wird gearbeitet, oben blüht das Ergebnis.',
      'Jede restaurierte Zone verändert die Kulisse sichtbar und dauerhaft.',
      'Neue Ketten erst zeigen, dann erklären – Entdeckung ist die Belohnung.',
      'Blockaden so platzieren, dass sie neugierig machen statt zu frustrieren.',
    ],
    retentionHooks: ['Bewohner-Aufträge', 'Gebiets-Story', 'Ketten-Kompendium'],
    eventIdeas: [
      { name: 'Regentag', concept: 'Bonus-Energie und schnelleres Pflanzenwachstum für 24 h.' },
      { name: 'Saisongarten', concept: 'Separates Event-Brett mit eigener Kette und Deko-Belohnung.' },
      { name: 'Merge-Marathon', concept: 'Meilenstein-Belohnungen statt Rangliste – jeder gewinnt.' },
    ],
    multiplayerAngle:
      'Asynchron: Nachbarschaftshilfe mit einem Geschenk-Objekt pro Tag an Freunde; keine Wettbewerbs-Ranglisten nötig.',
    touchControls:
      'Drag & Drop mit großzügigem Snapping, Doppeltipp sammelt Produktionen, Pinch-Zoom aufs Brett; Objekte heben sich beim Greifen sichtbar an.',
  },

  runner: {
    pitch: 'Immer vorwärts: Reflexe, Rhythmus und die eine Abzweigung, die alles ändert.',
    themes: [
      'Botenlauf über die Marktdächer einer Wüstenstadt',
      'Kometen-Surfen durch Asteroidengassen',
      'Papierdrache im Herbststurm über dem Flusstal',
    ],
    coreLoop: [
      'Lauf starten',
      'Ausweichen, springen, rutschen',
      'Funken sammeln und Multiplikator halten',
      'Missionsziel erfüllen',
      'Upgrade wählen und neu starten',
    ],
    sessionMinutes: [3, 8],
    progressionModel: 'Missions-Ränge plus Charakter-Upgrades',
    progressionCurve:
      'Drei aktive Missionen; jede erfüllte Mission erhöht den Rang und den Start-Multiplikator. Upgrades sind klein und transparent (+10 % Magnetdauer statt versteckter Mathematik).',
    milestones: [
      'Rang 5: neues Stadtviertel',
      'Multiplikator ×10 erreicht',
      'Erster Charakter freigeschaltet',
      'Alle Missionen eines Rangs an einem Tag',
      '1.000 Funken in einem Lauf',
    ],
    metaProgression:
      'Missionsränge erhöhen den Start-Multiplikator; Charaktere bringen kleine, klar beschriebene Boni und eigene Lauf-Animationen.',
    currencies: [
      {
        name: 'Funken',
        kind: 'Soft',
        earn: ['Einsammeln im Lauf', 'Missionsabschluss', 'Tageslauf'],
        spend: ['Upgrades', 'Charaktere'],
        balance: 'Upgrade-Kosten ×1,5; ein Kauf alle 3–4 Läufe hält die Schleife eng.',
      },
      {
        name: 'Sternschnuppen',
        kind: 'Hard',
        earn: ['Wochenziele', 'Events'],
        spend: ['Charakter-Skins', 'Revive (max. 1 pro Lauf)'],
        balance: 'Revive gedeckelt – Bestwerte bleiben glaubwürdig.',
      },
    ],
    items: [
      { name: 'Magnet-Amulett', effect: 'Zieht Funken 5 s lang an', rarity: 'Gewöhnlich' },
      { name: 'Schutzschild aus Drachenpapier', effect: 'Ein Treffer wird verziehen', rarity: 'Selten' },
      { name: 'Turbo-Böe', effect: '3 s Unverwundbarkeits-Sprint', rarity: 'Selten' },
      { name: 'Doppelsprung-Feder', effect: 'Zweiter Sprung in der Luft', rarity: 'Episch' },
      { name: 'Glücksbringer „Kiko"', effect: 'Missionsfortschritt +20 %', rarity: 'Episch' },
      { name: 'Punkte-Prisma', effect: 'Multiplikator verfällt langsamer', rarity: 'Legendär' },
    ],
    enemyFraming: 'obstacles',
    enemies: [
      { name: 'Wäscheleinen', role: 'Duck-Hindernis', behavior: 'Rutschen erforderlich, flattern hörbar' },
      { name: 'Marktstand-Schranke', role: 'Sprung-Hindernis', behavior: 'Standard-Timing-Test' },
      { name: 'Taubenschwarm', role: 'Bewegtes Hindernis', behavior: 'Fliegt auf, wenn man näher kommt' },
      { name: 'Einsturz-Dach', role: 'Spurwechsel-Zwang', behavior: 'Bricht 1 s nach Betreten ein' },
      { name: 'Windböen-Zone', role: 'Steuerungs-Modifikator', behavior: 'Drückt sanft zur Seite' },
      { name: 'Doppelbarriere', role: 'Kombination', behavior: 'Springen und sofort rutschen' },
    ],
    quests: [
      { name: 'Funkenflug', goal: '300 Funken in einem Lauf', reward: 'Rang-Fortschritt' },
      { name: 'Haarscharf', goal: '3 Beinahe-Treffer in einem Lauf', reward: '50 Funken' },
      { name: 'Tiefflieger', goal: 'Unter 10 Hindernissen durchrutschen', reward: 'Rang-Fortschritt' },
      { name: 'Dauerläufer', goal: '2 Minuten ohne Treffer', reward: '1 Sternschnuppe' },
      { name: 'Abzweigung', goal: 'Die versteckte Dächer-Route finden', reward: '100 Funken' },
    ],
    balancing: [
      { parameter: 'Startgeschwindigkeit', start: '8 m/s', note: '+0,1 m/s je 10 s, Deckel 16 m/s' },
      { parameter: 'Spurwechsel-Dauer', start: '0,2 s', note: 'Eingabefenster 120 ms' },
      { parameter: 'Multiplikator-Verfall', start: 'nach 8 s ohne Funken', note: 'Prisma verlängert auf 12 s' },
      { parameter: 'Revive', start: 'max. 1× pro Lauf', note: 'Rewarded Ad oder Sternschnuppe' },
      { parameter: 'Missions-Slots', start: '3 aktiv', note: 'Reroll 1×/Tag gratis' },
      { parameter: 'Lauf-Länge (Median-Ziel)', start: '90 s', note: 'Obere 10 %: 4+ Min' },
    ],
    levelDesignNotes: [
      'Segmente mit Tags (Intro, Flow, Spike) – der Generator hält die Spannungskurve.',
      'Abzweigungen alle 30 Sekunden: oben riskant und lukrativ, unten sicher.',
      'Tempowechsel kündigen sich über Kamera und Musik an.',
      'Jedes Hindernis hat eine Audio-Signatur – hören hilft ausweichen.',
    ],
    retentionHooks: ['Missionsketten', 'Tageslauf mit festem Layout', 'Charakter-Sammlung'],
    eventIdeas: [
      { name: 'Festival-Lauf', concept: 'Geschmückte Themen-Strecke mit Event-Funken.' },
      { name: 'Gemeinsam weit', concept: 'Globales Sammelziel: alle Funken zählen zusammen.' },
      { name: 'Rush-Hour', concept: 'Angekündigte Stunde mit doppelten Funken.' },
    ],
    multiplayerAngle:
      'Asynchron: Tageslauf mit identischem Layout für alle, Freundes-Geister laufen sichtbar mit.',
    touchControls:
      'Wisch-Gesten in vier Richtungen, großzügiges Eingabefenster (120 ms), Einhand-Portrait; Haptik-Feedback bei Beinahe-Treffern.',
  },

  sports: {
    pitch: 'Arcade-Sport: einfache Regeln, ehrliche Duelle, Highlight-Momente zum Teilen.',
    themes: [
      'Turmspringen mit Stil-Punkten im Feriencamp',
      'Roboter-Völkerball in der Neon-Halle',
      'Dach-Minigolf über den Gassen einer Altstadt',
    ],
    coreLoop: [
      'Match oder Runde starten',
      'Timing-Aktionen ausführen',
      'Punkte und Stil sammeln',
      'Ausrüstung feinjustieren',
      'In der Liga aufsteigen',
    ],
    sessionMinutes: [8, 15],
    progressionModel: 'Liga-Aufstieg plus Ausrüstungs-Feintuning',
    progressionCurve:
      'Ligen von Holz bis Diamant mit Auf- und Abstieg pro Woche; Ausrüstung verschiebt das Spielgefühl (Seitwärts-Upgrades, max. ±10 % Wirkung) – Timing bleibt der Haupthebel.',
    milestones: [
      'Erster Ligasieg',
      'Perfektes Timing zehnmal in einem Match',
      'Aufstieg in Liga Bronze',
      'Erstes Ausrüstungs-Set komplett',
      'Highlight-Replay geteilt',
    ],
    metaProgression:
      'Saison-Ligen mit wöchentlichem Auf-/Abstieg; Ausrüstungs-Sets und Team-Anpassung (Farben, Wappen, Jubel) wachsen dauerhaft.',
    currencies: [
      {
        name: 'Trainingspunkte',
        kind: 'Soft',
        earn: ['Matches (Sieg wie Niederlage)', 'Tagestraining', 'Liga-Wochenabschluss'],
        spend: ['Ausrüstung', 'Team-Anpassung'],
        balance: 'Niederlagen zahlen 60 % der Siegprämie – Dranbleiben lohnt.',
      },
      {
        name: 'Goldpfeifen',
        kind: 'Hard',
        earn: ['Turniere', 'Saisonabschluss'],
        spend: ['Legendäre Jubel-Animationen', 'Stadion-Themen'],
        balance: 'Nur Prestige-Sinks – Spielstärke bleibt unantastbar.',
      },
    ],
    items: [
      { name: 'Grip-Handschuhe', effect: 'Fangfenster +5 %', rarity: 'Gewöhnlich' },
      { name: 'Feder-Schläger', effect: 'Mehr Weite, kleineres Timing-Fenster', rarity: 'Selten' },
      { name: 'Profi-Bandagen', effect: 'Ausdauer regeneriert schneller', rarity: 'Gewöhnlich' },
      { name: 'Kurven-Ball', effect: 'Effet-Würfe möglich', rarity: 'Episch' },
      { name: 'Turbo-Sohlen', effect: 'Antritt +8 %, Kurven -5 %', rarity: 'Selten' },
      { name: 'Kapitänsbinde „Funke"', effect: 'Team-Jubel lädt schneller', rarity: 'Legendär' },
    ],
    enemyFraming: 'rivals',
    enemies: [
      { name: 'Die Blitzfüchse', role: 'Tempo-Team', behavior: 'Schnelle Pässe, schwach in der Defensive' },
      { name: 'Eisenwand Athletik', role: 'Defensiv-Team', behavior: 'Lässt wenig zu, kontert selten' },
      { name: 'Trickser-Trupp', role: 'Finten-Team', behavior: 'Täuscht Würfe an, bestraft Ungeduld' },
      { name: 'Die Ausdauernden', role: 'Konditions-Team', behavior: 'Wird in der Schlussphase stärker' },
      { name: 'Neon-Nashörner', role: 'Kraft-Team', behavior: 'Harte Würfe, langsame Antritte' },
      { name: 'Allstars der Liga', role: 'Boss-Team', behavior: 'Saisonfinale: kombiniert alle Stärken' },
    ],
    quests: [
      { name: 'Hattrick', goal: '3 Treffer in Folge in einem Match', reward: '30 Trainingspunkte' },
      { name: 'Uhrwerk', goal: '10 perfekte Timings in einem Match', reward: 'Profi-Bandagen' },
      { name: 'Zu Null', goal: 'Sieg ohne Gegentreffer', reward: '50 Trainingspunkte' },
      { name: 'Ligareise', goal: '5 Ligamatches in einer Woche', reward: 'Wochen-Bonus' },
      { name: 'Stilnote', goal: 'Einen Effet-Treffer landen', reward: 'Jubel „Regenbogen"' },
    ],
    balancing: [
      { parameter: 'Match-Dauer', start: '3 Min', note: 'Verlängerung: Golden Goal, max. 60 s' },
      { parameter: 'Timing-Fenster', start: '150 ms (perfekt: 60 ms)', note: 'Der zentrale Skill-Hebel' },
      { parameter: 'Liga-Punkte', start: '+20 Sieg / -15 Niederlage', note: 'Untere Ligen: -10' },
      { parameter: 'Ausrüstungs-Wirkung', start: 'max. ±10 %', note: 'Seitwärts statt aufwärts' },
      { parameter: 'Gummiband', start: 'nur Liga Holz/Bronze', note: 'Ab Silber: ehrliche Duelle' },
      { parameter: 'Matchmaking-Wartezeit (Ziel)', start: '< 10 s', note: 'Bot-Fallback mit Kennzeichnung' },
    ],
    levelDesignNotes: [
      'Feste Übersichtskamera pro Arena – Lesbarkeit vor Kino.',
      'Klare Feldmarkierungen und Farbcodes für Zonen.',
      'Zuschauer-Reaktionen als Feedback-Verstärker (Ahhs bei Beinahe-Treffern).',
      'Arenen unterscheiden sich in einer Regel-Nuance (Bande, Windzone, schräges Dach).',
    ],
    retentionHooks: ['Liga-Woche', 'Tagestraining', 'Highlight-Replays'],
    eventIdeas: [
      { name: 'Pokalwochenende', concept: 'K.-o.-Turnier mit Goldpfeifen für die Top 16.' },
      { name: 'Sonderregel-Matches', concept: 'Riesenball, Doppelpunkte-Zonen oder Nebelhalle.' },
      { name: 'Saisonfinale', concept: 'Allstars-Herausforderung plus Abschluss-Zeremonie.' },
    ],
    multiplayerAngle:
      '1v1 und 2v2 mit serverseitiger Physik; Quickmatch unter 10 Sekunden angestrebt, private Matches für Freundesgruppen.',
    touchControls:
      'Timing-Taps und Richtungs-Wischer, Ziel-Hilfslinie zuschaltbar, haptisches Feedback bei perfektem Timing; Querformat mit beidhändiger Daumenzone.',
  },
};
