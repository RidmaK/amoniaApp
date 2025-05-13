import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const features = [
  {
    icon: 'flask',
    title: 'Real-time Analysis',
    description: 'Capture and analyze ammonia levels instantly with our advanced camera technology',
    color: '#4CAF50',
  },
  {
    icon: 'analytics',
    title: 'Detailed Results',
    description: 'Get comprehensive analysis with charts and detailed metrics',
    color: '#2196F3',
  },
  {
    icon: 'water',
    title: 'Dilution Calculator',
    description: 'Easily calculate required dilutions for accurate measurements',
    color: '#9C27B0',
  },
  {
    icon: 'time',
    title: 'History Tracking',
    description: 'Keep track of all your tests and results over time',
    color: '#FF9800',
  },
];

export default function EntranceScreen() {
  const colorScheme = useColorScheme();
  const theme: 'light' | 'dark' = colorScheme ?? 'light';
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isContentReady, setIsContentReady] = useState(false);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsContentReady(true);
    });
  };

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      setIsContentReady(false);
      const authState = await AsyncStorage.getItem('isAuthenticated');
      const isAuth = authState === 'true';
      setIsAuthenticated(isAuth);
      if (isAuth) {
        router.replace('/(tabs)/home');
      } else {
        fadeAnim.setValue(0);
        slideAnim.setValue(50);
        startAnimations();
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      setIsAuthenticated(false);
      startAnimations();
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      checkAuth();
    }, [])
  );

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.replace('/(tabs)/home');
    } else {
      router.push('/(auth)/sign-in');
    }
  };

  const renderMolecule = () => (
    <View style={styles.moleculeContainer}>
      {[...Array(6)].map((_, i) => (
        <View key={i} style={[styles.molecule, { transform: [{ rotate: `${i * 60}deg` }] }]}>
          <View style={styles.atom} />
          <View style={styles.bond} />
        </View>
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#1a237e', '#0d47a1', '#1976d2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >

        <BlurView intensity={30} tint="light" style={styles.headerContent}>
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              alignItems: 'center',
            }}
          >
            <View style={styles.iconBackdrop}>
              <Ionicons name="water" size={40} color="white" />
            </View>
            <Text style={styles.title}>Ammonia Analyzer</Text>
            <Text style={styles.subtitle}>Advanced Water Quality Monitoring</Text>
          </Animated.View>
        </BlurView>
      </LinearGradient>


      <View style={styles.content}>
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <Animated.View
              key={index}
              style={[styles.featureCard, {
                backgroundColor: Colors[theme].card,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
                elevation: 3,
              }]}
            >
              <View style={[styles.featureIconCircle, { backgroundColor: feature.color + '1A' }]}>
                <Ionicons name={feature.icon as any} size={24} color={feature.color} />
              </View>
              <Text style={[styles.featureTitle, { color: Colors[theme].text }]}>{feature.title}</Text>
              <Text style={[styles.featureDescription, { color: Colors[theme].text, opacity: 0.6 }]}>{feature.description}</Text>
            </Animated.View>
          ))}
        </View>

        <Animated.View style={[styles.ctaContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
            <LinearGradient colors={['#4f8ef7', '#3466d1']} style={styles.gradientButton}>
              <Ionicons name="rocket" size={22} color="white" style={{ marginRight: 10 }} />
              <Text style={styles.getStartedButtonText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.secondaryButtons}>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
              <Text style={[styles.secondaryButtonText, { color: Colors[theme].tint }]}>Create Account</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/home')}>
              <Text style={[styles.secondaryButtonText, { color: Colors[theme].tint }]}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  header: {
    height: 320,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  moleculeContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  molecule: {
    position: 'absolute',
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  atom: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    position: 'absolute',
  },
  bond: {
    width: 2,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    position: 'absolute',
  },
  content: {
    padding: 16,
  },
  featuresContainer: {
    marginTop: -30,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },
  featureCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  featureIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  ctaContainer: {
    marginTop: 30,
    marginBottom: 40,
    gap: 20,
  },
  getStartedButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginHorizontal: 20,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  getStartedButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 28,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.85,
  },
  iconBackdrop: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: 'white',
    opacity: 0.85,
    textAlign: 'center',
    marginTop: 4,
  },
  headerContent: {
    alignItems: 'center',
    padding: 24,
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  
});
