const mongoose = require('mongoose');

const missingInvoiceRequestSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  supplierGstin: { type: String, required: true, trim: true },
  gstr2aInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  gstr2aInvoiceData: {
    invoiceNumber: { type: String },
    invoiceDate: { type: Date },
    totalAmount: { type: Number },
    gstAmount: { type: Number },
    sellerGstin: { type: String }
  },
  status: {
    type: String,
    enum: ['not_requested', 'requested', 'fulfilled', 'overdue'],
    default: 'requested'
  },
  note: { type: String, trim: true },
  sellerResponse: { type: String, trim: true },
  requestedAt: { type: Date, default: Date.now },
  fulfilledAt: { type: Date }
});

missingInvoiceRequestSchema.index({ buyerId: 1, gstr2aInvoiceId: 1 });
missingInvoiceRequestSchema.index({ supplierGstin: 1 });

module.exports = mongoose.model('MissingInvoiceRequest', missingInvoiceRequestSchema);
