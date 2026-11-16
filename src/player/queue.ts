import type { Track } from '@/library/types';

export type RepeatMode = 'off' | 'all' | 'one';

export type QueuePosition = { queue: Track[]; index: number };

/** Fisher-Yates shuffle that returns a new array. `random` is injectable for tests. */
export function shuffled<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Builds a shuffled play order that starts with the track at `startIndex`, so
 * turning shuffle on never interrupts the current song.
 */
export function shuffleFrom(
  tracks: readonly Track[],
  startIndex: number,
  random: () => number = Math.random
): QueuePosition {
  const current = tracks[startIndex];
  if (!current) return { queue: shuffled(tracks, random), index: 0 };
  const rest = tracks.filter((_, i) => i !== startIndex);
  return { queue: [current, ...shuffled(rest, random)], index: 0 };
}

/** Goes back to the original order, keeping the same track current. */
export function unshuffle(baseQueue: readonly Track[], currentId: string | undefined): QueuePosition {
  const index = baseQueue.findIndex((t) => t.id === currentId);
  return { queue: baseQueue.slice(), index: Math.max(0, index) };
}

/** Removes one entry and returns the queue plus the adjusted current index. */
export function removeAt(queue: readonly Track[], currentIndex: number, index: number): QueuePosition {
  if (index < 0 || index >= queue.length) return { queue: queue.slice(), index: currentIndex };
  const next = queue.filter((_, i) => i !== index);
  let nextIndex = index < currentIndex ? currentIndex - 1 : currentIndex;
  nextIndex = Math.min(nextIndex, next.length - 1);
  return { queue: next, index: nextIndex };
}

export function nextRepeatMode(mode: RepeatMode): RepeatMode {
  return mode === 'off' ? 'all' : mode === 'all' ? 'one' : 'off';
}

/** What gets written to disk so playback can resume after a restart. */
export type SavedQueue = {
  queueIds: string[];
  baseIds: string[];
  currentId: string | null;
};

export function toSavedQueue(
  queue: readonly Track[],
  baseQueue: readonly Track[],
  currentIndex: number
): SavedQueue {
  return {
    queueIds: queue.map((t) => t.id),
    baseIds: baseQueue.map((t) => t.id),
    currentId: queue[currentIndex]?.id ?? null,
  };
}

/**
 * Rebuilds a saved queue against the current library. Tracks deleted from the
 * device are dropped. Returns null when nothing playable is left.
 */
export function resolveSavedQueue(
  saved: SavedQueue,
  library: readonly Track[]
): { queue: Track[]; baseQueue: Track[]; index: number; currentSurvived: boolean } | null {
  const byId = new Map(library.map((t) => [t.id, t]));
  const pick = (ids: string[]) =>
    ids.map((id) => byId.get(id)).filter((t): t is Track => t !== undefined);
  const queue = pick(saved.queueIds);
  if (queue.length === 0) return null;
  const baseQueue = pick(saved.baseIds);
  const found = queue.findIndex((t) => t.id === saved.currentId);
  return {
    queue,
    baseQueue: baseQueue.length === queue.length ? baseQueue : queue,
    index: Math.max(0, found),
    currentSurvived: found >= 0,
  };
}
