const mongoose = require('mongoose');

const complianceScoreSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, min: 0, max: 100, default: 0 },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  itcClaimed: { type: Number, default: 0 },
  itcAvailable: { type: Number, default: 0 },
  itcAtRisk: { type: Number, default: 0 },
  mismatches: { type: Number, default: 0 },
  pendingInvoices: { type: Number, default: 0 },
  calculatedAt: { type: Date, default: Date.now }
});

complianceScoreSchema.index({ userId: 1, calculatedAt: -1 });

module.exports = mongoose.model('ComplianceScore', complianceScoreSchema);
