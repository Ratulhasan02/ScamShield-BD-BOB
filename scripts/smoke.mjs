import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

let pass = 0, fail = 0;
const ok = (n, e = "") => { pass++; console.log(`  ✅ ${n}${e ? " → " + e : ""}`); };
const bad = (n, e) => { fail++; console.log(`  ❌ ${n} → ${String(e).slice(0, 300)}`); };
async function fetchJson(url, opts, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal });
    const t = await r.text();
    let d; try { d = JSON.parse(t); } catch { d = { _raw: t.slice(0, 200) }; }
    return { status: r.status, data: d };
  } catch (e) {
    if (e.name === "AbortError") throw new Error(`timeout after ${timeoutMs}ms — is dev server running? route may be compiling/hung`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
async function t(name, fn) {
  try { ok(name, await fn()); } catch (e) { bad(name, e.message || e); }
}

export async function runSmokeTests(base) {
  console.log("\n[2] API ENDPOINTS (needs `npm run dev`)");
  let token = "", createdId = "";
  const J = { "Content-Type": "application/json" };

  await t("GET /api/stats", async () => {
    const { status, data } = await fetchJson(`${base}/api/stats`);
    if (status !== 200) throw new Error(`status ${status}`);
    return `source=${data.source} scams=${data.scamsReported}`;
  });
  await t("POST /api/check scam", async () => {
    const { status, data } = await fetchJson(`${base}/api/check`, {
      method: "POST", headers: J,
      body: JSON.stringify({ inputType: "message", value: "Your bKash will be suspended, send OTP urgently" }),
    });
    if (status !== 200) throw new Error(`status ${status}: ${JSON.stringify(data)}`);
    return `score=${data.riskScore} level=${data.riskLevel}`;
  });
  await t("POST /api/check invalid-400", async () => {
    const { status } = await fetchJson(`${base}/api/check`, {
      method: "POST", headers: J, body: JSON.stringify({ inputType: "bad", value: "x" }),
    });
    if (status !== 400) throw new Error(`got ${status}`);
    return "400 ok";
  });
  await t("POST /api/analyze url", async () => {
    const { status, data } = await fetchJson(`${base}/api/analyze`, {
      method: "POST", headers: J,
      body: JSON.stringify({ inputType: "url", value: "http://bkash-verify-account.xyz" }),
    });
    if (status !== 200) throw new Error(`status ${status}: ${JSON.stringify(data)}`);
    return `score=${data.riskScore} pattern=${data.scamPattern?.key || "none"}`;
  });
  await t("POST /api/reports", async () => {
    const { status, data } = await fetchJson(`${base}/api/reports`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scamType: "Phishing Link", platform: "SMS", url: `http://test-${Date.now()}.xyz`, description: "SMS claiming bKash suspended, asked to click link and send OTP. Test report." }),
    });
    if (status !== 200) throw new Error(`status ${status}: ${JSON.stringify(data)}`);
    createdId = data.reportId;
    return `id=${data.reportId}`;
  });
  await t("GET /api/reports list", async () => {
    const { status, data } = await fetchJson(`${base}/api/reports?limit=3`);
    if (status !== 200) throw new Error(`status ${status}`);
    return `total=${data.total}`;
  });
  await t("GET /api/search", async () => {
    const { status, data } = await fetchJson(`${base}/api/search?q=test`);
    if (status !== 200) throw new Error(`status ${status}`);
    return `entities=${data.entities?.length} reports=${data.reports?.length}`;
  });
  await t("POST /api/admin/login wrong-401", async () => {
    const { status } = await fetchJson(`${base}/api/admin/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "no-such-user-xyz", password: "wrongpassword123" }),
    });
    if (status !== 401) throw new Error(`got ${status}`);
    return "401 ok";
  });
  await t("POST /api/admin/login real", async () => {
    const u = process.env.ADMIN_BOOTSTRAP_USERNAME || "admin";
    const p = process.env.ADMIN_BOOTSTRAP_PASSWORD || "admin123";
    const { status, data } = await fetchJson(`${base}/api/admin/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p }),
    });
    if (status !== 200 || !data.token) throw new Error(`status ${status}: ${JSON.stringify(data)}`);
    token = data.token;
    return `user=${data.username}`;
  });
  if (token) {
    const H = (tk) => ({ Authorization: `Bearer ${tk}` });
    await t("GET /api/admin/stats auth", async () => {
      const { status, data } = await fetchJson(`${base}/api/admin/stats`, { headers: H(token) });
      if (status !== 200) throw new Error(`status ${status}`);
      return `total=${data.total}`;
    });
    await t("GET /api/admin/all-reports auth", async () => {
      const { status, data } = await fetchJson(`${base}/api/admin/all-reports`, { headers: H(token) });
      if (status !== 200) throw new Error(`status ${status}`);
      return `count=${data.reports?.length}`;
    });
    await t("GET /api/admin/stats no-token-401", async () => {
      const { status } = await fetchJson(`${base}/api/admin/stats`);
      if (status !== 401) throw new Error(`got ${status}`);
      return "401 ok";
    });
  }
  await t("GET / homepage", async () => {
    const r = await fetch(`${base}/`);
    if (r.status !== 200) throw new Error(`status ${r.status}`);
    return "200 ok";
  });
  await t("GET /admin/login page", async () => {
    const r = await fetch(`${base}/admin/login`);
    if (r.status !== 200) throw new Error(`status ${r.status}`);
    return "200 ok";
  });
  return { pass, fail };
}
