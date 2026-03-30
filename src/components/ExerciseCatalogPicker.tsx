import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { CatalogExercise } from '@/types/training'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

async function uploadImage(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop()
  const fullPath = `catalog/${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('training-images')
    .upload(fullPath, file)
  if (error) return null
  const { data } = supabase.storage.from('training-images').getPublicUrl(fullPath)
  return data.publicUrl
}

type View = 'list' | 'preview' | 'edit'

interface Props {
  catalog: CatalogExercise[]
  onSelect: (exercise: CatalogExercise) => void
  onCatalogChange: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExerciseCatalogPicker({
  catalog,
  onSelect,
  onCatalogChange,
  open,
  onOpenChange,
}: Props) {
  const [view, setView] = useState<View>('list')
  const [selected, setSelected] = useState<CatalogExercise | null>(null)
  const [search, setSearch] = useState('')

  // Edit state
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editYoutubeUrl, setEditYoutubeUrl] = useState('')
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null)
  const [editImageFile, setEditImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function openPreview(ex: CatalogExercise) {
    setSelected(ex)
    setView('preview')
  }

  function openEdit(ex: CatalogExercise) {
    setSelected(ex)
    setEditName(ex.name)
    setEditDescription(ex.description ?? '')
    setEditYoutubeUrl(ex.youtube_url ?? '')
    setEditImageUrl(ex.image_url)
    setEditImageFile(null)
    setView('edit')
  }

  function handleSelect(ex: CatalogExercise) {
    onSelect(ex)
    onOpenChange(false)
    resetView()
  }

  function resetView() {
    setView('list')
    setSelected(null)
    setSearch('')
  }

  async function handleSaveEdit() {
    if (!selected || !editName.trim()) return
    setSaving(true)

    let finalImageUrl = editImageUrl
    if (editImageFile) {
      finalImageUrl = await uploadImage(editImageFile)
    }

    await supabase
      .from('exercise_catalog')
      .update({
        name: editName.trim(),
        description: editDescription.trim() || null,
        youtube_url: editYoutubeUrl.trim() || null,
        image_url: finalImageUrl,
      })
      .eq('id', selected.id)

    setSaving(false)
    onCatalogChange()
    setView('list')
  }

  const filtered = catalog.filter((ex) =>
    ex.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetView() }}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        {/* List view */}
        {view === 'list' && (
          <>
            <DialogHeader>
              <DialogTitle>Vybrat cvičení</DialogTitle>
            </DialogHeader>
            <input
              className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Hledat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex-1 overflow-y-auto flex flex-col gap-1 min-h-0">
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Žádná cvičení nenalezena.
                </p>
              )}
              {filtered.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent cursor-pointer group"
                  onClick={() => handleSelect(ex)}
                >
                  <span className="text-sm font-medium">{ex.name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={(e) => { e.stopPropagation(); openPreview(ex) }}
                    >
                      Náhled
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={(e) => { e.stopPropagation(); openEdit(ex) }}
                    >
                      Upravit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Preview view */}
        {view === 'preview' && selected && (
          <>
            <DialogHeader>
              <DialogTitle>{selected.name}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 min-h-0">
              {selected.description && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selected.description}
                </p>
              )}
              {selected.image_url && (
                <img
                  src={selected.image_url}
                  alt={selected.name}
                  className="w-full rounded-lg object-cover max-h-48"
                />
              )}
              {selected.youtube_url && getYouTubeEmbedUrl(selected.youtube_url) && (
                <div className="aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src={getYouTubeEmbedUrl(selected.youtube_url)!}
                    className="w-full h-full"
                    allowFullScreen
                    title="YouTube video"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setView('list')}>
                ← Zpět
              </Button>
              <Button size="sm" onClick={() => handleSelect(selected)}>
                Vybrat
              </Button>
              <Button variant="outline" size="sm" onClick={() => openEdit(selected)}>
                Upravit
              </Button>
            </div>
          </>
        )}

        {/* Edit view */}
        {view === 'edit' && selected && (
          <>
            <DialogHeader>
              <DialogTitle>Upravit cvičení</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 min-h-0">
              <input
                className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Název *"
              />
              <textarea
                className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={2}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Popis (volitelné)"
              />
              <div className="flex flex-col gap-1">
                <input
                  className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={editYoutubeUrl}
                  onChange={(e) => setEditYoutubeUrl(e.target.value)}
                  placeholder="YouTube URL (volitelné)"
                />
                {editYoutubeUrl && getYouTubeEmbedUrl(editYoutubeUrl) && (
                  <div className="mt-1 aspect-video rounded-md overflow-hidden">
                    <iframe
                      src={getYouTubeEmbedUrl(editYoutubeUrl)!}
                      className="w-full h-full"
                      allowFullScreen
                      title="YouTube náhled"
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {editImageUrl && !editImageFile && (
                  <img src={editImageUrl} alt="Fotka" className="w-full max-h-36 object-cover rounded-md" />
                )}
                {editImageFile && (
                  <img src={URL.createObjectURL(editImageFile)} alt="Náhled" className="w-full max-h-36 object-cover rounded-md" />
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setEditImageFile(e.target.files?.[0] ?? null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {editImageUrl || editImageFile ? 'Změnit fotku' : 'Přidat fotku'}
                </Button>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setView('list')}>
                ← Zpět
              </Button>
              <Button size="sm" disabled={saving} onClick={handleSaveEdit}>
                {saving ? 'Ukládám...' : 'Uložit'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
