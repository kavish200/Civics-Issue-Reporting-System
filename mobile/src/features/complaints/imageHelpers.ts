import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

export async function pickImageFromGallery() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 1,
  });

  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }
  return null;
}

export async function takePhotoWithCamera() {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 1,
  });

  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }
  return null;
}

export async function compressAndResizeImage(uri: string): Promise<string> {
  try {
    // Get original image dimensions
    const imageInfo = await ImageManipulator.manipulateAsync(uri, []);

    // Calculate new dimensions (max 1280px on longest side)
    let newWidth = imageInfo.width;
    let newHeight = imageInfo.height;

    if (newWidth > 1280 || newHeight > 1280) {
      const maxDimension = 1280;
      const ratio = imageInfo.width / imageInfo.height;

      if (newWidth > newHeight) {
        newWidth = maxDimension;
        newHeight = Math.round(maxDimension / ratio);
      } else {
        newHeight = maxDimension;
        newWidth = Math.round(maxDimension * ratio);
      }
    }

    // Resize and compress
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: newWidth, height: newHeight } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    return result.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
}

export function bytesToMB(bytes: number): number {
  return bytes / (1024 * 1024);
}