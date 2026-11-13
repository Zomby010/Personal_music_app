import * as MediaLibrary from 'expo-media-library/legacy';

import type { AudioAsset } from './types';

const PAGE_SIZE = 500;

export type PermissionState = 'granted' | 'denied' | 'blocked';

function toState(response: MediaLibrary.PermissionResponse): PermissionState {
  if (response.granted) return 'granted';
  return response.canAskAgain ? 'denied' : 'blocked';
}

export async function getAudioPermission(): Promise<PermissionState> {
  return toState(await MediaLibrary.getPermissionsAsync(false, ['audio']));
}

export async function requestAudioPermission(): Promise<PermissionState> {
  return toState(await MediaLibrary.requestPermissionsAsync(false, ['audio']));
}

/** Reads every audio file Android's MediaStore knows about. */
export async function scanDeviceAudio(): Promise<AudioAsset[]> {
  const assets: AudioAsset[] = [];
  let after: string | undefined;
  for (;;) {
    const page = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.audio,
      first: PAGE_SIZE,
      after,
    });
    assets.push(...page.assets);
    if (!page.hasNextPage || page.assets.length === 0) break;
    after = page.endCursor;
  }
  return assets;
}
