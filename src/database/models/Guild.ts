import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGuild extends Document {
  guildId: string;
  guildName: string;
  joinedAt: Date;
  members: mongoose.Types.ObjectId[];
}

const guildSchema = new Schema<IGuild>({
  guildId: { type: String, required: true, unique: true },
  guildName: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

const Guild: Model<IGuild> = mongoose.model<IGuild>("Guild", guildSchema);

export default Guild;
