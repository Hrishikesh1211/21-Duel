import { descriptorKeys, scoreGroups, totalGroup } from './foldMetrics';
import type { StrategyView } from './strategies';
const tally=()=>({responses:0,callWins:0,foldWins:0,callOnlyWins:0,foldOnlyWins:0,bothWin:0,bothLose:0,immediateFoldPointsConceded:0});
export type CounterfactualTally=ReturnType<typeof tally>;
type Cluster={sum:number;count:number};
export function createCounterfactualCollector(){
  const all=tally(),groups:Record<string,CounterfactualTally>={};
  const clusters:Record<string,Map<number,Cluster>>={ALL:new Map()};
  return {add(seed:number,view:StrategyView,callWon:boolean,foldWon:boolean,foldPoints:number){
    const record=(key:string,c:CounterfactualTally)=>{c.responses++;c.callWins+=Number(callWon);c.foldWins+=Number(foldWon);c.callOnlyWins+=Number(callWon&&!foldWon);c.foldOnlyWins+=Number(foldWon&&!callWon);c.bothWin+=Number(callWon&&foldWon);c.bothLose+=Number(!callWon&&!foldWon);c.immediateFoldPointsConceded+=foldPoints;
      const map=clusters[key]??(clusters[key]=new Map());const cluster=map.get(seed)??{sum:0,count:0};cluster.sum+=Number(foldWon)-Number(callWon);cluster.count++;map.set(seed,cluster);
    };
    record('ALL',all);for(const key of [...descriptorKeys(view),`EXACT_SCORE:${view.ownScore}-${view.opponentScore}`,...scoreGroups(view).map(score=>`SCORE_TOTAL:${score}/${totalGroup(view)}`)])record(key,groups[key]??(groups[key]=tally()));
  },result(){
    const summarize=(key:string,c:CounterfactualTally)=>{const map=clusters[key],n=c.responses,delta=n?(c.foldWins-c.callWins)/n:0,k=map.size;let residualSquares=0;
      for(const value of map.values())residualSquares+=(value.sum-delta*value.count)**2;
      const se=k>1?Math.sqrt(k/(k-1)*residualSquares)/n:1;
      return {...c,seedClusters:k,callWinRate:n?c.callWins/n:0,foldWinRate:n?c.foldWins/n:0,foldMinusCall:delta,foldMinusCallCI95:[Math.max(-1,delta-1.96*se),Math.min(1,delta+1.96*se)]};
    };
    return {all:summarize('ALL',all),groups:Object.fromEntries(Object.entries(groups).map(([key,c])=>[key,summarize(key,c)]))};
  }};
}
export function pairedOutcomeSummary(outcomes:readonly Uint8Array[],baselines?:readonly Uint8Array[]){
  const pairs=outcomes[0].length/2;let sum=0,squares=0;for(let i=0;i<pairs;i++){let value=0;for(let j=0;j<outcomes.length;j++){value+=(outcomes[j][2*i]+outcomes[j][2*i+1]-(baselines?baselines[j][2*i]+baselines[j][2*i+1]:0))/2;}value/=outcomes.length;sum+=value;squares+=value*value;}
  const mean=sum/pairs,se=pairs>1?Math.sqrt(Math.max(0,(squares-sum*sum/pairs)/(pairs-1))/pairs):1;
  return {mean,CI95:[Math.max(baselines?-1:0,mean-1.96*se),Math.min(1,mean+1.96*se)],seedClusters:pairs};
}
