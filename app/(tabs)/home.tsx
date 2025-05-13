import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

type ConcentrationData = {
  id: string;
  name: string;
  concentration: number;
  dilutionFactor: number;
  date: Date;
  notes?: string;
  imageUri?: string;
};

type GradientColors = readonly [string, string];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [recentTests, setRecentTests] = useState<ConcentrationData[]>([
    {
      id: '1',
      name: 'Sample 1',
      concentration: 0.5,
      dilutionFactor: 1,
      date: new Date(),
      notes: 'Initial test',
    },
  ]);

  const features = [
    {
      title: 'New Test',
      description: 'Start a new ammonia concentration test',
      icon: 'flask',
      gradient: ['#4F46E5', '#7C3AED'] as GradientColors,
      onPress: () => router.push('/(tabs)/capture'),
    },
    {
      title: 'Dilution Calculator',
      description: 'Calculate required dilutions',
      icon: 'calculator',
      gradient: ['#0891B2', '#0EA5E9'] as GradientColors,
      onPress: () => router.push('/(tabs)/dilution'),
    },
    {
      title: 'History',
      description: 'View past test results',
      icon: 'time',
      gradient: ['#059669', '#10B981'] as GradientColors,
      onPress: () => router.push('/(tabs)/history'),
    },
    {
      title: 'Analysis',
      description: 'Analyze test results',
      icon: 'analytics',
      gradient: ['#DC2626', '#EF4444'] as GradientColors,
      onPress: () => router.push('/(tabs)/analysis'),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
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
            <Ionicons name="home" size={32} color="white" style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Ammonia Analyzer</Text>
          </View>
          <Text style={styles.headerSubtitle}>Quick and accurate ammonia testing</Text>
        </View>
        <View style={styles.headerDecoration}>
          <View style={styles.molecule} />
          <View style={styles.molecule} />
          <View style={styles.molecule} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            {features.map((feature, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionButton}
                onPress={feature.onPress}
              >
                <LinearGradient
                  colors={feature.gradient}
                  style={styles.actionButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.actionIconContainer}>
                    <Ionicons name={feature.icon as any} size={24} color="white" />
                  </View>
                  <Text style={styles.actionButtonText}>{feature.title}</Text>
                  <Text style={styles.actionButtonDescription}>{feature.description}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>Recent Tests</Text>
          <View style={[styles.card, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
            {recentTests.length > 0 ? (
              recentTests.map((test, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.testItem}
                  onPress={() => router.push({
                    pathname: '/(tabs)/analysis',
                    params: { id: test.id }
                  })}
                >
                  <View style={styles.testInfo}>
                    <Text style={[styles.testDate, { color: Colors[colorScheme ?? 'light'].text }]}>
                      {new Date(test.date).toLocaleDateString()}
                    </Text>
                    <View style={styles.testValueContainer}>
                      <Text style={[styles.testValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                        {test.concentration.toFixed(2)} mg/L
                      </Text>
                      <View style={[styles.testStatus, { backgroundColor: test.concentration > 0.5 ? '#EF4444' : '#10B981' }]} />
                    </View>
                    {test.notes && (
                      <Text style={[styles.testNotes, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                        {test.notes}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={Colors[colorScheme ?? 'light'].text} />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: Colors[colorScheme ?? 'light'].text }]}>
                No recent tests
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>Quick Tips</Text>
          <View style={[styles.card, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
            <View style={styles.tipItem}>
              <View style={[styles.tipIconContainer, { backgroundColor: '#3B82F6' }]}>
                <Ionicons name="information-circle" size={24} color="white" />
              </View>
              <Text style={[styles.tipText, { color: Colors[colorScheme ?? 'light'].text }]}>
                Ensure proper lighting when capturing test results
              </Text>
            </View>
            <View style={styles.tipItem}>
              <View style={[styles.tipIconContainer, { backgroundColor: '#10B981' }]}>
                <Ionicons name="information-circle" size={24} color="white" />
              </View>
              <Text style={[styles.tipText, { color: Colors[colorScheme ?? 'light'].text }]}>
                Use the dilution calculator for accurate measurements
              </Text>
            </View>
            <View style={styles.tipItem}>
              <View style={[styles.tipIconContainer, { backgroundColor: '#F59E0B' }]}>
                <Ionicons name="information-circle" size={24} color="white" />
              </View>
              <Text style={[styles.tipText, { color: Colors[colorScheme ?? 'light'].text }]}>
                Keep test samples at room temperature
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  molecule: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionButton: {
    width: (width - 56) / 2,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  testInfo: {
    flex: 1,
  },
  testDate: {
    fontSize: 14,
    color: '#666666',
  },
  testValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  testStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  testNotes: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
  },
});
