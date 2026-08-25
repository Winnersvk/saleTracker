import type {
  ActivityType,
  CustomerSegment,
  CustomerType,
  QuotationStatus,
  Role,
  Stage,
  Temperature,
  WinflowStage,
} from "@/lib/pipeline";

export type { ActivityType, CustomerSegment, CustomerType, QuotationStatus, Role, Stage, Temperature, WinflowStage };

export type JobType = { id: string; name: string; active: boolean; sortOrder: number };
export type Channel = { id: string; name: string; active: boolean; sortOrder: number };
export type LeadSource = { id: string; name: string; active: boolean; sortOrder: number };
export type LostReason = { id: string; name: string; active: boolean; sortOrder: number };
export type Team = { id: string; name: string };

export type UserLite = { id: string; name: string };

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: Role;
  teamId: string | null;
  team?: Team | null;
  active: boolean;
  createdAt: string;
  _count?: { opportunities: number };
};

export type Customer = {
  id: string;
  customerCode: string;
  peakCustomerId: string | null;
  name: string;
  companyName: string | null;
  customerType: CustomerType;
  segment: CustomerSegment | null;
  contactPerson: string | null;
  position: string | null;
  phone: string | null;
  whatsapp: string | null;
  line: string | null;
  facebook: string | null;
  email: string | null;
  address: string | null;
  district: string | null;
  province: string | null;
  country: string | null;
  mapLocation: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { opportunities: number };
};

export type Quotation = {
  id: string;
  opportunityId: string;
  quotationNo: string | null;
  quotationDate: string | null;
  amount: number;
  status: QuotationStatus;
  isAccepted: boolean;
  createdAt: string;
};

export type Activity = {
  id: string;
  opportunityId: string;
  type: ActivityType;
  occurredAt: string;
  createdById: string | null;
  note: string | null;
  followUpRequired: boolean;
  nextFollowUpDate: string | null;
  createdAt: string;
  createdBy?: UserLite | null;
};

export type StageHistoryEntry = {
  id: string;
  opportunityId: string;
  previousStage: Stage | null;
  newStage: Stage;
  changedAt: string;
  changedBy?: UserLite | null;
};

export type WinflowJob = {
  id: string;
  opportunityId: string;
  jobNo: string | null;
  stage: WinflowStage;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Opportunity = {
  id: string;
  name: string;
  customerId: string;
  salesOwnerId: string | null;
  teamId: string | null;
  jobTypeId: string | null;
  description: string | null;
  quantity: string | null;
  estimatedSize: string | null;
  requiredDate: string | null;
  installationRequired: boolean;
  location: string | null;
  budget: number | null;
  leadSourceId: string | null;
  channelId: string | null;
  stage: Stage;
  temperature: Temperature;
  probability: number;
  estimatedValue: number | null;
  lastActivityDate: string | null;
  nextFollowUpDate: string | null;
  nextFollowUpTime: string | null;
  nextAction: string | null;
  wonDate: string | null;
  lostDate: string | null;
  lostReasonId: string | null;
  lostRemark: string | null;
  onHoldReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer | null;
  salesOwner?: UserLite | null;
  jobType?: JobType | null;
  leadSource?: LeadSource | null;
  channel?: Channel | null;
  lostReason?: LostReason | null;
  quotations?: Quotation[];
  activities?: Activity[];
  stageHistory?: StageHistoryEntry[];
  winflowJob?: WinflowJob | null;
  _count?: { activities: number };
  // Derived, computed server-side and included in list/detail responses
  weightedValue?: number;
  overdueDays?: number | null;
  latestQuotation?: Quotation | null;
  acceptedQuotation?: Quotation | null;
};

export type SalesDashboardStats = {
  newLeadsToday: number;
  followUpToday: number;
  overdue: number;
  hotDeals: number;
  quotationWaiting: number;
  wonThisMonth: number;
  todaysActions: Opportunity[];
  pipelineByStage: { stage: Stage; count: number; value: number }[];
};

export type ManagerDashboardStats = {
  newLeads: number;
  openOpportunities: number;
  quotationSent: number;
  followUpToday: number;
  overdue: number;
  won: number;
  lost: number;
  winRate: number;
  pipelineValue: number;
  funnel: { stage: Stage; count: number }[];
  salesPerformance: {
    userId: string;
    name: string;
    leads: number;
    opportunities: number;
    quotations: number;
    won: number;
    lost: number;
    winRate: number;
    pipelineValue: number;
    wonValue: number;
    overdue: number;
    avgSalesCycleDays: number | null;
  }[];
  noActivity: Opportunity[];
  quotationAging: { bucket: string; count: number; value: number }[];
  lostReasons: { reason: string; count: number; value: number; percent: number }[];
};

export type ExecutiveDashboardStats = {
  totalPipeline: number;
  weightedPipeline: number;
  wonValue: number;
  winRate: number;
  avgDealSize: number;
  avgSalesCycleDays: number | null;
  newCustomers: number;
  repeatCustomers: number;
  monthlyTrend: {
    month: string;
    leads: number;
    quotationValue: number;
    wonValue: number;
    lostValue: number;
    conversionRate: number;
    pipelineValue: number;
  }[];
  leadSourcePerformance: {
    name: string;
    leads: number;
    quotations: number;
    won: number;
    winRate: number;
    wonValue: number;
  }[];
  productPerformance: {
    name: string;
    opportunities: number;
    quotationValue: number;
    won: number;
    lost: number;
    conversion: number;
    wonValue: number;
    avgDeal: number;
  }[];
  repPerformance: {
    userId: string;
    name: string;
    opportunities: number;
    won: number;
    lost: number;
    winRate: number;
    wonValue: number;
  }[];
  customerPerformance: {
    newCustomers: number;
    existingCustomers: number;
    repeatCustomers: number;
    repeatPurchaseRate: number;
    topCustomers: { id: string; name: string; wonValue: number; opportunities: number }[];
    dormantCustomers: { id: string; name: string; lastActivityDate: string | null }[];
  };
  reps: UserLite[];
};

export type RepDashboardStats = {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    active: boolean;
    team: { id: string; name: string } | null;
  };
  totals: {
    opportunities: number;
    won: number;
    lost: number;
    wonValue: number;
    pipelineValue: number;
    overdue: number;
  };
  kpis: {
    winRate: number;
    leadConversion: number;
    quoteConversion: number;
    avgDealSize: number;
    avgSalesCycleDays: number | null;
    followUpCompletionRate: number | null;
    followUpsCompleted30d: number;
    followUpsOverdue: number;
  };
  newLeadsToday: number;
  followUpToday: number;
  hotDeals: number;
  quotationWaiting: number;
  wonThisMonth: number;
  todaysActions: Opportunity[];
  pipelineByStage: { stage: Stage; count: number; value: number }[];
  recentActivities: (Activity & { opportunity: { id: string; name: string } })[];
};
