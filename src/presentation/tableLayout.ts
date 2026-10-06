// Sizes use the usable safe-area height, not a device model or screen coordinate.
export function tableLayout(usableHeight: number, fontScale = 1) {
  const compact = usableHeight < 700;
  const tall = usableHeight >= 800;
  const textReserve = Math.max(0, Math.min(fontScale, 1.3) - 1) * 100;
  return {
    compact,
    playerCardWidth: Math.max(58, (compact ? 70 : tall ? 108 : 94) - textReserve),
    opponentCardWidth: Math.max(48, (compact ? 54 : tall ? 82 : 72) - textReserve),
    areaGap: compact ? 4 : 6,
    sectionGap: compact ? 4 : 6,
  };
}
