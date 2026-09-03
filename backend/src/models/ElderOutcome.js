import mongoose from 'mongoose';

const elderOutcomeSchema = new mongoose.Schema({
  elderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Elder',
    required: true,
  },
  outcomeType: {
    type: String,
    enum: ['death', 'returned_home', 'other'],
    required: true,
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  outcomeDate: {
    type: String,
    required: true,
  },
  outcomeTime: {
    type: String,
    default: null,
  },
  reason: {
    type: String,
    default: null,
  },
  details: {
    type: String,
    default: null,
  },
  recordedBy: {
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

elderOutcomeSchema.index({ elderId: 1 });
elderOutcomeSchema.index({ outcomeType: 1 });
elderOutcomeSchema.index({ branchId: 1 });

const ElderOutcome = mongoose.model('ElderOutcome', elderOutcomeSchema);

export default ElderOutcome;
