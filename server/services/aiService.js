const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('redis');

const genAI = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const MODEL_NAME = 'gemini-2.5-flash';

// Initialize Redis explicitly defensively
let redisClient = null;
if (process.env.REDIS_URL) {
  try {
    let rawUrl = process.env.REDIS_URL.trim();
    if (!rawUrl.startsWith('redis://') && !rawUrl.startsWith('rediss://')) {
       rawUrl = `redis://${rawUrl}`;
    }
    redisClient = createClient({ url: rawUrl });
    redisClient.on('error', (err) => console.log('[Redis Error]', err.message));
    redisClient.connect().then(() => console.log('[Redis] Connected safely')).catch(() => {
      console.log('[Redis] Failed to connect. Disabling Redis caching fallback.');
      redisClient = null;
    });
  } catch (err) {
    console.log('[Redis Init Error] Invalid URL parsing. Disabling cache structurally:', err.message);
    redisClient = null;
  }
}

// ----------------------------------------------------------------------
// Rate Limiting Logic for Free Tier (15 requests/minute)
// ----------------------------------------------------------------------
const RPM_LIMIT = 15;
let apiCallsThisMinute = 0;
let rateLimitInterval = setInterval(() => { apiCallsThisMinute = 0; }, 60000);

async function enforceRateLimit() {
  if (apiCallsThisMinute >= RPM_LIMIT) {
     throw new Error("Free tier AI limit reached (15 RPM). Please wait a moment.");
  }
  apiCallsThisMinute++;
}

// ----------------------------------------------------------------------
// Caching Wrapper
// ----------------------------------------------------------------------
async function withCache(cacheKey, aiFunction) {
  if (redisClient && redisClient.isReady) {
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn('Redis read failed:', e.message);
    }
  }

  // Execute Gemini Code
  try {
    await enforceRateLimit();
    const result = await aiFunction();
    
    // Save to Cache for 1 Hour (3600 secs)
    if (redisClient && redisClient.isReady && result) {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(result)).catch(()=>null);
    }
    return result;
  } catch (err) {
    console.error(`[AI Service Error for ${cacheKey}]:`, err.message);
    return { error: 'AI analysis unavailable — please try again in a moment' };
  }
}

// ----------------------------------------------------------------------
// Feature 1: explainMismatch
// ----------------------------------------------------------------------
exports.explainMismatch = async (invoice, gstr2aRecord) => {
  if (!genAI) return { error: "AI not configured." };
  const cacheKey = `ai:mismatch:${invoice._id}`;
  
  return withCache(cacheKey, async () => {
    const prompt = `You are a GST compliance expert for Indian SMBs. A buyer's purchase invoice does not match what their supplier filed with the government (GSTR-2A). Analyze the mismatch and explain it in plain English.

Buyer's record: Invoice No: ${invoice.invoiceNumber}, Supplier GSTIN: ${invoice.sellerGstin}, Amount: ₹${invoice.totalAmount}, Date: ${invoice.invoiceDate}, Tax: ₹${invoice.gstAmount}
Government record (GSTR-2A): Invoice No: ${gstr2aRecord.invoiceNumber}, Supplier GSTIN: ${gstr2aRecord.sellerGstin}, Amount: ₹${gstr2aRecord.totalAmount}, Date: ${gstr2aRecord.invoiceDate}, Tax: ₹${gstr2aRecord.gstAmount}

Respond in this exact JSON format natively (no markdown ticks):
{
  "problem": "[One sentence saying exactly what is different]",
  "cause": "[Most likely reason this happened]",
  "impact": "[How much ITC is at risk in rupees and what penalty could apply]",
  "buyerFix": ["[2-3 numbered steps the buyer should take]"],
  "sellerFix": ["[2-3 numbered steps the seller should take]"]
}`;

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    let raw = result.response.text().trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    return JSON.parse(raw);
  });
};

// ----------------------------------------------------------------------
// Feature 2: suggestCorrection
// ----------------------------------------------------------------------
exports.suggestCorrection = async (invoice, mismatchType) => {
  if (!genAI) return { error: "AI not configured." };
  const cacheKey = `ai:correction:${invoice._id}:${mismatchType}`;
  
  return withCache(cacheKey, async () => {
    const prompt = `You are a GST filing assistant. Generate a step-by-step correction plan for this mismatch type: ${mismatchType}.
Invoice details: Invoice ${invoice.invoiceNumber}, Date: ${invoice.invoiceDate}, Amount: ${invoice.totalAmount}
Mismatch type options: amount_difference | gstin_typo | date_mismatch | missing_from_gstr | duplicate_invoice
Return exactly 5 numbered steps in a JSON array format. Each step must be one sentence. Be specific to Indian GST rules (GSTR-1 amendment, GSTR-2A auto-population, ITC reversal under Rule 37A). Do not use jargon without explaining it.
Format output strictly as JSON array of strings: ["Step 1...", "Step 2..."]`;

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    let raw = result.response.text().trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    return { steps: JSON.parse(raw) };
  });
};

// ----------------------------------------------------------------------
// Feature 3: scoreSupplierRisk
// ----------------------------------------------------------------------
exports.scoreSupplierRisk = async (supplierId, supplierGstin, invoices) => {
  if (!genAI) return { error: "AI not configured." };
  const cacheKey = `ai:supplier_risk:${supplierGstin}`;
  
  return withCache(cacheKey, async () => {
    // Trim payload strictly to save context tokens explicitly
    const trimmed = invoices.slice(0, 30).map(i => ({ status: i.status, amount: i.totalAmount, date: i.invoiceDate }));
    
    const prompt = `You are a procurement risk analyst. Analyze this supplier's invoice history and calculate a risk score.
Supplier GSTIN: ${supplierGstin}
Invoice history (last 30 docs): ${JSON.stringify(trimmed)}

Return explicitly in this JSON format strictly (no markdown blocks):
{
  "RISK_SCORE": [number 0-100, where 0=no risk, 100=extreme risk],
  "RISK_LEVEL": "[Low / Medium / High / Critical]",
  "TOP_REASONS": ["[point 1]", "[point 2]", "[point 3]"],
  "RECOMMENDATION": "[One actionable sentence]"
}`;

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    let raw = result.response.text().trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    return JSON.parse(raw);
  });
};

// ----------------------------------------------------------------------
// Feature 4: chatWithContext
// ----------------------------------------------------------------------
exports.chatWithContext = async (userMessage, contextData) => {
  if (!genAI) return { response: "AI correctly disabled for this instance without API key configuration." };
  
  // Note: Chat normally shouldn't be heavily cached for dynamic interaction natively, but for the exact query yes.
  const cacheKey = `ai:chat:${contextData.userId}:${userMessage.substring(0, 40).replace(/\\s/g, '_')}`;
  
  return withCache(cacheKey, async () => {
    const prompt = `You are TaxSync, an AI assistant for Indian GST compliance. You are talking to a user at ${contextData.businessName} (GSTIN: ${contextData.gstin}).
Their current data:
- Total invoices this month: ${contextData.totalInvoices}
- Matched: ${contextData.matchedCount}, Mismatched: ${contextData.mismatchCount}, Missing: ${contextData.missingCount}
- ITC at risk: ₹${contextData.itcAtRisk}
- Compliance score: ${contextData.complianceScore}/100
- Upcoming GST deadline: 20th of next month

Answer their question using this context. Be specific with rupee amounts. Keep answers under 150 words. Focus strictly.
User Question: ${userMessage}
Return just the raw text response seamlessly.`;

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    return { response: result.response.text().trim() };
  });
};

// ----------------------------------------------------------------------
// Feature 5: generateGSTRSummary
// ----------------------------------------------------------------------
exports.generateGSTRSummary = async (contextData) => {
  if (!genAI) return { error: "AI not configured." };
  const cacheKey = `ai:gstr_summary:${contextData.userId}`;
  
  return withCache(cacheKey, async () => {
    const prompt = `You are a CA assistant summarizing GST filing readiness for a client. Write a 3-paragraph summary in plain English.
Client: ${contextData.businessName}, GSTIN: ${contextData.gstin}
Data: Matched: ${contextData.matchedCount}, Mismatched: ${contextData.mismatchCount}, Missing: ${contextData.missingCount}, ITC eligible: ₹${contextData.itcClaimed || 0}, ITC blocked: ₹${contextData.itcAtRisk}, Compliance score: ${contextData.complianceScore}/100

Format specifically as JSON containing 3 exact paragraphs strings securely (no markdown):
{
  "paragraph1": "Overall readiness (1-2 sentences, start with 'Your GSTR-3B for this month is X% ready.')",
  "paragraph2": "Main issues (what needs to be resolved before filing)",
  "paragraph3": "Action items (3 specific things to do this week)"
}`;

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    let raw = result.response.text().trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    return JSON.parse(raw);
  });
};

// ----------------------------------------------------------------------
// Feature 6: generateSmartReminder
// ----------------------------------------------------------------------
exports.generateSmartReminder = async (userName, businessName, pendingActions) => {
  if (!genAI) return { response: "Please resolve outstanding compliance metrics explicitly." };
  
  const cacheKey = `ai:reminder:${userName}:${new Date().toDateString()}`;
  return withCache(cacheKey, async () => {
    const prompt = `Generate a WhatsApp-style short reminder message (max 60 words) for a GST filer.
User: ${userName}, Business: ${businessName}
Pending actions: ${pendingActions.length > 0 ? pendingActions.map(p => p.desc + ' (₹' + p.amount + ')').join(", ") : 'None'}
GST filing deadline: 20th
The message must: mention specific rupee amounts, name specific suppliers causing issues, mention the deadline, feel urgent but professional. Start with the user's name.`;

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    return { reminder: result.response.text().trim() };
  });
};

// ----------------------------------------------------------------------
// Feature 7: detectAnomalies — 100% AI-driven, no hardcoded rules
// ----------------------------------------------------------------------
exports.detectAnomalies = async (userId, invoices) => {
  if (!genAI) return [];
  const cacheKey = `ai:anomalies:${userId}`;
  
  return withCache(cacheKey, async () => {
    const trimmed = invoices.slice(0, 50).map(i => ({
      _id: String(i._id),
      amount: i.totalAmount,
      gstin: i.sellerGstin,
      date: i.invoiceDate,
      invoiceNumber: i.invoiceNumber,
      supplierName: i.sellerGstin
    }));
    
    const prompt = `You are a financial fraud detection AI for an Indian GST compliance platform. You have been given a dataset of purchase invoices. Analyze the ENTIRE dataset freely using your own expertise. Identify ANY anomalies, risks, or suspicious patterns you can find. Use your own judgement — do not limit yourself to any pre-defined checklist.

Invoice dataset:
${JSON.stringify(trimmed)}

IMPORTANT: The "invoiceId" in your response MUST be the exact "_id" string value from the dataset above. Do NOT use the invoice number — use the MongoDB _id.

Return ONLY a raw JSON array (no markdown, no explanation):
[{"invoiceId": "<exact _id from dataset>", "anomalyType": "<type>", "severity": "low|medium|high", "description": "<1-2 sentence explanation>"}]

If no anomalies are found, return an empty array: []`;

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    let raw = result.response.text().trim();
    // Extract JSON robustly
    const arrMatch = raw.match(/\[[\s\S]*\]/);
    if (arrMatch) return JSON.parse(arrMatch[0]);
    const objMatch = raw.match(/\{[\s\S]*\}/);
    if (objMatch) {
      const p = JSON.parse(objMatch[0]);
      const arr = Object.values(p).find(v => Array.isArray(v));
      if (arr) return arr;
    }
    return [];
  });
};

// ----------------------------------------------------------------------
// Feature 8: explainComplianceScore
// ----------------------------------------------------------------------
exports.explainComplianceScore = async (score, missing, mismatches) => {
  if (!genAI) return { error: "AI not configured." };
  const cacheKey = `ai:compliance_explain:${score}:${missing}:${mismatches}`;
  
  return withCache(cacheKey, async () => {
    const prompt = `Explain this GST compliance score to a non-accountant in plain English.
Score: ${score}/100
Breakdown: mismatches: ${mismatches}, missing: ${missing}
Score formula: 100 - (mismatches×5) - (missing×8)
Write specifically natively structured as JSON without markdown wrappers:
{
  "SCORE_REASON": "(why the score is this number, mention specific deductions)",
  "QUICK_WINS": ["(3 things they can do this week to raise the score)"],
  "LONG_TERM": ["(2 strategic improvements)"]
}`;

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    let raw = result.response.text().trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    return JSON.parse(raw);
  });
};

// ----------------------------------------------------------------------
// Feature 9: forecastITC
// ----------------------------------------------------------------------
exports.forecastITC = async (userId, currentITC, blockedITC) => {
  if (!genAI) return { error: "AI not configured." };
  const cacheKey = `ai:forecast:${userId}`;
  
  return withCache(cacheKey, async () => {
    const prompt = `You are a financial forecasting AI. Predict next month's Input Tax Credit.
Current month ITC eligible: ₹${currentITC}, ITC blocked: ₹${blockedITC}
Trend: Generally suppliers correct 70% of blocked ITC by deadline heavily cleanly securely.
Output valid JSON natively securely (no markdown block):
{
  "FORECASTED_ITC": "[amount range strings like 4000-5000]",
  "CONFIDENCE": "[percentage]",
  "KEY_ASSUMPTION": "[one sentence]",
  "RISK_FACTOR": "[what could change this]"
}`;

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    let raw = result.response.text().trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    return JSON.parse(raw);
  });
};

// ----------------------------------------------------------------------
// Feature 10: onboardingGuide
// ----------------------------------------------------------------------
exports.onboardingGuide = async (businessName, role, gstin) => {
  if (!genAI) return { error: "AI not configured." };
  const cacheKey = `ai:onboarding:${role}`;
  
  return withCache(cacheKey, async () => {
    const prompt = `Create a 5-step onboarding checklist for a new GST compliance platform user.
Business: ${businessName}, Role: ${role}, GSTIN: ${gstin}
Steps must be specific to their role (buyer vs seller).
Return strictly inside a valid JSON natively strictly explicitly without tickwrappers natively:
{
  "steps": [
    { "STEP_TITLE": "title (5 words max)", "STEP_DESCRIPTION": "1 sentence.", "ESTIMATED_TIME": "'2 mins'" }
  ]
}`;

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    let raw = result.response.text().trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    return JSON.parse(raw);
  });
};

// ----------------------------------------------------------------------
// Feature 11: reconcileInvoicesAI (Replacing deterministic algorithms)
// ----------------------------------------------------------------------
exports.reconcileInvoicesAI = async (userId, purchaseInvoices, gstr2aInvoices) => {
  if (!genAI) return { error: "AI not configured. Reconciliation halted." };

  // Note: We deliberately do not cache this specific logic over time because it relies
  // on active matching and data mutation. A separate cache key conceptually works but isn't required here.

  await enforceRateLimit();
  
  // Trim schemas to minimize prompt tokens and maximize reasoning window
  const pList = purchaseInvoices.map(i => ({ _id: i._id, num: i.invoiceNumber, amount: i.totalAmount, gstin: i.sellerGstin }));
  const gList = gstr2aInvoices.map(i => ({ _id: i._id, num: i.invoiceNumber, amount: i.totalAmount, gstin: i.sellerGstin }));

  const prompt = `You are a financial reconciliation core engine. Perform deterministic exact matching between the Purchase Invoices array and the GSTR-2A Invoices array.
Purchase Invoices: ${JSON.stringify(pList)}
GSTR-2A (Supplier) Invoices: ${JSON.stringify(gList)}

Logic Rules:
1. Exact Match: Exact GSTIN and Exact Invoice Number. If amount deviates < 1, status is 'matched', confidence 100%. If amount deviates > 1, status is 'mismatch', assign 'differenceAmount', confidence 60%.
2. Fuzzy Match: Typo in Invoice Number (e.g., INV01 vs INV-01). Assign flag 'fuzzy', calculate amount match, confidence 80% (or 60% if mismatch).
3. Missing: Purchase invoice not found in GSTR-2A at all. Status 'missing'.
4. Extra: GSTR-2A invoice absolutely not matching any Purchase records. List their _ids in extraGstr2aIds.

Final scoring: math = 100 - (mismatches × 5) - (missing × 8) - (extra × 3). Ensure finalScore >= 0.

Output strictly as raw valid JSON without markdown block tokens explicitly:
{
  "matches": [
    {
      "purchaseId": "purchase_mongo_id",
      "status": "matched|mismatch|missing",
      "matchedWithId": "gstr2a_mongo_id_OR_null",
      "differenceAmount": 0,
      "confidenceScore": 100,
      "flag": "fuzzy|null"
    }
  ],
  "extraGstr2aIds": ["gstr2a_mongo_id"],
  "stats": {"matched": 0, "mismatch": 0, "missing": 0, "extra": 0},
  "finalScore": 100
}`;

  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  try {
    const result = await model.generateContent(prompt);
    let raw = result.response.text();
    // Safety generic JSON extractor dynamically correctly mathematically explicitly
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) raw = jsonMatch[0];
    return JSON.parse(raw);
  } catch(e) {
    console.error("[Reconciliation Engine AI Fallback Error]:", e.message);
    return { error: 'Reconciliation AI dynamically failed: ' + e.message };
  }
};
