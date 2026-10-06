# Ranked Duel Call/Fold ablation

Seed: **20261006**. **4,000,000 actual main matches**, 100,000 per policy/opponent combination, with 50% in each seat. The equal-weight pool reuses these matches (400,000 per policy); it is not an additional simulation.

## Controls and exact policies

All ten agents use the exact same SMART_BASELINE Hit/Stand and Raise/Pass function references. Only their response function varies. Subsequent public scores and cards can differ after responses, so identical functions need not produce identical subsequent actions. Opponents retain their original strategies. Policies were frozen before measurement. No production rules, bots or UI changed.

Shared baseline: Untuned heuristic: Hit soft <19, hard <17, except Stand hard 16 versus visible 2–6 unless trailing by 3+. Raise 19+ always, 18 at .65, 17 at .35, otherwise .08 (.15 trailing by 3+, zero when ahead and one point from target). Call 15+, soft hands or <=11; hard 12–14 Call .65 against 7+ upcard, .80 otherwise. Always Call if folding would end the match. Only its Hit/Stand and Raise/Pass parts are shared; response definitions below replace its response.

| Policy | Exact response rule |
| --- | --- |
| ALWAYS_CALL | Always Call. |
| ALWAYS_FOLD | Always Fold, including when that immediately loses the match. |
| FOLD_12_14 | Fold hard 12–14; Call all other hands. |
| FOLD_12_13 | Fold hard 12–13; Call all other hands. |
| FOLD_12 | Fold hard 12 only; Call all other hands. |
| FOLD_WEAK_VS_STRONG_UPCARD | Fold hard 12–16 only versus a visible 10-value card or Ace; otherwise Call. |
| FOLD_WEAK_VS_WEAK_UPCARD | Fold hard 12–16 only versus visible 2–6; otherwise Call. |
| SCORE_AWARE | Call if opponent is one point from target, self is one point from target, or trailing by 2+. Otherwise Fold hard 12–16 when leading by 2+, or hard 12 at other scores; Call everything else. |
| ROUND_VALUE_AWARE | Call if Fold immediately loses or a called win can finish the match. Otherwise Fold hard 12–16 if losing the current two-point round ends the match while Folding keeps it alive; Call all other states. |
| SMART_FOLD | Never Fold if that immediately loses. Fold hard 14–16 versus a visible 10/A only when leading by 2+, or when opponent is two points from target and self is not behind. Call all other states (including soft hands and hard 12–13). |

Production engine handles every deal, draw, response and score update: Fold concedes one point, a called raised round awards two to its winner, ties award zero, target seven with overshoot allowed. Policies receive only their own cards/total, one visible opponent upcard, public scores, round value, actor flags and target. Checkpoints, hidden cards, future deck and RNG snapshots are restricted to the analysis runner.

## Equal-weight opponent pool

| Policy | Win rate | 95% CI | Delta vs ALWAYS_CALL | Paired 95% CI |
| --- | --- | --- | --- | --- |
| ALWAYS_CALL | 52.87% | 52.76% to 52.97% | 0.00 pp | 0.00 pp to 0.00 pp |
| ALWAYS_FOLD | 31.58% | 31.44% to 31.71% | -21.29 pp | -21.46 pp to -21.12 pp |
| FOLD_12_14 | 51.30% | 51.18% to 51.41% | -1.57 pp | -1.67 pp to -1.46 pp |
| FOLD_12_13 | 51.64% | 51.53% to 51.76% | -1.22 pp | -1.31 pp to -1.13 pp |
| FOLD_12 | 52.16% | 52.05% to 52.27% | -0.70 pp | -0.77 pp to -0.64 pp |
| FOLD_WEAK_VS_STRONG_UPCARD | 53.34% | 53.22% to 53.45% | 0.47 pp | 0.37 pp to 0.57 pp |
| FOLD_WEAK_VS_WEAK_UPCARD | 51.46% | 51.35% to 51.57% | -1.40 pp | -1.47 pp to -1.34 pp |
| SCORE_AWARE | 52.52% | 52.41% to 52.63% | -0.35 pp | -0.42 pp to -0.28 pp |
| ROUND_VALUE_AWARE | 52.82% | 52.71% to 52.93% | -0.04 pp | -0.08 pp to -0.01 pp |
| SMART_FOLD | 53.21% | 53.10% to 53.32% | 0.34 pp | 0.30 pp to 0.38 pp |

## Every matchup

| Policy | Opponent | Win rate | 95% CI | Delta | Paired delta CI |
| --- | --- | --- | --- | --- | --- |
| ALWAYS_CALL | ALWAYS_RAISE | 54.57% | 54.37% to 54.77% | 0.00 pp | 0.00 pp to 0.00 pp |
| ALWAYS_CALL | AGGRESSIVE | 55.47% | 55.25% to 55.69% | 0.00 pp | 0.00 pp to 0.00 pp |
| ALWAYS_CALL | SMART_BASELINE | 49.75% | 49.61% to 49.89% | 0.00 pp | 0.00 pp to 0.00 pp |
| ALWAYS_CALL | CONSERVATIVE | 51.67% | 51.49% to 51.86% | 0.00 pp | 0.00 pp to 0.00 pp |
| ALWAYS_FOLD | ALWAYS_RAISE | 5.54% | 5.40% to 5.68% | -49.03 pp | -49.28 pp to -48.77 pp |
| ALWAYS_FOLD | AGGRESSIVE | 26.08% | 25.83% to 26.32% | -29.39 pp | -29.72 pp to -29.07 pp |
| ALWAYS_FOLD | SMART_BASELINE | 41.73% | 41.50% to 41.96% | -8.02 pp | -8.29 pp to -7.76 pp |
| ALWAYS_FOLD | CONSERVATIVE | 52.95% | 52.74% to 53.17% | 1.28 pp | 1.06 pp to 1.50 pp |
| FOLD_12_14 | ALWAYS_RAISE | 49.75% | 49.54% to 49.97% | -4.82 pp | -5.03 pp to -4.60 pp |
| FOLD_12_14 | AGGRESSIVE | 52.66% | 52.44% to 52.89% | -2.80 pp | -2.99 pp to -2.62 pp |
| FOLD_12_14 | SMART_BASELINE | 49.88% | 49.72% to 50.04% | 0.13 pp | -0.02 pp to 0.28 pp |
| FOLD_12_14 | CONSERVATIVE | 52.90% | 52.72% to 53.07% | 1.22 pp | 1.11 pp to 1.34 pp |
| FOLD_12_13 | ALWAYS_RAISE | 51.03% | 50.82% to 51.25% | -3.54 pp | -3.73 pp to -3.35 pp |
| FOLD_12_13 | AGGRESSIVE | 53.39% | 53.16% to 53.61% | -2.08 pp | -2.24 pp to -1.92 pp |
| FOLD_12_13 | SMART_BASELINE | 49.72% | 49.56% to 49.87% | -0.03 pp | -0.16 pp to 0.09 pp |
| FOLD_12_13 | CONSERVATIVE | 52.44% | 52.26% to 52.61% | 0.77 pp | 0.67 pp to 0.86 pp |
| FOLD_12 | ALWAYS_RAISE | 52.63% | 52.42% to 52.84% | -1.94 pp | -2.08 pp to -1.80 pp |
| FOLD_12 | AGGRESSIVE | 54.34% | 54.12% to 54.57% | -1.13 pp | -1.24 pp to -1.01 pp |
| FOLD_12 | SMART_BASELINE | 49.67% | 49.52% to 49.82% | -0.08 pp | -0.17 pp to 0.01 pp |
| FOLD_12 | CONSERVATIVE | 52.01% | 51.83% to 52.19% | 0.34 pp | 0.26 pp to 0.41 pp |
| FOLD_WEAK_VS_STRONG_UPCARD | ALWAYS_RAISE | 53.57% | 53.36% to 53.79% | -1.00 pp | -1.17 pp to -0.83 pp |
| FOLD_WEAK_VS_STRONG_UPCARD | AGGRESSIVE | 55.18% | 54.95% to 55.41% | -0.29 pp | -0.44 pp to -0.14 pp |
| FOLD_WEAK_VS_STRONG_UPCARD | SMART_BASELINE | 50.99% | 50.83% to 51.15% | 1.24 pp | 1.09 pp to 1.38 pp |
| FOLD_WEAK_VS_STRONG_UPCARD | CONSERVATIVE | 53.60% | 53.42% to 53.78% | 1.93 pp | 1.80 pp to 2.06 pp |
| FOLD_WEAK_VS_WEAK_UPCARD | ALWAYS_RAISE | 51.13% | 50.92% to 51.33% | -3.44 pp | -3.62 pp to -3.27 pp |
| FOLD_WEAK_VS_WEAK_UPCARD | AGGRESSIVE | 53.59% | 53.37% to 53.82% | -1.88 pp | -2.02 pp to -1.73 pp |
| FOLD_WEAK_VS_WEAK_UPCARD | SMART_BASELINE | 49.46% | 49.32% to 49.60% | -0.29 pp | -0.36 pp to -0.23 pp |
| FOLD_WEAK_VS_WEAK_UPCARD | CONSERVATIVE | 51.67% | 51.49% to 51.86% | 0.00 pp | 0.00 pp to 0.00 pp |
| SCORE_AWARE | ALWAYS_RAISE | 53.03% | 52.82% to 53.24% | -1.54 pp | -1.69 pp to -1.39 pp |
| SCORE_AWARE | AGGRESSIVE | 54.73% | 54.51% to 54.96% | -0.74 pp | -0.87 pp to -0.61 pp |
| SCORE_AWARE | SMART_BASELINE | 49.98% | 49.83% to 50.13% | 0.23 pp | 0.13 pp to 0.33 pp |
| SCORE_AWARE | CONSERVATIVE | 52.33% | 52.15% to 52.51% | 0.66 pp | 0.58 pp to 0.74 pp |
| ROUND_VALUE_AWARE | ALWAYS_RAISE | 54.48% | 54.28% to 54.68% | -0.09 pp | -0.17 pp to -0.01 pp |
| ROUND_VALUE_AWARE | AGGRESSIVE | 55.27% | 55.05% to 55.49% | -0.20 pp | -0.27 pp to -0.14 pp |
| ROUND_VALUE_AWARE | SMART_BASELINE | 49.77% | 49.63% to 49.91% | 0.02 pp | -0.03 pp to 0.06 pp |
| ROUND_VALUE_AWARE | CONSERVATIVE | 51.77% | 51.59% to 51.96% | 0.10 pp | 0.06 pp to 0.14 pp |
| SMART_FOLD | ALWAYS_RAISE | 54.76% | 54.56% to 54.97% | 0.19 pp | 0.12 pp to 0.26 pp |
| SMART_FOLD | AGGRESSIVE | 55.71% | 55.48% to 55.93% | 0.24 pp | 0.18 pp to 0.29 pp |
| SMART_FOLD | SMART_BASELINE | 50.20% | 50.05% to 50.34% | 0.44 pp | 0.38 pp to 0.50 pp |
| SMART_FOLD | CONSERVATIVE | 52.16% | 51.97% to 52.35% | 0.49 pp | 0.43 pp to 0.54 pp |

| Policy | Opponent | Call | Fold | Fold points conceded | Points won after Calls | Called-round wins | Score differential | Rounds/match | Own comeback wins/match | Blowouts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ALWAYS_CALL | ALWAYS_RAISE | 100.00% | 0.00% | 0 | 331200 | 43.83% | 0.465 | 7.453 | 9.18% | 17.58% |
| ALWAYS_CALL | AGGRESSIVE | 100.00% | 0.00% | 0 | 199504 | 41.51% | 0.502 | 8.783 | 7.95% | 15.61% |
| ALWAYS_CALL | SMART_BASELINE | 100.00% | 0.00% | 0 | 87392 | 27.73% | -0.006 | 9.488 | 7.00% | 14.07% |
| ALWAYS_CALL | CONSERVATIVE | 100.00% | 0.00% | 0 | 31982 | 15.01% | 0.111 | 10.141 | 6.66% | 12.36% |
| ALWAYS_FOLD | ALWAYS_RAISE | 0.00% | 100.00% | 459435 | 0 | N/A | -4.110 | 9.079 | 0.30% | 27.64% |
| ALWAYS_FOLD | AGGRESSIVE | 0.00% | 100.00% | 282315 | 0 | N/A | -2.004 | 10.387 | 3.42% | 13.77% |
| ALWAYS_FOLD | SMART_BASELINE | 0.00% | 100.00% | 175349 | 0 | N/A | -0.675 | 10.681 | 5.61% | 10.79% |
| ALWAYS_FOLD | CONSERVATIVE | 0.00% | 100.00% | 114545 | 0 | N/A | 0.240 | 10.945 | 6.00% | 10.05% |
| FOLD_12_14 | ALWAYS_RAISE | 75.01% | 24.99% | 100725 | 292256 | 48.33% | 0.010 | 7.984 | 8.22% | 16.22% |
| FOLD_12_14 | AGGRESSIVE | 74.92% | 25.08% | 62861 | 171612 | 45.70% | 0.249 | 9.187 | 7.46% | 14.34% |
| FOLD_12_14 | SMART_BASELINE | 74.72% | 25.28% | 41067 | 74388 | 30.64% | 0.003 | 9.796 | 6.86% | 13.26% |
| FOLD_12_14 | CONSERVATIVE | 74.60% | 25.40% | 27638 | 26804 | 16.51% | 0.220 | 10.358 | 6.56% | 11.88% |
| FOLD_12_13 | ALWAYS_RAISE | 82.72% | 17.28% | 68298 | 303234 | 46.36% | 0.122 | 7.819 | 8.52% | 16.57% |
| FOLD_12_13 | AGGRESSIVE | 82.62% | 17.38% | 43017 | 179506 | 43.89% | 0.310 | 9.066 | 7.61% | 14.68% |
| FOLD_12_13 | SMART_BASELINE | 82.42% | 17.58% | 28293 | 78096 | 29.43% | -0.009 | 9.699 | 6.87% | 13.52% |
| FOLD_12_13 | CONSERVATIVE | 82.34% | 17.66% | 19088 | 28216 | 15.85% | 0.183 | 10.292 | 6.55% | 12.01% |
| FOLD_12 | ALWAYS_RAISE | 91.18% | 8.82% | 34119 | 316284 | 44.85% | 0.276 | 7.639 | 8.86% | 17.13% |
| FOLD_12 | AGGRESSIVE | 91.13% | 8.87% | 21648 | 188904 | 42.49% | 0.396 | 8.928 | 7.75% | 15.13% |
| FOLD_12 | SMART_BASELINE | 90.93% | 9.07% | 14452 | 82530 | 28.49% | -0.012 | 9.595 | 6.94% | 13.80% |
| FOLD_12 | CONSERVATIVE | 90.92% | 9.08% | 9744 | 30032 | 15.38% | 0.146 | 10.217 | 6.61% | 12.17% |
| FOLD_WEAK_VS_STRONG_UPCARD | ALWAYS_RAISE | 85.03% | 14.97% | 58794 | 317200 | 47.49% | 0.373 | 7.768 | 8.77% | 16.92% |
| FOLD_WEAK_VS_STRONG_UPCARD | AGGRESSIVE | 83.63% | 16.37% | 40426 | 188346 | 45.60% | 0.477 | 9.040 | 7.68% | 14.93% |
| FOLD_WEAK_VS_STRONG_UPCARD | SMART_BASELINE | 74.44% | 25.56% | 41529 | 79292 | 32.77% | 0.111 | 9.795 | 6.88% | 13.36% |
| FOLD_WEAK_VS_STRONG_UPCARD | CONSERVATIVE | 67.52% | 32.48% | 35529 | 26872 | 18.19% | 0.285 | 10.421 | 6.53% | 11.70% |
| FOLD_WEAK_VS_WEAK_UPCARD | ALWAYS_RAISE | 85.22% | 14.78% | 58116 | 305304 | 45.55% | 0.135 | 7.777 | 8.52% | 16.76% |
| FOLD_WEAK_VS_WEAK_UPCARD | AGGRESSIVE | 86.90% | 13.10% | 32269 | 181918 | 42.49% | 0.322 | 9.017 | 7.75% | 14.80% |
| FOLD_WEAK_VS_WEAK_UPCARD | SMART_BASELINE | 96.13% | 3.87% | 6124 | 83788 | 27.52% | -0.040 | 9.541 | 7.00% | 13.87% |
| FOLD_WEAK_VS_WEAK_UPCARD | CONSERVATIVE | 100.00% | 0.00% | 0 | 31982 | 15.01% | 0.111 | 10.141 | 6.66% | 12.36% |
| SCORE_AWARE | ALWAYS_RAISE | 88.54% | 11.46% | 45035 | 316558 | 45.49% | 0.257 | 7.764 | 9.12% | 15.74% |
| SCORE_AWARE | AGGRESSIVE | 88.28% | 11.72% | 28896 | 187612 | 43.10% | 0.389 | 9.023 | 7.93% | 14.23% |
| SCORE_AWARE | SMART_BASELINE | 88.18% | 11.82% | 18946 | 81676 | 28.91% | -0.003 | 9.640 | 6.90% | 13.56% |
| SCORE_AWARE | CONSERVATIVE | 88.29% | 11.71% | 12594 | 29642 | 15.60% | 0.161 | 10.237 | 6.56% | 12.22% |
| ROUND_VALUE_AWARE | ALWAYS_RAISE | 97.61% | 2.39% | 9105 | 328102 | 44.20% | 0.435 | 7.543 | 9.19% | 17.38% |
| ROUND_VALUE_AWARE | AGGRESSIVE | 97.65% | 2.35% | 5678 | 197124 | 41.86% | 0.486 | 8.838 | 7.92% | 15.52% |
| ROUND_VALUE_AWARE | SMART_BASELINE | 97.43% | 2.57% | 4068 | 86112 | 27.97% | -0.002 | 9.540 | 7.06% | 13.87% |
| ROUND_VALUE_AWARE | CONSERVATIVE | 97.43% | 2.57% | 2749 | 31570 | 15.16% | 0.124 | 10.184 | 6.75% | 12.18% |
| SMART_FOLD | ALWAYS_RAISE | 97.69% | 2.31% | 8770 | 329596 | 44.38% | 0.460 | 7.507 | 9.19% | 17.45% |
| SMART_FOLD | AGGRESSIVE | 97.48% | 2.52% | 6072 | 198070 | 42.11% | 0.505 | 8.825 | 7.96% | 15.51% |
| SMART_FOLD | SMART_BASELINE | 96.22% | 3.78% | 5985 | 86284 | 28.34% | 0.013 | 9.528 | 7.04% | 14.05% |
| SMART_FOLD | CONSERVATIVE | 95.12% | 4.88% | 5219 | 31284 | 15.39% | 0.138 | 10.174 | 6.68% | 12.40% |

Call/Fold rates cover only the tested agent facing an opponent Raise. Called-round wins divide by all its Calls, including draws. Points are actual engine score deltas, aggregated over the full matchup. Comeback means the tested agent wins after trailing by at least three; its denominator is all matches. Blowout means final loser score zero or one, in either direction; win/loss components are in JSON.

## Descriptive Fold outcomes — not causal

Categories select different hands, scores and trajectories. Their conditional match wins do **not** establish that Fold helped. A match counts once per category, even if it contains multiple decisions. Categories overlap. Downstream wins/losses are final match results, not subsequent round wins.

### ALWAYS_CALL

| Category | Fold decisions | Matches with Fold | Conditional match wins | Conceded points | Downstream W / L |
| --- | --- | --- | --- | --- | --- |
| TOTAL:HARD_<=11 | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:SOFT | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:HARD_12 | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:HARD_13 | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:HARD_14 | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:HARD_15 | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:HARD_16 | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:HARD_17+ | 0 | 0 | N/A | 0 | 0 / 0 |
| UPCARD:2-6 | 0 | 0 | N/A | 0 | 0 / 0 |
| UPCARD:7-9 | 0 | 0 | N/A | 0 | 0 / 0 |
| UPCARD:10/A | 0 | 0 | N/A | 0 | 0 / 0 |
| SCORE:PLAYER_AT_6 | 0 | 0 | N/A | 0 | 0 / 0 |
| SCORE:OPPONENT_AT_6 | 0 | 0 | N/A | 0 | 0 / 0 |
| SCORE:TRAILING_2+ | 0 | 0 | N/A | 0 | 0 / 0 |
| SCORE:LEADING_2+ | 0 | 0 | N/A | 0 | 0 / 0 |
| SCORE:FOLD_GIVES_OPPONENT_MATCH_POINT | 0 | 0 | N/A | 0 | 0 / 0 |
| SCORE:FOLD_ENDS_MATCH | 0 | 0 | N/A | 0 | 0 / 0 |

### ALWAYS_FOLD

| Category | Fold decisions | Matches with Fold | Conditional match wins | Conceded points | Downstream W / L |
| --- | --- | --- | --- | --- | --- |
| TOTAL:HARD_<=11 | 222898 | 169491 | 20.82% | 222898 | 35296 / 134195 |
| TOTAL:SOFT | 152097 | 125464 | 19.42% | 152097 | 24359 / 101105 |
| TOTAL:HARD_12 | 91700 | 81744 | 19.35% | 91700 | 15820 / 65924 |
| TOTAL:HARD_13 | 87559 | 78241 | 19.48% | 87559 | 15240 / 63001 |
| TOTAL:HARD_14 | 79630 | 71972 | 19.24% | 79630 | 13845 / 58127 |
| TOTAL:HARD_15 | 74219 | 67546 | 18.94% | 74219 | 12792 / 54754 |
| TOTAL:HARD_16 | 66901 | 61465 | 19.10% | 66901 | 11737 / 49728 |
| TOTAL:HARD_17+ | 256640 | 185993 | 20.43% | 256640 | 38001 / 147992 |
| UPCARD:2-6 | 290790 | 169649 | 15.16% | 290790 | 25714 / 143935 |
| UPCARD:7-9 | 235619 | 174002 | 19.89% | 235619 | 34608 / 139394 |
| UPCARD:10/A | 505235 | 297565 | 25.70% | 505235 | 76463 / 221102 |
| SCORE:PLAYER_AT_6 | 54297 | 46454 | 51.72% | 54297 | 24025 / 22429 |
| SCORE:OPPONENT_AT_6 | 117740 | 117740 | 0.00% | 117740 | 0 / 117740 |
| SCORE:TRAILING_2+ | 339367 | 178938 | 3.93% | 339367 | 7032 / 171906 |
| SCORE:LEADING_2+ | 127971 | 91019 | 57.56% | 127971 | 52391 / 38628 |
| SCORE:FOLD_GIVES_OPPONENT_MATCH_POINT | 130533 | 130533 | 9.86% | 130533 | 12873 / 117660 |
| SCORE:FOLD_ENDS_MATCH | 117740 | 117740 | 0.00% | 117740 | 0 / 117740 |

### FOLD_12_14

| Category | Fold decisions | Matches with Fold | Conditional match wins | Conceded points | Downstream W / L |
| --- | --- | --- | --- | --- | --- |
| TOTAL:HARD_<=11 | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:SOFT | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:HARD_12 | 82433 | 73824 | 41.30% | 82433 | 30493 / 43331 |
| TOTAL:HARD_13 | 78539 | 70387 | 41.67% | 78539 | 29329 / 41058 |
| TOTAL:HARD_14 | 71319 | 64720 | 41.22% | 71319 | 26679 / 38041 |
| TOTAL:HARD_15 | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:HARD_16 | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:HARD_17+ | 0 | 0 | N/A | 0 | 0 / 0 |
| UPCARD:2-6 | 63604 | 55534 | 41.49% | 63604 | 23043 / 32491 |
| UPCARD:7-9 | 52988 | 49043 | 40.87% | 52988 | 20044 / 28999 |
| UPCARD:10/A | 115699 | 101441 | 41.75% | 115699 | 42347 / 59094 |
| SCORE:PLAYER_AT_6 | 21320 | 19913 | 61.40% | 21320 | 12227 / 7686 |
| SCORE:OPPONENT_AT_6 | 19398 | 19398 | 0.00% | 19398 | 0 / 19398 |
| SCORE:TRAILING_2+ | 49819 | 42977 | 12.11% | 49819 | 5205 / 37772 |
| SCORE:LEADING_2+ | 52946 | 46928 | 72.81% | 52946 | 34169 / 12759 |
| SCORE:FOLD_GIVES_OPPONENT_MATCH_POINT | 23843 | 23843 | 21.94% | 23843 | 5232 / 18611 |
| SCORE:FOLD_ENDS_MATCH | 19398 | 19398 | 0.00% | 19398 | 0 / 19398 |

### FOLD_12_13

| Category | Fold decisions | Matches with Fold | Conditional match wins | Conceded points | Downstream W / L |
| --- | --- | --- | --- | --- | --- |
| TOTAL:HARD_<=11 | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:SOFT | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:HARD_12 | 81281 | 72881 | 42.06% | 81281 | 30653 / 42228 |
| TOTAL:HARD_13 | 77415 | 69493 | 42.37% | 77415 | 29444 / 40049 |
| TOTAL:HARD_14 | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:HARD_15 | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:HARD_16 | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:HARD_17+ | 0 | 0 | N/A | 0 | 0 / 0 |
| UPCARD:2-6 | 43171 | 39337 | 42.21% | 43171 | 16604 / 22733 |
| UPCARD:7-9 | 36166 | 34345 | 41.30% | 36166 | 14185 / 20160 |
| UPCARD:10/A | 79359 | 72492 | 42.19% | 79359 | 30581 / 41911 |
| SCORE:PLAYER_AT_6 | 14792 | 14079 | 61.69% | 14792 | 8685 / 5394 |
| SCORE:OPPONENT_AT_6 | 13002 | 13002 | 0.00% | 13002 | 0 / 13002 |
| SCORE:TRAILING_2+ | 33256 | 30089 | 12.25% | 33256 | 3687 / 26402 |
| SCORE:LEADING_2+ | 37056 | 34010 | 73.18% | 37056 | 24890 / 9120 |
| SCORE:FOLD_GIVES_OPPONENT_MATCH_POINT | 15986 | 15986 | 22.78% | 15986 | 3641 / 12345 |
| SCORE:FOLD_ENDS_MATCH | 13002 | 13002 | 0.00% | 13002 | 0 / 13002 |

### FOLD_12

| Category | Fold decisions | Matches with Fold | Conditional match wins | Conceded points | Downstream W / L |
| --- | --- | --- | --- | --- | --- |
| TOTAL:HARD_<=11 | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:SOFT | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:HARD_12 | 79963 | 71807 | 42.95% | 79963 | 30843 / 40964 |
| TOTAL:HARD_13 | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:HARD_14 | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:HARD_15 | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:HARD_16 | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:HARD_17+ | 0 | 0 | N/A | 0 | 0 / 0 |
| UPCARD:2-6 | 21656 | 20648 | 42.83% | 21656 | 8844 / 11804 |
| UPCARD:7-9 | 18316 | 17826 | 41.51% | 18316 | 7400 / 10426 |
| UPCARD:10/A | 39991 | 38262 | 42.48% | 39991 | 16254 / 22008 |
| SCORE:PLAYER_AT_6 | 7527 | 7315 | 62.04% | 7527 | 4538 / 2777 |
| SCORE:OPPONENT_AT_6 | 6583 | 6583 | 0.00% | 6583 | 0 / 6583 |
| SCORE:TRAILING_2+ | 16590 | 15817 | 12.45% | 16590 | 1969 / 13848 |
| SCORE:LEADING_2+ | 19017 | 18232 | 73.51% | 19017 | 13403 / 4829 |
| SCORE:FOLD_GIVES_OPPONENT_MATCH_POINT | 8070 | 8070 | 23.14% | 8070 | 1867 / 6203 |
| SCORE:FOLD_ENDS_MATCH | 6583 | 6583 | 0.00% | 6583 | 0 / 6583 |

### FOLD_WEAK_VS_STRONG_UPCARD

| Category | Fold decisions | Matches with Fold | Conditional match wins | Conceded points | Downstream W / L |
| --- | --- | --- | --- | --- | --- |
| TOTAL:HARD_<=11 | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:SOFT | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:HARD_12 | 40588 | 38810 | 43.06% | 40588 | 16711 / 22099 |
| TOTAL:HARD_13 | 38832 | 37033 | 43.25% | 38832 | 16016 / 21017 |
| TOTAL:HARD_14 | 34907 | 33499 | 42.67% | 34907 | 14295 / 19204 |
| TOTAL:HARD_15 | 32583 | 31347 | 42.43% | 32583 | 13302 / 18045 |
| TOTAL:HARD_16 | 29368 | 28292 | 42.80% | 29368 | 12108 / 16184 |
| TOTAL:HARD_17+ | 0 | 0 | N/A | 0 | 0 / 0 |
| UPCARD:2-6 | 0 | 0 | N/A | 0 | 0 / 0 |
| UPCARD:7-9 | 0 | 0 | N/A | 0 | 0 / 0 |
| UPCARD:10/A | 176278 | 143980 | 44.24% | 176278 | 63692 / 80288 |
| SCORE:PLAYER_AT_6 | 16656 | 15938 | 63.02% | 16656 | 10044 / 5894 |
| SCORE:OPPONENT_AT_6 | 14407 | 14407 | 0.00% | 14407 | 0 / 14407 |
| SCORE:TRAILING_2+ | 35865 | 32645 | 12.41% | 35865 | 4051 / 28594 |
| SCORE:LEADING_2+ | 41838 | 38620 | 74.11% | 41838 | 28621 / 9999 |
| SCORE:FOLD_GIVES_OPPONENT_MATCH_POINT | 17752 | 17752 | 23.10% | 17752 | 4101 / 13651 |
| SCORE:FOLD_ENDS_MATCH | 14407 | 14407 | 0.00% | 14407 | 0 / 14407 |

### FOLD_WEAK_VS_WEAK_UPCARD

| Category | Fold decisions | Matches with Fold | Conditional match wins | Conceded points | Downstream W / L |
| --- | --- | --- | --- | --- | --- |
| TOTAL:HARD_<=11 | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:SOFT | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:HARD_12 | 21942 | 20901 | 41.52% | 21942 | 8678 / 12223 |
| TOTAL:HARD_13 | 21026 | 20085 | 41.86% | 21026 | 8407 / 11678 |
| TOTAL:HARD_14 | 19276 | 18478 | 42.22% | 19276 | 7802 / 10676 |
| TOTAL:HARD_15 | 17968 | 17318 | 41.85% | 17968 | 7247 / 10071 |
| TOTAL:HARD_16 | 16297 | 15719 | 41.99% | 16297 | 6600 / 9119 |
| TOTAL:HARD_17+ | 0 | 0 | N/A | 0 | 0 / 0 |
| UPCARD:2-6 | 96509 | 78719 | 43.51% | 96509 | 34248 / 44471 |
| UPCARD:7-9 | 0 | 0 | N/A | 0 | 0 / 0 |
| UPCARD:10/A | 0 | 0 | N/A | 0 | 0 / 0 |
| SCORE:PLAYER_AT_6 | 8998 | 8572 | 61.53% | 8998 | 5274 / 3298 |
| SCORE:OPPONENT_AT_6 | 7725 | 7725 | 0.00% | 7725 | 0 / 7725 |
| SCORE:TRAILING_2+ | 20638 | 18723 | 12.85% | 20638 | 2405 / 16318 |
| SCORE:LEADING_2+ | 22908 | 21285 | 73.33% | 22908 | 15608 / 5677 |
| SCORE:FOLD_GIVES_OPPONENT_MATCH_POINT | 9545 | 9545 | 22.98% | 9545 | 2193 / 7352 |
| SCORE:FOLD_ENDS_MATCH | 7725 | 7725 | 0.00% | 7725 | 0 / 7725 |

### SCORE_AWARE

| Category | Fold decisions | Matches with Fold | Conditional match wins | Conceded points | Downstream W / L |
| --- | --- | --- | --- | --- | --- |
| TOTAL:HARD_<=11 | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:SOFT | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:HARD_12 | 55802 | 51849 | 50.14% | 55802 | 25995 / 25854 |
| TOTAL:HARD_13 | 14162 | 13706 | 71.56% | 14162 | 9808 / 3898 |
| TOTAL:HARD_14 | 12753 | 12412 | 71.60% | 12753 | 8887 / 3525 |
| TOTAL:HARD_15 | 11879 | 11572 | 70.21% | 11879 | 8125 / 3447 |
| TOTAL:HARD_16 | 10875 | 10627 | 71.39% | 10875 | 7587 / 3040 |
| TOTAL:HARD_17+ | 0 | 0 | N/A | 0 | 0 / 0 |
| UPCARD:2-6 | 29157 | 27344 | 60.58% | 29157 | 16566 / 10778 |
| UPCARD:7-9 | 24113 | 23173 | 59.38% | 24113 | 13759 / 9414 |
| UPCARD:10/A | 52201 | 48880 | 59.73% | 52201 | 29196 / 19684 |
| SCORE:PLAYER_AT_6 | 0 | 0 | N/A | 0 | 0 / 0 |
| SCORE:OPPONENT_AT_6 | 0 | 0 | N/A | 0 | 0 / 0 |
| SCORE:TRAILING_2+ | 0 | 0 | N/A | 0 | 0 / 0 |
| SCORE:LEADING_2+ | 64460 | 56007 | 71.11% | 64460 | 39827 / 16180 |
| SCORE:FOLD_GIVES_OPPONENT_MATCH_POINT | 2986 | 2986 | 29.34% | 2986 | 876 / 2110 |
| SCORE:FOLD_ENDS_MATCH | 0 | 0 | N/A | 0 | 0 / 0 |

### ROUND_VALUE_AWARE

| Category | Fold decisions | Matches with Fold | Conditional match wins | Conceded points | Downstream W / L |
| --- | --- | --- | --- | --- | --- |
| TOTAL:HARD_<=11 | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:SOFT | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:HARD_12 | 5073 | 5073 | 12.97% | 5073 | 658 / 4415 |
| TOTAL:HARD_13 | 4598 | 4598 | 13.20% | 4598 | 607 / 3991 |
| TOTAL:HARD_14 | 4329 | 4329 | 13.79% | 4329 | 597 / 3732 |
| TOTAL:HARD_15 | 3941 | 3941 | 13.75% | 3941 | 542 / 3399 |
| TOTAL:HARD_16 | 3659 | 3659 | 13.77% | 3659 | 504 / 3155 |
| TOTAL:HARD_17+ | 0 | 0 | N/A | 0 | 0 / 0 |
| UPCARD:2-6 | 5757 | 5757 | 15.25% | 5757 | 878 / 4879 |
| UPCARD:7-9 | 4945 | 4945 | 13.43% | 4945 | 664 / 4281 |
| UPCARD:10/A | 10898 | 10898 | 12.53% | 10898 | 1366 / 9532 |
| SCORE:PLAYER_AT_6 | 0 | 0 | N/A | 0 | 0 / 0 |
| SCORE:OPPONENT_AT_6 | 0 | 0 | N/A | 0 | 0 / 0 |
| SCORE:TRAILING_2+ | 15589 | 15589 | 10.18% | 15589 | 1587 / 14002 |
| SCORE:LEADING_2+ | 0 | 0 | N/A | 0 | 0 / 0 |
| SCORE:FOLD_GIVES_OPPONENT_MATCH_POINT | 21600 | 21600 | 13.46% | 21600 | 2908 / 18692 |
| SCORE:FOLD_ENDS_MATCH | 0 | 0 | N/A | 0 | 0 / 0 |

### SMART_FOLD

| Category | Fold decisions | Matches with Fold | Conditional match wins | Conceded points | Downstream W / L |
| --- | --- | --- | --- | --- | --- |
| TOTAL:HARD_<=11 | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:SOFT | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:HARD_12 | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:HARD_13 | 0 | 0 | N/A | 0 | 0 / 0 |
| TOTAL:HARD_14 | 9332 | 9177 | 70.70% | 9332 | 6488 / 2689 |
| TOTAL:HARD_15 | 8758 | 8597 | 69.50% | 8758 | 5975 / 2622 |
| TOTAL:HARD_16 | 7956 | 7839 | 70.42% | 7956 | 5520 / 2319 |
| TOTAL:HARD_17+ | 0 | 0 | N/A | 0 | 0 / 0 |
| UPCARD:2-6 | 0 | 0 | N/A | 0 | 0 / 0 |
| UPCARD:7-9 | 0 | 0 | N/A | 0 | 0 / 0 |
| UPCARD:10/A | 26046 | 24796 | 70.25% | 26046 | 17418 / 7378 |
| SCORE:PLAYER_AT_6 | 7340 | 7182 | 76.04% | 7340 | 5461 / 1721 |
| SCORE:OPPONENT_AT_6 | 0 | 0 | N/A | 0 | 0 / 0 |
| SCORE:TRAILING_2+ | 0 | 0 | N/A | 0 | 0 / 0 |
| SCORE:LEADING_2+ | 22775 | 21759 | 74.00% | 22775 | 16102 / 5657 |
| SCORE:FOLD_GIVES_OPPONENT_MATCH_POINT | 3271 | 3271 | 42.95% | 3271 | 1405 / 1866 |
| SCORE:FOLD_ENDS_MATCH | 0 | 0 | N/A | 0 | 0 / 0 |

## Paired one-decision counterfactual

First N seed pairs, both seats; one uniformly reservoir-sampled A response per eligible ALWAYS_CALL match. Subsequent responses ALWAYS_CALL; original SMART Hit/Stand and Raise retained. Sample eligibility varies by opponent; pooled CF is eligible-state-weighted, not equal-opponent-weighted.

71,315 eligible sampled response states; 142,630 engine continuations. Both branches clone the same immutable state and card/agent RNG streams, then force only the current Call or Fold. All subsequent responses use ALWAYS_CALL. Every Call branch must reproduce the original baseline winner and final score; every Fold branch must award exactly one point to the opponent.

This measures a single-action intervention under this continuation policy, averaged over sampled baseline states. It is not an optimal-response oracle, nor a guarantee for every hidden realization of the same public state. The full engine state is held fixed for execution, but never used to choose policies or sample favorable states. Current shared-deck order and future shuffle stream are identical at the fork. Branches can end at different times, consume different deck positions and consume different opponent policy draws; identical random streams are a valid coupling, not identical post-branch events.

| Population | States | Call final wins | Fold final wins | Fold minus Call | Clustered 95% CI | Call-only / Fold-only wins |
| --- | --- | --- | --- | --- | --- | --- |
| ALWAYS_RAISE | 20000 | 54.71% | 45.80% | -8.91 pp | -9.49 pp to -8.33 pp | 2683 / 901 |
| AGGRESSIVE | 19534 | 54.91% | 46.63% | -8.29 pp | -8.89 pp to -7.68 pp | 2673 / 1054 |
| SMART_BASELINE | 17495 | 47.21% | 43.27% | -3.94 pp | -4.52 pp to -3.35 pp | 1822 / 1133 |
| CONSERVATIVE | 14286 | 44.31% | 45.89% | 1.58 pp | 0.96 pp to 2.21 pp | 942 / 1168 |
| POOLED | 71315 | 50.84% | 45.42% | -5.42 pp | -5.77 pp to -5.07 pp | 8120 / 4256 |

| Public state group | States | Call wins | Fold wins | Fold minus Call | Clustered 95% CI |
| --- | --- | --- | --- | --- | --- |
| SCORE:FOLD_ENDS_MATCH | 4985 | 20.86% | 0.00% | -20.86 pp | -22.10 pp to -19.62 pp |
| SCORE:FOLD_GIVES_OPPONENT_MATCH_POINT | 6685 | 25.01% | 24.28% | -0.73 pp | -2.13 pp to 0.67 pp |
| SCORE:LEADING_2+ | 18674 | 81.13% | 77.58% | -3.55 pp | -4.13 pp to -2.97 pp |
| SCORE:OPPONENT_AT_6 | 4985 | 20.86% | 0.00% | -20.86 pp | -22.10 pp to -19.62 pp |
| SCORE:PLAYER_AT_6 | 6426 | 72.91% | 67.74% | -5.17 pp | -6.38 pp to -3.96 pp |
| SCORE:TRAILING_2+ | 14137 | 18.02% | 12.22% | -5.80 pp | -6.50 pp to -5.10 pp |
| TOTAL_UPCARD:HARD_<=11/10/A | 8776 | 46.41% | 44.47% | -1.94 pp | -2.94 pp to -0.93 pp |
| TOTAL_UPCARD:HARD_<=11/2-6 | 3315 | 61.48% | 48.96% | -12.52 pp | -14.09 pp to -10.95 pp |
| TOTAL_UPCARD:HARD_<=11/7-9 | 3472 | 54.44% | 44.61% | -9.82 pp | -11.39 pp to -8.26 pp |
| TOTAL_UPCARD:HARD_12/10/A | 3554 | 43.11% | 44.23% | 1.13 pp | -0.47 pp to 2.72 pp |
| TOTAL_UPCARD:HARD_12/2-6 | 1463 | 54.00% | 47.37% | -6.63 pp | -8.91 pp to -4.35 pp |
| TOTAL_UPCARD:HARD_12/7-9 | 1450 | 51.03% | 46.76% | -4.28 pp | -6.73 pp to -1.82 pp |
| TOTAL_UPCARD:HARD_13/10/A | 3324 | 41.79% | 44.28% | 2.50 pp | 0.97 pp to 4.03 pp |
| TOTAL_UPCARD:HARD_13/2-6 | 1322 | 52.72% | 45.69% | -7.03 pp | -9.58 pp to -4.49 pp |
| TOTAL_UPCARD:HARD_13/7-9 | 1362 | 47.06% | 43.39% | -3.67 pp | -6.28 pp to -1.07 pp |
| TOTAL_UPCARD:HARD_14/10/A | 3042 | 41.35% | 43.16% | 1.81 pp | 0.20 pp to 3.42 pp |
| TOTAL_UPCARD:HARD_14/2-6 | 1229 | 50.37% | 45.40% | -4.96 pp | -7.55 pp to -2.38 pp |
| TOTAL_UPCARD:HARD_14/7-9 | 1205 | 47.22% | 43.65% | -3.57 pp | -6.30 pp to -0.84 pp |
| TOTAL_UPCARD:HARD_15/10/A | 2814 | 39.16% | 42.82% | 3.66 pp | 2.06 pp to 5.26 pp |
| TOTAL_UPCARD:HARD_15/2-6 | 1189 | 49.29% | 47.77% | -1.51 pp | -3.93 pp to 0.91 pp |
| TOTAL_UPCARD:HARD_15/7-9 | 1147 | 42.89% | 41.33% | -1.57 pp | -4.24 pp to 1.10 pp |
| TOTAL_UPCARD:HARD_16/10/A | 2473 | 41.12% | 44.20% | 3.07 pp | 1.35 pp to 4.80 pp |
| TOTAL_UPCARD:HARD_16/2-6 | 1002 | 50.50% | 45.81% | -4.69 pp | -7.41 pp to -1.97 pp |
| TOTAL_UPCARD:HARD_16/7-9 | 1049 | 45.47% | 46.90% | 1.43 pp | -1.25 pp to 4.11 pp |
| TOTAL_UPCARD:HARD_17+/10/A | 9436 | 46.27% | 45.49% | -0.78 pp | -1.71 pp to 0.15 pp |
| TOTAL_UPCARD:HARD_17+/2-6 | 4264 | 63.06% | 48.08% | -14.99 pp | -16.42 pp to -13.56 pp |
| TOTAL_UPCARD:HARD_17+/7-9 | 3886 | 60.34% | 45.91% | -14.44 pp | -16.03 pp to -12.85 pp |
| TOTAL_UPCARD:SOFT/10/A | 5689 | 57.64% | 46.11% | -11.53 pp | -12.92 pp to -10.14 pp |
| TOTAL_UPCARD:SOFT/2-6 | 2454 | 65.97% | 47.68% | -18.30 pp | -20.17 pp to -16.43 pp |
| TOTAL_UPCARD:SOFT/7-9 | 2398 | 64.39% | 45.95% | -18.43 pp | -20.56 pp to -16.31 pp |
| TOTAL:HARD_<=11 | 15563 | 51.41% | 45.46% | -5.95 pp | -6.70 pp to -5.20 pp |
| TOTAL:HARD_12 | 6467 | 47.35% | 45.51% | -1.84 pp | -3.01 pp to -0.67 pp |
| TOTAL:HARD_13 | 6008 | 45.39% | 44.39% | -1.00 pp | -2.18 pp to 0.19 pp |
| TOTAL:HARD_14 | 5476 | 44.67% | 43.77% | -0.89 pp | -2.13 pp to 0.34 pp |
| TOTAL:HARD_15 | 5150 | 42.33% | 43.63% | 1.30 pp | 0.11 pp to 2.49 pp |
| TOTAL:HARD_16 | 4524 | 44.21% | 45.18% | 0.97 pp | -0.31 pp to 2.25 pp |
| TOTAL:HARD_17+ | 17586 | 53.45% | 46.21% | -7.24 pp | -7.97 pp to -6.52 pp |
| TOTAL:SOFT | 10541 | 61.11% | 46.44% | -14.68 pp | -15.69 pp to -13.67 pp |
| UPCARD:10/A | 39108 | 46.07% | 44.68% | -1.39 pp | -1.85 pp to -0.92 pp |
| UPCARD:2-6 | 16238 | 58.78% | 47.57% | -11.20 pp | -11.91 pp to -10.49 pp |
| UPCARD:7-9 | 15969 | 54.47% | 45.06% | -9.41 pp | -10.18 pp to -8.63 pp |

Exact-score and score-by-total counterfactual tables are retained in JSON. Score groups overlap. Opponent-at-six and Fold-ends-match are the same condition. Fold-gives-match-point means opponent currently has five.

## Findings

- Best tested Fold policy: **FOLD_WEAK_VS_STRONG_UPCARD**, 53.34%, delta 0.47 pp (0.37 pp to 0.57 pp). Worst: **ALWAYS_FOLD**, 31.58%.
- ALWAYS_CALL control: **52.87%** in the equal-weight pool. It is beaten by the best tested Fold policy with a positive paired interval. This comparison cannot prove global optimality.
- SMART_FOLD: 53.21%, delta 0.34 pp (0.30 pp to 0.38 pp).
- SMART_FOLD has positive paired intervals against all four opponents. Its response Fold rate is 2.94%. The highest pooled score alone does not establish robustness to opponent selection.
- A forced Fold across the sampled baseline response states changes eventual match wins by -5.42 pp (-5.77 pp to -5.07 pp). Blanket folding is not justified by a beneficial subgroup.
- Public hand groups with positive exploratory paired intervals (at least 1,000 states): TOTAL_UPCARD:HARD_15/10/A: 3.66 pp (2.06 pp to 5.26 pp; n=2814); TOTAL_UPCARD:HARD_16/10/A: 3.07 pp (1.35 pp to 4.80 pp; n=2473); TOTAL_UPCARD:HARD_13/10/A: 2.50 pp (0.97 pp to 4.03 pp; n=3324); TOTAL_UPCARD:HARD_14/10/A: 1.81 pp (0.20 pp to 3.42 pp; n=3042); TOTAL:HARD_15: 1.30 pp (0.11 pp to 2.49 pp; n=5150).
- SCORE_AWARE: delta -0.35 pp (-0.42 pp to -0.28 pp).
- ROUND_VALUE_AWARE: delta -0.04 pp (-0.08 pp to -0.01 pp).
- Score matters mechanically: folding against opponent six immediately loses. Other score effects and hand/upcard interactions must be assessed through the paired tables, rather than descriptive conditional wins.
- ALWAYS_CALL is close to the best tested policy, but is beaten in this fixed-policy comparison; global optimality remains unproven. Fold has narrow, measurable strategic value under current rules; most broad Fold rules are traps. These results support keeping Fold for now and validating its useful public-state conditions, rather than changing scoring from this experiment alone.
- Upcards matter in combination with hand strength and opponent Raise policy. A 10/A upcard alone does not favor Fold across all hands. Positive hard-total/upcard subgroup intervals are exploratory averages over this opponent mixture, not a universal prescription.
- Being ahead is not sufficient reason to Fold. Assess the leading-by-two counterfactual alongside SCORE_AWARE; selective combinations of score, hard total and strong upcard can behave differently from broad score-based rules.
- Next experiment: freeze a simple public-state policy suggested by these exploratory groups, then validate it on independent held-out seeds against this pool and opponents that adapt their Raise frequency. Compare with ALWAYS_CALL before considering any rule change.

## Uncertainty and limitations

Matchup win intervals use paired-seat clusters. Policy deltas pair each result to ALWAYS_CALL using the same seed/seat/opponent. Pool intervals average all four opponent outcomes within each seed pair before computing uncertainty. Counterfactual intervals cluster all sampled states from both seats and all opponents by match seed. Normal 95% intervals describe Monte Carlo uncertainty; exploratory subgroup intervals are not corrected for multiple comparisons. Opponent strategies are fixed heuristics, not equilibrium or best responses. Shared common random numbers reduce noise but do not force identical post-intervention trajectories. Reservoir sampling gives one uniformly selected eligible response per baseline match, not a uniformly selected decision across the entire population. No production changes were made.

Reproduce with `npm run simulate:fold -- --matches 100000 --seed 20261006 --counterfactual-pairs 10000`.
