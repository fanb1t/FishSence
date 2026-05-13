# 01 - Phase 1 Data Flow Diagram

ไฟล์นี้อธิบาย data flow หลักของ FishSence/FishSense Phase 1

## Design Decisions

- ผู้ใช้ไม่ต้องสมัครสมาชิกหรือ login
- ผู้ใช้เลือกพื้นที่จาก pilot coastal zones ที่ระบบเตรียมไว้ เช่น สงขลา/ระนอง
- ระบบดึงข้อมูลล่วงหน้าทุก 3 ชั่วโมงเฉพาะ active coastal zones
- Frontend อ่านผลล่าสุดจาก Supabase เพื่อให้ dashboard โหลดเร็ว
- ถ้า snapshot ล่าสุดเก่าเกินกำหนด ให้แสดง stale/fallback state
- TMD warning เป็นแหล่งคำเตือนทางการตั้งแต่ Phase 1 แต่เรียกผ่าน Edge Function เท่านั้น

## High-Level Data Flow

```mermaid
flowchart LR
  subgraph UserSide[User Side]
    fisher[ชาวประมง<br/>มือถือ/เบราว์เซอร์]
    web[React + Vite Dashboard<br/>ภาษาไทย / mobile-first]
  end

  subgraph Supabase[Supabase]
    db[(PostgreSQL)]
    cron[pg_cron<br/>ทุก 3 ชั่วโมง]
    fn[Edge Function<br/>refresh-coastal-weather]
  end

  subgraph External[External Data Sources]
    marine[Open-Meteo Marine API<br/>wave / swell / sea level / current]
    forecast[Open-Meteo Forecast API<br/>wind / gust / rain / pressure / visibility]
    tmd[TMD Warning Source<br/>official weather/marine warnings]
  end

  cron --> fn
  fn -->|อ่าน active zones| db
  fn --> marine
  fn --> forecast
  fn --> tmd
  fn -->|normalized snapshots| db
  fn -->|risk assessments| db

  fisher --> web
  web -->|เลือก coastal zone| db
  db -->|latest risk + forecast| web
  web --> fisher
```

## Scheduled Refresh Flow

```mermaid
sequenceDiagram
  participant Cron as Supabase pg_cron
  participant Edge as Edge Function
  participant DB as PostgreSQL
  participant Marine as Open-Meteo Marine
  participant Forecast as Open-Meteo Forecast
  participant TMD as TMD Warning Source

  Cron->>Edge: Trigger every 3 hours
  Edge->>DB: Load active coastal_zones
  DB-->>Edge: Songkhla/Ranong zones with lat/lng

  loop For each active coastal zone
    Edge->>Marine: Fetch marine hourly data
    Marine-->>Edge: wave, swell, sea_level, current
    Edge->>Forecast: Fetch weather hourly data
    Forecast-->>Edge: wind, gust, rain, pressure, visibility, weather_code
    Edge->>TMD: Fetch official warnings by area/config
    TMD-->>Edge: warning status or empty result
    Edge->>Edge: Normalize timezone/unit
    Edge->>Edge: Calculate tide/current indicators
    Edge->>Edge: Calculate Safe Score
    Edge->>DB: Insert weather_snapshots
    Edge->>DB: Insert tide_snapshots
    Edge->>DB: Insert risk_assessments
  end
```

## Dashboard Read Flow

```mermaid
sequenceDiagram
  actor User as ชาวประมง
  participant Web as React Dashboard
  participant DB as Supabase PostgreSQL

  User->>Web: เปิดเว็บ
  Web->>DB: Query active coastal_zones
  DB-->>Web: ส่งรายการพื้นที่ เช่น สงขลา/ระนอง
  User->>Web: เลือกพื้นที่ใกล้ตัว
  Web->>DB: Query latest risk_assessments by zone
  DB-->>Web: ส่ง Safe Score, risk level, reasons, forecast
  Web->>Web: ตรวจว่า data freshness ยังใช้ได้ไหม

  alt ข้อมูลยังสด
    Web-->>User: แสดง Dashboard ปกติ
  else ข้อมูลเก่าแต่ยังมี snapshot
    Web-->>User: แสดง Dashboard พร้อม fallback/stale warning
  else ไม่มีข้อมูล
    Web-->>User: แสดง error state ภาษาไทยและแนะนำลองใหม่
  end
```

## Data Freshness Rule

ค่าแนะนำสำหรับ MVP:

- `fresh`: ข้อมูลอัปเดตไม่เกิน 3 ชั่วโมง 30 นาที
- `stale`: ข้อมูลเก่ากว่า 3 ชั่วโมง 30 นาที แต่ยังไม่เกิน 12 ชั่วโมง
- `unavailable`: ไม่มี snapshot หรือเก่ากว่า 12 ชั่วโมง

เหตุผล: cron refresh ทุก 3 ชั่วโมง จึงควรเผื่อ delay เล็กน้อย แต่ต้องไม่ทำให้ผู้ใช้เข้าใจว่าข้อมูลเก่าคือข้อมูลสด

## Frontend Data Contract

Frontend ควรอ่านข้อมูลที่พร้อมแสดงแล้ว ไม่ควรคำนวณ risk logic หลักเอง

```ts
type ZoneDashboardResult = {
  zone: {
    id: string
    name: string
    province: string
    lat: number
    lng: number
  }
  current: {
    assessedAt: string
    safeScore: number
    riskLevel: 'green' | 'yellow' | 'red'
    summaryTh: string
    reasonCodes: string[]
    hardStopFlags: string[]
    dataFreshness: 'fresh' | 'stale' | 'unavailable'
  }
  hourly48h: Array<{
    time: string
    safeScore: number
    riskLevel: 'green' | 'yellow' | 'red'
    waveHeightM: number | null
    windGustKmh: number | null
    precipitationMm: number | null
    tideStrength: 'weak' | 'normal' | 'strong' | null
  }>
  daily7d: Array<{
    date: string
    minScore: number
    worstRiskLevel: 'green' | 'yellow' | 'red'
    mainReasons: string[]
  }>
}
```

## Notes

- On-demand GPS/pin อิสระยังไม่ใช่ MVP แรก
- ถ้าจะเพิ่ม GPS ภายหลัง ให้ทำเป็น flow แยก เพราะเกี่ยวกับ privacy และ snapshot storage policy
- TMD endpoint/feed จริงควรเป็น config ใน `data_sources` หรือ `app_config` ไม่ hardcode ใน frontend

