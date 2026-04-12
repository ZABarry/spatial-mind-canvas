import { useRootStore } from '../store/rootStore'
import { SearchPanelBody } from './panels/SearchPanelBody'

export function SearchPalette() {
  const open = useRootStore((s) => s.searchOpen)

  if (!open) return null

  return (
    <div className="search-palette panel">
      <SearchPanelBody variant="desktop" />
    </div>
  )
}
