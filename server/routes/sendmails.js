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

// require("events").EventEmitter.defaultMaxListeners = 50; // prevent listener warnings

// router.get("/fetch-emails", (req, res) => {
//   const { email, appPassword } = req.query;

//   if (!email || !appPassword) {
//     return res.status(400).json({ message: "Email and App Password required" });
//   }

//   // SSE headers
//   res.setHeader("Content-Type", "text/event-stream");
//   res.setHeader("Cache-Control", "no-cache");
//   res.setHeader("Connection", "keep-alive");
//   res.flushHeaders();

//   const imap = new Imap({
//     user: email,
//     password: appPassword,
//     host: "imap.gmail.com",
//     port: 993,
//     tls: true,
//   });

//   function openInbox(cb) {
//     imap.openBox("INBOX", true, cb);
//   }

//   imap.once("ready", () => {
//     openInbox(async (err, box) => {
//       if (err) {
//         imap.end();
//         res.write(
//           `event: error\ndata: ${JSON.stringify({
//             message: "Failed to open inbox",
//           })}\n\n`
//         );
//         res.end();
//         return;
//       }

//       const total = box.messages.total;
//       const batchSize = 500;
//       let start = 1;
//       let batchNumber = 1;

//       console.log(`Total messages: ${total}`);

//       async function fetchBatch() {
//         const end = Math.min(start + batchSize - 1, total);
//         console.log(`Fetching batch ${batchNumber} (${start}-${end})`);

//         const f = imap.seq.fetch(`${start}:${end}`, {
//           bodies: "",
//           struct: true,
//         });

//         const messages = [];

//         f.on("message", (msg) => {
//           messages.push(msg);
//         });

//       f.once("end", async () => {
//         const emails = [];
//         const messagesPromises = [];

//         f.on("message", (msg) => {
//           messagesPromises.push(
//             new Promise((resolve) => {
//               const parts = [];
//               msg.on("body", (stream) => {
//                 stream.on("data", (chunk) => parts.push(chunk));
//                 stream.on("end", async () => {
//                   try {
//                     const parsed = await simpleParser(Buffer.concat(parts));
//                     resolve({
//                       messageId: parsed.messageId,
//                       from: parsed.from?.text || "",
//                       to: parsed.to?.text || "",
//                       subject: parsed.subject || "(No Subject)",
//                       date: parsed.date || "",
//                       text: parsed.text || "",
//                       html: parsed.html || "",
//                     });
//                   } catch {
//                     resolve(null);
//                   }
//                 });
//               });
//             })
//           );
//         });

//         const parsedEmails = (await Promise.all(messagesPromises)).filter(
//           Boolean
//         );

//         res.write(
//           `event: batch\ndata: ${JSON.stringify({
//             batch: batchNumber,
//             emails: parsedEmails,
//           })}\n\n`
//         );
//       });

//       }

//       fetchBatch();
//     });
//   });

//   imap.once("error", (err) => {
//     console.error("IMAP error:", err);
//     res.write(
//       `event: error\ndata: ${JSON.stringify({
//         message: "IMAP Error",
//         error: err,
//       })}\n\n`
//     );
//     res.end();
//   });

//   imap.connect();
// });

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
