import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Training, Exercise } from '@/types/training'
import { Button } from '@/components/ui/button'

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
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full rounded-lg"
          />
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
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allowFullScreen
        title="YouTube video"
      />
    </div>
  )
}

export function TrainingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [training, setTraining] = useState<Training | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: t }, { data: e }] = await Promise.all([
        supabase.from('trainings').select('*').eq('id', id!).single(),
        supabase
          .from('exercises')
          .select('*')
          .eq('training_id', id!)
          .order('position'),
      ])
      if (t) setTraining(t)
      if (e) setExercises(e)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!training) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <p className="text-destructive">Training not found.</p>
        <Button variant="ghost" onClick={() => navigate('/')}>← Back</Button>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-2xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" onClick={() => navigate('/')}>← Back</Button>
        <Button variant="outline" onClick={() => navigate(`/edit/${training.id}`)}>
          Edit
        </Button>
      </div>

      {/* Training name */}
      <h1 className="text-3xl font-bold mb-3">{training.name}</h1>

      {/* Training description */}
      {training.description && (
        <p className="text-muted-foreground mb-4 whitespace-pre-wrap">
          {training.description}
        </p>
      )}

      {/* Training image */}
      {training.image_url && (
        <div className="mb-4">
          <ImageWithLightbox src={training.image_url} alt={training.name} />
        </div>
      )}

      {/* Training video */}
      {training.youtube_url && (
        <div className="mb-6">
          <YouTubePlayer url={training.youtube_url} />
        </div>
      )}

      {/* Exercises */}
      {exercises.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-4">
            Exercises ({exercises.length})
          </h2>
          <div className="flex flex-col gap-6">
            {exercises.map((exercise, index) => (
              <div key={exercise.id} className="border rounded-xl p-4 flex flex-col gap-3">
                <h3 className="font-semibold text-base">
                  {index + 1}. {exercise.name}
                </h3>

                {exercise.description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {exercise.description}
                  </p>
                )}

                {exercise.image_url && (
                  <ImageWithLightbox
                    src={exercise.image_url}
                    alt={exercise.name}
                  />
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
