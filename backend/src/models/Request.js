import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  requestType: {
    type: String,
    enum: ['admission', 'edit', 'transfer', 'death', 'return_home', 'other'],
    required: true,
  },
  elderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Elder',
    default: null,
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null,
  },
  sourceBranchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null,
  },
  destinationBranchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null,
  },
  proposedChanges: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  reason: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reviewedAt: {
    type: String,
    default: null,
  },
  reviewComment: {
    type: String,
    default: null,
  },
}, { timestamps: true });

// Indexes
requestSchema.index({ status: 1 });
requestSchema.index({ requestType: 1 });
requestSchema.index({ requestedBy: 1 });
requestSchema.index({ branchId: 1 });
requestSchema.index({ createdAt: -1 });

const Request = mongoose.model('Request', requestSchema);

export default Request;
