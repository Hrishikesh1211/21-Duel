import { isSoft, type StrategyView } from './strategies';
import { upcardValue } from './foldPolicies';
import type { MatchSample } from './simulate';
export function totalGroup(v:StrategyView):string { return isSoft(v.ownCards)?'SOFT':v.ownTotal<=11?'HARD_<=11':v.ownTotal>=17?'HARD_17+':`HARD_${v.ownTotal}`; }
export function upcardGroup(v:StrategyView):string { const up=upcardValue(v);return up<=6?'2-6':up<=9?'7-9':'10/A'; }
export function scoreGroups(v:StrategyView):string[]{
  const groups:string[]=[];
  if(v.ownScore===v.targetScore-1)groups.push('PLAYER_AT_6');
  if(v.opponentScore===v.targetScore-1)groups.push('OPPONENT_AT_6');
  if(v.opponentScore-v.ownScore>=2)groups.push('TRAILING_2+');
  if(v.ownScore-v.opponentScore>=2)groups.push('LEADING_2+');
  if(v.opponentScore+1===v.targetScore-1)groups.push('FOLD_GIVES_OPPONENT_MATCH_POINT');
  if(v.opponentScore+1>=v.targetScore)groups.push('FOLD_ENDS_MATCH');
  return groups;
}
export function descriptorKeys(v:StrategyView):string[]{return [`TOTAL:${totalGroup(v)}`,`UPCARD:${upcardGroup(v)}`,`TOTAL_UPCARD:${totalGroup(v)}/${upcardGroup(v)}`,...scoreGroups(v).map(s=>`SCORE:${s}`)];}
const fresh=()=>({responses:0,calls:0,folds:0,pointsConcededThroughFold:0,pointsWonAfterCalls:0,calledRoundWins:0,calledRoundDraws:0,matchesWithResponse:0,responseMatchWins:0,matchesWithFold:0,foldMatchWins:0});
export type DescriptorCounts=ReturnType<typeof fresh>;
export function createFoldCollector(){
  const counts=fresh(),groups:Record<string,DescriptorCounts>={};let ownComebackWins=0,blowoutWins=0,blowoutLosses=0;
  return {add(match:MatchSample){
    const seen=new Set<string>(),foldSeen=new Set<string>();
    const won=match.winner==='A';ownComebackWins+=Number(won&&match.winnerComeback);
    if(Math.min(match.scoreA,match.scoreB)<=1){if(won)blowoutWins++;else blowoutLosses++;}
    for(const round of match.rounds){const response=round.response;if(!response||response.actor!=='A')continue;
      const keys=descriptorKeys(response.view);seen.add('ALL');for(const key of keys)seen.add(key);
      if(response.action==='fold'){foldSeen.add('ALL');for(const key of keys)foldSeen.add(key);}
      const record=(c:DescriptorCounts)=>{c.responses++;if(response.action==='fold'){c.folds++;c.pointsConcededThroughFold+=round.pointsB;}else{c.calls++;c.pointsWonAfterCalls+=round.pointsA;c.calledRoundWins+=Number(round.winner==='A');c.calledRoundDraws+=Number(round.winner==='draw');}};
      record(counts);for(const key of keys)record(groups[key]??(groups[key]=fresh()));
    }
    for(const key of seen){const c=key==='ALL'?counts:groups[key];c.matchesWithResponse++;c.responseMatchWins+=Number(won);}
    for(const key of foldSeen){const c=key==='ALL'?counts:groups[key];c.matchesWithFold++;c.foldMatchWins+=Number(won);}
  },result(matchCount:number){return {counts,groups,callRate:counts.responses?counts.calls/counts.responses:0,foldRate:counts.responses?counts.folds/counts.responses:0,calledRoundWinRate:counts.calls?counts.calledRoundWins/counts.calls:0,ownComebackRate:ownComebackWins/matchCount,blowoutWinRate:blowoutWins/matchCount,blowoutLossRate:blowoutLosses/matchCount};}};
}
// Descriptive categories are selected by decisions/outcomes, NOT causal estimates.
export function mergeFoldMetrics(metrics:ReturnType<ReturnType<typeof createFoldCollector>['result']>[],matchCounts:number[]){
  const matchCount=matchCounts.reduce((a,b)=>a+b,0),counts=fresh(),groups:Record<string,DescriptorCounts>={};
  const add=(a:DescriptorCounts,b:DescriptorCounts)=>{for(const key of Object.keys(a) as (keyof DescriptorCounts)[])a[key]+=b[key];};
  for(const m of metrics){add(counts,m.counts);for(const [key,value] of Object.entries(m.groups))add(groups[key]??(groups[key]=fresh()),value);}
  const weighted=(key:'ownComebackRate'|'blowoutWinRate'|'blowoutLossRate')=>metrics.reduce((sum,m,i)=>sum+m[key]*matchCounts[i],0)/matchCount;
  return {counts,groups,callRate:counts.responses?counts.calls/counts.responses:0,foldRate:counts.responses?counts.folds/counts.responses:0,calledRoundWinRate:counts.calls?counts.calledRoundWins/counts.calls:0,ownComebackRate:weighted('ownComebackRate'),blowoutWinRate:weighted('blowoutWinRate'),blowoutLossRate:weighted('blowoutLossRate')};
}
