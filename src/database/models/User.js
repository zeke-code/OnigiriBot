const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  userName: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now },
  roles: { type: [String], default: [] },
  isBanned: { type: Boolean, default: false },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
