export interface Training {
  id: string
  name: string
  description: string | null
  image_url: string | null
  youtube_url: string | null
  created_at: string
  updated_at: string
}

export type TrainingInsert = Omit<Training, 'id' | 'created_at' | 'updated_at'>
export type TrainingUpdate = Partial<TrainingInsert>
