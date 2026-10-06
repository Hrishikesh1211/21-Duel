import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { defaultCosmetics, getCosmetic } from '../data/cosmetics';
import { PlayingCard } from './PlayingCard';
import { palette } from './theme';

// Separate from the table's dealing source; uses the same physical card back.
export function MatchmakingDeck({ searching }: { searching: boolean }) {
  const reduced = useReducedMotion();
  const shift = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(shift);
    shift.value = searching && !reduced
      ? withRepeat(withSequence(withTiming(1, { duration: 180 }), withTiming(0, { duration: 220 }), withDelay(200, withTiming(0, { duration: 1 }))), -1)
      : withTiming(0, { duration: reduced ? 0 : 100 });
    return () => cancelAnimation(shift);
  }, [searching, reduced, shift]);
  const top = useAnimatedStyle(() => ({ transform: [{ translateX: shift.value * 3 }, { translateY: -shift.value }, { rotate: `${shift.value * 2}deg` }] }));
  const stack = useAnimatedStyle(() => ({ transform: [{ scaleY: 1 - shift.value * 0.015 }] }));
  return <View accessible accessibilityLabel="Shared deck being prepared" style={styles.deck}>
    <Animated.View style={[StyleSheet.absoluteFill, stack]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.layer, { top: 4, left: 2 }]} /><View style={[styles.layer, { top: 2, left: 1 }]} />
      <Animated.View style={top}><View style={styles.face}><PlayingCard card={null} width={82} backConfig={getCosmetic(defaultCosmetics.cardBackId).visual} /></View></Animated.View>
    </Animated.View>
  </View>;
}
const styles = StyleSheet.create({
  deck: { width: 42, height: 42 * 1.43 },
  layer: { position: 'absolute', width: 42, height: 42 * 1.43, borderWidth: 0.5, borderRadius: 5, borderColor: '#46505A', backgroundColor: palette.back },
  face: { width: 82, height: 82 * 1.43, left: -20, top: -20 * 1.43, transform: [{ scale: 42 / 82 }] },
});
