import { Pressable, Text, View } from 'react-native';
import type { FriendProfile } from '../data/friends';
import { MODE_LIST } from '../game/rulesConfig';
import type { PublicGameMode } from '../game/types';
import { SocialScreen, socialStyles as styles } from './SocialScreen';
export default function ChallengeModeScreen({ friend, onBack, onSelect }: { friend: FriendProfile; onBack: ()=>void; onSelect: (mode: PublicGameMode)=>void }) {
  return <SocialScreen title={`CHALLENGE ${friend.name}`} onBack={onBack}>
    {(['ranked','casual'] as const).map(category=><View key={category} style={styles.separator}>
      <Text style={styles.caption}>{category.toUpperCase()}</Text>
      {MODE_LIST.filter(mode=>mode.category===category).map(mode=><Pressable key={mode.id} accessibilityRole="button" accessibilityLabel={`Challenge ${friend.name} to ${mode.name}`} disabled={!friend.online} accessibilityState={{disabled:!friend.online}} onPress={friend.online ? ()=>onSelect(mode.id) : undefined} style={styles.row}>
        <View style={styles.copy}><Text style={styles.name}>{mode.name.replace(`${category.toUpperCase()} `,'')}</Text><Text style={styles.detail}>{mode.description}</Text><Text style={styles.caption}>{`FIRST TO ${mode.targetScore}`}</Text></View><Text style={styles.actionText}>{'\u2192'}</Text>
      </Pressable>)}
    </View>)}
  </SocialScreen>;
}
