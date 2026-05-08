// Auto-generated types based on Supabase schema
// PRD v2.0 — Korean Learning Platform

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'student' | 'content_admin' | 'super_admin'
export type SubscriptionStatus = 'active' | 'grace_period' | 'expired' | 'cancelled'
export type TransactionStatus = 'pending' | 'success' | 'failed' | 'expired' | 'refunded'
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced'
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed'
export type ProductType = 'pdf' | 'template' | 'other'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          role: UserRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: UserRole
          updated_at?: string
        }
      }
      packages: {
        Row: {
          id: string
          name: string
          slug: string
          price: number
          duration_days: number
          description: string | null
          features: Json | null
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          price: number
          duration_days?: number
          description?: string | null
          features?: Json | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          name?: string
          slug?: string
          price?: number
          duration_days?: number
          description?: string | null
          features?: Json | null
          is_active?: boolean
          sort_order?: number
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          package_id: string
          status: SubscriptionStatus
          started_at: string
          expires_at: string
          grace_until: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          package_id: string
          status?: SubscriptionStatus
          started_at?: string
          expires_at: string
          grace_until?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: SubscriptionStatus
          expires_at?: string
          grace_until?: string | null
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          package_id: string | null
          product_id: string | null
          order_id: string
          amount: number
          status: TransactionStatus
          payment_type: string | null
          midtrans_order_id: string | null
          snap_token: string | null
          webhook_received_at: string | null
          idempotency_key: string | null
          metadata: Json | null
          voucher_id: string | null
          discount_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          package_id?: string | null
          product_id?: string | null
          order_id: string
          amount: number
          status?: TransactionStatus
          payment_type?: string | null
          midtrans_order_id?: string | null
          snap_token?: string | null
          webhook_received_at?: string | null
          idempotency_key?: string | null
          metadata?: Json | null
          voucher_id?: string | null
          discount_amount?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: TransactionStatus
          payment_type?: string | null
          snap_token?: string | null
          webhook_received_at?: string | null
          metadata?: Json | null
          voucher_id?: string | null
          discount_amount?: number
          updated_at?: string
        }
      }
      vouchers: {
        Row: {
          id: string
          code: string
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          max_discount: number | null
          max_uses: number | null
          current_uses: number
          valid_from: string | null
          valid_until: string | null
          applicable_package_ids: string[] | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          max_discount?: number | null
          max_uses?: number | null
          current_uses?: number
          valid_from?: string | null
          valid_until?: string | null
          applicable_package_ids?: string[] | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          code?: string
          discount_type?: 'percentage' | 'fixed'
          discount_value?: number
          max_discount?: number | null
          max_uses?: number | null
          current_uses?: number
          valid_from?: string | null
          valid_until?: string | null
          applicable_package_ids?: string[] | null
          is_active?: boolean
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          level: CourseLevel
          thumbnail_url: string | null
          is_published: boolean
          sort_order: number
          required_package: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string | null
          level: CourseLevel
          thumbnail_url?: string | null
          is_published?: boolean
          sort_order?: number
          required_package?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          slug?: string
          description?: string | null
          level?: CourseLevel
          thumbnail_url?: string | null
          is_published?: boolean
          sort_order?: number
          required_package?: string[]
          updated_at?: string
        }
      }
      lessons: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          youtube_video_id: string
          duration_seconds: number | null
          sort_order: number
          is_published: boolean
          is_preview: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          youtube_video_id: string
          duration_seconds?: number | null
          sort_order?: number
          is_published?: boolean
          is_preview?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          youtube_video_id?: string
          duration_seconds?: number | null
          sort_order?: number
          is_published?: boolean
          is_preview?: boolean
          updated_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          status: ProgressStatus
          watch_duration: number
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          status?: ProgressStatus
          watch_duration?: number
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: ProgressStatus
          watch_duration?: number
          completed_at?: string | null
          updated_at?: string
        }
      }
      quiz_questions: {
        Row: {
          id: string
          lesson_id: string
          question_text: string
          options: Json
          correct_answer: string
          explanation: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          question_text: string
          options: Json
          correct_answer: string
          explanation?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          question_text?: string
          options?: Json
          correct_answer?: string
          explanation?: string | null
          sort_order?: number
        }
      }
      quiz_attempts: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          answers: Json
          score: number
          passed: boolean
          attempt_number: number
          completed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          answers: Json
          score: number
          passed: boolean
          attempt_number?: number
          completed_at?: string
        }
        Update: {
          answers?: Json
          score?: number
          passed?: boolean
        }
      }
      digital_products: {
        Row: {
          id: string
          title: string
          description: string | null
          price: number
          file_path: string
          thumbnail_url: string | null
          product_type: ProductType
          is_active: boolean
          download_limit: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          price: number
          file_path: string
          thumbnail_url?: string | null
          product_type?: ProductType
          is_active?: boolean
          download_limit?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          price?: number
          file_path?: string
          thumbnail_url?: string | null
          product_type?: ProductType
          is_active?: boolean
          download_limit?: number
          updated_at?: string
        }
      }
      product_purchases: {
        Row: {
          id: string
          user_id: string
          product_id: string
          transaction_id: string
          download_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          transaction_id: string
          download_count?: number
          created_at?: string
        }
        Update: {
          download_count?: number
        }
      }
    }
    Views: {
      v_active_subscriptions: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          package_name: string
          package_slug: string
          status: SubscriptionStatus
          started_at: string
          expires_at: string
          grace_until: string | null
          computed_status: string
          days_remaining: number
        }
      }
      v_course_progress: {
        Row: {
          user_id: string
          course_id: string
          course_title: string
          course_level: CourseLevel
          total_lessons: number
          completed_lessons: number
          completion_percentage: number
        }
      }
      v_best_quiz_scores: {
        Row: {
          user_id: string
          lesson_id: string
          best_score: number
          ever_passed: number
          total_attempts: number
          last_attempt_at: string
        }
      }
    }
    Functions: {
      has_active_subscription: {
        Args: { uid: string }
        Returns: boolean
      }
      is_admin: {
        Args: { uid: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: { uid: string }
        Returns: boolean
      }
      get_user_role: {
        Args: { uid: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
