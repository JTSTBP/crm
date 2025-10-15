

// function getChangedFields(oldDoc, newDoc) {
//   const changes = {};
//   if (!oldDoc || !newDoc) return changes;

//   const oldObj = oldDoc.toObject();
//   const newObj = newDoc.toObject();

//   Object.keys(newObj).forEach((key) => {
//     if (["_id", "__v", "createdAt", "updatedAt"].includes(key)) return;

//     if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
//       changes[key] = {
//         old: oldObj[key],
//         new: newObj[key],
//       };
//     }
//   });

//   return changes;
// }

// function addAuditTrail(schema, entityName) {
//   const ActivityLog = require("../activelogs");

//   // Store old document before update
//   schema.pre("findOneAndUpdate", async function (next) {
//     this._oldDoc = await this.model.findOne(this.getQuery());
//     next();
//   });

//   // CREATE
//   schema.post("save", async function (doc) {
//     await ActivityLog.create({
//       entityId: doc._id, // storing lead id
//       entityName: doc.company_name, // lead name from doc
//       action: "create",
//       entity: entityName,

//       updatedFields: doc.toObject(),
//     });
//   });

//   // UPDATE
//   schema.post("findOneAndUpdate", async function (doc) {
//     const oldDoc = this._oldDoc;
//     const changes = getChangedFields(oldDoc, doc);

//     await ActivityLog.create({
//       entityId: doc._id, // storing lead id
//       entityName: doc.company_name, // lead name from updated doc
//       action: "update",
//       entity: entityName,

//       updatedFields: changes,
//     });
//   });

//   // DELETE
//   schema.post("findOneAndDelete", async function (doc) {
//     await ActivityLog.create({
//       entityId: doc._id,
//       entityName: doc.company_name,
//       action: "delete",
//       entity: entityName,

//       updatedFields: { deleted: true },
//     });
//   });

//   // Remark-specific audit tracking
//   schema.pre("findOneAndUpdate", async function (next) {
//     this._oldDoc = await this.model.findOne(this.getQuery());
//     next();
//   });

//   schema.post("findOneAndUpdate", async function (doc) {
//     const oldDoc = this._oldDoc;
//     if (!oldDoc || !doc) return;

//     const ActivityLog = require("../activelogs");
//     const changes = getChangedFields(oldDoc, doc);

//     // Detect remark changes specifically
//     const oldRemarks = oldDoc.remarks.map((r) => r._id.toString());
//     const newRemarks = doc.remarks.map((r) => r._id.toString());

//     const added = doc.remarks.filter(
//       (r) => !oldRemarks.includes(r._id.toString())
//     );
//     const removed = oldDoc.remarks.filter(
//       (r) => !newRemarks.includes(r._id.toString())
//     );

//     if (added.length > 0) {
//       for (const remark of added) {
//         await ActivityLog.create({
//           entityId: doc._id,
//           entityName: doc.company_name,
//           action: "remark_added",
//           entity: "Leads",
//           updatedFields: { remark },
//         });
//       }
//     }

//     if (removed.length > 0) {
//       for (const remark of removed) {
//         await ActivityLog.create({
//           entityId: doc._id,
//           entityName: doc.company_name,
//           action: "remark_deleted",
//           entity: "Leads",
//           updatedFields: { remarkId: remark._id },
//         });
//       }
//     }

//     // For other updates, still keep normal audit
//     if (Object.keys(changes).length > 0 && !("remarks" in changes)) {
//       await ActivityLog.create({
//         entityId: doc._id,
//         entityName: doc.company_name,
//         action: "update",
//         entity: "Leads",
//         updatedFields: changes,
//       });
//     }
//   });
// }

// module.exports = addAuditTrail;


function getChangedFields(oldDoc, newDoc) {
  const changes = {};
  if (!oldDoc || !newDoc) return changes;

  const oldObj = oldDoc.toObject();
  const newObj = newDoc.toObject();


  Object.keys(newObj).forEach((key) => {
    if (["_id", "__v", "createdAt", "updatedAt"].includes(key)) return;

    if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
      changes[key] = {
        old: oldObj[key],
        new: newObj[key],
      };
    }
  });

  return changes;
}

function addAuditTrail(schema, entityName) {
  const ActivityLog = require("../activelogs");

  // ✅ Store old document before update
  schema.pre("findOneAndUpdate", async function (next) {
    this._oldDoc = await this.model.findOne(this.getQuery());
    next();
  });

  // ✅ CREATE
  schema.post("save", async function (doc) {

    await ActivityLog.create({
      entityId: doc._id,
      entityName: doc.company_name,
      action: "create",
      entity: entityName,
      updatedFields: doc.toObject(),
    });
  });

  // ✅ UPDATE + Remark Tracking
  schema.post("findOneAndUpdate", async function (doc) {
    const oldDoc = this._oldDoc;
    if (!oldDoc || !doc) return;
    // Add these lines for debugging
    console.log(
      "oldDoc remarks:",
      oldDoc.remarks.map((r) => r._id.toString())
    );
    console.log(
      "doc remarks:",
      doc.remarks.map((r) => r._id.toString())
    );
    const changes = getChangedFields(oldDoc, doc);

    // --- Detect remark changes ---
    const oldRemarks = oldDoc.remarks.map((r) => r._id.toString());
    const newRemarks = doc.remarks.map((r) => r._id.toString());

    const added = doc.remarks.filter(
      (r) => !oldRemarks.includes(r._id.toString())
    );
    const removed = oldDoc.remarks.filter(
      (r) => !newRemarks.includes(r._id.toString())
    );
    // Log added remarks
    for (const remark of added) {
      console.log("save1");
      await ActivityLog.create({
        entityId: doc._id,
        entityName: doc.company_name,
        action: "remark_added",
        entity: entityName,
        updatedFields: {
          remark: {
            _id: remark._id,
            content: remark.content,
            type: remark.type,
            fileUrl: remark.fileUrl,
            voiceUrl: remark.voiceUrl,
            profile: {
              id: remark.profile.id,
              name: remark.profile.name,
            },
            created_at: remark.created_at,
          },
        },
      });
    }

    // Log removed remarks
    for (const remark of removed) {
      console.log("r");
      await ActivityLog.create({
        entityId: doc._id,
        entityName: doc.company_name,
        action: "remark_deleted",
        entity: entityName,
        updatedFields: {
          remark: {
            _id: remark._id,
            content: remark.content,
            type: remark.type,
            fileUrl: remark.fileUrl,
            voiceUrl: remark.voiceUrl,
            profile: {
              id: remark.profile.id,
              name: remark.profile.name,
            },
            created_at: remark.created_at,
          },
        },
      });
    }


    // --- Log general updates (excluding remarks-only changes) ---
    const onlyRemarksChanged =
      Object.keys(changes).length === 1 && "remarks" in changes;

    if (Object.keys(changes).length > 0 && !onlyRemarksChanged) {
      await ActivityLog.create({
        entityId: doc._id,
        entityName: doc.company_name,
        action: "update",
        entity: entityName,
        updatedFields: changes,
      });
    }
  });

  // ✅ DELETE
  schema.post("findOneAndDelete", async function (doc) {
    if (!doc) return;
    await ActivityLog.create({
      entityId: doc._id,
      entityName: doc.company_name,
      action: "delete",
      entity: entityName,
      updatedFields: { deleted: true },
    });
  });
}

module.exports = addAuditTrail;
