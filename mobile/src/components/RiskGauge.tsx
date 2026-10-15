import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { RiskCategory } from '../types';

interface RiskGaugeProps {
  percentage: number | null;
  category: RiskCategory | null;
  size?: number;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  percentage,
  category,
  size = 280
}) => {
  const strokeWidth = 18;
  const radius = (size - strokeWidth * 2) / 2;
  const centerX = size / 2;
  const centerY = size / 2 + 10;

  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const angleRad = (angleDeg * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy - r * Math.sin(angleRad)
    };
  };

  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [
      'M', start.x, start.y,
      'A', r, r, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ');
  };

  const lowArc = describeArc(centerX, centerY, radius, 180, 126);
  const modArc = describeArc(centerX, centerY, radius, 126, 72);
  const highArc = describeArc(centerX, centerY, radius, 72, 0);

  const val = Math.max(0, Math.min(100, percentage ?? 0));
  const needleAngle = 180 - (val / 100) * 180;
  const needleLength = radius - 14;
  const needleEnd = polarToCartesian(centerX, centerY, needleLength, needleAngle);

  const getCategoryColor = () => {
    if (category === 'High') return Colors.highRisk;
    if (category === 'Moderate') return Colors.moderateRisk;
    return Colors.lowRisk;
  };

  const getCategoryBg = () => {
    if (category === 'High') return Colors.highRiskLight;
    if (category === 'Moderate') return Colors.moderateRiskLight;
    return Colors.lowRiskLight;
  };

  return (
    <View style={styles.container}>
      <Svg width={size} height={size * 0.72} viewBox={'0 0 ' + size + ' ' + (size * 0.72)}>
        <Path
          d={describeArc(centerX, centerY, radius, 180, 0)}
          fill="none"
          stroke={Colors.cardSubtle}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <Path
          d={lowArc}
          fill="none"
          stroke={Colors.lowRisk}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <Path
          d={modArc}
          fill="none"
          stroke={Colors.moderateRisk}
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
        />
        <Path
          d={highArc}
          fill="none"
          stroke={Colors.highRisk}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        <SvgText x={centerX - radius} y={centerY + 22} fontSize="11" fill={Colors.textMuted} textAnchor="middle">0%</SvgText>
        <SvgText x={centerX - radius * 0.6} y={centerY - radius * 0.8} fontSize="10" fill={Colors.textMuted} textAnchor="middle">30%</SvgText>
        <SvgText x={centerX + radius * 0.6} y={centerY - radius * 0.8} fontSize="10" fill={Colors.textMuted} textAnchor="middle">60%</SvgText>
        <SvgText x={centerX + radius} y={centerY + 22} fontSize="11" fill={Colors.textMuted} textAnchor="middle">100%</SvgText>

        {percentage !== null && (
          <G>
            <Line
              x1={centerX}
              y1={centerY}
              x2={needleEnd.x}
              y2={needleEnd.y}
              stroke={Colors.textPrimary}
              strokeWidth={3.5}
              strokeLinecap="round"
            />
            <Circle cx={centerX} cy={centerY} r={8} fill={Colors.textPrimary} />
            <Circle cx={centerX} cy={centerY} r={4} fill="#FFFFFF" />
          </G>
        )}
      </Svg>

      <View style={styles.readoutContainer}>
        {percentage !== null ? (
          <>
            <Text style={[styles.percentageText, { color: getCategoryColor() }]}>
              {percentage.toFixed(1)}%
            </Text>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryBg(), borderColor: getCategoryColor() }]}>
              <Text style={[styles.categoryText, { color: getCategoryColor() }]}>
                {((category || 'UNCLASSIFIED').toUpperCase()) + ' PROTOTYPE RISK'}
              </Text>
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.percentageText, { color: Colors.textMuted }]}>--</Text>
            <View style={[styles.categoryBadge, { backgroundColor: Colors.cardSubtle, borderColor: Colors.border }]}>
              <Text style={[styles.categoryText, { color: Colors.textSecondary }]}>INSUFFICIENT DATA</Text>
            </View>
          </>
        )}
        <Text style={styles.subLabel}>Estimated Antimicrobial Resistance Risk Index</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12
  },
  readoutContainer: {
    alignItems: 'center',
    marginTop: -10
  },
  percentageText: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    marginTop: 4
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  subLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 6
  }
});
