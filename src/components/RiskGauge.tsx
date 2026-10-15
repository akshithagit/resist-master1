/**
 * Resist - ScoreHeader Component
 * Animated X/100 score heading with monochrome glowing progress bar and Phosphor icons
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { RiskCategory } from '../types/amr';
import { useTheme } from '../contexts/ThemeContext';
import { CheckCircle, ShieldWarning, WarningCircle } from 'phosphor-react-native';

interface ScoreHeaderProps {
  percentage: number | null;
  category: RiskCategory;
}

export const RiskGauge: React.FC<ScoreHeaderProps> = ({ percentage, category }) => {
  const { theme, isDark } = useTheme();
  const isAvailable = percentage !== null;
  const scoreVal = isAvailable ? percentage : 0;

  // Animations
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const animatedScale = useRef(new Animated.Value(0.92)).current;
  const animatedOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedProgress, {
        toValue: scoreVal,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(animatedScale, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(animatedOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [scoreVal]);

  const barWidth = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const renderCategoryIcon = () => {
    if (category === 'High') {
      return <ShieldWarning size={16} color={theme.text} weight="fill" style={{ marginRight: 6 }} />;
    }
    if (category === 'Moderate') {
      return <WarningCircle size={16} color={theme.text} weight="fill" style={{ marginRight: 6 }} />;
    }
    return <CheckCircle size={16} color={theme.text} weight="fill" style={{ marginRight: 6 }} />;
  };

  return (
    <Animated.View style={[styles.container, { opacity: animatedOpacity, transform: [{ scale: animatedScale }] }]}>
      {/* 10 / 100 Heading */}
      <View style={styles.scoreRow}>
        <Text style={[styles.scoreNumber, { color: theme.text }]}>
          {isAvailable ? scoreVal : 'N/A'}
        </Text>
        <Text style={[styles.maxScore, { color: theme.textTertiary }]}> / 100</Text>
      </View>

      {/* Category Pill Badge with Phosphor Icon */}
      <View style={[styles.categoryBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {renderCategoryIcon()}
        <Text style={[styles.categoryLabel, { color: theme.text }]}>
          {isAvailable ? `${category.toUpperCase()} RISK` : 'INSUFFICIENT DATA'}
        </Text>
      </View>

      {/* Smooth Glow Animated Progress Bar */}
      <View style={[styles.progressTrack, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: barWidth,
              backgroundColor: theme.text,
            },
          ]}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreNumber: {
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  maxScore: {
    fontSize: 22,
    fontWeight: '700',
    marginLeft: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 6,
    marginBottom: 14,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
});
