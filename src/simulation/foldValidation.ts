import { getStrategy, isSoft, isWeakOpening, type Strategy, type StrategyView } from './strategies';
import { upcardValue } from './foldPolicies';
const smart=getStrategy('SMART_BASELINE');
export const validationPolicies:readonly Strategy[]=[
 {id:'ALWAYS_CALL',description:'Always Call; exact SMART_BASELINE Hit/Stand and Raise/Pass functions.',play:smart.play,first:smart.first,respond:()=> 'call'},
 {id:'SELECTIVE_FOLD_V1',description:'Frozen: never Fold when opponent is at target minus one, on soft hands, hard <=12 or hard 17+. Fold hard 13-16 only against visible 10-value or Ace; otherwise Call. Exact SMART_BASELINE Hit/Stand and Raise/Pass.',play:smart.play,first:smart.first,respond:v=>v.opponentScore+1<v.targetScore&&!isSoft(v.ownCards)&&v.ownTotal>=13&&v.ownTotal<=16&&upcardValue(v)>=10?'fold':'call'},
];
export const holdoutSeeds=Object.freeze([104729,982451653,32452843,49979687,67867967]);
export const fixedValidationOpponents=Object.freeze(['ALWAYS_RAISE','AGGRESSIVE','SMART_BASELINE','CONSERVATIVE']);
export const adaptiveDefinitions=Object.freeze([
 {id:'ADAPTIVE_LOW_RAISE',description:'Start at SMART Raise probability. After >=3 observed responses to own Raises, multiply probability by .35 when observed Call fraction >=.75; otherwise unchanged.'},
 {id:'ADAPTIVE_HIGH_RAISE',description:'Start at SMART Raise probability. After >=3 observed responses, add min(.40, 2 * observed Fold fraction), clamped to [0,1].'},
 {id:'EXPLOIT_FOLD',description:'Known-policy test: if own public first card is 10-value/A, own opening is weak hard 12-16 and opponent score <6, Raise with max(SMART probability,.85). Otherwise SMART probability. Never reads opponent hidden total; unknown Fold-window eligibility remains uncertain.'},
 {id:'MIXED_ADAPTIVE',description:'SMART probability plus .60*smoothedFoldRate - .12*smoothedCallRate, plus .05 if trailing by 2+, minus .05 if leading by 2+. Rates use Beta(1,3): Fold=(folds+1)/(responses+4). Clamp [0,1]. Public response history updates gradually.'},
]);
function normalRaiseProbability(v:StrategyView):number {return v.ownTotal>=19?1:v.ownTotal===18?.65:v.ownTotal===17?.35:v.ownScore===v.targetScore-1&&v.ownScore>v.opponentScore?0:v.opponentScore-v.ownScore>=3?.15:.08;}
export function makeAdaptiveOpponent(id:string):Strategy {
 const definition=adaptiveDefinitions.find(d=>d.id===id);
 if(!definition)throw new Error(`Unknown adaptive opponent: ${id}`);
 const create=():Strategy=>{
  let calls=0,folds=0;
  return {id,description:definition.description,play:smart.play,respond:()=> 'call',observePublicRaise:event=>{
   if(event.actor!=='opponent')return;
   if(event.action==='call')calls++;
   if(event.action==='fold')folds++;
  },first:(v,random)=>{
   const n=calls+folds,base=normalRaiseProbability(v);let probability=base;
   if(id==='ADAPTIVE_LOW_RAISE'&&n>=3&&calls/n>=.75)probability*=.35;
   if(id==='ADAPTIVE_HIGH_RAISE'&&n>=3)probability+=Math.min(.40,2*folds/n);
   if(id==='EXPLOIT_FOLD'){
    const shown=v.ownCards[0].rank,strong=shown==='A'||['10','J','Q','K'].includes(shown);
    if(strong&&isWeakOpening(v)&&v.opponentScore<v.targetScore-1)probability=Math.max(probability,.85);
   }
   if(id==='MIXED_ADAPTIVE'){
    const foldRate=(folds+1)/(n+4),callRate=(calls+3)/(n+4);
    probability+=.60*foldRate-.12*callRate+(v.opponentScore-v.ownScore>=2?.05:0)-(v.ownScore-v.opponentScore>=2?.05:0);
   }
   return random()<Math.max(0,Math.min(1,probability))?'raise':'pass';
  }};
 };
 return {...create(),createForMatch:create};
}
export const exploitControl:Strategy={id:'EXPLOIT_FOLD_NO_WINDOW',description:'Diagnostic control for EXPLOIT_FOLD: identical SMART Hit/Stand, always Call, normal SMART Raise probability without the known-window bluff boost.',play:smart.play,first:smart.first,respond:()=> 'call'};
