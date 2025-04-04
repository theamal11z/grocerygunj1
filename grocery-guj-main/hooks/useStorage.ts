import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';

export function useStorage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const uploadAvatar = async (base64Image: string, userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Remove data URL prefix if present
      const base64Data = base64Image.includes('base64,') 
        ? base64Image.split('base64,')[1]
        : base64Image;

      // Create user-specific folder and filename
      const userFolder = userId;
      const fileName = `${userFolder}/avatar.jpg`;

      // Upload the new avatar
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, decode(base64Data), {
          contentType: 'image/jpeg',
          upsert: true // Use upsert to replace existing file
        });

      if (uploadError) {
        
        throw uploadError;
      }

      if (!data) {
        throw new Error('Upload failed - no data returned');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add cache-busting parameter to force refresh
      const cacheBuster = `?t=${Date.now()}`;
      return `${publicUrl}${cacheBuster}`;

    } catch (err) {
      
      setError(err instanceof Error ? err : new Error('Failed to upload avatar'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    uploadAvatar,
    loading,
    error,
  };
} 