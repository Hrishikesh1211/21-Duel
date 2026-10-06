import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { cancelAnimation, FadeIn, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { RankedResult, SessionPlayer } from '../competitive/session';
import { palette } from '../components/theme';
import { modeConfig } from '../game/rulesConfig';

type Props = { player: SessionPlayer; result: RankedResult; onHome: () => void; onRematch: () => void };
export default function PostMatchScreen({ player, result, onHome, onRematch }: Props) {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState(reduced ? 3 : 0);
  const feedbackId = useRef<number | null>(null);
  const progress = useSharedValue(0);
  const atTop = player.nextDivisionRating === player.divisionStartRating;
  const target = atTop ? 1 : Math.max(0, Math.min(1, (player.rating - player.divisionStartRating) / (player.nextDivisionRating - player.divisionStartRating)));
  useEffect(() => {
    const notify = () => {
      if (feedbackId.current === result.matchId || AppState.currentState !== 'active') return;
      feedbackId.current = result.matchId;
      const feedback = result.promoted || result.outcome === 'win'
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : Haptics.impactAsync(result.outcome === 'loss' ? Haptics.ImpactFeedbackStyle.Soft : Haptics.ImpactFeedbackStyle.Light);
      void feedback.catch(() => {});
    };
    if (reduced) { notify(); return; }
    const reveal = setTimeout(() => setStage(1), 180);
    const settle = setTimeout(() => { setStage(result.promoted ? 2 : 3); if (!result.promoted) notify(); }, 800);
    const promotion = result.promoted ? setTimeout(() => { setStage(3); notify(); }, 1050) : undefined;
    return () => { clearTimeout(reveal); clearTimeout(settle); clearTimeout(promotion); };
  }, [result.matchId, result.outcome, result.promoted, reduced]);
  useEffect(() => {
    progress.value = withTiming(stage >= 3 ? target : 0, { duration: reduced ? 0 : 300 });
    return () => cancelAnimation(progress);
  }, [stage, target, progress, reduced]);
  const fill = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.value }] }));
  return <SafeAreaView style={styles.safe} testID="post-match-screen">
    <ScrollView bounces={false} contentContainerStyle={styles.content}>
      <Text style={styles.context}>{modeConfig(result.mode ?? 'ranked_duel').name}</Text>
      <View style={styles.result}>
        <Text style={[styles.outcome, { color: result.outcome === 'win' ? palette.victory : result.outcome === 'loss' ? palette.defeat : palette.system }]}>{result.outcome === 'win' ? 'VICTORY' : result.outcome === 'loss' ? 'DEFEAT' : 'DRAW'}</Text>
        <Text style={styles.score}>{result.playerRounds}{' \u2014 '}{result.opponentRounds}</Text>
      </View>
      <View style={styles.ratingSection}>
        <Text style={styles.eyebrow}>RATING</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.oldRating}>{result.oldRating}</Text>
          <Text style={[styles.arrow, { opacity: stage >= 1 ? 1 : 0 }]}>{'\u2192'}</Text>
          <View style={styles.newSlot}>{stage >= 1 ? <Animated.Text entering={FadeIn.duration(620)} style={styles.newRating}>{result.newRating}</Animated.Text> : null}</View>
        </View>
        <View style={styles.deltaSlot}>{stage >= 2 ? <Animated.Text entering={FadeIn.duration(180)} style={styles.delta}>{result.ratingDelta > 0 ? '+' : ''}{result.ratingDelta}</Animated.Text> : null}</View>
      </View>
      <View style={styles.progression}>
        <Animated.Text entering={FadeIn.duration(180)} key={stage >= 3 ? player.division : result.oldDivision} style={styles.division}>{stage >= 3 ? player.division : result.oldDivision}</Animated.Text>
        <Text style={styles.promotion}>{stage >= 3 && result.promoted ? 'PROMOTED' : ' '}</Text>
        <View style={styles.row}><Text style={styles.small}>{atTop ? 'HIGHEST MOCK DIVISION' : `NEXT / ${player.nextDivision}`}</Text><Text style={styles.small}>{player.nextDivisionRating}</Text></View>
        <View style={styles.track} accessible accessibilityRole="progressbar" accessibilityLabel={`Progress toward ${player.nextDivision}`} accessibilityValue={{ min: 0, max: 100, now: Math.round(target * 100) }}><Animated.View style={[styles.fill, fill]} /></View>
        <View style={styles.row}><Text style={styles.small}>{player.rating} / {player.nextDivisionRating}</Text><Text style={styles.small}>{atTop ? ' ' : `${Math.max(0, player.nextDivisionRating - player.rating)} TO ADVANCE`}</Text></View>
        <Text style={styles.record}>{player.wins} W / {player.losses} L</Text>
      </View>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onRematch} style={({ pressed }) => [styles.button, styles.primary, pressed && styles.pressed]}><Text style={styles.primaryText}>REMATCH</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={onHome} style={({ pressed }) => [styles.button, pressed && styles.pressed]}><Text style={styles.secondaryText}>HOME</Text></Pressable>
      </View>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.table },
  content: { flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 28, paddingTop: 18, paddingBottom: 12, gap: 24, justifyContent: 'space-between' },
  context: { color: palette.muted, fontSize: 10, letterSpacing: 2, textAlign: 'center' },
  result: { backgroundColor: palette.surface1, borderTopWidth: 1, borderTopColor: palette.line, paddingVertical: 22, alignItems: 'center', gap: 14 },
  outcome: { color: palette.text, fontSize: 27, fontWeight: '600', letterSpacing: 3 },
  score: { color: palette.muted, fontSize: 24, fontWeight: '300', fontVariant: ['tabular-nums'] },
  ratingSection: { alignItems: 'center', gap: 12 },
  eyebrow: { color: palette.muted, fontSize: 9, letterSpacing: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' },
  oldRating: { color: palette.muted, fontSize: 29, fontWeight: '300', fontVariant: ['tabular-nums'] },
  arrow: { color: palette.muted, fontSize: 20 },
  newSlot: { minWidth: 114, minHeight: 62, justifyContent: 'center' },
  newRating: { color: palette.text, fontSize: 46, lineHeight: 62, fontWeight: '400', fontVariant: ['tabular-nums'] },
  deltaSlot: { height: 24 },
  delta: { color: palette.accent, fontSize: 18, fontWeight: '500', fontVariant: ['tabular-nums'] },
  progression: { gap: 12 },
  division: { color: palette.text, fontSize: 13, textAlign: 'center', letterSpacing: 2 },
  promotion: { color: palette.reward, fontSize: 9, letterSpacing: 2, textAlign: 'center', height: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  small: { color: palette.muted, fontSize: 9, letterSpacing: 1 },
  track: { height: 2, backgroundColor: palette.line },
  fill: { height: 2, width: '100%', backgroundColor: palette.reward, transformOrigin: 'left center' },
  record: { color: palette.muted, fontSize: 11, textAlign: 'center', marginTop: 8 },
  actions: { gap: 6 },
  button: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  primary: { backgroundColor: palette.playerSurface, borderWidth: 1, borderColor: palette.borderActive },
  primaryText: { color: palette.text, fontSize: 12, fontWeight: '600', letterSpacing: 2 },
  secondaryText: { color: palette.muted, fontSize: 10, letterSpacing: 2 },
  pressed: { opacity: 0.7 },
});
