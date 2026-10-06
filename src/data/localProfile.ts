import type { RecentMatch } from '../competitive/session';

// Seed examples only. Live completions replace these in the local session.
export const sampleRecentMatches: readonly RecentMatch[] = [
  { id: 'sample-5', opponentName: 'MASON', modeId: 'ranked_duel', outcome: 'win', playerScore: 7, opponentScore: 5, ratingDelta: 14, timestamp: Date.UTC(2026, 9, 5, 20), source: 'sample' },
  { id: 'sample-4', opponentName: 'JUNE', modeId: 'ranked_mirror', outcome: 'loss', playerScore: 6, opponentScore: 7, ratingDelta: -11, timestamp: Date.UTC(2026, 9, 5, 19), source: 'sample' },
  { id: 'sample-3', opponentName: 'NOVA', modeId: 'casual_duel', outcome: 'win', playerScore: 3, opponentScore: 1, timestamp: Date.UTC(2026, 9, 5, 18), source: 'sample' },
  { id: 'sample-2', opponentName: 'ELI', modeId: 'ranked_mirror', outcome: 'win', playerScore: 7, opponentScore: 4, ratingDelta: 14, timestamp: Date.UTC(2026, 9, 4, 20), source: 'sample' },
  { id: 'sample-1', opponentName: 'SAGE', modeId: 'casual_mirror', outcome: 'loss', playerScore: 1, opponentScore: 3, timestamp: Date.UTC(2026, 9, 4, 19), source: 'sample' },
];

export const localProfileSeed = { peakRating: 1511, rankedMatchCount: 41, recentMatches: sampleRecentMatches } as const;

// These are not engine telemetry. Keep sample play-style metrics separate from live W/L.
export const samplePlayStyleStats = [
  { label: '21s HIT', value: '12' },
  { label: 'BUST RATE', value: '18%' },
  { label: 'AVG STAND', value: '18.4' },
  { label: 'RAISES', value: '16' },
] as const;
