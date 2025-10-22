import { createContext, useContext } from 'react';

export type ColorScheme =
  | 'github'
  | 'lavender'
  | 'mint'
  | 'peach'
  | 'sky'
  | 'rose'
  | 'cream';
export type Mode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  primary: string;
  accent: string;
  base: string; // The original pastel color
}

export interface ThemeConfig {
  colorScheme: ColorScheme;
  mode: Mode;
  colors: ThemeColors;
}

export interface ThemeContextType {
  theme: ThemeConfig;
  setColorScheme?: (colorScheme: ColorScheme) => void; // Optional - not used when color is fixed
  setMode: (mode: Mode) => void;
  isDark: boolean;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
