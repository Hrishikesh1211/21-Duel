import { Pressable, Text } from 'react-native';
import type { Challenge } from '../social/challenges';
import { getFriend } from '../data/friends';
import { modeConfig } from '../game/rulesConfig';
import { PlayerCard } from '../components/PlayerCard';
import { SocialScreen, socialStyles as styles } from './SocialScreen';
export default function IncomingChallengeScreen({ challenge, onAccept, onDecline }: { challenge: Challenge; onAccept: ()=>void; onDecline: ()=>void }) {
  const friend=getFriend(challenge.opponentId);
  const mode=modeConfig(challenge.modeId);
  return <SocialScreen title={friend ? `${friend.name} CHALLENGED YOU` : 'CHALLENGE UNAVAILABLE'} onBack={onDecline}>
    {friend && <PlayerCard player={friend}/>}
    <Text style={styles.name}>{mode.name}</Text><Text style={styles.caption}>{`FIRST TO ${mode.targetScore}`}</Text>
    <Pressable accessibilityRole="button" disabled={!friend?.online} accessibilityState={{disabled:!friend?.online}} onPress={friend?.online ? onAccept : undefined} style={[styles.action,!friend?.online && styles.disabled]}><Text style={styles.actionText}>ACCEPT</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={onDecline} style={styles.back}><Text style={styles.caption}>DECLINE</Text></Pressable>
  </SocialScreen>;
}
