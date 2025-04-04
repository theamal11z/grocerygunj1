// This file now re-exports from the CartContext to maintain backward compatibility
import { useCart as useCartFromContext, CartItemWithProduct } from '@/lib/CartContext';

export type { CartItemWithProduct };

export function useCart() {
  const cartContext = useCartFromContext();
  const { cartItems } = cartContext;

  // Get cart totals
  const getCartTotals = () => {
    const subtotal = cartItems.reduce((total, item) => {
      const price = item.product?.price || 0;
      return total + (price * item.quantity);
    }, 0);
    
    return {
      subtotal,
      discountedSubtotal: subtotal, // No discount applied
      itemCount: cartItems.reduce((count, item) => count + item.quantity, 0)
    };
  };

  return {
    ...cartContext,
    getCartTotals,
  };
} 