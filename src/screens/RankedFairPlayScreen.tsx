import type { GameMode } from '../game/types';
import { modeConfig } from '../game/rulesConfig';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from '../components/theme';

const rules = [
  ['SWAPPED OPENINGS', 'Both players play both opening hands across paired rounds.'],
  ['MIRRORED DRAWS', 'Both players face the same hidden hit-card sequence.'],
  ['LOCKED REVEAL', 'Opponent hit cards stay hidden until both hands are finished.'],
] as const;

export default function RankedFairPlayScreen({ onContinue, onCancel, classic = false, mode }: { mode?: GameMode; classic?: boolean; onContinue: () => void; onCancel: () => void }) {
  const config = modeConfig(mode ?? (classic ? 'ranked_classic' : 'ranked_fair'));
  const rows: readonly (readonly [string, string])[] = [
    ...(config.deckModel === 'mirrored' ? rules : []),
    ...(config.raiseFoldEnabled ? [['RAISE OR PASS', 'First actor alternates each round. Decide before any Hit.'], ['CALL OR FOLD', 'Call plays for 2 points. Fold gives the raiser 1 point and keeps hands hidden.'], ['NINE SECONDS', 'No decision means Pass. No response to a Raise means Fold.']] as const : []),
    ...(config.category === 'casual' ? [['HIT OR STAND', 'Play to 21. Each round is worth 1 point.'], ['NO RATING PRESSURE', 'Casual matches do not change your ranked rating or record.']] as const : []),
  ];
  const compact = useWindowDimensions().height < 700;
  return <SafeAreaView style={styles.root} testID="ranked-fair-play">
    <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, compact && styles.compactContent]}>
      <View style={styles.intro}>
        <Text accessibilityRole="header" style={styles.title}>{mode ? `${config.category.toUpperCase()} RULES` : classic ? 'RANKED RULES' : 'RANKED FAIR PLAY'}</Text>
        <Text style={styles.description}>{config.deckModel === 'shared' ? 'Shared deck.' : 'Matched card opportunities.'} First to {config.targetScore} points.</Text>
      </View>
      <View style={styles.rules}>
        {rows.map(([title, detail]) => <View key={title} style={[styles.rule, compact && styles.compactRule]}>
          <View style={styles.marker} />
          <View style={styles.copy}><Text style={styles.ruleTitle}>{title}</Text><Text style={styles.description}>{detail}</Text></View>
        </View>)}
      </View>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onContinue} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text style={styles.primaryText}>UNDERSTOOD</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Cancel match entry and return Home" onPress={onCancel} style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}><Text style={styles.cancelText}>CANCEL</Text></Pressable>
      </View>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.table },
  content: { flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 28, paddingTop: 36, paddingBottom: 12, justifyContent: 'center', gap: 36 },
  compactContent: { paddingTop: 20, gap: 22 },
  compactRule: { paddingVertical: 16 },
  intro: { gap: 12 },
  title: { color: palette.text, fontSize: 17, fontWeight: '600', letterSpacing: 2 },
  description: { color: palette.muted, fontSize: 13, lineHeight: 21 },
  rules: { borderTopWidth: 1, borderTopColor: palette.line },
  rule: { flexDirection: 'row', gap: 15, paddingVertical: 22, borderBottomWidth: 1, borderBottomColor: palette.line },
  marker: { width: 3, height: 12, backgroundColor: palette.playerSurface, borderWidth: 1, borderColor: palette.borderActive, marginTop: 2 },
  copy: { flex: 1, gap: 9 },
  ruleTitle: { color: palette.text, fontSize: 10, fontWeight: '600', letterSpacing: 1.7 },
  actions: { gap: 4 },
  primary: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: palette.playerSurface, borderWidth: 1, borderColor: palette.borderActive },
  primaryText: { color: palette.text, fontSize: 12, fontWeight: '600', letterSpacing: 2 },
  cancel: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: palette.muted, fontSize: 10, letterSpacing: 2 },
  pressed: { opacity: 0.7 },
});
