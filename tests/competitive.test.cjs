const { test } = require('node:test');
const assert = require('node:assert/strict');
const { applyResult, competitiveReducer: reduce, divisionFor } = require('../.expo/presentation-tests/competitive/session');
const player = { name: 'ALVIN', rating: 1482, ...divisionFor(1482), wins: 24, losses: 17 };
const match = outcome => ({ outcome, playerRounds: outcome === 'win' ? 3 : 1, opponentRounds: outcome === 'loss' ? 3 : 1 });
test('deterministic rating and records for win, loss, and draw; input stays immutable', () => {
  for (const [outcome, rating, wins, losses] of [['win', 1496, 25, 17], ['loss', 1471, 24, 18], ['draw', 1482, 24, 17]]) {
    const result = applyResult(player, 1, match(outcome));
    assert.equal(result.oldRating, 1482); assert.equal(result.newRating, rating);
    assert.equal(result.ratingDelta, rating - 1482);
    assert.equal(result.player.wins, wins); assert.equal(result.player.losses, losses);
    assert.equal(result.player.nextDivisionRating, 1520); assert.equal(result.promoted, false);
  }
  assert.equal(player.rating, 1482); assert.equal(player.wins, 24);
});
test('promotion crosses 1520 and updates next target; demotion and exact boundaries are consistent', () => {
  const result = applyResult({ ...player, rating: 1513 }, 2, match('win'));
  assert.equal(result.newRating, 1527); assert.equal(result.oldDivision, 'SILVER II');
  assert.equal(result.player.division, 'SILVER I'); assert.equal(result.promoted, true);
  assert.equal(result.player.nextDivisionRating, 1640);
  assert.equal(divisionFor(1520).division, 'SILVER I');
  assert.equal(divisionFor(1519).division, 'SILVER II');
  const loss = applyResult(result.player, 3, match('loss'));
  assert.equal(loss.player.division, 'SILVER II'); assert.equal(loss.promoted, false);
});
test('session applies each completed match once, ignores stale results and abandoned matches', () => {
  let s = { player, activeMatchId: null, nextMatchId: 1, result: null };
  s = reduce(s, { type: 'start' }); const finish = { type: 'finish', matchId: 1, match: match('win') };
  s = reduce(s, finish); const settled = s;
  assert.equal(reduce(s, finish), settled);
  s = reduce(s, { type: 'start' }); assert.equal(s.activeMatchId, 2);
  assert.equal(reduce(s, finish), s);
  s = reduce(s, { type: 'finish', matchId: 2, match: match('loss') });
  assert.equal(s.player.rating, 1485); assert.equal(s.player.wins, 25); assert.equal(s.player.losses, 18);
  s = reduce(s, { type: 'start' }); s = reduce(s, { type: 'abandon' });
  assert.equal(reduce(s, { type: 'finish', matchId: 3, match: match('win') }), s);
});


test('win then loss apply once; Home return and rematch preserve the authoritative updated player', () => {
  let s = { player, activeMatchId: null, nextMatchId: 1, result: null };
  for (const [outcome, expected] of [['win', 1496], ['loss', 1485]]) {
    s = reduce(s, { type: 'start' });
    const event = { type: 'finish', matchId: s.activeMatchId, match: match(outcome) };
    s = reduce(s, event);
    assert.equal(s.player.rating, expected);
    assert.equal(s.result.newRating, s.player.rating);
    assert.equal(s.result.player, s.player);
    assert.equal(reduce(s, event), s);
    const home = reduce(s, { type: 'abandon' });
    assert.equal(home.player, s.player);
    const rematch = reduce(home, { type: 'start' });
    assert.equal(rematch.player, s.player);
    assert.equal(rematch.result, null);
    assert.equal(reduce(rematch, event), rematch);
    s = home;
  }
  assert.equal(s.player.wins, 25); assert.equal(s.player.losses, 18);
});

test('completed Ranked history records opponent, actual delta, peak and count once; cancel preserves it',()=>{
  let s={player,activeMatchId:null,nextMatchId:1,result:null,peakRating:1490,rankedMatchCount:41,recentMatches:[]};
  s=reduce(s,{type:'start',mode:'ranked_mirror'});
  const finish={type:'finish',matchId:s.activeMatchId,match:{outcome:'win',playerRounds:7,opponentRounds:5},opponentName:'JUNE',timestamp:1234};
  s=reduce(s,finish);
  assert.deepEqual(s.recentMatches[0],{id:'local-1',opponentName:'JUNE',modeId:'ranked_mirror',outcome:'win',playerScore:7,opponentScore:5,ratingDelta:14,timestamp:1234,source:'session'});
  assert.equal(s.peakRating,1496);assert.equal(s.rankedMatchCount,42);
  assert.equal(reduce(s,finish),s);
  s=reduce(s,{type:'start',mode:'ranked_duel'});
  s=reduce(s,{type:'finish',matchId:s.activeMatchId,match:{outcome:'loss',playerRounds:6,opponentRounds:7},opponentName:'MASON',timestamp:2345});
  assert.equal(s.peakRating,1496);assert.equal(s.rankedMatchCount,43);
  assert.equal(s.recentMatches[0].ratingDelta,-11);
  const history=s.recentMatches;
  s=reduce(s,{type:'start'});const cancelledId=s.activeMatchId;s=reduce(s,{type:'abandon'});
  assert.equal(s.recentMatches,history);
  assert.equal(reduce(s,{...finish,matchId:cancelledId}),s);
});
test('Casual history has no rating delta and keeps competitive record, count and peak; history is capped at five',()=>{
  let s={player,activeMatchId:null,nextMatchId:1,result:null,peakRating:1511,rankedMatchCount:41,recentMatches:[]};
  const original=s;
  for(let i=0;i<7;i++){
    s=reduce(s,{type:'start',mode:i%2?'casual_duel':'casual_mirror'});
    s=reduce(s,{type:'finish',matchId:s.activeMatchId,match:{outcome:'win',playerRounds:3,opponentRounds:1},opponentName:'NOVA',timestamp:i+1});
  }
  assert.equal(s.player,player);assert.equal(s.peakRating,1511);assert.equal(s.rankedMatchCount,41);
  assert.equal(s.recentMatches.length,5);assert.equal(s.recentMatches[0].id,'local-7');assert.equal(s.recentMatches[4].id,'local-3');
  assert.ok(s.recentMatches.every(row=>!Object.hasOwn(row,'ratingDelta')));
  assert.deepEqual(original.recentMatches,[]);
});
test('Ranked draws count as completed matches and history uses actual rating-floor delta',()=>{
  let s={player:{...player,rating:5,...divisionFor(5)},activeMatchId:null,nextMatchId:1,result:null};
  s=reduce(s,{type:'start',mode:'ranked_duel'});
  s=reduce(s,{type:'finish',matchId:s.activeMatchId,match:{outcome:'loss',playerRounds:0,opponentRounds:7}});
  assert.equal(s.recentMatches[0].ratingDelta,-5);
  s=reduce(s,{type:'start',mode:'ranked_duel'});
  s=reduce(s,{type:'finish',matchId:s.activeMatchId,match:{outcome:'draw',playerRounds:7,opponentRounds:7}});
  assert.equal(s.recentMatches[0].ratingDelta,0);
  assert.equal(s.rankedMatchCount,43);
});
