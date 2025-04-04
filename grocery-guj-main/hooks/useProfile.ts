import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Pick<Profile, 'full_name' | 'phone_number' | 'avatar_url' | 'email'>;

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not found');
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        // If profile doesn't exist, create it
        if (profileError.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              avatar_url: null,
              full_name: null,
              phone_number: null,
            })
            .select()
            .single();

          if (createError) throw createError;
          setProfile(newProfile);
          return;
        }
        throw profileError;
      }

      setProfile(data);
      setError(null);
    } catch (err) {
      
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<ProfileUpdate>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not found');
      }

      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        // Create profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            ...updates,
          })
          .select()
          .single();

        if (createError) throw createError;
        setProfile(newProfile);
        return newProfile;
      }

      // Update existing profile
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        
        throw updateError;
      }

      if (!data) {
        throw new Error('No data returned from profile update');
      }

      setProfile(data);
      setError(null);
      
      return data;
    } catch (err) {
      
      throw err instanceof Error ? err : new Error('Failed to update profile');
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile: fetchProfile,
  };
}