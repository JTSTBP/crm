const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema(
  {
    lead_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },
    template_id: {
      type: String,
      //   type: mongoose.Schema.Types.ObjectId,
      //   ref: "ProposalTemplate",
      //   required: true,
    },
    template_used: { type: String }, // captured template name
    rate_card_version: { type: String, default: "v1.0" },
    sent_via: {
      type: String,
      enum: ["Email", "WhatsApp", "Both"],
      default: "Email",
    },
    status: {
      type: String,
      enum: ["Draft", "Sent", "Viewed", "Accepted", "Rejected"],
      default: "Draft",
    },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // creator
  },
  { timestamps: true }
);

module.exports = mongoose.model("Proposal", proposalSchema);
