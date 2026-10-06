import type { GameMode, PublicGameMode } from './src/game/types';
import ModesScreen from './src/screens/ModesScreen';
import CasualResultScreen from './src/screens/CasualResultScreen';
import { FEATURED_MODE, modeConfig } from './src/game/rulesConfig';
import RankedFairPlayScreen from './src/screens/RankedFairPlayScreen';
import { fairPlayReducer, initialFairPlay } from './src/presentation/fairPlay';
import { localOpponent, type Competitor } from './src/data/competitor';
import PostMatchScreen from './src/screens/PostMatchScreen';
import { type MatchResult } from './src/competitive/session';
import { useSession } from './src/presentation/SessionContext';
import { findMatchReview } from './src/review/history';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import MatchmakingScreen from './src/screens/MatchmakingScreen';
import { useCallback, useEffect, useReducer, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GameTable from './src/screens/GameTable';
import HomeScreen from './src/screens/HomeScreen';
import ShopScreen from './src/screens/ShopScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { palette } from './src/components/theme';

import CosmeticSelector from './src/screens/CosmeticSelector';
import { CosmeticProvider } from './src/presentation/CosmeticContext';
import type { CosmeticSlot } from './src/data/cosmetics';

import FriendsScreen from './src/screens/FriendsScreen';
import FriendProfileScreen from './src/screens/FriendProfileScreen';
import ChallengeModeScreen from './src/screens/ChallengeModeScreen';
import IncomingChallengeScreen from './src/screens/IncomingChallengeScreen';
import { getFriend, mockFriends } from './src/data/friends';
import { createFriendChallenge, mockIncomingChallenge, type Challenge } from './src/social/challenges';

type Screen = 'home' | 'friends' | 'friendProfile' | 'challengeMode' | 'incomingChallenge' | 'matchmaking' | 'game' | 'postMatch' | 'casualResult';
type Tab = 'home' | 'modes' | 'shop' | 'profile';
const tabs: readonly Tab[] = ['home', 'modes', 'shop', 'profile'];

function LocalApp() {
  const [fairPlay, updateFairPlay] = useReducer(fairPlayReducer, initialFairPlay);
  const { session, dispatch } = useSession();
  const router = useRouter();
  const openReview = useCallback((id: string) => { if (findMatchReview(session.matchReviews, id)) router.push({ pathname: '/review/[id]', params: { id } }); }, [session.matchReviews, router]);
  const [selectedMode, setSelectedMode] = useState<PublicGameMode>(FEATURED_MODE);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [opponent, setOpponent] = useState<Competitor>(localOpponent);
  const [screen, setScreen] = useState<Screen>('home');
  const [tab, setTab] = useState<Tab>('home');
  const [cosmeticSelection, setCosmeticSelection] = useState<{slot:CosmeticSlot;id?:string}|null>(null);
  const openCosmetics = useCallback((slot:CosmeticSlot,id?:string)=>setCosmeticSelection({slot,id}),[]);
  const [viewedFriendId, setViewedFriendId] = useState<string | null>(null);
  const [incomingChallenge, setIncomingChallenge] = useState<Challenge | null>(null);
  const viewedFriend = viewedFriendId ? getFriend(viewedFriendId) : undefined;
  const matchFriend = session.challenge ? getFriend(session.challenge.opponentId) : undefined;
  const openFriends = useCallback(() => setScreen('friends'), []);
  const openFriend = useCallback((id: string) => { if (getFriend(id)) { setViewedFriendId(id); setScreen('friendProfile'); } }, []);
  const declineIncoming = useCallback(() => { setIncomingChallenge(null); setScreen('friends'); }, []);
  const insets = useSafeAreaInsets();
  const matchMode = session.activeMode ?? selectedMode;
  const returnHome = useCallback(() => { updateFairPlay({ type: 'cancel' }); setRulesOpen(false); dispatch({ type: 'abandon' }); setOpponent(localOpponent); setScreen('home'); setTab('home'); setIncomingChallenge(null); setViewedFriendId(null); }, []);
  const startMatch = useCallback((mode: GameMode, challenge?: Challenge) => {
    if (challenge && !getFriend(challenge.opponentId)?.online) return;
    setRulesOpen(false); setIncomingChallenge(null);
    setOpponent(challenge ? getFriend(challenge.opponentId)! : localOpponent);
    updateFairPlay({ type: 'enter', mode }); dispatch({ type: 'start', mode, challenge }); setScreen('matchmaking');
  }, []);
  const challengeFriend = useCallback((mode: PublicGameMode) => {
    if (!viewedFriendId) return;
    const challenge = createFriendChallenge(viewedFriendId, mode);
    if (challenge) startMatch(challenge.modeId, challenge);
  }, [viewedFriendId, startMatch]);
  const playSelected = useCallback(() => startMatch(selectedMode), [selectedMode, startMatch]);
  const rematch = useCallback(() => startMatch(matchMode, session.challenge), [matchMode, session.challenge, startMatch]);
  const acknowledgeFairPlay = useCallback(() => { setRulesOpen(false); updateFairPlay({ type: 'acknowledge' }); }, []);
  const reopenFairPlay = useCallback(() => {
    if (modeConfig(matchMode).category === 'casual') setRulesOpen(true);
    else updateFairPlay({ type: 'reopen', mode: matchMode });
  }, [matchMode]);
  const finishMatch = useCallback((match: MatchResult) => {
    if (session.activeMatchId === null) return;
    dispatch({ type: 'finish', matchId: session.activeMatchId, match, opponentName: opponent.name, timestamp: Date.now() });
    setScreen((session.activeRatingEnabled ?? modeConfig(matchMode).ratingEnabled) ? 'postMatch' : 'casualResult');
  }, [session.activeMatchId, session.activeRatingEnabled, matchMode, opponent.name]);
  const openGame = useCallback((selected: Competitor) => { setOpponent({ ...selected }); setScreen('game'); }, []);
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (router.canGoBack()) return false;
      if (cosmeticSelection) { setCosmeticSelection(null); return true; }
      if (fairPlay.open || rulesOpen) { returnHome(); return true; }
      if (screen === 'incomingChallenge') { declineIncoming(); return true; }
      if (screen === 'challengeMode') { setScreen('friendProfile'); return true; }
      if (screen === 'friendProfile') { setScreen('friends'); return true; }
      if (screen === 'friends') { setScreen('home'); setTab('profile'); return true; }
      if (screen === 'matchmaking') return false; // The screen owns its search-only back/cancel guard.
      if (screen === 'game' || screen === 'postMatch' || screen === 'casualResult') { returnHome(); return true; }
      if (tab !== 'home') { setTab('home'); return true; }
      return false;
    });
    return () => subscription.remove();
  }, [screen, tab, returnHome, fairPlay.open, rulesOpen, cosmeticSelection, declineIncoming, router]);

  const renderScreen = () => {
  if (screen === 'friends') return <FriendsScreen showDevelopmentControls={typeof __DEV__ !== 'undefined' && __DEV__} onBack={() => { setScreen('home'); setTab('profile'); }} onFriend={openFriend} onMockIncoming={() => { setIncomingChallenge(mockIncomingChallenge); setScreen('incomingChallenge'); }} />;
  if (screen === 'friendProfile' && viewedFriend) return <FriendProfileScreen friend={viewedFriend} onBack={openFriends} onChallenge={() => { if (viewedFriend.online) setScreen('challengeMode'); }} />;
  if (screen === 'challengeMode' && viewedFriend) return <ChallengeModeScreen friend={viewedFriend} onBack={() => setScreen('friendProfile')} onSelect={challengeFriend} />;
  if (screen === 'incomingChallenge' && incomingChallenge) return <IncomingChallengeScreen challenge={incomingChallenge} onDecline={declineIncoming} onAccept={() => startMatch(incomingChallenge.modeId, incomingChallenge)} />;
  // Conditional mounting gives every match its own controller and cancels it on exit.
  if (screen === 'matchmaking' && (fairPlay.open || rulesOpen)) return <RankedFairPlayScreen mode={matchMode} onContinue={acknowledgeFairPlay} onCancel={returnHome} />;
  if (screen === 'matchmaking') return <MatchmakingScreen key={session.activeMatchId} friend={matchFriend} mode={matchMode} onRules={reopenFairPlay} player={session.player} onCancel={returnHome} onComplete={openGame} />;
  if (screen === 'game') return <Animated.View entering={FadeIn.duration(180)} style={styles.root}><GameTable mode={matchMode} opponent={opponent} onMatchComplete={finishMatch} onExit={returnHome} /></Animated.View>;
  if (screen === 'postMatch' && session.result) return <PostMatchScreen player={session.player} key={session.result.matchId} result={session.result} onHome={returnHome} onRematch={rematch} onReview={findMatchReview(session.matchReviews, `local-${session.result.matchId}`) ? () => openReview(`local-${session.result!.matchId}`) : undefined} />;
  if (screen === 'casualResult' && session.casualResult) return <CasualResultScreen result={session.casualResult} onHome={returnHome} onRematch={rematch} onReview={findMatchReview(session.matchReviews, `local-${session.casualResult.matchId}`) ? () => openReview(`local-${session.casualResult!.matchId}`) : undefined} />;
  return <View style={styles.root}>
    {tab === 'home' ? <HomeScreen selectedMode={selectedMode} onModes={() => setTab('modes')} player={session.player} onPlay={playSelected} onProfile={() => setTab('profile')} />
      : tab === 'modes' ? <ModesScreen selected={selectedMode} onSelect={setSelectedMode} onPlay={playSelected} />
        : tab === 'shop' ? <ShopScreen player={session.player} onOpenCosmetics={openCosmetics} />
          : <ProfileScreen onFriends={openFriends} friendCount={mockFriends.length} onOpenCosmetics={openCosmetics} player={session.player} peakRating={session.peakRating} rankedMatchCount={session.rankedMatchCount} recentMatches={session.recentMatches} reviewIds={session.matchReviews?.map(review => review.id)} onReview={openReview} />}
    <View style={[styles.bar, { paddingBottom: Math.max(10, insets.bottom), paddingLeft: insets.left + 24, paddingRight: insets.right + 24 }]}>
      {tabs.map(item => <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.selectedTab]} accessibilityRole="tab" accessibilityState={{ selected: tab === item }}>
        <Text style={[styles.label, tab === item && styles.selected]}>{item.toUpperCase()}</Text>
      </Pressable>)}
    </View>
  </View>;
  };
  return <CosmeticProvider loadout={session.player}>{cosmeticSelection ? <CosmeticSelector key={cosmeticSelection.slot} player={session.player} slot={cosmeticSelection.slot} initialId={cosmeticSelection.id} onEquip={(slot,id)=>dispatch({type:'equip',slot,id})} onClose={()=>setCosmeticSelection(null)} /> : renderScreen()}</CosmeticProvider>;
}

export default function App() {
  return <LocalApp />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.table },
  bar: { backgroundColor: palette.surface1, flexDirection: 'row', borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 6 },
  tab: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  label: { color: palette.muted, fontSize: 10, letterSpacing: 1.7, fontWeight: '600' },
  selectedTab: { borderTopWidth: 2, borderTopColor: palette.borderActive },
  selected: { color: palette.text, fontWeight: '600' },
});
