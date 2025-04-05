-- Enhance the offers table and functionality

-- Add new columns to offers table for better coupon management
ALTER TABLE offers 
  ADD COLUMN IF NOT EXISTS min_purchase_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_discount_amount numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS usage_limit integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS used_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coupon_type text DEFAULT 'percent' CHECK (coupon_type IN ('percent', 'fixed')),
  ADD COLUMN IF NOT EXISTS applicable_products uuid[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS applicable_categories uuid[] DEFAULT NULL;

-- Add foreign key reference from orders to offers for better tracking
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS applied_offer_code text DEFAULT NULL;

-- Add a function to parse discount from string to proper numeric value
CREATE OR REPLACE FUNCTION get_discount_value(discount_str text) 
RETURNS numeric AS $$
DECLARE
  percent_match text;
  amount_match text;
BEGIN
  -- Extract percent value (e.g., "20% OFF" -> 20)
  percent_match := regexp_replace(discount_str, '.*?(\d+)%.*', '\1', 'g');
  
  IF percent_match ~ '^\d+$' THEN
    RETURN percent_match::numeric;
  END IF;
  
  -- Extract currency amount (e.g., "₹50 OFF" -> 50)
  amount_match := regexp_replace(discount_str, '.*?₹(\d+).*', '\1', 'g');
  
  IF amount_match ~ '^\d+$' THEN
    RETURN amount_match::numeric;
  END IF;
  
  -- Default fallback
  RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Create a view for active offers
CREATE OR REPLACE VIEW active_offers AS
SELECT 
  id,
  title,
  code,
  discount,
  description,
  valid_until,
  image_url,
  created_at,
  min_purchase_amount,
  max_discount_amount,
  usage_limit,
  used_count,
  coupon_type,
  applicable_products,
  applicable_categories
FROM offers
WHERE valid_until > NOW()
AND (usage_limit IS NULL OR used_count < usage_limit);

-- Create trigger to update offer usage count when applied in an order
CREATE OR REPLACE FUNCTION update_offer_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- If an offer code was applied
  IF NEW.applied_coupon_id IS NOT NULL AND (OLD.applied_coupon_id IS NULL OR OLD.applied_coupon_id != NEW.applied_coupon_id) THEN
    -- Get the code for the applied offer
    SELECT code INTO NEW.applied_offer_code 
    FROM offers 
    WHERE id = NEW.applied_coupon_id;
    
    -- Increment the usage count
    UPDATE offers 
    SET used_count = used_count + 1 
    WHERE id = NEW.applied_coupon_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_order_offer_applied ON orders;

-- Create the trigger
CREATE TRIGGER on_order_offer_applied
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_offer_usage();

-- Add some enhanced sample offers if they don't exist
INSERT INTO offers (
  title, 
  code, 
  discount, 
  description, 
  valid_until, 
  image_url, 
  min_purchase_amount,
  max_discount_amount,
  coupon_type
)
VALUES 
  (
    'First Order Special',
    'FIRST50',
    '50% OFF',
    'Get 50% off on your first order up to ₹200',
    now() + interval '60 days',
    'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop',
    500, -- Minimum purchase amount
    200, -- Maximum discount
    'percent' -- Discount type
  ),
  (
    'Big Savings',
    'SAVE100',
    '₹100 OFF',
    'Flat ₹100 off on purchases above ₹1000',
    now() + interval '30 days',
    'https://images.unsplash.com/photo-1534531173927-aeb928d54385?q=80&w=2070&auto=format&fit=crop',
    1000, -- Minimum purchase amount
    100, -- Maximum discount
    'fixed' -- Discount type
  ),
  (
    'Weekend Deal',
    'WKND15',
    '15% OFF',
    'Get 15% off on all your weekend shopping',
    now() + interval '14 days',
    'https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=2070&auto=format&fit=crop',
    0, -- No minimum purchase amount
    500, -- Maximum discount
    'percent' -- Discount type
  )
ON CONFLICT (code) DO NOTHING;

-- Create index for faster offer lookup by code
CREATE INDEX IF NOT EXISTS idx_offers_code_lookup ON offers(code);

-- Create index for faster active offer lookup - using a regular index without the NOW() function
-- Removing the WHERE clause that used NOW() which caused the IMMUTABLE error
CREATE INDEX IF NOT EXISTS idx_offers_validity ON offers(valid_until); 