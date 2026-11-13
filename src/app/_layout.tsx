import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';

import { MiniPlayer } from '@/components/MiniPlayer';
import { useLibraryStore } from '@/store/libraryStore';
import { useTheme } from '@/theme';

export default function RootLayout() {
  const theme = useTheme();
  const init = useLibraryStore((s) => s.init);

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
        }}
      />
      <MiniPlayer />
    </View>
  );
}
