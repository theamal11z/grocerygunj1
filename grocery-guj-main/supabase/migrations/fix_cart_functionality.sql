/*
  # Fix Cart Functionality
  
  This migration ensures that:
  1. The cart_items table exists with the correct schema
  2. All necessary foreign key relationships are intact
  3. RLS policies are properly configured
  4. Indexes are created for performance
*/

-- Ensure cart_items table exists with proper schema
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable Row Level Security if not already enabled
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cart_items
DO $$ BEGIN
  -- View policy (users can only view their own cart items)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cart_items' 
    AND policyname = 'Users can view own cart items'
  ) THEN
    CREATE POLICY "Users can view own cart items"
      ON cart_items FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Insert policy (users can only add items to their own cart)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cart_items' 
    AND policyname = 'Users can add items to own cart'
  ) THEN
    CREATE POLICY "Users can add items to own cart"
      ON cart_items FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Update policy (users can only update their own cart items)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cart_items' 
    AND policyname = 'Users can update own cart items'
  ) THEN
    CREATE POLICY "Users can update own cart items"
      ON cart_items FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Delete policy (users can only delete their own cart items)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cart_items' 
    AND policyname = 'Users can delete own cart items'
  ) THEN
    CREATE POLICY "Users can delete own cart items"
      ON cart_items FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create index for faster cart item lookups if they don't exist
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cart_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if trigger exists before creating it
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_cart_items_updated_at'
    AND tgrelid = 'cart_items'::regclass
  ) THEN
    CREATE TRIGGER update_cart_items_updated_at
      BEFORE UPDATE ON cart_items
      FOR EACH ROW
      EXECUTE FUNCTION update_cart_items_updated_at();
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    -- If cart_items doesn't exist yet, we'll create the trigger after the table is created
    NULL;
END $$;

-- Create or replace the trigger anyway (in case the check fails but the table exists)
DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_cart_items_updated_at(); 