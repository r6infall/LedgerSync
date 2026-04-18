const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Invoice = require('../models/Invoice');

// GET /api/compliance/score
router.get('/score', auth, async (req, res) => {
  try {
    const invoices = await Invoice.find({ uploadedBy: req.user._id, source: 'purchase' });
    
    let matchedCount = 0;
    let mismatches = 0;
    let missing = 0;
    let pendingInvoices = 0;
    let itcClaimed = 0;
    let itcAvailable = 0;
    let itcAtRisk = 0;

    const supplierRisk = {}; // GSTIN -> { gstin, mismatchCount, amountAtRisk }

    for (const inv of invoices) {
      const amt = inv.gstAmount || 0;
      itcAvailable += amt;
      
      if (inv.status === 'matched') {
        matchedCount++;
        itcClaimed += amt;
      } else if (inv.status === 'mismatch' || inv.status === 'missing') {
        if (inv.status === 'mismatch') mismatches++;
        else missing++;
        
        itcAtRisk += amt;

        if (!supplierRisk[inv.sellerGstin]) {
          supplierRisk[inv.sellerGstin] = { gstin: inv.sellerGstin, mismatchCount: 0, amountAtRisk: 0 };
        }
        supplierRisk[inv.sellerGstin].mismatchCount++;
        supplierRisk[inv.sellerGstin].amountAtRisk += amt;
      } else {
        pendingInvoices++;
      }
    }

    const totalInvoices = invoices.length;
    const score = totalInvoices > 0 ? Math.round((matchedCount / totalInvoices) * 100) : 0;
    let riskLevel = 'high';
    if (score >= 80) riskLevel = 'low';
    else if (score >= 50) riskLevel = 'medium';

    const topRiskySuppliers = Object.values(supplierRisk)
      .sort((a, b) => b.amountAtRisk - a.amountAtRisk)
      .slice(0, 3);

    const today = new Date();
    
    // GSTR-1: 11th of next month
    const gstr1Date = new Date(today.getFullYear(), today.getMonth() + 1, 11);
    const gstr1DaysLeft = Math.ceil((gstr1Date - today) / (1000 * 60 * 60 * 24));
    
    // GSTR-3B: 20th of next month
    const gstr3bDate = new Date(today.getFullYear(), today.getMonth() + 1, 20);
    const gstr3bDaysLeft = Math.ceil((gstr3bDate - today) / (1000 * 60 * 60 * 24));

    const getStatus = (days) => days > 7 ? 'safe' : days >= 3 ? 'warning' : 'urgent';

    const filingDeadlines = [
      { returnType: 'GSTR-1', dueDate: gstr1Date, daysRemaining: gstr1DaysLeft, status: getStatus(gstr1DaysLeft) },
      { returnType: 'GSTR-3B', dueDate: gstr3bDate, daysRemaining: gstr3bDaysLeft, status: getStatus(gstr3bDaysLeft) }
    ];

    const penaltyEstimate = Math.round(itcAtRisk * 0.18);

    res.json({
      score, riskLevel,
      itcClaimed, itcAvailable, itcAtRisk,
      mismatches: mismatches + missing,
      pendingInvoices,
      topRiskySuppliers,
      filingDeadlines,
      penaltyEstimate
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
