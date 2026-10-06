// Small variations within the outer, card-free strip next to the contact point.
// Side-of-card zones are deliberately excluded: long hands can fill the viewport.
export const KNOCK_POSITIONS = [
  { inset: 36, top: 9, rotation: -6 },
  { inset: 44, top: 13, rotation: -3 },
  { inset: 52, top: 9, rotation: 3 },
  { inset: 60, top: 13, rotation: 6 },
] as const;

export function chooseKnockPosition(random: () => number = Math.random) {
  return Math.min(KNOCK_POSITIONS.length - 1, Math.max(0, Math.floor(random() * KNOCK_POSITIONS.length)));
}

export function knockPlacement(index: number, availableWidth: number, opponent: boolean) {
  const zone = KNOCK_POSITIONS[index];
  // Reserve the central 112px for totals/identity, and 8px at the outer edge.
  // The full transformed word + strokes fit inside a conservative 64x28 box.
  const center = Math.max(availableWidth / 2 + 88, availableWidth - zone.inset);
  const boundedCenter = Math.min(availableWidth - 40, center);
  const left = boundedCenter - 22 - (availableWidth * 0.72 - 85);
  return { left: opponent ? 170 - 44 - left : left, top: zone.top, rotation: zone.rotation };
}

