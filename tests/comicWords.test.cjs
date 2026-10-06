const { test } = require('node:test');
const assert = require('node:assert/strict');
const { HIT_WORDS, chooseHitWord } = require('../.expo/presentation-tests/presentation/comicWords.js');

test('HIT uses only TAP and KNOCK with injectable selection and allowed repeats', () => {
  assert.deepEqual(HIT_WORDS, ['TAP', 'KNOCK']);
  assert.equal(chooseHitWord(() => 0), 'TAP');
  assert.equal(chooseHitWord(() => 0.499), 'TAP');
  assert.equal(chooseHitWord(() => 0.5), 'KNOCK');
  assert.equal(chooseHitWord(() => 1), 'KNOCK');
  assert.deepEqual([0, 0].map(() => chooseHitWord(() => 0.8)), ['KNOCK', 'KNOCK']);
});
