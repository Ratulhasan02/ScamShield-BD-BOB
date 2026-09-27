import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

const base = process.argv[2] || "http://localhost:3000";
const probe = process.argv[3] || "full"; // full | quick

async function fetchJson(url, opts, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const t0 = Date.now();
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal });
    const t = await r.text();
    let d; try { d = JSON.parse(t); } catch { d = { _raw: t.slice(0, 300) }; }
    return { status: r.status, data: d, ms: Date.now() - t0 };
  } catch (e) {
    if (e.name === "AbortError") throw new Error(`TIMEOUT after ${timeoutMs}ms`);
    throw e;
  } finally { clearTimeout(timer); }
}

console.log(`Probing ${base} (${probe})...`);

// 1. stats — no auth, hits DB
try {
  const { status, data, ms } = await fetchJson(`${base}/api/stats`);
  console.log(`GET /api/stats → ${status} in ${ms}ms:`, JSON.stringify(data).slice(0, 200));
} catch (e) { console.log("GET /api/stats FAILED:", e.message); }

// 2. check — hits analyzePipeline + RiskAnalysis.create (suspect: model buffering)
if (probe === "full") {
  try {
    const { status, data, ms } = await fetchJson(`${base}/api/check`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputType: "message", value: "hello test probe only" }),
    }, 30000);
    console.log(`POST /api/check → ${status} in ${ms}ms:`, JSON.stringify(data).slice(0, 300));
  } catch (e) { console.log("POST /api/check FAILED:", e.message); }
}
process.exit(0);
