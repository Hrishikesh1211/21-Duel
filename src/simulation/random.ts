// Independent streams keep strategy random choices from perturbing deck randomness.
export function mixSeed(value: number): number {
  let x = value >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}
export function createRandomStream(seed: number): {next: () => number; snapshot: () => number} {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {next, snapshot: () => state};
}

export function seededRandom(seed: number): () => number { return createRandomStream(seed).next; }
