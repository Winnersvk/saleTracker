import { z } from "zod";

export const leadStatusEnum = z.enum([
  "QUOTING",
  "CONTACTING",
  "ORDERED",
  "NOT_ORDERED",
]);

export const priceNotifyEnum = z.enum(["CHAT", "QUOTATION", "ESTIMATE"]);

export const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const createLeadSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อลูกค้า/งาน"),
  phone: z.string().optional().nullable(),
  jobTypeId: z.string().optional().nullable(),
  channelId: z.string().optional().nullable(),
  contactStartDate: z.string().optional().nullable(),
  priceNotifyMethod: priceNotifyEnum.optional().nullable(),
  status: leadStatusEnum.optional(),
  priority: priorityEnum.optional(),
  notes: z.string().optional().nullable(),
  isDone: z.boolean().optional(),
  nextFollowUpDate: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const createFollowUpSchema = z.object({
  note: z.string().min(1, "กรุณาระบุรายละเอียดการติดตาม"),
  contactedAt: z.string().optional(),
  resultStatus: leadStatusEnum.optional().nullable(),
  nextFollowUpDate: z.string().optional().nullable(),
});

export const upsertNamedEntitySchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อ"),
  active: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6, "รหัสผ่านอย่างน้อย 6 ตัวอักษร"),
  role: z.enum(["ADMIN", "SALES"]).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "SALES"]).optional(),
  active: z.boolean().optional(),
});
