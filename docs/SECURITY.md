# Sicherheits- und Compliance-Konzept

## Secrets (API-Keys)

- Speicherung ausschließlich verschlüsselt über Electron **`safeStorage`** (Windows DPAPI, macOS Keychain, Linux libsecret). Ciphertext liegt in SQLite; der Klartext existiert nur flüchtig im Main-Prozess-Speicher, wenn ein Service ihn braucht.
- Der Renderer erhält **nie** den Klartext — nur `SecretRef` (Name, Service, letzte 4 Zeichen, Datum). Es gibt keinen IPC-Kanal, der einen Klartext-Key zurückgibt.
- Keys erscheinen nie in Logs, Fehlermeldungen, generierten Dateien oder im Code. Die Roblox-Projektvalidierung sucht aktiv nach versehentlich hartkodierten Keys.
- Ist `safeStorage` nicht verfügbar (z. B. Linux ohne Keyring), verweigert die App das Speichern mit einer klaren Erklärung, statt unsicher zu speichern.

## Roblox

- **Nur offizielle Open-Cloud-APIs** (`apis.roblox.com`) mit `x-api-key`. Kein Cookie-Login (`.ROBLOSECURITY`), keine Browser-Automatisierung, keine inoffiziellen Endpunkte.
- Empfohlener Key-Scope: minimal (`universe-places:write`), auf ein Universe beschränkt — die App dokumentiert das an jeder relevanten Stelle.
- **Publishing-Gate:** Veröffentlichen erfordert (1) vollständige Konfiguration, (2) erfolgreiche Projektvalidierung, (3) erfolgreichen **Dry-Run**, (4) expliziten Bestätigungsdialog, in dem der Projektname eingetippt wird. Der Main-Prozess erzwingt diese Reihenfolge serverseitig der UI — die UI kann sie nicht umgehen.
- Publish-Historie (auch Dry-Runs) wird protokolliert.

## Electron-Härtung

- `contextIsolation: true`, `nodeIntegration: false`, schmale typisierte Preload-Bridge, nur whitelisted IPC-Kanäle.
- CSP im Renderer (`default-src 'self'`), Monaco lokal gebündelt (kein CDN), externe Links öffnen ausschließlich im System-Browser.
- Datei-Operationen (Editor, Code-Agent) sind auf den Projekt-Workspace beschränkt: `resolve()` + Präfix-Check, keine Symlink-Verfolgung, Größenlimits. `shell.openPath` nur für App-eigene Verzeichnisse.
- Kindprozesse (`git`, `rojo`, `godot`) laufen ohne Shell (`execFile`), mit festen Argumentlisten — keine String-Interpolation von Nutzereingaben in Kommandos.

## Code-Agent

- Ändert nie blind: Ziel → Plan → Liste betroffener Dateien → **explizite Freigabe** → Anwendung mit Undo-Snapshots → Zusammenfassung. Bei Fehlern während der Anwendung wird zurückgerollt.
- Schreibt nur innerhalb des Projekt-Workspaces und erzeugt keine Secrets.

## Fairness & Jugendschutz (in Scoring, GDD, Checklisten verankert)

- Keine Glücksspielmechaniken für Kinder; Lootbox-Ähnliches nie für Echtgeld bei Kinder-Zielgruppen und nur mit einsehbaren Wahrscheinlichkeiten.
- Keine manipulativen Dark Patterns (FOMO-Zwang, irreführende Timer, Streak-Bestrafung); Energy-Systeme nur fair (kein harter Paywall-Block).
- Ads bei Zielgruppe „Kinder" führen zu Score-Malus + Warnung; Datenschutz-Checkliste erzwingt COPPA/GDPR-K-Punkte.
- Keine fremden Marken, Figuren, Sounds oder Designs — Originalitätspflicht ist in Content-System und Checklisten verankert.

## Daten & Backups

- Alle Daten lokal (SQLite unter `userData`); kein Cloud-Zwang, keine Telemetrie.
- Release-Checkliste enthält Projekt-Backups als Pflichtpunkt; DB nutzt WAL für Crash-Sicherheit.
