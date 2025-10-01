const express = require("express");
const router = express.Router();
const Proposal = require("../models/proposals");

// GET all proposals
// router.get("/", async (req, res) => {
//     try {
      
//     const proposals = await Proposal.find()
//       .populate(
//         "lead_id",
//         "company_name contact_name contact_email stage contact_phone"
//       )
//       //   .populate("template_id", "name")
//         .populate("user_id", "_id name email role")
//       .sort({ createdAt: -1 });
//     res.status(200).json(proposals);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// GET all proposals
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    let query = {};
    if (userId) {
      query = { user_id: userId };
    }

    const proposals = await Proposal.find(query)
      .populate(
        "lead_id",
        "company_name contact_name contact_email stage contact_phone"
      )
      .populate("user_id", "_id name email role")
      .sort({ createdAt: -1 });

    res.status(200).json(proposals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// GET proposals by lead
router.get("/lead/:leadId", async (req, res) => {
  try {
    const proposals = await Proposal.find({ lead_id: req.params.leadId })
      .populate("lead_id", "company_name contact_name")
      .populate("template_id", "name")
      .populate("user_id", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json(proposals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create a new proposal
router.post("/", async (req, res) => {
  try {
    console.log(req.body,"rr")
    const proposal = new Proposal(req.body);
    await proposal.save();
    res.status(201).json(proposal);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update a proposal
router.put("/:id", async (req, res) => {
  try {
    const updatedProposal = await Proposal.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updatedProposal)
      return res.status(404).json({ message: "Proposal not found" });
    res.status(200).json(updatedProposal);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a proposal
router.delete("/:id", async (req, res) => {
  try {
    await Proposal.findByIdAndDelete(req.params.id);
    res.json({ message: "Proposal deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
