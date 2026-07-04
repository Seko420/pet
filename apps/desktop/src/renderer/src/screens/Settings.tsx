import React, { useEffect, useState } from 'react';
import { KeyRound, ShieldCheck, Trash2 } from 'lucide-react';
import type { SecretRef, SecretService } from '@egf/core';
import { SECRET_SERVICE_LABELS } from '@egf/core';
import type { AiStatusInfo, AppInfo } from '@shared/ipc';
import { api } from '../lib/api';
import { formatDate } from '../lib/labels';
import { Badge, Card, ErrorNote, Field, SectionTitle, Spinner } from '../components/ui';

export function Settings(): React.JSX.Element {
  const [ai, setAi] = useState<AiStatusInfo | null>(null);
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [secrets, setSecrets] = useState<SecretRef[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newService, setNewService] = useState<SecretService>('roblox_open_cloud');
  const [newValue, setNewValue] = useState('');
  const [saving, setSaving] = useState(false);

  const refresh = (): void => {
    api.invoke('ai:status', undefined).then(setAi).catch(() => setAi(null));
    api.invoke('app:getInfo', undefined).then(setInfo).catch(() => setInfo(null));
    api.invoke('secrets:list', undefined).then(setSecrets).catch((err: Error) => setError(err.message));
  };
  useEffect(refresh, []);

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
    if (!window.confirm(`Schlüssel „${ref.name}" wirklich löschen? Verknüpfte Projekte verlieren die Verbindung.`)) return;
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

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-mist-50">KI-Anbindung</h3>
          {ai ? <Badge tone={ai.configured ? 'good' : 'warn'}>{ai.configured ? `Verbunden: ${ai.model}` : 'Mock-Modus'}</Badge> : <Spinner />}
        </div>
        {ai ? <p className="text-sm text-mist-300">{ai.detail}</p> : null}
        <p className="text-xs text-mist-400">
          Ohne Key laufen alle Generatoren über die eingebauten Heuristik-Engines. Mit einem Anthropic-Key werden Ideen-Verfeinerung, Code-Agent und Commit-Vorschläge durch echte KI ersetzt.
        </p>
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
            <dd className="text-mist-200">{info.platform}</dd>
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
