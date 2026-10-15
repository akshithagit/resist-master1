/**
 * Resist - App.tsx
 * AI-Powered Medical Report Analysis & AMR Risk Prediction System
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { AMRAnalysis } from './src/types/amr';
import { StorageService } from './src/services/storage';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { NewAnalysisWizard } from './src/screens/NewAnalysisWizard';
import { AnalysisDetailScreen } from './src/screens/AnalysisDetailScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { AdminSettingsScreen } from './src/screens/AdminSettingsScreen';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { Theme } from './src/constants/theme';
import { SquaresFour, ClipboardText, Plus, Gear } from 'phosphor-react-native';

type TabKey = 'dashboard' | 'wizard' | 'history' | 'settings';

function AppContent() {
  const { theme, isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [selectedAnalysis, setSelectedAnalysis] = useState<AMRAnalysis | null>(null);

  useEffect(() => {
    StorageService.initializeIfNeeded();
  }, []);

  const handleSelectAnalysis = (analysis: AMRAnalysis) => setSelectedAnalysis(analysis);
  const handleAnalysisCompleted = (analysis: AMRAnalysis) => {
    setSelectedAnalysis(analysis);
    setActiveTab('dashboard');
  };
  const handleBackFromDetail = () => setSelectedAnalysis(null);
  const handleAnalysisDeleted = () => {
    setSelectedAnalysis(null);
    setActiveTab('history');
  };

  const s = makeStyles(theme, isDark);

  if (selectedAnalysis) {
    return (
      <SafeAreaView style={s.safeContainer}>
        <ExpoStatusBar style={theme.statusBar} />
        <AnalysisDetailScreen
          analysis={selectedAnalysis}
          onBack={handleBackFromDetail}
          onDeleted={handleAnalysisDeleted}
        />
      </SafeAreaView>
    );
  }

  if (activeTab === 'wizard') {
    return (
      <SafeAreaView style={s.safeContainer}>
        <ExpoStatusBar style={theme.statusBar} />
        <NewAnalysisWizard
          onComplete={handleAnalysisCompleted}
          onCancel={() => setActiveTab('dashboard')}
        />
      </SafeAreaView>
    );
  }

  const tabColor = (tab: TabKey) =>
    activeTab === tab ? theme.tabActive : theme.tabInactive;

  return (
    <SafeAreaView style={s.safeContainer}>
      <ExpoStatusBar style={theme.statusBar} />

      <View style={s.mainView}>
        {activeTab === 'dashboard' && (
          <DashboardScreen
            onNewAnalysis={() => setActiveTab('wizard')}
            onSelectAnalysis={handleSelectAnalysis}
            onNavigateTab={(tab) => setActiveTab(tab as TabKey)}
            onToggleTheme={toggleTheme}
            isDark={isDark}
          />
        )}
        {activeTab === 'history' && (
          <HistoryScreen
            onSelectAnalysis={handleSelectAnalysis}
            onNewAnalysis={() => setActiveTab('wizard')}
          />
        )}
        {activeTab === 'settings' && <AdminSettingsScreen />}
      </View>

      {/* Bottom Tab Bar */}
      <View style={s.bottomTabBar}>
        <TouchableOpacity
          style={[s.tabItem, activeTab === 'dashboard' && s.tabItemActive]}
          onPress={() => setActiveTab('dashboard')}
        >
          <SquaresFour size={22} color={tabColor('dashboard')} weight={activeTab === 'dashboard' ? 'fill' : 'regular'} />
          <Text style={[s.tabLabel, activeTab === 'dashboard' && s.tabLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.tabItem, activeTab === 'history' && s.tabItemActive]}
          onPress={() => setActiveTab('history')}
        >
          <ClipboardText size={22} color={tabColor('history')} weight={activeTab === 'history' ? 'fill' : 'regular'} />
          <Text style={[s.tabLabel, activeTab === 'history' && s.tabLabelActive]}>History</Text>
        </TouchableOpacity>

        {/* Center FAB */}
        <TouchableOpacity style={s.centerFab} onPress={() => setActiveTab('wizard')} activeOpacity={0.8}>
          <Plus size={22} color={theme.accentForeground} weight="bold" />
          <Text style={[s.fabText, { color: theme.accentForeground }]}>Analyze</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.tabItem, activeTab === 'settings' && s.tabItemActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Gear size={22} color={tabColor('settings')} weight={activeTab === 'settings' ? 'fill' : 'regular'} />
          <Text style={[s.tabLabel, activeTab === 'settings' && s.tabLabelActive]}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function makeStyles(theme: Theme, isDark: boolean) {
  return StyleSheet.create({
    safeContainer: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    mainView: { flex: 1 },
    bottomTabBar: {
      flexDirection: 'row',
      backgroundColor: theme.tabBar,
      borderTopWidth: 1,
      borderTopColor: theme.tabBarBorder,
      paddingVertical: 8,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'space-around',
      shadowColor: '#000',
      shadowOpacity: isDark ? 0.4 : 0.06,
      shadowOffset: { width: 0, height: -2 },
      shadowRadius: 4,
      elevation: 8,
    },
    tabItem: {
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 6,
      borderRadius: 8,
      minWidth: 52,
    },
    tabItemActive: { backgroundColor: theme.tabActiveBg },
    tabLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.tabInactive,
      marginTop: 2,
    },
    tabLabelActive: { color: theme.tabActive },
    centerFab: {
      backgroundColor: theme.accent,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 4,
    },
    fabText: {
      fontSize: 10,
      fontWeight: '800',
      marginTop: 1,
    },
  });
}
