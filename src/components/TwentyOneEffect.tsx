import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import Animated, { cancelAnimation, FadeIn, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import { CosmeticMark } from './CosmeticArtwork';
import { useEquippedCosmetic } from '../presentation/CosmeticContext';

type Props = { total: number | null; opponent?: boolean; textStyle: StyleProp<TextStyle> };

// Two digits, one shared mark, then precision returns to a single quiet total.
// No stroke, ring, pulse, or hand movement is shared with Commit or Clash.
export function TwentyOneEffect({ total, opponent = false, textStyle }: Props) {
  const { visual } = useEquippedCosmetic('twentyOneEffectId');
  const reduced = useReducedMotion();
  const separation = useSharedValue(0);
  useEffect(() => {
    separation.value = 0;
    if (total === 21 && !reduced) {
      separation.value = withSequence(withTiming(1, { duration: visual.open }), withDelay(visual.hold!, withTiming(0, { duration: visual.close })));
    }
    return () => cancelAnimation(separation);
  }, [total, reduced, separation, visual]);
  const left = useAnimatedStyle(() => ({ transform: [{ translateX: -separation.value * (opponent ? visual.separation! * 7 / 11 : visual.separation!) }] }));
  const right = useAnimatedStyle(() => ({ transform: [{ translateX: separation.value * (opponent ? visual.separation! * 7 / 11 : visual.separation!) }] }));
  const mark = useAnimatedStyle(() => ({ opacity: separation.value, transform: [{ scale: 0.75 + separation.value * 0.25 }] }));
  const label = total === null ? undefined : `${opponent ? 'Opponent' : 'Your'} total ${total}`;
  return (
    <View accessible={total !== null} accessibilityLabel={label} style={styles.container}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {total === 21 ? (
          <View style={styles.digits}>
            <Animated.Text maxFontSizeMultiplier={1.3} style={[textStyle, left]}>2</Animated.Text>
            <Animated.Text maxFontSizeMultiplier={1.3} style={[textStyle, right]}>1</Animated.Text>
            <View pointerEvents="none" style={styles.mark}><Animated.View style={mark}><CosmeticMark config={visual} size={opponent ? 9 : 14} /></Animated.View></View>
          </View>
        ) : <Animated.Text key={total ?? 'empty'} entering={FadeIn.duration(180)} maxFontSizeMultiplier={1.3} style={textStyle}>{total ?? ' '}</Animated.Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  digits: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  mark: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
});
