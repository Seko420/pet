# Release-Build-Anleitung

So baust du aus dem Quellcode eine echte, installierbare Desktop-App.

## Voraussetzungen

- Node.js ≥ 20, npm ≥ 10
- Einmalig: `npm install` im Repo-Root (lädt auch das Electron-Binary)
- Windows-Builds baust du am einfachsten **auf Windows** (electron-builder kann
  zwar cross-kompilieren, aber Signierung/NSIS sind nativ am zuverlässigsten)

## Windows-Installer und portable EXE

```bash
npm run dist
```

Ergebnis in `apps/desktop/release/`:

| Datei | Was es ist |
| --- | --- |
| `EmpireGameForge-Setup-<version>.exe` | NSIS-Installer (wählbares Installationsverzeichnis, Startmenü-Eintrag, **saubere Deinstallation** über Windows-Apps) |
| `EmpireGameForge-Portable-<version>.exe` | Portable Version - einfach starten, keine Installation |

Linux: `npm run dist:linux` (AppImage). macOS: auf einem Mac `electron-builder --mac` (DMG).

## Versionsnummer erhöhen

1. `version` in `apps/desktop/package.json` anpassen (SemVer, z.B. `0.2.0`)
2. Eintrag in `CHANGELOG.md` ergänzen
3. Git-Tag setzen: `git tag v0.2.0 && git push --tags`
4. `npm run dist`

## App-Icon

Liegt unter `apps/desktop/build/icon.png` (512×512). Neu generieren oder durch
ein eigenes 512×512-PNG ersetzen: `node scripts/generate-icon.mjs`.
electron-builder erzeugt daraus automatisch die Windows-`.ico`-Varianten.

## Wo die App ihre Daten speichert

| Daten | Ort |
| --- | --- |
| Datenbank (Projekte, GDDs, Aufgaben, Secrets verschlüsselt) | `%APPDATA%/empire-game-forge-ai/empire-game-forge.sqlite` (Windows) bzw. Electron `userData` |
| Backups | `<userData>/backups/` |
| Logs | `<userData>/logs/main.log` |
| Generierte Spielprojekte (Rojo/Godot) | `Dokumente/EmpireGameForge/<projekt-slug>/` |

Bei der Deinstallation über den NSIS-Installer bleiben `userData` und die
Projektordner erhalten (bewusst - keine Datenvernichtung). Wer alles entfernen
will, löscht die beiden Ordner manuell.

## Auto-Updates (Vorbereitet, späterer Ausbau)

`publish: null` in `electron-builder.yml` deaktiviert Veröffentlichung.
Für Auto-Updates später: `electron-updater` einbauen, `publish` auf einen
GitHub-Release- oder S3-Provider stellen und die App signieren. Die
Architektur (versionierte DB-Migrationen, getrennte userData) ist darauf
vorbereitet - ein Update überschreibt nur die App, nie die Daten.

## Code-Signierung (empfohlen für Verteilung)

Unsignierte EXEs lösen SmartScreen-Warnungen aus. Für ernsthafte Verteilung:
Code-Signing-Zertifikat (OV/EV) besorgen und in electron-builder via
`win.certificateFile`/`certificateSubjectName` konfigurieren.
