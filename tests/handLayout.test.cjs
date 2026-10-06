const { test } = require('node:test');
const assert = require('node:assert/strict');
const { handLayout } = require('../.expo/presentation-tests/presentation/handLayout');
test('hands preserve two-card spacing, tighten progressively, stay centered and reserve stable height', () => {
  for (const [width, card] of [[280,70],[280,54],[353,94],[353,72],[390,108],[390,82]]) {
    let previous = Infinity;
    for (const count of [2,3,4,5,6,7,8,12]) {
      const layout = handLayout(count, card, width);
      assert.ok(layout.step <= previous); previous = layout.step;
      assert.equal(layout.height, card * 1.43 + 12);
      assert.ok(layout.step >= 30);
      assert.equal(layout.start + layout.width / 2, layout.contentWidth / 2);
      if (count === 2) assert.equal(layout.step, card * 0.82);
      if (count <= 6) assert.ok(layout.width <= width + 0.001);
    }
  }
});
