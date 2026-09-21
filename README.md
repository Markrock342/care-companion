# ⟢ CARE COMPANION ⟣

```
   ╔═══════════════════════════════════════════════════════════════╗
   ║   ◉  C A R E   C O M P A N I O N                              ║
   ║      ระบบนำร่องมนุษย์ · HUMAN ESCORT NETWORK · v1.0           ║
   ║                                                               ║
   ║   STATUS ▸ ONLINE          GRID ▸ 77 จังหวัด                  ║
   ║   CORE   ▸ SUPABASE        COPILOT ▸ GEMINI 3.5 FLASH         ║
   ╚═══════════════════════════════════════════════════════════════╝
```

> **ภารกิจ:** ไม่มีใครควรต้องออกไปโรงพยาบาล ธนาคาร หรือที่ว่าการอำเภอคนเดียว
> เครือข่ายนี้จับคู่ **ผู้ขอ (Customer)** กับ **เพื่อนเดินทาง (Companion)** ที่ไปด้วยกันจนจบธุระ แล้วกลับถึงบ้านอย่างปลอดภัย
>
> ⚠️ **โปรโตคอลความปลอดภัย:** นี่ **ไม่ใช่** บริการทางการแพทย์ ไม่ใช่ผู้ดูแลผู้ป่วย เพื่อนเดินทางไปเป็นเพื่อนและอำนวยความสะดวกเท่านั้น

**🛰 สถานีภาคพื้น:** https://care-companion-nine-navy.vercel.app

---

## ◈ เข้าสู่ระบบด้วยรหัสทดลอง

กดปุ่มเดียวในหน้าล็อกอิน ไม่ต้องพิมพ์ ไม่ต้องสมัคร

| บทบาท | รหัสประจำตัว | รหัสผ่าน |
| --- | --- | --- |
| `ADMIN` ผู้ควบคุมระบบ | `admin@demo.test` | `Demo1234!` |
| `CUSTOMER` ผู้ขอเดินทาง | `customer@demo.test` | `Demo1234!` |
| `COMPANION` เพื่อนเดินทาง | `companion@demo.test` | `Demo1234!` |

ผู้ใช้จริงเข้าด้วย **Google Account** เท่านั้น

---

## ◈ ระบบย่อยบนยาน

```
┌─ CORE ─────────────────────────────────────────────────────────┐
│ ◇ IDENTITY      Google OAuth ผ่าน Supabase Auth + RLS ทุกตาราง │
│ ◇ MATCHING      แนะเพื่อนเดินทางจากจังหวัด วัน เวลา ค่าตอบแทน  │
│ ◇ LIFECYCLE     รอจับคู่ → มีเพื่อนแล้ว → เดินทาง → จบงาน       │
│ ◇ COMMS         แชทเรียลไทม์ + รีวิวสองทางหลังจบงาน            │
└────────────────────────────────────────────────────────────────┘
┌─ AI COPILOT (Gemini) ──────────────────────────────────────────┐
│ ◇ AUTO-FILL     พิมพ์ "พรุ่งนี้ 9 โมงพาแม่ไปศิริราช"            │
│                 → แยกประเภท วันเวลา สถานที่ ค่าตอบแทน ปักหมุด   │
│ ◇ TRIP ANALYSIS สรุปงาน เช็กลิสต์ของที่ต้องเตรียม              │
│                 ประเมินค่าตอบแทน คำเตือน และสิ่งที่ควรตกลงกัน   │
└────────────────────────────────────────────────────────────────┘
┌─ SAFETY NET ───────────────────────────────────────────────────┐
│ ◇ FAMILY LINK   ลิงก์ให้ญาติติดตามสด ไม่ต้องล็อกอิน ปิดเองเมื่อจบ│
│ ◇ BEACON        แชร์ตำแหน่งระหว่างเดินทาง อัปเดตอัตโนมัติ        │
│ ◇ SOS           ปุ่มโทรหาญาติ / 1669 / อีกฝ่าย ในหน้าเดียว      │
│ ◇ CLASH GUARD   ปฏิทินรายสัปดาห์ + เตือนเมื่อรับงานเวลาชนกัน     │
└────────────────────────────────────────────────────────────────┘
┌─ CONTROL DECK (Admin) ─────────────────────────────────────────┐
│ ◇ TELEMETRY     KPI, กราฟ 8 สัปดาห์, ประเภทธุระ, จังหวัดยอดนิยม │
│ ◇ GATEKEEPING   อนุมัติ/ไม่อนุมัติเพื่อนเดินทาง พร้อมเหตุผล      │
│ ◇ COMMAND       ค้นหา กรอง เปลี่ยนบทบาท ระงับบัญชี ยกเลิกคำขอ   │
│ ◇ BLACK BOX     บันทึกทุกคำสั่งของแอดมิน ย้อนหลังได้            │
└────────────────────────────────────────────────────────────────┘
```

พร้อมภาษาไทย/อังกฤษ โหมดมืด–สว่าง และหน้าจอที่ใช้งานได้ตั้งแต่มือถือจอเล็กถึงจอคอม

---

## ◈ แผงวงจร

| ชั้น | เทคโนโลยี |
| --- | --- |
| Frontend | Next.js 16 (App Router, Server Components) · Tailwind v4 · next-intl |
| Backend | Supabase — PostgreSQL + Row Level Security + RPC + Realtime |
| Auth | Google OAuth ผ่าน Supabase Auth |
| Storage | Supabase Storage (รูปโปรไฟล์) |
| AI | Gemini API (`gemini-3.5-flash`) แบบ structured JSON |
| Maps | Google Maps JS API เมื่อใส่คีย์ ไม่งั้นใช้ OpenStreetMap |
| Deploy | Vercel (ภูมิภาคสิงคโปร์ ใกล้ฐานข้อมูล) |

---

## ◈ ลำดับการปล่อยยาน

### 1 · โคลนและติดตั้ง

```bash
git clone https://github.com/Markrock342/care-companion.git
cd care-companion
npm install
cp .env.example .env.local
```

### 2 · ฐานข้อมูล

ใน **Supabase → SQL Editor** รันตามลำดับ:

| ลำดับ | ไฟล์ | หน้าที่ |
| --- | --- | --- |
| 1 | `supabase/schema.sql` | ตาราง, RLS, RPC, Storage bucket |
| 2 | `supabase/migrations/002_trip_safety.sql` | ลิงก์ญาติ, ตำแหน่ง, ผู้ติดต่อฉุกเฉิน |
| 3 | `supabase/migrations/003_admin_console.sql` | สถิติแอดมิน + บันทึกการดำเนินการ |
| 4 | `supabase/seed-demo.sql` | บัญชีและข้อมูลตัวอย่าง (ไม่บังคับ) |

รูปโปรไฟล์ตัวอย่าง: `node --env-file=.env.local scripts/seed-demo-avatars.mjs`

### 3 · กุญแจ

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key>
GEMINI_API_KEY=<key จาก aistudio.google.com/apikey>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=            # ไม่ใส่ก็ได้ จะใช้ OpenStreetMap แทน
```

### 4 · เปิด Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → สร้าง OAuth Client (Web)
   Authorized redirect URI: `https://<project>.supabase.co/auth/v1/callback`
2. Supabase → **Authentication → Providers → Google** ใส่ Client ID / Secret
3. Supabase → **URL Configuration** เพิ่ม `<โดเมน>/th/auth/callback` และ `/en/auth/callback`

### 5 · จุดเครื่อง

```bash
npm run dev        # http://localhost:3000 → /th
npm run build      # ตรวจก่อนขึ้นจริง
```

---

## ◈ ผังห้องเครื่อง

```
app/[locale]/        หน้าเว็บทุกภาษา (admin, customer, companion, trips, share)
components/          UI ที่ใช้ซ้ำ — landing, trips, admin, map, ui
lib/                 auth, actions (server), matching, schedule, ai, supabase
messages/            คำแปล th / en
supabase/            schema.sql, migrations/, seed-demo.sql
scripts/             เครื่องมือเสริม
docs/PRESENTATION.md สคริปต์เดโม
```

---

## ◈ กฎของเครือข่าย

- ค่าตอบแทนตกลงกันเอง **จ่ายนอกระบบ** ไม่มี payment gateway
- เพื่อนเดินทางต้องผ่านการอนุมัติจากแอดมินก่อนรับงาน
- แชทเปิดหลังจับคู่ รีวิวได้หลังจบงานเท่านั้น
- เบอร์ผู้ติดต่อฉุกเฉินเห็นได้เฉพาะคู่เดินทางของงานที่ยังไม่จบ
- ลิงก์ญาติเปิดได้โดยไม่ต้องล็อกอิน และหมดอายุเองเมื่อจบงาน
- ทุกตารางบังคับด้วย Row Level Security — สิทธิ์ตัดสินที่ฐานข้อมูล ไม่ใช่ที่หน้าเว็บ

---

<div align="center">

**เดินทางด้วยกัน ไม่ต้องไปคนเดียว**

`END OF TRANSMISSION ▸ ◉`

</div>
