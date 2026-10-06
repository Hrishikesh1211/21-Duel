import type { Card } from './types';

export function handTotal(hand: readonly Card[]): number {
  let total = 0;
  let aces = 0;
  for (const { rank } of hand) {
    if (rank === 'A') {
      aces++;
      total += 11;
    } else {
      total += rank === 'J' || rank === 'Q' || rank === 'K' ? 10 : Number(rank);
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

export function isBlackjack(hand: readonly Card[]): boolean {
  return hand.length === 2 && handTotal(hand) === 21;
}
