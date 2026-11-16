import { createMMKV } from 'react-native-mmkv';

import type { RepeatMode, SavedQueue } from '@/player/queue';

const storage = createMMKV({ id: 'my-music' });

const KEYS = {
  queue: 'player.queue',
  position: 'player.position',
  shuffle: 'player.shuffle',
  repeat: 'player.repeat',
} as const;

export function saveQueue(queue: SavedQueue): void {
  storage.set(KEYS.queue, JSON.stringify(queue));
}

export function loadQueue(): SavedQueue | null {
  const raw = storage.getString(KEYS.queue);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SavedQueue>;
    if (!Array.isArray(parsed.queueIds) || !Array.isArray(parsed.baseIds)) return null;
    return {
      queueIds: parsed.queueIds,
      baseIds: parsed.baseIds,
      currentId: typeof parsed.currentId === 'string' ? parsed.currentId : null,
    };
  } catch {
    return null;
  }
}

export function clearQueue(): void {
  storage.remove(KEYS.queue);
  storage.remove(KEYS.position);
}

/** Remembers which track is current and how far into it playback is. */
export function savePosition(currentId: string, seconds: number): void {
  storage.set(KEYS.position, JSON.stringify({ id: currentId, seconds }));
}

export function loadPosition(): { id: string; seconds: number } | null {
  const raw = storage.getString(KEYS.position);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { id?: unknown; seconds?: unknown };
    if (typeof parsed.id !== 'string' || typeof parsed.seconds !== 'number') return null;
    return { id: parsed.id, seconds: parsed.seconds };
  } catch {
    return null;
  }
}

export function saveShuffle(on: boolean): void {
  storage.set(KEYS.shuffle, on);
}

export function loadShuffle(): boolean {
  return storage.getBoolean(KEYS.shuffle) ?? false;
}

export function saveRepeat(mode: RepeatMode): void {
  storage.set(KEYS.repeat, mode);
}

export function loadRepeat(): RepeatMode {
  const mode = storage.getString(KEYS.repeat);
  return mode === 'off' || mode === 'one' || mode === 'all' ? mode : 'all';
}
