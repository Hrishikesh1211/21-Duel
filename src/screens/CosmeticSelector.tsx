import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { SessionPlayer } from '../competitive/session';
import { cosmeticCatalog, getCosmetic, getEquippedCosmetic, loadoutSlots, type CosmeticSlot } from '../data/cosmetics';
import { CosmeticPreview } from '../components/CosmeticPreview';
import { palette } from '../components/theme';
export default function CosmeticSelector({ player, slot, initialId, onEquip, onClose }: { player: SessionPlayer; slot: CosmeticSlot; initialId?: string; onEquip: (slot: CosmeticSlot,id: string)=>void; onClose: ()=>void }) {
  const [candidate, setCandidate] = useState(initialId ?? getEquippedCosmetic(player,slot).id);
  const item = getCosmetic(candidate,slot);
  const equipped = getEquippedCosmetic(player,slot).id === item.id;
  return <SafeAreaView style={styles.root}><ScrollView contentContainerStyle={styles.content}>
    <Pressable accessibilityRole="button" accessibilityLabel="Back to loadout" onPress={onClose} style={styles.back}><Text style={styles.caption}>{'\u2190 BACK'}</Text></Pressable>
    <Text style={styles.caption}>{loadoutSlots.find(s=>s.field === slot)!.label}</Text>
    <CosmeticPreview item={item} player={player}/>
    <View style={styles.copy}><Text accessibilityRole="header" style={styles.name}>{item.name}</Text><Text style={styles.description}>{item.description}</Text></View>
    <Pressable accessibilityRole="button" accessibilityState={{disabled:equipped}} disabled={equipped} onPress={()=>{onEquip(slot,item.id);void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{});}} style={[styles.equip,equipped && {opacity:0.55}]}><Text style={styles.caption}>{equipped ? 'EQUIPPED' : 'EQUIP'}</Text></Pressable>
    <View>{cosmeticCatalog.filter(c=>c.slot === slot).map(c=><Pressable key={c.id} accessibilityRole="button" accessibilityState={{selected:c.id === item.id}} onPress={()=>setCandidate(c.id)} style={styles.option}><Text style={[styles.optionName,c.id === item.id && {color:palette.accent}]}>{c.name}</Text><Text style={styles.caption}>{getEquippedCosmetic(player,slot).id === c.id ? 'EQUIPPED' : c.id === item.id ? 'PREVIEW' : '\u2192'}</Text></Pressable>)}</View>
  </ScrollView></SafeAreaView>;
}
const styles=StyleSheet.create({root:{flex:1,backgroundColor:palette.table},content:{width:'100%',maxWidth:520,alignSelf:'center',padding:28,gap:24},back:{minHeight:44,justifyContent:'center'},caption:{color:palette.accent,fontSize:10,letterSpacing:1.8},copy:{gap:12},name:{color:palette.text,fontSize:28,fontWeight:'300'},description:{color:palette.muted,fontSize:12,lineHeight:20},equip:{minHeight:52,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:palette.line},option:{minHeight:64,borderBottomWidth:1,borderBottomColor:palette.line,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},optionName:{color:palette.text,fontSize:13}});
