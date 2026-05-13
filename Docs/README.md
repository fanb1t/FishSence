# FishSence Phase 1 Start Guide

อัปเดต: 2026-05-13

เอกสารนี้สรุปสิ่งที่ต้องรู้และสิ่งที่ต้องทำก่อนเริ่ม Phase 1 ของโปรเจกต์ FishSence/FishSense โดยใช้ private local knowledge base เป็นบริบทหลัก และอ่านจาก `meta/index.md` ก่อนตามที่กำหนด

แหล่งบริบทที่ใช้:

- private local knowledge base: `meta/index.md`
- `wiki/sources/projects/FishSense SRS v1.1 - Source Summary.md`
- `wiki/entities/projects/FishSense.md`
- `raw/sources/projects/FishSense_SRS_v1.1.docx`
- React/Web summary ที่เกี่ยวข้องเฉพาะการเริ่ม frontend: React foundation/state และ responsive design

## เป้าหมาย Phase 1

Phase 1 คือระบบประเมินความเสี่ยงก่อนออกเรือชายฝั่ง โดยยังไม่เริ่มจาก AI และยังไม่เน้นทำนายปลา เป้าหมายคือให้ผู้ใช้ตอบคำถามให้ได้เร็วว่า "วันนี้หรือพรุ่งนี้ควรออกเรือไหม และต้องระวังอะไร"

ผลลัพธ์หลักที่ต้องมี:

- Safe Score 0-100
- risk level สีเขียว/เหลือง/แดง
- คำอธิบายภาษาไทยสั้น ๆ เช่น ออกได้, ระวัง, ไม่ควรออก
- เหตุผล 3 อันดับแรก เช่น คลื่นสูง, ลมกระโชกแรง, ฝนหนัก, น้ำเกิด/กระแสน้ำแรง, มีคำเตือน
- พยากรณ์รายชั่วโมงสำหรับ 48 ชั่วโมงแรก
- สรุปรายวันสำหรับ 7 วัน
- snapshot ข้อมูล weather/tide/risk เพื่อ audit และใช้ต่อใน Phase 2

ข้อควรจำสำคัญ: ระบบเป็น decision support ไม่ใช่เครื่องมือนำร่องเรือ และไม่ใช่ประกาศเตือนภัยทางการ

## Stack ที่ควรใช้

ตาม SRS:

- Frontend: React, Vite, TypeScript, Tailwind CSS
- Backend/BaaS: Supabase
- Database: Supabase PostgreSQL
- Auth: Supabase Auth
- Server-side integration: Supabase Edge Functions
- Scheduled fetch: Supabase Edge Function + `pg_cron` ทุก 3 ชั่วโมง
- Hosting: Vercel สำหรับ frontend, Supabase Cloud สำหรับ backend

สถานะ repo ตอนนี้:

- โปรเจกต์เป็น Vite + React + TypeScript แล้ว
- `package.json` ปัจจุบันใช้ React `^19.2.6`
- SRS ระบุ React 18 ดังนั้นก่อนเริ่มควรเลือกให้ชัดว่าจะใช้ React 19 ต่อ หรือ pin React 18 ให้ตรงเอกสาร
- ยังไม่มี Tailwind CSS, Supabase client, schema, Edge Functions, หรือ Safe Score logic

แพ็กเกจที่ควรเพิ่มใน Phase 1:

- `@supabase/supabase-js` สำหรับเชื่อม Supabase จาก frontend
- `tailwindcss` และ tooling ที่เกี่ยวข้อง ถ้าจะทำตาม stack ใน SRS
- `zod` สำหรับ validate/normalize API response และ input
- map library ค่อยเลือกเมื่อจะทำ UX เลือกพิกัดจริง เช่น Leaflet หรือ MapLibre

## API ที่ต้องรู้

Primary source:

- Open-Meteo Marine Forecast API ใช้ข้อมูลคลื่น, swell, wave period, sea level, current, sea surface temperature
- Open-Meteo Forecast API ใช้ลม, ลมกระโชก, ฝน, weather code, pressure, visibility, cloud cover, CAPE

Endpoint หลักจาก SRS:

```text
https://marine-api.open-meteo.com/v1/marine?latitude={lat}&longitude={lng}&hourly=wave_height,wave_direction,wave_period,swell_wave_height,wind_wave_height,sea_level_height_msl,ocean_current_velocity,ocean_current_direction,sea_surface_temperature&forecast_days=7&timezone=Asia/Bangkok
```

```text
https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&hourly=wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation,rain,showers,weather_code,pressure_msl,cloud_cover,visibility,cape&forecast_days=7&timezone=Asia/Bangkok&wind_speed_unit=kmh
```

Optional/future sources:

- WorldTides สำหรับ high/low tide ที่อ่านง่ายและแม่นกว่า
- Stormglass สำหรับข้อมูล marine/tide เชิงพาณิชย์
- TMD หรือ OpenWeather Alerts สำหรับคำเตือนทางการ/fallback

หลักการสำคัญ: ดึง API ผ่าน Supabase Edge Function เท่านั้น โดยเฉพาะแหล่งที่ต้องใช้ API key ห้ามวาง key ใน client

## Safe Score Phase 1

เริ่มจากคะแนน 100 แล้วหักตามปัจจัยเสี่ยง พร้อมเก็บ `reason_codes`

กฎจาก SRS v1.1:

- Wave Risk สูงสุด 35 คะแนน
- Wind Risk สูงสุด 25 คะแนน
- Rain/Storm Risk สูงสุด 15 คะแนน
- Tide/Current Risk สูงสุด 15 คะแนน
- Official Alert Risk สูงสุด 20 คะแนน

เกณฑ์ผลลัพธ์:

- 70-100 = ออกได้แต่ยังต้องดูสถานการณ์จริง
- 40-69 = ระวัง ควรเลื่อนหรือเลือกช่วงเวลาปลอดภัยกว่า
- 0-39 = ไม่ควรออกเรือ

Hard stop:

- คลื่นสูง >= 3.0 เมตร
- ลมกระโชก >= 55 กม./ชม.
- มี alert รุนแรง
- ฝนฟ้าคะนองหนัก

ถ้ามี hard stop ให้แสดงระดับแดง แม้คะแนนรวมยังดูสูง

## Data Model เริ่มต้น

ตารางที่ควรมีตั้งแต่ Phase 1:

- `profiles`: ข้อมูลผู้ใช้, ประเภทเรือ, ท่าเรือหลัก, พิกัดหลัก
- `coastal_zones`: พื้นที่ชายฝั่ง/ท่าเรือ/จุดประจำ
- `weather_snapshots`: snapshot จาก Open-Meteo และคะแนนที่คำนวณได้
- `tide_snapshots`: ข้อมูลน้ำขึ้นลง น้ำเกิด/น้ำตาย กระแสน้ำ
- `risk_assessments`: ผลประเมิน Safe Score รายช่วงเวลา

ตารางที่เตรียมไว้สำหรับ Phase 2/3:

- `trip_logs`
- `fish_hotspot_logs`
- `restricted_areas`
- `fish_observations`

ฟิลด์สำคัญของ `weather_snapshots`:

- `zone_id`
- `fetched_at`
- `source`
- `wave_height`
- `wave_period`
- `swell_wave_height`
- `wind_speed`
- `wind_gust`
- `wind_dir`
- `precipitation`
- `pressure_msl`
- `visibility`
- `weather_code`
- `sea_level_height_msl`
- `ocean_current_velocity`
- `ocean_current_direction`
- `safe_score`
- `risk_level`
- `reason_codes`
- `raw_api_payload` หรือ normalized payload สำหรับ audit

## งานที่ต้องทำเป็นลำดับ

1. เคลียร์ชื่อโปรเจกต์

   Repo ใช้ชื่อ `FishSence` แต่เอกสารใช้ `FishSense` ควรตัดสินใจก่อนว่าจะใช้ชื่อไหนใน UI, package, docs และ Supabase project

2. ตั้งค่า frontend base

   - เปลี่ยนหน้า Vite template ให้เป็น dashboard ของ FishSense
   - เพิ่ม Tailwind หรือระบบ styling ที่เลือก
   - วาง mobile-first layout
   - ทำ UI ภาษาไทยและอ่านง่ายบนมือถือ

3. ตั้งค่า Supabase

   - สร้าง project
   - ตั้ง env vars ใน `.env.local`
   - เพิ่ม Supabase client
   - สร้าง migration/schema สำหรับตาราง Phase 1
   - เปิด RLS ทุกตารางที่เกี่ยวกับผู้ใช้

4. ทำ Edge Function ดึงข้อมูล Open-Meteo

   - รับ `lat`, `lng`, `zone_id`
   - ดึง Marine API และ Forecast API
   - normalize หน่วยและ timezone เป็น `Asia/Bangkok`
   - บันทึก snapshot
   - fallback เป็น snapshot ล่าสุดเมื่อ API ล่ม

5. ทำ Safe Score engine

   - แยกเป็น pure TypeScript function
   - input เป็น normalized hourly forecast
   - output เป็น `score`, `risk_level`, `reason_codes`, `summary_th`, `hard_stop_flags`
   - เขียน test สำหรับ edge cases เช่น คลื่น 3 เมตร, ลมกระโชก 55 กม./ชม., ฝนหนัก

6. ทำ dashboard Phase 1

   - เลือกพื้นที่จากท่าเรือ/GPS/favorite zone
   - แสดง score ปัจจุบัน
   - แสดงเหตุผล 3 อันดับแรก
   - แสดงรายชั่วโมง 48 ชั่วโมง
   - แสดงสรุป 7 วัน
   - แสดงเวลาข้อมูลล่าสุดและ disclaimer

7. ทำ Auth แบบพอดีกับ MVP

   - ผู้ใช้ไม่ login ดูอากาศได้
   - login แล้วจึงบันทึก favorite zone หรือข้อมูลส่วนตัว
   - Magic Link เป็น Must Have
   - SMS OTP เป็น Should Have

## ความรู้ที่ต้องมีก่อนเริ่ม

Frontend:

- React component ต้อง pure และไม่ทำ side effect ระหว่าง render
- ใช้ Hooks ที่ top level เท่านั้น
- state เป็น snapshot ต้องหลีกเลี่ยง duplicated/redundant state
- ใช้ derived data ระหว่าง render เมื่อคำนวณได้จาก props/state
- object/array ใน state ต้อง replace ไม่ mutate
- responsive design ต้อง mobile-first ไม่ใช่แค่ย่อหน้าจอให้ไม่ล้น

Backend/Supabase:

- PostgreSQL schema design
- Row Level Security และ policy ต่อ user/owner
- Supabase Auth และ Magic Link
- Edge Functions สำหรับ server-side API call
- `pg_cron` หรือ scheduled job สำหรับ refresh data ทุก 3 ชั่วโมง

Domain:

- ความสูงคลื่น, swell, wave period
- ลมเฉลี่ยกับลมกระโชก
- ฝนหนัก, weather code, visibility, CAPE
- น้ำขึ้นลง, tide range, น้ำเกิด/น้ำตาย
- กระแสน้ำ และข้อจำกัดของข้อมูล near-shore
- การสื่อสารความเสี่ยงแบบไม่ให้ผู้ใช้เข้าใจว่าเป็นประกาศทางการ

Legal/privacy:

- ถ้าเก็บพิกัดหรือข้อมูลผู้ใช้ ต้องมี consent และ Privacy Policy
- ข้อมูลผู้ใช้ต้องอยู่ใต้ RLS
- ข้อมูล hotspot ใน Phase 2 ต้อง private หรือ aggregate by default

## Acceptance Criteria Phase 1

- Dashboard โหลดสมบูรณ์ภายใน 3 วินาทีบน 4G
- ผู้ใช้ชาวประมงพื้นบ้านเห็น Safe Score ได้ภายใน 2 tap จาก home screen
- Edge Function ดึงข้อมูลจาก Open-Meteo เสร็จภายใน 10 วินาที
- แสดง forecast 7 วัน และรายชั่วโมง 48 ชั่วโมงแรก
- แสดง Safe Score สีเขียว/เหลือง/แดง พร้อมข้อความภาษาไทย
- แสดง reason 3 อันดับแรก
- ถ้า API ล่มต้อง fallback เป็น snapshot ล่าสุดและบอกเวลาอัปเดต
- มี disclaimer ว่าเป็นข้อมูลประกอบการตัดสินใจ ไม่ใช่เครื่องมือนำร่องหรือประกาศทางการ
- API key ทุกตัวอยู่ฝั่ง server/Edge Function เท่านั้น

## คำถามที่ต้องตัดสินใจก่อนลงมือจริง

- Pilot area แรกจะเป็นจังหวัด/ชุมชนไหน เช่น สงขลา ระนอง หรือพื้นที่อื่น
- จะใช้ชื่อ `FishSence` หรือ `FishSense`
- จะใช้ React 19 ตาม repo ปัจจุบัน หรือปรับให้ตรง SRS ที่ระบุ React 18
- threshold ของเรือพื้นบ้านกับเรือพาณิชย์ต่างกันอย่างไร
- จะเริ่มด้วย Open-Meteo อย่างเดียว หรือเตรียม WorldTides/TMD ตั้งแต่ schema แรก
- จะเลือก map library อะไรสำหรับเลือกพิกัด
- ข้อความ disclaimer ภาษาไทยที่ใช้จริงควรเขียนแบบไหนให้ชัดแต่ไม่ทำให้ผู้ใช้กลัวเกินไป

## Phase 1 ไม่ควรทำตอนนี้

- AI ทำนายชนิดปลา
- Marketplace
- Cold Chain
- FinTech
- Native mobile app
- Public fish hotspot
- พื้นที่ห้ามแบบ user-generated public โดยไม่มี admin review
