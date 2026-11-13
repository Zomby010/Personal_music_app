import { create } from 'zustand';

import {
  getAudioPermission,
  requestAudioPermission,
  scanDeviceAudio,
  type PermissionState,
} from '@/library/scan';
import { buildTrackList } from '@/library/tracks';
import type { Track } from '@/library/types';

type LibraryState = {
  permission: PermissionState | 'unknown';
  tracks: Track[];
  scanning: boolean;
  error: string | null;
  /** Checks permission and scans if it is already granted. Called on app start. */
  init: () => Promise<void>;
  /** Shows the system permission prompt, then scans. */
  askPermission: () => Promise<void>;
  rescan: () => Promise<void>;
};

export const useLibraryStore = create<LibraryState>((set, get) => ({
  permission: 'unknown',
  tracks: [],
  scanning: false,
  error: null,

  init: async () => {
    const permission = await getAudioPermission();
    set({ permission });
    if (permission === 'granted') await get().rescan();
  },

  askPermission: async () => {
    const permission = await requestAudioPermission();
    set({ permission });
    if (permission === 'granted') await get().rescan();
  },

  rescan: async () => {
    if (get().scanning) return;
    set({ scanning: true, error: null });
    try {
      const assets = await scanDeviceAudio();
      set({ tracks: buildTrackList(assets) });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Could not read your music.' });
    } finally {
      set({ scanning: false });
    }
  },
}));
