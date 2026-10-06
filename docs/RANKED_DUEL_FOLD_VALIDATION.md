# Ranked Duel selective Fold holdout validation

**8,000,000 main matches** plus **1,000,000 diagnostic matches**. 100,000 per policy/opponent/seed, half in each seat. Five seeds: 104729, 982451653, 32452843, 49979687, 67867967. The pools reuse the individual matches.

## Frozen policy and fair controls

| Policy | Definition |
| --- | --- |
| ALWAYS_CALL | Always Call; exact SMART_BASELINE Hit/Stand and Raise/Pass functions. |
| SELECTIVE_FOLD_V1 | Frozen: never Fold when opponent is at target minus one, on soft hands, hard <=12 or hard 17+. Fold hard 13-16 only against visible 10-value or Ace; otherwise Call. Exact SMART_BASELINE Hit/Stand and Raise/Pass. |

Policy thresholds were frozen before running validation and were not tuned after results. Both tested agents use the same SMART_BASELINE Hit/Stand and Raise/Pass function references. Production game engine deals, draws and scores all matches; no rules, UI or production bots were changed.

## Opponents and adaptation

| Opponent | Type | Exact behavior |
| --- | --- | --- |
| ALWAYS_RAISE | fixed | Production basic Hit below 17. Always Raise when first; always Call. |
| AGGRESSIVE | fixed | Hit hard totals below 18 and soft totals below 19. Raise with probability .70 on 17+, .40 on hard 12–16, .55 otherwise. Call .70 on hard 12–14, .90 otherwise. |
| SMART_BASELINE | fixed | Untuned heuristic: Hit soft <19, hard <17, except Stand hard 16 versus visible 2–6 unless trailing by 3+. Raise 19+ always, 18 at .65, 17 at .35, otherwise .08 (.15 trailing by 3+, zero when ahead and one point from target). Call 15+, soft hands or <=11; hard 12–14 Call .65 against 7+ upcard, .80 otherwise. Always Call if folding would end the match. |
| CONSERVATIVE | fixed | Hit hard totals below 16 and soft totals below 18. Raise on 19+. Fold hard 12–14; Call other hands. |
| ADAPTIVE_LOW_RAISE | adaptive | Start at SMART Raise probability. After >=3 observed responses to own Raises, multiply probability by .35 when observed Call fraction >=.75; otherwise unchanged. |
| ADAPTIVE_HIGH_RAISE | adaptive | Start at SMART Raise probability. After >=3 observed responses, add min(.40, 2 * observed Fold fraction), clamped to [0,1]. |
| EXPLOIT_FOLD | adaptive | Known-policy test: if own public first card is 10-value/A, own opening is weak hard 12-16 and opponent score <6, Raise with max(SMART probability,.85). Otherwise SMART probability. Never reads opponent hidden total; unknown Fold-window eligibility remains uncertain. |
| MIXED_ADAPTIVE | adaptive | SMART probability plus .60*smoothedFoldRate - .12*smoothedCallRate, plus .05 if trailing by 2+, minus .05 if leading by 2+. Rates use Beta(1,3): Fold=(folds+1)/(responses+4). Clamp [0,1]. Public response history updates gradually. |
| EXPLOIT_FOLD_NO_WINDOW | diagnostic | Diagnostic control for EXPLOIT_FOLD: identical SMART Hit/Stand, always Call, normal SMART Raise probability without the known-window bluff boost. |

Fresh history per match and seat; counts only publicly observed opponent Call/Fold responses to own Raises. EXPLOIT_FOLD knows the frozen response rule but never its current hidden hand. All four adaptive bots share SMART Hit/Stand and always Call.

Adaptive normal Raise probability equals SMART: 19+ = 1, 18 = .65, 17 = .35; weaker hands = zero if ahead at six, .15 if trailing by three or more, otherwise .08. Clamp all adjusted probabilities to [0,1]. An adaptive bot receives its public strategy view and a separate event containing only actor (self/opponent) and the public Raise/Pass/Call/Fold action. It never receives engine state, hidden opponent cards, deck/cursors, RNG snapshots, analytics or test-agent ID. Histories reset for every match, including the reversed seat. EXPLOIT_FOLD is the explicit known-policy opponent: it knows the rule, not whether the current opponent hand satisfies it. Its own first card is the upcard the opponent can see.

## Pooled matchup results

| Opponent | Type | ALWAYS_CALL wins (95% CI) | SELECTIVE wins (95% CI) | Delta (95% CI) | Positive seeds | Worst / best seed delta |
| --- | --- | --- | --- | --- | --- | --- |
| ALWAYS_RAISE | fixed | 54.495% (54.406% to 54.585%) | 54.607% (54.513% to 54.700%) | 0.111 pp (0.047 pp to 0.176 pp) | 5/5 (100.000%) | 0.081 pp / 0.128 pp |
| AGGRESSIVE | fixed | 55.686% (55.587% to 55.784%) | 55.936% (55.835% to 56.037%) | 0.250 pp (0.195 pp to 0.306 pp) | 5/5 (100.000%) | 0.189 pp / 0.289 pp |
| SMART_BASELINE | fixed | 49.724% (49.662% to 49.787%) | 51.075% (51.004% to 51.145%) | 1.350 pp (1.296 pp to 1.405 pp) | 5/5 (100.000%) | 1.282 pp / 1.391 pp |
| CONSERVATIVE | fixed | 51.685% (51.603% to 51.768%) | 53.411% (53.329% to 53.493%) | 1.726 pp (1.675 pp to 1.776 pp) | 5/5 (100.000%) | 1.661 pp / 1.751 pp |
| ADAPTIVE_LOW_RAISE | adaptive | 50.059% (50.001% to 50.117%) | 51.354% (51.285% to 51.424%) | 1.295 pp (1.242 pp to 1.349 pp) | 5/5 (100.000%) | 1.181 pp / 1.402 pp |
| ADAPTIVE_HIGH_RAISE | adaptive | 49.969% (49.911% to 50.026%) | 51.361% (51.291% to 51.431%) | 1.392 pp (1.338 pp to 1.446 pp) | 5/5 (100.000%) | 1.306 pp / 1.465 pp |
| EXPLOIT_FOLD | adaptive | 51.436% (51.369% to 51.502%) | 51.816% (51.740% to 51.892%) | 0.380 pp (0.317 pp to 0.443 pp) | 5/5 (100.000%) | 0.249 pp / 0.454 pp |
| MIXED_ADAPTIVE | adaptive | 50.039% (49.979% to 50.099%) | 51.366% (51.295% to 51.438%) | 1.328 pp (1.273 pp to 1.383 pp) | 5/5 (100.000%) | 1.247 pp / 1.436 pp |
| EXPLOIT_FOLD_NO_WINDOW | diagnostic | 49.969% (49.911% to 50.026%) | 51.316% (51.246% to 51.386%) | 1.347 pp (1.293 pp to 1.401 pp) | 5/5 (100.000%) | 1.256 pp / 1.451 pp |

| Equal-weight pool | ALWAYS_CALL | SELECTIVE | Delta | 95% CI | Positive seeds | Worst / best seed delta |
| --- | --- | --- | --- | --- | --- | --- |
| fixed | 52.898% | 53.757% | 0.859 pp | 0.823 pp to 0.896 pp | 5/5 (100.000%) | 0.825 pp / 0.878 pp |
| adaptive | 50.376% | 51.474% | 1.099 pp | 1.048 pp to 1.150 pp | 5/5 (100.000%) | 1.022 pp / 1.185 pp |
| combined | 51.637% | 52.616% | 0.979 pp | 0.939 pp to 1.019 pp | 5/5 (100.000%) | 0.923 pp / 1.031 pp |

## Every held-out seed

| Seed | Opponent | ALWAYS_CALL | SELECTIVE | Delta | Paired 95% CI |
| --- | --- | --- | --- | --- | --- |
| 104729 | ALWAYS_RAISE | 54.609% | 54.690% | 0.081 pp | -0.063 pp to 0.225 pp |
| 982451653 | ALWAYS_RAISE | 54.577% | 54.694% | 0.117 pp | -0.028 pp to 0.262 pp |
| 32452843 | ALWAYS_RAISE | 54.519% | 54.647% | 0.128 pp | -0.016 pp to 0.272 pp |
| 49979687 | ALWAYS_RAISE | 54.386% | 54.502% | 0.116 pp | -0.028 pp to 0.260 pp |
| 67867967 | ALWAYS_RAISE | 54.385% | 54.500% | 0.115 pp | -0.028 pp to 0.258 pp |
| 104729 | AGGRESSIVE | 55.675% | 55.964% | 0.289 pp | 0.165 pp to 0.413 pp |
| 982451653 | AGGRESSIVE | 55.766% | 55.955% | 0.189 pp | 0.065 pp to 0.313 pp |
| 32452843 | AGGRESSIVE | 55.741% | 55.968% | 0.227 pp | 0.103 pp to 0.351 pp |
| 49979687 | AGGRESSIVE | 55.653% | 55.936% | 0.283 pp | 0.157 pp to 0.409 pp |
| 67867967 | AGGRESSIVE | 55.594% | 55.858% | 0.264 pp | 0.140 pp to 0.388 pp |
| 104729 | SMART_BASELINE | 49.663% | 51.054% | 1.391 pp | 1.270 pp to 1.512 pp |
| 982451653 | SMART_BASELINE | 49.682% | 51.035% | 1.353 pp | 1.231 pp to 1.475 pp |
| 32452843 | SMART_BASELINE | 49.748% | 51.030% | 1.282 pp | 1.161 pp to 1.403 pp |
| 49979687 | SMART_BASELINE | 49.777% | 51.143% | 1.366 pp | 1.244 pp to 1.488 pp |
| 67867967 | SMART_BASELINE | 49.752% | 51.111% | 1.359 pp | 1.237 pp to 1.481 pp |
| 104729 | CONSERVATIVE | 51.683% | 53.434% | 1.751 pp | 1.639 pp to 1.863 pp |
| 982451653 | CONSERVATIVE | 51.664% | 53.390% | 1.726 pp | 1.614 pp to 1.838 pp |
| 32452843 | CONSERVATIVE | 51.663% | 53.324% | 1.661 pp | 1.549 pp to 1.773 pp |
| 49979687 | CONSERVATIVE | 51.716% | 53.458% | 1.742 pp | 1.630 pp to 1.854 pp |
| 67867967 | CONSERVATIVE | 51.701% | 53.450% | 1.749 pp | 1.634 pp to 1.864 pp |
| 104729 | ADAPTIVE_LOW_RAISE | 50.012% | 51.414% | 1.402 pp | 1.283 pp to 1.521 pp |
| 982451653 | ADAPTIVE_LOW_RAISE | 50.021% | 51.310% | 1.289 pp | 1.169 pp to 1.409 pp |
| 32452843 | ADAPTIVE_LOW_RAISE | 50.159% | 51.340% | 1.181 pp | 1.062 pp to 1.300 pp |
| 49979687 | ADAPTIVE_LOW_RAISE | 50.027% | 51.327% | 1.300 pp | 1.179 pp to 1.421 pp |
| 67867967 | ADAPTIVE_LOW_RAISE | 50.077% | 51.381% | 1.304 pp | 1.183 pp to 1.425 pp |
| 104729 | ADAPTIVE_HIGH_RAISE | 49.922% | 51.387% | 1.465 pp | 1.345 pp to 1.585 pp |
| 982451653 | ADAPTIVE_HIGH_RAISE | 49.943% | 51.313% | 1.370 pp | 1.250 pp to 1.490 pp |
| 32452843 | ADAPTIVE_HIGH_RAISE | 50.040% | 51.346% | 1.306 pp | 1.186 pp to 1.426 pp |
| 49979687 | ADAPTIVE_HIGH_RAISE | 49.964% | 51.353% | 1.389 pp | 1.267 pp to 1.511 pp |
| 67867967 | ADAPTIVE_HIGH_RAISE | 49.975% | 51.406% | 1.431 pp | 1.309 pp to 1.553 pp |
| 104729 | EXPLOIT_FOLD | 51.382% | 51.818% | 0.436 pp | 0.294 pp to 0.578 pp |
| 982451653 | EXPLOIT_FOLD | 51.434% | 51.683% | 0.249 pp | 0.106 pp to 0.392 pp |
| 32452843 | EXPLOIT_FOLD | 51.484% | 51.837% | 0.353 pp | 0.212 pp to 0.494 pp |
| 49979687 | EXPLOIT_FOLD | 51.505% | 51.913% | 0.408 pp | 0.266 pp to 0.550 pp |
| 67867967 | EXPLOIT_FOLD | 51.373% | 51.827% | 0.454 pp | 0.312 pp to 0.596 pp |
| 104729 | MIXED_ADAPTIVE | 49.989% | 51.425% | 1.436 pp | 1.312 pp to 1.560 pp |
| 982451653 | MIXED_ADAPTIVE | 50.025% | 51.288% | 1.263 pp | 1.140 pp to 1.386 pp |
| 32452843 | MIXED_ADAPTIVE | 50.101% | 51.348% | 1.247 pp | 1.124 pp to 1.370 pp |
| 49979687 | MIXED_ADAPTIVE | 50.068% | 51.409% | 1.341 pp | 1.217 pp to 1.465 pp |
| 67867967 | MIXED_ADAPTIVE | 50.010% | 51.362% | 1.352 pp | 1.228 pp to 1.476 pp |
| 104729 | EXPLOIT_FOLD_NO_WINDOW | 49.922% | 51.373% | 1.451 pp | 1.331 pp to 1.571 pp |
| 982451653 | EXPLOIT_FOLD_NO_WINDOW | 49.943% | 51.265% | 1.322 pp | 1.202 pp to 1.442 pp |
| 32452843 | EXPLOIT_FOLD_NO_WINDOW | 50.040% | 51.296% | 1.256 pp | 1.137 pp to 1.375 pp |
| 49979687 | EXPLOIT_FOLD_NO_WINDOW | 49.964% | 51.303% | 1.339 pp | 1.218 pp to 1.460 pp |
| 67867967 | EXPLOIT_FOLD_NO_WINDOW | 49.975% | 51.343% | 1.368 pp | 1.247 pp to 1.489 pp |

| Seed | Pool | ALWAYS_CALL | SELECTIVE | Delta | Paired 95% CI |
| --- | --- | --- | --- | --- | --- |
| 104729 | fixed | 52.907% | 53.785% | 0.878 pp | 0.797 pp to 0.959 pp |
| 982451653 | fixed | 52.922% | 53.768% | 0.846 pp | 0.765 pp to 0.928 pp |
| 32452843 | fixed | 52.918% | 53.742% | 0.825 pp | 0.744 pp to 0.905 pp |
| 49979687 | fixed | 52.883% | 53.760% | 0.877 pp | 0.795 pp to 0.958 pp |
| 67867967 | fixed | 52.858% | 53.730% | 0.872 pp | 0.790 pp to 0.953 pp |
| 104729 | adaptive | 50.326% | 51.511% | 1.185 pp | 1.071 pp to 1.299 pp |
| 982451653 | adaptive | 50.356% | 51.399% | 1.043 pp | 0.929 pp to 1.157 pp |
| 32452843 | adaptive | 50.446% | 51.468% | 1.022 pp | 0.908 pp to 1.135 pp |
| 49979687 | adaptive | 50.391% | 51.501% | 1.110 pp | 0.994 pp to 1.225 pp |
| 67867967 | adaptive | 50.359% | 51.494% | 1.135 pp | 1.021 pp to 1.250 pp |
| 104729 | combined | 51.617% | 52.648% | 1.031 pp | 0.942 pp to 1.121 pp |
| 982451653 | combined | 51.639% | 52.584% | 0.945 pp | 0.855 pp to 1.034 pp |
| 32452843 | combined | 51.682% | 52.605% | 0.923 pp | 0.834 pp to 1.012 pp |
| 49979687 | combined | 51.637% | 52.630% | 0.993 pp | 0.903 pp to 1.083 pp |
| 67867967 | combined | 51.608% | 52.612% | 1.004 pp | 0.914 pp to 1.093 pp |

## Response, Raise and pacing metrics

| Opponent | Test policy | Fold frequency | Opponent Raise frequency | Opponent weak/bluff Raises per opportunity | Weak/bluff fraction of Raises | Called-round win rate | Fold points conceded | Rounds/match |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ALWAYS_RAISE | ALWAYS_CALL | 0.000% | 100.000% | 38.774% | 38.774% | 43.676% | 0 | 7.455 |
| ALWAYS_RAISE | SELECTIVE_FOLD_V1 | 10.608% | 100.000% | 38.779% | 38.779% | 46.316% | 206604 | 7.708 |
| AGGRESSIVE | ALWAYS_CALL | 0.000% | 54.398% | 15.490% | 28.476% | 41.322% | 0 | 8.792 |
| AGGRESSIVE | SELECTIVE_FOLD_V1 | 11.662% | 54.413% | 15.500% | 28.486% | 44.211% | 143311 | 8.998 |
| SMART_BASELINE | ALWAYS_CALL | 0.000% | 33.252% | 3.213% | 9.663% | 27.629% | 0 | 9.489 |
| SMART_BASELINE | SELECTIVE_FOLD_V1 | 18.092% | 33.249% | 3.211% | 9.656% | 30.993% | 146278 | 9.737 |
| CONSERVATIVE | ALWAYS_CALL | 0.000% | 21.113% | 0.000% | 0.000% | 14.902% | 0 | 10.145 |
| CONSERVATIVE | SELECTIVE_FOLD_V1 | 22.933% | 21.109% | 0.000% | 0.000% | 16.964% | 125180 | 10.369 |
| ADAPTIVE_LOW_RAISE | ALWAYS_CALL | 0.000% | 32.839% | 3.191% | 9.716% | 27.667% | 0 | 9.397 |
| ADAPTIVE_LOW_RAISE | SELECTIVE_FOLD_V1 | 18.146% | 32.996% | 3.200% | 9.699% | 31.026% | 143909 | 9.633 |
| ADAPTIVE_HIGH_RAISE | ALWAYS_CALL | 0.000% | 33.246% | 3.222% | 9.691% | 27.652% | 0 | 9.387 |
| ADAPTIVE_HIGH_RAISE | SELECTIVE_FOLD_V1 | 17.951% | 33.642% | 3.422% | 10.172% | 31.299% | 144974 | 9.618 |
| EXPLOIT_FOLD | ALWAYS_CALL | 0.000% | 41.718% | 11.685% | 28.009% | 33.796% | 0 | 9.063 |
| EXPLOIT_FOLD | SELECTIVE_FOLD_V1 | 19.922% | 41.692% | 11.675% | 28.003% | 37.488% | 194147 | 9.352 |
| MIXED_ADAPTIVE | ALWAYS_CALL | 0.000% | 36.335% | 4.807% | 13.231% | 29.744% | 0 | 9.266 |
| MIXED_ADAPTIVE | SELECTIVE_FOLD_V1 | 16.820% | 37.660% | 5.437% | 14.438% | 33.895% | 149787 | 9.467 |
| EXPLOIT_FOLD_NO_WINDOW | ALWAYS_CALL | 0.000% | 33.246% | 3.222% | 9.691% | 27.652% | 0 | 9.387 |
| EXPLOIT_FOLD_NO_WINDOW | SELECTIVE_FOLD_V1 | 18.105% | 33.237% | 3.219% | 9.685% | 31.006% | 144576 | 9.628 |

Fold frequency divides by the tested agent's responses to Raises. Opponent Raise frequency divides by its first-actor opportunities. A weak/bluff Raise is operationally a hard opening total 12-16; it is an analysis label, not information supplied to the other strategy. Bluff frequency is weak Raises divided by first-actor opportunities; fraction of Raises is also shown. Called-round wins count only tested-agent Calls and include draws in the denominator. Points conceded are total actual engine deltas, one per Fold. Histories include only public actions, never these analytical classifications. Full per-seed metrics and counts are in JSON.

## Known-window exploitability

The NO_WINDOW diagnostic shares EXPLOIT_FOLD's Hit/Stand and always-Call response; only its targeted bluff boost is disabled. This isolates the change in opponent match wins attributable to that boost, without treating SMART_BASELINE's different response policy as a control. These are paired matches with common seeds and both seats. No hidden current opponent total is inspected.

| Contrast | Opponent win gain | Paired 95% CI |
| --- | --- | --- |
| Window boost vs no boost, against SELECTIVE | -0.500 pp | -0.553 pp to -0.447 pp |
| Window boost vs no boost, against ALWAYS_CALL | -1.467 pp | -1.517 pp to -1.416 pp |

SELECTIVE relative to ALWAYS_CALL against EXPLOIT_FOLD: 0.380 pp (0.317 pp to 0.443 pp). Against the no-window control: 1.347 pp (1.293 pp to 1.401 pp). Opponent gain from changing its own strategy is a separate question from SELECTIVE versus ALWAYS_CALL facing the same opponent.

## Findings and recommendation

- fixed pool: SELECTIVE delta **0.859 pp**, 95% CI 0.823 pp to 0.896 pp; 5/5 positive seeds; worst 0.825 pp, best 0.878 pp.
- adaptive pool: SELECTIVE delta **1.099 pp**, 95% CI 1.048 pp to 1.150 pp; 5/5 positive seeds; worst 1.022 pp, best 1.185 pp.
- combined pool: SELECTIVE delta **0.979 pp**, 95% CI 0.939 pp to 1.019 pp; 5/5 positive seeds; worst 0.923 pp, best 1.031 pp.
- fixed opponent types: 4/4 positive point estimates; 4/4 strictly positive intervals. Pool averages do not imply a win against every opponent type.
- adaptive opponent types: 4/4 positive point estimates; 4/4 strictly positive intervals. Pool averages do not imply a win against every opponent type.
- Held-out fixed-pool advantage is positive with an interval excluding zero. Adaptive-pool advantage also has a positive interval excluding zero.
- Known-window opponent does not demonstrate a positive-interval gain from the bluff boost against SELECTIVE. SELECTIVE still beats ALWAYS_CALL against this opponent.
- These tests measure robustness to these documented heuristics, not a solved best response or equilibrium. Exploitability here means losing relative to ALWAYS_CALL against the known-window opponent; an opponent improving its own results is reported separately.
- Keep production Raise/Fold scoring and race-to-seven unchanged. Selective Fold has measured situational value, but a fixed hand/upcard rule should not be taught as a universal prescription. Leave the pattern emergent for now; any later guidance should explain opponent Raise tendencies and score context. Validate a score- and opponent-aware frozen response rule on another independent holdout before considering balance changes.

## Methods and limitations

All realized match-seed cohorts checked disjoint from each other and from prior ablation/balance cohorts. All seeds and policy/opponent definitions are retained in JSON. Common seed/seat pairs couple card and agent RNG streams, while adaptation and Fold legitimately change subsequent state and decisions. Pooled intervals concatenate independent seed cohorts and average equal-weight opponent outcomes within each paired-seat cluster; they retain within-seed opponent covariance. Normal paired-cluster 95% intervals quantify simulation sampling error, not human behavior, model correctness or equilibrium uncertainty. Per-seed signs and worst/best effects are reported because pooling can hide instability. There are only five cohort replications; no thresholds were adjusted after inspection. Adaptation is within a match, not learning across a session; short matches limit history, especially the >=3-response policies. Known-policy bluffing is a stress test, not omniscient play. No production behavior changed.

Reproduce: `npm run simulate:fold-validation -- --matches 100000`.
