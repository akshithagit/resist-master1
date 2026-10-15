import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import { ContributingFactor } from '../types';

interface ContributingFactorsChartProps {
  factors: ContributingFactor[];
}

export const ContributingFactorsChart: React.FC<ContributingFactorsChartProps> = ({ factors }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!factors || factors.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.emptyText}>No major contributing factors identified.</Text>
      </View>
    );
  }

  const maxContribution = Math.max(...factors.map(f => f.contribution), 1);

  const getImpactBadge = (impact: string) => {
    if (impact === 'high') {
      return { bg: Colors.highRiskLight, text: Colors.highRiskText, border: Colors.highRiskBorder, label: 'HIGH IMPACT' };
    }
    if (impact === 'moderate') {
      return { bg: Colors.moderateRiskLight, text: Colors.moderateRiskText, border: Colors.moderateRiskBorder, label: 'MODERATE' };
    }
    return { bg: Colors.lowRiskLight, text: Colors.lowRiskText, border: Colors.lowRiskBorder, label: 'LOW' };
  };

  return (
    <View style={styles.card}>
      <Text style={styles.headerTitle}>Major Contributing Factors</Text>
      <Text style={styles.headerSubtitle}>
        Evidence drivers ranked by normalized risk weight (tap for traceable source evidence):
      </Text>

      {factors.map((factor, idx) => {
        const badge = getImpactBadge(factor.impact);
        const percentWidth = Math.round((factor.contribution / maxContribution) * 100);
        const isExpanded = expandedIndex === idx;

        return (
          <TouchableOpacity
            key={factor.featureKey + idx}
            activeOpacity={0.8}
            onPress={() => setExpandedIndex(isExpanded ? null : idx)}
            style={styles.factorItem}
          >
            <View style={styles.factorHeader}>
              <Text style={styles.factorName} numberOfLines={1}>{factor.name}</Text>
              <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
              </View>
            </View>

            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: (Math.max(10, percentWidth) + '%') as any,
                    backgroundColor: factor.impact === 'high' ? Colors.highRisk : factor.impact === 'moderate' ? Colors.moderateRisk : Colors.primary
                  }
                ]}
              />
            </View>

            <Text style={styles.factorReason}>{factor.reason}</Text>

            {isExpanded && factor.evidence && (
              <View style={styles.evidenceBox}>
                <Text style={styles.evidenceTitle}>Source Document Citation:</Text>
                <Text style={styles.evidenceSnippet}>"{factor.evidence.snippet || 'Extracted clinical finding'}"</Text>
                <View style={styles.evidenceMetaRow}>
                  <Text style={styles.evidenceMeta}>Doc: {factor.evidence.document || 'Report'}</Text>
                  <Text style={styles.evidenceMeta}>Page: {factor.evidence.page || 1}</Text>
                  <Text style={styles.evidenceMeta}>Confidence: {Math.round((factor.evidence.confidence || 0.9) * 100)}%</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 14
  },
  factorItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  factorName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700'
  },
  barTrack: {
    height: 8,
    backgroundColor: Colors.cardSubtle,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 6
  },
  barFill: {
    height: '100%',
    borderRadius: 4
  },
  factorReason: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 2
  },
  evidenceBox: {
    backgroundColor: Colors.cardSubtle,
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary
  },
  evidenceTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  evidenceSnippet: {
    fontSize: 12,
    fontStyle: 'italic',
    color: Colors.textSecondary,
    lineHeight: 16
  },
  evidenceMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  evidenceMeta: {
    fontSize: 11,
    color: Colors.textMuted
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: 'italic'
  }
});
