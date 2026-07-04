import React, { useCallback, useEffect, useState } from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import type { ChecklistState } from '@shared/ipc';
import { api } from '../../lib/api';
import { Badge, Card, ErrorNote, SectionTitle, Spinner } from '../../components/ui';
import { useProject } from './projectContext';

export function ChecklistsView(): React.JSX.Element {
  const { project } = useProject();
  const [states, setStates] = useState<ChecklistState[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((): void => {
    api
      .invoke('checklists:getForProject', { projectId: project.id })
      .then(setStates)
      .catch((err: Error) => setError(err.message));
  }, [project.id]);

  useEffect(load, [load]);

  const toggle = async (checklistKind: string, itemId: string, done: boolean): Promise<void> => {
    try {
      const next = await api.invoke('checklists:toggleItem', { projectId: project.id, checklistKind, itemId, done });
      setStates(next);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (!states && !error) return <Spinner label="Lade Checklisten…" />;

  const requiredTotal = states?.reduce((sum, s) => sum + s.checklist.items.filter((i) => i.required).length, 0) ?? 0;
  const requiredDone =
    states?.reduce(
      (sum, s) => sum + s.checklist.items.filter((i) => i.required && s.completedItemIds.includes(i.id)).length,
      0,
    ) ?? 0;
  const releaseReady = requiredTotal > 0 && requiredDone === requiredTotal;

  return (
    <div className="space-y-5">
      <SectionTitle title="Checklisten" subtitle="Pflichtpunkte sind Release-Gates - keine Abkürzungen" />
      {error ? <ErrorNote message={error} /> : null}

      <Card className={`flex items-center gap-3 ${releaseReady ? 'border-good/40' : 'border-warn/40'}`}>
        <ShieldCheck className={`h-6 w-6 ${releaseReady ? 'text-good' : 'text-warn'}`} />
        <div>
          <p className="text-sm font-semibold text-mist-100">
            {releaseReady ? 'Release-bereit: alle Pflichtpunkte erledigt.' : `Noch ${requiredTotal - requiredDone} von ${requiredTotal} Pflichtpunkten offen.`}
          </p>
          <p className="text-xs text-mist-400">Der Publishing-Workflow erwartet, dass alle Pflichtpunkte abgehakt sind.</p>
        </div>
      </Card>

      {states?.map((state) => {
        const items = state.checklist.items;
        const done = state.completedItemIds;
        const requiredItems = items.filter((i) => i.required);
        const requiredDoneCount = requiredItems.filter((i) => done.includes(i.id)).length;
        const percent = items.length === 0 ? 0 : Math.round((done.length / items.length) * 100);
        return (
          <Card key={state.checklist.kind} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-mist-50">{state.checklist.title}</h3>
                <p className="text-xs text-mist-400">{state.checklist.description}</p>
              </div>
              <div className="text-right text-xs text-mist-400">
                <p>
                  {done.length}/{items.length} erledigt
                </p>
                <p>
                  Pflicht: {requiredDoneCount}/{requiredItems.length}
                </p>
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-ink-600">
              <div className="h-full rounded-full bg-forge-500" style={{ width: `${percent}%` }} />
            </div>
            <ul className="divide-y divide-ink-600">
              {items.map((item) => {
                const checked = done.includes(item.id);
                return (
                  <li key={item.id} className="flex items-start gap-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => void toggle(state.checklist.kind, item.id, e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-forge-500"
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${checked ? 'text-mist-400 line-through' : 'text-mist-100'}`}>
                        {item.title}
                        {item.required ? (
                          <span className="ml-2 align-middle">
                            <Badge tone="warn">Pflicht</Badge>
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-xs text-mist-400">{item.detail}</p>
                    </div>
                    {item.docsUrl ? (
                      <a
                        href={item.docsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 text-mist-400 hover:text-forge-300"
                        title="Offizielle Dokumentation öffnen"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}
