const Invoice = require('../models/Invoice');
const ReconciliationResult = require('../models/ReconciliationResult');
const ComplianceScore = require('../models/ComplianceScore');

async function calculateScore(userId) {
  const invoices = await Invoice.find({ uploadedBy: userId });

  const total = invoices.length;
  const matched = invoices.filter(i => i.status === 'matched').length;
  const mismatches = invoices.filter(i => i.status === 'mismatch').length;
  const missing = invoices.filter(i => i.status === 'missing').length;
  const pending = invoices.filter(i => i.status === 'pending').length;

  const userInvoiceIds = invoices.map(i => i._id);
  const recoResults = await ReconciliationResult.find({ invoiceId: { $in: userInvoiceIds } });

  // ITC calculations (18% of taxable amount)
  const itcAvailable = invoices
    .filter(i => i.status === 'matched')
    .reduce((sum, i) => sum + i.gstAmount, 0);

  const itcAtRisk = invoices
    .filter(i => ['mismatch', 'missing'].includes(i.status))
    .reduce((sum, i) => sum + i.gstAmount, 0);

  const itcClaimed = itcAvailable * 0.9; // Assume 90% of available is claimed

  // Score formula: start at 100, deduct for problems
  let score = 100;
  if (total > 0) {
    const mismatchRate = mismatches / total;
    const missingRate = missing / total;
    const pendingRate = pending / total;

    score -= Math.round(mismatchRate * 40); // Mismatches hurt most
    score -= Math.round(missingRate * 35);  // Missing hurt second
    score -= Math.round(pendingRate * 15);  // Pending invoices hurt least
    score = Math.max(0, Math.min(100, score));
  }

  const riskLevel = score >= 75 ? 'low' : score >= 50 ? 'medium' : 'high';

  const scoreDoc = await ComplianceScore.create({
    userId,
    score,
    riskLevel,
    itcClaimed: Math.round(itcClaimed * 100) / 100,
    itcAvailable: Math.round(itcAvailable * 100) / 100,
    itcAtRisk: Math.round(itcAtRisk * 100) / 100,
    mismatches,
    pendingInvoices: pending,
    calculatedAt: new Date()
  });

  return scoreDoc;
}

module.exports = { calculateScore };
