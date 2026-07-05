# KI einrichten — bezahlt (Cloud) oder komplett kostenlos (lokal)

Die App funktioniert **auch ohne KI** (Mock-Modus: alle Generatoren laufen über
eingebaute Engines). Mit einer verbundenen KI kommen dazu: **echte KI-Spielideen,
GDD-Verbesserung, KI-Qualitätsanalyse, KI-Aufgabenplanung, der Code-Agent und
der Projekt-Chat mit Live-Streaming.**

Alle Schlüssel werden **verschlüsselt lokal** gespeichert und nie angezeigt,
geloggt oder hochgeladen. Das Anfrage-Protokoll (Einstellungen-Datenbank,
Tabelle `ai_request_log`) speichert nur Metadaten — nie Inhalte, nie Schlüssel.

---

## Variante A: Komplett kostenlos — lokale KI (LM Studio) 🆓

Läuft auf deinem eigenen Rechner. Keine Anmeldung, keine Kosten, Daten bleiben
bei dir. Dafür langsamer und etwas schwächer als die großen Cloud-Modelle.

1. **LM Studio installieren:** [lmstudio.ai](https://lmstudio.ai) → Download
   für dein System → installieren → öffnen
2. **Modell laden:** In LM Studio auf die Lupe (Discover) → z. B.
   „**Llama 3.2 3B Instruct**" (klein & schnell) oder „**Qwen 2.5 7B Instruct**"
   (besser, braucht mehr RAM) → Download
3. **Server starten:** In LM Studio links auf das Symbol **„Developer"/„Local
   Server"** → Modell auswählen → **„Start Server"** (läuft auf Port `1234`)
4. **In Empire Game Forge verbinden** (Einstellungen → KI-Anbindung):
   - Anbieter: **„Eigene API"**
   - Basis-URL: `http://localhost:1234/v1`
   - Modell: den Namen aus LM Studio eintragen (steht oben im Server-Tab)
   - Unter **„API-Schlüssel"** einen Eintrag anlegen: Dienst „Eigene KI-API
     (OpenAI-kompatibel)", Wert beliebig, z. B. `lokal`
5. **„Verbindung testen"** klicken → grünes OK → fertig!

### Alternative: Ollama

1. [ollama.com](https://ollama.com) → installieren
2. Terminal: `ollama pull llama3.2` (lädt das Modell)
3. In der App: Anbieter „Eigene API", Basis-URL `http://localhost:11434/v1`,
   Modell `llama3.2`, Schlüssel beliebig (z. B. `lokal`)

> 💡 LM Studio muss (mit gestartetem Server) laufen, solange du KI-Funktionen
> nutzt. Die App merkt es sofort, wenn der Server aus ist, und sagt es dir.

---

## Variante B: Cloud-KI (beste Qualität, kostet wenige Cent pro Anfrage) ☁️

### Anthropic (Claude) — von den Machern dieses Projekts empfohlen

1. [console.anthropic.com](https://console.anthropic.com) → Konto erstellen
2. **API Keys** → **Create Key** → Schlüssel kopieren (beginnt mit `sk-ant-…`)
3. Unter **Billing** ein kleines Guthaben hinterlegen (5 $ reichen lange)
4. In der App: Einstellungen → „API-Schlüssel" → Dienst „Anthropic API Key",
   Schlüssel einfügen → Speichern → Anbieter „Anthropic (Claude)" wählen →
   „Verbindung testen"

### OpenAI

Wie oben, nur auf [platform.openai.com](https://platform.openai.com)
(Schlüssel beginnt mit `sk-…`), Dienst „OpenAI API Key", Anbieter „OpenAI".

### Kosten im Griff behalten

- **„Max. Tokens"** in den Einstellungen begrenzt die Kosten **pro Anfrage**
  (Standard 4096 ≈ wenige Cent bei Sonnet/GPT-4o)
- Jede teurere Aktion (KI-Ideen, GDD-Verbesserung, Analyse, Aufgabenplan)
  fragt vorher nach
- Ausgabenlimits kannst du zusätzlich direkt beim Anbieter setzen

---

## Was passiert ohne Schlüssel?

Nichts Schlimmes: Die App startet und funktioniert vollständig, alle
Generatoren nutzen die eingebauten Offline-Engines, und der Chat sagt dir
ehrlich, dass er im Mock-Modus ist. KI-exklusive Knöpfe erklären, was fehlt —
es gibt keine stillen Fehlschläge und keine Fantasie-Antworten.
