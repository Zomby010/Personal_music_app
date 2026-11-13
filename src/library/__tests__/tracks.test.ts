import {
  buildTrackList,
  formatDuration,
  parseFilename,
  trackFromAsset,
  UNKNOWN_ARTIST,
} from '../tracks';
import type { AudioAsset } from '../types';

const asset = (over: Partial<AudioAsset>): AudioAsset => ({
  id: '1',
  uri: 'file:///music/a.mp3',
  filename: 'a.mp3',
  duration: 200,
  creationTime: 1,
  modificationTime: 2,
  ...over,
});

describe('parseFilename', () => {
  it('splits "Artist - Title"', () => {
    expect(parseFilename('Sauti Sol - Suzanna.mp3')).toEqual({
      title: 'Suzanna',
      artist: 'Sauti Sol',
    });
  });

  it('keeps later dashes in the title', () => {
    expect(parseFilename('Artist - Song - Live.mp3')).toEqual({
      title: 'Song - Live',
      artist: 'Artist',
    });
  });

  it('falls back to unknown artist', () => {
    expect(parseFilename('my_favourite_song.m4a')).toEqual({
      title: 'my favourite song',
      artist: UNKNOWN_ARTIST,
    });
  });

  it('drops a leading track number', () => {
    expect(parseFilename('03 - Intro.mp3')).toEqual({ title: 'Intro', artist: UNKNOWN_ARTIST });
    expect(parseFilename('03. Artist - Intro.flac')).toEqual({ title: 'Intro', artist: 'Artist' });
  });

  it('keeps titles that are only a number', () => {
    expect(parseFilename('1979.mp3').title).toBe('1979');
  });

  it('handles names without an extension', () => {
    expect(parseFilename('recording').title).toBe('recording');
  });
});

describe('trackFromAsset', () => {
  it('prefers the modification time for addedAt', () => {
    expect(trackFromAsset(asset({ creationTime: 5, modificationTime: 9 })).addedAt).toBe(9);
    expect(trackFromAsset(asset({ creationTime: 5, modificationTime: 0 })).addedAt).toBe(5);
  });
});

describe('buildTrackList', () => {
  it('drops short clips and sorts by title, ignoring case', () => {
    const tracks = buildTrackList([
      asset({ id: '1', filename: 'zebra.mp3' }),
      asset({ id: '2', filename: 'ringtone.mp3', duration: 12 }),
      asset({ id: '3', filename: 'Apple.mp3' }),
      asset({ id: '4', filename: 'banana.mp3', duration: 30 }),
    ]);
    expect(tracks.map((t) => t.title)).toEqual(['Apple', 'banana', 'zebra']);
  });

  it('respects a custom minimum duration', () => {
    expect(buildTrackList([asset({ duration: 12 })], 0)).toHaveLength(1);
  });
});

describe('formatDuration', () => {
  it.each([
    [0, '0:00'],
    [9.9, '0:09'],
    [75, '1:15'],
    [3725, '1:02:05'],
    [-4, '0:00'],
    [NaN, '0:00'],
  ])('%p -> %p', (input, expected) => {
    expect(formatDuration(input)).toBe(expected);
  });
});
