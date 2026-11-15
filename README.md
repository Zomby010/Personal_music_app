# My Music

A personal, fully offline music player for Android, built with React Native and Expo. It finds the audio files already on the phone and plays them. No accounts, no network access, no ads.

## Install on a phone

Every push to `main` and every pull request builds an APK. Open the latest run of the **Android APK** workflow under the Actions tab, download the `my-music-apk` artifact, unzip it, and open `app-release.apk` on the phone.

## Develop

```bash
npm install
npm run typecheck
npm test
npm run android   # needs Android Studio and a device or emulator
```

The app uses native modules (`expo-audio`, `expo-media-library`), so it runs in a development build rather than Expo Go.

### Live changes on your phone

The **Android APK** workflow also builds **My Music Dev** (`my-music-dev-apk`), a development build that installs next to the normal app. Install it once, then:

```bash
npx expo start
```

Open My Music Dev with the phone on the same Wi-Fi as your computer and pick the server. Saved changes appear on the phone straight away. Rebuild and reinstall only after adding a package with native code or changing `app.json` / `app.config.js`.

Unlike the release app, My Music Dev has network access, because it fetches its code from your computer. `app.config.js` turns this on only when `APP_VARIANT=development`.

## Layout

```
src/app/         Screens (Expo Router)
src/components/  Reusable UI
src/library/     Scanning the device and shaping the track list
src/player/      Playback on top of an expo-audio playlist
src/store/       Zustand stores
src/theme/       Colours and spacing
```

Playback uses `expo-audio`'s native playlist, which keeps the queue on the native side so songs keep advancing in the background and the lock screen controls work.
