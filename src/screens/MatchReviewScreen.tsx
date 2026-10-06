import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from '../components/theme';
import { modeConfig } from '../game/rulesConfig';
import type { MatchReview, RoundHistory } from '../review/history';
import { handNotation, playNotation, reviewActor, roundResultLabel } from '../review/format';
const pastAction={raise:'RAISED',pass:'PASSED',call:'CALLED',fold:'FOLDED'} as const;
function RoundRow({round,review}:{round:RoundHistory;review:MatchReview}){
 const points=round.pointsAwarded.human+round.pointsAwarded.bot;
 return <View style={styles.round} testID={`review-round-${round.roundNumber}`}>
  <View style={styles.row}><Text accessibilityRole="header" style={styles.roundNumber}>ROUND {round.roundNumber}</Text><Text style={styles.caption}>{points} {points===1?'PT':'PTS'}</Text></View>
  {round.preRoundActions.length ? <Text style={styles.caption}>{reviewActor(review,round.firstActor)} FIRST DECISION</Text> : null}
  {round.preRoundActions.length?<View style={styles.decisions}>{round.preRoundActions.map((event,index)=><Text key={index} style={event.kind==='pass'?styles.caption:styles.decision}>{reviewActor(review,event.actor)} {pastAction[event.kind]}</Text>)}</View>:null}
  <View style={styles.hands}>
   <View style={styles.hand}>
    <Text style={styles.name}>{review.playerName}</Text>
    <Text style={styles.cards}>OPEN: {handNotation(round.playerOpeningCards)}</Text>
    {round.playerActions.map((event,index)=><Text key={index} style={event.kind==='bust'?styles.actionEmphasis:styles.action}>{playNotation(event,round)}</Text>)}
    <Text style={styles.action}>{round.folded?'HAND NOT PLAYED':`FINAL: ${handNotation(round.playerFinalCards)} \u00b7 ${round.playerFinalTotal}`}</Text>
   </View>
   <View style={styles.hand}>
    <Text style={styles.name}>{review.opponentName}</Text>
    <Text style={styles.cards}>OPEN: {handNotation([round.opponentVisibleOpeningCard])}  [hidden]</Text>
    {round.opponentPublicActions.map((event,index)=><Text key={index} style={event.kind==='bust'?styles.actionEmphasis:styles.action}>{playNotation(event,round)}</Text>)}
    <Text testID={`review-opponent-${round.roundNumber}`} style={styles.action}>{round.opponentFinalCardsIfRevealed?`REVEAL: ${handNotation(round.opponentFinalCardsIfRevealed)} \u00b7 ${round.opponentFinalTotalIfRevealed}`:round.folded==='bot'?'HAND NOT REVEALED':'OPPONENT HAND HIDDEN'}</Text>
   </View>
  </View>
  <View style={styles.result}>
   <Text style={styles.resultLabel}>{roundResultLabel(round)}{round.result==='draw'?' \u00b7 0':` \u00b7 ${reviewActor(review,round.result)} +${round.pointsAwarded[round.result]}`}</Text>
   <Text accessibilityLabel={`Score ${round.scoreBefore.human} to ${round.scoreBefore.bot}, then ${round.scoreAfter.human} to ${round.scoreAfter.bot}`} style={styles.scoreTransition}>{round.scoreBefore.human}{'\u2013'}{round.scoreBefore.bot} {'\u2192'} {round.scoreAfter.human}{'\u2013'}{round.scoreAfter.bot}</Text>
  </View>
 </View>;
}
export default function MatchReviewScreen({review,onBack}:{review?:MatchReview;onBack:()=>void}){
 return <SafeAreaView style={styles.root} testID="match-review-screen">
  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
   <Pressable accessibilityRole="button" accessibilityLabel="Back from match review" onPress={onBack} style={({pressed})=>[styles.back,pressed&&styles.pressed]}><Text style={styles.caption}>{'\u2190 BACK'}</Text></Pressable>
   <View style={styles.header}><Text accessibilityRole="header" style={styles.title}>MATCH REVIEW</Text>{review?<Text style={styles.mode}>{modeConfig(review.modeId).name}</Text>:null}</View>
   {review?<>
    <View style={styles.final} accessibilityLabel={`Final score, ${review.playerName} ${review.finalScore.human}, ${review.opponentName} ${review.finalScore.bot}`}>
     <View style={styles.row}><Text style={styles.finalName}>{review.playerName}</Text><Text style={styles.finalScore}>{review.finalScore.human}</Text></View>
     <View style={styles.row}><Text style={styles.finalName}>{review.opponentName}</Text><Text style={styles.finalScore}>{review.finalScore.bot}</Text></View>
     {review.ratingDelta!==undefined?<Text style={styles.caption}>RATING {review.ratingDelta>0?'+':''}{review.ratingDelta}</Text>:null}
    </View>
    {review.rounds.map(round=><RoundRow key={round.roundNumber} round={round} review={review} />)}
   </>:<View style={styles.empty}><Text style={styles.finalName}>Review unavailable</Text><Text style={styles.action}>Only recent completed matches are retained for this session.</Text></View>}
  </ScrollView>
 </SafeAreaView>;
}
const styles=StyleSheet.create({
 root:{flex:1,backgroundColor:palette.table},
 content:{width:'100%',maxWidth:520,alignSelf:'center',paddingHorizontal:28,paddingBottom:36},
 back:{minHeight:48,justifyContent:'center',alignSelf:'flex-start',paddingRight:24},pressed:{opacity:.65},
 header:{paddingTop:14,paddingBottom:26,gap:10},title:{color:palette.text,fontSize:12,fontWeight:'600',letterSpacing:2.5},mode:{color:palette.muted,fontSize:10,letterSpacing:1.6},
 final:{backgroundColor:palette.systemSurface,borderLeftWidth:1,borderLeftColor:palette.system,padding:16,marginBottom:28,gap:12},row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:16},finalName:{flexShrink:1,color:palette.text,fontSize:14,fontWeight:'500',letterSpacing:1.5},finalScore:{color:palette.text,fontSize:28,fontWeight:'300',fontVariant:['tabular-nums']},
 round:{paddingVertical:24,borderTopWidth:1,borderTopColor:palette.line,gap:12},roundNumber:{color:palette.text,fontSize:11,fontWeight:'600',letterSpacing:1.8},caption:{color:palette.muted,fontSize:9,lineHeight:16,letterSpacing:1.2},
 decisions:{backgroundColor:palette.surface1,borderLeftWidth:1,borderLeftColor:palette.borderActive,gap:6,padding:10},decision:{color:palette.accent,fontSize:11,lineHeight:19,fontWeight:'600',letterSpacing:1.1},
 hands:{gap:18,paddingVertical:4},hand:{gap:6},name:{color:palette.text,fontSize:10,lineHeight:17,fontWeight:'500',letterSpacing:1.4},cards:{color:palette.text,fontSize:13,lineHeight:22,fontVariant:['tabular-nums']},action:{color:palette.muted,fontSize:11,lineHeight:19},actionEmphasis:{color:palette.text,fontSize:11,lineHeight:19,fontWeight:'500'},
 result:{gap:8,paddingTop:6},resultLabel:{color:palette.system,fontSize:10,lineHeight:18,letterSpacing:1},scoreTransition:{color:palette.muted,fontSize:12,lineHeight:20,fontVariant:['tabular-nums']},empty:{paddingVertical:28,gap:14},
});
