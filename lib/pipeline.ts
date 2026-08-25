import type { Stage } from "@prisma/client";

// Pipeline V1 - 11 stages, in process order (Section 11)
export const STAGE_ORDER: Stage[] = [
  "NEW_LEAD",
  "CONTACTED",
  "REQUIREMENT",
  "ESTIMATING",
  "QUOTATION_SENT",
  "FOLLOW_UP",
  "NEGOTIATION",
  "WAITING_APPROVAL",
  "WON",
  "LOST",
  "ON_HOLD",
];

export const STAGE_LABELS: Record<Stage, string> = {
  NEW_LEAD: "ลูกค้าใหม่",
  CONTACTED: "ติดต่อแล้ว",
  REQUIREMENT: "เก็บ Requirement",
  ESTIMATING: "ประเมินราคา",
  QUOTATION_SENT: "ส่งใบเสนอราคา",
  FOLLOW_UP: "ติดตามผล",
  NEGOTIATION: "ต่อรอง",
  WAITING_APPROVAL: "รออนุมัติ",
  WON: "ปิดการขาย (Won)",
  LOST: "เสียโอกาส (Lost)",
  ON_HOLD: "พักโครงการ (On Hold)",
};

export const STAGE_COLORS: Record<Stage, string> = {
  NEW_LEAD: "bg-slate-100 text-slate-700 border-slate-200",
  CONTACTED: "bg-sky-100 text-sky-800 border-sky-200",
  REQUIREMENT: "bg-cyan-100 text-cyan-800 border-cyan-200",
  ESTIMATING: "bg-indigo-100 text-indigo-800 border-indigo-200",
  QUOTATION_SENT: "bg-violet-100 text-violet-800 border-violet-200",
  FOLLOW_UP: "bg-amber-100 text-amber-800 border-amber-200",
  NEGOTIATION: "bg-orange-100 text-orange-800 border-orange-200",
  WAITING_APPROVAL: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
  WON: "bg-emerald-100 text-emerald-800 border-emerald-200",
  LOST: "bg-rose-100 text-rose-800 border-rose-200",
  ON_HOLD: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

export const STAGE_COLORS_HEX: Record<Stage, string> = {
  NEW_LEAD: "#94a3b8",
  CONTACTED: "#0ea5e9",
  REQUIREMENT: "#06b6d4",
  ESTIMATING: "#6366f1",
  QUOTATION_SENT: "#8b5cf6",
  FOLLOW_UP: "#f59e0b",
  NEGOTIATION: "#f97316",
  WAITING_APPROVAL: "#d946ef",
  WON: "#10b981",
  LOST: "#f43f5e",
  ON_HOLD: "#71717a",
};

export const CLOSED_STAGES: Stage[] = ["WON", "LOST"];
export const isClosedStage = (stage: Stage) => CLOSED_STAGES.includes(stage);
export const isOpenStage = (stage: Stage) => !isClosedStage(stage);

// Default win-probability per stage (Section 19) - seeded into
// ProbabilityConfig and editable by Management/Admin from there on.
export const DEFAULT_PROBABILITY: Record<Stage, number> = {
  NEW_LEAD: 10,
  CONTACTED: 15,
  REQUIREMENT: 25,
  ESTIMATING: 30,
  QUOTATION_SENT: 40,
  FOLLOW_UP: 50,
  NEGOTIATION: 70,
  WAITING_APPROVAL: 80,
  WON: 100,
  LOST: 0,
  ON_HOLD: 20,
};

export type Temperature = "HOT" | "WARM" | "COLD";

export const TEMPERATURE_LABELS: Record<Temperature, string> = {
  HOT: "HOT",
  WARM: "WARM",
  COLD: "COLD",
};

export const TEMPERATURE_COLORS: Record<Temperature, string> = {
  HOT: "bg-red-100 text-red-700 border-red-200",
  WARM: "bg-amber-100 text-amber-700 border-amber-200",
  COLD: "bg-blue-100 text-blue-700 border-blue-200",
};

export type ActivityType =
  | "CALL"
  | "WHATSAPP"
  | "LINE"
  | "FACEBOOK"
  | "EMAIL"
  | "MEETING"
  | "SITE_SURVEY"
  | "QUOTATION_SENT"
  | "FOLLOW_UP"
  | "NEGOTIATION"
  | "CUSTOMER_REPLY"
  | "INTERNAL_NOTE";

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  CALL: "โทรศัพท์",
  WHATSAPP: "WhatsApp",
  LINE: "LINE",
  FACEBOOK: "Facebook",
  EMAIL: "อีเมล",
  MEETING: "นัดพบ",
  SITE_SURVEY: "สำรวจหน้างาน",
  QUOTATION_SENT: "ส่งใบเสนอราคา",
  FOLLOW_UP: "ติดตามงาน",
  NEGOTIATION: "ต่อรอง",
  CUSTOMER_REPLY: "ลูกค้าตอบกลับ",
  INTERNAL_NOTE: "บันทึกภายใน",
};

export type QuotationStatus = "DRAFT" | "SENT" | "APPROVED" | "REJECTED" | "EXPIRED";

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  DRAFT: "ร่าง",
  SENT: "ส่งแล้ว",
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ถูกปฏิเสธ",
  EXPIRED: "หมดอายุ",
};

export type CustomerType = "NEW" | "EXISTING" | "REPEAT";
export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  NEW: "ลูกค้าใหม่",
  EXISTING: "ลูกค้าเดิม",
  REPEAT: "ลูกค้าประจำ",
};

export type CustomerSegment =
  | "RETAIL"
  | "SME"
  | "CORPORATE"
  | "GOVERNMENT"
  | "AGENCY"
  | "CONTRACTOR"
  | "RESELLER"
  | "PARTNER"
  | "OTHER";

export const CUSTOMER_SEGMENT_LABELS: Record<CustomerSegment, string> = {
  RETAIL: "รายย่อย (Retail)",
  SME: "SME",
  CORPORATE: "องค์กร (Corporate)",
  GOVERNMENT: "หน่วยงานราชการ",
  AGENCY: "เอเจนซี",
  CONTRACTOR: "ผู้รับเหมา",
  RESELLER: "ตัวแทนจำหน่าย",
  PARTNER: "พาร์ทเนอร์",
  OTHER: "อื่น ๆ",
};

export type WinflowStage =
  | "JOB_CREATED"
  | "DESIGN"
  | "PRODUCTION"
  | "QC"
  | "READY_FOR_DELIVERY"
  | "DELIVERED"
  | "INSTALLATION"
  | "COMPLETED";

export const WINFLOW_STAGE_ORDER: WinflowStage[] = [
  "JOB_CREATED",
  "DESIGN",
  "PRODUCTION",
  "QC",
  "READY_FOR_DELIVERY",
  "DELIVERED",
  "INSTALLATION",
  "COMPLETED",
];

export const WINFLOW_STAGE_LABELS: Record<WinflowStage, string> = {
  JOB_CREATED: "สร้างงานแล้ว",
  DESIGN: "ออกแบบ",
  PRODUCTION: "กำลังผลิต",
  QC: "ตรวจสอบคุณภาพ",
  READY_FOR_DELIVERY: "พร้อมส่งมอบ",
  DELIVERED: "จัดส่งแล้ว",
  INSTALLATION: "ติดตั้ง",
  COMPLETED: "เสร็จสมบูรณ์",
};

export type Role = "SALES" | "SALES_MANAGER" | "MANAGEMENT" | "ADMIN";

export const ROLE_LABELS: Record<Role, string> = {
  SALES: "พนักงานขาย",
  SALES_MANAGER: "หัวหน้าทีมขาย",
  MANAGEMENT: "ผู้บริหาร",
  ADMIN: "ผู้ดูแลระบบ",
};

// Weighted Pipeline = Opportunity Value x Probability (Section 20)
export function computeWeightedValue(value: number | null | undefined, probability: number) {
  if (!value) return 0;
  return Math.round(value * (probability / 100));
}

// Overdue classification (Section 15)
export type OverdueTier = "today" | "warning" | "high" | "critical";

export const OVERDUE_TIER_LABELS: Record<OverdueTier, string> = {
  today: "ครบกำหนดวันนี้",
  warning: "เลยกำหนด 1-3 วัน",
  high: "เลยกำหนด 4-7 วัน",
  critical: "เลยกำหนดเกิน 7 วัน",
};

export const OVERDUE_TIER_COLORS: Record<OverdueTier, string> = {
  today: "bg-amber-100 text-amber-700 border-amber-200",
  warning: "bg-orange-100 text-orange-700 border-orange-200",
  high: "bg-red-100 text-red-700 border-red-200",
  critical: "bg-rose-200 text-rose-800 border-rose-300",
};

export function getOverdueTier(overdueDays: number): OverdueTier | null {
  if (overdueDays === 0) return "today";
  if (overdueDays < 0) return null;
  if (overdueDays <= 3) return "warning";
  if (overdueDays <= 7) return "high";
  return "critical";
}

// Quotation aging buckets (Section 23)
export type AgingBucket = "0-3" | "4-7" | "8-14" | "15-30" | "30+";

export const AGING_BUCKET_LABELS: Record<AgingBucket, string> = {
  "0-3": "0-3 วัน",
  "4-7": "4-7 วัน",
  "8-14": "8-14 วัน",
  "15-30": "15-30 วัน",
  "30+": "มากกว่า 30 วัน",
};

export function getAgingBucket(days: number): AgingBucket {
  if (days <= 3) return "0-3";
  if (days <= 7) return "4-7";
  if (days <= 14) return "8-14";
  if (days <= 30) return "15-30";
  return "30+";
}
