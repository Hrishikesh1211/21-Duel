import { handTotal } from '../game/hand';
import { modeConfig } from '../game/rulesConfig';
import type { Card, MatchState, PlayerId, PublicGameMode, RaiseAction, RoundResult } from '../game/types';
export type ReviewScore=Readonly<Record<PlayerId,number>>;
export type PlayEvent=Readonly<{kind:'hit'|'stand'|'autoStand21'|'bust';actor:PlayerId;card?:Card;total?:number}>;
export type RoundEvent=Readonly<{kind:'deal';playerCards:readonly Card[];opponentUpcard:Card}>
 | Readonly<{kind:RaiseAction;actor:PlayerId}> | PlayEvent
 | Readonly<{kind:'reveal';cards:readonly Card[];total:number}>
 | Readonly<{kind:'result';result:RoundResult;points:ReviewScore;score:ReviewScore}>;
export type RoundHistory=Readonly<{
 roundNumber:number;modeId:PublicGameMode;playerOpeningCards:readonly Card[];opponentVisibleOpeningCard:Card;
 firstActor:PlayerId;events:readonly RoundEvent[];preRoundActions:readonly Extract<RoundEvent,{kind:RaiseAction}>[];
 playerActions:readonly PlayEvent[];opponentPublicActions:readonly PlayEvent[];
 playerFinalCards:readonly Card[];playerFinalTotal:number;
 opponentFinalCardsIfRevealed:readonly Card[]|null;opponentFinalTotalIfRevealed:number|null;
 result:RoundResult;pointsAwarded:ReviewScore;scoreBefore:ReviewScore;scoreAfter:ReviewScore;
 raised:boolean;called:boolean;folded:PlayerId|null;
}>;
export type MatchReview=Readonly<{
 id:string;matchId:number;modeId:PublicGameMode;playerName:string;opponentName:string;
 opponentId?:string;completedAt:number;finalScore:ReviewScore;
 outcome:'win'|'loss'|'draw';ratingDelta?:number;rounds:readonly RoundHistory[];
}>;
const cards=(hand:readonly Card[])=>hand.map(c=>({...c}));
// Only plain, public review records enter this boundary; never freeze engine references.
export function freezeReview<T>(value:T):T {
 if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const child of Object.values(value))freezeReview(child);Object.freeze(value);}
 return value;
}
// Records actual controller transitions. Drafts are private; only completed,
// safely revealed rounds are exposed. No deck, hit stream or hidden opening is stored.
export class MatchHistoryRecorder {
 private completed:RoundHistory[]=[];
 private opening!:Pick<RoundHistory,'roundNumber'|'modeId'|'playerOpeningCards'|'opponentVisibleOpeningCard'|'firstActor'|'scoreBefore'>;
 private events:RoundEvent[]=[];
 private finished=false;
 constructor(state:MatchState){this.startRound(state);}
 startRound(state:MatchState){
  this.opening={roundNumber:state.round,modeId:modeConfig(state.mode).id,playerOpeningCards:cards(state.human.hand),opponentVisibleOpeningCard:{...state.bot.hand[0]},firstActor:state.firstActor,scoreBefore:{...state.score}};
  this.events=[{kind:'deal',playerCards:cards(state.human.hand),opponentUpcard:{...state.bot.hand[0]}}];this.finished=false;
 }
 reset(state:MatchState){this.completed=[];this.startRound(state);}
 preAction(actor:PlayerId,kind:RaiseAction){if(!this.finished)this.events.push({kind,actor});}
 autoStand(actor:PlayerId){if(!this.finished)this.events.push({kind:'autoStand21',actor,...(actor==='human'?{total:21}:{})});}
 frame(before:MatchState,after:MatchState){
  if(this.finished)return;
  for(const actor of ['human','bot'] as const){
   if(before[actor].status!=='playing')continue;
   const previous=before[actor],next=after[actor],total=handTotal(next.hand),hit=next.hand.length>previous.hand.length;
   if(hit){this.events.push({kind:'hit',actor,...(actor==='human'?{card:{...next.hand[next.hand.length-1]},total}:{})});
    if(total===21)this.autoStand(actor);
    else if(next.status==='bust')this.events.push({kind:'bust',actor,...(actor==='human'?{total}:{})});
   }else if(next.status==='standing'){
    if(handTotal(previous.hand)===21)this.autoStand(actor);
    else this.events.push({kind:'stand',actor,...(actor==='human'?{total}:{})});
   }
  }
 }
 finishRound(state:MatchState,revealed:boolean){
  if(this.finished)return;
  if(state.round!==this.opening.roundNumber||!state.result||!['round-complete','match-complete'].includes(state.phase))throw new Error('Only the current completed round can enter review.');
  // Fold always wins over a caller's reveal flag. Non-Fold rounds cannot be
  // finalized until the controller has actually finished revealing the hand.
  const canReveal=!state.folded&&revealed;
  if(!state.folded&&!canReveal)throw new Error('Opponent reveal must finish before recording a resolved hand.');
  if(state.folded)this.events=this.events.filter(event=>event.kind==='deal'||['raise','pass','call','fold'].includes(event.kind));
  const opponentCards=canReveal?cards(state.bot.hand):null,opponentTotal=canReveal?handTotal(state.bot.hand):null;
  if(opponentCards)this.events.push({kind:'reveal',cards:opponentCards,total:opponentTotal!});
  const points={human:state.score.human-this.opening.scoreBefore.human,bot:state.score.bot-this.opening.scoreBefore.bot};
  this.events.push({kind:'result',result:state.result,points:{...points},score:{...state.score}});
  const preRoundActions=this.events.filter((e):e is Extract<RoundEvent,{kind:RaiseAction}>=>['raise','pass','call','fold'].includes(e.kind));
  const play=this.events.filter((e):e is PlayEvent=>['hit','stand','autoStand21','bust'].includes(e.kind));
  const round:RoundHistory={...this.opening,events:[...this.events],preRoundActions,playerActions:play.filter(e=>e.actor==='human'),opponentPublicActions:play.filter(e=>e.actor==='bot'),playerFinalCards:cards(state.human.hand),playerFinalTotal:handTotal(state.human.hand),opponentFinalCardsIfRevealed:opponentCards,opponentFinalTotalIfRevealed:opponentTotal,result:state.result,pointsAwarded:points,scoreAfter:{...state.score},raised:preRoundActions.some(e=>e.kind==='raise'),called:preRoundActions.some(e=>e.kind==='call'),folded:state.folded};
  this.completed.push(freezeReview(round));this.finished=true;
 }
 rounds():readonly RoundHistory[]{return Object.freeze([...this.completed]);}
}
export function findMatchReview(reviews:readonly MatchReview[]|undefined,id:string):MatchReview|undefined{return reviews?.find(review=>review.id===id);}
