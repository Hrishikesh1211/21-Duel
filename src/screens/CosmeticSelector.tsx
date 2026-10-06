import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { SessionPlayer } from '../competitive/session';
import { cosmeticCatalog, getCosmetic, getEquippedCosmetic, loadoutSlots, type CosmeticSlot } from '../data/cosmetics';
import { CollectionPreview } from '../components/CollectionPreview';
import { CornerCut } from '../components/CompetitiveFrame';
import { palette } from '../components/theme';
export default function CosmeticSelector({ player, slot, initialId, onEquip, onClose }: { player: SessionPlayer; slot: CosmeticSlot; initialId?: string; onEquip: (slot: CosmeticSlot,id: string)=>void; onClose: ()=>void }) {
  const [candidate, setCandidate] = useState(initialId ?? getEquippedCosmetic(player,slot).id);
  const item = getCosmetic(candidate,slot);
  const equipped = getEquippedCosmetic(player,slot).id === item.id;
  return <SafeAreaView style={styles.root}><ScrollView contentContainerStyle={styles.content}>
    <Pressable accessibilityRole="button" accessibilityLabel="Back to collection" onPress={onClose} style={styles.back}><Text style={styles.caption}>{'\u2190 BACK'}</Text></Pressable>
    <Text accessibilityRole="header" style={styles.category}>{loadoutSlots.find(s=>s.field === slot)!.category}</Text>
    <CollectionPreview item={item} player={player}/>
    <View style={styles.copy}><Text accessibilityRole="header" style={styles.name}>{item.name}</Text><Text style={styles.description}>{item.description}</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel={equipped ? 'EQUIPPED' : 'EQUIP'} accessibilityState={{disabled:equipped}} disabled={equipped} onPress={()=>{onEquip(slot,item.id);void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{});}} style={({pressed})=>[styles.equip,equipped&&styles.equipped,pressed&&!equipped&&styles.pressed]}><Text style={styles.caption}>{equipped ? 'EQUIPPED' : 'EQUIP'}</Text><CornerCut size={16}/></Pressable>
    <View>{cosmeticCatalog.filter(c=>c.slot === slot).map(c=><Pressable key={c.id} accessibilityRole="button" accessibilityState={{selected:c.id === item.id}} onPress={()=>setCandidate(c.id)} style={({pressed})=>[styles.option,c.id===item.id&&styles.selectedOption,pressed&&styles.pressed]}><Text style={[styles.optionName,c.id === item.id && {color:palette.accent}]}>{c.name}</Text><Text style={styles.caption}>{getEquippedCosmetic(player,slot).id === c.id ? 'EQUIPPED' : c.id === item.id ? 'PREVIEW' : '\u2192'}</Text></Pressable>)}</View>
  </ScrollView></SafeAreaView>;
}
const styles=StyleSheet.create({
 root:{flex:1,backgroundColor:palette.table},content:{width:'100%',maxWidth:520,alignSelf:'center',paddingHorizontal:24,paddingVertical:18,gap:22},back:{minHeight:44,justifyContent:'center'},
 category:{color:palette.text,fontSize:25,fontWeight:'600',letterSpacing:0.1},caption:{color:palette.player,fontSize:10,fontWeight:'600',letterSpacing:1},copy:{gap:10},name:{color:palette.text,fontSize:28,fontWeight:'600',letterSpacing:-0.3},description:{color:palette.muted,fontSize:12,lineHeight:20},
 equip:{overflow:'hidden',minHeight:56,alignItems:'center',justifyContent:'center',backgroundColor:palette.playerSurface,borderLeftWidth:2,borderLeftColor:palette.player,borderBottomWidth:1,borderBottomColor:palette.borderActive},equipped:{backgroundColor:palette.systemSurface},
 option:{minHeight:60,paddingLeft:10,borderLeftWidth:1,borderLeftColor:'transparent',borderBottomWidth:1,borderBottomColor:palette.line,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},selectedOption:{borderLeftColor:palette.player},optionName:{color:palette.textSecondary,fontSize:13},pressed:{backgroundColor:palette.systemSurface,transform:[{translateX:2}]},
});
