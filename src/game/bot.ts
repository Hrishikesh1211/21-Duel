import { handTotal } from './hand';
import type { BotStrategy } from './types';

export const basicBotStrategy: BotStrategy = (hand) => handTotal(hand) < 17 ? 'hit' : 'stand';
