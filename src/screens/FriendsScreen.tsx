import { Pressable, Text, View } from 'react-native';
import { mockFriends } from '../data/friends';
import { getEquippedCosmetic } from '../data/cosmetics';
import { CosmeticGeometry } from '../components/CosmeticArtwork';
import { Availability, SocialScreen, socialStyles as styles } from './SocialScreen';
export default function FriendsScreen({ onBack, onFriend, onMockIncoming, showDevelopmentControls = false }: { onBack: ()=>void; onFriend: (id: string)=>void; onMockIncoming: ()=>void; showDevelopmentControls?: boolean }) {
  return <SocialScreen title="FRIENDS" onBack={onBack}>
    <Text style={styles.caption}>{`${mockFriends.length} FRIENDS`}</Text>
    <View>{mockFriends.map(friend=><Pressable key={friend.id} accessibilityRole="button" accessibilityLabel={`View ${friend.name}, ${friend.rating}, ${friend.division}, ${friend.online ? 'online' : 'offline'}`} onPress={()=>onFriend(friend.id)} style={({pressed})=>[styles.row,pressed && {opacity:friend.online ? 0.72 : 0.85,transform:[{scale:friend.online ? 0.99 : 1}]}]}>
      <View style={styles.copy}><Text style={styles.name}>{friend.name}</Text><Text style={styles.detail}>{friend.rating} / {friend.division}</Text><Availability online={friend.online}/></View>
      <View accessible={false} style={{height:42,width:72}}><CosmeticGeometry config={getEquippedCosmetic(friend,'playerCardId').visual}/></View>
    </Pressable>)}</View>
    {showDevelopmentControls && <View style={styles.separator}><Text style={styles.caption}>DEVELOPER CONTROLS</Text><Pressable accessibilityRole="button" onPress={onMockIncoming} style={styles.action}><Text style={styles.actionText}>SIMULATE INCOMING CHALLENGE</Text></Pressable></View>}
  </SocialScreen>;
}
