import { divisionFor, divisions, type SessionPlayer } from './session';

// Derived on every render from the shared session; never cached as screen state.
export function rankView(player: SessionPlayer) {
  const current = divisionFor(player.rating);
  const index = divisions.findIndex(item => item.name === current.division);
  const next = divisions[index + 1] ?? null;
  const progress = next ? Math.max(0, Math.min(1, (player.rating - current.divisionStartRating) / (next.min - current.divisionStartRating))) : 1;
  const start = Math.max(0, Math.min(index - 2, divisions.length - 5));
  const ladder = divisions.slice(start, start + 5).map((division, offset) => ({
    ...division,
    max: divisions[start + offset + 1] ? divisions[start + offset + 1].min - 1 : null,
    current: division.name === current.division,
  })).reverse();
  return { rating: player.rating, division: current.division, next, progress,
    remaining: next ? Math.max(0, next.min - player.rating) : 0, ladder };
}
