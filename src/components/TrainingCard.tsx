import type { Training, TeamCategory, TrainingCategory } from '@/types/training'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Props {
  training: Training
  teamCategories: TeamCategory[]
  trainingCategories: TrainingCategory[]
  onView: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export function TrainingCard({
  training,
  teamCategories,
  trainingCategories,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
}: Props) {
  const teamCategory = teamCategories.find((c) => c.id === training.team_category_id)
  const trainingCategory = trainingCategories.find(
    (c) => c.id === training.training_category_id
  )

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (confirm(`Smazat "${training.name}"?`)) onDelete()
  }

  return (
    <div
      className="border rounded-xl p-4 bg-card flex flex-col gap-3 cursor-pointer hover:bg-accent transition-colors"
      onClick={onView}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-semibold text-lg leading-tight">{training.name}</h2>
          <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
            {teamCategory && (
              <Badge variant="secondary">{teamCategory.name}</Badge>
            )}
            {trainingCategory && (
              <Badge variant="outline">{trainingCategory.name}</Badge>
            )}
          </div>
        </div>
        {training.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {training.description}
          </p>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onEdit() }}>
          Upravit
        </Button>
        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onDuplicate() }}>
          Duplikovat
        </Button>
        <Button size="sm" variant="destructive" onClick={handleDelete}>
          Smazat
        </Button>
      </div>
    </div>
  )
}
