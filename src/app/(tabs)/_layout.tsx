/**
 * Resist - Tabs Layout (Expo Router)
 * Clean bottom tab bar with Phosphor Icons & Attio Design System
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs, router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { SquaresFour, ClipboardText, Plus, Gear } from 'phosphor-react-native';

export default function TabsLayout() {
  const { theme, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.tabBarBorder,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: theme.tabActive,
        tabBarInactiveTintColor: theme.tabInactive,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <SquaresFour size={22} color={String(color)} weight={focused ? 'fill' : 'regular'} />
          ),
          tabBarLabel: ({ color, focused }) => (
            <Text style={[styles.tabLabel, { color }, focused && styles.tabLabelActive]}>
              Home
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <ClipboardText size={22} color={String(color)} weight={focused ? 'fill' : 'regular'} />
          ),
          tabBarLabel: ({ color, focused }) => (
            <Text style={[styles.tabLabel, { color }, focused && styles.tabLabelActive]}>
              History
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Gear size={22} color={String(color)} weight={focused ? 'fill' : 'regular'} />
          ),
          tabBarLabel: ({ color, focused }) => (
            <Text style={[styles.tabLabel, { color }, focused && styles.tabLabelActive]}>
              Settings
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  tabLabelActive: {
    fontWeight: '800',
  },
});
