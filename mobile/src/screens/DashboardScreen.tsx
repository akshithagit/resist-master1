import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Colors } from '../theme/colors';
import { api } from '../services/api';
import { AnalysisRecord, DemoCase } from '../types';
import { SafetyDisclaimerCard } from '../components/SafetyDisclaimerCard';

interface DashboardScreenProps {
  onStartNewAnalysis: () => void;
  onViewAnalysis: (id: string) => void;
  onViewHowItWorks: () => void;
  onViewSafety: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onStartNewAnalysis,
  onViewAnalysis,
  onViewHowItWorks,
  onViewSafety
}) => {
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [demoCases, setDemoCases] = useState<DemoCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingCaseId, setLoadingCaseId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      // Login as guest/demo user automatically
      await api.loginDemo();
      const [analysisList, cases] = await Promise.all([
        api.listAnalyses().catch(() => []),
        api.getDemoCases().catch(() => [])
      ]);
      setAnalyses(analysisList);
      setDemoCases(cases);
    } catch (err) {
      console.warn('Dashboard load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLoadDemoCase = async (caseId: string) => {
    try {
      setLoadingCaseId(caseId);
      const res = await api.loadDemoCase(caseId);
      await loadData();
      if (res.analysisId) {
        onViewAnalysis(res.analysisId);
      }
    } catch (err: any) {
      Alert.alert('Demo Error', err.message || 'Could not load demo case');
    } finally {
      setLoadingCaseId(null);
    }
  };

  const highCount = analyses.filter(a => a.riskCategory === 'High').length;
  const modCount = analyses.filter(a => a.riskCategory === 'Moderate').length;
  const lowCount = analyses.filter(a => a.riskCategory === 'Low').length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
    >
      {/* Top Clinical Header */}
      <View style={styles.heroSection}>
        <View style={styles.badgeRow}>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>MODEL: risk-model-0.1.0</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>● ONLINE</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>ResistAI</Text>
        <Text style={styles.heroSubtitle}>
          AI-Powered Medical Report Analysis & Antimicrobial Resistance Risk Assessment
        </Text>
      </View>

      {/* Primary Call to Action */}
      <View style={styles.actionCard}>
        <Text style={styles.actionTitle}>Start Clinical Report Analysis</Text>
        <Text style={styles.actionDesc}>
          Upload laboratory culture, susceptibility test, or CBC report to calculate an estimated AMR risk index.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={onStartNewAnalysis}
        >
          <Text style={styles.primaryButtonText}>+ New Analysis</Text>
        </TouchableOpacity>
      </View>

      {/* Safety Notice */}
      <SafetyDisclaimerCard />

      {/* Clinical Metrics Summary */}
      <View style={styles.metricsContainer}>
        <Text style={styles.sectionTitle}>Surveillance Overview</Text>
        <View style={styles.metricRow}>
          <View style={[styles.metricCard, { borderColor: Colors.highRiskBorder, backgroundColor: Colors.highRiskLight }]}>
            <Text style={[styles.metricNumber, { color: Colors.highRisk }]}>{highCount}</Text>
            <Text style={[styles.metricLabel, { color: Colors.highRiskText }]}>High Risk</Text>
          </View>
          <View style={[styles.metricCard, { borderColor: Colors.moderateRiskBorder, backgroundColor: Colors.moderateRiskLight }]}>
            <Text style={[styles.metricNumber, { color: Colors.moderateRisk }]}>{modCount}</Text>
            <Text style={[styles.metricLabel, { color: Colors.moderateRiskText }]}>Moderate</Text>
          </View>
          <View style={[styles.metricCard, { borderColor: Colors.lowRiskBorder, backgroundColor: Colors.lowRiskLight }]}>
            <Text style={[styles.metricNumber, { color: Colors.lowRisk }]}>{lowCount}</Text>
            <Text style={[styles.metricLabel, { color: Colors.lowRiskText }]}>Low Risk</Text>
          </View>
        </View>
      </View>

      {/* Synthetic Demo Presets (Section 65 & 66) */}
      <View style={styles.demoSection}>
        <Text style={styles.sectionTitle}>Synthetic Demonstration Cases</Text>
        <Text style={styles.sectionSubtitle}>
          Explore multi-factor OCR, extraction, and risk calculation without real patient documents:
        </Text>

        {demoCases.map((demo) => {
          const isLoadingThis = loadingCaseId === demo.id;
          return (
            <TouchableOpacity
              key={demo.id}
              style={styles.demoCard}
              activeOpacity={0.8}
              onPress={() => handleLoadDemoCase(demo.id)}
              disabled={loadingCaseId !== null}
            >
              <View style={styles.demoCardHeader}>
                <Text style={styles.demoCardTitle} numberOfLines={1}>{demo.title}</Text>
                <View style={[
                  styles.categoryPill,
                  demo.expectedCategory === 'High' ? styles.pillHigh : demo.expectedCategory === 'Moderate' ? styles.pillMod : styles.pillLow
                ]}>
                  <Text style={styles.categoryPillText}>{demo.expectedCategory.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.demoCardDesc} numberOfLines={2}>{demo.description}</Text>
              <View style={styles.demoCardFooter}>
                <Text style={styles.loadActionText}>
                  {isLoadingThis ? 'Processing case...' : 'Tap to analyze case →'}
                </Text>
                {isLoadingThis && <ActivityIndicator size="small" color={Colors.primary} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Recent Analyses List */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Analyses</Text>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
        ) : analyses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No recent analyses found.</Text>
            <Text style={styles.emptySubtext}>Tap "+ New Analysis" or run a synthetic case above.</Text>
          </View>
        ) : (
          analyses.slice(0, 5).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.recentItem}
              activeOpacity={0.8}
              onPress={() => onViewAnalysis(item.id)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.recentTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.recentDate}>
                  {new Date(item.createdAt).toLocaleDateString()} • {item.evidenceCoverage ? ('Coverage: ' + item.evidenceCoverage) : 'Processing'}
                </Text>
              </View>
              {item.riskPercentage !== undefined && item.riskPercentage !== null ? (
                <View style={styles.recentRiskCol}>
                  <Text style={[
                    styles.recentRiskPercent,
                    item.riskCategory === 'High' ? { color: Colors.highRisk } : item.riskCategory === 'Moderate' ? { color: Colors.moderateRisk } : { color: Colors.lowRisk }
                  ]}>
                    {item.riskPercentage.toFixed(1)}%
                  </Text>
                  <Text style={styles.recentRiskCat}>{item.riskCategory}</Text>
                </View>
              ) : (
                <View style={styles.recentRiskCol}>
                  <Text style={styles.recentRiskCat}>Pending</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Educational & Safety Links */}
      <View style={styles.linksRow}>
        <TouchableOpacity style={styles.linkButton} onPress={onViewHowItWorks}>
          <Text style={styles.linkButtonText}>📐 How It Works & Weights</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkButton} onPress={onViewSafety}>
          <Text style={styles.linkButtonText}>🛡️ Safety & Limitations</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40
  },
  heroSection: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  versionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  versionText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5
  },
  statusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  statusText: {
    fontSize: 10,
    color: '#A7F3D0',
    fontWeight: '700'
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#BAE6FD',
    marginTop: 6,
    lineHeight: 20
  },
  actionCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  actionDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginVertical: 8,
    lineHeight: 18
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  metricsContainer: {
    marginVertical: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10
  },
  metricCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center'
  },
  metricNumber: {
    fontSize: 26,
    fontWeight: '800'
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2
  },
  demoSection: {
    marginVertical: 12
  },
  demoCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10
  },
  demoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  demoCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  pillHigh: { backgroundColor: Colors.highRiskLight },
  pillMod: { backgroundColor: Colors.moderateRiskLight },
  pillLow: { backgroundColor: Colors.lowRiskLight },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '800'
  },
  demoCardDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18
  },
  demoCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10
  },
  loadActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary
  },
  recentSection: {
    marginVertical: 12
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  recentDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2
  },
  recentRiskCol: {
    alignItems: 'flex-end',
    marginLeft: 8
  },
  recentRiskPercent: {
    fontSize: 16,
    fontWeight: '800'
  },
  recentRiskCat: {
    fontSize: 11,
    color: Colors.textMuted
  },
  emptyCard: {
    padding: 24,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary
  },
  emptySubtext: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4
  },
  linksRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14
  },
  linkButton: {
    flex: 1,
    backgroundColor: Colors.card,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center'
  },
  linkButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary
  }
});
