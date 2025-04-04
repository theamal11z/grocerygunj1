import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Initialize the Supabase client
export const supabase = createClient(
  Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL!,
  Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

// Types for database tables
export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  role: 'admin' | 'customer';
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  image_urls: string[];
  category_id: string;
  stock: number;
  unit: string;
  discount?: number;
  rating?: number;
  review_count?: number;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  image_url: string | null;
  created_at: string;
};

export type Address = {
  id: string;
  user_id: string;
  type: string;
  address: string;
  area: string;
  city: string;
  is_default: boolean;
  created_at: string;
};

export type PaymentMethod = {
  id: string;
  user_id: string;
  type: string;
  last_four: string | null;
  expiry_date: string | null;
  is_default: boolean;
  created_at: string;
};

export type Order = {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  sub_total: number;
  discount_amount: number;
  delivery_address_id: string;
  payment_method_id: string | null;
  delivery_fee: number;
  estimated_delivery: string | null;
  is_cash_on_delivery: boolean;
  applied_coupon_id: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
};

export type Wishlist = {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'order' | 'promotion' | 'system';
  read: boolean;
  created_at: string;
};

export type Offer = {
  id: string;
  title: string;
  code: string;
  discount: string;
  description: string;
  valid_until: string;
  image_url: string;
  created_at: string;
};

export type CartItem = {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
};

// Database interface
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'created_at'>;
        Update: Partial<Omit<Category, 'id' | 'created_at'>>;
      };
      addresses: {
        Row: Address;
        Insert: Omit<Address, 'created_at'>;
        Update: Partial<Omit<Address, 'id' | 'created_at'>>;
      };
      payment_methods: {
        Row: PaymentMethod;
        Insert: Omit<PaymentMethod, 'created_at'>;
        Update: Partial<Omit<PaymentMethod, 'id' | 'created_at'>>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Order, 'id' | 'created_at' | 'updated_at'>>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, 'created_at'>;
        Update: Partial<Omit<OrderItem, 'id' | 'created_at'>>;
      };
      wishlists: {
        Row: Wishlist;
        Insert: Omit<Wishlist, 'created_at'>;
        Update: Partial<Omit<Wishlist, 'id' | 'created_at'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'created_at'>;
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>;
      };
      offers: {
        Row: Offer;
        Insert: Omit<Offer, 'created_at'>;
        Update: Partial<Omit<Offer, 'id' | 'created_at'>>;
      };
      cart_items: {
        Row: CartItem;
        Insert: Omit<CartItem, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CartItem, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}