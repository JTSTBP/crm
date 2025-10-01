const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authroute");
const userroute = require("./routes/usersroute");
const leadroutes = require("./routes/leadsroute");
const taskroutes = require("./routes/taskroute");
const activityroutes = require("./routes/activityroute");
const proposalsroutes = require("./routes/proposalroutes");
const attendanceroutes = require("./routes/attendanceroute");
const bulkleadroute = require("./routes/bultupload");
const path = require("path");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// routes
app.use("/api/users", userroute);
app.use("/api/auth", authRoutes);
app.use("/api/leads", leadroutes);
app.use("/api/leads", bulkleadroute);
app.use("/api/tasks", taskroutes);

// activity logs for tasks,leads
app.use("/api/activitylogs", activityroutes);
app.use("/api/proposals", proposalsroutes);
app.use("/api/attendance", attendanceroutes);

// checking route
app.get("/", (req, res) => {
  res.send("Jobs Territory crm API is running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.use("/upload", express.static(path.join(__dirname, "upload")));
