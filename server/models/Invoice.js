const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, trim: true },
  sellerGstin: { type: String, required: true, trim: true, uppercase: true },
  buyerGstin: { type: String, required: true, trim: true, uppercase: true },
  invoiceDate: { type: Date, required: true },
  taxableAmount: { type: Number, required: true, default: 0 },
  gstAmount: { type: Number, required: true, default: 0 },
  totalAmount: { type: Number, required: true, default: 0 },
  hsnCode: { type: String, trim: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'mismatch', 'matched', 'missing', 'approved', 'change_requested', 'under_review', 'extra', 'paid'],
    default: 'pending'
  },
  source: {
    type: String,
    enum: ['purchase', 'gstr2a'],
    required: true
  },
  statusHistory: [{
    status: { type: String },
    actor: { type: String },
    actorRole: { type: String },
    note: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isFlagged: { type: Boolean, default: false },
  notes: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now }
});

invoiceSchema.index({ invoiceNumber: 1, sellerGstin: 1, buyerGstin: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
