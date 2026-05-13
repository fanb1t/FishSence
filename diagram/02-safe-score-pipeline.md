# 02 - Phase 1 Safe Score Pipeline

ไฟล์นี้อธิบาย pipeline การคำนวณ Safe Score ของ FishSence/FishSense Phase 1

## Design Decisions

- MVP แรกใช้ threshold ชุดเดียวสำหรับทุก pilot zone
- Safe Score เป็น rule-based
- คำนวณฝั่ง Supabase Edge Function ไม่ใช่ frontend
- ต้องเก็บ reason codes และ hard stop flags เพื่อ audit ย้อนหลัง
- TMD official warning มีผลต่อ risk level ตั้งแต่ Phase 1

## Pipeline Overview

```mermaid
flowchart LR
  marine[Marine Data<br/>wave / swell / sea level / current]
  forecast[Forecast Data<br/>wind / gust / rain / pressure / visibility / weather_code]
  tmd[TMD Warning<br/>official warning]
  normalize[Normalize<br/>timezone / units / missing values]
  align[Align Hourly Timeline<br/>48h hourly + 7d summary]
  tide[Tide & Current Indicators<br/>tide range / tide strength / current risk]
  scoring[Risk Scoring Rules<br/>wave / wind / rain / tide / alert]
  hardstop[Hard Stop Evaluation]
  reasons[Reason Code Ranking<br/>Top 3 Thai reasons]
  output[Risk Assessment Output<br/>score / level / summary_th]
  db[(risk_assessments)]

  marine --> normalize
  forecast --> normalize
  tmd --> normalize
  normalize --> align
  align --> tide
  tide --> scoring
  normalize --> scoring
  scoring --> hardstop
  hardstop --> reasons
  reasons --> output
  output --> db
```

## Risk Categories

```mermaid
flowchart TB
  input[Normalized Hourly Forecast]

  input --> wave[Wave Risk<br/>max 35]
  input --> wind[Wind Risk<br/>max 25]
  input --> rain[Rain/Storm Risk<br/>max 15]
  input --> tide[Tide/Current Risk<br/>max 15]
  input --> alert[Official Alert Risk<br/>max 20]

  wave --> score[100 - total deductions]
  wind --> score
  rain --> score
  tide --> score
  alert --> score

  score --> clamp[Clamp score 0-100]
  clamp --> level[Risk Level<br/>green / yellow / red]
  level --> summary[Thai Summary<br/>ออกได้ / ระวัง / ไม่ควรออก]
```

## Hard Stop Rules

Hard stop คือเงื่อนไขที่บังคับให้แสดงระดับแดง แม้คะแนนรวมยังดูไม่ต่ำพอ

```mermaid
flowchart TD
  start[Hourly Assessment]
  wave{wave_height >= 3.0m?}
  gust{wind_gust >= 55 km/h?}
  storm{heavy thunderstorm / severe rain?}
  tmd{TMD severe warning?}
  red[Force risk_level = red<br/>Add hard_stop_flags]
  normal[Use score-derived risk level]

  start --> wave
  wave -->|yes| red
  wave -->|no| gust
  gust -->|yes| red
  gust -->|no| storm
  storm -->|yes| red
  storm -->|no| tmd
  tmd -->|yes| red
  tmd -->|no| normal
```

## Risk Level Mapping

```mermaid
flowchart LR
  score[Safe Score]
  green[70-100<br/>ออกได้<br/>แต่ยังต้องดูสถานการณ์จริง]
  yellow[40-69<br/>ระวัง<br/>ควรเลื่อนหรือเลือกช่วงที่ปลอดภัยกว่า]
  red[0-39<br/>ไม่ควรออกเรือ]

  score --> green
  score --> yellow
  score --> red
```

## Reason Code Model

Reason codes ควรเป็น structured data เพื่อให้ frontend แสดงภาษาไทยได้ง่าย และ audit คะแนนย้อนหลังได้

```ts
type RiskReasonCode =
  | 'WAVE_HIGH'
  | 'SWELL_UNSTABLE'
  | 'WIND_GUST_STRONG'
  | 'WIND_SPEED_SUSTAINED'
  | 'RAIN_HEAVY'
  | 'VISIBILITY_LOW'
  | 'TIDE_STRONG'
  | 'CURRENT_STRONG'
  | 'TMD_WARNING'

type RiskReason = {
  code: RiskReasonCode
  severity: 'info' | 'warning' | 'danger'
  deduction: number
  metric: string
  value: number | string | null
  messageTh: string
}
```

ตัวอย่าง:

```json
[
  {
    "code": "WAVE_HIGH",
    "severity": "danger",
    "deduction": 25,
    "metric": "wave_height",
    "value": 2.4,
    "messageTh": "คลื่นสูง 2.4 เมตร"
  },
  {
    "code": "WIND_GUST_STRONG",
    "severity": "warning",
    "deduction": 18,
    "metric": "wind_gust",
    "value": 48,
    "messageTh": "ลมกระโชกแรง 48 กม./ชม."
  }
]
```

## Single Threshold MVP

ใช้ threshold ชุดเดียวก่อน เพื่อให้ Phase 1 ออกแบบง่ายและตรวจสอบได้

```mermaid
flowchart TB
  config[app_config.safe_score_thresholds<br/>version = phase1_default]
  edge[Edge Function]
  wave[Wave Rules]
  wind[Wind Rules]
  rain[Rain Rules]
  tide[Tide Rules]
  alert[Alert Rules]

  config --> edge
  edge --> wave
  edge --> wind
  edge --> rain
  edge --> tide
  edge --> alert
```

ในอนาคตค่อยเพิ่ม threshold แยกตาม:

- ประเภทเรือ
- ฝั่งอ่าวไทย/อันดามัน
- ฤดูกาลมรสุม
- zone-specific risk profile

## Output Shape

```ts
type RiskAssessment = {
  zoneId: string
  assessedAt: string
  validFor: string
  score: number
  level: 'green' | 'yellow' | 'red'
  summaryTh: string
  topReasons: RiskReason[]
  hardStopFlags: string[]
  recommendedWindowStart: string | null
  recommendedWindowEnd: string | null
  sourceSnapshotIds: {
    weatherSnapshotId: string
    tideSnapshotId: string | null
    tmdWarningId: string | null
  }
}
```

## Thai Summary Rules

ตัวอย่าง mapping เบื้องต้น:

- green: `ออกได้ แต่ควรตรวจสภาพอากาศจริงก่อนออกเรือ`
- yellow: `ควรระวังหรือเลือกช่วงเวลาที่ปลอดภัยกว่า`
- red: `ไม่ควรออกเรือในช่วงนี้`

ข้อความต้องสั้น ชัด และไม่สื่อว่าแอปเป็นประกาศทางการ

