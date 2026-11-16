import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TrackRow } from '@/components/TrackRow';
import type { Track } from '@/library/types';
import { playQueueIndex, removeFromQueue } from '@/player/player';
import { usePlayerStore } from '@/store/playerStore';
import { spacing, useTheme } from '@/theme';

export default function QueueScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);

  const renderItem = useCallback(
    ({ item, index }: { item: Track; index: number }) => (
      <View style={styles.row}>
        <View style={styles.rowMain}>
          <TrackRow
            track={item}
            active={index === currentIndex}
            onPress={() => playQueueIndex(index)}
          />
        </View>
        {index === currentIndex ? (
          <View style={styles.remove}>
            <Ionicons name="volume-medium" size={20} color={theme.accent} />
          </View>
        ) : (
          <Pressable
            onPress={() => removeFromQueue(index)}
            hitSlop={8}
            accessibilityLabel={`Remove ${item.title} from the queue`}
            style={styles.remove}>
            <Ionicons name="close" size={20} color={theme.textSecondary} />
          </Pressable>
        )}
      </View>
    ),
    [currentIndex, theme]
  );

  return (
    <View
      style={[styles.screen, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityLabel="Back"
          style={styles.back}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text style={[styles.heading, { color: theme.text }]}>Queue</Text>
        <Text style={{ color: theme.textSecondary }}>
          {queue.length} {queue.length === 1 ? 'song' : 'songs'}
        </Text>
      </View>
      <FlashList
        data={queue}
        renderItem={renderItem}
        // The same song can only appear once for now, but keying by position keeps removal simple.
        keyExtractor={(track, index) => `${track.id}:${index}`}
        extraData={currentIndex}
        initialScrollIndex={Math.max(0, currentIndex)}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingRight: spacing.lg,
    paddingVertical: spacing.sm,
  },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, fontSize: 24, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowMain: { flex: 1 },
  remove: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
});
