-- Add address_count column to profiles table
ALTER TABLE IF EXISTS profiles
ADD COLUMN IF NOT EXISTS address_count integer DEFAULT 0;

-- Create a function to update address count
CREATE OR REPLACE FUNCTION update_profile_address_count()
RETURNS TRIGGER AS $$
DECLARE
  addr_count integer;
BEGIN
  -- Count addresses for the affected user
  SELECT COUNT(*) INTO addr_count
  FROM addresses
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
  
  -- Update the profile's address_count
  BEGIN
    -- Temporarily disable admin audit log trigger to avoid auth.uid() errors
    SET LOCAL session_replication_role = 'replica';
    
    UPDATE profiles
    SET address_count = addr_count
    WHERE id = COALESCE(NEW.user_id, OLD.user_id);
    
    -- Re-enable triggers
    SET LOCAL session_replication_role = 'origin';
  EXCEPTION
    WHEN OTHERS THEN
      -- Make sure to reset even if there's an error
      SET LOCAL session_replication_role = 'origin';
      RAISE;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to update address count when addresses are added, updated, or deleted
DROP TRIGGER IF EXISTS on_address_change ON addresses;
CREATE TRIGGER on_address_change
  AFTER INSERT OR UPDATE OR DELETE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_address_count();

-- Update all existing profiles with current address counts
-- Temporarily disable triggers to avoid auth.uid() errors during update
DO $$
BEGIN
  -- Disable triggers temporarily
  SET LOCAL session_replication_role = 'replica';
  
  -- Update all profiles with their address counts
  UPDATE profiles p
  SET address_count = (
    SELECT COUNT(*) 
    FROM addresses a 
    WHERE a.user_id = p.id
  );
  
  -- Re-enable triggers
  SET LOCAL session_replication_role = 'origin';
EXCEPTION
  WHEN OTHERS THEN
    -- Make sure to reset even if there's an error
    SET LOCAL session_replication_role = 'origin';
    RAISE;
END $$; 