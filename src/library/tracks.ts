import type { AudioAsset, Track } from './types';

export const UNKNOWN_ARTIST = 'Unknown artist';
export const DEFAULT_MIN_DURATION_SECONDS = 30;

/** Removes the extension and tidies separators: "01_my-song.mp3" -> "01 my-song". */
function cleanName(filename: string): string {
  return filename
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Guesses title and artist from a file name. Handles the common
 * "Artist - Title" pattern and a leading track number ("03 - Title", "03. Title").
 */
export function parseFilename(filename: string): { title: string; artist: string } {
  const name = cleanName(filename).replace(/^\d{1,3}\s*[.)-]?\s+(?=\S)/, '');
  const separator = name.indexOf(' - ');
  if (separator > 0) {
    const artist = name.slice(0, separator).trim();
    const title = name.slice(separator + 3).trim();
    if (artist && title) return { title, artist };
  }
  return { title: name || filename, artist: UNKNOWN_ARTIST };
}

export function trackFromAsset(asset: AudioAsset): Track {
  const { title, artist } = parseFilename(asset.filename);
  return {
    id: asset.id,
    uri: asset.uri,
    filename: asset.filename,
    title,
    artist,
    duration: asset.duration,
    addedAt: asset.modificationTime || asset.creationTime || 0,
  };
}

/**
 * Turns raw assets into the Songs list: drops short clips (ringtones, voice
 * notes) and sorts by title.
 */
export function buildTrackList(
  assets: AudioAsset[],
  minDurationSeconds: number = DEFAULT_MIN_DURATION_SECONDS
): Track[] {
  return assets
    .filter((asset) => asset.duration >= minDurationSeconds)
    .map(trackFromAsset)
    .sort(compareByTitle);
}

export function compareByTitle(a: Track, b: Track): number {
  return (
    a.title.localeCompare(b.title, undefined, { sensitivity: 'base', numeric: true }) ||
    a.id.localeCompare(b.id)
  );
}

/** 75 -> "1:15", 3725 -> "1:02:05". */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}
