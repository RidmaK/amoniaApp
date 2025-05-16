import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View
} from 'react-native';
import { Colors } from '../../constants/Colors';

export default function CaptureScreen() {
  const colorScheme = useColorScheme() as 'light' | 'dark' | null;
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = width >= 768;
  const isSmallScreen = width < 375;

  const [isLoading, setIsLoading] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

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

  const handleCapture = async () => {
    try {
      setIsLoading(true);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('Image captured:', imageUri);
        setPreviewUri(imageUri);
        
        // Add a small delay to ensure the image is properly loaded
        setTimeout(() => {
          router.push({
            pathname: '/(tabs)/analysis',
            params: { 
              imageUri,
              timestamp: new Date().getTime(),
              isNewCapture: 'true'
            },
          });
        }, 500);
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGalleryPick = async () => {
    try {
      setIsLoading(true);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Photo library permission is required to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('Image selected from gallery:', imageUri);
        setPreviewUri(imageUri);
        
        // Add a small delay to ensure the image is properly loaded
        setTimeout(() => {
          router.push({
            pathname: '/(tabs)/analysis',
            params: { 
              imageUri,
              timestamp: new Date().getTime(),
              isNewCapture: 'true'
            },
          });
        }, 500);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from gallery. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
            <Ionicons name="flask" size={32} color="white" style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Capture Test</Text>
          </View>
          <Text style={styles.headerSubtitle}>Take a photo of your ammonia test sample</Text>
        </View>
        <View style={styles.headerDecoration}>
          <View style={styles.moleculeDot} />
          <View style={styles.moleculeDot} />
          <View style={styles.moleculeDot} />
          <View style={styles.moleculeLine} />
          <View style={styles.moleculeLine} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <View style={styles.previewContainer}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.previewPlaceholder}>
              <Ionicons name="camera" size={48} color={Colors[colorScheme ?? 'light'].text} />
              <Text style={[styles.previewText, { color: Colors[colorScheme ?? 'light'].text }]}>
                No image selected
              </Text>
            </View>
          )}
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={handleCapture}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="camera" size={24} color="white" />
                <Text style={styles.buttonText}>Take Photo</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}
            onPress={handleGalleryPick}
          >
            <Ionicons name="images" size={24} color={Colors[colorScheme ?? 'light'].tint} />
            <Text style={[styles.buttonText, { color: Colors[colorScheme ?? 'light'].text }]}>
              Choose from Gallery
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.tipsContainer, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
          <Text style={[styles.tipsTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Tips for Best Results
          </Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Ionicons name="sunny" size={20} color={Colors[colorScheme ?? 'light'].tint} />
              <Text style={[styles.tipText, { color: Colors[colorScheme ?? 'light'].text }]}>
                Ensure good lighting conditions
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="crop" size={20} color={Colors[colorScheme ?? 'light'].tint} />
              <Text style={[styles.tipText, { color: Colors[colorScheme ?? 'light'].text }]}>
                Crop image to focus only on the color area
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="color-palette" size={20} color={Colors[colorScheme ?? 'light'].tint} />
              <Text style={[styles.tipText, { color: Colors[colorScheme ?? 'light'].text }]}>
                Ensure color area fills most of the frame
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="grid" size={20} color={Colors[colorScheme ?? 'light'].tint} />
              <Text style={[styles.tipText, { color: Colors[colorScheme ?? 'light'].text }]}>
                Center the test sample in frame
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="hand-left" size={20} color={Colors[colorScheme ?? 'light'].tint} />
              <Text style={[styles.tipText, { color: Colors[colorScheme ?? 'light'].text }]}>
                Keep the camera steady
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="contrast" size={20} color={Colors[colorScheme ?? 'light'].tint} />
              <Text style={[styles.tipText, { color: Colors[colorScheme ?? 'light'].text }]}>
                Avoid shadows and reflections
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
  moleculeDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  moleculeLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: 'white',
    transform: [{ rotate: '45deg' }],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  previewPlaceholder: {
    alignItems: 'center',
    gap: 12,
  },
  previewText: {
    fontSize: 16,
    textAlign: 'center',
  },
  buttonsContainer: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    gap: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsContainer: {
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
});
