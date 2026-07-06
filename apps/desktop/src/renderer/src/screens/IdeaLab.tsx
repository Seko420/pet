import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Rocket, Save, Trash2 } from 'lucide-react';
import type { Audience, EffortLevel, GameIdea, Genre, IdeaBrief, MonetizationModel, TargetPlatform } from '@egf/core';
import { AUDIENCE_LABELS, GENRE_LABELS, MONETIZATION_LABELS } from '@egf/core';
import { api } from '../lib/api';
import { EFFORT_LABELS } from '../lib/labels';
import { Badge, Card, ErrorNote, Field, ScoreBar, SectionTitle, Spinner } from '../components/ui';

const RISK_TONES = { low: 'good', medium: 'warn', high: 'bad', critical: 'bad' } as const;

function Chip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active ? 'bg-forge-500 text-white' : 'bg-ink-700 text-mist-300 hover:bg-ink-600'
      }`}
    >
      {label}
    </button>
  );
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }): React.JSX.Element {
  return (
    <div className="inline-flex rounded-lg border border-ink-500 bg-ink-850 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            value === option.value ? 'bg-forge-500 text-white' : 'text-mist-300 hover:text-mist-100'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function IdeaCard({
  idea,
  saved,
  onSave,
  onDelete,
  onPromote,
}: {
  idea: GameIdea;
  saved: boolean;
  onSave?: (idea: GameIdea) => void;
  onDelete?: (id: string) => void;
  onPromote: (idea: GameIdea) => void;
}): React.JSX.Element {
  const s = idea.scores;
  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-mist-50">{idea.title}</h3>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {idea.source === 'ai' ? <Badge tone="good">✨ KI</Badge> : null}
            <Badge tone="accent">{GENRE_LABELS[idea.genre]}</Badge>
            <Badge>{idea.platform === 'both' ? 'Roblox + Mobile' : idea.platform === 'roblox' ? 'Roblox' : 'Mobile'}</Badge>
            <Badge>{AUDIENCE_LABELS[idea.audience]}</Badge>
            <Badge>{EFFORT_LABELS[idea.developmentEffort]}</Badge>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-bold text-forge-300">{s.overall}</p>
          <p className="text-[10px] uppercase tracking-wide text-mist-400">Gesamt</p>
        </div>
      </div>

      <p className="text-sm text-mist-200">{idea.elevatorPitch}</p>
      <p className="text-sm text-mist-300">
        <span className="font-medium text-forge-300">USP: </span>
        {idea.usp}
      </p>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-4">
        <ScoreBar label="Fun" value={s.fun.value} reason={s.fun.reason} />
        <ScoreBar label="Retention" value={s.retention.value} reason={s.retention.reason} />
        <ScoreBar label="Monetarisierung" value={s.monetization.value} reason={s.monetization.reason} />
        <ScoreBar label="Machbarkeit" value={s.productionFeasibility.value} reason={s.productionFeasibility.reason} />
      </div>

      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-mist-400">Core Loop</p>
        <ol className="list-inside list-decimal space-y-0.5 text-sm text-mist-200">
          {idea.coreLoop.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-good">Warum es funktionieren kann</p>
          <ul className="list-inside list-disc space-y-0.5 text-sm text-mist-300">
            {idea.whyItCouldSucceed.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-bad">Warum es scheitern kann</p>
          <ul className="list-inside list-disc space-y-0.5 text-sm text-mist-300">
            {idea.whyItCouldFail.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-mist-400">Monetarisierung</p>
        <ul className="space-y-1 text-sm text-mist-300">
          {idea.monetization.map((m, i) => (
            <li key={i}>
              <Badge tone="accent">{MONETIZATION_LABELS[m.model]}</Badge> <span className="ml-1">{m.description}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-mist-400">Risiken</p>
        <ul className="space-y-1 text-sm text-mist-300">
          {idea.risks.map((risk, i) => (
            <li key={i} className="flex items-start gap-2">
              <Badge tone={RISK_TONES[risk.level]}>{risk.level}</Badge>
              <span>
                <span className="font-medium text-mist-200">{risk.title}.</span> {risk.mitigation}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-forge-500/30 bg-forge-500/5 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-forge-300">
          Verbesserte Version: {idea.improvedVersion.title}
        </p>
        <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-mist-300">
          {idea.improvedVersion.changes.map((change, i) => (
            <li key={i}>{change}</li>
          ))}
        </ul>
        <p className="mt-2 text-sm italic text-mist-300">{idea.improvedVersion.pitch}</p>
      </div>

      <div className="flex gap-2">
        {!saved && onSave ? (
          <button className="btn-secondary" onClick={() => onSave(idea)}>
            <Save className="h-4 w-4" /> Speichern
          </button>
        ) : null}
        <button className="btn-primary" onClick={() => onPromote(idea)}>
          <Rocket className="h-4 w-4" /> Als Projekt starten
        </button>
        {saved && onDelete ? (
          <button
            className="btn-ghost ml-auto text-bad"
            onClick={() => {
              if (window.confirm(`Idee „${idea.title}" wirklich löschen?`)) onDelete(idea.id);
            }}
          >
            <Trash2 className="h-4 w-4" /> Löschen
          </button>
        ) : null}
      </div>
    </Card>
  );
}

export function IdeaLab(): React.JSX.Element {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<TargetPlatform>('roblox');
  const [genres, setGenres] = useState<Genre[]>([]);
  const [audience, setAudience] = useState<Audience>('teens_13_17');
  const [monetizationFocus, setMonetizationFocus] = useState<MonetizationModel[]>([]);
  const [maxEffort, setMaxEffort] = useState<EffortLevel>('medium');
  const [multiplayer, setMultiplayer] = useState<IdeaBrief['multiplayer']>('any');
  const [themeHints, setThemeHints] = useState('');
  const [count, setCount] = useState(3);
  const [seed, setSeed] = useState('');

  const [generating, setGenerating] = useState(false);
  const [useAi, setUseAi] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [results, setResults] = useState<GameIdea[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [savedIdeas, setSavedIdeas] = useState<GameIdea[] | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const refreshSaved = (): void => {
    api.invoke('ideas:list', undefined).then(setSavedIdeas).catch((err: Error) => setError(err.message));
  };
  useEffect(refreshSaved, []);
  useEffect(() => {
    api
      .invoke('ai:status', undefined)
      .then((status) => setAiConfigured(status.configured))
      .catch(() => setAiConfigured(false));
  }, []);

  const generate = async (): Promise<void> => {
    setGenerating(true);
    setError(null);
    try {
      const brief: IdeaBrief = {
        platform,
        genres,
        audience,
        monetizationFocus,
        maxEffort,
        multiplayer,
        themeHints: themeHints.trim() || undefined,
        count,
        seed: seed.trim() ? Number(seed.trim()) : undefined,
        useAi: useAi && aiConfigured,
      };
      const ideas = await api.invoke('ideas:generate', brief);
      setResults([...ideas].sort((a, b) => b.scores.overall - a.scores.overall));
      setHasGenerated(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const saveIdea = async (idea: GameIdea): Promise<void> => {
    try {
      await api.invoke('ideas:save', idea);
      setSavedIds((prev) => new Set(prev).add(idea.id));
      refreshSaved();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const deleteIdea = async (id: string): Promise<void> => {
    try {
      await api.invoke('ideas:delete', { id });
      refreshSaved();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const promote = async (idea: GameIdea): Promise<void> => {
    try {
      if (!savedIds.has(idea.id) && !savedIdeas?.some((s) => s.id === idea.id)) {
        await api.invoke('ideas:save', idea);
      }
      navigate(`/projects/new?ideaId=${idea.id}`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const toggleGenre = (genre: Genre): void =>
    setGenres((prev) => (prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]));
  const toggleMonetization = (m: MonetizationModel): void =>
    setMonetizationFocus((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  return (
    <div className="space-y-6">
      <SectionTitle title="Idea Lab" subtitle="Spielideen mit Marktpotenzial generieren, bewerten und in Projekte verwandeln" />

      <Card className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Plattform">
            <Segmented
              value={platform}
              onChange={setPlatform}
              options={[
                { value: 'roblox', label: 'Roblox' },
                { value: 'mobile', label: 'Mobile' },
                { value: 'both', label: 'Beides' },
              ]}
            />
          </Field>
          <Field label="Zielgruppe">
            <select className="input w-52" value={audience} onChange={(e) => setAudience(e.target.value as Audience)}>
              {Object.entries(AUDIENCE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Max. Aufwand">
            <select className="input w-52" value={maxEffort} onChange={(e) => setMaxEffort(e.target.value as EffortLevel)}>
              {Object.entries(EFFORT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Multiplayer">
            <Segmented
              value={multiplayer}
              onChange={setMultiplayer}
              options={[
                { value: 'any', label: 'Egal' },
                { value: 'preferred', label: 'Bevorzugt' },
                { value: 'required', label: 'Pflicht' },
                { value: 'no', label: 'Nein' },
              ]}
            />
          </Field>
        </div>

        <Field label="Genres (leer = alle)">
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(GENRE_LABELS) as Genre[]).map((genre) => (
              <Chip key={genre} active={genres.includes(genre)} label={GENRE_LABELS[genre]} onClick={() => toggleGenre(genre)} />
            ))}
          </div>
        </Field>

        <Field label="Monetarisierungs-Fokus (optional)">
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(MONETIZATION_LABELS) as MonetizationModel[]).map((m) => (
              <Chip key={m} active={monetizationFocus.includes(m)} label={MONETIZATION_LABELS[m]} onClick={() => toggleMonetization(m)} />
            ))}
          </div>
        </Field>

        <div className="flex flex-wrap items-end gap-4">
          <Field label="Themen-Wünsche" hint="z.B. Unterwasser, Pets, Zeitreise">
            <input className="input w-72" value={themeHints} onChange={(e) => setThemeHints(e.target.value)} placeholder="optional" />
          </Field>
          <Field label={`Anzahl Ideen: ${count}`}>
            <input type="range" min={1} max={10} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-40 accent-forge-500" />
          </Field>
          <Field label="Seed" hint="Gleicher Seed = gleiche Ideen">
            <input className="input w-32" value={seed} onChange={(e) => setSeed(e.target.value.replace(/\D/g, ''))} placeholder="optional" />
          </Field>
          <div className="ml-auto flex items-center gap-3">
            {aiConfigured ? (
              <button
                type="button"
                onClick={() => setUseAi((v) => !v)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  useAi ? 'bg-good/20 text-good ring-1 ring-inset ring-good/40' : 'bg-ink-700 text-mist-300 hover:bg-ink-600'
                }`}
                title="Echte KI-Ideen statt der Offline-Engine (verursacht API-Kosten bei Cloud-Anbietern)"
              >
                ✨ Echte KI {useAi ? 'AN' : 'aus'}
              </button>
            ) : null}
            <button className="btn-primary" onClick={generate} disabled={generating}>
              <Flame className="h-4 w-4" />
              {generating ? (useAi && aiConfigured ? 'KI denkt nach…' : 'Die Schmiede glüht…') : 'Ideen generieren'}
            </button>
          </div>
        </div>
      </Card>

      {error ? <ErrorNote message={error} /> : null}
      {generating ? <Spinner label="Konzepte werden geschmiedet und bewertet…" /> : null}

      {hasGenerated && results.length === 0 ? (
        <p className="py-6 text-center text-sm text-mist-400">
          Keine Ideen erzeugt - lockere die Filter (z.B. Genres) und versuche es erneut.
        </p>
      ) : null}
      {results.length > 0 ? (
        <div className="space-y-4">
          <SectionTitle title={`${results.length} Ideen`} subtitle="Sortiert nach Gesamt-Score" />
          {results.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} saved={savedIds.has(idea.id)} onSave={saveIdea} onPromote={promote} />
          ))}
        </div>
      ) : null}

      {savedIdeas && savedIdeas.length > 0 ? (
        <div className="space-y-4">
          <SectionTitle title="Gespeicherte Ideen" subtitle={`${savedIdeas.length} in der Bibliothek`} />
          {savedIdeas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} saved onDelete={deleteIdea} onPromote={promote} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
