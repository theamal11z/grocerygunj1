/*
  # Fix Order Status Update
  
  This migration adds:
  1. Order status update function
  2. RLS policies for order status updates
  3. Audit logging for order status changes
  4. Status change notifications
*/

-- Create enum for order status if it doesn't exist
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add status column to orders table if it doesn't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS status order_status DEFAULT 'pending';

-- Create function to update order status
CREATE OR REPLACE FUNCTION update_order_status(
  order_id uuid,
  new_status order_status
)
RETURNS orders AS $$
DECLARE
  updated_order orders;
BEGIN
  -- Update order status
  UPDATE orders
  SET 
    status = new_status,
    updated_at = now()
  WHERE id = order_id
  RETURNING * INTO updated_order;

  -- Log the status change in admin_audit_log
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
    'UPDATE',
    'orders',
    order_id,
    jsonb_build_object('status', updated_order.status),
    jsonb_build_object('status', new_status)
  );

  -- Create notification for the user
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type
  )
  SELECT 
    o.user_id,
    'Order Status Updated',
    'Your order #' || o.id || ' status has been updated to ' || new_status,
    'order'
  FROM orders o
  WHERE o.id = order_id;

  RETURN updated_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies for order status updates
DROP POLICY IF EXISTS "Admins can update order status" ON orders;
CREATE POLICY "Admins can update order status"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    is_admin(auth.uid())
  )
  WITH CHECK (
    is_admin(auth.uid())
  );

-- Create function to get order details with user info
CREATE OR REPLACE FUNCTION get_order_details(order_id uuid)
RETURNS jsonb AS $$
DECLARE
  order_details jsonb;
BEGIN
  SELECT jsonb_build_object(
    'order', row_to_json(o),
    'user', (
      SELECT jsonb_build_object(
        'id', p.id,
        'email', p.email,
        'full_name', p.full_name
      )
      FROM profiles p
      WHERE p.id = o.user_id
    ),
    'items', (
      SELECT jsonb_agg(jsonb_build_object(
        'id', oi.id,
        'product_id', oi.product_id,
        'quantity', oi.quantity,
        'price', oi.price,
        'product', (
          SELECT jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'image_url', p.image_url
          )
          FROM products p
          WHERE p.id = oi.product_id
        )
      ))
      FROM order_items oi
      WHERE oi.order_id = o.id
    )
  )
  FROM orders o
  WHERE o.id = order_id
  INTO order_details;
  
  RETURN order_details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get orders list with filters
CREATE OR REPLACE FUNCTION get_orders_list(
  status_filter order_status DEFAULT NULL,
  date_from timestamptz DEFAULT NULL,
  date_to timestamptz DEFAULT NULL,
  search_query text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  orders_list jsonb;
BEGIN
  SELECT jsonb_agg(jsonb_build_object(
    'order', row_to_json(o),
    'user', (
      SELECT jsonb_build_object(
        'id', p.id,
        'email', p.email,
        'full_name', p.full_name
      )
      FROM profiles p
      WHERE p.id = o.user_id
    ),
    'items_count', (
      SELECT COUNT(*)
      FROM order_items oi
      WHERE oi.order_id = o.id
    )
  ))
  FROM orders o
  WHERE 
    (status_filter IS NULL OR o.status = status_filter)
    AND (date_from IS NULL OR o.created_at >= date_from)
    AND (date_to IS NULL OR o.created_at <= date_to)
    AND (
      search_query IS NULL 
      OR o.id::text ILIKE '%' || search_query || '%'
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = o.user_id
        AND (
          p.email ILIKE '%' || search_query || '%'
          OR p.full_name ILIKE '%' || search_query || '%'
        )
      )
    )
  ORDER BY o.created_at DESC
  INTO orders_list;
  
  RETURN orders_list;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_order_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_order_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_orders_list TO authenticated; 