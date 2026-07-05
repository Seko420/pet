# Empire Game Forge AI

**Dein KI-gestütztes Desktop-Game-Studio für Mobile- und Roblox-Spiele.**

Empire Game Forge AI ist eine Desktop-App (Windows-first, macOS/Linux-fähig), mit der du Spiele wie ein professionelles Studio planst, generierst, bewertest, entwickelst und bis zur Veröffentlichung vorbereitest — mit Fokus auf **Roblox** (Luau/Rojo/Open Cloud) und **Mobile** (Godot, Android-first).

> Ehrlichkeitsprinzip: Die App verspricht keine Umsätze. Sie maximiert systematisch die *Chancen* auf hochwertige, marktfähige Spiele — durch Markt-Scoring, professionelle Workflows, faire Monetarisierung und saubere Technik.

---

## Kernfunktionen (MVP, jetzt enthalten)

| Modul | Was es kann |
| --- | --- |
| **Dashboard** | Alle Projekte mit Status, Genre, Plattform, Fortschritt, Roblox-Verbindung, letzten Builds/Tests und Qualitäts-Score |
| **Idea Lab** | Generiert vollständige Spielideen (Pitch, Core Loop, USP, Monetarisierung, Risiken, Erfolgs-/Scheiter-Analyse, verbesserte Variante) nach Genre, Plattform, Zielgruppe, Aufwand — deterministisch reproduzierbar per Seed |
| **GDD-Generator** | Erzeugt ein vollständiges Game Design Document mit 21 Sektionen (Core Loop bis Full-Release-Scope), genre- und plattformspezifisch, editierbar, als Markdown exportierbar |
| **Qualitäts-Scores** | 11 Dimensionen (Fun, Retention, Monetization, Viral, Feasibility, Roblox/Mobile-Fit, Tech-Risiko, Content-Skalierung, Multiplayer, LiveOps) + konkrete Verbesserungshebel |
| **Aufgabenboard** | Kanban mit generiertem Aufgabenplan (MVP → Beta → Release), Kategorien, Prioritäten, Schätzungen |
| **Code-Agent** | Projekt-Chat + Plan-Workflow: Ziel → Plan → betroffene Dateien → **deine Freigabe** → Anwendung → Zusammenfassung. Ändert nie blind. |
| **Datei-Browser & Editor** | Projektbaum + Monaco-Editor (offline), Luau/GDScript/JSON/Markdown |
| **Roblox-Modul** | Rojo-kompatibles Luau-Projekt generieren (DataStore mit Session-Lock, Economy, Shop, Quests, Leaderstats, Anti-Exploit, Server/Client-Trennung), Validierung, `rojo serve`-Live-Sync, Open-Cloud-Anbindung (Universe/Place ID, API-Key verschlüsselt), Dry-Run + bestätigtes Publishing |
| **Mobile-Modul** | Godot-4-Projekt generieren (Touch-Steuerung, genre-spezifische Templates, Save-System, Analytics-Hooks, faire Monetarisierungs-Stubs), Performance-Budgets, Android-Export-Anleitung |
| **Content-System** | Plant Charaktere, Items, Pets, Level, Quests, Bosse, Store-Assets — alles original, keine fremden IPs |
| **Analytics & LiveOps** | Event-Katalog (Tutorial, Retention, Monetarisierung, Abbruchstellen), 12-Wochen-LiveOps-Kalender, A/B-Test-Ideen, Balancing-Notizen |
| **Monetarisierungs-Simulator** | Szenarien mit Bandbreiten (pessimistisch/erwartet/optimistisch), Umsatzpfad-Breakdown, Plausibilitäts-Warnungen, Sensitivitäts-Hebel — ehrlich, ohne Umsatzversprechen |
| **Playtest-Feedback** | Sessions und Findings erfassen (Bug, Verwirrung, Frustration, Begeisterung…), wichtige Findings mit einem Klick in Board-Aufgaben umwandeln |
| **Checklisten** | Release, App-Store, Datenschutz, Roblox-Publishing, faire Monetarisierung — mit Pflicht-Gates |
| **Secrets** | API-Keys (Roblox Open Cloud, Anthropic) verschlüsselt via OS-`safeStorage`, nie im Klartext, nie im Code |

**KI-Anbindung (Provider-Schicht):** Alle Generatoren funktionieren offline über deterministische Engines (Templates + Heuristiken). Optional wählst du in den Einstellungen einen KI-Anbieter — **Anthropic (Claude)**, **OpenAI** oder eine **eigene OpenAI-kompatible API** (LM Studio/Ollama = **kostenlos & lokal**, siehe [docs/KI-SETUP.md](docs/KI-SETUP.md)) — inkl. **Verbindungstest**, Modell-/Temperatur-/Token-Einstellungen und Kostenhinweisen. Damit kommen dazu: **echte KI-Spielideen** (Idea Lab ✨), **GDD-Sektionen mit KI verbessern**, **KI-Qualitäts-Tiefenanalyse**, **KI-Aufgabenplanung**, der **Code-Agent** und der **Projekt-Chat mit Live-Streaming + Stopp-Knopf** (der Chat kennt GDD, Aufgaben und Scores deines Projekts). Ohne Key zeigt die App ehrlich den Mock-Modus an; neue Anbieter sind über das `AiProvider`-Interface in `packages/ai-kit` mit einer Factory anschließbar. Anfragen werden lokal nur als Metadaten protokolliert (nie Inhalte, nie Schlüssel).

### Funktionsstatus (ehrlich)

| Bereich | Status |
| --- | --- |
| Projekte, Ideen, GDD, Aufgaben, Content, Analytics, Checklisten, Scores, Simulator, Playtests | **Implementiert** (offline, deterministisch) |
| Roblox: Rojo/Luau-Scaffold, Validierung, rojo build/serve, Open-Cloud-Publishing mit Gates | **Implementiert** (Publishing braucht eigenen API-Key; rojo/Studio lokal installiert) |
| Mobile: Godot-Projektgenerator, Budgets, Export-Anleitung | **Implementiert** (Android-Export läuft über den Godot-Editor) |
| Secrets (safeStorage), Backups, Projekt-Export/-Import, Logs | **Implementiert** |
| KI-Features (Streaming-Chat mit Projektkontext, KI-Ideen, GDD-Verbesserung, Qualitäts-Tiefenanalyse, KI-Aufgabenplan, Agent-Pläne, Commit-Vorschläge, Verbindungstest) | **Implementiert mit Key/lokaler KI** / **Mock-Modus ohne Key** |
| Editierbare Prompt-Vorlagen im UI | **Vorbereitet** (Prompts zentral in `packages/ai-kit/src/prompts.ts`) |
| Automatisierte Android-Build-Pipeline, DataStore-Browser, Asset-Manager mit Vorschau | **Späterer Ausbau** (Roadmap, Adapter-Schnitte vorhanden) |
| Auto-Updates, Code-Signierung, Team-Features/Cloud-Sync | **Vorbereitet** (Architektur ausgelegt, siehe docs/RELEASE.md) |

---

## Setup

Voraussetzungen: **Node.js ≥ 20**, npm ≥ 10. (Windows, macOS oder Linux.)

```bash
# 1. Abhängigkeiten installieren (lädt auch das Electron-Binary)
npm install

# 2. Natives SQLite-Modul für Electron bauen (einmalig nach jedem install)
npm run rebuild

# 3. App im Dev-Modus starten
npm run dev
```

Weitere Kommandos:

```bash
npm run typecheck   # TypeScript über alle Workspaces
npm test            # Unit-Tests (Vitest) für alle Engines
npm run build       # Produktions-Bundle (electron-vite)
npm run dist        # Windows-Installer + portable EXE bauen (electron-builder)
```

**Installierbare App bauen:** `npm run dist` erzeugt in `apps/desktop/release/` einen NSIS-Installer (`EmpireGameForge-Setup-<version>.exe`, mit Deinstallation) und eine portable EXE. Details, Versionierung, Icon und Datenpfade: [docs/RELEASE.md](docs/RELEASE.md).

**Alternativ als private Web-App:** `npm run web` startet dieselbe App als passwortgeschützten Server (Standard: nur localhost) — gleiche UI, gleiche Funktionen, im Browser unter `http://localhost:8321`. Details und sichere Fernzugriff-Optionen: [docs/WEB.md](docs/WEB.md).

**Wo deine Daten liegen:** Datenbank + Backups + Logs unter dem Electron-`userData`-Ordner (Windows: `%APPDATA%/empire-game-forge-ai/`), generierte Spielprojekte unter `Dokumente/EmpireGameForge/`. Ein Update oder eine Neuinstallation überschreibt deine Daten nicht.

### Optionale Werkzeuge für die Spiel-Workflows

| Tool | Wofür | Installation |
| --- | --- | --- |
| [Rojo](https://rojo.space) | Roblox-Projekt bauen/syncen (`rojo build`, `rojo serve`) | via [Aftman](https://github.com/LPGhatguy/aftman); das generierte Projekt enthält eine `aftman.toml` |
| [Roblox Studio](https://create.roblox.com) | Place öffnen, testen, Assets pflegen | Roblox-Installer |
| [Godot 4](https://godotengine.org) | Mobile-Projekt öffnen, testen, exportieren | Download, keine Installation nötig |
| Git | Versionskontrolle der generierten Spielprojekte | systemweit |

Die App funktioniert auch ohne diese Tools — sie erklärt dann bei den jeweiligen Aktionen, was fehlt und wie du es installierst.

### Roblox verbinden (offizieller Open-Cloud-Workflow)

1. Erstelle auf [create.roblox.com](https://create.roblox.com/dashboard/credentials) einen **Open-Cloud-API-Key** mit minimalem Scope `universe-places:write`, beschränkt auf dein Universe.
2. Hinterlege den Key in **Einstellungen → API-Schlüssel** (Service: Roblox Open Cloud). Er wird mit OS-Verschlüsselung gespeichert.
3. Trage im Projekt unter **Roblox → Verbindung** deine Universe ID und Place ID ein und teste die Verbindung.
4. Veröffentlichen geht nur so: Projekt validieren → `rojo build` → **Dry-Run** → expliziter Bestätigungsdialog (Projektname eintippen).

Kein Cookie-Login, keine Account-Automatisierung — ausschließlich offizielle APIs.

---

## Projektstruktur

```
empire-game-forge/
├── apps/desktop/            # Electron-App
│   ├── src/main/            #   Main-Prozess: DB, Services, IPC, Secrets
│   ├── src/preload/         #   typisierte Bridge (contextIsolation)
│   ├── src/renderer/        #   React-UI (Screens, Design-System)
│   └── src/shared/ipc.ts    #   typisierter IPC-Vertrag (eine Quelle der Wahrheit)
├── packages/
│   ├── core/                # Domain-Typen + Engines: Ideen, GDD, Scoring,
│   │                        # Aufgaben, Content, Checklisten, Analytics
│   ├── ai-kit/              # KI-Provider (Mock + Anthropic), Prompt-Builder
│   ├── roblox-kit/          # Rojo/Luau-Scaffolding, Validierung, Open-Cloud-Client
│   └── mobile-kit/          # Godot-4-Scaffolding, Performance-Budgets
├── docs/                    # Architektur, Sicherheit, Roadmap
└── vitest.config.ts         # Tests für alle Engines
```

Generierte **Spielprojekte** liegen außerhalb des Repos unter `Dokumente/EmpireGameForge/<projekt-slug>/` (mit `roblox/`- und/oder `godot/`-Unterordner).

---

## Sicherheits- & Fairness-Grundsätze

- API-Keys: verschlüsselt via Electron `safeStorage` (DPAPI/Keychain/libsecret), nie im Klartext gespeichert, geloggt oder angezeigt.
- Kein Roblox-Cookie-Login, keine inoffizielle Automatisierung.
- Veröffentlichungen: erst Validierung + Dry-Run, dann expliziter Bestätigungsdialog.
- Renderer ohne Node-Zugriff (`contextIsolation`, CSP, whitelisted IPC).
- Dateizugriffe des Agenten und des Editors sind auf den Projekt-Workspace begrenzt (Path-Traversal-Schutz).
- Faire Monetarisierung: keine Glücksspielmechaniken für Kinder, keine erzwungenen Dark Patterns — die Checklisten und der GDD-Generator setzen das durch.
- Alle generierten Inhalte sind Originale — keine fremden Marken, Figuren oder Sounds.

Details: [docs/SECURITY.md](docs/SECURITY.md) · Architektur: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · Roadmap: [docs/ROADMAP.md](docs/ROADMAP.md)
