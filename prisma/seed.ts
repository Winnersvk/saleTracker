import { PrismaClient, LeadStatus, PriceNotifyMethod, Priority, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import seedData from "./seed-data.json";

const prisma = new PrismaClient();

const STATUS_MAP: Record<string, LeadStatus> = {
  "เสนอราคา": "QUOTING",
  "กำลังติดต่อ": "CONTACTING",
  "สั่งงานแล้ว": "ORDERED",
  "บ่สั่งงาน": "NOT_ORDERED",
};

const PRICE_NOTIFY_MAP: Record<string, PriceNotifyMethod> = {
  "แจ้งราคาทางแชท": "CHAT",
  "ใบเสนอราคา": "QUOTATION",
  "ปะเมินราคา": "ESTIMATE",
};

const PRIORITY_MAP: Record<string, Priority> = {
  High: "HIGH",
  Low: "LOW",
};

function parseFollowUpCount(raw: string | null): number {
  if (!raw) return 0;
  const match = raw.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

async function main() {
  console.log("Seeding admin user...");
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Winner2026!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: "aoy@winnersign.local" },
    update: {},
    create: {
      name: "AOY",
      email: "aoy@winnersign.local",
      passwordHash,
      role: "ADMIN" as Role,
    },
  });

  console.log("Seeding channels...");
  const channelMap = new Map<string, string>();
  for (let i = 0; i < seedData.channels.length; i++) {
    const name = seedData.channels[i].trim();
    if (!name) continue;
    const channel = await prisma.channel.upsert({
      where: { name },
      update: {},
      create: { name, sortOrder: i },
    });
    channelMap.set(name, channel.id);
  }

  console.log("Seeding job types...");
  const jobTypeMap = new Map<string, string>();
  for (let i = 0; i < seedData.jobTypes.length; i++) {
    const name = seedData.jobTypes[i].trim();
    if (!name) continue;
    const jobType = await prisma.jobType.upsert({
      where: { name },
      update: {},
      create: { name, sortOrder: i },
    });
    jobTypeMap.set(name, jobType.id);
  }

  console.log(`Seeding ${seedData.leads.length} leads...`);
  let created = 0;
  for (const raw of seedData.leads) {
    const followUpCount = parseFollowUpCount(raw.followUpCountRaw);
    const status = raw.status ? STATUS_MAP[raw.status] ?? "CONTACTING" : "CONTACTING";
    const priceNotifyMethod = raw.priceNotifyMethod
      ? PRICE_NOTIFY_MAP[raw.priceNotifyMethod] ?? null
      : null;
    const priority = raw.priority ? PRIORITY_MAP[raw.priority] ?? "MEDIUM" : "MEDIUM";
    const jobTypeId = raw.jobType ? jobTypeMap.get(raw.jobType) ?? null : null;
    const channelId = raw.channel ? channelMap.get(raw.channel) ?? null : null;
    const contactStartDate = raw.contactStartDate ? new Date(raw.contactStartDate) : null;

    const lead = await prisma.lead.create({
      data: {
        name: raw.name ?? "ไม่ระบุชื่อ",
        jobTypeId,
        channelId,
        contactStartDate,
        priceNotifyMethod,
        status,
        priority,
        notes: raw.notes ?? null,
        isDone: raw.done ?? false,
        assignedToId: admin.id,
      },
    });

    if (followUpCount > 0) {
      await prisma.followUp.create({
        data: {
          leadId: lead.id,
          note: `นำเข้าจากระบบเดิม (Excel): ติดตามมาแล้ว ${followUpCount} ครั้ง${
            raw.notes ? ` — ${raw.notes}` : ""
          }`,
          contactedAt: contactStartDate ?? new Date(),
          resultStatus: status,
          createdById: admin.id,
        },
      });
    }

    created++;
    if (created % 100 === 0) console.log(`  ...${created} leads created`);
  }

  console.log(`Done. Created ${created} leads.`);
  console.log(`Admin login: aoy@winnersign.local / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
