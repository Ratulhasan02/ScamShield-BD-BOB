import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ScamReport from "@/lib/models/ScamReport";
import { getAdminFromRequest } from "@/lib/auth";
import { maskPhone } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const report = await ScamReport.findOne({ reportId: params.id }).lean() as any;
    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

    const admin = getAdminFromRequest(req);

    return NextResponse.json({
      reportId: report.reportId,
      scamType: report.scamType,
      platform: report.platform,
      phone: report.phone ? (admin ? report.phone : maskPhone(report.phone)) : undefined,
      url: report.url,
      accountName: report.accountName,
      description: report.description,
      evidenceText: admin ? report.evidenceText : undefined,
      amountInvolved: report.amountInvolved,
      incidentDate: report.incidentDate,
      status: report.status,
      riskScore: report.riskScore,
      riskLevel: report.riskLevel,
      signals: report.signals,
      patternTag: report.patternTag,
      isDemo: report.isDemo,
      createdAt: report.createdAt,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not load report." }, { status: 500 });
  }
}