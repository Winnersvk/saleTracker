export type LeadStatus = "QUOTING" | "CONTACTING" | "ORDERED" | "NOT_ORDERED";
export type PriceNotifyMethod = "CHAT" | "QUOTATION" | "ESTIMATE";
export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type Role = "ADMIN" | "SALES";

export type JobType = {
  id: string;
  name: string;
  active: boolean;
  sortOrder: number;
};

export type Channel = {
  id: string;
  name: string;
  active: boolean;
  sortOrder: number;
};

export type UserLite = {
  id: string;
  name: string;
};

export type FollowUp = {
  id: string;
  leadId: string;
  note: string;
  contactedAt: string;
  resultStatus: LeadStatus | null;
  createdById: string | null;
  createdAt: string;
  createdBy?: UserLite | null;
};

export type Lead = {
  id: string;
  name: string;
  phone: string | null;
  jobTypeId: string | null;
  channelId: string | null;
  contactStartDate: string | null;
  priceNotifyMethod: PriceNotifyMethod | null;
  status: LeadStatus;
  priority: Priority;
  notes: string | null;
  isDone: boolean;
  nextFollowUpDate: string | null;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
  jobType?: JobType | null;
  channel?: Channel | null;
  assignedTo?: UserLite | null;
  followUps?: FollowUp[];
  _count?: { followUps: number };
};

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
  _count?: { leads: number };
};

export type DashboardStats = {
  total: number;
  doneCount: number;
  notDoneCount: number;
  orderedTotal: number;
  conversionRate: number;
  overdueCount: number;
  dueTodayCount: number;
  statusBreakdown: { status: LeadStatus; count: number }[];
  priorityBreakdown: { priority: Priority; count: number }[];
  jobTypeBreakdown: {
    jobTypeId: string | null;
    name: string;
    count: number;
    ordered: number;
  }[];
  channelBreakdown: {
    channelId: string | null;
    name: string;
    count: number;
    ordered: number;
    conversionRate: number;
  }[];
  repLeaderboard: {
    userId: string | null;
    name: string;
    count: number;
    ordered: number;
    conversionRate: number;
  }[];
  weeklyTrend: { weekStart: string; count: number }[];
};
