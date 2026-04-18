const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const geminiService = require('../services/geminiService');
const Invoice = require('../models/Invoice');
const ReconciliationResult = require('../models/ReconciliationResult');
const ComplianceScore = require('../models/ComplianceScore');

// POST /api/ai/insights — get AI-powered insights
router.post('/insights', auth, async (req, res) => {
  try {
    const { context } = req.body;

    // Gather data for context
    const [recentInvoices, recentResults, latestScore] = await Promise.all([
      Invoice.find({ uploadedBy: req.user._id }).sort({ createdAt: -1 }).limit(10),
      ReconciliationResult.find().sort({ createdAt: -1 }).limit(5),
      ComplianceScore.findOne({ userId: req.user._id }).sort({ calculatedAt: -1 })
    ]);

    const dataContext = {
      businessName: req.user.businessName,
      gstin: req.user.gstin,
      totalInvoices: recentInvoices.length,
      mismatches: recentResults.filter(r => r.matchStatus === 'mismatch').length,
      missing: recentResults.filter(r => r.matchStatus === 'missing').length,
      complianceScore: latestScore?.score || 0,
      riskLevel: latestScore?.riskLevel || 'unknown',
      itcAtRisk: latestScore?.itcAtRisk || 0,
      userQuestion: context || 'Provide a general GST compliance health check.'
    };

    const insights = await geminiService.getInsights(dataContext);
    res.json({ insights });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/explain-mismatch — explain a specific mismatch
router.post('/explain-mismatch', auth, async (req, res) => {
  try {
    const { reconciliationId } = req.body;
    const result = await ReconciliationResult.findById(reconciliationId).populate('invoiceId');
    if (!result) return res.status(404).json({ error: 'Result not found' });

    const explanation = await geminiService.explainMismatch(result);
    res.json({ explanation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
