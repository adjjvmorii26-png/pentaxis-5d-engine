/** Seeded PRNG (mulberry32) + string hash (xmur3). Never use Math.random() for world gen. */

export function xmur3(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeStreams(seed: string | number) {
  const s = typeof seed === "string" ? xmur3(seed) : seed >>> 0;
  return {
    world: mulberry32(s),
    loot: mulberry32(s ^ 0x9e3779b9),
    anomaly: mulberry32(s ^ 0x85ebca6b),
    mind: mulberry32(s ^ 0xc2b2ae35),
    meta: mulberry32(s ^ 0x27d4eb2f),
  };
}

export type Rng = () => number;

export function randRange(rng: Rng, a: number, b: number) {
  return a + rng() * (b - a);
}

export function randInt(rng: Rng, a: number, b: number) {
  return Math.floor(randRange(rng, a, b + 1));
}

export function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}
