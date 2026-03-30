import type { Training } from '@/types/training'
import { Button } from '@/components/ui/button'

interface Props {
  training: Training
  onView: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export function TrainingCard({ training, onView, onEdit, onDuplicate, onDelete }: Props) {
  function handleDelete() {
    if (confirm(`Smazat "${training.name}"?`)) onDelete()
  }

  return (
    <div className="border rounded-xl p-4 bg-card flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold text-lg leading-tight">{training.name}</h2>
        {training.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {training.description}
          </p>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" onClick={onView}>
          Zobrazit
        </Button>
        <Button size="sm" variant="outline" onClick={onEdit}>
          Upravit
        </Button>
        <Button size="sm" variant="outline" onClick={onDuplicate}>
          Duplikovat
        </Button>
        <Button size="sm" variant="destructive" onClick={handleDelete}>
          Smazat
        </Button>
      </div>
    </div>
  )
}
