import type { Prisma, PrismaClient } from "@prisma/client";

type TxClient = PrismaClient | Prisma.TransactionClient;

// Generic audit trail for key field changes (Section 48).
export async function writeAudit(
  tx: TxClient,
  entry: {
    entityType: string;
    entityId: string;
    field: string;
    previousValue: string | null;
    newValue: string | null;
    changedById: string | null;
  }
) {
  if (entry.previousValue === entry.newValue) return;
  await tx.auditLog.create({ data: entry });
}
