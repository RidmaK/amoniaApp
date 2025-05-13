import { Platform, Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useCameraPermissions } from 'expo-camera';

export type PermissionType = 'camera' | 'photos' | 'media' | 'location';

export const checkPermission = async (type: PermissionType): Promise<boolean> => {
  try {
    switch (type) {
      case 'camera':
        const [cameraPermission, requestCameraPermission] = useCameraPermissions();
        if (!cameraPermission?.granted) {
          const result = await requestCameraPermission();
          return result.granted;
        }
        return true;
      
      case 'photos':
        const photosStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        return photosStatus.status === 'granted';
      
      case 'media':
        const mediaStatus = await MediaLibrary.requestPermissionsAsync();
        return mediaStatus.status === 'granted';
      
      case 'location':
        if (Platform.OS === 'ios') {
          const locationStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
          return locationStatus.status === 'granted';
        }
        return true; // Android handles this differently
      
      default:
        return false;
    }
  } catch (error) {
    console.error(`Error checking ${type} permission:`, error);
    return false;
  }
};

export const requestPermission = async (type: PermissionType): Promise<boolean> => {
  try {
    const hasPermission = await checkPermission(type);
    
    if (hasPermission) {
      return true;
    }

    // If permission is not granted, show explanation and request again
    Alert.alert(
      'Permission Required',
      `This app needs ${type} permission to function properly. Please grant permission in settings.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          },
        },
      ]
    );

    return false;
  } catch (error) {
    console.error(`Error requesting ${type} permission:`, error);
    return false;
  }
};

export const checkAllPermissions = async (): Promise<boolean> => {
  const permissions = ['camera', 'photos', 'media', 'location'] as PermissionType[];
  const results = await Promise.all(permissions.map(checkPermission));
  return results.every(result => result === true);
};

export const requestAllPermissions = async (): Promise<boolean> => {
  const permissions = ['camera', 'photos', 'media', 'location'] as PermissionType[];
  const results = await Promise.all(permissions.map(requestPermission));
  return results.every(result => result === true);
}; 