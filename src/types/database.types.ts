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
          categories: string[];
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