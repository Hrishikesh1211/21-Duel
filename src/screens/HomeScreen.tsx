import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { palette, typography } from '../components/theme';
import { PlayerCard } from '../components/PlayerCard';
import { ModeGeometry } from '../components/ModeGeometry';
import { RankMark } from '../components/RankMark';
import { MatchEntryMark } from '../components/MatchEntryMark';
import { rankView } from '../competitive/rankView';
import type { SessionPlayer } from '../competitive/session';
import type { PublicGameMode } from '../game/types';
import { modeConfig } from '../game/rulesConfig';

export default function HomeScreen({ player, selectedMode, onPlay, onProfile, onModes }: {
  player: SessionPlayer; selectedMode: PublicGameMode; onPlay: () => void; onProfile: () => void; onModes: () => void;
}) {
  const opening = useRef(false);
  const mode = modeConfig(selectedMode);
  const rank = rankView(player);
  const start = () => {
    if (opening.current) return;
    opening.current = true;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPlay();
  };
  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.root}>
    <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View><Text style={styles.wordmark}>TWENTY ONE</Text><Text style={styles.wordmarkSub}>DUEL</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Open player profile" onPress={onProfile} style={({ pressed }) => [styles.profile, pressed && styles.pressed]}><Text style={styles.smallAction}>PROFILE</Text><Text style={styles.arrow}>{'\u2197'}</Text></Pressable>
      </View>
      <PlayerCard player={player} />
      <View style={styles.playSection}>
        <Text style={styles.eyebrow}>CURRENT MODE</Text>
        <View style={styles.modeComposition}>
          <View style={styles.modeCopy}>
            <Text testID="home-current-mode" style={styles.modeName}>{mode.name}</Text>
            <Text style={styles.rule}>{`FIRST TO ${mode.targetScore}`}</Text>
            <Text style={styles.modeDetail}>{`${mode.deckModel === 'shared' ? 'Shared deck' : 'Matched cards'} \u00b7 ${mode.raiseFoldEnabled ? 'Raise / Call / Fold' : 'Hit / Stand'}`}</Text>
          </View>
          <View style={styles.modeArt}><ModeGeometry compact selected mirror={mode.deckModel === 'mirrored'} /></View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Play ${mode.name}`} onPress={start} style={({ pressed }) => [styles.playButton, pressed && styles.playPressed]}>
          {({ pressed }) => <><Text style={styles.playLabel}>PLAY</Text><MatchEntryMark pressed={pressed} mirror={mode.deckModel === 'mirrored'} /></>}
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Change mode" onPress={onModes} style={({ pressed }) => [styles.changeMode, pressed && styles.pressed]}><Text style={styles.smallAction}>CHANGE MODE</Text><Text accessible={false} style={styles.arrow}>{'\u2192'}</Text></Pressable>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="View competitive profile" onPress={onProfile} style={({ pressed }) => [styles.progressSection, pressed && styles.pressed]}>
        <View style={styles.progressRow}><View style={styles.rankIdentity}><RankMark division={rank.division} size={24} /><Text style={styles.smallAction}>{rank.division}</Text></View><Text style={styles.progressCopy}>{rank.next ? `${rank.rating} / ${rank.next.min}` : `${rank.rating} RATING`}</Text></View>
        <View accessible accessibilityRole="progressbar" accessibilityLabel={rank.next ? `Progress to ${rank.next.name}` : 'Highest local division reached'} accessibilityValue={{min:0,max:100,now:Math.round(rank.progress * 100)}} style={styles.track}><View style={[styles.fill,{width:`${rank.progress * 100}%`}]} /></View>
        <Text style={styles.progressCopy}>{rank.next ? `${rank.remaining} TO ${rank.next.name}` : 'TOP OF LOCAL LADDER'}</Text>
      </Pressable>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.table },
  content: { flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 20, gap: 22, justifyContent: 'space-between' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  wordmark: { color: palette.text, fontSize: 11, letterSpacing: 2.4, fontWeight: '600' },
  wordmarkSub: { color: palette.muted, fontSize: 9, letterSpacing: 4, marginTop: 5 },
  profile: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10 },
  smallAction: { color: palette.accent, fontSize: 9, letterSpacing: 1.5 },
  arrow: { color: palette.accent, fontSize: 18 },
  playSection: { gap: 12 },
  modeComposition: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  modeCopy: { flex: 1, gap: 8 },
  modeArt: { width: 76, justifyContent: 'center' },
  rankIdentity: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrow: { ...typography.eyebrow, color: palette.muted },
  modeName: { color: palette.text, fontSize: 24, fontWeight: '500', letterSpacing: 0.7 },
  rule: { color: palette.accent, fontSize: 9, letterSpacing: 1.8 },
  modeDetail: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  playButton: { backgroundColor: palette.surface2, borderTopWidth: 1, borderTopColor: palette.borderActive, borderBottomWidth: 2, borderBottomColor: palette.borderActive, marginTop: 8, minHeight: 66, paddingHorizontal: 22, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  playLabel: { color: palette.text, fontSize: 20, fontWeight: '600', letterSpacing: 2 },
  playPressed: { backgroundColor: palette.playerSurface, transform: [{ scale: 0.985 }] },
  changeMode: { minHeight: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressSection: { gap: 12, paddingVertical: 14, borderTopWidth: 1, borderTopColor: palette.line },
  progressRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  progressCopy: { color: palette.muted, fontSize: 9, letterSpacing: 1.2, fontVariant: ['tabular-nums'] },
  track: { height: 3, backgroundColor: palette.line },
  fill: { height: 3, backgroundColor: palette.reward },
  pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
});
