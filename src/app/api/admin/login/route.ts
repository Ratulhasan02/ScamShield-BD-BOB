import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Admin from "@/lib/models/Admin";
import { signAdminToken } from "@/lib/auth";

const LoginSchema = z.object({
  username: z.string().min(2).max(60),
  password: z.string().min(4).max(200),
});

// On first run, if no admin exists in the DB yet, this bootstraps one from
// ADMIN_BOOTSTRAP_USERNAME / ADMIN_BOOTSTRAP_PASSWORD in the environment so
// the admin dashboard is usable immediately without a separate seed script.
async function ensureBootstrapAdmin() {
  const count = await Admin.countDocuments();
  if (count > 0) return;
  const username = process.env.ADMIN_BOOTSTRAP_USERNAME;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!username || !password) return;
  const passwordHash = await bcrypt.hash(password, 10);
  await Admin.create({ username, passwordHash });
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    await ensureBootstrapAdmin();

    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid credentials format" }, { status: 400 });
    }
    const { username, password } = parsed.data;

    const admin = await Admin.findOne({ username });
    if (!admin) return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });

    const token = signAdminToken({ username: admin.username, role: "admin" });
    return NextResponse.json({ token, username: admin.username });
  } catch (err) {
    console.error("[admin/login]", err);
    const message = err instanceof Error ? err.message : "Login failed. Please try again.";
    const isDbDown =
      /could not reach mongodb|server selection|whitelist|network access|cluster is paused|authentication failed|enotfound|querytxt/i.test(
        message
      );
    return NextResponse.json(
      { error: message || "Login failed. Please try again." },
      { status: isDbDown ? 503 : 500 }
    );
  }
}
