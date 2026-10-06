import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { GameMode, PublicGameMode } from '../game/types';
import { MODE_LIST, modeConfig } from '../game/rulesConfig';
import { palette } from '../components/theme';
import { ModeGeometry } from '../components/ModeGeometry';
import { MatchEntryMark } from '../components/MatchEntryMark';

type Category = 'ranked' | 'casual';
const identities = ['duel', 'mirror'] as const;

export default function ModesScreen({ selected, onSelect, onPlay }: { selected: GameMode; onSelect: (mode: PublicGameMode) => void; onPlay: () => void }) {
  const selectedConfig = modeConfig(selected);
  const category = selectedConfig.category;
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
          {(['ranked', 'casual'] as const).map(option => <Pressable key={option} accessibilityRole="tab" accessibilityState={{ selected: category === option }} onPress={() => selectCategory(option)} style={({ pressed }) => [styles.category, category === option && styles.activeCategory, pressed && styles.backPressed]}>
            <Text style={[styles.categoryText, category === option && styles.activeCategoryText]}>{option.toUpperCase()}</Text>
          </Pressable>)}
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
            <View style={[styles.modeHeading, mirror && styles.mirrorHeading]}><Text style={[styles.name, selected === mode && styles.selectedName]}>{identity.toUpperCase()}</Text><Text style={styles.descriptor}>{mirror ? 'MATCHED DRAWS' : 'SHARED DECK'}</Text></View>
            <View style={[styles.copyBlock, mirror && styles.mirrorHeading]}>
              <Text style={[styles.copy, mirror && styles.mirrorCopy]}>{mirror && category === 'ranked' ? 'Same opportunity.\nDifferent decisions.' : copy}</Text>
              {category === 'ranked' && <Text style={styles.rule}>{`FIRST TO ${modeConfig(mode).targetScore}`}</Text>}
            </View>
            <View style={styles.stage}><ModeGeometry mirror={mirror} selected={selected === mode} /></View>
            <View style={styles.foot}>
              {selected === mode && <Text style={styles.currentMode}>CURRENT MODE</Text>}
              <Text accessible={false} style={styles.enter}>{'\u2192'}</Text>
            </View>
          </Pressable>;
        })}
      </View>
    </ScrollView>
    <View style={styles.playStrip}>
      <Text testID="modes-selected-label" accessibilityLiveRegion="polite" style={styles.playMode}>{selectedConfig.name}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Play ${selectedConfig.name}`} onPress={play} style={({ pressed }) => [styles.playButton, pressed && styles.playPressed]}>{({ pressed }) => <><Text style={styles.playLabel}>PLAY</Text><MatchEntryMark pressed={pressed} mirror={selectedConfig.deckModel === 'mirrored'} /></>}</Pressable>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.table },
  content: { flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24, gap: 24 },
  header: { gap: 20 },
  backPressed: { opacity: 0.6 },
  title: { color: palette.text, fontSize: 20, fontWeight: '600', letterSpacing: 2 },
  categories: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: palette.line },
  category: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  activeCategory: { borderBottomColor: palette.player },
  categoryText: { color: palette.muted, fontSize: 10, fontWeight: '500', letterSpacing: 2 },
  activeCategoryText: { color: palette.text, fontWeight: '600' },
  surfaces: { flexGrow: 1, gap: 24 },
  surface: { flexGrow: 1, minHeight: 282, paddingTop: 18, borderTopWidth: 1, borderTopColor: palette.line, gap: 10 },
  mirrorSurface: { borderTopColor: palette.line },
  selectedSurface: { borderTopColor: palette.borderActive },
  surfacePressed: { transform: [{ scale: 0.985 }], opacity: 0.75 },
  modeHeading: { gap: 6 },
  mirrorHeading: { alignItems: 'center' },
  mirrorCopy: { textAlign: 'center' },
  selectedName: { fontWeight: '500' },
  name: { color: palette.text, fontSize: 40, fontWeight: '300', letterSpacing: 2 },
  descriptor: { color: palette.system, fontSize: 10, fontWeight: '500', letterSpacing: 1.8, lineHeight: 16 },
  stage: { flexGrow: 1, justifyContent: 'center', minHeight: 110 },
  foot: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16 },
  currentMode: { color: palette.accent, fontWeight: '600', fontSize: 9, letterSpacing: 1.5 },
  playStrip: { width: '100%', maxWidth: 520, alignSelf: 'center', borderTopWidth: 1, borderTopColor: palette.line, paddingHorizontal: 24, paddingVertical: 14, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  playMode: { color: palette.muted, fontSize: 10, letterSpacing: 1 },
  playButton: { minHeight: 52, backgroundColor: palette.surface2, borderBottomWidth: 2, borderBottomColor: palette.borderActive, paddingHorizontal: 18, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 20 },
  playLabel: { color: palette.text, fontSize: 14, fontWeight: '600', letterSpacing: 1.5 },
  playPressed: { backgroundColor: palette.playerSurface, transform: [{ scale: 0.985 }] },
  copyBlock: { gap: 10 },
  copy: { color: palette.text, fontSize: 12, lineHeight: 19 },
  rule: { color: palette.muted, fontSize: 9, fontWeight: '500', letterSpacing: 1.8 },
  enter: { color: palette.accent, fontSize: 24 },
});

