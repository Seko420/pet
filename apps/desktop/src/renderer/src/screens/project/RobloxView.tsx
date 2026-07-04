import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, FolderTree, Hammer, PlugZap, Rocket, ShieldCheck, XCircle } from 'lucide-react';
import type { RobloxProjectConfig, SecretRef } from '@egf/core';
import type { RobloxPublishResult, RobloxValidationResult } from '@shared/ipc';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { formatDateTime } from '../../lib/labels';
import { Badge, Card, EmptyState, ErrorNote, Field, SectionTitle, Spinner } from '../../components/ui';
import { BuildConsole } from '../../components/BuildConsole';
import { useProject } from './projectContext';

export function RobloxView(): React.JSX.Element {
  const { project, refresh } = useProject();
  const [config, setConfig] = useState<RobloxProjectConfig | null | 'loading'>('loading');
  const [secrets, setSecrets] = useState<SecretRef[]>([]);
  const [universeId, setUniverseId] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [apiKeySecretId, setApiKeySecretId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [connectionResult, setConnectionResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [validation, setValidation] = useState<RobloxValidationResult | null>(null);
  const [dryRunResult, setDryRunResult] = useState<RobloxPublishResult | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [versionType, setVersionType] = useState<'Saved' | 'Published'>('Published');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback((): void => {
    api
      .invoke('roblox:getConfig', { projectId: project.id })
      .then((loaded) => {
        setConfig(loaded);
        if (loaded) {
          setUniverseId(loaded.universeId ?? '');
          setPlaceId(loaded.placeId ?? '');
          setApiKeySecretId(loaded.apiKeySecretId ?? '');
        }
      })
      .catch((err: Error) => {
        setError(err.message);
        setConfig(null);
      });
    api
      .invoke('secrets:list', undefined)
      .then((list) => setSecrets(list.filter((s) => s.service === 'roblox_open_cloud')))
      .catch(() => undefined);
  }, [project.id]);
  useEffect(load, [load]);

  if (project.platform === 'mobile') {
    return <EmptyState title="Kein Roblox-Projekt" description="Dieses Projekt zielt auf Mobile. Ändere die Plattform in der Übersicht, falls du Roblox ergänzen willst." />;
  }
  if (config === 'loading') return <Spinner label="Lade Roblox-Konfiguration…" />;
  if (!config) return <ErrorNote message={error ?? 'Roblox-Konfiguration nicht verfügbar.'} />;

  const run = async (label: string, fn: () => Promise<void>): Promise<void> => {
    setBusy(label);
    setError(null);
    setNote(null);
    try {
      await fn();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const saveConfig = (): Promise<void> =>
    run('save', async () => {
      const next = await api.invoke('roblox:saveConfig', {
        projectId: project.id,
        patch: { universeId: universeId || null, placeId: placeId || null, apiKeySecretId: apiKeySecretId || null },
      });
      setConfig(next);
      setNote('Verbindungseinstellungen gespeichert.');
      await refresh();
    });

  const testConnection = (): Promise<void> =>
    run('test', async () => {
      setConnectionResult(await api.invoke('roblox:testConnection', { projectId: project.id }));
    });

  const scaffold = (): Promise<void> =>
    run('scaffold', async () => {
      const result = await api.invoke('roblox:scaffold', { projectId: project.id });
      setNote(`${result.filesCreated.length} Dateien erzeugt unter ${result.projectPath}`);
      load();
      await refresh();
    });

  const validate = (): Promise<void> =>
    run('validate', async () => {
      setValidation(await api.invoke('roblox:validate', { projectId: project.id }));
    });

  const rojoBuild = (): Promise<void> =>
    run('build', async () => {
      await api.invoke('build:run', { projectId: project.id, task: 'rojo_build' });
      setNote('Rojo-Build gestartet - Ausgabe in der Build-Konsole unten.');
    });

  const dryRun = (): Promise<void> =>
    run('dryrun', async () => {
      const result = await api.invoke('roblox:publish', { projectId: project.id, dryRun: true, confirmed: false, versionType });
      setDryRunResult(result);
      load();
    });

  const publish = (): Promise<void> =>
    run('publish', async () => {
      const result = await api.invoke('roblox:publish', { projectId: project.id, dryRun: false, confirmed: true, versionType });
      setDryRunResult(null);
      setPublishOpen(false);
      setConfirmName('');
      if (result.ok) setNote(result.message);
      else setError(result.message);
      load();
    });

  return (
    <div className="space-y-4">
      <SectionTitle title="Roblox" subtitle="Rojo-Projekt, Open-Cloud-Verbindung und sicheres Publishing" />
      {error ? <ErrorNote message={error} /> : null}
      {note ? <div className="rounded-lg border border-good/40 bg-good/10 px-3 py-2 text-sm text-good">{note}</div> : null}

      {/* --------------------------------------------------- connection */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <PlugZap className="h-4 w-4 text-forge-300" />
          <h3 className="font-semibold text-mist-50">Verbindung (Open Cloud)</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Universe ID" hint="Creator Dashboard → Experience">
            <input className="input" value={universeId} onChange={(e) => setUniverseId(e.target.value.replace(/\D/g, ''))} placeholder="z.B. 1234567890" />
          </Field>
          <Field label="Place ID" hint="Start-Place der Experience">
            <input className="input" value={placeId} onChange={(e) => setPlaceId(e.target.value.replace(/\D/g, ''))} placeholder="z.B. 9876543210" />
          </Field>
          <Field label="API-Key" hint="Scope: universe-places:write">
            {secrets.length > 0 ? (
              <select className="input" value={apiKeySecretId} onChange={(e) => setApiKeySecretId(e.target.value)}>
                <option value="">— Key wählen —</option>
                {secrets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.hint})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-mist-400">
                Kein Roblox-Key hinterlegt. <Link to="/settings" className="text-forge-300 underline">In den Einstellungen anlegen</Link> (Open-Cloud-Key mit minimalem Scope).
              </p>
            )}
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => void saveConfig()} disabled={busy !== null}>
            Speichern
          </button>
          <button className="btn-secondary" onClick={() => void testConnection()} disabled={busy !== null || !config.universeId || !config.apiKeySecretId}>
            {busy === 'test' ? 'Teste…' : 'Verbindung testen'}
          </button>
        </div>
        {connectionResult ? (
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${connectionResult.ok ? 'bg-good/10 text-good' : 'bg-bad/10 text-bad'}`}>
            {connectionResult.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {connectionResult.message}
          </div>
        ) : null}
      </Card>

      {/* ------------------------------------------------ project files */}
      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <FolderTree className="h-4 w-4 text-forge-300" />
          <h3 className="font-semibold text-mist-50">Projektstruktur (Rojo + Luau)</h3>
        </div>
        {config.rojoProjectPath ? (
          <>
            <code className="block break-all rounded bg-ink-950 px-2 py-1.5 text-xs text-mist-300">{config.rojoProjectPath}</code>
            <div className="flex flex-wrap gap-2">
              <button className="btn-secondary" onClick={() => void validate()} disabled={busy !== null}>
                <ShieldCheck className="h-4 w-4" /> {busy === 'validate' ? 'Validiere…' : 'Validieren'}
              </button>
              <button className="btn-secondary" onClick={() => void rojoBuild()} disabled={busy !== null}>
                <Hammer className="h-4 w-4" /> Rojo Build starten
              </button>
            </div>
            {validation ? (
              <div className="space-y-1 rounded-lg border border-ink-600 bg-ink-850 p-3">
                <p className="text-sm font-medium text-mist-100">
                  {validation.ok ? <Badge tone="good">Validierung ok</Badge> : <Badge tone="bad">Validierung fehlgeschlagen</Badge>}
                  <span className="ml-2 text-xs text-mist-400">{validation.checkedFiles} Dateien geprüft</span>
                </p>
                {validation.issues.map((issue, i) => (
                  <p key={i} className={`text-xs ${issue.severity === 'error' ? 'text-bad' : 'text-warn'}`}>
                    [{issue.severity}] {issue.message}
                  </p>
                ))}
                {validation.issues.length === 0 ? <p className="text-xs text-mist-400">Keine Probleme gefunden.</p> : null}
              </div>
            ) : null}
          </>
        ) : (
          <>
            <p className="text-sm text-mist-300">
              Generiert ein produktionsreifes Rojo-Projekt: DataStore mit Session-Lock, Economy-, Shop- und Quest-Services, Leaderstats, Anti-Exploit (Rate-Limits + Validierung), Client-Controller mit Touch-Support — Server-autoritativ nach Roblox-Best-Practices, abgestimmt auf Genre „{project.genre}".
            </p>
            <button className="btn-primary" onClick={() => void scaffold()} disabled={busy !== null}>
              <FolderTree className="h-4 w-4" /> {busy === 'scaffold' ? 'Generiere…' : 'Roblox-Projekt generieren'}
            </button>
          </>
        )}
      </Card>

      {/* --------------------------------------------------- build console */}
      <Card className="space-y-2">
        <h3 className="font-semibold text-mist-50">Build-Konsole</h3>
        <BuildConsole projectId={project.id} />
      </Card>

      {/* -------------------------------------------------------- publish */}
      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <Rocket className="h-4 w-4 text-forge-300" />
          <h3 className="font-semibold text-mist-50">Veröffentlichen</h3>
        </div>
        <p className="text-xs text-mist-400">
          Ablauf: Validieren → Rojo Build → Dry-Run (Simulation) → bestätigte Veröffentlichung über die offizielle Open-Cloud-API. Die App erzwingt diese Reihenfolge.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-secondary" onClick={() => void dryRun()} disabled={busy !== null}>
            {busy === 'dryrun' ? 'Simuliere…' : 'Dry-Run (Simulation)'}
          </button>
          <button className="btn-primary" onClick={() => setPublishOpen(true)} disabled={busy !== null || !dryRunResult?.ok}>
            <Rocket className="h-4 w-4" /> Veröffentlichen…
          </button>
          {!dryRunResult?.ok ? <span className="text-xs text-mist-500">Erst nach erfolgreichem Dry-Run aktiv.</span> : null}
        </div>

        {dryRunResult ? (
          <div className={`space-y-1 rounded-lg px-3 py-2 text-sm ${dryRunResult.ok ? 'bg-good/10 text-good' : 'bg-bad/10 text-bad'}`}>
            <p>{dryRunResult.message}</p>
            {dryRunResult.issues.map((issue, i) => (
              <p key={i} className="text-xs">
                • {issue}
              </p>
            ))}
          </div>
        ) : null}

        {publishOpen && dryRunResult?.ok ? (
          <div className="space-y-3 rounded-lg border border-warn/40 bg-warn/5 p-4">
            <p className="text-sm text-mist-100">
              Die Place-Datei wird zu Roblox hochgeladen und ersetzt {versionType === 'Published' ? 'die LIVE-Version' : 'den gespeicherten Entwurf'} von Place {config.placeId}.
            </p>
            <Field label="Versionstyp">
              <select className="input w-64" value={versionType} onChange={(e) => setVersionType(e.target.value as 'Saved' | 'Published')}>
                <option value="Published">Published — sofort live für Spieler</option>
                <option value="Saved">Saved — nur als Version gespeichert</option>
              </select>
            </Field>
            <Field label={`Zum Bestätigen den Projektnamen eintippen: "${project.name}"`}>
              <input className="input w-80" value={confirmName} onChange={(e) => setConfirmName(e.target.value)} />
            </Field>
            <div className="flex gap-2">
              <button className="btn-danger" disabled={confirmName !== project.name || busy !== null} onClick={() => void publish()}>
                {busy === 'publish' ? 'Veröffentliche…' : 'Jetzt veröffentlichen'}
              </button>
              <button className="btn-ghost" onClick={() => setPublishOpen(false)}>
                Abbrechen
              </button>
            </div>
          </div>
        ) : null}

        {config.publishHistory.length > 0 ? (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-mist-400">Verlauf</p>
            <ul className="divide-y divide-ink-600 text-sm">
              {config.publishHistory.map((entry, i) => (
                <li key={i} className="flex items-center gap-2 py-1.5">
                  <Badge tone={entry.mode === 'published' ? (entry.ok ? 'good' : 'bad') : 'neutral'}>
                    {entry.mode === 'published' ? 'Publish' : 'Dry-Run'}
                  </Badge>
                  {entry.ok ? <CheckCircle2 className="h-3.5 w-3.5 text-good" /> : <XCircle className="h-3.5 w-3.5 text-bad" />}
                  <span className="text-xs text-mist-400">{formatDateTime(entry.at)}</span>
                  <span className="truncate text-xs text-mist-300">{entry.message}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="text-xs text-mist-500">
          Nur offizielle Open-Cloud-API. Kein Cookie-Login, keine Account-Automatisierung. API-Keys bleiben verschlüsselt auf diesem Rechner.
        </p>
      </Card>
    </div>
  );
}
