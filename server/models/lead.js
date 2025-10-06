const mongoose = require("mongoose");
const addAuditTrail = require("./audits/auditLeadTrail");

const PointOfContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  designation: { type: String },
  phone: { type: String, required: true },
  email: { type: String },
  linkedin_url: { type: String },
  stage: {
    type: String,
    enum: ["Contacted", "Busy", "No Answer", "Wrong Number"],
    default: "Busy",
  },
});

const remarkSchema = new mongoose.Schema(
  {
    content: { type: String }, // remark text
    type: { type: String, enum: ["text", "voice", "file"], default: "text" },
    fileUrl: { type: String }, // if type=file
    voiceUrl: { type: String }, // if type=voice
    created_at: { type: Date, default: Date.now },
    profile: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // user who added remark
      name: { type: String, required: true }, // snapshot of user name
    },
  },
  { _id: true }
);

const LeadSchema = new mongoose.Schema(
  {
    company_name: { type: String, required: true },
    company_email: { type: String },
    company_info: { type: String },
    company_size: { type: String },
    website_url: { type: String, unique: true, required: true },
    hiring_needs: [{ type: String }],
    points_of_contact: [PointOfContactSchema],
    lead_source: { type: String },

    linkedin_link: { type: String },
    industry_name: { type: String },
    no_of_designations: { type: Number, default: null },
    no_of_positions: { type: Number, default: null },
    stage: {
      type: String,
      enum: [
        "New",
        "Contacted",
        "Proposal Sent",
        "Negotiation",
        "Won",
        "Lost",
        "Onboarded",
        "No vendor",
      ],
      default: "New",
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    remarks: [remarkSchema],
  },
  { timestamps: true }
);

// Attach audit logging
addAuditTrail(LeadSchema, "Leads");

module.exports = mongoose.model("Lead", LeadSchema);
