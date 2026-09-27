import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ScamReport from "@/lib/models/ScamReport";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectDB();
    const total = await ScamReport.countDocuments();
    const verified = await ScamReport.countDocuments({ status: "verified" });
    const underReview = await ScamReport.countDocuments({ status: "under_review" });
    const flagged = await ScamReport.countDocuments({ status: "community_flagged" });
    const rejected = await ScamReport.countDocuments({ status: "rejected" });
    const byType = await ScamReport.aggregate([{ $group: { _id: "$scamType", count: { $sum: 1 } } }]);
    return NextResponse.json({ total, verified, underReview, flagged, rejected, byType });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not load stats." }, { status: 500 });
  }
}
