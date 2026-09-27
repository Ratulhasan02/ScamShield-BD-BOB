import { Schema, models, model } from "mongoose";

export interface IScamPattern {
  patternKey: string;
  nameEn: string;
  nameBn: string;
  commonSignals: string[];
  reportCount: number;
}

const ScamPatternSchema = new Schema<IScamPattern>({
  patternKey: { type: String, required: true, unique: true },
  nameEn: { type: String, required: true },
  nameBn: { type: String, required: true },
  commonSignals: [String],
  reportCount: { type: Number, default: 0 },
});

export default models.ScamPattern || model<IScamPattern>("ScamPattern", ScamPatternSchema);
