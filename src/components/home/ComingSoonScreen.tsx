import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from '../theme';

export function ComingSoonScreen({ title, detail }: { title: string; detail: string }) {
  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.root}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.brand}>TWENTY ONE / DUEL</Text>
    <View style={styles.body}><Text style={styles.title}>{title}</Text><Text style={styles.detail}>{detail}</Text><Text style={styles.note}>COMING SOON</Text></View>
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.table },
  content: { flexGrow: 1, padding: 28, width: '100%', maxWidth: 520, alignSelf: 'center' },
  brand: { fontSize: 11, letterSpacing: 2, color: palette.muted },
  body: { flex: 1, justifyContent: 'center', gap: 18, paddingVertical: 48 },
  title: { fontSize: 38, fontWeight: '500', color: palette.text },
  detail: { fontSize: 16, lineHeight: 24, color: palette.muted },
  note: { fontSize: 10, letterSpacing: 2, color: palette.accent, marginTop: 20 },
});
