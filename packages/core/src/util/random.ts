/**
 * Deterministic, seedable PRNG (mulberry32).
 * Generators use this so idea/GDD output is reproducible for a given seed -
 * important for tests and for "regenerate with same seed" UX.
 */
export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number;
  /** Pick one element. Throws on empty array. */
  pick<T>(items: readonly T[]): T;
  /** Pick n distinct elements (n clamped to items.length). */
  pickMany<T>(items: readonly T[], n: number): T[];
  /** True with probability p. */
  chance(p: number): boolean;
  /** Fisher-Yates shuffle (returns a new array). */
  shuffle<T>(items: readonly T[]): T[];
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  if (state === 0) state = 0x9e3779b9;

  const next = (): number => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const rng: Rng = {
    next,
    int(min, max) {
      if (max < min) throw new Error(`int(): max (${max}) < min (${min})`);
      return min + Math.floor(next() * (max - min + 1));
    },
    pick(items) {
      if (items.length === 0) throw new Error('pick(): empty array');
      return items[Math.floor(next() * items.length)] as (typeof items)[number];
    },
    pickMany(items, n) {
      return rng.shuffle(items).slice(0, Math.max(0, Math.min(n, items.length)));
    },
    chance(p) {
      return next() < p;
    },
    shuffle(items) {
      const arr = [...items];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        const tmp = arr[i] as (typeof arr)[number];
        arr[i] = arr[j] as (typeof arr)[number];
        arr[j] = tmp;
      }
      return arr;
    },
  };
  return rng;
}

/** Derive a numeric seed from an arbitrary string (FNV-1a). */
export function seedFromString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
