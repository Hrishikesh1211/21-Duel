import { StyleSheet, Text, View } from 'react-native';
import type { Competitor } from '../data/competitor';
import type { Cosmetic } from '../data/cosmetics';
import { CosmeticGeometry, CosmeticMark, CardBackArtwork, ActionLettering } from './CosmeticArtwork';
import { RankEmblem } from './RankEmblem';
import { CornerCut } from './CompetitiveFrame';
import { TwentyOneEffect } from './TwentyOneEffect';
import { CosmeticProvider } from '../presentation/CosmeticContext';
import { palette } from './theme';

// Collection-only presentation; gameplay and default previews keep their renderers.
export function CollectionPreview({ item, player }: { item: Cosmetic; player: Competitor }) {
  if (item.preview.kind === 'identity') return <View testID={`collection-preview-${item.id}`} accessible accessibilityLabel={`${item.name}, ${player.name}, ${player.division}, ${player.rating} rating`} style={[styles.identity, { backgroundColor: item.visual.background }, item.id === 'mirror-frame' && styles.mirrorIdentity]}>
    <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.art}>
      <View style={[styles.artField, item.id === 'mirror-frame' && styles.mirrorField, item.id === 'night-signal' && styles.nightField]}><CosmeticGeometry config={item.visual} /></View>
      {item.id === 'duel-standard' && <View style={styles.opposingPlane} />}
      {item.id === 'night-signal' && <><View style={styles.signalOne}/><View style={styles.signalTwo}/></>}
      <Text style={styles.signature}>XXI</Text>
    </View>
    <Text style={styles.metadata}>{item.name.toUpperCase()}</Text>
    <View style={styles.identityCopy}><Text style={styles.playerName}>{player.name}</Text><View style={styles.rank}><RankEmblem division={player.division} size={38}/><View style={styles.rankCopy}><Text style={styles.metadata}>{player.division}</Text><Text style={styles.rating}>{player.rating}</Text></View></View></View>
    <View style={[styles.partialEdge, item.id === 'mirror-frame' && styles.mirrorEdge]} />
    {item.id !== 'mirror-frame' && <CornerCut size={26}/>}
  </View>;
  return <View testID={`collection-preview-${item.id}`} style={[styles.stage,item.preview.kind === 'back' && styles.deckStage]}>
    {item.preview.kind === 'back' ? <View style={styles.deck}><View accessible={false} style={styles.deckDepth}/><View style={styles.card}><CardBackArtwork config={item.visual}/></View></View>
      : item.preview.kind === 'action' ? <View style={styles.actionMoment}><View style={styles.actionCell}><View style={styles.contact}/><View style={styles.lettering}><ActionLettering config={item.visual} word="TAP"/></View></View><View style={styles.actionCell}><View style={styles.contact}/><View style={styles.lettering}><ActionLettering config={item.visual} word="KNOCK"/></View>{item.visual.showWord && <View style={[styles.ink,{height:item.visual.stroke}]}/>}</View></View>
        : <CosmeticProvider loadout={{twentyOneEffectId:item.id}}><View style={styles.finish}><TwentyOneEffect key={item.id} total={21} textStyle={styles.total}/><CosmeticMark config={item.visual} size={20}/></View></CosmeticProvider>}
  </View>;
}
const styles=StyleSheet.create({
  identity:{minHeight:256,padding:20,overflow:'hidden',justifyContent:'space-between',borderTopWidth:1,borderTopColor:palette.borderActive},
  mirrorIdentity:{borderTopColor:palette.player},art:{position:'absolute',top:0,bottom:0,left:0,right:0},
  artField:{position:'absolute',left:'45%',right:-20,top:32,bottom:35},
  mirrorField:{left:'48%',right:8,top:25,bottom:25},nightField:{left:'38%',right:-35,top:15,bottom:15},
  opposingPlane:{position:'absolute',left:'75%',right:-25,top:18,bottom:68,borderLeftWidth:1,borderLeftColor:palette.line,backgroundColor:palette.surface2,opacity:0.45,transform:[{skewX:'-16deg'}]},
  signalOne:{position:'absolute',right:25,top:75,width:70,height:1,backgroundColor:palette.borderActive},
  signalTwo:{position:'absolute',right:-15,top:155,width:100,height:1,backgroundColor:palette.player},
  signature:{position:'absolute',right:15,bottom:18,fontSize:32,fontWeight:'200',color:palette.borderActive},
  metadata:{color:palette.textSecondary,fontSize:9,fontWeight:'600',letterSpacing:1},
  identityCopy:{gap:22},playerName:{color:palette.text,fontSize:36,fontWeight:'600',paddingRight:50},
  rank:{flexDirection:'row',alignItems:'center',gap:12},rankCopy:{gap:4},rating:{color:palette.text,fontSize:28,fontWeight:'500',fontVariant:['tabular-nums']},
  partialEdge:{position:'absolute',bottom:0,left:0,width:'70%',height:1,backgroundColor:palette.borderActive},mirrorEdge:{left:'15%'},
  stage:{minHeight:174,alignItems:'center',justifyContent:'center'},deckStage:{minHeight:220},
  deck:{width:120,height:174},deckDepth:{position:'absolute',top:6,bottom:-6,left:7,right:-7,borderWidth:1,borderColor:palette.line,borderRadius:6},
  card:{flex:1,backgroundColor:palette.back,borderRadius:6,borderWidth:1,borderColor:palette.borderActive,padding:7},
  actionMoment:{flexDirection:'row',gap:42,alignItems:'center'},actionCell:{minWidth:75,alignItems:'center',gap:22},
  contact:{width:58,height:16,borderRadius:30,borderWidth:1,borderColor:palette.borderActive},
  lettering:{transform:[{scale:2}],minHeight:24},ink:{position:'absolute',bottom:-8,width:18,backgroundColor:palette.player,transform:[{rotate:'-20deg'}]},
  finish:{alignItems:'center',gap:18},total:{color:palette.text,fontSize:72,lineHeight:86,fontWeight:'500',letterSpacing:-2},
});
