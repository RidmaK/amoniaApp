import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import * as ImageManipulator from 'expo-image-manipulator';
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
import { processImage as processImageWithEffects } from '../utils/imageProcessing';

export default function CaptureScreen() {
  const { openDrawer: openDrawerParam } = useLocalSearchParams();
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

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (openDrawerParam === 'true') {
      setShowDrawer(true);
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
                backgroundColor: Colors[colorScheme ?? 'light'].card,
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
              <View style={styles.drawerHeader}>
                <Text style={[styles.drawerTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                  Choose Option
                </Text>
                <Text style={[styles.drawerSubtitle, { color: Colors[colorScheme ?? 'light'].text + '80' }]}>
                  Select how you want to capture your sample
                </Text>
              </View>

              <View style={styles.optionsContainer}>
                <TouchableOpacity 
                  style={[styles.optionCard, styles.primaryOption]}
                  onPress={() => {
                    toggleDrawer();
                    handleCapture();
                  }}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.optionGradient}
                  >
                    <View style={styles.optionIconWrapper}>
                      <Ionicons name="camera" size={32} color="white" />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={styles.optionTitle}>Take Photo</Text>
                      <Text style={styles.optionDescription}>Capture with camera</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.optionCard, styles.secondaryOption, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
                  onPress={() => {
                    toggleDrawer();
                    handleGalleryPick();
                  }}
                >
                  <View style={styles.optionContent}>
                    <View style={[styles.optionIconWrapper, styles.secondaryIconWrapper]}>
                      <Ionicons name="images" size={32} color={Colors[colorScheme ?? 'light'].tint} />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                        Gallery
                      </Text>
                      <Text style={[styles.optionDescription, { color: Colors[colorScheme ?? 'light'].text + '80' }]}>
                        Choose from photos
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors[colorScheme ?? 'light'].text + '60'} />
                  </View>
                </TouchableOpacity>
              </View>
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

  const processImage = async (imageUri: string) => {
    try {
      setIsProcessing(true);

      // Enhance image quality
      const enhancedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: 1200 } },
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Apply brightness and contrast effects
      const processedUri = await processImageWithEffects(enhancedImage.uri, {
        brightness: 1.2, // Increase brightness by 20%
        contrast: 1.3,   // Increase contrast by 30%
      });

      return processedUri;
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    } finally {
      setIsProcessing(false);
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

      // Launch camera with optimized options
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        exif: false,
        base64: false,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('Image captured:', imageUri);
        
        // Process the image
        const processedUri = await processImage(imageUri);
        setPreviewUri(processedUri);
        
        try {
          // Validate color before proceeding
          const validationResult = await validateColor(processedUri);
          
          if (validationResult.status === 'error') {
            setAlertData({
              title: validationResult.message,
              message: validationResult.action,
              onProceed: () => {
                setTimeout(() => {
                  router.push({
                    pathname: '/(tabs)/analysis',
                    params: { 
                      imageUri: processedUri,
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
                  imageUri: processedUri,
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
      setIsCapturing(false);
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
        
        // Process the image
        const processedUri = await processImage(imageUri);
        setPreviewUri(processedUri);

        // Validate color before proceeding
        const validationResult = await validateColor(processedUri);
        
        if (validationResult.status === 'error') {
          setAlertData({
            title: validationResult.message,
            message: validationResult.action,
            onProceed: () => {
              setTimeout(() => {
                router.push({
                  pathname: '/(tabs)/analysis',
                  params: { 
                    imageUri: processedUri,
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
                imageUri: processedUri,
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
      const timeout = setTimeout(() => {
        openDrawer();
      }, 350);

      return () => clearTimeout(timeout);
    }, [])
  );

  // Simplified ProcessingOverlay component
  const ProcessingOverlay = () => {
    if (!isProcessing) return null;

    return (
      <View style={styles.processingOverlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        <View style={[styles.processingContainer, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
          <View style={styles.processingSpinner}>
            <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          </View>
          <Text style={[styles.processingTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Processing Image
          </Text>
          <Text style={[styles.processingMessage, { color: Colors[colorScheme ?? 'light'].text }]}>
            Enhancing quality and adjusting colors...
          </Text>
        </View>
      </View>
    );
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
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.mainContent}>
          {/* Hero Preview Section */}
          <View style={styles.heroSection}>
            <View style={[styles.previewCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
              {previewUri ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: previewUri }} style={styles.previewImage} />
                  <View style={styles.imageOverlay}>
                    <TouchableOpacity style={styles.retakeButton} onPress={toggleDrawer}>
                      <Ionicons name="refresh" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      style={styles.emptyIconGradient}
                    >
                      <Ionicons name="camera-outline" size={64} color="white" />
                    </LinearGradient>
                  </View>
                  <Text style={[styles.emptyTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                    Ready to Capture
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                    Take a photo or select from gallery to begin analysis
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={toggleDrawer}
            disabled={isCapturing}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionButtonGradient}
            >
              {isCapturing ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={28} color="white" />
                  <Text style={styles.actionButtonText}>Start Capture</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Tips Section */}
          <View style={[styles.tipsContainer, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
            <View style={styles.tipsHeader}>
              <View style={styles.tipsIconContainer}>
                <Ionicons name="lightbulb" size={24} color={Colors[colorScheme ?? 'light'].tint} />
              </View>
              <View>
                <Text style={[styles.tipsTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                  Capture Tips
                </Text>
                <Text style={[styles.tipsSubtitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                  For optimal results
                </Text>
              </View>
            </View>
            
            <View style={styles.tipsContent}>
              {[
                { icon: 'sunny-outline', text: 'Use good lighting' },
                { icon: 'resize-outline', text: 'Fill the frame completely' },
                { icon: 'color-palette-outline', text: 'Focus on color area' },
                { icon: 'scan-outline', text: 'Hold camera steady' }
              ].map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <View style={[styles.tipIconWrapper, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }]}>
                    <Ionicons name={tip.icon} size={18} color={Colors[colorScheme ?? 'light'].tint} />
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
      
      <ProcessingOverlay />
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
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    gap: 8,
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
  heroSection: {
    marginTop: -30,
    zIndex: 1,
  },
  previewCard: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    minHeight: 320,
  },
  imageContainer: {
    position: 'relative',
    height: 320,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  retakeButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderRadius: 24,
    backdropFilter: 'blur(10px)',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    minHeight: 320,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 22,
  },
  primaryActionButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  tipsContainer: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  tipsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  tipsSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  tipsContent: {
    gap: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  tipIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  // Drawer styles
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  drawer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  drawerHandle: {
    width: 48,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  drawerContent: {
    paddingHorizontal: 24,
  },
  drawerHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  drawerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryOption: {
    marginBottom: 8,
  },
  secondaryOption: {
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  optionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  optionIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryIconWrapper: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  // Alert styles
  alertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.4)',
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  alertIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  alertMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    opacity: 0.8,
  },
  alertButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  alertButtonCancel: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  alertButtonProceed: {
    backgroundColor: '#667eea',
  },
  alertButtonTextProceed: {
    color: 'white',
  },
  // Processing overlay styles
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  processingContainer: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  processingSpinner: {
    marginBottom: 24,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  processingMessage: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 22,
  }
});