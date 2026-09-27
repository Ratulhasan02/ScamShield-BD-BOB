import { connectDB } from "./db";
import ScamEntity from "./models/ScamEntity";
import ScamReport from "./models/ScamReport";
import RiskAnalysis from "./models/RiskAnalysis";
import { runRiskEngine, detectPattern, AnalysisContext, InputType } from "./riskEngine";
import { getAiExplanation } from "./aiAnalysis";
import { entityKeyFor, generateAnalysisId, isNearDuplicate, extractHostname } from "./utils";

export interface AnalyzeInput {
  inputType: InputType;
  value: string;
  description?: string;
  screenshotText?: string;
}

export async function analyzeInput({ inputType, value, description = "", screenshotText = "" }: AnalyzeInput) {
  let communityReportCount = 0;
  let isNewEntity = true;
  let nearDuplicateKey: string | null = null;

  try {
    await connectDB();
    const key = entityKeyFor(
      inputType === "phone" ? "phone" : inputType === "url" ? "url" : "account",
      value
    );
    const entity = await ScamEntity.findOne({ entityKey: key });
    if (entity) {
      communityReportCount = entity.reportCount;
      isNewEntity = false;
    }
    const matchingReports = await ScamReport.countDocuments({
      $or: [{ phone: value }, { url: value }, { accountName: value }],
    });
    communityReportCount = Math.max(communityReportCount, matchingReports);
    // Near-duplicate entity merging: if no exact match, scan recent entities
    // for a close (not exact) phone/URL match so DNA counts don't dilute.
    if (!entity) {
      const candidates = await ScamEntity.find({ entityType: inputType === "phone" ? "phone" : inputType === "url" ? "url" : "account" })
        .sort({ lastReportedAt: -1 })
        .limit(50)
        .lean();
      const normValue = inputType === "url" ? extractHostname(value) : value;
      for (const c of candidates) {
        const normCand = inputType === "url" ? extractHostname(c.displayValue) : c.displayValue;
        if (isNearDuplicate(normValue, normCand)) {
          nearDuplicateKey = c.entityKey;
          communityReportCount = Math.max(communityReportCount, c.reportCount);
          break;
        }
      }
    }
  } catch {
    communityReportCount = 0;
  }

  const rawText = `${value} ${description} ${screenshotText}`.toLowerCase();
  const ctx: AnalysisContext = { inputType, rawText, original: value, communityReportCount, isNewEntity };

  const ruleResult = runRiskEngine(ctx);
  const ai = await getAiExplanation(`${value}. ${description} ${screenshotText}`, ruleResult);
  const pattern = detectPattern(ruleResult.signals.map((s) => s.id));
  const analysisId = generateAnalysisId();

  try {
    await connectDB();
    await RiskAnalysis.create({
      analysisId,
      inputType,
      inputValue: value,
      riskScore: ruleResult.score,
      riskLevel: ruleResult.level,
      signals: ruleResult.signals.map((s) => ({ id: s.id, label: s.labelEn, weight: s.weight })),
      explanationBn: ai.explanationBn,
      explanationEn: ai.explanationEn,
      confidence: ruleResult.confidence,
      aiUsed: ai.aiUsed,
      similarReportsCount: communityReportCount,
    });
  } catch {
    // non-fatal
  }

  return {
    analysisId,
    riskScore: ruleResult.score,
    riskLevel: ruleResult.level,
    riskLevelBn: ruleResult.levelBn,
    confidence: ruleResult.confidence,
    signals: ruleResult.signals,
    explanationEn: ai.explanationEn,
    explanationBn: ai.explanationBn,
    recommendedActionEn: ruleResult.recommendedActionEn,
    recommendedActionBn: ruleResult.recommendedActionBn,
    aiUsed: ai.aiUsed,
    similarReportsCount: communityReportCount,
    nearDuplicateKey,
    scamPattern: pattern,
  };
}
