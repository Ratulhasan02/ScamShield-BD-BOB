import { Schema, models, model } from "mongoose";

// Lightweight user record - ScamShield BD does not require signup to use
// the checker or reporting tools, but this model exists so submitted
// reports / checks can later be linked to an authenticated account.
export interface IUser {
  name?: string;
  contact?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: String,
  contact: String,
  createdAt: { type: Date, default: Date.now },
});

export default models.User || model<IUser>("User", UserSchema);
