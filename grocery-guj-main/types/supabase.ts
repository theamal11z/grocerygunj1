export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      addresses: {
        Row: {
          id: string
          user_id: string
          type: string
          address: string
          area: string
          city: string
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          address: string
          area: string
          city: string
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          address?: string
          area?: string
          city?: string
          is_default?: boolean
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          image_url?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          read?: boolean
          created_at?: string
        }
      }
      offers: {
        Row: {
          id: string
          title: string
          code: string
          discount: string
          description: string | null
          valid_until: string
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          code: string
          discount: string
          description?: string | null
          valid_until: string
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          code?: string
          discount?: string
          description?: string | null
          valid_until?: string
          image_url?: string | null
          created_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          status: string
          total_amount: number
          delivery_address_id: string
          payment_method_id: string
          delivery_fee: number
          estimated_delivery: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status: string
          total_amount: number
          delivery_address_id: string
          payment_method_id: string
          delivery_fee?: number
          estimated_delivery: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: string
          total_amount?: number
          delivery_address_id?: string
          payment_method_id?: string
          delivery_fee?: number
          estimated_delivery?: string
          created_at?: string
          updated_at?: string
        }
      }
      payment_methods: {
        Row: {
          id: string
          user_id: string
          type: string
          last_four: string | null
          expiry_date: string | null
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          last_four?: string | null
          expiry_date?: string | null
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          last_four?: string | null
          expiry_date?: string | null
          is_default?: boolean
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          category_id: string | null
          image_urls: string[]
          in_stock: boolean
          unit: string
          nutrition: Json | null
          rating: number | null
          review_count: number | null
          discount: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          category_id?: string | null
          image_urls?: string[]
          in_stock?: boolean
          unit: string
          nutrition?: Json | null
          rating?: number | null
          review_count?: number | null
          discount?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          category_id?: string | null
          image_urls?: string[]
          in_stock?: boolean
          unit?: string
          nutrition?: Json | null
          rating?: number | null
          review_count?: number | null
          discount?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          phone_number: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          phone_number?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          phone_number?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      wishlists: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 