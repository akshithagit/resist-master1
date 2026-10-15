/**
 * Resist - Admin & Model Settings Screen
 * Weights & Research Parameters Configuration
 * Attio Design System & ThemeContext styling
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { FeatureWeightsConfig } from '../types/amr';
import { StorageService } from '../services/storage';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { User, SignOut, Shield } from 'phosphor-react-native';
import { router } from 'expo-router';

export const AdminSettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const [weights, setWeights] = useState<FeatureWeightsConfig | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (err) {
      console.error('Logout error:', err);
      router.replace('/login');
    }
  };

  const loadSettings = async () => {
    const loadedWeights = await StorageService.getFeatureWeights();
    setWeights(loadedWeights);
  };

  const handleUpdateWeight = (key: keyof FeatureWeightsConfig, valStr: string) => {
    if (!weights) return;
    const num = parseInt(valStr, 10);
    if (!isNaN(num) && num >= 0) {
      setWeights({
        ...weights,
        [key]: num,
      });
    }
  };

  const handleSaveWeights = async () => {
    if (!weights) return;
    await StorageService.saveFeatureWeights(weights);
    await loadSettings();
    Alert.alert('Saved', 'Feature weights configuration updated successfully.');
  };

  const handleResetWeights = async () => {
    const reset = await StorageService.resetFeatureWeights();
    setWeights(reset);
    await loadSettings();
    Alert.alert('Reset Complete', 'Feature weights have been restored to default values.');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>Model Configuration</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Adjust weighted research parameters influencing the AMR risk calculation.
          </Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {user && (
            <View style={[styles.userCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <View style={styles.userHeaderRow}>
                <View style={[styles.userAvatar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <User size={20} color={theme.text} weight="bold" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.userName, { color: theme.text }]}>{user.name}</Text>
                  <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{user.email}</Text>
                  <Text style={[styles.userBadge, { color: theme.textTertiary }]}>
                    Auth0 Verified • {user.authProvider.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {weights && (
            <View>
              <View style={[styles.weightsNotice, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.weightsNoticeText, { color: theme.textSecondary }]}>
                  Feature weights: Modifying these values dynamically adjusts feature importance in subsequent risk calculations.
                </Text>
              </View>

              <View style={[styles.weightsGrid, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                {(Object.keys(weights) as (keyof FeatureWeightsConfig)[]).map((key) => (
                  <View key={key} style={[styles.weightRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.weightLabel, { color: theme.text }]}>{key.replace(/_/g, ' ')}</Text>
                    <TextInput
                      style={[styles.weightInput, { backgroundColor: theme.surface, borderColor: theme.borderStrong, color: theme.text }]}
                      keyboardType="numeric"
                      value={String(weights[key])}
                      onChangeText={(val) => handleUpdateWeight(key, val)}
                    />
                  </View>
                ))}
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[styles.resetBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={handleResetWeights}
                >
                  <Text style={[styles.resetBtnText, { color: theme.textSecondary }]}>Reset Defaults</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: theme.accent }]}
                  onPress={handleSaveWeights}
                >
                  <Text style={[styles.saveBtnText, { color: theme.accentForeground }]}>Save Weights</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Bottom Account & Session Management Card */}
          <View style={[styles.bottomAccountCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
            <Text style={[styles.bottomAccountTitle, { color: theme.text }]}>Account & Session Management</Text>
            <Text style={[styles.bottomAccountSubtitle, { color: theme.textSecondary }]}>
              Logged in as {user?.email || 'Authenticated User'}. Click below to log out of your session.
            </Text>

            <TouchableOpacity
              style={[styles.bottomLogoutBtn, { backgroundColor: theme.riskHighBg, borderColor: theme.riskHighBorder }]}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <SignOut size={18} color={theme.riskHighText} weight="bold" style={{ marginRight: 6 }} />
              <Text style={[styles.bottomLogoutBtnText, { color: theme.riskHighText }]}>Log Out of Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  weightsNotice: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  weightsNoticeText: {
    fontSize: 11,
    lineHeight: 16,
  },
  weightsGrid: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  weightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  weightLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    flex: 1,
  },
  weightInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 13,
    fontWeight: '700',
    width: 60,
    textAlign: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  userCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  userHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
  },
  userEmail: {
    fontSize: 12,
    marginTop: 1,
  },
  userBadge: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  bottomAccountCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 24,
  },
  bottomAccountTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  bottomAccountSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  bottomLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
  },
  bottomLogoutBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
