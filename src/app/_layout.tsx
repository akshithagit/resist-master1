/**
 * Resist - Root App Layout (Expo Router)
 * Configured with AuthProvider, ThemeProvider, and Auth0 route guards.
 */

import React, { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { StorageService } from '../services/storage';
import { ActivityIndicator, View } from 'react-native';

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect unauthenticated user to login screen first
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect authenticated user directly to home
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="wizard" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="analysis/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    StorageService.initializeIfNeeded();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}
