import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { CatalogExercise, TeamCategory, TrainingCategory } from '@/types/training'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ExerciseCatalogPicker } from '@/components/ExerciseCatalogPicker'

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

function fromCatalog(ex: CatalogExercise): ExerciseState {
  return {
    name: ex.name,
    description: ex.description ?? '',
    youtube_url: ex.youtube_url ?? '',
    image_url: ex.image_url,
    imageFile: null,
  }
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

async function syncCatalog(names: string[], existing: string[]) {
  const newNames = names
    .map((n) => n.trim())
    .filter((n) => n && !existing.map((e) => e.toLowerCase()).includes(n.toLowerCase()))
  if (newNames.length === 0) return
  const unique = [...new Set(newNames.map((n) => n.toLowerCase()))].map(
    (lower) => newNames.find((n) => n.toLowerCase() === lower)!
  )
  await supabase.from('exercise_catalog').insert(unique.map((name) => ({ name })))
}

function ExerciseCard({
  exercise,
  index,
  onChange,
  onRemove,
}: {
  exercise: ExerciseState
  index: number
  onChange: (patch: Partial<ExerciseState>) => void
  onRemove: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewImage = exercise.imageFile
    ? URL.createObjectURL(exercise.imageFile)
    : exercise.image_url

  return (
    <div className="border rounded-xl p-4 flex flex-col gap-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Cvičení {index + 1}
        </span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          Odebrat
        </Button>
      </div>

      <input
        className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        value={exercise.name}
        onChange={(e) => onChange({ name: e.target.value })}
        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
        placeholder="Název cvičení *"
      />

      <textarea
        className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        rows={2}
        value={exercise.description}
        onChange={(e) => onChange({ description: e.target.value })}
        placeholder="Popis (volitelné)"
      />

      <div className="flex flex-col gap-1">
        <input
          className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          value={exercise.youtube_url}
          onChange={(e) => onChange({ youtube_url: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
          placeholder="YouTube URL (volitelné)"
        />
        {exercise.youtube_url && getYouTubeEmbedUrl(exercise.youtube_url) && (
          <div className="mt-1 aspect-video rounded-md overflow-hidden">
            <iframe
              src={getYouTubeEmbedUrl(exercise.youtube_url)!}
              className="w-full h-full"
              allowFullScreen
              title={`YouTube náhled ${index + 1}`}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {previewImage && (
          <img
            src={previewImage}
            alt="Fotka cvičení"
            className="w-full max-h-36 object-cover rounded-md"
          />
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onChange({ imageFile: e.target.files?.[0] ?? null })}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          {previewImage ? 'Změnit fotku' : 'Přidat fotku'}
        </Button>
      </div>
    </div>
  )
}

export function TrainingForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [teamCategoryId, setTeamCategoryId] = useState<string>('none')
  const [trainingCategoryId, setTrainingCategoryId] = useState<string>('none')
  const [exercises, setExercises] = useState<ExerciseState[]>([])
  const [catalog, setCatalog] = useState<CatalogExercise[]>([])
  const [teamCategories, setTeamCategories] = useState<TeamCategory[]>([])
  const [trainingCategories, setTrainingCategories] = useState<TrainingCategory[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadMeta()
    if (isEdit) loadTraining()
  }, [id])

  async function loadMeta() {
    const [{ data: ec }, { data: tc }, { data: trc }] = await Promise.all([
      supabase.from('exercise_catalog').select('*').order('name'),
      supabase.from('team_categories').select('*').order('position').order('name'),
      supabase.from('training_categories').select('*').order('position').order('name'),
    ])
    if (ec) setCatalog(ec)
    if (tc) setTeamCategories(tc)
    if (trc) setTrainingCategories(trc)
  }

  async function loadTraining() {
    const [{ data: t }, { data: e }] = await Promise.all([
      supabase.from('trainings').select('*').eq('id', id!).single(),
      supabase.from('exercises').select('*').eq('training_id', id!).order('position'),
    ])
    if (t) {
      setName(t.name)
      setDescription(t.description ?? '')
      setTeamCategoryId(t.team_category_id ?? 'none')
      setTrainingCategoryId(t.training_category_id ?? 'none')
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
      setError('Název je povinný.')
      return
    }

    setSaving(true)
    setError(null)

    const trainingPayload = {
      name: name.trim(),
      description: description.trim() || null,
      team_category_id: teamCategoryId === 'none' ? null : teamCategoryId,
      training_category_id: trainingCategoryId === 'none' ? null : trainingCategoryId,
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
      if (error || !data) { setError(error?.message ?? 'Chyba při ukládání.'); setSaving(false); return }
      trainingId = data.id
    }

    await supabase.from('exercises').delete().eq('training_id', trainingId!)

    const validExercises = exercises.filter((ex) => ex.name.trim())

    if (validExercises.length > 0) {
      const exerciseRows = await Promise.all(
        validExercises.map(async (ex, index) => {
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
      const { error } = await supabase.from('exercises').insert(exerciseRows)
      if (error) { setError(error.message); setSaving(false); return }
    }

    await syncCatalog(
      validExercises.map((ex) => ex.name),
      catalog.map((c) => c.name)
    )

    navigate('/')
  }

  return (
    <div className="p-4 max-w-2xl mx-auto pb-12">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" onClick={() => navigate('/')}>← Zpět</Button>
        <h1 className="text-2xl font-bold">
          {isEdit ? 'Upravit trénink' : 'Nový trénink'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Název *</label>
          <input
            className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="např. Přihrávky"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Popis</label>
          <textarea
            className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Popis tréninku..."
          />
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Tým</label>
            <Select value={teamCategoryId} onValueChange={(v) => setTeamCategoryId(v ?? 'none')}>
              <SelectTrigger>
                <SelectValue placeholder="Bez týmu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Bez týmu</SelectItem>
                {teamCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Zaměření</label>
            <Select value={trainingCategoryId} onValueChange={(v) => setTrainingCategoryId(v ?? 'none')}>
              <SelectTrigger>
                <SelectValue placeholder="Bez zaměření" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Bez zaměření</SelectItem>
                {trainingCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Exercises */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Cvičení ({exercises.length})
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPickerOpen(true)}
              >
                Vybrat existující
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setExercises((prev) => [...prev, newExercise()])}
              >
                + Přidat nové
              </Button>
            </div>
          </div>

          {exercises.map((ex, index) => (
            <ExerciseCard
              key={index}
              exercise={ex}
              index={index}
              onChange={(patch) => updateExercise(index, patch)}
              onRemove={() => removeExercise(index)}
            />
          ))}
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate('/')}>
            Zrušit
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Ukládám...' : 'Uložit'}
          </Button>
        </div>
      </form>

      <ExerciseCatalogPicker
        catalog={catalog}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(ex) => setExercises((prev) => [...prev, fromCatalog(ex)])}
        onCatalogChange={() => supabase.from('exercise_catalog').select('*').order('name').then(({ data }) => { if (data) setCatalog(data) })}
      />
    </div>
  )
}
