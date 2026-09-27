import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import RiskAnalysis from "@/lib/models/RiskAnalysis";

const FeedbackSchema = z.object({
  analysisId: z.string().min(2).max(60),
  accurate: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const parsed = FeedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const doc = await RiskAnalysis.findOneAndUpdate(
      { analysisId: parsed.data.analysisId },
      { $inc: { feedbackCount: 1 }, $set: { feedbackAccurate: parsed.data.accurate } },
      { new: true }
    );
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, feedbackCount: doc.feedbackCount });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not save feedback." }, { status: 500 });
  }
}
