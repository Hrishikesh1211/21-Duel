import type { SessionPlayer } from '../competitive/session';
import { divisionFor } from '../competitive/session';
import { defaultCosmetics } from './cosmetics';

export const localPlayer = {
  ...defaultCosmetics,
  name: 'ALVIN',
  rating: 1482,
  ...divisionFor(1482),
  wins: 24,
  losses: 17,
} satisfies SessionPlayer;
