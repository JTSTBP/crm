const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const Email = require("../models/email");
const fs = require("fs");
const multer = require("multer"); // create a model like this below
const Imap = require("node-imap");
const { simpleParser } = require("mailparser");
const upload = multer({ dest: "uploads/" });


router.post("/fetch-emails", (req, res) => {
  const { email, appPassword } = req.body;

  if (!email || !appPassword) {
    return res.status(400).json({ message: "Email and App Password required" });
  }

  const imap = new Imap({
    user: email,
    password: appPassword,
    host: "imap.gmail.com",
    port: 993,
    tls: true,
  });

  function openInbox(cb) {
    imap.openBox("INBOX", true, cb);
  }

  let emails = [];

  imap.once("ready", function () {
    // openInbox((err, box) => {
    //   if (err) {
    //     imap.end();
    //     return res
    //       .status(500)
    //       .json({ message: "Failed to open inbox", error: err });
    //   }

    //   const f = imap.seq.fetch("1:10", { bodies: "", struct: true }); // last 10 emails
    //   f.on("message", (msg) => {
    //     msg.on("body", (stream) => {
    //       simpleParser(stream, (err, parsed) => {
    //         if (!err) {
    //           emails.push({
    //             from: parsed.from.text,
    //             subject: parsed.subject,
    //             text: parsed.text,
    //           });
    //         }
    //       });
    //     });
    //   });

    //   f.once("end", () => {
    //     imap.end();
    //     res.json({ emails });
    //   });
    // });
  
  openInbox((err, box) => {
    if (err) {
      imap.end();
      return res
        .status(500)
        .json({ message: "Failed to open inbox", error: err });
    }

    // Fetch latest 20 emails
    const start = Math.max(1, box.messages.total - 19);
    const f = imap.seq.fetch(`${start}:${box.messages.total}`, {
      bodies: "",
      struct: true,
    });

    f.on("message", (msg) => {
      msg.on("body", (stream) => {
        simpleParser(stream, (err, parsed) => {
          if (!err) {
            emails.push({
              from: parsed.from.text,
              subject: parsed.subject,
              text: parsed.text,
            });
          }
        });
      });
    });

    f.once("end", () => {
      imap.end();
      res.json({ emails });
    });
  });

  });

  imap.once("error", (err) =>
    res.status(500).json({ message: "IMAP Error", error: err })
  );
  imap.connect();
});


router.post("/send-email", upload.array("attachments"), async (req, res) => {
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

    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465,
      auth: { user: fromEmail, pass: appPassword },
    });

    // Convert uploaded files to Nodemailer attachments
    const attachments =
      req.files?.map((file) => ({
        filename: file.originalname,
        path: file.path,
      })) || [];

    // Send email
    await transporter.sendMail({
      from: `"${senderName || "JtCRM"}" <${fromEmail}>`,
      to: toEmail,
      subject,
      html: content,
      attachments,
    });

    // Save email log
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

    // Delete uploaded files after sending
    attachments.forEach((file) => fs.unlinkSync(file.path));

    res.status(200).json({ message: "Email sent successfully" });
  } catch (err) {
    console.error("Send Email Error:", err);
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
