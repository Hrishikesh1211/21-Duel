import { SharedDeck } from './SharedDeck';
import { DuelLine } from './DuelLine';
import type { PlayerId, PlayerStatus, RoundResult } from '../game/types';
import type { ClashStage } from '../presentation/TableController';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StyleSheet, Text, View } from 'react-native';
import { palette } from './theme';

type Props = {
  compact?: boolean;
  deciding?: PlayerId | null;
  scoreDelta?: Readonly<Record<PlayerId, number>>;
  human: number; bot: number;
  humanStatus: PlayerStatus; botStatus: PlayerStatus;
  result: RoundResult | null; clash: ClashStage;
  humanCount: number; botCount: number; handKey: number;
};

export function Scoreboard({ human, bot, humanStatus, botStatus, result, clash, humanCount, botCount, handKey, compact = false, deciding, scoreDelta }: Props) {
  return (
    <View testID="scoreboard" style={[styles.row, compact && styles.compactRow]} accessible accessibilityLabel={`Match points. You ${human}, opponent ${bot}. ${humanStatus === 'standing' ? 'Your hand locked.' : ''} ${botStatus === 'standing' ? 'Opponent hand locked.' : ''}`}>
      <View style={styles.rail}>
        <DuelLine deciding={deciding === 'human'} locked={humanStatus === 'standing'} clash={clash} won={result === 'human'} />
        <View style={styles.deck}><SharedDeck key={handKey} humanCount={humanCount} botCount={botCount} clash={clash} /></View>
        <DuelLine opponent deciding={deciding === 'bot'} locked={botStatus === 'standing'} clash={clash} won={result === 'bot'} />
      </View>
      <View style={styles.score}>
        <Animated.Text maxFontSizeMultiplier={1.3} key={`human-${human}`} entering={FadeInDown.duration(scoreDelta?.human === 2 ? 300 : 220).withInitialValues({ opacity: 0, transform: [{ translateY: scoreDelta?.human === 2 ? 7 : 4 }] })} style={[styles.number, compact && styles.compactNumber, styles.player]}>{human}</Animated.Text>
        <Text maxFontSizeMultiplier={1.3} style={styles.dash}>{'\u2014'}</Text>
        <Animated.Text maxFontSizeMultiplier={1.3} key={`bot-${bot}`} entering={FadeInDown.duration(scoreDelta?.bot === 2 ? 300 : 220).withInitialValues({ opacity: 0, transform: [{ translateY: scoreDelta?.bot === 2 ? 7 : 4 }] })} style={[styles.number, compact && styles.compactNumber]}>{bot}</Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', justifyContent: 'center', width: '100%', paddingHorizontal: 26, gap: 10 },
  compactRow: { gap: 6 },
  compactNumber: { fontSize: 34, lineHeight: 40 },
  deck: { zIndex: 1, flexShrink: 0 },
  // Equal flex lines center the measured deck at every screen width. Normal
  // flow reserves the stack's height so the score and result cannot overlap it.
  rail: { width: '100%', flexDirection: 'row', alignItems: 'center', paddingBottom: 5 },
  score: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  number: { color: palette.muted, fontSize: 38, lineHeight: 46, fontWeight: '300', fontVariant: ['tabular-nums'] },
  player: { color: palette.text },
  dash: { color: '#646E76', fontSize: 20, fontWeight: '300' },
});
