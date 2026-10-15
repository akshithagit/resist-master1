/**
 * Resist - EvidenceCoverageBadge Component
 * PRD Section 20 - Evidence Coverage Indicator
 * Distinct from clinical confidence; measures completeness of reports & data.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EvidenceCoverage } from '../types/amr';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  coverage: EvidenceCoverage;
  score: number;
}

export const EvidenceCoverageBadge: React.FC<Props> = ({ coverage, score }) => {
  const { theme } = useTheme();

  const coverageConfig = {
    Limited: {
      bg: theme.surface,
      border: theme.border,
      text: theme.textSecondary,
      dot: theme.textTertiary,
      desc: 'Based on limited available information; caution advised.',
    },
    Moderate: {
      bg: theme.riskModBg,
      border: theme.riskModBorder,
      text: theme.riskModText,
      dot: theme.riskModText,
      desc: 'Moderate laboratory and clinical factors available for assessment.',
    },
    Broad: {
      bg: theme.riskLowBg,
      border: theme.riskLowBorder,
      text: theme.riskLowText,
      dot: theme.riskLowText,
      desc: 'Broad laboratory, susceptibility, and clinical history available.',
    },
  }[coverage];

  return (
    <View style={[styles.badgeContainer, { backgroundColor: coverageConfig.bg, borderColor: coverageConfig.border }]}>
      <View style={styles.topRow}>
        <View style={styles.leftLabel}>
          <View style={[styles.statusDot, { backgroundColor: coverageConfig.dot }]} />
          <Text style={[styles.badgeTitle, { color: coverageConfig.text }]}>
            Evidence Coverage: {coverage} ({score}%)
          </Text>
        </View>
      </View>
      <Text style={[styles.badgeDesc, { color: theme.textSecondary }]}>{coverageConfig.desc}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeDesc: {
    fontSize: 11,
    marginTop: 2,
    paddingLeft: 14,
  },
});
