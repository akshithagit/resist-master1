/**
 * Resist - Swipeable / Slide to Delete History Card Component
 * Supports smooth slide-to-delete gesture and long-press deletion.
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import { Trash, Dna, ShieldWarning, WarningCircle, CheckCircle } from 'phosphor-react-native';
import { AMRAnalysis } from '../types/amr';
import { useTheme } from '../contexts/ThemeContext';

interface SwipeableHistoryItemProps {
  item: AMRAnalysis;
  onSelect: (item: AMRAnalysis) => void;
  onDelete: (id: string, title: string) => void;
}

export const SwipeableHistoryItem: React.FC<SwipeableHistoryItemProps> = ({
  item,
  onSelect,
  onDelete,
}) => {
  const { theme } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  const risk = item.riskResult;
  const category = risk?.riskCategory || 'Low';

  const bug =
    item.extractedEntities.find((e) => e.entityType === 'organism')?.normalizedValue ||
    item.cultureFindings?.organism ||
    'Clinical History';

  const renderRiskIcon = (cat: string) => {
    if (cat === 'High') {
      return <ShieldWarning size={12} color={theme.text} weight="fill" style={{ marginRight: 4 }} />;
    }
    if (cat === 'Moderate') {
      return <WarningCircle size={12} color={theme.text} weight="fill" style={{ marginRight: 4 }} />;
    }
    return <CheckCircle size={12} color={theme.text} weight="fill" style={{ marginRight: 4 }} />;
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dy) < 15;
      },
      onPanResponderMove: (_, gestureState) => {
        let newX = gestureState.dx;
        if (isOpen.current) {
          newX = gestureState.dx - 80;
        }
        // Only allow sliding left (negative x) up to -100
        if (newX <= 0 && newX >= -110) {
          translateX.setValue(newX);
        } else if (newX < -110) {
          // Slight resistance
          translateX.setValue(-110 + (newX + 110) * 0.2);
        } else {
          translateX.setValue(0);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = -45;
        const currentX = isOpen.current ? gestureState.dx - 80 : gestureState.dx;

        if (currentX < threshold) {
          // Snap open
          Animated.spring(translateX, {
            toValue: -80,
            useNativeDriver: Platform.OS !== 'web',
            bounciness: 4,
          }).start();
          isOpen.current = true;
        } else {
          // Snap closed
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: Platform.OS !== 'web',
            bounciness: 4,
          }).start();
          isOpen.current = false;
        }
      },
    })
  ).current;

  const closeSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    isOpen.current = false;
  };

  const handleDeletePress = () => {
    closeSwipe();
    onDelete(item.id, item.title);
  };

  return (
    <View style={styles.container}>
      {/* Background Delete Action Container (revealed on slide) */}
      <View
        style={[
          styles.deleteBackground,
          {
            backgroundColor: theme.riskHighBg || '#fef2f2',
            borderColor: theme.riskHighBorder || '#ef4444',
          },
        ]}
      >
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDeletePress}
          activeOpacity={0.8}
        >
          <Trash size={20} color={theme.riskHighText || '#dc2626'} weight="bold" />
          <Text style={[styles.deleteBtnText, { color: theme.riskHighText || '#dc2626' }]}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>

      {/* Foreground Swipeable Card */}
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor: theme.border,
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => {
            if (isOpen.current) {
              closeSwipe();
            } else {
              onSelect(item);
            }
          }}
          onLongPress={() => onDelete(item.id, item.title)}
          delayLongPress={500}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.scoreValue, { color: theme.text }]}>
              {risk?.riskPercentage != null ? `${risk.riskPercentage}%` : 'N/A'}
            </Text>
          </View>

          <View style={styles.organismRow}>
            <Dna size={13} color={theme.textSecondary} weight="regular" style={{ marginRight: 4 }} />
            <Text style={[styles.cardOrganism, { color: theme.textSecondary }]}>{bug}</Text>
          </View>

          <View style={styles.metaRow}>
            <View style={[styles.badge, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
              {renderRiskIcon(category)}
              <Text style={[styles.badgeText, { color: theme.text }]}>
                {category.toUpperCase()} RISK
              </Text>
            </View>
            <Text style={[styles.dateText, { color: theme.textTertiary }]}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>

          <Text style={[styles.coverageText, { color: theme.textTertiary }]}>
            Evidence: {risk?.evidenceCoverage || 'Limited'} ({risk?.evidenceCoverageScore || 0}%)
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
  },
  deleteBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 80,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  deleteBtn: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 2,
  },
  cardContent: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.2,
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  organismRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardOrganism: {
    fontSize: 12,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 11,
  },
  coverageText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
