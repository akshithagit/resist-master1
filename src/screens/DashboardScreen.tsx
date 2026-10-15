/**
 * Resist - Dashboard Screen
 * Mobile Native Home & Clinical Overview
 * Attio Design System, Phosphor Icons & Local AI ML Engine
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { AMRAnalysis } from '../types/amr';
import { StorageService } from '../services/storage';
import { SYNTHETIC_DEMO_CASES } from '../services/demoData';
import { useTheme } from '../contexts/ThemeContext';
import { Microscope, FileText, ArrowRight, Dna, Sun, Moon, CheckCircle, WarningCircle, ShieldWarning } from 'phosphor-react-native';

interface Props {
  onNewAnalysis: () => void;
  onSelectAnalysis: (analysis: AMRAnalysis) => void;
  onNavigateTab: (tab: string) => void;
  onToggleTheme: () => void;
  isDark: boolean;
}

export const DashboardScreen: React.FC<Props> = ({
  onNewAnalysis,
  onSelectAnalysis,
  onNavigateTab,
  onToggleTheme,
  isDark,
}) => {
  const { theme } = useTheme();
  const [analyses, setAnalyses] = useState<AMRAnalysis[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const load = async () => {
      const list = await StorageService.getAllAnalyses();
      setAnalyses(list);
    };
    load();
  }, []);

  const loadData = async () => {
    const list = await StorageService.getAllAnalyses();
    setAnalyses(list);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLaunchDemo = async (demoId: string) => {
    const found = analyses.find((a) => a.id === demoId);
    if (found) {
      onSelectAnalysis(found);
    } else {
      const demoCase = SYNTHETIC_DEMO_CASES.find((d) => d.id === demoId);
      if (demoCase) {
        await StorageService.saveAnalysis(demoCase.analysis);
        await loadData();
        onSelectAnalysis(demoCase.analysis);
      }
    }
  };

  const renderRiskBadgeIcon = (category: string) => {
    if (category === 'High') {
      return <ShieldWarning size={14} color={theme.text} weight="fill" style={{ marginRight: 4 }} />;
    }
    if (category === 'Moderate') {
      return <WarningCircle size={14} color={theme.text} weight="fill" style={{ marginRight: 4 }} />;
    }
    return <CheckCircle size={14} color={theme.text} weight="fill" style={{ marginRight: 4 }} />;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.contentContainer]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.text}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.brandRow}>
              <Microscope size={26} color={theme.text} weight="regular" style={{ marginRight: 8 }} />
              <Text style={[styles.brandTitle, { color: theme.text }]}>Resist</Text>
            </View>
            <Text style={[styles.brandSubtitle, { color: theme.textSecondary }]}>
              AMR Risk Assessment System
            </Text>
          </View>

          {/* Theme Toggle */}
          <TouchableOpacity
            onPress={onToggleTheme}
            style={[styles.themeToggle, { backgroundColor: theme.surface, borderColor: theme.border }]}
            activeOpacity={0.7}
          >
            {isDark ? (
              <Sun size={18} color={theme.text} weight="regular" />
            ) : (
              <Moon size={18} color={theme.text} weight="regular" />
            )}
          </TouchableOpacity>
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
          onPress={onNewAnalysis}
          activeOpacity={0.85}
        >
          <View style={styles.btnContent}>
            <View style={[styles.btnIconContainer, { backgroundColor: 'rgba(128,128,128,0.2)' }]}>
              <FileText size={22} color={theme.accentForeground} weight="regular" />
            </View>
            <View>
              <Text style={[styles.btnTitle, { color: theme.accentForeground }]}>Start New Analysis</Text>
              <Text style={[styles.btnDesc, { color: isDark ? '#9ca3af' : '#d1d5db' }]}>
                Upload report, take photo, or enter symptoms
              </Text>
            </View>
          </View>
          <ArrowRight size={20} color={theme.accentForeground} weight="bold" />
        </TouchableOpacity>

        {/* Demos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Synthetic Test Reports</Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Explore OCR extraction and Local AI explainability:
          </Text>

          {/* Low Risk */}
          <TouchableOpacity
            style={[styles.demoCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            onPress={() => handleLaunchDemo('demo_case_1')}
            activeOpacity={0.7}
          >
            <View style={[styles.demoBadge, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
              {renderRiskBadgeIcon('Low')}
              <Text style={[styles.demoBadgeText, { color: theme.text }]}>LOW RISK</Text>
            </View>
            <Text style={[styles.demoCardTitle, { color: theme.text }]}>Uncomplicated UTI</Text>
            <Text style={[styles.demoCardDesc, { color: theme.textSecondary }]}>
              E. coli pan-susceptible, 1 prior course, mild
            </Text>
          </TouchableOpacity>

          {/* High Risk */}
          <TouchableOpacity
            style={[styles.demoCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            onPress={() => handleLaunchDemo('demo_case_2')}
            activeOpacity={0.7}
          >
            <View style={[styles.demoBadge, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
              {renderRiskBadgeIcon('High')}
              <Text style={[styles.demoBadgeText, { color: theme.text }]}>HIGH RISK</Text>
            </View>
            <Text style={[styles.demoCardTitle, { color: theme.text }]}>MDR Klebsiella</Text>
            <Text style={[styles.demoCardDesc, { color: theme.textSecondary }]}>
              ESBL positive, blaCTX-M, repeated exposure
            </Text>
          </TouchableOpacity>

          {/* Limited Data */}
          <TouchableOpacity
            style={[styles.demoCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            onPress={() => handleLaunchDemo('demo_case_3')}
            activeOpacity={0.7}
          >
            <View style={[styles.demoBadge, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
              {renderRiskBadgeIcon('Moderate')}
              <Text style={[styles.demoBadgeText, { color: theme.text }]}>LIMITED DATA</Text>
            </View>
            <Text style={[styles.demoCardTitle, { color: theme.text }]}>Empiric Prescription</Text>
            <Text style={[styles.demoCardDesc, { color: theme.textSecondary }]}>
              Oral antibiotic record with no lab culture
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Analyses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Analyses</Text>
            <TouchableOpacity onPress={() => onNavigateTab('history')} style={styles.seeAllRow}>
              <Text style={[styles.seeAllText, { color: theme.textSecondary }]}>
                View All ({analyses.length})
              </Text>
              <ArrowRight size={13} color={theme.textSecondary} weight="regular" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>

          {analyses.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.emptyCardText, { color: theme.textSecondary }]}>No analyses yet.</Text>
              <Text style={[styles.emptyCardSubText, { color: theme.textTertiary }]}>
                Tap {"\"Start New Analysis\""} or try a test report.
              </Text>
            </View>
          ) : (
            analyses.slice(0, 4).map((item) => {
              const risk = item.riskResult;
              const category = risk?.riskCategory || 'Low';

              const bugName =
                item.extractedEntities.find((e) => e.entityType === 'organism')?.normalizedValue ||
                item.cultureFindings?.organism ||
                'Clinical History';

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.analysisItem, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
                  onPress={() => onSelectAnalysis(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.analysisLeft}>
                    <Text style={[styles.analysisTitle, { color: theme.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View style={styles.analysisMeta}>
                      <Dna size={12} color={theme.textSecondary} weight="regular" style={{ marginRight: 4 }} />
                      <Text style={[styles.analysisOrganism, { color: theme.textSecondary }]}>{bugName}</Text>
                      <Text style={[styles.metaDot, { color: theme.border }]}>•</Text>
                      <Text style={[styles.analysisDate, { color: theme.textTertiary }]}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={[styles.coverageText, { color: theme.textTertiary }]}>
                      Evidence: {risk?.evidenceCoverage || 'Limited'} ({risk?.evidenceCoverageScore || 0}%)
                    </Text>
                  </View>

                  <View style={styles.analysisRight}>
                    <Text style={[styles.riskScore, { color: theme.text }]}>
                      {risk?.riskPercentage != null ? `${risk.riskPercentage}` : 'N/A'}
                    </Text>
                    <View style={[styles.categoryPill, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
                      {renderRiskBadgeIcon(category)}
                      <Text style={[styles.categoryPillText, { color: theme.text }]}>
                        {risk?.riskCategory ? risk.riskCategory.toUpperCase() : 'UNKNOWN'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  themeToggle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnIconContainer: {
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  btnTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  btnDesc: {
    fontSize: 11,
    marginTop: 1,
  },
  section: {
    marginVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 17,
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  demoCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  demoBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  demoCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  demoCardDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  analysisItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  analysisLeft: {
    flex: 1,
    marginRight: 12,
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  analysisMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  analysisOrganism: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaDot: {
    marginHorizontal: 6,
  },
  analysisDate: {
    fontSize: 11,
  },
  coverageText: {
    fontSize: 10,
    marginTop: 3,
  },
  analysisRight: {
    alignItems: 'flex-end',
  },
  riskScore: {
    fontSize: 22,
    fontWeight: '900',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  categoryPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
  },
  emptyCardText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCardSubText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});
