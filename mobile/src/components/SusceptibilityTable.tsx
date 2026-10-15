import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { SusceptibilityRecord } from '../types';

interface SusceptibilityTableProps {
  records: SusceptibilityRecord[];
}

export const SusceptibilityTable: React.FC<SusceptibilityTableProps> = ({ records }) => {
  if (!records || records.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Antimicrobial Susceptibility Testing</Text>
        <Text style={styles.emptyText}>No susceptibility panel documented in this report.</Text>
      </View>
    );
  }

  const getInterpretationBadge = (interp: string) => {
    if (interp === 'Resistant') {
      return { bg: Colors.highRiskLight, text: Colors.highRiskText, border: Colors.highRiskBorder, label: 'RESISTANT' };
    }
    if (interp === 'Intermediate') {
      return { bg: Colors.moderateRiskLight, text: Colors.moderateRiskText, border: Colors.moderateRiskBorder, label: 'INTERMEDIATE' };
    }
    return { bg: Colors.lowRiskLight, text: Colors.lowRiskText, border: Colors.lowRiskBorder, label: 'SUSCEPTIBLE' };
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Antimicrobial Susceptibility Profile</Text>
      <Text style={styles.subtitle}>Microbiological sensitivity testing results from submitted report:</Text>

      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, { flex: 2 }]}>Antimicrobial</Text>
        <Text style={[styles.headerCell, { flex: 1.5, textAlign: 'center' }]}>Interpretation</Text>
        <Text style={[styles.headerCell, { flex: 1.2, textAlign: 'right' }]}>MIC</Text>
      </View>

      {records.map((item, idx) => {
        const badge = getInterpretationBadge(item.interpretation);
        return (
          <View key={item.id || idx} style={styles.tableRow}>
            <Text style={[styles.cellText, { flex: 2, fontWeight: '600' }]}>{item.antibiotic}</Text>
            <View style={{ flex: 1.5, alignItems: 'center' }}>
              <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
              </View>
            </View>
            <Text style={[styles.cellText, { flex: 1.2, textAlign: 'right', color: Colors.textSecondary }]}>
              {item.micValue ? (item.micValue + ' ' + (item.micUnit || '')) : '--'}
            </Text>
          </View>
        );
      })}

      <View style={styles.footerNotice}>
        <Text style={styles.footerNoticeText}>
          Non-prescribing boundary: Do not choose or modify antibiotic agents based on this display. Clinical therapy requires licensed medical consultation.
        </Text>
      </View>
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 12
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.cardSubtle,
    paddingHorizontal: 8,
    borderRadius: 6
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase'
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight
  },
  cellText: {
    fontSize: 14,
    color: Colors.textPrimary
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
  footerNotice: {
    marginTop: 12,
    padding: 10,
    backgroundColor: Colors.cardSubtle,
    borderRadius: 8
  },
  footerNoticeText: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 15
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 8,
    fontStyle: 'italic'
  }
});
