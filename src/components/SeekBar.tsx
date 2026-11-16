import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';

import { formatDuration } from '@/library/tracks';
import { spacing, useTheme } from '@/theme';

type Props = {
  /** Seconds. */
  position: number;
  /** Seconds. */
  duration: number;
  onSeek: (seconds: number) => void;
};

const THUMB = 14;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Draggable progress bar. Seeks once, when the finger lifts. */
export function SeekBar({ position, duration, onSeek }: Props) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const [dragFraction, setDragFraction] = useState<number | null>(null);

  // The pan responder is created once, so it reads the latest values from here.
  const live = useRef({ width, duration, onSeek, start: 0, fraction: 0 });
  useEffect(() => {
    live.current.width = width;
    live.current.duration = duration;
    live.current.onSeek = onSeek;
  }, [width, duration, onSeek]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          const l = live.current;
          l.start = l.width > 0 ? clamp01(event.nativeEvent.locationX / l.width) : 0;
          l.fraction = l.start;
          setDragFraction(l.start);
        },
        onPanResponderMove: (_event, gesture) => {
          const l = live.current;
          if (l.width <= 0) return;
          l.fraction = clamp01(l.start + gesture.dx / l.width);
          setDragFraction(l.fraction);
        },
        onPanResponderRelease: () => {
          const l = live.current;
          if (l.duration > 0) l.onSeek(l.fraction * l.duration);
          setDragFraction(null);
        },
        onPanResponderTerminate: () => setDragFraction(null),
      }),
    []
  );

  const fraction = dragFraction ?? (duration > 0 ? clamp01(position / duration) : 0);
  const shownPosition = dragFraction !== null ? dragFraction * duration : position;

  return (
    <View>
      <View
        {...responder.panHandlers}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        accessibilityRole="adjustable"
        accessibilityLabel="Seek"
        accessibilityValue={{ min: 0, max: Math.round(duration), now: Math.round(shownPosition) }}
        style={styles.touchArea}>
        <View pointerEvents="none" style={[styles.track, { backgroundColor: theme.border }]}>
          <View
            style={[styles.fill, { backgroundColor: theme.accent, width: `${fraction * 100}%` }]}
          />
        </View>
        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              backgroundColor: theme.accent,
              left: fraction * Math.max(0, width - THUMB),
              transform: [{ scale: dragFraction !== null ? 1.4 : 1 }],
            },
          ]}
        />
      </View>
      <View style={styles.times}>
        <Text style={[styles.time, { color: theme.textSecondary }]}>
          {formatDuration(shownPosition)}
        </Text>
        <Text style={[styles.time, { color: theme.textSecondary }]}>
          {formatDuration(duration)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  touchArea: { height: 36, justifyContent: 'center' },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4 },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    top: (36 - THUMB) / 2,
  },
  times: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -spacing.xs },
  time: { fontSize: 12, fontVariant: ['tabular-nums'] },
});
