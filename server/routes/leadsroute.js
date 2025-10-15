const express = require("express");
const router = express.Router();
const Lead = require("../models/lead");
const multer = require("multer");
const path = require("path");

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
    const phones = points_of_contact?.map((c) => c.phone) || [];
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

// Get all leads
router.get("/", async (req, res) => {
  try {
    const { assignedBy } = req.query; // optional query param
    let filter = {};

    if (assignedBy) {
      filter.assignedBy = assignedBy; // filter leads assigned by specific user
    }

    const leads = await Lead.find(filter).populate(
      "assignedBy",
      "name email role"
    );
    res.json(leads);
    // const leads = await Lead.find().populate("assignedBy", "name email role");
    // res.json(leads);
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

// Update lead
router.put("/:id", async (req, res) => {
  try {
    const { points_of_contact, stage } = req.body;

    // Check for duplicate contact phone numbers
    const phones = points_of_contact?.map((c) => c.phone) || [];
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
