const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createMatch, newRound, playDecision, raiseDecision: act, raiseTimeout, opponentView } = require('../.expo/presentation-tests/game/engine');
const { botRaiseDecision } = require('../.expo/presentation-tests/game/raiseBot');
const { TableController, visibleBotCards } = require('../.expo/presentation-tests/presentation/TableController');
const seeded = seed => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const classic = () => createMatch(seeded(42), 'ranked_classic');
const hand = (...ranks) => ranks.map(rank => ({ rank, suit: 'hearts' }));
const called = () => act(act(classic(), 'human', 'raise'), 'bot', 'call');
test('classic blocks Hit/Stand before decision and allows opening Raise', () => {
  const s = classic(); assert.equal(s.phase, 'preRaiseDecision');
  assert.equal(playDecision(s, 'hit'), s); assert.equal(playDecision(s, 'stand'), s);
  assert.equal(act(s, 'human', 'raise').roundValue, 2);
});
test('Pass starts ordinary one-point play', () => {
  const s = act(classic(), 'human', 'pass'); assert.equal(s.phase, 'playing'); assert.equal(s.roundValue, 1);
});
test('Call accepts value 2 and no re-raise or second Raise is possible', () => {
  const s = act(classic(), 'human', 'raise'); assert.equal(s.phase, 'waitingForRaiseResponse');
  assert.equal(act(s, 'bot', 'raise'), s); assert.equal(act(s, 'human', 'raise'), s);
  const c = act(s, 'bot', 'call'); assert.equal(c.phase, 'playing'); assert.equal(c.roundValue, 2);
  assert.equal(act(c, 'human', 'raise'), c);
});
test('Raise unavailable after Hit and wrong actor/response actions ignored', () => {
  const s = classic(); assert.equal(act(s, 'bot', 'raise'), s); assert.equal(act(s, 'human', 'call'), s);
  const next = playDecision(act(s, 'human', 'pass'), 'hit', () => 'stand'); assert.equal(act(next, 'human', 'raise'), next);
});
test('bot Fold awards human exactly one and reveals no card or total', () => {
  const s = act(act(classic(), 'human', 'raise'), 'bot', 'fold');
  assert.equal(s.score.human, 1); assert.equal(s.folded, 'bot'); assert.equal(s.phase, 'round-complete');
  assert.deepEqual(opponentView(s).cards, [null, null]); assert.equal(opponentView(s).total, null);
});
test('human Fold awards bot one and first actor alternates through ties/folds', () => {
  const one = classic(); const two = newRound({ ...one, phase: 'round-complete' }, seeded(2));
  assert.equal(one.firstActor, 'human'); assert.equal(two.firstActor, 'bot');
  const fold = act(act(two, 'bot', 'raise'), 'human', 'fold'); assert.equal(fold.score.bot, 1);
  assert.equal(newRound(fold, seeded(3)).firstActor, 'human');
});
test('first-decision timeout means Pass; response timeout means Fold', () => {
  assert.equal(raiseTimeout(classic()).phase, 'playing');
  const s = raiseTimeout(act(classic(), 'human', 'raise')); assert.equal(s.folded, 'bot'); assert.equal(s.score.human, 1);
});
test('called winner gets two points; match target is seven with overshoot', () => {
  const s = { ...called(), human: { hand: hand('10','9'), status: 'playing' }, bot: { hand: hand('10','7'), status: 'playing' }, score: { human: 6, bot: 0 } };
  const next = playDecision(s, 'stand', () => 'stand'); assert.equal(next.score.human, 8); assert.equal(next.winner, 'human');
});
test('called tie awards zero', () => {
  const s = { ...called(), human: { hand: hand('10','7'), status: 'playing' }, bot: { hand: hand('10','7'), status: 'playing' } };
  const next = playDecision(s, 'stand', () => 'stand'); assert.equal(next.result, 'draw'); assert.deepEqual(next.score, { human: 0, bot: 0 });
});
test('Casual has no Raise/Fold', () => {
  const s = createMatch(seeded(4), 'casual'); assert.equal(s.phase, 'playing'); assert.equal(act(s, 'human', 'raise'), s);
});
test('classic shared deck consumes distinct successive cards', () => {
  const s = { ...called(), human: { hand: hand('2','3'), status: 'playing' }, bot: { hand: hand('2','4'), status: 'playing' }, deck: hand('5','6','7') };
  assert.equal(s.ranked, null); const n = playDecision(s, 'hit', () => 'hit');
  assert.equal(n.human.hand[2].rank, '5'); assert.equal(n.bot.hand[2].rank, '6'); assert.equal(n.deck.length, 1);
});
test('explicit fair variant preserves mirrored stream and swapped openings', () => {
  const s = createMatch(seeded(42), 'ranked_fair'); assert.equal(s.phase, 'playing'); assert.ok(s.ranked);
  assert.equal(act(s, 'human', 'raise'), s);
  const n = newRound({ ...s, phase: 'round-complete' }, seeded(4)); assert.equal(n.mode, 'ranked_fair'); assert.deepEqual(n.human.hand, s.bot.hand);
});
test('bot probabilities include bluffs and imperfect folds using only opening hand', () => {
  assert.equal(botRaiseDecision(hand('2','3'), false, () => 0), 'raise');
  assert.equal(botRaiseDecision(hand('10','9'), false, () => 0.99), 'pass');
  assert.equal(botRaiseDecision(hand('10','9'), true, () => 0.99), 'fold');
  assert.equal(botRaiseDecision(hand('2','3'), true, () => 0), 'call');
});
function controllerFixture(options = {}) {
  const views = [], feedback = []; let now = 0;
  const controller = new TableController(classic(), v => views.push(v), {
    wait: async ms => ms === 250 || ms === 1200 || ms === 600 ? false : true,
    now: () => now, feedback: f => feedback.push(f), ...options,
  });
  return { controller, views, feedback, time: value => { now = value; } };
}
test('controller injected clock expires at nine seconds, not earlier', async () => {
  const { controller: c, views, time } = controllerFixture(); await c.start();
  time(8999); c.checkRaiseTimeout(); assert.equal(views.at(-1).phase, 'preRaiseDecision');
  time(9000); c.checkRaiseTimeout(); await Promise.resolve(); await Promise.resolve();
  assert.equal(views.at(-1).phase, 'playing'); assert.equal(views.at(-1).roundValue, 1); c.dispose();
});
test('controller response timer resets and Fold bypasses every reveal', async () => {
  const { controller: c, views, feedback, time } = controllerFixture(); await c.start();
  time(8000); await c.preAct('raise'); time(16999); c.checkRaiseTimeout(); assert.equal(views.at(-1).phase, 'waitingForRaiseResponse');
  time(17000); c.checkRaiseTimeout(); const v = views.at(-1);
  assert.equal(v.folded, 'bot'); assert.equal(v.score.human, 0); assert.equal(v.botTotal, null); assert.equal(v.humanTotal, null);
  assert.deepEqual(visibleBotCards(v), [null, null]); assert.ok(views.every(v => v.revealed <= 1)); assert.ok(!feedback.includes('clash')); c.dispose();
});
test('controller prevents double input and dispose cancels timeout effects', async () => {
  const { controller: c, views, time } = controllerFixture(); await c.start(); await c.preAct('raise'); await c.preAct('raise');
  assert.equal(views.at(-1).roundValue, 2); c.dispose(); const count = views.length; time(20000); c.checkRaiseTimeout(); assert.equal(views.length, count);
});

test('controller opening 21 waits for Pass before normal automatic stand', async () => {
  const views = [];
  const s = { ...classic(), human: { hand: hand('A','K'), status: 'playing' }, bot: { hand: hand('10','7'), status: 'playing' } };
  const c = new TableController(s, v => views.push(v), { wait: async ms => ms === 250 ? false : true });
  await c.start(); assert.equal(views.at(-1).phase, 'preRaiseDecision'); assert.equal(views.at(-1).human.status, 'playing');
  await c.preAct('pass'); assert.equal(views.at(-1).result, 'human'); assert.equal(views.at(-1).score.human, 1); c.dispose();
});
test('bot controller uses injected own-hand decision and Call opens two-point play', async () => {
  const views = []; let args;
  const c = new TableController(classic(), v => views.push(v), { wait: async ms => ms === 250 ? false : true,
    raiseBot: (...input) => { args = input; input[0][0].rank = 'K'; return 'call'; }, random: () => 0.5 });
  await c.start(); await c.preAct('raise');
  for (let i = 0; i < 12; i++) await Promise.resolve();
  assert.equal(args.length, 3); assert.equal(args[1], true); assert.equal(args[0].length, 2);
  assert.equal(views.at(-1).phase, 'playing'); assert.equal(views.at(-1).roundValue, 2); c.dispose();
});
test('fold automatically advances with reset value and alternated first actor', async () => {
  const views = []; let now = 0;
  const c = new TableController(classic(), v => views.push(v), { now: () => now, wait: async ms => ms === 250 || ms === 1200 ? false : true });
  await c.start(); await c.preAct('raise'); now = 9000; c.checkRaiseTimeout();
  for (let i = 0; i < 40; i++) await Promise.resolve();
  assert.ok(views.some(v => v.folded === 'bot' && v.score.human === 1));
  const next = views.at(-1);
  assert.equal(next.round, 2); assert.equal(next.roundValue, 1); assert.equal(next.decisionActor, 'bot'); assert.equal(next.folded, null); c.dispose();
});

test('targets are centralized: Classic seven, Casual and fair three', () => {
  const { matchTarget } = require('../.expo/presentation-tests/game/rulesConfig');
  assert.equal(matchTarget('ranked_classic'), 7);
  for (const mode of ['casual','ranked_fair','ranked']) assert.equal(matchTarget(mode), 3);
});
test('classic ordinary point wins at seven and not at three', () => {
  const opening = act(classic(), 'human', 'pass');
  for (const [before, final, winner] of [[2,3,null],[5,6,null],[6,7,'human']]) {
    const s = { ...opening, score: { human: before, bot: 0 }, human: { hand: hand('10','9'), status: 'playing' }, bot: { hand: hand('10','7'), status: 'playing' } };
    const n = playDecision(s, 'stand', () => 'stand'); assert.equal(n.score.human, final); assert.equal(n.winner, winner);
  }
});
test('bot also crosses seven with a called two-point win without clamping', () => {
  const s = { ...called(), score: { human: 5, bot: 6 }, human: { hand: hand('10','7'), status: 'playing' }, bot: { hand: hand('10','9'), status: 'playing' } };
  const n = playDecision(s, 'stand', () => 'stand'); assert.equal(n.score.bot, 8); assert.equal(n.phase, 'match-complete'); assert.equal(n.winner, 'bot');
});
test('Fold wins at seven but only adds one despite raised value two', () => {
  const s = { ...classic(), score: { human: 6, bot: 5 } };
  const n = act(act(s, 'human', 'raise'), 'bot', 'fold'); assert.equal(n.score.human, 7); assert.equal(n.winner, 'human');
});
test('fair and Casual still end at three', () => {
  for (const mode of ['casual','ranked_fair']) {
    const s = { ...createMatch(seeded(5), mode), score: { human: 2, bot: 0 }, human: { hand: hand('10','9'), status: 'playing' }, bot: { hand: hand('10','7'), status: 'playing' } };
    const n = playDecision(s, 'stand', () => 'stand'); assert.equal(n.score.human, 3); assert.equal(n.phase, 'match-complete');
  }
});
test('Call holds CALLED for 300ms with no normal controls, then clears presentation', async () => {
  const views = []; let release;
  const initial = act(act(classic(), 'human', 'raise'), 'bot', 'call');
  const responding = { ...classic(), firstActor: 'bot', phase: 'waitingForRaiseResponse', roundValue: 2 };
  const c = new TableController(responding, v => views.push(v), { wait: async ms => ms === 250 ? false : ms === 300 ? new Promise(resolve => { release = resolve; }) : true });
  await c.start(); const pending = c.preAct('call');
  const confirmation = views.at(-1); assert.equal(confirmation.raiseLabel, 'CALLED'); assert.equal(confirmation.phase, 'waitingForRaiseResponse'); assert.equal(confirmation.busy, true);
  await c.act('hit'); assert.equal(views.at(-1), confirmation);
  release(true); await pending;
  const playing = views.at(-1); assert.equal(playing.phase, initial.phase); assert.equal(playing.raiseLabel, ''); assert.equal(playing.strategicTransition, null); assert.equal(playing.decisionActor, null); c.dispose();
});
test('Fold holds 600ms before awarding the final point, without reveal', async () => {
  const views = []; let release;
  const responding = { ...classic(), firstActor: 'bot', phase: 'waitingForRaiseResponse', roundValue: 2, score: { human: 5, bot: 6 } };
  const d = new TableController(responding, v => views.push(v), { wait: async ms => ms === 250 ? false : ms === 600 ? new Promise(resolve => { release = resolve; }) : true });
  await d.start(); const pending = d.preAct('fold'); const folded = views.at(-1);
  assert.equal(folded.folded, 'human'); assert.equal(folded.score.bot, 6); assert.equal(folded.winner, null); assert.deepEqual(visibleBotCards(folded), [null,null]);
  release(true); await pending; assert.equal(views.at(-1).score.bot, 7); assert.equal(views.at(-1).winner, 'bot'); assert.equal(views.at(-1).phase, 'match-complete'); d.dispose();
});
test('dispose during Call cancels confirmation and blocks stale timer/bot publication', async () => {
  const views = []; let release; let signal;
  const responding = { ...classic(), firstActor: 'bot', phase: 'waitingForRaiseResponse', roundValue: 2 };
  const c = new TableController(responding, v => views.push(v), { wait: async (ms, abort) => ms === 250 ? false : ms === 300 ? new Promise(resolve => { release = resolve; signal = abort; }) : true });
  await c.start(); const pending = c.preAct('call'); c.dispose(); const count = views.length;
  assert.equal(signal.aborted, true); release(true); await pending; c.checkRaiseTimeout(); assert.equal(views.length, count);
});
