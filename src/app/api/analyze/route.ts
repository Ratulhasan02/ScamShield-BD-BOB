import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { analyzeInput } from "@/lib/analyzePipeline";

// Mirror of /api/check rate limiting so the two endpoints share the budget.
const hits = new Map<string, { count: number; reset: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const e = hits.get(ip);
  if (!e || now > e.reset) {
    hits.set(ip, { count: 1, reset: now + 60_000 });
    return false;
  }
  e.count += 1;
  return e.count > 20;
}

const AnalyzeSchema = z.object({
  inputType: z.enum(["url", "phone", "message", "shop", "social"]),
  value: z.string().min(2).max(2000),
  description: z.string().max(3000).optional().default(""),
  screenshotText: z.string().max(3000).optional().default(""),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (rateLimited(ip)) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
    }
    const body = await req.json();
    const parsed = AnalyzeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }
    const result = await analyzeInput(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}
