import { StyleSheet, View } from 'react-native';
import { palette } from './theme';

type Props = { mirror: boolean; compact?: boolean; selected?: boolean };

// Card-proportioned planes, split axis and converging strokes share one language.
// Selection resolves the independently addressable structures toward the axis.
export function ModeGeometry({ mirror, compact = false, selected = false }: Props) {
  const convergence = selected ? (compact ? 2 : 5) : 0;
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.root, compact && styles.compact, selected && styles.resolved]}>
    <View style={[styles.field, !mirror && styles.approach, { transform: [{ translateX: convergence }, { translateY: mirror ? 0 : -7 }] }]}>
      <View style={[styles.structure, !mirror && styles.attacking]}>
        <View style={styles.rearPlane} />
        <View style={[styles.plane, mirror && styles.mirrorPlane]} />
        <View style={[styles.face, mirror && styles.silverFace]} />
        <View style={[styles.spine, mirror && styles.silverSpine]} />
        <View style={[styles.signal, mirror && styles.mirrorSignal]} />
        <View style={[styles.echo, !mirror && styles.pressure]} />
      </View>
    </View>
    <View style={[styles.axis, mirror && styles.mirrorAxis]}>
      <View style={[styles.axisStroke, !mirror && styles.interrupted]} /><View style={styles.axisStroke} />
    </View>
    <View style={[styles.field, !mirror && styles.retreat, { transform: [{ scaleX: -1 }, { translateX: convergence }, { translateY: mirror ? 0 : 11 }] }]}>
      <View style={[styles.structure, !mirror && styles.defending]}>
        <View style={styles.rearPlane} />
        <View style={[styles.plane, mirror && styles.mirrorPlane]} />
        <View style={[styles.face, mirror && styles.silverFace]} />
        <View style={[styles.spine, mirror && styles.silverSpine]} />
        <View style={[styles.signal, mirror && styles.mirrorSignal]} />
        <View style={styles.echo} />
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  root: { width: '100%', height: 108, flexDirection: 'row', alignItems: 'center', gap: 22, opacity: 0.68 },
  compact: { height: 50, gap: 10 },
  resolved: { opacity: 1 },
  field: { flex: 1, height: '100%', justifyContent: 'center' },
  approach: { flex: 1.14 },
  retreat: { flex: 0.86 },
  structure: { height: '88%', width: '100%', position: 'relative' },
  attacking: { transform: [{ skewX: '-13deg' }] },
  defending: { height: '68%', transform: [{ skewX: '9deg' }] },
  rearPlane: { position: 'absolute', top: '10%', bottom: '-5%', left: '14%', width: '60%', borderWidth: 1, borderColor: palette.line },
  plane: { position: 'absolute', top: 0, bottom: '6%', left: '6%', width: '61%', backgroundColor: palette.surface1 },
  mirrorPlane: { backgroundColor: palette.systemSurface },
  face: { position: 'absolute', top: 0, bottom: '6%', left: '6%', width: '61%', borderWidth: 1, borderColor: palette.borderActive },
  silverFace: { borderColor: palette.system },
  spine: { position: 'absolute', left: '6%', top: 0, bottom: '6%', width: 2, backgroundColor: palette.borderActive },
  silverSpine: { backgroundColor: palette.system },
  signal: { position: 'absolute', left: '6%', right: '-9%', top: '39%', height: 1, backgroundColor: palette.player },
  mirrorSignal: { top: '50%', backgroundColor: palette.system },
  echo: { position: 'absolute', left: '48%', right: '-2%', top: '65%', height: 1, backgroundColor: palette.borderActive },
  pressure: { right: '2%', backgroundColor: palette.dangerBorder },
  axis: { width: 2, height: 28, gap: 5, transform: [{ rotate: '18deg' }] },
  mirrorAxis: { height: '100%', width: 1, transform: [{ rotate: '0deg' }] },
  axisStroke: { flex: 1, backgroundColor: palette.line },
  interrupted: { backgroundColor: palette.dangerBorder },
});
