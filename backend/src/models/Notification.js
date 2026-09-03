import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipientUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  relatedEntityId: {
    type: String,
    default: null,
  },
  relatedRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    default: null,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Indexes
notificationSchema.index({ recipientUserId: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
