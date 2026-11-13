import { FlashList } from '@shopify/flash-list';
import { useCallback } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { TrackRow } from '@/components/TrackRow';
import type { Track } from '@/library/types';
import { playQueue } from '@/player/player';
import { useLibraryStore } from '@/store/libraryStore';
import { selectCurrentTrack, usePlayerStore } from '@/store/playerStore';
import { spacing, useTheme } from '@/theme';

export default function SongsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { permission, tracks, scanning, error, askPermission, rescan } = useLibraryStore();
  const currentId = usePlayerStore((s) => selectCurrentTrack(s)?.id);

  const renderItem = useCallback(
    ({ item, index }: { item: Track; index: number }) => (
      <TrackRow
        track={item}
        active={item.id === currentId}
        onPress={() => void playQueue(tracks, index)}
      />
    ),
    [tracks, currentId]
  );

  let body;
  if (permission === 'unknown' || (scanning && tracks.length === 0)) {
    body = (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  } else if (permission !== 'granted') {
    const blocked = permission === 'blocked';
    body = (
      <EmptyState
        icon="lock-closed"
        title="Let's find your music"
        message={
          blocked
            ? 'Music access is turned off. Open settings and allow "Music and audio" for this app.'
            : 'Allow access to music and audio so the app can play the songs on your phone. Nothing leaves your device.'
        }
        actionLabel={blocked ? 'Open settings' : 'Allow access'}
        onAction={blocked ? () => void Linking.openSettings() : () => void askPermission()}
      />
    );
  } else if (error) {
    body = (
      <EmptyState
        icon="alert-circle"
        title="Couldn't read your music"
        message={error}
        actionLabel="Try again"
        onAction={() => void rescan()}
      />
    );
  } else if (tracks.length === 0) {
    body = (
      <EmptyState
        icon="musical-notes"
        title="No music found"
        message="Copy some songs to your phone, then scan again."
        actionLabel="Scan again"
        onAction={() => void rescan()}
      />
    );
  } else {
    body = (
      <FlashList
        data={tracks}
        renderItem={renderItem}
        keyExtractor={(track) => track.id}
        extraData={currentId}
        refreshing={scanning}
        onRefresh={() => void rescan()}
        contentContainerStyle={{ paddingBottom: spacing.lg }}
      />
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.heading, { color: theme.text }]}>Songs</Text>
        {tracks.length > 0 ? (
          <Text style={{ color: theme.textSecondary }}>
            {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}
          </Text>
        ) : null}
      </View>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  heading: { fontSize: 32, fontWeight: '800' },
});
