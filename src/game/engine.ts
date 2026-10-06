import { matchTarget, modeConfig } from './rulesConfig';
import { rankedRound } from './ranked';
import { basicBotStrategy } from './bot';
import { createDeck, shuffleDeck } from './deck';
import { handTotal } from './hand';
import type { Action, BotStrategy, Card, GameMode, MatchState, RankedRoundPair, PlayerState, RandomSource, RoundResult } from './types';

function dealRound(score: MatchState['score'], round: number, random: RandomSource, mode: GameMode = 'casual', previousPair?: RankedRoundPair): MatchState {
  const config = modeConfig(mode);
  const phase = config.raiseFoldEnabled ? 'preRaiseDecision' : 'playing';
  if (config.deckModel === 'mirrored') {
    const ranked = rankedRound(round, random, previousPair);
    return { mode, ranked, roundValue: 1, firstActor: round % 2 ? 'human' : 'bot', folded: null, deck: [], round, phase,
      human: { hand: ranked.swapped ? ranked.pair.openingB : ranked.pair.openingA, status: 'playing' },
      bot: { hand: ranked.swapped ? ranked.pair.openingA : ranked.pair.openingB, status: 'playing' },
      score, result: null, winner: null };
  }
  const cards = shuffleDeck(createDeck(), random);
  return {
    mode, ranked: null, roundValue: 1, firstActor: round % 2 ? 'human' : 'bot', folded: null, round, phase, deck: cards.slice(4),
    human: { hand: [cards[0], cards[2]], status: 'playing' },
    bot: { hand: [cards[1], cards[3]], status: 'playing' },
    score, result: null, winner: null,
  };
}

export function createMatch(random: RandomSource = Math.random, mode: GameMode = 'casual'): MatchState {
  return dealRound({ human: 0, bot: 0 }, 1, random, mode);
}

export function newRound(state: MatchState, random: RandomSource = Math.random): MatchState {
  return state.phase === 'round-complete' ? dealRound(state.score, state.round + 1, random, state.mode, state.ranked?.pair) : state;
}

export function rematch(random: RandomSource = Math.random, mode: GameMode = 'casual'): MatchState {
  return createMatch(random, mode);
}

function roundResult(human: PlayerState, bot: PlayerState): RoundResult | null {
  const humanTotal = handTotal(human.hand);
  const botTotal = handTotal(bot.hand);
  if (humanTotal > 21 && botTotal > 21) return 'draw';
  if (humanTotal > 21) return 'bot';
  if (botTotal > 21) return 'human';
  if (human.status !== 'standing' || bot.status !== 'standing') return null;
  if (humanTotal === botTotal) return 'draw';
  return humanTotal > botTotal ? 'human' : 'bot';
}

function resolvePhase(state: MatchState, humanAction: Action, strategy: BotStrategy): MatchState {
  // Commit before drawing. A copied input also prevents strategy mutations.
  const botAction = state.bot.status === 'playing'
    ? strategy(state.bot.hand.map((card) => ({ ...card }))) : 'stand';
  const deck = [...state.deck];
  const ranked = state.ranked ? { ...state.ranked } : null;
  function apply(player: PlayerState, action: Action, side: 'human' | 'bot'): PlayerState {
    if (player.status !== 'playing') return player;
    if (action === 'stand' || handTotal(player.hand) === 21) return { ...player, status: 'standing' };
    const cursor = side === 'human' ? 'humanHitIndex' : 'botHitIndex';
    const card = ranked ? ranked.hitStream[ranked[cursor]++] : deck.shift();
    // Legal rounds end before a standard deck can be exhausted.
    if (!card) throw new Error('Cannot draw from an empty deck.');
    const hand = [...player.hand, card];
    return { hand, status: handTotal(hand) > 21 ? 'bust' : handTotal(hand) === 21 ? 'standing' : 'playing' };
  }
  // Fixed draw order; check for busts only AFTER both actions resolve.
  const human = apply(state.human, humanAction, 'human');
  const bot = apply(state.bot, botAction, 'bot');
  const result = state.ranked !== null && (human.status === 'playing' || bot.status === 'playing') ? null : roundResult(human, bot);
  const score = { ...state.score };
  if (result && result !== 'draw') score[result] += state.roundValue;
  const winner = score.human >= matchTarget(state.mode) ? 'human' : score.bot >= matchTarget(state.mode) ? 'bot' : null;
  return {
    ...state, ranked, deck, human, bot, result, score, winner,
    phase: winner ? 'match-complete' : result ? 'round-complete' : 'playing',
  };
}

export function playDecision(state: MatchState, action: Action, strategy: BotStrategy = basicBotStrategy): MatchState {
  const frames = decisionSequence(state, action, strategy);
  return frames[frames.length - 1] ?? state;
}

// Instant, deterministic snapshots of the same decisions, for presentation replay.
// No timing, animation, or alternate rules live in the engine.
export function decisionSequence(state: MatchState, action: Action, strategy: BotStrategy = basicBotStrategy): readonly MatchState[] {
  if (state.phase !== 'playing' || state.human.status !== 'playing') return [];
  let next = resolvePhase(state, action, strategy);
  const frames = [next];
  // No further human input is needed after standing.
  while (next.phase === 'playing' && (next.human.status === 'standing' || (next.ranked !== null && next.human.status === 'bust'))) {
    next = resolvePhase(next, 'stand', strategy);
    frames.push(next);
  }
  return frames;
}

// Hidden card values and total are absent from the UI projection.
export function opponentView(state: MatchState): {
  cards: readonly (Card | null)[];
  total: number | null;
  status: PlayerState['status'];
} {
  const revealed = !state.folded && (state.phase === 'round-complete' || state.phase === 'match-complete');
  return {
    cards: state.bot.hand.map((card, index) => revealed || (!state.folded && index === 0) ? card : null),
    total: revealed ? handTotal(state.bot.hand) : null,
    status: state.ranked !== null && !revealed && state.bot.status === 'bust' ? 'standing' : state.bot.status,
  };
}

// Pure pre-round transitions: callers own clocks, engine owns timeout meaning.
export const RAISE_SECONDS = 9;
export function raiseActor(state: MatchState): import('./types').PlayerId | null {
  return state.phase === 'preRaiseDecision' ? state.firstActor
    : state.phase === 'waitingForRaiseResponse' ? (state.firstActor === 'human' ? 'bot' : 'human') : null;
}
export function raiseDecision(state: MatchState, actor: import('./types').PlayerId, action: import('./types').RaiseAction): MatchState {
  if (!modeConfig(state.mode).raiseFoldEnabled || raiseActor(state) !== actor || state.human.hand.length !== 2 || state.bot.hand.length !== 2) return state;
  if (state.phase === 'preRaiseDecision') {
    if (action === 'pass') return { ...state, phase: 'playing' };
    if (action === 'raise') return { ...state, roundValue: 2, phase: 'waitingForRaiseResponse' };
  } else {
    if (action === 'call') return { ...state, phase: 'playing' };
    if (action === 'fold') {
      const result = state.firstActor;
      const score = { ...state.score, [result]: state.score[result] + 1 };
      const winner = score[result] >= matchTarget(state.mode) ? result : null;
      return { ...state, folded: actor, result, score, winner, phase: winner ? 'match-complete' : 'round-complete' };
    }
  }
  return state;
}
export function raiseTimeout(state: MatchState): MatchState {
  const actor = raiseActor(state);
  return actor ? raiseDecision(state, actor, state.phase === 'preRaiseDecision' ? 'pass' : 'fold') : state;
}
