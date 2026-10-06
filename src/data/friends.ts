import type { Competitor } from './competitor';
import type { CosmeticIdentity } from './cosmetics';
export type FriendProfile = Readonly<Competitor & Pick<CosmeticIdentity, 'playerCardId' | 'titleId'> & { id: string; online: boolean }>;
// Availability and identities are static local fixtures, never live presence.
export const mockFriends: readonly FriendProfile[] = [
  { id: 'mason', name: 'MASON', rating: 1511, division: 'SILVER II', online: true, playerCardId: 'duel-standard', titleId: 'untitled', wins: 31, losses: 22 },
  { id: 'june', name: 'JUNE', rating: 1438, division: 'SILVER II', online: false, playerCardId: 'night-signal', titleId: 'untitled', wins: 26, losses: 21 },
  { id: 'nova', name: 'NOVA', rating: 1562, division: 'SILVER I', online: true, playerCardId: 'mirror-frame', titleId: 'untitled', wins: 38, losses: 24 },
];
export function getFriend(id: string) { return mockFriends.find(friend => friend.id === id); }
