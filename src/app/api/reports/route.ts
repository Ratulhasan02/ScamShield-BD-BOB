import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import ScamReport from "@/lib/models/ScamReport";
import ScamEntity from "@/lib/models/ScamEntity";
import ScamPattern from "@/lib/models/ScamPattern";
import { generateReportId, entityKeyFor, maskPhone, isNearDuplicate } from "@/lib/utils";
import { runRiskEngine, detectPattern } from "@/lib/riskEngine";
import { extractScreenshotText } from "@/lib/aiAnalysis";

// Simple in-memory rate limit: 10 reports / 10 minutes per IP.
const hits = new Map<string, { count: number; reset: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const e = hits.get(ip);
  if (!e || now > e.reset) {
    hits.set(ip, { count: 1, reset: now + 600_000 });
    return false;
  }
  e.count += 1;
  return e.count > 10;
}

const ReportSchema = z.object({
  scamType: z.string().min(2).max(80),
  platform: z.string().min(2).max(80),
  phone: z.string().max(30).optional(),
  url: z.string().max(500).optional(),
  accountName: z.string().max(200).optional(),
  description: z.string().min(10).max(3000),
  evidenceText: z.string().max(3000).optional(),
  screenshotDataUrl: z.string().max(6_000_000).optional(),
  amountInvolved: z.number().min(0).max(100_000_000).optional(),
  incidentDate: z.string().max(30).optional(),
  location: z.string().max(80).optional(),
  reporterContact: z.string().max(120).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (rateLimited(ip)) {
      return NextResponse.json({ error: "Too many reports. Please try again later." }, { status: 429 });
    }
    await connectDB();
    const body = await req.json();
    const parsed = ReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid report data", details: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    const reportId = generateReportId();

    // Screenshot OCR: if a screenshot was uploaded but no typed evidence,
    // auto-extract its text into the same rawText pipeline.
    let ocrText = "";
    if (data.screenshotDataUrl && !(data.evidenceText || "").trim()) {
      ocrText = await extractScreenshotText(data.screenshotDataUrl);
    }

    const rawText = `${data.description} ${data.evidenceText || ""} ${ocrText} ${data.scamType} ${data.platform}`.toLowerCase();
    const ruleResult = runRiskEngine({
      inputType: "message",
      rawText,
      original: data.description,
      communityReportCount: 0,
      isNewEntity: true,
    });
    const pattern = detectPattern(ruleResult.signals.map((s) => s.id));

    const report = await ScamReport.create({
      reportId,
      scamType: data.scamType,
      platform: data.platform,
      phone: data.phone,
      url: data.url,
      accountName: data.accountName,
      description: data.description,
      evidenceText: [data.evidenceText, ocrText].filter(Boolean).join("\n").slice(0, 3000) || undefined,
      screenshotDataUrl: data.screenshotDataUrl,
      amountInvolved: data.amountInvolved,
      incidentDate: data.incidentDate,
      location: data.location,
      reporterContact: data.reporterContact,
      status: "reported",
      riskScore: ruleResult.score,
      riskLevel: ruleResult.level,
      signals: ruleResult.signals.map((s) => s.id),
      patternTag: pattern?.key,
    });

    // Update / create the aggregated entity record used for community intelligence.
    // Near-duplicate merge: a close (non-exact) phone/URL match merges into
    // the existing entity instead of diluting DNA counts across two rows.
    const entityValue = data.phone || data.url || data.accountName;
    let mergedInto: string | null = null;
    if (entityValue) {
      const entityType = data.phone ? "phone" : data.url ? "url" : "account";
      const key = entityKeyFor(entityType, entityValue);
      const existing = await ScamEntity.findOne({ entityKey: key });
      if (existing) {
        const newCount = existing.reportCount + 1;
        existing.reportCount = newCount;
        existing.lastReportedAt = new Date();
        existing.averageRiskScore = Math.round(
          (existing.averageRiskScore * (newCount - 1) + ruleResult.score) / newCount
        );
        existing.status = newCount >= 3 ? "community_flagged" : existing.status;
        await existing.save();
      } else {
        const near = await ScamEntity.find({ entityType }).sort({ lastReportedAt: -1 }).limit(50).lean();
        const dup = near.find((c) => isNearDuplicate(String(c.displayValue || ""), entityValue));
        if (dup) {
          mergedInto = dup.entityKey;
          await ScamEntity.updateOne(
            { entityKey: dup.entityKey },
            {
              $inc: { reportCount: 1 },
              $set: { lastReportedAt: new Date() },
            }
          );
        } else {
          await ScamEntity.create({
            entityKey: key,
            entityType,
            displayValue: entityValue,
            reportCount: 1,
            averageRiskScore: ruleResult.score,
            status: "reported",
          });
        }
      }
    }

    if (pattern) {
      await ScamPattern.findOneAndUpdate(
        { patternKey: pattern.key },
        {
          $setOnInsert: { nameEn: pattern.nameEn, nameBn: pattern.nameBn, commonSignals: pattern.requiredSignals },
          $inc: { reportCount: 1 },
        },
        { upsert: true }
      );
    }

    return NextResponse.json({
      message: "Report submitted successfully",
      reportId,
      riskScore: ruleResult.score,
      riskLevel: ruleResult.level,
      scamPattern: pattern,
      mergedInto,
      ocrUsed: Boolean(ocrText),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not submit report. Please try again." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const scamType = searchParams.get("scamType");
    const q = searchParams.get("q");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "12", 10));

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (scamType) filter.scamType = scamType;
    if (q) {
      filter.$or = [
        { url: { $regex: q, $options: "i" } },
        { accountName: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    const total = await ScamReport.countDocuments(filter);
    const reports = await ScamReport.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const sanitized = reports.map((r) => ({
      reportId: r.reportId,
      scamType: r.scamType,
      platform: r.platform,
      phone: r.phone ? maskPhone(r.phone) : undefined,
      url: r.url,
      accountName: r.accountName,
      descriptionSummary: r.description?.slice(0, 180),
      amountInvolved: r.amountInvolved,
      incidentDate: r.incidentDate,
      status: r.status,
      riskScore: r.riskScore,
      riskLevel: r.riskLevel,
      patternTag: r.patternTag,
      location: (r as { location?: string }).location,
      isDemo: r.isDemo,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ reports: sanitized, total, page, limit });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not load reports." }, { status: 500 });
  }
}
