import React, { useCallback, useEffect, useState } from 'react';
import { Calculator, TrendingUp } from 'lucide-react';
import type { MonetizationProjection, MonetizationScenarioInput } from '@egf/core';
import { api } from '../../lib/api';
import { Card, ErrorNote, Field, SectionTitle, Spinner } from '../../components/ui';
import { useProject } from './projectContext';

function euro(v: number): string {
  return v.toLocaleString('de-DE', { maximumFractionDigits: 0 }) + ' €';
}

export function SimulatorView(): React.JSX.Element {
  const { project } = useProject();
  const [scenario, setScenario] = useState<MonetizationScenarioInput | null>(null);
  const [projection, setProjection] = useState<MonetizationProjection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const simulate = useCallback(async (input: MonetizationScenarioInput): Promise<void> => {
    setBusy(true);
    try {
      setProjection(await api.invoke('monetization:simulate', input));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    api
      .invoke('monetization:defaultScenario', { projectId: project.id })
      .then((defaults) => {
        setScenario(defaults);
        void simulate(defaults);
      })
      .catch((err: Error) => setError(err.message));
  }, [project.id, simulate]);

  if (!scenario) return error ? <ErrorNote message={error} /> : <Spinner label="Lade Szenario…" />;

  const set = (patch: Partial<MonetizationScenarioInput>): void => {
    const next = { ...scenario, ...patch };
    setScenario(next);
  };

  const numberField = (
    label: string,
    key: keyof MonetizationScenarioInput,
    opts: { step?: number; min?: number; max?: number; percent?: boolean; hint?: string } = {},
  ): React.JSX.Element => {
    const raw = scenario[key] as number;
    const value = opts.percent ? Math.round(raw * 1000) / 10 : raw;
    return (
      <Field label={label} hint={opts.hint}>
        <input
          type="number"
          className="input"
          value={value}
          step={opts.step ?? 1}
          min={opts.min ?? 0}
          max={opts.max}
          onChange={(e) => {
            const n = Number(e.target.value);
            set({ [key]: opts.percent ? n / 100 : n } as Partial<MonetizationScenarioInput>);
          }}
        />
      </Field>
    );
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Monetarisierungs-Simulator"
        subtitle="Szenarien durchrechnen: Annahmen rein, Bandbreiten und Hebel raus"
      />
      {error ? <ErrorNote message={error} /> : null}

      <Card className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {numberField('DAU (täglich aktive Spieler)', 'dailyActiveUsers', { step: 100, hint: 'Eingeschwungener Zustand' })}
          {numberField('D1-Retention (%)', 'd1Retention', { percent: true, step: 1, max: 100 })}
          {numberField('D7-Retention (%)', 'd7Retention', { percent: true, step: 1, max: 100 })}
          {numberField('D30-Retention (%)', 'd30Retention', { percent: true, step: 0.5, max: 100 })}
          {numberField('Zahler-Konversion/Monat (%)', 'payerConversionMonthly', { percent: true, step: 0.5, max: 100, hint: 'Branchenüblich 1-5%' })}
          {numberField('ARPPU/Monat (€)', 'arppuMonthlyEur', { step: 1 })}
          {(scenario.platform === 'mobile' || scenario.platform === 'both') && (
            <>
              {numberField('Ad-Impressions/DAU/Tag', 'adImpressionsPerDau', { step: 0.5 })}
              {numberField('eCPM (€)', 'ecpmEur', { step: 1 })}
            </>
          )}
        </div>
        <button className="btn-primary" onClick={() => void simulate(scenario)} disabled={busy}>
          <Calculator className="h-4 w-4" /> {busy ? 'Rechne…' : 'Simulieren'}
        </button>
      </Card>

      {projection ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                { label: 'Pessimistisch', value: projection.monthlyRevenueEur.pessimistic, tone: 'text-mist-300' },
                { label: 'Erwartet', value: projection.monthlyRevenueEur.expected, tone: 'text-forge-300' },
                { label: 'Optimistisch', value: projection.monthlyRevenueEur.optimistic, tone: 'text-good' },
              ] as const
            ).map((entry) => (
              <Card key={entry.label} className="py-5 text-center">
                <p className={`text-3xl font-bold ${entry.tone}`}>{euro(entry.value)}</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-mist-400">{entry.label} / Monat</p>
              </Card>
            ))}
          </div>

          {projection.warnings.length > 0 ? (
            <div className="space-y-1 rounded-lg border border-warn/40 bg-warn/5 px-3 py-2">
              {projection.warnings.map((warning, i) => (
                <p key={i} className="text-sm text-warn">
                  {warning}
                </p>
              ))}
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="mb-3 font-semibold text-mist-50">Umsatzpfade</h3>
              {projection.breakdown.length === 0 ? <p className="text-sm text-mist-400">Keine aktiven Umsatzpfade.</p> : null}
              <ul className="space-y-3">
                {projection.breakdown.map((entry) => (
                  <li key={entry.source} className="rounded-lg border border-ink-600 bg-ink-850 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-mist-100">{entry.source}</p>
                      <p className="text-sm font-bold text-forge-300">{euro(entry.monthlyEur.expected)}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-mist-400">
                      {euro(entry.monthlyEur.pessimistic)} – {euro(entry.monthlyEur.optimistic)} · {entry.note}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>

            <div className="space-y-4">
              <Card>
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-mist-50">
                  <TrendingUp className="h-4 w-4 text-forge-300" /> Sensitivität: Was lohnt sich?
                </h3>
                <ul className="space-y-2 text-sm">
                  {projection.sensitivity.map((entry, i) => (
                    <li key={i}>
                      <p className="font-medium text-mist-100">{entry.lever}</p>
                      <p className="text-xs text-mist-400">{entry.effect}</p>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card>
                <h3 className="mb-2 font-semibold text-mist-50">Annahmen</h3>
                <ul className="list-inside list-disc space-y-1 text-xs text-mist-400">
                  {projection.assumptions.map((assumption, i) => (
                    <li key={i}>{assumption}</li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>

          <p className="text-xs text-mist-500">
            Der Simulator projiziert Bandbreiten aus DEINEN Annahmen - er verspricht keine Umsätze. Nutze ihn, um Hebel zu vergleichen und Szenarien zu diskutieren; die Wahrheit liefern Launch-Daten.
          </p>
        </>
      ) : null}
    </div>
  );
}
