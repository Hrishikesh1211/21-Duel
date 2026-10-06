import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { SessionProvider } from '../presentation/SessionContext';
import { palette } from '../components/theme';
export default function RootLayout(){return <SafeAreaProvider initialMetrics={initialWindowMetrics}><StatusBar style="light" /><SessionProvider><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:palette.table}}} /></SessionProvider></SafeAreaProvider>;}
