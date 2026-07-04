#!/bin/bash
# Empire Game Forge AI - Start fuer macOS (Doppelklick)
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "  Node.js ist noch nicht installiert."
  echo "  Es oeffnet sich jetzt nodejs.org - dort die LTS-Version laden,"
  echo "  installieren und diese Datei danach erneut oeffnen."
  echo ""
  open "https://nodejs.org"
  read -n 1 -s -r -p "  Beliebige Taste zum Beenden druecken..."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo ""
  echo "  Erste Einrichtung - das dauert einige Minuten, bitte warten..."
  echo ""
  npm install --no-audit --no-fund || {
    echo "  Installation fehlgeschlagen - Internetverbindung pruefen."
    read -n 1 -s -r -p "  Beliebige Taste zum Beenden druecken..."
    exit 1
  }
fi

echo ""
echo "  Starte Empire Game Forge AI ..."
echo "  Der Browser oeffnet sich gleich automatisch."
echo "  Benutzername und Passwort stehen unten in diesem Fenster."
echo "  Dieses Fenster OFFEN LASSEN, solange du die App benutzt."
echo ""
( sleep 25 && open "http://localhost:8321" ) &
npm run web
