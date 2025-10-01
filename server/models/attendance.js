// const mongoose = require("mongoose");

// const AttendanceSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   date: { type: String, required: true }, // e.g., "2025-09-26"
//   loginTime: { type: Date },
//   logoutTime: { type: Date },
//   totalHours: { type: String },
//   status: {
//     type: String,
//     enum: ["Present", "Absent", "Late", "Half Day"],
//     default: "Absent",
//   },
//   notes: { type: String },
// });

// module.exports = mongoose.model("Attendance", AttendanceSchema);
const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  sessions: [
    {
      loginTime: { type: Date, required: true },
      logoutTime: { type: Date },
      durationHours: { type: Number, default: 0 },
    },
  ],
  totalHours: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["Present", "Absent", "Half-Day","Late"],
    default: "Present",
  },
});

AttendanceSchema.index({ user_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", AttendanceSchema);
