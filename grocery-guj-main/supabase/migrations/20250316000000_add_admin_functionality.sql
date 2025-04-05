/*
  # Add Admin Functionality
  
  This migration adds:
  1. Admin role and permissions
  2. Admin-specific tables and relationships
  3. RLS policies for admin access
  4. Functions for admin operations
*/

-- Create admin role if it doesn't exist
DO $$ BEGIN
  CREATE ROLE admin;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create admin_users table to track admin users
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin_users
CREATE POLICY "Admin users can view all admin users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Admin users can update their own profile"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin_audit_log table for tracking admin actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on admin_audit_log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for admin_audit_log
CREATE POLICY "Only admins can view audit log"
  ON admin_audit_log FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
  IF is_admin(auth.uid()) THEN
    INSERT INTO admin_audit_log (
      admin_id,
      action,
      table_name,
      record_id,
      old_data,
      new_data
    )
    VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for admin actions on key tables
DO $$ BEGIN
  -- Products table
  DROP TRIGGER IF EXISTS log_product_changes ON products;
  CREATE TRIGGER log_product_changes
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW
    EXECUTE FUNCTION log_admin_action();

  -- Categories table
  DROP TRIGGER IF EXISTS log_category_changes ON categories;
  CREATE TRIGGER log_category_changes
    AFTER INSERT OR UPDATE OR DELETE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION log_admin_action();

  -- Orders table
  DROP TRIGGER IF EXISTS log_order_changes ON orders;
  CREATE TRIGGER log_order_changes
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION log_admin_action();

  -- Users table
  DROP TRIGGER IF EXISTS log_user_changes ON profiles;
  CREATE TRIGGER log_user_changes
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION log_admin_action();
END $$;

-- Create function to get admin dashboard stats
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS jsonb AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'total_orders', (SELECT COUNT(*) FROM orders),
    'total_products', (SELECT COUNT(*) FROM products),
    'total_categories', (SELECT COUNT(*) FROM categories),
    'recent_orders', (
      SELECT jsonb_agg(jsonb_build_object(
        'id', id,
        'user_id', user_id,
        'total_amount', total_amount,
        'status', status,
        'created_at', created_at
      ))
      FROM orders
      ORDER BY created_at DESC
      LIMIT 5
    ),
    'recent_users', (
      SELECT jsonb_agg(jsonb_build_object(
        'id', id,
        'email', email,
        'full_name', full_name,
        'created_at', created_at
      ))
      FROM profiles
      ORDER BY created_at DESC
      LIMIT 5
    )
  ) INTO stats;
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO admin;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO admin; 