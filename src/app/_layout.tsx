import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';

import { MiniPlayer } from '@/components/MiniPlayer';
import { useLibraryStore } from '@/store/libraryStore';
import { useTheme } from '@/theme';

export default function RootLayout() {
  const theme = useTheme();
  const init = useLibraryStore((s) => s.init);
  const pathname = usePathname();
  const showMiniPlayer = pathname !== '/now-playing' && pathname !== '/queue';

  useEffect(() => {
    void init();
  }, [init]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="now-playing" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="queue" options={{ animation: 'slide_from_right' }} />
      </Stack>
      {showMiniPlayer ? <MiniPlayer /> : null}
    </View>
  );
}
