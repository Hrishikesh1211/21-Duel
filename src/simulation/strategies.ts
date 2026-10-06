import { basicBotStrategy } from '../game/bot';
import { handTotal } from '../game/hand';
import type { Action, Card, RaiseAction } from '../game/types';
export type StrategyView = Readonly<{
  ownCards: readonly Card[]; ownTotal: number; opponentUpcard: Card;
  ownScore: number; opponentScore: number; roundValue: 1 | 2;
  firstActor: boolean; opponentRaised: boolean; targetScore: number;
}>;
export type Strategy = Readonly<{
  id: string; description: string;
  play: (view: StrategyView, random: () => number) => Action;
  first: (view: StrategyView, random: () => number) => 'raise' | 'pass';
  respond: (view: StrategyView, random: () => number) => 'call' | 'fold';
  // Simulation-only public action feed; neither event nor factory receives engine state.
  observePublicRaise?: (event: Readonly<{actor:'self'|'opponent';action:RaiseAction}>) => void;
  createForMatch?: () => Strategy;
}>;
export function isSoft(cards: readonly Card[]): boolean {
  const low = cards.reduce((sum, c) => sum + (c.rank === 'A' ? 1 : ['J','Q','K'].includes(c.rank) ? 10 : Number(c.rank)), 0);
  return cards.some(c => c.rank === 'A') && handTotal(cards) === low + 10;
}
export function isWeakOpening(view: StrategyView): boolean { return !isSoft(view.ownCards) && view.ownTotal >= 12 && view.ownTotal <= 16; }
const basic: Strategy['play'] = v => basicBotStrategy(v.ownCards);
const threshold = (total: number): Strategy['play'] => v => v.ownTotal < total ? 'hit' : 'stand';
const pass: Strategy['first'] = () => 'pass';
const call: Strategy['respond'] = () => 'call';
const basicResponse: Strategy['respond'] = v => v.ownTotal >= 15 || v.ownTotal <= 11 || isSoft(v.ownCards) ? 'call' : 'fold';
export const strategies: readonly Strategy[] = [
  {id:'RANDOM',description:'50/50 legal Hit/Stand (21 stands), Raise/Pass and Call/Fold.',play:(v,r)=>v.ownTotal === 21 || r() >= 0.5 ? 'stand' : 'hit',first:(_,r)=>r()<0.5?'raise':'pass',respond:(_,r)=>r()<0.5?'call':'fold'},
  {id:'SIMPLE_15',description:'Hit below 15; otherwise Stand. Never Raise; always Call.',play:threshold(15),first:pass,respond:call},
  {id:'SIMPLE_17',description:'Hit below 17; otherwise Stand. Never Raise; always Call.',play:threshold(17),first:pass,respond:call},
  {id:'NEVER_RAISE',description:'Production basic Hit below 17. Never Raise; Fold hard 12–14, Call other hands.',play:basic,first:pass,respond:basicResponse},
  {id:'ALWAYS_RAISE',description:'Production basic Hit below 17. Always Raise when first; always Call.',play:basic,first:()=> 'raise',respond:call},
  {id:'CONSERVATIVE',description:'Hit hard totals below 16 and soft totals below 18. Raise on 19+. Fold hard 12–14; Call other hands.',play:v=>v.ownTotal<(isSoft(v.ownCards)?18:16)?'hit':'stand',first:v=>v.ownTotal>=19?'raise':'pass',respond:basicResponse},
  {id:'AGGRESSIVE',description:'Hit hard totals below 18 and soft totals below 19. Raise with probability .70 on 17+, .40 on hard 12–16, .55 otherwise. Call .70 on hard 12–14, .90 otherwise.',play:v=>v.ownTotal<(isSoft(v.ownCards)?19:18)?'hit':'stand',first:(v,r)=>r()<(v.ownTotal>=17?0.70:isWeakOpening(v)?0.40:0.55)?'raise':'pass',respond:(v,r)=>r()<(!isSoft(v.ownCards)&&v.ownTotal>=12&&v.ownTotal<=14?0.70:0.90)?'call':'fold'},
  {id:'SMART_BASELINE',description:'Untuned heuristic: Hit soft <19, hard <17, except Stand hard 16 versus visible 2–6 unless trailing by 3+. Raise 19+ always, 18 at .65, 17 at .35, otherwise .08 (.15 trailing by 3+, zero when ahead and one point from target). Call 15+, soft hands or <=11; hard 12–14 Call .65 against 7+ upcard, .80 otherwise. Always Call if folding would end the match.',
    play:v=>{if(v.ownTotal===21)return 'stand';if(isSoft(v.ownCards))return v.ownTotal<19?'hit':'stand';const up=Number(v.opponentUpcard.rank);if(v.ownTotal===16&&up>=2&&up<=6&&v.opponentScore-v.ownScore<3)return 'stand';return v.ownTotal<17?'hit':'stand';},
    first:(v,r)=>{const probability=v.ownTotal>=19?1:v.ownTotal===18?0.65:v.ownTotal===17?0.35:v.ownScore===v.targetScore-1&&v.ownScore>v.opponentScore?0:v.opponentScore-v.ownScore>=3?0.15:0.08;return r()<probability?'raise':'pass';},
    respond:(v,r)=>{if(v.opponentScore>=v.targetScore-1||v.ownTotal>=15||v.ownTotal<=11||isSoft(v.ownCards))return 'call';const up=v.opponentUpcard.rank==='A'?11:['J','Q','K'].includes(v.opponentUpcard.rank)?10:Number(v.opponentUpcard.rank);return r()<(up>=7?0.65:0.80)?'call':'fold';}},
];
export function getStrategy(id: string): Strategy { const result=strategies.find(s=>s.id===id);if(!result)throw new Error(`Unknown strategy: ${id}`);return result; }
export function validateDecision(action: RaiseAction | Action, legal: readonly string[]) { if(!legal.includes(action))throw new Error(`Illegal strategy decision: ${action}`); }
