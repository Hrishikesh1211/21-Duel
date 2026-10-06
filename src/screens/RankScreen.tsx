import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { SessionPlayer } from '../competitive/session';
import { rankView } from '../competitive/rankView';
import { localSeason } from '../data/localSeason';
import { palette } from '../components/theme';

export default function RankScreen({ player }: { player: SessionPlayer }) {
  const rank = rankView(player);
  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.root}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.row}><Text accessibilityRole="header" style={styles.title}>RANK</Text><Text style={styles.caption}>{localSeason.label}</Text></View>
      <View style={styles.hero}>
        <View style={styles.identity}>
        <Text testID="rank-division" style={styles.division}>{rank.division}</Text>
        <View style={styles.ratingRow}><Text testID="rank-rating" style={styles.rating}>{rank.rating}</Text><Text style={styles.caption}>RATING</Text></View>
        <Text style={styles.caption}>{rank.next ? `${rank.remaining} TO ${rank.next.name}` : 'HIGHEST LOCAL DIVISION'}</Text>
        </View>
        <View style={styles.progressSection}>
          <View style={styles.row}><Text style={styles.value}>{rank.next?.name ?? 'LADDER COMPLETE'}</Text>{rank.next && <Text style={styles.value}>{rank.next.min}</Text>}</View>
          <View testID="rank-progress" accessible accessibilityRole="progressbar" accessibilityLabel={rank.next ? `Progress to ${rank.next.name}` : 'Highest local division reached'} accessibilityValue={{ min: 0, max: 100, now: Math.round(rank.progress * 100), text: rank.next ? `${rank.rating} of ${rank.next.min} rating, ${rank.remaining} to advance` : 'Highest local division reached' }} style={styles.track}>
            <View style={[styles.fill, { width: `${rank.progress * 100}%` }]} />
          </View>
          <View style={styles.row}><Text style={styles.secondary}>{rank.next ? `${rank.rating} / ${rank.next.min}` : `${rank.rating} RATING`}</Text><Text style={styles.secondary}>{rank.next ? `${rank.remaining} TO ADVANCE` : 'TOP OF LOCAL LADDER'}</Text></View>
        </View>
      </View>
      <View style={styles.ladder}>
        <Text accessibilityRole="header" style={styles.caption}>COMPETITIVE LADDER</Text>
        <View style={styles.steps}>
          {rank.ladder.map((division, index) => <View key={division.name} testID={division.current ? 'rank-current-step' : undefined} accessible accessibilityLabel={`${division.name}, ${division.min}${division.max === null ? ' and above' : ` to ${division.max}`}${division.current ? ', your current division' : ''}`} style={styles.step}>
            <View style={styles.rail}>
              {index > 0 ? <View style={styles.lineAbove} /> : null}
              {index < rank.ladder.length - 1 ? <View style={styles.lineBelow} /> : null}
              <View style={[styles.dot, division.current && styles.currentDot]} />
            </View>
            <View style={[styles.stepBody, division.current && styles.currentBody]}>
              <View style={styles.stepName}><Text style={[styles.stepTitle, division.current && styles.currentText]}>{division.name}</Text>{division.current ? <Text style={styles.you}>YOU</Text> : null}</View>
              <Text style={[styles.threshold, division.current && styles.currentText]}>{division.current && division.max !== null ? `${division.min}\u2013${division.max}` : `${division.min}${division.max === null ? '+' : ''}`}</Text>
            </View>
          </View>)}
        </View>
      </View>
      <View style={styles.season}>
        <View style={styles.row}><Text accessibilityRole="header" style={styles.caption}>GLOBAL RANK</Text><Text style={styles.mock}>MOCK STANDING</Text></View>
        <Text testID="rank-season-position" style={styles.position}>#{localSeason.mockGlobalPosition.toLocaleString('en-US')}</Text>
      </View>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.table },
  content: { flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 28, paddingTop: 24, paddingBottom: 32, gap: 32 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { color: palette.text, fontSize: 12, fontWeight: '600', letterSpacing: 2.5 },
  caption: { color: palette.muted, fontSize: 9, letterSpacing: 1.7 },
  hero: { gap: 28 },
  identity: { gap: 6, paddingTop: 4 },
  division: { color: palette.accent, fontSize: 12, letterSpacing: 2 },
  rating: { color: palette.text, fontSize: 66, lineHeight: 80, fontWeight: '300', letterSpacing: -3, fontVariant: ['tabular-nums'] },
  ratingRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: 14 },
  progressSection: { gap: 12 },
  value: { color: palette.text, fontSize: 11, letterSpacing: 1.2 },
  track: { height: 2, backgroundColor: palette.line },
  fill: { height: 2, backgroundColor: palette.accent },
  secondary: { color: palette.muted, fontSize: 10, letterSpacing: 0.8, fontVariant: ['tabular-nums'] },
  ladder: { gap: 14 },
  steps: { paddingLeft: 2 },
  step: { flexDirection: 'row', minHeight: 60 },
  rail: { width: 22, alignItems: 'center', justifyContent: 'center' },
  lineAbove: { position: 'absolute', top: 0, bottom: '50%', width: 1, backgroundColor: palette.line },
  lineBelow: { position: 'absolute', top: '50%', bottom: 0, width: 1, backgroundColor: palette.line },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: palette.table, borderWidth: 1, borderColor: palette.muted },
  currentDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.accent, borderColor: palette.accent },
  stepBody: { flex: 1, marginLeft: 12, paddingVertical: 12, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  currentBody: { borderBottomWidth: 1, borderBottomColor: palette.accent },
  stepName: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  stepTitle: { color: palette.muted, fontSize: 11, letterSpacing: 1.1 },
  currentText: { color: palette.text, fontWeight: '600' },
  you: { color: palette.accent, fontSize: 8, letterSpacing: 1 },
  threshold: { color: palette.muted, fontSize: 11, fontVariant: ['tabular-nums'] },
  season: { borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 22, gap: 12 },
  mock: { color: palette.muted, fontSize: 8, letterSpacing: 1 },
  position: { color: palette.text, fontSize: 24, fontWeight: '300', fontVariant: ['tabular-nums'] },
});

