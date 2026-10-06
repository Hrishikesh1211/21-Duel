import { StyleSheet, Text, View } from 'react-native';
import type { CosmeticConfig } from '../data/cosmetics';
import { DuelMark } from './DuelMark';
import { palette } from './theme';
export function CosmeticGeometry({ config }: { config: CosmeticConfig }) {
  return <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFill}>{config.lines?.map((line,index)=><View key={index} style={{position:'absolute',left:`${line.x}%`,top:`${line.y}%`,width:line.vertical ? 1 : `${line.length}%`,height:line.vertical ? `${line.length}%` : 1,backgroundColor:line.muted ? palette.line : line.accent ? palette.accent : '#718C9F'}} />)}</View>;
}
export function CosmeticMark({ config, size = 14 }: { config: CosmeticConfig; size?: number }) {
  if (config.mark === 'mirror') return <View style={{flexDirection:'row',gap:6}}><DuelMark size={size*0.7}/><DuelMark size={size*0.7}/></View>;
  if (config.mark === 'closure') return <View style={{width:size,height:size,borderWidth:0.7,borderColor:palette.accent}}/>;
  if (config.mark === 'split') return <View style={{flexDirection:'row',gap:size*0.6}}><View style={{height:1,width:size,backgroundColor:palette.accent}}/><View style={{height:1,width:size,backgroundColor:palette.accent}}/></View>;
  return <DuelMark size={size}/>;
}
export function CardBackArtwork({ config }: { config: CosmeticConfig }) {
  return <View testID="card-back-artwork" style={{flex:1,borderRadius:5,borderWidth:1,borderColor:'#53606A',padding:4}}><View style={{flex:1,alignItems:'center',justifyContent:'center'}}><CosmeticGeometry config={config}/>{config.mark && <CosmeticMark config={config} size={22}/>}</View></View>;
}
export function ActionLettering({ config, word }: { config: CosmeticConfig; word: string }) {
  return config.showWord ? <Text allowFontScaling={false} style={{color:palette.text,fontSize:10,lineHeight:14,letterSpacing:-0.35,fontStyle:'italic',fontWeight:config.tilt ? '700' : '600',transform:[{rotate:`${config.tilt ?? 0}deg`}]}}>{word}</Text> : null;
}
