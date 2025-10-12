import { ColorScheme, ThemeColors } from '@/contexts/ThemeContext';

// Helper function to create variations from a base pastel color
const createColorVariations = (
  baseHue: number,
  baseSat: number,
  baseLightness: number
): ThemeColors => {
  // Primary: More saturated and slightly darker version of the base
  const primary = `${baseHue} ${Math.min(baseSat + 20, 85)}% ${Math.max(
    baseLightness - 10,
    45
  )}%`;

  // Accent: Complementary or analogous hue with adjusted saturation
  const accentHue = (baseHue + 30) % 360; // Analogous color (30 degrees apart)
  const accent = `${accentHue} ${Math.min(baseSat + 15, 80)}% ${Math.max(
    baseLightness - 5,
    50
  )}%`;

  // Base: The original pastel color
  const base = `${baseHue} ${baseSat}% ${baseLightness}%`;

  return { primary, accent, base };
};

// Pastel base colors - soft, gentle, and pleasing
export const COLOR_SCHEMES: Record<ColorScheme, ThemeColors> = {
  lavender: createColorVariations(270, 55, 75), // Soft lavender
  mint: createColorVariations(150, 45, 75), // Gentle mint green
  peach: createColorVariations(25, 60, 80), // Warm peach
  sky: createColorVariations(200, 50, 78), // Soft sky blue
  rose: createColorVariations(340, 50, 78), // Gentle rose pink
  cream: createColorVariations(45, 35, 82), // Warm cream/beige
};

export const COLOR_SCHEME_LABELS: Record<ColorScheme, string> = {
  lavender: 'Lavender Dreams',
  mint: 'Mint Fresh',
  peach: 'Peachy Warm',
  sky: 'Sky Serenity',
  rose: 'Rose Garden',
  cream: 'Creamy Comfort',
};

export const applyTheme = (colorScheme: ColorScheme, isDark: boolean) => {
  try {
    const colors = COLOR_SCHEMES[colorScheme];

    // Safety check - if colors don't exist, fallback to default
    if (!colors || !colors.primary || !colors.accent) {
      console.warn(
        `Invalid color scheme: ${colorScheme}, falling back to lavender`
      );
      const fallbackColors = COLOR_SCHEMES.lavender;
      applyThemeColors(fallbackColors, isDark);
      return;
    }

    applyThemeColors(colors, isDark);
  } catch (error) {
    console.error('Error applying theme:', error);
    // Fallback to default theme
    const fallbackColors = COLOR_SCHEMES.lavender;
    applyThemeColors(fallbackColors, isDark);
  }
};

const applyThemeColors = (colors: ThemeColors, isDark: boolean) => {
  const root = document.documentElement;

  // Apply color scheme
  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--accent', colors.accent);

  // Apply dark/light mode
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Update gradients based on current theme - using primary and accent for harmonious gradients
  root.style.setProperty(
    '--gradient-primary',
    `linear-gradient(135deg, hsl(${colors.primary}), hsl(${colors.accent}))`
  );
  root.style.setProperty(
    '--gradient-accent',
    `linear-gradient(135deg, hsl(${colors.accent}), hsl(${colors.primary}))`
  );
};

export const getSystemTheme = (): boolean => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};
