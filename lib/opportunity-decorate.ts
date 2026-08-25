import { computeWeightedValue } from "@/lib/pipeline";
import { daysSince } from "@/lib/date";

export const opportunityListInclude = {
  customer: true,
  jobType: true,
  leadSource: true,
  channel: true,
  lostReason: true,
  salesOwner: { select: { id: true, name: true } },
  quotations: { orderBy: { createdAt: "desc" as const } },
  _count: { select: { activities: true } },
};

export const opportunityDetailInclude = {
  customer: true,
  jobType: true,
  leadSource: true,
  channel: true,
  lostReason: true,
  salesOwner: { select: { id: true, name: true } },
  quotations: { orderBy: { createdAt: "desc" as const } },
  activities: {
    orderBy: { occurredAt: "desc" as const },
    include: { createdBy: { select: { id: true, name: true } } },
  },
  stageHistory: {
    orderBy: { changedAt: "desc" as const },
    include: { changedBy: { select: { id: true, name: true } } },
  },
  winflowJob: true,
};

export function decorateOpportunity<
  T extends {
    estimatedValue: number | null;
    probability: number;
    nextFollowUpDate: Date | string | null;
    quotations?: { amount: number; isAccepted: boolean; createdAt: Date | string }[];
  }
>(o: T) {
  type Quotation = NonNullable<T["quotations"]>[number];
  const quotations = (o.quotations ?? []) as Quotation[];
  const acceptedQuotation = quotations.find((q) => q.isAccepted) ?? null;
  const latestQuotation = quotations[0] ?? null;
  const value = acceptedQuotation?.amount ?? latestQuotation?.amount ?? o.estimatedValue ?? 0;
  const overdueDays = o.nextFollowUpDate ? daysSince(o.nextFollowUpDate) : null;
  return {
    ...o,
    weightedValue: computeWeightedValue(value, o.probability),
    overdueDays,
    latestQuotation,
    acceptedQuotation,
  };
}
