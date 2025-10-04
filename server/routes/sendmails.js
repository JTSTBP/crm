// routes/email.js
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

// POST /api/send-email
router.post("/send-email", async (req, res) => {
  try {
      const { toEmail, subject, content } = req.body;
      console.log(toEmail,"e", subject, "s",content,"c");

    if (!toEmail || !subject || !content) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send email
    await transporter.sendMail({
      from: `"JtCRM" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject,
      html: content, // use html for rich text
    });

    res.status(200).json({ message: "Email sent successfully" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to send email", error: err.message });
  }
});

module.exports = router;
