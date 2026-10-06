import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import { palette } from '../components/theme';
export function SocialScreen({ title, onBack, children }: { title: string; onBack: ()=>void; children: ReactNode }) {
  return <SafeAreaView style={socialStyles.root}><ScrollView contentContainerStyle={socialStyles.content} showsVerticalScrollIndicator={false}>
    <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={socialStyles.back}><Text style={socialStyles.caption}>{'\u2190 BACK'}</Text></Pressable>
    <Text accessibilityRole="header" style={socialStyles.title}>{title}</Text>{children}
  </ScrollView></SafeAreaView>;
}
export const socialStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.table },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', padding: 28, gap: 24, paddingBottom: 36 },
  back: { minHeight: 44, justifyContent: 'center' },
  title: { color: palette.text, fontSize: 12, fontWeight: '600', letterSpacing: 2.3 },
  caption: { color: palette.muted, fontSize: 9, letterSpacing: 1.4 },
  name: { color: palette.text, fontSize: 14, fontWeight: '600', letterSpacing: 1.5 },
  detail: { color: palette.muted, fontSize: 11, lineHeight: 18 },
  row: { backgroundColor: palette.surface1, paddingHorizontal: 14, borderLeftWidth: 1, borderLeftColor: palette.borderActive, minHeight: 96, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 18, borderBottomWidth: 1, borderBottomColor: palette.line, paddingVertical: 18 },
  copy: { flex: 1, gap: 8 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 4, height: 4, backgroundColor: palette.victory },
  action: { backgroundColor: palette.surface2, minHeight: 56, borderWidth: 1, borderColor: palette.line, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: palette.accent, fontSize: 11, fontWeight: '600', letterSpacing: 2 },
  disabled: { opacity: 0.45 },
  separator: { borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 22, gap: 16 },
});
export function Availability({ online }: { online: boolean }) {
  return <View style={socialStyles.status}><View accessible={false} style={[socialStyles.dot, !online && { backgroundColor: palette.line }]} /><Text style={socialStyles.caption}>{online ? 'ONLINE' : 'OFFLINE'}</Text></View>;
}
