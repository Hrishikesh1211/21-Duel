import { getEquippedCosmetic, type CosmeticIdentity } from '../data/cosmetics';
import { PlayerCard } from '../components/PlayerCard';
import type { FriendProfile } from '../data/friends';
import { CosmeticGeometry } from '../components/CosmeticArtwork';
import { FEATURED_MODE, modeConfig } from '../game/rulesConfig';
import type { GameMode } from '../game/types';
import { useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MatchmakingDeck } from '../components/MatchmakingDeck';
import { palette } from '../components/theme';
import { localOpponent, type Competitor } from '../data/competitor';
import { MatchmakingController, type MatchmakingPhase } from '../presentation/MatchmakingController';

type Props = { mode?: GameMode; onRules: () => void; player: Competitor & Partial<CosmeticIdentity>; friend?: FriendProfile; onCancel: () => void; onComplete: (opponent: Competitor) => void };
export default function MatchmakingScreen({ onRules, player, onCancel, onComplete, mode = FEATURED_MODE, friend }: Props) {
  const [phase, setPhase] = useState<MatchmakingPhase>(friend ? 'found' : 'searching');
  const controller = useRef<MatchmakingController | null>(null);
  const reduced = useReducedMotion();
  const fade = useSharedValue(1);
  const line = useSharedValue(0);
  useEffect(() => {
    const current = new MatchmakingController(setPhase, {
      knownOpponent: !!friend,
      onComplete: () => onComplete(friend ?? localOpponent),
      onFound: () => {
        if (AppState.currentState === 'active') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      },
    });
    controller.current = current;
    current.start();
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (current.cancel()) onCancel();
      return true;
    });
    return () => { current.dispose(); back.remove(); controller.current = null; };
  }, [onCancel, onComplete, friend]);
  useEffect(() => {
    fade.value = withTiming(phase === 'leaving' || phase === 'complete' ? 0 : 1, { duration: reduced ? 0 : 180 });
    line.value = withTiming(phase !== 'searching' ? 1 : 0, { duration: reduced ? 0 : 250 });
    return () => { cancelAnimation(fade); cancelAnimation(line); };
  }, [phase, reduced, fade, line]);
  const surrounding = useAnimatedStyle(() => ({ opacity: fade.value }));
  const rail = useAnimatedStyle(() => ({ opacity: line.value * 0.7, transform: [{ scaleX: reduced ? 1 : line.value }] }));
  const config = modeConfig(mode);
  const searching = phase === 'searching';
  const title = searching ? 'SEARCHING FOR OPPONENT' : phase === 'found' ? 'OPPONENT FOUND' : `FIRST TO ${config.targetScore}`;
  if (friend) return <SafeAreaView style={styles.safe} testID="friend-match-intro">
    <Animated.View style={[styles.content, surrounding]}>
      <View style={styles.header}><Text style={styles.context}>{config.name}</Text></View>
      <ScrollView contentContainerStyle={styles.friendIntro} showsVerticalScrollIndicator={false}>
        <PlayerCard player={player} compact />
        <View style={styles.search}><Text style={styles.vs}>VS</Text><Text style={styles.format}>FIRST TO {config.targetScore}</Text></View>
        <PlayerCard player={friend} compact />
      </ScrollView>
    </Animated.View>
  </SafeAreaView>;
  return <SafeAreaView style={styles.safe} testID="matchmaking-screen">
    <View style={styles.content}>
      <Animated.View style={[styles.header, surrounding]}><Text style={styles.context}>{config.name}</Text></Animated.View>
      <View style={styles.stage}>
        <Animated.View style={[styles.opponent, surrounding]}>
          {searching ? <View style={styles.search}><Text style={styles.state} accessibilityLiveRegion="polite">{title}</Text><Text style={styles.hint}>Finding a close match</Text></View>
            : <MatchmakingPlayer player={localOpponent} prominent />}
        </Animated.View>
        <View style={styles.deckRow}>
          {!searching ? <Animated.View style={[styles.matchFormat, surrounding]}><Text style={styles.vs}>VS</Text><Text style={styles.format}>FIRST TO {config.targetScore}</Text></Animated.View> : null}
          <Animated.View style={[styles.rail, rail]} /><MatchmakingDeck searching={searching} /><Animated.View style={[styles.rail, rail]} />
        </View>
        <Animated.View style={[styles.player, surrounding]}>
          <Text style={styles.state}>{' '}</Text>
          <MatchmakingPlayer player={player} prominent={!searching} />
        </Animated.View>
      </View>
      <View style={styles.footer}>
        {searching ? <Pressable accessibilityRole="button" onPress={() => { if (controller.current?.cancel()) onRules(); }} style={styles.rulesButton}><Text style={styles.rulesText}>{config.category === 'ranked' ? 'RANKED RULES' : 'RULES'}</Text></Pressable> : null}
        {searching ? <Pressable accessibilityRole="button" accessibilityLabel="Cancel matchmaking" onPress={() => { if (controller.current?.cancel()) onCancel(); }} style={({ pressed }) => [styles.cancel, pressed && { opacity: 0.55 }]}><Text style={styles.cancelText}>CANCEL</Text></Pressable> : null}
      </View>
    </View>
  </SafeAreaView>;
}
function MatchmakingPlayer({ player, prominent = false }: { player: Competitor & Partial<CosmeticIdentity>; prominent?: boolean }) {
  const identity = getEquippedCosmetic(player, 'playerCardId');
  return <View style={styles.identity}>
    <Text style={[styles.name, prominent && styles.competitorName]}>{player.name}</Text>
    <Text style={[styles.rating, prominent && styles.competitorRating]}>{player.rating}</Text>
    <Text style={[styles.division, prominent && styles.competitorDivision]}>{player.division}</Text>
    <View style={{height:16,width:100,marginVertical:8}}><CosmeticGeometry config={identity.visual}/></View><Text style={styles.record}>{player.wins} W / {player.losses} L</Text>
  </View>;
}
const styles = StyleSheet.create({
  friendIntro: { flexGrow: 1, justifyContent: 'center', gap: 20, paddingVertical: 24 },
  safe: { flex: 1, backgroundColor: palette.table },
  content: { flex: 1, maxWidth: 480, width: '100%', alignSelf: 'center', paddingHorizontal: 28 },
  header: { height: 48, alignItems: 'center', justifyContent: 'center' },
  rulesButton: { position: 'absolute', right: 0, top: 0, minHeight: 44, minWidth: 76, justifyContent: 'center', alignItems: 'flex-end' },
  rulesText: { color: palette.muted, fontSize: 8, letterSpacing: 0.6 },
  context: { color: palette.text, fontSize: 11, letterSpacing: 2.4, fontWeight: '600' },
  stage: { flex: 1 },
  opponent: { flex: 0.8, alignItems: 'center', justifyContent: 'center' },
  player: { flex: 1.2, alignItems: 'center', justifyContent: 'center', gap: 26 },
  search: { alignItems: 'center', gap: 14 },
  state: { color: palette.accent, fontSize: 10, letterSpacing: 1.7, textAlign: 'center' },
  hint: { color: palette.muted, fontSize: 13 },
  deckRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 0, paddingHorizontal: 18 },
  rail: { height: 1, flex: 1, backgroundColor: palette.line },
  identity: { alignItems: 'center', gap: 7 },
  name: { color: palette.text, fontSize: 13, letterSpacing: 2.3, fontWeight: '600' },
  rating: { color: palette.text, fontSize: 40, lineHeight: 48, fontWeight: '300', fontVariant: ['tabular-nums'] },
  competitorName: { fontSize: 15 },
  competitorRating: { fontSize: 44, fontWeight: '400' },
  competitorDivision: { color: palette.accent, fontWeight: '500' },
  matchFormat: { position: 'absolute', top: '100%', left: 0, right: 0, alignItems: 'center', paddingTop: 13, gap: 7 },
  vs: { color: palette.text, fontSize: 10, letterSpacing: 2, fontWeight: '500' },
  format: { color: palette.muted, fontSize: 9, letterSpacing: 1.7 },
  division: { color: palette.muted, fontSize: 10, letterSpacing: 1.6 },
  record: { color: palette.muted, fontSize: 10, marginTop: 5, fontVariant: ['tabular-nums'] },
  footer: { height: 74, alignItems: 'center', justifyContent: 'center' },
  cancel: { minWidth: 110, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: palette.muted, fontSize: 10, letterSpacing: 2 },
});
