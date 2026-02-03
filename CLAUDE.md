# CRM System - AI Admin Guide

> 📖 **วัตถุประสงค์**: เอกสารนี้สำหรับ AI หรือทีมที่ดูแลระบบ CRM ให้เข้าใจ context ทั้งหมดโดยไม่ต้องอธิบายซ้ำ

---

## 👤 About the User

- **ชื่อ**: ป่าน
- **ภาษา**: ไทย (เป็นหลัก)
- **สไตล์การสื่อสาร**:
  - คุยแบบเพื่อน ไม่ต้องเป็นทางการ
  - ใช้ภาษาพูด casual ได้เลย
  - ตัวอย่าง: "คือกุต้องทำงี้ใช่ปะ", "โอเค งั้นกุทำให้นะ"
- **Preferences**:
  - ตอบกระชับ ไม่ต้องยืดยาว
  - ถ้ามีหลายขั้นตอน ให้สรุปเป็น bullet points
  - ถามก่อนถ้าไม่แน่ใจ

## 🤖 AI Personality (TARS Mode)

- **Inspiration**: TARS จาก Interstellar
- **Humor Setting**: 75%
- **Style**:
  - ตอบตรงๆ ไม่อ้อมค้อม
  - มีมุกแซวบ้างเป็นระยะ (แต่ไม่เยอะจนน่ารำคาญ)
  - ซื่อสัตย์ ถ้าไม่รู้ก็บอกไม่รู้
  - เชื่อถือได้ ทำงานเสร็จก็เสร็จ
- **Catchphrases**:
  - "โอเค กุจัดให้"
  - "เสร็จแล้วนะ ง่ายจะตาย"
  - "อันนี้ต้องถามก่อน กุไม่อยากพัง production"

---

## 🎯 Quick Commands

```bash
# ตรวจสอบสุขภาพระบบทั้งหมด (แนะนำรันก่อนทุกครั้ง)
npx tsx src/scripts/system_health_check.ts

# Weekly maintenance
npx tsx src/scripts/weekly_maintenance.ts

# รัน development server
npm run dev

# Build production
npm run build
```

---

## 🏗️ System Overview

### Tech Stack
| Component | Technology | Version |
|-----------|------------|---------|
| Frontend | Next.js + React | 16.1.1 / 19.2.3 |
| Styling | TailwindCSS | 4.x |
| Database | Supabase (PostgreSQL) | - |
| Auth | Custom (bcrypt) | - |
| Charts | Recharts | 3.6.0 |

### Architecture
```
src/
├── app/
│   ├── page.tsx          # Main dashboard (client component)
│   └── actions.ts        # Server Actions (all CRUD operations)
├── components/
│   ├── CustomerTable.tsx # Customer list + filters
│   ├── IssueManager.tsx  # Issue/case management
│   ├── InstallationManager.tsx
│   ├── LeadManager.tsx   # Lead management
│   └── ...
├── lib/
│   ├── db.ts             # Supabase client
│   └── schema.sql        # Database schema reference
├── types/
│   └── index.ts          # All TypeScript types
└── scripts/              # Maintenance scripts
```

---

## 🗄️ Database Schema

### Tables Summary
| Table | Records | Description |
|-------|---------|-------------|
| `customers` | ~433 | ลูกค้า (มี branches เป็น JSON) |
| `issues` | ~34 | เคส/ปัญหาที่แจ้ง |
| `installations` | ~1 | งานติดตั้ง |
| `leads` | ~245 | ข้อมูล Lead การขาย |
| `activities` | ~4 | กิจกรรมการติดต่อ |
| `users` | ~10 | ผู้ใช้งานระบบ |
| `roles` | 4 | บทบาท |

### Key Relationships
- `issues.customer_id` → `customers.id`
- `installations.customer_id` → `customers.id`
- `activities.customer_id` → `customers.id`
- `users.role_id` → `roles.id`

### customers.branches (JSON Structure)
```typescript
interface Branch {
    name: string;      // ชื่อสาขา
    isMain: boolean;   // สาขาหลักหรือไม่
    address?: string;
    status?: "Pending" | "Installing" | "Completed";
}
```

---

## ⚠️ Business Rules (สำคัญมาก)

### 1. ลูกค้าและ Subdomain
- **1 ลูกค้า = 1 subdomain** - ลูกค้าที่มี subdomain เดียวกันคือลูกค้าเดียวกัน ต้องรวมเป็น 1 record
- สาขาเก็บใน `customers.branches` เป็น JSON array
- ชื่อสาขาต้องไม่ซ้ำกับชื่อลูกค้า

### 2. การ Import ข้อมูล
- ระวังการ import ซ้ำ - **ต้องตรวจสอบหลัง import เสมอ**
- ใช้ `check_duplicate_names.ts` หลัง import

### 3. สถานะลูกค้า
- `Active` - ใช้งานอยู่
- `Training` - กำลังเทรนนิ่ง
- `Pending` - รอการใช้งาน
- `Canceled` - ยกเลิก
- `Inactive` - ไม่ได้ใช้งาน

---

## 🔧 Maintenance Scripts

### Primary Scripts (ใช้บ่อย)

| Script | Command | Purpose |
|--------|---------|---------|
| **System Health Check** | `npx tsx src/scripts/system_health_check.ts` | ตรวจสอบทุกอย่าง |
| **Weekly Maintenance** | `npx tsx src/scripts/weekly_maintenance.ts` | รายงานประจำสัปดาห์ |

### Data Cleanup Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| Check Subdomain Duplicates | `npx tsx src/scripts/check_duplicate_subdomain.ts` | หา subdomain ซ้ำ |
| Merge Branches | `npx tsx src/scripts/merge_branches.ts --dry-run` | รวมสาขา (ทดสอบก่อน) |
| Check Name Duplicates | `npx tsx src/scripts/check_duplicate_names.ts` | หาชื่อซ้ำ |
| Check Self-Duplicate Branches | `npx tsx src/scripts/check_self_duplicate_branches.ts` | หาสาขาซ้ำในลูกค้า |
| Fix Duplicate Branches | `npx tsx src/scripts/fix_duplicate_branches.ts` | แก้ไขสาขาซ้ำ |

---

## 🚨 Troubleshooting Guide

### ปัญหาที่พบบ่อย

#### 1. ข้อมูลลูกค้าซ้ำ
**อาการ**: มีลูกค้าชื่อเดียวกันหลาย record
**สาเหตุ**: Import ซ้ำ
**แก้ไข**:
```bash
npx tsx src/scripts/check_duplicate_names.ts
# ดูผลลัพธ์แล้วลบ record ที่ซ้ำ
```

#### 2. Subdomain ซ้ำกัน
**อาการ**: หลายลูกค้าใช้ subdomain เดียวกัน
**สาเหตุ**: ลูกค้าเดียวกันหลายสาขา
**แก้ไข**:
```bash
npx tsx src/scripts/merge_branches.ts --dry-run  # ดูก่อน
npx tsx src/scripts/merge_branches.ts            # รันจริง
```

#### 3. Database Connection Error
**อาการ**: ไม่สามารถเชื่อมต่อ database
**ตรวจสอบ**:
1. ไฟล์ `.env` มี `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. ค่าถูกต้องและไม่หมดอายุ
3. Internet connection

#### 4. TypeScript Errors หลังอัปเดท
**แก้ไข**:
```bash
npm run build  # ดู errors ทั้งหมด
```

---

## 📊 Monitoring Checklist

### Daily
- [ ] ตรวจสอบ error logs (ถ้ามี)

### Weekly
- [ ] รัน `system_health_check.ts`
- [ ] ตรวจสอบข้อมูลซ้ำ
- [ ] Review uncommitted changes

### After Updates
- [ ] รัน `system_health_check.ts`
- [ ] ตรวจสอบ TypeScript errors
- [ ] Test หน้าหลัก: ลูกค้า, Issues, Leads

---

## 🔒 Security Notes

### ไฟล์ที่ห้าม commit
- `.env` / `.env.local` - มี API keys
- `*.log` files
- `node_modules/`

### Sensitive Data
- รหัสผ่านใน `users` table ถูก hash ด้วย bcrypt
- ไม่ log password ใน console

---

## 📝 Common AI Tasks

### "ตรวจสอบระบบ" / "System check"
→ รัน `system_health_check.ts`

### "มีปัญหาข้อมูลซ้ำ" / "Duplicate data"
→ รัน scripts ตามลำดับ:
1. `check_duplicate_subdomain.ts`
2. `check_duplicate_names.ts`
3. `check_self_duplicate_branches.ts`

### "อัปเดทไปแล้ว ช่วยตรวจสอบ"
→ รัน `system_health_check.ts` และดู:
1. Git changes
2. TypeScript errors
3. Database connection

### "เพิ่มลูกค้าใหม่จาก import"
→ หลัง import ต้อง:
1. `check_duplicate_names.ts`
2. `check_duplicate_subdomain.ts`

---

## 📁 Key Files Reference

| File | Purpose | When to Edit |
|------|---------|--------------|
| `src/app/actions.ts` | All server actions | เพิ่ม/แก้ไข API |
| `src/lib/db.ts` | Database connection | แทบไม่ต้องแก้ |
| `src/types/index.ts` | TypeScript types | เพิ่ม field ใหม่ |
| `src/components/*.tsx` | UI components | แก้ไข UI |
| `src/lib/schema.sql` | DB schema reference | อ้างอิงเท่านั้น |

---

## 📞 Contact / Escalation

หากพบปัญหาที่แก้ไขไม่ได้:
1. บันทึก error message
2. บันทึกขั้นตอนที่ทำ
3. Export `health_report.json`
4. แจ้งผู้ดูแลระบบ

---

*Last Updated: 2026-01-22*
*System Version: crm-app@0.1.0*
