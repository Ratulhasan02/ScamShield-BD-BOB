import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ScamEntity from "@/lib/models/ScamEntity";
import ScamReport from "@/lib/models/ScamReport";
import { maskPhone } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    if (!q) return NextResponse.json({ entities: [], reports: [] });

    const entities = await ScamEntity.find({
      displayValue: { $regex: q, $options: "i" },
    })
      .sort({ reportCount: -1 })
      .limit(10)
      .lean();

    const reports = await ScamReport.find({
      $or: [
        { url: { $regex: q, $options: "i" } },
        { accountName: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { scamType: { $regex: q, $options: "i" } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({
      entities: entities.map((e) => ({
        ...e,
        displayValue: e.entityType === "phone" ? maskPhone(e.displayValue) : e.displayValue,
      })),
      reports: reports.map((r) => ({
        reportId: r.reportId,
        scamType: r.scamType,
        platform: r.platform,
        phone: r.phone ? maskPhone(r.phone) : undefined,
        url: r.url,
        accountName: r.accountName,
        status: r.status,
        riskScore: r.riskScore,
        riskLevel: r.riskLevel,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }
}
