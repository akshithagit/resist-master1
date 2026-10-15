/**
 * Resist - History Route (/history)
 */

import React from 'react';
import { HistoryScreen } from '../../screens/HistoryScreen';
import { router } from 'expo-router';
import { AMRAnalysis } from '../../types/amr';

export default function HistoryTabScreen() {
  return (
    <HistoryScreen
      onSelectAnalysis={(analysis: AMRAnalysis) => router.push(`/analysis/${analysis.id}`)}
      onNewAnalysis={() => router.push('/wizard')}
    />
  );
}
