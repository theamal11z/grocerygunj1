-- Migration to add user-coupon usage tracking
-- This ensures each user can only use a specific coupon once

-- Create the user_coupon_usage table to track which users have used which coupons
CREATE TABLE IF NOT EXISTS public.user_coupon_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
    used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    UNIQUE(user_id, offer_id)
);

-- Add appropriate indexes
CREATE INDEX IF NOT EXISTS idx_user_coupon_usage_user_id ON public.user_coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupon_usage_offer_id ON public.user_coupon_usage(offer_id);

-- Create function to check if a user has already used a coupon
CREATE OR REPLACE FUNCTION public.has_user_used_coupon(p_user_id UUID, p_offer_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_coupon_usage
        WHERE user_id = p_user_id AND offer_id = p_offer_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Modify the handle_new_order trigger function to also record user-coupon usage
CREATE OR REPLACE FUNCTION public.handle_new_order()
RETURNS TRIGGER AS $$
BEGIN
    -- For new orders with a coupon, increment the used_count
    IF NEW.applied_coupon_id IS NOT NULL THEN
        -- Record the user's usage of this coupon
        INSERT INTO public.user_coupon_usage (user_id, offer_id, order_id)
        VALUES (NEW.user_id, NEW.applied_coupon_id, NEW.id)
        ON CONFLICT (user_id, offer_id) 
        DO UPDATE SET used_at = now(), order_id = NEW.id;
        
        -- Increment the coupon's global usage counter
        UPDATE public.offers
        SET used_count = COALESCE(used_count, 0) + 1
        WHERE id = NEW.applied_coupon_id;
    END IF;
    
    -- If cancelling an order with a coupon, decrement the used_count
    IF TG_OP = 'UPDATE' AND OLD.status != 'cancelled' AND NEW.status = 'cancelled' AND NEW.applied_coupon_id IS NOT NULL THEN
        -- Don't remove the user's usage record - we still want to track they used it
        -- Just decrement the global counter
        UPDATE public.offers
        SET used_count = GREATEST(0, COALESCE(used_count, 1) - 1)
        WHERE id = NEW.applied_coupon_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger is properly attached to the orders table
DROP TRIGGER IF EXISTS orders_trigger ON public.orders;
CREATE TRIGGER orders_trigger
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_order();

-- Create an RPC function to check if a coupon is valid for a user
CREATE OR REPLACE FUNCTION public.is_coupon_valid_for_user(
    p_coupon_code TEXT,
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_offer_id UUID;
    v_offer_record RECORD;
    v_result JSONB;
BEGIN
    -- Find the offer by code
    SELECT id INTO v_offer_id
    FROM public.offers
    WHERE code = p_coupon_code
    LIMIT 1;
    
    -- If no offer found
    IF v_offer_id IS NULL THEN
        RETURN jsonb_build_object(
            'valid', false,
            'message', 'Invalid coupon code'
        );
    END IF;
    
    -- Get offer details
    SELECT * INTO v_offer_record
    FROM public.offers
    WHERE id = v_offer_id;
    
    -- Check if offer is expired
    IF v_offer_record.valid_until IS NOT NULL AND v_offer_record.valid_until < CURRENT_DATE THEN
        RETURN jsonb_build_object(
            'valid', false,
            'message', 'Coupon expired'
        );
    END IF;
    
    -- Check if offer has reached usage limit
    IF v_offer_record.usage_limit IS NOT NULL AND v_offer_record.used_count >= v_offer_record.usage_limit THEN
        RETURN jsonb_build_object(
            'valid', false,
            'message', 'Coupon usage limit reached'
        );
    END IF;
    
    -- Check if user has already used this coupon
    IF public.has_user_used_coupon(p_user_id, v_offer_id) THEN
        RETURN jsonb_build_object(
            'valid', false,
            'message', 'You have already used this coupon'
        );
    END IF;
    
    -- All checks passed, coupon is valid
    RETURN jsonb_build_object(
        'valid', true,
        'offer', to_jsonb(v_offer_record)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 