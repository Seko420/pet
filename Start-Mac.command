#!/bin/bash
# Empire Game Forge AI - Web-Modus fuer macOS.
# Startet die App im Browser. Kein App-Store, keine Intel/Apple-Probleme.
cd "$(dirname "$0")" || exit 1

# Kein Electron-Binary noetig - der Web-Modus braucht es nicht.
export ELECTRON_SKIP_BINARY_DOWNLOAD=1

echo "=================================================="
echo "   Empire Game Forge AI  -  Web-Modus"
echo "=================================================="
echo ""

# 1) Node.js vorhanden?
if ! command -v node >/dev/null 2>&1; then
  echo "  Node.js ist noch nicht installiert."
  echo "  Es oeffnet sich jetzt die Download-Seite."
  echo "  Bitte die grosse gruene 'LTS'-Version laden, installieren,"
  echo "  danach diese Datei erneut starten."
  open "https://nodejs.org/de/download" 2>/dev/null
  echo ""
  read -n 1 -s -r -p "  [Beliebige Taste zum Schliessen druecken]"
  exit 1
fi

# 2) Beim ersten Mal: Abhaengigkeiten holen
if [ ! -d node_modules ]; then
  echo "  Erste Einrichtung laeuft - das dauert einige Minuten."
  echo "  (Nur beim allerersten Start. Bitte warten...)"
  echo ""
  if ! npm install --no-audit --no-fund; then
    echo ""
    echo "  Einrichtung fehlgeschlagen. Bitte Internetverbindung pruefen"
    echo "  und diese Datei erneut starten."
    read -n 1 -s -r -p "  [Beliebige Taste zum Schliessen druecken]"
    exit 1
  fi
fi

# 3) Browser automatisch oeffnen, sobald der Server antwortet
(
  for _ in $(seq 1 150); do
    if curl -s -o /dev/null "http://localhost:8321"; then
      open "http://localhost:8321"
      break
    fi
    sleep 2
  done
) &

echo ""
echo "  Server startet... der Browser oeffnet sich gleich automatisch."
echo "  Benutzername + Passwort erscheinen unten in diesem Fenster."
echo "  >> Dieses Fenster OFFEN LASSEN, solange du die App benutzt. <<"
echo ""
npm run web
