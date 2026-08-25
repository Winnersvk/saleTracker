import { PrismaClient, Stage, Temperature, CustomerType } from "@prisma/client";
import bcrypt from "bcryptjs";
import seedData from "./seed-data.json";
import { DEFAULT_PROBABILITY } from "../lib/pipeline";

const prisma = new PrismaClient();

const STATUS_TO_STAGE: Record<string, Stage> = {
  "เสนอราคา": "QUOTATION_SENT",
  "กำลังติดต่อ": "CONTACTED",
  "สั่งงานแล้ว": "WON",
  "บ่สั่งงาน": "LOST",
};

const PRIORITY_TO_TEMPERATURE: Record<string, Temperature> = {
  High: "HOT",
  Low: "COLD",
};

const LEAD_SOURCES = [
  "Facebook Ads",
  "Facebook Organic",
  "TikTok",
  "Google",
  "Website",
  "Walk-in",
  "Existing Customer",
  "Customer Referral",
  "Sales Prospecting",
  "Agency",
  "Partner",
  "Event",
  "ข้อมูลเดิม (นำเข้าจาก Excel)",
  "Other",
];

const LOST_REASONS = [
  "ราคาแพง",
  "งบไม่พอ",
  "เลือกคู่แข่ง",
  "Supplier เดิม",
  "ขอราคาเปรียบเทียบ",
  "Deadline ไม่ทัน",
  "ติดต่อไม่ได้",
  "Project Cancelled",
  "Project Postponed",
  "Product ไม่ตรง Requirement",
  "เราไม่สามารถผลิตได้",
  "ลูกค้าสั่งเองจากต่างประเทศ",
  "อื่น ๆ",
];

function parseFollowUpCount(raw: string | null): number {
  if (!raw) return 0;
  const match = raw.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

async function main() {
  console.log("Clearing previously imported customers/opportunities (safe to re-run)...");
  await prisma.opportunity.deleteMany({});
  await prisma.customer.deleteMany({});

  console.log("Seeding team + admin user...");
  const team = await prisma.team.upsert({
    where: { name: "ทีมขาย Winner Sign" },
    update: {},
    create: { name: "ทีมขาย Winner Sign" },
  });

  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Winner2026!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: "aoy@winnersign.local" },
    update: {},
    create: {
      name: "AOY",
      email: "aoy@winnersign.local",
      passwordHash,
      role: "ADMIN",
      teamId: team.id,
    },
  });

  console.log("Seeding probability config...");
  for (const [stage, percent] of Object.entries(DEFAULT_PROBABILITY)) {
    await prisma.probabilityConfig.upsert({
      where: { stage: stage as Stage },
      update: {},
      create: { stage: stage as Stage, percent },
    });
  }

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

  console.log("Seeding lead sources...");
  const leadSourceMap = new Map<string, string>();
  for (let i = 0; i < LEAD_SOURCES.length; i++) {
    const name = LEAD_SOURCES[i];
    const source = await prisma.leadSource.upsert({
      where: { name },
      update: {},
      create: { name, sortOrder: i },
    });
    leadSourceMap.set(name, source.id);
  }
  const importedLeadSourceId = leadSourceMap.get("ข้อมูลเดิม (นำเข้าจาก Excel)")!;

  console.log("Seeding lost reasons...");
  const lostReasonMap = new Map<string, string>();
  for (let i = 0; i < LOST_REASONS.length; i++) {
    const name = LOST_REASONS[i];
    const reason = await prisma.lostReason.upsert({
      where: { name },
      update: {},
      create: { name, sortOrder: i },
    });
    lostReasonMap.set(name, reason.id);
  }
  const defaultLostReasonId = lostReasonMap.get("อื่น ๆ")!;

  console.log(`Seeding customers + ${seedData.leads.length} opportunities...`);
  const customerIdByName = new Map<string, string>();
  const opportunityCountByName = new Map<string, number>();
  for (const raw of seedData.leads) {
    const name = (raw.name ?? "").trim();
    if (!name) continue;
    opportunityCountByName.set(name, (opportunityCountByName.get(name) ?? 0) + 1);
  }

  let customerSeq = 0;
  let created = 0;

  for (const raw of seedData.leads) {
    const name = (raw.name ?? "").trim();
    if (!name) continue;

    let customerId = customerIdByName.get(name);
    if (!customerId) {
      customerSeq += 1;
      const opportunityCount = opportunityCountByName.get(name) ?? 1;
      const customer = await prisma.customer.create({
        data: {
          customerCode: `CUS-${String(customerSeq).padStart(4, "0")}`,
          name,
          customerType: (opportunityCount > 1 ? "REPEAT" : "EXISTING") as CustomerType,
        },
      });
      customerId = customer.id;
      customerIdByName.set(name, customer.id);
    }

    const stage = raw.status ? STATUS_TO_STAGE[raw.status] ?? "CONTACTED" : "CONTACTED";
    const temperature = raw.priority ? PRIORITY_TO_TEMPERATURE[raw.priority] ?? "WARM" : "WARM";
    const jobTypeId = raw.jobType ? jobTypeMap.get(raw.jobType) ?? null : null;
    const channelId = raw.channel ? channelMap.get(raw.channel) ?? null : null;
    const createdAt = raw.contactStartDate ? new Date(raw.contactStartDate) : new Date();
    const followUpCount = parseFollowUpCount(raw.followUpCountRaw);
    const jobTypeName = raw.jobType ?? "งานไม่ระบุประเภท";

    const opportunity = await prisma.opportunity.create({
      data: {
        name: jobTypeName,
        customerId,
        salesOwnerId: admin.id,
        teamId: team.id,
        jobTypeId,
        channelId,
        leadSourceId: importedLeadSourceId,
        stage,
        temperature,
        probability: DEFAULT_PROBABILITY[stage],
        notes: raw.notes ?? null,
        createdAt,
        lastActivityDate: createdAt,
        wonDate: stage === "WON" ? createdAt : null,
        lostDate: stage === "LOST" ? createdAt : null,
        lostReasonId: stage === "LOST" ? defaultLostReasonId : null,
        lostRemark: stage === "LOST" ? raw.notes ?? null : null,
      },
    });

    await prisma.stageHistory.create({
      data: {
        opportunityId: opportunity.id,
        previousStage: null,
        newStage: stage,
        changedById: admin.id,
        changedAt: createdAt,
      },
    });

    if (followUpCount > 0) {
      await prisma.activity.create({
        data: {
          opportunityId: opportunity.id,
          type: "FOLLOW_UP",
          occurredAt: createdAt,
          note: `นำเข้าจากระบบเดิม (Excel): ติดตามมาแล้ว ${followUpCount} ครั้ง${
            raw.notes ? ` — ${raw.notes}` : ""
          }`,
          createdById: admin.id,
        },
      });
    }

    created++;
    if (created % 100 === 0) console.log(`  ...${created} opportunities created`);
  }

  console.log(`Done. Created ${customerSeq} customers, ${created} opportunities.`);
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
