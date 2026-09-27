import { Schema, models, model } from "mongoose";

export interface IAdmin {
  username: string;
  passwordHash: string;
  createdAt: Date;
}

const AdminSchema = new Schema<IAdmin>({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default models.Admin || model<IAdmin>("Admin", AdminSchema);
