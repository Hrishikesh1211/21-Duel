import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInRight, useReducedMotion } from 'react-native-reanimated';
import { palette } from './theme';

const settle = FadeInRight.duration(240).withInitialValues({ opacity: 0, transform: [{ translateX: 8 }] });

// Used only by the lobby experiment. One settle, with no idle animation.
export function GeometrySettle({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  return <Animated.View entering={reduced ? undefined : settle} style={style}>{children}</Animated.View>;
}

// An actual diagonal cut made with native geometry, avoiding masks/dependencies.
// Its host clips overflow; the cut exposes the existing app canvas.
export function CornerCut({ size = 28 }: { size?: number }) {
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.cut, { width: size, height: size, top: -size / 2, right: -size / 2 }]} />;
}

const styles = StyleSheet.create({
  cut: { position: 'absolute', backgroundColor: palette.table, borderBottomWidth: 1, borderBottomColor: palette.borderActive, transform: [{ rotate: '45deg' }], pointerEvents: 'none' },
});
