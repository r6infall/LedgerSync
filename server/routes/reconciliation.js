const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Invoice = require('../models/Invoice');
const ReconciliationResult = require('../models/ReconciliationResult');
const Notification = require('../models/Notification');
const reconciliationEngine = require('../services/reconciliationEngine');

// POST /api/reconciliation/run — trigger reconciliation for user
router.post('/run', auth, async (req, res) => {
  try {
    console.log('[Reconciliation] User:', req.user.email, 'GSTIN:', req.user.gstin, 'ID:', req.user._id);
    const results = await reconciliationEngine.runEngine(req.user.gstin, req.user._id);
    console.log('[Reconciliation] Results:', JSON.stringify(results));
    res.json({ message: 'Reconciliation complete', summary: results, ...results });
  } catch (err) {
    console.error('[Reconciliation Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reconcile — Exact requirement route
router.post('/', auth, async (req, res) => {
  try {
    const results = await reconciliationService.runReconciliation(req.user._id);
    res.json({
      matched: results.matched,
      mismatches: results.mismatches,
      missing: results.missing,
      totalProcessed: results.totalProcessed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reconciliation/results — get all reconciliation results
router.get('/results', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const userInvoices = await Invoice.find({ uploadedBy: req.user._id }).select('_id');
    const invoiceIds = userInvoices.map(i => i._id);

    const query = { invoiceId: { $in: invoiceIds } };
    if (status) query.matchStatus = status;

    let resultsQuery = ReconciliationResult.find(query).populate('invoiceId').sort({ createdAt: -1 });
    
    if (limit !== 'all') {
      resultsQuery = resultsQuery.skip((Number(page) - 1) * Number(limit)).limit(Number(limit));
    }

    const results = await resultsQuery;
    const total = await ReconciliationResult.countDocuments(query);

    if (limit === 'all') {
      return res.json({ results, total });
    }
    res.json({ results, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
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
