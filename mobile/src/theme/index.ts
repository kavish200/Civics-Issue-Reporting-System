import { useColorScheme } from 'react-native';
import { lightColors, darkColors, ThemeColors } from './colors';
import { spacing, radii } from './spacing';
import { typography } from './typography';

export const colors = lightColors;
export { lightColors, darkColors, spacing, radii, typography };
export type { ThemeColors };

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const activeColors: ThemeColors = isDark ? darkColors : lightColors;

  return {
    colors: activeColors,
    isDark,
    spacing,
    radii,
    typography,
  };
}
