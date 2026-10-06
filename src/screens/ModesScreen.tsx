import { useEffect, useRef } from 'react';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { GameMode, PublicGameMode } from '../game/types';
import { MODE_LIST, modeConfig } from '../game/rulesConfig';
import { palette } from '../components/theme';
import { ModeGeometry } from '../components/ModeGeometry';
import { MatchEntryMark } from '../components/MatchEntryMark';
import { CornerCut, GeometrySettle } from '../components/CompetitiveFrame';

type Category = 'ranked' | 'casual';
const identities = ['duel', 'mirror'] as const;

export default function ModesScreen({ selected, onSelect, onPlay }: { selected: GameMode; onSelect: (mode: PublicGameMode) => void; onPlay: () => void }) {
  const selectedConfig = modeConfig(selected);
  const category = selectedConfig.category;
  const reducedMotion = useReducedMotion();
  const categoryPosition = useSharedValue(category === 'ranked' ? 0 : 50);
  useEffect(() => {
    categoryPosition.value = withTiming(category === 'ranked' ? 0 : 50, { duration: reducedMotion ? 0 : 140 });
    return () => cancelAnimation(categoryPosition);
  }, [category, categoryPosition, reducedMotion]);
  const categoryIndicator = useAnimatedStyle(() => ({ left: `${categoryPosition.value}%` }));
  const selectCategory = (category: Category) => {
    const mode = MODE_LIST.find(mode => mode.category === category && mode.deckModel === selectedConfig.deckModel);
    if (mode && mode.id !== selectedConfig.id) onSelect(mode.id);
  };
  const opening = useRef(false);
  const select = (mode: PublicGameMode) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSelect(mode);
  };
  const play = () => {
    if (opening.current) return;
    opening.current = true;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPlay();
  };
  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.root}>
    <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>MODES</Text>
        <View accessibilityRole="tablist" style={styles.categories}>
          {(['ranked', 'casual'] as const).map(option => <Pressable key={option} accessibilityRole="tab" accessibilityState={{ selected: category === option }} onPress={() => selectCategory(option)} style={({ pressed }) => [styles.category, pressed && styles.backPressed]}>
            <Text style={[styles.categoryText, category === option && styles.activeCategoryText]}>{option.toUpperCase()}</Text>
          </Pressable>)}
          <Animated.View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.categoryIndicator, categoryIndicator]} />
        </View>
      </View>
      <View style={styles.surfaces}>
        {identities.map(identity => {
          const mode: PublicGameMode = `${category}_${identity}`;
          const mirror = identity === 'mirror';
          const descriptor = mirror ? 'Matched openings and draws' : 'Shared deck';
          const copy = mirror
            ? category === 'ranked' ? 'Same opportunities.\nDifferent decisions.' : 'Same cards. No rating pressure.'
            : category === 'ranked' ? 'Raise. Call. Fold.' : 'Hit. Stand. Learn the game.';
          return <Pressable key={identity} accessibilityRole="button" accessibilityState={{ selected: selected === mode }} accessibilityLabel={`${category} ${identity}. ${descriptor}. ${copy.replace('\n', ' ')}${category === 'ranked' ? ` First to ${modeConfig(mode).targetScore}.` : ''}`} accessibilityHint="Select this mode for Play" onPress={() => select(mode)} style={({ pressed }) => [styles.surface, mirror && styles.mirrorSurface, selected === mode && styles.selectedSurface, pressed && styles.surfacePressed]}>
            {selected === mode && <GeometrySettle key={`frame-${mode}`} style={[styles.selectionLine, mirror && styles.mirrorSelectionLine]} />}
            {selected === mode && !mirror && <CornerCut size={16} />}
            <View style={[styles.modeHeading, mirror && styles.mirrorHeading]}><Text style={[styles.name, selected === mode && styles.selectedName]}>{identity.toUpperCase()}</Text><Text style={styles.descriptor}>{mirror ? 'MATCHED DRAWS' : 'SHARED DECK'}</Text></View>
            <View style={[styles.copyBlock, mirror && styles.mirrorHeading]}>
              <Text style={[styles.copy, mirror && styles.mirrorCopy]}>{mirror && category === 'ranked' ? 'Same opportunity.\nDifferent decisions.' : copy}</Text>
              <Text style={styles.rule}>{`FIRST TO ${modeConfig(mode).targetScore}`}</Text>
            </View>
            <View style={styles.stage}><ModeGeometry mirror={mirror} selected={selected === mode} /></View>
            <View style={[styles.foot, mirror && styles.mirrorFoot]}>
              {selected === mode && <View style={styles.queueStatus}><Text style={styles.currentMode}>CURRENT MODE</Text><Text style={styles.ready}>QUEUE READY</Text></View>}
              <Text accessible={false} style={styles.enter}>{'\u2192'}</Text>
            </View>
          </Pressable>;
        })}
      </View>
    </ScrollView>
    <View style={styles.playStrip}>
      <Text testID="modes-selected-label" accessibilityLiveRegion="polite" style={styles.playMode}>{selectedConfig.name}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Play ${selectedConfig.name}`} onPress={play} style={({ pressed }) => [styles.playButton, pressed && styles.playPressed]}>{({ pressed }) => <><View style={styles.actionCopy}><Text style={styles.playLabel}>PLAY</Text><Text style={styles.entryHint}>{selectedConfig.deckModel === 'shared' ? 'ENTER DUEL' : 'ENTER MIRROR'}</Text></View><MatchEntryMark pressed={pressed} mirror={selectedConfig.deckModel === 'mirrored'} /><CornerCut size={14} /></>}</Pressable>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.table },
  content: { flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 20, gap: 20 },
  header: { gap: 20 },
  backPressed: { opacity: 0.6 },
  title: { color: palette.text, fontSize: 26, fontWeight: '600', letterSpacing: 0.3 },
  categories: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: palette.line },
  category: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  categoryIndicator: { position: 'absolute', bottom: -1, width: '50%', height: 1, backgroundColor: palette.player, pointerEvents: 'none' },
  categoryText: { color: palette.muted, fontSize: 10, fontWeight: '500', letterSpacing: 2 },
  activeCategoryText: { color: palette.player, fontWeight: '700' },
  surfaces: { flexGrow: 1, gap: 14 },
  surface: { flexGrow: 1, overflow: 'hidden', minHeight: 282, paddingTop: 18, borderTopWidth: 1, borderTopColor: palette.line, gap: 10 },
  mirrorSurface: { borderTopColor: palette.line },
  selectedSurface: { borderTopColor: palette.player },
  selectionLine: { position: 'absolute', top: 0, left: 0, width: '58%', height: 2, backgroundColor: palette.player },
  mirrorSelectionLine: { left: '24%', width: '52%' },
  queueStatus: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  ready: { color: palette.player, fontSize: 9, fontWeight: '600', letterSpacing: 1 },
  mirrorFoot: { justifyContent: 'center' },
  actionCopy: { gap: 3 },
  entryHint: { color: palette.player, fontSize: 8, fontWeight: '600', letterSpacing: 0.6 },
  surfacePressed: { transform: [{ scale: 0.985 }], opacity: 0.75 },
  modeHeading: { gap: 6 },
  mirrorHeading: { alignItems: 'center' },
  mirrorCopy: { textAlign: 'center' },
  selectedName: { fontWeight: '700' },
  name: { color: palette.text, fontSize: 44, fontWeight: '300', letterSpacing: -0.5 },
  descriptor: { color: palette.system, fontSize: 10, fontWeight: '500', letterSpacing: 1.8, lineHeight: 16 },
  stage: { flexGrow: 1, justifyContent: 'center', minHeight: 108 },
  foot: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16 },
  currentMode: { color: palette.accent, fontWeight: '600', fontSize: 9, letterSpacing: 1.5 },
  playStrip: { width: '100%', maxWidth: 520, alignSelf: 'center', borderTopWidth: 1, borderTopColor: palette.line, paddingHorizontal: 24, paddingVertical: 14, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  playMode: { color: palette.muted, fontSize: 10, letterSpacing: 1 },
  playButton: { overflow: 'hidden', minHeight: 58, backgroundColor: palette.playerSurface, borderLeftWidth: 2, borderLeftColor: palette.player, borderBottomWidth: 1, borderBottomColor: palette.borderActive, paddingHorizontal: 18, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 20 },
  playLabel: { color: palette.text, fontSize: 14, fontWeight: '600', letterSpacing: 1.5 },
  playPressed: { backgroundColor: palette.playerSurface, transform: [{ scale: 0.985 }] },
  copyBlock: { gap: 10 },
  copy: { color: palette.text, fontSize: 12, lineHeight: 19 },
  rule: { color: palette.muted, fontSize: 9, fontWeight: '500', letterSpacing: 1.8 },
  enter: { color: palette.accent, fontSize: 24 },
});

