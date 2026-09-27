import mongoose, { Schema, models, model } from "mongoose";

export interface IScamReport {
  reportId: string;
  scamType: string;
  platform: string;
  phone?: string;
  url?: string;
  accountName?: string;
  description: string;
  evidenceText?: string;
  screenshotDataUrl?: string;
  amountInvolved?: number;
  incidentDate?: string;
  status: "reported" | "under_review" | "community_flagged" | "verified" | "rejected";
  riskScore?: number;
  riskLevel?: string;
  signals?: string[];
  patternTag?: string;
  location?: string;
  reporterContact?: string;
  isDemo?: boolean;
  createdAt: Date;
}

const ScamReportSchema = new Schema<IScamReport>({
  reportId: { type: String, required: true, unique: true, index: true },
  scamType: { type: String, required: true },
  platform: { type: String, required: true },
  phone: String,
  url: String,
  accountName: String,
  description: { type: String, required: true },
  evidenceText: String,
  screenshotDataUrl: String,
  amountInvolved: Number,
  incidentDate: String,
  status: {
    type: String,
    enum: ["reported", "under_review", "community_flagged", "verified", "rejected"],
    default: "reported",
  },
  riskScore: Number,
  riskLevel: String,
  signals: [String],
  patternTag: String,
  location: String,
  reporterContact: String,
  isDemo: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default models.ScamReport || model<IScamReport>("ScamReport", ScamReportSchema);
