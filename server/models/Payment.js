const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  transactionId: { type: String, required: true, unique: true },
  mockSignature: { type: String },
  status: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed'],
    default: 'pending'
  },
  paymentMethod: { type: String, default: 'mock_upi' },
  itcUnlocked: { type: Boolean, default: false },
  itcAmount: { type: Number, default: 0 },
  paidAt: { type: Date },
  timeline: [{
    event: { type: String },
    actor: { type: String },
    timestamp: { type: Date, default: Date.now },
    note: { type: String }
  }],
  createdAt: { type: Date, default: Date.now }
});

paymentSchema.index({ invoiceId: 1, buyerId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
