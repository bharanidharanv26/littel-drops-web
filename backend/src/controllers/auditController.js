import AuditLog from '../models/AuditLog.js';
import { transformDoc } from '../utils/transform.js';

export const getAuditLogs = async (req, res) => {
  try {
    const { dateFrom, dateTo, entityType, actorId, page = 1, limit = 100 } = req.query;
    let query = {};

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        query.createdAt.$lte = to;
      }
    }
    if (entityType) query.entityType = entityType;
    if (actorId) query.actorId = actorId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('actorId', 'name username role')
      .populate('branchId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const transformed = logs.map(log => ({
      ...transformDoc(log),
      actor: log.actorId,
      branch: log.branchId,
    }));

    res.json({ success: true, data: transformed, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
