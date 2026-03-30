import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Training, TeamCategory, TrainingCategory } from '@/types/training'
import { TrainingCard } from '@/components/TrainingCard'
import { Button } from '@/components/ui/button'

export function TrainingList() {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [teamCategories, setTeamCategories] = useState<TeamCategory[]>([])
  const [trainingCategories, setTrainingCategories] = useState<TrainingCategory[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [filterTeam, setFilterTeam] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const navigate = useNavigate()

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    const [{ data: tr }, { data: tc }, { data: trc }] = await Promise.all([
      supabase.from('trainings').select('*').order('created_at', { ascending: false }),
      supabase.from('team_categories').select('*').order('position').order('name'),
      supabase.from('training_categories').select('*').order('position').order('name'),
    ])
    if (tr) setTrainings(tr)
    if (tc) setTeamCategories(tc)
    if (trc) setTrainingCategories(trc)
    setLoading(false)
  }

  async function handleDuplicate(training: Training) {
    const { error } = await supabase.from('trainings').insert({
      name: `${training.name} (kopie)`,
      description: training.description,
      team_category_id: training.team_category_id,
      training_category_id: training.training_category_id,
    })
    if (!error) loadAll()
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('trainings').delete().eq('id', id)
    if (!error) setTrainings((prev) => prev.filter((t) => t.id !== id))
  }

  const filtered = trainings.filter((t) => {
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description ?? '').toLowerCase().includes(search.toLowerCase())
    const matchTeam = filterTeam === 'all' || t.team_category_id === filterTeam
    const matchCategory =
      filterCategory === 'all' || t.training_category_id === filterCategory
    return matchSearch && matchTeam && matchCategory
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Načítání...</p>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Tréninky</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
            Nastavení
          </Button>
          <Button onClick={() => navigate('/new')}>+ Nový trénink</Button>
        </div>
      </div>

      {/* Search */}
      <input
        className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring mb-3"
        placeholder="Hledat tréninky..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Team filter */}
      {teamCategories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-2">
          <button
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${filterTeam === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'}`}
            onClick={() => setFilterTeam('all')}
          >
            Vše
          </button>
          {teamCategories.map((c) => (
            <button
              key={c.id}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${filterTeam === c.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'}`}
              onClick={() => setFilterTeam(filterTeam === c.id ? 'all' : c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Training category filter */}
      {trainingCategories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          <button
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${filterCategory === 'all' ? 'bg-secondary text-secondary-foreground border-secondary' : 'border-border hover:bg-accent'}`}
            onClick={() => setFilterCategory('all')}
          >
            Vše
          </button>
          {trainingCategories.map((c) => (
            <button
              key={c.id}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${filterCategory === c.id ? 'bg-secondary text-secondary-foreground border-secondary' : 'border-border hover:bg-accent'}`}
              onClick={() => setFilterCategory(filterCategory === c.id ? 'all' : c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          {trainings.length === 0 ? 'Žádné tréninky. Vytvořte první!' : 'Žádné tréninky neodpovídají filtru.'}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((training) => (
            <TrainingCard
              key={training.id}
              training={training}
              teamCategories={teamCategories}
              trainingCategories={trainingCategories}
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
