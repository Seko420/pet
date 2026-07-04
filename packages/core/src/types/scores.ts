import type { LabeledScore } from './common';

/**
 * The Quality & Market Potential system.
 * Every dimension is 0..100 with a written justification.
 * No score promises revenue - it ranks relative potential and surfaces
 * concrete improvement levers.
 */
export interface QualityScores {
  fun: LabeledScore;
  retention: LabeledScore;
  monetization: LabeledScore;
  viralPotential: LabeledScore;
  productionFeasibility: LabeledScore;
  robloxFit: LabeledScore;
  mobileFit: LabeledScore;
  technicalRisk: LabeledScore;
  contentScalability: LabeledScore;
  multiplayerPotential: LabeledScore;
  liveOpsPotential: LabeledScore;
  /** Weighted aggregate, 0..100. */
  overall: number;
}

export type ScoreDimension = Exclude<keyof QualityScores, 'overall'>;

export const SCORE_DIMENSION_LABELS: Record<ScoreDimension, string> = {
  fun: 'Fun',
  retention: 'Retention',
  monetization: 'Monetarisierung',
  viralPotential: 'Virales Potenzial',
  productionFeasibility: 'Produktion machbar',
  robloxFit: 'Roblox Fit',
  mobileFit: 'Mobile Fit',
  technicalRisk: 'Technisches Risiko (hoch = sicher)',
  contentScalability: 'Content-Skalierbarkeit',
  multiplayerPotential: 'Multiplayer-Potenzial',
  liveOpsPotential: 'LiveOps-Potenzial',
};

export type SuggestionCategory =
  | 'first_minute'
  | 'tutorial'
  | 'retention'
  | 'monetization'
  | 'cut_feature'
  | 'high_impact_feature'
  | 'risk'
  | 'engagement_fairness';

export interface ImprovementSuggestion {
  category: SuggestionCategory;
  title: string;
  detail: string;
  /** Expected impact 1 (nice-to-have) .. 5 (game-changing). */
  impact: 1 | 2 | 3 | 4 | 5;
  /** Effort 1 (hours) .. 5 (weeks). */
  effort: 1 | 2 | 3 | 4 | 5;
}

export interface ScoreEvaluation {
  scores: QualityScores;
  suggestions: ImprovementSuggestion[];
  evaluatedAt: string;
}
