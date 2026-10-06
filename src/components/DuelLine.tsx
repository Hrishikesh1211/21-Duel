import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import type { ClashStage } from '../presentation/TableController';
import { motion } from '../presentation/motion';
import { palette } from './theme';

type Props = { opponent?: boolean; locked: boolean; clash: ClashStage; won: boolean; deciding?: boolean };

export function DuelLine({ opponent = false, locked, clash, won, deciding = false }: Props) {
  const reduced = useReducedMotion();
  const converge = useSharedValue(0);
  const intensity = useSharedValue(0.22);
  useEffect(() => {
    // Remains fixed from impact through the last reveal. No ambient movement.
    converge.value = withTiming(clash === 'idle' ? 0 : 1, { duration: reduced ? 0 : motion.clashApproach });
    return () => cancelAnimation(converge);
  }, [clash, converge, reduced]);
  useEffect(() => {
    intensity.value = withTiming(won ? 0.8 : locked ? 0.5 : deciding ? 0.34 : 0.22, { duration: 180 });
    return () => cancelAnimation(intensity);
  }, [locked, won, deciding, intensity]);
  const style = useAnimatedStyle(() => ({
    opacity: intensity.value,
    transform: [{ translateX: (opponent ? -1 : 1) * converge.value * 8 }],
  }));
  return <Animated.View accessible={false} style={[styles.line, { backgroundColor: opponent ? palette.opponent : palette.accent }, style]} />;
}

const styles = StyleSheet.create({ line: { height: 1, flex: 1 } });
