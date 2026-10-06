import { View, Text } from 'react-native';
import type { Competitor } from '../data/competitor';
import type { Cosmetic } from '../data/cosmetics';
import { PlayerCard } from './PlayerCard';
import { ActionLettering, CardBackArtwork, CosmeticMark } from './CosmeticArtwork';
import { palette } from './theme';
export function CosmeticPreview({ item, player }: { item: Cosmetic; player: Competitor }) {
  if (item.preview.kind === 'identity') return <PlayerCard player={{...player,playerCardId:item.id}} config={item.visual}/>;
  return <View testID={`preview-${item.id}`} style={{backgroundColor:palette.surface2,borderWidth:1,borderColor:palette.line,minHeight:190,alignItems:'center',justifyContent:'center'}}>
    {item.preview.kind === 'back' ? <View style={{width:100,height:143,backgroundColor:palette.back,borderRadius:9,borderWidth:1,borderColor:palette.borderActive,padding:6}}><CardBackArtwork config={item.visual}/></View>
      : item.preview.kind === 'action' ? <View style={{alignItems:'center',gap:18}}><View style={{width:58,height:18,borderRadius:30,borderWidth:1,borderColor:palette.line}}/><View style={{transform:[{scale:2}],minHeight:22}}><ActionLettering config={item.visual} word="KNOCK"/></View>{item.visual.showWord && <View style={{width:18,height:item.visual.stroke,backgroundColor:palette.accent,transform:[{rotate:'-20deg'}]}}/>}</View>
        : <View style={{alignItems:'center',gap:12}}><Text style={{color:palette.text,fontSize:52,fontWeight:'300',letterSpacing:2}}>21</Text><CosmeticMark config={item.visual} size={18}/></View>}
  </View>;
}
