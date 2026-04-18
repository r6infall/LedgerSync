const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Invoice = require('../models/Invoice');
const ReconciliationResult = require('../models/ReconciliationResult');
const Notification = require('../models/Notification');
const reconciliationService = require('../services/reconciliationService');

// POST /api/reconciliation/run — trigger reconciliation for user
router.post('/run', auth, async (req, res) => {
  try {
    const results = await reconciliationService.runReconciliation(req.user._id);

    await Notification.create({
      userId: req.user._id,
      message: `Reconciliation complete: ${results.matched} matched, ${results.mismatches} mismatches, ${results.missing} missing`,
      type: results.mismatches > 0 ? 'warning' : 'success'
    });

    res.json({ message: 'Reconciliation complete', summary: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reconciliation/results — get all reconciliation results
router.get('/results', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    // Get user's invoice IDs
    const userInvoices = await Invoice.find({ uploadedBy: req.user._id }).select('_id');
    const invoiceIds = userInvoices.map(i => i._id);

    const query = { invoiceId: { $in: invoiceIds } };
    if (status) query.matchStatus = status;

    const total = await ReconciliationResult.countDocuments(query);
    const results = await ReconciliationResult.find(query)
      .populate('invoiceId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ results, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reconciliation/summary — summary stats
router.get('/summary', auth, async (req, res) => {
  try {
    const userInvoices = await Invoice.find({ uploadedBy: req.user._id }).select('_id status');
    const invoiceIds = userInvoices.map(i => i._id);

    const statusCounts = userInvoices.reduce((acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1;
      return acc;
    }, {});

    const recoResults = await ReconciliationResult.find({ invoiceId: { $in: invoiceIds } });
    const matchCounts = recoResults.reduce((acc, r) => {
      acc[r.matchStatus] = (acc[r.matchStatus] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalInvoices: userInvoices.length,
      statusCounts,
      matchCounts,
      lastReconciled: recoResults.length > 0 ? recoResults[0].createdAt : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
