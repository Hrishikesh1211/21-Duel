import { matchTarget } from '../game/rulesConfig';
import type { Competitor } from '../data/competitor';
import { handLayout } from '../presentation/handLayout';
import { motion } from '../presentation/motion';
import { TableGestureEffect } from './TableGestureEffect';
import type { TableGesture } from '../presentation/TableController';
import { TwentyOneEffect } from './TwentyOneEffect';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Card, PlayerStatus } from '../game/types';
import Animated, { FadeIn } from 'react-native-reanimated';
import { CardSlot, CommitmentStroke, WinDot } from './TableMotion';
import { palette, stateTreatments } from './theme';

type Props = {
  competitor?: Competitor;
  committing: boolean;
  gesture: TableGesture | null;
  opponent?: boolean;
  handKey: number;
  busy: boolean;
  cards: readonly (Card | null)[];
  total: number | null;
  status: PlayerStatus;
  wins: number;
  target?: number;
  availableWidth: number;
  compact: boolean;
  cardWidth: number;
  areaGap: number;
  thinking?: boolean;
  clearing?: boolean;
};

export function PlayerArea({ competitor, committing, gesture, opponent = false, handKey, busy, cards, total, status, wins, target = matchTarget('casual'), availableWidth, compact, cardWidth, areaGap, thinking = false, clearing = false }: Props) {
  const layout = handLayout(cards.length, cardWidth, availableWidth);
  const { step, width: handWidth } = layout;
  const stateLabel = status === 'standing' && !committing ? 'LOCKED' : status === 'bust' ? 'BUST' : opponent && thinking ? 'THINKING' : !opponent && !busy && total !== 21 ? 'YOUR TURN' : '';

  return (
    <View testID={opponent ? 'opponent-area' : 'player-area'} style={[styles.area, { gap: areaGap }]}>
      {opponent ? (
        <View style={styles.identity}>
          <Text maxFontSizeMultiplier={1.3} style={styles.label}>{competitor?.name ?? 'OPPONENT'}</Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.rating} accessibilityLabel={`Opponent rating ${competitor?.rating ?? 'unavailable'}`}>{competitor?.rating ?? ''}</Text>
          <View style={styles.dots} accessible accessibilityLabel={`${wins} of ${target} match points`}>
            {Array.from({ length: target }, (_, index) => index).map((index) => <WinDot key={index} filled={index < wins} opponent />)}
          </View>
        </View>
      ) : null}
      <View style={styles.handRegion}>
      <ScrollView
        horizontal
        bounces={false}
        alwaysBounceVertical={false}
        alwaysBounceHorizontal={false}
        directionalLockEnabled
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        scrollEnabled={!busy}
        showsHorizontalScrollIndicator={false}
        style={[styles.handViewport, { height: layout.height }]}
        contentContainerStyle={styles.handContent}
      >
        <View style={[styles.hand, { width: layout.contentWidth, height: cardWidth * 1.43 }]}>
          {cards.map((card, index) => (
            // Slot identity survives reveal; the round boundary resets the hand.
            <CardSlot lockDelay={motion.gestureStagger * (opponent ? cards.length - 1 - index : index) / Math.max(1, cards.length - 1)} key={index} card={card} width={cardWidth} drawKey={`${handKey}:${opponent ? 'bot' : 'human'}:${index + 1}`} x={layout.start + index * step} clearing={clearing} opponent={opponent} lockOffset={status === 'standing' ? ((cards.length - 1) / 2 - index) * Math.min(2, 4 / Math.max(1, cards.length - 1)) : 0} locked={status === 'standing'} />
          ))}
          <CommitmentStroke locked={status === 'standing' && !committing} opponent={opponent} width={handWidth} />
        </View>
      </ScrollView>
      <TableGestureEffect gesture={gesture} opponent={opponent} width={Math.min(handWidth, availableWidth)} availableWidth={availableWidth} />
      </View>
      <View style={styles.readout}>
        <TwentyOneEffect total={total} opponent={opponent} textStyle={[styles.total, compact && styles.compactTotal, opponent && styles.opponentTotal, opponent && compact && styles.compactOpponentTotal, status === 'bust' && styles.bust, total === 21 && styles.twentyOne]} />
        <View style={styles.statusRow}>
          <Animated.Text maxFontSizeMultiplier={1.3} key={stateLabel} entering={FadeIn.duration(180)} style={[styles.state, stateLabel === 'YOUR TURN' ? stateTreatments.active : stateLabel === 'THINKING' || stateLabel === 'LOCKED' ? stateTreatments.system : undefined, status === 'standing' && { color: opponent ? palette.opponent : palette.accent }, status === 'bust' && styles.bust]}>{stateLabel || ' '}</Animated.Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  area: { flexShrink: 0, alignItems: 'center', width: '100%' },
  identity: { alignItems: 'center', gap: 3 },
  label: { fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 2.3, color: palette.text },
  rating: { fontSize: 13, lineHeight: 16, color: palette.muted, fontVariant: ['tabular-nums'] },
  dots: { flexDirection: 'row', gap: 7, marginTop: 3, paddingVertical: 2 },
  handRegion: { width: '100%', position: 'relative' },
  handViewport: { width: '100%', flexGrow: 0, flexShrink: 0 },
  handContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 6 },
  hand: { position: 'relative' },
  statusRow: { borderBottomWidth: 1, borderBottomColor: palette.line, paddingBottom: 3, flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 14 },
  readout: { alignItems: 'center', gap: 3 },
  total: { fontSize: 44, lineHeight: 50, fontWeight: '500', color: palette.text, fontVariant: ['tabular-nums'] },
  compactTotal: { fontSize: 38, lineHeight: 44 },
  compactOpponentTotal: { fontSize: 20, lineHeight: 24 },
  opponentTotal: { fontSize: 22, lineHeight: 27 },
  state: { fontSize: 10, lineHeight: 14, letterSpacing: 2, fontWeight: '600', color: palette.muted },
  twentyOne: { color: palette.reward },
  bust: { color: palette.defeat },
});

