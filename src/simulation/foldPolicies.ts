import { getStrategy, isSoft, type Strategy, type StrategyView } from './strategies';
const shared = getStrategy('SMART_BASELINE');
const hard = (v: StrategyView, min: number, max: number) => !isSoft(v.ownCards) && v.ownTotal >= min && v.ownTotal <= max;
export function upcardValue(view: StrategyView): number { const rank=view.opponentUpcard.rank;return rank==='A'?11:['J','Q','K'].includes(rank)?10:Number(rank); }
const policy = (id: string, description: string, respond: Strategy['respond']): Strategy => ({id,description,play:shared.play,first:shared.first,respond});
// Frozen before measurement. These are simulator policies, never production bots.
export const foldPolicies: readonly Strategy[] = [
  policy('ALWAYS_CALL','Always Call.',()=> 'call'),
  policy('ALWAYS_FOLD','Always Fold, including when that immediately loses the match.',()=> 'fold'),
  policy('FOLD_12_14','Fold hard 12–14; Call all other hands.',v=>hard(v,12,14)?'fold':'call'),
  policy('FOLD_12_13','Fold hard 12–13; Call all other hands.',v=>hard(v,12,13)?'fold':'call'),
  policy('FOLD_12','Fold hard 12 only; Call all other hands.',v=>hard(v,12,12)?'fold':'call'),
  policy('FOLD_WEAK_VS_STRONG_UPCARD','Fold hard 12–16 only versus a visible 10-value card or Ace; otherwise Call.',v=>hard(v,12,16)&&upcardValue(v)>=10?'fold':'call'),
  policy('FOLD_WEAK_VS_WEAK_UPCARD','Fold hard 12–16 only versus visible 2–6; otherwise Call.',v=>hard(v,12,16)&&upcardValue(v)<=6?'fold':'call'),
  policy('SCORE_AWARE','Call if opponent is one point from target, self is one point from target, or trailing by 2+. Otherwise Fold hard 12–16 when leading by 2+, or hard 12 at other scores; Call everything else.',v=>{
    if(v.opponentScore+1>=v.targetScore||v.ownScore===v.targetScore-1||v.opponentScore-v.ownScore>=2)return 'call';
    return hard(v,12,v.ownScore-v.opponentScore>=2?16:12)?'fold':'call';
  }),
  policy('ROUND_VALUE_AWARE','Call if Fold immediately loses or a called win can finish the match. Otherwise Fold hard 12–16 if losing the current two-point round ends the match while Folding keeps it alive; Call all other states.',v=>{
    if(v.opponentScore+1>=v.targetScore||v.ownScore+v.roundValue>=v.targetScore)return 'call';
    return hard(v,12,16)&&v.opponentScore+v.roundValue>=v.targetScore&&v.opponentScore+1<v.targetScore?'fold':'call';
  }),
  policy('SMART_FOLD','Never Fold if that immediately loses. Fold hard 14–16 versus a visible 10/A only when leading by 2+, or when opponent is two points from target and self is not behind. Call all other states (including soft hands and hard 12–13).',v=>{
    if(v.opponentScore+1>=v.targetScore)return 'call';
    return hard(v,14,16)&&upcardValue(v)>=10&&(v.ownScore-v.opponentScore>=2||(v.opponentScore===v.targetScore-2&&v.ownScore>=v.opponentScore))?'fold':'call';
  }),
];
export const foldOpponents = ['ALWAYS_RAISE','AGGRESSIVE','SMART_BASELINE','CONSERVATIVE'] as const;
