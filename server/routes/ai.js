const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Invoice = require('../models/Invoice');

const genAI = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const MODEL_NAME = 'gemini-2.0-flash';

// ─── Rate limiting & caching ─────────────────────────────────────────────────
// Per-user chat request counter: { userId -> { count, windowStart } }
const chatRateMap = new Map();
const CHAT_MAX_PER_HOUR = 10;

// Simple TTL cache for insights: { cacheKey -> { data, expiresAt } }
const insightsCache = new Map();
const INSIGHTS_CACHE_TTL_MS = 30 * 60 * 1000;  // 30 minutes
const DASHBOARD_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function checkChatRateLimit(userId) {
  const now = Date.now();
  const entry = chatRateMap.get(userId) || { count: 0, windowStart: now };
  // Reset window every hour
  if (now - entry.windowStart > 60 * 60 * 1000) {
    chatRateMap.set(userId, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= CHAT_MAX_PER_HOUR) return false;
  entry.count++;
  chatRateMap.set(userId, entry);
  return true;
}

function getFromCache(key) {
  const entry = insightsCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { insightsCache.delete(key); return null; }
  return entry.data;
}

function setCache(key, data, ttl) {
  insightsCache.set(key, { data, expiresAt: Date.now() + ttl });
}
// ─────────────────────────────────────────────────────────────────────────────

async function getUserContext(userId, businessName) {
  const invoices = await Invoice.find({ uploadedBy: userId, source: 'purchase' });

  let matchedCount = 0, mismatchCount = 0, missingCount = 0;
  let itcClaimed = 0, itcAvailable = 0, itcAtRisk = 0;
  const supplierRisk = {};

  for (const inv of invoices) {
    const amt = inv.gstAmount || 0;
    itcAvailable += amt;
    if (inv.status === 'matched') { matchedCount++; itcClaimed += amt; }
    else if (inv.status === 'mismatch' || inv.status === 'missing') {
      if (inv.status === 'mismatch') mismatchCount++; else missingCount++;
      itcAtRisk += amt;
      if (!supplierRisk[inv.sellerGstin])
        supplierRisk[inv.sellerGstin] = { gstin: inv.sellerGstin, mismatchCount: 0, amountAtRisk: 0 };
      supplierRisk[inv.sellerGstin].mismatchCount++;
      supplierRisk[inv.sellerGstin].amountAtRisk += amt;
    }
  }

  const totalInvoices = invoices.length;
  const complianceScore = totalInvoices > 0 ? Math.round((matchedCount / totalInvoices) * 100) : 0;
  const riskLevel = complianceScore >= 80 ? 'low' : complianceScore >= 50 ? 'medium' : 'high';
  const topRiskySuppliers = Object.values(supplierRisk).sort((a, b) => b.amountAtRisk - a.amountAtRisk).slice(0, 3);

  return { businessName, totalInvoices, matchedCount, mismatchCount, missingCount, itcClaimed, itcAvailable, itcAtRisk, complianceScore, riskLevel, topRiskySuppliers };
}

// Smart keyword-based fallback for chat (no API call needed)
function getSmartChatFallback(ctx, message) {
  if (!ctx) return 'Please upload invoices and run reconciliation first to get personalised GST advice.';
  const q = (message || '').toLowerCase();
  const itcRisk = ctx.itcAtRisk.toLocaleString('en-IN');
  const penalty = (ctx.itcAtRisk * 0.18).toLocaleString('en-IN');
  const top = ctx.topRiskySuppliers[0];
  const now = new Date();
  const gstr1Days = Math.ceil((new Date(now.getFullYear(), now.getMonth() + 1, 11) - now) / 86400000);
  const gstr3bDays = Math.ceil((new Date(now.getFullYear(), now.getMonth() + 1, 20) - now) / 86400000);

  if (q.includes('itc') || q.includes('credit') || q.includes('block') || q.includes('unlock')) {
    return `Rs.${itcRisk} of your ITC is currently blocked due to ${ctx.mismatchCount} mismatched and ${ctx.missingCount} missing invoices. Contact each supplier and ask them to correct their GSTR-1. Once refiled, re-run reconciliation to release the ITC.`;
  } else if (q.includes('mismatch') || q.includes('fix') || q.includes('resolve') || q.includes('why')) {
    return `You have ${ctx.mismatchCount} mismatched invoices where the amount or invoice number in GSTR-2A differs from your purchase register. Go to the Invoices page, filter by "Mismatch", and contact each supplier to correct their GSTR-1 filing.`;
  } else if (q.includes('score') || q.includes('improve') || q.includes('compliance') || q.includes('health')) {
    return `Your compliance score is ${ctx.complianceScore}/100 (${ctx.riskLevel} risk). Resolving your ${ctx.mismatchCount} mismatches and following up on ${ctx.missingCount} missing invoices would push your score to 100 and unlock Rs.${itcRisk} in blocked ITC.`;
  } else if (q.includes('supplier') || q.includes('risky') || q.includes('gstin')) {
    return top
      ? `Your riskiest supplier is GSTIN ${top.gstin} with ${top.mismatchCount} mismatch(es) putting Rs.${top.amountAtRisk.toLocaleString('en-IN')} of ITC at risk. Contact them directly to reconcile the discrepancies before your next GST filing.`
      : 'No risky suppliers detected right now. All suppliers have clean filing records.';
  } else if (q.includes('penalty') || q.includes('fine')) {
    return `If your ${ctx.mismatchCount} mismatches remain unresolved, you risk a potential penalty of approximately Rs.${penalty} (18% of blocked ITC). Resolve them before filing GSTR-3B on the 20th.`;
  } else if (q.includes('gstr') || q.includes('file') || q.includes('deadline')) {
    return `GSTR-1 is due in ${gstr1Days} days (11th) and GSTR-3B is due in ${gstr3bDays} days (20th). You have ${ctx.mismatchCount} unresolved mismatches — resolve them before filing to maximise your ITC claim.`;
  } else if (q.includes('missing')) {
    return `You have ${ctx.missingCount} missing invoices where suppliers have not yet filed their GSTR-1. Send them a reminder or contact them directly. Each missing invoice puts ITC at risk.`;
  }
  return `Your GST compliance score is ${ctx.complianceScore}/100 with ${ctx.riskLevel} risk. You have ${ctx.mismatchCount} mismatches and ${ctx.missingCount} missing invoices with Rs.${itcRisk} ITC at risk. Try asking about mismatches, ITC, penalties, or deadlines.`;
}

// Smart keyword-based fallback for insights page
function getSmartInsightsFallback(ctx, question) {
  if (!ctx) return {
    healthAssessment: 'Upload invoices and run reconciliation to get your compliance health assessment.',
    recommendations: ['Upload your purchase register CSV from the Upload page.', 'Fetch GSTR-2A data.', 'Run reconciliation to see matched, mismatched, and missing invoices.'],
    riskSteps: []
  };

  const q = (question || '').toLowerCase();
  const itcRisk = ctx.itcAtRisk.toLocaleString('en-IN');
  const penalty = (ctx.itcAtRisk * 0.18).toLocaleString('en-IN');
  const top = ctx.topRiskySuppliers[0];

  if (q.includes('itc') || q.includes('credit') || q.includes('block') || q.includes('maximiz') || q.includes('maximis')) {
    return {
      healthAssessment: `You currently have Rs.${itcRisk} of ITC blocked across ${ctx.mismatchCount} mismatched and ${ctx.missingCount} missing invoices. Out of Rs.${ctx.itcAvailable.toLocaleString('en-IN')} total available ITC, only Rs.${ctx.itcClaimed.toLocaleString('en-IN')} has been successfully claimed. Resolving mismatches is the fastest way to maximise your ITC.`,
      recommendations: [`Resolve ${ctx.mismatchCount} mismatched invoices to recover Rs.${itcRisk} in blocked ITC.`, `Follow up with ${ctx.missingCount} suppliers who have not filed their GSTR-1 yet.`, 'Verify GST amounts on matched invoices before filing GSTR-3B to avoid ITC reversal.'],
      riskSteps: [`Rs.${itcRisk} ITC at risk — do not file GSTR-3B without resolving mismatches.`, 'Each missing invoice represents potential permanent ITC loss if supplier never files.', `Penalty exposure: Rs.${penalty} (18% of blocked ITC) if all mismatches are denied.`]
    };
  } else if (q.includes('mismatch') || q.includes('why') || q.includes('cause') || q.includes('invoices')) {
    return {
      healthAssessment: `You have ${ctx.mismatchCount} mismatched invoices — these are cases where your purchase register data does not match what the supplier filed in GSTR-1. Mismatches happen due to typos in invoice numbers, incorrect GST amounts, or suppliers using the wrong GSTIN. Each unresolved mismatch blocks the ITC for that invoice.`,
      recommendations: ['Go to the Invoices page, filter by "Mismatch", and note the discrepancies for each supplier.', "Contact each supplier's accounts team with the exact invoice number and amount difference.", 'Ask them to file a GSTR-1 amendment — once corrected, re-run reconciliation.'],
      riskSteps: [`${ctx.mismatchCount} unresolved mismatches are blocking Rs.${itcRisk} in ITC claims.`, 'Ignoring mismatches can result in ITC reversal notices from the GST department.', 'Suppliers who fail to correct filings within 2 years lose the ability to amend.']
    };
  } else if (q.includes('supplier') || q.includes('risky')) {
    return {
      healthAssessment: top
        ? `Your riskiest supplier is GSTIN ${top.gstin}, responsible for ${top.mismatchCount} mismatch(es) putting Rs.${top.amountAtRisk.toLocaleString('en-IN')} of ITC at risk. Supplier-side filing errors are the most common cause of GST reconciliation failures. Prioritising this supplier will have the largest impact on your compliance score.`
        : `No risky suppliers detected — all suppliers have clean filing records. Your current ${ctx.mismatchCount} mismatches may be due to data entry errors in your own purchase register. Review the Invoices page to confirm.`,
      recommendations: [top ? `Immediately contact GSTIN ${top.gstin} to resolve ${top.mismatchCount} mismatch(es).` : 'Review your purchase register entries for data entry errors.', 'Set payment terms requiring suppliers to file GSTR-1 before receiving payment.', 'Run reconciliation monthly to catch supplier filing issues early.'],
      riskSteps: [top ? `GSTIN ${top.gstin} alone is putting Rs.${top.amountAtRisk.toLocaleString('en-IN')} of ITC at risk.` : 'All suppliers have clean records — check your own data entries.', 'Repeatedly non-compliant suppliers should be replaced with compliant ones.', 'Use the Payments page to pay suppliers and instantly unlock their blocked ITC.']
    };
  } else if (q.includes('penalty') || q.includes('fine') || q.includes('risk')) {
    return {
      healthAssessment: `With ${ctx.mismatchCount} unresolved mismatches and a compliance score of ${ctx.complianceScore}/100, you face a potential penalty exposure of Rs.${penalty}. A score below 80 (currently ${ctx.complianceScore}) can attract GST department scrutiny and audit notices. Resolving mismatches before the filing deadline is critical.`,
      recommendations: ['File GSTR-3B by the 20th to avoid a late filing penalty of Rs.50/day.', `Resolve ${ctx.mismatchCount} mismatches before filing to avoid ITC reversal notices.`, 'Keep your compliance score above 80 to stay out of the high-risk taxpayer list.'],
      riskSteps: [`Current penalty exposure: Rs.${penalty} (18% of Rs.${itcRisk} blocked ITC).`, `ITC reversal of Rs.${itcRisk} would directly increase your tax payable.`, `Compliance score of ${ctx.complianceScore}/100 (${ctx.riskLevel} risk) may attract departmental notices.`]
    };
  } else if (q.includes('missing')) {
    return {
      healthAssessment: `You have ${ctx.missingCount} missing invoices — these are purchases where the supplier has not yet filed their GSTR-1, so the invoice does not appear in your GSTR-2A at all. Missing invoices cannot be reconciled until the supplier files. This is putting a portion of your Rs.${itcRisk} ITC at risk.`,
      recommendations: [`Contact all ${ctx.missingCount} suppliers with missing invoices and ask them to file GSTR-1 urgently.`, 'Use the Invoices page Remind feature to queue a reminder for each supplier.', 'For habitual non-filers, consider withholding future payments until they file.'],
      riskSteps: ['ITC for missing invoices is blocked until the supplier files their return.', 'If suppliers do not file within 3 years, you permanently lose the ITC for those invoices.', `Estimated ITC at risk from missing invoices is included in your total Rs.${itcRisk} blocked ITC.`]
    };
  }

  // General / score / improve
  return {
    healthAssessment: `Your GST compliance score is ${ctx.complianceScore}/100 placing you in the ${ctx.riskLevel}-risk category. You have ${ctx.matchedCount} clean matched invoices, ${ctx.mismatchCount} mismatches, and ${ctx.missingCount} missing — with Rs.${itcRisk} in ITC currently blocked. ${ctx.complianceScore < 80 ? 'Resolving your outstanding issues is essential before the next filing deadline.' : 'Your compliance is healthy — keep reviewing reconciliation monthly.'}`,
    recommendations: [`Resolve your ${ctx.mismatchCount} mismatched invoices to recover blocked ITC immediately.`, `Follow up with ${ctx.missingCount} suppliers to ensure they file their pending GSTR-1.`, 'File GSTR-3B by the 20th and GSTR-1 by the 11th every month to stay compliant.'],
    riskSteps: [`Rs.${itcRisk} ITC is currently at risk from mismatches and missing invoices.`, `Compliance score of ${ctx.complianceScore}/100 puts you in the ${ctx.riskLevel}-risk category.`, `Potential penalty if unresolved: Rs.${penalty}.`]
  };
}


// POST /api/ai/chat
router.post('/chat', auth, async (req, res) => {
  const { message } = req.body;
  const ctx = await getUserContext(req.user._id, req.user.businessName).catch(() => null);

  if (!genAI) return res.json({ response: getSmartChatFallback(ctx, message) });

  // Rate limit: max 10 chat calls per user per hour
  if (!checkChatRateLimit(String(req.user._id))) {
    console.log(`[AI] Rate limit reached for user ${req.user._id} — using smart fallback`);
    return res.json({ response: getSmartChatFallback(ctx, message) });
  }

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `You are a GST compliance advisor for an Indian small business owner. Answer in simple plain language, be specific, mention rupee amounts, keep under 4 sentences.

Business data: Total Invoices=${ctx?.totalInvoices || 0}, Matched=${ctx?.matchedCount || 0}, Mismatches=${ctx?.mismatchCount || 0}, Missing=${ctx?.missingCount || 0}, ITC Claimed=Rs.${ctx?.itcClaimed || 0}, ITC At Risk=Rs.${ctx?.itcAtRisk || 0}, Score=${ctx?.complianceScore || 0}/100, Risk=${ctx?.riskLevel || 'unknown'}

User question: ${message}`;

    const result = await model.generateContent(prompt);
    res.json({ response: result.response.text() });
  } catch (err) {
    console.error('Gemini Chat Error:', err.message);
    res.json({ response: getSmartChatFallback(ctx, message) });
  }
});

// POST /api/ai/insights — AIInsights page
router.post('/insights', auth, async (req, res) => {
  const { context: userQuestion = 'general health check' } = req.body;
  const ctx = await getUserContext(req.user._id, req.user.businessName).catch(() => null);

  if (!genAI) return res.json({ insights: getSmartInsightsFallback(ctx, userQuestion) });

  // Cache key: userId + normalized question (first 60 chars)
  const cacheKey = `insights:${req.user._id}:${userQuestion.slice(0, 60).toLowerCase().replace(/\s+/g, '_')}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
    console.log(`[AI] Cache hit for insights: ${cacheKey}`);
    return res.json({ insights: cached });
  }

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `You are a GST compliance advisor for an Indian small business.

Business data: Total Invoices=${ctx?.totalInvoices || 0}, Matched=${ctx?.matchedCount || 0}, Mismatches=${ctx?.mismatchCount || 0}, Missing=${ctx?.missingCount || 0}, ITC At Risk=Rs.${ctx?.itcAtRisk || 0}, Score=${ctx?.complianceScore || 0}/100, Risk=${ctx?.riskLevel || 'unknown'}

User asked: "${userQuestion}"

Return ONLY valid JSON (no markdown):
{"healthAssessment":"2-3 sentence assessment","recommendations":["action 1","action 2","action 3"],"riskSteps":["step 1","step 2","step 3"]}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(text);
    setCache(cacheKey, parsed, INSIGHTS_CACHE_TTL_MS);
    res.json({ insights: parsed });
  } catch (err) {
    console.error('Gemini Insights Error:', err.message);
    res.json({ insights: getSmartInsightsFallback(ctx, userQuestion) });
  }
});

// GET /api/ai/insights — Dashboard 3-insight array
router.get('/insights', auth, async (req, res) => {
  const ctx = await getUserContext(req.user._id, req.user.businessName).catch(() => null);

  const fallbackInsights = ctx ? [
    `Your compliance score is ${ctx.complianceScore}/100 — ${ctx.riskLevel} risk.`,
    `${ctx.mismatchCount} mismatched and ${ctx.missingCount} missing invoices need resolution.`,
    `Rs.${ctx.itcAtRisk.toLocaleString('en-IN')} ITC is currently at risk.`
  ] : ['Upload invoices and run reconciliation to get started.', 'Use the Upload page to import your purchase register.', 'Fetch GSTR-2A to enable reconciliation.'];

  if (!genAI) return res.json({ insights: fallbackInsights });

  // Cache per user for 1 hour — this endpoint gets called on every Dashboard load
  const cacheKey = `dashboard:${req.user._id}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
    console.log(`[AI] Cache hit for dashboard insights`);
    return res.json({ insights: cached });
  }

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `GST data: Score=${ctx.complianceScore}/100, Mismatches=${ctx.mismatchCount}, Missing=${ctx.missingCount}, ITC at risk=Rs.${ctx.itcAtRisk}. Give 3 one-sentence insights as a JSON array only, no markdown.`;
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length >= 3) {
      setCache(cacheKey, parsed.slice(0, 3), DASHBOARD_CACHE_TTL_MS);
      return res.json({ insights: parsed.slice(0, 3) });
    }
    throw new Error('bad format');
  } catch {
    res.json({ insights: fallbackInsights });
  }
});

// GET /api/ai/analyze-invoice/:id
router.get('/analyze-invoice/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, uploadedBy: req.user._id });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    
    const ReconciliationResult = require('../models/ReconciliationResult');
    const reco = await ReconciliationResult.findOne({ invoiceId: invoice._id });
    
    if (!genAI) {
      return res.json({ analysis: `There is a detected discrepancy or anomaly based on ${invoice.source} parameters. Please review mathematically.` });
    }

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const discrepancyMetadata = reco ? `Portal record says Total = ${reco.portalRecord?.totalAmount || 0}, Taxable=${reco.portalRecord?.taxableAmount || 0}. Your record says Total=${invoice.totalAmount}, Taxable=${invoice.taxableAmount}. Reason: ${reco.matchStatus}. Flags: ${reco.flag || 'none'}` : 'No portal record attached dynamically.';
    
    const prompt = `You are LedgerSync AI. Analyze this individual GST Invoice ${invoice.invoiceNumber}.
The invoice status is '${invoice.status}'. 
Data: ${discrepancyMetadata}.
Write exactly 2 to 3 very short clear sentences natively explaining the specific discrepancy directly to the business owner, and what action they should take next in the portal (either rejecting, requesting change, or awaiting seller).
Keep it clean, concise, polite, specific to the amounts, and skip formatting elements optimally correctly explicitly intelligently successfully reliably accurately efficiently explicitly. Avoid any markdown.`;

    const result = await model.generateContent(prompt);
    res.json({ analysis: result.response.text().trim() });
  } catch (err) {
    res.json({ analysis: "Analysis currently unavailable." });
  }
});

module.exports = router;
