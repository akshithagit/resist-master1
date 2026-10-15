/**
 * Resist - History Screen
 * Analysis History and Management
 * Attio Design System, Phosphor Icons & Monochrome styling
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { AMRAnalysis, RiskCategory } from '../types/amr';
import { StorageService } from '../services/storage';
import { useTheme } from '../contexts/ThemeContext';
import { MagnifyingGlass, Plus, File, ShieldWarning, WarningCircle, CheckCircle } from 'phosphor-react-native';
import { SwipeableHistoryItem } from '../components/SwipeableHistoryItem';

interface Props {
  onSelectAnalysis: (analysis: AMRAnalysis) => void;
  onNewAnalysis: () => void;
}

export const HistoryScreen: React.FC<Props> = ({ onSelectAnalysis, onNewAnalysis }) => {
  const { theme } = useTheme();
  const [analyses, setAnalyses] = useState<AMRAnalysis[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'All' | RiskCategory>('All');

  const loadData = async () => {
    const list = await StorageService.getAllAnalyses();
    setAnalyses(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteItem = (id: string, title: string) => {
    if (Platform.OS === 'web') {
      const ok = window.confirm(`Are you sure you want to delete "${title}"?`);
      if (ok) {
        StorageService.deleteAnalysis(id).then(loadData);
      }
      return;
    }

    Alert.alert('Delete Record', `Are you sure you want to delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await StorageService.deleteAnalysis(id);
          await loadData();
        },
      },
    ]);
  };

  const filteredAnalyses = analyses.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.cultureFindings?.organism?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.patientInput.symptoms?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      filterCategory === 'All' || item.riskResult?.riskCategory === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const renderRiskIcon = (category: string) => {
    if (category === 'High') {
      return <ShieldWarning size={12} color={theme.text} weight="fill" style={{ marginRight: 4 }} />;
    }
    if (category === 'Moderate') {
      return <WarningCircle size={12} color={theme.text} weight="fill" style={{ marginRight: 4 }} />;
    }
    return <CheckCircle size={12} color={theme.text} weight="fill" style={{ marginRight: 4 }} />;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>History</Text>
          <TouchableOpacity
            style={[styles.newBtn, { backgroundColor: theme.accent }]}
            onPress={onNewAnalysis}
          >
            <Plus size={14} color={theme.accentForeground} weight="bold" style={{ marginRight: 4 }} />
            <Text style={[styles.newBtnText, { color: theme.accentForeground }]}>New</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <MagnifyingGlass size={16} color={theme.textTertiary} weight="regular" style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by pathogen, symptoms, or title..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {(['All', 'High', 'Moderate', 'Low'] as const).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterChip,
                { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 },
                filterCategory === cat && { backgroundColor: theme.accent, borderColor: theme.accent },
              ]}
              onPress={() => setFilterCategory(cat)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: theme.textSecondary },
                  filterCategory === cat && { color: theme.accentForeground },
                ]}
              >
                {cat === 'All' ? 'All Records' : `${cat} Risk`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filteredAnalyses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <File size={42} color={theme.textTertiary} weight="thin" style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>No matching analyses</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textTertiary }]}>
              Try changing your search or start a new analysis.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredAnalyses}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <SwipeableHistoryItem
                item={item}
                onSelect={onSelectAnalysis}
                onDelete={handleDeleteItem}
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  newBtnText: {
    fontWeight: '700',
    fontSize: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 40,
  },
  historyCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardMain: {
    flex: 1,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  organismRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  cardOrganism: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 11,
  },
  coverageText: {
    fontSize: 10,
    marginTop: 4,
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderLeftWidth: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    padding: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});
