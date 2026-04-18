const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Invoice = require('../models/Invoice');

const genAI = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here' 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) 
  : null;

async function getUserContext(userId, businessName) {
  const invoices = await Invoice.find({ uploadedBy: userId, source: 'purchase' });
  
  let matchedCount = 0;
  let mismatchCount = 0;
  let missingCount = 0;
  let itcClaimed = 0;
  let itcAvailable = 0;
  let itcAtRisk = 0;
  const supplierRisk = {};

  for (const inv of invoices) {
    const amt = inv.gstAmount || 0;
    itcAvailable += amt;
    if (inv.status === 'matched') {
      matchedCount++;
      itcClaimed += amt;
    } else if (inv.status === 'mismatch' || inv.status === 'missing') {
      if (inv.status === 'mismatch') mismatchCount++;
      else missingCount++;
      itcAtRisk += amt;

      if (!supplierRisk[inv.sellerGstin]) {
        supplierRisk[inv.sellerGstin] = { gstin: inv.sellerGstin, mismatchCount: 0, amountAtRisk: 0 };
      }
      supplierRisk[inv.sellerGstin].mismatchCount++;
      supplierRisk[inv.sellerGstin].amountAtRisk += amt;
    }
  }

  const totalInvoices = invoices.length;
  const complianceScore = totalInvoices > 0 ? Math.round((matchedCount / totalInvoices) * 100) : 0;
  let riskLevel = 'high';
  if (complianceScore >= 80) riskLevel = 'low';
  else if (complianceScore >= 50) riskLevel = 'medium';

  const topRiskySuppliers = Object.values(supplierRisk)
    .sort((a, b) => b.amountAtRisk - a.amountAtRisk)
    .slice(0, 3);

  return {
    businessName,
    totalInvoices,
    matchedCount,
    mismatchCount,
    missingCount,
    itcClaimed,
    itcAvailable,
    itcAtRisk,
    complianceScore,
    riskLevel,
    topRiskySuppliers
  };
}

router.post('/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!genAI) return res.json({ response: "AI Advisor is not configured with an API key." });

    const context = await getUserContext(req.user._id, req.user.businessName);
    const contextText = JSON.stringify(context, null, 2);

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash-latest',
      systemInstruction: `You are a GST compliance advisor for an Indian small business owner. You have access to their real data below. Answer in simple, plain language — avoid all jargon. Be specific and actionable. Always mention rupee amounts where relevant. Keep responses under 4 sentences. User data: ${contextText}`
    });

    const result = await model.generateContent(message);
    res.json({ response: result.response.text() });
  } catch (err) {
    console.error('Gemini Chat Error:', err);
    res.status(500).json({ error: 'Advisor unavailable right now. Please try again.' });
  }
});

router.get('/insights', auth, async (req, res) => {
  try {
    if (!genAI) {
      return res.json({ insights: [
        "Please configure your Gemini API key to view insights.",
        "Your GST compliance health requires AI analysis.",
        "Ensure all mismatching invoices are verified."
      ]});
    }

    const context = await getUserContext(req.user._id, req.user.businessName);
    const contextText = JSON.stringify(context, null, 2);

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const prompt = `Given this GST compliance data: ${contextText}, generate exactly 3 short insights (one sentence each) the business owner should know right now. Return only a valid JSON array of 3 strings, no explanation, no markdown.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Clean markdown blocks if Gemini returns them anyway
    if (text.startsWith('\`\`\`json')) {
      text = text.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
    } else if (text.startsWith('\`\`\`')) {
      text = text.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
    }

    try {
      const insightsArray = JSON.parse(text);
      if (Array.isArray(insightsArray) && insightsArray.length === 3) {
        return res.json({ insights: insightsArray });
      }
      throw new Error('Invalid format');
    } catch (parseErr) {
      // Fallback if parsing fails
      res.json({ insights: [
        "Your compliance score is " + context.complianceScore + "/100.",
        "You have " + context.mismatchCount + " mismatched invoices.",
        "₹" + context.itcAtRisk.toLocaleString('en-IN') + " ITC is currently at risk."
      ]});
    }
  } catch (err) {
    console.error('Gemini Insights Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
