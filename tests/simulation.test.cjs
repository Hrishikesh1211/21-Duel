const {test}=require('node:test');
const assert=require('node:assert/strict');
const {simulateMatch,strategyView}=require('../.expo/presentation-tests/simulation/simulate');
const {simulateSeries}=require('../.expo/presentation-tests/simulation/series');
const {getStrategy,strategies}=require('../.expo/presentation-tests/simulation/strategies');
const {createMatch}=require('../.expo/presentation-tests/game/engine');
const {modeConfig}=require('../.expo/presentation-tests/game/rulesConfig');
const {seededRandom}=require('../.expo/presentation-tests/simulation/random');
const A=getStrategy('SMART_BASELINE'),B=getStrategy('RANDOM');
test('seeded single matches and balanced series reproduce exactly',()=>{
 assert.deepEqual(simulateMatch(A,B,42),simulateMatch(A,B,42));assert.deepEqual(simulateSeries(A,B,200,42),simulateSeries(A,B,200,42));assert.notDeepEqual(simulateMatch(A,B,42),simulateMatch(A,B,43));
 const random=seededRandom(0);for(let i=0;i<10000;i++){const x=random();assert.ok(x>=0&&x<1);}
});
test('reversed seats map the strategies and opening Raise actor correctly',()=>{
 const aggressive=getStrategy('ALWAYS_RAISE'),never=getStrategy('NEVER_RAISE');const one=simulateMatch(aggressive,never,52),two=simulateMatch(aggressive,never,52,{seatA:'bot'});
 assert.equal(one.rounds[0].first,'A');assert.equal(one.rounds[0].raisedBy,'A');assert.equal(two.rounds[0].first,'B');assert.equal(two.rounds[0].raisedBy,null);
 const series=simulateSeries(aggressive,never,200,42);assert.equal(series.seats.matchesPerSeat,100);assert.equal(series.wins,series.seats.seat1Wins+series.seats.seat2Wins);
});
test('strategy projection omits hidden cards, future deck and RNG, and copies visible cards',()=>{
 const state=createMatch(seededRandom(123),'ranked_duel');
 const view=strategyView(state,'human');assert.deepEqual(Object.keys(view).sort(),['ownCards','ownTotal','opponentUpcard','ownScore','opponentScore','roundValue','firstActor','opponentRaised','targetScore'].sort());
 assert.equal(view.ownCards.length,2);assert.deepEqual(view.opponentUpcard,state.bot.hand[0]);
 view.ownCards[0].rank='K';view.opponentUpcard.rank='K';assert.notEqual(view.ownCards[0],state.human.hand[0]);assert.notEqual(view.opponentUpcard,state.bot.hand[0]);
 const changed={...state,deck:[],bot:{...state.bot,hand:[state.bot.hand[0],{rank:'A',suit:'spades'}]}};assert.deepEqual(strategyView(state,'human'),strategyView(changed,'human'));
 const fs=require('fs');const source=fs.readFileSync('src/simulation/strategies.ts','utf8');assert.doesNotMatch(source,/MatchState|hitStream|\.deck|\.bot\.hand|\.human\.hand/);
});
test('every simulator round follows production Fold, called-round, tie and target scoring',()=>{
 let folds=0,called=0,ties=0,overshoots=0;
 for(let seed=0;seed<300;seed++){
 const match=simulateMatch(A,B,seed);let a=0,b=0;
 for(const round of match.rounds){const expected=round.winner==='draw'?0:round.foldedBy?1:round.called?2:1;assert.equal(round.pointsA+round.pointsB,expected);a+=round.pointsA;b+=round.pointsB;folds+=!!round.foldedBy;called+=round.called;ties+=round.winner==='draw';}
 assert.equal(a,match.scoreA);assert.equal(b,match.scoreB);assert.ok(Math.max(a,b)>=modeConfig(match.mode).targetScore);assert.ok(Math.min(a,b)<7);overshoots+=Math.max(a,b)>7;
 }
 assert.ok(folds>0&&called>0&&ties>0&&overshoots>0);
});
test('folds do not draw, and unresolved folded hands are excluded from hand metrics',()=>{
 const fold={...getStrategy('NEVER_RAISE'),id:'FOLD',respond:()=> 'fold'};const raise=getStrategy('ALWAYS_RAISE');
 const match=simulateMatch(raise,fold,32);for(const round of match.rounds.filter(r=>r.foldedBy)){assert.equal(round.handA.hits,0);assert.equal(round.handB.hits,0);assert.equal(round.pointsA,1);assert.equal(round.pointsB,0);}
 const series=simulateSeries(raise,fold,100,32);assert.equal(series.sides.A.hands,series.totalRounds-(series.raisedRounds-series.calledRounds));assert.equal(series.sides.B.hands,series.sides.A.hands);
});
test('identical deterministic policies cancel aggregate labeling advantage but retain seat measurement',()=>{
 const series=simulateSeries(getStrategy('SIMPLE_17'),getStrategy('SIMPLE_17'),200,123);assert.equal(series.winRate,0.5);assert.equal(series.averageScoreDifferential,0);assert.equal(series.draws,0);assert.equal(series.exactSevenRate,1);assert.equal(series.raisedRounds,0);
});
test('all eight strategies complete both production modes without illegal decisions',()=>{
 for(const strategy of strategies)for(const mode of ['ranked_duel','ranked_mirror']){const result=simulateMatch(strategy,A,293,{mode});assert.ok(result.rounds.length>0);assert.ok(Math.max(result.scoreA,result.scoreB)>=7);}
});
test('hand, action and pacing metrics reconcile to observed rounds and points',()=>{
 const result=simulateSeries(A,B,300,234);
 assert.equal(result.sides.A.raises+result.sides.B.raises,result.raisedRounds);assert.equal(result.sides.A.calls+result.sides.B.calls,result.calledRounds);assert.equal(result.sides.A.folds+result.sides.B.folds,result.raisedRounds-result.calledRounds);
 assert.equal(result.sides.A.firstOpportunities+result.sides.B.firstOpportunities,result.totalRounds);assert.equal(Object.values(result.roundsHistogram).reduce((a,b)=>a+b,0),result.matchCount);assert.equal(Object.values(result.finalScoreDistribution).reduce((a,b)=>a+b,0),result.matchCount);assert.equal(result.exactSevenRate+result.eightPlusRate,1);
});
test('unbalanced counts and illegal strategy actions fail instead of fabricating outcomes',()=>{
 assert.throws(()=>simulateSeries(A,B,3,1),/even/);assert.throws(()=>simulateSeries(A,B,0,1),/even/);assert.throws(()=>simulateMatch({...A,first:()=> 'call'},B,1),/Illegal strategy/);
});
test('report orientation reverses wins and keeps actual seat identities',()=>{
 const {oriented}=require('../scripts/simulation-report.cjs');
 const r={strategyA:'A',strategyB:'B',winRate:0.6,winRateCI95:[0.55,0.65],seats:{seat1WinRate:0.7,seat2WinRate:0.5,difference:0.2}};
 const direct=oriented(r,'A'),reverse=oriented(r,'B');assert.equal(direct.win,0.6);assert.equal(reverse.win,0.4);assert.equal(reverse.seat1,0.5);assert.ok(Math.abs(reverse.seat2-0.3)<1e-12);assert.equal(reverse.difference,0.2);assert.ok(Math.abs(reverse.ci[0]-0.35)<1e-12);
});

