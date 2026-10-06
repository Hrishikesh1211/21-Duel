import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import type { ClashStage } from '../presentation/TableController';
import { DuelMark } from './DuelMark';

export function DuelSlot({ clash }: { clash: ClashStage }) {
  const reduced = useReducedMotion();
  const response = useSharedValue(0);
  useEffect(() => {
    if (!reduced && clash === 'impact') {
      response.value = withSequence(withTiming(0.1, { duration: 40 }), withTiming(0, { duration: 60 }));

    }
    return () => cancelAnimation(response);
  }, [clash, response, reduced]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: 1 - response.value }, { scaleY: 1 + response.value * 0.4 }] }));
  return <View style={styles.slot} accessible accessibilityLabel="Duel confrontation mark"><Animated.View style={style}><DuelMark size={20} /></Animated.View></View>;
}

const styles = StyleSheet.create({ slot: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' } });
