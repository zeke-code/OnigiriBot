const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
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

const User = mongoose.model("User", userSchema);
module.exports = User;
