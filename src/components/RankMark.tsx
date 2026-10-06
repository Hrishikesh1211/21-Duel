import { StyleSheet, View } from 'react-native';
import { palette } from './theme';

// A provisional rank signature, not a new rank system. Labels carry the meaning.
export function RankMark({ division, size = 32 }: { division: string; size?: number }) {
  const level = division.endsWith(' III') ? 1 : division.endsWith(' II') ? 2 : 3;
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.mark, { width: size, height: size }]}>
    {[0, 1, 2].map(layer => <View key={layer} style={[styles.layer, { top: size * (0.26 + layer * 0.19) }]}>
      <View style={[styles.stroke, { width: size * (0.22 + layer * 0.055), backgroundColor: layer < level ? palette.system : palette.line }]} />
      <View style={[styles.stroke, { width: size * (0.22 + layer * 0.055), backgroundColor: layer < level ? palette.system : palette.line }]} />
    </View>)}
    <View style={[styles.axis, { left: size * 0.43, height: size * 0.74 }]} />
    <View style={[styles.axis, { left: size * 0.56, height: size * 0.74 }]} />
  </View>;
}

const styles = StyleSheet.create({
  mark: { flexShrink: 0, justifyContent: 'center' },
  layer: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between' },
  stroke: { height: 1 },
  axis: { position: 'absolute', width: 1, backgroundColor: palette.system, transform: [{ rotate: '18deg' }] },
});
