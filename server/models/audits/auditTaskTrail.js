const ActivityLog = require("../activelogs");

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

function addTaskAudit(schema) {
  // Store old doc before update
  schema.pre("findOneAndUpdate", async function (next) {
    this._oldDoc = await this.model.findOne(this.getQuery());
    next();
  });

  // CREATE
  schema.post("save", async function (doc) {
    await ActivityLog.create({
      entityId: doc._id,
      entityName: doc.title || doc.title,
      action: "create",
      entity: "Task",
      leadId: doc.lead_id,
      updatedFields: doc.toObject(),
    });
  });

  // UPDATE
  schema.post("findOneAndUpdate", async function (doc) {
    const oldDoc = this._oldDoc;
    const changes = getChangedFields(oldDoc, doc);

    await ActivityLog.create({
      entityId: doc._id,
      entityName: doc.title || doc.title,
      action: "update",
      entity: "Task",
      leadId: doc.lead_id,
      updatedFields: changes,
    });
  });

  // DELETE
  schema.post("findOneAndDelete", async function (doc) {
    await ActivityLog.create({
      entityId: doc._id,
      entityName: doc.title || doc.title,
      action: "delete",
      entity: "Task",
      leadId: doc.lead_id,
      updatedFields: { deleted: true },
    });
  });
}

module.exports = addTaskAudit;
