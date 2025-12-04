const express = require("express");
const router = express.Router();
const Lead = require("../models/lead");
const CallActivity = require("../models/call");
const Email = require("../models/email");
const multer = require("multer");
const path = require("path");
const authMiddleware = require("../middleware/auth");

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "upload/voice"); // folder to store voice notes
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}_${file.originalname}`);
    },
});

const upload = multer({ storage });

// Route to upload voice remark
router.post(
    "/:leadId/upload-remark-voice",
    upload.single("file"),
    async (req, res) => {
        try {
            const { leadId } = req.params;
            const { type, profile } = req.body;

            const voiceUrl = `upload/voice/${req.file.filename}`; // path to access file

            const remark = {
                type,
                voiceUrl,
                profile: JSON.parse(profile),
            };

            const lead = await Lead.findByIdAndUpdate(
                leadId,
                { $push: { remarks: remark } },
                { new: true }
            );

            res.json({ remarks: lead.remarks });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

// helper function to normalize website url
function normalizeUrl(url) {
    try {
        let u = new URL(url);

        // remove www. prefix
        let hostname = u.hostname.replace(/^www\./, "");

        // always keep https
        return `https://${hostname}${u.pathname.replace(/\/$/, "")}`;
    } catch (err) {
        return url; // fallback if invalid URL
    }
}

// Create a lead
router.post("/", async (req, res) => {
    try {
        const { website_url, points_of_contact } = req.body;

        // normalize the url
        const normalizedUrl = normalizeUrl(website_url);

        // Check if lead already exists with normalized url
        const existingLead = await Lead.findOne({ website_url: normalizedUrl });
        if (existingLead) {
            return res.status(400).json({ message: "Lead already exists" });
        }

        // Check for duplicate contact phone numbers
        const phones =
            points_of_contact?.flatMap(
                (c) => [c.phone, c.alternate_phone].filter(Boolean) // include only non-empty numbers
            ) || [];

        const uniquePhones = new Set(phones);

        if (phones.length !== uniquePhones.size) {
            return res
                .status(400)
                .json({ message: "Duplicate contact phone numbers are not allowed" });
        }

        const lead = new Lead({ ...req.body, website_url: normalizedUrl });
        await lead.save();

        res.status(201).json(lead);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get dashboard stats
router.get("/dashboard-stats", authMiddleware, async (req, res) => {
    try {
        const { assignedBy, date, startDate: qStartDate, endDate: qEndDate } = req.query;
        let matchStage = {};

        // Role-based filtering
        if (req.user.role === "BD Executive") {
            matchStage.assignedBy = req.user._id;
        } else if (assignedBy && assignedBy !== "All") {
            if (assignedBy === "Unassigned") {
                matchStage.assignedBy = { $exists: false };
            } else {
                const mongoose = require('mongoose');
                matchStage.assignedBy = new mongoose.Types.ObjectId(assignedBy);
            }
        }

        // Date filtering
        let start, end;
        if (qStartDate && qEndDate) {
            start = new Date(qStartDate);
            start.setHours(0, 0, 0, 0);
            end = new Date(qEndDate);
            end.setHours(23, 59, 59, 999);
            matchStage.createdAt = { $gte: start, $lte: end };
        } else if (date) {
            start = new Date(date);
            start.setHours(0, 0, 0, 0);
            end = new Date(date);
            end.setHours(23, 59, 59, 999);
            matchStage.createdAt = { $gte: start, $lte: end };
        }

        // Calculate start of current week (Sunday)
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);

        // Date filter for Calls and Emails (same as leads)
        let matchDate = {};
        if (start && end) {
            matchDate = { timestamp: { $gte: start, $lte: end } };
        }

        // Parallel execution of aggregations
        const [
            totalLeads,
            stageStats,
            revenueStats,
            monthlyStats,
            userStats,
            newLeadsThisWeek,
            totalCalls,
            totalEmails,
            callStats,
            dailyStats
        ] = await Promise.all([
            // 1. Total Leads
            Lead.countDocuments(matchStage),

            // 2. Leads by Stage
            Lead.aggregate([
                { $match: matchStage },
                { $group: { _id: "$stage", count: { $sum: 1 } } }
            ]),

            // 3. Total Revenue (Won leads)
            Lead.aggregate([
                { $match: { ...matchStage, stage: "Won" } },
                { $group: { _id: null, total: { $sum: "$value" } } }
            ]),

            // 4. Monthly Stats (Last 12 months or all time)
            Lead.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            month: { $month: "$createdAt" },
                            year: { $year: "$createdAt" }
                        },
                        count: { $sum: 1 },
                        revenue: {
                            $sum: {
                                $cond: [{ $eq: ["$stage", "Won"] }, "$value", 0]
                            }
                        }
                    }
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } }
            ]),

            // 5. User Stats (for Manager Dashboard) - Only if user is Admin or Manager
            (req.user.role === "Admin" || req.user.role === "Manager") ?
                Lead.aggregate([
                    { $match: matchStage }, // Apply global filters first
                    {
                        $group: {
                            _id: "$assignedBy",
                            leads: { $sum: 1 },
                            won: {
                                $sum: { $cond: [{ $eq: ["$stage", "Won"] }, 1, 0] }
                            },
                            revenue: {
                                $sum: { $cond: [{ $eq: ["$stage", "Won"] }, "$value", 0] }
                            },
                            proposals: {
                                $sum: { $cond: [{ $eq: ["$stage", "Proposal Sent"] }, 1, 0] }
                            },
                            newLeads: {
                                $sum: { $cond: [{ $eq: ["$stage", "New"] }, 1, 0] }
                            },
                            contacted: {
                                $sum: { $cond: [{ $eq: ["$stage", "Contacted"] }, 1, 0] }
                            },
                            negotiation: {
                                $sum: { $cond: [{ $eq: ["$stage", "Negotiation"] }, 1, 0] }
                            },
                            lost: {
                                $sum: { $cond: [{ $eq: ["$stage", "Lost"] }, 1, 0] }
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: "users", // Assumes collection name is 'users'
                            localField: "_id",
                            foreignField: "_id",
                            as: "userInfo"
                        }
                    },
                    { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            name: { $ifNull: ["$userInfo.name", "Unassigned"] },
                            leads: 1,
                            won: 1,
                            revenue: 1,
                            proposals: 1,
                            newLeads: 1,
                            contacted: 1,
                            negotiation: 1,
                            lost: 1
                        }
                    }
                ]) : Promise.resolve([]),

            // 6. New Leads This Week
            Lead.countDocuments({
                ...matchStage,
                createdAt: { $gte: weekStart }
            }),

            // 7. Total Calls (filtered by date)
            CallActivity.countDocuments(matchDate),

            // 8. Total Emails (Sent) (filtered by date)
            Email.countDocuments({
                type: "sent",
                ...(matchDate.timestamp ? { date: matchDate.timestamp } : {})
            }),

            // 9. Call Stats per User
            CallActivity.aggregate([
                { $match: matchDate },
                { $group: { _id: "$userId", count: { $sum: 1 } } }
            ]),

            // 10. Daily Stats (for Activity Timeline)
            Lead.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                        },
                        leads: { $sum: 1 },
                        proposals: {
                            $sum: { $cond: [{ $eq: ["$stage", "Proposal Sent"] }, 1, 0] }
                        }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);

        // Format Monthly Stats
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const formattedMonthlyStats = monthlyStats.map(item => ({
            month: monthNames[item._id.month - 1],
            year: item._id.year,
            leads: item.count,
            revenue: item.revenue
        }));

        // Format Stage Stats
        const formattedStageStats = stageStats.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        // Format Call Stats
        const formattedCallStats = callStats.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        // Format Daily Stats (Merge with calls if possible, or just send separate)
        // For now, let's just send what we have. Calls need separate aggregation for daily if we want to merge.
        // Let's do a quick daily aggregation for calls too.
        const dailyCalls = await CallActivity.aggregate([
            { $match: matchDate },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        const dailyStatsMap = {};
        dailyStats.forEach(d => {
            dailyStatsMap[d._id] = { date: d._id, leads: d.leads, proposals: d.proposals, calls: 0 };
        });
        dailyCalls.forEach(c => {
            if (!dailyStatsMap[c._id]) {
                dailyStatsMap[c._id] = { date: c._id, leads: 0, proposals: 0, calls: 0 };
            }
            dailyStatsMap[c._id].calls = c.count;
        });

        const formattedDailyStats = Object.values(dailyStatsMap).sort((a, b) => a.date.localeCompare(b.date));

        res.json({
            totalLeads,
            stageStats: formattedStageStats,
            totalRevenue: revenueStats[0]?.total || 0,
            monthlyStats: formattedMonthlyStats,
            userStats,
            newLeadsThisWeek,
            totalCalls,
            totalEmails,
            callStats: formattedCallStats,
            dailyStats: formattedDailyStats
        });

    } catch (err) {
        console.error("Dashboard stats error:", err);
        res.status(500).json({ message: err.message });
    }
});

// Get all leads with pagination and filtering
router.get("/", authMiddleware, async (req, res) => {
    try {
        const {
            assignedBy,
            stage,
            search,
            pocStage,
            date,
            page = 1,
            limit = 10,
        } = req.query;

        let filter = {};

        // Role-based filtering: BD Executives can only see their own leads
        if (req.user.role === "BD Executive") {
            filter.assignedBy = req.user._id;
        } else {
            // Admin and Manager can see all leads, or filter by assignedBy if specified
            if (assignedBy && assignedBy !== "All") {
                if (assignedBy === "Unassigned") {
                    filter.assignedBy = { $exists: false };
                } else {
                    filter.assignedBy = assignedBy;
                }
            }
        }

        // Filter by stage
        if (stage && stage !== "All") {
            filter.stage = stage;
        }

        // Search filter
        if (search) {
            filter.$or = [
                { company_name: { $regex: search, $options: "i" } },
                { company_email: { $regex: search, $options: "i" } },
                { "points_of_contact.phone": { $regex: search, $options: "i" } },
                {
                    "points_of_contact.alternate_phone": {
                        $regex: search,
                        $options: "i",
                    },
                },
            ];
        }

        // Filter by POC stage
        if (pocStage && pocStage !== "All") {
            filter["points_of_contact.stage"] = pocStage;
        }

        // Filter by date
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            filter.createdAt = { $gte: startDate, $lte: endDate };
        }

        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Run count and find queries in parallel for better performance
        const [total, leads] = await Promise.all([
            Lead.countDocuments(filter),
            Lead.find(filter)
                .select(
                    "company_name company_email company_size website_url industry_name lead_source hiring_needs stage points_of_contact no_of_designations no_of_positions createdAt updatedAt locked assignedBy stageProposalUpd"
                )
                .populate("assignedBy", "name email role")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(), // Convert to plain JavaScript objects for better performance
        ]);

        res.json({
            leads,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// add remarks
router.post("/:leadId/addnewremark", async (req, res) => {
    try {
        const { content, type, fileUrl, voiceUrl, profile } = req.body;

        const { leadId } = req.params;
        console.log(req.body);
        const remark = {
            content,
            type,
            fileUrl,
            voiceUrl,
            profile: {
                id: profile.id,
                name: profile.name,
            },
        };

        const lead = await Lead.findByIdAndUpdate(
            leadId,
            { $push: { remarks: remark } },
            { new: true }
        );

        res.json(lead);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// get all leads for remarks
router.get("/:leadId", async (req, res) => {
    try {
        const { leadId } = req.params;

        // Find the lead by ID and return only the remarks
        const lead = await Lead.findById(leadId).select("remarks");

        if (!lead) {
            return res.status(404).json({ error: "Lead not found" });
        }

        res.json(lead.remarks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// delete remark
router.delete("/:leadId/remarks/:remarkId", async (req, res) => {
    try {
        const { leadId, remarkId } = req.params;

        // Find the lead
        const lead = await Lead.findById(leadId);
        if (!lead) {
            return res.status(404).json({ error: "Lead not found" });
        }

        const updatedLead = await Lead.findOneAndUpdate(
            { _id: leadId },
            { $pull: { remarks: { _id: remarkId } } }, // remove the remark
            { new: true } // ✅ ensures post hook sees the updated document
        );

        res.json({ message: "Remark deleted", remarks: lead.remarks });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get lead by ID
router.get("/:id", async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id).populate(
            "assigned_to",
            "name email role"
        );
        if (!lead) return res.status(404).json({ message: "Lead not found" });
        res.json(lead);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/leads/bulk-assign
router.put("/bulk-assign", async (req, res) => {
    try {
        const { leadIds, assignedBy, stage } = req.body;

        if (!leadIds?.length) {
            return res.status(400).json({ message: "Invalid data" });
        }

        // await Lead.updateMany(
        //   { _id: { $in: leadIds } },
        //   {
        //     $set: {
        //       assignedBy,
        //       updated_at: Date.now(),
        //       stage: stage ,
        //     },
        //   }
        // );

        const updateData = {};

        // ✅ Only include fields if they exist in the request
        if (assignedBy) updateData.assignedBy = assignedBy;
        if (stage) updateData.stage = stage;
        console.log(updateData, "updateData");

        if (Object.keys(updateData).length === 0) {
            return res
                .status(400)
                .json({ message: "No valid fields provided for update" });
        }

        await Lead.updateMany({ _id: { $in: leadIds } }, { $set: updateData });

        res.json({ message: "Leads assigned successfully" });
    } catch (error) {
        console.error("Bulk assign error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Update lead
router.put("/:id", async (req, res) => {
    try {
        const { points_of_contact, stage, remark, ...otherFields } = req.body;

        // Check for duplicate contact phone numbers
        const phones =
            points_of_contact?.flatMap(
                (c) => [c.phone, c.alternate_phone].filter(Boolean) // include only non-empty numbers
            ) || [];

        const uniquePhones = new Set(phones);

        if (phones.length !== uniquePhones.size) {
            return res
                .status(400)
                .json({ message: "Duplicate contact phone numbers are not allowed" });
        }

        const updateOps = {
            $set: { ...otherFields }
        };

        if (points_of_contact) updateOps.$set.points_of_contact = points_of_contact;
        if (stage) updateOps.$set.stage = stage;

        // If stage is being updated, add stageUpdatedAt
        if (stage === "Proposal Sent") {
            updateOps.$set.stageProposalUpd = new Date();
        }

        // Handle new remark
        if (remark) {
            const formattedRemark = {
                content: remark.content,
                type: remark.type || 'text',
                fileUrl: remark.fileUrl,
                voiceUrl: remark.voiceUrl,
                profile: {
                    id: remark.profile.id || remark.profile._id,
                    name: remark.profile.name,
                },
                created_at: new Date()
            };
            updateOps.$push = { remarks: formattedRemark };
        }

        const updated = await Lead.findByIdAndUpdate(req.params.id, updateOps, {
            new: true,
        }).populate("assignedBy", "name email role");

        console.log(updated, "up");
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete lead
router.delete("/:id", async (req, res) => {
    try {
        await Lead.findByIdAndDelete(req.params.id);
        res.json({ message: "Lead deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
