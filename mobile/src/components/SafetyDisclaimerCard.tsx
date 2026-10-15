import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

export const SafetyDisclaimerCard: React.FC<{ urgentNotice?: boolean }> = ({ urgentNotice }) => {
  return (
    <View style={[styles.container, urgentNotice && styles.urgentContainer]}>
      <Text style={styles.title}>IMPORTANT CLINICAL SAFETY NOTICE</Text>
      <Text style={styles.body}>
        ResistAI provides a prototype AMR risk estimate for research, awareness, surveillance, and decision-support purposes only. It is not a clinically validated probability, confirmed diagnosis, or antibiotic prescription.
      </Text>
      <Text style={[styles.body, styles.highlight]}>
        Do not start, stop, extend, or change antibiotic medications based solely on this result. Laboratory culture and susceptibility testing interpreted by a qualified healthcare professional remain necessary for all clinical decisions.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.border
  },
  urgentContainer: {
    backgroundColor: Colors.highRiskLight,
    borderLeftColor: Colors.highRisk,
    borderColor: Colors.highRiskBorder
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
    marginBottom: 6
  },
  body: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6
  },
  highlight: {
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 0
  }
});
