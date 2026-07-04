import type { MonetizationModel, TargetPlatform } from '../types/common';
import type { GameProject } from '../types/project';

/**
 * Monetization simulator.
 *
 * HONESTY CONTRACT: this is a planning tool, not a promise. It projects
 * ranges from explicit assumptions and tells you which levers matter most.
 * All money values are EUR per month at steady state.
 */

export interface MonetizationScenarioInput {
  platform: TargetPlatform;
  monetization: MonetizationModel[];
  /** Steady-state daily active users. */
  dailyActiveUsers: number;
  /** Retention rates 0..1 (used for plausibility + sensitivity, not revenue math). */
  d1Retention: number;
  d7Retention: number;
  d30Retention: number;
  /** Share of DAU that pays in a month, 0..1. */
  payerConversionMonthly: number;
  /** Average revenue per paying user per month (EUR, across IAP/passes). */
  arppuMonthlyEur: number;
  /** Mobile ads: rewarded/interstitial impressions per DAU per day. */
  adImpressionsPerDau: number;
  /** Effective CPM in EUR (per 1000 impressions). */
  ecpmEur: number;
  /** Kids/family audience toggles stricter warnings. */
  kidsAudience: boolean;
}

export interface RevenueRange {
  pessimistic: number;
  expected: number;
  optimistic: number;
}

export interface MonetizationProjection {
  monthlyRevenueEur: RevenueRange;
  breakdown: { source: string; monthlyEur: RevenueRange; note: string }[];
  assumptions: string[];
  warnings: string[];
  sensitivity: { lever: string; effect: string }[];
}

const ROBUX_TO_EUR = 0.0032; // DevEx ~0.0035 USD/Robux, umgerechnet; als Annahme ausgewiesen

function round(v: number): number {
  return Math.round(v);
}

function range(expected: number, spread: number): RevenueRange {
  return {
    pessimistic: round(expected * (1 - spread)),
    expected: round(expected),
    optimistic: round(expected * (1 + spread)),
  };
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function defaultScenarioForProject(project: GameProject): MonetizationScenarioInput {
  const kids = project.audience === 'kids_8_12' || project.audience === 'family';
  return {
    platform: project.platform,
    monetization: project.monetization,
    dailyActiveUsers: 1000,
    d1Retention: 0.35,
    d7Retention: 0.12,
    d30Retention: 0.05,
    payerConversionMonthly: kids ? 0.015 : 0.02,
    arppuMonthlyEur: project.platform === 'roblox' ? 6 : 9,
    adImpressionsPerDau: 2,
    ecpmEur: 12,
    kidsAudience: kids,
  };
}

export function simulateMonetization(input: MonetizationScenarioInput): MonetizationProjection {
  const dau = Math.max(0, input.dailyActiveUsers);
  const conversion = clamp01(input.payerConversionMonthly);
  const warnings: string[] = [];
  const assumptions: string[] = [];
  const breakdown: MonetizationProjection['breakdown'] = [];

  const hasAds =
    input.monetization.includes('rewarded_ads') || input.monetization.includes('interstitial_ads');
  const hasIap = input.monetization.some((m) =>
    ['iap_consumables', 'iap_non_consumables', 'battle_pass', 'cosmetics', 'subscription', 'paid_app'].includes(m),
  );
  const hasRobux =
    input.monetization.includes('game_passes') || input.monetization.includes('developer_products');
  const hasPremiumPayouts = input.monetization.includes('premium_payouts');
  const wantsMobile = input.platform === 'mobile' || input.platform === 'both';
  const wantsRoblox = input.platform === 'roblox' || input.platform === 'both';

  // --- plausibility checks -> warnings, not silent corrections
  if (conversion > 0.08) {
    warnings.push(
      `Zahler-Konversion von ${(conversion * 100).toFixed(1)}% ist sehr optimistisch - branchenüblich sind 1-5%. Rechne zusätzlich ein konservatives Szenario.`,
    );
  }
  if (input.d1Retention < 0.25) {
    warnings.push('D1-Retention unter 25%: Monetarisierung ist zweitrangig - zuerst die erste Minute und das Onboarding fixen.');
  }
  if (hasAds && input.kidsAudience) {
    warnings.push('Werbung bei Kinder-Zielgruppe: rechtlich heikel (COPPA/Families Policy) und von Eltern schlecht akzeptiert - Projektion für Ads bewusst reduziert.');
  }
  if (hasAds && wantsRoblox && !wantsMobile) {
    warnings.push('Reines Roblox-Projekt: klassische Mobile-Ads existieren dort nicht als Umsatzpfad - Ads werden ignoriert.');
  }

  // --- IAP / direct purchases (mobile)
  if (hasIap && wantsMobile) {
    const payers = dau * conversion;
    const gross = payers * input.arppuMonthlyEur;
    const net = gross * 0.7; // Store-Abgabe ~30%
    breakdown.push({
      source: 'In-App-Käufe (Mobile)',
      monthlyEur: range(net, 0.45),
      note: `${round(payers)} Zahler × ${input.arppuMonthlyEur.toFixed(2)} € ARPPU, abzüglich ~30% Store-Gebühr.`,
    });
    assumptions.push('Store-Gebühr: 30% (Google Play/App Store Standardsatz).');
  }

  // --- Ads (mobile)
  if (hasAds && wantsMobile) {
    const kidsFactor = input.kidsAudience ? 0.4 : 1; // kontextuelle statt personalisierte Ads
    const impressionsMonthly = dau * input.adImpressionsPerDau * 30;
    const net = (impressionsMonthly / 1000) * input.ecpmEur * kidsFactor;
    breakdown.push({
      source: 'Werbung (Rewarded/Interstitial)',
      monthlyEur: range(net, 0.5),
      note: `${input.adImpressionsPerDau} Impressions/DAU/Tag bei ${input.ecpmEur.toFixed(2)} € eCPM${input.kidsAudience ? ', reduziert wegen Kinder-Zielgruppe (nur kontextuelle Ads)' : ''}.`,
    });
    assumptions.push('eCPM schwankt stark nach Region, Format und Saison (±50% eingerechnet).');
  }

  // --- Robux (roblox)
  if (hasRobux && wantsRoblox) {
    const payers = dau * conversion;
    const arppuRobux = (input.arppuMonthlyEur / ROBUX_TO_EUR) * 0.7; // Spieler kaufen Robux, Roblox behält Marketplace-Anteil
    const devexEur = payers * arppuRobux * ROBUX_TO_EUR;
    breakdown.push({
      source: 'Game Passes & Developer Products (Robux → DevEx)',
      monthlyEur: range(devexEur, 0.5),
      note: `${round(payers)} zahlende Spieler; Robux-Erlöse nach Marketplace-Anteil, ausgezahlt über DevEx (~${ROBUX_TO_EUR.toFixed(4)} €/Robux).`,
    });
    assumptions.push('DevEx-Kurs als Annahme: ~0,0035 USD/Robux (≈0,0032 €); Roblox-Marketplace-Anteil ~30% einberechnet.');
  }

  // --- Premium payouts (roblox)
  if (hasPremiumPayouts && wantsRoblox) {
    const premiumShare = 0.1; // Anteil Premium-Spieler
    const minutesPerDau = 25;
    const eurPerPremiumHour = 0.06; // grobe Engagement-Payout-Annahme
    const net = dau * premiumShare * (minutesPerDau / 60) * eurPerPremiumHour * 30;
    breakdown.push({
      source: 'Premium Payouts (Engagement)',
      monthlyEur: range(net, 0.6),
      note: `${(premiumShare * 100).toFixed(0)}% Premium-Spieler × ${minutesPerDau} Min/Tag Engagement-Zeit.`,
    });
    assumptions.push('Premium Payouts hängen stark von Engagement-Zeit der Premium-Spieler ab - Annahmen bewusst grob.');
  }

  if (breakdown.length === 0) {
    warnings.push('Für die gewählte Plattform/Monetarisierungs-Kombination gibt es keinen aktiven Umsatzpfad - Monetarisierungsmodelle im Projekt prüfen.');
  }

  const total: RevenueRange = breakdown.reduce(
    (sum, entry) => ({
      pessimistic: sum.pessimistic + entry.monthlyEur.pessimistic,
      expected: sum.expected + entry.monthlyEur.expected,
      optimistic: sum.optimistic + entry.monthlyEur.optimistic,
    }),
    { pessimistic: 0, expected: 0, optimistic: 0 },
  );

  assumptions.push(
    `Basis: ${dau} DAU stabil über den Monat, ${(conversion * 100).toFixed(1)}% Zahler-Konversion.`,
    'Alle Werte sind Monatswerte in EUR bei eingeschwungenem Zustand - kein Launch-Spike, kein Wachstum eingerechnet.',
  );

  const sensitivity: MonetizationProjection['sensitivity'] = [
    {
      lever: 'D1-Retention +5 Prozentpunkte',
      effect: 'Vergrößert die aktive Basis nachhaltig - wirkt auf JEDEN Umsatzpfad, typischerweise der stärkste Hebel.',
    },
    {
      lever: 'Zahler-Konversion +1 Prozentpunkt',
      effect: hasIap || hasRobux ? `≈ +${round(total.expected * (0.01 / Math.max(conversion, 0.005)))} €/Monat auf Kauf-Umsätze (linear).` : 'Ohne Kauf-Pfad wirkungslos.',
    },
    {
      lever: 'Erstkauf-Angebot (Starter-Bundle)',
      effect: 'Hebt erfahrungsgemäß primär die Konversion, nicht den ARPPU - fair gestaltbar.',
    },
    ...(hasAds && wantsMobile
      ? [{ lever: 'eCPM +20% (bessere Placements)', effect: 'Wirkt linear auf Ad-Umsatz; Rewarded-Placements an Belohnungsmomenten sind der übliche Weg.' }]
      : []),
  ];

  return { monthlyRevenueEur: total, breakdown, assumptions, warnings, sensitivity };
}
