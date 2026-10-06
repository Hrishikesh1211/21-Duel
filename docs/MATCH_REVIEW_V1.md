# Match Review / Round History v1

A factual, session-local review of completed games. There is no coaching, decision grading, simulator advice or backend storage.

## Event architecture

`MatchHistoryRecorder` in `src/review/history.ts` receives actual transitions from `TableController`: the dealt opening, accepted Raise/Pass/Call/Fold actions, and each resolved play frame. It records Hit cards for the player, Stand, automatic Stand at 21, bust, reveal, result, points and before/after scores. Play events retain their actual order, including automatically drained opponent turns. The screen presents each actor's sequence in order.

Only completed rounds can be read through `rounds()`. Normal rounds are finalized after the controller finishes revealing the opponent hand. Fold rounds are finalized after the Fold is scored. Rematch resets the recorder; next round preserves prior completed rounds. Recording does not draw cards, consume randomness, evaluate winners, select actions or change scoring.

`useGamePresentation` exposes a stable history getter. `GameTable` attaches the completed public history to its existing completion payload. The competitive reducer retains an immutable review alongside the existing recent-match record, keyed by the same `local-N` ID. Stale/duplicate completions remain ignored.

## Information boundary

- Opening records contain the player's known cards and only the opponent's visible upcard.
- Opponent Hit events contain no private card or total. Full opponent cards and totals enter the record only at the actual reveal.
- Fold overrides any reveal flag, strips play/reveal events, and stores null opponent final cards and total. The previously visible upcard remains available.
- Decks, mirrored opening-pair internals, future draw streams, cursors and RNG state are never stored.
- Cards, scores and event records are copies, not engine references. Completed rounds and retained reviews are deeply frozen.
- The review route consumes a separate read-only review context. It has no session dispatch or controller access; its sole action is Back.

## Navigation and retention

The new `/review/[id]` route uses Expo Router, as required by the project instructions. The existing shell remains the index screen. Session state is lifted into a provider above the route stack, so opening/closing review preserves the current result or Profile. Hardware Back defers to the stack while review is open. The existing shell controls and visuals remain in place.

Result actions are **REMATCH → REVIEW MATCH → HOME**, with Rematch primary. Review is offered when retained data exists. Profile rows with a retained ID open the same route; older mock rows keep their existing presentation and behavior. No mock reviews were added.

At most five completed reviews are retained in memory. Starting or abandoning another game preserves them. Reload/relaunch begins a new session; unavailable IDs show a simple unavailable state. There is no persistence or backend.

Match Review is strictly optional and opens only when the player taps Review Match or a retained Profile history entry. Completing a match never opens it automatically. Rematch and Home work immediately without viewing a review. There are no review popups, reminders, mistake counts or review requirements before continued play. Regression tests cover skipping review for both actions in all four modes, even when a review is retained.

All four public modes are supported: Ranked Duel, Ranked Mirror, Casual Duel and Casual Mirror. Friend challenges use the same pipeline, with opponent identity retained. Rating delta is recorded only when the session actually applies rating.

## Presentation

One vertically scrollable screen, compact card notation, restrained event text, thin separators, final scores, chronological rounds and small score transitions. Raise/Call/Fold receive more emphasis than Hit/Stand. No charts, large round cards, filters, animation timing or strategy evaluation.

## Validation

- TypeScript and ESLint pass.
- **224 tests pass**, including one- and two-point rounds, overshoot, both Fold directions, hidden-card concealment, ordered Hits, Stand, bust, double-bust tie, opening/drawn 21, Mirror stream exclusion, immutability, friends/all modes, last-five retention, Profile resolution, route access and fresh rematch state.
- Browser flow: completed Casual Duel → result → review → Back; retained Profile row → the same review. Inspected at 375×667 and 393×852 with no horizontal overflow or browser errors. This is web viewport verification, not an iOS simulator run.
- iOS Hermes export passes and produces a `.hbc` bundle in `.expo/review-ios-export`.
- The React best-practices review checked stable provider/getter references, derived presentation, module-level round components, accessibility and immutable data flow.

## Files changed

New:
- `src/review/history.ts`
- `src/review/format.ts`
- `src/screens/MatchReviewScreen.tsx`
- `src/presentation/SessionContext.tsx`
- `src/app/_layout.tsx`
- `src/app/index.tsx`
- `src/app/review/[id].tsx`
- `tests/review.test.cjs`
- `docs/MATCH_REVIEW_V1.md`

Updated:
- `src/presentation/TableController.ts`
- `src/presentation/useGamePresentation.ts`
- `src/screens/GameTable.tsx`
- `src/competitive/session.ts`
- `src/screens/PostMatchScreen.tsx`
- `src/screens/CasualResultScreen.tsx`
- `src/screens/ProfileScreen.tsx`
- `App.tsx`
- `index.ts`
- `app.json`
- `package.json` / `package-lock.json` (SDK-compatible Router dependencies)
- `tests/run.cjs`
- `tests/ui-contract.test.cjs`

Game engine rules, mode configuration, production bot and simulation policies were not edited for this feature. Router dependencies/configuration follow the [Expo manual installation documentation](https://docs.expo.dev/router/installation/), checked against SDK 57.
