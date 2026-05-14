import { useState } from 'react'
import { ZoneSelector } from './ZoneSelector'
import { PILOT_ZONES } from './zone-selection.constants'
import type { CoastalZone } from './zone-selection.types'
import { ZoneSearching } from './zone-searching'
import ButtonVerifySearch from './buttonverifysearch'
export function ZoneSelectionSection() {
  const [selectedZone, setSelectedZone] = useState<CoastalZone>(PILOT_ZONES[0])
  const [searchValue, setSearchValue] = useState('')

  return (
    <section className="zone-selection" aria-labelledby="zone-selection-title">
      <div className="zone-selection__header">
        <h2 id="zone-selection-title">เลือกพื้นที่ติดตาม</h2>
        <p>
          ข้อมูลความปลอดภัยทางทะเลที่แม่นยำรายพื้นที่
        </p>
      </div>
      <ZoneSearching value={searchValue} onChange={setSearchValue} />
      <ButtonVerifySearch />

      <ZoneSelector
        zones={PILOT_ZONES}
        selectedZoneId={selectedZone.id}
        onZoneChange={setSelectedZone}
      />

      <div className="selected-zone" aria-live="polite">
        <span>พื้นที่ที่เลือก</span>
        <strong>{selectedZone.name}</strong>
        <p>{selectedZone.description}</p>
      </div>
    </section>
  )
}
