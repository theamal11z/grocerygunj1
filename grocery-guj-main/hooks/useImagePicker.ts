import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Platform } from 'react-native';

export function useImagePicker() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const requestPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Sorry, we need camera roll permissions to make this work!');
      }
    }
  };

  const pickImage = async () => {
    try {
      setLoading(true);
      setError(null);

      await requestPermission();

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        if (!result.assets[0].base64) {
          throw new Error('No base64 data received from image picker');
        }
        
        return {
          uri: result.assets[0].uri,
          base64: result.assets[0].base64,
        };
      }
      
      return null;
    } catch (err) {
      
      setError(err instanceof Error ? err : new Error('Failed to pick image'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    pickImage,
    loading,
    error,
  };
} 