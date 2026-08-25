# Winner Sales Tracker

ระบบ **Sales Control Center** สำหรับ Winner Sign ตามสเปก *"WINNER Sales
Tracker — Master System Specification V1.0"* บริหารกระบวนการขายตั้งแต่ลูกค้า
เริ่มสอบถามจนถึงปิดการขาย โดยแยกหน้าที่ตามสเปกไว้ชัดเจน:

- **PEAK Account** — บัญชี, ใบเสนอราคา (ทางการ), Invoice, Payment — ระบบนี้
  **ไม่ได้แทนที่** PEAK และไม่มีการเชื่อมต่อ API จริงในเวอร์ชันนี้ (ไม่มี
  credentials ให้ในโปรเจกต์) ฟิลด์ที่เกี่ยวกับ PEAK (เช่น PEAK Customer ID,
  มูลค่าใบเสนอราคา) จึงเป็นการกรอกข้อมูลเองไปพลางก่อน เพื่อให้โครงสร้างข้อมูล
  พร้อมเชื่อมต่อจริงในอนาคตโดยไม่ต้อง migrate schema ใหม่
- **Winner Sales Tracker (ระบบนี้)** — Lead/Opportunity/Pipeline/Activity/
  Follow-up/Lead Source/Lost Reason/Sales Performance/Dashboard
- **WINFLOW** — Job/Design/Production/QC/Delivery — ระบบนี้เก็บแค่สถานะย่อ
  (WinflowJob) เป็น mirror ให้ฝ่ายขายเห็นความคืบหน้าคร่าวๆ เท่านั้น ไม่มีการ
  เชื่อมต่อ API จริงเช่นกัน

ข้อมูลลูกค้า/งานขายจากไฟล์ Excel เดิม (`AoyWinnerTracker.xlsx`) ถูกนำเข้า
เป็น **502 ลูกค้า (Customer) และ 865 โอกาสขาย (Opportunity)** แล้ว (ดูหัวข้อ
"เริ่มต้นใช้งาน")

## Business Flow ที่ระบบรองรับ

```
Customer Inquiry → New Lead → Contacted → Requirement → Estimating
→ Quotation Sent → Follow-up → Negotiation → Waiting Approval
→ Won / Lost / On Hold
```

เมื่อ Won แล้วสามารถสร้าง/อัปเดตสถานะงานฝั่ง WINFLOW แบบย่อได้จากหน้ารายละเอียด
โอกาสขายโดยตรง

> **หมายเหตุการออกแบบ:** สเปกต้นฉบับแยก "Lead" กับ "Opportunity" เป็นสอง
> concept แต่ทุกฟิลด์ของ Lead (Lead Source, Contact Channel, Interested
> Product, Temperature) ก็เป็นฟิลด์ของ Opportunity อยู่แล้ว และ Stage แรกของ
> Pipeline ("New Lead") ก็คือนิยามของ Lead อยู่แล้วในตัว ระบบนี้จึงรวมสอง
> concept เป็นตารางเดียว (`Opportunity`) เพื่อไม่ต้องมีขั้นตอน "แปลง Lead เป็น
> Opportunity" ที่ข้อมูลจริงของบริษัทไม่มี concept นี้อยู่แล้ว — ตรงกับหลักการ
> "Simple for Sales" ของสเปกเอง (ข้อ 59)

## Scope ที่ implement แล้ว (V1 Must Have — สเปกข้อ 52)

| # | Feature ตามสเปก | สถานะ |
| - | --- | --- |
| 1-4 | Customer, Lead, Opportunity, Sales Owner | ✅ |
| 5 | Pipeline (11 stage เต็มตามข้อ 11) | ✅ |
| 6-8 | Product Type, Lead Source, Contact Channel (master แยกกัน) | ✅ |
| 9-10 | Activity, Last Contact | ✅ (Activity Timeline) |
| 11-13 | Next Follow-up, Next Action, Overdue (4 ระดับตามข้อ 15) | ✅ |
| 14 | Hot/Warm/Cold Temperature | ✅ |
| 15-16 | PEAK Customer/Quotation Link | ✅ ฟิลด์พร้อม แต่เป็น manual entry (ไม่มี live API) |
| 17-18 | Quotation Value, Quotation Aging | ✅ |
| 19-21 | Won, Lost, Lost Reason (บังคับกรอกเมื่อ Lost) | ✅ |
| 22-24 | Sales / Manager / Executive Dashboard | ✅ |
| 25 | User Permission (4 roles) | ✅ |
| 26-27 | Search / Filter | ✅ |
| 28 | Audit Log | ✅ (Stage, Sales Owner, Won/Lost) |

เพิ่มเติมนอกเหนือ Must Have ที่ทำไปด้วยเพราะอยู่ใน flow เดียวกัน: Stage/
Assignment History, Probability & Weighted Pipeline (ข้อ 19-20), Sales
Funnel & Conversion Metrics (ข้อ 33-34), No Activity Report, Lead
Source/Product/Customer Performance, In-app Notifications (ข้อ 47),
**หน้ารายละเอียดพนักงานขายรายบุคคล** (`/rep/[userId]`) พร้อม KPI ตามข้อ 55
(Win Rate, Lead/Quote Conversion, Follow-up Completion, Average Deal
Size, Average Sales Cycle), **ตัวกรองช่วงเวลา + พนักงานขาย** บน Executive
Dashboard (ข้อ 41), **การโอนงานด้วยตนเอง** สำหรับพนักงานขาย (ข้อ 29 ขยายสิทธิ์
ให้เจ้าของงานโอนงานของตัวเองได้ ไม่ต้องรอหัวหน้าทีม), และ **แจ้งเตือน LINE
สรุปยอดขายประจำวัน** ผ่าน LINE Messaging API (ดูหัวข้อด้านล่าง)

### ยังไม่ทำ (ตรงตามที่สเปกกำหนดไว้เป็น V1.5/V2 อยู่แล้ว — ข้อ 53-54)

- **PEAK/WINFLOW API sync จริง** — ไม่มี credentials ให้ในงานนี้ ฟิลด์ทั้งหมด
  พร้อมสำหรับต่อ API จริงในอนาคต (ดู `IntegrationSyncLog` แนวคิดในสเปกข้อ 49
  — ยังไม่ได้สร้างตารางนี้เพราะไม่มี integration จริงให้ sync)
- Email/Push Notification (มี in-app + LINE แล้ว ตามที่ขอเพิ่มเติม)
- Automatic Lead Score, Weighted Forecast ขั้นสูง, Customer Dormant
  auto-reminder, Sales Target/Commission, Sales Territory, Mobile App

## Business Flow → Module Map

| Module (สเปกข้อ 4) | อยู่ในระบบตรงไหน |
| --- | --- |
| 1. Customer | หน้า **ลูกค้า** + `Customer` model |
| 2-3. Lead / Opportunity | หน้า **โอกาสขาย** + `Opportunity` model (ดูหมายเหตุด้านบน) |
| 4. Pipeline | หน้า **Pipeline** (Kanban 11 stage) |
| 5. Activity & Follow-up | Activity Timeline ในหน้ารายละเอียดโอกาสขาย |
| 6. PEAK Integration | ฟิลด์ PEAK Customer ID / Quotation (manual) |
| 7. Dashboard & Analytics | **My / Team / Executive Dashboard** |
| 8. User/Team/Permission | หน้า **ตั้งค่า → ทีมขาย / ผู้ใช้งาน** |
| 9. WINFLOW Integration | ส่วน WINFLOW ในหน้ารายละเอียดโอกาสขาย (เฉพาะ Won) |

## Role & Permission (สเปกข้อ 30)

| Role | เข้าถึงข้อมูล | ทำอะไรได้ |
| --- | --- | --- |
| **SALES** | เฉพาะ Opportunity ของตัวเอง | Follow-up, เปลี่ยน Stage, เพิ่ม Activity/Quotation |
| **SALES_MANAGER** | ทั้งทีม (ตาม Team ที่สังกัด) | ข้างต้น + Assign/Transfer, ดู Team Dashboard |
| **MANAGEMENT** | ทุกทีม (อ่านอย่างเดียวสำหรับ master) | ดู Executive Dashboard, ปรับ Probability Master |
| **ADMIN** | ทุกทีม | จัดการ User/Master/Team/Permission ทั้งหมด |

## เทคโนโลยีที่ใช้

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Prisma](https://www.prisma.io) + SQLite (ไฟล์ฐานข้อมูลเดียว เหมาะกับ
  องค์กรขนาดเล็ก — ย้ายไป PostgreSQL/MySQL ภายหลังได้ง่ายผ่าน Prisma)
- Recharts สำหรับกราฟในทุกแดชบอร์ด
- Session cookie + JWT (jose), รหัสผ่านเข้ารหัสด้วย bcrypt

## เริ่มต้นใช้งาน (Local Development)

```bash
npm install                 # ติดตั้ง dependencies (รัน `prisma generate` อัตโนมัติ)
cp .env.example .env        # ตั้งค่า DATABASE_URL และ SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # สุ่ม SESSION_SECRET

npm run db:push             # สร้างตารางฐานข้อมูลตาม prisma/schema.prisma
npm run db:seed             # นำเข้าลูกค้า/โอกาสขายจาก Excel เดิม + สร้างผู้ใช้ AOY
                             # (รันซ้ำได้ปลอดภัย - จะล้างข้อมูลลูกค้า/โอกาสขาย
                             #  ที่นำเข้าไว้ก่อนแล้วนำเข้าใหม่ทุกครั้ง)

npm run dev                 # เปิดเซิร์ฟเวอร์ที่ http://localhost:3000
```

### บัญชีผู้ใช้เริ่มต้น (จาก seed)

| อีเมล | รหัสผ่าน | บทบาท |
| --- | --- | --- |
| `aoy@winnersign.local` | `Winner2026!` | ผู้ดูแลระบบ (ADMIN) |

> **สำคัญ:** เปลี่ยนรหัสผ่านทันทีหลังเข้าสู่ระบบครั้งแรก (ตั้งค่า → ผู้ใช้งาน)
> หรือกำหนดรหัสผ่านของ seed เองผ่าน `SEED_ADMIN_PASSWORD` ก่อนรัน `npm run db:seed`

เพิ่มพนักงานขาย/หัวหน้าทีม/ผู้บริหารคนอื่น ๆ ได้จากหน้า **ตั้งค่า → ผู้ใช้งาน**
(เฉพาะ ADMIN)

## คำสั่งที่ใช้บ่อย

| คำสั่ง | คำอธิบาย |
| --- | --- |
| `npm run dev` | รันเซิร์ฟเวอร์สำหรับพัฒนา |
| `npm run build` | build สำหรับ production |
| `npm run start` | รันเซิร์ฟเวอร์ production (ต้อง build ก่อน) |
| `npm run db:push` | sync schema กับฐานข้อมูล SQLite |
| `npm run db:seed` | นำเข้าข้อมูลตั้งต้นจาก `prisma/seed-data.json` (ปลอดภัยรันซ้ำ) |
| `npm run db:studio` | เปิด Prisma Studio ดู/แก้ข้อมูลในฐานข้อมูลโดยตรง |

## โครงสร้างหน้าเว็บหลัก

- `/dashboard` — **My Dashboard**: วันนี้ต้องทำอะไร (ทุก role, เห็นเฉพาะงานตัวเอง)
- `/opportunities` — ตารางโอกาสขาย ค้นหา/กรอง/เพิ่ม/แก้ไข/ลบ/โอนงาน
- `/pipeline` — Pipeline แบบ Kanban 11 stage ลากเปลี่ยนสถานะ
- `/customers` — ทะเบียนลูกค้า
- `/team-dashboard` — **Team Dashboard** พร้อมกราฟเปรียบเทียบพนักงานขาย (SALES_MANAGER ขึ้นไป)
- `/rep/[userId]` — รายละเอียด KPI รายบุคคล (คลิกจาก Team/Executive Dashboard, SALES_MANAGER ขึ้นไป - หัวหน้าทีมดูได้เฉพาะทีมตัวเอง)
- `/executive-dashboard` — **Executive Dashboard** พร้อมตัวกรองช่วงเวลา + พนักงานขาย และกราฟเปรียบเทียบทีม (MANAGEMENT ขึ้นไป)
- `/audit-log` — ประวัติการเปลี่ยนแปลงข้อมูลสำคัญ (MANAGEMENT ขึ้นไป)
- `/settings` — Master Data, ทีมขาย, Probability, ผู้ใช้งาน, แจ้งเตือน LINE (ADMIN/MANAGEMENT)

## การโอนงาน (Transfer)

พนักงานขายโอนงานของตัวเองให้เพื่อนร่วมทีมได้เองจากส่วน "โอนงานให้เพื่อนร่วมทีม"
ในหน้ารายละเอียดโอกาสขาย โดยไม่ต้องรอหัวหน้าทีม — ระบบบันทึกการโอนทุกครั้งไว้ใน
Assignment History และ Audit Log เสมอ (ใครโอน โอนให้ใคร เมื่อไหร่) หัวหน้าทีมและ
ผู้บริหารยังคงมอบหมาย/โอนงานของใครก็ได้ในสิทธิ์ตัวเอง

## แจ้งเตือน LINE - สรุปยอดขายประจำวัน

ตั้งค่าได้จาก **ตั้งค่า → แจ้งเตือน LINE** (เฉพาะ ADMIN) สรุปทุกวัน: ลูกค้าที่
ติดตามกี่ราย, ปิดการขายกี่ราย, ลูกค้า/Lead เข้าใหม่กี่ราย แยกตามพนักงานขายแต่ละคน

> **LINE Notify ปิดให้บริการแล้ว** ระบบนี้ใช้ **LINE Messaging API** แทน ซึ่งต้อง
> สร้าง LINE Official Account เอง (ฟรี) ตามขั้นตอนนี้:
>
> 1. สมัคร [LINE Official Account Manager](https://manager.line.biz/) ด้วยบัญชี LINE บริษัท
> 2. ไปที่ **Settings → Messaging API** เปิดใช้งาน Messaging API สำหรับ OA นั้น
> 3. คัดลอก **Channel Access Token** (long-lived) จากหน้า Messaging API มาใส่ในระบบ
>    ที่ ตั้งค่า → แจ้งเตือน LINE
> 4. (ถ้าต้องการส่งเข้ากลุ่ม/แชทเดี่ยวที่กำหนด) หา **Target User/Group ID**:
>    เพิ่ม OA เป็นเพื่อนหรือเชิญเข้ากลุ่ม แล้วดู userId/groupId จาก webhook log
>    หรือเครื่องมือของ LINE Developers Console — ถ้าเว้นว่างไว้ ระบบจะ Broadcast
>    ข้อความให้ทุกคนที่แอด OA เป็นเพื่อนแทน
> 5. กดปุ่ม **"ส่งข้อความทดสอบ"** เพื่อยืนยันว่าตั้งค่าถูกต้อง

### ตั้งเวลาส่งอัตโนมัติทุกวัน

ระบบเองไม่มี cron ในตัว (เป็นเว็บแอปทั่วไป ไม่ใช่ serverless ที่มี cron built-in)
ต้องตั้งค่าตัวจับเวลาจากภายนอกให้เรียก endpoint นี้วันละครั้ง:

```
POST https://<โดเมนของคุณ>/api/cron/daily-summary?secret=<CRON_SECRET>
```

1. ตั้งค่า `CRON_SECRET` ใน `.env` (สุ่มค่าเหมือน `SESSION_SECRET`)
2. เปิดสวิตช์ "เปิดใช้งานสรุปยอดขายประจำวันอัตโนมัติ" ในหน้าตั้งค่า
3. ตั้ง cron ภายนอก เช่น crontab บนเซิร์ฟเวอร์ (ตัวอย่างส่งเวลา 18:00 ทุกวัน):

   ```
   0 18 * * * curl -s "https://<โดเมนของคุณ>/api/cron/daily-summary?secret=<CRON_SECRET>"
   ```

   หรือใช้ GitHub Actions scheduled workflow / Vercel Cron ยิง URL เดียวกันนี้แทนก็ได้
   endpoint จะไม่ส่งอะไรถ้าสวิตช์ปิดอยู่ หรือยังไม่ได้ตั้งค่า Token

## หมายเหตุด้านข้อมูล

- ไฟล์ Excel เดิมไม่มีฟิลด์มูลค่าเงิน (ราคา/ใบเสนอราคา) จึงนำเข้ามาโดยไม่มี
  `estimatedValue`/`Quotation` — ตัวเลข Pipeline Value, Won Value, Weighted
  Pipeline ในแดชบอร์ดจะเป็น 0 จนกว่าฝ่ายขายจะเริ่มกรอกมูลค่าจริงของแต่ละ
  โอกาสขายไปข้างหน้า
- `prisma/seed-data.json` คือข้อมูลที่แปลงมาจาก `AoyWinnerTracker.xlsx` ใช้
  สำหรับ `npm run db:seed` เท่านั้น ฐานข้อมูลจริง (`prisma/dev.db`) จะไม่ถูก
  commit เข้า git (`.gitignore`) — ย้ายไปใช้งานจริงบนเซิร์ฟเวอร์อื่นให้รัน
  `db:push` และ `db:seed` อีกครั้งบนเครื่องปลายทาง
