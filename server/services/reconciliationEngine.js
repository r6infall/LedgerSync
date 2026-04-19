const Invoice = require('../models/Invoice');
const ReconciliationResult = require('../models/ReconciliationResult');
const ComplianceScore = require('../models/ComplianceScore');
const aiService = require('./aiService');

exports.runEngine = async (buyerGstin, userId) => {
  const purchaseInvoices = await Invoice.find({ buyerGstin, source: 'purchase' }).lean();
  const gstr2aInvoices = await Invoice.find({ buyerGstin, source: 'gstr2a' }).lean();
  
  if (purchaseInvoices.length === 0 && gstr2aInvoices.length === 0) {
     return { stats: { matched: 0, mismatch: 0, missing: 0, extra: 0 }, finalScore: 0 };
  }

  // 100% LLM Driven Mapping Pipeline
  const aiOutput = await aiService.reconcileInvoicesAI(userId, purchaseInvoices, gstr2aInvoices);
  if (aiOutput.error) throw new Error(aiOutput.error);

  const { matches = [], extraGstr2aIds = [], stats = { matched: 0, mismatch: 0, missing: 0, extra: 0 }, finalScore = 100 } = aiOutput;

  // Process Matches, Mismatches, and Missing
  for (let match of matches) {
    const pInv = purchaseInvoices.find(i => i._id.toString() === match.purchaseId);
    if (!pInv) continue;

    let historyNote = '';
    if (match.status === 'matched') historyNote = match.flag === 'fuzzy' ? 'Fuzzy mapping matched reliably by AI.' : 'Exact match resolved successfully by AI.';
    else if (match.status === 'mismatch') historyNote = `Amount differs by ₹${Math.abs(match.differenceAmount).toLocaleString()} (AI Detected)`;
    else historyNote = `Missing from Supplier GSTR-2A portal payload (AI Detected).`;

    // Save Result Idempotently while preserving dynamic AI analysis fields natively
    await ReconciliationResult.findOneAndUpdate(
      { invoiceId: pInv._id },
      {
        matchStatus: match.status,
        differenceAmount: match.differenceAmount || 0,
        confidenceScore: match.confidenceScore || 0,
        matchedWith: match.matchedWithId || null,
        flag: match.flag || null,
        engineVersion: '3.0-LLM',
        ourRecord: pInv,
        portalRecord: match.matchedWithId ? gstr2aInvoices.find(g => g._id.toString() === match.matchedWithId) : null
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    
    // Push dual timeline nodes
    await Invoice.findByIdAndUpdate(pInv._id, {
      status: match.status,
      $push: {
        statusHistory: {
          $each: [
            { status: 'preprocessing', actor: 'AI Engine', actorRole: 'System', note: 'AI reasoning sequence queued...', timestamp: new Date(Date.now() - 1000) },
            { status: match.status, actor: 'AI Engine', actorRole: 'System', note: historyNote, timestamp: new Date() }
          ]
        }
      }
    });
  }
  
  // Process Extra records unmapped completely
  for (let extraId of extraGstr2aIds) {
    const gInv = gstr2aInvoices.find(i => i._id.toString() === extraId);
    if (!gInv) continue;

    await ReconciliationResult.findOneAndUpdate(
      { invoiceId: gInv._id },
      {
        matchStatus: 'extra',
        differenceAmount: 0,
        confidenceScore: 0,
        flag: 'supplier_filed_not_received_AI',
        engineVersion: '3.0-LLM',
        ourRecord: null,
        portalRecord: gInv
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    
    await Invoice.findByIdAndUpdate(gInv._id, {
      status: 'missing', 
      $push: {
        statusHistory: {
          status: 'extra', actor: 'AI Engine', actorRole: 'System', note: 'AI identified supplier filed but unrecorded internally', timestamp: new Date()
        }
      }
    });
  }
  
  // Persist Score strictly based on AI native arithmetic capability 
  await ComplianceScore.create({
    userId,
    gstin: buyerGstin,
    score: Math.max(0, finalScore),
    metrics: stats,
    timestamp: new Date()
  });
  
  return { stats, finalScore: Math.max(0, finalScore) };
};
