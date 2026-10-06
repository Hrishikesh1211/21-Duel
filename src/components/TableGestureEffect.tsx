import { ActionComicEffect } from './ActionComicEffect';
import { ENABLE_COMIC_ACTION_EFFECTS } from '../presentation/comicConfig';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import type { TableGesture } from '../presentation/TableController';
import { motion } from '../presentation/motion';
import { palette } from './theme';

type Props = { gesture: TableGesture | null; opponent: boolean; width: number; availableWidth: number };

// Decorative, absolute overlay: it cannot intercept input or change table height.
export function TableGestureEffect({ gesture, opponent, width, availableWidth }: Props) {
  const progress = useSharedValue(1);
  const comicProgress = useSharedValue(1);
  const reduced = useReducedMotion();
  const id = gesture?.id;
  const hit = gesture?.action === 'hit';
  const duration = hit ? motion.gestureHit : motion.gestureStand;
  const comicDuration = hit ? 700 : 950;
  useEffect(() => {
    if (id === undefined || (hit && !ENABLE_COMIC_ACTION_EFFECTS)) return;
    comicProgress.value = 0;
    comicProgress.value = withTiming(1, { duration: comicDuration, easing: Easing.linear, reduceMotion: ReduceMotion.Never });
    return () => cancelAnimation(comicProgress);
  }, [id, hit, comicProgress, comicDuration]);
  useEffect(() => {
    if (id === undefined) return;
    progress.value = 0;
    // Reduced motion removes travel, not the indication's lifetime or game timing.
    progress.value = withTiming(1, { duration, easing: Easing.linear, reduceMotion: ReduceMotion.Never });
    return () => cancelAnimation(progress);
  }, [id, progress, duration]);
  const pressure = useAnimatedStyle(() => {
    const t = progress.value * duration;
    const p = Math.max(0, Math.min(1, (t - motion.gestureContact) / 400));
    return {
      opacity: t < motion.gestureContact ? 0 : (1 - p) * 0.34,
      transform: [{ scale: reduced ? 0.65 : 0.65 + p * 0.52 }],
    };
  });
  const contact = useAnimatedStyle(() => {
    const t = progress.value * duration;
    const fade = Math.max(0, 1 - Math.max(0, t - 70) / 110);
    return {
      opacity: t < motion.gestureContact ? 0 : fade * 0.38,
      transform: [{ scaleY: reduced ? 1 : 1 - Math.sin(Math.min(1, Math.max(0, t - motion.gestureContact) / 100) * Math.PI) * 0.4 }],
    };
  });
  const wake = useAnimatedStyle(() => {
    const t = comicProgress.value * comicDuration;
    const travel = Math.max(0, Math.min(1, t / (motion.gestureSweep - 20)));
    const appear = Math.max(0, Math.min(1, t / 45));
    const fade = Math.max(0, Math.min(1, (950 - t) / 300));
    return {
      opacity: appear * fade * 0.38,
      transform: [{ translateX: reduced ? 0 : (-width / 2 + travel * width) * 0.96 }, { scaleX: reduced ? 0.55 : 0.6 + travel * 0.4 }],
    };
  });
  if (!gesture) return null;
  return (
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={[styles.region, !hit && { width, marginLeft: -width / 2 }, hit ? (opponent ? styles.opponentTap : styles.playerTap) : (opponent ? styles.opponentSweep : styles.playerSweep), { transform: [{ rotate: opponent ? '180deg' : '0deg' }] }]}>
      {hit ? <>
        <Animated.View style={[styles.pressure, pressure]} />
        <Animated.View style={[styles.contact, contact]} />
      </> : <>
        <Animated.View style={[styles.wake, wake]}><View style={styles.stroke} /><View style={styles.trailingStroke} /></Animated.View>
      </>}
      {hit && ENABLE_COMIC_ACTION_EFFECTS ? <ActionComicEffect key={gesture.id} opponent={opponent} availableWidth={availableWidth} progress={comicProgress} duration={comicDuration} reduced={reduced} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  region: { position: 'absolute', width: 170, height: 32, left: '50%', marginLeft: -85 },
  playerTap: { bottom: -28, left: '72%' },
  opponentTap: { top: -28, left: '72%' },
  playerSweep: { top: -8 },
  opponentSweep: { bottom: -8 },
  pressure: { position: 'absolute', left: 67, top: 0, width: 36, height: 24, borderRadius: 18, borderWidth: 1, borderColor: palette.muted },
  contact: { position: 'absolute', left: 80, top: 10, width: 10, height: 4, borderRadius: 5, backgroundColor: palette.muted },
  wake: { position: 'absolute', left: '50%', marginLeft: -28, top: 11, width: 56, gap: 4 },
  stroke: { height: 1, width: 56, backgroundColor: palette.muted },
  trailingStroke: { height: 1, width: 37, opacity: 0.45, backgroundColor: palette.muted },
});
