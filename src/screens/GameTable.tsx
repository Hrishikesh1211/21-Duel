import { matchTarget, modeConfig } from '../game/rulesConfig';
import Animated, { FadeIn, FadeOut, Keyframe, useReducedMotion } from 'react-native-reanimated';
import type { GameMode } from '../game/types';
import type { Competitor } from '../data/competitor';
import { useEffect } from 'react';
import type { MatchResult } from '../competitive/session';
import { tableLayout } from '../presentation/tableLayout';
import { CardDrawLayer } from '../components/CardDrawLayer';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionBar, Action } from '../components/ActionBar';
import { PlayerArea } from '../components/PlayerArea';
import { RoundResult } from '../components/RoundResult';
import { Scoreboard } from '../components/Scoreboard';
import { palette, stateTreatments } from '../components/theme';
import { useGamePresentation } from '../presentation/useGamePresentation';
import { visibleBotCards } from '../presentation/TableController';

// Presentation only: one short settle and one line emphasis per value change.
const valueSettle = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 4 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }] },
}).duration(400);
const raiseLine = new Keyframe({
  0: { opacity: 0, transform: [{ scaleX: 0.7 }] }, 20: { opacity: 0.7, transform: [{ scaleX: 1 }] }, 65: { opacity: 0.7, transform: [{ scaleX: 1 }] }, 100: { opacity: 0, transform: [{ scaleX: 0.85 }] },
}).duration(400);

export default function GameTable({ mode = 'casual', opponent, onExit, onMatchComplete }: { mode?: GameMode; opponent: Competitor; onExit: () => void; onMatchComplete?: (result: MatchResult) => void }) {
  const { view: game, act, preAct, nextRound, rematch, finishDraw, getRoundHistory } = useGamePresentation(mode);
  const config = modeConfig(mode);
  const botStatus = (config.category === 'ranked' || config.deckModel === 'mirrored') && game.botTotal === null && game.bot.status === 'bust' ? 'standing' : game.bot.status;
  const rankedComplete = !!onMatchComplete && game.phase === 'match-complete';
  useEffect(() => {
    if (!onMatchComplete || game.phase !== 'match-complete' || !game.winner) return;
    // The table already holds the winner for 400ms; add 650ms before leaving.
    const roundHistory = getRoundHistory?.();
    const result: MatchResult = { outcome: game.winner === 'human' ? 'win' : 'loss', playerRounds: game.score.human, opponentRounds: game.score.bot, ...(roundHistory?.length ? { roundHistory } : {}) };
    const timer = setTimeout(() => onMatchComplete(result), 650);
    return () => clearTimeout(timer);
  }, [onMatchComplete, game.phase, game.winner, game.score.human, game.score.bot, getRoundHistory]);
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const layout = tableLayout(height - insets.top - insets.bottom, fontScale);
  const compact = layout.compact;
  const reducedMotion = useReducedMotion();
  const preRound = game.phase === 'preRaiseDecision' || game.phase === 'waitingForRaiseResponse';
  const decisionLabel = game.folded ? ' ' : game.strategicTransition === 'call' ? 'CALLED' : game.strategicTransition === 'raise' && game.decisionActor === 'bot' ? 'RAISED' : game.decisionActor === 'bot'
    ? `${opponent.name.toUpperCase()} IS DECIDING`
    : game.phase === 'waitingForRaiseResponse' ? `${opponent.name.toUpperCase()} RAISED` : 'YOUR MOVE';
  const tableWidth = Math.min(width - insets.left - insets.right, 480);
  const handWidth = tableWidth - 40;
  // Keep controls in the safe-area footer; short Classic tables can scroll
  // vertically rather than compressing cards into the center or controls.
  const scrollTable = config.raiseFoldEnabled && height - insets.top - insets.bottom < 660;
  const Surface = scrollTable ? ScrollView : View;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <CardDrawLayer finishDraw={finishDraw}>
      <View style={[styles.table, { maxWidth: 480 }]}>
        <View style={[styles.context, compact && styles.compactContext]} testID="match-context">
          <Pressable accessibilityRole="button" accessibilityLabel="Leave local match and return Home" onPress={onExit} style={styles.exit}><Text style={styles.exitText}>HOME</Text></Pressable>
          <Text maxFontSizeMultiplier={1.3} style={styles.round}>ROUND {game.round}</Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.firstTo}>FIRST TO {matchTarget(mode)}</Text>
        </View>
        <Surface testID="game-surface" {...(scrollTable ? { bounces: false, showsVerticalScrollIndicator: false, directionalLockEnabled: true, contentContainerStyle: [styles.scrollContent, { gap: layout.sectionGap }] } : {})} style={scrollTable ? styles.scrollSurface : [styles.playSurface, { gap: layout.sectionGap }]} >
          <PlayerArea competitor={opponent} committing={game.botCommitting} gesture={game.botGesture} key={`opponent-${game.handKey}`} opponent handKey={game.handKey} busy={game.busy} cards={visibleBotCards(game)} total={game.botTotal} status={botStatus} thinking={game.thinking} clearing={game.clearing} wins={game.score.bot} target={matchTarget(mode)} availableWidth={handWidth} compact={compact} cardWidth={layout.opponentCardWidth} areaGap={layout.areaGap} />
          <View style={[styles.center, compact && styles.compactCenter]}>
            <Scoreboard human={game.score.human} bot={game.score.bot}
              deciding={preRound && !game.folded ? game.decisionActor : null} scoreDelta={config.raiseFoldEnabled ? game.scoreDelta : undefined}
              humanStatus={game.human.status} botStatus={botStatus}
              result={game.result} clash={game.clash} compact={compact}
              humanCount={game.humanCount} botCount={game.botCount} handKey={game.handKey} />
            <View testID="round-result" style={[styles.resultSlot, compact && styles.compactResult]}>{preRound && !game.folded ? (
            <View testID="center-round-value" style={styles.valueRow} accessible accessibilityLabel={`Round value ${game.roundValue}`}>
              <Text maxFontSizeMultiplier={1.3} style={styles.valueLabel}>{'VALUE \u00B7'}</Text>
              <Animated.Text key={game.roundValue} entering={game.roundValue === 2 && !reducedMotion ? valueSettle : undefined} maxFontSizeMultiplier={1.3} style={[styles.valueNumber, game.roundValue === 2 && styles.urgent]}>{game.roundValue}</Animated.Text>
              {game.roundValue === 2 && !reducedMotion ? <Animated.View key="raise-emphasis" pointerEvents="none" entering={raiseLine} style={styles.raiseLine} /> : null}
            </View>
            ) : <RoundResult result={game.result} winner={game.winner} folded={game.folded} opponentName={opponent.name} />}</View>
          </View>
          <PlayerArea committing={game.humanCommitting} gesture={game.humanGesture} key={`human-${game.handKey}`} handKey={game.handKey} busy={game.busy} cards={game.human.hand.slice(0, game.humanCount).map(card => game.folded ? null : card)} total={game.humanTotal} clearing={game.clearing} status={game.human.status} wins={game.score.human} target={matchTarget(mode)} availableWidth={handWidth} compact={compact} cardWidth={layout.playerCardWidth} areaGap={layout.areaGap} />
        </Surface>
        <View testID="game-controls" pointerEvents={rankedComplete ? "none" : "auto"} accessibilityElementsHidden={rankedComplete} importantForAccessibility={rankedComplete ? "no-hide-descendants" : "auto"} style={[styles.footer, rankedComplete && { opacity: 0 }]}>
          {(game.phase === 'preRaiseDecision' || game.phase === 'waitingForRaiseResponse') ? <Animated.View key={`strategy-${game.handKey}`} entering={reducedMotion ? undefined : FadeIn.duration(220)} exiting={reducedMotion ? undefined : FadeOut.duration(220)} style={styles.preRound} testID="raise-fold-decision">
            <View style={styles.decisionHeader}>
              <Text maxFontSizeMultiplier={1.3} accessibilityLiveRegion="polite" style={[styles.decisionLabel, game.strategicTransition === 'call' ? stateTreatments.active : game.strategicTransition === 'raise' ? stateTreatments.danger : game.decisionActor === 'bot' ? stateTreatments.system : stateTreatments.active, game.phase === 'waitingForRaiseResponse' && game.decisionActor === 'human' && !game.strategicTransition && styles.urgent]}>{decisionLabel}</Text>
              {!game.strategicTransition && !game.folded ? <Text testID="raise-fold-timer" maxFontSizeMultiplier={1.3} accessibilityLabel={`${game.seconds} seconds remaining`} style={[styles.timer, game.seconds <= 3 && styles.urgent]}>{game.seconds}</Text> : <View style={styles.timerPlaceholder} />}
            </View>
            <View style={styles.choices}>
              {game.decisionActor === 'human' && !game.strategicTransition && !game.folded ? <>
                <Action strategic primary danger={game.phase === 'preRaiseDecision'} label={game.phase === 'preRaiseDecision' ? 'RAISE' : 'CALL'} onPress={() => preAct(game.phase === 'preRaiseDecision' ? 'raise' : 'call')} disabled={game.busy} />
                <Action strategic secondary label={game.phase === 'preRaiseDecision' ? 'PASS' : 'FOLD'} onPress={() => preAct(game.phase === 'preRaiseDecision' ? 'pass' : 'fold')} disabled={game.busy} />
              </> : null}
            </View>
          </Animated.View> : <>
          <ActionBar
            phase={game.phase}
            disabled={game.busy || rankedComplete || (game.phase === 'playing' && (game.human.status !== 'playing' || game.humanTotal === 21))}
            onHit={() => act('hit')}
            onStand={() => act('stand')}
            onNextRound={nextRound}
            onRematch={rematch}
          />
          </>}
        </View>
      </View>
      </CardDrawLayer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  preRound: { gap: 4, alignItems: 'center', minHeight: 84, width: '100%' },
  decisionHeader: { flexDirection: 'row', alignItems: 'baseline', width: '100%', minHeight: 22, gap: 8 },
  decisionLabel: { flex: 1, color: palette.text, fontSize: 11, lineHeight: 18, fontWeight: '700', letterSpacing: 1.3 },
  choices: { flexDirection: 'row', gap: 12, width: '100%', minHeight: 58 },
  valueRow: { flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', minHeight: 20 },
  valueLabel: { color: palette.muted, fontSize: 10, lineHeight: 20, letterSpacing: 1.4 },
  valueNumber: { color: palette.text, fontSize: 24, lineHeight: 26, fontWeight: '600', minWidth: 16, textAlign: 'center', fontVariant: ['tabular-nums'] },
  raiseLine: { position: 'absolute', bottom: -1, left: 0, right: 0, height: 1, backgroundColor: palette.red, opacity: 0 },
  timerPlaceholder: { width: 28, height: 18 },
  timer: { color: palette.text, fontSize: 17, lineHeight: 18, fontWeight: '600', width: 28, textAlign: 'right', fontVariant: ['tabular-nums'] },
  urgent: { color: palette.red },
  exit: { position: 'absolute', left: 16, top: 0, minWidth: 48, minHeight: 44, justifyContent: 'center' },
  exitText: { color: palette.muted, fontSize: 9, letterSpacing: 1.2 },
  safe: { flex: 1, backgroundColor: palette.table, overflow: 'hidden' },
  table: { flex: 1, minHeight: 0, width: '100%', alignSelf: 'center' },
  context: { backgroundColor: palette.surface1, borderBottomWidth: 1, borderBottomColor: palette.line, flexShrink: 0, alignItems: 'center', gap: 4, paddingTop: 8, paddingBottom: 10 },
  compactContext: { paddingTop: 6, paddingBottom: 8 },
  round: { color: palette.text, fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 2.4 },
  firstTo: { color: palette.muted, fontSize: 9, lineHeight: 12, fontWeight: '500', letterSpacing: 1.8 },
  scrollSurface: { flex: 1, minHeight: 0 },
  scrollContent: { flexGrow: 1, justifyContent: 'space-evenly', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 4 },
  playSurface: { flex: 1, minHeight: 0, justifyContent: 'space-evenly', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 4 },
  center: { flexShrink: 0, width: '100%', alignItems: 'center', gap: 8 },
  compactCenter: { gap: 4 },
  resultSlot: { height: 32, justifyContent: 'center', width: '100%' },
  compactResult: { height: 28 },
  footer: { backgroundColor: palette.surface1, borderTopWidth: 1, borderTopColor: palette.line, flexShrink: 0, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 },
});
