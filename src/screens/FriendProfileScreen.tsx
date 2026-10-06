import { Pressable, Text, View } from 'react-native';
import type { FriendProfile } from '../data/friends';
import { PlayerCard } from '../components/PlayerCard';
import { Availability, SocialScreen, socialStyles as styles } from './SocialScreen';
export default function FriendProfileScreen({ friend, onBack, onChallenge }: { friend: FriendProfile; onBack: ()=>void; onChallenge: ()=>void }) {
  const matches=friend.wins+friend.losses;
  return <SocialScreen title="FRIEND PROFILE" onBack={onBack}>
    <PlayerCard player={friend}/><Availability online={friend.online}/>
    <View style={styles.separator}><Text style={styles.caption}>RECORD</Text><Text style={styles.detail}>{friend.wins} W / {friend.losses} L / {matches ? Math.round(friend.wins / matches * 100) : 0}% WIN RATE</Text></View>
    <Pressable accessibilityRole="button" accessibilityState={{disabled:!friend.online}} disabled={!friend.online} onPress={friend.online ? onChallenge : undefined} style={[styles.action,!friend.online && styles.disabled]}><Text style={styles.actionText}>{friend.online ? 'CHALLENGE' : 'OFFLINE'}</Text></Pressable>
  </SocialScreen>;
}
