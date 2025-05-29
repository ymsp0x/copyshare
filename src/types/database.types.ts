// project/src/types/database.types.ts

// Struktur Database Supabase Anda
export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          title: string;
          description: string;
          status: 'Aktif' | 'Selesai' | 'Segera';
          image_url: string | null;
          project_url: string | null;
          slug: string;
          created_at: string;
          updated_at: string;
          categories: string[]; // Array of strings, e.g., ["Airdrop", "DeFi"]
          airdrop_description: string | null; // Deskripsi singkat khusus Airdrop
          project_type: 'article' | 'airdrop' | 'both'; // <--- Tambahan kolom project_type
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          status?: 'Aktif' | 'Selesai' | 'Segera';
          image_url?: string | null;
          project_url?: string | null;
          slug: string;
          created_at?: string;
          updated_at?: string;
          categories?: string[];
          airdrop_description?: string | null;
          project_type?: 'article' | 'airdrop' | 'both'; // <--- Tambahan kolom project_type
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          status?: 'Aktif' | 'Selesai' | 'Segera';
          image_url?: string | null;
          project_url?: string | null;
          slug?: string;
          created_at?: string;
          updated_at?: string;
          categories?: string[];
          airdrop_description?: string | null;
          project_type?: 'article' | 'airdrop' | 'both'; // <--- Tambahan kolom project_type
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
        };
      };
      activities: {
        Row: {
          id: string;
          activity_type: string; // e.g., 'airdrop_created_aktif', 'airdrop_updated_segera'
          entity_type: string;   // 'project'
          entity_id: string;        // ID dari proyek yang terpengaruh
          entity_name: string | null;
          description: string | null;
          created_at: string;
          metadata: Record<string, any> | null;
          project_status_before: string | null;
          project_status_after: string | null;
          image_url: string | null;
        };
        Insert: {
          id?: string;
          activity_type: string;
          entity_type: string;
          entity_id: string;
          entity_name?: string | null;
          description?: string | null;
          created_at?: string;
          metadata?: Record<string, any> | null;
          project_status_before?: string | null;
          project_status_after?: string | null;
          image_url?: string | null;
        };
        Update: {
          id?: string;
          activity_type?: string;
          entity_type?: string;
          entity_id?: string;
          entity_name?: string | null;
          description?: string | null;
          created_at?: string;
          metadata?: Record<string, any> | null;
          project_status_before?: string | null;
          project_status_after?: string | null;
          image_url?: string | null;
        };
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
  };
}

export type Project = Database['public']['Tables']['projects']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Activity = Database['public']['Tables']['activities']['Row'];