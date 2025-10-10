const mongoose = require("mongoose");

const CallActivitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", required: true },
  phone: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("CallActivity", CallActivitySchema);
