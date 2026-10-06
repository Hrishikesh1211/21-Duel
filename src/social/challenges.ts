import type { GameMode, PublicGameMode } from '../game/types';
import { modeConfig } from '../game/rulesConfig';
import { getFriend } from '../data/friends';
export type Challenge = Readonly<{ opponentId: string; modeId: PublicGameMode; source: 'friend-outgoing' | 'friend-incoming' }>;
// Prototype policy lives outside screens and the game engine. Snapshot at match start.
export const friendChallengeAffectsRating = true;
export function challengeRatingEnabled(mode: GameMode, challenge?: Challenge, affectsRating = friendChallengeAffectsRating) {
  return modeConfig(mode).ratingEnabled && (!challenge || affectsRating);
}
export function createFriendChallenge(opponentId: string, modeId: PublicGameMode, source: Challenge['source'] = 'friend-outgoing'): Challenge | null {
  return getFriend(opponentId)?.online ? { opponentId, modeId, source } : null;
}
export const mockIncomingChallenge: Challenge = { opponentId: 'mason', modeId: 'ranked_duel', source: 'friend-incoming' };
