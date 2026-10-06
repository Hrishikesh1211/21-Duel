const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MODE_LIST, FEATURED_MODE, modeConfig } = require('../.expo/presentation-tests/game/rulesConfig');
const { createMatch, newRound, rematch, playDecision, raiseDecision, opponentView, raiseTimeout } = require('../.expo/presentation-tests/game/engine');
const { competitiveReducer: reduce, divisionFor } = require('../.expo/presentation-tests/competitive/session');
const { fairPlayReducer, initialFairPlay } = require('../.expo/presentation-tests/presentation/fairPlay');
const { TableController, visibleBotCards } = require('../.expo/presentation-tests/presentation/TableController');
const seeded = seed => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const hand = (...ranks) => ranks.map(rank => ({ rank, suit: 'hearts' }));
const player = { name: 'ALVIN', rating: 1482, ...divisionFor(1482), wins: 24, losses: 17 };
const initial = () => ({ player, activeMatchId: null, nextMatchId: 1, result: null });
const cases = [
  ['ranked_duel','shared',true,7,true], ['ranked_mirror','mirrored',true,7,true],
  ['casual_duel','shared',false,3,false], ['casual_mirror','mirrored',false,3,false],
];
for (const [id,deck,raise,target,rating] of cases) {
  test(`${id} composes the configured deck, Raise/Fold, target and rating`, () => {
    const config = modeConfig(id); assert.equal(config.deckModel, deck); assert.equal(config.raiseFoldEnabled, raise); assert.equal(config.targetScore, target); assert.equal(config.ratingEnabled, rating);
    const state = createMatch(seeded(42), id); assert.equal(state.mode, id); assert.equal(state.phase, raise ? 'preRaiseDecision' : 'playing');
    assert.equal(!!state.ranked, deck === 'mirrored'); assert.equal(state.deck.length, deck === 'shared' ? 48 : 0);
    if (!raise) assert.equal(raiseDecision(state,'human','raise'), state);
    const next = rematch(seeded(42), id); assert.deepEqual(next, state);
  });
  test(`${id} reaches its configured match target using the same engine`, () => {
    let state = createMatch(seeded(2), id);
    if (raise) state = raiseDecision(state, 'human', 'pass');
    state = { ...state, score: { human: target - 1, bot: 0 }, human: { hand: hand('10','9'), status: 'playing' }, bot: { hand: hand('10','7'), status: 'playing' } };
    const next = playDecision(state,'stand',() => 'stand'); assert.equal(next.score.human,target); assert.equal(next.winner,'human'); assert.equal(next.phase,'match-complete');
  });
  test(`${id} rating policy is enforced by reducer for wins, losses and draws`, () => {
    for (const outcome of ['win','loss','draw']) {
      const session = reduce(initial(), { type: 'start', mode: id });
      const event = { type: 'finish', matchId: session.activeMatchId, match: { outcome, playerRounds: target, opponentRounds: 1 } };
      const next = reduce(session,event);
      assert.equal(next.activeMode,id); assert.equal(reduce(next,event),next);
      if (rating) {
        assert.equal(next.result.mode,id); assert.equal(next.casualResult,null);
        assert.equal(next.player.rating, player.rating + ({ win: 14, loss: -11, draw: 0 })[outcome]);
        assert.equal(next.player.wins, player.wins + (outcome === 'win' ? 1 : 0));
        assert.equal(next.player.losses, player.losses + (outcome === 'loss' ? 1 : 0));
      } else {
        assert.equal(next.player,player); assert.deepEqual(next.player,player); assert.equal(next.result,null); assert.equal(next.casualResult.mode,id);
      }
    }
  });
}
test('the four public choices use Ranked Duel as the featured default', () => {
  assert.equal(FEATURED_MODE,'ranked_duel'); assert.deepEqual(MODE_LIST.map(m => m.id),cases.map(c => c[0]));
});
test('both shared modes consume consecutive distinct deck cards', () => {
  for (const id of ['ranked_duel','casual_duel']) {
    let state = createMatch(seeded(9), id); if (state.phase === 'preRaiseDecision') state = raiseDecision(state,'human','pass');
    state = { ...state, human: { hand: hand('2','3'), status:'playing' }, bot: { hand: hand('2','4'), status:'playing' }, deck: hand('5','6','7') };
    const next = playDecision(state,'hit',()=>'hit'); assert.equal(next.human.hand[2].rank,'5'); assert.equal(next.bot.hand[2].rank,'6'); assert.equal(next.deck.length,1);
  }
});
test('Ranked Mirror Raise/Call preserve paired openings, stream and cursors', () => {
  const state = createMatch(seeded(8),'ranked_mirror'); const before = JSON.stringify(state.ranked);
  const raised = raiseDecision(state,'human','raise'); const called = raiseDecision(raised,'bot','call');
  assert.equal(called.ranked,state.ranked); assert.equal(JSON.stringify(called.ranked),before); assert.equal(called.roundValue,2);
  const fixture = { ...called, human: { hand: hand('2','3'), status:'playing' }, bot: { hand: hand('2','4'), status:'playing' }, ranked: { ...called.ranked, hitStream: hand('5','6') } };
  const next = playDecision(fixture,'hit',()=>'hit'); assert.deepEqual(next.human.hand[2],next.bot.hand[2]); assert.equal(next.ranked.humanHitIndex,1); assert.equal(next.ranked.botHitIndex,1);
});
test('Ranked Mirror Fold reveals nothing and preserves swapped next-round openings', () => {
  const state = createMatch(seeded(8),'ranked_mirror'); const folded = raiseDecision(raiseDecision(state,'human','raise'),'bot','fold');
  assert.equal(folded.score.human,1); assert.deepEqual(opponentView(folded).cards,[null,null]); assert.equal(opponentView(folded).total,null);
  const next = newRound(folded,seeded(9)); assert.equal(next.mode,'ranked_mirror'); assert.equal(next.ranked.pair,state.ranked.pair);
  assert.deepEqual(next.human.hand,state.bot.hand); assert.deepEqual(next.bot.hand,state.human.hand); assert.equal(next.firstActor,'bot'); assert.equal(next.phase,'preRaiseDecision'); assert.equal(next.roundValue,1);
});
test('Casual Mirror uses swapped openings and hides bust until both hands finish', () => {
  let state = createMatch(seeded(8),'casual_mirror');
  const next = newRound({ ...state,phase:'round-complete' },seeded(9)); assert.deepEqual(next.human.hand,state.bot.hand); assert.deepEqual(next.bot.hand,state.human.hand); assert.equal(next.phase,'playing');
  state = { ...state, human: { hand: hand('2','3'), status:'playing' }, bot: { hand: hand('10','9'), status:'playing' }, ranked: { ...state.ranked,hitStream:hand('5','6') } };
  state = playDecision(state,'hit',()=>'hit'); assert.equal(state.bot.status,'bust'); assert.equal(state.phase,'playing'); assert.equal(opponentView(state).total,null); assert.equal(opponentView(state).status,'standing');
  state = playDecision(state,'stand'); assert.equal(state.result,'human'); assert.equal(state.score.human,1);
});
test('new Ranked modes both support two-point crossing-seven wins and timeout defaults', () => {
  for (const id of ['ranked_duel','ranked_mirror']) {
    const state = createMatch(seeded(8),id); assert.equal(raiseTimeout(state).phase,'playing');
    const raised = raiseDecision(state,'human','raise'); assert.equal(raiseTimeout(raised).folded,'bot');
    const called = { ...raiseDecision(raised,'bot','call'), score:{human:6,bot:5}, human:{hand:hand('10','9'),status:'playing'}, bot:{hand:hand('10','7'),status:'playing'} };
    const next = playDecision(called,'stand',()=>'stand'); assert.equal(next.score.human,8); assert.equal(next.winner,'human');
  }
});
test('returning Home clears transient matches/results but preserves the session player', () => {
  for (const [mode] of cases) {
    let state = reduce(initial(),{type:'start',mode});
    state = reduce(state,{type:'finish',matchId:state.activeMatchId,match:{outcome:'win',playerRounds:7,opponentRounds:5}});
    const settledPlayer = state.player; const oldId = state.nextMatchId - 1;
    state = reduce(state,{type:'abandon'}); assert.equal(state.player,settledPlayer); assert.equal(state.activeMode,null); assert.equal(state.activeMatchId,null); assert.equal(state.result,null); assert.equal(state.casualResult,null);
    const started = reduce(state,{type:'start',mode}); assert.equal(started.activeMode,mode); assert.equal(started.player,settledPlayer);
    assert.equal(reduce(started,{type:'finish',matchId:oldId,match:{outcome:'loss',playerRounds:1,opponentRounds:7}}),started);
  }
});
test('Ranked rules acknowledgments are remembered separately; Casual skips entry rules', () => {
  let state = fairPlayReducer(initialFairPlay,{type:'enter',mode:'ranked_duel'}); assert.equal(state.open,true);
  state = fairPlayReducer(state,{type:'acknowledge'}); state = fairPlayReducer(state,{type:'enter',mode:'ranked_mirror'}); assert.equal(state.open,true);
  state = fairPlayReducer(state,{type:'acknowledge'}); assert.equal(fairPlayReducer(state,{type:'enter',mode:'ranked_duel'}).open,false);
  for (const mode of ['casual_duel','casual_mirror']) assert.equal(fairPlayReducer(initialFairPlay,{type:'enter',mode}).open,false);
});
test('Ranked Mirror controller composes pre-round with existing hidden reveal and cancels cleanly', async () => {
  const views = []; const c = new TableController(createMatch(seeded(8),'ranked_mirror'),v=>views.push(v), { wait:async ms=>ms===250||ms===1200?false:true });
  await c.start(); assert.equal(views.at(-1).phase,'preRaiseDecision'); await c.preAct('raise');
  assert.equal(views.at(-1).phase,'waitingForRaiseResponse'); assert.equal(views.at(-1).roundValue,2); assert.deepEqual(visibleBotCards(views.at(-1)).slice(1),[null]);
  c.dispose(); const count=views.length; await c.preAct('pass'); c.checkRaiseTimeout(); assert.equal(views.length,count);
});
