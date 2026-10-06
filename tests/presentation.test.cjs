const { test } = require('node:test');
const assert = require('node:assert/strict');
const { TableController, visibleBotCards } = require('../.expo/presentation-tests/presentation/TableController');
const { createMatch, playDecision, decisionSequence } = require('../.expo/presentation-tests/game/engine');
const hand = (...ranks) => ranks.map(rank => ({ rank, suit: 'hearts' }));
const fixture = (human, bot, deck = []) => ({
  ...createMatch(() => 0.5),
  human: { hand: hand(...human), status: 'playing' },
  bot: { hand: hand(...bot), status: 'playing' }, deck: hand(...deck),
});

function harness(game) {
  const history = [], pending = [], feedback = [], delays = [];
  let sample = 0;
  const controller = new TableController(game, view => history.push(view), {
    feedback: kind => feedback.push(kind),
    random: () => { sample = (sample + 0.23) % 1; return sample; },
    wait: (ms, signal) => new Promise(resolve => {
      delays.push(ms);
      const cancel = () => resolve(false);
      signal.addEventListener('abort', cancel, { once: true });
      pending.push(() => { signal.removeEventListener('abort', cancel); resolve(!signal.aborted); });
    }),
  });
  const tick = async () => {
    assert.ok(pending.length, 'a presentation delay is pending');
    pending.shift()();
    for (let i = 0; i < 8; i++) await Promise.resolve();
  };
  const drain = async () => {
    let count = 0;
    while (pending.length) { assert.ok(count++ < 100); await tick(); }
  };
  return { controller, history, feedback, delays, tick, drain, view: () => history.at(-1) };
}

async function ready(game) {
  const h = harness(game);
  const start = h.controller.start();
  await h.drain(); await start;
  return h;
}

test('decision snapshots retain the exact engine outcome and do not mutate input', () => {
  for (const action of ['hit', 'stand']) {
    for (let seed = 1; seed <= 50; seed++) {
      let n = seed;
      const game = createMatch(() => ((n = (n * 16807) % 2147483647) - 1) / 2147483646);
      const before = JSON.stringify(game);
      const frames = decisionSequence(game, action);
      assert.deepEqual(frames.at(-1), playDecision(game, action));
      assert.equal(JSON.stringify(game), before);
    }
  }
});

test('opening deal is ordered, totals settle later, and all input is locked', async () => {
  const h = harness(fixture(['10', '8'], ['10', '7']));
  const start = h.controller.start();
  assert.equal(h.view().humanCount, 1);
  assert.equal(h.view().humanTotal, null);
  await h.controller.act('hit');
  await h.controller.advance(false);
  await h.controller.advance(true);
  await h.drain(); await start;
  const counts = h.history.map(v => [v.humanCount, v.botCount]);
  const changes = counts.filter((c, i) => i === 0 || String(c) !== String(counts[i - 1]));
  assert.deepEqual(changes, [[1, 0], [1, 1], [2, 1], [2, 2]]);
  assert.deepEqual(h.feedback, ['deal', 'deal']);
  assert.equal(h.view().humanTotal, 18);
  assert.equal(h.view().busy, false);
  assert.equal(h.view().botTotal, null);
  assert.deepEqual(visibleBotCards(h.view()), [hand('10')[0], null]);
});

test('hit locks synchronously, total settles, standing opponent remains concealed', async () => {
  const h = await ready(fixture(['2', '3'], ['10', '7'], ['4', '5']));
  const act = h.controller.act('hit');
  await h.controller.act('hit');
  await h.controller.act('stand');
  assert.equal(h.view().humanCount, 2); // The request reaches contact before the deck releases.
  assert.equal(h.view().humanGesture.action, 'hit');
  assert.equal(h.feedback.includes('hit'), false);
  await h.tick();
  assert.equal(h.feedback.filter(f => f === 'hit').length, 1);
  assert.equal(h.view().humanCount, 2); // Contact precedes deck release by 40ms.
  await h.tick();
  assert.equal(h.view().humanCount, 3);
  assert.equal(h.view().humanTotal, 5);
  await h.drain(); await act;
  assert.equal(h.view().humanTotal, 9);
  assert.equal(h.view().bot.status, 'standing');
  assert.equal(h.view().botTotal, null);
  assert.equal(visibleBotCards(h.view())[1], null);
  assert.equal(h.view().busy, false);
  assert.equal(h.feedback.filter(f => f === 'hit').length, 1);
});

test('stand replays each bot decision with distinct thinking pauses and one card at a time', async () => {
  const h = await ready(fixture(['10', '9'], ['2', '3'], ['4', '5', '3']));
  const act = h.controller.act('stand');
  assert.equal(h.view().human.status, 'playing'); // Sweep leads the card response.
  await h.drain(); await act;
  const delays = h.delays.filter(ms => ms >= 700 && ms <= 1600);
  assert.equal(delays.length, 4); // Three hits and then stand.
  assert.ok(new Set(delays).size > 1);
  const thinking = h.history.filter(v => v.thinking);
  assert.deepEqual(thinking.map(v => v.botCount), [2, 3, 4, 5]);
  for (const view of thinking) {
    assert.equal(view.botTotal, null);
    assert.ok(visibleBotCards(view).slice(1).every(c => c === null));
    assert.equal(view.busy, true);
  }
  assert.equal(h.view().phase, 'round-complete');
  assert.equal(h.view().result, 'human');
});

test('reveal is staggered, opponent total and points follow final flip, actions follow result', async () => {
  const h = await ready(fixture(['10', '9'], ['5', '6'], ['7']));
  const act = h.controller.act('stand');
  await h.drain(); await act;
  const reveals = h.history.filter((v, i) => i > 0 && v.revealed !== h.history[i - 1].revealed);
  assert.deepEqual(reveals.map(v => v.revealed), [2, 3]);
  for (const v of reveals) {
    assert.equal(v.botTotal, null);
    assert.equal(v.result, null);
    assert.equal(v.score.human, 0);
    assert.equal(v.busy, true);
  }
  const resultIndex = h.history.findIndex(v => v.result !== null);
  const totalIndex = h.history.findIndex(v => v.botTotal !== null);
  assert.ok(resultIndex > totalIndex);
  assert.equal(h.history[resultIndex].busy, true);
  assert.equal(h.view().score.human, 1);
});

test('same-phase double bust still draws after both animations and reveal', async () => {
  const h = await ready(fixture(['10', '6'], ['9', '7'], ['K', 'Q']));
  const act = h.controller.act('hit');
  await h.drain(); await act;
  assert.equal(h.view().human.status, 'bust');
  assert.equal(h.view().bot.status, 'bust');
  assert.equal(h.view().result, 'draw');
  assert.deepEqual(h.view().score, { human: 0, bot: 0 });
});

test('next round clears first; double next-round and rematch taps are ignored', async () => {
  const h = await ready(fixture(['10', '9'], ['10', '7']));
  const act = h.controller.act('stand'); await h.drain(); await act;
  const advance = h.controller.advance(false);
  await h.controller.advance(false);
  await h.controller.advance(true);
  assert.equal(h.view().clearing, true);
  assert.equal(h.view().round, 1);
  await h.drain(); await advance;
  assert.equal(h.view().round, 2);
  assert.equal(h.view().handKey, 1);
  assert.equal(h.view().busy, false);
  assert.equal(h.view().botTotal, null);
});

test('match result follows round result, then rematch resets with a new hand identity', async () => {
  const h = await ready({ ...fixture(['A', 'K'], ['10', '7']), score: { human: 2, bot: 1 } });
  const act = h.controller.act('stand'); await h.drain(); await act;
  const roundIndex = h.history.findIndex(v => v.result === 'human');
  const matchIndex = h.history.findIndex(v => v.winner === 'human');
  assert.ok(matchIndex > roundIndex);
  assert.equal(h.history[roundIndex].winner, null);
  assert.equal(h.history[matchIndex].busy, true);
  assert.equal(h.view().phase, 'match-complete');
  assert.deepEqual(h.view().score, { human: 3, bot: 1 });
  const restart = h.controller.advance(true);
  await h.controller.advance(true);
  await h.drain(); await restart;
  assert.equal(h.view().round, 1);
  assert.equal(h.view().handKey, 1);
  assert.deepEqual(h.view().score, { human: 0, bot: 0 });
  assert.equal(h.view().result, null);
});

test('unmount cancels every stage without late state updates or haptics', async () => {
  for (let cancelAt = 0; cancelAt < 15; cancelAt++) {
    const h = await ready(fixture(['10', '9'], ['2', '3'], ['4', '5', '3']));
    const act = h.controller.act('stand');
    for (let i = 0; i < cancelAt; i++) await h.tick();
    h.controller.dispose();
    const updates = h.history.length, feedback = h.feedback.length;
    await h.drain(); await act;
    assert.equal(h.history.length, updates);
    assert.equal(h.feedback.length, feedback);
  }
});

test('21 feedback fires once when a hit settles, not again on stand', async () => {
  const h = await ready(fixture(['10', '8'], ['10', '7'], ['3']));
  const hit = h.controller.act('hit');
  assert.equal(h.feedback.filter(f => f === 'twenty-one').length, 0);
  await h.drain(); await hit;
  assert.equal(h.view().humanTotal, 21);
  assert.equal(h.feedback.filter(f => f === 'twenty-one').length, 1);
  const stand = h.controller.act('stand');
  await h.drain(); await stand;
  assert.equal(h.feedback.filter(f => f === 'twenty-one').length, 1);
});

test('opponent 21 never signals through hidden cards or standing status', async () => {
  const h = await ready(fixture(['2', '3'], ['A', 'K'], ['4']));
  const hit = h.controller.act('hit'); await h.drain(); await hit;
  assert.equal(h.view().bot.status, 'standing');
  assert.equal(h.view().botTotal, null);
  assert.equal(h.feedback.filter(f => f === 'twenty-one').length, 0);
  const stand = h.controller.act('stand');
  while (h.view().botTotal === null) {
    assert.equal(h.feedback.filter(f => f === 'twenty-one').length, 0);
    await h.tick();
  }
  assert.equal(h.view().botTotal, 21);
  assert.equal(h.feedback.filter(f => f === 'twenty-one').length, 1);
  await h.drain(); await stand;
});

test('opening 21 has one distinct cue; other totals do not trigger it', async () => {
  const twentyOne = await ready(fixture(['A', 'K'], ['10', '7']));
  assert.deepEqual(twentyOne.feedback, ['deal', 'twenty-one', 'stand', 'clash', 'win']);
  const twenty = await ready(fixture(['K', 'Q'], ['10', '7']));
  assert.equal(twenty.feedback.includes('twenty-one'), false);
});

test('both locks produce one Clash and 300ms stillness before any reveal', async () => {
  const h = await ready(fixture(['10', '9'], ['10', '7']));
  const act = h.controller.act('stand');
  while (h.view().clash !== 'approach') await h.tick();
  const handLength = h.view().human.hand.length;
  for (const stage of ['approach', 'impact', 'still']) {
    assert.equal(h.view().clash, stage);
    assert.equal(h.view().revealed, 1);
    assert.equal(h.view().botTotal, null);
    assert.equal(h.view().busy, true);
    await h.controller.act('hit');
    await h.controller.advance(false);
    assert.equal(h.view().human.hand.length, handLength);
    if (stage === 'still') assert.equal(h.delays.at(-1), 300);
    await h.tick();
  }
  assert.equal(h.view().clash, 'complete');
  assert.equal(h.view().revealed, 2);
  await h.drain(); await act;
  assert.equal(h.feedback.filter(f => f === 'clash').length, 1);
});

test('bust resolution does not pretend both players locked or trigger Clash', async () => {
  const h = await ready(fixture(['10', '6'], ['9', '7'], ['K', 'Q']));
  const act = h.controller.act('hit'); await h.drain(); await act;
  assert.equal(h.view().result, 'draw');
  assert.equal(h.view().clash, 'idle');
  assert.equal(h.feedback.includes('clash'), false);
});

test('cancelling any Clash stage suppresses further reveal and feedback', async () => {
  for (const stage of ['approach', 'impact', 'still']) {
    const h = await ready(fixture(['10', '9'], ['10', '7']));
    const act = h.controller.act('stand');
    while (h.view().clash !== stage) await h.tick();
    h.controller.dispose();
    const updates = h.history.length, cues = h.feedback.length;
    await h.drain(); await act;
    assert.equal(h.history.length, updates);
    assert.equal(h.feedback.length, cues);
    assert.equal(h.view().revealed, 1);
  }
});

test('real draw completion gates totals, input and subsequent deals; cancellation releases waiters', async () => {
  const { DrawCompletion, drawId } = require('../.expo/presentation-tests/presentation/DrawCompletion');
  const gate = new DrawCompletion();
  const history = [];
  const c = new TableController(fixture(['10', '8'], ['10', '7'], ['3']), v => history.push(v), {
    settleDraw: gate.wait, wait: async () => true,
  });
  const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
  const start = c.start();
  await flush();
  assert.equal(history.at(-1).humanTotal, null);
  assert.equal(history.at(-1).botCount, 0);
  await c.act('hit');
  assert.equal(history.at(-1).humanCount, 1);
  for (const [side, count] of [['human', 1], ['bot', 1], ['human', 2], ['bot', 2]]) {
    gate.complete(drawId(0, side, count)); await flush();
  }
  await start;
  assert.equal(history.at(-1).busy, false);
  const hit = c.act('hit'); await flush();
  assert.equal(history.at(-1).humanCount, 3);
  assert.equal(history.at(-1).humanTotal, 18);
  await c.act('hit');
  assert.equal(history.at(-1).humanCount, 3);
  gate.complete(drawId(0, 'human', 3)); await flush(); await hit;
  assert.equal(history.at(-1).humanTotal, 21);
  const abort = new AbortController();
  const pending = gate.wait('cancelled', abort.signal);
  abort.abort();
  assert.equal(await pending, false);
  gate.complete('arrived-early');
  assert.equal(await gate.wait('arrived-early', new AbortController().signal), true);
  const reset = gate.wait('reset', new AbortController().signal);
  gate.reset();
  assert.equal(await reset, false);
  c.dispose();
});


test('gesture requests are action-only, mirrored after thinking, and stand feedback follows settlement', async () => {
  const h = await ready(fixture(['10', '9'], ['2', '3'], ['4', '5', '3']));
  assert.equal(h.view().humanGesture, null);
  assert.equal(h.view().botGesture, null);
  const act = h.controller.act('stand');
  assert.equal(h.view().humanGesture.action, 'stand');
  assert.equal(h.feedback.includes('stand'), false);
  await h.tick();
  assert.equal(h.view().humanCommitting, true);
  assert.equal(h.feedback.includes('stand'), false);
  await h.tick();
  assert.equal(h.view().humanCommitting, false);
  assert.equal(h.feedback.filter(f => f === 'stand').length, 1);
  await h.drain(); await act;
  const gestures = h.history.filter((v, i) => v.botGesture && v.botGesture.id !== h.history[i - 1]?.botGesture?.id);
  assert.deepEqual(gestures.map(v => v.botGesture.action), ['hit', 'hit', 'hit', 'stand']);
  for (const v of gestures) {
    assert.equal(v.thinking, false);
    assert.equal(v.botTotal, null);
    assert.deepEqual(Object.keys(v.botGesture).sort(), ['action', 'id']);
  }
});


test('hit to 21 plays signature before automatic lock, rejecting duplicate hits throughout', async () => {
  const h = await ready(fixture(['10', '5'], ['10', '7'], ['6', 'K']));
  const action = h.controller.act('hit');
  while (h.view().humanTotal !== 21) await h.tick();
  assert.equal(h.view().busy, true);
  assert.equal(h.view().human.status, 'playing');
  await h.controller.act('hit');
  await h.drain(); await action;
  assert.equal(h.view().humanCount, 3);
  assert.equal(h.view().human.status, 'standing');
  assert.equal(h.view().humanGesture.action, 'stand');
  assert.ok(h.feedback.indexOf('twenty-one') < h.feedback.indexOf('stand'));
  assert.equal(h.feedback.filter(x => x === 'twenty-one').length, 1);
  await h.controller.act('hit');
  assert.equal(h.view().humanCount, 3);
});

test('opening 21 locks either side automatically without drawing or leaking bot total', async () => {
  const human = await ready(fixture(['A', 'K'], ['10', '7'], ['K']));
  assert.equal(human.view().humanCount, 2);
  assert.equal(human.view().human.status, 'standing');
  const bot = await ready(fixture(['10', '5'], ['A', 'K'], ['2']));
  assert.equal(bot.view().botCount, 2);
  assert.equal(bot.view().bot.status, 'standing');
  assert.equal(bot.view().botTotal, null);
  assert.equal(bot.feedback.includes('twenty-one'), false);
  const action = bot.controller.act('hit'); await bot.drain(); await action;
  assert.equal(bot.view().botCount, 2);
});

