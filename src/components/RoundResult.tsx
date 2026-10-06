import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { StyleSheet, Text } from 'react-native';
import type { PlayerId, RoundResult as Result } from '../game/types';
import { palette } from './theme';

type Props = { result: Result | null; winner: PlayerId | null; folded?: PlayerId | null; opponentName?: string };

// Only mounted between rounds; a dedicated boundary for future transitions.
export function RoundResult({ result, winner, folded, opponentName }: Props) {
  if (!result) return null;
  const label = folded ? (folded === 'human' ? 'FOLDED' : `${opponentName?.toUpperCase() ?? 'OPPONENT'} FOLDED`) : winner ? (winner === 'human' ? 'VICTORY' : 'DEFEAT')
    : result === 'draw' ? 'DRAW' : result === 'human' ? 'ROUND WON' : 'ROUND LOST';
  return (
    <Animated.View key={label} entering={winner ? ZoomIn.duration(300).withInitialValues({ transform: [{ scale: 0.98 }] }) : FadeInDown.duration(240).withInitialValues({ opacity: 0, transform: [{ translateY: 6 }] })} style={styles.result} accessibilityLiveRegion="polite">
      <Text maxFontSizeMultiplier={1.2} style={[styles.title, (winner === 'human' || (!winner && result === 'human')) && styles.win, (winner === 'bot' || (!winner && result === 'bot')) && styles.loss, !!folded && styles.fold]}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  result: { alignItems: 'center', gap: 6 },
  title: { color: palette.text, fontSize: 23, letterSpacing: 3, fontWeight: '500', textAlign: 'center' },
  win: { color: palette.victory },
  loss: { color: palette.defeat },
  fold: { color: palette.textSecondary },
});
