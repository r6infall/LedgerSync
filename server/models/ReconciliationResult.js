const mongoose = require('mongoose');

const reconciliationResultSchema = new mongoose.Schema({
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  matchStatus: {
    type: String,
    enum: ['matched', 'mismatch', 'missing'],
    required: true
  },
  differenceAmount: { type: Number, default: 0 },
  ourRecord: { type: mongoose.Schema.Types.Mixed },
  portalRecord: { type: mongoose.Schema.Types.Mixed },
  confidenceScore: { type: Number, min: 0, max: 100, default: 0 },
  remarks: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ReconciliationResult', reconciliationResultSchema);
