import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { TeamCategory, TrainingCategory } from '@/types/training'
import { Button } from '@/components/ui/button'

interface CategorySectionProps<T extends { id: string; name: string }> {
  title: string
  items: T[]
  onAdd: (name: string) => Promise<string | null>
  onRename: (id: string, name: string) => Promise<string | null>
  onDelete: (id: string) => Promise<void>
}

function CategorySection<T extends { id: string; name: string }>({
  title,
  items,
  onAdd,
  onRename,
  onDelete,
}: CategorySectionProps<T>) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd() {
    if (!newName.trim()) return
    setSaving(true)
    setError(null)
    const err = await onAdd(newName.trim())
    if (err) setError(err)
    else setNewName('')
    setSaving(false)
  }

  async function handleRename(id: string) {
    if (!editingName.trim()) return
    setSaving(true)
    setError(null)
    const err = await onRename(id, editingName.trim())
    if (err) setError(err)
    else setEditingId(null)
    setSaving(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Smazat kategorii "${name}"? Tréninky v této kategorii o ni přijdou.`)) return
    await onDelete(id)
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          Chyba: {error}
        </p>
      )}

      <div className="flex flex-col gap-1">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">Žádné kategorie.</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-card">
            {editingId === item.id ? (
              <>
                <input
                  className="flex-1 border rounded px-2 py-1 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(item.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  autoFocus
                />
                <Button size="sm" disabled={saving} onClick={() => handleRename(item.id)}>
                  Uložit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                  Zrušit
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm">{item.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setEditingId(item.id); setEditingName(item.name) }}
                >
                  Upravit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(item.id, item.name)}
                >
                  Smazat
                </Button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
          placeholder="Nová kategorie..."
        />
        <Button type="button" onClick={handleAdd} disabled={saving || !newName.trim()}>
          Přidat
        </Button>
      </div>
    </div>
  )
}

export function SettingsPage() {
  const navigate = useNavigate()
  const [teamCategories, setTeamCategories] = useState<TeamCategory[]>([])
  const [trainingCategories, setTrainingCategories] = useState<TrainingCategory[]>([])

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    const [{ data: tc }, { data: trc }] = await Promise.all([
      supabase.from('team_categories').select('*').order('position').order('name'),
      supabase.from('training_categories').select('*').order('position').order('name'),
    ])
    if (tc) setTeamCategories(tc)
    if (trc) setTrainingCategories(trc)
  }

  async function addTeamCategory(name: string): Promise<string | null> {
    const { error } = await supabase
      .from('team_categories')
      .insert({ name, position: teamCategories.length })
    if (error) return error.message
    loadAll()
    return null
  }

  async function renameTeamCategory(id: string, name: string): Promise<string | null> {
    const { error } = await supabase.from('team_categories').update({ name }).eq('id', id)
    if (error) return error.message
    loadAll()
    return null
  }

  async function deleteTeamCategory(id: string) {
    await supabase.from('team_categories').delete().eq('id', id)
    loadAll()
  }

  async function addTrainingCategory(name: string): Promise<string | null> {
    const { error } = await supabase
      .from('training_categories')
      .insert({ name, position: trainingCategories.length })
    if (error) return error.message
    loadAll()
    return null
  }

  async function renameTrainingCategory(id: string, name: string): Promise<string | null> {
    const { error } = await supabase.from('training_categories').update({ name }).eq('id', id)
    if (error) return error.message
    loadAll()
    return null
  }

  async function deleteTrainingCategory(id: string) {
    await supabase.from('training_categories').delete().eq('id', id)
    loadAll()
  }

  return (
    <div className="p-4 max-w-2xl mx-auto pb-12">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" onClick={() => navigate('/')}>← Zpět</Button>
        <h1 className="text-2xl font-bold">Nastavení</h1>
      </div>

      <div className="flex flex-col gap-8">
        <CategorySection
          title="Týmové kategorie"
          items={teamCategories}
          onAdd={addTeamCategory}
          onRename={renameTeamCategory}
          onDelete={deleteTeamCategory}
        />

        <hr className="border-border" />

        <CategorySection
          title="Zaměření tréninku"
          items={trainingCategories}
          onAdd={addTrainingCategory}
          onRename={renameTrainingCategory}
          onDelete={deleteTrainingCategory}
        />
      </div>
    </div>
  )
}
