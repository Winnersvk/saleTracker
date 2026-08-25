import { z } from "zod";

export const stageEnum = z.enum([
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
]);

export const temperatureEnum = z.enum(["HOT", "WARM", "COLD"]);
export const activityTypeEnum = z.enum([
  "CALL",
  "WHATSAPP",
  "LINE",
  "FACEBOOK",
  "EMAIL",
  "MEETING",
  "SITE_SURVEY",
  "QUOTATION_SENT",
  "FOLLOW_UP",
  "NEGOTIATION",
  "CUSTOMER_REPLY",
  "INTERNAL_NOTE",
]);
export const quotationStatusEnum = z.enum(["DRAFT", "SENT", "APPROVED", "REJECTED", "EXPIRED"]);
export const customerTypeEnum = z.enum(["NEW", "EXISTING", "REPEAT"]);
export const customerSegmentEnum = z.enum([
  "RETAIL",
  "SME",
  "CORPORATE",
  "GOVERNMENT",
  "AGENCY",
  "CONTRACTOR",
  "RESELLER",
  "PARTNER",
  "OTHER",
]);
export const winflowStageEnum = z.enum([
  "JOB_CREATED",
  "DESIGN",
  "PRODUCTION",
  "QC",
  "READY_FOR_DELIVERY",
  "DELIVERED",
  "INSTALLATION",
  "COMPLETED",
]);
export const roleEnum = z.enum(["SALES", "SALES_MANAGER", "MANAGEMENT", "ADMIN"]);

export const createCustomerSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อลูกค้า"),
  companyName: z.string().optional().nullable(),
  customerType: customerTypeEnum.optional(),
  segment: customerSegmentEnum.optional().nullable(),
  peakCustomerId: z.string().optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  line: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  mapLocation: z.string().optional().nullable(),
});
export const updateCustomerSchema = createCustomerSchema.partial();

export const createOpportunitySchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่องาน"),
  customerId: z.string().min(1, "กรุณาเลือกลูกค้า"),
  salesOwnerId: z.string().optional().nullable(),
  jobTypeId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  quantity: z.string().optional().nullable(),
  estimatedSize: z.string().optional().nullable(),
  requiredDate: z.string().optional().nullable(),
  installationRequired: z.boolean().optional(),
  location: z.string().optional().nullable(),
  budget: z.number().optional().nullable(),
  leadSourceId: z.string().optional().nullable(),
  channelId: z.string().optional().nullable(),
  stage: stageEnum.optional(),
  temperature: temperatureEnum.optional(),
  probability: z.number().min(0).max(100).optional(),
  estimatedValue: z.number().optional().nullable(),
  nextFollowUpDate: z.string().optional().nullable(),
  nextFollowUpTime: z.string().optional().nullable(),
  nextAction: z.string().optional().nullable(),
  lostReasonId: z.string().optional().nullable(),
  lostRemark: z.string().optional().nullable(),
  onHoldReason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export const updateOpportunitySchema = createOpportunitySchema.partial();

export const changeStageSchema = z.object({
  stage: stageEnum,
  lostReasonId: z.string().optional().nullable(),
  lostRemark: z.string().optional().nullable(),
  onHoldReason: z.string().optional().nullable(),
});

export const reassignSchema = z.object({
  toUserId: z.string().min(1),
  reason: z.string().optional().nullable(),
});

export const createActivitySchema = z.object({
  type: activityTypeEnum,
  occurredAt: z.string().optional(),
  note: z.string().optional().nullable(),
  followUpRequired: z.boolean().optional(),
  nextFollowUpDate: z.string().optional().nullable(),
  resultStage: stageEnum.optional().nullable(),
});

export const createQuotationSchema = z.object({
  quotationNo: z.string().optional().nullable(),
  quotationDate: z.string().optional().nullable(),
  amount: z.number().positive("กรุณาระบุมูลค่าใบเสนอราคา"),
  status: quotationStatusEnum.optional(),
  isAccepted: z.boolean().optional(),
});
export const updateQuotationSchema = createQuotationSchema.partial();

export const upsertNamedEntitySchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อ"),
  active: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export const upsertTeamSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อทีม"),
});

export const upsertProbabilityConfigSchema = z.object({
  stage: stageEnum,
  percent: z.number().min(0).max(100),
});

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6, "รหัสผ่านอย่างน้อย 6 ตัวอักษร"),
  role: roleEnum.optional(),
  teamId: z.string().optional().nullable(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: roleEnum.optional(),
  teamId: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

export const upsertWinflowJobSchema = z.object({
  jobNo: z.string().optional().nullable(),
  stage: winflowStageEnum.optional(),
  notes: z.string().optional().nullable(),
});
