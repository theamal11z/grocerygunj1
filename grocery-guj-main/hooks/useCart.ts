// This file now re-exports from the CartContext to maintain backward compatibility
import { useCart as useCartFromContext, CartItemWithProduct } from '@/lib/CartContext';
import { useState } from 'react';
import { useAuth } from './useAuth';
import { useOffers, Offer } from './useOffers';

export type { CartItemWithProduct };

export function useCart() {
  const cartContext = useCartFromContext();
  const { cartItems } = cartContext;
  const { applyOffer, calculateDiscountAmount } = useOffers();
  const [appliedCoupon, setAppliedCoupon] = useState<Offer | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Calculate cart subtotal
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.product?.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  // Apply coupon to cart
  const applyCoupon = async (code: string) => {
    try {
      setCouponError(null);
      const subtotal = calculateSubtotal();
      
      // Verify the coupon code is valid with cart total
      const offerDetails = await applyOffer(code, subtotal);
      
      if (offerDetails) {
        setAppliedCoupon(offerDetails);
        return offerDetails;
      }
      return null;
    } catch (error) {
      if (error instanceof Error) {
        setCouponError(error.message);
      }
      throw error;
    }
  };

  // Remove applied coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  // Calculate discount amount based on applied coupon
  const calculateDiscount = (subtotal: number) => {
    if (!appliedCoupon) return 0;
    return calculateDiscountAmount(appliedCoupon, subtotal);
  };

  // Get cart totals including discount
  const getCartTotals = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscount(subtotal);
    
    return {
      subtotal,
      discountAmount,
      discountedSubtotal: Math.max(0, subtotal - discountAmount),
      itemCount: cartItems.reduce((count, item) => count + item.quantity, 0)
    };
  };

  return {
    ...cartContext,
    appliedCoupon,
    couponError,
    applyCoupon,
    removeCoupon,
    getCartTotals,
  };
} 