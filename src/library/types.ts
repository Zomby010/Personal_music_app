export type Track = {
  /** MediaStore id; stable while the file stays on the device. */
  id: string;
  uri: string;
  filename: string;
  title: string;
  artist: string;
  /** Seconds. */
  duration: number;
  /** Milliseconds since epoch. */
  addedAt: number;
};

/** The subset of a media library asset the app relies on. */
export type AudioAsset = {
  id: string;
  uri: string;
  filename: string;
  duration: number;
  creationTime: number;
  modificationTime: number;
};
