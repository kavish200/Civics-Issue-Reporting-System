const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' },
  type: {
    type: String,
    enum: ['status_update', 'assignment', 'duplicate', 'rating_request', 'system'],
    required: true
  },
  message: { type: String, required: true },
  read: { type: Boolean, default: false }
}, { timestamps: true });

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);