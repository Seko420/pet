import { describe, expect, it } from 'vitest';
import { simulateMonetization, type MonetizationScenarioInput } from '../src/monetization/index';

const base: MonetizationScenarioInput = {
  platform: 'mobile',
  monetization: ['iap_consumables', 'rewarded_ads'],
  dailyActiveUsers: 1000,
  d1Retention: 0.35,
  d7Retention: 0.12,
  d30Retention: 0.05,
  payerConversionMonthly: 0.02,
  arppuMonthlyEur: 9,
  adImpressionsPerDau: 2,
  ecpmEur: 12,
  kidsAudience: false,
};

describe('monetization simulator', () => {
  it('produces ordered ranges and scales with DAU', () => {
    const small = simulateMonetization(base);
    const big = simulateMonetization({ ...base, dailyActiveUsers: 10000 });
    expect(small.monthlyRevenueEur.pessimistic).toBeLessThanOrEqual(small.monthlyRevenueEur.expected);
    expect(small.monthlyRevenueEur.expected).toBeLessThanOrEqual(small.monthlyRevenueEur.optimistic);
    expect(big.monthlyRevenueEur.expected).toBeGreaterThan(small.monthlyRevenueEur.expected * 5);
    expect(small.breakdown.length).toBe(2);
  });

  it('warns for kids+ads and reduces the ad projection', () => {
    const normal = simulateMonetization(base);
    const kids = simulateMonetization({ ...base, kidsAudience: true });
    expect(kids.warnings.join(' ')).toMatch(/Kinder/);
    const adRevenue = (p: typeof normal) => p.breakdown.find((b) => b.source.includes('Werbung'))!.monthlyEur.expected;
    expect(adRevenue(kids)).toBeLessThan(adRevenue(normal));
  });

  it('uses the robux path for roblox projects and ignores mobile ads there', () => {
    const roblox = simulateMonetization({
      ...base,
      platform: 'roblox',
      monetization: ['game_passes', 'rewarded_ads'],
    });
    expect(roblox.breakdown.some((b) => b.source.includes('DevEx'))).toBe(true);
    expect(roblox.breakdown.some((b) => b.source.includes('Werbung'))).toBe(false);
    expect(roblox.warnings.join(' ')).toMatch(/Ads werden ignoriert/);
  });

  it('warns when no revenue path exists and when inputs are implausible', () => {
    const none = simulateMonetization({ ...base, monetization: [] });
    expect(none.monthlyRevenueEur.expected).toBe(0);
    expect(none.warnings.length).toBeGreaterThan(0);
    const greedy = simulateMonetization({ ...base, payerConversionMonthly: 0.2 });
    expect(greedy.warnings.join(' ')).toMatch(/optimistisch/);
  });

  it('is deterministic', () => {
    expect(simulateMonetization(base)).toEqual(simulateMonetization(base));
  });
});
