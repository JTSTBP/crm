// function getChangedFields(oldDoc, newDoc) {
//   const changes = {};
//   if (!oldDoc || !newDoc) return changes;

//   const oldObj = oldDoc.toObject();
//   const newObj = newDoc.toObject();

//   Object.keys(newObj).forEach((key) => {
//     // skip mongoose internals
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
//   const ActivityLog = require("./activelogs");

//   // STORE OLD DOC before update
//   schema.pre("findOneAndUpdate", async function (next) {
//     this._oldDoc = await this.model.findOne(this.getQuery());
//     next();
//   });

//   // CREATE
//   schema.post("save", async function (doc) {
//     await ActivityLog.create({
//       userId: doc.modifiedBy || null,
//       userName: doc.modifiedByName || null,
//       action: "create",
//       entity: entityName,
//       entityId: doc._id,
//       updatedFields: doc.toObject(), // full doc on create
//     });
//   });

//   // UPDATE
//   schema.post("findOneAndUpdate", async function (doc) {
//     const oldDoc = this._oldDoc;
//     const changes = getChangedFields(oldDoc, doc);

//     await ActivityLog.create({
//       userId: this.getOptions().userId || null,
//       userName: this.getOptions().userName || null,
//       action: "update",
//       entity: entityName,
//       entityId: doc._id,
//       updatedFields: changes,
//     });
//   });

//   // DELETE
//   schema.post("findOneAndDelete", async function (doc) {
//     await ActivityLog.create({
//       userId: this.getOptions().userId || null,
//       userName: this.getOptions().userName || null,
//       action: "delete",
//       entity: entityName,
//       entityId: doc._id,
//       updatedFields: { deleted: true },
//     });
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

  // Store old document before update
  schema.pre("findOneAndUpdate", async function (next) {
    this._oldDoc = await this.model.findOne(this.getQuery());
    next();
  });

  // CREATE
  schema.post("save", async function (doc) {
    await ActivityLog.create({
      entityId: doc._id, // storing lead id
      entityName: doc.company_name, // lead name from doc
      action: "create",
      entity: entityName,

      updatedFields: doc.toObject(),
    });
  });

  // UPDATE
  schema.post("findOneAndUpdate", async function (doc) {
    const oldDoc = this._oldDoc;
    const changes = getChangedFields(oldDoc, doc);

    await ActivityLog.create({
      entityId: doc._id, // storing lead id
      entityName: doc.company_name, // lead name from updated doc
      action: "update",
      entity: entityName,

      updatedFields: changes,
    });
  });

  // DELETE
  schema.post("findOneAndDelete", async function (doc) {
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
