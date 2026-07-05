import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, FileDown, FileText, FolderOpen, ListTodo, Rocket, Smartphone } from 'lucide-react';
import { AUDIENCE_LABELS, MONETIZATION_LABELS } from '@egf/core';
import { api } from '../../lib/api';
import { ART_STYLE_LABELS, formatDate } from '../../lib/labels';
import { Badge, Card, ErrorNote, SectionTitle } from '../../components/ui';
import { useProject } from './projectContext';

export function ProjectOverview(): React.JSX.Element {
  const { project, refresh } = useProject();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [confirmName, setConfirmName] = useState<string | null>(null);

  const scaffoldWorkspace = async (): Promise<void> => {
    try {
      const { workspacePath } = await api.invoke('projects:scaffoldWorkspace', { id: project.id });
      setNote(`Projektordner erzeugt: ${workspacePath}`);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const openWorkspace = async (): Promise<void> => {
    if (!project.workspacePath) return;
    try {
      await api.invoke('app:openPath', { path: project.workspacePath });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const reevaluate = async (): Promise<void> => {
    try {
      const result = await api.invoke('scores:evaluateProject', { projectId: project.id });
      setNote(`Konzept neu bewertet: Gesamt-Score ${result.scores.overall}/100.`);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const exportProject = async (): Promise<void> => {
    try {
      if (api.mode === 'desktop') {
        const result = await api.invoke('projects:export', { id: project.id });
        if (result) setNote(`Projekt exportiert: ${result.path}`);
      } else {
        // Web mode: browser download instead of a native save dialog.
        const { fileName, json } = await api.invoke('projects:exportData', { id: project.id });
        const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        setNote(`Projekt als Download exportiert: ${fileName}`);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const deleteProject = async (): Promise<void> => {
    try {
      await api.invoke('projects:delete', { id: project.id });
      navigate('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const quickActions: { icon: React.ReactNode; title: string; description: string; onClick: () => void }[] = [
    { icon: <FileText className="h-5 w-5" />, title: 'GDD ansehen', description: 'Design-Dokument lesen und bearbeiten', onClick: () => navigate('gdd') },
    { icon: <ListTodo className="h-5 w-5" />, title: 'Aufgaben', description: 'Kanban-Board mit Meilensteinen', onClick: () => navigate('tasks') },
    { icon: <BarChart3 className="h-5 w-5" />, title: 'Konzept neu bewerten', description: 'Scores + Verbesserungshebel aktualisieren', onClick: () => void reevaluate() },
    { icon: <FileDown className="h-5 w-5" />, title: 'Projekt exportieren', description: 'Komplettes Paket als .egf.json sichern/teilen', onClick: () => void exportProject() },
    ...(project.platform !== 'mobile'
      ? [{ icon: <Rocket className="h-5 w-5" />, title: 'Roblox einrichten', description: 'Rojo-Projekt, IDs und Publishing', onClick: () => navigate('roblox') }]
      : []),
    ...(project.platform !== 'roblox'
      ? [{ icon: <Smartphone className="h-5 w-5" />, title: 'Mobile einrichten', description: 'Godot-Projekt und Export-Pfad', onClick: () => navigate('mobile') }]
      : []),
  ];

  return (
    <div className="space-y-5">
      {error ? <ErrorNote message={error} /> : null}
      {note ? <div className="rounded-lg border border-good/40 bg-good/10 px-3 py-2 text-sm text-good">{note}</div> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <h3 className="font-semibold text-mist-50">Steckbrief</h3>
          {project.description ? <p className="whitespace-pre-wrap text-sm text-mist-300">{project.description}</p> : null}
          <dl className="grid grid-cols-[130px_1fr] gap-y-1.5 text-sm">
            <dt className="text-mist-400">MVP-Ziel</dt>
            <dd className="text-mist-200">{project.mvpGoal}</dd>
            <dt className="text-mist-400">Release-Ziel</dt>
            <dd className="text-mist-200">{project.releaseGoal}</dd>
            <dt className="text-mist-400">Art Style</dt>
            <dd className="text-mist-200">{ART_STYLE_LABELS[project.artStyle]}</dd>
            <dt className="text-mist-400">Zielgruppe</dt>
            <dd className="text-mist-200">{AUDIENCE_LABELS[project.audience]}</dd>
            <dt className="text-mist-400">Qualitätsziel</dt>
            <dd className="text-mist-200">{project.qualityTarget}</dd>
            <dt className="text-mist-400">Multiplayer</dt>
            <dd className="text-mist-200">{project.multiplayer ? 'ja' : 'nein'}</dd>
            <dt className="text-mist-400">Angelegt</dt>
            <dd className="text-mist-200">{formatDate(project.createdAt)}</dd>
          </dl>
          <div className="flex flex-wrap gap-1.5">
            {project.monetization.map((m) => (
              <Badge key={m} tone="accent">
                {MONETIZATION_LABELS[m]}
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-mist-50">Projekt-Workspace</h3>
          {project.workspacePath ? (
            <>
              <p className="text-sm text-mist-300">Alle generierten Dateien (Rojo/Godot/GDD-Exporte) liegen hier:</p>
              <code className="block break-all rounded bg-ink-950 px-2 py-1.5 text-xs text-mist-300">{project.workspacePath}</code>
              {api.mode === 'desktop' ? (
                <button className="btn-secondary" onClick={() => void openWorkspace()}>
                  <FolderOpen className="h-4 w-4" /> Im Dateimanager öffnen
                </button>
              ) : (
                <p className="text-xs text-mist-500">Web-Modus: Der Ordner liegt auf dem Server-Rechner unter diesem Pfad.</p>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-mist-300">
                Noch kein Projektordner auf der Festplatte. Er wird unter <code className="text-xs">Dokumente/EmpireGameForge/{project.slug}</code> angelegt und enthält README, docs/, assets/ sowie später die generierten Roblox-/Godot-Projekte.
              </p>
              <button className="btn-primary" onClick={() => void scaffoldWorkspace()}>
                <FolderOpen className="h-4 w-4" /> Projektordner erzeugen
              </button>
            </>
          )}
        </Card>
      </div>

      <div>
        <SectionTitle title="Schnellzugriff" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Card key={action.title} onClick={action.onClick} className="flex items-start gap-3">
              <div className="rounded-lg bg-forge-500/15 p-2 text-forge-300">{action.icon}</div>
              <div>
                <p className="text-sm font-semibold text-mist-100">{action.title}</p>
                <p className="mt-0.5 text-xs text-mist-400">{action.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="border-bad/30">
        <h3 className="font-semibold text-bad">Gefahrenzone</h3>
        <p className="mt-1 text-sm text-mist-400">
          Löscht das Projekt mit allen Daten (GDD, Aufgaben, Verlauf) aus der App. Der Projektordner auf der Festplatte bleibt erhalten.
        </p>
        {confirmName === null ? (
          <button className="btn-danger mt-3" onClick={() => setConfirmName('')}>
            Projekt löschen…
          </button>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              className="input w-64"
              placeholder={`Zum Bestätigen "${project.name}" eintippen`}
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
            />
            <button className="btn-danger" disabled={confirmName !== project.name} onClick={() => void deleteProject()}>
              Endgültig löschen
            </button>
            <button className="btn-ghost" onClick={() => setConfirmName(null)}>
              Abbrechen
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
