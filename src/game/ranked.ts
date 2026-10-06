import { createDeck, shuffleDeck } from './deck';
import type { RandomSource, RankedRoundPair, RankedRoundState } from './types';

export function rankedRound(round: number, random: RandomSource, previous?: RankedRoundPair): RankedRoundState {
  const swapped = round % 2 === 0;
  let pair = previous;
  if (!swapped || !pair) {
    const cards = shuffleDeck(createDeck(), random);
    pair = { openingA: [cards[0], cards[2]], openingB: [cards[1], cards[3]], pairIndex: Math.ceil(round / 2) };
  }
  // A separate shuffle each round; omit opening cards so either player's own
  // hand remains a valid deck subset. Across players, mirrored cards repeat.
  const openings = [...pair.openingA, ...pair.openingB];
  const remaining = createDeck().filter(card => !openings.some(open => open.rank === card.rank && open.suit === card.suit));
  return { pair, swapped, hitStream: shuffleDeck(remaining, random), humanHitIndex: 0, botHitIndex: 0 };
}
