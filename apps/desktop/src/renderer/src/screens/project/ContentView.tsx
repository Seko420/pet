import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Package, Sparkles, Trash2 } from 'lucide-react';
import type { ContentCategory, ContentItem, ContentItemStatus } from '@egf/core';
import { CONTENT_CATEGORY_LABELS } from '@egf/core';
import { api } from '../../lib/api';
import { Card, EmptyState, ErrorNote, SectionTitle, Spinner } from '../../components/ui';
import { useConfirm } from '../../components/ConfirmDialog';
import { useProject } from './projectContext';

const RARITY_STYLES: Record<string, string> = {
  common: 'bg-ink-600 text-mist-300',
  uncommon: 'bg-good/15 text-good',
  rare: 'bg-forge-500/20 text-forge-300',
  epic: 'bg-purple-500/20 text-purple-300',
  legendary: 'bg-warn/20 text-warn',
};

const STATUS_LABELS: Record<ContentItemStatus, string> = {
  planned: 'Geplant',
  in_progress: 'In Arbeit',
  done: 'Fertig',
};

export function ContentView(): React.JSX.Element {
  const { project } = useProject();
  const confirmDialog = useConfirm();
  const [items, setItems] = useState<ContentItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback((): void => {
    api
      .invoke('content:listForProject', { projectId: project.id })
      .then(setItems)
      .catch((err: Error) => setError(err.message));
  }, [project.id]);
  useEffect(load, [load]);

  const generate = async (): Promise<void> => {
    setBusy(true);
    try {
      const next = await api.invoke('content:generatePlan', { projectId: project.id });
      setItems(next);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const update = async (id: string, patch: Partial<ContentItem>): Promise<void> => {
    try {
      await api.invoke('content:update', { id, patch });
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const remove = async (item: ContentItem): Promise<void> => {
    const ok = await confirmDialog({
      title: 'Content-Eintrag löschen?',
      message: `„${item.name}" wird aus dem Content-Plan entfernt.`,
      confirmLabel: 'Löschen',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.invoke('content:delete', { id: item.id });
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const groups = useMemo(() => {
    const map = new Map<ContentCategory, ContentItem[]>();
    for (const item of items ?? []) {
      map.set(item.category, [...(map.get(item.category) ?? []), item]);
    }
    return [...map.entries()];
  }, [items]);

  if (!items && !error) return <Spinner label="Lade Content-Plan…" />;

  const counts = { planned: 0, in_progress: 0, done: 0 };
  for (const item of items ?? []) counts[item.status]++;

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Asset- & Content-Plan"
        subtitle={`${counts.planned} geplant · ${counts.in_progress} in Arbeit · ${counts.done} fertig`}
        actions={
          <button className="btn-primary" onClick={() => void generate()} disabled={busy}>
            <Sparkles className="h-4 w-4" /> {items && items.length > 0 ? 'Plan erweitern' : 'Content-Plan generieren'}
          </button>
        }
      />
      {error ? <ErrorNote message={error} /> : null}

      <div className="rounded-lg border border-warn/30 bg-warn/5 px-3 py-2 text-xs text-warn">
        Alle Inhalte müssen Originale sein — keine fremden Marken, Charaktere, Sounds oder Designs kopieren.
      </div>

      {items && items.length === 0 ? (
        <EmptyState
          icon={<Package className="h-10 w-10" />}
          title="Noch kein Content-Plan"
          description="Generiert eine genre-passende Liste aus Charakteren, Items, Leveln, Quests, Store-Assets und mehr."
          action={
            <button className="btn-primary" onClick={() => void generate()} disabled={busy}>
              {busy ? 'Generiere…' : 'Content-Plan generieren'}
            </button>
          }
        />
      ) : null}

      {groups.map(([category, groupItems]) => (
        <Card key={category} className="space-y-1">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-mist-400">
            {CONTENT_CATEGORY_LABELS[category]} <span className="text-mist-500">({groupItems.length})</span>
          </h3>
          <ul className="divide-y divide-ink-600">
            {groupItems.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-mist-100">
                    {item.name}
                    {item.rarity ? (
                      <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${RARITY_STYLES[item.rarity] ?? RARITY_STYLES.common}`}>
                        {item.rarity}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-mist-400" title={item.description}>
                    {item.description}
                  </p>
                </div>
                <select
                  className="input w-32 shrink-0 py-1 text-xs"
                  value={item.status}
                  onChange={(e) => void update(item.id, { status: e.target.value as ContentItemStatus })}
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <button className="btn-ghost shrink-0 px-2 py-1 text-bad" onClick={() => void remove(item)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
