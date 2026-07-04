import React, { useEffect, useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import type { AnalyticsEventCategory, AnalyticsPlan } from '@egf/core';
import { api } from '../../lib/api';
import { Badge, Card, EmptyState, ErrorNote, SectionTitle, Spinner, type BadgeTone } from '../../components/ui';
import { useProject } from './projectContext';

const CATEGORY_LABELS: Record<AnalyticsEventCategory, string> = {
  onboarding: 'Onboarding',
  progression: 'Progression',
  economy: 'Economy',
  monetization: 'Monetarisierung',
  engagement: 'Engagement',
  churn_signal: 'Abbruch-Signal',
};

const KIND_TONES: Record<string, BadgeTone> = {
  event: 'accent',
  content_drop: 'good',
  sale: 'warn',
  season_start: 'accent',
  season_end: 'neutral',
  ab_test: 'bad',
};

const KIND_LABELS: Record<string, string> = {
  event: 'Event',
  content_drop: 'Content-Drop',
  sale: 'Aktion',
  season_start: 'Season-Start',
  season_end: 'Season-Ende',
  ab_test: 'A/B-Test',
};

export function AnalyticsView(): React.JSX.Element {
  const { project } = useProject();
  const [plan, setPlan] = useState<AnalyticsPlan | null | 'loading'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .invoke('analytics:getPlan', { projectId: project.id })
      .then((loaded) => setPlan(loaded))
      .catch((err: Error) => {
        setError(err.message);
        setPlan(null);
      });
  }, [project.id]);

  const generate = async (): Promise<void> => {
    setBusy(true);
    try {
      const next = await api.invoke('analytics:generatePlan', { projectId: project.id });
      setPlan(next);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (plan === 'loading') return <Spinner label="Lade Analytics-Plan…" />;

  if (!plan) {
    return (
      <div className="space-y-4">
        {error ? <ErrorNote message={error} /> : null}
        <EmptyState
          icon={<BarChart3 className="h-10 w-10" />}
          title="Noch kein Analytics- & LiveOps-Plan"
          description="Erzeugt den Event-Katalog (Onboarding bis Monetarisierung), einen 12-Wochen-LiveOps-Kalender, A/B-Test-Ideen und Balancing-Notizen."
          action={
            <button className="btn-primary" onClick={() => void generate()} disabled={busy}>
              {busy ? 'Generiere…' : 'Analytics-Plan generieren'}
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Analytics & LiveOps"
        subtitle={`${plan.events.length} Events · 12-Wochen-Kalender · ${plan.abTests.length} A/B-Tests`}
        actions={
          <button
            className="btn-secondary"
            disabled={busy}
            onClick={() => {
              if (window.confirm('Plan neu generieren? Der bestehende Plan wird ersetzt.')) void generate();
            }}
          >
            <RefreshCw className="h-4 w-4" /> Neu generieren
          </button>
        }
      />
      {error ? <ErrorNote message={error} /> : null}

      <Card>
        <h3 className="mb-3 font-semibold text-mist-50">Event-Katalog</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-600 text-left text-xs uppercase tracking-wide text-mist-400">
                <th className="py-2 pr-3">Event</th>
                <th className="py-2 pr-3">Kategorie</th>
                <th className="py-2 pr-3">Parameter</th>
                <th className="py-2">Zweck</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-600/60">
              {plan.events.map((event) => (
                <tr key={event.name} className="align-top">
                  <td className="py-2 pr-3">
                    <code className="rounded bg-ink-950 px-1.5 py-0.5 text-xs text-forge-300">{event.name}</code>
                    <p className="mt-1 text-xs text-mist-400">{event.description}</p>
                  </td>
                  <td className="py-2 pr-3">
                    <Badge>{CATEGORY_LABELS[event.category]}</Badge>
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex max-w-52 flex-wrap gap-1">
                      {Object.entries(event.parameters).map(([key, description]) => (
                        <span key={key} title={description} className="rounded bg-ink-700 px-1.5 py-0.5 text-[10px] text-mist-300">
                          {key}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2 text-xs text-mist-300">{event.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-semibold text-mist-50">LiveOps-Kalender (12 Wochen ab Launch)</h3>
          <ol className="space-y-2">
            {plan.liveOpsCalendar.map((entry, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-16 shrink-0 pt-0.5 text-xs font-semibold text-mist-400">Woche {entry.week}</span>
                <div>
                  <p className="text-sm font-medium text-mist-100">
                    <Badge tone={KIND_TONES[entry.kind] ?? 'neutral'}>{KIND_LABELS[entry.kind] ?? entry.kind}</Badge>
                    <span className="ml-2">{entry.title}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-mist-400">{entry.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <div className="space-y-4">
          <Card>
            <h3 className="mb-3 font-semibold text-mist-50">A/B-Test-Ideen</h3>
            <div className="space-y-3">
              {plan.abTests.map((test) => (
                <div key={test.name} className="rounded-lg border border-ink-600 bg-ink-850 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-mist-100">{test.name}</p>
                    <Badge tone="accent">{test.primaryMetric}</Badge>
                  </div>
                  <p className="mt-1 text-xs italic text-mist-400">{test.hypothesis}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded bg-ink-700 p-2 text-mist-300">
                      <span className="font-semibold text-mist-100">A: </span>
                      {test.variantA}
                    </div>
                    <div className="rounded bg-ink-700 p-2 text-mist-300">
                      <span className="font-semibold text-mist-100">B: </span>
                      {test.variantB}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="mb-2 font-semibold text-mist-50">Balancing-Notizen</h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-mist-300">
              {plan.balancingNotes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
