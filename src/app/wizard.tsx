/**
 * Resist - New Analysis Wizard Route (/wizard)
 */

import React from 'react';
import { NewAnalysisWizard } from '../screens/NewAnalysisWizard';
import { router } from 'expo-router';
import { AMRAnalysis } from '../types/amr';

export default function WizardRouteScreen() {
  return (
    <NewAnalysisWizard
      onComplete={(analysis: AMRAnalysis) => {
        router.replace(`/analysis/${analysis.id}`);
      }}
      onCancel={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/');
        }
      }}
    />
  );
}
