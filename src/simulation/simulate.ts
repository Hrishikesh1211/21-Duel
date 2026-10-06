import { createMatch, newRound, playDecision, raiseActor, raiseDecision } from '../game/engine';
import { handTotal } from '../game/hand';
import { modeConfig } from '../game/rulesConfig';
import type { Card, MatchState, PlayerId, PublicGameMode } from '../game/types';
import { mixSeed, createRandomStream } from './random';
import { isWeakOpening, type Strategy, type StrategyView, validateDecision } from './strategies';
export type SimulationOptions = {
  mode?: PublicGameMode; seatA?: PlayerId; onState?: (state: MatchState)=>void;
  captureResponses?: boolean;
  // Analysis observer only; no Strategy receives a checkpoint or RNG snapshots.
  onResponseCheckpoint?: (checkpoint: SimulationCheckpoint, publicView: StrategyView)=>void;
};
export type SimulationCheckpoint = Readonly<{
  seed:number; seatA:PlayerId; mode:PublicGameMode; state:MatchState;
  completedRounds:readonly RoundSample[]; behindA:boolean; behindB:boolean;
  randomA:number; randomB:number; cards:number;
}>;
export type RoundSample = Readonly<{
  first: 'A'|'B'; raisedBy: 'A'|'B'|null; called: boolean; bluff: boolean; foldedBy: 'A'|'B'|null;
  winner: 'A'|'B'|'draw'; pointsA: number; pointsB: number;
  response?: Readonly<{actor:'A'|'B';action:'call'|'fold';view:StrategyView}>;
  handA: {total:number;hits:number;bust:boolean}; handB: {total:number;hits:number;bust:boolean};
}>;
export type MatchSample = Readonly<{ seed:number;seatA:PlayerId;mode:PublicGameMode;winner:'A'|'B';scoreA:number;scoreB:number;rounds:readonly RoundSample[];winnerComeback:boolean }>;
// This is the only strategy boundary. It cannot expose MatchState, deck, cursors,
// hidden totals, future cards, or the RNG object. Cards are defensive copies.
export function strategyView(state: MatchState, side: PlayerId, ownHand: readonly Card[] = state[side].hand): StrategyView {
  const other=side==='human'?'bot':'human';
  return {ownCards:ownHand.map(c=>({...c})),ownTotal:handTotal(ownHand),opponentUpcard:{...state[other].hand[0]},ownScore:state.score[side],opponentScore:state.score[other],roundValue:state.roundValue,firstActor:state.firstActor===side,opponentRaised:state.roundValue===2&&state.firstActor!==side,targetScore:modeConfig(state.mode).targetScore};
}
export function simulateMatch(strategyA: Strategy, strategyB: Strategy, seed: number, options: SimulationOptions = {}): MatchSample {
  const mode=options.mode??'ranked_duel', seatA=options.seatA??'human';
  return continueMatch(strategyA.createForMatch?.() ?? strategyA,strategyB.createForMatch?.() ?? strategyB,seed,mode,seatA,options);
}
export function simulateFromCheckpoint(strategyA:Strategy,strategyB:Strategy,checkpoint:SimulationCheckpoint,action:'call'|'fold',options:SimulationOptions={}):MatchSample {
  if(strategyA.createForMatch||strategyB.createForMatch||strategyA.observePublicRaise||strategyB.observePublicRaise)throw new Error('Adaptive history is not captured by checkpoints.');
  if(checkpoint.state.phase!=='waitingForRaiseResponse'||raiseActor(checkpoint.state)!==checkpoint.seatA)throw new Error('Checkpoint must be an A response decision.');
  return continueMatch(strategyA,strategyB,checkpoint.seed,checkpoint.mode,checkpoint.seatA,options,checkpoint,action);
}
function continueMatch(strategyA:Strategy,strategyB:Strategy,seed:number,mode:PublicGameMode,seatA:PlayerId,options:SimulationOptions,checkpoint?:SimulationCheckpoint,forcedResponse?:'call'|'fold'):MatchSample {
  const who=(side:PlayerId):'A'|'B'=>side===seatA?'A':'B';
  const players={human:seatA==='human'?strategyA:strategyB,bot:seatA==='bot'?strategyA:strategyB};
  const randomA=createRandomStream(checkpoint?.randomA ?? mixSeed(seed^0xa341316c)),randomB=createRandomStream(checkpoint?.randomB ?? mixSeed(seed^0xc8013ea4));
  const random={human:(seatA==='human'?randomA:randomB).next,bot:(seatA==='bot'?randomA:randomB).next};
  const cardStream=createRandomStream(checkpoint?.cards ?? mixSeed(seed^0xad90777d));
  const cards=cardStream.next;
  let state=checkpoint?.state ?? createMatch(cards,mode), behindA=checkpoint?.behindA ?? false,behindB=checkpoint?.behindB ?? false;
  const rounds:RoundSample[]=[...(checkpoint?.completedRounds ?? [])];
  const observe=()=>options.onState?.(state);
  observe();
  while(state.phase!=='match-complete'){
    if(rounds.length>=10000)throw new Error('Round safety limit reached; no result was imputed.');
    const before=state.score,first=who(state.firstActor);
    let raisedBy:RoundSample['raisedBy']=state.phase==='waitingForRaiseResponse'?who(state.firstActor):null,bluff=raisedBy ? isWeakOpening(strategyView(state,state.firstActor)) : false,called=false;
    let response:RoundSample['response'];
    while(raiseActor(state)){
      const actor=raiseActor(state)!;const view=strategyView(state,actor);
      const isResponse=state.phase==='waitingForRaiseResponse';
      if(isResponse&&who(actor)==='A'&&options.onResponseCheckpoint) options.onResponseCheckpoint({seed,seatA,mode,state,completedRounds:[...rounds],behindA,behindB,randomA:randomA.snapshot(),randomB:randomB.snapshot(),cards:cardStream.snapshot()},view);
      const decision=forcedResponse&&isResponse ? forcedResponse : state.phase==='preRaiseDecision'?players[actor].first(view,random[actor]):players[actor].respond(view,random[actor]);
      if(forcedResponse&&isResponse)forcedResponse=undefined;
      if(isResponse&&options.captureResponses)response={actor:who(actor),action:decision as 'call'|'fold',view};
      validateDecision(decision,state.phase==='preRaiseDecision'?['raise','pass']:['call','fold']);
      if(decision==='raise'){raisedBy=who(actor);bluff=isWeakOpening(view);}
      if(decision==='call')called=true;
      state=raiseDecision(state,actor,decision);observe();
      for(const side of ['human','bot'] as const)players[side].observePublicRaise?.({actor:side===actor?'self':'opponent',action:decision});
    }
    let decisions=0;
    while(state.phase==='playing'){
      if(++decisions>100)throw new Error('Decision safety limit reached.');
      const action=players.human.play(strategyView(state,'human'),random.human);validateDecision(action,['hit','stand']);
      // Production commits B before applying A's draw. Public context is from
      // the same pre-decision state; auto-drained B decisions use its new own hand.
      const publicState=state;
      state=playDecision(state,action,hand=>{const decision=players.bot.play(strategyView(publicState,'bot',hand),random.bot);validateDecision(decision,['hit','stand']);return decision;});
      observe();
    }
    const hand=(side:PlayerId)=>({total:handTotal(state[side].hand),hits:state[side].hand.length-2,bust:handTotal(state[side].hand)>21});
    const a=seatA,b=seatA==='human'?'bot':'human';
    if(state.score[b]-state.score[a]>=3)behindA=true;
    if(state.score[a]-state.score[b]>=3)behindB=true;
    rounds.push({...(response ? {response} : {}),first,raisedBy,called,bluff,foldedBy:state.folded?who(state.folded):null,winner:state.result==='draw'?'draw':who(state.result!),pointsA:state.score[a]-before[a],pointsB:state.score[b]-before[b],handA:hand(a),handB:hand(b)});
    if(state.phase==='round-complete'){state=newRound(state,cards);observe();}
  }
  const winner=who(state.winner!);
  return {seed,seatA,mode,winner,scoreA:state.score[seatA],scoreB:state.score[seatA==='human'?'bot':'human'],rounds,winnerComeback:winner==='A'?behindA:behindB};
}
