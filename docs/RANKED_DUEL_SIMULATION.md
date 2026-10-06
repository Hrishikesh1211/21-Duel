# Ranked Duel headless balance simulation

Seed: **2216161**. **3,125,000 matches**: 3,000,000 Ranked Duel; 125,000 Ranked Mirror. Every pairing is half seat 1 (production human / opening first actor), half seat 2 (production bot). Main pairings: 100,000 matches when using the default command; exact per-pair counts appear below.

## Rules and reproduction

No game-balance, production bot, or presentation changes were made. The headless runner calls `createMatch`, `raiseActor`, `raiseDecision`, `playDecision`, and `newRound` from `src/game/engine.ts`. It uses the existing mode config, hand totals, deck shuffle and mirrored-round implementation. Shared deck, alternating first actor, Raise/Call/Fold, Race to 7, Fold gives the raiser 1, called raises award 2, ties award 0; overshooting 7 is retained. A fresh shared deck is shuffled each round. Mirror retains production paired swapped openings and independent cursors into a shared hit stream.

Reproduce: `npm run simulate:balance -- --matches 100000 --mirror-matches 25000 --seed 2216161`. Development: `--matches 1000 --mirror-matches 0 --output .expo/sim-development`. Results are deterministic; runtime timestamps are deliberately omitted from JSON.

## Method and limitations

- Full round robin of all eight strategies, plus SMART and SIMPLE_17 self-play. No strategy was retuned after seeing results. These are intentionally different simulation policies, not replacements for the production bot.
- Each seed runs both seat assignments. Strategy A/B random streams remain attached to strategy identity on reversal; the card stream is separate. Pairing improves comparisons but outcomes within a pair are dependent. Win-rate and seat-difference intervals use seed-pair cluster variance (normal 95% intervals), not naive independent-match errors.
- Seat 1 also draws first in simultaneous shared-deck hits. Seat effects combine opening first-actor assignment, fixed draw order and finite race effects; this experiment does not isolate Raise initiative alone.
- Strategies receive only copied own cards/total, one visible opponent upcard, public scores, round value, first-actor identity, whether the opponent raised, and target. They receive no hidden opponent card/total, deck, stream cursor, or RNG state. B commits before A's draw through the production engine, including automatic B continuation after A stands.
- Hands in folded rounds are excluded from hand statistics. A non-fold round ending because the other side busts can leave one hand unfinished; its terminal observed total/hits still count. This matches production immediate shared-deck bust resolution.
- A “weak-opening bluff” means a Raise on hard 12–16. Success is specifically an opponent Fold, not a counterfactual estimate of deception. Intent and optimal play cannot be inferred from this proxy.
- Natural round ties occur; matches have no natural draw result because the race ends at a winner. A 10,000-round / 100-decision safety limit throws rather than fabricating a draw. Comeback means the eventual winner trailed by at least 3 points after a completed round.
- Terminal hand totals include bust values above 21. SMART self-play variance includes policy coin flips as well as cards; deterministic SIMPLE_17 self-play isolates card variance under a fixed policy. Confidence intervals are not multiplicity-adjusted; seat flags are screening signals, especially in the smaller Mirror sample.
- Deterministic identical-strategy paired self-play has exactly 50% aggregate labeling wins by construction. Seat rates and score/margin distributions provide the substantive fairness and variance evidence. Small Mirror comparisons are secondary; these heuristic bots do not establish optimal-play balance or real-human skill ceilings.

## Frozen strategies

- **RANDOM**: 50/50 legal Hit/Stand (21 stands), Raise/Pass and Call/Fold.
- **SIMPLE_15**: Hit below 15; otherwise Stand. Never Raise; always Call.
- **SIMPLE_17**: Hit below 17; otherwise Stand. Never Raise; always Call.
- **NEVER_RAISE**: Production basic Hit below 17. Never Raise; Fold hard 12–14, Call other hands.
- **ALWAYS_RAISE**: Production basic Hit below 17. Always Raise when first; always Call.
- **CONSERVATIVE**: Hit hard totals below 16 and soft totals below 18. Raise on 19+. Fold hard 12–14; Call other hands.
- **AGGRESSIVE**: Hit hard totals below 18 and soft totals below 19. Raise with probability .70 on 17+, .40 on hard 12–16, .55 otherwise. Call .70 on hard 12–14, .90 otherwise.
- **SMART_BASELINE**: Untuned heuristic: Hit soft <19, hard <17, except Stand hard 16 versus visible 2–6 unless trailing by 3+. Raise 19+ always, 18 at .65, 17 at .35, otherwise .08 (.15 trailing by 3+, zero when ahead and one point from target). Call 15+, soft hands or <=11; hard 12–14 Call .65 against 7+ upcard, .80 otherwise. Always Call if folding would end the match.

## Required matchups and skill signal

| Strategy A | Strategy B | Matches | A wins | A win rate (95% CI) | A seat 1 | A seat 2 | Seat difference (pp) | Avg score A–B | Avg / median rounds |
|---|---|---:|---:|---|---:|---:|---:|---|---|
| SMART_BASELINE | RANDOM | 100,000 | 85981 | 85.98% (85.78%–86.19%) | 86.25% | 85.72% | 0.53 | 6.82–3.35 | 8.38 / 8 |
| SMART_BASELINE | SIMPLE_15 | 100,000 | 64392 | 64.39% (64.16%–64.62%) | 64.29% | 64.49% | -0.20 | 6.04–4.82 | 10.47 / 10 |
| SMART_BASELINE | SIMPLE_17 | 100,000 | 57787 | 57.79% (57.58%–57.99%) | 57.43% | 58.14% | -0.71 | 5.79–5.14 | 10.82 / 11 |
| SMART_BASELINE | NEVER_RAISE | 100,000 | 58169 | 58.17% (57.97%–58.37%) | 57.78% | 58.56% | -0.78 | 5.81–5.15 | 11.22 / 11 |
| SMART_BASELINE | ALWAYS_RAISE | 100,000 | 53631 | 53.63% (53.43%–53.84%) | 53.58% | 53.68% | -0.10 | 5.60–5.25 | 7.63 / 8 |
| SMART_BASELINE | CONSERVATIVE | 100,000 | 52213 | 52.21% (52.03%–52.39%) | 52.32% | 52.11% | 0.21 | 5.54–5.39 | 10.24 / 10 |
| SMART_BASELINE | AGGRESSIVE | 100,000 | 55153 | 55.15% (54.93%–55.38%) | 55.24% | 55.07% | 0.17 | 5.65–5.21 | 8.93 / 9 |
| ALWAYS_RAISE | NEVER_RAISE | 100,000 | 56762 | 56.76% (56.54%–56.98%) | 56.53% | 57.00% | -0.47 | 5.71–5.12 | 8.97 / 9 |
| AGGRESSIVE | CONSERVATIVE | 100,000 | 48396 | 48.40% (48.16%–48.64%) | 48.45% | 48.34% | 0.12 | 5.37–5.53 | 9.50 / 9 |
| SIMPLE_15 | SIMPLE_17 | 100,000 | 43589 | 43.59% (43.37%–43.81%) | 43.16% | 44.02% | -0.85 | 5.27–5.77 | 12.36 / 12 |

## All-strategy league

Equal-weight win rates against the seven other strategies (self-play excluded). This ranks this finite heuristic pool, not every possible strategy.

| Strategy | Wins / matches | Win rate |
|---|---:|---:|
| SMART_BASELINE | 427326 / 700000 | 61.05% |
| CONSERVATIVE | 410492 / 700000 | 58.64% |
| ALWAYS_RAISE | 403230 / 700000 | 57.60% |
| AGGRESSIVE | 373883 / 700000 | 53.41% |
| SIMPLE_17 | 370460 / 700000 | 52.92% |
| NEVER_RAISE | 357935 / 700000 | 51.13% |
| SIMPLE_15 | 338715 / 700000 | 48.39% |
| RANDOM | 117959 / 700000 | 16.85% |

## Raise/Fold and hand statistics

Aggregated per strategy against the seven other strategies. Raise denominator = first-action opportunities; Call/Fold denominator = faced Raises; hand statistics exclude folded rounds.

| Strategy | Raise % | Call % | Fold % | Weak-raise Fold success % | Fold points | Called-round points | Mean total | Bust % | Mean Hits | 21 % |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SMART_BASELINE | 33.00% | 92.92% | 7.08% | 15.76% | 180397 | 1908926 | 19.83 | 24.80% | 0.87 | 11.75% |
| CONSERVATIVE | 21.09% | 74.88% | 25.12% | N/A | 102015 | 1701696 | 19.25 | 18.76% | 0.75 | 10.98% |
| ALWAYS_RAISE | 100.00% | 100.00% | 0.00% | 16.91% | 478724 | 2502934 | 20.06 | 26.53% | 0.86 | 11.82% |
| AGGRESSIVE | 54.38% | 84.95% | 15.05% | 15.21% | 268763 | 1939074 | 20.93 | 35.83% | 1.03 | 13.14% |
| SIMPLE_17 | 0.00% | 100.00% | 0.00% | N/A | 0 | 983308 | 20.04 | 26.42% | 0.85 | 11.81% |
| NEVER_RAISE | 0.00% | 74.86% | 25.14% | N/A | 0 | 856302 | 20.00 | 25.40% | 0.84 | 11.91% |
| SIMPLE_15 | 0.00% | 100.00% | 0.00% | N/A | 0 | 953996 | 18.45 | 12.68% | 0.58 | 9.74% |
| RANDOM | 49.98% | 50.02% | 49.98% | 10.83% | 164010 | 1075094 | 18.16 | 26.37% | 0.60 | 9.57% |

Across all Duel pairings including self-play: 28.15% of rounds raised; 85.26% of Raises called, 14.74% folded. Called two-point rounds are 24.00% of rounds and contribute 38.46% of awarded points. Folds contribute 3.77% of awarded points. Mean match length: **9.80 rounds**.

## Pacing by required matchup

| A vs B | Raised rounds % | Called two-point rounds % | Mean 2-point rounds | Ends 7 exactly % | Ends 8+ % | Comeback from ≥3 behind % |
|---|---:|---:|---:|---:|---:|---:|
| SMART_BASELINE vs RANDOM | 41.41% | 31.50% | 2.64 | 75.82% | 24.18% | 9.51% |
| SMART_BASELINE vs SIMPLE_15 | 16.59% | 16.59% | 1.74 | 85.95% | 14.04% | 11.47% |
| SMART_BASELINE vs SIMPLE_17 | 16.64% | 16.64% | 1.80 | 86.26% | 13.74% | 12.07% |
| SMART_BASELINE vs NEVER_RAISE | 16.59% | 12.38% | 1.39 | 89.53% | 10.47% | 11.39% |
| SMART_BASELINE vs ALWAYS_RAISE | 67.00% | 63.57% | 4.85 | 60.65% | 39.35% | 16.57% |
| SMART_BASELINE vs CONSERVATIVE | 27.10% | 22.02% | 2.25 | 82.57% | 17.43% | 12.98% |
| SMART_BASELINE vs AGGRESSIVE | 43.85% | 39.46% | 3.53 | 72.63% | 27.37% | 14.80% |
| ALWAYS_RAISE vs NEVER_RAISE | 50.90% | 38.16% | 3.42 | 74.44% | 25.56% | 15.58% |
| AGGRESSIVE vs CONSERVATIVE | 37.82% | 29.38% | 2.79 | 78.49% | 21.51% | 13.90% |
| SIMPLE_15 vs SIMPLE_17 | 0.00% | 0.00% | 0.00 | 100.00% | 0.00% | 8.98% |

## Equal-skill card variance

| Mode / policy | Matches | A win % | A seat 1 / seat 2 | Mean score differential | SD differential | Mean / median rounds | Winner 7–0 or 7–1 % | Winner 7+ / loser ≤1 % | One-point margins % |
|---|---:|---:|---|---:|---:|---|---:|---:|---:|
| ranked_duel / SMART_BASELINE | 100000 | 50.11% | 50.23% / 49.99% | 0.01 | 3.99 | 9.62 / 10 | 10.82% | 13.91% | 14.16% |
| ranked_duel / SIMPLE_17 | 100000 | 50.00% | 49.55% / 50.45% | 0.00 | 3.33 | 12.88 / 13 | 7.27% | 7.27% | 22.83% |
| ranked_mirror / SMART_BASELINE | 25000 | 50.08% | 51.09% / 49.06% | -0.00 | 3.40 | 10.72 / 11 | 4.48% | 5.84% | 18.18% |
| ranked_mirror / SIMPLE_17 | 25000 | 50.00% | 50.11% / 49.89% | 0.00 | 2.88 | 14.56 / 14 | 2.47% | 2.47% | 28.34% |

Exact score-outcome distributions and round-count histograms are included for every series in `simulation-results.json`; average final scores and differential are likewise recorded.

## Seat bias

Positive difference means better performance in seat 1. Flag = absolute seat difference above 1 percentage point AND paired 95% interval excluding zero. The 1 pp threshold is an analysis convention, not a balance rule.

| A vs B | Seat 1 % | Seat 2 % | Difference (pp) | Paired 95% CI (pp) | Flag |
|---|---:|---:|---:|---|---|
| ranked_duel: RANDOM vs SIMPLE_15 | 12.33% | 12.09% | 0.23 | -0.19 to 0.66 | — |
| ranked_duel: RANDOM vs SIMPLE_17 | 19.57% | 19.70% | -0.13 | -0.65 to 0.39 | — |
| ranked_duel: RANDOM vs NEVER_RAISE | 22.34% | 22.31% | 0.04 | -0.51 to 0.58 | — |
| ranked_duel: RANDOM vs ALWAYS_RAISE | 11.79% | 11.04% | 0.75 | 0.35 to 1.16 | — |
| ranked_duel: RANDOM vs CONSERVATIVE | 14.54% | 14.29% | 0.26 | -0.20 to 0.71 | — |
| ranked_duel: RANDOM vs AGGRESSIVE | 24.31% | 23.57% | 0.75 | 0.19 to 1.30 | — |
| ranked_duel: RANDOM vs SMART_BASELINE | 14.28% | 13.75% | 0.53 | 0.08 to 0.98 | — |
| ranked_duel: SIMPLE_15 vs SIMPLE_17 | 43.16% | 44.02% | -0.85 | -1.60 to -0.11 | — |
| ranked_duel: SIMPLE_15 vs NEVER_RAISE | 43.16% | 44.02% | -0.85 | -1.60 to -0.11 | — |
| ranked_duel: SIMPLE_15 vs ALWAYS_RAISE | 44.63% | 44.80% | -0.18 | -0.90 to 0.54 | — |
| ranked_duel: SIMPLE_15 vs CONSERVATIVE | 34.87% | 35.02% | -0.15 | -0.87 to 0.57 | — |
| ranked_duel: SIMPLE_15 vs AGGRESSIVE | 48.25% | 48.71% | -0.46 | -1.17 to 0.24 | — |
| ranked_duel: SIMPLE_15 vs SMART_BASELINE | 35.51% | 35.71% | -0.20 | -0.90 to 0.50 | — |
| ranked_duel: SIMPLE_17 vs NEVER_RAISE | 49.55% | 50.45% | -0.90 | -1.78 to -0.03 | — |
| ranked_duel: SIMPLE_17 vs ALWAYS_RAISE | 49.56% | 50.11% | -0.55 | -1.34 to 0.24 | — |
| ranked_duel: SIMPLE_17 vs CONSERVATIVE | 43.22% | 43.45% | -0.23 | -0.99 to 0.54 | — |
| ranked_duel: SIMPLE_17 vs AGGRESSIVE | 48.09% | 48.52% | -0.43 | -1.19 to 0.32 | — |
| ranked_duel: SIMPLE_17 vs SMART_BASELINE | 41.86% | 42.57% | -0.71 | -1.47 to 0.05 | — |
| ranked_duel: NEVER_RAISE vs ALWAYS_RAISE | 43.00% | 43.47% | -0.47 | -1.22 to 0.28 | — |
| ranked_duel: NEVER_RAISE vs CONSERVATIVE | 44.13% | 44.64% | -0.50 | -1.27 to 0.27 | — |
| ranked_duel: NEVER_RAISE vs AGGRESSIVE | 44.33% | 44.47% | -0.14 | -0.88 to 0.60 | — |
| ranked_duel: NEVER_RAISE vs SMART_BASELINE | 41.44% | 42.22% | -0.78 | -1.54 to -0.02 | — |
| ranked_duel: ALWAYS_RAISE vs CONSERVATIVE | 52.06% | 51.57% | 0.50 | -0.25 to 1.24 | — |
| ranked_duel: ALWAYS_RAISE vs AGGRESSIVE | 54.36% | 54.12% | 0.24 | -0.52 to 1.00 | — |
| ranked_duel: ALWAYS_RAISE vs SMART_BASELINE | 46.32% | 46.42% | -0.10 | -0.87 to 0.67 | — |
| ranked_duel: CONSERVATIVE vs AGGRESSIVE | 51.66% | 51.55% | 0.12 | -0.62 to 0.85 | — |
| ranked_duel: CONSERVATIVE vs SMART_BASELINE | 47.89% | 47.68% | 0.21 | -0.58 to 1.01 | — |
| ranked_duel: AGGRESSIVE vs SMART_BASELINE | 44.93% | 44.76% | 0.17 | -0.58 to 0.92 | — |
| ranked_duel: SMART_BASELINE vs SMART_BASELINE | 50.23% | 49.99% | 0.24 | -0.59 to 1.07 | — |
| ranked_duel: SIMPLE_17 vs SIMPLE_17 | 49.55% | 50.45% | -0.90 | -1.78 to -0.03 | — |
| ranked_mirror: SMART_BASELINE vs RANDOM | 89.62% | 89.29% | 0.34 | -0.43 to 1.10 | — |
| ranked_mirror: SMART_BASELINE vs SIMPLE_15 | 70.94% | 70.50% | 0.44 | -0.81 to 1.69 | — |
| ranked_mirror: SMART_BASELINE vs SIMPLE_17 | 60.30% | 59.71% | 0.58 | -0.86 to 2.03 | — |
| ranked_mirror: SMART_BASELINE vs SMART_BASELINE | 51.09% | 49.06% | 2.02 | 0.40 to 3.65 | YES |
| ranked_mirror: SIMPLE_17 vs SIMPLE_17 | 50.11% | 49.89% | 0.22 | -1.53 to 1.98 | — |

## Secondary Ranked Mirror comparison

| SMART opponent | Duel SMART win % | Mirror SMART win % | Mirror 95% CI | Duel / Mirror avg rounds |
|---|---:|---:|---|---|
| RANDOM | 85.98% | 89.46% | 89.08%–89.83% | 8.38 / 8.80 |
| SIMPLE_15 | 64.39% | 70.72% | 70.22%–71.21% | 10.47 / 11.16 |
| SIMPLE_17 | 57.79% | 60.00% | 59.54%–60.47% | 10.82 / 11.98 |

## Measured findings

- Strongest in this pool: **SMART_BASELINE (61.05%)**; weakest: **RANDOM (16.85%)** against the other seven policies.
- SMART_BASELINE beats RANDOM at **85.98%** and SIMPLE_17 at **57.79%**. Differences among policies show decision sensitivity; the size of the strongest-vs-reasonable-baseline edge matters more than just beating random. SMART is a frozen heuristic, not a proof of optimality.
- ALWAYS_RAISE league win rate: **57.60%**; NEVER_RAISE: **51.13%**. The full opponent matrix below makes any broad dominance visible rather than inferring it from one opponent.
- Matched Hit/Stand and always-Call control: ALWAYS_RAISE vs SIMPLE_17 is **50.17%**. This comparison changes first-action Raise behavior only. NEVER_RAISE vs SIMPLE_17 is **50.00%**; neither raises, so its Fold policy is never exercised.
- 0 of 30 Duel series exceed the predefined meaningful seat-bias flag. First-actor fairness is therefore consistent with this threshold in this strategy pool; inspect self-play and flagged matchups before attributing the cause.
- Raising and Folding occur at the measured rates above. Always-Call policies cannot show their own folding benefit; varied responders and the matched-policy controls are needed to assess it. 24.00% called rounds producing 38.46% of points quantifies two-point-round concentration; no arbitrary dominance threshold was imposed.

- Skill separation: SMART vs SIMPLE_17 at 57.79% is a meaningful edge under the requested 55–60% guideline, while SMART vs CONSERVATIVE at 52.21% shows only weak separation among stronger heuristics. RANDOM's very poor performance demonstrates that decisions matter, but is an intentionally weak benchmark. There is no defensible single “percent skill / percent luck” estimate from these matchups.
- Folding-policy warning: against the SAME ALWAYS_RAISE opponent, basic-17 NEVER_RAISE wins 43.24% versus basic-17 always-Call SIMPLE_17 at 49.83%. The basic hard-12–14 Fold rule costs 6.59 percentage points here. This is evidence against that particular Fold heuristic, not a proof that optimal Folding is irrelevant.
- Trivial-policy warning: ALWAYS_RAISE has a >50% point estimate against 6 of seven opponents (5 with intervals entirely above 50%), but it loses to SMART and is indistinguishable from SIMPLE_17 in the matched control. It is competitive across much of this pool, not universally dominant. NEVER_RAISE is not broadly dominant.
- Maximum observed Duel seat gap is 0.90 pp. Zero threshold flags does not prove perfect fairness: some intervals still allow a true gap above 1 pp. There is no consistent meaningful opening-seat advantage established in this run.
- Secondary Mirror signal: SMART self-play blowouts (winner 7+, loser ≤1) fall from 13.91% to 5.84%; score-difference SD falls from 3.99 to 3.40. Mirror SMART-vs-SIMPLE_17 is 60.00%. However, Mirror SMART self-play has a 2.02 pp seat-1 gap (95% interval 0.40–3.65 pp); replicate at a larger sample and independent seeds before drawing a fairness conclusion.

## Validation

Focused simulator tests verify exact seed reproducibility, balanced/reversed assignments, defensive public-information projection, production scoring and overshoot, exclusion of folded hands, completion in both modes, counter reconciliation, and invalid-input rejection. Run npm run typecheck, npm run lint, and npm test; the simulator test is integrated into the existing application test runner.

## Full Duel outcome matrix

| A \ B | RANDOM | SIMPLE_15 | SIMPLE_17 | NEVER_RAISE | ALWAYS_RAISE | CONSERVATIVE | AGGRESSIVE | SMART_BASELINE |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| RANDOM | — | 12.21% | 19.64% | 22.33% | 11.41% | 14.41% | 23.94% | 14.02% |
| SIMPLE_15 | 87.79% | — | 43.59% | 43.59% | 44.71% | 34.95% | 48.48% | 35.61% |
| SIMPLE_17 | 80.36% | 56.41% | — | 50.00% | 49.83% | 43.34% | 48.30% | 42.21% |
| NEVER_RAISE | 77.67% | 56.41% | 50.00% | — | 43.24% | 44.39% | 44.40% | 41.83% |
| ALWAYS_RAISE | 88.59% | 55.29% | 50.17% | 56.76% | — | 51.82% | 54.24% | 46.37% |
| CONSERVATIVE | 85.58% | 65.05% | 56.66% | 55.61% | 48.18% | — | 51.60% | 47.79% |
| AGGRESSIVE | 76.06% | 51.52% | 51.70% | 55.60% | 45.76% | 48.40% | — | 44.85% |
| SMART_BASELINE | 85.98% | 64.39% | 57.79% | 58.17% | 53.63% | 52.21% | 55.15% | — |

## Recommendations — no balance changes applied

1. Treat the strongest measured policy as a new evaluation baseline, not an automatically adopted production bot. The league reveals whether SMART actually deserves its name.
2. If seat effects are meaningful, isolate opening initiative from fixed draw order in separate experiments before deciding any rule change. This run intentionally preserves both.
3. Run policy ablations and stronger non-cheating opponents (including belief-based / learned decision policies) before claiming optimal play or declaring Fold irrelevant. Compare matched-policy controls and variance distributions, not only aggregate win rates.
4. Validate with human playtests. These results measure policy separation and residual card variance; they do not identify a percentage of gameplay attributable to skill versus luck. Mirror comparisons are secondary and should be expanded if they suggest materially different variance.
5. Keep all Raise/Fold probabilities, scoring, targets, production bot behavior and card rules unchanged until a balance decision is made explicitly.
