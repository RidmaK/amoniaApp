import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
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
  View,
  Animated,
  Modal
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { BlurView } from 'expo-blur';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function CaptureScreen() {
  const { openDrawer: openDrawerParam } = useLocalSearchParams<{ openDrawer: string }>();
  const [showDrawer, setShowDrawer] = useState(false);

  const colorScheme = useColorScheme() as 'light' | 'dark' | null;
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = width >= 768;
  const isSmallScreen = width < 375;

  const [isCapturing, setIsCapturing] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [alertData, setAlertData] = useState<{
    title: string;
    message: string;
    onProceed: () => void;
  } | null>(null);

  useEffect(() => {
    if (openDrawerParam === 'true') {
      setTimeout(() => {
        openDrawer();
      }, 100);
    }
  }, [openDrawerParam]);

  const toggleDrawer = () => {
    if (showDrawer) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11
      }).start();
      setShowDrawer(false);
    } else {
      openDrawer();
    }
  };

  const openDrawer = () => {
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11
    }).start();
    setShowDrawer(true);
  };

  const BottomDrawer = () => {
    return (
      <Modal
        visible={showDrawer}
        transparent
        animationType="none"
        onRequestClose={toggleDrawer}
      >
        <TouchableOpacity 
          style={styles.drawerOverlay} 
          activeOpacity={1} 
          onPress={toggleDrawer}
        >
          <Animated.View 
            style={[
              styles.drawer,
              {
                backgroundColor: Colors[colorScheme ?? 'light'].background,
                transform: [{
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0]
                  })
                }]
              }
            ]}
          >
            <View style={styles.drawerHandle} />
            <View style={styles.drawerContent}>
              <TouchableOpacity 
                style={[styles.drawerButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
                onPress={() => {
                  toggleDrawer();
                  handleCapture();
                }}
              >
                <View style={styles.drawerButtonIcon}>
                  <Ionicons name="camera" size={24} color="white" />
                </View>
                <Text style={styles.drawerButtonText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.drawerButton, styles.drawerButtonSecondary, { 
                  backgroundColor: Colors[colorScheme ?? 'light'].card,
                  borderColor: Colors[colorScheme ?? 'light'].tint + '20'
                }]}
                onPress={() => {
                  toggleDrawer();
                  handleGalleryPick();
                }}
              >
                <View style={[styles.drawerButtonIcon, { 
                  backgroundColor: Colors[colorScheme ?? 'light'].tint + '15'
                }]}>
                  <Ionicons name="images" size={24} color={Colors[colorScheme ?? 'light'].tint} />
                </View>
                <Text style={[styles.drawerButtonText, { color: Colors[colorScheme ?? 'light'].text }]}>
                  Choose from Gallery
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    );
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

  const CustomAlert = () => {
  if (!showCustomAlert || !alertData) return null;

  return (
    <View style={styles.alertOverlay}>
      <BlurView intensity={20} style={styles.alertBlur} />
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

      const response = await fetch('https://helpdesk.xessglobal.net/api/validate-color', {
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

  useFocusEffect(
    useCallback(() => {
      if (openDrawerParam === 'true') {
        const timeout = setTimeout(() => {
          openDrawer();
        }, 350);
        return () => clearTimeout(timeout);
      }
    }, [openDrawerParam])
  );

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
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.mainContent}>
          {/* Camera Preview Card */}
          <View style={[styles.cameraCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
            <View style={styles.previewContainer}>
              {previewUri ? (
                <Image source={{ uri: previewUri }} style={styles.previewImage} />
              ) : (
                <View style={styles.previewPlaceholder}>
                  <View style={[styles.cameraIconBg, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '10' }]}>
                    <Ionicons name="camera-outline" size={64} color={Colors[colorScheme ?? 'light'].tint} />
                  </View>
                  <Text style={[styles.placeholderTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                    Ready to Capture
                  </Text>
                  <Text style={[styles.placeholderSubtitle, { color: Colors[colorScheme ?? 'light'].text + '80' }]}>
                    Your test sample will appear here
                  </Text>
                </View>
              )}
            </View>
            
            {previewUri && (
              <View style={styles.previewActions}>
                <TouchableOpacity 
                  style={[styles.retakeButton, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
                  onPress={() => setPreviewUri(null)}
                >
                  <Ionicons name="refresh" size={20} color={Colors[colorScheme ?? 'light'].tint} />
                  <Text style={[styles.retakeText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                    Retake
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Capture Button */}
          <View style={styles.captureSection}>
            <TouchableOpacity
              style={[styles.captureButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
              onPress={toggleDrawer}
              disabled={isCapturing}
            >
              {isCapturing ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <>
                  <View style={styles.captureButtonInner}>
                    <Ionicons name="camera" size={32} color="white" />
                  </View>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}
              onPress={handleCapture}
              disabled={isCapturing}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '15' }]}>
                <Ionicons name="camera" size={24} color={Colors[colorScheme ?? 'light'].tint} />
              </View>
              <Text style={[styles.quickActionText, { color: Colors[colorScheme ?? 'light'].text }]}>
                Camera
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}
              onPress={handleGalleryPick}
              disabled={isCapturing}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '15' }]}>
                <Ionicons name="images" size={24} color={Colors[colorScheme ?? 'light'].tint} />
              </View>
              <Text style={[styles.quickActionText, { color: Colors[colorScheme ?? 'light'].text }]}>
                Gallery
              </Text>
            </TouchableOpacity>
          </View>

          {/* Photography Tips */}
          <View style={[styles.tipsCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
            <View style={styles.tipsHeader}>
              <View style={[styles.tipsIconContainer, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '15' }]}>
                <Ionicons name="bulb" size={24} color={Colors[colorScheme ?? 'light'].tint} />
              </View>
              <View style={styles.tipsHeaderText}>
                <Text style={[styles.tipsTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                  Photography Tips
                </Text>
                <Text style={[styles.tipsSubtitle, { color: Colors[colorScheme ?? 'light'].text + '80' }]}>
                  For accurate results
                </Text>
              </View>
            </View>

            <View style={styles.tipsList}>
              {[
                { icon: 'sunny-outline', text: 'Use bright, even lighting' },
                { icon: 'scan-outline', text: 'Focus on the test area' },
                { icon: 'resize-outline', text: 'Fill the frame completely' },
                { icon: 'eye-outline', text: 'Avoid shadows and glare' }
              ].map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <View style={[styles.tipIcon, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '10' }]}>
                    <Ionicons name={tip.icon as any} size={20} color={Colors[colorScheme ?? 'light'].tint} />
                  </View>
                  <Text style={[styles.tipText, { color: Colors[colorScheme ?? 'light'].text }]}>
                    {tip.text}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
      <CustomAlert />
      <BottomDrawer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop:  32,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    gap: 6,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 6,
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  mainContent: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  cameraCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  previewContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  previewPlaceholder: {
    alignItems: 'center',
    gap: 12,
    padding: 32,
  },
  cameraIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  placeholderSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  previewActions: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    marginTop: 16,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  retakeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  captureSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  captureButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.3,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tipsCard: {
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  tipsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsHeaderText: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 1,
  },
  tipsSubtitle: {
    fontSize: 12,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
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
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  alertBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  alertContainer: {
    width: '80%',
    maxWidth: 350,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  alertIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  alertMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  alertButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  alertButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  alertButtonCancel: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom:  20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  drawerHandle: {
    width: 32,
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  drawerContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  drawerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  drawerButtonSecondary: {
    borderWidth: 1,
  },
  drawerButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    flex: 1,
  },
});