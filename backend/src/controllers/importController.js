import Elder from '../models/Elder.js';
import ElderMovement from '../models/ElderMovement.js';
import ElderOutcome from '../models/ElderOutcome.js';
import AuditLog from '../models/AuditLog.js';
import ImportJob from '../models/ImportJob.js';
import { transformDoc } from '../utils/transform.js';

export const previewImport = async (req, res) => {
  try {
    const { rows } = req.body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No rows to preview' });
    }

    const results = rows.map((row, index) => {
      const errors = [];
      const warnings = [];

      if (!row.name) errors.push('Name is required');
      if (!row.admissionNumber) errors.push('Admission number is required');
      if (!row.admissionDate) errors.push('Admission date is required');
      if (row.gender && !['male', 'female', 'other'].includes(row.gender.toLowerCase())) {
        errors.push('Invalid gender');
      }

      return {
        rowNumber: index + 1,
        data: row,
        status: errors.length > 0 ? 'error' : 'valid',
        errors,
        warnings,
      };
    });

    // Check for duplicates
    const admissionNumbers = rows.map(r => r.admissionNumber).filter(Boolean);
    const existingElders = await Elder.find({ admissionNumber: { $in: admissionNumbers } });
    const existingMap = new Map(existingElders.map(e => [e.admissionNumber, true]));

    for (const result of results) {
      if (result.data.admissionNumber && existingMap.has(result.data.admissionNumber)) {
        result.status = 'duplicate';
        result.errors.push('Admission number already exists');
      }
    }

    const valid = results.filter(r => r.status === 'valid').length;
    const duplicates = results.filter(r => r.status === 'duplicate').length;
    const errors = results.filter(r => r.status === 'error').length;

    res.json({
      success: true,
      data: {
        results,
        summary: { total: rows.length, valid, duplicates, errors },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const confirmImport = async (req, res) => {
  try {
    const { rows } = req.body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No rows to import' });
    }

    const job = await ImportJob.create({
      initiatedBy: req.user._id,
      status: 'processing',
      totalRows: rows.length,
      fileName: req.body.fileName || 'import',
    });

    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails = [];

    // Get next serial number
    const lastElder = await Elder.findOne({ serialNumber: { $ne: null } }).sort({ serialNumber: -1 });
    let serialNumber = lastElder ? lastElder.serialNumber + 1 : 1;

    for (const row of rows) {
      try {
        // Skip if admission number exists
        if (row.admissionNumber) {
          const existing = await Elder.findOne({ admissionNumber: row.admissionNumber });
          if (existing) {
            skipped++;
            continue;
          }
        }

        const elder = await Elder.create({
          serialNumber: row.serialNumber || serialNumber++,
          admissionNumber: row.admissionNumber || `IMP-${serialNumber - 1}`,
          name: row.name,
          age: parseInt(row.age) || 0,
          gender: (row.gender || 'male').toLowerCase(),
          admissionDate: row.admissionDate || new Date().toISOString().split('T')[0],
          admissionBranch: req.user.role === 'founder' ? undefined : req.user.currentBranch,
          currentBranch: req.user.role === 'founder' ? undefined : req.user.currentBranch,
          currentStatus: 'active',
          policeMemoNumber: row.policeMemoNumber || null,
          referredBy: row.referredBy || null,
          address: row.address || '',
          phone: row.phone || '',
          emergencyContactName: row.emergencyContactName || '',
          emergencyContactPhone: row.emergencyContactPhone || '',
          createdBy: req.user._id,
        });

        // Create admission movement
        if (elder.admissionBranch) {
          await ElderMovement.create({
            elderId: elder._id,
            toBranch: elder.admissionBranch,
            movementType: 'admission',
            movementDate: elder.admissionDate,
            initiatedBy: req.user._id,
            approvedBy: req.user._id,
          });
        }

        imported++;
      } catch (err) {
        errors++;
        errorDetails.push({ row: row.name || 'Unknown', error: err.message });
      }
    }

    job.status = 'completed';
    job.imported = imported;
    job.skipped = skipped;
    job.errorCount = errors;
    job.errorDetails = errorDetails;
    job.completedAt = new Date();
    await job.save();

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'excel_import',
      entityType: 'import',
      entityId: job._id.toString(),
      details: { imported, skipped, errors, total: rows.length },
    });

    res.json({
      success: true,
      data: {
        jobId: job._id,
        imported,
        skipped,
        errors,
        errorDetails,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getImportJobs = async (req, res) => {
  try {
    const jobs = await ImportJob.find()
      .populate('initiatedBy', 'name username')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, data: jobs.map(transformDoc) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
