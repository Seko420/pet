# Changelog

Alle nennenswerten Änderungen an Empire Game Forge AI.

## [0.1.0] — Erste Version

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
