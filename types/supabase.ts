/**
 * BOSS Study OS — Database & Supabase Strong Type Definitions
 * Maps 1:1 with PostgreSQL tables, Row Level Security policies, and Storage models.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; // UUID references auth.users(id)
          display_name: string;
          avatar_path: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          avatar_path?: string | null;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_path?: string | null;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      study_tasks: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          task_id: string;
          title: string;
          category: string;
          start_time: string | null;
          end_time: string | null;
          status: string;
          is_study: boolean;
          notes: string | null;
          crosses_midnight: boolean;
          rescheduled_to: string | null;
          history: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          task_id: string;
          title: string;
          category: string;
          start_time?: string | null;
          end_time?: string | null;
          status?: string;
          is_study?: boolean;
          notes?: string | null;
          crosses_midnight?: boolean;
          rescheduled_to?: string | null;
          history?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          task_id?: string;
          title?: string;
          category?: string;
          start_time?: string | null;
          end_time?: string | null;
          status?: string;
          is_study?: boolean;
          notes?: string | null;
          crosses_midnight?: boolean;
          rescheduled_to?: string | null;
          history?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      study_sessions: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          subject: string;
          topic: string | null;
          active_seconds: number;
          break_seconds: number;
          camera_enabled: boolean;
          presence_rate: number;
          ai_insight: string | null;
          start_time: string | null;
          end_time: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          subject: string;
          topic?: string | null;
          active_seconds?: number;
          break_seconds?: number;
          camera_enabled?: boolean;
          presence_rate?: number;
          ai_insight?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          subject?: string;
          topic?: string | null;
          active_seconds?: number;
          break_seconds?: number;
          camera_enabled?: boolean;
          presence_rate?: number;
          ai_insight?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          created_at?: string;
        };
      };
      dsa_progress: {
        Row: {
          id: string;
          user_id: string;
          problem_id: string;
          status: string;
          notes: string | null;
          solved_at: string | null;
          revisit_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          problem_id: string;
          status?: string;
          notes?: string | null;
          solved_at?: string | null;
          revisit_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          problem_id?: string;
          status?: string;
          notes?: string | null;
          solved_at?: string | null;
          revisit_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      development_progress: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          item_id: string;
          status: string;
          notes: string | null;
          repo_link: string | null;
          live_link: string | null;
          content: string | null;
          solved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: string;
          item_id: string;
          status?: string;
          notes?: string | null;
          repo_link?: string | null;
          live_link?: string | null;
          content?: string | null;
          solved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: string;
          item_id?: string;
          status?: string;
          notes?: string | null;
          repo_link?: string | null;
          live_link?: string | null;
          content?: string | null;
          solved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      mistakes: {
        Row: {
          id: string;
          user_id: string;
          question: string;
          subject: string;
          topic: string | null;
          source: string | null;
          date: string;
          user_answer: string | null;
          correct_answer: string | null;
          explanation: string | null;
          mistake_type: string | null;
          personal_note: string | null;
          revisit_date: string | null;
          repeat_count: number;
          resolved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question: string;
          subject: string;
          topic?: string | null;
          source?: string | null;
          date?: string;
          user_answer?: string | null;
          correct_answer?: string | null;
          explanation?: string | null;
          mistake_type?: string | null;
          personal_note?: string | null;
          revisit_date?: string | null;
          repeat_count?: number;
          resolved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          question?: string;
          subject?: string;
          topic?: string | null;
          source?: string | null;
          date?: string;
          user_answer?: string | null;
          correct_answer?: string | null;
          explanation?: string | null;
          mistake_type?: string | null;
          personal_note?: string | null;
          revisit_date?: string | null;
          repeat_count?: number;
          resolved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      workout_plans: {
        Row: {
          id: string;
          user_id: string;
          is_configured: boolean;
          settings: Json;
          schedule: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          is_configured?: boolean;
          settings?: Json;
          schedule: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          is_configured?: boolean;
          settings?: Json;
          schedule?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          day_of_week: string;
          day_key: string;
          workout_type: string;
          duration_minutes: number;
          status: string;
          gym_photo_path: string;
          total_volume_kg: number;
          total_sets: number;
          total_reps: number;
          notes: string | null;
          started_at: string | null;
          ended_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          day_of_week: string;
          day_key: string;
          workout_type: string;
          duration_minutes?: number;
          status?: string;
          gym_photo_path: string;
          total_volume_kg?: number;
          total_sets?: number;
          total_reps?: number;
          notes?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          day_of_week?: string;
          day_key?: string;
          workout_type?: string;
          duration_minutes?: number;
          status?: string;
          gym_photo_path?: string;
          total_volume_kg?: number;
          total_sets?: number;
          total_reps?: number;
          notes?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
        };
      };
      workout_exercises: {
        Row: {
          id: string;
          session_id: string;
          exercise_id: string;
          exercise_name_snapshot: string;
          muscle_group: string | null;
          equipment: string | null;
          order_index: number;
          skipped: boolean;
          notes: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          exercise_id: string;
          exercise_name_snapshot: string;
          muscle_group?: string | null;
          equipment?: string | null;
          order_index?: number;
          skipped?: boolean;
          notes?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          exercise_id?: string;
          exercise_name_snapshot?: string;
          muscle_group?: string | null;
          equipment?: string | null;
          order_index?: number;
          skipped?: boolean;
          notes?: string | null;
        };
      };
      workout_sets: {
        Row: {
          id: string;
          workout_exercise_id: string;
          set_number: number;
          weight_kg: number;
          reps: number;
          rpe: number | null;
          completed: boolean;
          is_weight_pr: boolean;
          is_rep_pr: boolean;
          completed_at: string;
        };
        Insert: {
          id?: string;
          workout_exercise_id: string;
          set_number: number;
          weight_kg: number;
          reps: number;
          rpe?: number | null;
          completed?: boolean;
          is_weight_pr?: boolean;
          is_rep_pr?: boolean;
          completed_at?: string;
        };
        Update: {
          id?: string;
          workout_exercise_id?: string;
          set_number?: number;
          weight_kg?: number;
          reps?: number;
          rpe?: number | null;
          completed?: boolean;
          is_weight_pr?: boolean;
          is_rep_pr?: boolean;
          completed_at?: string;
        };
      };
      personal_records: {
        Row: {
          id: string;
          user_id: string;
          exercise_id: string;
          exercise_name: string;
          max_weight_kg: number;
          max_reps: number;
          achieved_at: string;
          session_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          exercise_id: string;
          exercise_name: string;
          max_weight_kg?: number;
          max_reps?: number;
          achieved_at?: string;
          session_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          exercise_id?: string;
          exercise_name?: string;
          max_weight_kg?: number;
          max_reps?: number;
          achieved_at?: string;
          session_id?: string | null;
        };
      };
      ai_settings: {
        Row: {
          id: string;
          user_id: string;
          encrypted_key: Json | null;
          masked_key: string | null;
          model: string;
          preferred_study_windows: Json;
          settings: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          encrypted_key?: Json | null;
          masked_key?: string | null;
          model?: string;
          preferred_study_windows?: Json;
          settings?: Json;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          encrypted_key?: Json | null;
          masked_key?: string | null;
          model?: string;
          preferred_study_windows?: Json;
          settings?: Json;
          updated_at?: string;
        };
      };
    };
  };
}
