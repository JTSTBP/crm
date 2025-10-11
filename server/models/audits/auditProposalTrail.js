// const ActivityLog = require("../activelogs");

// function getChangedFields(oldDoc, newDoc) {
//   const changes = {};
//   if (!oldDoc || !newDoc) return changes;

//   const oldObj = oldDoc.toObject();
//   const newObj = newDoc.toObject();

//   Object.keys(newObj).forEach((key) => {
//     if (["_id", "__v", "createdAt", "updatedAt"].includes(key)) return;

//     if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
//       changes[key] = { old: oldObj[key], new: newObj[key] };
//     }
//   });

//   return changes;
// }

// function addProposalAudit(schema) {
//   // Store old doc before update
//   schema.pre("findOneAndUpdate", async function (next) {
//     this._oldDoc = await this.model.findOne(this.getQuery());
//     next();
//   });

//   // CREATE
//   schema.post("save", async function (doc) {
//     await ActivityLog.create({
//       entityId: doc._id,
//       entityName: `Proposal for Lead ${doc.company_name}`,
//       action: "create",
//       entity: "Proposal",
//       leadId: doc.lead_id,
//       updatedFields: doc.toObject(),
//     });
//   });

//   // UPDATE
//   schema.post("findOneAndUpdate", async function (doc) {
//     const oldDoc = this._oldDoc;
//     const changes = getChangedFields(oldDoc, doc);

//     await ActivityLog.create({
//       entityId: doc._id,
//       entityName: `Proposal for Lead ${doc.company_name}`,
//       action: "update",
//       entity: "Proposal",
//       leadId: doc.lead_id,
//       updatedFields: changes,
//     });
//   });

//   // DELETE
//   schema.post("findOneAndDelete", async function (doc) {
//     await ActivityLog.create({
//       entityId: doc._id,
//       entityName: `Proposal for Lead ${doc.company_name}`,
//       action: "delete",
//       entity: "Proposal",
//       leadId: doc.lead_id,
//       updatedFields: { deleted: true },
//     });
//   });
// }

// module.exports = addProposalAudit;
const ActivityLog = require("../activelogs");
const Lead = require("../lead"); // import your Lead model

function getChangedFields(oldDoc, newDoc) {
  const changes = {};
  if (!oldDoc || !newDoc) return changes;

  const oldObj = oldDoc.toObject();
  const newObj = newDoc.toObject();

  Object.keys(newObj).forEach((key) => {
    if (["_id", "__v", "createdAt", "updatedAt"].includes(key)) return;

    if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
      changes[key] = { old: oldObj[key], new: newObj[key] };
    }
  });

  return changes;
}

async function getCompanyName(leadId) {
  try {
    const lead = await Lead.findById(leadId).select("company_name");
    return lead ? lead.company_name : "Unknown Company";
  } catch (err) {
    console.error("Error fetching company name:", err);
    return "Unknown Company";
  }
}

function addProposalAudit(schema) {
  // Store old doc before update
  schema.pre("findOneAndUpdate", async function (next) {
    this._oldDoc = await this.model.findOne(this.getQuery());
    next();
  });

  // CREATE
  schema.post("save", async function (doc) {
    const companyName = await getCompanyName(doc.lead_id);

    await ActivityLog.create({
      entityId: doc._id,
      entityName: `Proposal for Lead ${companyName}`,
      action: "create",
      entity: "Proposal",
      leadId: doc.lead_id,
      updatedFields: doc.toObject(),
    });
  });

  // UPDATE
  schema.post("findOneAndUpdate", async function (doc) {
    const oldDoc = this._oldDoc;
    const changes = getChangedFields(oldDoc, doc);
    const companyName = await getCompanyName(doc.lead_id);

    await ActivityLog.create({
      entityId: doc._id,
      entityName: `Proposal for Lead ${companyName}`,
      action: "update",
      entity: "Proposal",
      leadId: doc.lead_id,
      updatedFields: changes,
    });
  });

  // DELETE
  schema.post("findOneAndDelete", async function (doc) {
    const companyName = await getCompanyName(doc.lead_id);

    await ActivityLog.create({
      entityId: doc._id,
      entityName: `Proposal for Lead ${companyName}`,
      action: "delete",
      entity: "Proposal",
      leadId: doc.lead_id,
      updatedFields: { deleted: true },
    });
  });
}

module.exports = addProposalAudit;
