import Branch from '../models/Branch.js';
import Elder from '../models/Elder.js';
import { transformDoc } from '../utils/transform.js';

export const getBranches = async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: true }).sort({ name: 1 });

    // Get elder counts for each branch
    const branchData = await Promise.all(
      branches.map(async (branch) => {
        const count = await Elder.countDocuments({
          currentBranch: branch._id,
          currentStatus: 'active',
        });
        return { ...transformDoc(branch), elder_count: count };
      })
    );

    res.json({ success: true, data: branchData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBranch = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }
    res.json({ success: true, data: transformDoc(branch) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createBranch = async (req, res) => {
  try {
    const { name, address, phone } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Branch name is required' });
    }

    const existing = await Branch.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Branch with this name already exists' });
    }

    const branch = await Branch.create({ name: name.trim(), address: address || '', phone: phone || '' });
    res.status(201).json({ success: true, data: transformDoc(branch) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBranch = async (req, res) => {
  try {
    const { name, address, phone, isActive } = req.body;
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (address !== undefined) updateFields.address = address;
    if (phone !== undefined) updateFields.phone = phone;
    if (isActive !== undefined) updateFields.isActive = isActive;

    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }
    res.json({ success: true, data: transformDoc(branch) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleBranchStatus = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    branch.isActive = !branch.isActive;
    await branch.save();

    res.json({ success: true, data: transformDoc(branch) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
