import React, { useEffect, useState } from 'react';
import { Archive, KeyRound, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react';
import type { SecretRef, SecretService } from '@egf/core';
import { SECRET_SERVICE_LABELS } from '@egf/core';
import type { AiConfig, AiStatusInfo, AppInfo, BackupInfo } from '@shared/ipc';
import { api } from '../lib/api';
import { formatDate, formatDateTime } from '../lib/labels';
import { Badge, Card, ErrorNote, Field, SectionTitle, Spinner } from '../components/ui';
import { useConfirm } from '../components/ConfirmDialog';

const AI_PROVIDER_OPTIONS: { value: AiConfig['provider']; label: string; hint: string }[] = [
  { value: 'auto', label: 'Automatisch', hint: 'Nutzt den zuerst gefundenen KI-Key (Anthropic → OpenAI → Eigene API), sonst Mock' },
  { value: 'anthropic', label: 'Anthropic (Claude)', hint: 'Benötigt Anthropic API-Key' },
  { value: 'openai', label: 'OpenAI', hint: 'Benötigt OpenAI API-Key' },
  { value: 'custom_ai', label: 'Eigene API', hint: 'OpenAI-kompatibler Endpunkt (LM Studio, Ollama, OpenRouter…)' },
  { value: 'mock', label: 'Mock (offline)', hint: 'Nur eingebaute Heuristik-Engines, keine externen Aufrufe' },
];

export function Settings(): React.JSX.Element {
  const [ai, setAi] = useState<AiStatusInfo | null>(null);
  const confirmDialog = useConfirm();
  const [aiConfig, setAiConfig] = useState<AiConfig | null>(null);
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [secrets, setSecrets] = useState<SecretRef[] | null>(null);
  const [backups, setBackups] = useState<BackupInfo[] | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; model: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newService, setNewService] = useState<SecretService>('roblox_open_cloud');
  const [newValue, setNewValue] = useState('');
  const [saving, setSaving] = useState(false);

  const refresh = (): void => {
    api.invoke('ai:status', undefined).then(setAi).catch(() => setAi(null));
    api.invoke('ai:getConfig', undefined).then(setAiConfig).catch(() => setAiConfig(null));
    api.invoke('app:getInfo', undefined).then(setInfo).catch(() => setInfo(null));
    api.invoke('secrets:list', undefined).then(setSecrets).catch((err: Error) => setError(err.message));
    api.invoke('app:listBackups', undefined).then(setBackups).catch(() => setBackups([]));
  };
  useEffect(refresh, []);

  const saveAiConfig = async (patch: Partial<AiConfig>): Promise<void> => {
    if (!aiConfig) return;
    try {
      const next = await api.invoke('ai:setConfig', { ...aiConfig, ...patch });
      setAiConfig(next);
      setTestResult(null);
      api.invoke('ai:status', undefined).then(setAi).catch(() => undefined);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const testAiConnection = async (): Promise<void> => {
    setBusy('aitest');
    setTestResult(null);
    try {
      setTestResult(await api.invoke('ai:testConnection', undefined));
    } catch (err) {
      setTestResult({ ok: false, message: (err as Error).message, model: '-' });
    } finally {
      setBusy(null);
    }
  };

  const createBackup = async (): Promise<void> => {
    setBusy('backup');
    setError(null);
    try {
      const backup = await api.invoke('app:createBackup', undefined);
      setSuccess(`Backup erstellt: ${backup.fileName} (${Math.round(backup.sizeBytes / 1024)} kB)`);
      refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const restoreBackup = async (backup: BackupInfo): Promise<void> => {
    const okRestore = await confirmDialog({
      title: `Backup „${backup.fileName}" wiederherstellen?`,
      message:
        'ALLE aktuellen Daten werden durch den Backup-Stand ersetzt und die App startet neu. Erstelle vorher ein frisches Backup, wenn du den aktuellen Stand behalten willst.',
      confirmLabel: 'Wiederherstellen',
      danger: true,
    });
    if (!okRestore) return;
    try {
      await api.invoke('app:restoreBackup', { fileName: backup.fileName });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const addSecret = async (): Promise<void> => {
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const ref = await api.invoke('secrets:set', { name: newName, service: newService, value: newValue });
      setNewValue('');
      setNewName('');
      setSuccess(`Schlüssel „${ref.name}" (${ref.hint}) verschlüsselt gespeichert.`);
      refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const deleteSecret = async (ref: SecretRef): Promise<void> => {
    const okDelete = await confirmDialog({
      title: 'Schlüssel löschen?',
      message: `„${ref.name}" wird gelöscht - verknüpfte Projekte verlieren die Verbindung.`,
      confirmLabel: 'Löschen',
      danger: true,
    });
    if (!okDelete) return;
    try {
      await api.invoke('secrets:delete', { id: ref.id });
      refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <SectionTitle title="Einstellungen" subtitle="KI-Anbindung, API-Schlüssel und App-Informationen" />
      {error ? <ErrorNote message={error} /> : null}
      {success ? <div className="rounded-lg border border-good/40 bg-good/10 px-3 py-2 text-sm text-good">{success}</div> : null}

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-mist-50">KI-Anbindung</h3>
          {ai ? <Badge tone={ai.configured ? 'good' : 'warn'}>{ai.configured ? `Verbunden: ${ai.model}` : 'Mock-Modus'}</Badge> : <Spinner />}
        </div>
        {ai ? <p className="text-sm text-mist-300">{ai.detail}</p> : null}

        {aiConfig ? (
          <div className="space-y-3 rounded-lg border border-ink-600 bg-ink-850 p-3">
            <Field label="KI-Anbieter">
              <div className="grid gap-2 md:grid-cols-5">
                {AI_PROVIDER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    title={option.hint}
                    onClick={() => void saveAiConfig({ provider: option.value })}
                    className={`rounded-lg border p-2 text-left text-xs transition-colors ${
                      aiConfig.provider === option.value ? 'border-forge-500 bg-forge-500/10 text-mist-100' : 'border-ink-500 text-mist-300 hover:border-ink-400'
                    }`}
                  >
                    <span className="block font-semibold">{option.label}</span>
                    <span className="mt-0.5 block text-[10px] leading-tight text-mist-500">{option.hint}</span>
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid gap-3 md:grid-cols-4">
              <Field label="Modell (optional)" hint="Leer = Standardmodell des Anbieters">
                <input
                  className="input"
                  defaultValue={aiConfig.model ?? ''}
                  placeholder="z.B. claude-sonnet-5 / gpt-4o"
                  onBlur={(e) => void saveAiConfig({ model: e.target.value.trim() || null })}
                />
              </Field>
              <Field label="Temperatur (0–1)" hint="Leer = Standard; höher = kreativer">
                <input
                  className="input"
                  type="number"
                  step={0.1}
                  min={0}
                  max={1}
                  defaultValue={aiConfig.temperature ?? ''}
                  placeholder="Standard"
                  onBlur={(e) => void saveAiConfig({ temperature: e.target.value === '' ? null : Math.min(1, Math.max(0, Number(e.target.value) || 0)) })}
                />
              </Field>
              <Field label="Max. Tokens" hint="Leer = 4096; begrenzt Kosten pro Anfrage">
                <input
                  className="input"
                  type="number"
                  step={500}
                  min={100}
                  max={64000}
                  defaultValue={aiConfig.maxTokens ?? ''}
                  placeholder="4096"
                  onBlur={(e) => void saveAiConfig({ maxTokens: e.target.value === '' ? null : Math.min(64000, Math.max(100, Math.round(Number(e.target.value) || 4096))) })}
                />
              </Field>
              {aiConfig.provider === 'custom_ai' ? (
                <Field label="Basis-URL (OpenAI-kompatibel)" hint="z.B. http://localhost:1234/v1">
                  <input
                    className="input"
                    defaultValue={aiConfig.customBaseUrl ?? ''}
                    placeholder="https://…/v1"
                    onBlur={(e) => void saveAiConfig({ customBaseUrl: e.target.value.trim() || null })}
                  />
                </Field>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="btn-secondary" onClick={() => void testAiConnection()} disabled={busy === 'aitest'}>
                {busy === 'aitest' ? 'Teste Verbindung…' : 'Verbindung testen'}
              </button>
              {testResult ? (
                <span className={`text-sm ${testResult.ok ? 'text-good' : 'text-bad'}`}>{testResult.message}</span>
              ) : null}
            </div>
          </div>
        ) : null}

        <p className="text-xs text-mist-400">
          Die App funktioniert vollständig ohne KI-Key: alle Generatoren laufen dann über die eingebauten, deterministischen Heuristik-Engines. Ein Key schaltet zusätzlich echte KI-Ideen, GDD-Verbesserung, KI-Qualitätsanalyse, KI-Aufgabenplanung, den Code-Agenten und Commit-Vorschläge frei.
        </p>
        <div className="rounded-lg border border-warn/30 bg-warn/5 px-3 py-2 text-xs text-warn">
          💰 Kostenhinweis: Anfragen an Anthropic/OpenAI kosten Geld (je nach Modell meist wenige Cent pro Anfrage; „Max. Tokens" begrenzt die Kosten). Der Mock-Modus und lokale KIs sind kostenlos.
        </div>
        <div className="rounded-lg border border-good/30 bg-good/5 px-3 py-2 text-xs text-mist-300">
          🆓 <span className="font-semibold text-good">Kostenlos ohne Cloud:</span> Installiere <span className="font-medium">LM Studio</span> (lmstudio.ai) oder <span className="font-medium">Ollama</span>, starte dort den lokalen Server, wähle oben „Eigene API" mit Basis-URL <code className="text-forge-300">http://localhost:1234/v1</code> (LM Studio) bzw. <code className="text-forge-300">http://localhost:11434/v1</code> (Ollama) und lege unten einen beliebigen Schlüssel (z.B. „lokal") als „Eigene KI-API" an. Schritt-für-Schritt: <code>docs/KI-SETUP.md</code>
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <Archive className="h-4 w-4 text-forge-300" />
          <h3 className="font-semibold text-mist-50">Backups</h3>
        </div>
        <p className="text-xs text-mist-400">
          Sichert die komplette Studio-Datenbank (alle Projekte, GDDs, Aufgaben, Verläufe) als konsistenten Snapshot. Die neuesten 20 Backups werden behalten. Die Projektordner auf der Festplatte sicherst du zusätzlich per Git oder Kopie.
        </p>
        <button className="btn-primary" onClick={() => void createBackup()} disabled={busy === 'backup'}>
          <Archive className="h-4 w-4" /> {busy === 'backup' ? 'Erstelle Backup…' : 'Backup jetzt erstellen'}
        </button>
        {backups === null ? <Spinner /> : null}
        {backups && backups.length > 0 ? (
          <ul className="divide-y divide-ink-600">
            {backups.map((backup) => (
              <li key={backup.fileName} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-mist-200">{backup.fileName}</p>
                  <p className="text-xs text-mist-500">
                    {formatDateTime(backup.createdAt)} · {Math.round(backup.sizeBytes / 1024)} kB
                  </p>
                </div>
                <button className="btn-ghost shrink-0 text-xs" onClick={() => void restoreBackup(backup)} title="Ersetzt alle aktuellen Daten und startet die App neu">
                  <RotateCcw className="h-3.5 w-3.5" /> Wiederherstellen
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {backups && backups.length === 0 ? <p className="text-sm text-mist-500">Noch keine Backups vorhanden.</p> : null}
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-forge-300" />
          <h3 className="font-semibold text-mist-50">API-Schlüssel</h3>
        </div>

        {secrets === null ? <Spinner label="Lade Schlüssel…" /> : null}
        {secrets && secrets.length === 0 ? <p className="text-sm text-mist-400">Noch keine Schlüssel hinterlegt.</p> : null}
        {secrets && secrets.length > 0 ? (
          <ul className="divide-y divide-ink-600">
            {secrets.map((ref) => (
              <li key={ref.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-mist-100">
                    {ref.name} <span className="font-mono text-mist-400">{ref.hint}</span>
                  </p>
                  <p className="text-xs text-mist-400">
                    {SECRET_SERVICE_LABELS[ref.service]} · angelegt {formatDate(ref.createdAt)}
                  </p>
                </div>
                <button className="btn-ghost text-bad" onClick={() => deleteSecret(ref)} title="Löschen">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="grid gap-3 rounded-lg border border-ink-600 bg-ink-850 p-3 md:grid-cols-3">
          <Field label="Name">
            <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="z.B. Mein Roblox Key" />
          </Field>
          <Field label="Dienst">
            <select className="input" value={newService} onChange={(e) => setNewService(e.target.value as SecretService)}>
              {Object.entries(SECRET_SERVICE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Schlüssel">
            <input className="input" type="password" value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="wird verschlüsselt" />
          </Field>
          <div className="md:col-span-3">
            <button className="btn-primary" onClick={addSecret} disabled={saving || !newName.trim() || !newValue.trim()}>
              {saving ? 'Speichere…' : 'Schlüssel verschlüsselt speichern'}
            </button>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-ink-600 bg-ink-850 p-3 text-xs text-mist-400">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-good" />
          <p>
            Schlüssel werden mit Betriebssystem-Verschlüsselung (Electron safeStorage: DPAPI/Keychain/libsecret) lokal gespeichert und nie im Klartext angezeigt, geloggt oder exportiert.
            Für Roblox: Open-Cloud-Key mit minimalem Scope <code className="text-forge-300">universe-places:write</code> anlegen und auf dein Universe beschränken — kein Cookie-Login, keine Account-Automatisierung.
          </p>
        </div>
      </Card>

      <Card className="space-y-2">
        <h3 className="font-semibold text-mist-50">App-Info</h3>
        {info ? (
          <dl className="grid grid-cols-[140px_1fr] gap-y-1.5 text-sm">
            <dt className="text-mist-400">Version</dt>
            <dd className="text-mist-200">{info.version}</dd>
            <dt className="text-mist-400">Plattform</dt>
            <dd className="text-mist-200">
              {info.platform} · {info.mode === 'web' ? 'Web-Modus (Browser)' : 'Desktop-App'}
            </dd>
            <dt className="text-mist-400">Datenbank</dt>
            <dd className="break-all font-mono text-xs text-mist-300">{info.dbPath}</dd>
            <dt className="text-mist-400">safeStorage</dt>
            <dd>{info.safeStorageAvailable ? <Badge tone="good">verfügbar</Badge> : <Badge tone="bad">nicht verfügbar - Schlüssel können nicht gespeichert werden (Linux: Keyring aktivieren)</Badge>}</dd>
          </dl>
        ) : (
          <Spinner />
        )}
      </Card>
    </div>
  );
}
