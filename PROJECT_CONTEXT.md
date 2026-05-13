# FishSence Project Context

อัปเดตล่าสุด: 2026-05-13

ไฟล์นี้คือบันทึกสรุปงานและบริบทหลักของโปรเจกต์ เพื่อให้กลับมาอ่านครั้งต่อไปแล้วเข้าใจทิศทางของ FishSence/FishSense ได้ทันที

## แหล่งบริบทหลัก

ใช้ private local knowledge base เป็นบริบทหลัก

เวลาเริ่มงานเกี่ยวกับโปรเจกต์นี้ ให้อ่าน `meta/index.md` ใน private knowledge base ก่อน

หน้าที่เกี่ยวข้องโดยตรง:

- `wiki/sources/projects/FishSense SRS v1.1 - Source Summary.md`
- `wiki/entities/projects/FishSense.md`
- `raw/sources/projects/FishSense_SRS_v1.1.docx`

## Product Direction

FishSence/FishSense เป็นเว็บแอปช่วยชาวประมงชายฝั่งไทยตัดสินใจก่อนออกเรือ โดยดูจากสภาพอากาศทะเล คลื่น ลม ฝน น้ำขึ้นลง กระแสน้ำ และความเสี่ยงต่าง ๆ ตามพื้นที่หรือพิกัดที่ผู้ใช้อยู่

คำถามหลักของ Phase 1:

```text
วันนี้หรือพรุ่งนี้ บริเวณนี้ควรออกเรือไหม และต้องระวังอะไร?
```

Phase 1 ต้องเป็นระบบดูข้อมูล/ประเมินความเสี่ยงก่อนออกเรือ ไม่ใช่ระบบ AI ทำนายปลา และไม่ใช่ marketplace

## Phase 1 Scope

Phase 1 แรก:

- ใช้ React + Vite + TypeScript เป็น frontend
- ใช้ Supabase เป็น backend/BaaS
- ใช้ Supabase PostgreSQL เก็บ snapshot และผลประเมิน
- ใช้ Supabase Edge Functions ดึง Open-Meteo APIs และคำนวณผล
- ใช้ Open-Meteo Marine API สำหรับคลื่น ระดับน้ำทะเล กระแสน้ำ อุณหภูมิผิวน้ำ
- ใช้ Open-Meteo Forecast API สำหรับลม ลมกระโชก ฝน pressure visibility weather code และ storm proxy
- ใช้ TMD เป็นแหล่งคำเตือนทางการตั้งแต่ Phase 1 ผ่าน adapter/config ฝั่ง Edge Function
- แสดง Safe Score, risk level, reason codes, forecast 48 ชั่วโมงแรก และสรุป 7 วัน
- ต้อง mobile-first และใช้ภาษาไทย
- ผู้ใช้ไม่ต้องสมัครสมาชิกหรือ login เพื่อดูผลใน Phase 1 แรก

สิ่งที่ไม่ทำใน Phase 1 แรก:

- ระบบสมัครสมาชิกเป็น requirement หลัก
- AI ทำนายชนิดปลา
- fish hotspot
- restricted area แบบ public
- marketplace
- cold chain
- FinTech
- native mobile app

## Important Decisions

- Phase 1 เริ่มจาก safety/weather risk assessment ก่อน ไม่เริ่มจาก AI
- Pilot area แรกใช้พื้นที่ตายตัว เช่น สงขลาและระนอง ให้ผู้ใช้เลือกบริเวณของตัวเองจากรายการ `coastal_zones`
- ระบบดึงข้อมูลล่วงหน้าทุก 3 ชั่วโมงเฉพาะ `coastal_zones` ที่กำหนดไว้
- MVP แรกใช้ Safe Score threshold ชุดเดียวก่อน ยังไม่แยกประเภทเรือหรือภูมิภาค
- TMD เป็น official warning source ตั้งแต่แรก โดย endpoint/feed จริงต้องทำเป็น config และเรียกผ่าน Edge Function
- Safe Score เป็น rule-based ก่อน
- tide/current ใช้เป็นข้อมูลประกอบ ไม่ใช่ navigation-grade data
- dashboard ต้องตอบ go/no-go เร็วที่สุด
- API key และ external API calls ต้องอยู่ฝั่ง Supabase Edge Function
- ถ้า API ล่ม ต้อง fallback เป็น snapshot ล่าสุด และแสดงเวลาข้อมูล
- ข้อมูลส่วนตัวหรือพิกัดส่วนตัวไม่ควรถูกเก็บใน Phase 1 แรกถ้าไม่จำเป็น
- ถ้าต้องจำจุดล่าสุด ให้เริ่มจาก local storage ก่อน account-based favorite zone

## Current Repo State

Repo path: project root ของ `FishSence`

สถานะตอนนี้:

- เป็น Vite + React + TypeScript template
- `package.json` ใช้ React `^19.2.6`
- SRS เดิมระบุ React 18 ดังนั้นถ้าต้องการ strict ตาม SRS ต้องตัดสินใจว่าจะ pin React 18 หรือใช้ React 19 ต่อ
- ยังไม่มี Supabase client
- ยังไม่มี Tailwind CSS
- ยังไม่มี Edge Functions
- ยังไม่มี database schema/migration
- ยังไม่มี Safe Score engine
- มี `dist/` จากการ build แล้ว แต่ `.gitignore` ignore `dist`

## Files Created / Updated

### `Docs/README.md`

สรุป Phase 1 Start Guide:

- เป้าหมาย Phase 1
- stack ที่ควรใช้
- API ที่ต้องรู้
- Safe Score Phase 1
- data model เริ่มต้น
- ลำดับงาน
- ความรู้ที่ต้องมี
- acceptance criteria
- คำถามที่ต้องตัดสินใจ

แก้ล่าสุดให้ชัดว่า Phase 1 แรกไม่ต้องสมัครสมาชิกหรือ login

### `diagram/README.md`

อธิบายภาพรวมการทำงานของระบบด้วย Mermaid diagrams:

- System Context
- User Flow
- Data Processing Flow
- Main Components
- Phase 1 Design Principles

ใช้เป็นจุดเริ่มของ system design ก่อนแตกเอกสารละเอียดใน `Docs/`

### `.gitignore`

เพิ่ม ignore สำหรับ:

- `.env`
- `.env.*`
- key/cert files
- credential/secrets JSON
- Supabase local/temp artifacts

## Security Check Done

ตรวจแล้ว:

- ไม่พบ API key/token/password/private key
- ไม่พบ `.env` หรือ credential files
- ลบ/แทนที่ private absolute paths ออกจากเอกสาร public-facing แล้ว ใช้คำว่า private local knowledge base / project root แทน
- `npm.cmd run build` ผ่าน
- `npm.cmd run lint` ผ่าน
- `npm.cmd audit --audit-level=moderate` ผ่าน 0 vulnerabilities

ข้อควรระวัง:

- ห้าม commit `.env`
- `SUPABASE_SERVICE_ROLE_KEY` ห้ามอยู่ frontend
- ถ้าใช้ `VITE_SUPABASE_ANON_KEY` ต้องเปิด RLS ให้ถูกก่อน deploy
- API key ของ TMD/Stormglass/อื่น ๆ ต้องอยู่ใน Edge Function เท่านั้น

## Git Notes

เคยมีการ init Git ผิดที่ parent folder แทน project root

ถ้ายังมี `.git` อยู่ผิดที่ parent folder ให้ลบเฉพาะ `.git` ที่ parent folder นั้น แล้วค่อย init Git ใน project root

```powershell
Remove-Item -Recurse -Force .git
```

จากนั้นค่อย init ในโฟลเดอร์ที่ถูก:

```powershell
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/fanb1t/FishSence.git
git push -u origin main
```

ถ้า remote `origin` มีอยู่แล้วและต้องเปลี่ยน URL:

```powershell
git remote set-url origin https://github.com/fanb1t/FishSence.git
```

## Next Recommended Work

ลำดับถัดไปที่ควรทำ:

1. อ่าน diagram ตามลำดับใน `diagram/`
2. แตก system design จาก diagram เป็นเอกสารละเอียดใน `Docs/phase1-system-design.md`
3. ออกแบบ data model จริงของ Phase 1
4. ออกแบบ Safe Score engine แบบ rule-based
5. ออกแบบ Open-Meteo + TMD integration และ normalized data shape
6. ออกแบบ dashboard mobile-first
7. ตั้งค่า Supabase project และ migration
8. เพิ่ม Supabase client/Edge Function หลัง design ชัดแล้ว

## Working Reminder

เวลาเริ่มงานรอบใหม่:

1. อ่านไฟล์นี้ก่อน
2. อ่าน `diagram/README.md`
3. อ่าน `Docs/README.md`
4. ถ้าต้องการบริบทเพิ่ม ให้กลับไป private knowledge base โดยเริ่มจาก `meta/index.md`
