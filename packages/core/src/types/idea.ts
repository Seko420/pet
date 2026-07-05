import type {
  Audience,
  EffortLevel,
  Genre,
  IsoDateTime,
  MonetizationModel,
  RiskLevel,
  TargetPlatform,
} from './common';
import type { QualityScores } from './scores';

/** Constraints the user picks before generating ideas. */
export interface IdeaBrief {
  platform: TargetPlatform;
  genres: Genre[];
  audience: Audience;
  monetizationFocus: MonetizationModel[];
  /** How much production effort the user is willing to invest. */
  maxEffort: EffortLevel;
  multiplayer: 'required' | 'preferred' | 'no' | 'any';
  /** Free-text theme wishes, e.g. "Unterwasser", "Pets", "Anime-Style". */
  themeHints?: string;
  /** How many ideas to generate (1..10). */
  count: number;
  /** Optional seed for reproducible generation. */
  seed?: number;
  /** Use the configured AI provider instead of the offline engine. */
  useAi?: boolean;
}

export interface IdeaRisk {
  title: string;
  level: RiskLevel;
  mitigation: string;
}

/** A fully worked-out game idea, as produced by the Idea Generator. */
export interface GameIdea {
  id: string;
  createdAt: IsoDateTime;
  brief: IdeaBrief;

  title: string;
  elevatorPitch: string;
  coreLoop: string[];
  audience: Audience;
  audienceNotes: string;
  usp: string;
  genre: Genre;
  platform: TargetPlatform;
  theme: string;

  monetization: {
    model: MonetizationModel;
    description: string;
  }[];

  risks: IdeaRisk[];
  developmentEffort: EffortLevel;
  effortBreakdown: string;

  whyItCouldSucceed: string[];
  whyItCouldFail: string[];

  /** A sharper, improved variant of the same idea. */
  improvedVersion: {
    title: string;
    changes: string[];
    pitch: string;
  };

  /** Potential ratings used for ranking in the Idea Lab. */
  scores: QualityScores;

  /** Set when the idea has been promoted to a project. */
  projectId?: string | null;

  /** How this idea was produced ('heuristic' = offline engine, 'ai' = LLM). */
  source?: 'heuristic' | 'ai';
}
