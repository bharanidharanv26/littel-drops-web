import mongoose from 'mongoose';

const importJobSchema = new mongoose.Schema({
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['preview', 'processing', 'completed', 'failed'],
    default: 'preview',
  },
  totalRows: {
    type: Number,
    default: 0,
  },
  imported: {
    type: Number,
    default: 0,
  },
  skipped: {
    type: Number,
    default: 0,
  },
  errorCount: {
    type: Number,
    default: 0,
  },
  errorDetails: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
  fileName: {
    type: String,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

importJobSchema.index({ initiatedBy: 1 });
importJobSchema.index({ createdAt: -1 });

const ImportJob = mongoose.model('ImportJob', importJobSchema);

export default ImportJob;
