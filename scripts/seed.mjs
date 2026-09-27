// Seeds the database with clearly-marked demo scam reports so the community
// intelligence pages and admin dashboard have something to show immediately.
// Run with: npm run seed

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "scamshield";

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set. Add it to your .env.local file first.");
  process.exit(1);
}

const ScamReportSchema = new mongoose.Schema(
  {},
  { strict: false, collection: "scamreports" }
);

const ScamEntitySchema = new mongoose.Schema(
  {},
  { strict: false, collection: "scamentities" }
);

const ScamReport = mongoose.model("ScamReport", ScamReportSchema);
const ScamEntity = mongoose.model("ScamEntity", ScamEntitySchema);

const demoReports = [
  {
    reportId: "SSB-DEMO-0001",
    scamType: "Fake Online Shop",
    platform: "Facebook",
    accountName: "Dhaka Fashion Hub BD",
    description:
      "Page offering 80% discount, demanded bKash payment before delivery, never delivered.",
    status: "community_flagged",
    riskScore: 78,
    riskLevel: "High Risk",
    signals: ["advance_payment", "urgency", "payment_instruction"],
    patternTag: "fake_job_recruitment",
    isDemo: true,
  },
  {
    reportId: "SSB-DEMO-0002",
    scamType: "Fraudulent Job Offer",
    platform: "WhatsApp",
    accountName: "BD Remote Jobs",
    description:
      "High salary work-from-home offer asking for a registration fee upfront.",
    status: "verified",
    riskScore: 82,
    riskLevel: "Critical",
    signals: ["job_scam", "advance_payment"],
    patternTag: "fake_job_recruitment",
    isDemo: true,
  },
  {
    reportId: "SSB-DEMO-0003",
    scamType: "Phishing Link",
    platform: "SMS",
    url: "http://bkash-verify-account.xyz",
    description:
      "SMS link claiming bKash account will be suspended, asked to confirm account details.",
    status: "verified",
    riskScore: 91,
    riskLevel: "Critical",
    signals: ["phishing_language", "suspicious_url_pattern"],
    patternTag: "phishing_link",
    isDemo: true,
  },
  {
    reportId: "SSB-DEMO-0004",
    scamType: "Investment Scheme",
    platform: "Facebook",
    accountName: "BD Profit Circle",
    description:
      "Guaranteed daily profit investment scheme, asked for advance investment via Nagad.",
    status: "community_flagged",
    riskScore: 75,
    riskLevel: "High Risk",
    signals: ["unrealistic_promise", "advance_payment"],
    patternTag: "investment_scheme",
    isDemo: true,
  },
  {
    reportId: "SSB-DEMO-0005",
    scamType: "Suspicious Phone Number",
    platform: "Phone Call",
    phone: "01710000000",
    description:
      "Caller impersonated a bank officer and asked for OTP to 'verify' the account.",
    status: "under_review",
    riskScore: 88,
    riskLevel: "Critical",
    signals: ["otp_request", "fake_authority", "urgency"],
    patternTag: "otp_phishing",
    isDemo: true,
  },
];

async function run() {
  await mongoose.connect(MONGODB_URI, {
    dbName: MONGODB_DB,
  });

  console.log(`Connected to database: ${MONGODB_DB}`);
  console.log("Seeding demo reports...");

  for (const r of demoReports) {
    await ScamReport.findOneAndUpdate(
      { reportId: r.reportId },
      { ...r, createdAt: new Date() },
      { upsert: true }
    );
  }

  const entities = [
    {
      entityKey: "account:dhaka fashion hub bd",
      entityType: "account",
      displayValue: "Dhaka Fashion Hub BD",
      reportCount: 4,
      averageRiskScore: 78,
      status: "community_flagged",
    },
    {
      entityKey: "url:bkash-verify-account.xyz",
      entityType: "url",
      displayValue: "bkash-verify-account.xyz",
      reportCount: 6,
      averageRiskScore: 91,
      status: "verified",
    },
    {
      entityKey: "phone:01710000000",
      entityType: "phone",
      displayValue: "01710000000",
      reportCount: 3,
      averageRiskScore: 88,
      status: "under_review",
    },
  ];

  for (const e of entities) {
    await ScamEntity.findOneAndUpdate(
      { entityKey: e.entityKey },
      e,
      { upsert: true }
    );
  }

  console.log(
    `Seeded ${demoReports.length} demo reports and ${entities.length} entities.`
  );

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});