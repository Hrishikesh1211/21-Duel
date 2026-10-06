const {execFileSync}=require('node:child_process');
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),args=process.argv.slice(2);const option=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
const matchCount=Number(option('--matches','100000')),seed=Number(option('--seed','20261006')),cfPairs=Number(option('--counterfactual-pairs','10000'));
if(!Number.isSafeInteger(matchCount)||matchCount<4||matchCount%2)throw Error('Matches must be even and >=4.');
if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff||!Number.isSafeInteger(cfPairs)||cfPairs<0)throw Error('Invalid seed or counterfactual pair count.');
const output=path.resolve(root,option('--output','docs'));fs.mkdirSync(output,{recursive:true});
execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--ignoreConfig','--target','ES2020','--module','commonjs','--moduleResolution','node','--ignoreDeprecations','6.0','--strict','--skipLibCheck','--rootDir','src','--outDir','.expo/simulation','src/simulation/series.ts','src/simulation/foldPolicies.ts','src/simulation/foldMetrics.ts','src/simulation/foldCounterfactual.ts'],{cwd:root,stdio:'inherit'});
const {foldPolicies,foldOpponents}=require('../.expo/simulation/simulation/foldPolicies');
const {getStrategy}=require('../.expo/simulation/simulation/strategies');const {simulateSeries}=require('../.expo/simulation/simulation/series');
const {simulateFromCheckpoint}=require('../.expo/simulation/simulation/simulate');const {seededRandom,mixSeed}=require('../.expo/simulation/simulation/random');
const {createFoldCollector,mergeFoldMetrics}=require('../.expo/simulation/simulation/foldMetrics');const {createCounterfactualCollector,pairedOutcomeSummary}=require('../.expo/simulation/simulation/foldCounterfactual');
const {writeFoldReport}=require('./fold-ablation-report.cjs');const {GAME_MODES}=require('../.expo/simulation/game/rulesConfig');
const baseline=foldPolicies[0];const shared=getStrategy('SMART_BASELINE');for(const p of foldPolicies){assert.equal(p.play,shared.play);assert.equal(p.first,shared.first);}
const rows=[],buffers={},cfByOpponent=[],cfAll=createCounterfactualCollector(),start=Date.now();
for(const policy of foldPolicies){buffers[policy.id]={};for(const opponentId of foldOpponents){
 const opponent=getStrategy(opponentId),outcomes=new Uint8Array(matchCount),collector=createFoldCollector(),cf=createCounterfactualCollector();
 let index=0,candidate=null,responseCount=0,sampleRandom=null;const t=Date.now();
 const sampling=policy.id==='ALWAYS_CALL'&&cfPairs>0;
 const series=simulateSeries(policy,opponent,matchCount,seed,{matchOptions:{captureResponses:true,...(sampling?{onResponseCheckpoint:(checkpoint,view)=>{
   if(Math.floor(index/2)>=Math.min(cfPairs,matchCount/2))return;
   if(!sampleRandom)sampleRandom=seededRandom(mixSeed(checkpoint.seed^0xcf0d2026^(checkpoint.seatA==='human'?0x11111111:0x22222222)));
   responseCount++;if(sampleRandom()<1/responseCount)candidate={checkpoint,view};
 }}:{})},onMatch:match=>{
   outcomes[index++]=Number(match.winner==='A');collector.add(match);
   if(candidate){const {checkpoint,view}=candidate;const call=simulateFromCheckpoint(baseline,opponent,checkpoint,'call'),fold=simulateFromCheckpoint(baseline,opponent,checkpoint,'fold');
     assert.equal(call.winner,match.winner,'Call continuation must reproduce baseline winner');assert.equal(call.scoreA,match.scoreA);assert.equal(call.scoreB,match.scoreB);
     const foldRound=fold.rounds[checkpoint.completedRounds.length];assert.equal(foldRound.foldedBy,'A');assert.equal(foldRound.pointsA,0);assert.equal(foldRound.pointsB,1);
     cf.add(checkpoint.seed,view,call.winner==='A',fold.winner==='A',foldRound.pointsB);cfAll.add(checkpoint.seed,view,call.winner==='A',fold.winner==='A',foldRound.pointsB);
   }
   candidate=null;responseCount=0;sampleRandom=null;
 }});
 buffers[policy.id][opponentId]=outcomes;
 const delta=pairedOutcomeSummary([outcomes],[buffers.ALWAYS_CALL[opponentId]]);
 rows.push({policy:policy.id,opponent:opponentId,series,responseMetrics:collector.result(matchCount),deltaVsAlwaysCall:delta});
 if(sampling)cfByOpponent.push({opponent:opponentId,...cf.result()});
 console.log(`${policy.id} vs ${opponentId}: ${(series.winRate*100).toFixed(3)}%, delta ${(delta.mean*100).toFixed(3)} pp; ${((Date.now()-t)/1000).toFixed(2)}s`);
}}
const mixed=foldPolicies.map(policy=>{const strata=rows.filter(r=>r.policy===policy.id),outcomes=foldOpponents.map(id=>buffers[policy.id][id]),control=foldOpponents.map(id=>buffers.ALWAYS_CALL[id]);
 const weighted=key=>strata.reduce((n,r)=>n+r.series[key],0)/strata.length;
 return {policy:policy.id,opponents:[...foldOpponents],weights:foldOpponents.map(()=>0.25),matchCount:matchCount*foldOpponents.length,winRate:pairedOutcomeSummary(outcomes),deltaVsAlwaysCall:pairedOutcomeSummary(outcomes,control),averageScoreDifferential:weighted('averageScoreDifferential'),averageRounds:weighted('averageRounds'),blowoutRate:weighted('blowoutRate'),responseMetrics:mergeFoldMetrics(strata.map(r=>r.responseMetrics),strata.map(r=>r.series.matchCount))};
});
const counterfactual={samplingPairsPerOpponent:Math.min(cfPairs,matchCount/2),sampling:'First N seed pairs, both seats; one uniformly reservoir-sampled A response per eligible ALWAYS_CALL match. Subsequent responses ALWAYS_CALL; original SMART Hit/Stand and Raise retained. Sample eligibility varies by opponent; pooled CF is eligible-state-weighted, not equal-opponent-weighted.',byOpponent:cfByOpponent,pooled:cfAll.result()};
const data={schemaVersion:1,seed,matchCountPerCombination:matchCount,totalMainMatches:matchCount*foldPolicies.length*foldOpponents.length,derivedPoolMatchesPerPolicy:matchCount*foldOpponents.length,rules:GAME_MODES.ranked_duel,fixedPolicy:{id:shared.id,description:shared.description},policies:foldPolicies.map(({id,description})=>({id,description})),opponents:[...foldOpponents],rows,mixed,counterfactual};
fs.writeFileSync(path.join(output,'fold-ablation-results.json'),JSON.stringify(data,null,2)+'\n');fs.writeFileSync(path.join(output,'RANKED_DUEL_FOLD_ABLATION.md'),writeFoldReport(data));
console.log(`Completed ${data.totalMainMatches.toLocaleString()} main matches, ${counterfactual.pooled.all.responses.toLocaleString()} forked states / ${(counterfactual.pooled.all.responses*2).toLocaleString()} continuations in ${((Date.now()-start)/1000).toFixed(2)}s. ${output}`);
