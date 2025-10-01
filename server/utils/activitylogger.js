// utils/activityLogger.js
const ActivityLog = require("../models/activelogs");

async function logActivity(
  userId,
  collectionName,
  documentId,
  action,
  changes = {}
) {
  await ActivityLog.create({
    user_id: userId,
    collection_name: collectionName,
    document_id: documentId,
    action,
    changed_fields: changes,
  });
}

module.exports = logActivity;
