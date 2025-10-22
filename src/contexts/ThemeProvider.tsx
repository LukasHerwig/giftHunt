import { useEffect, useState, ReactNode } from 'react';
import { ThemeContext, ThemeConfig, ColorScheme, Mode } from './ThemeContext';
import { COLOR_SCHEMES, applyTheme, getSystemTheme } from '@/lib/theme';

interface ThemeProviderProps {
  children: ReactNode;
}

const DEFAULT_THEME: ThemeConfig = {
  colorScheme: 'github',
  mode: 'system',
  colors: COLOR_SCHEMES.github,
};

const STORAGE_KEY = 'wishlist-theme';

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    // Load theme from localStorage on initialization
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY);
      if (savedTheme) {
        const parsed = JSON.parse(savedTheme);
        // Ensure the saved colorScheme exists in our new COLOR_SCHEMES
        const validColorScheme = COLOR_SCHEMES[
          parsed.colorScheme as ColorScheme
        ]
          ? parsed.colorScheme
          : DEFAULT_THEME.colorScheme;

        return {
          ...DEFAULT_THEME,
          ...parsed,
          colorScheme: validColorScheme,
          colors: COLOR_SCHEMES[validColorScheme],
        };
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    }
    return DEFAULT_THEME;
  });

  const [isDark, setIsDark] = useState(() => {
    if (theme.mode === 'system') {
      return getSystemTheme();
    }
    return theme.mode === 'dark';
  });

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }, [theme]);

  // Handle system theme changes
  useEffect(() => {
    if (theme.mode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    setIsDark(mediaQuery.matches);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme.mode]);

  // Apply theme changes to DOM
  useEffect(() => {
    applyTheme(theme.colorScheme, isDark);
  }, [theme.colorScheme, isDark]);

  // Enable color scheme switching - users can choose between themes
  const setColorScheme = (colorScheme: ColorScheme) => {
    // Ensure the color scheme exists
    if (!COLOR_SCHEMES[colorScheme]) {
      console.warn(`Invalid color scheme: ${colorScheme}`);
      return;
    }

    setTheme((prev) => ({
      ...prev,
      colorScheme,
      colors: COLOR_SCHEMES[colorScheme],
    }));
  };

  const setMode = (mode: Mode) => {
    setTheme((prev) => ({ ...prev, mode }));

    if (mode === 'system') {
      setIsDark(getSystemTheme());
    } else {
      setIsDark(mode === 'dark');
    }
  };

  const value = {
    theme,
    setColorScheme, // Enable color scheme switching
    setMode,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
