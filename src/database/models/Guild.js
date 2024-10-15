const mongoose = require("mongoose");

const guildSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  guildName: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

const Guild = mongoose.model("Guild", guildSchema);
module.exports = Guild;
