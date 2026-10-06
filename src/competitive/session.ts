import { FEATURED_MODE, modeConfig } from '../game/rulesConfig';
import type { GameMode, PublicGameMode } from '../game/types';
import type { Competitor } from '../data/competitor';
import { getCosmetic, type CosmeticSlot, type CosmeticIdentity } from '../data/cosmetics';

import { challengeRatingEnabled, type Challenge } from '../social/challenges';
import { freezeReview, type MatchReview, type RoundHistory } from '../review/history';

export const ratingDelta = { win: 14, loss: -11, draw: 0 } as const;
export const divisions = [
  { name: 'BRONZE III', min: 0 }, { name: 'BRONZE II', min: 1000 },
  { name: 'BRONZE I', min: 1150 }, { name: 'SILVER III', min: 1300 },
  { name: 'SILVER II', min: 1400 }, { name: 'SILVER I', min: 1520 },
  { name: 'GOLD III', min: 1640 },
] as const;
export type SessionPlayer = Competitor & CosmeticIdentity & { divisionStartRating: number; nextDivision: string; nextDivisionRating: number };
export type MatchResult = { outcome: keyof typeof ratingDelta; playerRounds: number; opponentRounds: number; roundHistory?: readonly RoundHistory[] };
export type RankedResult = MatchResult & {
  mode?: GameMode;
  matchId: number; oldRating: number; newRating: number; ratingDelta: number;
  oldDivision: string; promoted: boolean; player: SessionPlayer;
};
export function divisionFor(rating: number) {
  let index = 0;
  for (let i = 1; i < divisions.length; i++) if (rating >= divisions[i].min) index = i;
  const current = divisions[index], next = divisions[Math.min(index + 1, divisions.length - 1)];
  return { division: current.name, divisionStartRating: current.min, nextDivision: next.name, nextDivisionRating: next.min };
}
export function applyResult(player: SessionPlayer, matchId: number, match: MatchResult): RankedResult {
  const newRating = Math.max(0, player.rating + ratingDelta[match.outcome]);
  const division = divisionFor(newRating);
  const updated = { ...player, ...division, rating: newRating,
    wins: player.wins + (match.outcome === 'win' ? 1 : 0), losses: player.losses + (match.outcome === 'loss' ? 1 : 0) };
  return { ...match, matchId, oldRating: player.rating, newRating, ratingDelta: newRating - player.rating,
    oldDivision: player.division, promoted: division.divisionStartRating > player.divisionStartRating, player: updated };
}
export type CasualResult = MatchResult & { matchId: number; mode: GameMode };
export type RecentMatch = Readonly<{
  id: string; opponentName: string; modeId: PublicGameMode;
  outcome: MatchResult['outcome']; playerScore: number; opponentScore: number;
  ratingDelta?: number; timestamp: number; source: 'sample' | 'session';
}>;
export type CompetitiveSession = { player: SessionPlayer; activeMatchId: number | null; nextMatchId: number; result: RankedResult | null; activeMode?: GameMode | null; challenge?: Challenge; activeRatingEnabled?: boolean; casualResult?: CasualResult | null; recentMatches?: readonly RecentMatch[]; matchReviews?: readonly MatchReview[]; peakRating?: number; rankedMatchCount?: number };
export type SessionAction = { type: 'equip'; slot: CosmeticSlot; id: string } | { type: 'start'; mode?: GameMode; challenge?: Challenge } | { type: 'abandon' } | { type: 'finish'; matchId: number; match: MatchResult; opponentName?: string; timestamp?: number };
export function competitiveReducer(state: CompetitiveSession, action: SessionAction): CompetitiveSession {
  if (action.type === 'equip') {
    const item = getCosmetic(action.id, action.slot);
    const player = { ...state.player, [action.slot]: item.id };
    return { ...state, player, result: state.result ? { ...state.result, player } : null };
  }
  if (action.type === 'start') return { ...state, activeMatchId: state.nextMatchId, nextMatchId: state.nextMatchId + 1, activeMode: action.mode ?? FEATURED_MODE, challenge: action.challenge, activeRatingEnabled: challengeRatingEnabled(action.mode ?? FEATURED_MODE, action.challenge), result: null, casualResult: null };
  if (action.type === 'abandon') return { ...state, activeMatchId: null, activeMode: null, challenge: undefined, activeRatingEnabled: undefined, result: null, casualResult: null };
  if (action.matchId !== state.activeMatchId) return state;
  const mode = state.activeMode ?? FEATURED_MODE;
  const recent: RecentMatch = {
    id: `local-${action.matchId}`, opponentName: action.opponentName ?? 'OPPONENT',
    modeId: modeConfig(mode).id, outcome: action.match.outcome,
    playerScore: action.match.playerRounds, opponentScore: action.match.opponentRounds,
    timestamp: action.timestamp ?? 0, source: 'session',
  };
  const retainReview = (delta?: number): readonly MatchReview[] => {
    const rounds = action.match.roundHistory;
    const last = rounds?.[rounds.length - 1];
    if (!rounds?.length || !last || rounds.some(round => round.modeId !== modeConfig(mode).id)
      || last.scoreAfter.human !== action.match.playerRounds || last.scoreAfter.bot !== action.match.opponentRounds) return state.matchReviews ?? [];
    const review: MatchReview = freezeReview({ id: recent.id, matchId: action.matchId, modeId: recent.modeId,
      playerName: state.player.name, opponentName: recent.opponentName, opponentId: state.challenge?.opponentId,
      completedAt: recent.timestamp, finalScore: { human: action.match.playerRounds, bot: action.match.opponentRounds },
      outcome: action.match.outcome, ...(delta !== undefined ? { ratingDelta: delta } : {}), rounds: [...rounds] });
    return Object.freeze([review, ...(state.matchReviews ?? [])].slice(0, 5));
  };
  if (!(state.activeRatingEnabled ?? modeConfig(mode).ratingEnabled)) {
    return { ...state, activeMatchId: null, result: null, casualResult: { ...action.match, matchId: action.matchId, mode }, matchReviews: retainReview(), recentMatches: [recent, ...(state.recentMatches ?? [])].slice(0, 5) };
  }
  const result = { ...applyResult(state.player, action.matchId, action.match), mode };
  return { ...state, player: result.player, result, activeMatchId: null,
    matchReviews: retainReview(result.ratingDelta),
    peakRating: Math.max(state.peakRating ?? state.player.rating, state.player.rating, result.newRating),
    rankedMatchCount: (state.rankedMatchCount ?? state.player.wins + state.player.losses) + 1,
    recentMatches: [{ ...recent, ratingDelta: result.ratingDelta }, ...(state.recentMatches ?? [])].slice(0, 5) };
}
