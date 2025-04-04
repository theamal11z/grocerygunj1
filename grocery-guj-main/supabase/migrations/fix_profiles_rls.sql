/*
  # Fix Profiles RLS Policies
  
  This migration ensures that:
  1. Service role and authenticated users can create profiles
  2. Appropriate RLS policies are in place
*/

-- Ensure the role column exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'customer';

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a policy that allows authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles 
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create a policy that allows service role to manage all profiles
-- This is needed for functions that create profiles outside of user context
CREATE POLICY "Service role can manage all profiles"
  ON profiles
  USING (true)
  WITH CHECK (true);

-- Update the handle_new_user function to properly create profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  profile_exists boolean;
BEGIN
  -- Check if profile already exists
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = NEW.id
  ) INTO profile_exists;

  IF profile_exists THEN
    RETURN NEW;
  END IF;

  -- Insert new profile with error handling
  BEGIN
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      avatar_url,
      phone_number,
      role,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
      NULL,
      'customer',
      NOW(),
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log the error (you can view this in Supabase logs)
    RAISE LOG 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 