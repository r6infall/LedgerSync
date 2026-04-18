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
    enum: ['pending', 'accepted', 'rejected', 'mismatch', 'matched', 'missing'],
    default: 'pending'
  },
  source: {
    type: String,
    enum: ['purchase', 'gstr2a'],
    required: true
  },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

invoiceSchema.index({ invoiceNumber: 1, sellerGstin: 1, buyerGstin: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
