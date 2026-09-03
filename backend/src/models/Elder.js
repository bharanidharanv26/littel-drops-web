import mongoose from 'mongoose';

const elderSchema = new mongoose.Schema({
  serialNumber: {
    type: Number,
    default: null,
  },
  admissionNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  age: {
    type: Number,
    required: true,
    min: 1,
    max: 150,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true,
  },
  dateOfBirth: {
    type: String,
    default: null,
  },
  admissionDate: {
    type: String,
    required: true,
  },
  admissionTime: {
    type: String,
    default: null,
  },
  admissionBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  currentBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  currentStatus: {
    type: String,
    enum: ['pending_admission', 'active', 'transferred', 'deceased', 'returned_home', 'other_outcome'],
    default: 'pending_admission',
  },
  policeMemoNumber: {
    type: String,
    default: null,
  },
  referredBy: {
    type: String,
    default: null,
  },
  address: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  emergencyContactName: {
    type: String,
    default: '',
  },
  emergencyContactPhone: {
    type: String,
    default: '',
  },
  medicalNotes: {
    type: String,
    default: null,
  },
  photoUrl: {
    type: String,
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  outcomeReason: {
    type: String,
    default: null,
  },
}, { timestamps: true });

// Indexes (admissionNumber already has unique index from schema)
elderSchema.index({ serialNumber: 1 });
elderSchema.index({ name: 1 });
elderSchema.index({ currentBranch: 1 });
elderSchema.index({ currentStatus: 1 });
elderSchema.index({ admissionDate: 1 });
elderSchema.index({ policeMemoNumber: 1 });

const Elder = mongoose.model('Elder', elderSchema);

export default Elder;
