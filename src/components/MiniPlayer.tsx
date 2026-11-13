import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { next, previous, togglePlay } from '@/player/player';
import { selectCurrentTrack, usePlayerStore } from '@/store/playerStore';
import { spacing, useTheme } from '@/theme';

import { CoverArt } from './CoverArt';

export function MiniPlayer() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const track = usePlayerStore(selectCurrentTrack);
  const playing = usePlayerStore((s) => s.playing);
  const progress = usePlayerStore((s) => (s.duration > 0 ? s.position / s.duration : 0));

  if (!track) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          paddingBottom: insets.bottom,
        },
      ]}>
      <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: theme.accent, width: `${Math.min(1, progress) * 100}%` },
          ]}
        />
      </View>
      <View style={styles.row}>
        <CoverArt seed={track.id} size={44} />
        <View style={styles.text}>
          <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
            {track.title}
          </Text>
          <Text numberOfLines={1} style={[styles.subtitle, { color: theme.textSecondary }]}>
            {track.artist}
          </Text>
        </View>
        <Pressable onPress={previous} hitSlop={8} accessibilityLabel="Previous" style={styles.button}>
          <Ionicons name="play-skip-back" size={22} color={theme.text} />
        </Pressable>
        <Pressable
          onPress={togglePlay}
          hitSlop={8}
          accessibilityLabel={playing ? 'Pause' : 'Play'}
          style={[styles.playButton, { backgroundColor: theme.accent }]}>
          <Ionicons name={playing ? 'pause' : 'play'} size={22} color={theme.onAccent} />
        </Pressable>
        <Pressable onPress={next} hitSlop={8} accessibilityLabel="Next" style={styles.button}>
          <Ionicons name="play-skip-forward" size={22} color={theme.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderTopWidth: StyleSheet.hairlineWidth },
  progressTrack: { height: 2 },
  progressFill: { height: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: '600' },
  subtitle: { fontSize: 12 },
  button: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
