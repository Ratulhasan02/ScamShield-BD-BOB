import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ScamReport from "@/lib/models/ScamReport";
import ScamEntity from "@/lib/models/ScamEntity";

// Public homepage statistics. Falls back to clearly-marked demo numbers if
// the database is unreachable, so the landing page never breaks.
export async function GET() {
  try {
    await connectDB();
    const scamsReported = await ScamReport.countDocuments();
    const verified = await ScamReport.countDocuments({ status: "verified" });
    const entities = await ScamEntity.countDocuments();
    return NextResponse.json({
      source: "live",
      scamsReported,
      usersProtected: scamsReported + entities,
      threatsDetected: entities,
      reportsVerified: verified,
    });
  } catch {
    return NextResponse.json({
      source: "demo",
      scamsReported: 1240,
      usersProtected: 18500,
      threatsDetected: 860,
      reportsVerified: 410,
    });
  }
}
