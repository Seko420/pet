# Architektur — Empire Game Forge AI

## Entscheidung: Electron + React + TypeScript + SQLite

| Entscheidung | Begründung |
| --- | --- |
| **Electron** statt Tauri | Ein Sprach-Stack (TypeScript) für UI, Logik und Integrationen; `safeStorage` für OS-Verschlüsselung; ausgereiftes Packaging für Windows (electron-builder); native Module (SQLite) gut unterstützt. Tauri bleibt möglich, da die gesamte Domain-Logik UI-frei in `packages/*` liegt. |
| **electron-vite** | Ein Build für Main/Preload/Renderer, HMR im Dev-Modus, bündelt die Workspace-Pakete direkt aus den TS-Quellen. |
| **React + Tailwind** | Schnelle, konsistente Studio-UI; Design-Tokens in `tailwind.config.js` (ink/mist/forge). |
| **better-sqlite3** | Synchronen, robusten lokalen Speicher ohne Server; WAL-Modus; JSON-Dokumente + indizierte Spalten. |
| **npm workspaces Monorepo** | Domain-Logik (`packages/*`) ist reine, getestete TypeScript-Logik ohne Electron-Abhängigkeit → wiederverwendbar (CLI, Cloud, Tauri) und unit-testbar unter Node. |
| **Godot für Mobile** | Open Source, kleine Runtime, exzellent automatisierbar (headless), keine Lizenzkosten — richtig für generierte Projekte. Unity-Export bleibt als späterer Adapter denkbar. |

## Schichten

```
┌────────────────────────── Renderer (React) ──────────────────────────┐
│ Screens → lib/api.ts → window.egf (typisierte Bridge)                │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ IPC (invoke/handle + Events), Vertrag:
                               │ apps/desktop/src/shared/ipc.ts
┌──────────────────────────────┴───────────────────────────────────────┐
│ Main-Prozess: ipc/register.ts → services/* (Projekt, GDD, Tasks,     │
│ Scores, Roblox, Mobile, Agent, Git, Build, Files, Secrets, AI)       │
│   └── db/ (better-sqlite3, Migrationen)                              │
└──────┬────────────────┬───────────────────┬───────────────────────────┘
       │                │                   │
  @egf/core        @egf/roblox-kit     @egf/mobile-kit      @egf/ai-kit
  (Engines/Typen)  (Rojo/Luau/Cloud)   (Godot-Generator)    (Mock+Anthropic)
```

**Regeln:**

1. `packages/*` sind pure Logik: kein `fs`, kein Electron, HTTP nur über injizierbares `fetchFn`. Dateien werden als `ScaffoldFile[]` zurückgegeben; nur der Main-Prozess schreibt auf die Platte.
2. Der Renderer hat keinerlei Node-Zugriff (`contextIsolation: true`, `nodeIntegration: false`). Alles läuft über die in `ipc.ts` deklarierten Kanäle — der Compiler erzwingt Request-/Response-Typen auf beiden Seiten.
3. Jede KI-Funktion hat eine deterministische Offline-Basis (Heuristik-Engine). Der `AiProvider` (Mock ↔ Anthropic) verfeinert nur; Fehler fallen still auf die Heuristik zurück.
4. Secrets verlassen den Main-Prozess nie im Klartext; der Renderer sieht nur `SecretRef`-Metadaten.

## Datenmodell (SQLite)

JSON-Dokument-Muster: vollständige Domain-Objekte als JSON in `data`, plus wenige indizierte Spalten für Abfragen.

| Tabelle | Inhalt |
| --- | --- |
| `projects` | `GameProject` (inkl. eingebetteter Roblox-/Mobile-Config und Scores) |
| `ideas` | `GameIdea` aus dem Idea Lab |
| `gdds` | `GddDocument`, 1:1 zum Projekt, versioniert |
| `tasks` | `TaskItem`, eigene Zeilen für Board-Queries |
| `content_items` | `ContentItem` (Asset-/Content-Planung) |
| `analytics_plans` | `AnalyticsPlan`, 1:1 zum Projekt |
| `checklist_state` | erledigte Checklisten-Items (projekt × liste × item) |
| `secrets` | Metadaten + `safeStorage`-Ciphertext (BLOB) |
| `agent_messages` / `agent_runs` | Code-Agent-Chat und Plan/Apply-Läufe |
| `build_records` | Build-/Test-Historie fürs Dashboard |

Fremdschlüssel mit `ON DELETE CASCADE`; Migrationen über eine `migrations`-Tabelle.

## Determinismus & Tests

Alle Generatoren (Ideen, GDD, Aufgaben, Content, Analytics, Scaffolds) sind seeded (`createRng`/`seedFromString`) — gleicher Input ⇒ gleiche Ausgabe. Das macht Ergebnisse reproduzierbar („Regenerieren mit Seed") und die Engines mit Vitest exakt testbar. Tests laufen unter Node ohne Electron (`vitest.config.ts`), inklusive der Main-Services (DB in Temp-Verzeichnis, Fake-Cipher für Secrets).

## Erweiterbarkeit (bewusst vorbereitete Schnitte)

- **AiProvider**-Interface → weitere Anbieter/lokale Modelle andockbar.
- **OpenCloudClient**-Interface (Mock + echt) → weitere Open-Cloud-Endpunkte (DataStores, MessagingService) ergänzbar.
- **ScaffoldFile[]-Generatoren** → neue Engines (Unity-Exporter, weitere Godot-Templates) ohne Änderung der App-Schicht.
- **Checklisten/Scoring als Daten** → neue Regeln ohne UI-Arbeit.
- macOS/Linux: keine Windows-spezifischen Pfade im Code; electron-builder-Targets ergänzbar.
