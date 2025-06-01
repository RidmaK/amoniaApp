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
  const [processingStep, setProcessingStep] = useState(0);
  const processingSteps = [
    'Enhancing image quality...',
    'Adjusting contrast...',
    'Applying scanner effect...',
    'Optimizing result...'
  ];

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
                  <Ionicons name="camera" size={20} color="white" />
                </View>
                <Text style={styles.drawerButtonText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.drawerButton, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}
                onPress={() => {
                  toggleDrawer();
                  handleGalleryPick();
                }}
              >
                <View style={[styles.drawerButtonIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                  <Ionicons name="images" size={20} color={Colors[colorScheme ?? 'light'].tint} />
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
      setProcessingStep(0);

      // Process image with brightness and contrast only
      await new Promise(resolve => setTimeout(resolve, 500));
      const processedUri = await processImageWithEffects(imageUri, {
        brightness: 1.2, // Increase brightness by 20%
        contrast: 1.3   // Increase contrast by 30%
      });

      setProcessingStep(3);
      await new Promise(resolve => setTimeout(resolve, 500));

      return processedUri;
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    } finally {
      setIsProcessing(false);
      setProcessingStep(0);
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
        quality: 1, // Use max quality since we'll process it later
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
        setAlertData({
          title: 'Permission Required',
          message: 'Please allow access to your photo library to select images.',
          onProceed: () => {
            setTimeout(() => {
              ImagePicker.requestMediaLibraryPermissionsAsync();
            }, 500);
          }
        });
        setShowCustomAlert(true);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('Image selected from gallery:', imageUri);
        
        try {
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
        } catch (processingError) {
          console.error('Error processing image:', processingError);
          setAlertData({
            title: 'Processing Error',
            message: 'There was an error processing your image. Please try selecting a different image or ensure the image is not corrupted.',
            onProceed: () => setShowCustomAlert(false)
          });
          setShowCustomAlert(true);
        }
      } else if (result.canceled) {
        // User canceled image selection - no need to show error
        console.log('Image selection canceled by user');
      } else {
        setAlertData({
          title: 'Invalid Image',
          message: 'Please select a valid image from your gallery.',
          onProceed: () => setShowCustomAlert(false)
        });
        setShowCustomAlert(true);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      setAlertData({
        title: 'Gallery Access Error',
        message: error instanceof Error ? error.message : 'Unable to access photo gallery. Please check your permissions and try again.',
        onProceed: () => setShowCustomAlert(false)
      });
      setShowCustomAlert(true);
    } finally {
      setIsCapturing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const timeout = setTimeout(() => {
        openDrawer();
      }, 350); // 350ms delay for smoothness

      return () => clearTimeout(timeout);
    }, [])
  );

  // Add ProcessingOverlay component
  const ProcessingOverlay = () => {
    if (!isProcessing) return null;

    return (
      <View style={styles.processingOverlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        <View style={[styles.processingContainer, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
          <View style={styles.processingIconContainer}>
            <Ionicons name="scan" size={48} color={Colors[colorScheme ?? 'light'].tint} />
            <View style={[styles.processingPulse, { borderColor: Colors[colorScheme ?? 'light'].tint }]} />
          </View>
          <Text style={[styles.processingTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Processing Image
          </Text>
          <Text style={[styles.processingStep, { color: Colors[colorScheme ?? 'light'].text }]}>
            {processingSteps[processingStep]}
          </Text>
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progressBar,
                { 
                  backgroundColor: Colors[colorScheme ?? 'light'].tint,
                  width: `${((processingStep + 1) / processingSteps.length) * 100}%`
                }
              ]} 
            />
          </View>
          <View style={styles.processingSteps}>
            {processingSteps.map((step, index) => (
              <View 
                key={index}
                style={[
                  styles.processingStepIndicator,
                  { opacity: index <= processingStep ? 1 : 0.3 }
                ]}
              >
                <Ionicons 
                  name={index <= processingStep ? "checkmark-circle" : "ellipse-outline"}
                  size={20}
                  color={Colors[colorScheme ?? 'light'].tint}
                />
                <Text 
                  style={[
                    styles.processingStepText,
                    { 
                      color: Colors[colorScheme ?? 'light'].text,
                      opacity: index <= processingStep ? 1 : 0.5
                    }
                  ]}
                >
                  {step}
                </Text>
              </View>
            ))}
          </View>
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
          <View style={styles.previewSection}>
            <View style={[
              styles.previewContainer,
              { backgroundColor: Colors[colorScheme ?? 'light'].card }
            ]}>
              {previewUri ? (
                <View style={styles.previewImageWrapper}>
                  <Image source={{ uri: previewUri }} style={styles.previewImage} />
                  <LinearGradient
                    colors={['rgba(0,0,0,0.3)', 'transparent', 'transparent', 'rgba(0,0,0,0.3)']}
                    style={styles.previewGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  />
                  <View style={styles.previewOverlay}>
                    <TouchableOpacity 
                      style={styles.previewAction}
                      onPress={() => setPreviewUri(null)}
                    >
                      <Ionicons name="close-circle" size={28} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.previewAction}
                      onPress={() => handleCapture()}
                    >
                      <Ionicons name="camera" size={28} color="white" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.previewInfo}>
                    <BlurView intensity={20} style={styles.previewInfoBlur}>
                      <Ionicons name="information-circle" size={20} color="white" />
                      <Text style={styles.previewInfoText}>
                        Tap to retake or proceed with analysis
                      </Text>
                    </BlurView>
                  </View>
                </View>
              ) : (
                <View style={styles.previewPlaceholder}>
                  <View style={[
                    styles.previewIconContainer,
                    { backgroundColor: `${Colors[colorScheme ?? 'light'].tint}20` }
                  ]}>
                    <Ionicons 
                      name="camera" 
                      size={48} 
                      color={Colors[colorScheme ?? 'light'].tint} 
                    />
                  </View>
                  <Text style={[
                    styles.previewText,
                    { color: Colors[colorScheme ?? 'light'].text }
                  ]}>
                    No image selected
                  </Text>
                  <Text style={[
                    styles.previewSubtext,
                    { color: Colors[colorScheme ?? 'light'].tabIconDefault }
                  ]}>
                    Take a photo or choose from gallery
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[styles.captureButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
              onPress={toggleDrawer}
              disabled={isCapturing}
            >
              {isCapturing ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <>
                  <View style={styles.buttonIconContainer}>
                    <Ionicons name="camera" size={28} color="white" />
                  </View>
                  <Text style={styles.buttonText}>Capture</Text>
                </>
              )}
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
      <ProcessingOverlay />
      <CustomAlert />
      <BottomDrawer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative', // Ensure overlay positions correctly
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
    paddingHorizontal: 20,
  },
  previewContainer: {
    height: 360,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  previewImageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  previewOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
    zIndex: 2,
  },
  previewAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 2,
  },
  previewInfoBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  previewInfoText: {
    color: 'white',
    fontSize: 14,
    flex: 1,
  },
  previewPlaceholder: {
    alignItems: 'center',
    gap: 12,
    padding: 32,
  },
  previewIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  previewSubtext: {
    fontSize: 14,
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
    padding: 12, // smaller padding
    borderRadius: 14, // slightly less rounded
    gap: 10,
    backgroundColor: '#2563EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 4,
    minHeight: 44,
    minWidth: 120,
  },
  buttonIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
    color: 'white',
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
    backgroundColor: 'rgba(0,0,0,0.25)', // Add dimming effect
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
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  drawerContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  drawerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10, // smaller padding
    borderRadius: 12,
    gap: 10,
    marginBottom: 4,
    minHeight: 40,
  },
  drawerButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  processingOverlay: {
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
  processingContainer: {
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
  processingIconContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  processingPulse: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 40,
    borderWidth: 2,
    opacity: 0.5,
    transform: [{ scale: 1.2 }],
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  processingStep: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.3s ease-in-out',
  },
  processingSteps: {
    width: '100%',
    gap: 12,
  },
  processingStepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
  },
  processingStepText: {
    fontSize: 14,
  },
});