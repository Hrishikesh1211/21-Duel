# Visual identity pass

The approved navigation, screen hierarchy, gameplay, mode definitions, social flows, cosmetics ownership and review behavior are preserved. No packages were added. Texture was skipped to keep rendering simple and predictable.

## Palette and surfaces

`src/components/theme.ts` defines semantic colors, shared typography, surfaces and state treatments. Existing palette aliases remain available to cosmetics and animation consumers.

- Background: deep charcoal `#101316`.
- Surface 1 / 2 / 3: `#181D22`, `#202830`, `#2B3640`.
- Primary / secondary / muted text: `#F0EEE8`, `#BAC1C6`, `#969FA7`.
- Player: steel `#B3C8D8` over `#243440`, with an active border.
- Danger / defeat: muted crimson `#CF9398` over oxblood `#38252B`.
- Mirror / system: silver `#C0CCD5` over cool charcoal `#1C252E`.
- Progression: muted brass `#C9BA98`.
- Victory: subdued green `#A6BCAF`.

Sections, interactive previews and selected areas now use distinct tones. Thin edge rules provide framing; there are no gradients, blur or shadows. Shared text/state contrast checks range from 5.55:1 to 10.62:1.

## Screens

- Home: framed player identity, stronger rating typography, lifted mode section, steel framed Play and compact brass progression.
- Modes: opposing Duel geometry with restrained oxblood linework; balanced silver Mirror geometry. Selection adds thicker framing and a lifted surface alongside the existing CURRENT MODE label.
- Profile: rating hero, ruled stat cells, structured match rows with explicit W/L/D and semantic outcome colors, and framed loadout rows.
- Gameplay: steel active states, silver thinking/locked states, oxblood raised/urgent states, warm 21, green round wins and muted red losses. Raise uses oxblood, Call uses steel, Fold uses a subdued ruled surface and Pass remains quiet. Labels remain explicit; decision timing and logic are unchanged.
- Shop / Friends: catalog surfaces, premium preview framing, collectible brass labels and ruled social rows using the same palette.
- Match Review: cool factual summary framing and restrained decision surfaces, without behavior or content changes.
- Post Match / Casual Result / ranked rules: primary controls use steel surfaces; ranked results use explicit victory/defeat treatment and brass progression.
- Navigation: existing selected tabs gain a thin active rule.

## Validation

- TypeScript: passed (`npm run typecheck`).
- ESLint: passed (`npm run lint`).
- All 224 tests: passed, zero failures (`node --test --test-isolation=none tests/*.test.cjs`). The normal runner compiled the engine and presentation test modules; Windows denied its isolated test subprocesses, so the same complete test suite ran without process isolation.
- iOS Hermes export: passed (`npx expo export --platform ios --output-dir .expo/visual-pass-ios`), 1,535 modules, 3.6 MB HBC bundle.
- UI test adapter now loads the real centralized theme instead of an empty palette mock. Existing behavioral assertions are unchanged.

Visual review uses the actual app in Chromium at small (375 ? 667) and tall (430 ? 932) iPhone viewport sizes. This checks responsive web rendering; it is not an iOS simulator/device rendering check. Gameplay and post-match screens are reached through normal controls, without injected game state. Captures and the browser error log live in `.expo/visual-review.json` and `.expo/visual-*.png`. Profile loadout and Mirror selection were also checked after scrolling.

## Files changed

- `App.tsx`
- `src/components/theme.ts`
- `src/components/ActionBar.tsx`
- `src/components/PlayerCard.tsx`
- `src/components/ModeGeometry.tsx`
- `src/components/PlayerArea.tsx`
- `src/components/RoundResult.tsx`
- `src/components/CosmeticPreview.tsx`
- `src/screens/HomeScreen.tsx`
- `src/screens/ModesScreen.tsx`
- `src/screens/ProfileScreen.tsx`
- `src/screens/GameTable.tsx`
- `src/screens/PostMatchScreen.tsx`
- `src/screens/ShopScreen.tsx`
- `src/screens/SocialScreen.tsx`
- `src/screens/MatchReviewScreen.tsx`
- `src/screens/RankedFairPlayScreen.tsx`
- `src/screens/CasualResultScreen.tsx`
- `tests/ui-contract.test.cjs`
