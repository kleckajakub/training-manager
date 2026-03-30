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

export function TrainingForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isEdit) loadTraining()
  }, [id])

  async function loadTraining() {
    const { data } = await supabase
      .from('trainings')
      .select('*')
      .eq('id', id!)
      .single()

    if (data) {
      setName(data.name)
      setDescription(data.description ?? '')
      setYoutubeUrl(data.youtube_url ?? '')
      setImageUrl(data.image_url)
    }
  }

  async function uploadImage(): Promise<string | null> {
    if (!imageFile) return imageUrl

    const ext = imageFile.name.split('.').pop()
    const path = `trainings/${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('training-images')
      .upload(path, imageFile)

    if (error) return imageUrl

    const { data } = supabase.storage
      .from('training-images')
      .getPublicUrl(path)

    return data.publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required.')
      return
    }

    setSaving(true)
    setError(null)

    const uploadedImageUrl = await uploadImage()

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      youtube_url: youtubeUrl.trim() || null,
      image_url: uploadedImageUrl,
    }

    if (isEdit) {
      const { error } = await supabase
        .from('trainings')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id!)
      if (error) setError(error.message)
      else navigate('/')
    } else {
      const { error } = await supabase.from('trainings').insert(payload)
      if (error) setError(error.message)
      else navigate('/')
    }

    setSaving(false)
  }

  const embedUrl = youtubeUrl ? getYouTubeEmbedUrl(youtubeUrl) : null

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" onClick={() => navigate('/')}>
          ← Back
        </Button>
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
            className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px] resize-y"
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
          {embedUrl && (
            <div className="mt-2 aspect-video rounded-md overflow-hidden">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allowFullScreen
                title="YouTube preview"
              />
            </div>
          )}
        </div>

        {/* Photo */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Photo</label>
          {imageUrl && !imageFile && (
            <img
              src={imageUrl}
              alt="Current"
              className="w-full max-h-48 object-cover rounded-md mb-2"
            />
          )}
          {imageFile && (
            <img
              src={URL.createObjectURL(imageFile)}
              alt="Preview"
              className="w-full max-h-48 object-cover rounded-md mb-2"
            />
          )}
          <input
            type="file"
            accept="image/*"
            className="text-sm"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
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
