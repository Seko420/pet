import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import type {
  ArtStyle,
  Audience,
  Genre,
  MonetizationModel,
  NewProjectInput,
  QualityTarget,
  TargetPlatform,
} from '@egf/core';
import { AUDIENCE_LABELS, GENRE_LABELS, MONETIZATION_LABELS } from '@egf/core';
import { api } from '../lib/api';
import { ART_STYLE_LABELS } from '../lib/labels';
import { Card, ErrorNote, Field, SectionTitle } from '../components/ui';

const MVP_SUGGESTIONS: Partial<Record<Genre, string>> = {
  simulator: 'Kern-Sammelschleife mit 1 Gebiet, 3 Upgrades, Speichern und erster Tagesquest spielbar.',
  tycoon: 'Eine Basis mit 5 ausbaubaren Anlagen, Einkommensschleife und Speichern spielbar.',
  obby: '25 Checkpoints mit Sterne-Belohnung, Respawn und Bestzeit-Anzeige spielbar.',
  idle: 'Tipp-Einkommen, 3 Generatoren mit Kostenkurve und Offline-Einnahmen spielbar.',
  hypercasual: 'Ein Kern-Loop mit 30-60s Runs, Fail/Retry und Highscore spielbar.',
  battle_arena: 'Eine Arena, ein Modus (2-8 Spieler), Runden-Loop mit Auswertung spielbar.',
  puzzle: '20 Level der Kernmechanik mit Sterne-Wertung und Levelauswahl spielbar.',
};

const QUALITY_OPTIONS: { value: QualityTarget; label: string; description: string }[] = [
  { value: 'prototype', label: 'Prototyp', description: 'Schnell spielbar, Platzhalter ok' },
  { value: 'polished', label: 'Poliert', description: 'Release-fähig mit gutem Feedback' },
  { value: 'premium', label: 'Premium', description: 'Maximaler Polish, Top-Store-Anspruch' },
];

export function NewProjectWizard(): React.JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ideaId = searchParams.get('ideaId');

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const createdIdRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<TargetPlatform>('roblox');
  const [genre, setGenre] = useState<Genre>('simulator');
  const [audience, setAudience] = useState<Audience>('teens_13_17');
  const [monetization, setMonetization] = useState<MonetizationModel[]>(['cosmetics']);
  const [artStyle, setArtStyle] = useState<ArtStyle>('stylized_cartoon');
  const [multiplayer, setMultiplayer] = useState(true);
  const [qualityTarget, setQualityTarget] = useState<QualityTarget>('polished');
  const [mvpGoal, setMvpGoal] = useState('');
  const [releaseGoal, setReleaseGoal] = useState('');
  const [description, setDescription] = useState('');

  // Prefill from a promoted idea.
  useEffect(() => {
    if (!ideaId) return;
    api
      .invoke('ideas:get', { id: ideaId })
      .then((idea) => {
        if (!idea) return;
        setName(idea.improvedVersion.title || idea.title);
        setPlatform(idea.platform);
        setGenre(idea.genre);
        setAudience(idea.audience);
        setMonetization(idea.monetization.map((m) => m.model));
        setMultiplayer(idea.brief.multiplayer !== 'no');
        setDescription(`${idea.elevatorPitch}\n\nUSP: ${idea.usp}\nThema: ${idea.theme}`);
      })
      .catch(() => setError('Die verknüpfte Idee konnte nicht geladen werden - Felder bitte manuell ausfüllen.'));
  }, [ideaId]);

  const defaultMvp = useMemo(
    () => MVP_SUGGESTIONS[genre] ?? 'Kernschleife spielbar mit Speichern und erster Belohnung in unter 60 Sekunden.',
    [genre],
  );

  const stepValid = (): string | null => {
    if (step === 0) {
      if (name.trim().length < 3) return 'Der Projektname braucht mindestens 3 Zeichen.';
    }
    if (step === 1) {
      if (monetization.length === 0) return 'Bitte mindestens ein Monetarisierungsmodell wählen.';
    }
    return null;
  };

  const next = (): void => {
    const problem = stepValid();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setStep((s) => Math.min(2, s + 1));
  };

  const create = async (): Promise<void> => {
    const problem = stepValid();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    const input: NewProjectInput = {
      name: name.trim(),
      platform,
      genre,
      audience,
      monetization,
      artStyle,
      multiplayer,
      qualityTarget,
      mvpGoal: mvpGoal.trim() || defaultMvp,
      releaseGoal: releaseGoal.trim() || 'Veröffentlichung nach vollständiger Release-Checkliste.',
      description: description.trim(),
      ideaId,
    };
    try {
      // Bei einem Teilfehler NICHT erneut anlegen: die bereits erzeugte
      // Projekt-ID wird gemerkt und beim Retry nur der Rest wiederholt.
      let projectId = createdIdRef.current;
      if (!projectId) {
        setBusy('Erstelle Projekt…');
        const project = await api.invoke('projects:create', input);
        projectId = project.id;
        createdIdRef.current = project.id;
      }
      setBusy('Erzeuge Aufgabenplan…');
      await api.invoke('tasks:generateForProject', { projectId });
      setBusy('Erzeuge Game Design Document…');
      await api.invoke('gdd:generate', { projectId });
      setBusy('Bewerte Konzept…');
      await api.invoke('scores:evaluateProject', { projectId });
      setBusy('Plane Analytics & Content…');
      await api.invoke('analytics:generatePlan', { projectId });
      await api.invoke('content:generatePlan', { projectId });
      navigate(`/projects/${projectId}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(null);
    }
  };

  const toggleMonetization = (m: MonetizationModel): void =>
    setMonetization((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  const steps = ['Grundlagen', 'Ausrichtung', 'Ziele'];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionTitle title="Neues Game-Projekt" subtitle={ideaId ? 'Vorbefüllt aus deiner Idee' : 'In drei Schritten zum vollständigen Projekt-Setup'} />

      <div className="flex items-center gap-2">
        {steps.map((label, i) => (
          <React.Fragment key={label}>
            <div className={`flex items-center gap-2 ${i <= step ? 'text-forge-300' : 'text-mist-500'}`}>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  i < step ? 'bg-forge-500 text-white' : i === step ? 'bg-forge-500/20 ring-1 ring-forge-500' : 'bg-ink-700'
                }`}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="text-sm font-medium">{label}</span>
            </div>
            {i < steps.length - 1 ? <div className="h-px flex-1 bg-ink-600" /> : null}
          </React.Fragment>
        ))}
      </div>

      {error ? <ErrorNote message={error} /> : null}

      {step === 0 ? (
        <Card className="space-y-4">
          <Field label="Projektname">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Pilzwald Tycoon" autoFocus />
          </Field>
          <Field label="Plattform">
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { value: 'roblox', label: 'Roblox', hint: 'Luau + Rojo + Open Cloud' },
                  { value: 'mobile', label: 'Mobile', hint: 'Godot 4, Android zuerst' },
                  { value: 'both', label: 'Beides', hint: 'Gemeinsames Design, zwei Builds' },
                ] as { value: TargetPlatform; label: string; hint: string }[]
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPlatform(option.value)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    platform === option.value ? 'border-forge-500 bg-forge-500/10' : 'border-ink-500 bg-ink-850 hover:border-ink-400'
                  }`}
                >
                  <p className="text-sm font-semibold text-mist-100">{option.label}</p>
                  <p className="mt-0.5 text-xs text-mist-400">{option.hint}</p>
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Genre">
              <select className="input" value={genre} onChange={(e) => setGenre(e.target.value as Genre)}>
                {Object.entries(GENRE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Zielgruppe">
              <select className="input" value={audience} onChange={(e) => setAudience(e.target.value as Audience)}>
                {Object.entries(AUDIENCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card className="space-y-4">
          <Field label="Monetarisierung (mind. 1)" hint="Fairness zuerst - die App prüft das über Checklisten und Scores.">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(MONETIZATION_LABELS) as MonetizationModel[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMonetization(m)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    monetization.includes(m) ? 'bg-forge-500 text-white' : 'bg-ink-700 text-mist-300 hover:bg-ink-600'
                  }`}
                >
                  {MONETIZATION_LABELS[m]}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Art Style">
              <select className="input" value={artStyle} onChange={(e) => setArtStyle(e.target.value as ArtStyle)}>
                {Object.entries(ART_STYLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Multiplayer">
              <button
                type="button"
                onClick={() => setMultiplayer((m) => !m)}
                className={`btn w-full ${multiplayer ? 'bg-forge-500 text-white' : 'border border-ink-500 bg-ink-850 text-mist-300'}`}
              >
                {multiplayer ? 'Ja - gemeinsames Spielen' : 'Nein - Solo-Erlebnis'}
              </button>
            </Field>
          </div>
          <Field label="Qualitätsziel">
            <div className="grid grid-cols-3 gap-2">
              {QUALITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setQualityTarget(option.value)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    qualityTarget === option.value ? 'border-forge-500 bg-forge-500/10' : 'border-ink-500 bg-ink-850 hover:border-ink-400'
                  }`}
                >
                  <p className="text-sm font-semibold text-mist-100">{option.label}</p>
                  <p className="mt-0.5 text-xs text-mist-400">{option.description}</p>
                </button>
              ))}
            </div>
          </Field>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="space-y-4">
          <Field label="MVP-Ziel" hint="Was muss die erste spielbare Version können?">
            <textarea className="input min-h-24" value={mvpGoal} onChange={(e) => setMvpGoal(e.target.value)} placeholder={defaultMvp} />
          </Field>
          <Field label="Release-Ziel">
            <textarea
              className="input min-h-20"
              value={releaseGoal}
              onChange={(e) => setReleaseGoal(e.target.value)}
              placeholder="z.B. Öffentlicher Roblox-Release mit erster Season nach 8 Wochen LiveOps-Plan."
            />
          </Field>
          <Field label="Beschreibung (optional)">
            <textarea className="input min-h-24" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Pitch, Setting, Besonderheiten…" />
          </Field>
        </Card>
      ) : null}

      <div className="flex items-center justify-between">
        <button className="btn-ghost" onClick={() => (step === 0 ? navigate(-1) : setStep(step - 1))} disabled={busy !== null}>
          <ArrowLeft className="h-4 w-4" /> Zurück
        </button>
        {step < 2 ? (
          <button className="btn-primary" onClick={next}>
            Weiter <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button className="btn-primary" onClick={create} disabled={busy !== null}>
            {busy ?? 'Projekt erstellen'}
          </button>
        )}
      </div>
      {busy ? (
        <p className="text-center text-xs text-mist-400">
          Beim Erstellen werden automatisch Aufgabenplan, GDD, Scores, Analytics- und Content-Plan generiert.
        </p>
      ) : null}
    </div>
  );
}
