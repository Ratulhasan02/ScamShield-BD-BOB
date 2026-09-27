import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "";

export interface AdminTokenPayload {
  username: string;
  role: "admin";
}

export function signAdminToken(payload: AdminTokenPayload): string {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not set. Add it to your .env.local file.");
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  if (!JWT_SECRET) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
  } catch {
    return null;
  }
}

export function getAdminFromRequest(req: NextRequest): AdminTokenPayload | null {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  return verifyAdminToken(token);
}
