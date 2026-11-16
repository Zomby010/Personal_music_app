import { create } from 'zustand';

import type { Track } from '@/library/types';
import type { RepeatMode } from '@/player/queue';

export type PlayerState = {
  /** Tracks in the order they will play. */
  queue: Track[];
  /** The same tracks in their original order, used to turn shuffle back off. */
  baseQueue: Track[];
  currentIndex: number;
  playing: boolean;
  /** Seconds. */
  position: number;
  /** Seconds. */
  duration: number;
  shuffle: boolean;
  repeat: RepeatMode;
};

export const usePlayerStore = create<PlayerState>(() => ({
  queue: [],
  baseQueue: [],
  currentIndex: -1,
  playing: false,
  position: 0,
  duration: 0,
  shuffle: false,
  repeat: 'all',
}));

export function selectCurrentTrack(state: PlayerState): Track | null {
  return state.queue[state.currentIndex] ?? null;
}
