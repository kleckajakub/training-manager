import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Training } from '@/types/training'
import { TrainingCard } from '@/components/TrainingCard'
import { Button } from '@/components/ui/button'

export function TrainingList() {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchTrainings()
  }, [])

  async function fetchTrainings() {
    const { data, error } = await supabase
      .from('trainings')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) setTrainings(data)
    setLoading(false)
  }

  async function handleDuplicate(training: Training) {
    const { error } = await supabase.from('trainings').insert({
      name: `${training.name} (copy)`,
      description: training.description,
      image_url: training.image_url,
      youtube_url: training.youtube_url,
    })
    if (!error) fetchTrainings()
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('trainings').delete().eq('id', id)
    if (!error) setTrainings((prev) => prev.filter((t) => t.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Trainings</h1>
        <Button onClick={() => navigate('/new')}>+ New training</Button>
      </div>

      {trainings.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          No trainings yet. Create your first one!
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {trainings.map((training) => (
            <TrainingCard
              key={training.id}
              training={training}
              onView={() => navigate(`/training/${training.id}`)}
              onEdit={() => navigate(`/edit/${training.id}`)}
              onDuplicate={() => handleDuplicate(training)}
              onDelete={() => handleDelete(training.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
