// // routes/email.js
// const express = require("express");
// const router = express.Router();
// const nodemailer = require("nodemailer");

// // POST /api/send-email
// router.post("/send-email", async (req, res) => {
//   try {
//       const { toEmail, subject, content } = req.body;
//       console.log(toEmail,"e", subject, "s",content,"c");

//     if (!toEmail || !subject || !content) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     // Configure Nodemailer
//     const transporter = nodemailer.createTransport({
//       host: process.env.SMTP_HOST,
//       port: process.env.SMTP_PORT,
//       secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
//       auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS,
//       },
//     });

//     // Send email
//     await transporter.sendMail({
//       from: `"JtCRM" <${process.env.SMTP_USER}>`,
//       to: toEmail,
//       subject,
//       html: content, // use html for rich text
//     });

//     res.status(200).json({ message: "Email sent successfully" });
//   } catch (err) {
//     console.error(err);
//     res
//       .status(500)
//       .json({ message: "Failed to send email", error: err.message });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const Email = require("../models/email"); // create a model like this below


// POST /api/send-email
router.post("/send-email", async (req, res) => {
  try {
    const {
      fromEmail,
      appPassword,
      toEmail,
      subject,
      content,
      senderName,
      receiverName,
    } = req.body;

    if (!fromEmail || !appPassword || !toEmail || !subject || !content) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Configure Nodemailer dynamically based on sender
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: fromEmail,
        pass: appPassword,
      },
    });

    // Send email
    await transporter.sendMail({
      from: `"${senderName || "JtCRM"}" <${fromEmail}>`,
      to: toEmail,
      subject,
      html: content,
    });
    await Email.create({
      userEmail: fromEmail,
      type: "sent",
      to: toEmail,
      subject,
      content,
      senderName,
      receiverName,
      date: new Date(),
    });

    res.status(200).json({ message: "Email sent successfully" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to send email", error: err.message });
  }
});

router.get("/:type", async (req, res) => {
  try {
    const userEmail = req.user?.email || req.query.userEmail; // depending on auth
    const { type } = req.params;

    const emails = await Email.find({ userEmail, type }).sort({ date: -1 });
    res.status(200).json(emails);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch emails", error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Email.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Email not found" });
    res.status(200).json({ message: "Email deleted successfully" });
  } catch (err) {
    console.error("Delete Email Error:", err);
    res.status(500).json({ message: "Failed to delete email" });
  }
});


module.exports = router;
