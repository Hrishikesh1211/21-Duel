import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RecentMatch, SessionPlayer } from '../competitive/session';
import { rankView } from '../competitive/rankView';
import { samplePlayStyleStats } from '../data/localProfile';
import { modeConfig } from '../game/rulesConfig';
import { palette, typography } from '../components/theme';
import { RankEmblem } from '../components/RankEmblem';

export default function ProfileScreen({ player, peakRating, rankedMatchCount, recentMatches = [], onFriends, friendCount = 0, reviewIds = [], onReview }: {
  onFriends: ()=>void; friendCount?: number; player: SessionPlayer; peakRating?: number; rankedMatchCount?: number; recentMatches?: readonly RecentMatch[]; reviewIds?: readonly string[]; onReview?: (id:string)=>void;
}) {
  const rank = rankView(player);
  const decisiveMatches = player.wins + player.losses;
  const winRate = decisiveMatches ? Math.round(player.wins / decisiveMatches * 100) : 0;
  const peak = Math.max(peakRating ?? player.rating, player.rating);
  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.root}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>PROFILE</Text>
      <View style={styles.identity}>
        <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.heroGeometry}><View style={styles.heroStroke} /><View style={styles.heroOffset} /><View style={styles.heroDiagonal} /></View>
        <Text style={styles.name}>{player.name}</Text>
        <Text testID="profile-rating" style={styles.rating}>{rank.rating}</Text>
        <View style={styles.rankIdentity}><RankEmblem division={rank.division} size={42} /><Text style={styles.division}>{rank.division}</Text></View>
        <Text testID="profile-record" style={styles.record}>{player.wins} W / {player.losses} L</Text>
        <View style={styles.heroMetrics}>
          <View style={styles.heroMetric}><Text style={styles.caption}>PEAK RATING</Text><Text testID="profile-peak" style={styles.heroValue}>{peak}</Text></View>
          <View style={styles.heroMetric}><Text style={styles.caption}>WIN RATE</Text><Text testID="profile-win-rate" style={styles.heroValue}>{winRate}%</Text></View>
        </View>
      </View>
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>COMPETITIVE</Text>
        <View style={styles.progressionRow}>
          <View style={styles.progressionColumn}><Text style={styles.caption}>CURRENT</Text><Text style={styles.detail}>{rank.division}</Text><Text style={styles.progressionValue}>{rank.rating}</Text></View>
          <Text accessible={false} style={styles.direction}>{'\u2192'}</Text>
          <View style={styles.progressionColumn}><Text style={styles.caption}>{rank.next ? 'NEXT' : 'LADDER'}</Text><Text style={styles.detail}>{rank.next ? rank.next.name : 'COMPLETE'}</Text>{rank.next && <Text style={styles.progressionValue}>{rank.next.min}</Text>}</View>
        </View>
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
          const reviewable = reviewIds.includes(match.id) && !!onReview;
          const date = match.timestamp && Number.isFinite(match.timestamp) ? new Date(match.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase() : undefined;
          const label = `${match.opponentName}, ${mode.name}, ${match.outcome}, ${match.playerScore} to ${match.opponentScore}, ${mode.ratingEnabled ? 'rating change '+delta : 'no rating change'}`;
          const detail = <>
            <View style={styles.matchIdentity}><Text style={styles.opponent}>{match.opponentName}</Text><Text style={styles.matchMode}>{mode.name}</Text>{date && <Text style={styles.matchDate}>{date}</Text>}</View>
            <View style={styles.matchResult}><Text style={[styles.score, { color: match.outcome === 'win' ? palette.victory : match.outcome === 'loss' ? palette.defeat : palette.system }]}>{`${outcome} ${match.playerScore}\u2013${match.opponentScore}`}</Text><Text testID={`profile-delta-${match.id}`} style={[styles.delta,mode.ratingEnabled && (match.ratingDelta !== undefined && match.ratingDelta < 0 ? styles.negativeDelta : styles.rankedDelta)]}>{delta}</Text></View>
            {reviewable && <Text accessible={false} style={styles.reviewArrow}>{'\u2192'}</Text>}
          </>;
          return reviewable && onReview
            ? <Pressable key={match.id} testID={`profile-match-${match.id}`} accessibilityRole="button" accessibilityLabel={label} accessibilityHint="Review this match" onPress={()=>onReview(match.id)} style={({pressed})=>[styles.historyRow,styles.reviewableRow,pressed&&styles.historyPressed]}>{detail}</Pressable>
            : <View key={match.id} testID={`profile-match-${match.id}`} accessible accessibilityLabel={label} style={styles.historyRow}>{detail}</View>;
        })}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`View friends, ${friendCount} friends`} onPress={onFriends} style={({pressed})=>[styles.section,styles.friendsEntry,pressed&&styles.pressed]}>
        <View style={styles.row}><Text style={styles.sectionTitle}>FRIENDS</Text><Text style={styles.friendCount}>{friendCount}</Text></View><Text style={styles.caption}>{'VIEW FRIENDS \u2192'}</Text>
      </Pressable>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.table },
  content: { flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 18, paddingBottom: 28, gap: 28 },
  title: { color: palette.text, fontSize: 26, fontWeight: '600', letterSpacing: 0.3 },
  identity: { gap: 12, paddingTop: 20, borderTopWidth: 1, borderTopColor: palette.borderActive, overflow: 'hidden' },
  heroGeometry: { position: 'absolute', top: 0, right: 0, width: 100, height: 180 },
  heroStroke: { position: 'absolute', top: 60, right: 0, width: 72, height: 1, backgroundColor: palette.line },
  heroOffset: { position: 'absolute', top: 101, right: -8, width: 48, height: 1, backgroundColor: palette.borderActive },
  heroDiagonal: { position: 'absolute', right: 10, top: -16, width: 1, height: 118, backgroundColor: palette.borderActive, transform: [{ rotate: '28deg' }] },
  name: { color: palette.text, fontSize: 24, letterSpacing: 0.2, fontWeight: '600', paddingRight: 72 },
  rating: { color: palette.text, fontSize: 76, lineHeight: 84, letterSpacing: -3, fontWeight: '500', fontVariant: ['tabular-nums'] },
  rankIdentity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  division: { color: palette.player, fontSize: 11, fontWeight: '600', letterSpacing: 1.2 },
  record: { color: palette.textSecondary, fontSize: 12, fontVariant: ['tabular-nums'], marginTop: 2 },
  heroMetrics: { flexDirection: 'row', gap: 28, marginTop: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: palette.line },
  heroMetric: { flex: 1, gap: 6 },
  heroValue: { color: palette.text, fontSize: 23, fontWeight: '500', fontVariant: ['tabular-nums'] },
  section: { borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 18, gap: 16 },
  sectionTitle: { ...typography.section, color: palette.text },
  caption: { color: palette.muted, fontSize: 9, letterSpacing: 1.2 },
  detail: { color: palette.player, fontSize: 11, fontWeight: '600', letterSpacing: 0.6 },
  progressionRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  progressionColumn: { flex: 1, gap: 8 },
  progressionValue: { color: palette.text, fontSize: 25, fontWeight: '500', fontVariant: ['tabular-nums'] },
  direction: { color: palette.borderActive, fontSize: 22 },
  note: { color: palette.muted, fontSize: 11, lineHeight: 18 },
  track: { height: 2, backgroundColor: palette.line },
  fill: { height: 2, backgroundColor: palette.player },
  matchCount: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  matchCountLabel: { gap: 5 },
  statsHeading: { marginTop: 2 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  stat: { width: '47%', gap: 7, paddingVertical: 12, borderTopWidth: 1, borderTopColor: palette.line },
  statValue: { color: palette.text, fontSize: 30, fontWeight: '500', fontVariant: ['tabular-nums'] },
  historyRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, paddingVertical: 12, paddingLeft: 8, borderLeftWidth: 1, borderLeftColor: 'transparent', borderBottomWidth: 1, borderBottomColor: palette.line, minHeight: 72 },
  reviewableRow: { borderLeftColor: palette.borderActive },
  historyPressed: { backgroundColor: palette.systemSurface, borderLeftColor: palette.player, transform: [{ translateX: 2 }], opacity: 0.85 },
  matchIdentity: { flex: 1, minWidth: 130, gap: 5 },
  opponent: { color: palette.text, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  matchMode: { color: palette.muted, fontSize: 9, letterSpacing: 0.6, lineHeight: 15 },
  matchDate: { color: palette.muted, fontSize: 8, letterSpacing: 0.7 },
  matchResult: { alignItems: 'flex-end', gap: 6 },
  score: { color: palette.text, fontSize: 15, fontWeight: '500', fontVariant: ['tabular-nums'] },
  delta: { color: palette.muted, fontSize: 11, fontVariant: ['tabular-nums'] },
  rankedDelta: { color: palette.player },
  negativeDelta: { color: palette.defeat },
  reviewArrow: { color: palette.player, fontSize: 16, paddingLeft: 2 },
  friendsEntry: { gap: 10 },
  friendCount: { color: palette.textSecondary, fontSize: 18, fontVariant: ['tabular-nums'] },
  pressed: { opacity: 0.65 },
});
