# Empire Game Forge AI im Browser starten (Mac)

Diese Anleitung ist für **jeden Mac** (Intel **und** Apple-Chip). Es gibt hier
keine „nicht unterstützt"- oder Absturz-Probleme wie bei der App-Version, weil
alles im Browser läuft.

Du brauchst nur **einmal** einen kleinen Helfer namens „Node.js" zu installieren
(ein ganz normales Mac-Installationsprogramm) — danach reicht ein Doppelklick.

---

## Schritt 1 – Node.js installieren (nur einmal)

1. Gehe auf **https://nodejs.org/de/download**
2. Klick auf die große Schaltfläche mit **„LTS"** (empfohlene Version)
3. Öffne die geladene `.pkg`-Datei und klick dich durch die Installation
   (Weiter → Weiter → Installieren). Das ist ein offizielles, signiertes
   Apple-Installationsprogramm — keine Sicherheitswarnung.

## Schritt 2 – Das Projekt herunterladen

1. Gehe zu **https://github.com/Seko420/pet**
2. Klick oben rechts auf den grünen Knopf **„Code"** → **„Download ZIP"**
3. Öffne die geladene ZIP im Ordner „Downloads" per Doppelklick
   (es entsteht ein Ordner namens `pet-...`)

## Schritt 3 – Starten

**Der einfachste, zuverlässigste Weg (funktioniert immer):**

1. Öffne das Programm **„Terminal"**
   (Tastenkombination **⌘ + Leertaste**, dann `Terminal` tippen, Enter)
2. Tippe ins Terminal-Fenster **`bash`** und danach **ein Leerzeichen**
3. Ziehe jetzt die Datei **`Start-Mac.command`** aus dem entpackten Ordner
   mit der Maus **direkt in das Terminal-Fenster** (der Pfad erscheint
   automatisch)
4. Drück **Enter**

Beim allerersten Mal richtet sich alles ein (ein paar Minuten). Danach:
- Der **Browser öffnet sich automatisch**.
- Es erscheint eine Anmeldung: **Benutzername `forge`**, das **Passwort steht
  im Terminal-Fenster** (dort, wo „Passwort:" steht) — einfach kopieren.

Fertig — jetzt kannst du loslegen! 🎮

> **Wichtig:** Das schwarze Terminal-Fenster **offen lassen**, solange du die
> App benutzt. Zum Beenden das Fenster schließen. Beim nächsten Mal einfach
> Schritt 3 wiederholen (dann geht es sofort, ohne Wartezeit).

---

## Häufige Fragen

**Muss ich das jedes Mal machen?**
Nein. Node.js und das Projekt bleiben installiert. Ab dem zweiten Mal nur noch
Schritt 3 — und es startet in Sekunden.

**Passwort vergessen/ändern?**
Steht in der Datei `~/.empire-game-forge/web-config.json` und lässt sich dort
ändern.

**Werden meine Projekte gespeichert?**
Ja, dauerhaft und lokal auf deinem Mac (unter `~/.empire-game-forge/`), inklusive
Backups. Nichts verlässt deinen Computer.

**Von einem anderen Gerät zugreifen / echte Internet-Adresse?**
Siehe `docs/WEB.md` (Abschnitt „Zugriff von anderen Geräten").
