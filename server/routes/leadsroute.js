const express = require("express");
const router = express.Router();
const Lead = require("../models/lead");
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
    const { points_of_contact, stage } = req.body;

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

    // If stage is being updated, add stageUpdatedAt
    if (stage === "Proposal Sent") {
      req.body.stageProposalUpd = new Date();
    }

    const updated = await Lead.findByIdAndUpdate(req.params.id, req.body, {
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
