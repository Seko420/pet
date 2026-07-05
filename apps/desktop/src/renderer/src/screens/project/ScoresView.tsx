import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import type { ScoreDimension, ScoreEvaluation } from '@egf/core';
import { SCORE_DIMENSION_LABELS } from '@egf/core';
import type { AiQualityReview } from '@shared/ipc';
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
  const [aiReview, setAiReview] = useState<AiQualityReview | null>(null);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
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
    api.invoke('scores:getAiReview', { projectId: project.id }).then(setAiReview).catch(() => undefined);
    api.invoke('ai:status', undefined).then((s) => setAiConfigured(s.configured)).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  const runAiReview = async (): Promise<void> => {
    if (!window.confirm('KI-Tiefenanalyse starten? Die KI liest Projektsteckbrief, GDD-Auszug und offene Aufgaben (verursacht bei Cloud-Anbietern API-Kosten).')) return;
    setReviewBusy(true);
    setError(null);
    try {
      setAiReview(await api.invoke('scores:aiReview', { projectId: project.id }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setReviewBusy(false);
    }
  };

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

      <div>
        <SectionTitle
          title="KI-Tiefenanalyse"
          subtitle="Qualitative Zweitmeinung der KI - ergänzt die Heuristik-Scores"
          actions={
            <button className="btn-primary" onClick={() => void runAiReview()} disabled={reviewBusy || !aiConfigured} title={aiConfigured ? '' : 'KI-Schlüssel in den Einstellungen hinterlegen'}>
              <Sparkles className="h-4 w-4" /> {reviewBusy ? 'KI analysiert…' : aiReview ? 'Neu analysieren' : 'KI-Analyse starten'}
            </button>
          }
        />
        {!aiConfigured && !aiReview ? (
          <p className="text-sm text-mist-500">
            Für die Tiefenanalyse wird eine echte KI benötigt - Schlüssel oder kostenlose lokale KI in den Einstellungen verbinden.
          </p>
        ) : null}
        {aiReview ? (
          <div className="space-y-3">
            <Card>
              <p className="text-sm text-mist-200">{aiReview.summary}</p>
              <p className="mt-2 text-xs text-mist-500">Modell: {aiReview.model}</p>
            </Card>
            <div className="grid gap-3 md:grid-cols-2">
              <Card>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-good">Stärken</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-mist-300">
                  {aiReview.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </Card>
              <Card>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-bad">Schwächen</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-mist-300">
                  {aiReview.weaknesses.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </Card>
            </div>
            {aiReview.firstMinute ? (
              <Card>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-forge-300">Erste Spielminute</p>
                <p className="text-sm text-mist-300">{aiReview.firstMinute}</p>
              </Card>
            ) : null}
            {aiReview.suggestions.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {aiReview.suggestions.map((s, i) => (
                  <Card key={i} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-mist-100">{s.title}</p>
                      <Badge tone="accent">Impact {s.impact}/5</Badge>
                    </div>
                    <p className="text-sm text-mist-300">{s.detail}</p>
                  </Card>
                ))}
              </div>
            ) : null}
            {aiReview.risks.length > 0 ? (
              <Card>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-warn">Risiken</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-mist-300">
                  {aiReview.risks.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </Card>
            ) : null}
          </div>
        ) : null}
      </div>

      <p className="text-xs text-mist-500">
        Scores sind heuristische Einschätzungen zur Priorisierung deiner Arbeit - kein Umsatzversprechen. Die Wahrheit liefern Playtests und Analytics.
      </p>
    </div>
  );
}
