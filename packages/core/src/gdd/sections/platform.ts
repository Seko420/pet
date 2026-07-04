import type { MobilePerformanceBudget } from '../../types/project';
import type { GddContext } from '../context';
import { blocks, bullets, mdTable } from '../markdown';

const DEFAULT_MOBILE_BUDGET: MobilePerformanceBudget = {
  targetFps: 60,
  maxMemoryMb: 400,
  maxApkSizeMb: 150,
  maxColdStartSeconds: 4,
  maxDrawCalls: 120,
};

/** Section: roblox_implementation (Roblox-Umsetzung). */
export function buildRobloxImplementation(ctx: GddContext): string {
  if (!ctx.isRoblox) {
    return 'Roblox ist für dieses Projekt **nicht Zielplattform** – dieser Abschnitt bleibt bewusst leer. Sollte die Plattform-Strategie später auf Roblox erweitert werden, wird diese Sektion neu generiert.';
  }

  const remotes = mdTable(
    ['Remote', 'Typ', 'Richtung', 'Zweck'],
    [
      ['RE_ActionRequest', 'RemoteEvent', 'Client → Server', 'Spielaktion anfragen (Server validiert und führt aus)'],
      ['RE_PurchaseRequest', 'RemoteEvent', 'Client → Server', 'Kauf mit Soft-Währung anfragen; Preis prüft NUR der Server'],
      ['RE_StateChanged', 'RemoteEvent', 'Server → Client', 'Relevante Zustandsänderungen an betroffene Clients pushen'],
      ['RE_Notification', 'RemoteEvent', 'Server → Client', 'Toasts/Belohnungs-Feedback anzeigen'],
      ['RF_GetProfile', 'RemoteFunction', 'Client → Server', 'Einmaliges Laden des eigenen Profils beim Join'],
    ],
  );

  return blocks(
    '### Services-Struktur',
    [
      '```',
      'ReplicatedStorage/',
      '  Shared/            -- gemeinsame Luau-Module (Konfiguration, Typen, Utils)',
      '  Remotes/           -- alle RemoteEvent/RemoteFunction-Instanzen an einem Ort',
      'ServerScriptService/',
      '  Server/            -- Services: DataService, EconomyService, ProgressionService, ...',
      'ServerStorage/',
      '  Assets/            -- nur serverseitig benötigte Vorlagen',
      'StarterPlayer/',
      '  StarterPlayerScripts/',
      '    Controllers/     -- Client-Controller: Input, UI, Effekte',
      '```',
    ].join('\n'),
    '### Server-Client-Trennung',
    bullets([
      'Der Server ist die einzige Wahrheit: Economy, Progression und Belohnungen werden ausschließlich serverseitig berechnet.',
      'Der Client sendet nur Absichten („ich möchte kaufen"), niemals Ergebnisse („ich habe jetzt 500 Münzen").',
      'Jede eingehende Remote-Anfrage wird serverseitig validiert (Typ, Wertebereich, Berechtigung) und pro Spieler ratenbegrenzt (Debounce/Throttle).',
      'Rein kosmetische Effekte laufen clientseitig für gefühlte Reaktionsfreude; der Server bestätigt asynchron.',
    ]),
    '### RemoteEvents & RemoteFunctions',
    remotes,
    'Namenskonvention: `RE_` für RemoteEvent, `RF_` für RemoteFunction. RemoteFunctions sparsam einsetzen (blockierend); wo möglich RemoteEvent mit Antwort-Event bevorzugen.',
    '### DataStores (Speicherung)',
    bullets([
      'Ein Profil-Dokument pro Spieler mit `schemaVersion`-Feld; Migrationen laufen beim Laden.',
      'Session-Locking: Ein Server besitzt das Profil exklusiv, bis es sauber freigegeben wird – verhindert Duplikations-Exploits.',
      '`UpdateAsync` statt `SetAsync` für alle Schreibzugriffe; Wiederholversuche mit exponentiellem Backoff bei Fehlern.',
      'Autosave alle 60–120 Sekunden plus Save bei PlayerRemoving und BindToClose.',
      'Käufe (Developer Products) werden idempotent über eine Kauf-Historie im Profil verbucht (ProcessReceipt darf mehrfach feuern).',
    ]),
    '### StreamingEnabled',
    bullets([
      'StreamingEnabled aktivieren und die Welt in streamingfreundliche Zonen gliedern.',
      'Serverskripte dürfen nie annehmen, dass Welt-Instanzen beim Client existieren – Zugriff über WaitForChild bzw. CollectionService-Tags.',
      'Spawn- und Kernbereiche als persistente Modelle markieren, damit die erste Sekunde nie ins Leere greift.',
    ]),
  );
}

/** Section: mobile_implementation (Mobile-Umsetzung). */
export function buildMobileImplementation(ctx: GddContext): string {
  if (!ctx.isMobile) {
    return 'Mobile ist für dieses Projekt **nicht Zielplattform** – dieser Abschnitt bleibt bewusst leer. Bei einer späteren Mobile-Erweiterung wird diese Sektion neu generiert.';
  }

  const { content, project } = ctx;
  const budget = project.mobile?.performanceBudget ?? DEFAULT_MOBILE_BUDGET;
  const orientation = project.mobile?.orientation ?? 'portrait';
  const orientationLabel =
    orientation === 'portrait'
      ? 'Portrait (einhändig spielbar)'
      : orientation === 'landscape'
        ? 'Landscape (beidhändige Daumenzonen)'
        : 'Sensor (beide Ausrichtungen, UI passt sich an)';

  const budgetTable = mdTable(
    ['Budget', 'Zielwert'],
    [
      ['Ziel-Framerate', `${budget.targetFps} FPS auf Mittelklasse-Geräten`],
      ['Speicher (RAM)', `max. ${budget.maxMemoryMb} MB`],
      ['App-Größe', `max. ${budget.maxApkSizeMb} MB`],
      ['Kaltstart', `max. ${budget.maxColdStartSeconds} s bis zur Interaktion`],
      ['Draw Calls', `max. ${budget.maxDrawCalls} pro Frame`],
    ],
  );

  return blocks(
    '### Touch-Steuerung',
    content.touchControls,
    bullets([
      'Alle Touchziele mindestens 44×44 pt; kritische Aktionen liegen in der Daumenzone.',
      'Gesten haben großzügige Eingabefenster und visuelles Touch-Feedback – Touch verzeiht weniger als Maus/Gamepad.',
      `Bildschirm-Ausrichtung: ${orientationLabel}.`,
    ]),
    '### Performance-Budget',
    budgetTable,
    'Das Budget wird auf einem echten Mittelklasse-Referenzgerät geprüft, nicht nur im Editor; Verstöße blockieren den Release.',
    '### Session-Länge & Unterbrechbarkeit',
    bullets([
      `Ziel-Session: ${content.sessionMinutes[0]}–${content.sessionMinutes[1]} Minuten – jede Runde ist an natürlichen Punkten unterbrechbar.`,
      'App-Wechsel und eingehende Anrufe pausieren sofort und verlustfrei (Auto-Save beim Verlassen des Vordergrunds).',
      'Kein Fortschrittsverlust durch Prozess-Kill: Wiedereinstieg setzt exakt am letzten sicheren Zustand auf.',
    ]),
    '### Offline-Fähigkeit',
    bullets([
      ctx.project.multiplayer
        ? 'Multiplayer-Anteile benötigen eine Verbindung; Solo-Anteile, Menüs und Sammlung funktionieren offline.'
        : 'Der Kern-Loop funktioniert vollständig offline; Online wird nur für optionale Features (Bestenlisten, Events) benötigt.',
      'Offline-Zeit wird fair verrechnet (kein Strafabzug); Sync-Konflikte löst der ältere Speicherstand nie stillschweigend.',
      'Kein Online-Zwang als Kopierschutz – Flugmodus ist ein legitimer Spielort (Pendeln!).',
    ]),
    '### Akku & Wärme',
    'Framerate-Deckel im Menü, reduzierte Partikel bei thermischem Throttling und ein optionaler Energiesparmodus (30 FPS) halten das Gerät kühl.',
  );
}

/** Section: technical_architecture (Technische Architektur). */
export function buildTechnicalArchitecture(ctx: GddContext): string {
  const parts: (string | null)[] = [];

  if (ctx.isRoblox) {
    parts.push(
      '### Roblox: Luau-Modul-Layout',
      [
        '```',
        'src/',
        '  shared/',
        '    Config/        -- Balancing-Tabellen als Luau-Module (datengetrieben)',
        '    Types.luau     -- gemeinsame Typdefinitionen (--!strict)',
        '    Util/          -- Signal, Zeit, Formatierung',
        '  server/',
        '    Services/      -- DataService, EconomyService, ProgressionService, QuestService',
        '    main.server.luau  -- Bootstrap: Services registrieren und starten',
        '  client/',
        '    Controllers/   -- InputController, UiController, EffectsController',
        '    main.client.luau  -- Bootstrap Client',
        '```',
      ].join('\n'),
      bullets([
        'Strikte Modulgrenzen: Services kommunizieren über definierte Schnittstellen, nie über globale Zustände.',
        '`--!strict` in allen Luau-Modulen; gemeinsame Typen leben in `shared/Types.luau`.',
        'Projekt-Sync über eine Rojo-Projektdatei – der Quellcode lebt versionierbar im Dateisystem.',
      ]),
    );
  }

  if (ctx.isMobile) {
    parts.push(
      '### Mobile: Godot-Projektstruktur',
      [
        '```',
        'res://',
        '  scenes/',
        '    Main.tscn        -- Einstieg: lädt Menü oder letzten Spielstand',
        '    game/            -- Gameplay-Szenen (eine Szene pro Zustand)',
        '    ui/              -- wiederverwendbare UI-Szenen (HUD, Dialoge, Shop)',
        '  autoload/          -- Singletons (Projekt-Einstellungen > Autoload)',
        '    GameState.gd     -- aktueller Spielzustand, Szenenwechsel',
        '    SaveService.gd   -- Speichern/Laden mit Versionierung',
        '    EventBus.gd      -- entkoppelte Signale zwischen Systemen',
        '    Analytics.gd     -- Tracking-Fassade (austauschbarer Anbieter)',
        '  data/              -- Balancing als Resource-/JSON-Dateien',
        '```',
      ].join('\n'),
      bullets([
        'Szenenbaum-Prinzip: Jede Spielansicht ist eine eigene Szene; Kommunikation nach oben über Signale, nach unten über Methoden.',
        'Save-System: JSON unter `user://` mit `schemaVersion`, atomarem Schreiben (Temp-Datei + Umbenennen) und einer rotierenden Backup-Datei.',
        'Autoloads bleiben schlank (Zustand + Fassaden) – Spiellogik gehört in Szenen und Ressourcen.',
      ]),
    );
  }

  parts.push(
    '### Plattformübergreifende Prinzipien',
    bullets([
      'Datengetriebenes Balancing: Alle Zahlen aus der Balancing-Sektion leben in Konfigurationsdateien, nicht im Code.',
      'Deterministische Generatoren: Zufallsinhalte laufen über seedbare RNGs – reproduzierbar für Tests und Fehlersuche.',
      'Klare Trennung von Simulation und Darstellung erleichtert Tests und spätere Plattform-Erweiterungen.',
      'Feature-Flags für LiveOps-Inhalte: Events lassen sich ohne neuen Build aktivieren und deaktivieren.',
    ]),
  );

  return blocks(...parts);
}
