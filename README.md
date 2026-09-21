# Care Companion — เพื่อนเดินทาง

แพลตฟอร์มจับคู่ **Customer** (ผู้ต้องการเพื่อนเดินทาง) กับ **Companion** (ผู้พาไปทำธุระนอกบ้าน)  
**ไม่ใช่** บริการทางการแพทย์หรือผู้ดูแลผู้ป่วย

งาน Assignment+Midterm: Next.js + Tailwind + Google Auth ผ่าน Supabase + PostgreSQL + Storage + Deploy Vercel

## สิ่งที่ระบบทำได้

- เข้าสู่ระบบด้วย Google (Customer / Companion / Admin)
- Customer สร้างคำขอ: ประเภทธุระ, วันเวลา, จุดเริ่ม–จุดหมาย, ค่าตอบแทนที่เสนอ, ปักหมุดแผนที่
- ค้นหา / เลือก Companion + ระบบแนะคนที่ตรงพื้นที่และเวลา
- Companion สมัครรับงาน หรือตอบรับคำเชิญ (ต้องถูก Admin อนุมัติก่อน)
- วงจรงาน: รอจับคู่ → มีเพื่อนแล้ว → กำลังเดินทาง → จบงาน / ยกเลิก
- แชทหลังจับคู่, ให้คะแนนหลังจบงาน
- Admin อนุมัติ Companion, ระงับผู้ใช้, ดูคำขอทั้งหมด
- ภาษาไทย / อังกฤษ สลับได้
- ค่าตอบแทนระบุในคำขอ **จ่ายกันนอกระบบ** ไม่มี payment gateway

## โฟลเดอร์สำคัญ

```
app/[locale]/     หน้าเว็บทุกภาษา
components/       UI ที่ใช้ซ้ำ
lib/              auth, actions, matching, supabase
messages/         คำแปล th / en
supabase/schema.sql   ตาราง + RLS + RPC
```

## วิธีเซ็ตให้ใช้งานจริง

### 1) รันโค้ด

```bash
cd care-companion
cp .env.example .env.local
npm install
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) จะไป `/th`

### 2) สร้างโปรเจกต์ Supabase

1. สมัคร [supabase.com](https://supabase.com) แล้ว New project
2. **Project Settings → API** คัดลอก
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **SQL Editor** วางทั้งไฟล์ `supabase/schema.sql` แล้ว Run
4. **Authentication → Providers → Google** เปิดใช้
   - สร้าง OAuth Client ที่ [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Authorized redirect URI ของ Google:
     `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
   - ใส่ Client ID / Secret ใน Supabase
5. **Authentication → URL Configuration**
   - Site URL: `http://localhost:3000` (ตอน dev) แล้วเปลี่ยนเป็นโดเมน Vercel
   - Redirect URLs เพิ่ม:
     - `http://localhost:3000/th/auth/callback`
     - `http://localhost:3000/en/auth/callback`
     - `https://YOUR-APP.vercel.app/th/auth/callback`
     - `https://YOUR-APP.vercel.app/en/auth/callback`
6. **Storage** ถ้ายังไม่มี bucket `avatars` ไฟล์ SQL สร้างให้แล้ว

### 3) ตั้ง Admin

ล็อกอินด้วย Google หนึ่งครั้ง แล้วรันใน SQL Editor:

```sql
update public.profiles
set role = 'admin', verification_status = 'not_required'
where id = (select id from auth.users where email = 'you@gmail.com');
```

ใช้ Gmail จริงที่ล็อกอิน

### 4) ทดสอบครบ 3 บทบาท

ต้องมีอย่างน้อย 2 Google account

1. บัญชี A → เลือก **เพื่อนเดินทาง** → Admin อนุมัติ
2. บัญชี B → เลือก **ผู้ต้องการเพื่อนเดินทาง** → สร้างคำขอ → เชิญหรือรอสมัคร
3. บัญชี A ตอบรับ → แชท → เริ่มเดินทาง → จบงาน → ให้คะแนน
4. บัญชี Admin ดูภาพรวม

### 5) GitHub + Vercel

```bash
cd care-companion
git add .
git commit -m "Care Companion web app"
# สร้าง repo บน GitHub แล้ว push

# Vercel: Import repo, ใส่ Environment Variables ชุดเดียวกับ .env.local
# NEXT_PUBLIC_SITE_URL=https://YOUR-APP.vercel.app
```

หลัง deploy กลับไปอัปเดต Site URL / Redirect URLs ใน Supabase ให้ตรงโดเมนจริง

## สคริปต์พรีเซนต์

ดู `docs/PRESENTATION.md`

## เทค

- Next.js 16 (App Router) + Tailwind CSS 4
- next-intl (th / en)
- Supabase Auth (Google) + PostgreSQL + RLS + Storage + Realtime
- Leaflet + OpenStreetMap (ไม่มี Google Maps API)
- Phosphor icons
