import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { SessionPlayer } from '../competitive/session';
import { cosmeticCatalog, getEquippedCosmetic, loadoutSlots, type CosmeticSlot } from '../data/cosmetics';
import { CollectionPreview } from '../components/CollectionPreview';
import { palette } from '../components/theme';
export default function ShopScreen({player,onOpenCosmetics}: {player:SessionPlayer;onOpenCosmetics:(slot:CosmeticSlot,id?:string)=>void}) {
 return <SafeAreaView edges={['top','left','right']} style={styles.root}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
  <View style={styles.header}><Text accessibilityRole="header" style={styles.title}>SHOP</Text><Text style={styles.subtitle}>YOUR COLLECTION</Text></View>
  {loadoutSlots.map(slot=>{const equipped=getEquippedCosmetic(player,slot.field);return <View key={slot.field} style={styles.section}>
   <Text accessibilityRole="header" style={styles.category}>{slot.category}</Text>
   <CollectionPreview item={equipped} player={player}/>
   <View style={styles.equippedCopy}><Text style={styles.objectName}>{equipped.name.toUpperCase()}</Text><Text style={styles.equipped}>EQUIPPED</Text></View>
   <Text style={styles.description}>{equipped.description}</Text>
   <View>{cosmeticCatalog.filter(item=>item.slot===slot.field).map(item=>{const active=equipped.id===item.id;return <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Preview ${item.name}`} accessibilityHint="Open cosmetic preview before equipping" onPress={()=>onOpenCosmetics(slot.field,item.id)} style={({pressed})=>[styles.row,active&&styles.activeRow,pressed&&styles.pressed]}><Text style={[styles.name,active&&styles.activeName]}>{item.name}</Text><Text style={styles.metadata}>{active ? 'EQUIPPED' : '\u2192'}</Text></Pressable>;})}</View>
  </View>;})}
 </ScrollView></SafeAreaView>;
}
const styles=StyleSheet.create({
 root:{flex:1,backgroundColor:palette.table},content:{width:'100%',maxWidth:520,alignSelf:'center',paddingHorizontal:24,paddingTop:18,paddingBottom:28,gap:30},
 header:{gap:8},title:{color:palette.text,fontSize:26,fontWeight:'600',letterSpacing:0.3},subtitle:{color:palette.muted,fontSize:10,letterSpacing:1.5},
 section:{borderTopWidth:1,borderTopColor:palette.line,paddingTop:20,gap:16},category:{color:palette.text,fontSize:23,fontWeight:'600',letterSpacing:0.1},
 equippedCopy:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:10},objectName:{color:palette.text,fontSize:14,fontWeight:'600',letterSpacing:0.5},equipped:{color:palette.player,fontSize:9,fontWeight:'600',letterSpacing:1,borderLeftWidth:2,borderLeftColor:palette.player,paddingLeft:8},
 description:{color:palette.muted,fontSize:12,lineHeight:19},row:{minHeight:52,paddingLeft:10,borderLeftWidth:1,borderLeftColor:'transparent',borderBottomWidth:1,borderBottomColor:palette.line,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},
 activeRow:{borderLeftColor:palette.borderActive},name:{color:palette.textSecondary,fontSize:12,fontWeight:'500'},activeName:{color:palette.text},metadata:{color:palette.player,fontSize:9,letterSpacing:0.8},pressed:{backgroundColor:palette.systemSurface,transform:[{translateX:2}]},
});
