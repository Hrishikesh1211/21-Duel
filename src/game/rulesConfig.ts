import type { GameMode, PublicGameMode } from './types';

export type GameModeConfig = Readonly<{
  id: PublicGameMode;
  name: string;
  category: 'ranked' | 'casual';
  deckModel: 'shared' | 'mirrored';
  raiseFoldEnabled: boolean;
  targetScore: number;
  ratingEnabled: boolean;
  description: string;
  summary: string;
}>;
export const FEATURED_MODE: PublicGameMode = 'ranked_duel';
export const GAME_MODES: Readonly<Record<PublicGameMode, GameModeConfig>> = {
  ranked_duel: { id: 'ranked_duel', name: 'RANKED DUEL', category: 'ranked', deckModel: 'shared', raiseFoldEnabled: true, targetScore: 7, ratingEnabled: true, description: 'Shared deck. Raise, call, or fold.', summary: 'Shared deck \u00b7 Raise/Fold \u00b7 Race to 7' },
  ranked_mirror: { id: 'ranked_mirror', name: 'RANKED MIRROR', category: 'ranked', deckModel: 'mirrored', raiseFoldEnabled: true, targetScore: 7, ratingEnabled: true, description: 'Both players face matched card opportunities.', summary: 'Matched card opportunities \u00b7 Raise/Fold' },
  casual_duel: { id: 'casual_duel', name: 'CASUAL DUEL', category: 'casual', deckModel: 'shared', raiseFoldEnabled: false, targetScore: 3, ratingEnabled: false, description: 'Classic shared-deck 21.', summary: 'Shared deck \u00b7 Hit/Stand' },
  casual_mirror: { id: 'casual_mirror', name: 'CASUAL MIRROR', category: 'casual', deckModel: 'mirrored', raiseFoldEnabled: false, targetScore: 3, ratingEnabled: false, description: 'Matched draws and swapped openings, no rating pressure.', summary: 'Matched card opportunities \u00b7 Hit/Stand' },
};
export const MODE_LIST: readonly GameModeConfig[] = Object.values(GAME_MODES);

// Legacy test/internal variants remain available for comparisons. Only the four
// public modes are exposed in Home and Modes; engines still share the same rules.
export function modeConfig(mode: GameMode): GameModeConfig {
  switch (mode) {
    case 'casual': return GAME_MODES.casual_duel;
    case 'ranked_classic': return GAME_MODES.ranked_duel;
    case 'ranked':
    case 'ranked_fair': return { ...GAME_MODES.ranked_mirror, raiseFoldEnabled: false, targetScore: 3 };
    default: return GAME_MODES[mode];
  }
}
export function matchTarget(mode: GameMode): number { return modeConfig(mode).targetScore; }
