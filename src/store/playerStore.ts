import { create } from 'zustand';

import type { Track } from '@/library/types';

export type PlayerState = {
  queue: Track[];
  currentIndex: number;
  playing: boolean;
  /** Seconds. */
  position: number;
  /** Seconds. */
  duration: number;
};

export const usePlayerStore = create<PlayerState>(() => ({
  queue: [],
  currentIndex: -1,
  playing: false,
  position: 0,
  duration: 0,
}));

export function selectCurrentTrack(state: PlayerState): Track | null {
  return state.queue[state.currentIndex] ?? null;
}
