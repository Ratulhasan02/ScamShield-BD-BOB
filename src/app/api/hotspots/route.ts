import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ScamReport from "@/lib/models/ScamReport";

export async function GET() {
  try {
    await connectDB();
    const rows = await ScamReport.aggregate([
      { $match: { location: { $exists: true, $ne: "" } } },
      { $group: { _id: "$location", count: { $sum: 1 }, avgRisk: { $avg: "$riskScore" } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);
    return NextResponse.json({ hotspots: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not load hotspots." }, { status: 500 });
  }
}
