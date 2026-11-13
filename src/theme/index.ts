import { useColorScheme } from 'react-native';

export const palettes = {
  dark: {
    background: '#101014',
    surface: '#1B1B22',
    surfaceRaised: '#26262F',
    text: '#F5F5F7',
    textSecondary: '#9A9AA8',
    accent: '#8B7CFF',
    onAccent: '#FFFFFF',
    border: '#2C2C36',
  },
  light: {
    background: '#FAFAFC',
    surface: '#FFFFFF',
    surfaceRaised: '#EFEFF4',
    text: '#14141A',
    textSecondary: '#6B6B78',
    accent: '#5B48E8',
    onAccent: '#FFFFFF',
    border: '#E2E2EA',
  },
} as const;

export type Palette = { [K in keyof typeof palettes.dark]: string };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** Colours for the current system theme. Dark is the default when the system has no preference. */
export function useTheme(): Palette {
  return useColorScheme() === 'light' ? palettes.light : palettes.dark;
}
