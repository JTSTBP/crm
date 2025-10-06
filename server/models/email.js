const mongoose = require("mongoose");

const EmailSchema = new mongoose.Schema({
  userEmail: { type: String, required: true }, // profile email
  type: { type: String, enum: ["inbox", "sent"], required: true },
  to: String,
  from: String,
  subject: String,
  content: String,
  senderName: String,
  receiverName: String,
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Email", EmailSchema);
