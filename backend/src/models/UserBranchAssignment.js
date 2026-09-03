import mongoose from 'mongoose';

const userBranchAssignmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  assignmentType: {
    type: String,
    enum: ['permanent', 'trustee', 'temporary'],
    required: true,
  },
  startDate: {
    type: String,
    default: null,
  },
  endDate: {
    type: String,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reason: {
    type: String,
    default: null,
  },
}, { timestamps: true });

// Indexes
userBranchAssignmentSchema.index({ userId: 1 });
userBranchAssignmentSchema.index({ branchId: 1 });
userBranchAssignmentSchema.index({ assignmentType: 1 });
userBranchAssignmentSchema.index({ isActive: 1 });

const UserBranchAssignment = mongoose.model('UserBranchAssignment', userBranchAssignmentSchema);

export default UserBranchAssignment;
