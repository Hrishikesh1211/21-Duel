const { test } = require('node:test');
const assert = require('node:assert/strict');
const { divisionFor, divisions, competitiveReducer } = require('../.expo/presentation-tests/competitive/session');
const { rankView } = require('../.expo/presentation-tests/competitive/rankView');
const player = rating => ({ name: 'ALVIN', rating, ...divisionFor(rating), wins: 24, losses: 17 });

test('division lookup and next targets agree at every configured boundary', () => {
  divisions.forEach((division, index) => {
    const view = rankView(player(division.min));
    assert.equal(view.division, division.name);
    assert.deepEqual(view.next, divisions[index + 1] ?? null);
    assert.equal(view.progress, index === divisions.length - 1 ? 1 : 0);
    if (index) assert.equal(rankView(player(division.min - 1)).division, divisions[index - 1].name);
    assert.equal(view.ladder.filter(row => row.current).length, 1);
  });
});
test('progress reflects rating distance and handles the top of the local ladder', () => {
  const rank = rankView(player(1482));
  assert.equal(rank.remaining, 38);
  assert.equal(rank.progress, 82 / 120);
  assert.equal(rank.ladder.find(row => row.current).max, 1519);
  assert.equal(rankView(player(1460)).progress, 0.5);
  assert.equal(rankView(player(2000)).next, null);
  assert.equal(rankView(player(2000)).progress, 1);
});
test('Rank render data follows session wins, promotion and demotion without stale fields', () => {
  let session = { player: player(1513), activeMatchId: null, nextMatchId: 1, result: null };
  const finish = outcome => {
    session = competitiveReducer(session, { type: 'start' });
    session = competitiveReducer(session, { type: 'finish', matchId: session.activeMatchId, match: { outcome, playerRounds: 3, opponentRounds: 1 } });
    return rankView(session.player);
  };
  const promoted = finish('win');
  assert.equal(promoted.rating, 1527);
  assert.equal(promoted.division, 'SILVER I');
  assert.equal(promoted.next.min, 1640);
  assert.equal(promoted.progress, 7 / 120);
  assert.equal(promoted.ladder.find(row => row.current).name, session.result.player.division);
  const demoted = finish('loss');
  assert.equal(demoted.rating, 1516);
  assert.equal(demoted.division, 'SILVER II');
  assert.equal(demoted.remaining, 4);
  assert.equal(demoted.progress, 116 / 120);
});
