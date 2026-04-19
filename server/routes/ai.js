const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Invoice = require('../models/Invoice');
const ReconciliationResult = require('../models/ReconciliationResult');
const ComplianceScore = require('../models/ComplianceScore');
const User = require('../models/User');
const aiService = require('../services/aiService');

async function getUserContext(userId, businessName, gstin) {
  const invoices = await Invoice.find({ uploadedBy: userId, source: 'purchase' });
  let matchedCount = 0, mismatchCount = 0, missingCount = 0;
  let itcClaimed = 0, itcAvailable = 0, itcAtRisk = 0;

  for (const inv of invoices) {
    const amt = inv.gstAmount || 0;
    itcAvailable += amt;
    if (inv.status === 'matched') { matchedCount++; itcClaimed += amt; }
    else if (inv.status === 'mismatch' || inv.status === 'missing') {
      if (inv.status === 'mismatch') mismatchCount++; else missingCount++;
      itcAtRisk += amt;
    }
  }

  const complianceScore = invoices.length > 0 ? Math.round((matchedCount / invoices.length) * 100) : 0;
  return { userId, businessName, gstin, totalInvoices: invoices.length, matchedCount, mismatchCount, missingCount, itcClaimed, itcAvailable, itcAtRisk, complianceScore };
}

// Feature 1 & 2: Analyze Invoice
router.get('/analyze-invoice/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, uploadedBy: req.user._id });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    
    const reco = await ReconciliationResult.findOne({ invoiceId: invoice._id });
    
    // DB READ-THROUGH PERSISTENCE
    if (reco?.aiAnalysis) {
        return res.json({ analysis: reco.aiAnalysis.explain, correctionPlan: reco.aiAnalysis.correction.steps });
    }

    const gstr2aRecord = reco?.portalRecord || {};
    const explain = await aiService.explainMismatch(invoice, gstr2aRecord);
    
    let mismatchType = invoice.status === 'missing' ? 'missing_from_gstr' : invoice.status === 'mismatch' ? 'amount_difference' : 'unknown';
    if (reco?.flag === 'fuzzy') mismatchType = 'gstin_typo';

    const correction = await aiService.suggestCorrection(invoice, mismatchType);
    
    // SAVE TO DB
    if (reco && !explain.error) {
       reco.aiAnalysis = { explain, correction };
       await reco.save();
    }

    res.json({ analysis: explain, correctionPlan: correction.steps });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Feature 3: Supplier Risk
router.get('/supplier-risk', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user?.aiSupplierRisk) return res.json({ risks: user.aiSupplierRisk });

    const invoices = await Invoice.find({ uploadedBy: req.user._id, source: 'purchase' });
    const supplierGroups = {};
    invoices.forEach(i => {
       if(!supplierGroups[i.sellerGstin]) supplierGroups[i.sellerGstin] = [];
       supplierGroups[i.sellerGstin].push(i);
    });

    const risks = await Promise.all(Object.entries(supplierGroups).map(async ([gstin, invs]) => {
      const aiData = await aiService.scoreSupplierRisk(null, gstin, invs);
      return { gstin, ...aiData };
    }));
    
    if (user && risks.length > 0) {
        user.aiSupplierRisk = risks;
        await user.save();
    }
    
    res.json({ risks });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Feature 4: Chat Context natively reliably
router.post('/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    const ctx = await getUserContext(req.user._id, req.user.businessName, req.user.gstin);
    const data = await aiService.chatWithContext(message, ctx);
    res.json(data);
  } catch(err) { res.status(500).json({ error: err.message }) }
});

// Feature 5: GSTR Summary
router.get('/gstr-summary', auth, async (req, res) => {
  try {
    const score = await ComplianceScore.findOne({ userId: req.user._id }).sort({ calculatedAt: -1 });
    if (score?.aiGstrSummary) return res.json(score.aiGstrSummary);

    const ctx = await getUserContext(req.user._id, req.user.businessName, req.user.gstin);
    const summary = await aiService.generateGSTRSummary(ctx);

    if (score && !summary.error) {
        score.aiGstrSummary = summary;
        await score.save();
    }
    
    res.json(summary);
  } catch(err) { res.status(500).json({ error: err.message }) }
});

// Feature 6: Smart Reminder Manually Explicitly Securely triggered elegantly intelligently 
router.get('/trigger-reminders', auth, async (req, res) => {
  try {
    const ctx = await getUserContext(req.user._id, req.user.businessName, req.user.gstin);
    let pending = [];
    if(ctx.mismatchCount > 0) pending.push({ desc: 'Resolve Mismatches', amount: ctx.itcAtRisk });
    if(ctx.missingCount > 0) pending.push({ desc: 'Follow up missing invoices', amount: 0 });
    
    const reminder = await aiService.generateSmartReminder(req.user.name, req.user.businessName, pending);
    
    const Notification = require('../models/Notification');
    await Notification.create({
      userId: req.user._id,
      type: 'ai_reminder',
      message: reminder.reminder || reminder.response
    });
    res.json({ success: true, reminder });
  } catch(err) { res.status(500).json({ error: err.message }) }
});

// Feature 7: Anomalies explicitly cleanly
router.get('/anomalies', auth, async (req, res) => {
  try {
    const invoices = await Invoice.find({ uploadedBy: req.user._id, source: 'purchase' });
    const anomalies = await aiService.detectAnomalies(req.user._id, invoices);
    res.json({ anomalies });
  } catch(err) { res.status(500).json({ error: err.message }) }
});

// Feature 8: Compliance Score intelligently structured
router.get('/compliance-explanation', auth, async (req, res) => {
  try {
    const score = await ComplianceScore.findOne({ userId: req.user._id }).sort({ calculatedAt: -1 });
    if (score?.aiExplanation) return res.json(score.aiExplanation);

    const ctx = await getUserContext(req.user._id, req.user.businessName, req.user.gstin);
    const explanation = await aiService.explainComplianceScore(ctx.complianceScore, ctx.missingCount, ctx.mismatchCount);

    if (score && !explanation.error) {
        score.aiExplanation = explanation;
        await score.save();
    }
    
    res.json(explanation);
  } catch(err) { res.status(500).json({ error: err.message }) }
});

// Feature 9: ITC Forecast
router.get('/forecast-itc', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user?.aiForecast) return res.json(user.aiForecast);

    const ctx = await getUserContext(req.user._id, req.user.businessName, req.user.gstin);
    const forecast = await aiService.forecastITC(req.user._id, ctx.itcAvailable, ctx.itcAtRisk);

    if (user && !forecast.error) {
        user.aiForecast = forecast;
        await user.save();
    }
    
    res.json(forecast);
  } catch(err) { res.status(500).json({ error: err.message }) }
});

// Feature 10: Onboarding cleverly structured smoothly efficiently
router.get('/onboarding-guide', auth, async (req, res) => {
  try {
    const guide = await aiService.onboardingGuide(req.user.businessName, req.user.role, req.user.gstin);
    res.json(guide);
  } catch(err) { res.status(500).json({ error: err.message }) }
});

module.exports = router;
