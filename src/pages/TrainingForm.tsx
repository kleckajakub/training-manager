import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

interface ExerciseState {
  id?: string
  name: string
  description: string
  youtube_url: string
  image_url: string | null
  imageFile: File | null
}

function newExercise(): ExerciseState {
  return { name: '', description: '', youtube_url: '', image_url: null, imageFile: null }
}

async function uploadImage(file: File, path: string): Promise<string | null> {
  const ext = file.name.split('.').pop()
  const fullPath = `${path}/${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('training-images')
    .upload(fullPath, file)
  if (error) return null
  const { data } = supabase.storage.from('training-images').getPublicUrl(fullPath)
  return data.publicUrl
}

export function TrainingForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [exercises, setExercises] = useState<ExerciseState[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isEdit) loadTraining()
  }, [id])

  async function loadTraining() {
    const [{ data: t }, { data: e }] = await Promise.all([
      supabase.from('trainings').select('*').eq('id', id!).single(),
      supabase.from('exercises').select('*').eq('training_id', id!).order('position'),
    ])
    if (t) {
      setName(t.name)
      setDescription(t.description ?? '')
      setYoutubeUrl(t.youtube_url ?? '')
      setImageUrl(t.image_url)
    }
    if (e) {
      setExercises(
        e.map((ex) => ({
          id: ex.id,
          name: ex.name,
          description: ex.description ?? '',
          youtube_url: ex.youtube_url ?? '',
          image_url: ex.image_url,
          imageFile: null,
        }))
      )
    }
  }

  function updateExercise(index: number, patch: Partial<ExerciseState>) {
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, ...patch } : ex))
    )
  }

  function removeExercise(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required.')
      return
    }

    setSaving(true)
    setError(null)

    // Upload training image
    let finalImageUrl = imageUrl
    if (imageFile) {
      finalImageUrl = await uploadImage(imageFile, 'trainings')
    }

    const trainingPayload = {
      name: name.trim(),
      description: description.trim() || null,
      youtube_url: youtubeUrl.trim() || null,
      image_url: finalImageUrl,
    }

    let trainingId = id

    if (isEdit) {
      const { error } = await supabase
        .from('trainings')
        .update({ ...trainingPayload, updated_at: new Date().toISOString() })
        .eq('id', id!)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { data, error } = await supabase
        .from('trainings')
        .insert(trainingPayload)
        .select('id')
        .single()
      if (error || !data) { setError(error?.message ?? 'Error'); setSaving(false); return }
      trainingId = data.id
    }

    // Save exercises: delete all and re-insert
    await supabase.from('exercises').delete().eq('training_id', trainingId!)

    if (exercises.length > 0) {
      const exerciseRows = await Promise.all(
        exercises.map(async (ex, index) => {
          let exImageUrl = ex.image_url
          if (ex.imageFile) {
            exImageUrl = await uploadImage(ex.imageFile, 'exercises')
          }
          return {
            training_id: trainingId!,
            name: ex.name.trim(),
            description: ex.description.trim() || null,
            youtube_url: ex.youtube_url.trim() || null,
            image_url: exImageUrl,
            position: index,
          }
        })
      )

      const validRows = exerciseRows.filter((ex) => ex.name)
      if (validRows.length > 0) {
        const { error } = await supabase.from('exercises').insert(validRows)
        if (error) { setError(error.message); setSaving(false); return }
      }
    }

    navigate('/')
  }

  const trainingEmbedUrl = youtubeUrl ? getYouTubeEmbedUrl(youtubeUrl) : null

  return (
    <div className="p-4 max-w-2xl mx-auto pb-12">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" onClick={() => navigate('/')}>← Back</Button>
        <h1 className="text-2xl font-bold">
          {isEdit ? 'Edit training' : 'New training'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Name *</label>
          <input
            className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Passing drills"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Description</label>
          <textarea
            className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the training..."
          />
        </div>

        {/* YouTube */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">YouTube URL</label>
          <input
            className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          {trainingEmbedUrl && (
            <div className="mt-2 aspect-video rounded-md overflow-hidden">
              <iframe src={trainingEmbedUrl} className="w-full h-full" allowFullScreen title="YouTube preview" />
            </div>
          )}
        </div>

        {/* Photo */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Photo</label>
          {imageUrl && !imageFile && (
            <img src={imageUrl} alt="Current" className="w-full max-h-48 object-cover rounded-md mb-2" />
          )}
          {imageFile && (
            <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full max-h-48 object-cover rounded-md mb-2" />
          )}
          <input
            type="file"
            accept="image/*"
            className="text-sm"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* Exercises */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Exercises ({exercises.length})
            </label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setExercises((prev) => [...prev, newExercise()])}
            >
              + Add exercise
            </Button>
          </div>

          {exercises.map((ex, index) => (
            <div key={index} className="border rounded-xl p-4 flex flex-col gap-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Exercise {index + 1}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeExercise(index)}
                >
                  Remove
                </Button>
              </div>

              {/* Exercise name */}
              <input
                className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={ex.name}
                onChange={(e) => updateExercise(index, { name: e.target.value })}
                placeholder="Exercise name *"
              />

              {/* Exercise description */}
              <textarea
                className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={2}
                value={ex.description}
                onChange={(e) => updateExercise(index, { description: e.target.value })}
                placeholder="Description (optional)"
              />

              {/* Exercise YouTube */}
              <div className="flex flex-col gap-1">
                <input
                  className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={ex.youtube_url}
                  onChange={(e) => updateExercise(index, { youtube_url: e.target.value })}
                  placeholder="YouTube URL (optional)"
                />
                {ex.youtube_url && getYouTubeEmbedUrl(ex.youtube_url) && (
                  <div className="mt-1 aspect-video rounded-md overflow-hidden">
                    <iframe
                      src={getYouTubeEmbedUrl(ex.youtube_url)!}
                      className="w-full h-full"
                      allowFullScreen
                      title={`YouTube preview ${index + 1}`}
                    />
                  </div>
                )}
              </div>

              {/* Exercise photo */}
              <div className="flex flex-col gap-1">
                {ex.image_url && !ex.imageFile && (
                  <img src={ex.image_url} alt="Current" className="w-full max-h-36 object-cover rounded-md" />
                )}
                {ex.imageFile && (
                  <img src={URL.createObjectURL(ex.imageFile)} alt="Preview" className="w-full max-h-36 object-cover rounded-md" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="text-sm"
                  onChange={(e) =>
                    updateExercise(index, { imageFile: e.target.files?.[0] ?? null })
                  }
                />
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate('/')}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  )
}
