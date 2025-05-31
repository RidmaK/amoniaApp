import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LineChart } from 'react-native-chart-kit';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

type TestResult = {
  concentration: number;
  confidence: number;
  timestamp: Date;
  ph: number;
  temperature: number;
  turbidity: number;
  calibrationData: {
    time: number[];
    absorbance: number[];
  };
  qualityControl: {
    standardDeviation: number;
    coefficientOfVariation: number;
    recoveryRate: number;
  };
  color: {
    hex: string;
    rgb: {
      r: number;
      g: number;
      b: number;
    };
  };
  history: Array<{
    concentration: number;
    color_hex: string;
    timestamp: string;
  }>;
  chart: Array<{
    concentration: number;
    hex: string;
    rgb: {
      r: number;
      g: number;
      b: number;
    };
  }>;
  sampleInfo: {
    sampleId: string;
    location: string;
    collectionTime: string;
    analyst: string;
    method: string;
  };
  instrumentInfo: {
    model: string;
    serialNumber: string;
    lastCalibration: string;
    status: string;
  };
  testParameters: {
    wavelength: number;
    pathLength: number;
    reactionTime: number;
    reagentLot: string;
  };
  saved_image: string;
  success: boolean;
};

const defaultResult: TestResult = {
  concentration: 0,
  confidence: 0,
  timestamp: new Date(),
  ph: 0,
  temperature: 0,
  turbidity: 0,
  calibrationData: {
    time: [],
    absorbance: [],
  },
  qualityControl: {
    standardDeviation: 0,
    coefficientOfVariation: 0,
    recoveryRate: 0,
  },
  color: {
    hex: '#000000',
    rgb: { r: 0, g: 0, b: 0 },
  },
  history: [],
  chart: [],
  sampleInfo: {
    sampleId: 'N/A',
    location: 'N/A',
    collectionTime: new Date().toISOString(),
    analyst: 'N/A',
    method: 'N/A',
  },
  instrumentInfo: {
    model: 'N/A',
    serialNumber: 'N/A',
    lastCalibration: new Date().toISOString(),
    status: 'N/A',
  },
  testParameters: {
    wavelength: 0,
    pathLength: 0,
    reactionTime: 0,
    reagentLot: 'N/A',
  },
  saved_image: '',
  success: false,
};

export default function AnalysisScreen() {
  const colorScheme = useColorScheme();
  const { imageUri: initialImageUri, timestamp, isNewCapture } = useLocalSearchParams<{ 
    imageUri: string; 
    timestamp: string;
    isNewCapture?: string;
  }>();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [result, setResult] = useState<TestResult>(defaultResult);
  const [isServerOnline, setIsServerOnline] = useState<boolean | null>(null);
  const [lastServerCheck, setLastServerCheck] = useState<Date | null>(null);

  // Monitor server connection status
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch('https://test3.xessglobal.net/');
        const isOnline = response.ok;
        setIsServerOnline(isOnline);
        setLastServerCheck(new Date());
      } catch (error) {
        console.error('Server check failed:', error);
        setIsServerOnline(false);
        setLastServerCheck(new Date());
      }
    };

    // Initial check
    checkServerStatus();

    // Set up periodic checks every 30 seconds
    const intervalId = setInterval(checkServerStatus, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Generate a unique sample ID
  const generateSampleId = () => {
    const date = new Date();
    const timestamp = date.getTime();
    const random = Math.floor(Math.random() * 1000);
    return `SAMPLE-${timestamp}-${random}`;
  };

  // Extract location from image metadata
  const extractImageMetadata = async (uri: string) => {
    try {
      const response = await fetch(uri);
      const metadata = await response.json();
      return {
        location: metadata.location || 'Unknown Location',
        timestamp: metadata.timestamp || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error extracting image metadata:', error);
      return {
        location: 'Unknown Location',
        timestamp: new Date().toISOString(),
      };
    }
  };

  // Always clear previous result and start analyzing when a new image is selected
  useEffect(() => {
    if (initialImageUri) {
      console.log('New image received:', initialImageUri);
      setResult(defaultResult);         // Clear previous result
      setIsAnalyzing(true);             // Set analyzing state
      setImageUri(initialImageUri);     // Set new image
    }
  }, [initialImageUri, timestamp]);

  // Start analysis whenever imageUri changes
  useEffect(() => {
    if (imageUri) {
      console.log('Image URI changed, starting analysis...');
      analyzeImage();
    }
  }, [imageUri]);

  

  const analyzeImage = async () => {
    console.log('Starting analyzeImage with URI:', imageUri);
    if (!imageUri) {
      Alert.alert('Error', 'No image selected');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Generate new sample ID and get image metadata
      const sampleId = generateSampleId();
      const metadata = await extractImageMetadata(imageUri);
      
      // Reset any previous state with new sample info
      setResult({
        ...defaultResult,
        sampleInfo: {
          ...defaultResult.sampleInfo,
          sampleId,
          location: metadata.location,
          collectionTime: metadata.timestamp,
        }
      });
      
      let formData;
      
      if (Platform.OS === 'web') {
        // For web, use the blob approach
        console.log('Fetching image from URI:', imageUri);
        const imageResponse = await fetch(imageUri);
        const blob = await imageResponse.blob();
        
        // Create FormData and append blob
        formData = new FormData();
        const file = new File([blob], 'image.jpg', {
          type: 'image/jpeg',
        });
        formData.append('file', file);
      } else {
        // For mobile (Android/iOS)
        formData = new FormData();
        
        if (Platform.OS === 'android') {
          // For Android, ensure proper file:// prefix
          const imageUriWithPrefix = imageUri.startsWith('file://') ? imageUri : `file://${imageUri}`;
          formData.append('file', {
            uri: imageUriWithPrefix,
            type: 'image/jpeg',
            name: 'image.jpg',
          } as any);
        } else {
          // For iOS
          formData.append('file', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'image.jpg',
          } as any);
        }
      }

      console.log('Uploading image to server...');
      const serverResponse = await fetch('https://test3.xessglobal.net/predict', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          ...(Platform.OS === 'web' ? {} : { 'Content-Type': 'multipart/form-data' }),
        },
      });

      if (!serverResponse.ok) {
        const errorData = await serverResponse.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.error || 'Failed to analyze image');
      }

      const data = await serverResponse.json();
      console.log('Analysis result:', data);

      if (data.ammonia_concentration !== undefined) {
        setResult(prevResult => ({
          ...prevResult,
          concentration: data.ammonia_concentration,
          confidence: 1,
          timestamp: new Date(),
          sampleInfo: {
            ...prevResult.sampleInfo,
            method: data.saved_image || 'N/A',
          },
          color: data.color,
          history: data.history,
          chart: data.chart,
          saved_image: data.saved_image,
          success: data.success,
        }));
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      let errorMessage = 'Failed to analyze image. ';
      
      if (error instanceof Error) {
        errorMessage += error.message;
      }

      Alert.alert(
        'Analysis Failed',
        errorMessage,
        [
          {
            text: 'Retry',
            onPress: () => {
              setIsAnalyzing(true);
              analyzeImage();
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Update the testServerConnection function
  const testServerConnection = async () => {
    try {
      console.log('Testing connections...');
      
      // Test both endpoints
      const [serverResponse, googleResponse] = await Promise.all([
        fetch('https://test3.xessglobal.net/'),
        fetch('https://www.google.com')
      ]);

      const serverOnline = serverResponse.ok;
      const googleOnline = googleResponse.ok;
      
      setIsServerOnline(serverOnline);
      setLastServerCheck(new Date());
      
      console.log('Connection test responses:', {
        server: {
          status: serverResponse.status,
          statusText: serverResponse.statusText,
          ok: serverOnline
        },
        google: {
          status: googleResponse.status,
          statusText: googleResponse.statusText,
          ok: googleOnline
        }
      });
      
      Alert.alert(
        'Connection Status',
        `Server Status:\n${serverOnline ? '✅ Online' : '❌ Not responding'}\nStatus: ${serverResponse.status} ${serverResponse.statusText}\n\nGoogle Status:\n${googleOnline ? '✅ Online' : '❌ Not responding'}\nStatus: ${googleResponse.status} ${googleResponse.statusText}\n\nLast checked: ${new Date().toLocaleTimeString()}`
      );
    } catch (error) {
      console.error('Connection test failed:', error);
      setIsServerOnline(false);
      setLastServerCheck(new Date());
      Alert.alert(
        'Connection Status',
        'Connection test failed. Please check:\n1. Internet connection\n2. Server address\n3. Server status'
      );
    }
  };

  // Add a server status indicator component
  const renderServerStatus = () => (
    <View style={styles.serverStatusContainer}>
      <View style={styles.serverStatusLeft}>
        <View style={[
          styles.serverStatusIndicator,
          { backgroundColor: isServerOnline === null ? '#F59E0B' : isServerOnline ? '#10B981' : '#EF4444' }
        ]} />
        <Text style={[styles.serverStatusText, { color: Colors[colorScheme ?? 'light'].text }]}>
          {isServerOnline === null ? 'Checking...' : isServerOnline ? 'Online' : 'Offline'}
        </Text>
      </View>
      <View style={styles.serverStatusRight}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
          onPress={testServerConnection}
        >
          <Ionicons name="refresh" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleSave = () => {
    if (result) {
      Alert.alert('Success', 'Test result saved to history');
      router.push('/(tabs)/history');
    }
  };

  const getConcentrationStatus = (concentration: number) => {
    if (concentration < 0.1) return { status: 'Safe', color: '#10B981' };
    if (concentration < 0.5) return { status: 'Warning', color: '#F59E0B' };
    return { status: 'Danger', color: '#EF4444' };
  };

  const renderCalibrationChart = () => {
    if (!result?.chart || result.chart.length === 0) return null;

    // Get the color calibration data from the chart array
    const colorCalibration = result.chart;
    
    // Find the max concentration to determine the range
    const maxConcentration = Math.max(...colorCalibration.map(p => p.concentration));
    const range = Math.ceil(maxConcentration);
    
    // Create a focused range of data points
    const numPoints = 15; // Fixed number of points for clarity
    const step = Math.max(1, Math.floor(colorCalibration.length / numPoints));
    const focusedData = colorCalibration.filter((_, index) => index % step === 0);
    
    // Create a gradient scale with key concentration points
    const numKeyPoints = 6; // Reduced number of key points for clarity
    const keyPoints = Array.from({ length: numKeyPoints }, (_, i) => 
      (i * range / (numKeyPoints - 1)).toFixed(1)
    ).map(Number);
    
    const gradientColors = keyPoints.map(conc => {
      const point = colorCalibration.find(p => Math.abs(p.concentration - conc) < 0.1) || colorCalibration[0];
      return point.hex;
    });

    // Find the closest point to the current result
    const currentResult = result.concentration;
    const closestPoint = colorCalibration.reduce((prev, curr) => {
      return Math.abs(curr.concentration - currentResult) < Math.abs(prev.concentration - currentResult) ? curr : prev;
    });

    const chartConfig = {
      backgroundGradientFrom: Colors[colorScheme ?? 'light'].card,
      backgroundGradientTo: Colors[colorScheme ?? 'light'].card,
      color: (opacity = 1) => Colors[colorScheme ?? 'light'].tint,
      strokeWidth: 2,
      barPercentage: 0.5,
      useShadowColorFromDataset: false,
      decimalPlaces: 1,
      formatYLabel: (value: string) => `${parseFloat(value).toFixed(1)} mol/dm⁻³`,
      formatXLabel: (value: string) => {
        const index = parseInt(value);
        return focusedData[index]?.concentration.toFixed(1) || '';
      },
    };

    const data = {
      labels: focusedData.map((_, index) => index.toString()),
      datasets: [{
        data: focusedData.map(point => point.concentration),
        color: (opacity = 1) => Colors[colorScheme ?? 'light'].tint,
        strokeWidth: 2,
      }],
  };

  return (
      <View style={styles.chartContainer}>
        <Text style={[styles.chartTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
          Color vs Concentration
        </Text>
        <View style={styles.chartWrapper}>
      <LineChart
            data={data}
            width={width - 40}
        height={220}
            chartConfig={chartConfig}
        bezier
            style={styles.chart}
            withDots={true}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLines={false}
            withHorizontalLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            fromZero={true}
            segments={5}
            yAxisInterval={1}
          />
          <View style={[
            styles.resultMarker,
            {
              left: `${(currentResult / range) * 100}%`,
              backgroundColor: result.color?.hex || Colors[colorScheme ?? 'light'].tint
            }
          ]}>
            <View style={styles.resultMarkerLine} />
            <View style={styles.resultMarkerDot} />
            <Text style={styles.resultMarkerText}>{currentResult.toFixed(2)} mol/dm⁻³</Text>
          </View>
        </View>
        <View style={styles.colorGradientContainer}>
          <View style={styles.colorGradient}>
            {gradientColors.map((color, index) => (
              <View 
                key={index}
                style={[
                  styles.colorBar,
                  { 
                    backgroundColor: color,
                    width: `${100 / gradientColors.length}%`
                  }
                ]} 
              />
            ))}
          </View>
          <View style={styles.colorLabels}>
            {keyPoints.map((point, index) => (
              <Text 
                key={index}
                style={[
                  styles.colorLabel, 
                  { 
                    color: Colors[colorScheme ?? 'light'].text,
                    width: `${100 / keyPoints.length}%`,
                    textAlign: index === 0 ? 'left' : index === keyPoints.length - 1 ? 'right' : 'center'
                  }
                ]}
              >
                {point.toFixed(1)} mol/dm⁻³
              </Text>
            ))}
          </View>
        </View>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: result.color?.hex || Colors[colorScheme ?? 'light'].tint }]} />
            <Text style={[styles.legendText, { color: Colors[colorScheme ?? 'light'].text }]}>
              Current: {result.concentration.toFixed(2)} mol/dm⁻³
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#E5E7EB' }]} />
            <Text style={[styles.legendText, { color: Colors[colorScheme ?? 'light'].text }]}>
              Color Scale
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (!imageUri) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <LinearGradient
          colors={colorScheme === 'dark' ? ['#1E3A8A', '#1E40AF'] : ['#3B82F6', '#2563EB']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Analysis</Text>
            <Text style={styles.headerSubtitle}>No Image Selected</Text>
          </View>
        </LinearGradient>
        <View style={styles.noImageContainer}>
          <Ionicons name="image-outline" size={48} color={Colors[colorScheme ?? 'light'].text} />
          <Text style={[styles.noImageText, { color: Colors[colorScheme ?? 'light'].text }]}>
            Please capture an image first
          </Text>
        </View>
      </View>
    );
  }

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
            <Ionicons name="analytics" size={32} color="white" style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Analysis</Text>
          </View>
          <Text style={styles.headerSubtitle}>Ammonia concentration analysis results</Text>
        </View>
      </LinearGradient>
      {renderServerStatus()}

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={[styles.imageContainer, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.image} />
            )}
          </View>
        </View>

        {isAnalyzing ? (
          <View style={styles.section}>
            <View style={[styles.card, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
              <View style={styles.analyzingContainer}>
                <View style={styles.analyzingIconContainer}>
                  <Ionicons name="analytics" size={48} color={Colors[colorScheme ?? 'light'].tint} />
                  <View style={[styles.analyzingPulse, { borderColor: Colors[colorScheme ?? 'light'].tint }]} />
                </View>
                <Text style={[styles.analyzingText, { color: Colors[colorScheme ?? 'light'].text }]}>
                  Analyzing Test Sample...
                </Text>
                <Text style={[styles.analyzingSubtext, { color: Colors[colorScheme ?? 'light'].text }]}>
                  Processing image and calculating concentration
                </Text>
                <View style={styles.analyzingSteps}>
                  <View style={styles.analyzingStep}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors[colorScheme ?? 'light'].tint} />
                    <Text style={[styles.analyzingStepText, { color: Colors[colorScheme ?? 'light'].text }]}>
                      Image captured
                    </Text>
                  </View>
                  <View style={styles.analyzingStep}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors[colorScheme ?? 'light'].tint} />
                    <Text style={[styles.analyzingStepText, { color: Colors[colorScheme ?? 'light'].text }]}>
                      Color validated
                    </Text>
                  </View>
                  <View style={styles.analyzingStep}>
                    <ActivityIndicator size="small" color={Colors[colorScheme ?? 'light'].tint} />
                    <Text style={[styles.analyzingStepText, { color: Colors[colorScheme ?? 'light'].text }]}>
                      Calculating concentration
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>Sample Information</Text>
              <View style={[styles.card, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, { color: Colors[colorScheme ?? 'light'].text }]}>Sample ID</Text>
                    <Text style={[styles.infoValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                      {result.sampleInfo?.sampleId || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, { color: Colors[colorScheme ?? 'light'].text }]}>Location</Text>
                    <Text style={[styles.infoValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                      {result.sampleInfo?.location || 'N/A'}
                    </Text>
                  </View>
                  
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>Results</Text>
              <View style={[styles.card, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
                <View style={styles.resultItem}>
                  <View style={styles.resultIconContainer}>
                    <Ionicons name="flask" size={24} color="white" />
                  </View>
                  <View style={styles.resultContent}>
                    <Text style={[styles.resultLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                      Ammonia Concentration
                    </Text>
                    <View style={styles.resultValueContainer}>
                      <Text style={[styles.resultValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                        {result.concentration.toFixed(3)} mol/dm⁻³
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: getConcentrationStatus(result.concentration).color }]}>
                        <Text style={styles.statusText}>
                          {getConcentrationStatus(result.concentration).status}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.testResultInfo}>
                      <Text style={[styles.testResultLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                        Test Image: {result.sampleInfo?.method || 'N/A'}
                      </Text>
                      <Text style={[styles.testResultLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                        Test Time: {result.timestamp.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.resultItem}>
                  <View style={[styles.resultIconContainer, { backgroundColor: '#10B981' }]}>
                    <Ionicons name="checkmark" size={24} color="white" />
                  </View>
                  <View style={styles.resultContent}>
                    <Text style={[styles.resultLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                      Confidence Level
                    </Text>
                    <Text style={[styles.resultValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                      {(result.confidence * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {renderCalibrationChart()}

            <View style={styles.section}>
        <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
                onPress={handleSave}
              >
                <LinearGradient
                  colors={colorScheme === 'dark' ? ['#4F46E5', '#7C3AED'] : ['#3B82F6', '#2563EB']}
                  style={styles.saveButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="save" size={24} color="white" />
                  <Text style={styles.saveButtonText}>Save to History</Text>
                </LinearGradient>
        </TouchableOpacity>
      </View>
          </>
        )}
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
  chartLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: 'white',
  },
  chartDot: {
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
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: width * 0.8,
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
  analyzingContainer: {
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  analyzingIconContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingPulse: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 40,
    borderWidth: 2,
    opacity: 0.5,
    transform: [{ scale: 1.2 }],
  },
  analyzingText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  analyzingSubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  analyzingSteps: {
    width: '100%',
    marginTop: 16,
    gap: 12,
  },
  analyzingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 8,
  },
  analyzingStepText: {
    fontSize: 14,
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  resultIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContent: {
    flex: 1,
  },
  resultLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  resultValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  parameterGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  parameterItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  parameterLabel: {
    fontSize: 12,
    marginTop: 8,
  },
  parameterValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  chartContainer: {
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  qcGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  qcItem: {
    flex: 1,
    alignItems: 'center',
  },
  qcLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  qcValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoItem: {
    width: '48%',
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  noImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noImageText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  serverStatusContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  serverStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serverStatusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serverStatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  serverStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  testResultInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  testResultLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  colorGradientContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  colorGradient: {
    height: 24,
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  colorBar: {
    height: '100%',
  },
  colorLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  colorLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  chartWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  resultMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    alignItems: 'center',
    transform: [{ translateX: -1 }],
  },
  resultMarkerLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  resultMarkerDot: {
    position: 'absolute',
    top: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    transform: [{ translateY: -6 }],
  },
  resultMarkerText: {
    position: 'absolute',
    top: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: '600',
    transform: [{ translateX: 8 }],
  },
});