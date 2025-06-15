import React from "react";
import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  Text,
  Modal,
  Animated,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useState, useRef } from "react";
import * as Linking from "expo-linking";
import { BlurView } from "expo-blur";

export default function TabLayout() {
  const colorScheme = useColorScheme() as "light" | "dark" | null;
  const [isCapturing, setIsCapturing] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [alertData, setAlertData] = useState<{
    title: string;
    message: string;
    onProceed: () => void;
  } | null>(null);

  const CustomAlert = () => {
    if (!showCustomAlert || !alertData) return null;

    return (
      <View style={styles.alertOverlay}>
        <BlurView intensity={20} style={styles.alertBlur} />
        <View
          style={[
            styles.alertContainer,
            { backgroundColor: Colors[colorScheme ?? "light"].card },
          ]}
        >
          <View style={styles.alertIconContainer}>
            <Ionicons
              name={
                alertData.title.includes("concentrated")
                  ? "warning"
                  : "information-circle"
              }
              size={48}
              color={Colors[colorScheme ?? "light"].tint}
            />
          </View>
          <Text
            style={[
              styles.alertTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            {alertData.title}
          </Text>
          <Text
            style={[
              styles.alertMessage,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            {alertData.message}
          </Text>
          <TouchableOpacity
            style={[styles.alertButton, styles.alertButtonCancel]}
            onPress={() => {
              setShowCustomAlert(false);
            }}
          >
            <Text
              style={[
                styles.alertButtonText,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              OK
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const CaptureDrawer = () => {
    if (!showDrawer) return null;

    return (
      <Modal
        visible={showDrawer}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDrawer(false)}
      >
        <TouchableOpacity
          style={styles.drawerOverlay}
          activeOpacity={1}
          onPress={() => setShowDrawer(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={[
                styles.drawer,
                { backgroundColor: Colors[colorScheme ?? "light"].background },
              ]}
            >
              <View style={styles.drawerHandle} />

              <View style={styles.drawerContent}>
                {/* Take Photo Button */}
                <TouchableOpacity
                  style={[
                    styles.drawerButton,
                    { backgroundColor: Colors[colorScheme ?? "light"].tint },
                  ]}
                  onPress={() => {
                    setShowDrawer(false);
                    handleCapture();
                  }}
                  disabled={isCapturing}
                >
                  <View style={styles.drawerButtonIcon}>
                    {isCapturing ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Ionicons name="camera" size={24} color="white" />
                    )}
                  </View>
                  <Text style={styles.drawerButtonText}>Take Photo</Text>
                </TouchableOpacity>

                {/* Choose from Gallery Button */}
                <TouchableOpacity
                  style={[
                    styles.drawerButton,
                    styles.drawerButtonSecondary,
                    {
                      backgroundColor: Colors[colorScheme ?? "light"].card,
                      borderColor: Colors[colorScheme ?? "light"].tint + "20",
                    },
                  ]}
                  onPress={() => {
                    setShowDrawer(false);
                    handleGalleryPick();
                  }}
                  disabled={isCapturing}
                >
                  <View
                    style={[
                      styles.drawerButtonIcon,
                      {
                        backgroundColor:
                          Colors[colorScheme ?? "light"].tint + "15",
                      },
                    ]}
                  >
                    {isCapturing ? (
                      <ActivityIndicator
                        color={Colors[colorScheme ?? "light"].tint}
                        size="small"
                      />
                    ) : (
                      <Ionicons
                        name="images"
                        size={24}
                        color={Colors[colorScheme ?? "light"].tint}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.drawerButtonText,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    Choose from Gallery
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  const validateColor = async (imageUri: string) => {
    try {
      let formData;

      if (Platform.OS === "web") {
        const imageResponse = await fetch(imageUri);
        const blob = await imageResponse.blob();
        formData = new FormData();
        const file = new File([blob], "image.jpg", { type: "image/jpeg" });
        formData.append("file", file);
      } else {
        formData = new FormData();
        if (Platform.OS === "android") {
          const imageUriWithPrefix = imageUri.startsWith("file://")
            ? imageUri
            : `file://${imageUri}`;
          formData.append("file", {
            uri: imageUriWithPrefix,
            type: "image/jpeg",
            name: "image.jpg",
          } as any);
        } else {
          formData.append("file", {
            uri: imageUri,
            type: "image/jpeg",
            name: "image.jpg",
          } as any);
        }
      }

      const response = await fetch(
        "https://test3.xessglobal.net/validate-color",
        {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
            ...(Platform.OS === "web"
              ? {}
              : { "Content-Type": "multipart/form-data" }),
          },
        }
      );

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error validating color:", error);
      throw error;
    }
  };

  const handleCapture = async () => {
    if (isCapturing) return;

    try {
      setIsCapturing(true);

      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Camera permission is required to take photos."
        );
        return;
      }

      // Add a small delay to ensure camera is ready
      await new Promise((resolve) => setTimeout(resolve, 500));

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
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log("Image captured:", imageUri);

        // Add a small delay before validation
        await new Promise((resolve) => setTimeout(resolve, 200));

        try {
          // Validate color before proceeding
          const validationResult = await validateColor(imageUri);

          if (validationResult.status === "error") {
            setAlertData({
              title: validationResult.message,
              message: validationResult.action,
              onProceed: () => {
                setTimeout(() => {
                  router.push({
                    pathname: "/(tabs)/analysis",
                    params: {
                      imageUri,
                      timestamp: new Date().getTime(),
                      isNewCapture: "true",
                    },
                  });
                }, 500);
              },
            });
            setShowCustomAlert(true);
          } else {
            // Color is valid, proceed to analysis
            setTimeout(() => {
              router.push({
                pathname: "/(tabs)/analysis",
                params: {
                  imageUri,
                  timestamp: new Date().getTime(),
                  isNewCapture: "true",
                },
              });
            }, 500);
          }
        } catch (validationError) {
          console.error("Validation error:", validationError);
          Alert.alert(
            "Error",
            "Failed to validate the image. Please try again.",
            [{ text: "OK" }]
          );
        }
      }
    } catch (error) {
      console.error("Error capturing image:", error);
      Alert.alert("Error", "Failed to capture image. Please try again.", [
        { text: "OK" },
      ]);
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
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Photo library permission is required to select images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log("Image selected from gallery:", imageUri);

        // Validate color before proceeding
        const validationResult = await validateColor(imageUri);

        if (validationResult.status === "error") {
          setAlertData({
            title: validationResult.message,
            message: validationResult.action,
            onProceed: () => {
              setTimeout(() => {
                router.push({
                  pathname: "/(tabs)/analysis",
                  params: {
                    imageUri,
                    timestamp: new Date().getTime(),
                    isNewCapture: "true",
                  },
                });
              }, 500);
            },
          });
          setShowCustomAlert(true);
        } else {
          // Color is valid, proceed to analysis
          setTimeout(() => {
            router.push({
              pathname: "/(tabs)/analysis",
              params: {
                imageUri,
                timestamp: new Date().getTime(),
                isNewCapture: "true",
              },
            });
          }, 500);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert(
        "Error",
        "Failed to pick image from gallery. Please try again."
      );
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          tabBarInactiveTintColor:
            Colors[colorScheme ?? "light"].tabIconDefault,
          tabBarStyle: {
            backgroundColor: Colors[colorScheme ?? "light"].background,
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
            height: 60,
            paddingBottom: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <Ionicons name="home" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="analysis"
          options={{
            title: "Results",
            tabBarIcon: ({ color }) => (
              <Ionicons name="analytics" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="capture"
          options={{
            title: "Capture",
            tabBarIcon: ({ color }) => (
              <View style={styles.captureButtonContainer}>
                <TouchableOpacity
                  style={[
                    styles.captureButton,
                    { backgroundColor: Colors[colorScheme ?? "light"].tint },
                  ]}
                  onPress={() => {
                    setShowDrawer(true);
                  }}
                  disabled={isCapturing}
                >
                  {isCapturing ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Ionicons name="camera" size={24} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            ),
          }}
          listeners={{
            tabPress: (e) => {
              // Prevent default navigation
              e.preventDefault();
              // Open the drawer instead
              setShowDrawer(true);
            },
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            tabBarIcon: ({ color }) => (
              <Ionicons name="time" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color }) => (
              <Ionicons name="settings" size={24} color={color} />
            ),
          }}
        />
      </Tabs>
      <CustomAlert />
      <CaptureDrawer />
    </>
  );
}

const styles = StyleSheet.create({
  captureButtonContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 20 : 10,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  alertOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  alertBlur: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  alertContainer: {
    width: "85%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
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
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  alertMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  alertButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  alertButtonCancel: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  alertButtonProceed: {
    backgroundColor: "#3B82F6",
  },
  alertButtonTextProceed: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  drawer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    shadowColor: "#000",
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
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  drawerContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  drawerButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },
  drawerButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  drawerButtonSecondary: {
    borderWidth: 1,
  },
  drawerButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
});
