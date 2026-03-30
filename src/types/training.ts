export interface Training {
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

export interface Exercise {
  id: string
  training_id: string
  name: string
  description: string | null
  image_url: string | null
  youtube_url: string | null
  position: number
  created_at: string
}

export interface CatalogExercise {
  id: string
  name: string
  description: string | null
  image_url: string | null
  youtube_url: string | null
  created_at: string
}

export interface TeamCategory {
  id: string
  name: string
  position: number
  created_at: string
}

export interface TrainingCategory {
  id: string
  name: string
  position: number
  created_at: string
}

export type TrainingInsert = Omit<Training, 'id' | 'created_at' | 'updated_at'>
export type TrainingUpdate = Partial<TrainingInsert>
export type ExerciseInsert = Omit<Exercise, 'id' | 'created_at'>
