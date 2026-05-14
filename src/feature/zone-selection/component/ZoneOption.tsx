import type { CoastalZone } from './zone-selection.types'

type ZoneOptionProps = {
  zone: CoastalZone
  isSelected: boolean
  onSelect: (zone: CoastalZone) => void
}

export function ZoneOption({ zone, isSelected, onSelect }: ZoneOptionProps) {
  return (
    <button
      type="button"
      className={isSelected ? 'zone-option is-selected' : 'zone-option'}
      onClick={() => onSelect(zone)}
      aria-pressed={isSelected}
    >
      <span className="zone-option__name">{zone.name}</span>
      <span className="zone-option__province">{zone.province}</span>
      <span className="zone-option__description">{zone.description}</span>
    </button>
  )
}
