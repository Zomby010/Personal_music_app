import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoverArt } from '@/components/CoverArt';
import { SeekBar } from '@/components/SeekBar';
import { cycleRepeat, next, previous, seekTo, togglePlay, toggleShuffle } from '@/player/player';
import { selectCurrentTrack, usePlayerStore } from '@/store/playerStore';
import { spacing, useTheme } from '@/theme';

const REPEAT_LABEL = { off: 'Repeat is off', all: 'Repeating all', one: 'Repeating one song' };

export default function NowPlayingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const track = usePlayerStore(selectCurrentTrack);
  const playing = usePlayerStore((s) => s.playing);
  const position = usePlayerStore((s) => s.position);
  const duration = usePlayerStore((s) => s.duration);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const queueLength = usePlayerStore((s) => s.queue.length);
  const currentIndex = usePlayerStore((s) => s.currentIndex);

  const coverSize = Math.round(Math.min(width - spacing.xxl * 2, height * 0.42));

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top + spacing.sm,
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityLabel="Close"
          style={styles.iconButton}>
          <Ionicons name="chevron-down" size={28} color={theme.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: theme.textSecondary }]}>NOW PLAYING</Text>
          {queueLength > 0 ? (
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              {currentIndex + 1} of {queueLength}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={() => router.push('/queue')}
          hitSlop={12}
          accessibilityLabel="Show queue"
          style={styles.iconButton}>
          <Ionicons name="list" size={26} color={theme.text} />
        </Pressable>
      </View>

      {track ? (
        <>
          <View style={styles.cover}>
            <CoverArt seed={track.id} size={coverSize} />
          </View>

          <View style={styles.titles}>
            <Text numberOfLines={2} style={[styles.title, { color: theme.text }]}>
              {track.title}
            </Text>
            <Text numberOfLines={1} style={[styles.artist, { color: theme.textSecondary }]}>
              {track.artist}
            </Text>
          </View>

          <SeekBar position={position} duration={duration} onSeek={seekTo} />

          <View style={styles.controls}>
            <Pressable
              onPress={() => void toggleShuffle()}
              hitSlop={10}
              accessibilityRole="switch"
              accessibilityState={{ checked: shuffle }}
              accessibilityLabel="Shuffle"
              style={styles.iconButton}>
              <Ionicons
                name="shuffle"
                size={26}
                color={shuffle ? theme.accent : theme.textSecondary}
              />
              {shuffle ? <View style={[styles.dot, { backgroundColor: theme.accent }]} /> : null}
            </Pressable>
            <Pressable
              onPress={previous}
              hitSlop={10}
              accessibilityLabel="Previous"
              style={styles.iconButton}>
              <Ionicons name="play-skip-back" size={32} color={theme.text} />
            </Pressable>
            <Pressable
              onPress={togglePlay}
              accessibilityLabel={playing ? 'Pause' : 'Play'}
              style={[styles.playButton, { backgroundColor: theme.accent }]}>
              <Ionicons
                name={playing ? 'pause' : 'play'}
                size={36}
                color={theme.onAccent}
                style={playing ? undefined : styles.playNudge}
              />
            </Pressable>
            <Pressable onPress={next} hitSlop={10} accessibilityLabel="Next" style={styles.iconButton}>
              <Ionicons name="play-skip-forward" size={32} color={theme.text} />
            </Pressable>
            <Pressable
              onPress={cycleRepeat}
              hitSlop={10}
              accessibilityLabel={REPEAT_LABEL[repeat]}
              style={styles.iconButton}>
              <Ionicons
                name="repeat"
                size={26}
                color={repeat === 'off' ? theme.textSecondary : theme.accent}
              />
              {repeat === 'one' ? (
                <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                  <Text style={[styles.badgeText, { color: theme.onAccent }]}>1</Text>
                </View>
              ) : repeat === 'all' ? (
                <View style={[styles.dot, { backgroundColor: theme.accent }]} />
              ) : null}
            </Pressable>
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <Text style={{ color: theme.textSecondary }}>Nothing is playing.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerText: { alignItems: 'center', gap: 2 },
  headerTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  headerSubtitle: { fontSize: 12 },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  cover: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  titles: { gap: spacing.xs, marginBottom: spacing.lg },
  title: { fontSize: 24, fontWeight: '800' },
  artist: { fontSize: 16 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  playButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playNudge: { marginLeft: 4 },
  dot: { position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2 },
  badge: {
    position: 'absolute',
    top: 6,
    right: 4,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 9, fontWeight: '800' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
