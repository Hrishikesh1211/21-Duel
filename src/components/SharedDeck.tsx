import type { ClashStage } from '../presentation/TableController';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useCardDraw } from './CardDrawLayer';
import { PlayingCard } from './PlayingCard';
import { palette } from './theme';

const CARD_WIDTH = 82;
const DECK_WIDTH = 42;
const DECK_HEIGHT = DECK_WIDTH * 1.43;

export function SharedDeck({ humanCount, botCount, clash }: { humanCount: number; botCount: number; clash: ClashStage }) {
  const { source } = useCardDraw();
  const previous = useRef(0);
  const reduced = useReducedMotion();
  const settle = useSharedValue(0);
  const impact = useSharedValue(0);
  useEffect(() => {
    const count = humanCount + botCount;
    if (count > previous.current && !reduced) {
      settle.value = withSequence(withTiming(1, { duration: 80 }), withTiming(0, { duration: 180 }));
    }
    previous.current = count;
    return () => cancelAnimation(settle);
  }, [humanCount, botCount, reduced, settle]);
  // Preserve the center anchor's existing Clash response, now on the deck.
  useEffect(() => {
    if (!reduced && clash === 'impact') {
      impact.value = withSequence(withTiming(0.1, { duration: 40 }), withTiming(0, { duration: 60 }));
    }
    return () => cancelAnimation(impact);
  }, [clash, reduced, impact]);
  const response = useAnimatedStyle(() => ({
    transform: [{ translateY: settle.value }, { scaleX: 1 - impact.value }, { scaleY: (1 - settle.value * 0.015) * (1 + impact.value * 0.4) }],
  }));
  return (
    <View ref={source} collapsable={false} style={styles.source} accessible accessibilityLabel="Shared 52-card deck">
      <Animated.View style={[StyleSheet.absoluteFill, response]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={[styles.layer, styles.bottom]} />
        <View style={[styles.layer, styles.middle]} />
        <View style={styles.top}>
          <PlayingCard card={null} width={CARD_WIDTH} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  source: { width: DECK_WIDTH, height: DECK_HEIGHT },
  layer: { position: 'absolute', width: DECK_WIDTH, height: DECK_HEIGHT, borderWidth: 0.5, borderRadius: 5, borderColor: '#46505A', backgroundColor: palette.back },
  bottom: { top: 4, left: 2 },
  middle: { top: 2, left: 1 },
  // Scale the actual back component, including its border and mark proportions.
  top: { position: 'absolute', width: CARD_WIDTH, height: CARD_WIDTH * 1.43, left: (DECK_WIDTH - CARD_WIDTH) / 2, top: (DECK_HEIGHT - CARD_WIDTH * 1.43) / 2, transform: [{ scale: DECK_WIDTH / CARD_WIDTH }] },
});
