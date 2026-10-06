const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createDeck, shuffleDeck } = require('../.expo/game-tests/deck');
const { handTotal, isBlackjack } = require('../.expo/game-tests/hand');
const { basicBotStrategy } = require('../.expo/game-tests/bot');
const { createMatch, newRound, rematch, playDecision, opponentView } = require('../.expo/game-tests/engine');
const hand = (...ranks) => ranks.map((rank) => ({ rank, suit: 'hearts' }));
const fixture = (human, bot, deck = []) => ({
  ...createMatch(() => 0.5),
  human: { hand: hand(...human), status: 'playing' },
  bot: { hand: hand(...bot), status: 'playing' },
  deck: hand(...deck),
});

test('52 unique cards, immutable shuffle and deterministic fresh deal', () => {
  const deck = createDeck();
  const before = JSON.stringify(deck);
  const shuffled = shuffleDeck(deck, () => 0);
  assert.equal(new Set(shuffled.map(c => `${c.rank}-${c.suit}`)).size, 52);
  assert.equal(JSON.stringify(deck), before);
  assert.notDeepEqual(shuffled, deck);
  const game = createMatch(() => 0.5);
  assert.deepEqual(game, createMatch(() => 0.5));
  assert.equal(game.deck.length, 48);
  assert.equal(game.human.hand.length, 2);
  assert.equal(game.bot.hand.length, 2);
  assert.equal(new Set([...game.deck, ...game.human.hand, ...game.bot.hand].map(c => `${c.rank}-${c.suit}`)).size, 52);
});

test('ace adjustment, face values, and visual blackjack', () => {
  for (const [ranks, total] of [[['A', 'A'], 12], [['A', 'A', '9'], 21], [['A', '6', 'K'], 17], [['A', 'A', 'K', '9'], 21], [['J', 'Q', 'K'], 30]]) {
    assert.equal(handTotal(hand(...ranks)), total);
  }
  assert.equal(isBlackjack(hand('A', 'K')), true);
  assert.equal(isBlackjack(hand('7', '7', '7')), false);
});

test('bot hits below 17 and stands on hard and soft 17', () => {
  assert.equal(basicBotStrategy(hand('10', '6')), 'hit');
  assert.equal(basicBotStrategy(hand('10', '7')), 'stand');
  assert.equal(basicBotStrategy(hand('A', '6')), 'stand');
});

test('both hits resolve before bust detection; double bust draws', () => {
  const start = fixture(['10', '6'], ['9', '7'], ['K', 'Q']);
  const before = JSON.stringify(start);
  const end = playDecision(start, 'hit');
  assert.equal(end.result, 'draw');
  assert.equal(end.human.status, 'bust');
  assert.equal(end.bot.status, 'bust');
  assert.equal(end.deck.length, 0);
  assert.deepEqual(end.score, { human: 0, bot: 0 });
  assert.equal(JSON.stringify(start), before);
});

test('either single bust awards the surviving player a point', () => {
  assert.equal(playDecision(fixture(['10', '6'], ['10', '7'], ['K']), 'hit').result, 'bot');
  assert.equal(playDecision(fixture(['10', '7'], ['10', '6'], ['K']), 'stand').result, 'human');
});

test('bot standing stays hidden and cannot draw again', () => {
  let state = playDecision(fixture(['2', '3'], ['10', '7'], ['4', '5']), 'hit');
  assert.equal(state.bot.status, 'standing');
  assert.deepEqual(opponentView(state), { cards: [state.bot.hand[0], null], total: null, status: 'standing' });
  state = playDecision(state, 'hit', () => { throw new Error('Standing bot must not decide'); });
  assert.equal(state.bot.hand.length, 2);
  assert.equal(handTotal(state.human.hand), 14);
  state = playDecision(state, 'stand');
  assert.deepEqual(opponentView(state).cards, state.bot.hand);
  assert.equal(opponentView(state).total, 17);
});

test('additional bot cards stay hidden, and strategy sees only pre-phase own hand', () => {
  const state = fixture(['2', '3'], ['4', '5'], ['6', '7']);
  let seen;
  const next = playDecision(state, 'hit', (...args) => { seen = args; return 'hit'; });
  assert.deepEqual(seen, [state.bot.hand]);
  assert.deepEqual(opponentView(next).cards, [state.bot.hand[0], null, null]);
  assert.equal(opponentView(next).total, null);
  assert.equal(handTotal(next.human.hand), 11);
  assert.equal(handTotal(next.bot.hand), 16);
});

test('human stand automatically finishes repeated bot hits', () => {
  const state = playDecision(fixture(['10', '9'], ['2', '3'], ['4', '5', '3']), 'stand');
  assert.equal(state.phase, 'round-complete');
  assert.equal(state.bot.status, 'standing');
  assert.equal(state.bot.hand.length, 5);
  assert.equal(state.human.hand.length, 2);
  assert.equal(state.result, 'human');
  assert.equal(playDecision(state, 'hit'), state);
});

test('valid totals compare normally, including two-card versus multi-card 21', () => {
  for (const [human, bot, result] of [
    [['10', '9'], ['10', '8'], 'human'],
    [['10', '7'], ['10', '8'], 'bot'],
    [['10', '8'], ['9', '9'], 'draw'],
    [['A', 'K'], ['7', '7', '7'], 'draw'],
    [['A', 'K'], ['K', 'Q'], 'human'],
  ]) assert.equal(playDecision(fixture(human, bot), 'stand').result, result);
});

test('third win completes either match; fresh rounds and rematch reset correctly', () => {
  for (const winner of ['human', 'bot']) {
    let state = createMatch(() => 0.5);
    assert.equal(newRound(state), state);
    for (let round = 1; round <= 3; round++) {
      state = { ...fixture(winner === 'human' ? ['A', 'K'] : ['10', '7'], ['10', '9']), score: state.score, round };
      state = playDecision(state, 'stand');
      assert.equal(state.score[winner], round);
      if (round < 3) {
        state = newRound(state, () => 0.25);
        assert.equal(state.round, round + 1);
        assert.equal(state.deck.length, 48);
        assert.equal(state.result, null);
        assert.equal(state.human.status, 'playing');
      }
    }
    assert.equal(state.phase, 'match-complete');
    assert.equal(state.winner, winner);
    assert.equal(newRound(state), state);
    assert.equal(playDecision(state, 'hit'), state);
  }
  assert.deepEqual(rematch(() => 0.5), createMatch(() => 0.5));
});


test('21 overrides HIT for either player and a hit reaching 21 automatically stands', () => {
  const opening = playDecision(fixture(['A', 'K'], ['A', 'Q'], ['K']), 'hit', () => 'hit');
  assert.equal(opening.human.hand.length, 2);
  assert.equal(opening.bot.hand.length, 2);
  assert.equal(opening.result, 'draw');
  const reached = playDecision(fixture(['10', '5'], ['10', '6'], ['6', '5']), 'hit', () => 'hit');
  assert.equal(reached.human.status, 'standing');
  assert.equal(reached.bot.status, 'standing');
  assert.equal(reached.result, 'draw');
  assert.equal(playDecision(reached, 'hit'), reached);
});
