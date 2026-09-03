import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  address: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Indexes (name already has unique index from schema)
branchSchema.index({ isActive: 1 });

const Branch = mongoose.model('Branch', branchSchema);

export default Branch;
