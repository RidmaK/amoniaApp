import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Image,
  Dimensions,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

type User = {
  name: string;
  email: string;
  role: string;
  lab: string;
};

type Settings = {
  darkMode: boolean;
  notifications: boolean;
  autoSave: boolean;
  dataRetention: number;
  language: string;
  units: string;
};

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = width >= 768;
  const isSmallScreen = width < 375;
  const { theme, isDark, setTheme } = useTheme();
  const [user, setUser] = useState<User>({
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@lab.com',
    role: 'Senior Chemist',
    lab: 'Environmental Analysis Lab',
  });
  const [settings, setSettings] = useState<Settings>({
    darkMode: colorScheme === 'dark',
    notifications: true,
    autoSave: true,
    dataRetention: 30,
    language: 'English',
    units: 'Metric',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('appSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear authentication state
              await AsyncStorage.removeItem('isAuthenticated');
              // Clear any other user data if needed
              await AsyncStorage.removeItem('appSettings');
              // Navigate to sign-in screen
              router.replace('/(auth)/sign-in');
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleSettingChange = (key: keyof Settings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const getResponsiveFontSize = (baseSize: number) => {
    if (isSmallScreen) return baseSize - 2;
    if (isTablet) return baseSize + 2;
    return baseSize;
  };

  const getResponsiveSpacing = (baseSpacing: number) => {
    if (isSmallScreen) return baseSpacing - 4;
    if (isTablet) return baseSpacing + 4;
    return baseSpacing;
  };

  const toggleTheme = (value: boolean) => {
    setTheme(value ? 'dark' : 'light');
  };

  const toggleSystemTheme = (value: boolean) => {
    if (value) {
      setTheme('system');
    } else {
      setTheme(isDark ? 'dark' : 'light');
    }
  };

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
    gear: {
      position: 'absolute',
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: 'white',
      borderRadius: 10,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: getResponsiveSpacing(20),
      paddingBottom: getResponsiveSpacing(40),
      maxWidth: isTablet ? 600 : '100%',
      alignSelf: 'center',
      width: '100%',
    },
    section: {
      marginBottom: getResponsiveSpacing(24),
    },
    sectionTitle: {
      fontSize: getResponsiveFontSize(18),
      fontWeight: '600',
      marginBottom: getResponsiveSpacing(12),
  },
    card: {
      borderRadius: 16,
      padding: getResponsiveSpacing(16),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    profileHeader: {
      flexDirection: isLandscape && !isTablet ? 'column' : 'row',
      alignItems: isLandscape && !isTablet ? 'center' : 'flex-start',
      gap: getResponsiveSpacing(16),
      marginBottom: getResponsiveSpacing(16),
    },
    avatarContainer: {
      width: isTablet ? 80 : 64,
      height: isTablet ? 80 : 64,
      borderRadius: isTablet ? 40 : 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileInfo: {
      flex: 1,
      alignItems: isLandscape && !isTablet ? 'center' : 'flex-start',
    },
    userName: {
      fontSize: getResponsiveFontSize(18),
      fontWeight: '600',
      marginBottom: 4,
      textAlign: isLandscape && !isTablet ? 'center' : 'left',
    },
    userEmail: {
      fontSize: getResponsiveFontSize(14),
      marginBottom: 4,
      textAlign: isLandscape && !isTablet ? 'center' : 'left',
    },
    userRole: {
      fontSize: getResponsiveFontSize(14),
      opacity: 0.8,
      textAlign: isLandscape && !isTablet ? 'center' : 'left',
    },
    profileDetails: {
      marginTop: getResponsiveSpacing(12),
      paddingTop: getResponsiveSpacing(12),
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getResponsiveSpacing(8),
      justifyContent: isLandscape && !isTablet ? 'center' : 'flex-start',
    },
    detailText: {
      fontSize: getResponsiveFontSize(14),
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: getResponsiveSpacing(12),
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    settingInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getResponsiveSpacing(12),
      flex: 1,
    },
    settingTextContainer: {
      flex: 1,
    },
    settingLabel: {
      fontSize: getResponsiveFontSize(16),
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: getResponsiveFontSize(12),
      opacity: 0.8,
    },
    valueButton: {
      paddingHorizontal: getResponsiveSpacing(12),
      paddingVertical: getResponsiveSpacing(6),
      borderRadius: 8,
      minWidth: isTablet ? 100 : 80,
    },
    valueButtonText: {
      color: 'white',
      fontSize: getResponsiveFontSize(14),
      fontWeight: '600',
      textAlign: 'center',
    },
    accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
      paddingVertical: getResponsiveSpacing(12),
    borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
  },
    accountInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getResponsiveSpacing(12),
  },
    accountLabel: {
      fontSize: getResponsiveFontSize(16),
  },
    logoutButton: {
      marginTop: getResponsiveSpacing(8),
    },
    aboutItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    alignItems: 'center',
      paddingVertical: getResponsiveSpacing(12),
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
  },
    aboutLabel: {
      fontSize: getResponsiveFontSize(16),
    },
    aboutValue: {
      fontSize: getResponsiveFontSize(16),
      opacity: 0.8,
  },
});

  return (
    <View style={[styles.container, { backgroundColor: Colors[isDark ? 'dark' : 'light'].background }]}>
      <LinearGradient
        colors={isDark ? ['#1E3A8A', '#1E40AF'] : ['#3B82F6', '#2563EB']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="settings" size={32} color="white" style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Settings</Text>
          </View>
          <Text style={styles.headerSubtitle}>Customize your app preferences</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors[isDark ? 'dark' : 'light'].text }]}>User Profile</Text>
          <View style={[styles.card, { backgroundColor: Colors[isDark ? 'dark' : 'light'].card }]}>
            <View style={styles.profileHeader}>
              <View style={[styles.avatarContainer, { backgroundColor: Colors[isDark ? 'dark' : 'light'].tint }]}>
                <Ionicons name="person" size={32} color="white" />
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.userName, { color: Colors[isDark ? 'dark' : 'light'].text }]}>{user.name}</Text>
                <Text style={[styles.userEmail, { color: Colors[isDark ? 'dark' : 'light'].text }]}>{user.email}</Text>
                <Text style={[styles.userRole, { color: Colors[isDark ? 'dark' : 'light'].text }]}>{user.role}</Text>
              </View>
            </View>
            <View style={styles.profileDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="business" size={20} color={Colors[isDark ? 'dark' : 'light'].tint} />
                <Text style={[styles.detailText, { color: Colors[isDark ? 'dark' : 'light'].text }]}>{user.lab}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors[isDark ? 'dark' : 'light'].text }]}>App Settings</Text>
          <View style={[styles.card, { backgroundColor: Colors[isDark ? 'dark' : 'light'].card }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name={isDark ? "moon" : "sunny"} size={24} color={Colors[isDark ? 'dark' : 'light'].tint} />
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingLabel, { color: Colors[isDark ? 'dark' : 'light'].text }]}>Dark Mode</Text>
                  <Text style={[styles.settingDescription, { color: Colors[isDark ? 'dark' : 'light'].text }]}>
                    Switch between light and dark theme
                  </Text>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#767577', true: Colors[isDark ? 'dark' : 'light'].tint }}
                thumbColor={Platform.OS === 'ios' ? '#f4f3f4' : isDark ? '#f4f3f4' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="phone-portrait" size={24} color={Colors[isDark ? 'dark' : 'light'].tint} />
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingLabel, { color: Colors[isDark ? 'dark' : 'light'].text }]}>Use System Theme</Text>
                  <Text style={[styles.settingDescription, { color: Colors[isDark ? 'dark' : 'light'].text }]}>
                    Use system-wide theme
                  </Text>
                </View>
              </View>
              <Switch
                value={theme === 'system'}
                onValueChange={toggleSystemTheme}
                trackColor={{ false: '#767577', true: Colors[isDark ? 'dark' : 'light'].tint }}
                thumbColor={Platform.OS === 'ios' ? '#f4f3f4' : isDark ? '#f4f3f4' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications" size={24} color={Colors[isDark ? 'dark' : 'light'].tint} />
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingLabel, { color: Colors[isDark ? 'dark' : 'light'].text }]}>Notifications</Text>
                  <Text style={[styles.settingDescription, { color: Colors[isDark ? 'dark' : 'light'].text }]}>
                    Receive alerts for test results
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.notifications}
                onValueChange={(value) => handleSettingChange('notifications', value)}
                trackColor={{ false: '#767577', true: Colors[isDark ? 'dark' : 'light'].tint }}
                thumbColor={Platform.OS === 'ios' ? '#f4f3f4' : isDark ? '#f4f3f4' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="save" size={24} color={Colors[isDark ? 'dark' : 'light'].tint} />
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingLabel, { color: Colors[isDark ? 'dark' : 'light'].text }]}>Auto Save</Text>
                  <Text style={[styles.settingDescription, { color: Colors[isDark ? 'dark' : 'light'].text }]}>
                    Automatically save test results
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.autoSave}
                onValueChange={(value) => handleSettingChange('autoSave', value)}
                trackColor={{ false: '#767577', true: Colors[isDark ? 'dark' : 'light'].tint }}
                thumbColor={Platform.OS === 'ios' ? '#f4f3f4' : isDark ? '#f4f3f4' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors[isDark ? 'dark' : 'light'].text }]}>Data Management</Text>
          <View style={[styles.card, { backgroundColor: Colors[isDark ? 'dark' : 'light'].card }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="time" size={24} color={Colors[isDark ? 'dark' : 'light'].tint} />
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingLabel, { color: Colors[isDark ? 'dark' : 'light'].text }]}>Data Retention</Text>
                  <Text style={[styles.settingDescription, { color: Colors[isDark ? 'dark' : 'light'].text }]}>
                    Keep test history for {settings.dataRetention} days
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.valueButton, { backgroundColor: Colors[isDark ? 'dark' : 'light'].tint }]}
                onPress={() => {
                  Alert.alert(
                    'Data Retention',
                    'Select retention period',
                    [
                      { text: '7 days', onPress: () => handleSettingChange('dataRetention', 7) },
                      { text: '30 days', onPress: () => handleSettingChange('dataRetention', 30) },
                      { text: '90 days', onPress: () => handleSettingChange('dataRetention', 90) },
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  );
                }}
              >
                <Text style={styles.valueButtonText}>{settings.dataRetention} days</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="language" size={24} color={Colors[isDark ? 'dark' : 'light'].tint} />
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingLabel, { color: Colors[isDark ? 'dark' : 'light'].text }]}>Language</Text>
                  <Text style={[styles.settingDescription, { color: Colors[isDark ? 'dark' : 'light'].text }]}>
                    App interface language
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.valueButton, { backgroundColor: Colors[isDark ? 'dark' : 'light'].tint }]}
                onPress={() => {
                  Alert.alert(
                    'Language',
                    'Select language',
                    [
                      { text: 'English', onPress: () => handleSettingChange('language', 'English') },
                      { text: 'Spanish', onPress: () => handleSettingChange('language', 'Spanish') },
                      { text: 'French', onPress: () => handleSettingChange('language', 'French') },
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  );
                }}
              >
                <Text style={styles.valueButtonText}>{settings.language}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="scale" size={24} color={Colors[isDark ? 'dark' : 'light'].tint} />
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingLabel, { color: Colors[isDark ? 'dark' : 'light'].text }]}>Units</Text>
                  <Text style={[styles.settingDescription, { color: Colors[isDark ? 'dark' : 'light'].text }]}>
                    Measurement units system
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.valueButton, { backgroundColor: Colors[isDark ? 'dark' : 'light'].tint }]}
                onPress={() => {
                  Alert.alert(
                    'Units',
                    'Select measurement system',
                    [
                      { text: 'Metric', onPress: () => handleSettingChange('units', 'Metric') },
                      { text: 'Imperial', onPress: () => handleSettingChange('units', 'Imperial') },
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  );
                }}
              >
                <Text style={styles.valueButtonText}>{settings.units}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors[isDark ? 'dark' : 'light'].text }]}>Account</Text>
          <View style={[styles.card, { backgroundColor: Colors[isDark ? 'dark' : 'light'].card }]}>
            <TouchableOpacity
              style={styles.accountItem}
              onPress={() => Alert.alert('Coming Soon', 'Password change feature will be available soon')}
            >
              <View style={styles.accountInfo}>
                <Ionicons name="key" size={24} color={Colors[isDark ? 'dark' : 'light'].tint} />
                <Text style={[styles.accountLabel, { color: Colors[isDark ? 'dark' : 'light'].text }]}>Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={Colors[isDark ? 'dark' : 'light'].text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.accountItem}
              onPress={() => Alert.alert('Coming Soon', 'Two-factor authentication will be available soon')}
            >
              <View style={styles.accountInfo}>
                <Ionicons name="shield-checkmark" size={24} color={Colors[isDark ? 'dark' : 'light'].tint} />
                <Text style={[styles.accountLabel, { color: Colors[isDark ? 'dark' : 'light'].text }]}>Two-Factor Authentication</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={Colors[isDark ? 'dark' : 'light'].text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.accountItem, styles.logoutButton]}
              onPress={handleLogout}
            >
              <View style={styles.accountInfo}>
                <Ionicons name="log-out" size={24} color="#EF4444" />
                <Text style={[styles.accountLabel, { color: '#EF4444' }]}>Logout</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors[isDark ? 'dark' : 'light'].text }]}>About</Text>
          <View style={[styles.card, { backgroundColor: Colors[isDark ? 'dark' : 'light'].card }]}>
            <View style={styles.aboutItem}>
              <Text style={[styles.aboutLabel, { color: Colors[isDark ? 'dark' : 'light'].text }]}>Version</Text>
              <Text style={[styles.aboutValue, { color: Colors[isDark ? 'dark' : 'light'].text }]}>1.0.0</Text>
            </View>
            <View style={styles.aboutItem}>
              <Text style={[styles.aboutLabel, { color: Colors[isDark ? 'dark' : 'light'].text }]}>Build</Text>
              <Text style={[styles.aboutValue, { color: Colors[isDark ? 'dark' : 'light'].text }]}>2024.03.15</Text>
            </View>
            <TouchableOpacity
              style={styles.aboutItem}
              onPress={() => Alert.alert('Coming Soon', 'Terms and conditions will be available soon')}
            >
              <Text style={[styles.aboutLabel, { color: Colors[isDark ? 'dark' : 'light'].text }]}>Terms & Conditions</Text>
              <Ionicons name="chevron-forward" size={24} color={Colors[isDark ? 'dark' : 'light'].text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.aboutItem}
              onPress={() => Alert.alert('Coming Soon', 'Privacy policy will be available soon')}
            >
              <Text style={[styles.aboutLabel, { color: Colors[isDark ? 'dark' : 'light'].text }]}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={24} color={Colors[isDark ? 'dark' : 'light'].text} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
