/**
 * Resist - ContributingFactorsChart Component
 * Modern motion graphs & smooth monochrome animations for evidence factors
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Platform } from 'react-native';
import { ContributingFactor } from '../types/amr';
import { FileText, CheckCircle, ShieldWarning, WarningCircle } from 'phosphor-react-native';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  factors: ContributingFactor[];
}

export const ContributingFactorsChart: React.FC<Props> = ({ factors }) => {
  const { theme } = useTheme();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Animated width values for each factor bar
  const animatedWidths = useRef(factors.map(() => new Animated.Value(0))).current;
  const animatedOpacities = useRef(factors.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const anims = factors.map((factor, i) => {
      const percentage = Math.round(factor.normalizedContribution * 100);
      return Animated.parallel([
        Animated.timing(animatedWidths[i], {
          toValue: Math.max(6, percentage),
          duration: 700 + i * 150,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(animatedOpacities[i], {
          toValue: 1,
          duration: 400 + i * 100,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]);
    });
    Animated.stagger(100, anims).start();
  }, [factors]);

  if (factors.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.surface }]}>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          No available factors contributed to this calculation.
        </Text>
      </View>
    );
  }

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const renderImpactIcon = (impact: string) => {
    if (impact === 'high') return <ShieldWarning size={14} color={theme.text} weight="fill" style={{ marginRight: 4 }} />;
    if (impact === 'moderate') return <WarningCircle size={14} color={theme.text} weight="fill" style={{ marginRight: 4 }} />;
    return <CheckCircle size={14} color={theme.text} weight="fill" style={{ marginRight: 4 }} />;
  };

  return (
    <View style={styles.container}>
      {factors.map((factor, index) => {
        const isExpanded = expandedIndex === index;
        const percentage = Math.round(factor.normalizedContribution * 100);

        const barWidth = animatedWidths[index] ? animatedWidths[index].interpolate({
          inputRange: [0, 100],
          outputRange: ['0%', '100%'],
        }) : `${Math.max(6, percentage)}%`;

        return (
          <Animated.View
            key={`${factor.name}_${index}`}
            style={{ opacity: animatedOpacities[index] || 1 }}
          >
            <TouchableOpacity
              style={[
                styles.factorCard,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                isExpanded && { borderColor: theme.borderStrong, backgroundColor: theme.surfaceHover },
              ]}
              onPress={() => toggleExpand(index)}
              activeOpacity={0.7}
            >
              <View style={styles.factorHeader}>
                <View style={styles.titleRow}>
                  <Text style={[styles.factorTitle, { color: theme.text }]}>{factor.displayName}</Text>
                  <View style={[styles.impactBadge, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
                    {renderImpactIcon(factor.impact)}
                    <Text style={[styles.impactText, { color: theme.text }]}>
                      {factor.impact.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.scoreText, { color: theme.textSecondary }]}>
                  Impact Score: <Text style={{ fontWeight: '700', color: theme.text }}>+{factor.weightedContribution}</Text> (w={factor.weight})
                </Text>
              </View>

              {/* Animated progress bar */}
              <View style={[styles.progressBarTrack, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: barWidth as any,
                      backgroundColor: theme.text,
                    },
                  ]}
                />
              </View>

              <View style={styles.ratioRow}>
                <Text style={[styles.ratioLabel, { color: theme.textTertiary }]}>Signal contribution</Text>
                <Text style={[styles.ratioValue, { color: theme.textSecondary }]}>{percentage}%</Text>
              </View>

              {/* Expanded Detailed Clinical Provenance & Evidence */}
              {isExpanded && (
                <View style={[styles.evidenceContainer, { borderTopColor: theme.border }]}>
                  <Text style={[styles.evidenceTitle, { color: theme.text }]}>Documented Evidence & Rationale:</Text>
                  <Text style={[styles.evidenceReason, { color: theme.textSecondary }]}>{factor.reason}</Text>

                  {factor.sourceDocument && (
                    <View style={[styles.citationBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      <FileText size={12} color={theme.textSecondary} weight="regular" style={{ marginRight: 4 }} />
                      <Text style={[styles.citationText, { color: theme.textSecondary }]}>
                        Source: {factor.sourceDocument} (Page {factor.pageNumber || 1})
                      </Text>
                    </View>
                  )}

                  {factor.evidenceSnippet && (
                    <View style={[styles.snippetContainer, { backgroundColor: theme.surface, borderLeftColor: theme.text }]}>
                      <Text style={[styles.snippetLabel, { color: theme.textTertiary }]}>Extracted Finding:</Text>
                      <Text style={[styles.snippetText, { color: theme.text }]}>"{factor.evidenceSnippet}"</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  emptyContainer: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  factorCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  factorHeader: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  factorTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  impactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  impactText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scoreText: {
    fontSize: 11,
    marginTop: 2,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  ratioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  ratioLabel: {
    fontSize: 11,
  },
  ratioValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  evidenceContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  evidenceTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  evidenceReason: {
    fontSize: 12,
    lineHeight: 18,
  },
  citationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  citationText: {
    fontSize: 10,
    fontWeight: '600',
  },
  snippetContainer: {
    marginTop: 6,
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
  },
  snippetLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  snippetText: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
