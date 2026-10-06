const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createMatch, newRound, rematch, playDecision, decisionSequence, opponentView } = require('../.expo/presentation-tests/game/engine');
const { TableController, visibleBotCards } = require('../.expo/presentation-tests/presentation/TableController');
const hand = (...ranks) => ranks.map(rank => ({ rank, suit: 'hearts' }));
const seeded = seed => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
function fixture(human, bot, stream) {
  const state = createMatch(seeded(7), 'ranked');
  return { ...state, human: { hand: hand(...human), status: 'playing' }, bot: { hand: hand(...bot), status: 'playing' }, ranked: { ...state.ranked, hitStream: hand(...stream) } };
}

test('Ranked first and second hits use equivalent real cards at independent stream cursors', () => {
  let state = fixture(['2','3'], ['2','4'], ['2','3','4']);
  const before = JSON.stringify(state);
  let next = playDecision(state, 'hit', () => 'hit');
  assert.deepEqual(next.human.hand[2], next.ranked.hitStream[0]);
  assert.deepEqual(next.bot.hand[2], next.ranked.hitStream[0]);
  assert.equal(next.ranked.humanHitIndex, 1); assert.equal(next.ranked.botHitIndex, 1);
  assert.equal(JSON.stringify(state), before);
  next = playDecision(next, 'hit', () => 'hit');
  assert.deepEqual(next.human.hand[3], next.ranked.hitStream[1]);
  assert.deepEqual(next.bot.hand[3], next.ranked.hitStream[1]);
});
test('one player can consume deeper without moving the locked opponent cursor', () => {
  let state = fixture(['2','3'], ['10','7'], ['2','3','4']);
  state = playDecision(state, 'hit', () => 'stand');
  state = playDecision(state, 'hit', () => 'hit');
  assert.equal(state.ranked.humanHitIndex, 2);
  assert.equal(state.ranked.botHitIndex, 0);
  assert.equal(state.bot.hand.length, 2);
  assert.equal(state.phase, 'playing');
});
test('Ranked opening pairs are distinct, swap independent of results, and renew after two rounds', () => {
  const rng = seeded(42);
  const first = createMatch(rng, 'ranked');
  assert.notDeepEqual(first.human.hand, first.bot.hand);
  const opening = [...first.human.hand, ...first.bot.hand];
  assert.equal(new Set(opening.map(c => c.rank+c.suit)).size, 4);
  assert.equal(first.ranked.hitStream.length, 48);
  assert.ok(first.ranked.hitStream.every(c => !opening.some(o => o.rank === c.rank && o.suit === c.suit)));
  const second = newRound({ ...first, phase: 'round-complete', result: 'bot' }, rng);
  assert.deepEqual(second.human.hand, first.bot.hand);
  assert.deepEqual(second.bot.hand, first.human.hand);
  assert.equal(second.ranked.pair, first.ranked.pair);
  assert.notDeepEqual(second.ranked.hitStream, first.ranked.hitStream);
  assert.equal(second.ranked.humanHitIndex, 0); assert.equal(second.ranked.botHitIndex, 0);
  const third = newRound({ ...second, phase: 'round-complete', result: 'draw' }, rng);
  assert.equal(third.ranked.pair.pairIndex, 2);
  assert.notDeepEqual(third.ranked.pair.openingA, first.ranked.pair.openingA);
  assert.equal(third.ranked.swapped, false);
  assert.deepEqual(createMatch(seeded(42), 'ranked'), first);
});
test('Ranked hides hit identities and totals until both hands lock', () => {
  let state = fixture(['2','3'], ['10','6'], ['2','3']);
  state = playDecision(state, 'hit', () => 'hit');
  assert.deepEqual(opponentView(state).cards, [state.bot.hand[0], null, null]);
  state = playDecision(state, 'hit', () => 'stand');
  assert.equal(opponentView(state).total, null);
  assert.equal(state.bot.status, 'standing');
  state = playDecision(state, 'stand');
  assert.equal(state.phase, 'round-complete');
  assert.deepEqual(opponentView(state).cards, state.bot.hand);
});
test('Ranked 21 locks either side and prevents additional draws while the other decides', () => {
  let state = fixture(['2','3'], ['10','6'], ['5','2']);
  state = playDecision(state, 'hit', () => 'hit');
  assert.equal(state.bot.status, 'standing');
  assert.equal(state.phase, 'playing');
  assert.equal(opponentView(state).total, null);
  state = playDecision(state, 'hit', () => 'hit');
  assert.equal(state.ranked.botHitIndex, 1);
  const human = playDecision(fixture(['10','6'], ['2','3'], ['5','7']), 'hit');
  assert.equal(human.human.status, 'standing');
  assert.equal(human.ranked.humanHitIndex, 1);
  assert.equal(human.phase, 'round-complete');
  const opening = playDecision(fixture(['A','K'], ['A','Q'], []), 'hit', () => 'hit');
  assert.equal(opening.result, 'draw');
  assert.equal(opening.ranked.humanHitIndex, 0);
});
test('Ranked bust is terminal but does not reveal while the other hand is deciding', () => {
  let state = playDecision(fixture(['2','3'], ['10','9'], ['5','4']), 'hit', () => 'hit');
  assert.equal(state.bot.status, 'bust');
  assert.equal(state.phase, 'playing');
  assert.equal(state.result, null); assert.equal(state.score.human, 0);
  assert.equal(opponentView(state).status, 'standing');
  assert.equal(opponentView(state).total, null);
  state = playDecision(state, 'stand');
  assert.equal(state.result, 'human'); assert.equal(state.score.human, 1);
  const double = playDecision(fixture(['10','9'], ['10','8'], ['5']), 'hit', () => 'hit');
  assert.equal(double.result, 'draw');
  const humanBust = playDecision(fixture(['10','9'], ['2','3'], ['5','7']), 'hit');
  assert.equal(humanBust.result, 'bot');
});
test('bot receives only a copied own hand, never hidden openings, cursors, or stream', () => {
  const state = fixture(['2','3'], ['4','5'], ['2']);
  let args;
  playDecision(state, 'hit', (...input) => { args = input; input[0][0].rank = 'K'; return 'stand'; });
  assert.equal(args.length, 1);
  assert.equal(args[0].length, 2);
  assert.deepEqual(Object.keys(args[0][0]).sort(), ['rank','suit']);
  assert.equal(state.bot.hand[0].rank, '4');
});
test('Casual remains shared-deck with immediate bust resolution; mode survives rounds/rematches', () => {
  const casual = { ...createMatch(seeded(4)), human: { hand: hand('2','3'), status: 'playing' }, bot: { hand: hand('2','4'), status: 'playing' }, deck: hand('5','6','7') };
  const next = playDecision(casual, 'hit', () => 'hit');
  assert.equal(next.human.hand[2].rank, '5'); assert.equal(next.bot.hand[2].rank, '6');
  assert.equal(next.deck.length, 1); assert.equal(next.ranked, null);
  const bust = playDecision({ ...casual, bot: { hand: hand('10','9'), status: 'playing' } }, 'hit', () => 'hit');
  assert.equal(bust.phase, 'round-complete');
  assert.equal(newRound(bust, seeded(5)).mode, 'casual');
  const restarted = rematch(seeded(6), 'ranked');
  assert.equal(restarted.mode, 'ranked');
  assert.equal(restarted.ranked.pair.pairIndex, 1);
  assert.equal(restarted.ranked.swapped, false);
  assert.equal(restarted.ranked.humanHitIndex, 0);
  assert.equal(restarted.ranked.botHitIndex, 0);
  assert.equal(rematch(seeded(6)).mode, 'casual');
});
test('Ranked first-to-three still completes with ordinary win scoring', () => {
  const state = { ...fixture(['10','9'], ['10','7'], []), score: { human: 2, bot: 0 } };
  const result = playDecision(state, 'stand');
  assert.equal(result.winner, 'human'); assert.equal(result.phase, 'match-complete');
  assert.equal(playDecision(result, 'hit'), result);
});
test('Ranked presentation delays every reveal until both locks and Clash complete', async () => {
  const views = [], feedback = [];
  const controller = new TableController(fixture(['2','3'], ['10','6'], ['6']), view => views.push(view), { wait: async () => true, feedback: value => feedback.push(value), random: () => 0 });
  await controller.start();
  await controller.act('hit');
  let view = views.at(-1);
  assert.equal(view.phase, 'playing'); assert.equal(view.botTotal, null);
  assert.deepEqual(visibleBotCards(view), [view.bot.hand[0], null, null]);
  assert.equal(feedback.includes('clash'), false);
  await controller.act('stand');
  const reveal = views.find(v => v.revealed > 1);
  assert.notEqual(reveal.human.status, 'playing'); assert.notEqual(reveal.bot.status, 'playing');
  assert.equal(reveal.clash, 'complete');
  assert.equal(views.at(-1).result, 'human');
  controller.dispose();
});


test('Ranked controller preserves paired openings and concealment on next round', async () => {
  const views = [];
  const initial = fixture(['10','9'], ['10','7'], ['2','3']);
  initial.ranked = { ...initial.ranked, pair: { openingA: initial.human.hand, openingB: initial.bot.hand, pairIndex: 1 } };
  const controller = new TableController(initial, v => views.push(v), { wait: async () => true, random: seeded(99) });
  await controller.start(); await controller.act('stand');
  await controller.advance(false);
  const swapped = views.at(-1);
  assert.equal(swapped.round, 2);
  assert.deepEqual(swapped.human.hand, initial.bot.hand);
  assert.deepEqual(swapped.bot.hand, initial.human.hand);
  assert.equal(swapped.revealed, 1); assert.equal(swapped.botTotal, null);
  controller.dispose();
});

test('Ranked 21 presentation locks before reveal and emits the human signature once', async () => {
  const views = [], feedback = [];
  const controller = new TableController(fixture(['10','6'], ['10','7'], ['5']), v => views.push(v), { wait: async () => true, feedback: f => feedback.push(f), random: () => 0 });
  await controller.start(); await controller.act('hit');
  assert.equal(views.at(-1).humanCount, 3);
  assert.equal(views.at(-1).human.status, 'standing');
  assert.equal(feedback.filter(f => f === 'twenty-one').length, 1);
  const reveal = views.find(v => v.revealed > 1);
  assert.equal(reveal.clash, 'complete');
  assert.equal(reveal.human.status, 'standing'); assert.equal(reveal.bot.status, 'standing');
  await controller.act('hit'); assert.equal(views.at(-1).humanCount, 3);
  controller.dispose();
});
