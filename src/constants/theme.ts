/**
 * Resist - Theme & Attio Design System Tokens
 * Strict monochrome palette: black in light mode, white in dark mode.
 * Zero colorful red/green/orange fills or text.
 */

export const LightTheme = {
  background: '#ffffff',
  surface: '#f9fafb',
  surfaceElevated: '#ffffff',
  surfaceHover: '#f3f4f6',
  border: '#e5e7eb',
  borderStrong: '#111827',

  text: '#111827',
  textSecondary: '#4b5563',
  textTertiary: '#9ca3af',

  accent: '#111827',
  accentForeground: '#ffffff',

  tabBar: '#ffffff',
  tabBarBorder: '#e5e7eb',
  tabActive: '#111827',
  tabInactive: '#9ca3af',
  tabActiveBg: '#f3f4f6',

  // Monochrome Risk & Status tokens (Light Mode)
  riskLowBg: '#f3f4f6',
  riskLowText: '#111827',
  riskLowBorder: '#d1d5db',

  riskModBg: '#f3f4f6',
  riskModText: '#111827',
  riskModBorder: '#d1d5db',

  riskHighBg: '#111827',
  riskHighText: '#ffffff',
  riskHighBorder: '#111827',

  statusBar: 'dark' as 'dark' | 'light',
};

export const DarkTheme = {
  background: '#09090b',
  surface: '#121215',
  surfaceElevated: '#18181b',
  surfaceHover: '#27272a',
  border: '#27272a',
  borderStrong: '#f9fafb',

  text: '#f9fafb',
  textSecondary: '#a1a1aa',
  textTertiary: '#71717a',

  accent: '#f9fafb',
  accentForeground: '#09090b',

  tabBar: '#09090b',
  tabBarBorder: '#1f1f23',
  tabActive: '#f9fafb',
  tabInactive: '#71717a',
  tabActiveBg: '#18181b',

  // Monochrome Risk & Status tokens (Dark Mode)
  riskLowBg: '#18181b',
  riskLowText: '#f9fafb',
  riskLowBorder: '#3f3f46',

  riskModBg: '#18181b',
  riskModText: '#f9fafb',
  riskModBorder: '#3f3f46',

  riskHighBg: '#f9fafb',
  riskHighText: '#09090b',
  riskHighBorder: '#f9fafb',

  statusBar: 'light' as 'dark' | 'light',
};

export type Theme = typeof LightTheme;
