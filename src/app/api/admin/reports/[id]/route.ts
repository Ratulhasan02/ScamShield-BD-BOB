import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import ScamReport from "@/lib/models/ScamReport";
import ScamEntity from "@/lib/models/ScamEntity";
import { getAdminFromRequest } from "@/lib/auth";
import { entityKeyFor } from "@/lib/utils";

const UpdateSchema = z.object({
  status: z.enum(["reported", "under_review", "community_flagged", "verified", "rejected"]),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    const report = await ScamReport.findOneAndUpdate(
      { reportId: params.id },
      { status: parsed.data.status },
      { new: true }
    );
    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

    const entityValue = report.phone || report.url || report.accountName;
    if (entityValue) {
      const entityType = report.phone ? "phone" : report.url ? "url" : "account";
      const key = entityKeyFor(entityType, entityValue);
      await ScamEntity.findOneAndUpdate({ entityKey: key }, { status: parsed.data.status });
    }

    return NextResponse.json({ message: "Report updated", reportId: report.reportId, status: report.status });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}
