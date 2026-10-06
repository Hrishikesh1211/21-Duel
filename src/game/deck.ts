import { RANKS, SUITS } from './types';
import type { Card, RandomSource } from './types';

export function createDeck(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ suit, rank })));
}

// Fisher-Yates with injectable randomness for reproducible dealing.
export function shuffleDeck(deck: readonly Card[], random: RandomSource = Math.random): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const sample = random();
    if (sample < 0 || sample >= 1 || !Number.isFinite(sample)) {
      throw new Error('Random source must return a number in [0, 1).');
    }
    const j = Math.floor(sample * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
