/**
 * Resist - Register Account Screen (/register)
 * Monochrome Attio Design System
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, Link } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Shield, ArrowRight, Lock, Envelope, User } from 'phosphor-react-native';
import { Toast } from '../components/Toast';

export default function RegisterScreen() {
  const { theme } = useTheme();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleRegister = async () => {
    setErrorMessage(null);
    setToastVisible(false);

    if (!name.trim() || !email.trim() || !password) {
      const msg = 'Please enter your full name, email address, and password.';
      setErrorMessage(msg);
      setToastMessage(msg);
      setToastVisible(true);
      return;
    }

    try {
      setIsSubmitting(true);
      await register(name, email, password);
      router.replace('/');
    } catch (err: any) {
      const msg = err.message || 'Unable to create account. Please try again.';
      setErrorMessage(msg);
      setToastMessage(msg);
      setToastVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type="error"
        title="Registration Notice"
        onDismiss={() => setToastVisible(false)}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconBox, { backgroundColor: theme.accent, borderColor: theme.border }]}>
              <Shield size={28} color={theme.accentForeground} weight="fill" />
            </View>
            <Text style={[styles.brandTitle, { color: theme.text }]}>Resist</Text>
            <Text style={[styles.brandSubtitle, { color: theme.textSecondary }]}>
              Create your clinical practitioner account
            </Text>
          </View>

          {/* Form Card */}
          <View style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
            <Text style={[styles.formTitle, { color: theme.text }]}>Register Account</Text>
            <Text style={[styles.formSubtitle, { color: theme.textTertiary }]}>
              Secure Auth0 Identity Provisioning
            </Text>

            {errorMessage && (
              <View style={[styles.errorBanner, { backgroundColor: theme.riskHighBg, borderColor: theme.riskHighBorder }]}>
                <Text style={[styles.errorBannerText, { color: theme.riskHighText }]}>
                  {errorMessage}
                </Text>
              </View>
            )}

            {/* Name Input */}
            <Text style={[styles.label, { color: theme.text }]}>Full Name</Text>
            <View style={[styles.inputRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <User size={18} color={theme.textTertiary} weight="regular" style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Dr. Alex Morgan"
                placeholderTextColor={theme.textTertiary}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Email Input */}
            <Text style={[styles.label, { color: theme.text }]}>Email Address</Text>
            <View style={[styles.inputRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Envelope size={18} color={theme.textTertiary} weight="regular" style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="doctor@hospital.org"
                placeholderTextColor={theme.textTertiary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Password Input */}
            <Text style={[styles.label, { color: theme.text }]}>Password</Text>
            <View style={[styles.inputRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Lock size={18} color={theme.textTertiary} weight="regular" style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="••••••••••••"
                placeholderTextColor={theme.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: theme.accent }]}
              onPress={handleRegister}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color={theme.accentForeground} size="small" />
              ) : (
                <>
                  <Text style={[styles.submitBtnText, { color: theme.accentForeground }]}>
                    Create Account & Continue
                  </Text>
                  <ArrowRight size={18} color={theme.accentForeground} weight="bold" style={{ marginLeft: 6 }} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Link to Login */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={[styles.linkText, { color: theme.text }]}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  formSubtitle: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 16,
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorBannerText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 8,
    marginTop: 20,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});
