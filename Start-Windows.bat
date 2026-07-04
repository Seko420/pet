@echo off
title Empire Game Forge AI
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js ist noch nicht installiert.
  echo  Bitte einmalig von https://nodejs.org die LTS-Version installieren,
  echo  dann diese Datei erneut doppelklicken.
  echo.
  start https://nodejs.org
  pause
  exit /b 1
)

if not exist node_modules (
  echo.
  echo  Erste Einrichtung - das dauert einige Minuten, bitte warten...
  echo.
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo  Installation fehlgeschlagen - Internetverbindung pruefen und erneut versuchen.
    pause
    exit /b 1
  )
)

echo.
echo  Starte Empire Game Forge AI ...
echo  Der Browser oeffnet sich gleich automatisch.
echo  Benutzername und Passwort stehen unten in diesem Fenster.
echo  Dieses Fenster OFFEN LASSEN, solange du die App benutzt.
echo.
start "" cmd /c "timeout /t 25 /nobreak >nul & start http://localhost:8321"
call npm run web
pause
