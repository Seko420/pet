import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Gamepad2 } from 'lucide-react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import type { GameProject, ProjectStatus } from '@egf/core';
import { GENRE_LABELS, PROJECT_STATUS_LABELS } from '@egf/core';
import { api } from '../../lib/api';
import { STATUS_TONES } from '../../lib/labels';
import { Badge, EmptyState, ErrorNote, Spinner, scoreTone } from '../../components/ui';
import { ProjectContext } from './projectContext';

function Tab({ to, label, end }: { to: string; label: string; end?: boolean }): React.JSX.Element {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
          isActive ? 'border-forge-500 text-forge-300' : 'border-transparent text-mist-400 hover:text-mist-200'
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export function ProjectLayout(): React.JSX.Element {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<GameProject | null | 'loading'>('loading');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (!projectId) return;
    try {
      const loaded = await api.invoke('projects:get', { id: projectId });
      setProject(loaded);
    } catch (err) {
      setError((err as Error).message);
      setProject(null);
    }
  }, [projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (project === 'loading') return <Spinner label="Lade Projekt…" />;
  if (!project) {
    return (
      <div className="space-y-4">
        {error ? <ErrorNote message={error} /> : null}
        <EmptyState
          icon={<Gamepad2 className="h-10 w-10" />}
          title="Projekt nicht gefunden"
          description="Es wurde möglicherweise gelöscht."
          action={
            <Link to="/" className="btn-primary">
              Zum Dashboard
            </Link>
          }
        />
      </div>
    );
  }

  const changeStatus = async (status: ProjectStatus): Promise<void> => {
    try {
      await api.invoke('projects:update', { id: project.id, patch: { status } });
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const wantsRoblox = project.platform === 'roblox' || project.platform === 'both';
  const wantsMobile = project.platform === 'mobile' || project.platform === 'both';

  return (
    <ProjectContext.Provider value={{ project, refresh }}>
      <div className="space-y-5">
        <div>
          <Link to="/" className="mb-2 inline-flex items-center gap-1 text-xs text-mist-400 hover:text-mist-200">
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-mist-50">{project.name}</h1>
            <Badge tone={STATUS_TONES[project.status]}>{PROJECT_STATUS_LABELS[project.status]}</Badge>
            <Badge tone="accent">{GENRE_LABELS[project.genre]}</Badge>
            <Badge>{project.platform === 'both' ? 'Roblox + Mobile' : project.platform === 'roblox' ? 'Roblox' : 'Mobile'}</Badge>
            {project.scores ? (
              <span
                className={`text-sm font-bold ${
                  scoreTone(project.scores.overall) === 'good' ? 'text-good' : scoreTone(project.scores.overall) === 'warn' ? 'text-warn' : 'text-bad'
                }`}
                title="Marktpotenzial-Score"
              >
                ★ {project.scores.overall}
              </span>
            ) : null}
            <select
              className="input ml-auto w-48 py-1.5 text-xs"
              value={project.status}
              onChange={(e) => void changeStatus(e.target.value as ProjectStatus)}
              title="Projektstatus ändern"
            >
              {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? <ErrorNote message={error} /> : null}

        <nav className="flex gap-1 overflow-x-auto border-b border-ink-600">
          <Tab to="" end label="Übersicht" />
          <Tab to="gdd" label="GDD" />
          <Tab to="tasks" label="Aufgaben" />
          <Tab to="agent" label="Code-Agent" />
          <Tab to="files" label="Dateien" />
          {wantsRoblox ? <Tab to="roblox" label="Roblox" /> : null}
          {wantsMobile ? <Tab to="mobile" label="Mobile" /> : null}
          <Tab to="content" label="Content" />
          <Tab to="analytics" label="Analytics" />
          <Tab to="checklists" label="Checklisten" />
          <Tab to="scores" label="Scores" />
        </nav>

        <Outlet />
      </div>
    </ProjectContext.Provider>
  );
}
