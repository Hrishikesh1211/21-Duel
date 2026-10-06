const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { divisionFor } = require('../.expo/presentation-tests/competitive/session');
const { rankView } = require('../.expo/presentation-tests/competitive/rankView');
const { handLayout } = require('../.expo/presentation-tests/presentation/handLayout');
const player = rating => ({ name: 'ALVIN', rating, ...divisionFor(rating), wins: 25, losses: 18 });
// Render component elements with native host/hook adapters; no device APIs or animations.
function load(file, extra = {}) {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const fade = { duration: () => fade, withInitialValues: () => fade };
  const mocks = {
    react: { ...React, useEffect: () => {}, useRef: value => ({ current: value }), useState: value => [typeof value === 'function' ? value() : value, () => {}], useCallback: fn => fn },
    'react-native': { View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView', StyleSheet: { create: x => x }, useWindowDimensions: () => ({ width: 393, height: 852, fontScale: 1 }) },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView', useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) },
    'react-native-reanimated': { __esModule: true, default: { View: 'AnimatedView', Text: 'AnimatedText' }, FadeIn: fade, FadeOut: fade, FadeInDown: fade, ZoomIn: fade, Keyframe: class { duration() { return this; } }, useReducedMotion: () => true, useSharedValue: value => ({ value }), useAnimatedStyle: fn => fn() },
    ...extra,
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', output)(name => {
    if (name in mocks) return mocks[name];
    if (name === 'react/jsx-runtime') return require(name);
    if (name.endsWith('/rankView')) return { rankView };
    if (name.endsWith('/handLayout')) return { handLayout };
    if (name.endsWith('/tableLayout')) return { tableLayout: load('src/presentation/tableLayout.ts').tableLayout };
    if (name.endsWith('/rulesConfig')) return require('../.expo/presentation-tests/game/rulesConfig');
    if (name.endsWith('/review/format')) return require('../.expo/presentation-tests/review/format');
    if (name.endsWith('/theme')) return load('src/components/theme.ts');
    if (name.endsWith('/localProfile')) return load('src/data/localProfile.ts');
    if (name.endsWith('/CosmeticContext')) return { CosmeticProvider: 'CosmeticProvider', useEquippedCosmetic: slot => load('src/data/cosmetics.ts').getEquippedCosmetic({},slot) };
    if (name.endsWith('/friends')) return load('src/data/friends.ts');
    if (name.endsWith('/challenges')) return require('../.expo/presentation-tests/social/challenges');
    if (name.endsWith('/cosmetics')) return load('src/data/cosmetics.ts');
    if (name.endsWith('/localSeason')) return { localSeason: { label: 'SEASON 01', mockGlobalPosition: 18492 } };
    return new Proxy({}, { get: (_, key) => key === '__esModule' ? false : key === 'motion' ? { gestureStagger: 270 } : String(key) });
  }, module, module.exports);
  return module.exports;
}
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...nodes(tree.props?.children)];
}
function text(tree) {
  if (Array.isArray(tree)) return tree.map(text).join(' ');
  if (tree == null || typeof tree === 'boolean') return '';
  return typeof tree === 'object' ? text(tree.props?.children) : String(tree);
}
test('GameTable receives opponent 1511 independently of player 1482 and passes it to the rendered header', () => {
  const opponent = { name: 'MASON', rating: 1511, division: 'SILVER II', wins: 31, losses: 22 };
  const game = { human: { hand: [], status: 'playing' }, bot: { hand: [], status: 'playing' }, score: { human: 0, bot: 0 }, phase: 'playing', humanCount: 0 };
  const GameTable = load('src/screens/GameTable.tsx', {
    '../presentation/useGamePresentation': { useGamePresentation: () => ({ view: game }) },
    '../presentation/TableController': { visibleBotCards: () => [] },
  }).default;
  const tree = GameTable({ opponent, onExit: () => {} });
  const area = nodes(tree).find(node => node.type === 'PlayerArea' && node.props.opponent);
  assert.equal(player(1482).rating, 1482);
  assert.equal(area.props.competitor.rating, 1511);
  const PlayerArea = load('src/components/PlayerArea.tsx').PlayerArea;
  const header = PlayerArea(area.props);
  assert.match(text(header), /MASON.*1511/);
  assert.doesNotMatch(text(header), /1482/);
});
test('Home, Rank, Matchmaking and PostMatch render the updated session rating', () => {
  for (const rating of [1496, 1485]) {
    const updated = player(rating);
    const Home = load('src/screens/HomeScreen.tsx').default;
    const Rank = load('src/screens/RankScreen.tsx').default;
    const Matchmaking = load('src/screens/MatchmakingScreen.tsx').default;
    const PostMatch = load('src/screens/PostMatchScreen.tsx').default;
    assert.equal(nodes(Home({ player: updated, selectedMode:'ranked_duel' })).find(n=>n.props?.player===updated).props.player.rating,rating);
    assert.equal(nodes(Rank({ player: updated })).find(n => n.props?.testID === 'rank-rating').props.children, rating);
    const identity = nodes(Matchmaking({ player: updated })).find(n => typeof n.type === 'function' && n.props.player === updated);
    assert.match(text(identity.type(identity.props)), new RegExp(String(rating)));
    assert.match(text(PostMatch({ player: updated, result: { matchId: 1, oldRating: 1496, newRating: rating, ratingDelta: -11, outcome: 'loss', oldDivision: 'SILVER II' } })), new RegExp(`${rating} +/ +1520`));
  }
});



test('table explicitly forwards Ranked mode while preserving Casual default', () => {
  const modes = [];
  const game = { human: { hand: [], status: 'playing' }, bot: { hand: [], status: 'playing' }, score: { human: 0, bot: 0 }, phase: 'playing', humanCount: 0 };
  const GameTable = load('src/screens/GameTable.tsx', {
    '../presentation/useGamePresentation': { useGamePresentation: mode => { modes.push(mode); return { view: game }; } },
    '../presentation/TableController': { visibleBotCards: () => [] },
  }).default;
  GameTable({ opponent: player(1511), onExit: () => {} });
  GameTable({ mode: 'ranked', opponent: player(1511), onExit: () => {} });
  assert.deepEqual(modes, ['casual', 'ranked']);
});

test('Fair Play is one compact explanation with one acknowledgment and cancel', () => {
  const Screen = load('src/screens/RankedFairPlayScreen.tsx').default;
  let acknowledged = 0, cancelled = 0;
  const tree = Screen({ onContinue: () => acknowledged++, onCancel: () => cancelled++ });
  assert.match(text(tree), /SWAPPED OPENINGS/);
  assert.match(text(tree), /MIRRORED DRAWS/);
  assert.match(text(tree), /LOCKED REVEAL/);
  const buttons = nodes(tree).filter(n => n.props?.accessibilityRole === 'button');
  assert.equal(buttons.length, 2);
  buttons[0].props.onPress(); buttons[1].props.onPress();
  assert.equal(acknowledged, 1); assert.equal(cancelled, 1);
});

test('pre-round controls are exclusive and human Fold hides cards and totals', () => {
  for (const [phase, actor, labels] of [
    ['preRaiseDecision', 'human', ['RAISE','PASS']],
    ['waitingForRaiseResponse', 'human', ['CALL','FOLD']],
    ['waitingForRaiseResponse', 'bot', []],
  ]) {
    const game = { human: { hand: [{ rank: 'K', suit: 'hearts' }], status: 'playing' }, bot: { hand: [], status: 'playing' }, score: { human: 0, bot: 0 }, phase, decisionActor: actor, roundValue: 2, seconds: 3, humanCount: 1 };
    const Table = load('src/screens/GameTable.tsx', {
      '../presentation/useGamePresentation': { useGamePresentation: () => ({ view: game }) },
      '../presentation/TableController': { visibleBotCards: () => [] },
    }).default;
    const tree = Table({ mode: 'ranked_classic', opponent: player(1511), onExit: () => {} });
    assert.deepEqual(nodes(tree).filter(n => n.type === 'Action').map(n => n.props.label), labels);
    assert.ok(!nodes(tree).some(n => n.type === 'ActionBar'));
    game.phase = 'round-complete'; game.folded = 'human'; game.humanTotal = null;
    const folded = Table({ mode: 'ranked_classic', opponent: player(1511), onExit: () => {} });
    const area = nodes(folded).find(n => n.type === 'PlayerArea' && !n.props.opponent);
    assert.deepEqual(area.props.cards, [null]); assert.equal(area.props.total, null);
  }
});
test('classic rules explain shared deck and Raise/Fold without fairness claims', () => {
  const Screen = load('src/screens/RankedFairPlayScreen.tsx').default;
  const copy = text(Screen({ classic: true, onContinue: () => {}, onCancel: () => {} }));
  assert.match(copy, /Shared deck/); assert.match(copy, /RAISE OR PASS/); assert.match(copy, /CALL OR FOLD/);
  assert.doesNotMatch(copy, /MIRRORED|SWAPPED/);
});

test('Raise/Fold emphasis names the actor and preserves primary/secondary actions', () => {
  for (const [phase, actor, value, expected, primary, secondary] of [
    ['preRaiseDecision', 'human', 1, 'YOUR MOVE', 'RAISE', 'PASS'],
    ['waitingForRaiseResponse', 'bot', 2, 'MASON IS DECIDING', null, null],
    ['waitingForRaiseResponse', 'human', 2, 'MASON RAISED', 'CALL', 'FOLD'],
  ]) {
    const game = { human: { hand: [], status: 'playing' }, bot: { hand: [], status: 'playing' }, score: { human: 0, bot: 0 }, phase, decisionActor: actor, roundValue: value, seconds: 9, humanCount: 0, busy: false };
    const Table = load('src/screens/GameTable.tsx', {
      '../presentation/useGamePresentation': { useGamePresentation: () => ({ view: game }) },
      '../presentation/TableController': { visibleBotCards: () => [] },
    }).default;
    const render = () => Table({ mode: 'ranked_classic', opponent: { ...player(1511), name: 'Mason' }, onExit: () => {} });
    const tree = render(); assert.ok(text(tree).includes(expected));
    assert.equal(nodes(tree).find(n => n.props?.accessibilityLabel === `Round value ${value}`).props.accessible, true);
    const actions = nodes(tree).filter(n => n.type === 'Action');
    if (primary) {
      assert.equal(actions[0].props.label, primary); assert.equal(actions[0].props.primary, true);
      assert.equal(actions[1].props.label, secondary); assert.equal(actions[1].props.secondary, true); assert.equal(actions[1].props.disabled, false);
    } else assert.equal(actions.length, 0);
    const timer = nodes(tree).find(n => n.props?.testID === 'raise-fold-timer');
    const width = timer.props.style[0].width;
    assert.equal(timer.props.children, 9);
    game.seconds = 3;
    const low = nodes(render()).find(n => n.props?.testID === 'raise-fold-timer');
    assert.equal(low.props.style[0].width, width); assert.ok(low.props.style[1]);
    assert.equal(low.props.accessibilityLabel, '3 seconds remaining');
  }
});
test('Fold copy names the opponent and stays terse', () => {
  const Result = load('src/components/RoundResult.tsx').RoundResult;
  assert.equal(text(Result({ result: 'human', winner: null, folded: 'bot', opponentName: 'Mason' })), 'MASON FOLDED');
  assert.equal(text(Result({ result: 'bot', winner: null, folded: 'human', opponentName: 'Mason' })), 'FOLDED');
});

test('normal Classic play clears the entire pre-round layer and uses seven-point target', () => {
  const game = { human: { hand: [], status: 'playing' }, bot: { hand: [], status: 'playing' }, score: { human: 2, bot: 4 }, phase: 'playing', humanCount: 0, roundValue: 2, raiseLabel: '', strategicTransition: null };
  const Table = load('src/screens/GameTable.tsx', {
    '../presentation/useGamePresentation': { useGamePresentation: () => ({ view: game }) },
    '../presentation/TableController': { visibleBotCards: () => [] },
  }).default;
  const tree = Table({ mode: 'ranked_classic', opponent: player(1511), onExit: () => {} });
  assert.match(text(tree), /FIRST TO\s+7/);
  assert.ok(nodes(tree).some(n => n.type === 'ActionBar'));
  assert.ok(!nodes(tree).some(n => ['center-round-value','raise-fold-timer','raise-fold-decision'].includes(n.props?.testID)));
  assert.doesNotMatch(text(tree), /RAISED|CALLED|VALUE/);
  assert.equal(nodes(tree).find(n => n.type === 'PlayerArea').props.target, 7);
});
test('match completion hands actual 8�5 points to PostMatch without clamping', () => {
  let effect, complete; const queued = []; const savedTimeout = global.setTimeout;
  const game = { human: { hand: [], status: 'standing' }, bot: { hand: [], status: 'standing' }, score: { human: 8, bot: 5 }, phase: 'match-complete', humanCount: 0, winner: 'human' };
  const Table = load('src/screens/GameTable.tsx', {
    react: { ...React, useEffect: callback => { effect = callback; } },
    '../presentation/useGamePresentation': { useGamePresentation: () => ({ view: game }) },
    '../presentation/TableController': { visibleBotCards: () => [] },
  }).default;
  Table({ mode: 'ranked_classic', opponent: player(1511), onExit: () => {}, onMatchComplete: result => { complete = result; } });
  try {
    global.setTimeout = callback => { queued.push(callback); return 0; }; const cleanup = effect(); queued[0](); cleanup();
  } finally { global.setTimeout = savedTimeout; }
  assert.deepEqual(complete, { outcome: 'win', playerRounds: 8, opponentRounds: 5 });
  const PostMatch = load('src/screens/PostMatchScreen.tsx').default;
  assert.match(text(PostMatch({ player: player(1496), result: { ...complete, matchId: 1, newRating: 1496, oldRating: 1482, ratingDelta: 14, oldDivision: 'SILVER II' } })), /8.*5/);
});
test('center value occupies reserved result slot; short Classic table scrolls clear of fixed controls', () => {
  for (const [width,height,count] of [[320,568,2],[375,667,8],[393,852,2],[430,932,12]]) {
    const hand = Array.from({ length: count }, () => ({ rank: '2', suit: 'hearts' }));
    const game = { human: { hand, status: 'playing' }, bot: { hand: [], status: 'playing' }, score: { human: 0, bot: 0 }, phase: 'preRaiseDecision', decisionActor: 'human', humanCount: count, roundValue: 1, seconds: 9 };
    const native = { View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView', StyleSheet: { create: x => x }, useWindowDimensions: () => ({ width,height,fontScale: 1 }) };
    const Table = load('src/screens/GameTable.tsx', {
      'react-native': native,
      '../presentation/useGamePresentation': { useGamePresentation: () => ({ view: game }) },
      '../presentation/TableController': { visibleBotCards: () => [] },
    }).default;
    const tree = Table({ mode: 'ranked_classic', opponent: { ...player(1511), name: 'Mason' }, onExit: () => {} });
    const surface = nodes(tree).find(n => n.props?.testID === 'game-surface');
    assert.equal(surface.type, height < 660 ? 'ScrollView' : 'View');
    const resultSlot = nodes(tree).find(n => n.props?.testID === 'round-result');
    assert.ok(nodes(resultSlot).some(n => n.props?.testID === 'center-round-value'));
    const controls = nodes(tree).find(n => n.props?.testID === 'game-controls');
    assert.ok(!nodes(surface).includes(controls)); assert.ok(!nodes(controls).some(n => n.props?.testID === 'center-round-value'));
    const playerArea = nodes(tree).find(n => n.type === 'PlayerArea' && !n.props.opponent);
    const area = load('src/components/PlayerArea.tsx').PlayerArea(playerArea.props);
    const cardScroll = nodes(area).find(n => n.type === 'ScrollView'); assert.equal(cardScroll.props.horizontal, true);
    assert.equal(cardScroll.props.contentContainerStyle.flexGrow, 1);
    assert.ok(playerArea.props.availableWidth <= width - 40);
  }
});

test('two-point score settle is stronger than the normal one-point settle', () => {
  const animation = { duration: duration => ({ withInitialValues: initial => ({ duration, initial }) }) };
  const Board = load('src/components/Scoreboard.tsx', {
    'react-native-reanimated': { __esModule: true, default: { Text: 'AnimatedText' }, FadeInDown: animation },
  }).Scoreboard;
  for (const [delta,duration,slide] of [[1,220,4],[2,300,7]]) {
    const tree = Board({ human: 4, bot: 2, humanStatus: 'playing', botStatus: 'playing', scoreDelta: { human: delta, bot: 0 }, deciding: 'human' });
    const number = nodes(tree).find(n => n.key === 'human-4');
    assert.equal(number.props.entering.duration, duration); assert.equal(number.props.entering.initial.transform[0].translateY, slide);
    assert.equal(nodes(tree).find(n => n.type === 'DuelLine' && !n.props.opponent).props.deciding, true);
    assert.equal(nodes(tree).find(n => n.type === 'DuelLine' && n.props.opponent).props.deciding, false);
    assert.ok(nodes(tree)[0].props.accessibilityLabel.startsWith('Match points.'));
  }
});

test('Modes selects either identity without launching and offers Play for the current mode', () => {
  for (const category of ['ranked','casual']) for (const identity of ['duel','mirror']) {
    let state, selected='ranked_duel', plays=0;
    const ref={current:false};
    const Screen=load('src/screens/ModesScreen.tsx',{
      react:{...React,useState:initial=>[state??(typeof initial==='function'?initial():initial),value=>{state=value;}],useRef:()=>ref},
      'expo-haptics':{impactAsync:()=>Promise.resolve(),ImpactFeedbackStyle:{Light:'light'}},
    }).default;
    const render=()=>Screen({selected,onSelect:id=>{selected=id;},onPlay:()=>plays++});
    let tree=render();
    const tabs=()=>nodes(tree).filter(n=>n.props?.accessibilityRole==='tab');
    assert.equal(tabs()[0].props.accessibilityState.selected,true);
    if(category==='casual'){tabs()[1].props.onPress();tree=render();}
    const button=nodes(tree).find(n=>n.props?.accessibilityRole==='button'&&n.props.accessibilityLabel.startsWith(category+' '+identity+'.'));
    button.props.onPress();tree=render();
    assert.equal(selected,category+'_'+identity);assert.equal(plays,0);
    assert.equal(nodes(tree).find(n=>n.props?.accessibilityLabel===button.props.accessibilityLabel).props.accessibilityState.selected,true);
    const play=nodes(tree).find(n=>n.props?.accessibilityLabel==='Play '+category.toUpperCase()+' '+identity.toUpperCase());
    play.props.onPress();play.props.onPress();assert.equal(plays,1);
  }
});
test('Modes reopens on the category of the retained selection',()=>{
  const Screen=load('src/screens/ModesScreen.tsx',{'expo-haptics':{impactAsync:()=>Promise.resolve(),ImpactFeedbackStyle:{Light:'light'}}}).default;
  const tree=Screen({selected:'casual_mirror',onSelect:()=>{},onPlay:()=>{}});
  assert.equal(nodes(tree).find(n=>n.props?.accessibilityRole==='tab'&&text(n)==='CASUAL').props.accessibilityState.selected,true);
});
test('Home has one Play action for each selected mode and no old menu rows',()=>{
  const {MODE_LIST}=require('../.expo/presentation-tests/game/rulesConfig');
  for(const mode of MODE_LIST){
    let plays=0,modes=0,profiles=0;
    const Home=load('src/screens/HomeScreen.tsx',{'expo-haptics':{impactAsync:()=>Promise.resolve(),ImpactFeedbackStyle:{Light:'light'}}}).default;
    const tree=Home({player:player(1482),selectedMode:mode.id,onPlay:()=>plays++,onModes:()=>modes++,onProfile:()=>profiles++});
    assert.equal(nodes(tree).find(n=>n.props?.testID==='home-current-mode').props.children,mode.name);
    const buttons=nodes(tree).filter(n=>n.props?.accessibilityRole==='button');
    buttons.find(n=>n.props.accessibilityLabel==='Play '+mode.name).props.onPress();
    buttons.find(n=>n.props.accessibilityLabel==='Change mode').props.onPress();
    buttons.find(n=>n.props.accessibilityLabel==='Open player profile').props.onPress();
    assert.deepEqual([plays,modes,profiles],[1,1,1]);
    assert.match(text(tree),new RegExp('FIRST TO '+mode.targetScore));
    assert.doesNotMatch(text(tree),/FRIENDS|Explore all modes|CURRENT SEASON/);
  }
});
test('matchmaking and rules copy are derived from the selected mode', () => {
  const {MODE_LIST}=require('../.expo/presentation-tests/game/rulesConfig');
  const Search=load('src/screens/MatchmakingScreen.tsx').default;
  const Rules=load('src/screens/RankedFairPlayScreen.tsx').default;
  for(const mode of MODE_LIST){
    assert.ok(text(Search({mode:mode.id,player:player(1482),onRules:()=>{},onCancel:()=>{},onComplete:()=>{}})).includes(mode.name));
    const copy=text(Rules({mode:mode.id,onContinue:()=>{},onCancel:()=>{}}));
    assert.match(copy,new RegExp(`First to +${mode.targetScore} +points`));
    assert.equal(copy.includes('RAISE OR PASS'),mode.raiseFoldEnabled);
    assert.equal(copy.includes('SWAPPED OPENINGS'),mode.deckModel==='mirrored');
    assert.equal(copy.includes('NO RATING PRESSURE'),!mode.ratingEnabled);
  }
});
test('Casual result shows actual score and mode with no ranked rating flow', () => {
  const Result=load('src/screens/CasualResultScreen.tsx').default;
  let home=0,rematch=0;
  const tree=Result({result:{mode:'casual_mirror',outcome:'win',playerRounds:3,opponentRounds:1},onHome:()=>home++,onRematch:()=>rematch++});
  assert.match(text(tree),/CASUAL MIRROR/); assert.match(text(tree),/VICTORY/);
  assert.ok(nodes(tree).some(n=>n.props?.accessibilityLabel==='Final points. You 3, opponent 1'));
  assert.doesNotMatch(text(tree),/RATING|DIVISION|PROMOT/);
  nodes(tree).filter(n=>n.props?.accessibilityRole==='button').forEach(n=>n.props.onPress()); assert.equal(home,1); assert.equal(rematch,1);
});

function appHarness(){
  const slots=[]; let cursor=0;
  let route;
  const useState=initial=>{const index=cursor++;if(!Object.hasOwn(slots,index))slots[index]=typeof initial==='function'?initial():initial;return[slots[index],value=>{slots[index]=typeof value==='function'?value(slots[index]):value;}];};
  const useReducer=(reduce,initial)=>{const index=cursor++;if(!Object.hasOwn(slots,index))slots[index]=initial;return[slots[index],action=>{slots[index]=reduce(slots[index],action);}];};
  const screens=Object.fromEntries(['ModesScreen','CasualResultScreen','RankedFairPlayScreen','PostMatchScreen','MatchmakingScreen','GameTable','HomeScreen','ShopScreen','ProfileScreen','CosmeticSelector','FriendsScreen','FriendProfileScreen','ChallengeModeScreen','IncomingChallengeScreen'].map(name=>[`./src/screens/${name}`,{__esModule:true,default:name}]));
  const Root=load('App.tsx',{
    ...screens,
    react:{...React,useState,useReducer,useCallback:fn=>fn,useEffect:()=>{}},
    'expo-router': {useRouter:()=>({canGoBack:()=>false,push:value=>{route=value;}})},
    './src/review/history':require('../.expo/presentation-tests/review/history'),
    './src/presentation/SessionContext':{useSession:()=>{const [session,dispatch]=useReducer(require('../.expo/presentation-tests/competitive/session').competitiveReducer,{...load('src/data/localProfile.ts').localProfileSeed,player:{...player(1482),...load('src/data/cosmetics.ts').defaultCosmetics},activeMatchId:null,nextMatchId:1,result:null});return{session,dispatch};}},
    './src/competitive/session':require('../.expo/presentation-tests/competitive/session'),
    './src/presentation/fairPlay':require('../.expo/presentation-tests/presentation/fairPlay'),
    './src/data/localPlayer':{localPlayer:{...player(1482),...load('src/data/cosmetics.ts').defaultCosmetics}},
    './src/data/competitor':{localOpponent:{...player(1511),name:'MASON'}},
  }).default;
  const local=nodes(Root()).find(n=>typeof n.type==='function').type;
  const render=()=>{cursor=0;return local().props.children;};
  render.route=()=>route;
  return render;
}
test('all four selected modes persist through App matchmaking, game, result and rematch',()=>{
  const {MODE_LIST}=require('../.expo/presentation-tests/game/rulesConfig');
  for(const mode of MODE_LIST){
    const render=appHarness();
    let tree=render(); nodes(tree).find(n=>n.type==='HomeScreen').props.onModes();
    tree=render(); const selector=nodes(tree).find(n=>n.type==='ModesScreen'); selector.props.onSelect(mode.id);
    tree=render(); assert.equal(nodes(tree).find(n=>n.type==='ModesScreen').props.selected,mode.id); nodes(tree).find(n=>n.type==='ModesScreen').props.onPlay();
    tree=render();
    if(mode.category==='ranked'){assert.equal(tree.type,'RankedFairPlayScreen');assert.equal(tree.props.mode,mode.id);tree.props.onContinue();tree=render();}
    assert.equal(tree.type,'MatchmakingScreen');assert.equal(tree.props.mode,mode.id);
    tree.props.onComplete({name:'MASON',rating:1511});tree=render();
    const table=nodes(tree).find(n=>n.type==='GameTable');assert.equal(table.props.mode,mode.id);
    table.props.onMatchComplete({outcome:'win',playerRounds:mode.targetScore,opponentRounds:1});tree=render();
    assert.equal(tree.type,mode.ratingEnabled?'PostMatchScreen':'CasualResultScreen');assert.equal(tree.props.result.mode,mode.id);
    tree.props.onRematch();tree=render();assert.equal(tree.type,'MatchmakingScreen');assert.equal(tree.props.mode,mode.id);
    tree.props.onCancel();tree=render();const home=nodes(tree).find(n=>n.type==='HomeScreen');assert.equal(home.props.player.rating,mode.ratingEnabled?1496:1482);
    home.props.onPlay();tree=render();if(tree.type==='RankedFairPlayScreen'){tree.props.onContinue();tree=render();}
    assert.equal(tree.type,'MatchmakingScreen');assert.equal(tree.props.mode,mode.id);
  }
});
test('Casual can reopen its own rules without changing selected mode or entering ranked results',()=>{
  const render=appHarness();nodes(render()).find(n=>n.type==='HomeScreen').props.onModes();
  nodes(render()).find(n=>n.type==='ModesScreen').props.onSelect('casual_duel');
  nodes(render()).find(n=>n.type==='ModesScreen').props.onPlay();
  let tree=render();assert.equal(tree.props.mode,'casual_duel');tree.props.onRules();
  tree=render();assert.equal(tree.type,'RankedFairPlayScreen');assert.equal(tree.props.mode,'casual_duel');tree.props.onContinue();
  tree=render();assert.equal(tree.type,'MatchmakingScreen');assert.equal(tree.props.mode,'casual_duel');
});

test('Rank screen derives progress and moves the current ladder marker across session boundaries', () => {
  const Rank = load('src/screens/RankScreen.tsx').default;
  for (const rating of [0,1399,1400,1519,1520,1640,2000]) {
    // Ignore stale division metadata: the authoritative rating determines presentation.
    const updated = {...player(1482),rating};
    const view = rankView(updated);
    const tree = Rank({player:updated});
    assert.equal(nodes(tree).find(n=>n.props?.testID==='rank-division').props.children,divisionFor(rating).division);
    const current = nodes(tree).filter(n=>n.props?.testID==='rank-current-step');
    assert.equal(current.length,1);
    assert.ok(text(current[0]).includes(view.division));
    const progress = nodes(tree).find(n=>n.props?.testID==='rank-progress');
    assert.equal(progress.props.accessibilityValue.now,Math.round(view.progress*100));
    if(view.next) {
      assert.ok(text(tree).includes(rating+' / '+view.next.min));
      assert.ok(text(tree).includes(view.remaining+' TO ADVANCE'));
    } else {
      assert.ok(text(tree).includes('LADDER COMPLETE'));
      assert.ok(!text(tree).includes('TO ADVANCE'));
    }
    assert.match(text(tree),/#\s*18,492/);
  }
});

test('Profile receives the current session after a ranked win and shell navigation preserves it', () => {
  const render=appHarness();
  let tree=render();
  nodes(tree).find(n=>n.type==='HomeScreen').props.onPlay();
  tree=render();
  if(tree.type==='RankedFairPlayScreen'){tree.props.onContinue();tree=render();}
  tree.props.onComplete({name:'MASON',rating:1511});tree=render();
  nodes(tree).find(n=>n.type==='GameTable').props.onMatchComplete({outcome:'win',playerRounds:7,opponentRounds:1});
  tree=render();
  const updated=tree.props.player;
  assert.equal(updated.rating,1496);
  tree.props.onHome();tree=render();
  const tab=name=>nodes(tree).find(n=>n.props?.accessibilityRole==='tab'&&text(n)===name);
  tab('PROFILE').props.onPress();tree=render();
  assert.equal(tab('PROFILE').props.accessibilityState.selected,true);
  assert.deepEqual(nodes(tree).find(n=>n.type==='ProfileScreen').props.player,updated);
  tab('PROFILE').props.onPress();tree=render();
  assert.equal(tab('PROFILE').props.accessibilityState.selected,true);
  tab('HOME').props.onPress();tree=render();
  assert.deepEqual(nodes(tree).find(n=>n.type==='HomeScreen').props.player,updated);
  tab('PROFILE').props.onPress();tree=render();
  assert.deepEqual(nodes(tree).find(n=>n.type==='ProfileScreen').props.player,updated);
});

test('Player Card renders either competitor without owning navigation or relying on session-only fields',()=>{
  const {PlayerCard}=load('src/components/PlayerCard.tsx');
  for(const competitor of [player(1482),{...player(1511),name:'MASON'}]){
    const tree=PlayerCard({player:competitor});
    assert.equal(tree.props.testID,'player-card');
    assert.match(tree.props.accessibilityLabel,new RegExp(competitor.name+', '+competitor.rating));
    assert.ok(text(tree).includes(competitor.name));
    assert.ok(text(tree).includes(String(competitor.rating)));
    assert.ok(text(tree).includes('DUEL STANDARD'));
  }
});
test('Shop lists twelve local cosmetic options and Profile retains its dossier',()=>{
  const Shop=load('src/screens/ShopScreen.tsx').default;
  const shop=Shop({player:player(1482),onOpenCosmetics:()=>{}});
  for(const category of ['PLAYER CARDS','CARD BACKS','ACTION STYLES','21 EFFECTS'])assert.ok(text(shop).includes(category));
  assert.equal(nodes(shop).filter(n=>n.props?.accessibilityRole==='button').length,12);
  const Profile=load('src/screens/ProfileScreen.tsx').default;
  const profile=Profile({player:player(1496)});
  assert.equal(nodes(profile).find(n=>n.props?.testID==='profile-rating').props.children,1496);
  for(const section of ['COMPETITIVE','STATS','MATCH HISTORY','LOADOUT'])assert.ok(text(profile).includes(section));
});
test('Shell has exactly four destinations and retains a selected Casual mode across tab changes and cancel',()=>{
  const render=appHarness();
  let tree=render();
  const tab=name=>nodes(tree).find(n=>n.props?.accessibilityRole==='tab'&&text(n)===name);
  assert.deepEqual(nodes(tree).filter(n=>n.props?.accessibilityRole==='tab').map(text),['HOME','MODES','SHOP','PROFILE']);
  assert.equal(nodes(tree).find(n=>n.type==='HomeScreen').props.selectedMode,'ranked_duel');
  tab('MODES').props.onPress();tree=render();
  nodes(tree).find(n=>n.type==='ModesScreen').props.onSelect('casual_mirror');tree=render();
  assert.equal(nodes(tree).find(n=>n.type==='ModesScreen').props.selected,'casual_mirror');
  tab('SHOP').props.onPress();tree=render();assert.ok(nodes(tree).some(n=>n.type==='ShopScreen'));
  tab('PROFILE').props.onPress();tree=render();assert.ok(nodes(tree).some(n=>n.type==='ProfileScreen'));
  tab('HOME').props.onPress();tree=render();
  const home=nodes(tree).find(n=>n.type==='HomeScreen');
  assert.equal(home.props.selectedMode,'casual_mirror');home.props.onPlay();tree=render();
  assert.equal(tree.type,'MatchmakingScreen');assert.equal(tree.props.mode,'casual_mirror');
  tree.props.onCancel();tree=render();
  assert.equal(nodes(tree).find(n=>n.type==='HomeScreen').props.selectedMode,'casual_mirror');
});
test('Default cosmetic identity survives rating updates, result settlement and abandonment',()=>{
  const {defaultCosmetics}=load('src/data/cosmetics.ts');
  const {competitiveReducer}=require('../.expo/presentation-tests/competitive/session');
  let session={player:{...player(1482),...defaultCosmetics},activeMatchId:null,nextMatchId:1,result:null};
  session=competitiveReducer(session,{type:'start',mode:'ranked_duel'});
  session=competitiveReducer(session,{type:'finish',matchId:session.activeMatchId,match:{outcome:'win',playerRounds:7,opponentRounds:1}});
  session=competitiveReducer(session,{type:'abandon'});
  for(const [key,id] of Object.entries(defaultCosmetics))assert.equal(session.player[key],id);
  assert.equal(session.player.rating,1496);
});

test('Modes bottom label and Play follow centralized category and identity for all four combinations',()=>{
  const {MODE_LIST}=require('../.expo/presentation-tests/game/rulesConfig');
  const Screen=load('src/screens/ModesScreen.tsx',{'expo-haptics':{impactAsync:()=>Promise.resolve(),ImpactFeedbackStyle:{Light:'light'}}}).default;
  for(const identity of ['duel','mirror']){
    const app=appHarness();
    nodes(app()).find(n=>n.type==='HomeScreen').props.onModes();
    const screen=()=>Screen(nodes(app()).find(n=>n.type==='ModesScreen').props);
    const selectMode=id=>nodes(app()).find(n=>n.type==='ModesScreen').props.onSelect(id);
    selectMode('ranked_'+identity);
    for(const category of ['ranked','casual','ranked']){
      let tree=screen();
      nodes(tree).find(n=>n.props?.accessibilityRole==='tab'&&text(n)===category.toUpperCase()).props.onPress();
      tree=screen();
      const config=MODE_LIST.find(mode=>mode.id===category+'_'+identity);
      assert.equal(nodes(app()).find(n=>n.type==='ModesScreen').props.selected,config.id);
      assert.equal(nodes(tree).find(n=>n.props?.testID==='modes-selected-label').props.children,config.name);
      assert.equal(nodes(tree).find(n=>n.props?.accessibilityRole==='tab'&&text(n)===category.toUpperCase()).props.accessibilityState.selected,true);
      assert.ok(nodes(tree).some(n=>n.props?.accessibilityLabel==='Play '+config.name));
      assert.equal(nodes(tree).filter(n=>n.props?.accessibilityRole==='button'&&n.props?.accessibilityState?.selected).length,1);
    }
    // An external change to the central selection also updates the tab and footer.
    selectMode('casual_'+(identity==='duel'?'mirror':'duel'));
    const config=MODE_LIST.find(mode=>mode.id===nodes(app()).find(n=>n.type==='ModesScreen').props.selected);
    assert.equal(nodes(screen()).find(n=>n.props?.testID==='modes-selected-label').props.children,config.name);
    nodes(screen()).find(n=>n.props?.accessibilityLabel==='Play '+config.name).props.onPress();
    const match=app();
    assert.equal(match.type,'MatchmakingScreen');
    assert.equal(match.props.mode,config.id);
  }
});

test('Profile v1 derives record, win rate, competitive progress and peak from the current session',()=>{
  const Profile=load('src/screens/ProfileScreen.tsx').default;
  for(const [wins,losses,rate] of [[24,17,59],[0,0,0],[1,3,25],[3,0,100]]){
    const updated={...player(1527),wins,losses};
    const tree=Profile({player:updated,peakRating:1511});
    assert.equal(text(nodes(tree).find(n=>n.props?.testID==='profile-win-rate')).replace(/\s/g,''),rate+'%');
    assert.equal(nodes(tree).find(n=>n.props?.testID==='profile-peak').props.children,1527);
    assert.equal(text(nodes(tree).find(n=>n.props?.testID==='profile-record')).replace(/\s+/g,' '),wins+' W / '+losses+' L');
    assert.equal(nodes(tree).find(n=>n.props?.testID==='profile-matches').props.children,wins+losses);
    assert.equal(nodes(tree).find(n=>n.props?.testID==='profile-progress').props.accessibilityValue.now,Math.round(rankView(updated).progress*100));
    assert.ok(text(tree).includes('113 TO ADVANCE'));
    assert.ok(text(tree).includes('SILVER I'));
  }
  const top=Profile({player:player(2000),peakRating:2100});
  assert.equal(nodes(top).find(n=>n.props?.testID==='profile-peak').props.children,2100);
  assert.ok(text(top).includes('TOP OF LOCAL LADDER'));
  assert.ok(!text(top).includes('TO ADVANCE'));
});
test('Profile v1 shows five recent matches, hides Casual deltas and resolves every equipped cosmetic',()=>{
  const Profile=load('src/screens/ProfileScreen.tsx').default;
  const {sampleRecentMatches,samplePlayStyleStats}=load('src/data/localProfile.ts');
  const {defaultCosmetics,equippedCosmetics}=load('src/data/cosmetics.ts');
  const history=[...sampleRecentMatches,{...sampleRecentMatches[0],id:'sixth'}];
  const tree=Profile({player:{...player(1482),...defaultCosmetics},recentMatches:history,rankedMatchCount:44});
  assert.equal(nodes(tree).find(n=>n.props?.testID==='profile-matches').props.children,44);
  assert.equal(nodes(tree).filter(n=>n.props?.testID?.startsWith('profile-match-')).length,5);
  assert.equal(nodes(tree).find(n=>n.props?.testID==='profile-delta-sample-5').props.children,'+14');
  assert.equal(nodes(tree).find(n=>n.props?.testID==='profile-delta-sample-4').props.children,'-11');
  assert.equal(nodes(tree).find(n=>n.props?.testID==='profile-delta-sample-3').props.children,'\u2014');
  for(const {label,item} of equippedCosmetics(defaultCosmetics)){
    assert.ok(nodes(tree).some(n=>n.props?.accessibilityLabel===label+', '+item.name+', equipped'));
  }
  for(const stat of samplePlayStyleStats)assert.ok(text(tree).includes(stat.label));
  assert.doesNotMatch(text(tree), /SAMPLE/);
  assert.ok(nodes(tree).filter(n=>n.props?.testID?.startsWith('profile-match-')).every(n=>!n.props.accessibilityLabel.includes('sample')));
});
test('Profile v1 receives a newly completed match and live metrics through App without changing Home data',()=>{
  const render=appHarness();
  nodes(render()).find(n=>n.type==='HomeScreen').props.onPlay();
  let tree=render();
  if(tree.type==='RankedFairPlayScreen'){tree.props.onContinue();tree=render();}
  tree.props.onComplete({name:'JUNE',rating:1511});tree=render();
  nodes(tree).find(n=>n.type==='GameTable').props.onMatchComplete({outcome:'win',playerRounds:7,opponentRounds:5});
  tree=render();tree.props.onHome();tree=render();
  const home=nodes(tree).find(n=>n.type==='HomeScreen');
  nodes(tree).find(n=>n.props?.accessibilityRole==='tab'&&text(n)==='PROFILE').props.onPress();
  tree=render();
  const profile=nodes(tree).find(n=>n.type==='ProfileScreen');
  assert.deepEqual(profile.props.player,home.props.player);
  assert.equal(profile.props.peakRating,1511);
  assert.equal(profile.props.rankedMatchCount,42);
  assert.equal(profile.props.recentMatches.length,5);
  assert.equal(profile.props.recentMatches[0].opponentName,'JUNE');
  assert.equal(profile.props.recentMatches[0].ratingDelta,14);
  assert.equal(profile.props.recentMatches[0].source,'session');
  assert.ok(profile.props.recentMatches[0].timestamp>0);
});
test('Profile loadout opens shared selection with equipped identity',()=>{
 const Profile=load('src/screens/ProfileScreen.tsx').default;let opened;
 const equipped={...player(1482),...load('src/data/cosmetics.ts').defaultCosmetics,cardBackId:'mirror-mark'};
 const tree=Profile({player:equipped,onOpenCosmetics:(...args)=>opened=args});
 nodes(tree).find(n=>n.props?.accessibilityLabel==='CARD BACK, Mirror Mark, equipped').props.onPress();
 assert.deepEqual(opened,['cardBackId','mirror-mark']);assert.equal(equipped.cardBackId,'mirror-mark');
});

for (const [slot,id] of [['playerCardId','night-signal'],['cardBackId','split-axis'],['actionStyleId','minimal'],['twentyOneEffectId','precision']]) {
 test(`equip ${slot} changes only the centralized loadout field`,()=>{
  const {competitiveReducer}=require('../.expo/presentation-tests/competitive/session');
  const {defaultCosmetics}=load('src/data/cosmetics.ts');
  const initial={player:{...player(1482),...defaultCosmetics},activeMatchId:null,nextMatchId:1,result:null};
  const updated=competitiveReducer(initial,{type:'equip',slot,id});
  assert.equal(updated.player[slot],id);
  const expected={...initial.player,[slot]:id};assert.deepEqual(updated.player,expected);
  assert.equal(initial.player[slot],defaultCosmetics[slot]);
  const abandoned=competitiveReducer(updated,{type:'abandon'});assert.equal(abandoned.player[slot],id);
 });
}
test('unknown and wrong-category cosmetic IDs safely resolve each slot default',()=>{
 const {getCosmetic,getEquippedCosmetic,loadoutSlots,defaultCosmetics}=load('src/data/cosmetics.ts');
 for(const {field} of loadoutSlots){assert.equal(getCosmetic('missing',field).id,defaultCosmetics[field]);assert.equal(getEquippedCosmetic({[field]:'missing'},field).id,defaultCosmetics[field]);}
 assert.equal(getCosmetic('minimal','cardBackId').id,'steel-lines');
 const {competitiveReducer}=require('../.expo/presentation-tests/competitive/session');
 const state={player:{...player(1482),...defaultCosmetics},activeMatchId:null,nextMatchId:1,result:null};
 assert.equal(competitiveReducer(state,{type:'equip',slot:'cardBackId',id:'minimal'}).player.cardBackId,'steel-lines');
});
test('Home PlayerCard and matchmaking resolve equipped player geometry',()=>{
 const equipped={...player(1482),playerCardId:'night-signal'};
 const Home=load('src/screens/HomeScreen.tsx').default;
 const homeCard=nodes(Home({player:equipped,selectedMode:'ranked_duel'})).find(n=>n.type==='PlayerCard');
 const Card=load('src/components/PlayerCard.tsx').PlayerCard;const card=Card(homeCard.props);
 assert.match(text(card),/NIGHT SIGNAL/);
 const visual=nodes(card).find(n=>n.type==='CosmeticGeometry').props.config;
 assert.equal(visual.background,'#15191D');
 const Matchmaking=load('src/screens/MatchmakingScreen.tsx').default;
 const identity=nodes(Matchmaking({player:equipped})).find(n=>typeof n.type==='function'&&n.props.player===equipped);
 assert.deepEqual(nodes(identity.type(identity.props)).find(n=>n.type==='CosmeticGeometry').props.config,visual);
});
test('gameplay card backs use equipped configuration and preserve face cards',()=>{
 const cosmetics=load('src/data/cosmetics.ts');
 for(const id of ['steel-lines','split-axis','mirror-mark']){
 const config=cosmetics.getCosmetic(id).visual;
 const PlayingCard=load('src/components/PlayingCard.tsx',{'../presentation/CosmeticContext':{useEquippedCosmetic:()=>({visual:config})}}).PlayingCard;
 const tree=PlayingCard({card:{rank:'K',suit:'spades'},width:82});
 const surfaces=nodes(tree).filter(n=>typeof n.type==='function');
 const back=surfaces.find(n=>n.props.card===null);assert.equal(back.props.backConfig,config);
 assert.equal(nodes(back.type(back.props)).find(n=>n.type==='CardBackArtwork').props.config,config);
 const face=surfaces.find(n=>n.props.card);assert.match(text(face.type(face.props)),/K/);
 assert.ok(!nodes(face.type(face.props)).some(n=>n.type==='CardBackArtwork'));
 }
});
test('action style routes Signature, Ink Knock and Minimal without changing its clock',()=>{
 const cosmetics=load('src/data/cosmetics.ts');
 for(const id of ['signature','ink-knock','minimal']){
 const visual=cosmetics.getCosmetic(id).visual;
 const Effect=load('src/components/ActionComicEffect.tsx',{'../presentation/CosmeticContext':{useEquippedCosmetic:()=>({visual})},'../presentation/knockPlacement':{chooseKnockPosition:()=>0,knockPlacement:()=>({left:0,top:0,rotation:0})},'../presentation/comicWords':{chooseHitWord:()=> 'KNOCK'}}).ActionComicEffect;
 const progress={value:0.5};const tree=Effect({opponent:false,availableWidth:300,progress,duration:950,reduced:false});
 assert.equal(progress.value,0.5);
 if(id==='minimal')assert.equal(tree,null);else assert.equal(nodes(tree).find(n=>n.type==='ActionLettering').props.config,visual);
 }
});
test('exact 21 routes all three marks and decorative timings with reduced motion',()=>{
 const cosmetics=load('src/data/cosmetics.ts');
 for(const id of ['twenty-one-standard','precision','line-break']){
 const visual=cosmetics.getCosmetic(id).visual;const clocks=[];
 const animated={__esModule:true,default:{View:'AnimatedView',Text:'AnimatedText'},FadeIn:{duration:()=>({})},useReducedMotion:()=>false,useSharedValue:value=>({value}),useAnimatedStyle:fn=>fn(),withTiming:(value,options)=>{clocks.push(options.duration);return value;},withDelay:(ms,value)=>{clocks.push(ms);return value;},withSequence:(...values)=>values.at(-1),cancelAnimation:()=>{}};
 const Effect=load('src/components/TwentyOneEffect.tsx',{'../presentation/CosmeticContext':{useEquippedCosmetic:()=>({visual})},'react-native-reanimated':animated,react:{...React,useEffect:fn=>fn()}}).TwentyOneEffect;
 const tree=Effect({total:21,textStyle:{}});assert.equal(tree.props.accessibilityLabel,'Your total 21');assert.equal(nodes(tree).find(n=>n.type==='CosmeticMark').props.config,visual);
 assert.deepEqual(clocks,[visual.open,visual.close,visual.hold]);
 animated.useReducedMotion=()=>true;clocks.length=0;Effect({total:21,textStyle:{}});assert.deepEqual(clocks,[]);
 }
});
test('Shop and Profile equip through the same selector and immediately update Home',()=>{
 const render=appHarness();let tree=render();
 nodes(tree).find(n=>n.props?.accessibilityRole==='tab'&&text(n)==='SHOP').props.onPress();tree=render();
 nodes(tree).find(n=>n.type==='ShopScreen').props.onOpenCosmetics('playerCardId','mirror-frame');tree=render();assert.equal(tree.type,'CosmeticSelector');
 tree.props.onEquip('playerCardId','mirror-frame');tree=render();assert.equal(tree.props.player.playerCardId,'mirror-frame');tree.props.onClose();tree=render();
 nodes(tree).find(n=>n.props?.accessibilityRole==='tab'&&text(n)==='PROFILE').props.onPress();tree=render();
 const profile=nodes(tree).find(n=>n.type==='ProfileScreen');assert.equal(profile.props.player.playerCardId,'mirror-frame');profile.props.onOpenCosmetics('cardBackId');tree=render();assert.equal(tree.type,'CosmeticSelector');tree.props.onEquip('cardBackId','mirror-mark');tree.props.onClose();tree=render();
 nodes(tree).find(n=>n.props?.accessibilityRole==='tab'&&text(n)==='HOME').props.onPress();tree=render();const home=nodes(tree).find(n=>n.type==='HomeScreen');assert.equal(home.props.player.cardBackId,'mirror-mark');assert.equal(home.props.player.playerCardId,'mirror-frame');
 const fresh=appHarness()();assert.equal(nodes(fresh).find(n=>n.type==='HomeScreen').props.player.playerCardId,'duel-standard');assert.equal(load('src/data/cosmetics.ts').getEquippedCosmetic(nodes(fresh).find(n=>n.type==='HomeScreen').props.player,'playerCardId').id,'duel-standard');
});
test('shared selector equips once, reports equipped state and provides light haptic',()=>{
 const cosmetics=load('src/data/cosmetics.ts');let selected='night-signal',equips=[],haptics=[];
 const Selector=load('src/screens/CosmeticSelector.tsx',{react:{...React,useState:()=>[selected,id=>selected=id]},'expo-haptics':{ImpactFeedbackStyle:{Light:'light'},impactAsync:style=>{haptics.push(style);return Promise.resolve();}}}).default;
 const props={player:{...player(1482),...cosmetics.defaultCosmetics},slot:'playerCardId',onEquip:(...args)=>equips.push(args),onClose:()=>{}};
 let tree=Selector(props);nodes(tree).find(n=>text(n)==='EQUIP'&&n.props?.accessibilityRole==='button').props.onPress();assert.deepEqual(equips,[['playerCardId','night-signal']]);assert.deepEqual(haptics,['light']);
 props.player.playerCardId='night-signal';tree=Selector(props);assert.ok(nodes(tree).some(n=>n.props?.disabled&&text(n)==='EQUIPPED'));
});
test('21 cosmetic digit travel remains balanced for local and opponent totals',()=>{
 for(const id of ['twenty-one-standard','precision','line-break'])for(const opponent of [false,true]){
 const visual=load('src/data/cosmetics.ts').getCosmetic(id).visual;
 const Effect=load('src/components/TwentyOneEffect.tsx',{'../presentation/CosmeticContext':{useEquippedCosmetic:()=>({visual})},'react-native-reanimated':{__esModule:true,default:{View:'AnimatedView',Text:'AnimatedText'},useReducedMotion:()=>false,useSharedValue:()=>({value:1}),useAnimatedStyle:fn=>fn()}}).TwentyOneEffect;
 const digits=nodes(Effect({total:21,opponent,textStyle:{}})).filter(n=>n.type==='AnimatedText');
 const distance=visual.separation*(opponent ? 7/11 : 1);assert.equal(digits[0].props.style[1].transform[0].translateX,-distance);assert.equal(digits[1].props.style[1].transform[0].translateX,distance);
 }
});
test('generic matchmaking shared deck explicitly retains its neutral default back',()=>{
 const Deck=load('src/components/MatchmakingDeck.tsx').MatchmakingDeck;
 const tree=Deck({searching:true});
 assert.equal(tree.props.accessibilityLabel,'Shared deck being prepared');
 assert.deepEqual(nodes(tree).find(n=>n.type==='PlayingCard').props.backConfig,load('src/data/cosmetics.ts').getCosmetic('steel-lines').visual);
});

test('Profile Friends row opens the dedicated list without adding a tab',()=>{
 const render=appHarness();let tree=render();nodes(tree).find(n=>n.props?.accessibilityRole==='tab'&&text(n)==='PROFILE').props.onPress();tree=render();
 const profile=nodes(tree).find(n=>n.type==='ProfileScreen');assert.equal(profile.props.friendCount,3);
 const Screen=load('src/screens/ProfileScreen.tsx').default;
 nodes(Screen(profile.props)).find(n=>n.props?.accessibilityLabel==='View friends, 3 friends').props.onPress();tree=render();assert.equal(tree.type,'FriendsScreen');tree.props.onBack();tree=render();assert.ok(nodes(tree).some(n=>n.type==='ProfileScreen'));
 assert.deepEqual(nodes(tree).filter(n=>n.props?.accessibilityRole==='tab').map(text),['HOME','MODES','SHOP','PROFILE']);
});
test('Friends list renders central identities, cosmetics and mock availability',()=>{
 const Friends=load('src/screens/FriendsScreen.tsx').default;let selected;
 const tree=Friends({onBack:()=>{},onFriend:id=>selected=id,onMockIncoming:()=>{}});
 const friends=load('src/data/friends.ts').mockFriends;const rows=nodes(tree).filter(n=>n.props?.accessibilityLabel?.startsWith('View '));assert.equal(rows.length,friends.length);
 for(const friend of friends){const row=rows.find(n=>n.props.accessibilityLabel.includes(friend.name));assert.ok(text(row).includes(String(friend.rating)));row.props.onPress();assert.equal(selected,friend.id);assert.deepEqual(nodes(row).find(n=>n.type==='CosmeticGeometry').props.config,load('src/data/cosmetics.ts').getEquippedCosmetic(friend,'playerCardId').visual);}
 assert.ok(text(tree).includes('3 FRIENDS'));
 assert.doesNotMatch(text(tree),/LOCAL PROTOTYPE|LOCAL TEST|PREVIEW INCOMING CHALLENGE/);
});
test('online friend can challenge and offline friend cannot invoke a challenge',()=>{
 const Screen=load('src/screens/FriendProfileScreen.tsx').default;let challenged=0;
 for(const friend of load('src/data/friends.ts').mockFriends){const tree=Screen({friend,onBack:()=>{},onChallenge:()=>challenged++});const action=nodes(tree).find(n=>n.props?.accessibilityRole==='button');assert.equal(action.props.disabled,!friend.online);if(friend.online)action.props.onPress();else{assert.equal(action.props.onPress,undefined);assert.equal(text(action),'OFFLINE');}}
 assert.equal(challenged,2);
 const {createFriendChallenge}=require('../.expo/presentation-tests/social/challenges');assert.equal(createFriendChallenge('june','ranked_duel'),null);assert.equal(createFriendChallenge('missing','casual_duel'),null);
});
test('challenge chooser derives four mode descriptions and targets from shared configuration',()=>{
 const Screen=load('src/screens/ChallengeModeScreen.tsx').default;const friend=load('src/data/friends.ts').getFriend('mason');let mode;
 const tree=Screen({friend,onBack:()=>{},onSelect:id=>mode=id});const buttons=nodes(tree).filter(n=>n.props?.accessibilityRole==='button');const {MODE_LIST}=require('../.expo/presentation-tests/game/rulesConfig');assert.equal(buttons.length,4);
 for(const config of MODE_LIST){const button=buttons.find(n=>n.props.accessibilityLabel.endsWith(config.name));assert.match(text(button),new RegExp(`FIRST TO ${config.targetScore}`));assert.ok(text(button).includes(config.description));button.props.onPress();assert.equal(mode,config.id);}
});
function navigateFriend(render,id='nova'){
 let tree=render();nodes(tree).find(n=>n.props?.accessibilityRole==='tab'&&text(n)==='PROFILE').props.onPress();tree=render();nodes(tree).find(n=>n.type==='ProfileScreen').props.onFriends();tree=render();tree.props.onFriend(id);return render();
}
for(const mode of ['ranked_duel','ranked_mirror','casual_duel','casual_mirror'])test(`friend ${mode} retains opponent, cosmetics and rules through game, result and rematch`,()=>{
 const render=appHarness();let tree=navigateFriend(render);assert.equal(tree.type,'FriendProfileScreen');assert.equal(tree.props.friend.id,'nova');tree.props.onChallenge();tree=render();assert.equal(tree.type,'ChallengeModeScreen');tree.props.onSelect(mode);tree=render();
 if(tree.type==='RankedFairPlayScreen'){assert.equal(tree.props.mode,mode);tree.props.onContinue();tree=render();}
 assert.equal(tree.type,'MatchmakingScreen');assert.equal(tree.props.mode,mode);assert.equal(tree.props.friend.id,'nova');assert.equal(tree.props.friend.playerCardId,'mirror-frame');tree.props.onComplete(tree.props.friend);tree=render();
 const game=nodes(tree).find(n=>n.type==='GameTable');assert.equal(game.props.opponent.name,'NOVA');assert.equal(game.props.mode,mode);
 const {modeConfig}=require('../.expo/presentation-tests/game/rulesConfig');const config=modeConfig(mode);assert.equal(config.raiseFoldEnabled,config.category==='ranked');assert.equal(config.deckModel,mode.endsWith('mirror')?'mirrored':'shared');
 game.props.onMatchComplete({outcome:'win',playerRounds:config.targetScore,opponentRounds:1});tree=render();assert.equal(tree.type,config.ratingEnabled?'PostMatchScreen':'CasualResultScreen');
 if(config.ratingEnabled){assert.equal(tree.props.player.rating,1496);assert.equal(tree.props.result.ratingDelta,14);}const result=tree;
 game.props.onMatchComplete({outcome:'win',playerRounds:config.targetScore,opponentRounds:1});tree=render();if(config.ratingEnabled)assert.equal(tree.props.player.rating,1496);
 result.props.onRematch();tree=render();assert.equal(tree.type,'MatchmakingScreen');assert.equal(tree.props.friend.id,'nova');assert.equal(tree.props.mode,mode);
 tree.props.onComplete(tree.props.friend);tree=render();assert.equal(nodes(tree).find(n=>n.type==='GameTable').props.opponent.name,'NOVA');
});
test('offline challenge is guarded by local navigation as well as disabled presentation',()=>{
 const render=appHarness();let tree=navigateFriend(render,'june');tree.props.onChallenge();tree=render();assert.equal(tree.type,'FriendProfileScreen');assert.equal(tree.props.friend.online,false);
});
test('random rematch retains matchmaking and clears prior friend match context',()=>{
 const render=appHarness();let tree=navigateFriend(render);tree.props.onChallenge();tree=render();tree.props.onSelect('casual_duel');tree=render();tree.props.onComplete(tree.props.friend);tree=render();nodes(tree).find(n=>n.type==='GameTable').props.onMatchComplete({outcome:'win',playerRounds:3,opponentRounds:1});tree=render();tree.props.onHome();tree=render();
 nodes(tree).find(n=>n.type==='HomeScreen').props.onPlay();tree=render();if(tree.type==='RankedFairPlayScreen'){tree.props.onContinue();tree=render();}
 assert.equal(tree.props.friend,undefined);tree.props.onComplete({...player(1511),name:'MASON'});tree=render();nodes(tree).find(n=>n.type==='GameTable').props.onMatchComplete({outcome:'win',playerRounds:7,opponentRounds:1});tree=render();tree.props.onRematch();tree=render();assert.equal(tree.type,'MatchmakingScreen');assert.equal(tree.props.friend,undefined);
});
test('local incoming challenge accepts known friend and decline returns cleanly to Friends',()=>{
 for(const accept of [false,true]){const render=appHarness();let tree=navigateFriend(render);tree.props.onBack();tree=render();tree.props.onMockIncoming();tree=render();assert.equal(tree.type,'IncomingChallengeScreen');assert.equal(tree.props.challenge.source,'friend-incoming');
 const Screen=load('src/screens/IncomingChallengeScreen.tsx').default;const rendered=Screen(tree.props);assert.match(text(rendered),/RANKED DUEL/);assert.match(text(rendered),/FIRST TO 7/);
 nodes(rendered).find(n=>n.props?.accessibilityRole==='button'&&text(n)===(accept?'ACCEPT':'DECLINE')).props.onPress();tree=render();if(!accept){assert.equal(tree.type,'FriendsScreen');tree.props.onMockIncoming();assert.equal(render().type,'IncomingChallengeScreen');}else{if(tree.type==='RankedFairPlayScreen'){tree.props.onContinue();tree=render();}assert.equal(tree.type,'MatchmakingScreen');assert.equal(tree.props.friend.id,'mason');assert.equal(tree.props.mode,'ranked_duel');}}
});
test('friend intro renders both actual cosmetic identities with compact PlayerCards',()=>{
 const Screen=load('src/screens/MatchmakingScreen.tsx').default;const friend=load('src/data/friends.ts').getFriend('nova');const local={...player(1482),playerCardId:'night-signal'};
 const tree=Screen({player:local,friend,mode:'casual_mirror',onRules:()=>{},onCancel:()=>{},onComplete:()=>{}});assert.equal(tree.props.testID,'friend-match-intro');const cards=nodes(tree).filter(n=>n.type==='PlayerCard');assert.equal(cards.length,2);assert.equal(cards[0].props.player,local);assert.equal(cards[1].props.player,friend);assert.ok(cards.every(n=>n.props.compact));
 const Card=load('src/components/PlayerCard.tsx').PlayerCard;assert.match(text(Card(cards[0].props)),/NIGHT SIGNAL/);assert.match(text(Card(cards[1].props)),/MIRROR FRAME/);
});
test('central friend rating policy can disable ranked rating without altering game rules',()=>{
 const {challengeRatingEnabled,createFriendChallenge}=require('../.expo/presentation-tests/social/challenges');const {competitiveReducer}=require('../.expo/presentation-tests/competitive/session');const challenge=createFriendChallenge('mason','ranked_mirror');assert.equal(challengeRatingEnabled('ranked_mirror',challenge),true);assert.equal(challengeRatingEnabled('ranked_mirror',challenge,false),false);assert.equal(challengeRatingEnabled('casual_duel',challenge),false);assert.equal(challengeRatingEnabled('ranked_duel',undefined,false),true);
 const initial={player:{...player(1482),...load('src/data/cosmetics.ts').defaultCosmetics},activeMatchId:null,nextMatchId:1,result:null};let state=competitiveReducer(initial,{type:'start',mode:challenge.modeId,challenge});assert.equal(state.activeRatingEnabled,true);
 state={...state,activeRatingEnabled:false};const finish={type:'finish',matchId:1,opponentName:'MASON',match:{outcome:'win',playerRounds:7,opponentRounds:1}};const completed=competitiveReducer(state,finish);assert.equal(completed.player.rating,1482);assert.equal(completed.casualResult.mode,'ranked_mirror');assert.equal(completed.recentMatches[0].ratingDelta,undefined);assert.equal(competitiveReducer(completed,finish),completed);
});

test('incoming challenge control is hidden normally and available only with explicit development flag',()=>{
 const Friends=load('src/screens/FriendsScreen.tsx').default;let incoming=0;
 const props={onBack:()=>{},onFriend:()=>{},onMockIncoming:()=>incoming++};
 for(const flag of [undefined,false,true]){const tree=Friends({...props,showDevelopmentControls:flag});const trigger=nodes(tree).find(n=>n.props?.accessibilityRole==='button'&&text(n)==='SIMULATE INCOMING CHALLENGE');assert.equal(!!trigger,flag===true);if(trigger)trigger.props.onPress();}
 assert.equal(incoming,1);
});
test('Profile lists all four equipped categories from catalog without development copy',()=>{
 const Profile=load('src/screens/ProfileScreen.tsx').default;const {equippedCosmetics}=load('src/data/cosmetics.ts');
 const equipped={...player(1482),playerCardId:'night-signal',cardBackId:'mirror-mark',actionStyleId:'minimal',twentyOneEffectId:'precision'};
 const tree=Profile({player:equipped,recentMatches:load('src/data/localProfile.ts').sampleRecentMatches});
 const rows=nodes(tree).filter(n=>n.props?.accessibilityHint==='Choose and equip a cosmetic');assert.equal(rows.length,4);
 assert.deepEqual(equippedCosmetics(equipped).map(c=>c.label),['PLAYER CARD','CARD BACK','ACTION STYLE','21 EFFECT']);
 for(const {label,item} of equippedCosmetics(equipped))assert.ok(rows.some(n=>n.props.accessibilityLabel===`${label}, ${item.name}, equipped`));
 assert.doesNotMatch(text(tree),/SAMPLE|LOCAL PROTOTYPE|LOCAL TEST/);
});
function reviewedResult(mode='casual_duel'){
 const {createMatch,decisionSequence,newRound,raiseActor,raiseDecision}=require('../.expo/presentation-tests/game/engine');const {handTotal}=require('../.expo/presentation-tests/game/hand');const {MatchHistoryRecorder}=require('../.expo/presentation-tests/review/history');let game=createMatch(()=>.5,mode);const recorder=new MatchHistoryRecorder(game);
 while(game.phase!=='match-complete'){
  const actor=raiseActor(game);if(actor){const action=game.phase==='preRaiseDecision'?'pass':'call';recorder.preAction(actor,action);game=raiseDecision(game,actor,action);continue;}
  for(const frame of decisionSequence(game,handTotal(game.human.hand)<17?'hit':'stand')){recorder.frame(game,frame);game=frame;}
  if(game.phase!=='playing'){recorder.finishRound(game,true);if(game.phase==='round-complete'){game=newRound(game,()=>.5);recorder.startRound(game);}}
 }
 return{outcome:game.winner==='human'?'win':'loss',playerRounds:game.score.human,opponentRounds:game.score.bot,roundHistory:recorder.rounds()};
}

test('all four modes finish without opening Review and allow immediate Rematch or Home with a retained review',()=>{
 for(const mode of ['ranked_duel','ranked_mirror','casual_duel','casual_mirror'])for(const action of ['onRematch','onHome']){
  const render=appHarness();let tree=render();nodes(tree).find(n=>n.type==='HomeScreen').props.onModes();tree=render();nodes(tree).find(n=>n.type==='ModesScreen').props.onSelect(mode);tree=render();nodes(tree).find(n=>n.type==='ModesScreen').props.onPlay();tree=render();if(tree.type==='RankedFairPlayScreen'){tree.props.onContinue();tree=render();}tree.props.onComplete({name:'MASON',rating:1511});tree=render();nodes(tree).find(n=>n.type==='GameTable').props.onMatchComplete(reviewedResult(mode));tree=render();
  assert.equal(tree.type,mode.startsWith('ranked')?'PostMatchScreen':'CasualResultScreen');assert.equal(typeof tree.props.onReview,'function');assert.equal(render.route(),undefined);
  tree.props[action]();tree=render();assert.equal(render.route(),undefined);
  if(action==='onRematch'){assert.equal(tree.type,'MatchmakingScreen');assert.equal(tree.props.mode,mode);tree.props.onCancel();tree=render();}
  assert.ok(nodes(tree).some(n=>n.type==='HomeScreen'));assert.equal(render.route(),undefined);
 }
});

test('result buttons call Rematch and Home independently without invoking Review',()=>{
 for(const screen of ['PostMatchScreen','CasualResultScreen']){
  let rematches=0,homes=0,reviews=0;const Component=load(`src/screens/${screen}.tsx`).default;
  const tree=Component({player:player(1496),result:{...reviewedResult(),mode:'casual_duel',matchId:1,oldRating:1482,newRating:1496,ratingDelta:14,oldDivision:'SILVER II'},onRematch:()=>rematches++,onHome:()=>homes++,onReview:()=>reviews++});
  assert.equal(reviews,0);const buttons=nodes(tree).filter(n=>n.props?.accessibilityRole==='button');buttons.find(n=>text(n)==='REMATCH').props.onPress();buttons.find(n=>text(n)==='HOME').props.onPress();assert.equal(rematches,1);assert.equal(homes,1);assert.equal(reviews,0);
 }
});
test('PostMatch and Casual result keep Rematch primary with Review between Rematch and Home',()=>{for(const screen of ['PostMatchScreen','CasualResultScreen']){let reviewed=0;const Component=load(`src/screens/${screen}.tsx`).default;const result={...reviewedResult(),mode:'casual_duel',matchId:1,oldRating:1482,newRating:1496,ratingDelta:14,oldDivision:'SILVER II'};const tree=Component({player:player(1496),result,onRematch:()=>{},onHome:()=>{},onReview:()=>reviewed++});const buttons=nodes(tree).filter(n=>n.props?.accessibilityRole==='button');assert.deepEqual(buttons.map(text),['REMATCH','REVIEW MATCH','HOME']);buttons[1].props.onPress();assert.equal(reviewed,1);}});
test('result Review and retained Profile history navigate to the same route without reapplying ratings; rematch clears current result',()=>{const render=appHarness();let tree=render();nodes(tree).find(n=>n.type==='HomeScreen').props.onModes();tree=render();const selector=nodes(tree).find(n=>n.type==='ModesScreen');selector.props.onSelect('casual_duel');tree=render();nodes(tree).find(n=>n.type==='ModesScreen').props.onPlay();tree=render();tree.props.onComplete({name:'MASON',rating:1511});tree=render();const result=reviewedResult();nodes(tree).find(n=>n.type==='GameTable').props.onMatchComplete(result);tree=render();assert.equal(tree.type,'CasualResultScreen');tree.props.onReview();assert.deepEqual(render.route(),{pathname:'/review/[id]',params:{id:'local-1'}});assert.equal(render().props.result.playerRounds,result.playerRounds);tree.props.onRematch();tree=render();assert.equal(tree.type,'MatchmakingScreen');tree.props.onCancel();tree=render();nodes(tree).find(n=>n.props?.accessibilityRole==='tab'&&text(n)==='PROFILE').props.onPress();tree=render();const profile=nodes(tree).find(n=>n.type==='ProfileScreen');assert.deepEqual(profile.props.reviewIds,['local-1']);assert.equal(profile.props.player.rating,1482);profile.props.onReview('local-1');assert.deepEqual(render.route(),{pathname:'/review/[id]',params:{id:'local-1'}});});
test('Profile makes only retained review rows tappable and leaves old mock rows unchanged',()=>{const Profile=load('src/screens/ProfileScreen.tsx').default;let opened;const matches=[{id:'local-1',opponentName:'MASON',modeId:'casual_duel',outcome:'win',playerScore:3,opponentScore:0},{id:'sample-1',opponentName:'NOVA',modeId:'ranked_mirror',outcome:'loss',playerScore:5,opponentScore:7}];const tree=Profile({player:player(1482),recentMatches:matches,reviewIds:['local-1'],onReview:id=>{opened=id;}});const retained=nodes(tree).find(n=>n.props?.testID==='profile-match-local-1'),old=nodes(tree).find(n=>n.props?.testID==='profile-match-sample-1');assert.equal(retained.props.accessibilityRole,'button');assert.equal(old.props.onPress,undefined);retained.props.onPress();assert.equal(opened,'local-1');});
test('Match Review renders factual chronological actions, score transitions and no coaching or game controls',()=>{const result=reviewedResult();const review={id:'local-1',matchId:1,modeId:'casual_duel',playerName:'ALVIN',opponentName:'MASON',completedAt:0,finalScore:{human:3,bot:0},outcome:'win',rounds:result.roundHistory};const Screen=load('src/screens/MatchReviewScreen.tsx').default;const tree=Screen({review,onBack:()=>{}});const rows=nodes(tree).filter(n=>typeof n.type==='function').map(n=>n.type(n.props));const copy=text([tree,...rows]);assert.match(copy,/MATCH REVIEW.*CASUAL DUEL/);assert.match(copy,/HIT → 3♥.*HIT → 3♠.*STAND → 19/);assert.match(copy,/0\s*\u2013\s*0.*\u2192.*1\s*\u2013\s*0/);assert.ok(copy.search(/ROUND\s+1/)<copy.search(/ROUND\s+2/));assert.doesNotMatch(copy,/BEST MOVE|MISTAKE|ACCURACY|EXPECTED VALUE|WIN PROBABILITY|OPTIMAL|SIMULATOR|AI REVIEW/);assert.equal(nodes(tree).filter(n=>n.props?.accessibilityRole==='button').length,1);assert.match(text(Screen({onBack:()=>{}})),/Review unavailable/);});
test('Review route accepts only retained IDs and receives no writable session/controller access',()=>{const {findMatchReview}=require('../.expo/presentation-tests/review/history');const result=reviewedResult();const review={id:'local-1',rounds:result.roundHistory};let back=0;const Route=load('src/app/review/[id].tsx',{'expo-router':{useLocalSearchParams:()=>({id:'local-1'}),router:{canGoBack:()=>true,back:()=>back++}},'../../presentation/SessionContext':{useMatchReviews:()=>[review]},'../../review/history':{findMatchReview},'../../screens/MatchReviewScreen':{__esModule:true,default:'MatchReviewScreen'}}).default;const tree=Route();assert.equal(tree.props.review,review);tree.props.onBack();assert.equal(back,1);assert.doesNotMatch(fs.readFileSync('src/app/review/[id].tsx','utf8'),/useSession\(|dispatch|TableController|game\/engine|simulation/);});
test('Fold review presentation never renders a folded opponent hidden card, total or invented action',()=>{const {createMatch,raiseDecision}=require('../.expo/presentation-tests/game/engine');const {MatchHistoryRecorder}=require('../.expo/presentation-tests/review/history');const card=rank=>({rank,suit:'hearts'});let game={...createMatch(()=>.5,'ranked_duel'),human:{hand:[card('10'),card('9')],status:'playing'},bot:{hand:[card('9'),card('A')],status:'playing'},score:{human:6,bot:5}};const recorder=new MatchHistoryRecorder(game);recorder.preAction('human','raise');game=raiseDecision(game,'human','raise');recorder.preAction('bot','fold');game=raiseDecision(game,'bot','fold');recorder.finishRound(game,false);const review={id:'local-1',modeId:'ranked_duel',playerName:'ALVIN',opponentName:'MASON',finalScore:{human:7,bot:5},rounds:recorder.rounds()};const Screen=load('src/screens/MatchReviewScreen.tsx').default,tree=Screen({review,onBack:()=>{}}),rows=nodes(tree).filter(n=>typeof n.type==='function').map(n=>n.type(n.props)),copy=text(rows);assert.match(copy,/MASON\s+FOLDED/);assert.match(copy,/HAND NOT REVEALED/);assert.match(copy,/FOLD WIN.*ALVIN \+1/);assert.doesNotMatch(copy,/A♥|REVEAL:|STAND|\b20\b/);});
