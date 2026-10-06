const {execFileSync}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),args=process.argv.slice(2),option=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
const n=Number(option('--matches','100000'));if(!Number.isSafeInteger(n)||n<4||n%2)throw Error('Matches must be even and >=4.');
const output=path.resolve(root,option('--output','docs'));fs.mkdirSync(output,{recursive:true});
execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--ignoreConfig','--target','ES2020','--module','commonjs','--moduleResolution','node','--ignoreDeprecations','6.0','--strict','--skipLibCheck','--rootDir','src','--outDir','.expo/simulation','src/simulation/series.ts','src/simulation/foldValidation.ts','src/simulation/foldMetrics.ts','src/simulation/foldCounterfactual.ts'],{cwd:root,stdio:'inherit'});
const {validationPolicies,holdoutSeeds,fixedValidationOpponents,adaptiveDefinitions,makeAdaptiveOpponent,exploitControl}=require('../.expo/simulation/simulation/foldValidation');
const {getStrategy}=require('../.expo/simulation/simulation/strategies'),{simulateSeries}=require('../.expo/simulation/simulation/series'),{mixSeed}=require('../.expo/simulation/simulation/random');
const {createFoldCollector,mergeFoldMetrics}=require('../.expo/simulation/simulation/foldMetrics'),{pairedOutcomeSummary}=require('../.expo/simulation/simulation/foldCounterfactual');
const {writeValidationReport}=require('./fold-validation-report.cjs');
const opponents=[...fixedValidationOpponents.map(id=>({id,kind:'fixed',strategy:getStrategy(id)})),...adaptiveDefinitions.map(d=>({id:d.id,kind:'adaptive',strategy:makeAdaptiveOpponent(d.id)})),{id:exploitControl.id,kind:'diagnostic',strategy:exploitControl}];
for(const p of validationPolicies){assert.equal(p.play,getStrategy('SMART_BASELINE').play);assert.equal(p.first,getStrategy('SMART_BASELINE').first);}
// Guard against overlapping seeded match cohorts, including the two prior experiments.
const previous=new Set();for(const seed of [20261006,2216161])for(let i=0;i<50000;i++)previous.add(mixSeed((seed+Math.imul(i+1,0x9e3779b9))>>>0));
const used=new Set();for(const seed of holdoutSeeds)for(let i=0;i<n/2;i++){const value=mixSeed((seed+Math.imul(i+1,0x9e3779b9))>>>0);assert.ok(!previous.has(value),'Holdout cohort overlaps previous seeded matches');assert.ok(!used.has(value),'Holdout seed cohorts overlap');used.add(value);}
const buffers={},rows=[],start=Date.now();
for(const seed of holdoutSeeds){buffers[seed]={};for(const opponent of opponents){buffers[seed][opponent.id]={};for(const policy of validationPolicies){
 const outcomes=new Uint8Array(n),collector=createFoldCollector();let index=0;const t=Date.now();
 const series=simulateSeries(policy,opponent.strategy,n,seed,{matchOptions:{captureResponses:true},onMatch:match=>{outcomes[index++]=Number(match.winner==='A');collector.add(match);}});
 buffers[seed][opponent.id][policy.id]=outcomes;
 const delta=pairedOutcomeSummary([outcomes],[buffers[seed][opponent.id].ALWAYS_CALL]);
 rows.push({seed,policy:policy.id,opponent:opponent.id,kind:opponent.kind,series,responseMetrics:collector.result(n),deltaVsAlwaysCall:delta});
 console.log(`${seed} ${policy.id} vs ${opponent.id}: ${(series.winRate*100).toFixed(3)}%, delta ${(delta.mean*100).toFixed(3)} pp; ${((Date.now()-t)/1000).toFixed(2)}s`);
}}}
function concatenate(arrays){const result=new Uint8Array(arrays.reduce((n,a)=>n+a.length,0));let offset=0;for(const a of arrays){result.set(a,offset);offset+=a.length;}return result;}
const aggregate=(ids,seeds)=>{
 const selected=ids.map(id=>concatenate(seeds.map(seed=>buffers[seed][id].SELECTIVE_FOLD_V1))),control=ids.map(id=>concatenate(seeds.map(seed=>buffers[seed][id].ALWAYS_CALL)));
 const perPolicy=id=>{const strata=rows.filter(r=>seeds.includes(r.seed)&&ids.includes(r.opponent)&&r.policy===id);const sum=key=>strata.reduce((s,r)=>s+r.series[key],0),b={raises:0,firstOpportunities:0,weakRaises:0,bluffFoldWins:0,foldPoints:0};for(const r of strata)for(const k of Object.keys(b))b[k]+=r.series.sides.B[k];
  return {matchCount:sum('matchCount'),winRate:pairedOutcomeSummary(id==='ALWAYS_CALL'?control:selected),averageRounds:sum('totalRounds')/sum('matchCount'),averageScoreDifferential:sum('averageScoreDifferential')/strata.length,responseMetrics:mergeFoldMetrics(strata.map(r=>r.responseMetrics),strata.map(()=>n)),opponentRaise:{...b,raiseRate:b.raises/b.firstOpportunities,bluffRaiseRate:b.weakRaises/b.firstOpportunities,bluffFractionOfRaises:b.raises?b.weakRaises/b.raises:0,bluffFoldWinRate:b.weakRaises?b.bluffFoldWins/b.weakRaises:0}};
 };
 return {opponents:ids,seeds,alwaysCall:perPolicy('ALWAYS_CALL'),selectiveFold:perPolicy('SELECTIVE_FOLD_V1'),deltaVsAlwaysCall:pairedOutcomeSummary(selected,control)};
};
const summaries=opponents.map(o=>({opponent:o.id,kind:o.kind,...aggregate([o.id],holdoutSeeds),perSeed:holdoutSeeds.map(seed=>({seed,...aggregate([o.id],[seed])}))}));
const pools=['fixed','adaptive','combined'].map(kind=>{const ids=opponents.filter(o=>kind==='combined'?o.kind!=='diagnostic':o.kind===kind).map(o=>o.id);const perSeed=holdoutSeeds.map(seed=>({seed,...aggregate(ids,[seed])}));const deltas=perSeed.map(r=>r.deltaVsAlwaysCall.mean);return {kind,...aggregate(ids,holdoutSeeds),perSeed,positiveSeeds:deltas.filter(x=>x>0).length,positiveSeedFraction:deltas.filter(x=>x>0).length/deltas.length,worstSeedDelta:Math.min(...deltas),bestSeedDelta:Math.max(...deltas)};});
for(const r of summaries){const values=r.perSeed.map(s=>s.deltaVsAlwaysCall.mean);r.stability={positiveSeeds:values.filter(x=>x>0).length,positiveSeedFraction:values.filter(x=>x>0).length/values.length,worstSeedDelta:Math.min(...values),bestSeedDelta:Math.max(...values)};}
const exploit=summaries.find(s=>s.opponent==='EXPLOIT_FOLD'),control=summaries.find(s=>s.opponent==='EXPLOIT_FOLD_NO_WINDOW');
const opponentGain=policy=>{const exploitOut=concatenate(holdoutSeeds.map(seed=>buffers[seed].EXPLOIT_FOLD[policy])),controlOut=concatenate(holdoutSeeds.map(seed=>buffers[seed].EXPLOIT_FOLD_NO_WINDOW[policy]));const summary=pairedOutcomeSummary([exploitOut],[controlOut]);return {mean:-summary.mean,CI95:[-summary.CI95[1],-summary.CI95[0]],seedClusters:summary.seedClusters};};
const data={schemaVersion:1,seeds:[...holdoutSeeds],matchCountPerPolicyOpponentSeed:n,totalMainMatches:n*2*8*5,totalDiagnosticMatches:n*2*5,totalMatches:n*2*9*5,policyDefinitions:validationPolicies.map(({id,description})=>({id,description})),opponentDefinitions:opponents.map(o=>({id:o.id,kind:o.kind,description:o.strategy.description})),adaptation:'Fresh history per match and seat; counts only publicly observed opponent Call/Fold responses to own Raises. EXPLOIT_FOLD knows the frozen response rule but never its current hidden hand. All four adaptive bots share SMART Hit/Stand and always Call.',seedIndependence:'All realized match-seed cohorts checked disjoint from each other and from prior ablation/balance cohorts.',rows,summaries,pools,exploitability:{exploitOpponentGainAgainstSelective:opponentGain('SELECTIVE_FOLD_V1'),exploitOpponentGainAgainstAlwaysCall:opponentGain('ALWAYS_CALL'),selectiveDeltaAgainstExploit:exploit.deltaVsAlwaysCall,selectiveDeltaAgainstNoWindow:control.deltaVsAlwaysCall}};
fs.writeFileSync(path.join(output,'fold-validation-results.json'),JSON.stringify(data,null,2)+'\n');fs.writeFileSync(path.join(output,'RANKED_DUEL_FOLD_VALIDATION.md'),writeValidationReport(data));
console.log(`Completed ${data.totalMainMatches.toLocaleString()} main + ${data.totalDiagnosticMatches.toLocaleString()} diagnostic matches in ${((Date.now()-start)/1000).toFixed(2)}s. ${output}`);
