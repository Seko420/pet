import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ListPlus, Plus, Sparkles, Trash2 } from 'lucide-react';
import type { TaskCategory, TaskItem, TaskPriority, TaskStatus } from '@egf/core';
import { TASK_CATEGORY_LABELS } from '@egf/core';
import { api } from '../../lib/api';
import { PRIORITY_COLORS, PRIORITY_LABELS, TASK_STATUS_LABELS } from '../../lib/labels';
import { Badge, Card, ErrorNote, Field, SectionTitle, Spinner } from '../../components/ui';
import { useConfirm } from '../../components/ConfirmDialog';
import { useProject } from './projectContext';

const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'done', 'blocked'];
const FLOW: TaskStatus[] = ['todo', 'in_progress', 'done'];

function TaskCard({
  task,
  onUpdate,
  onDelete,
}: {
  task: TaskItem;
  onUpdate: (patch: Partial<TaskItem> & { id: string }) => void;
  onDelete: (id: string) => void;
}): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const confirmDialog = useConfirm();
  const flowIndex = FLOW.indexOf(task.status);

  return (
    <div className="rounded-lg border border-ink-600 bg-ink-850 p-2.5">
      <button className="w-full text-left" onClick={() => setOpen((o) => !o)}>
        <div className="flex items-start gap-2">
          <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${PRIORITY_COLORS[task.priority]}`} title={PRIORITY_LABELS[task.priority]} />
          <p className="text-sm font-medium leading-snug text-mist-100">{task.title}</p>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-4">
          <Badge>{TASK_CATEGORY_LABELS[task.category]}</Badge>
          <Badge tone="accent">{task.milestone}</Badge>
          {task.estimateHours ? <span className="text-[11px] text-mist-400">{task.estimateHours}h</span> : null}
        </div>
      </button>

      {open ? (
        <div className="mt-2 space-y-2 border-t border-ink-600 pt-2">
          {task.description ? <p className="text-xs text-mist-300">{task.description}</p> : null}
          <div className="flex flex-wrap gap-2">
            <select
              className="input w-36 py-1 text-xs"
              value={task.status}
              onChange={(e) => onUpdate({ id: task.id, status: e.target.value as TaskStatus })}
            >
              {STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {TASK_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            <select
              className="input w-32 py-1 text-xs"
              value={task.priority}
              onChange={(e) => onUpdate({ id: task.id, priority: e.target.value as TaskPriority })}
            >
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              className="btn-ghost ml-auto px-2 py-1 text-xs text-bad"
              onClick={() => {
                void confirmDialog({
                  title: 'Aufgabe löschen?',
                  message: `„${task.title}" wird vom Board entfernt.`,
                  confirmLabel: 'Löschen',
                  danger: true,
                }).then((ok) => ok && onDelete(task.id));
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-2 flex justify-end gap-1">
        {flowIndex > 0 ? (
          <button className="btn-ghost px-1.5 py-0.5" title="Status zurück" onClick={() => onUpdate({ id: task.id, status: FLOW[flowIndex - 1] })}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        ) : null}
        {flowIndex >= 0 && flowIndex < FLOW.length - 1 ? (
          <button className="btn-ghost px-1.5 py-0.5" title="Status weiter" onClick={() => onUpdate({ id: task.id, status: FLOW[flowIndex + 1] })}>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function TaskBoard(): React.JSX.Element {
  const { project } = useProject();
  const confirmBoard = useConfirm();
  const [tasks, setTasks] = useState<TaskItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [milestoneFilter, setMilestoneFilter] = useState<string>('alle');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'alle'>('alle');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TaskCategory>('code');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newMilestone, setNewMilestone] = useState('MVP');
  const [newDescription, setNewDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback((): void => {
    api
      .invoke('tasks:listForProject', { projectId: project.id })
      .then(setTasks)
      .catch((err: Error) => setError(err.message));
  }, [project.id]);
  useEffect(load, [load]);

  const milestones = useMemo(() => [...new Set((tasks ?? []).map((t) => t.milestone))], [tasks]);

  const filtered = useMemo(
    () =>
      (tasks ?? []).filter(
        (t) => (milestoneFilter === 'alle' || t.milestone === milestoneFilter) && (categoryFilter === 'alle' || t.category === categoryFilter),
      ),
    [tasks, milestoneFilter, categoryFilter],
  );

  const update = async (patch: Partial<TaskItem> & { id: string }): Promise<void> => {
    try {
      await api.invoke('tasks:update', patch);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const remove = async (id: string): Promise<void> => {
    try {
      await api.invoke('tasks:delete', { id });
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const generatePlan = async (): Promise<void> => {
    setBusy(true);
    try {
      const next = await api.invoke('tasks:generateForProject', { projectId: project.id });
      setTasks(next);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const aiPlan = async (): Promise<void> => {
    const ok = await confirmBoard({
      title: 'KI-Aufgabenplanung starten?',
      message: 'Die KI schlägt neue Aufgaben passend zum Projektstand vor (verursacht bei Cloud-Anbietern API-Kosten).',
      confirmLabel: 'Starten',
    });
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      const next = await api.invoke('tasks:aiPlan', { projectId: project.id });
      setTasks(next);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const createTask = async (): Promise<void> => {
    try {
      await api.invoke('tasks:create', {
        projectId: project.id,
        title: newTitle,
        description: newDescription,
        category: newCategory,
        priority: newPriority,
        milestone: newMilestone,
      });
      setNewTitle('');
      setNewDescription('');
      setShowNewForm(false);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (!tasks && !error) return <Spinner label="Lade Aufgaben…" />;

  const doneCount = (tasks ?? []).filter((t) => t.status === 'done').length;
  const total = tasks?.length ?? 0;

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Aufgabenboard"
        subtitle={`${doneCount}/${total} erledigt`}
        actions={
          <>
            <button className="btn-secondary" onClick={() => void generatePlan()} disabled={busy} title="Ergänzt fehlende Standard-Aufgaben für Plattform und Genre">
              <ListPlus className="h-4 w-4" /> {busy ? 'Generiere…' : 'Aufgabenplan generieren'}
            </button>
            <button className="btn-secondary" onClick={() => void aiPlan()} disabled={busy} title="Die KI schlägt neue Aufgaben passend zum aktuellen Projektstand vor (KI-Schlüssel nötig)">
              <Sparkles className="h-4 w-4" /> KI-Aufgaben
            </button>
            <button className="btn-primary" onClick={() => setShowNewForm((s) => !s)}>
              <Plus className="h-4 w-4" /> Neue Aufgabe
            </button>
          </>
        }
      />
      {error ? <ErrorNote message={error} /> : null}

      <div className="h-1.5 overflow-hidden rounded-full bg-ink-600">
        <div className="h-full rounded-full bg-good" style={{ width: `${total === 0 ? 0 : Math.round((doneCount / total) * 100)}%` }} />
      </div>

      {showNewForm ? (
        <Card className="grid gap-3 md:grid-cols-4">
          <Field label="Titel">
            <input className="input" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} autoFocus />
          </Field>
          <Field label="Kategorie">
            <select className="input" value={newCategory} onChange={(e) => setNewCategory(e.target.value as TaskCategory)}>
              {Object.entries(TASK_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priorität">
            <select className="input" value={newPriority} onChange={(e) => setNewPriority(e.target.value as TaskPriority)}>
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Milestone">
            <input className="input" value={newMilestone} onChange={(e) => setNewMilestone(e.target.value)} />
          </Field>
          <div className="md:col-span-3">
            <Field label="Beschreibung">
              <input className="input" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
            </Field>
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full" onClick={() => void createTask()} disabled={newTitle.trim().length === 0}>
              Anlegen
            </button>
          </div>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <select className="input w-40 py-1.5 text-xs" value={milestoneFilter} onChange={(e) => setMilestoneFilter(e.target.value)}>
          <option value="alle">Alle Milestones</option>
          {milestones.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-1">
          <button
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${categoryFilter === 'alle' ? 'bg-forge-500 text-white' : 'bg-ink-700 text-mist-300'}`}
            onClick={() => setCategoryFilter('alle')}
          >
            Alle
          </button>
          {(Object.keys(TASK_CATEGORY_LABELS) as TaskCategory[]).map((category) => (
            <button
              key={category}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${categoryFilter === category ? 'bg-forge-500 text-white' : 'bg-ink-700 text-mist-300'}`}
              onClick={() => setCategoryFilter(category)}
            >
              {TASK_CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {STATUS_ORDER.map((status) => {
          const column = filtered.filter((t) => t.status === status);
          return (
            <div key={status} className="rounded-xl border border-ink-600 bg-ink-800/50 p-2.5">
              <p className="mb-2 flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wide text-mist-400">
                {TASK_STATUS_LABELS[status]}
                <span className="rounded-full bg-ink-600 px-1.5 py-0.5 text-[10px]">{column.length}</span>
              </p>
              <div className="space-y-2">
                {column.map((task) => (
                  <TaskCard key={task.id} task={task} onUpdate={(patch) => void update(patch)} onDelete={(id) => void remove(id)} />
                ))}
                {column.length === 0 ? <p className="px-1 py-4 text-center text-xs text-mist-500">Keine Aufgaben</p> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
