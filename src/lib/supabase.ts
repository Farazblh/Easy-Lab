import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: 'admin' | 'analyst' | 'viewer';
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role: 'admin' | 'analyst' | 'viewer';
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: 'admin' | 'analyst' | 'viewer';
          phone?: string | null;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          name: string;
          company: string;
          email: string | null;
          phone: string | null;
          address: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          company: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          company?: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          updated_at?: string;
        };
      };
      samples: {
        Row: {
          id: string;
          sample_code: string;
          sample_type: string;
          source: string;
          collection_date: string;
          received_date: string;
          client_id: string;
          analyst_id: string | null;
          status: 'pending' | 'completed';
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sample_code?: string;
          sample_type: string;
          source: string;
          collection_date: string;
          received_date: string;
          client_id: string;
          analyst_id?: string | null;
          status?: 'pending' | 'completed';
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          sample_type?: string;
          source?: string;
          collection_date?: string;
          received_date?: string;
          client_id?: string;
          analyst_id?: string | null;
          status?: 'pending' | 'completed';
          updated_at?: string;
        };
      };
      test_results: {
        Row: {
          id: string;
          sample_id: string;
          tpc: number | null;
          coliforms: 'positive' | 'negative' | null;
          ecoli_o157: 'positive' | 'negative' | null;
          salmonella: 'positive' | 'negative' | null;
          ph: number | null;
          tds: number | null;
          remarks: string | null;
          tested_by: string | null;
          tested_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sample_id: string;
          tpc?: number | null;
          coliforms?: 'positive' | 'negative' | null;
          ecoli_o157?: 'positive' | 'negative' | null;
          salmonella?: 'positive' | 'negative' | null;
          ph?: number | null;
          tds?: number | null;
          remarks?: string | null;
          tested_by?: string | null;
          tested_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          tpc?: number | null;
          coliforms?: 'positive' | 'negative' | null;
          ecoli_o157?: 'positive' | 'negative' | null;
          salmonella?: 'positive' | 'negative' | null;
          ph?: number | null;
          tds?: number | null;
          remarks?: string | null;
          tested_by?: string | null;
          tested_at?: string;
          updated_at?: string;
        };
      };
      lab_settings: {
        Row: {
          id: string;
          lab_name: string;
          lab_logo_url: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lab_name: string;
          lab_logo_url?: string | null;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          lab_name?: string;
          lab_logo_url?: string | null;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          sample_id: string;
          client_id: string;
          pdf_url: string | null;
          generated_by: string | null;
          date_generated: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          sample_id: string;
          client_id: string;
          pdf_url?: string | null;
          generated_by?: string | null;
          date_generated?: string;
          created_at?: string;
        };
        Update: {
          pdf_url?: string | null;
          date_generated?: string;
        };
      };
    };
  };
};
