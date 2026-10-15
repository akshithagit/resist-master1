/**
 * Resist - Analysis Detail Route (/analysis/[id])
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { AnalysisDetailScreen } from '../../screens/AnalysisDetailScreen';
import { StorageService } from '../../services/storage';
import { AMRAnalysis } from '../../types/amr';
import { useTheme } from '../../contexts/ThemeContext';

export default function AnalysisDetailRouteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const [analysis, setAnalysis] = useState<AMRAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalysis() {
      if (!id) return;
      setLoading(true);
      const all = await StorageService.getAllAnalyses();
      const found = all.find((a) => a.id === id);
      setAnalysis(found || null);
      setLoading(false);
    }
    loadAnalysis();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading analysis...</Text>
      </SafeAreaView>
    );
  }

  if (!analysis) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.text }]}>Analysis Not Found</Text>
        <Text style={[styles.errorSubText, { color: theme.textSecondary }]}>
          The requested record could not be loaded or has been deleted.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <AnalysisDetailScreen
      analysis={analysis}
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/');
        }
      }}
      onDeleted={() => {
        router.replace('/');
      }}
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 13,
    marginTop: 12,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '800',
  },
  errorSubText: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
});
