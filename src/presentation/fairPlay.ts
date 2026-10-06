import { modeConfig } from '../game/rulesConfig';
import type { GameMode } from '../game/types';

export type FairPlayState = Readonly<{ seen: boolean; open: boolean; mode?: GameMode; seenModes?: readonly GameMode[] }>;
export type FairPlayAction = { type: 'enter'; mode: GameMode } | { type: 'reopen'; mode: GameMode } | { type: 'acknowledge' } | { type: 'cancel' };
export const initialFairPlay: FairPlayState = { seen: false, open: false };

// App-session only. Acknowledgment survives matches and navigation, not app restarts.
export function fairPlayReducer(state: FairPlayState, action: FairPlayAction): FairPlayState {
  switch (action.type) {
    case 'enter': {
      if (modeConfig(action.mode).category === 'casual') return { ...state, open: false };
      const seen = state.seenModes?.includes(action.mode) ?? state.seen;
      return { ...state, mode: action.mode, open: !seen };
    }
    case 'reopen': {
      if (modeConfig(action.mode).category === 'casual') return { ...state, open: false };
      return { ...state, mode: action.mode, open: true };
    }
    case 'acknowledge': return state.open ? { ...state, seen: true, open: false, seenModes: state.mode ? [...new Set([...(state.seenModes ?? []), state.mode])] : state.seenModes } : state;
    case 'cancel': return state.open ? { ...state, open: false } : state;
  }
}
