const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');

router.get('/kpis', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const purchaseInvoices = await Invoice.find({ uploadedBy: userId, source: 'purchase' });
    const totalInvoices = purchaseInvoices.length;

    let matchedCount = 0;
    let mismatchCount = 0;
    let missingCount = 0;
    let itcClaimed = 0;
    let itcAvailable = 0;
    let itcAtRisk = 0;

    for (const inv of purchaseInvoices) {
      itcAvailable += inv.gstAmount || 0;
      if (inv.status === 'matched') {
        matchedCount++;
        itcClaimed += inv.gstAmount || 0;
      } else if (inv.status === 'mismatch') {
        mismatchCount++;
        itcAtRisk += inv.gstAmount || 0;
      } else if (inv.status === 'missing') {
        missingCount++;
        itcAtRisk += inv.gstAmount || 0;
      }
    }

    const complianceScore = totalInvoices > 0 ? Math.round((matchedCount / totalInvoices) * 100) : 0;
    let riskLevel = 'high';
    if (complianceScore >= 80) riskLevel = 'low';
    else if (complianceScore >= 50) riskLevel = 'medium';

    const today = new Date();
    
    // GSTR-1: 11th of next month
    let gstr1Date = new Date(today.getFullYear(), today.getMonth() + 1, 11);
    let gstr1DaysLeft = Math.ceil((gstr1Date - today) / (1000 * 60 * 60 * 24));
    
    // GSTR-3B: 20th of next month
    let gstr3bDate = new Date(today.getFullYear(), today.getMonth() + 1, 20);
    let gstr3bDaysLeft = Math.ceil((gstr3bDate - today) / (1000 * 60 * 60 * 24));

    const recentAlerts = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(3);
    const recentInvoices = await Invoice.find({ uploadedBy: userId, source: 'purchase' }).sort({ invoiceDate: -1 }).limit(20);

    res.json({
      totalInvoices,
      matchedCount,
      mismatchCount,
      missingCount,
      itcClaimed,
      itcAvailable,
      itcAtRisk,
      complianceScore,
      riskLevel,
      gstr1DaysLeft,
      gstr3bDaysLeft,
      recentAlerts,
      recentInvoices
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
