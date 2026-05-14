import { ZoneOption } from './ZoneOption'
import type { CoastalZone } from './zone-selection.types'

type ZoneSelectorProps = {
  zones: CoastalZone[]
  selectedZoneId: string
  onZoneChange: (zone: CoastalZone) => void
}

export function ZoneSelector({
  zones,
  selectedZoneId,
  onZoneChange,
}: ZoneSelectorProps) {
  return (
    <div className="zone-selector" aria-label="เลือกพื้นที่ชายฝั่ง">
      {zones.map((zone) => (
        <ZoneOption
          key={zone.id}
          zone={zone}
          isSelected={zone.id === selectedZoneId}
          onSelect={onZoneChange}
        />
      ))}
    </div>
  )
}
