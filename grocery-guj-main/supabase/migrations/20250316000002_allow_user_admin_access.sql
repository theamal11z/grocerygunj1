/*
  # Allow User Admin Access
  
  This migration modifies RLS policies to allow any authenticated user to perform admin actions.
  This is for development and testing purposes only!
*/

-- 1. Update order status RLS policy to allow any authenticated user
DROP POLICY IF EXISTS "Admins can update order status" ON orders;
CREATE POLICY "Any user can update order status"
  ON orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. Create a function to override is_admin check
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Always return true to grant admin access to any authenticated user
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Enable general UPDATE permissions on all relevant tables

-- Products table policies
DROP POLICY IF EXISTS "Admins can update products" ON products;
CREATE POLICY "Any user can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Categories table policies
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
CREATE POLICY "Any user can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Orders table policies (for operations besides status update)
DROP POLICY IF EXISTS "Admins can manage orders" ON orders;
CREATE POLICY "Any user can manage orders"
  ON orders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert policies
DROP POLICY IF EXISTS "Admins can insert products" ON products;
CREATE POLICY "Any user can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
CREATE POLICY "Any user can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Delete policies
DROP POLICY IF EXISTS "Admins can delete products" ON products;
CREATE POLICY "Any user can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can delete categories" ON categories;
CREATE POLICY "Any user can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (true);

-- Grant extra permissions to authenticated role
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Add a warning comment
COMMENT ON FUNCTION is_admin(uuid) IS 'WARNING: This function has been modified to grant admin access to all authenticated users. For development purposes only.'; 