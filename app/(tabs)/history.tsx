import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

type ColorScheme = 'light' | 'dark' | null;

type HistoryItem = {
  color_hex: string;
  concentration: number;
  timestamp: string;
};

type HistoryResponse = {
  chart: Array<{
    concentration: number;
    hex: string;
    rgb: {
      r: number;
      g: number;
      b: number;
    };
  }>;
  history: HistoryItem[];
};

type ColorTheme = {
  background: string;
  card: string;
  text: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
};

type AppColors = {
  light: ColorTheme;
  dark: ColorTheme;
};

export default function HistoryScreen() {
  const colorScheme = useColorScheme() as ColorScheme;
  const colors = Colors as AppColors;
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [concentrationRange, setConcentrationRange] = useState<[number, number]>([0, 15]);
  const [activeTab, setActiveTab] = useState<'history' | 'dilution'>('history');
  const [loadingOpacity] = useState(new Animated.Value(1));
  const [loadingAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    filterHistory();
  }, [searchQuery, dateFilter, concentrationRange, history]);

  useEffect(() => {
    startLoadingAnimation();
  }, [isLoading]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('https://test3.xessglobal.net/history');
      
      if (!response.ok) {
        throw new Error('Failed to load history data');
      }

      const data: HistoryResponse = await response.json();
      setHistory(data.history);
      setFilteredHistory(data.history);
    } catch (error) {
      console.error('Error loading history:', error);
      setError('Failed to load history data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setIsRefreshing(true);
      await loadHistory();
    } finally {
      setIsRefreshing(false);
    }
  };

  const filterHistory = () => {
    let filtered = [...history];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        const date = new Date(item.timestamp).toLocaleString().toLowerCase();
        const concentration = item.concentration.toString();
        return date.includes(query) || concentration.includes(query);
      });
    }

    const now = new Date();
    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.timestamp);
          return itemDate.toDateString() === now.toDateString();
        });
        break;
      case 'week':
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.timestamp);
          const diffTime = Math.abs(now.getTime() - itemDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 7;
        });
        break;
      case 'month':
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.timestamp);
          return itemDate.getMonth() === now.getMonth() &&
            itemDate.getFullYear() === now.getFullYear();
        });
        break;
    }

    filtered = filtered.filter(item =>
      item.concentration >= concentrationRange[0] &&
      item.concentration <= concentrationRange[1]
    );

    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setFilteredHistory(filtered);
  };

  const getConcentrationStatus = (concentration: number) => {
    if (concentration < 0.1) return { status: 'Safe', color: '#10B981' };
    if (concentration < 0.5) return { status: 'Warning', color: '#F59E0B' };
    return { status: 'Danger', color: '#EF4444' };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const renderHistoryItem = (item: HistoryItem, index: number) => {
    const status = getConcentrationStatus(item.concentration);
    
    return (
      <View
        key={`${item.timestamp}-${index}`}
        style={[styles.testCard, { backgroundColor: colors[colorScheme ?? 'light'].card }]}
      >
        <View style={styles.testHeader}>
          <Text style={styles.testName}>Test #{index + 1}</Text>
          <Text style={styles.testDate}>{formatDate(item.timestamp)}</Text>
        </View>

        <View style={styles.testDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="flask" size={16} color={colors[colorScheme ?? 'light'].tint} />
            <Text style={styles.detailText}>
              {item.concentration.toFixed(3)} mol/dm⁻³
            </Text>
          </View>
          <View style={styles.detailItem}>
            <View style={[styles.colorBox, { backgroundColor: item.color_hex }]} />
            <Text style={styles.detailText}>
              Color
            </Text>
          </View>
        </View>

        <View style={styles.testActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              router.push({
                pathname: '/(tabs)/analysis',
                params: { 
                  timestamp: new Date().getTime()
                },
              });
            }}
          >
            <Ionicons name="eye" size={20} color="#3B82F6" />
            <Text style={[styles.actionButtonText, { color: '#3B82F6' }]}>View</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const startLoadingAnimation = () => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(loadingAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(loadingAnimation, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(loadingOpacity, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(loadingOpacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      loadingAnimation.setValue(0);
      loadingOpacity.setValue(1);
    }
  };

  const renderSkeletonCard = (index: number) => {
    return (
      <Animated.View
        key={index}
        style={[
          styles.testCard,
          styles.skeletonCard,
          { 
            backgroundColor: colors[colorScheme ?? 'light'].card,
            opacity: loadingOpacity,
            transform: [
              {
                translateX: loadingAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 0]
                })
              }
            ]
          }
        ]}
      >
        <View style={styles.testHeader}>
          <View style={[styles.skeletonText, { width: 80, height: 20 }]} />
          <View style={[styles.skeletonText, { width: 120, height: 16 }]} />
        </View>

        <View style={styles.testDetails}>
          <View style={styles.detailItem}>
            <View style={[styles.skeletonCircle, { marginRight: 8 }]} />
            <View style={[styles.skeletonText, { width: 120, height: 18 }]} />
          </View>
          <View style={styles.detailItem}>
            <View style={[styles.skeletonCircle]} />
            <View style={[styles.skeletonText, { width: 60, height: 18, marginLeft: 8 }]} />
          </View>
        </View>

        <View style={styles.testActions}>
          <View style={[styles.skeletonButton]}>
            <View style={[styles.skeletonCircle, { width: 20, height: 20, marginRight: 4 }]} />
            <View style={[styles.skeletonText, { width: 40, height: 16 }]} />
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors[colorScheme ?? 'light'].background }]}>
      <LinearGradient
        colors={colorScheme === 'dark' 
          ? ['#1E3A8A', '#1E40AF', '#3B82F6'] 
          : ['#3B82F6', '#2563EB', '#1E40AF']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="time" size={32} color="white" style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Test History</Text>
          </View>
          <Text style={styles.headerSubtitle}>View and manage your test results</Text>
        </View>
        <View style={styles.headerDecoration}>
          <View style={styles.timeline} />
          <View style={styles.timelineDot} />
          <View style={styles.timelineDot} />
          <View style={styles.timelineDot} />
        </View>
      </LinearGradient>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'history' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons name="time" size={20} color={activeTab === 'history' ? 'white' : '#666'} />
          <Text style={[
            styles.tabText,
            activeTab === 'history' && styles.activeTabText,
          ]}>
            History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'dilution' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('dilution')}
        >
          <Ionicons name="water" size={20} color={activeTab === 'dilution' ? 'white' : '#666'} />
          <Text style={[
            styles.tabText,
            activeTab === 'dilution' && styles.activeTabText,
          ]}>
            Dilution
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'history' ? (
        <>
          <View style={styles.filters}>
            <View style={[styles.searchContainer, { backgroundColor: colors[colorScheme ?? 'light'].card }]}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search tests..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.filterButtons}>
              {(['all', 'today', 'week', 'month'] as const).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterButton,
                    { backgroundColor: colors[colorScheme ?? 'light'].card },
                    dateFilter === filter && styles.activeFilter,
                  ]}
                  onPress={() => setDateFilter(filter)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    dateFilter === filter && styles.activeFilterText,
                  ]}>
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <ScrollView
            style={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                colors={[colors[colorScheme ?? 'light'].tint]}
                tintColor={colors[colorScheme ?? 'light'].tint}
              />
            }
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                {[...Array(5)].map((_, index) => renderSkeletonCard(index))}
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={48} color={colors[colorScheme ?? 'light'].text} />
                <Text style={[styles.errorText, { color: colors[colorScheme ?? 'light'].text }]}>
                  {error}
                </Text>
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: colors[colorScheme ?? 'light'].tint }]}
                  onPress={loadHistory}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : !isLoading && filteredHistory.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="time-outline" size={48} color={colors[colorScheme ?? 'light'].text} />
                <Text style={[styles.emptyText, { color: colors[colorScheme ?? 'light'].text }]}>
                  {searchQuery || dateFilter !== 'all' ? 'No matching results found' : 'No test results yet'}
                </Text>
                <Text style={[styles.emptySubtext, { color: colors[colorScheme ?? 'light'].text }]}>
                  {searchQuery || dateFilter !== 'all' ? 
                    'Try adjusting your filters' : 
                    'Perform a test to see results here'}
                </Text>
              </View>
            ) : (
              filteredHistory.map((item: HistoryItem, index: number) => renderHistoryItem(item, index))
            )}
          </ScrollView>
        </>
      ) : (
        <View style={styles.dilutionContent}>
          <Text style={styles.dilutionTitle}>Dilution Calculator</Text>
          <Text style={styles.dilutionSubtitle}>Calculate required dilutions for your tests</Text>
          <TouchableOpacity
            style={styles.dilutionButton}
            onPress={() => router.push({
              pathname: '/(tabs)/analysis',
              params: { mode: 'dilution' }
            })}
          >
            <Ionicons name="calculator" size={24} color="white" />
            <Text style={styles.dilutionButtonText}>Open Calculator</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    gap: 8,
    zIndex: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 44,
  },
  headerDecoration: {
    position: 'absolute',
    right: 20,
    top: 20,
    width: 100,
    height: 100,
    opacity: 0.2,
  },
  timeline: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: 'white',
    left: '50%',
  },
  timelineDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    left: '50%',
    transform: [{ translateX: -4 }],
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  filters: {
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
  },
  testCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
  },
  testDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  testDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
  },
  testActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dilutionContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  dilutionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dilutionSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  dilutionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  dilutionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  colorBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  skeletonCard: {
    opacity: 0.7,
    overflow: 'hidden',
  },
  skeletonText: {
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  skeletonCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  skeletonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    padding: 8,
    borderRadius: 8,
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
});

