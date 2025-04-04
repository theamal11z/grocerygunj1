export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          id: string
          admin_id: string
          action: string
          table_name: string
          record_id: string | null
          old_data: Json | null
          new_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action: string
          table_name: string
          record_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          action?: string
          table_name?: string
          record_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
          min_purchase_amount: number | null
          max_discount_amount: number | null
          usage_limit: number | null
          used_count: number | null
          coupon_type: string | null
          applicable_products: string[] | null
          applicable_categories: string[] | null
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
          min_purchase_amount?: number | null
          max_discount_amount?: number | null
          usage_limit?: number | null
          used_count?: number | null
          coupon_type?: string | null
          applicable_products?: string[] | null
          applicable_categories?: string[] | null
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
          min_purchase_amount?: number | null
          max_discount_amount?: number | null
          usage_limit?: number | null
          used_count?: number | null
          coupon_type?: string | null
          applicable_products?: string[] | null
          applicable_categories?: string[] | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          id: string
          user_id: string
          total_amount: number
          shipping_address: Json | null
          payment_method: string | null
          status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          created_at: string
          updated_at: string | null
          applied_coupon_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          total_amount: number
          shipping_address?: Json | null
          payment_method?: string | null
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          created_at?: string
          updated_at?: string | null
          applied_coupon_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          total_amount?: number
          shipping_address?: Json | null
          payment_method?: string | null
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          created_at?: string
          updated_at?: string | null
          applied_coupon_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_applied_coupon_id_fkey"
            columns: ["applied_coupon_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          }
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          price?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
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
          updated_at: string | null
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
          updated_at?: string | null
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
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      categories: {
        Row: {
          id: string
          name: string
          image_url: string | null
          parent_id: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          image_url?: string | null
          parent_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          image_url?: string | null
          parent_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'order' | 'promotion' | 'system'
          read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'order' | 'promotion' | 'system'
          read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'order' | 'promotion' | 'system'
          read?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_order_details: {
        Args: {
          order_id: string
        }
        Returns: Json
      }
      get_orders_list: {
        Args: {
          status_filter?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | null
          date_from?: string | null
          date_to?: string | null
          search_query?: string | null
        }
        Returns: Json
      }
      is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      update_order_status: {
        Args: {
          order_id: string
          new_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
        }
        Returns: {
          id: string
          user_id: string
          total_amount: number
          shipping_address: Json | null
          payment_method: string | null
          status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          created_at: string
          updated_at: string | null
        }
      }
    }
    Enums: {
      order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
    }
  }
}
