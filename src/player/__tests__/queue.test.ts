import type { Track } from '@/library/types';

import {
  nextRepeatMode,
  removeAt,
  resolveSavedQueue,
  shuffled,
  shuffleFrom,
  toSavedQueue,
  unshuffle,
} from '../queue';

const track = (id: string): Track => ({
  id,
  uri: `file:///${id}.mp3`,
  filename: `${id}.mp3`,
  title: id,
  artist: 'x',
  duration: 100,
  addedAt: 0,
});
const tracks = ['a', 'b', 'c', 'd', 'e'].map(track);
const ids = (list: readonly Track[]) => list.map((t) => t.id);

/** Deterministic pseudo-random numbers. */
function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

describe('shuffled', () => {
  it('keeps every item exactly once and leaves the input alone', () => {
    const input = [1, 2, 3, 4, 5, 6];
    const out = shuffled(input, seeded(7));
    expect(out.slice().sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6]);
    expect(out).not.toEqual(input);
  });
});

describe('shuffleFrom', () => {
  it('puts the current track first and keeps all the others', () => {
    const { queue, index } = shuffleFrom(tracks, 2, seeded(1));
    expect(index).toBe(0);
    expect(queue[0].id).toBe('c');
    expect(ids(queue).sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('handles an out of range start', () => {
    expect(shuffleFrom(tracks, 99, seeded(1)).queue).toHaveLength(5);
    expect(shuffleFrom([], 0)).toEqual({ queue: [], index: 0 });
  });
});

describe('unshuffle', () => {
  it('restores the original order at the current track', () => {
    expect(unshuffle(tracks, 'd')).toEqual({ queue: tracks, index: 3 });
  });

  it('falls back to the start when the track is gone', () => {
    expect(unshuffle(tracks, 'zzz').index).toBe(0);
  });
});

describe('removeAt', () => {
  it('shifts the current index when an earlier track is removed', () => {
    const r = removeAt(tracks, 3, 1);
    expect(ids(r.queue)).toEqual(['a', 'c', 'd', 'e']);
    expect(r.index).toBe(2);
  });

  it('keeps the current index when a later track is removed', () => {
    expect(removeAt(tracks, 1, 4).index).toBe(1);
  });

  it('clamps when the last, current track is removed', () => {
    expect(removeAt(tracks, 4, 4).index).toBe(3);
  });

  it('ignores an out of range index', () => {
    expect(removeAt(tracks, 2, 9)).toEqual({ queue: tracks, index: 2 });
  });
});

describe('nextRepeatMode', () => {
  it('cycles off, all, one', () => {
    expect(nextRepeatMode('off')).toBe('all');
    expect(nextRepeatMode('all')).toBe('one');
    expect(nextRepeatMode('one')).toBe('off');
  });
});

describe('saved queue', () => {
  const shuffledQueue = [tracks[2], tracks[0], tracks[4], tracks[1], tracks[3]];

  it('round-trips through the library', () => {
    const saved = toSavedQueue(shuffledQueue, tracks, 2);
    expect(saved.currentId).toBe('e');
    expect(resolveSavedQueue(saved, tracks)).toEqual({
      queue: shuffledQueue,
      baseQueue: tracks,
      index: 2,
      currentSurvived: true,
    });
  });

  it('drops tracks that were deleted from the device', () => {
    const saved = toSavedQueue(shuffledQueue, tracks, 2);
    const library = tracks.filter((t) => t.id !== 'e' && t.id !== 'a');
    const resolved = resolveSavedQueue(saved, library);
    expect(ids(resolved!.queue)).toEqual(['c', 'b', 'd']);
    expect(ids(resolved!.baseQueue)).toEqual(['b', 'c', 'd']);
    expect(resolved!.index).toBe(0);
    expect(resolved!.currentSurvived).toBe(false);
  });

  it('returns null when nothing is left', () => {
    expect(resolveSavedQueue(toSavedQueue(tracks, tracks, 0), [])).toBeNull();
  });
});
