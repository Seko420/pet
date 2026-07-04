import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, FileUp, Gamepad2, Lightbulb, Plus, XCircle } from 'lucide-react';
import type { ProjectDashboardSummary } from '@egf/core';
import {
  GENRE_LABELS,
  MONETIZATION_LABELS,
  PROJECT_STATUS_LABELS,
} from '@egf/core';
import { api } from '../lib/api';
import { STATUS_TONES, formatDateTime } from '../lib/labels';
import { Badge, Card, EmptyState, ErrorNote, SectionTitle, Spinner, scoreTone } from '../components/ui';

const PLATFORM_LABELS: Record<string, string> = { roblox: 'Roblox', mobile: 'Mobile', both: 'Roblox + Mobile' };

function ProjectCard({ summary }: { summary: ProjectDashboardSummary }): React.JSX.Element {
  const navigate = useNavigate();
  const { project } = summary;
  const overall = project.scores?.overall ?? null;

  return (
    <Card onClick={() => navigate(`/projects/${project.id}`)} className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-mist-50">{project.name}</p>
          <p className="mt-0.5 text-xs text-mist-400">
            {PLATFORM_LABELS[project.platform]} · {GENRE_LABELS[project.genre]}
          </p>
        </div>
        {overall !== null ? (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              scoreTone(overall) === 'good' ? 'bg-good/15 text-good' : scoreTone(overall) === 'warn' ? 'bg-warn/15 text-warn' : 'bg-bad/15 text-bad'
            }`}
            title="Marktpotenzial-Score (heuristisch)"
          >
            {overall}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge tone={STATUS_TONES[project.status]}>{PROJECT_STATUS_LABELS[project.status]}</Badge>
        {project.monetization.slice(0, 2).map((m) => (
          <Badge key={m}>{MONETIZATION_LABELS[m]}</Badge>
        ))}
        {project.monetization.length > 2 ? <Badge>+{project.monetization.length - 2}</Badge> : null}
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs text-mist-400">
          <span>
            {summary.doneTasks}/{summary.totalTasks} Aufgaben
          </span>
          <span>{summary.progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-ink-600">
          <div className="h-full rounded-full bg-forge-500" style={{ width: `${summary.progress}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-mist-400">
        <span className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${summary.robloxConnected ? 'bg-good' : 'bg-ink-400'}`} />
          {project.platform === 'mobile' ? 'Mobile-Projekt' : summary.robloxConnected ? 'Roblox verbunden' : 'Roblox nicht verbunden'}
        </span>
        {summary.lastBuild ? (
          <span className="flex items-center gap-1" title={`${summary.lastBuild.summary} (${formatDateTime(summary.lastBuild.at)})`}>
            {summary.lastBuild.ok ? <CheckCircle2 className="h-3.5 w-3.5 text-good" /> : <XCircle className="h-3.5 w-3.5 text-bad" />}
            Build
          </span>
        ) : null}
        {summary.lastTest ? (
          <span className="flex items-center gap-1" title={`${summary.lastTest.summary} (${formatDateTime(summary.lastTest.at)})`}>
            {summary.lastTest.ok ? <CheckCircle2 className="h-3.5 w-3.5 text-good" /> : <XCircle className="h-3.5 w-3.5 text-bad" />}
            Test
          </span>
        ) : null}
      </div>
    </Card>
  );
}

export function Dashboard(): React.JSX.Element {
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState<ProjectDashboardSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = (): void => {
    api
      .invoke('projects:dashboard', undefined)
      .then(setSummaries)
      .catch((err: Error) => setError(err.message));
  };
  useEffect(load, []);

  const importProject = async (): Promise<void> => {
    try {
      if (api.mode === 'desktop') {
        const project = await api.invoke('projects:import', undefined);
        if (project) navigate(`/projects/${project.id}`);
        return;
      }
      // Web mode: file upload instead of a native open dialog.
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
          const json = await file.text();
          const project = await api.invoke('projects:importData', { json });
          navigate(`/projects/${project.id}`);
        } catch (err) {
          setError((err as Error).message);
        }
      };
      input.click();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Studio-Dashboard"
        subtitle="Alle Spielprojekte auf einen Blick"
        actions={
          <>
            <button className="btn-secondary" onClick={() => void importProject()} title="Projektpaket (.egf.json) importieren">
              <FileUp className="h-4 w-4" /> Importieren
            </button>
            <button className="btn-primary" onClick={() => navigate('/projects/new')}>
              <Plus className="h-4 w-4" /> Neues Projekt
            </button>
          </>
        }
      />

      {error ? <ErrorNote message={error} /> : null}
      {!summaries && !error ? <Spinner label="Lade Projekte…" /> : null}

      {summaries && summaries.length === 0 ? (
        <EmptyState
          icon={<Gamepad2 className="h-10 w-10" />}
          title="Willkommen in deiner Game-Schmiede!"
          description="Starte mit einer Spielidee aus dem Idea Lab oder lege direkt ein neues Projekt an. Die App führt dich von der Idee über das GDD bis zur Veröffentlichung."
          action={
            <div className="flex gap-2">
              <button className="btn-primary" onClick={() => navigate('/projects/new')}>
                <Plus className="h-4 w-4" /> Neues Projekt
              </button>
              <button className="btn-secondary" onClick={() => navigate('/ideas')}>
                <Lightbulb className="h-4 w-4" /> Idea Lab öffnen
              </button>
            </div>
          }
        />
      ) : null}

      {summaries && summaries.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {summaries.map((s) => (
            <ProjectCard key={s.project.id} summary={s} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
