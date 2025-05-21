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
import { BlurView } from 'expo-blur';

export default function CaptureScreen() {
  const colorScheme = useColorScheme() as 'light' | 'dark' | null;
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = width >= 768;
  const isSmallScreen = width < 375;

  const [isCapturing, setIsCapturing] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [alertData, setAlertData] = useState<{
    title: string;
    message: string;
    onProceed: () => void;
  } | null>(null);

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

  const CustomAlert = () => {
    if (!showCustomAlert || !alertData) return null;

    return (
      <View style={styles.alertOverlay}>
        <BlurView intensity={20} style={styles.alertBlur}>
          <View style={[styles.alertContainer, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
            <View style={styles.alertIconContainer}>
              <Ionicons 
                name={alertData.title.includes('concentrated') ? 'warning' : 'information-circle'} 
                size={48} 
                color={Colors[colorScheme ?? 'light'].tint} 
              />
            </View>
            <Text style={[styles.alertTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              {alertData.title}
            </Text>
            <Text style={[styles.alertMessage, { color: Colors[colorScheme ?? 'light'].text }]}>
              {alertData.message}
            </Text>
            <TouchableOpacity
              style={[styles.alertButton, styles.alertButtonCancel]}
              onPress={() => {
                setShowCustomAlert(false);
              }}
            >
              <Text style={[styles.alertButtonText, { color: Colors[colorScheme ?? 'light'].text }]}>
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    );
  };

  const validateColor = async (imageUri: string) => {
    try {
      let formData;
      
      if (Platform.OS === 'web') {
        const imageResponse = await fetch(imageUri);
        const blob = await imageResponse.blob();
        formData = new FormData();
        const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
        formData.append('file', file);
      } else {
        formData = new FormData();
        if (Platform.OS === 'android') {
          const imageUriWithPrefix = imageUri.startsWith('file://') ? imageUri : `file://${imageUri}`;
          formData.append('file', {
            uri: imageUriWithPrefix,
            type: 'image/jpeg',
            name: 'image.jpg',
          } as any);
        } else {
          formData.append('file', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'image.jpg',
          } as any);
        }
      }

      const response = await fetch('https://test3.xessglobal.net/validate-color', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          ...(Platform.OS === 'web' ? {} : { 'Content-Type': 'multipart/form-data' }),
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error validating color:', error);
      throw error;
    }
  };

  const handleCapture = async () => {
    if (isCapturing) return;
    
    try {
      setIsCapturing(true);
      
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
        return;
      }

      // Add a small delay to ensure camera is ready
      await new Promise(resolve => setTimeout(resolve, 500));

      // Launch camera with optimized options
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8, // Slightly reduced quality for better performance
        exif: false, // Disable EXIF data to reduce memory usage
        base64: false, // Disable base64 to reduce memory usage
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      // Add a small delay after camera closes
      await new Promise(resolve => setTimeout(resolve, 300));

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('Image captured:', imageUri);
        setPreviewUri(imageUri);
        
        // Add a small delay before validation
        await new Promise(resolve => setTimeout(resolve, 200));
        
        try {
          // Validate color before proceeding
          const validationResult = await validateColor(imageUri);
          
          if (validationResult.status === 'error') {
            setAlertData({
              title: validationResult.message,
              message: validationResult.action,
              onProceed: () => {
                setTimeout(() => {
                  router.push({
                    pathname: '/(tabs)/analysis',
                    params: { 
                      imageUri,
                      timestamp: new Date().getTime(),
                      isNewCapture: 'true'
                    }
                  });
                }, 500);
              }
            });
            setShowCustomAlert(true);
          } else {
            // Color is valid, proceed to analysis
            setTimeout(() => {
              router.push({
                pathname: '/(tabs)/analysis',
                params: { 
                  imageUri,
                  timestamp: new Date().getTime(),
                  isNewCapture: 'true'
                }
              });
            }, 500);
          }
        } catch (validationError) {
          console.error('Validation error:', validationError);
          Alert.alert(
            'Error',
            'Failed to validate the image. Please try again.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert(
        'Error',
        'Failed to capture image. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      // Add a small delay before resetting the capturing state
      setTimeout(() => {
        setIsCapturing(false);
      }, 300);
    }
  };

  const handleGalleryPick = async () => {
    try {
      setIsCapturing(true);
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

        // Validate color before proceeding
        const validationResult = await validateColor(imageUri);
        
        if (validationResult.status === 'error') {
          setAlertData({
            title: validationResult.message,
            message: validationResult.action,
            onProceed: () => {
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
          });
          setShowCustomAlert(true);
        } else {
          // Color is valid, proceed to analysis
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
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from gallery. Please try again.');
    } finally {
      setIsCapturing(false);
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
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.mainContent}>
          <View style={styles.previewSection}>
            <View style={styles.previewContainer}>
              {previewUri ? (
                <Image source={{ uri: previewUri }} style={styles.previewImage} />
              ) : (
                <View style={styles.previewPlaceholder}>
                  <View style={styles.previewIconContainer}>
                    <Ionicons name="camera" size={48} color={Colors[colorScheme ?? 'light'].tint} />
                  </View>
                  <Text style={[styles.previewText, { color: Colors[colorScheme ?? 'light'].text }]}>
                    No image selected
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[styles.captureButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
              onPress={handleCapture}
              disabled={isCapturing}
            >
              {isCapturing ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <>
                  <View style={styles.buttonIconContainer}>
                    <Ionicons name="camera" size={28} color="white" />
                  </View>
                  <Text style={styles.buttonText}>Take Photo</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.galleryButton, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}
              onPress={handleGalleryPick}
            >
              <View style={styles.buttonIconContainer}>
                <Ionicons name="images" size={28} color={Colors[colorScheme ?? 'light'].tint} />
              </View>
              <Text style={[styles.buttonText, { color: Colors[colorScheme ?? 'light'].text }]}>
                Choose from Gallery
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.tipsSection, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb" size={24} color={Colors[colorScheme ?? 'light'].tint} />
              <Text style={[styles.tipsTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                Tips for Best Results
              </Text>
            </View>
            <View style={styles.tipsGrid}>
              <View style={styles.tipCard}>
                <Ionicons name="sunny" size={24} color={Colors[colorScheme ?? 'light'].tint} />
                <Text style={[styles.tipText, { color: Colors[colorScheme ?? 'light'].text }]}>
                  Good lighting conditions
                </Text>
              </View>
              <View style={styles.tipCard}>
                <Ionicons name="crop" size={24} color={Colors[colorScheme ?? 'light'].tint} />
                <Text style={[styles.tipText, { color: Colors[colorScheme ?? 'light'].text }]}>
                  Focus on color area
                </Text>
              </View>
              <View style={styles.tipCard}>
                <Ionicons name="color-palette" size={24} color={Colors[colorScheme ?? 'light'].tint} />
                <Text style={[styles.tipText, { color: Colors[colorScheme ?? 'light'].text }]}>
                  Fill frame with color
                </Text>
              </View>
              <View style={styles.tipCard}>
                <Ionicons name="grid" size={24} color={Colors[colorScheme ?? 'light'].tint} />
                <Text style={[styles.tipText, { color: Colors[colorScheme ?? 'light'].text }]}>
                  Center the sample
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      <CustomAlert />
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
    flexGrow: 1,
  },
  mainContent: {
    flex: 1,
    padding: 20,
    gap: 24,
  },
  previewSection: {
    marginTop: -40,
    zIndex: 1,
  },
  previewContainer: {
    height: 300,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  previewPlaceholder: {
    alignItems: 'center',
    gap: 16,
    padding: 32,
  },
  previewIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  actionSection: {
    gap: 16,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  tipsSection: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  tipCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  tipText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  alertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  alertBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  alertContainer: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  alertIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  alertMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  alertButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  alertButtonCancel: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  alertButtonProceed: {
    backgroundColor: '#3B82F6',
  },
  alertButtonTextProceed: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
