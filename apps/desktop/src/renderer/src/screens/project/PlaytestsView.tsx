import React, { useCallback, useEffect, useState } from 'react';
import { ClipboardCheck, ListPlus, Plus, Trash2, Users } from 'lucide-react';
import type { PlaytestFindingCategory, PlaytestSession, PlaytestSeverity } from '@egf/core';
import { PLAYTEST_CATEGORY_LABELS } from '@egf/core';
import { api } from '../../lib/api';
import { Badge, Card, EmptyState, ErrorNote, Field, SectionTitle, Spinner, type BadgeTone } from '../../components/ui';
import { useProject } from './projectContext';

const CATEGORY_TONES: Record<PlaytestFindingCategory, BadgeTone> = {
  bug: 'bad',
  confusion: 'warn',
  frustration: 'warn',
  boredom: 'neutral',
  delight: 'good',
  suggestion: 'accent',
};

const SEVERITY_LABELS: Record<PlaytestSeverity, string> = { low: 'Niedrig', medium: 'Mittel', high: 'Hoch' };

function FindingForm({ onAdd }: { onAdd: (finding: { category: PlaytestFindingCategory; severity: PlaytestSeverity; description: string; location: string }) => void }): React.JSX.Element {
  const [category, setCategory] = useState<PlaytestFindingCategory>('confusion');
  const [severity, setSeverity] = useState<PlaytestSeverity>('medium');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  return (
    <div className="grid gap-2 rounded-lg border border-ink-600 bg-ink-850 p-3 md:grid-cols-[1fr_140px_120px_140px_auto]">
      <input className="input" placeholder="Was ist passiert? (z.B. 3 von 5 Testern fanden den Shop nicht)" value={description} onChange={(e) => setDescription(e.target.value)} />
      <select className="input" value={category} onChange={(e) => setCategory(e.target.value as PlaytestFindingCategory)}>
        {Object.entries(PLAYTEST_CATEGORY_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <select className="input" value={severity} onChange={(e) => setSeverity(e.target.value as PlaytestSeverity)}>
        {Object.entries(SEVERITY_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <input className="input" placeholder="Ort (Level/Screen)" value={location} onChange={(e) => setLocation(e.target.value)} />
      <button
        className="btn-secondary"
        disabled={!description.trim()}
        onClick={() => {
          onAdd({ category, severity, description, location });
          setDescription('');
          setLocation('');
        }}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export function PlaytestsView(): React.JSX.Element {
  const { project } = useProject();
  const [sessions, setSessions] = useState<PlaytestSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [playedAt, setPlayedAt] = useState('');
  const [testerCount, setTesterCount] = useState(5);
  const [buildLabel, setBuildLabel] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback((): void => {
    api
      .invoke('playtests:list', { projectId: project.id })
      .then(setSessions)
      .catch((err: Error) => setError(err.message));
  }, [project.id]);
  useEffect(load, [load]);

  const createSession = async (): Promise<void> => {
    try {
      await api.invoke('playtests:create', { projectId: project.id, title, playedAt, testerCount, buildLabel, notes });
      setShowForm(false);
      setTitle('');
      setNotes('');
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const addFinding = async (sessionId: string, finding: { category: PlaytestFindingCategory; severity: PlaytestSeverity; description: string; location: string }): Promise<void> => {
    try {
      const updated = await api.invoke('playtests:addFinding', { sessionId, finding });
      setSessions((prev) => (prev ?? []).map((s) => (s.id === updated.id ? updated : s)));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const removeFinding = async (sessionId: string, findingId: string): Promise<void> => {
    try {
      const updated = await api.invoke('playtests:removeFinding', { sessionId, findingId });
      setSessions((prev) => (prev ?? []).map((s) => (s.id === updated.id ? updated : s)));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const convertFinding = async (sessionId: string, findingId: string): Promise<void> => {
    try {
      const { session, task } = await api.invoke('playtests:convertFinding', { sessionId, findingId });
      setSessions((prev) => (prev ?? []).map((s) => (s.id === session.id ? session : s)));
      setNote(`Aufgabe erstellt: „${task.title}" - jetzt auf dem Aufgabenboard.`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const deleteSession = async (session: PlaytestSession): Promise<void> => {
    if (!window.confirm(`Playtest-Session „${session.title}" mit ${session.findings.length} Findings löschen?`)) return;
    try {
      await api.invoke('playtests:delete', { id: session.id });
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (!sessions && !error) return <Spinner label="Lade Playtests…" />;

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Playtest-Feedback"
        subtitle="Beobachten, festhalten, in Aufgaben verwandeln - so verbessert ein Studio iterativ"
        actions={
          <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
            <Plus className="h-4 w-4" /> Neue Session
          </button>
        }
      />
      {error ? <ErrorNote message={error} /> : null}
      {note ? <div className="rounded-lg border border-good/40 bg-good/10 px-3 py-2 text-sm text-good">{note}</div> : null}

      {showForm ? (
        <Card className="grid gap-3 md:grid-cols-4">
          <Field label="Titel">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z.B. Erster Freundes-Test" autoFocus />
          </Field>
          <Field label="Datum">
            <input className="input" value={playedAt} onChange={(e) => setPlayedAt(e.target.value)} placeholder="2026-07-04" />
          </Field>
          <Field label="Anzahl Tester">
            <input type="number" className="input" min={1} value={testerCount} onChange={(e) => setTesterCount(Number(e.target.value))} />
          </Field>
          <Field label="Build/Version">
            <input className="input" value={buildLabel} onChange={(e) => setBuildLabel(e.target.value)} placeholder="z.B. v0.3-proto" />
          </Field>
          <div className="md:col-span-3">
            <Field label="Notizen">
              <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Setup, Besonderheiten…" />
            </Field>
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full" onClick={() => void createSession()} disabled={!title.trim()}>
              Anlegen
            </button>
          </div>
        </Card>
      ) : null}

      {sessions && sessions.length === 0 && !showForm ? (
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title="Noch keine Playtest-Sessions"
          description="Goldene Regel: beobachten statt helfen. Notiere jede Verwirrung und Frustration als Finding - die wichtigsten wandelst du direkt in Aufgaben um."
          action={
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> Erste Session anlegen
            </button>
          }
        />
      ) : null}

      {sessions?.map((session) => (
        <Card key={session.id} className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-mist-50">{session.title}</h3>
            <Badge>{session.playedAt}</Badge>
            <Badge>
              <Users className="mr-1 h-3 w-3" />
              {session.testerCount} Tester
            </Badge>
            {session.buildLabel ? <Badge tone="accent">{session.buildLabel}</Badge> : null}
            <button className="btn-ghost ml-auto px-2 py-1 text-bad" onClick={() => void deleteSession(session)}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          {session.notes ? <p className="text-sm text-mist-400">{session.notes}</p> : null}

          {session.findings.length > 0 ? (
            <ul className="divide-y divide-ink-600">
              {session.findings.map((finding) => (
                <li key={finding.id} className="flex items-start gap-2 py-2">
                  <Badge tone={CATEGORY_TONES[finding.category]}>{PLAYTEST_CATEGORY_LABELS[finding.category]}</Badge>
                  <Badge tone={finding.severity === 'high' ? 'bad' : finding.severity === 'medium' ? 'warn' : 'neutral'}>
                    {SEVERITY_LABELS[finding.severity]}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-mist-100">{finding.description}</p>
                    {finding.location ? <p className="text-xs text-mist-500">Ort: {finding.location}</p> : null}
                  </div>
                  {finding.convertedTaskId ? (
                    <Badge tone="good">
                      <ClipboardCheck className="mr-1 h-3 w-3" /> Als Aufgabe übernommen
                    </Badge>
                  ) : (
                    <button className="btn-ghost shrink-0 px-2 py-1 text-xs" onClick={() => void convertFinding(session.id, finding.id)} title="Erstellt eine Aufgabe auf dem Board">
                      <ListPlus className="h-3.5 w-3.5" /> Als Aufgabe
                    </button>
                  )}
                  <button className="btn-ghost shrink-0 px-1.5 py-1 text-bad" onClick={() => void removeFinding(session.id, finding.id)}>
                    <Trash2 className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-mist-500">Noch keine Findings erfasst.</p>
          )}

          <FindingForm onAdd={(finding) => void addFinding(session.id, finding)} />
        </Card>
      ))}
    </div>
  );
}
