import mongoose from 'mongoose';

const elderMovementSchema = new mongoose.Schema({
  elderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Elder',
    required: true,
  },
  fromBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null,
  },
  toBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  movementType: {
    type: String,
    enum: ['admission', 'transfer'],
    required: true,
  },
  movementDate: {
    type: String,
    required: true,
  },
  movementTime: {
    type: String,
    default: null,
  },
  reason: {
    type: String,
    default: null,
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    default: null,
  },
}, { timestamps: true });

// Indexes
elderMovementSchema.index({ elderId: 1 });
elderMovementSchema.index({ toBranch: 1 });
elderMovementSchema.index({ movementType: 1 });
elderMovementSchema.index({ movementDate: 1 });

const ElderMovement = mongoose.model('ElderMovement', elderMovementSchema);

export default ElderMovement;
