import { ActivityLog } from "../models/index.js";

export async function logActivity(req, action, moduleName, details = "") {
  try {
    await ActivityLog.create({
      userId: req.user?.id || req.session?.userId || null,
      action,
      module: moduleName,
      details,
      ipAddress: req.ip || req.connection?.remoteAddress || null,
    });
  } catch (error) {
    console.error("Activity log failed:", error.message);
  }
}
