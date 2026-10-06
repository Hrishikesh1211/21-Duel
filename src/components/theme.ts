// Semantic colors: accents identify decisions and outcomes, never rarity.
export const colors = {
  background: '#101316', surface1: '#181D22', surface2: '#202830', surface3: '#2B3640',
  textPrimary: '#F0EEE8', textSecondary: '#BAC1C6', textMuted: '#969FA7',
  borderSubtle: '#343E47', borderActive: '#7893A8',
  player: '#B3C8D8', playerSurface: '#243440',
  danger: '#CF9398', dangerSurface: '#38252B', dangerBorder: '#805159',
  system: '#C0CCD5', systemSurface: '#1C252E',
  reward: '#C9BA98', rewardSurface: '#2C2923',
  victory: '#A6BCAF', victorySurface: '#222E29',
  defeat: '#CF9398', defeatSurface: '#38252B',
  ivory: '#F1EDE4', ink: '#25292D',
} as const;

// Compatibility names keep cosmetic and animation consumers on the same system.
export const palette = {
  ...colors, table: colors.background, text: colors.textPrimary,
  muted: colors.textMuted, line: colors.borderSubtle, accent: colors.player,
  opponent: colors.textSecondary, red: colors.danger, back: colors.surface2,
};

export const typography = {
  eyebrow: { fontSize: 10, fontWeight: '600', letterSpacing: 1.8 },
  section: { fontSize: 11, fontWeight: '600', letterSpacing: 1.7 },
  value: { fontWeight: '500', fontVariant: ['tabular-nums'] },
} as const;

export const surfaces = {
  section: { backgroundColor: colors.surface1, borderColor: colors.borderSubtle },
  interactive: { backgroundColor: colors.surface2, borderColor: colors.borderSubtle },
  active: { backgroundColor: colors.playerSurface, borderColor: colors.borderActive },
} as const;

export const stateTreatments = {
  active: { color: colors.player, backgroundColor: colors.playerSurface, borderColor: colors.borderActive },
  system: { color: colors.system, backgroundColor: colors.systemSurface, borderColor: colors.borderSubtle },
  danger: { color: colors.danger, backgroundColor: colors.dangerSurface, borderColor: colors.dangerBorder },
  reward: { color: colors.reward, backgroundColor: colors.rewardSurface, borderColor: colors.reward },
  victory: { color: colors.victory, backgroundColor: colors.victorySurface, borderColor: colors.victory },
  defeat: { color: colors.defeat, backgroundColor: colors.defeatSurface, borderColor: colors.dangerBorder },
} as const;
