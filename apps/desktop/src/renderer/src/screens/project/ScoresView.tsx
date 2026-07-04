import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { ScoreDimension, ScoreEvaluation } from '@egf/core';
import { SCORE_DIMENSION_LABELS } from '@egf/core';
import { api } from '../../lib/api';
import { SUGGESTION_CATEGORY_LABELS } from '../../lib/labels';
import { Badge, Card, ErrorNote, ScoreBar, SectionTitle, Spinner, scoreTone } from '../../components/ui';
import { useProject } from './projectContext';

const DIMENSIONS: ScoreDimension[] = [
  'fun',
  'retention',
  'monetization',
  'viralPotential',
  'productionFeasibility',
  'robloxFit',
  'mobileFit',
  'technicalRisk',
  'contentScalability',
  'multiplayerPotential',
  'liveOpsPotential',
];

function Dots({ value, max = 5 }: { value: number; max?: number }): React.JSX.Element {
  return (
    <span className="font-mono text-xs tracking-tight text-mist-300">
      {'●'.repeat(value)}
      {'○'.repeat(Math.max(0, max - value))}
    </span>
  );
}

export function ScoresView(): React.JSX.Element {
  const { project, refresh } = useProject();
  const [evaluation, setEvaluation] = useState<ScoreEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const evaluate = useCallback(async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      const result = await api.invoke('scores:evaluateProject', { projectId: project.id });
      setEvaluation(result);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }, [project.id, refresh]);

  useEffect(() => {
    void evaluate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  if (!evaluation && !error) return <Spinner label="Bewerte Konzept…" />;

  const overall = evaluation?.scores.overall ?? 0;
  const verdict = overall >= 70 ? 'Starkes Potenzial' : overall >= 45 ? 'Solide Basis - gezielt schärfen' : 'Konzept schärfen, bevor Produktionszeit fließt';

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Qualität & Marktpotenzial"
        subtitle="11 Dimensionen, heuristisch bewertet - mit konkreten Hebeln"
        actions={
          <button className="btn-secondary" onClick={() => void evaluate()} disabled={busy}>
            <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} /> Neu bewerten
          </button>
        }
      />
      {error ? <ErrorNote message={error} /> : null}

      {evaluation ? (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <Card className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <p
              className={`text-6xl font-bold ${
                scoreTone(overall) === 'good' ? 'text-good' : scoreTone(overall) === 'warn' ? 'text-warn' : 'text-bad'
              }`}
            >
              {overall}
            </p>
            <p className="text-xs uppercase tracking-widest text-mist-400">Gesamt-Score</p>
            <p className="max-w-52 text-sm text-mist-300">{verdict}</p>
          </Card>

          <Card className="space-y-4">
            {DIMENSIONS.map((dim) => {
              const score = evaluation.scores[dim];
              return (
                <div key={dim}>
                  <ScoreBar label={SCORE_DIMENSION_LABELS[dim]} value={score.value} />
                  <p className="mt-1 text-xs text-mist-400">{score.reason}</p>
                </div>
              );
            })}
          </Card>
        </div>
      ) : null}

      {evaluation && evaluation.suggestions.length > 0 ? (
        <div>
          <SectionTitle title="Verbesserungshebel" subtitle="Sortiert nach Wirkung pro Aufwand" />
          <div className="grid gap-3 md:grid-cols-2">
            {evaluation.suggestions.map((suggestion, i) => (
              <Card key={i} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone="accent">{SUGGESTION_CATEGORY_LABELS[suggestion.category]}</Badge>
                  <span className="text-xs text-mist-400">
                    Impact <Dots value={suggestion.impact} /> · Aufwand <Dots value={suggestion.effort} />
                  </span>
                </div>
                <p className="text-sm font-semibold text-mist-100">{suggestion.title}</p>
                <p className="text-sm text-mist-300">{suggestion.detail}</p>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      <p className="text-xs text-mist-500">
        Scores sind heuristische Einschätzungen zur Priorisierung deiner Arbeit - kein Umsatzversprechen. Die Wahrheit liefern Playtests und Analytics.
      </p>
    </div>
  );
}
