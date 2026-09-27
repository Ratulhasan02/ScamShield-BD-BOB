import { Schema, models, model } from "mongoose";

export interface IRiskAnalysis {
  analysisId: string;
  inputType: string;
  inputValue: string;
  riskScore: number;
  riskLevel: string;
  signals: { id: string; label: string; weight: number }[];
  explanationBn: string;
  explanationEn: string;
  confidence: number;
  aiUsed: boolean;
  similarReportsCount: number;
  feedbackAccurate?: boolean;
  feedbackCount?: number;
  createdAt: Date;
}

const RiskAnalysisSchema = new Schema<IRiskAnalysis>({
  analysisId: { type: String, required: true, unique: true },
  inputType: { type: String, required: true },
  inputValue: { type: String, required: true },
  riskScore: { type: Number, required: true },
  riskLevel: { type: String, required: true },
  signals: [{ id: String, label: String, weight: Number }],
  explanationBn: String,
  explanationEn: String,
  confidence: Number,
  aiUsed: { type: Boolean, default: false },
  similarReportsCount: { type: Number, default: 0 },
  feedbackAccurate: { type: Boolean, default: undefined },
  feedbackCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export default models.RiskAnalysis || model<IRiskAnalysis>("RiskAnalysis", RiskAnalysisSchema);
