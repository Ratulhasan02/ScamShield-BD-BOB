/**
 * AI-assisted explanation layer + optional screenshot OCR.
 * Without ANTHROPIC_API_KEY everything falls back to the rule engine.
 */
import { RiskResult } from "./riskEngine";
export async function getAiExplanation(
  inputSummary: string,
  ruleResult: RiskResult
): Promise<{ explanationEn: string; explanationBn: string; aiUsed: boolean }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      explanationEn: ruleResult.explanationEn,
      explanationBn: ruleResult.explanationBn,
      aiUsed: false,
    };
  }

  try {
    const signalList = ruleResult.signals.map((s) => `- ${s.labelEn} (${s.labelBn})`).join("\n");

    const prompt = `You are a scam-awareness assistant for ScamShield BD, a platform helping Bangladeshi users spot scams.
A user submitted this content for checking:
"""${inputSummary}"""

A rule-based engine detected these warning signals (already confirmed, do not add new ones):
${signalList || "(no strong signals detected)"}

Risk score: ${ruleResult.score}/100, Level: ${ruleResult.level}

Write TWO short explanations (2-4 sentences each) of WHY this risk level was assigned, referencing the detected signals in plain language a normal Bangladeshi internet user would understand. Use uncertainty-aware language (e.g. "this appears to", "this shows signs of") - never declare with certainty that someone is guilty of a crime.
Respond ONLY as strict JSON, no markdown, no preamble:
{"explanationEn": "...", "explanationBn": "..."}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`);

    const data = await response.json();
    const text = (data?.content || [])
      .map((b: { type: string; text?: string }) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();

    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (parsed?.explanationEn && parsed?.explanationBn) {
      return { explanationEn: parsed.explanationEn, explanationBn: parsed.explanationBn, aiUsed: true };
    }
    throw new Error("Malformed AI response");
  } catch (err) {
    // Any failure (no network, bad key, parse error) falls back silently
    // to the rule-based explanation so the app never breaks.
    console.error("AI analysis fallback triggered:", err);
    return {
      explanationEn: ruleResult.explanationEn,
      explanationBn: ruleResult.explanationBn,
      aiUsed: false,
    };
  }
}


/**
 * Screenshot OCR via Claude vision: extract message text from an uploaded
 * screenshot data URL so the user doesn't have to retype it. Returns ""
 * when no key is configured or extraction fails (non-fatal).
 */
export async function extractScreenshotText(screenshotDataUrl?: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !screenshotDataUrl) return "";
  try {
    const mediaType = screenshotDataUrl.slice(5, screenshotDataUrl.indexOf(";"));
    const base64 = screenshotDataUrl.slice(screenshotDataUrl.indexOf(",") + 1);
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 800,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType || "image/png", data: base64 } },
              { type: "text", text: "Transcribe ALL visible text in this screenshot (scam message, sender, amounts, links, phone numbers). Return plain text only, no commentary." },
            ],
          },
        ],
      }),
    });
    if (!response.ok) return "";
    const data = await response.json();
    return ((data?.content || []).map((b: { type: string; text?: string }) => (b.type === "text" ? b.text : "")).join("")).trim().slice(0, 3000);
  } catch {
    return "";
  }
}