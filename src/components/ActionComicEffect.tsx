import { useEquippedCosmetic } from '../presentation/CosmeticContext';
import { ActionLettering } from './CosmeticArtwork';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { chooseKnockPosition, knockPlacement } from '../presentation/knockPlacement';
import { chooseHitWord } from '../presentation/comicWords';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { palette } from './theme';

type Props = { opponent: boolean; availableWidth: number; progress: SharedValue<number>; duration: number; reduced: boolean };

// A separate decorative clock outlasts the physical gesture without delaying it.
// Each new gesture resets the single instance; cleanup cancels its animation.
// The parent mirrors territory; counter-rotation keeps the lettering readable.
export function ActionComicEffect({ opponent, availableWidth, progress, duration, reduced }: Props) {
  const { visual } = useEquippedCosmetic('actionStyleId');
  const [position] = useState(() => chooseKnockPosition());
  const [word] = useState(() => chooseHitWord());
  const tap = word === 'TAP';
  const placement = knockPlacement(position, availableWidth, opponent);
  const animated = useAnimatedStyle(() => {
    const t = progress.value * duration;
    const appear = Math.max(0, Math.min(1, t / (tap ? 65 : 90)));
    const fade = Math.max(0, Math.min(1, (duration - t) / (duration - 500)));
    return {
      opacity: appear * fade * (tap ? 0.40 : 0.44),
      transform: [
        { rotate: `${(opponent ? 180 : 0) + (reduced ? 0 : placement.rotation)}deg` },
        { scale: (!reduced ? 0.9 + appear * 0.1 : 1) * (tap ? 1.04 : 1.12) },
      ],
    };
  });
  const impact = useAnimatedStyle(() => {
    const t = progress.value * duration;
    return { opacity: reduced ? 0 : Math.max(0, Math.min(1, (t - (tap ? 100 : 130)) / (tap ? 15 : 30))) * (tap ? 0.5 : 0.65) };
  });
  if (!visual.showWord) return null;
  return (
    <Animated.View testID={`comic-${word.toLowerCase()}`} pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.base, { left: placement.left, top: placement.top }, animated]}>
      <ActionLettering config={visual} word={word} />
      <Animated.View style={[StyleSheet.absoluteFill, impact]}><View style={[styles.impactOne, tap && styles.lightImpact, visual.tilt ? { height: visual.stroke, width: 7 } : undefined]} /><View style={[styles.impactTwo, tap && styles.lightImpact, visual.tilt ? { height: visual.stroke, width: 7 } : undefined]} /></Animated.View>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  base: { position: 'absolute', width: 44, height: 15 },
  lightImpact: { height: 0.5, width: 4 },
  impactOne: { position: 'absolute', left: -6, top: 1, width: 5, height: 0.7, backgroundColor: palette.text, transform: [{ rotate: '35deg' }] },
  impactTwo: { position: 'absolute', left: -3, top: -4, width: 4, height: 0.7, backgroundColor: palette.text, transform: [{ rotate: '70deg' }] },
});
