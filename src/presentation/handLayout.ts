// Keep two-card spacing; overlap larger hands without changing card size/height.
// Exceptionally long hands retain horizontal scrolling so corner ranks stay legible.
export function handLayout(count: number, cardWidth: number, availableWidth: number) {
  const slots = Math.max(2, count);
  const minimumStep = Math.max(30, cardWidth * 0.32 + 7);
  const step = Math.max(minimumStep, Math.min(cardWidth * 0.82, (availableWidth - cardWidth) / (slots - 1)));
  const width = cardWidth + step * (slots - 1);
  return { step, width, contentWidth: Math.max(availableWidth, width), start: Math.max(0, (availableWidth - width) / 2), height: cardWidth * 1.43 + 12 };
}
