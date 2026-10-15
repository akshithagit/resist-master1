import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { EvidenceCoverageLevel } from '../types';

interface EvidenceCoverageBadgeProps {
  level: EvidenceCoverageLevel;
  percentage?: number;
}

export const EvidenceCoverageBadge: React.FC<EvidenceCoverageBadgeProps> = ({ level, percentage }) => {
  const getColors = () => {
    if (level === 'Broad') return { bg: Colors.lowRiskLight, text: Colors.lowRiskText, border: Colors.lowRiskBorder };
    if (level === 'Moderate') return { bg: Colors.primaryLight, text: Colors.primaryDark, border: Colors.primaryMuted };
    return { bg: Colors.cardSubtle, text: Colors.evidenceLimited, border: Colors.border };
  };

  const c = getColors();

  return (
    <View style={[styles.container, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[styles.label, { color: c.text }]}>
        {'EVIDENCE COVERAGE: ' + level.toUpperCase()}
        {percentage !== undefined ? (' (' + percentage + '%)') : ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    alignSelf: 'center',
    marginVertical: 4
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5
  }
});
