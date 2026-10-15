/**
 * Resist - AnalysisDetailScreen Component
 * Clinical Results & Explainability Dashboard with smooth animations,
 * editable title, PDF export, and no clinical disclaimers or AST section.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { AMRAnalysis } from '../types/amr';
import { RiskGauge } from '../components/RiskGauge';
import { ContributingFactorsChart } from '../components/ContributingFactorsChart';
import { EvidenceCoverageBadge } from '../components/EvidenceCoverageBadge';
import { PDFExportService } from '../services/pdfExport';
import { StorageService } from '../services/storage';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft, Trash, DownloadSimple, PencilSimple, Check } from 'phosphor-react-native';

interface Props {
  analysis: AMRAnalysis;
  onBack: () => void;
  onDeleted: () => void;
}

export const AnalysisDetailScreen: React.FC<Props> = ({
  analysis: initialAnalysis,
  onBack,
  onDeleted,
}) => {
  const { theme } = useTheme();
  const [analysis, setAnalysis] = useState<AMRAnalysis>(initialAnalysis);
  const [isExporting, setIsExporting] = useState(false);

  // Title Editing State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitleText, setEditedTitleText] = useState(initialAnalysis.title);

  // Animations
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const slideAnim = useMemo(() => new Animated.Value(20), []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, []);

  const risk = analysis.riskResult;
  const culture = analysis.cultureFindings;
  const patient = analysis.patientInput;

  const handleSaveTitle = async () => {
    const trimmed = editedTitleText.trim();
    if (!trimmed) return;
    const updated: AMRAnalysis = {
      ...analysis,
      title: trimmed,
      updatedAt: new Date().toISOString(),
    };
    await StorageService.saveAnalysis(updated);
    setAnalysis(updated);
    setIsEditingTitle(false);
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await PDFExportService.exportAndShareAnalysisPDF(analysis);
    } catch (err) {
      Alert.alert('Export Error', 'Unable to generate or share PDF at this time.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Record',
      'Are you sure you want to permanently delete this analysis record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await StorageService.deleteAnalysis(analysis.id);
            onDeleted();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.container}>
        {/* Top App Bar with Editable Title */}
        <View style={[styles.appBar, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={18} color={theme.text} weight="regular" style={{ marginRight: 4 }} />
            <Text style={[styles.backBtnText, { color: theme.text }]}>Back</Text>
          </TouchableOpacity>

          {isEditingTitle ? (
            <View style={styles.editTitleRow}>
              <TextInput
                style={[styles.editTitleInput, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                value={editedTitleText}
                onChangeText={setEditedTitleText}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSaveTitle}
              />
              <TouchableOpacity onPress={handleSaveTitle} style={styles.saveTitleBtn}>
                <Check size={18} color={theme.text} weight="bold" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setIsEditingTitle(true)} style={styles.titleTouchRow} activeOpacity={0.7}>
              <Text style={[styles.appBarTitle, { color: theme.text }]} numberOfLines={1}>
                {analysis.title}
              </Text>
              <PencilSimple size={14} color={theme.textSecondary} weight="regular" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={handleDelete} style={styles.deleteHeaderBtn}>
            <Trash size={16} color={theme.riskHighText} weight="regular" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollInner}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Section 1: Risk Score Heading & Progress */}
            <View style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>Prototype AMR Risk Score</Text>
              <RiskGauge
                percentage={risk?.riskPercentage ?? null}
                category={risk?.riskCategory ?? 'Low'}
              />

              <EvidenceCoverageBadge
                coverage={risk?.evidenceCoverage ?? 'Limited'}
                score={risk?.evidenceCoverageScore ?? 0}
              />
            </View>

            {/* Section 2: Major Contributing Factors (Explainability) */}
            <View style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Major Contributing Factors</Text>
                <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Ranked by weighted impact</Text>
              </View>
              <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                Tap any factor below to view evidence details:
              </Text>
              <ContributingFactorsChart factors={risk?.contributingFactors ?? []} />
            </View>

            {/* Section 3: Extracted Organism & Microbiology Findings */}
            <View style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Microbiology & Pathogen Findings</Text>
              <View style={styles.infoGrid}>
                <View style={[styles.gridCell, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.cellLabel, { color: theme.textTertiary }]}>Specimen</Text>
                  <Text style={[styles.cellValue, { color: theme.text }]}>{culture?.specimen || 'Not documented'}</Text>
                </View>
                <View style={[styles.gridCell, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.cellLabel, { color: theme.textTertiary }]}>Isolated Organism</Text>
                  <Text style={[styles.cellValue, { color: theme.text }]}>{culture?.organism || 'None identified'}</Text>
                </View>
              </View>

              {analysis.extractedEntities.filter((e) => e.entityType === 'resistance_marker').length > 0 && (
                <View style={[styles.markersContainer, { borderTopColor: theme.border }]}>
                  <Text style={[styles.markerHeading, { color: theme.riskHighText }]}>Documented Resistance Markers:</Text>
                  <View style={styles.markerBadgeRow}>
                    {analysis.extractedEntities
                      .filter((e) => e.entityType === 'resistance_marker')
                      .map((m) => (
                        <View key={m.id} style={[styles.markerBadge, { backgroundColor: theme.riskHighBg, borderColor: theme.riskHighBorder }]}>
                          <Text style={[styles.markerBadgeText, { color: theme.riskHighText }]}>{m.normalizedValue}</Text>
                        </View>
                      ))}
                  </View>
                </View>
              )}
            </View>

            {/* Section 4: Patient Clinical Information */}
            <View style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Patient Clinical Information</Text>
              <View style={styles.historyList}>
                <View style={[styles.historyRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.historyLabel, { color: theme.textSecondary }]}>Reported Symptoms:</Text>
                  <Text style={[styles.historyValue, { color: theme.text }]}>{patient.symptoms || 'None recorded'}</Text>
                </View>
                <View style={[styles.historyRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.historyLabel, { color: theme.textSecondary }]}>Duration:</Text>
                  <Text style={[styles.historyValue, { color: theme.text }]}>{patient.symptomDuration}</Text>
                </View>
                <View style={[styles.historyRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.historyLabel, { color: theme.textSecondary }]}>Severity:</Text>
                  <Text style={[styles.historyValue, { color: theme.text }]}>{patient.severity}</Text>
                </View>
                <View style={[styles.historyRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.historyLabel, { color: theme.textSecondary }]}>Infection Category:</Text>
                  <Text style={[styles.historyValue, { color: theme.text }]}>{patient.infectionType}</Text>
                </View>
                <View style={[styles.historyRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.historyLabel, { color: theme.textSecondary }]}>Prior Courses:</Text>
                  <Text style={[styles.historyValue, { color: theme.text }]}>{patient.previousAntibioticExposure}</Text>
                </View>
                <View style={[styles.historyRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.historyLabel, { color: theme.textSecondary }]}>Course Completion:</Text>
                  <Text style={[styles.historyValue, { color: theme.text }]}>{patient.courseCompletion}</Text>
                </View>
                <View style={[styles.historyRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.historyLabel, { color: theme.textSecondary }]}>Persistence:</Text>
                  <Text style={[styles.historyValue, { color: theme.text }]}>{patient.persistentInfection}</Text>
                </View>
              </View>
            </View>

            {/* Section 5: Calculation Metadata */}
            <View style={[styles.metaCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.metaCardTitle, { color: theme.textTertiary }]}>Metadata</Text>
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                • Evaluated Factors: {risk?.availableFeatureCount || 0} of {risk?.features?.length || 13} features available{'\n'}
                • Recorded Date: {new Date(analysis.createdAt).toLocaleDateString()}
              </Text>
            </View>

            {/* Actions: Export PDF & Delete */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.exportBtn, { backgroundColor: theme.accent }]}
                onPress={handleExportPDF}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator color={theme.accentForeground} size="small" />
                ) : (
                  <>
                    <DownloadSimple size={18} color={theme.accentForeground} weight="regular" style={{ marginRight: 6 }} />
                    <Text style={[styles.exportBtnText, { color: theme.accentForeground }]}>Export PDF Report</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: theme.riskHighBg, borderColor: theme.riskHighBorder }]} onPress={handleDelete}>
                <Trash size={16} color={theme.riskHighText} weight="regular" style={{ marginRight: 4 }} />
                <Text style={[styles.deleteBtnText, { color: theme.riskHighText }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  titleTouchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 200,
  },
  appBarTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  editTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  editTitleInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    fontWeight: '700',
  },
  saveTitleBtn: {
    padding: 6,
    marginLeft: 4,
  },
  deleteHeaderBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollInner: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: 11,
  },
  helperText: {
    fontSize: 11,
    marginBottom: 8,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  gridCell: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    width: '48%',
  },
  cellLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cellValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  markersContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  markerHeading: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  markerBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  markerBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  markerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  historyList: {
    marginTop: 8,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  historyLabel: {
    fontSize: 12,
    flex: 1,
  },
  historyValue: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  metaCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  metaCardTitle: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 11,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  exportBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
  },
  exportBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  deleteBtn: {
    flex: 1,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
