import { StyleSheet, View } from 'react-native';
import { RankMark } from './RankMark';
import { palette } from './theme';

// Only Silver II is explored here. Other divisions retain their existing mark.
// Each shoulder and split stem remains an independent, motion-ready layer.
export function RankEmblem({ division, size = 38 }: { division: string; size?: number }) {
  if (division !== 'SILVER II') return <RankMark division={division} size={size} />;
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.root, { width: size, height: size }]}>
    <View style={[styles.form, { transform: [{ scale: size / 40 }] }]}>
      <View style={[styles.stem, styles.leftStem]} /><View style={[styles.stem, styles.rightStem]} />
      <View style={[styles.shoulder, styles.leftOuter]} /><View style={[styles.shoulder, styles.rightOuter]} />
      <View style={[styles.shoulder, styles.leftInner]} /><View style={[styles.shoulder, styles.rightInner]} />
      <View style={styles.crown} />
      <View style={styles.base} />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  root: { flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  form: { width: 40, height: 40, flexShrink: 0 },
  stem: { position: 'absolute', top: 6, width: 3, height: 29, backgroundColor: palette.system },
  leftStem: { left: 16, transform: [{ rotate: '-13deg' }] },
  rightStem: { right: 16, transform: [{ rotate: '13deg' }] },
  shoulder: { position: 'absolute', height: 2, backgroundColor: palette.borderActive },
  leftOuter: { left: 1, top: 11, width: 12, transform: [{ rotate: '24deg' }] },
  rightOuter: { right: 1, top: 11, width: 12, transform: [{ rotate: '-24deg' }] },
  leftInner: { left: 5, top: 19, width: 9, transform: [{ rotate: '24deg' }] },
  rightInner: { right: 5, top: 19, width: 9, transform: [{ rotate: '-24deg' }] },
  crown: { position: 'absolute', top: 3, left: 18, width: 4, height: 1, backgroundColor: palette.system },
  base: { position: 'absolute', bottom: 1, left: 19, width: 2, height: 3, backgroundColor: palette.reward },
});
