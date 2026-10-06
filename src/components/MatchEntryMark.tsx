import { StyleSheet, View } from 'react-native';
import { palette } from './theme';

// Play's opposing strokes meet on press. No extra clock or navigation ownership.
export function MatchEntryMark({ pressed, mirror = false }: { pressed: boolean; mirror?: boolean }) {
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.root}>
    <View style={[styles.side, { transform: [{ translateX: pressed ? 7 : 0 }] }]}>
      <View style={styles.line} /><View style={[styles.line, styles.inner]} />
    </View>
    <View style={[styles.axis, mirror && styles.mirrorAxis]} />
    <View style={[styles.side, styles.opposing, { transform: [{ translateX: pressed ? -7 : 0 }] }]}>
      <View style={styles.line} /><View style={[styles.line, styles.inner]} />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  root: { width: 70, height: 26, flexDirection: 'row', gap: 9, alignItems: 'center' },
  side: { flex: 1, gap: 6, alignItems: 'flex-end' },
  opposing: { alignItems: 'flex-start' },
  line: { height: 1, width: '100%', backgroundColor: palette.player },
  inner: { width: '68%', backgroundColor: palette.borderActive },
  axis: { width: 1, height: 8, backgroundColor: palette.player },
  mirrorAxis: { height: 22 },
});
