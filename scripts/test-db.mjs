import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { runSmokeTests } from "./smoke.mjs";

dotenv.config({ path: ".env.local" });
const uri = process.env.MONGODB_URI || "";
const db = process.env.MONGODB_DB || "scamshield-bd";

console.log("[1] DATABASE");
try {
  await mongoose.connect(uri, { dbName: db, serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
  console.log(`  ✅ connect → ${mongoose.connection.name}@${mongoose.connection.host}`);
  const cols = (await mongoose.connection.db.listCollections().toArray()).map((c) => c.name);
  console.log(`  ✅ collections → ${cols.join(", ") || "(empty db)"}`);
  const adminCount = await mongoose.connection.db.collection("admins").countDocuments();
  console.log(`  ✅ admins count → ${adminCount}`);
  if (adminCount === 0) {
    const u = process.env.ADMIN_BOOTSTRAP_USERNAME || "admin";
    const p = process.env.ADMIN_BOOTSTRAP_PASSWORD || "admin123";
    await mongoose.connection.db.collection("admins").insertOne({ username: u, passwordHash: await bcrypt.hash(p, 10), createdAt: new Date() });
    console.log(`  ✅ bootstrap admin created → ${u}`);
  }
  await mongoose.disconnect();
  console.log("  ✅ disconnect");
} catch (e) {
  console.log("  ❌ database →", String(e.message || e).slice(0, 400));
  process.exit(1);
}

const { pass, fail } = await runSmokeTests("http://localhost:3000");
console.log(`\n==== RESULT: ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);
