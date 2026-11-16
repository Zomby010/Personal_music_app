import {
  createAudioPlaylist,
  requestNotificationPermissionsAsync,
  setAudioModeAsync,
  type AudioPlaylist,
  type AudioPlaylistLoopMode,
  type AudioPlaylistStatus,
} from 'expo-audio';

import type { Track } from '@/library/types';
import { usePlayerStore } from '@/store/playerStore';
import * as storage from '@/store/storage';

import {
  nextRepeatMode,
  removeAt,
  resolveSavedQueue,
  shuffleFrom,
  toSavedQueue,
  unshuffle,
  type RepeatMode,
} from './queue';

/**
 * Thin wrapper around a native expo-audio playlist. The playlist owns the
 * queue natively, so tracks keep advancing while the app is in the background.
 * The Zustand store mirrors it for the UI, and MMKV remembers it across restarts.
 */

const POSITION_SAVE_INTERVAL_MS = 5000;
const LOOP_MODE: Record<RepeatMode, AudioPlaylistLoopMode> = {
  off: 'none',
  all: 'all',
  one: 'single',
};

let playlist: AudioPlaylist | null = null;
let lockScreenActive = false;
let audioModeReady: Promise<void> | null = null;
let askedForNotifications = false;
let lastPositionSave = 0;
/**
 * Native calls are applied asynchronously. After asking for a jump, status
 * events that still report the old track are ignored until this index shows up.
 */
let pendingIndex: number | null = null;

function ensureAudioMode(): Promise<void> {
  audioModeReady ??= setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: 'doNotMixPersistent',
  });
  return audioModeReady;
}

function metadataFor(track: Track) {
  return { title: track.title, artist: track.artist };
}

function persistPosition(): void {
  const { queue, currentIndex, position } = usePlayerStore.getState();
  const track = queue[currentIndex];
  if (track) storage.savePosition(track.id, position);
  lastPositionSave = Date.now();
}

function persistQueue(): void {
  const { queue, baseQueue, currentIndex } = usePlayerStore.getState();
  if (queue.length === 0) storage.clearQueue();
  else storage.saveQueue(toSavedQueue(queue, baseQueue, currentIndex));
}

/** Reacts to the native player moving to another track, whichever event reports it first. */
function syncCurrentIndex(source: AudioPlaylist, currentIndex: number): void {
  const state = usePlayerStore.getState();
  if (currentIndex === state.currentIndex) return;
  const track = state.queue[currentIndex];
  if (!track) return;
  if (lockScreenActive) source.updateLockScreenMetadata(metadataFor(track));
  usePlayerStore.setState({ currentIndex, position: 0, duration: track.duration });
  persistPosition();
}

function onStatus(source: AudioPlaylist, status: AudioPlaylistStatus) {
  if (source !== playlist) return;
  if (pendingIndex !== null) {
    if (status.currentIndex !== pendingIndex) return;
    pendingIndex = null;
  }
  syncCurrentIndex(source, status.currentIndex);
  const wasPlaying = usePlayerStore.getState().playing;
  usePlayerStore.setState({
    playing: status.playing,
    position: status.currentTime,
    // Keep the scanned duration until the native player knows the real one.
    ...(status.duration > 0 ? { duration: status.duration } : null),
  });
  const pausedNow = wasPlaying && !status.playing;
  if (pausedNow || (status.playing && Date.now() - lastPositionSave > POSITION_SAVE_INTERVAL_MS)) {
    persistPosition();
  }
}

function activateLockScreen(): void {
  const { queue, currentIndex } = usePlayerStore.getState();
  const track = queue[currentIndex];
  if (!playlist || !track) return;
  playlist.setActiveForLockScreen(true, metadataFor(track), {
    showNextTrack: true,
    showPreviousTrack: true,
    showSeekForward: false,
    showSeekBackward: false,
  });
  lockScreenActive = true;
  if (!askedForNotifications) {
    askedForNotifications = true;
    // Needed on Android 13+ for the playback notification. Playback works without it.
    requestNotificationPermissionsAsync().catch(() => {});
  }
}

/** Replaces the native playlist. This is the only place a playlist is created. */
async function load(
  queue: Track[],
  baseQueue: Track[],
  index: number,
  position: number,
  autoplay: boolean
): Promise<void> {
  const track = queue[index];
  if (!track) return;
  await ensureAudioMode();

  playlist?.destroy();
  lockScreenActive = false;

  const created = createAudioPlaylist({
    sources: queue.map((t) => ({ uri: t.uri, name: t.title })),
    updateInterval: 500,
    loop: LOOP_MODE[usePlayerStore.getState().repeat],
  });
  playlist = created;
  created.addListener('playlistStatusUpdate', (status) => onStatus(created, status));
  created.addListener('trackChanged', (e) => {
    if (created === playlist && pendingIndex === null) syncCurrentIndex(created, e.currentIndex);
  });

  usePlayerStore.setState({
    queue,
    baseQueue,
    currentIndex: index,
    playing: autoplay,
    position,
    duration: track.duration,
  });
  persistQueue();
  persistPosition();

  pendingIndex = index;
  if (index > 0) created.skipTo(index);
  if (position > 0) void created.seekTo(position);
  if (autoplay) {
    activateLockScreen();
    created.play();
  }
}

/** Jumps inside the existing playlist and plays. */
function jumpTo(index: number): void {
  const track = usePlayerStore.getState().queue[index];
  if (!playlist || !track) return;
  usePlayerStore.setState({ currentIndex: index, position: 0, duration: track.duration, playing: true });
  pendingIndex = index;
  playlist.skipTo(index);
  if (lockScreenActive) playlist.updateLockScreenMetadata(metadataFor(track));
  else activateLockScreen();
  playlist.play();
  persistPosition();
}

/** Starts playing `tracks` at `startIndex`, honouring the shuffle setting. */
export async function playQueue(tracks: Track[], startIndex: number): Promise<void> {
  if (!tracks[startIndex]) return;
  const state = usePlayerStore.getState();

  if (state.shuffle) {
    const { queue, index } = shuffleFrom(tracks, startIndex);
    await load(queue, tracks, index, 0, true);
    return;
  }
  // Same list as before: jump inside the existing playlist instead of rebuilding it.
  if (playlist && state.queue === tracks) {
    jumpTo(startIndex);
    return;
  }
  await load(tracks, tracks, startIndex, 0, true);
}

/** Jumps to a position in the current queue. */
export function playQueueIndex(index: number): void {
  jumpTo(index);
}

export function togglePlay(): void {
  if (!playlist) return;
  if (playlist.playing) {
    playlist.pause();
  } else {
    if (!lockScreenActive) activateLockScreen();
    playlist.play();
  }
}

export function next(): void {
  playlist?.next();
}

/** Restarts the track if it is more than 3 seconds in, otherwise goes back one. */
export function previous(): void {
  if (!playlist) return;
  if (playlist.currentTime > 3) seekTo(0);
  else playlist.previous();
}

export function seekTo(seconds: number): void {
  if (!playlist) return;
  usePlayerStore.setState({ position: seconds });
  void playlist.seekTo(seconds);
  persistPosition();
}

export async function toggleShuffle(): Promise<void> {
  const state = usePlayerStore.getState();
  const shuffle = !state.shuffle;
  usePlayerStore.setState({ shuffle });
  storage.saveShuffle(shuffle);

  const current = state.queue[state.currentIndex];
  if (!playlist || !current) return;

  // The native playlist cannot be reordered in place, so rebuild it and resume
  // the current track where it was.
  const { queue, index } = shuffle
    ? shuffleFrom(state.queue, state.currentIndex)
    : unshuffle(state.baseQueue, current.id);
  const baseQueue = shuffle ? state.queue : queue;
  await load(queue, baseQueue, index, playlist.currentTime, playlist.playing);
}

export function cycleRepeat(): void {
  const repeat = nextRepeatMode(usePlayerStore.getState().repeat);
  usePlayerStore.setState({ repeat });
  storage.saveRepeat(repeat);
  if (playlist) playlist.loop = LOOP_MODE[repeat];
}

/** Removes an upcoming or past track from the queue. The current track stays. */
export function removeFromQueue(index: number): void {
  const state = usePlayerStore.getState();
  const removed = state.queue[index];
  if (!playlist || !removed || index === state.currentIndex) return;
  const result = removeAt(state.queue, state.currentIndex, index);
  const baseIndex = state.baseQueue.lastIndexOf(removed);
  usePlayerStore.setState({
    queue: result.queue,
    baseQueue: state.baseQueue.filter((_, i) => i !== baseIndex),
    currentIndex: result.index,
  });
  pendingIndex = result.index;
  playlist.remove(index);
  persistQueue();
}

/**
 * Restores the last session's queue, paused where it stopped. Called once the
 * library has been scanned, so saved ids can be matched to files still on the device.
 */
export async function restoreSession(library: Track[]): Promise<void> {
  usePlayerStore.setState({ shuffle: storage.loadShuffle(), repeat: storage.loadRepeat() });
  if (playlist) return;
  const saved = storage.loadQueue();
  if (!saved) return;
  const resolved = resolveSavedQueue(saved, library);
  if (!resolved) {
    storage.clearQueue();
    return;
  }
  const savedPosition = storage.loadPosition();
  const current = resolved.queue[resolved.index];
  const position =
    resolved.currentSurvived && savedPosition?.id === current.id ? savedPosition.seconds : 0;
  await load(resolved.queue, resolved.baseQueue, resolved.index, position, false);
}
