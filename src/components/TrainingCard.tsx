import type { Training } from '@/types/training'
import { Button } from '@/components/ui/button'

interface Props {
  training: Training
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export function TrainingCard({ training, onEdit, onDuplicate, onDelete }: Props) {
  function handleDelete() {
    if (confirm(`Delete "${training.name}"?`)) onDelete()
  }

  return (
    <div className="border rounded-xl p-4 bg-card flex flex-col gap-3">
      {training.image_url && (
        <img
          src={training.image_url}
          alt={training.name}
          className="w-full h-40 object-cover rounded-lg"
        />
      )}

      <div className="flex flex-col gap-1">
        <h2 className="font-semibold text-lg leading-tight">{training.name}</h2>
        {training.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {training.description}
          </p>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={onEdit}>
          Edit
        </Button>
        <Button size="sm" variant="outline" onClick={onDuplicate}>
          Duplicate
        </Button>
        <Button size="sm" variant="destructive" onClick={handleDelete}>
          Delete
        </Button>
      </div>
    </div>
  )
}
