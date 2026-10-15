/**
 * Resist - Home Route (/)
 */

import React from 'react';
import { DashboardScreen } from '../../screens/DashboardScreen';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { AMRAnalysis } from '../../types/amr';

export default function HomeScreen() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <DashboardScreen
      onNewAnalysis={() => router.push('/wizard')}
      onSelectAnalysis={(analysis: AMRAnalysis) => router.push(`/analysis/${analysis.id}`)}
      onNavigateTab={(tab: string) => {
        if (tab === 'history') router.push('/history');
        else if (tab === 'settings') router.push('/settings');
        else if (tab === 'wizard') router.push('/wizard');
      }}
      onToggleTheme={toggleTheme}
      isDark={isDark}
    />
  );
}
