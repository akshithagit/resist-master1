/**
 * Resist - SusceptibilityTable Component
 * PRD Section 49 - Clean, accessible Antimicrobial Susceptibility Testing (AST) Matrix
 * Attio Design System theme integration
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SusceptibilityResult } from '../types/amr';
import { ShieldWarning } from 'phosphor-react-native';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  results: SusceptibilityResult[];
}

export const SusceptibilityTable: React.FC<Props> = ({ results }) => {
  const { theme, isDark } = useTheme();

  if (results.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          No antimicrobial susceptibility testing (AST) results available.
        </Text>
        <Text style={[styles.emptySubText, { color: theme.textTertiary }]}>
          Missing susceptibility results are not assumed to be susceptible.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.tableCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
      {/* Header */}
      <View style={[styles.tableHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerCell, { flex: 2, color: theme.textSecondary }]}>Antibiotic Agent</Text>
        <Text style={[styles.headerCell, { flex: 1.2, textAlign: 'center', color: theme.textSecondary }]}>Result</Text>
        <Text style={[styles.headerCell, { flex: 1.2, textAlign: 'right', color: theme.textSecondary }]}>MIC Value</Text>
      </View>

      {/* Rows */}
      {results.map((item, index) => {
        const isResistant = item.interpretation === 'Resistant';
        const isIntermediate = item.interpretation === 'Intermediate';

        const badgeColor = isResistant
          ? { bg: theme.riskHighBg, text: theme.riskHighText, border: theme.riskHighBorder }
          : isIntermediate
          ? { bg: theme.riskModBg, text: theme.riskModText, border: theme.riskModBorder }
          : { bg: theme.riskLowBg, text: theme.riskLowText, border: theme.riskLowBorder };

        return (
          <View
            key={item.id || `${item.antibiotic}_${index}`}
            style={[
              styles.tableRow,
              { borderBottomColor: theme.border },
              index % 2 === 1 && { backgroundColor: theme.surface },
            ]}
          >
            <View style={{ flex: 2 }}>
              <Text style={[styles.antibioticName, { color: theme.text }]}>{item.antibiotic}</Text>
              {item.isUserModified && (
                <Text style={[styles.userModifiedTag, { color: theme.textTertiary }]}>User Edited</Text>
              )}
            </View>

            <View style={{ flex: 1.2, alignItems: 'center' }}>
              <View style={[styles.resultBadge, { backgroundColor: badgeColor.bg, borderColor: badgeColor.border }]}>
                <Text style={[styles.resultText, { color: badgeColor.text }]}>
                  {item.interpretation}
                </Text>
              </View>
            </View>

            <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
              <Text style={[styles.micText, { color: theme.textSecondary }]}>{item.micValue || '—'}</Text>
            </View>
          </View>
        );
      })}

      {/* Mandatory Non-Prescribing Notice */}
      <View style={[styles.tableFooterNotice, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <ShieldWarning size={14} color={theme.textSecondary} weight="fill" style={{ marginRight: 6, marginTop: 1 }} />
        <Text style={[styles.footerNoticeText, { color: theme.textSecondary }]}>
          Non-diagnostic reference: Testing results reflect documented laboratory reports. This system does not recommend or prescribe antibiotic therapy.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tableCard: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 8,
  },
  emptyContainer: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  headerCell: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  antibioticName: {
    fontSize: 13,
    fontWeight: '600',
  },
  userModifiedTag: {
    fontSize: 9,
    fontStyle: 'italic',
    marginTop: 1,
  },
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  resultText: {
    fontSize: 11,
    fontWeight: '700',
  },
  micText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  tableFooterNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderTopWidth: 1,
  },
  footerNoticeText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 14,
  },
});
