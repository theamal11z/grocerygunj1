-- Add the missing column for offers in orders table

-- First, check if the column already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'applied_coupon_id'
    ) THEN
        -- Add the applied_coupon_id column to the orders table
        ALTER TABLE orders ADD COLUMN applied_coupon_id uuid REFERENCES offers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Update the trigger function to handle the bidirectional relationship
CREATE OR REPLACE FUNCTION update_offer_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- If an offer code was applied
  IF NEW.applied_coupon_id IS NOT NULL AND (OLD IS NULL OR OLD.applied_coupon_id IS NULL OR OLD.applied_coupon_id != NEW.applied_coupon_id) THEN
    -- Get the code for the applied offer
    SELECT code INTO NEW.applied_offer_code 
    FROM offers 
    WHERE id = NEW.applied_coupon_id;
    
    -- Increment the usage count
    UPDATE offers 
    SET used_count = COALESCE(used_count, 0) + 1 
    WHERE id = NEW.applied_coupon_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Make sure the trigger is properly created
DROP TRIGGER IF EXISTS on_order_offer_applied ON orders;

CREATE TRIGGER on_order_offer_applied
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_offer_usage();

-- Add discount_amount column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'discount_amount'
    ) THEN
        -- Add the discount_amount column to the orders table with a default of 0
        ALTER TABLE orders ADD COLUMN discount_amount numeric DEFAULT 0;
    END IF;

    -- Also ensure sub_total column exists
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'sub_total'
    ) THEN
        -- Add the sub_total column to the orders table
        ALTER TABLE orders ADD COLUMN sub_total numeric DEFAULT 0;
    END IF;
END $$;

-- Check if applied_coupon_id column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'orders'
                 AND column_name = 'applied_coupon_id') THEN
    ALTER TABLE public.orders
    ADD COLUMN applied_coupon_id UUID REFERENCES public.offers(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Added applied_coupon_id column to orders table';
  ELSE
    RAISE NOTICE 'applied_coupon_id column already exists in orders table';
    
    -- Ensure the foreign key constraint exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_catalog = kcu.constraint_catalog 
        AND tc.constraint_schema = kcu.constraint_schema
        AND tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = 'orders'
      AND kcu.column_name = 'applied_coupon_id'
    ) THEN
      -- Add foreign key if it doesn't exist
      ALTER TABLE public.orders
      ADD CONSTRAINT orders_applied_coupon_id_fkey 
      FOREIGN KEY (applied_coupon_id) REFERENCES public.offers(id) ON DELETE SET NULL;
      
      RAISE NOTICE 'Added foreign key constraint for applied_coupon_id column';
    ELSE
      RAISE NOTICE 'Foreign key constraint for applied_coupon_id column already exists';
    END IF;
  END IF;
  
  -- Check if discount_amount column exists, if not add it
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'orders'
                 AND column_name = 'discount_amount') THEN
    ALTER TABLE public.orders
    ADD COLUMN discount_amount NUMERIC(10,2) DEFAULT 0;
    
    RAISE NOTICE 'Added discount_amount column to orders table';
  ELSE
    RAISE NOTICE 'discount_amount column already exists in orders table';
  END IF;
END $$;

-- Update or create the handle_new_order trigger function to include coupon handling
CREATE OR REPLACE FUNCTION public.handle_new_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment used_count for the coupon if applied
  IF NEW.applied_coupon_id IS NOT NULL THEN
    UPDATE public.offers
    SET used_count = COALESCE(used_count, 0) + 1
    WHERE id = NEW.applied_coupon_id;
  END IF;
  
  -- When changing an order status to 'cancelled', decrement the coupon usage
  IF TG_OP = 'UPDATE' AND OLD.status != 'cancelled' AND NEW.status = 'cancelled' AND NEW.applied_coupon_id IS NOT NULL THEN
    UPDATE public.offers
    SET used_count = GREATEST(COALESCE(used_count, 0) - 1, 0)
    WHERE id = NEW.applied_coupon_id;
  END IF;
  
  -- You can add more logic here as needed for order processing
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_order_change' 
    AND tgrelid = 'public.orders'::regclass
  ) THEN
    CREATE TRIGGER on_order_change
    AFTER INSERT OR UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_order();
    
    RAISE NOTICE 'Created on_order_change trigger on orders table';
  ELSE
    RAISE NOTICE 'on_order_change trigger already exists on orders table';
  END IF;
END $$; 