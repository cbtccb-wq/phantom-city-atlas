/**
 * Seeded pseudo-random number generator (mulberry32)
 * Same seed → identical sequence, always.
 */
export function createRng(seed: number) {
  let s = seed >>> 0;

  function next(): number {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    /** [0, 1) */
    next,
    /** [min, max) */
    range(min: number, max: number): number {
      return min + next() * (max - min);
    },
    /** integer [min, max] */
    int(min: number, max: number): number {
      return Math.floor(min + next() * (max - min + 1));
    },
    /** pick random element */
    pick<T>(arr: T[]): T {
      return arr[Math.floor(next() * arr.length)];
    },
    /** shuffle array (Fisher-Yates) */
    shuffle<T>(arr: T[]): T[] {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    /** weighted pick: weights array parallel to items */
    weighted<T>(items: T[], weights: number[]): T {
      const total = weights.reduce((a, b) => a + b, 0);
      let r = next() * total;
      for (let i = 0; i < items.length; i++) {
        r -= weights[i];
        if (r <= 0) return items[i];
      }
      return items[items.length - 1];
    },
  };
}

export type Rng = ReturnType<typeof createRng>;
