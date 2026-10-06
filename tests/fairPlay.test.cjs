const { test } = require('node:test');
const assert = require('node:assert/strict');
const { fairPlayReducer: reduce, initialFairPlay } = require('../.expo/presentation-tests/presentation/fairPlay');
const { MatchmakingController } = require('../.expo/presentation-tests/presentation/MatchmakingController');

test('first Ranked entry requires acknowledgment; subsequent entries skip', () => {
  let state = reduce(initialFairPlay, { type: 'enter', mode: 'ranked' });
  assert.equal(state.open, true); assert.equal(state.seen, false);
  state = reduce(state, { type: 'acknowledge' });
  assert.equal(state.open, false); assert.equal(state.seen, true);
  assert.equal(reduce(state, { type: 'acknowledge' }), state);
  assert.equal(reduce(state, { type: 'enter', mode: 'ranked' }).open, false);
});
test('manual reopen reuses the explainer without forgetting acknowledgment', () => {
  let state = { seen: true, open: false };
  state = reduce(state, { type: 'reopen', mode: 'ranked' });
  assert.equal(state.open, true);
  state = reduce(state, { type: 'cancel' });
  assert.equal(state.seen, true); assert.equal(state.open, false);
  assert.equal(reduce(state, { type: 'enter', mode: 'ranked' }).open, false);
});
test('cancel/back before acknowledgment does not mark the explainer seen', () => {
  const cancelled = reduce(reduce(initialFairPlay, { type: 'enter', mode: 'ranked' }), { type: 'cancel' });
  assert.equal(cancelled.seen, false);
  assert.equal(reduce(cancelled, { type: 'enter', mode: 'ranked' }).open, true);
});
test('Casual never opens Ranked Fair Play or marks it seen', () => {
  for (const seen of [false, true]) for (const type of ['enter', 'reopen']) {
    const next = reduce({ seen, open: false }, { type, mode: 'casual' });
    assert.deepEqual(next, { seen, open: false });
  }
});
test('search cancellation before reopening suppresses even already-queued callbacks', () => {
  let found = 0, complete = 0, scheduled = 0;
  const pending = [];
  const create = () => new MatchmakingController(() => {}, { random: () => 0,
    onFound: () => found++, onComplete: () => complete++,
    schedule: callback => { scheduled++; pending.push(callback); return () => {}; },
  });
  let state = reduce(initialFairPlay, { type: 'enter', mode: 'ranked' });
  assert.equal(scheduled, 0); // The explainer has no mounted search controller.
  state = reduce(state, { type: 'acknowledge' });
  const first = create(); first.start();
  assert.equal(first.cancel(), true);
  state = reduce(state, { type: 'reopen', mode: 'ranked' });
  pending.shift()();
  assert.equal(found, 0); assert.equal(complete, 0); assert.equal(scheduled, 1);
  state = reduce(state, { type: 'acknowledge' });
  assert.equal(state.open, false);
  const second = create(); second.start(); second.start();
  while (pending.length) pending.shift()();
  assert.equal(found, 1); assert.equal(complete, 1);
  first.dispose(); second.dispose();
});
