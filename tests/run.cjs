const { execFileSync } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
execFileSync(process.execPath, [
  require.resolve('typescript/bin/tsc'),
  '--ignoreConfig', '--target', 'ES2020', '--module', 'commonjs',
  '--moduleResolution', 'node', '--ignoreDeprecations', '6.0',
  '--strict', '--skipLibCheck', '--outDir', '.expo/game-tests',
  'src/game/engine.ts',
], { cwd: root, stdio: 'inherit' });
execFileSync(process.execPath, [
  require.resolve('typescript/bin/tsc'),
  '--ignoreConfig', '--target', 'ES2020', '--module', 'commonjs',
  '--moduleResolution', 'node', '--ignoreDeprecations', '6.0',
  '--strict', '--skipLibCheck', '--rootDir', 'src', '--outDir', '.expo/presentation-tests',
  'src/presentation/TableController.ts', 'src/presentation/MatchmakingController.ts', 'src/competitive/session.ts', 'src/competitive/rankView.ts', 'src/presentation/handLayout.ts', 'src/presentation/fairPlay.ts', 'src/presentation/knockPlacement.ts', 'src/presentation/comicWords.ts', 'src/simulation/series.ts', 'src/simulation/foldPolicies.ts', 'src/simulation/foldMetrics.ts', 'src/simulation/foldCounterfactual.ts', 'src/simulation/foldValidation.ts', 'src/review/format.ts',
], { cwd: root, stdio: 'inherit' });
execFileSync(process.execPath, ['--test', 'tests/modes.test.cjs', 'tests/raiseFold.test.cjs', 'tests/game.test.cjs', 'tests/presentation.test.cjs', 'tests/matchmaking.test.cjs', 'tests/competitive.test.cjs', 'tests/knockPlacement.test.cjs', 'tests/comicWords.test.cjs', 'tests/rank.test.cjs', 'tests/handLayout.test.cjs', 'tests/ui-contract.test.cjs', 'tests/ranked.test.cjs', 'tests/fairPlay.test.cjs', 'tests/simulation.test.cjs', 'tests/fold-ablation.test.cjs', 'tests/fold-validation.test.cjs', 'tests/review.test.cjs'], { cwd: root, stdio: 'inherit' });





