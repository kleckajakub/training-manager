export interface Database {
  public: {
    Tables: {
      trainings: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string | null
          youtube_url: string | null
          team_category_id: string | null
          training_category_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_url?: string | null
          youtube_url?: string | null
          team_category_id?: string | null
          training_category_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          image_url?: string | null
          youtube_url?: string | null
          team_category_id?: string | null
          training_category_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          id: string
          training_id: string
          name: string
          description: string | null
          image_url: string | null
          youtube_url: string | null
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          training_id: string
          name: string
          description?: string | null
          image_url?: string | null
          youtube_url?: string | null
          position: number
          created_at?: string
        }
        Update: {
          id?: string
          training_id?: string
          name?: string
          description?: string | null
          image_url?: string | null
          youtube_url?: string | null
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: 'exercises_training_id_fkey'
            columns: ['training_id']
            isOneToOne: false
            referencedRelation: 'trainings'
            referencedColumns: ['id']
          }
        ]
      }
      exercise_catalog: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string | null
          youtube_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_url?: string | null
          youtube_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          image_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      team_categories: {
        Row: {
          id: string
          name: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          position?: number
        }
        Relationships: []
      }
      training_categories: {
        Row: {
          id: string
          name: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          position?: number
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
