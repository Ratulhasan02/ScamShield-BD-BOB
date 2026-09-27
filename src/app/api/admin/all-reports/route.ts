import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ScamReport from "@/lib/models/ScamReport";
import { getAdminFromRequest } from "@/lib/auth";

// Full (unmasked) report listing for the admin dashboard only.
export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const q = searchParams.get("q");
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (q) {
      filter.$or = [
        { url: { $regex: q, $options: "i" } },
        { accountName: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }
    const reports = await ScamReport.find(filter).sort({ createdAt: -1 }).limit(200).lean();
    return NextResponse.json({ reports });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not load reports." }, { status: 500 });
  }
}
