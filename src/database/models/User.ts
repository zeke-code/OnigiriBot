import mongoose, { Schema, Document, Model } from "mongoose";
import { IGuild } from "./Guild";

export interface IUser extends Document {
  userId: string;
  userName: string;
  joinedAt: Date;
  roles: string[];
  warnings: number;
  isBanned: boolean;
  guildId: mongoose.Types.ObjectId | IGuild;
}

const userSchema = new Schema<IUser>({
  userId: { type: String, required: true, unique: true },
  userName: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now },
  roles: { type: [String], default: [] },
  warnings: { type: Number, default: 0 },
  isBanned: { type: Boolean, default: false },
  guildId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Guild",
    required: true,
  },
});

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
