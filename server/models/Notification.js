const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['info', 'warning', 'danger', 'success', 'approval', 'rejection', 'change_request', 'resubmission', 'missing_invoice_request', 'ai_reminder', 'mismatch_detected', 'invoice_approved', 'invoice_rejected', 'change_requested', 'payment_confirmed', 'itc_unlocked', 'missing_invoice_fulfilled', 'deadline_alert', 'anomaly_detected', 'overdue_payment'],
    default: 'info'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  title: { type: String, trim: true },
  message: { type: String, required: true, trim: true },
  relatedInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  isRead: { type: Boolean, default: false },
  expired: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
});

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
