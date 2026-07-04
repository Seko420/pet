# Roadmap

## v0.1 — MVP (dieser Stand)

Desktop-Grundgerüst, Dashboard, Projektverwaltung + Wizard, SQLite-Persistenz,
Idea Lab, GDD-Generator (21 Sektionen), Qualitäts-/Marktpotenzial-Scores mit
Verbesserungshebeln, Aufgabenboard, Content-Planer, Analytics-/LiveOps-Planer,
Checklisten mit Pflicht-Gates, Code-Agent (Plan→Freigabe→Apply), Datei-Browser
mit Monaco, Roblox-Modul (Luau/Rojo-Scaffold, Validierung, Open-Cloud-Adapter,
Dry-Run + bestätigtes Publishing), Mobile-Modul (Godot-Scaffold, Budgets,
Export-Anleitung), Secrets via safeStorage, Git-Integration (Status/Init/
Commit-Vorschläge), Build-Konsole (rojo/godot).

## v0.2 — Roblox-Tiefe

- [ ] Rojo `serve`-Integration mit Live-Status im UI
- [ ] Open Cloud: DataStore-Browser (lesen/debuggen), MessagingService-Trigger
- [ ] Luau-Statikanalyse (luau-lsp/selene als optionale Tools)
- [ ] Game-Pass-/Developer-Product-Katalogverwaltung im Projekt
- [ ] Mehr Genre-Scaffolds (Battle Arena Matchmaking, Obby-Checkpoint-System)

## v0.3 — Mobile-Tiefe

- [ ] Godot-Headless-Testlauf aus der App (Szenen-Smoketest)
- [ ] Android-Build-Pipeline (Gradle-Template, Debug-APK aus der App)
- [ ] iOS-Export-Vorbereitung (Dokumentation + Presets)
- [ ] Asset-Manager (Import, Vorschau, Zuordnung zu Content-Items)
- [ ] Store-Listing-Generator (Texte, Screenshot-Checkliste)

## v0.4 — Studio-Intelligenz

- [ ] Test-Agent (generiert und bewertet Testpläne, führt Checks aus)
- [ ] Playtest-Feedback-System (Sessions erfassen, Findings → Aufgaben)
- [ ] Monetarisierungs-Simulator (Szenarien: ARPDAU/Conversion-Annahmen, Sensitivität)
- [ ] Analytics-Event-Designer (eigene Events + Export als Implementierungs-Spec)
- [ ] LiveOps-Kalender mit konkreten Terminen + Erinnerungen

## v0.5 — Skalierung

- [ ] Vorlagen-Marketplace (Projekt-/Scaffold-Templates teilen)
- [ ] Team-Kollaboration (Projekt-Export/-Import, später Sync)
- [ ] Optionaler Cloud-Sync (Ende-zu-Ende-verschlüsselt)
- [ ] macOS/Linux-Builds offiziell
- [ ] Weitere KI-Provider + lokale Modelle über das AiProvider-Interface
