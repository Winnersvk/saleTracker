export const STATUS_LABELS: Record<string, string> = {
  QUOTING: "เสนอราคา",
  CONTACTING: "กำลังติดต่อ",
  ORDERED: "สั่งงานแล้ว",
  NOT_ORDERED: "บ่สั่งงาน",
};

export const STATUS_COLORS: Record<string, string> = {
  QUOTING: "bg-amber-100 text-amber-800 border-amber-200",
  CONTACTING: "bg-sky-100 text-sky-800 border-sky-200",
  ORDERED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  NOT_ORDERED: "bg-rose-100 text-rose-800 border-rose-200",
};

export const PRICE_NOTIFY_LABELS: Record<string, string> = {
  CHAT: "แจ้งราคาทางแชท",
  QUOTATION: "ใบเสนอราคา",
  ESTIMATE: "ประเมินราคา",
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: "ต่ำ",
  MEDIUM: "ปานกลาง",
  HIGH: "สูง",
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600 border-slate-200",
  MEDIUM: "bg-blue-100 text-blue-700 border-blue-200",
  HIGH: "bg-red-100 text-red-700 border-red-200",
};

export const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);
export const PRICE_NOTIFY_OPTIONS = Object.entries(PRICE_NOTIFY_LABELS).map(
  ([value, label]) => ({ value, label })
);
export const PRIORITY_OPTIONS = Object.entries(PRIORITY_LABELS).map(
  ([value, label]) => ({ value, label })
);
