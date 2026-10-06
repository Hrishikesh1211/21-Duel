import { StyleSheet, Text, View } from 'react-native';
import type { Competitor } from '../data/competitor';
import type { CosmeticIdentity, CosmeticConfig } from '../data/cosmetics';
import { CosmeticGeometry } from './CosmeticArtwork';
import { getEquippedCosmetic } from '../data/cosmetics';
import { RankMark } from './RankMark';
import { RankEmblem } from './RankEmblem';
import { CornerCut, GeometrySettle } from './CompetitiveFrame';
import { palette } from './theme';

// One equipped identity object; the compact version follows it into matchups.
export function PlayerCard({ player, config, compact = false, artDirection }: { player: Competitor & Partial<CosmeticIdentity>; config?: CosmeticConfig; compact?: boolean; artDirection?: 'lobby' }) {
  const cosmetic = getEquippedCosmetic(player, 'playerCardId');
  const visual = config ?? cosmetic.visual;
  // Explicit opt-in keeps this experiment out of Shop, Friends and matchups.
  if (artDirection === 'lobby') return <View testID="player-card" accessible accessibilityLabel={`${player.name}, ${player.rating} rating, ${player.division}`} style={[lobby.card, { backgroundColor: visual.background ?? palette.surface1 }]}>
    <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={lobby.art}>
      <GeometrySettle style={lobby.art}>
      <View style={lobby.rearPlane} /><View style={lobby.frontPlane} />
      <View style={lobby.artwork}><CosmeticGeometry config={visual} /></View>
      <View style={lobby.longStroke} /><View style={lobby.returnStroke} />
      {cosmetic.id === 'duel-standard' && <View style={lobby.interruption} />}
      <View style={lobby.edge} />
      <Text style={lobby.brand}>XXI</Text>
      </GeometrySettle>
    </View>
    <View style={lobby.header}><Text style={lobby.edition}>{cosmetic.name.toUpperCase()}</Text></View>
    <View style={lobby.identity}>
      <Text style={lobby.name}>{player.name}</Text>
      <View style={lobby.rankLine}><RankEmblem division={player.division} size={46} /><View style={lobby.rankCopy}><Text style={lobby.division}>{player.division}</Text><Text style={lobby.rating}>{player.rating}</Text></View></View>
    </View>
    <View accessible={false} style={lobby.lowerEdge} />
    <CornerCut />
  </View>;
  return <View testID="player-card" accessible accessibilityLabel={`${player.name}, ${player.rating} rating, ${player.division}`} style={[styles.card, { backgroundColor: visual.background ?? palette.surface1 }, compact && styles.compact]}>
    <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.art, compact && styles.compactArt]}>
      <View style={styles.offsetField} />
      <View style={styles.artwork}><CosmeticGeometry config={visual} /></View>
      <Text style={[styles.brand, compact && styles.compactBrand]}>XXI</Text>
      <View style={[styles.signatureRule, compact && styles.compactSignatureRule]} />
    </View>
    <Text style={styles.edition}>{cosmetic.name.toUpperCase()}</Text>
    <View style={[styles.identity, compact && styles.compactIdentity]}>
      <Text style={[styles.name, compact && styles.compactName]}>{player.name}</Text>
      <View style={styles.status}>
        <View style={styles.rank}><RankMark division={player.division} size={compact ? 26 : 34} /><Text style={styles.division}>{player.division}</Text></View>
        <Text style={[styles.rating, compact && styles.compactRating]}>{player.rating}</Text>
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  card: { width: '100%', minHeight: 254, borderTopWidth: 1, borderTopColor: palette.borderActive, borderBottomWidth: 1, borderBottomColor: palette.line, overflow: 'hidden', padding: 20, justifyContent: 'space-between' },
  compact: { minHeight: 168, padding: 14 },
  art: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, overflow: 'hidden' },
  compactArt: { opacity: 0.75 },
  offsetField: { position: 'absolute', top: 0, bottom: 0, left: '48%', right: '-14%', backgroundColor: palette.surface2, transform: [{ skewX: '-14deg' }], opacity: 0.65 },
  artwork: { position: 'absolute', top: 26, bottom: 70, left: '36%', right: -12 },
  brand: { position: 'absolute', left: 18, top: 34, color: palette.text, fontSize: 76, lineHeight: 92, fontWeight: '200', letterSpacing: -5 },
  compactBrand: { top: 22, left: 12, fontSize: 46, lineHeight: 60, letterSpacing: -3 },
  signatureRule: { position: 'absolute', left: 20, right: 20, bottom: 100, height: 1, backgroundColor: palette.line },
  compactSignatureRule: { bottom: 78, left: 14, right: 14 },
  edition: { color: palette.textSecondary, fontSize: 9, fontWeight: '500', letterSpacing: 1.8 },
  identity: { gap: 8, paddingTop: 108 },
  compactIdentity: { paddingTop: 50, gap: 4 },
  name: { color: palette.text, fontSize: 24, fontWeight: '500', letterSpacing: 2.6 },
  compactName: { fontSize: 17, letterSpacing: 2 },
  status: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rank: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rating: { color: palette.text, fontSize: 29, lineHeight: 36, fontWeight: '400', letterSpacing: -0.7, fontVariant: ['tabular-nums'] },
  compactRating: { fontSize: 24, lineHeight: 30 },
  division: { color: palette.system, fontSize: 10, fontWeight: '600', letterSpacing: 1.4 },
});

const lobby = StyleSheet.create({
  card: { width: '100%', minHeight: 242, padding: 20, overflow: 'hidden', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: palette.borderActive },
  art: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  rearPlane: { position: 'absolute', top: 58, bottom: 34, left: '57%', width: '36%', backgroundColor: palette.surface2, opacity: 0.6, transform: [{ skewX: '-16deg' }] },
  frontPlane: { position: 'absolute', top: 25, bottom: 68, left: '79%', right: '-23%', backgroundColor: palette.surface2, borderLeftWidth: 1, borderLeftColor: palette.line, transform: [{ skewX: '-16deg' }] },
  artwork: { position: 'absolute', top: 60, bottom: 38, left: '45%', right: -25 },
  longStroke: { position: 'absolute', left: '49%', right: 0, top: 87, height: 1, backgroundColor: palette.borderActive },
  returnStroke: { position: 'absolute', left: '69%', right: -12, top: 169, height: 1, backgroundColor: palette.player },
  interruption: { position: 'absolute', left: '69%', top: 87, width: 12, height: 2, backgroundColor: palette.dangerBorder },
  edge: { position: 'absolute', right: 0, top: 120, height: 46, width: 2, backgroundColor: palette.borderActive },
  lowerEdge: { position: 'absolute', bottom: 0, left: 0, width: '72%', height: 1, backgroundColor: palette.borderActive },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  edition: { color: palette.textSecondary, fontSize: 9, fontWeight: '500', letterSpacing: 1.2 },
  brand: { position: 'absolute', right: 15, bottom: 22, color: palette.borderActive, fontSize: 36, fontWeight: '200', letterSpacing: -1 },
  identity: { paddingTop: 26, gap: 24 },
  name: { color: palette.text, fontSize: 38, letterSpacing: 0.2, fontWeight: '600', paddingRight: 32 },
  rating: { color: palette.text, fontSize: 29, lineHeight: 36, fontWeight: '500', fontVariant: ['tabular-nums'], letterSpacing: -0.6 },
  rankLine: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rankCopy: { gap: 4 },
  division: { color: palette.system, fontSize: 10, letterSpacing: 1.2, fontWeight: '600' },
});
