import {
  createAudioPlaylist,
  requestNotificationPermissionsAsync,
  setAudioModeAsync,
  type AudioPlaylist,
  type AudioPlaylistStatus,
} from 'expo-audio';

import type { Track } from '@/library/types';
import { usePlayerStore } from '@/store/playerStore';

/**
 * Thin wrapper around a native expo-audio playlist. The playlist owns the
 * queue natively, so tracks keep advancing while the app is in the background.
 */

let playlist: AudioPlaylist | null = null;
let queueRef: Track[] | null = null;
let audioModeReady: Promise<void> | null = null;
let askedForNotifications = false;

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

function onStatus(status: AudioPlaylistStatus) {
  usePlayerStore.setState({
    currentIndex: status.currentIndex,
    playing: status.playing,
    position: status.currentTime,
    duration: status.duration,
  });
}

function onTrackChanged({ currentIndex }: { currentIndex: number }) {
  const track = queueRef?.[currentIndex];
  if (track) playlist?.updateLockScreenMetadata(metadataFor(track));
  usePlayerStore.setState({ currentIndex, position: 0 });
}

/** Replaces the queue with `tracks` and starts playing at `startIndex`. */
export async function playQueue(tracks: Track[], startIndex: number): Promise<void> {
  const track = tracks[startIndex];
  if (!track) return;

  await ensureAudioMode();
  if (!askedForNotifications) {
    askedForNotifications = true;
    // Needed on Android 13+ for the playback notification. Playback works without it.
    requestNotificationPermissionsAsync().catch(() => {});
  }

  if (!playlist || queueRef !== tracks) {
    playlist?.destroy();
    playlist = createAudioPlaylist({
      sources: tracks.map((t) => ({ uri: t.uri, name: t.title })),
      updateInterval: 500,
      loop: 'all',
    });
    playlist.addListener('playlistStatusUpdate', onStatus);
    playlist.addListener('trackChanged', onTrackChanged);
    queueRef = tracks;
  }

  usePlayerStore.setState({
    queue: tracks,
    currentIndex: startIndex,
    playing: true,
    position: 0,
    duration: track.duration,
  });

  playlist.skipTo(startIndex);
  playlist.setActiveForLockScreen(true, metadataFor(track), {
    showNextTrack: true,
    showPreviousTrack: true,
    showSeekForward: false,
    showSeekBackward: false,
  });
  playlist.play();
}

export function togglePlay(): void {
  if (!playlist) return;
  if (playlist.playing) playlist.pause();
  else playlist.play();
}

export function next(): void {
  playlist?.next();
}

/** Restarts the track if it is more than 3 seconds in, otherwise goes back one. */
export function previous(): void {
  if (!playlist) return;
  if (playlist.currentTime > 3) void playlist.seekTo(0);
  else playlist.previous();
}

export function seekTo(seconds: number): void {
  void playlist?.seekTo(seconds);
}
