import Elder from '../models/Elder.js';
import Branch from '../models/Branch.js';
import ElderMovement from '../models/ElderMovement.js';
import ElderOutcome from '../models/ElderOutcome.js';
import Request from '../models/Request.js';
import UserBranchAssignment from '../models/UserBranchAssignment.js';
import { transformDoc } from '../utils/transform.js';

export const getDashboardStats = async (req, res) => {
  try {
    let branchFilter = {};
    if (req.user.role === 'trustee') {
      const assignments = await UserBranchAssignment.find({
        userId: req.user._id,
        assignmentType: 'trustee',
        isActive: true,
      });
      const branchIds = assignments.map(a => a.branchId);
      branchFilter = { currentBranch: { $in: branchIds } };
    } else if (req.user.role === 'staff') {
      const assignments = await UserBranchAssignment.find({
        userId: req.user._id,
        assignmentType: 'permanent',
        isActive: true,
      });
      const branchIds = assignments.map(a => a.branchId);
      branchFilter = { currentBranch: { $in: branchIds } };
    }

    const [totalElders, activeElders, maleCount, femaleCount, deceasedElders, returnedElders, otherOutcomes] = await Promise.all([
      Elder.countDocuments(branchFilter),
      Elder.countDocuments({ ...branchFilter, currentStatus: 'active' }),
      Elder.countDocuments({ ...branchFilter, gender: 'male' }),
      Elder.countDocuments({ ...branchFilter, gender: 'female' }),
      Elder.countDocuments({ ...branchFilter, currentStatus: 'deceased' }),
      Elder.countDocuments({ ...branchFilter, currentStatus: 'returned_home' }),
      Elder.countDocuments({ ...branchFilter, currentStatus: 'other_outcome' }),
    ]);

    // Count total admissions (movement records)
    const totalAdmissions = await ElderMovement.countDocuments({
      movementType: 'admission',
      ...(req.user.role !== 'founder' ? { toBranch: { $in: (await UserBranchAssignment.find({ userId: req.user._id, isActive: true })).map(a => a.branchId) } } : {}),
    });

    const totalTransfers = await ElderMovement.countDocuments({
      movementType: 'transfer',
    });

    const totalDeaths = await ElderOutcome.countDocuments({
      outcomeType: 'death',
    });

    const pendingRequests = await Request.countDocuments({ status: 'pending' });

    // Branch stats
    const branches = await Branch.find({ isActive: true }).sort({ name: 1 });
    const branchStats = await Promise.all(
      branches.map(async (branch) => {
        const current = await Elder.countDocuments({ currentBranch: branch._id, currentStatus: 'active' });
        const admissions = await ElderMovement.countDocuments({ toBranch: branch._id, movementType: 'admission' });
        const transfersIn = await ElderMovement.countDocuments({ toBranch: branch._id, movementType: 'transfer' });
        const transfersOut = await ElderMovement.countDocuments({ fromBranch: branch._id, movementType: 'transfer' });
        const deaths = await ElderOutcome.countDocuments({ branchId: branch._id, outcomeType: 'death' });
        const returned = await ElderOutcome.countDocuments({ branchId: branch._id, outcomeType: 'returned_home' });
        return {
          id: branch._id.toString(),
          name: branch.name,
          current,
          admissions,
          transfers_in: transfersIn,
          transfers_out: transfersOut,
          deaths,
          returned_home: returned,
        };
      })
    );

    res.json({
      success: true,
      data: {
        total_elders: totalElders,
        active_elders: activeElders,
        male_count: maleCount,
        female_count: femaleCount,
        total_admissions: totalAdmissions,
        total_transfers: totalTransfers,
        total_deaths: totalDeaths,
        deceased_elders: deceasedElders,
        returned_elders: returnedElders,
        other_outcomes: otherOutcomes,
        pending_requests: pendingRequests,
        total_branches: branches.length,
        branchStats,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getReports = async (req, res) => {
  try {
    const { report_type, branch_id, dateFrom, dateTo } = req.query;

    switch (report_type) {
      case 'branch_summary': {
        const branches = await Branch.find({ isActive: true }).sort({ name: 1 });
        const rows = await Promise.all(
          branches.map(async (b) => {
            const [current, admissions, deaths, transfersIn, transfersOut, returned] = await Promise.all([
              Elder.countDocuments({ currentBranch: b._id, currentStatus: 'active' }),
              ElderMovement.countDocuments({ toBranch: b._id, movementType: 'admission' }),
              ElderOutcome.countDocuments({ branchId: b._id, outcomeType: 'death' }),
              ElderMovement.countDocuments({ toBranch: b._id, movementType: 'transfer' }),
              ElderMovement.countDocuments({ fromBranch: b._id, movementType: 'transfer' }),
              ElderOutcome.countDocuments({ branchId: b._id, outcomeType: 'returned_home' }),
            ]);
            return { id: b._id.toString(), name: b.name, current_elders: current, admissions, deaths, transfers_in: transfersIn, transfers_out: transfersOut, returned_home: returned };
          })
        );
        res.json({ success: true, data: rows });
        break;
      }
      case 'current_residents': {
        let query = { currentStatus: 'active' };
        if (branch_id) query.currentBranch = branch_id;
        const elders = await Elder.find(query).populate('currentBranch', 'name').sort({ name: 1 });
        res.json({ success: true, data: elders.map(e => ({ ...transformDoc(e), current_branch: e.currentBranch })) });
        break;
      }
      case 'admissions': {
        let query = { movementType: 'admission' };
        if (branch_id) query.toBranch = branch_id;
        if (dateFrom || dateTo) {
          query.movementDate = {};
          if (dateFrom) query.movementDate.$gte = dateFrom;
          if (dateTo) query.movementDate.$lte = dateTo;
        }
        const movements = await ElderMovement.find(query)
          .populate('elderId', 'name admissionNumber')
          .populate('toBranch', 'name')
          .sort({ movementDate: -1 });
        res.json({ success: true, data: movements.map(m => ({ ...transformDoc(m), elder: m.elderId, branch: m.toBranch })) });
        break;
      }
      case 'transfers': {
        let query = { movementType: 'transfer' };
        if (dateFrom || dateTo) {
          query.movementDate = {};
          if (dateFrom) query.movementDate.$gte = dateFrom;
          if (dateTo) query.movementDate.$lte = dateTo;
        }
        const movements = await ElderMovement.find(query)
          .populate('elderId', 'name admissionNumber')
          .populate('fromBranch', 'name')
          .populate('toBranch', 'name')
          .sort({ movementDate: -1 });
        res.json({ success: true, data: movements.map(m => ({ ...transformDoc(m), elder: m.elderId, from_branch: m.fromBranch, to_branch: m.toBranch })) });
        break;
      }
      case 'deaths': {
        let query = { outcomeType: 'death' };
        if (branch_id) query.branchId = branch_id;
        if (dateFrom || dateTo) {
          query.outcomeDate = {};
          if (dateFrom) query.outcomeDate.$gte = dateFrom;
          if (dateTo) query.outcomeDate.$lte = dateTo;
        }
        const outcomes = await ElderOutcome.find(query)
          .populate('elderId', 'name admissionNumber')
          .populate('branchId', 'name')
          .sort({ outcomeDate: -1 });
        res.json({ success: true, data: outcomes.map(o => ({ ...transformDoc(o), elder: o.elderId, branch: o.branchId })) });
        break;
      }
      case 'returned_home': {
        let query = { outcomeType: 'returned_home' };
        if (branch_id) query.branchId = branch_id;
        const outcomes = await ElderOutcome.find(query)
          .populate('elderId', 'name admissionNumber')
          .populate('branchId', 'name')
          .sort({ outcomeDate: -1 });
        res.json({ success: true, data: outcomes.map(o => ({ ...transformDoc(o), elder: o.elderId, branch: o.branchId })) });
        break;
      }
      case 'requests': {
        let query = {};
        if (dateFrom || dateTo) {
          query.createdAt = {};
          if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
          if (dateTo) query.createdAt.$lte = new Date(dateTo + 'T23:59:59');
        }
        const requests = await Request.find(query)
          .populate('elderId', 'name admissionNumber')
          .populate('requestedBy', 'name username')
          .populate('reviewedBy', 'name username')
          .sort({ createdAt: -1 })
          .limit(200);
        res.json({ success: true, data: requests.map(r => ({ ...transformDoc(r), elder: r.elderId, requested_by: r.requestedBy, reviewed_by: r.reviewedBy })) });
        break;
      }
      default:
        res.status(400).json({ success: false, message: 'Invalid report type' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
