import { Schema, models, model } from "mongoose";

export interface IScamEntity {
  entityKey: string; // normalized phone/url/name used to group reports
  entityType: "phone" | "url" | "account" | "shop";
  displayValue: string;
  reportCount: number;
  lastReportedAt: Date;
  averageRiskScore: number;
  status: "reported" | "under_review" | "community_flagged" | "verified" | "rejected";
}

const ScamEntitySchema = new Schema<IScamEntity>({
  entityKey: { type: String, required: true, unique: true, index: true },
  entityType: { type: String, enum: ["phone", "url", "account", "shop"], required: true },
  displayValue: { type: String, required: true },
  reportCount: { type: Number, default: 1 },
  lastReportedAt: { type: Date, default: Date.now },
  averageRiskScore: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["reported", "under_review", "community_flagged", "verified", "rejected"],
    default: "reported",
  },
});

export default models.ScamEntity || model<IScamEntity>("ScamEntity", ScamEntitySchema);
