const { test } = require('node:test');
const assert = require('node:assert/strict');
const { KNOCK_POSITIONS, chooseKnockPosition, knockPlacement } = require('../.expo/presentation-tests/presentation/knockPlacement.js');

test('KNOCK selection is injectable and covers only predefined zones', () => {
  for (let i = 0; i < 4; i++) assert.equal(chooseKnockPosition(() => (i + 0.5) / 4), i);
  assert.equal(chooseKnockPosition(() => 0), 0);
  assert.equal(chooseKnockPosition(() => 1), 3);
});

test('all KNOCK zones fit outside cards and central information at small through large phone widths', () => {
  for (const width of [280, 335, 353, 390, 440]) {
    for (const opponent of [false, true]) {
      for (let i = 0; i < KNOCK_POSITIONS.length; i++) {
        const p = knockPlacement(i, width, opponent);
        const localCenter = p.left + 22;
        const x = width * 0.72 - 85 + (opponent ? 170 - localCenter : localCenter);
        // Conservative envelope includes 12% scaling, rotation, and impact strokes.
        assert.ok(x - 32 >= width / 2 + 56);
        assert.ok(x + 32 <= width - 8);
        const y = opponent ? -28 + 32 - (p.top + 7.5) : -4 + p.top + 7.5;
        assert.ok(opponent ? y + 14 < 6 : y - 14 > -6);
        assert.ok(Math.abs(p.rotation) <= 6);
      }
    }
  }
});
