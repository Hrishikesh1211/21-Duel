import { StyleSheet, View } from 'react-native';
import { palette } from './theme';

type Props = { mirror: boolean; compact?: boolean; selected?: boolean };

// Opposing card-proportioned structures. The same composition has a lobby scale
// and a full mode scale, with separate parts available for future resolve motion.
export function ModeGeometry({ mirror, compact = false, selected = false }: Props) {
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.root, compact && styles.compact, selected && styles.resolved]}>
    <View style={[styles.field, mirror ? styles.balanced : styles.approach]}>
      <View style={[styles.plane, mirror && styles.mirrorPlane]} />
      <View style={[styles.structure, mirror ? styles.mirrorStructure : styles.duelStructure]}>
        <View style={[styles.rail, mirror && styles.silver]} />
        <View style={[styles.rung, styles.top, mirror && styles.silver]} />
        <View style={[styles.rung, styles.middle]} />
        <View style={[styles.rung, styles.lower, !mirror && styles.pressure]} />
        <View style={[styles.rung, styles.base]} />
      </View>
      <View style={[styles.signal, mirror && styles.mirrorSignal]} />
    </View>
    <View style={[styles.axis, mirror && styles.mirrorAxis]} />
    <View style={[styles.field, styles.opposing, mirror ? styles.balanced : styles.retreat]}>
      <View style={[styles.plane, mirror && styles.mirrorPlane]} />
      <View style={[styles.structure, mirror ? styles.mirrorStructure : styles.defendingStructure]}>
        <View style={[styles.rail, mirror && styles.silver]} />
        <View style={[styles.rung, styles.top, mirror && styles.silver]} />
        <View style={[styles.rung, styles.middle]} />
        <View style={[styles.rung, styles.lower]} />
        <View style={[styles.rung, styles.base]} />
      </View>
      <View style={[styles.signal, mirror && styles.mirrorSignal]} />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  root: { width: '100%', height: 110, flexDirection: 'row', alignItems: 'center', gap: 24, opacity: 0.72 },
  compact: { height: 48, gap: 14 },
  resolved: { opacity: 1 },
  field: { flex: 1, height: '100%', justifyContent: 'center' },
  balanced: { flex: 1 },
  approach: { flex: 1.12, transform: [{ translateY: -8 }] },
  retreat: { flex: 0.88, transform: [{ scaleX: -1 }, { translateY: 12 }] },
  opposing: { transform: [{ scaleX: -1 }] },
  plane: { position: 'absolute', left: '6%', right: '16%', top: '12%', bottom: '12%', backgroundColor: palette.surface1 },
  mirrorPlane: { left: '12%', right: '12%', backgroundColor: palette.systemSurface },
  structure: { height: '76%', width: '100%', position: 'relative' },
  duelStructure: { transform: [{ skewX: '-12deg' }] },
  defendingStructure: { height: '64%', transform: [{ skewX: '8deg' }] },
  mirrorStructure: { height: '80%' },
  rail: { position: 'absolute', left: '6%', top: 0, bottom: 0, width: 1, backgroundColor: palette.borderActive },
  rung: { position: 'absolute', left: '6%', height: 1, backgroundColor: palette.borderActive },
  top: { top: 0, width: '80%', backgroundColor: palette.player },
  middle: { top: '32%', width: '94%' },
  lower: { top: '66%', width: '70%' },
  base: { bottom: 0, width: '80%' },
  pressure: { backgroundColor: palette.dangerBorder },
  silver: { backgroundColor: palette.system },
  signal: { position: 'absolute', right: 0, top: '45%', width: '20%', height: 1, backgroundColor: palette.player },
  mirrorSignal: { top: '50%', backgroundColor: palette.system },
  axis: { width: 1, height: 16, backgroundColor: palette.dangerBorder, transform: [{ rotate: '18deg' }] },
  mirrorAxis: { height: '100%', backgroundColor: palette.line, transform: [{ rotate: '0deg' }] },
});
