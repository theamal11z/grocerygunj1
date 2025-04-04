import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { AuthError, User } from '@supabase/supabase-js';
import { router } from 'expo-router';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: AuthError | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, options?: { data?: { full_name?: string } }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.replace('/(tabs)');
    } catch (err) {
      setError(err as AuthError);
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    options?: { 
      data?: { 
        full_name?: string;
      } 
    }
  ) => {
    try {
      setError(null);
      
      // Sign up the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: options?.data?.full_name || null,
          },
        },
      });

      if (signUpError) {
        
        throw signUpError;
      }

      if (!signUpData.user) {
        throw new Error('No user data returned from signup');
      }
      
      // Check if email confirmation is required
      if (!signUpData.session) {
        // Redirect to email verification page
        router.push('/verify-email');
        return;
      }
      
      // If we have a session (email confirmation not required), proceed normally
      router.replace('/(tabs)');
    } catch (err) {
      
      setError(err as AuthError);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/auth');
    } catch (err) {
      setError(err as AuthError);
    }
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 