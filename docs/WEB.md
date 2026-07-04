# Web-Modus — Empire Game Forge AI im Browser

Dieselbe App, dieselben Funktionen, dieselbe Oberfläche — aber statt als
Desktop-App läuft sie als **privater, passwortgeschützter Server**, den du im
Browser öffnest. Ideal, wenn du nichts installieren oder von mehreren Geräten
zugreifen willst.

## Starten (lokal)

```bash
npm install          # einmalig (Repo-Root)
npm run web          # baut die UI und startet den Server
```

Danach im Browser: **http://localhost:8321** — Benutzer `forge`, das Passwort
wurde beim ersten Start generiert und steht in
`~/.empire-game-forge/web-config.json` (dort auch änderbar).
Nur UI neu starten ohne Rebuild: `npm run web:start`.

## Konfiguration

| Umgebungsvariable | Bedeutung | Standard |
| --- | --- | --- |
| `EGF_WEB_PASSWORD` | Zugangspasswort (überschreibt Config-Datei) | generiert |
| `EGF_WEB_PORT` | Port | `8321` |
| `EGF_WEB_HOST` | Bind-Adresse | `127.0.0.1` (nur dieser Rechner) |
| `EGF_DATA_DIR` | Daten-Verzeichnis (DB, Backups, Logs, Key) | `~/.empire-game-forge` |

## Zugriff von anderen Geräten / eigener Server

1. `EGF_WEB_HOST=0.0.0.0` setzen (oder in `web-config.json` ändern) und ein
   **starkes Passwort** via `EGF_WEB_PASSWORD` vergeben.
2. **Niemals ohne HTTPS ins Internet stellen.** Standard-Setup: ein
   Reverse-Proxy (Caddy oder nginx + Let's Encrypt) vor dem Server -
   Caddy-Beispiel:
   ```
   forge.meine-domain.de {
       reverse_proxy 127.0.0.1:8321
   }
   ```
3. Alternativ privat ohne öffentliche Domain: VPN (WireGuard/Tailscale) und
   der Server bleibt auf der privaten Adresse.

## Was ist im Web-Modus anders?

| Bereich | Verhalten |
| --- | --- |
| Alle Generatoren, Projekte, GDD, Aufgaben, Scores, Simulator, Playtests, Checklisten, Analytics | **identisch** - gleiche Engines, gleiche Datenbank-Logik |
| Projekt-Export/-Import | über Browser-**Download/Upload** statt Datei-Dialogen |
| Datei-Browser, Roblox-/Godot-Scaffolds, Builds (rojo/godot), Git | laufen **auf dem Server-Rechner** (Workspace unter `Dokumente/EmpireGameForge` bzw. `EGF_DATA_DIR`); rojo/godot/git müssen dort installiert sein |
| „Im Dateimanager öffnen" | entfällt (die UI zeigt stattdessen den Server-Pfad) |
| Secrets | AES-256-GCM mit Schlüsseldatei `web-secret.key` im Datenverzeichnis statt OS-Keychain. **Ehrlicher Hinweis:** Wer Vollzugriff auf den Server-Benutzer hat, kann Schlüssel + Datenbank lesen - deshalb Passwort + HTTPS/VPN Pflicht, Server-Rechner absichern |
| Backup-Wiederherstellung | ersetzt die Datenbank und beendet den Server - danach einmal neu starten |

## Sicherheit (eingebaut)

- HTTP Basic Auth mit timing-sicherem Vergleich, alles hinter Login (auch die UI)
- Standard-Bind nur auf `127.0.0.1` - ohne bewusste Entscheidung ist nichts von außen erreichbar
- CSRF-Schutz über Pflicht-Header (kein CORS erlaubt)
- Desktop- und Web-Modus teilen sich denselben typisierten Kanal-Vertrag - Funktionsparität ist eine Compile-Zeit-Eigenschaft (`ipc/handlers.ts`)
