const express = require("express");
const router = express.Router();
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const Lead = require("../models/lead");
const User = require("../models/users");

const upload = multer({ dest: "uploads/" });

function normalizeUrl(url) {
  try {
    let u = new URL(url);
    let hostname = u.hostname.replace(/^www\./, "");
    return `https://${hostname}${u.pathname.replace(/\/$/, "")}`;
  } catch (err) {
    return url;
  }
}

function validatePhone(phone) {
  if (!phone) return false;
  const cleaned = phone.trim().replace(/[\s\-\(\)]/g, "");
  return /^\d{10}$/.test(cleaned);
}

function parsePointsOfContact(row) {
  const contacts = [];

  const contactIndexes = Object.keys(row)
    .map((key) => {
      const match = key.match(/points_of_contact\[(\d+)\]\.name/);
      return match ? parseInt(match[1]) : null;
    })
    .filter((i) => i !== null);

  const uniqueIndexes = [...new Set(contactIndexes)];

  uniqueIndexes.forEach((i) => {
    const name = (row[`points_of_contact[${i}].name`] || "").trim();
    const phone = (row[`points_of_contact[${i}].phone`] || "").trim();
    const alternate_phone = (
      row[`points_of_contact[${i}].alternate_phone`] || ""
    ).trim();

    // ✅ Include contact if it has a name and at least one phone number
    if (name && (phone || alternate_phone)) {
      contacts.push({
        name,
        designation: (row[`points_of_contact[${i}].designation`] || "").trim(),
        email: (row[`points_of_contact[${i}].email`] || "").trim(),
        phone,
        alternate_phone,
        linkedin_url: (
          row[`points_of_contact[${i}].linkedin_url`] || ""
        ).trim(),
      });
    }
  });

  return contacts;
}


function safeParseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (e) {
    return fallback; // return default if invalid JSON
  }
}
function parseHiringNeeds(value) {
  if (!value) return [];
  try {
    // If it’s JSON (like ["IT","Volume"]), parse it
    return JSON.parse(value);
  } catch (e) {
    // Otherwise, fallback to semicolon or comma split
    return value
      .split(/;|,/)
      .map((v) => v.trim())
      .filter(Boolean);
  }
}

router.post("/upload-csv", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");

  const rows = [];
  const errors = [];
  const leadsMap = new Map();
  // for deduplication by website_url

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (row) => rows.push(row))

    .on("end", async () => {
      try {
        const websiteUrls = rows
          .map((r) => normalizeUrl(r.website_url))
          .filter(Boolean);

        // Fetch existing leads once
        const existingLeads = await Lead.find({
          website_url: { $in: websiteUrls },
        });

        const existingLeadsMap = new Map(
          existingLeads.map((l) => [l.website_url, l])
        );

        const leadsMap = new Map(); // to hold new leads (not in DB)

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const normalizedUrl = normalizeUrl(row.website_url);
          if (!normalizedUrl) continue;

          const contacts = parsePointsOfContact(row);
          if (!contacts.length) {
            fs.unlinkSync(req.file.path); // cleanup uploaded file
            console.warn(
              "Invalid CSV: no valid points_of_contact found in one or more rows:",
              row
            );
            return res.status(400).json({
              success: false,
              message: `Each company must have at least one valid point of contact (with name and phone). Missing for: ${row.company_name || "Unknown Company"
                }`,
            });
          }

          // ✅ Validate phone numbers (must be 10 digits)
          for (const contact of contacts) {
            if (contact.phone && !validatePhone(contact.phone)) {
              fs.unlinkSync(req.file.path);
              return res.status(400).json({
                success: false,
                message: `Invalid phone number for contact ${contact.name} at ${row.company_name || "Unknown Company"
                  }. Phone must be exactly 10 digits.`,
              });
            }
            if (
              contact.alternate_phone &&
              !validatePhone(contact.alternate_phone)
            ) {
              fs.unlinkSync(req.file.path);
              return res.status(400).json({
                success: false,
                message: `Invalid alternate phone number for contact ${contact.name
                  } at ${row.company_name || "Unknown Company"
                  }. Alternate phone must be exactly 10 digits.`,
              });
            }
          }

          if (existingLeadsMap.has(normalizedUrl)) {
            // ✅ Already in DB → update
            const lead = existingLeadsMap.get(normalizedUrl);

            contacts.forEach((contact) => {
              if (
                !lead.points_of_contact.some(
                  (c) =>
                    c.phone === contact.phone ||
                    c.phone === contact.alternate_phone ||
                    c.alternate_phone === contact.phone ||
                    c.alternate_phone === contact.alternate_phone
                )
              ) {
                lead.points_of_contact.push(contact);
              }
            });

            await lead.save(); // 🔑 save updated lead immediately
          } else {
            // ✅ Not in DB → new lead
            // Convert email → user ID if possible
            let assignedById = null;
            if (row.assignedBy) {
              const user = await User.findOne({ email: row.assignedBy.trim() });
              if (user) {
                assignedById = user._id; // ✅ store ObjectId
              } else {
                console.warn(`No user found with email: ${row.assignedBy}`);
              }
            }

            if (!leadsMap.has(normalizedUrl)) {
              leadsMap.set(normalizedUrl, {
                company_name: row.company_name || "",
                company_info: row.company_info || "",
                company_size: row.company_size || "",
                website_url: normalizedUrl,
                company_email: row.company_email || "",
                hiring_needs: parseHiringNeeds(row.hiring_needs),

                points_of_contact: contacts,
                lead_source: row.lead_source || "",
                linkedin_link: row.linkedin_link || "",
                industry_name: row.industry_name || row.industry || "",
                no_of_designations: row.no_of_designations || null,
                no_of_positions: row.no_of_positions || null,
                stage: row.stage || "New",
                assignedBy: assignedById,
                remarks: safeParseJson(row.remarks, []),
              });
            } else {
              // ✅ Merge contacts if same URL appears again in CSV
              const existing = leadsMap.get(normalizedUrl);
              contacts.forEach((contact) => {
                if (
                  !existing.points_of_contact.some(
                    (c) =>
                      c.phone === contact.phone ||
                      c.phone === contact.alternate_phone ||
                      c.alternate_phone === contact.phone ||
                      c.alternate_phone === contact.alternate_phone
                  )
                ) {
                  existing.points_of_contact.push(contact);
                }
              });
            }
          }
        }

        // ✅ Insert all NEW leads at once
        const leadsToInsert = Array.from(leadsMap.values());
        if (leadsToInsert.length > 0) {
          await Lead.insertMany(leadsToInsert, { ordered: true }); // 🔑 ensure insertion
        }

        fs.unlinkSync(req.file.path);

        // res.json({
        //   totalRows: rows.length,
        //   inserted: leadsToInsert.length,
        //   updated: existingLeads.length,
        // });
        res.json({
          totalRows: rows.length,
          inserted: leadsToInsert.length,
          updated: existingLeads.length,
          skipped: 0,
          errors: [], // always send array
        });
      } catch (err) {
        fs.unlinkSync(req.file.path);
        console.error("Bulk upload error:", err);
        res.status(500).json({ error: err.message });
      }
    });
});

module.exports = router;
