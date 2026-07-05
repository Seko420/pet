# Changelog

Alle nennenswerten Änderungen an Empire Game Forge AI.

## [0.1.0] — Erste Version

### Echte KI-Integration
- Live-Streaming im Projekt-Chat (Text erscheint während des Schreibens) mit Stopp-Knopf, in Desktop- UND Web-Modus (SSE); Chat kennt jetzt GDD-Überblick, Aufgabenstand und Scores des Projekts
- „Verbindung testen" für die KI (echter Mini-Request), Modell-, Temperatur- und Max-Tokens-Einstellungen, Kosten- und Kostenlos-Hinweise
- Echte KI-Spielideen im Idea Lab (✨-Schalter), KI-Verbesserung einzelner GDD-Sektionen, KI-Qualitäts-Tiefenanalyse (Stärken/Schwächen/erste Minute/Risiken, persistiert), KI-Aufgabenplanung mit Validierung
- „Als Aufgabe speichern" für Chat-Antworten; klare deutsche Fehlermeldungen statt stiller Fehlschläge im Mock-Modus
- Anfrage-Protokoll nur mit Metadaten (nie Inhalte/Schlüssel, Tabelle ai_request_log); DB-Migration v4
- Kostenlose lokale KI dokumentiert und unterstützt (LM Studio/Ollama, docs/KI-SETUP.md); kurze Platzhalter-Schlüssel für lokale Endpunkte erlaubt

### Web-Modus (private Browser-Variante)
- Gleiche App als passwortgeschützter Server (`npm run web`): identische UI und Funktionen im Browser, HTTP-Bridge + Server-Sent Events statt Electron-IPC
- Kanal-Dispatcher (`ipc/handlers.ts`) Electron-frei extrahiert — Desktop und Web teilen sich exakt denselben typisierten Vertrag (Funktionsparität zur Compile-Zeit)
- Zugriffsschutz: HTTP Basic Auth (timing-sicher), Standard-Bind nur `127.0.0.1`, CSRF-Schutz, generiertes Passwort in `~/.empire-game-forge/web-config.json`
- Secrets im Web-Modus über AES-256-GCM-Schlüsseldatei; Export/Import über Browser-Download/-Upload; Anleitung inkl. HTTPS/VPN-Setup in `docs/WEB.md`

### Produktreife & Eigenständigkeit
- Flexible KI-Provider-Schicht mit Anbieter-Auswahl in den Einstellungen: Automatisch / Anthropic / OpenAI / eigene OpenAI-kompatible API (LM Studio, Ollama, OpenRouter…) / Mock — App bleibt ohne Key voll nutzbar
- Backup-System: konsistente Datenbank-Snapshots (Online-Backup-API), Verwaltung + Ein-Klick-Wiederherstellung mit App-Neustart, automatische Aufbewahrung der letzten 20
- Projekt-Export/-Import als `.egf.json`-Paket (GDD, Aufgaben, Content, Analytics, Checklisten-Stand, Playtests) mit ID-Remapping; API-Key-Referenzen und lokale Pfade wandern bewusst nicht mit
- App-Icon (generiert via `scripts/generate-icon.mjs`), Windows-Build als NSIS-Installer **und** portable EXE
- Datei-Logging (`<userData>/logs/main.log`, rotierend) für alle IPC-Fehler und Kernereignisse
- Release-Anleitung (`docs/RELEASE.md`): Build, Versionierung, Datenpfade, Deinstallation, Auto-Update-Vorbereitung, Signierung

### Studio-Kern
- Desktop-App-Grundgerüst (Electron + electron-vite + React + TypeScript + Tailwind, npm-Workspaces-Monorepo)
- Dashboard mit Projektkarten: Status, Genre, Plattform, Monetarisierung, Fortschritt, Roblox-Verbindung, letzte Builds/Tests, Marktpotenzial-Score
- Projekt-Wizard (3 Schritte), erzeugt automatisch Aufgabenplan, GDD, Scores, Analytics- und Content-Plan
- Lokale SQLite-Persistenz (WAL, Migrationen, kaskadierendes Löschen)

### Generatoren & Intelligenz
- Idea Lab: deterministischer Ideen-Generator (40 Genre-Archetypen, 23 Original-Themen, Seed-reproduzierbar) mit vollständigen Ideen inkl. verbesserter Variante
- GDD-Generator: 21 Sektionen, genre-/plattformspezifisch, editierbar, versioniert, Markdown-Export
- Qualitäts- & Marktpotenzial-System: 11 Dimensionen mit Begründungen + priorisierte Verbesserungshebel
- Aufgaben-Generator (MVP → Beta → Release), Content-Planer, Analytics-Event-Katalog, 12-Wochen-LiveOps-Kalender, A/B-Test-Ideen, Balancing-Notizen
- Monetarisierungs-Simulator: Szenarien mit Bandbreiten (pessimistisch/erwartet/optimistisch), Umsatzpfad-Breakdown, Plausibilitäts-Warnungen, Sensitivitäts-Hebel
- Playtest-Feedback-System: Sessions + Findings erfassen, Findings mit einem Klick in Board-Aufgaben umwandeln

### Roblox
- Rojo-kompatibler Luau-Projektgenerator: DataStore mit Session-Lock und Retries, Economy-/Shop-/Quest-Services, Leaderstats, Anti-Exploit (Rate-Limiter, Validierung, Bewegungs-Checks), zentrale Remote-Registry, Client-Controller mit Touch-Support, genre-abhängiges Tuning
- Statische Projekt-Validierung (hartkodierte Keys, loadstring, HTTP im Client, fehlende Struktur)
- Open-Cloud-Integration: Verbindungstest, Place-Publishing (offizielle API), erzwungener Gate: Validierung → Rojo-Build → Dry-Run → getippte Bestätigung
- Rojo Build/Sourcemap/Serve aus der App mit Live-Build-Konsole

### Mobile
- Godot-4-Projektgenerator: 3 Gameplay-Templates (Runner, Idle/Tycoon, Puzzle), Touch-Steuerung, Save-System mit Schema-Version, Analytics-Hooks, ehrliche Monetarisierungs-Stubs
- Performance-Budgets pro Genre (editierbar), Android-Export-Anleitung, export_presets-Vorlage

### Werkzeuge & Sicherheit
- Code-Agent: Chat pro Projekt + Plan-Workflow (Ziel → Plan → Freigabe → Anwendung mit Rollback)
- Datei-Browser mit Monaco-Editor (offline gebündelt), Workspace-begrenzt
- Git-Integration (Status, Init, Commit-Vorschläge, Commit)
- Secrets via Electron safeStorage (OS-Verschlüsselung), nie im Klartext
- Checklisten mit Pflicht-Gates: Release, App-Store, Datenschutz (COPPA bei Kinder-Zielgruppe), Roblox-Publishing, faire Monetarisierung
- KI-Schicht: Mock-Modus offline + optionaler Anthropic-Provider (Ideen-Verfeinerung, Agent-Pläne, Commit-Vorschläge)
