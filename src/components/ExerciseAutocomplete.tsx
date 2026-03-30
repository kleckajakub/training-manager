import { useEffect, useRef, useState } from 'react'

interface Props {
  value: string
  catalog: string[]
  onChange: (value: string) => void
  placeholder?: string
}

export function ExerciseAutocomplete({ value, catalog, onChange, placeholder }: Props) {
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const suggestions = value.trim()
    ? catalog.filter((name) =>
        name.toLowerCase().includes(value.toLowerCase()) &&
        name.toLowerCase() !== value.toLowerCase()
      )
    : catalog

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const showDropdown = open && focused && suggestions.length > 0

  return (
    <div ref={containerRef} className="relative">
      <input
        className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          setFocused(true)
          setOpen(true)
        }}
        onBlur={() => setFocused(false)}
      />
      {showDropdown && (
        <ul className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
          {suggestions.map((name) => (
            <li
              key={name}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
              onMouseDown={(e) => {
                e.preventDefault()
                onChange(name)
                setOpen(false)
              }}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
