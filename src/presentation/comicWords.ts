export const HIT_WORDS = ['TAP', 'KNOCK'] as const;

export function chooseHitWord(random: () => number = Math.random) {
  return HIT_WORDS[Math.min(HIT_WORDS.length - 1, Math.max(0, Math.floor(random() * HIT_WORDS.length)))];
}
