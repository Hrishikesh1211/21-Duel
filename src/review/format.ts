import type { Card, PlayerId } from '../game/types';
import type { MatchReview, PlayEvent, RoundHistory } from './history';
const suits={spades:'\u2660',hearts:'\u2665',diamonds:'\u2666',clubs:'\u2663'} as const;
export function cardNotation(card:Card){return `${card.rank}${suits[card.suit]}`;}
export function handNotation(cards:readonly Card[]){return cards.map(cardNotation).join('  ');}
export function reviewActor(review:MatchReview,actor:PlayerId){return actor==='human'?review.playerName:review.opponentName;}
export function playNotation(event:PlayEvent,round:RoundHistory){
 if(event.kind==='hit')return event.card?`HIT \u2192 ${cardNotation(event.card)}`:'HIT';
 if(event.kind==='autoStand21')return '21 \u00b7 AUTO-STAND';
 const total=event.total??(event.actor==='bot'?round.opponentFinalTotalIfRevealed:null);
 return `${event.kind==='bust'?'BUST':'STAND'}${total!==null&&total!==undefined?` \u2192 ${total}`:''}`;
}
export function roundResultLabel(round:RoundHistory){return round.folded?'FOLD WIN':round.result==='draw'?'TIE':round.result==='human'?'PLAYER WIN':'OPPONENT WIN';}
