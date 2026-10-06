import { handTotal } from './hand';
import type { Card, RandomSource, RaiseAction } from './types';
// Only own opening cards and an injected RNG. Weak raises are intentional bluffs.
export const RAISE_BOT = { strongTotal: 18, mediumTotal: 14, raise: [0.15, 0.4, 0.75], call: [0.3, 0.65, 0.9], delayMs: 1200 } as const;
export function botRaiseDecision(hand: readonly Card[], responding: boolean, random: RandomSource): RaiseAction {
  const total = handTotal(hand);
  const band = total >= RAISE_BOT.strongTotal ? 2 : total >= RAISE_BOT.mediumTotal ? 1 : 0;
  return random() < (responding ? RAISE_BOT.call : RAISE_BOT.raise)[band]
    ? responding ? 'call' : 'raise' : responding ? 'fold' : 'pass';
}
