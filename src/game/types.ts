export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
export type Suit = (typeof SUITS)[number];
export type Rank = (typeof RANKS)[number];
export type Card = Readonly<{ suit: Suit; rank: Rank }>;
export type Action = 'hit' | 'stand';
export type PlayerStatus = 'playing' | 'standing' | 'bust';
export type PlayerId = 'human' | 'bot';
export type RoundResult = PlayerId | 'draw';
export type PlayerState = Readonly<{ hand: readonly Card[]; status: PlayerStatus }>;
export type PublicGameMode = 'ranked_duel' | 'ranked_mirror' | 'casual_duel' | 'casual_mirror';
export type GameMode = PublicGameMode | 'casual' | 'ranked' | 'ranked_classic' | 'ranked_fair';
export type RankedRoundPair = Readonly<{ openingA: readonly Card[]; openingB: readonly Card[]; pairIndex: number }>;
export type RankedRoundState = Readonly<{
  pair: RankedRoundPair;
  swapped: boolean;
  hitStream: readonly Card[];
  humanHitIndex: number;
  botHitIndex: number;
}>;
export type MatchState = Readonly<{
  round: number;
  roundValue: 1 | 2;
  firstActor: PlayerId;
  folded: PlayerId | null;
  phase: 'preRaiseDecision' | 'waitingForRaiseResponse' | 'playing' | 'round-complete' | 'match-complete';
  deck: readonly Card[];
  human: PlayerState;
  bot: PlayerState;
  score: Readonly<Record<PlayerId, number>>;
  result: RoundResult | null;
  winner: PlayerId | null;
  mode: GameMode;
  ranked: RankedRoundState | null;
}>;
// Strategies receive only their own hand, never the human hand or deck.
export type BotStrategy = (hand: readonly Card[]) => Action;
export type RandomSource = () => number;

export type RaiseAction = 'raise' | 'pass' | 'call' | 'fold';
