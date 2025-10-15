const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  entityId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  entityName: { type: String }, // capture user name directly
  action: {
    type: String,
    enum: [
      "create",
      "update",
      "delete",
      "remark_added",
      "remark_deleted",
      "remark_updated",
    ],
  },
  entity: { type: String }, // e.g. "User", "Product"
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead" },
  updatedFields: { type: Object }, // only changed fields
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ActivityLog", activityLogSchema);
