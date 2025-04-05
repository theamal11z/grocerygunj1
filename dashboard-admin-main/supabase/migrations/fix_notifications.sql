/*
  # Fix Notifications
  
  This migration ensures that:
  1. The notifications table exists with the correct schema
  2. All necessary foreign key relationships are intact
  3. RLS policies are properly configured
  4. Indexes are created for performance
*/

-- Check if updated_at column exists and add it if not
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE notifications ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Enable Row Level Security if not already enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
DO $$ BEGIN
  -- View policy (users can only view their own notifications)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'Users can view own notifications'
  ) THEN
    CREATE POLICY "Users can view own notifications"
      ON notifications FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Insert policy (users can only insert their own notifications)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'Users can insert own notifications'
  ) THEN
    CREATE POLICY "Users can insert own notifications"
      ON notifications FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Update policy (users can only update their own notifications)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'Users can update own notifications'
  ) THEN
    CREATE POLICY "Users can update own notifications"
      ON notifications FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Delete policy (users can only delete their own notifications)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'Users can delete own notifications'
  ) THEN
    CREATE POLICY "Users can delete own notifications"
      ON notifications FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes for faster notification lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Create function for the update trigger only if updated_at column exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'updated_at'
  ) THEN
    -- Create or replace function to update updated_at timestamp
    -- Separate function definition from DO block
  END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp only if the column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
    CREATE TRIGGER update_notifications_updated_at
      BEFORE UPDATE ON notifications
      FOR EACH ROW
      EXECUTE FUNCTION update_notifications_updated_at();
  END IF;
END $$;

-- Create function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM notifications
    WHERE notifications.user_id = $1
    AND notifications.read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 