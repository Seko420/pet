import type { GameProject } from '../types/project';
import type { TaskCategory, TaskItem, TaskPriority } from '../types/tasks';
import type { ContentCategory, ContentItem } from '../types/content';
import { createId, nowIso } from '../util/ids';
import { createRng, seedFromString } from '../util/random';

/**
 * Task & content planning. Deterministic per project id (except row ids and
 * timestamps). Templates are filtered by platform and lightly tuned by genre.
 */

interface TaskTemplate {
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  estimateHours: number;
  milestone: 'MVP' | 'Beta' | 'Release';
  /** undefined = all platforms */
  platforms?: ('roblox' | 'mobile')[];
  multiplayerOnly?: boolean;
}

const BASE_TASKS: TaskTemplate[] = [
  // ---- MVP: design & foundations
  { title: 'Core Loop auf Papier festnageln', description: 'Kernschleife in 4-6 Schritten definieren, jede Aktion mit Belohnung. Abnahme: Loop lässt sich in 2 Sätzen erklären.', category: 'design', priority: 'critical', estimateHours: 4, milestone: 'MVP' },
  { title: 'GDD-Review: MVP-Schnitt bestätigen', description: 'MVP-Scope-Sektion des GDD prüfen: alles streichen, was den Core Loop nicht trägt.', category: 'design', priority: 'high', estimateHours: 2, milestone: 'MVP' },
  { title: 'Erste-Minute-Flow entwerfen', description: 'Vom Spielstart bis zur ersten Belohnung in unter 60 Sekunden - Wireframe des Ablaufs inkl. Teach-on-demand-Tutorialschritten.', category: 'ui_ux', priority: 'critical', estimateHours: 4, milestone: 'MVP' },
  { title: 'Economy-Startwerte definieren', description: 'Währungen, Earn-/Spend-Raten und erste Preistabelle aus dem GDD in Konfigurationswerte überführen.', category: 'design', priority: 'high', estimateHours: 3, milestone: 'MVP' },
  { title: 'Kernschleife spielbar implementieren', description: 'Die eine Kernmechanik voll spielbar machen - Platzhalter-Grafik ist ausdrücklich erlaubt.', category: 'code', priority: 'critical', estimateHours: 24, milestone: 'MVP' },
  { title: 'Save/Load-System implementieren', description: 'Spielstand speichern und laden, inklusive Versionsfeld für spätere Migrationen. Abnahme: App-Neustart verliert keinen Fortschritt.', category: 'code', priority: 'critical', estimateHours: 8, milestone: 'MVP' },
  { title: 'Basis-HUD bauen', description: 'Währungsanzeige, Fortschritt, Hauptaktion - bedienbar, noch ohne Polish.', category: 'ui_ux', priority: 'high', estimateHours: 8, milestone: 'MVP' },
  { title: 'Platzhalter-Assetliste erstellen', description: 'Alle fürs MVP nötigen Assets im Content-Planer anlegen und mit Platzhaltern belegen.', category: 'art', priority: 'medium', estimateHours: 3, milestone: 'MVP' },
  { title: 'Analytics-Grundevents einbauen', description: 'tutorial_started/completed, session_length, first_win gemäß Analytics-Plan verdrahten.', category: 'analytics', priority: 'high', estimateHours: 4, milestone: 'MVP' },
  { title: 'MVP-Playtest mit 5 Personen', description: 'Beobachten (nicht helfen!), Abbruchstellen notieren, Findings als Aufgaben erfassen.', category: 'qa', priority: 'critical', estimateHours: 5, milestone: 'MVP' },
  // ---- Beta: content & systems
  { title: 'Progression über 7 Tage auslegen', description: 'Level-/Upgrade-Kurve so strecken, dass Tag 1, 3 und 7 je ein neues Ziel bieten.', category: 'design', priority: 'high', estimateHours: 6, milestone: 'Beta' },
  { title: 'Quest-/Zielsystem einbauen', description: 'Tagesziele + Sessionziele gemäß GDD, datengetrieben konfigurierbar.', category: 'code', priority: 'high', estimateHours: 12, milestone: 'Beta' },
  { title: 'Shop und Monetarisierung implementieren', description: 'Katalog, Kauf-Flow und Belohnungsauszahlung - streng nach Fairness-Checkliste.', category: 'monetization', priority: 'high', estimateHours: 10, milestone: 'Beta' },
  { title: 'Finale Assets produzieren', description: 'Platzhalter durch Original-Assets ersetzen (Stilvorgabe: Art-Style aus dem Projektsteckbrief).', category: 'art', priority: 'medium', estimateHours: 24, milestone: 'Beta' },
  { title: 'Sound & Musik einbinden', description: 'Kern-Feedback-Sounds (Belohnung, Fehler, Kauf) und ein Musik-Loop; Lautstärke-Optionen.', category: 'audio', priority: 'medium', estimateHours: 8, milestone: 'Beta' },
  { title: 'Onboarding-Funnel messen und tunen', description: 'Tutorial-Abschlussquote analysieren, größte Abbruchstelle beheben.', category: 'analytics', priority: 'high', estimateHours: 6, milestone: 'Beta' },
  { title: 'Balancing-Pass 1', description: 'Economy- und Schwierigkeitswerte gegen Playtest-Daten justieren; Änderungen im GDD dokumentieren.', category: 'design', priority: 'medium', estimateHours: 6, milestone: 'Beta' },
  { title: 'Beta-Test mit 20+ Spielern', description: 'Geschlossener Test, Feedback-Formular, Crash-/Bug-Sammlung.', category: 'qa', priority: 'high', estimateHours: 8, milestone: 'Beta' },
  // ---- Release
  { title: 'Performance-Pass', description: 'Ziel-Framerate auf schwächster Zielhardware verifizieren, größte Fresser beheben.', category: 'code', priority: 'high', estimateHours: 8, milestone: 'Release' },
  { title: 'Store-/Plattform-Assets finalisieren', description: 'Icon, Thumbnails/Screenshots, Kurzbeschreibung - originell und ohne fremde IP.', category: 'marketing', priority: 'high', estimateHours: 6, milestone: 'Release' },
  { title: 'Release-Checkliste vollständig abarbeiten', description: 'Alle Pflichtpunkte der Release-, Datenschutz- und Plattform-Checklisten schließen.', category: 'publishing', priority: 'critical', estimateHours: 4, milestone: 'Release' },
  { title: 'LiveOps-Kalender Woche 1-4 vorbereiten', description: 'Launch-Event, erste Wochenquests und ersten Content-Drop konkret einplanen.', category: 'liveops', priority: 'medium', estimateHours: 5, milestone: 'Release' },
  { title: 'Launch-Version taggen und Backup ziehen', description: 'Git-Tag, Projekt-Backup, Changelog-Eintrag.', category: 'infrastructure', priority: 'high', estimateHours: 2, milestone: 'Release' },
  // ---- Multiplayer only
  { title: 'Netzwerk-Grundgerüst absichern', description: 'Server-autoritative Logik, Validierung aller Remote-Aufrufe, Rate-Limits.', category: 'code', priority: 'critical', estimateHours: 12, milestone: 'MVP', multiplayerOnly: true },
  { title: 'Lasttest mit voller Serverbelegung', description: 'Maximale Spielerzahl simulieren, Sync-Probleme und Performance dokumentieren.', category: 'qa', priority: 'high', estimateHours: 6, milestone: 'Beta', multiplayerOnly: true },
];

const ROBLOX_TASKS: TaskTemplate[] = [
  { title: 'Rojo-Projekt generieren und in Studio verbinden', description: 'Roblox-Tab → Projekt generieren, dann rojo serve + Studio-Plugin; Ordnerstruktur im Explorer verifizieren.', category: 'infrastructure', priority: 'critical', estimateHours: 2, milestone: 'MVP', platforms: ['roblox'] },
  { title: 'DataStore-System testen', description: 'Speichern/Laden im Studio-Playtest UND im Live-Testplace prüfen; Session-Lock-Verhalten bei Doppel-Join testen.', category: 'qa', priority: 'critical', estimateHours: 4, milestone: 'MVP', platforms: ['roblox'] },
  { title: 'Anti-Exploit-Review', description: 'Alle RemoteEvents/Functions durchgehen: Typprüfung, Rate-Limit, Server-Autorität. Ergebnis dokumentieren.', category: 'code', priority: 'high', estimateHours: 5, milestone: 'Beta', platforms: ['roblox'] },
  { title: 'Game Passes & Developer Products anlegen', description: 'Produkte im Creator Dashboard anlegen, IDs in die Shop-Konfiguration eintragen, Testkäufe durchführen.', category: 'monetization', priority: 'high', estimateHours: 3, milestone: 'Beta', platforms: ['roblox'] },
  { title: 'Experience-Fragebogen & Altersfreigabe ausfüllen', description: 'Roblox-Fragebogen für die Altersempfehlung wahrheitsgemäß ausfüllen.', category: 'publishing', priority: 'critical', estimateHours: 1, milestone: 'Release', platforms: ['roblox'] },
  { title: 'Roblox-Icon und Thumbnails hochladen', description: '512x512-Icon + Thumbnails im Creator Dashboard; A/B-Varianten fürs erste Event vormerken.', category: 'marketing', priority: 'high', estimateHours: 3, milestone: 'Release', platforms: ['roblox'] },
  { title: 'Dry-Run-Publish über die App', description: 'Validierung + rojo build + Dry-Run im Roblox-Tab; erst danach echte Veröffentlichung freigeben.', category: 'publishing', priority: 'critical', estimateHours: 1, milestone: 'Release', platforms: ['roblox'] },
];

const MOBILE_TASKS: TaskTemplate[] = [
  { title: 'Godot-Projekt generieren und öffnen', description: 'Mobile-Tab → Projekt generieren, in Godot importieren, Hauptszene starten.', category: 'infrastructure', priority: 'critical', estimateHours: 2, milestone: 'MVP', platforms: ['mobile'] },
  { title: 'Touch-Steuerung auf echtem Gerät testen', description: 'Godot-Remote-Deploy auf ein Android-Gerät; Daumen-Erreichbarkeit und Treffgenauigkeit prüfen.', category: 'qa', priority: 'critical', estimateHours: 3, milestone: 'MVP', platforms: ['mobile'] },
  { title: 'Performance-Budget verifizieren', description: 'FPS, Speicher und Kaltstart auf schwachem Zielgerät gegen das Budget im Mobile-Tab messen.', category: 'code', priority: 'high', estimateHours: 4, milestone: 'Beta', platforms: ['mobile'] },
  { title: 'Android-Signing einrichten', description: 'Keystore erzeugen, sicher verwahren (NICHT ins Repo), Debug- und Release-Signing in Godot konfigurieren.', category: 'infrastructure', priority: 'high', estimateHours: 2, milestone: 'Beta', platforms: ['mobile'] },
  { title: 'Datenschutzerklärung erstellen', description: 'Gemäß Datenschutz-Checkliste; URL für den Play-Store-Eintrag bereitstellen.', category: 'publishing', priority: 'critical', estimateHours: 3, milestone: 'Release', platforms: ['mobile'] },
  { title: 'Play-Store-Eintrag vorbereiten', description: 'Titel, Beschreibung, Screenshots (Telefon + Tablet), Content-Rating-Fragebogen, Ads/IAP-Deklaration.', category: 'publishing', priority: 'high', estimateHours: 5, milestone: 'Release', platforms: ['mobile'] },
  { title: 'Release-AAB bauen und intern testen', description: 'AAB exportieren, per Internal Testing Track verteilen, auf 3 Geräteklassen testen.', category: 'qa', priority: 'high', estimateHours: 4, milestone: 'Release', platforms: ['mobile'] },
];

export function generateTaskPlan(project: GameProject): TaskItem[] {
  const wantsRoblox = project.platform === 'roblox' || project.platform === 'both';
  const wantsMobile = project.platform === 'mobile' || project.platform === 'both';

  const templates = [
    ...BASE_TASKS,
    ...(wantsRoblox ? ROBLOX_TASKS : []),
    ...(wantsMobile ? MOBILE_TASKS : []),
  ].filter((t) => !t.multiplayerOnly || project.multiplayer);

  const milestoneOrder = { MVP: 0, Beta: 1, Release: 2 } as const;
  templates.sort((a, b) => milestoneOrder[a.milestone] - milestoneOrder[b.milestone]);

  return templates.map((t, i) => ({
    id: createId('task'),
    projectId: project.id,
    title: t.title,
    description: t.description,
    status: 'todo',
    category: t.category,
    priority: t.priority,
    estimateHours: t.estimateHours,
    milestone: t.milestone,
    sortOrder: i,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }));
}

// ---------------------------------------------------------------------------
// Content plan
// ---------------------------------------------------------------------------

const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;

const NAME_POOLS: Record<string, string[]> = {
  character: ['Funke', 'Kapitän Bolt', 'Mira Mondstein', 'Rostiger Rex', 'Professorin Pixel', 'Juno', 'Der Kartograph', 'Wispa'],
  pet: ['Glimmerfuchs', 'Blubberkrabbe', 'Nachtfalter Nero', 'Steinwichtel', 'Funkendrache', 'Marmeladen-Schnecke', 'Frostkäuzchen', 'Kometenkalb'],
  item: ['Sprungfeder-Stiefel', 'Magnet-Handschuh', 'Taschen-Teleporter', 'Glückskompass', 'Turbokern', 'Schattenumhang', 'Baumeister-Hammer', 'Echo-Flöte'],
  weapon: ['Funkenwerfer', 'Bumerang-Klinge', 'Blitzschleuder', 'Nebelbogen', 'Donnerfaust'],
  world: ['Schwebende Gärten', 'Rosthafen', 'Kristallgrotte', 'Wolkenwerft', 'Vergessener Leuchtturm', 'Pilzwald von Milo'],
  enemy: ['Knirschkäfer', 'Schrott-Golem', 'Nebelschleicher', 'Stachelwicht', 'Rumpel-Wächter'],
  boss: ['Der Uhrwerk-Koloss', 'Königin der Dornenranken', 'Kapitän Finsterflut'],
  quest: ['Die verlorene Lieferung', 'Fünf Funken für Funke', 'Der stille Leuchtturm', 'Rettet die Glimmerfüchse', 'Das große Wettrennen'],
};

interface ContentTemplate {
  category: ContentCategory;
  count: [number, number];
  pool?: string;
  describe: (name: string) => string;
  rarity?: boolean;
}

export function generateContentPlan(project: GameProject): ContentItem[] {
  const rng = createRng(seedFromString(project.id + ':content'));
  const wantsRoblox = project.platform === 'roblox' || project.platform === 'both';
  const wantsMobile = project.platform === 'mobile' || project.platform === 'both';
  const collectFocused = ['simulator', 'tycoon', 'rpg_lite', 'card_battler', 'merge', 'idle'].includes(project.genre);

  const templates: ContentTemplate[] = [
    { category: 'character', count: [2, 3], pool: 'character', describe: (n) => `Original-Charakter „${n}" - Silhouette und Farbschema müssen auf Thumbnail-Größe erkennbar sein.` },
    { category: 'pet', count: collectFocused ? [4, 6] : [0, 2], pool: 'pet', describe: (n) => `Sammelbares Pet „${n}" mit Idle-Animation und Seltenheits-Effekt.`, rarity: true },
    { category: 'item', count: [4, 6], pool: 'item', describe: (n) => `Gameplay-Item „${n}" - Nutzen muss ohne Text verständlich sein.`, rarity: true },
    { category: 'world', count: [2, 3], pool: 'world', describe: (n) => `Spielwelt/Zone „${n}" mit eigener Farbstimmung und Landmark.` },
    { category: 'level', count: [3, 5], describe: (n) => `${n}: Layout-Skizze, Schwierigkeitsziel und Belohnung definieren.` },
    { category: 'quest', count: [3, 5], pool: 'quest', describe: (n) => `Quest „${n}" - Ziel, Schritte und Belohnung gemäß GDD-Questsektion.` },
    { category: 'enemy', count: project.genre === 'horror' || project.genre === 'survival' || project.genre === 'battle_arena' || project.genre === 'tower_defense' || project.genre === 'rpg_lite' || project.genre === 'roguelite' ? [3, 5] : [0, 2], pool: 'enemy', describe: (n) => `Gegnertyp „${n}" mit klar lesbarem Angriffsmuster.` },
    { category: 'boss', count: project.genre === 'rpg_lite' || project.genre === 'roguelite' || project.genre === 'survival' ? [1, 2] : [0, 1], pool: 'boss', describe: (n) => `Boss „${n}" - 3-Phasen-Kampf, teilbarer Sieg-Moment.` },
    { category: 'reward', count: [2, 3], describe: (n) => `${n}: Belohnungs-Feedback (VFX + Sound + UI-Moment).` },
    { category: 'sound', count: [3, 4], describe: (n) => `${n} - kurz, originell, ohne fremde Samples.` },
    { category: 'music', count: [1, 2], describe: (n) => `${n} - loopfähig, GEMA-frei/eigenproduziert.` },
    { category: 'ui_element', count: [2, 3], describe: (n) => `${n} gemäß UI-Sektion des GDD, Touch-Größen beachten.` },
    { category: 'icon', count: [1, 1], describe: () => 'App-/Experience-Icon 512x512 - auf 64px Lesbarkeit testen.' },
  ];
  if (wantsRoblox) {
    templates.push({ category: 'thumbnail', count: [2, 3], describe: (n) => `${n} für die Roblox-Detailseite - Charakter groß, wenig Text, A/B-Variante einplanen.` });
    if (project.monetization.includes('cosmetics') || project.monetization.includes('game_passes')) {
      templates.push({ category: 'skin', count: [3, 5], describe: (n) => `Cosmetic-Skin „${n}" - reiner Selbstausdruck, kein Gameplay-Vorteil.`, rarity: true, pool: 'item' });
    }
  }
  if (wantsMobile) {
    templates.push({ category: 'screenshot', count: [4, 5], describe: (n) => `${n} für den Play Store - erste zwei zeigen den Core Loop.` });
    templates.push({ category: 'store_image', count: [1, 1], describe: () => 'Feature-Grafik 1024x500 für den Play Store.' });
  }
  templates.push({ category: 'trailer_idea', count: [1, 1], describe: () => 'Trailer-Konzept 20-30s: Hook in Sekunde 1, Core Loop, Belohnungs-Moment, Call-to-Action.' });

  const genericNames: Record<string, string[]> = {
    level: ['Level 1 - Ankunft', 'Level 2 - Aufstieg', 'Level 3 - Wendepunkt', 'Level 4 - Sturm', 'Level 5 - Finale'],
    reward: ['Belohnung: Levelaufstieg', 'Belohnung: Questabschluss', 'Belohnung: Erster Sieg'],
    sound: ['SFX: Belohnung', 'SFX: Fehler/Schaden', 'SFX: Kauf bestätigt', 'SFX: Klick/Auswahl'],
    music: ['Musik: Hauptthema', 'Musik: Spannungs-Layer'],
    ui_element: ['HUD-Set', 'Shop-Panel', 'Quest-Tracker'],
    icon: ['App-Icon'],
    thumbnail: ['Thumbnail A - Action', 'Thumbnail B - Charaktere', 'Thumbnail C - Update-Teaser'],
    screenshot: ['Screenshot 1 - Core Loop', 'Screenshot 2 - Belohnung', 'Screenshot 3 - Progression', 'Screenshot 4 - Shop', 'Screenshot 5 - Event'],
    store_image: ['Play-Store-Feature-Grafik'],
    trailer_idea: ['Launch-Trailer'],
  };

  const items: ContentItem[] = [];
  for (const t of templates) {
    const [min, max] = t.count;
    const n = rng.int(min, max);
    if (n <= 0) continue;
    const pool = t.pool ? NAME_POOLS[t.pool] ?? [] : genericNames[t.category] ?? [];
    const names = pool.length >= n ? rng.pickMany(pool, n) : pool.slice();
    while (names.length < n) names.push(`${t.category} ${names.length + 1}`);
    for (let i = 0; i < n; i++) {
      const name = names[i] ?? `${t.category} ${i + 1}`;
      items.push({
        id: createId('cnt'),
        projectId: project.id,
        category: t.category,
        name,
        description: t.describe(name),
        rarity: t.rarity ? RARITIES[Math.min(rng.int(0, 4), rng.int(0, 4))] ?? 'common' : null,
        status: 'planned',
        notes: 'Original-Design - keine fremden Marken, Figuren oder Sounds verwenden.',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
    }
  }
  return items;
}
