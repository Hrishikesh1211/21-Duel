import { StyleSheet, View } from 'react-native';

// A narrow, bisected geometric diamond, drawn entirely with native borders.
export function DuelMark({ size = 22 }: { size?: number }) {
  return (
    <View accessible={false} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[styles.outline, { width: size * 0.62, height: size * 0.62 }]} />
      <View style={[styles.seam, { height: size * 0.34 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  outline: { borderWidth: 1, borderColor: '#8A9AA6', transform: [{ rotate: '45deg' }, { scaleX: 0.9 }] },
  seam: { position: 'absolute', width: 1, backgroundColor: '#667985' },
});
