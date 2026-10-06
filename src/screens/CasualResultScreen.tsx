import type { CasualResult } from '../competitive/session';
import { modeConfig } from '../game/rulesConfig';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from '../components/theme';

export default function CasualResultScreen({ result, onRematch, onHome, onReview }: { result: CasualResult; onRematch: () => void; onHome: () => void; onReview?: () => void }) {
  return <SafeAreaView style={styles.root}>
    <View style={styles.content}>
      <Text style={styles.mode}>{modeConfig(result.mode).name}</Text>
      <Text accessibilityRole="header" style={styles.title}>{result.outcome === 'win' ? 'VICTORY' : result.outcome === 'loss' ? 'DEFEAT' : 'DRAW'}</Text>
      <Text accessibilityLabel={`Final points. You ${result.playerRounds}, opponent ${result.opponentRounds}`} style={styles.score}>{result.playerRounds}{' \u2014 '}{result.opponentRounds}</Text>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onRematch} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text style={styles.primaryText}>REMATCH</Text></Pressable>
        {onReview ? <Pressable accessibilityRole="button" onPress={onReview} style={({ pressed }) => [styles.home, pressed && styles.pressed]}><Text style={styles.reviewText}>REVIEW MATCH</Text></Pressable> : null}
        <Pressable accessibilityRole="button" onPress={onHome} style={({ pressed }) => [styles.home, pressed && styles.pressed]}><Text style={styles.homeText}>HOME</Text></Pressable>
      </View>
    </View>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.table },
  content: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', padding: 28, gap: 22 },
  mode: { color: palette.muted, fontSize: 10, letterSpacing: 1.8 },
  title: { color: palette.text, fontSize: 24, fontWeight: '500', letterSpacing: 3 },
  score: { color: palette.muted, fontSize: 32, fontWeight: '300', fontVariant: ['tabular-nums'] },
  actions: { width: '100%', gap: 6, marginTop: 24 },
  primary: { minHeight: 56, backgroundColor: palette.playerSurface, borderWidth: 1, borderColor: palette.borderActive, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: palette.text, fontSize: 12, fontWeight: '600', letterSpacing: 2 },
  home: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  homeText: { color: palette.muted, fontSize: 10, letterSpacing: 2 },
  reviewText: { color: palette.accent, fontSize: 10, letterSpacing: 2 },
  pressed: { opacity: 0.7 },
});
