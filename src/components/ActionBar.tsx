import Animated, { FadeIn } from 'react-native-reanimated';
import { Pressable, StyleSheet, Text } from 'react-native';
import { palette } from './theme';

type Props = {
  phase: 'playing' | 'round-complete' | 'match-complete';
  disabled: boolean;
  onHit: () => void;
  onStand: () => void;
  onNextRound: () => void;
  onRematch: () => void;
};

export function Action({ label, onPress, primary = false, danger = false, secondary = false, strategic = false, disabled = false }: {
  label: string; onPress: () => void; primary?: boolean; danger?: boolean; secondary?: boolean; strategic?: boolean; disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, primary && styles.primary, danger && styles.danger, primary && danger && styles.dangerPrimary, secondary && styles.secondary, label === 'FOLD' && styles.fold, strategic && styles.strategic, strategic && secondary && styles.strategicSecondary, pressed && strategic && styles.compressed, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Text style={[styles.label, primary && styles.primaryLabel, danger && styles.dangerLabel, primary && danger && styles.dangerPrimaryLabel, secondary && styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

export function ActionBar({ phase, disabled, onHit, onStand, onNextRound, onRematch }: Props) {
  return (
    <Animated.View key={phase} entering={FadeIn.duration(220)} style={styles.bar}>
      {phase === 'playing' ? (
        <>
          <Action label="HIT" primary onPress={onHit} disabled={disabled} />
          <Action label="STAND" onPress={onStand} disabled={disabled} />
        </>
      ) : (
        <Action label={phase === 'match-complete' ? 'REMATCH' : 'NEXT ROUND'} primary disabled={disabled} onPress={phase === 'match-complete' ? onRematch : onNextRound} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', gap: 12, width: '100%' },
  button: { flex: 1, minHeight: 58, paddingVertical: 18, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: palette.borderSubtle, backgroundColor: palette.surface2 },
  fold: { backgroundColor: palette.surface1, borderBottomWidth: 2, borderBottomColor: palette.textMuted },
  strategic: { borderRadius: 8 },
  strategicSecondary: { borderColor: 'transparent' },
  compressed: { transform: [{ scale: 0.97 }] },
  secondary: { backgroundColor: 'transparent', borderColor: palette.line },
  secondaryLabel: { color: palette.opponent, fontWeight: '600' },
  dangerPrimary: { backgroundColor: palette.dangerSurface, borderColor: palette.dangerBorder },
  dangerPrimaryLabel: { color: palette.text },
  danger: { borderColor: palette.red },
  dangerLabel: { color: palette.red },
  primary: { backgroundColor: palette.playerSurface, borderColor: palette.borderActive },
  label: { fontSize: 13, fontWeight: '700', letterSpacing: 2, color: palette.text, textAlign: 'center' },
  primaryLabel: { color: palette.player },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.35 },
});
