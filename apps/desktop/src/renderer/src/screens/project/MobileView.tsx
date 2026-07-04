import React, { useCallback, useEffect, useState } from 'react';
import { Gauge, Hammer, Smartphone, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { MobilePerformanceBudget, MobileProjectConfig } from '@egf/core';
import { api } from '../../lib/api';
import { Badge, Card, EmptyState, ErrorNote, Field, SectionTitle, Spinner } from '../../components/ui';
import { BuildConsole } from '../../components/BuildConsole';
import { useProject } from './projectContext';

const PACKAGE_ID_PATTERN = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;

export function MobileView(): React.JSX.Element {
  const { project, refresh } = useProject();
  const [config, setConfig] = useState<MobileProjectConfig | null | 'loading'>('loading');
  const [packageId, setPackageId] = useState('');
  const [orientation, setOrientation] = useState<MobileProjectConfig['orientation']>('portrait');
  const [minSdk, setMinSdk] = useState(24);
  const [budget, setBudget] = useState<MobilePerformanceBudget | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback((): void => {
    api
      .invoke('mobile:getConfig', { projectId: project.id })
      .then((loaded) => {
        setConfig(loaded);
        if (loaded) {
          setPackageId(loaded.packageId ?? '');
          setOrientation(loaded.orientation);
          setMinSdk(loaded.minAndroidSdk);
          setBudget(loaded.performanceBudget);
        }
      })
      .catch((err: Error) => {
        setError(err.message);
        setConfig(null);
      });
  }, [project.id]);
  useEffect(load, [load]);

  if (project.platform === 'roblox') {
    return <EmptyState title="Kein Mobile-Projekt" description="Dieses Projekt zielt auf Roblox. Ändere die Plattform in der Übersicht, falls du Mobile ergänzen willst." />;
  }
  if (config === 'loading') return <Spinner label="Lade Mobile-Konfiguration…" />;
  if (!config || !budget) return <ErrorNote message={error ?? 'Mobile-Konfiguration nicht verfügbar.'} />;

  const packageIdValid = packageId === '' || PACKAGE_ID_PATTERN.test(packageId);

  const save = async (): Promise<void> => {
    if (!packageIdValid) {
      setError('Ungültige Package-ID. Format: com.studio.spielname (Kleinbuchstaben, Punkte, keine Sonderzeichen).');
      return;
    }
    setBusy('save');
    setError(null);
    try {
      const next = await api.invoke('mobile:saveConfig', {
        projectId: project.id,
        patch: { packageId: packageId || null, orientation, minAndroidSdk: minSdk, performanceBudget: budget },
      });
      setConfig(next);
      setNote('Mobile-Konfiguration gespeichert.');
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const scaffold = async (): Promise<void> => {
    setBusy('scaffold');
    setError(null);
    try {
      const result = await api.invoke('mobile:scaffold', { projectId: project.id });
      setNote(`${result.filesCreated.length} Dateien erzeugt unter ${result.projectPath}`);
      load();
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const godotCheck = async (): Promise<void> => {
    setBusy('check');
    setError(null);
    try {
      await api.invoke('build:run', { projectId: project.id, task: 'godot_check' });
      setNote('Godot-Check gestartet - Ausgabe in der Konsole unten.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const budgetField = (label: string, key: keyof MobilePerformanceBudget, step = 1): React.JSX.Element => (
    <Field label={label}>
      <input
        type="number"
        className="input"
        value={budget[key]}
        step={step}
        min={1}
        onChange={(e) => setBudget({ ...budget, [key]: Number(e.target.value) })}
      />
    </Field>
  );

  return (
    <div className="space-y-4">
      <SectionTitle title="Mobile (Android zuerst)" subtitle="Godot-4-Projekt, Performance-Budget und Export-Pfad" />
      {error ? <ErrorNote message={error} /> : null}
      {note ? <div className="rounded-lg border border-good/40 bg-good/10 px-3 py-2 text-sm text-good">{note}</div> : null}

      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-forge-300" />
          <h3 className="font-semibold text-mist-50">Konfiguration</h3>
          <Badge tone="accent">Engine: Godot 4</Badge>
          <span className="text-xs text-mist-500">Open Source, klein, exzellent automatisierbar - ideal für generierte Projekte.</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Package-ID" hint="Nach dem ersten Store-Upload unveränderbar">
            <input
              className={`input ${!packageIdValid ? 'border-bad' : ''}`}
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              placeholder="com.studio.spielname"
            />
            {!packageIdValid ? <span className="mt-1 block text-xs text-bad">Format: com.studio.spielname</span> : null}
          </Field>
          <Field label="Ausrichtung">
            <div className="inline-flex rounded-lg border border-ink-500 bg-ink-850 p-0.5">
              {(['portrait', 'landscape', 'sensor'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setOrientation(option)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium ${orientation === option ? 'bg-forge-500 text-white' : 'text-mist-300'}`}
                >
                  {option === 'portrait' ? 'Hochformat' : option === 'landscape' ? 'Querformat' : 'Sensor'}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Min. Android SDK" hint="24 = Android 7.0 (empfohlen)">
            <input type="number" className="input" value={minSdk} min={21} max={35} onChange={(e) => setMinSdk(Number(e.target.value))} />
          </Field>
        </div>
        <button className="btn-primary" onClick={() => void save()} disabled={busy !== null}>
          Speichern
        </button>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-forge-300" />
          <h3 className="font-semibold text-mist-50">Performance-Budget</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {budgetField('Ziel-FPS', 'targetFps', 30)}
          {budgetField('RAM (MB)', 'maxMemoryMb', 50)}
          {budgetField('APK/AAB (MB)', 'maxApkSizeMb', 10)}
          {budgetField('Kaltstart (s)', 'maxColdStartSeconds')}
          {budgetField('Draw Calls', 'maxDrawCalls', 10)}
        </div>
        <p className="text-xs text-mist-500">Wird beim Speichern übernommen und ins generierte Projekt (docs/PERFORMANCE.md) eingebettet.</p>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <Hammer className="h-4 w-4 text-forge-300" />
          <h3 className="font-semibold text-mist-50">Godot-Projekt</h3>
        </div>
        {config.godotProjectPath ? (
          <>
            <code className="block break-all rounded bg-ink-950 px-2 py-1.5 text-xs text-mist-300">{config.godotProjectPath}</code>
            <p className="text-xs text-mist-400">In Godot öffnen: Projektmanager → Importieren → project.godot in diesem Ordner wählen.</p>
            <button className="btn-secondary" onClick={() => void godotCheck()} disabled={busy !== null}>
              {busy === 'check' ? 'Prüfe…' : 'Godot-Check ausführen'}
            </button>
            <BuildConsole projectId={project.id} />
          </>
        ) : (
          <>
            <p className="text-sm text-mist-300">
              Generiert ein lauffähiges Godot-4-Projekt: Touch-Steuerung, genre-passendes Gameplay-Template ({project.genre}), Save-System mit Versionierung, Analytics-Hooks, faire Monetarisierungs-Stubs und Android-Export-Anleitung.
            </p>
            <button className="btn-primary" onClick={() => void scaffold()} disabled={busy !== null}>
              <Smartphone className="h-4 w-4" /> {busy === 'scaffold' ? 'Generiere…' : 'Godot-Projekt generieren'}
            </button>
          </>
        )}
      </Card>

      <Card className="space-y-2">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-forge-300" />
          <h3 className="font-semibold text-mist-50">Export & Stores</h3>
        </div>
        <p className="text-sm text-mist-300">
          Der Android-Export läuft aktuell über den Godot-Editor - die Schritt-für-Schritt-Anleitung liegt im generierten Projekt unter <code className="text-xs">docs/EXPORT_ANDROID.md</code>. Eine automatisierte Build-Pipeline steht auf der Roadmap.
        </p>
        <p className="text-sm text-mist-300">
          Vor dem Release: <Link to="../checklists" className="text-forge-300 underline">App-Store- und Datenschutz-Checkliste</Link> vollständig abarbeiten (Pflichtpunkte blockieren bewusst).
        </p>
      </Card>
    </div>
  );
}
