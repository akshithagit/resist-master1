/**
 * Resist - Theme Context
 * Default is Light Theme. Provides monochrome light/dark theme switching across the app.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { LightTheme, DarkTheme, Theme } from '../constants/theme';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: LightTheme,
  isDark: false,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Explicitly default to Light Mode
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  const theme = isDark ? DarkTheme : LightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
