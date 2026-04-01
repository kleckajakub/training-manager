import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Training, Exercise, TeamCategory, TrainingCategory } from '@/types/training'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

function ImageWithLightbox({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <img
        src={src}
        alt={alt}
        className="w-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => setOpen(true)}
      />
      {open && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <img src={src} alt={alt} className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </>
  )
}

function YouTubePlayer({ url }: { url: string }) {
  const embedUrl = getYouTubeEmbedUrl(url)
  if (!embedUrl) return null
  return (
    <div className="aspect-video rounded-lg overflow-hidden">
      <iframe src={embedUrl} className="w-full h-full" allowFullScreen title="YouTube video" />
    </div>
  )
}

export function TrainingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [training, setTraining] = useState<Training | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [teamCategories, setTeamCategories] = useState<TeamCategory[]>([])
  const [trainingCategories, setTrainingCategories] = useState<TrainingCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: t }, { data: e }, { data: tc }, { data: trc }] = await Promise.all([
        supabase.from('trainings').select('*').eq('id', id!).single(),
        supabase.from('exercises').select('*').eq('training_id', id!).order('position'),
        supabase.from('team_categories').select('*'),
        supabase.from('training_categories').select('*'),
      ])
      if (t) setTraining(t)
      if (e) setExercises(e)
      if (tc) setTeamCategories(tc)
      if (trc) setTrainingCategories(trc)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Načítání...</p>
      </div>
    )
  }

  if (!training) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <p className="text-destructive">Trénink nenalezen.</p>
        <Button variant="ghost" onClick={() => navigate('/')}>← Zpět</Button>
      </div>
    )
  }

  const teamCategory = teamCategories.find((c) => c.id === training.team_category_id)
  const trainingCategory = trainingCategories.find((c) => c.id === training.training_category_id)

  return (
    <div className="p-4 max-w-2xl mx-auto pb-12">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" onClick={() => navigate('/')}>← Zpět</Button>
        <Button variant="outline" onClick={() => navigate(`/edit/${training.id}`)}>
          Upravit
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-2">{training.name}</h1>

      {/* Categories */}
      {(teamCategory || trainingCategory) && (
        <div className="flex gap-2 mb-4">
          {teamCategory && <Badge variant="secondary">{teamCategory.name}</Badge>}
          {trainingCategory && <Badge variant="outline">{trainingCategory.name}</Badge>}
        </div>
      )}

      {training.description && (
        <p className="text-muted-foreground mb-6 whitespace-pre-wrap">
          {training.description}
        </p>
      )}

      {exercises.length > 0 && (
        <>
          <div className="flex items-baseline gap-3 mb-4">
            <h2 className="text-xl font-semibold">
              Cvičení ({exercises.length})
            </h2>
            {exercises.some((e) => e.duration_minutes != null) && (
              <span className="text-sm text-muted-foreground">
                celkem {exercises.reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0)} min
              </span>
            )}
          </div>
          <div className="flex flex-col gap-6">
            {exercises.map((exercise, index) => (
              <div key={exercise.id} className="border rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-base">
                    {index + 1}. {exercise.name}
                  </h3>
                  {exercise.duration_minutes != null && (
                    <span className="text-sm text-muted-foreground shrink-0">
                      {exercise.duration_minutes} min
                    </span>
                  )}
                </div>

                {exercise.description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {exercise.description}
                  </p>
                )}

                {exercise.image_url && (
                  <ImageWithLightbox src={exercise.image_url} alt={exercise.name} />
                )}

                {exercise.youtube_url && (
                  <YouTubePlayer url={exercise.youtube_url} />
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
