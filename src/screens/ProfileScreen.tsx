import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RecentMatch, SessionPlayer } from '../competitive/session';
import { rankView } from '../competitive/rankView';
import { equippedCosmetics, type CosmeticSlot } from '../data/cosmetics';
import { samplePlayStyleStats } from '../data/localProfile';
import { modeConfig } from '../game/rulesConfig';
import { palette, typography, surfaces } from '../components/theme';

export default function ProfileScreen({ player, peakRating, rankedMatchCount, recentMatches = [], onOpenCosmetics, onFriends, friendCount = 0, reviewIds = [], onReview }: {
  onFriends: ()=>void; friendCount?: number; onOpenCosmetics: (slot: CosmeticSlot, id?: string)=>void; player: SessionPlayer; peakRating?: number; rankedMatchCount?: number; recentMatches?: readonly RecentMatch[]; reviewIds?: readonly string[]; onReview?: (id:string)=>void;
}) {
  const rank = rankView(player);
  const decisiveMatches = player.wins + player.losses;
  const winRate = decisiveMatches ? Math.round(player.wins / decisiveMatches * 100) : 0;
  const peak = Math.max(peakRating ?? player.rating, player.rating);
  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.root}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>PROFILE</Text>
      <View style={styles.identity}>
        <Text style={styles.name}>{player.name}</Text>
        <Text testID="profile-rating" style={styles.rating}>{rank.rating}</Text>
        <View style={styles.row}><Text style={styles.division}>{rank.division}</Text><Text testID="profile-record" style={styles.record}>{player.wins} W / {player.losses} L</Text></View>
        <View style={styles.heroMetrics}>
          <View style={styles.heroMetric}><Text style={styles.caption}>PEAK RATING</Text><Text testID="profile-peak" style={styles.heroValue}>{peak}</Text></View>
          <View style={styles.heroMetric}><Text style={styles.caption}>WIN RATE</Text><Text testID="profile-win-rate" style={styles.heroValue}>{winRate}%</Text></View>
        </View>
      </View>
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>COMPETITIVE</Text>
        <View style={styles.row}><Text style={styles.caption}>CURRENT</Text><Text style={styles.detail}>{`${rank.division} \u00b7 ${rank.rating}`}</Text></View>
        <View style={styles.row}><Text style={styles.caption}>{rank.next ? 'NEXT' : 'LADDER'}</Text><Text style={styles.detail}>{rank.next ? `${rank.next.name} \u00b7 ${rank.next.min}` : 'COMPLETE'}</Text></View>
        <View testID="profile-progress" accessible accessibilityRole="progressbar" accessibilityLabel={rank.next ? `Progress to ${rank.next.name}` : 'Highest local division reached'} accessibilityValue={{min:0,max:100,now:Math.round(rank.progress*100),text:rank.next ? `${rank.remaining} to advance` : 'Ladder complete'}} style={styles.track}><View style={[styles.fill,{width:`${rank.progress*100}%`}]} /></View>
        <Text testID="profile-remaining" style={styles.caption}>{rank.next ? `${rank.remaining} TO ADVANCE` : 'TOP OF LOCAL LADDER'}</Text>
      </View>
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>STATS</Text>
        <View style={styles.matchCount}><View style={styles.matchCountLabel}><Text style={styles.caption}>MATCHES</Text><Text style={styles.note}>Ranked</Text></View><Text testID="profile-matches" style={styles.statValue}>{rankedMatchCount ?? decisiveMatches}</Text></View>
        <View style={styles.statsHeading}><Text style={styles.caption}>PLAY STYLE</Text></View>
        <View style={styles.statGrid}>{samplePlayStyleStats.map(stat=><View key={stat.label} style={styles.stat}><Text style={styles.caption}>{stat.label}</Text><Text style={styles.statValue}>{stat.value}</Text></View>)}</View>
      </View>
      <View style={styles.section}>
        <View style={styles.row}><Text accessibilityRole="header" style={styles.sectionTitle}>MATCH HISTORY</Text><Text style={styles.caption}>LAST 5</Text></View>
        {recentMatches.length === 0 ? <Text style={styles.note}>Your completed matches will appear here.</Text> : recentMatches.slice(0,5).map(match=>{
          const mode = modeConfig(match.modeId);
          const outcome = match.outcome === 'win' ? 'W' : match.outcome === 'loss' ? 'L' : 'D';
          const delta = mode.ratingEnabled && match.ratingDelta !== undefined ? `${match.ratingDelta > 0 ? '+' : ''}${match.ratingDelta}` : '\u2014';
          const label = `${match.opponentName}, ${mode.name}, ${match.outcome}, ${match.playerScore} to ${match.opponentScore}, ${mode.ratingEnabled ? 'rating change '+delta : 'no rating change'}`;
          const detail = <>
            <View style={styles.matchIdentity}><Text style={styles.opponent}>{match.opponentName}</Text><Text style={styles.matchMode}>{mode.name}</Text></View>
            <View style={styles.matchResult}><Text style={[styles.score, { color: match.outcome === 'win' ? palette.victory : match.outcome === 'loss' ? palette.defeat : palette.system }]}>{`${outcome} ${match.playerScore}\u2013${match.opponentScore}`}</Text><Text testID={`profile-delta-${match.id}`} style={[styles.delta,mode.ratingEnabled && styles.rankedDelta]}>{delta}</Text></View>
          </>;
          return reviewIds.includes(match.id) && onReview
            ? <Pressable key={match.id} testID={`profile-match-${match.id}`} accessibilityRole="button" accessibilityLabel={label} accessibilityHint="Review this match" onPress={()=>onReview(match.id)} style={({pressed})=>[styles.historyRow,pressed&&styles.pressed]}>{detail}</Pressable>
            : <View key={match.id} testID={`profile-match-${match.id}`} accessible accessibilityLabel={label} style={styles.historyRow}>{detail}</View>;
        })}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`View friends, ${friendCount} friends`} onPress={onFriends} style={[styles.section,styles.row]}>
        <View style={styles.loadoutCopy}><Text style={styles.sectionTitle}>FRIENDS</Text><Text style={styles.note}>{friendCount} friends</Text></View><Text style={styles.caption}>{'VIEW FRIENDS \u2192'}</Text>
      </Pressable>
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>LOADOUT</Text>
        {equippedCosmetics(player).map(({field,label,item})=><Pressable key={field} accessibilityRole="button" accessibilityLabel={`${label}, ${item.name}, equipped`} accessibilityHint="Choose and equip a cosmetic" onPress={()=>onOpenCosmetics(field,item.id)} style={({pressed})=>[styles.loadoutRow,pressed && styles.pressed]}>
          <View style={styles.loadoutCopy}><Text style={styles.caption}>{label}</Text><Text style={styles.equippedName}>{item.name}</Text></View>
          <Text accessible={false} style={styles.arrow}>{'\u2192'}</Text>
        </Pressable>)}
      </View>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.table },
  content: { flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 28, paddingTop: 24, paddingBottom: 32, gap: 32 },
  title: { color: palette.text, fontSize: 12, fontWeight: '600', letterSpacing: 2.5 },
  identity: { ...surfaces.section, gap: 10, padding: 18, borderLeftWidth: 2, borderLeftColor: palette.borderActive },
  name: { color: palette.text, fontSize: 13, letterSpacing: 2.4, fontWeight: '600' },
  rating: { color: palette.text, fontSize: 66, lineHeight: 80, letterSpacing: -3, fontWeight: '500', fontVariant: ['tabular-nums'] },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  division: { color: palette.accent, fontSize: 11, letterSpacing: 1.5 },
  record: { color: palette.muted, fontSize: 11, fontVariant: ['tabular-nums'] },
  heroMetrics: { flexDirection: 'row', gap: 28, marginTop: 18 },
  heroMetric: { flex: 1, gap: 8 },
  heroValue: { color: palette.text, fontSize: 20, fontWeight: '300', fontVariant: ['tabular-nums'] },
  section: { borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 22, gap: 18 },
  sectionTitle: { ...typography.section, color: palette.text },
  caption: { color: palette.muted, fontSize: 9, letterSpacing: 1.4 },
  detail: { color: palette.accent, fontSize: 11, letterSpacing: 0.6, fontVariant: ['tabular-nums'] },
  note: { color: palette.muted, fontSize: 11, lineHeight: 18 },
  track: { height: 3, backgroundColor: palette.line },
  fill: { height: 3, backgroundColor: palette.reward },
  matchCount: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  matchCountLabel: { gap: 5 },
  statsHeading: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginTop: 4 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 22 },
  stat: { width: '47%', gap: 8, paddingVertical: 12, paddingLeft: 12, backgroundColor: palette.surface1, borderLeftWidth: 1, borderLeftColor: palette.line },
  statValue: { color: palette.text, fontSize: 25, fontWeight: '300', fontVariant: ['tabular-nums'] },
  historyRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, backgroundColor: palette.surface1, padding: 12, borderBottomWidth: 1, borderBottomColor: palette.line },
  matchIdentity: { flex: 1, minWidth: 140, gap: 6 },
  opponent: { color: palette.text, fontSize: 11, fontWeight: '500', letterSpacing: 1.2 },
  matchMode: { color: palette.muted, fontSize: 9, letterSpacing: 0.6, lineHeight: 16 },
  matchResult: { alignItems: 'flex-end', gap: 6 },
  score: { color: palette.text, fontSize: 13, fontVariant: ['tabular-nums'] },
  delta: { color: palette.muted, fontSize: 10, fontVariant: ['tabular-nums'] },
  rankedDelta: { color: palette.accent },
  loadoutRow: { backgroundColor: palette.surface2, padding: 12, borderLeftWidth: 2, borderLeftColor: palette.reward, minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 18, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: palette.line },
  loadoutCopy: { flex: 1, gap: 7 },
  equippedName: { color: palette.text, fontSize: 13 },
  arrow: { color: palette.accent, fontSize: 18 },
  pressed: { opacity: 0.65 },
});
