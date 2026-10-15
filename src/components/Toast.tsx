/**
 * Resist - Smooth Animated Toast Notification Component
 * Attio-inspired sleek toast with smooth slide and fade animations.
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { WarningCircle, CheckCircle, Info, X } from 'phosphor-react-native';
import { useTheme } from '../contexts/ThemeContext';

export type ToastType = 'error' | 'success' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  title?: string;
  duration?: number;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'error',
  title,
  duration = 4000,
  onDismiss,
}) => {
  const { theme } = useTheme();
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: Platform.OS !== 'web',
          tension: 70,
          friction: 9,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      handleDismiss();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -80,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  const getBorderColor = () => {
    switch (type) {
      case 'error':
        return theme.riskHighBorder || '#ef4444';
      case 'success':
        return theme.riskLowBorder || '#22c55e';
      default:
        return theme.borderStrong || '#6b7280';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <WarningCircle size={20} color={theme.riskHighText || '#ef4444'} weight="fill" />;
      case 'success':
        return <CheckCircle size={20} color={theme.riskLowText || '#22c55e'} weight="fill" />;
      default:
        return <Info size={20} color={theme.text} weight="fill" />;
    }
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: theme.surfaceElevated || '#1f2937',
          borderColor: getBorderColor(),
          shadowColor: '#000',
        },
      ]}
    >
      <View style={styles.iconContainer}>{getIcon()}</View>
      <View style={styles.textContainer}>
        {title ? (
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        ) : null}
        <Text style={[styles.message, { color: theme.textSecondary || '#e5e7eb' }]}>
          {message}
        </Text>
      </View>
      <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <X size={16} color={theme.textTertiary || '#9ca3af'} weight="bold" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 50,
    left: 20,
    right: 20,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  closeBtn: {
    marginLeft: 8,
    padding: 4,
  },
});
