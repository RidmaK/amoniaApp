import { Stack } from 'expo-router';
import { ThemeProvider } from './context/ThemeContext';
import { View } from 'react-native';
import { useTheme } from './context/ThemeContext';
import { Colors } from '../constants/Colors';

function RootLayoutNav() {
  const { isDark } = useTheme();
  
  return (
    <View style={{ flex: 1, backgroundColor: Colors[isDark ? 'dark' : 'light'].background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
} 