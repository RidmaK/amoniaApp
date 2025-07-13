import { Platform } from 'react-native';

export const adjustImageBrightnessContrast = async (
  imageUri: string,
  brightness: number = 1.2,
  contrast: number = 1.3
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Adjust brightness and contrast
      for (let i = 0; i < data.length; i += 4) {
        // Apply brightness
        data[i] *= brightness;     // R
        data[i + 1] *= brightness; // G
        data[i + 2] *= brightness; // B

        // Apply contrast
        for (let j = 0; j < 3; j++) {
          const channel = i + j;
          data[channel] = ((data[channel] - 128) * contrast) + 128;
          // Clamp values
          data[channel] = Math.max(0, Math.min(255, data[channel]));
        }
      }

      // Put the modified image data back
      ctx.putImageData(imageData, 0, 0);

      // Convert to base64
      const processedImageUri = canvas.toDataURL('image/jpeg', 0.9);
      resolve(processedImageUri);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageUri;
  });
};

export const processImage = async (
  imageUri: string,
  options = { brightness: 1.2, contrast: 1.3 }
): Promise<string> => {
  if (Platform.OS === 'web') {
    // Use Canvas approach for web
    return await adjustImageBrightnessContrast(
      imageUri,
      options.brightness,
      options.contrast
    );
  } else {
    // For mobile, use server-side processing
    const formData = new FormData();
    const imageUriWithPrefix = Platform.OS === 'android' && !imageUri.startsWith('file://')
      ? `file://${imageUri}`
      : imageUri;

    formData.append('file', {
      uri: imageUriWithPrefix,
      type: 'image/jpeg',
      name: 'image.jpg',
    } as any);

    formData.append('brightness', options.brightness.toString());
    formData.append('contrast', options.contrast.toString());

    const response = await fetch('https://helpdesk.xessglobal.net/api/process-image', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to process image on server');
    }

    const processedData = await response.json();
    return processedData.imageUri;
  }
}; 