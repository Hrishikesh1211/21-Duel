import type { PublicGameMode } from '../game/types';
import { mixSeed } from './random';
import { simulateMatch, type MatchSample, type SimulationOptions } from './simulate';
import type { Strategy } from './strategies';
type SideCounts = { firstOpportunities:number;raises:number;facingRaise:number;calls:number;folds:number;weakRaises:number;bluffFoldWins:number;foldPoints:number;calledPoints:number;hands:number;totalSum:number;hits:number;busts:number;twentyOnes:number };
const sideCounts=():SideCounts=>({firstOpportunities:0,raises:0,facingRaise:0,calls:0,folds:0,weakRaises:0,bluffFoldWins:0,foldPoints:0,calledPoints:0,hands:0,totalSum:0,hits:0,busts:0,twentyOnes:0});
const rate=(num:number,den:number)=>den?num/den:0;
function median(histogram:Record<string,number>,count:number){
  const positions=[Math.floor((count-1)/2),Math.floor(count/2)],values:number[]=[];let offset=0;
  for(const key of Object.keys(histogram).map(Number).sort((a,b)=>a-b)){const end=offset+histogram[key];for(const position of positions)if(position>=offset&&position<end)values.push(key);offset=end;}
  return (values[0]+values[1])/2;
}
function sideReport(c:SideCounts){return {...c,raiseRate:rate(c.raises,c.firstOpportunities),callRate:rate(c.calls,c.facingRaise),foldRate:rate(c.folds,c.facingRaise),successfulBluffFoldRate:rate(c.bluffFoldWins,c.weakRaises),averageFinalTotal:rate(c.totalSum,c.hands),averageHits:rate(c.hits,c.hands),bustRate:rate(c.busts,c.hands),twentyOneRate:rate(c.twentyOnes,c.hands)};}
export function simulateSeries(strategyA:Strategy,strategyB:Strategy,matchCount:number,seed:number,options:{mode?:PublicGameMode;matchOptions?:Pick<SimulationOptions,'captureResponses'|'onResponseCheckpoint'>;onMatch?:(match:MatchSample)=>void}={}){
  if(!Number.isSafeInteger(matchCount)||matchCount<2||matchCount%2)throw new Error('matchCount must be an even integer >= 2 for balanced seats.');
  const mode=options.mode??'ranked_duel',pairs=matchCount/2;
  const sides={A:sideCounts(),B:sideCounts()};
  const roundsHistogram:Record<string,number>={},finalScoreDistribution:Record<string,number>={};
  let wins=0,seat1Wins=0,seat2Wins=0,scoreA=0,scoreB=0,differenceSquares=0,totalRounds=0,raisedRounds=0,calledRounds=0,tiedRounds=0,exactTarget=0,overshoot=0,closeMatches=0,blowouts=0,exactSevenBlowouts=0,comebacks=0;
  let pairWinSum=0,pairWinSquares=0,pairSeatDiffSum=0,pairSeatDiffSquares=0;
  const add=(match:MatchSample)=>{
    const aWon=Number(match.winner==='A');wins+=aWon;if(match.seatA==='human')seat1Wins+=aWon;else seat2Wins+=aWon;
    scoreA+=match.scoreA;scoreB+=match.scoreB;differenceSquares+=(match.scoreA-match.scoreB)**2;
    totalRounds+=match.rounds.length;roundsHistogram[match.rounds.length]=(roundsHistogram[match.rounds.length]??0)+1;
    const scoreKey=`${match.scoreA}-${match.scoreB}`;finalScoreDistribution[scoreKey]=(finalScoreDistribution[scoreKey]??0)+1;
    const winnerScore=Math.max(match.scoreA,match.scoreB),loserScore=Math.min(match.scoreA,match.scoreB);
    if(winnerScore===7)exactTarget++;if(winnerScore>=8)overshoot++;
    if(winnerScore-loserScore===1)closeMatches++;if(loserScore<=1)blowouts++;if(winnerScore===7&&loserScore<=1)exactSevenBlowouts++;
    if(match.winnerComeback)comebacks++;
    for(const round of match.rounds){
      sides[round.first].firstOpportunities++;
      if(round.raisedBy){raisedRounds++;const raiser=sides[round.raisedBy],responder=sides[round.raisedBy==='A'?'B':'A'];raiser.raises++;responder.facingRaise++;if(round.bluff)raiser.weakRaises++;if(round.called)responder.calls++;else responder.folds++;if(round.bluff&&round.foldedBy)raiser.bluffFoldWins++;}
      if(round.called){calledRounds++;sides.A.calledPoints+=round.pointsA;sides.B.calledPoints+=round.pointsB;}
      if(round.foldedBy){sides.A.foldPoints+=round.pointsA;sides.B.foldPoints+=round.pointsB;}
      if(round.winner==='draw')tiedRounds++;
      // Folded openings are unresolved hands and intentionally excluded.
      if(!round.foldedBy)for(const side of ['A','B'] as const){const c=sides[side],hand=side==='A'?round.handA:round.handB;c.hands++;c.totalSum+=hand.total;c.hits+=hand.hits;c.busts+=Number(hand.bust);c.twentyOnes+=Number(hand.total===21);}
    }
    options.onMatch?.(match);
    return aWon;
  };
  for(let pair=0;pair<pairs;pair++){
    const matchSeed=mixSeed((seed+Math.imul(pair+1,0x9e3779b9))>>>0);
    const one=add(simulateMatch(strategyA,strategyB,matchSeed,{...options.matchOptions,mode,seatA:'human'}));
    const two=add(simulateMatch(strategyA,strategyB,matchSeed,{...options.matchOptions,mode,seatA:'bot'}));
    const pairWins=(one+two)/2,diff=one-two;pairWinSum+=pairWins;pairWinSquares+=pairWins**2;pairSeatDiffSum+=diff;pairSeatDiffSquares+=diff**2;
  }
  const standardError=(sum:number,squares:number)=>pairs>1?Math.sqrt(Math.max(0,(squares-sum*sum/pairs)/(pairs-1))/pairs):0;
  const winRate=wins/matchCount,se=standardError(pairWinSum,pairWinSquares),seatDifference=pairSeatDiffSum/pairs,seatSe=standardError(pairSeatDiffSum,pairSeatDiffSquares);
  const averageDifference=(scoreA-scoreB)/matchCount;
  return {strategyA:strategyA.id,strategyB:strategyB.id,mode,seed,matchCount,pairs,wins,losses:matchCount-wins,draws:0,winRate,winRateCI95:[Math.max(0,winRate-1.96*se),Math.min(1,winRate+1.96*se)],seats:{matchesPerSeat:pairs,seat1Wins,seat2Wins,seat1WinRate:seat1Wins/pairs,seat2WinRate:seat2Wins/pairs,difference:seatDifference,differenceCI95:[seatDifference-1.96*seatSe,seatDifference+1.96*seatSe]},averageFinalScore:{A:scoreA/matchCount,B:scoreB/matchCount},averageScoreDifferential:averageDifference,scoreDifferentialSD:Math.sqrt(Math.max(0,differenceSquares/matchCount-averageDifference**2)),averageRounds:totalRounds/matchCount,medianRounds:median(roundsHistogram,matchCount),totalRounds,raisedRounds,calledRounds,tiedRounds,raisedRoundRate:raisedRounds/totalRounds,calledRoundRate:calledRounds/totalRounds,tiedRoundRate:tiedRounds/totalRounds,averageTwoPointRounds:calledRounds/matchCount,exactSevenRate:exactTarget/matchCount,eightPlusRate:overshoot/matchCount,closeMatchRate:closeMatches/matchCount,blowoutRate:blowouts/matchCount,exactSevenBlowoutRate:exactSevenBlowouts/matchCount,comebackRate:comebacks/matchCount,sides:{A:sideReport(sides.A),B:sideReport(sides.B)},roundsHistogram,finalScoreDistribution};
}
export type SeriesResult=ReturnType<typeof simulateSeries>;
