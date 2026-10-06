import { CardBackArtwork } from './CosmeticArtwork';
import { useEquippedCosmetic } from '../presentation/CosmeticContext';
import type { CosmeticConfig } from '../data/cosmetics';
import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { motion } from '../presentation/motion';
import { StyleSheet, Text, View } from 'react-native';
import type { Card } from '../game/types';
import { palette } from './theme';

const suits = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };

type Props = { card: Card | null; width: number; backConfig?: CosmeticConfig };

// Front and back remain in the same physical slot throughout a reveal.
export function PlayingCard({ card, width, backConfig }: Props) {
  const equipped = useEquippedCosmetic('cardBackId');
  const config = backConfig ?? equipped.visual;
  const reduced = useReducedMotion();
  const progress = useSharedValue(card ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(card ? 1 : 0, { duration: reduced ? 0 : motion.flip });
  }, [card, progress, reduced]);
  const back = useAnimatedStyle(() => ({
    opacity: progress.value < 0.5 ? 1 : 0,
    transform: [{ perspective: 800 }, { rotateY: `${progress.value * 180}deg` }],
  }));
  const front = useAnimatedStyle(() => ({
    opacity: progress.value >= 0.5 ? 1 : 0,
    transform: [{ perspective: 800 }, { rotateY: `${(progress.value - 1) * 180}deg` }],
  }));
  return (
    <View accessible accessibilityLabel={card ? `${card.rank} of ${card.suit}` : 'Face-down card'} style={{ width, height: width * 1.43 }}>
      <View style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Animated.View style={[StyleSheet.absoluteFill, back]}><CardSurface card={null} width={width} backConfig={config} /></Animated.View>
        {card ? <Animated.View style={[StyleSheet.absoluteFill, front]}><CardSurface card={card} width={width} /></Animated.View> : null}
      </View>
    </View>
  );
}

function CardSurface({ card, width, backConfig }: Props) {
  const height = width * 1.43;
  const color = card?.suit === 'hearts' || card?.suit === 'diamonds' ? palette.red : palette.ink;
  const rankStyle = { color, fontSize: width * 0.235, lineHeight: width * 0.26 };
  const suitStyle = { color, fontSize: width * 0.19, lineHeight: width * 0.23 };

  return (
    <View
      accessible
      accessibilityLabel={card ? `${card.rank} of ${card.suit}` : 'Face-down card'}
      style={[styles.card, { width, height }, !card && styles.back]}
    >
      {card ? (
        <View style={styles.face} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <View style={styles.topCorner}>
            <Text allowFontScaling={false} style={[styles.rank, rankStyle]}>{card.rank}</Text>
            <Text allowFontScaling={false} style={[styles.suit, suitStyle]}>{suits[card.suit]}</Text>
          </View>
          <Text allowFontScaling={false} style={[styles.centerSuit, { color, fontSize: width * 0.46 }]}>{suits[card.suit]}</Text>
          <View style={styles.bottomCorner}>
            <Text allowFontScaling={false} style={[styles.rank, rankStyle]}>{card.rank}</Text>
            <Text allowFontScaling={false} style={[styles.suit, suitStyle]}>{suits[card.suit]}</Text>
          </View>
        </View>
      ) : (
        <CardBackArtwork config={backConfig!} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 9, backgroundColor: palette.ivory, borderWidth: 1, borderColor: '#D8D3C9', overflow: 'hidden' },
  face: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topCorner: { position: 'absolute', top: 7, left: 7, alignItems: 'center' },
  bottomCorner: { position: 'absolute', bottom: 7, right: 7, alignItems: 'center', transform: [{ rotate: '180deg' }] },
  rank: { fontWeight: '600', fontVariant: ['lining-nums'], textAlign: 'center' },
  suit: { textAlign: 'center' },
  centerSuit: { fontWeight: '400' },
  back: { backgroundColor: palette.back, borderColor: '#46505A', padding: 6 },
});
