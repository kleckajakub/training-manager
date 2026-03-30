import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Training, TeamCategory, TrainingCategory } from '@/types/training'
import { TrainingCard } from '@/components/TrainingCard'
import { Button } from '@/components/ui/button'

// ─── Team picker ────────────────────────────────────────────────────────────

interface TeamPickerProps {
  teamCategories: TeamCategory[]
  trainingCounts: Record<string, number>
  onSelect: (teamId: string | null) => void
}

function TeamPicker({ teamCategories, trainingCounts, onSelect }: TeamPickerProps) {
  const navigate = useNavigate()

  const cards = [
    { id: null, name: 'Všechny tréninky', count: Object.values(trainingCounts).reduce((a, b) => a + b, 0) },
    ...teamCategories.map((c) => ({ id: c.id, name: c.name, count: trainingCounts[c.id] ?? 0 })),
  ]

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tréninky</h1>
        <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
          Nastavení
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <button
            key={card.id ?? 'all'}
            onClick={() => onSelect(card.id)}
            className="flex flex-col items-start p-4 border rounded-xl bg-card hover:bg-accent hover:border-primary transition-colors text-left"
          >
            <span className="font-semibold text-base leading-tight">{card.name}</span>
            <span className="text-sm text-muted-foreground mt-1">
              {card.count} {card.count === 1 ? 'trénink' : card.count >= 2 && card.count <= 4 ? 'tréninky' : 'tréninků'}
            </span>
          </button>
        ))}

      </div>
    </div>
  )
}

// ─── Training list ───────────────────────────────────────────────────────────

interface TrainingListViewProps {
  teamId: string | null
  teamName: string
  teamCategories: TeamCategory[]
  trainingCategories: TrainingCategory[]
  onBack: () => void
}

function TrainingListView({
  teamId,
  teamName,
  teamCategories,
  trainingCategories,
  onBack,
}: TrainingListViewProps) {
  const navigate = useNavigate()
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  useEffect(() => {
    loadTrainings()
  }, [teamId])

  async function loadTrainings() {
    let query = supabase.from('trainings').select('*').order('created_at', { ascending: false })
    if (teamId !== null) query = query.eq('team_category_id', teamId)
    const { data } = await query
    if (data) setTrainings(data)
    setLoading(false)
  }

  async function handleDuplicate(training: Training) {
    const { error } = await supabase.from('trainings').insert({
      name: `${training.name} (kopie)`,
      description: training.description,
      team_category_id: training.team_category_id,
      training_category_id: training.training_category_id,
    })
    if (!error) loadTrainings()
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
    const matchCategory =
      filterCategory === 'all' || t.training_category_id === filterCategory
    return matchSearch && matchCategory
  })

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>← Zpět</Button>
          <h1 className="text-2xl font-bold">{teamName}</h1>
        </div>
        <Button onClick={() => navigate(teamId ? `/new?team=${teamId}` : '/new')}>+ Nový trénink</Button>
      </div>

      <input
        className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring mb-3"
        placeholder="Hledat tréninky..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {trainingCategories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          <button
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${filterCategory === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'}`}
            onClick={() => setFilterCategory('all')}
          >
            Vše
          </button>
          {trainingCategories.map((c) => (
            <button
              key={c.id}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${filterCategory === c.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'}`}
              onClick={() => setFilterCategory(filterCategory === c.id ? 'all' : c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-center text-muted-foreground py-12">Načítání...</p>
      ) : filtered.length === 0 ? (
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

// ─── Root component ──────────────────────────────────────────────────────────

export function TrainingList() {
  const [teamCategories, setTeamCategories] = useState<TeamCategory[]>([])
  const [trainingCategories, setTrainingCategories] = useState<TrainingCategory[]>([])
  const [trainingCounts, setTrainingCounts] = useState<Record<string, number>>({})
  const [selectedTeam, setSelectedTeam] = useState<{ id: string | null; name: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMeta()
  }, [])

  async function loadMeta() {
    const [{ data: tc }, { data: trc }, { data: tr }] = await Promise.all([
      supabase.from('team_categories').select('*').order('position').order('name'),
      supabase.from('training_categories').select('*').order('position').order('name'),
      supabase.from('trainings').select('team_category_id'),
    ])
    if (tc) setTeamCategories(tc)
    if (trc) setTrainingCategories(trc)
    if (tr) {
      const counts: Record<string, number> = {}
      tr.forEach((t) => {
        const key = t.team_category_id ?? '__none__'
        counts[key] = (counts[key] ?? 0) + 1
      })
      setTrainingCounts(counts)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Načítání...</p>
      </div>
    )
  }

  if (selectedTeam === null) {
    return (
      <TeamPicker
        teamCategories={teamCategories}
        trainingCounts={trainingCounts}
        onSelect={(id) =>
          setSelectedTeam({
            id,
            name: id === null ? 'Všechny tréninky' : (teamCategories.find((c) => c.id === id)?.name ?? ''),
          })
        }
      />
    )
  }

  return (
    <TrainingListView
      teamId={selectedTeam.id}
      teamName={selectedTeam.name}
      teamCategories={teamCategories}
      trainingCategories={trainingCategories}
      onBack={() => { setSelectedTeam(null); loadMeta() }}
    />
  )
}
