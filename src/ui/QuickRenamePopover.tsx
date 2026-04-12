import { useEffect, useId, useRef, useState } from 'react'

type QuickRenamePopoverProps = {
  initialTitle: string
  onSave: (title: string) => void
  onCancel: () => void
}

/**
 * Inline rename for desktop quick actions (avoids `window.prompt`).
 */
export function QuickRenamePopover({ initialTitle, onSave, onCancel }: QuickRenamePopoverProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(initialTitle)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  return (
    <form
      className="quick-rename-popover"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(value.trim() || 'Untitled')
      }}
    >
      <label htmlFor={id} className="sr-only">
        Node title
      </label>
      <input
        id={id}
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation()
            onCancel()
          }
        }}
      />
      <div className="quick-rename-actions">
        <button type="submit">Save</button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
