import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import type { Card } from '../game/types';
import { motion } from '../presentation/motion';
import { PlayingCard } from './PlayingCard';
import { useCardDraw } from './CardDrawLayer';
import { palette } from './theme';

type SlotProps = { lockDelay: number; card: Card | null; width: number; x: number; clearing: boolean; opponent: boolean; lockOffset: number; locked: boolean; drawKey: string };

export function CardSlot({ lockDelay, card, width, x, clearing, opponent, lockOffset, locked, drawKey }: SlotProps) {
  const { launch, finishDraw } = useCardDraw();
  const target = useRef<View>(null);
  const initial = useRef({ card, width, opponent, drawKey });
  const [settled, setSettled] = useState(false);
  const reduced = useReducedMotion();
  const position = useSharedValue(x);
  const departure = useSharedValue(0);
  const lock = useSharedValue(0);
  const tighten = useSharedValue(0);
  useLayoutEffect(() => {
    let live = true;
    const payload = initial.current;
    if (!target.current) return;
    const cancel = launch({
      target: target.current, card: payload.card, width: payload.width, opponent: payload.opponent,
      settled: () => {
        if (!live) return;
        setSettled(true);
        finishDraw(payload.drawKey);
      },
    });
    return () => { live = false; cancel(); };
  }, [launch, finishDraw]);
  useEffect(() => {
    position.value = withTiming(x, { duration: reduced ? 0 : motion.draw });
  }, [position, x, reduced]);
  useEffect(() => {
    departure.value = withTiming(clearing ? 1 : 0, { duration: reduced ? 0 : motion.clear });
  }, [clearing, departure, reduced]);
  useEffect(() => {
    lock.value = withDelay(reduced || !locked ? 0 : lockDelay, withTiming(locked ? 1 : 0, { duration: reduced ? 0 : motion.commit }));
    tighten.value = withDelay(reduced || !locked ? 0 : lockDelay, withTiming(lockOffset, { duration: reduced ? 0 : motion.commit }));
    return () => { cancelAnimation(lock); cancelAnimation(tighten); };
  }, [locked, lockOffset, lockDelay, lock, tighten, reduced]);
  useEffect(() => () => { cancelAnimation(position); cancelAnimation(departure); }, [position, departure]);
  const style = useAnimatedStyle(() => ({
    opacity: (settled ? 1 : 0) * (1 - departure.value),
    transform: [
      { translateY: reduced ? 0 : -departure.value * 12 + lock.value * (opponent ? -2 : 2) },
      { translateX: position.value + tighten.value },
    ],
  }));
  return (
    <Animated.View style={[styles.slot, style]}>
      <View ref={target} collapsable={false}><PlayingCard card={card} width={width} /></View>
    </Animated.View>
  );
}

export function CommitmentStroke({ locked, opponent, width }: { locked: boolean; opponent: boolean; width: number }) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(locked ? 1 : 0, { duration: reduced ? 0 : 80 });
    return () => cancelAnimation(progress);
  }, [progress, locked, reduced]);
  const style = useAnimatedStyle(() => ({ opacity: progress.value * 0.55, transform: [{ scaleX: progress.value }] }));
  return <Animated.View accessible={false} style={[styles.commitment, { width: Math.max(32, width - 16), marginLeft: -(width - 16) / 2, backgroundColor: opponent ? palette.opponent : palette.accent }, style]} />;
}

export function WinDot({ filled, opponent = false }: { filled: boolean; opponent?: boolean }) {
  const fill = useSharedValue(filled ? 1 : 0);
  useEffect(() => { fill.value = withTiming(filled ? 1 : 0, { duration: 280 }); return () => cancelAnimation(fill); }, [fill, filled]);
  const style = useAnimatedStyle(() => ({ opacity: fill.value }));
  return <Animated.View style={styles.dot}><Animated.View style={[StyleSheet.absoluteFill, styles.fill, { backgroundColor: opponent ? palette.opponent : palette.accent }, style]} /></Animated.View>;
}

const styles = StyleSheet.create({
  slot: { position: 'absolute', top: 0, left: 0 },
  commitment: { position: 'absolute', height: 1, left: '50%', bottom: -5 },
  dot: { width: 6, height: 6, borderRadius: 3, borderWidth: 1, borderColor: '#77818A', overflow: 'hidden' },
  fill: { backgroundColor: palette.accent },
});
