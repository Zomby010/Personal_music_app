import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDuration } from '@/library/tracks';
import type { Track } from '@/library/types';
import { spacing, useTheme } from '@/theme';

import { CoverArt } from './CoverArt';

type Props = { track: Track; active: boolean; onPress: () => void };

export const TrackRow = memo(function TrackRow({ track, active, onPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: theme.surfaceRaised }}
      accessibilityRole="button"
      accessibilityLabel={`Play ${track.title} by ${track.artist}`}
      style={styles.row}>
      <CoverArt seed={track.id} />
      <View style={styles.text}>
        <Text
          numberOfLines={1}
          style={[styles.title, { color: active ? theme.accent : theme.text }]}>
          {track.title}
        </Text>
        <Text numberOfLines={1} style={[styles.subtitle, { color: theme.textSecondary }]}>
          {track.artist}
        </Text>
      </View>
      <Text style={[styles.duration, { color: theme.textSecondary }]}>
        {formatDuration(track.duration)}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 64,
  },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 16, fontWeight: '600' },
  subtitle: { fontSize: 13 },
  duration: { fontSize: 13, fontVariant: ['tabular-nums'] },
});
