const Invoice = require('../models/Invoice');
const ReconciliationResult = require('../models/ReconciliationResult');
const ComplianceScore = require('../models/ComplianceScore');

/**
 * Normalize an invoice number for fuzzy comparison.
 * Strips all non-alphanumeric characters and lowercases.
 * e.g. "INV-001" => "inv001", "INV/001" => "inv001"
 */
function normalizeInvNum(num) {
  return (num || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

/**
 * Deterministic Reconciliation Engine v4.0
 * 
 * Matching pipeline (no LLM involvement):
 *   Pass 1 — Exact match: same sellerGstin + same invoiceNumber (case-insensitive, trimmed)
 *   Pass 2 — Fuzzy match: same sellerGstin + normalized invoiceNumber match
 *   Remaining purchase invoices → "missing"
 *   Remaining GSTR-2A invoices → "extra"
 */
exports.runEngine = async (buyerGstin, userId) => {
  // Purchase invoices: scoped to the logged-in buyer
  const purchaseInvoices = await Invoice.find({ uploadedBy: userId, source: 'purchase' }).lean();
  // GSTR-2A invoices: fetched globally by buyerGstin because they are uploaded by sellers!
  const gstr2aInvoices = await Invoice.find({ buyerGstin, source: 'gstr2a' }).lean();

  if (purchaseInvoices.length === 0 && gstr2aInvoices.length === 0) {
    return { stats: { matched: 0, mismatch: 0, missing: 0, extra: 0 }, finalScore: 0 };
  }

  // Track which GSTR-2A invoices have been consumed
  const usedGstr2aIds = new Set();
  // Each result: { purchaseInv, gstr2aInv|null, status, differenceAmount, confidenceScore, flag }
  const results = [];

  // ── Pass 1: Exact Match (sellerGstin + invoiceNumber, case-insensitive) ──
  for (const pInv of purchaseInvoices) {
    const pNum = (pInv.invoiceNumber || '').trim().toLowerCase();
    const pGstin = (pInv.sellerGstin || '').trim().toUpperCase();

    const exactMatch = gstr2aInvoices.find(g => {
      if (usedGstr2aIds.has(g._id.toString())) return false;
      const gNum = (g.invoiceNumber || '').trim().toLowerCase();
      const gGstin = (g.sellerGstin || '').trim().toUpperCase();
      return gGstin === pGstin && gNum === pNum;
    });

    if (exactMatch) {
      usedGstr2aIds.add(exactMatch._id.toString());
      const diff = Math.abs((pInv.totalAmount || 0) - (exactMatch.totalAmount || 0));
      const isMatch = diff < 1;
      results.push({
        purchaseInv: pInv,
        gstr2aInv: exactMatch,
        status: isMatch ? 'matched' : 'mismatch',
        differenceAmount: isMatch ? 0 : diff,
        confidenceScore: isMatch ? 100 : 60,
        flag: null
      });
    }
  }

  // ── Pass 2: Fuzzy Match (sellerGstin exact + normalized invoiceNumber) ──
  const unmatchedPurchase = purchaseInvoices.filter(
    p => !results.some(r => r.purchaseInv._id.toString() === p._id.toString())
  );

  for (const pInv of unmatchedPurchase) {
    const pNorm = normalizeInvNum(pInv.invoiceNumber);
    const pGstin = (pInv.sellerGstin || '').trim().toUpperCase();

    const fuzzyMatch = gstr2aInvoices.find(g => {
      if (usedGstr2aIds.has(g._id.toString())) return false;
      const gGstin = (g.sellerGstin || '').trim().toUpperCase();
      if (gGstin !== pGstin) return false;
      const gNorm = normalizeInvNum(g.invoiceNumber);
      return gNorm === pNorm && gNorm.length > 0;
    });

    if (fuzzyMatch) {
      usedGstr2aIds.add(fuzzyMatch._id.toString());
      const diff = Math.abs((pInv.totalAmount || 0) - (fuzzyMatch.totalAmount || 0));
      const isMatch = diff < 1;
      results.push({
        purchaseInv: pInv,
        gstr2aInv: fuzzyMatch,
        status: isMatch ? 'matched' : 'mismatch',
        differenceAmount: isMatch ? 0 : diff,
        confidenceScore: isMatch ? 80 : 60,
        flag: 'fuzzy'
      });
    }
  }

  // ── Remaining purchase invoices are "missing" (not in GSTR-2A) ──
  const matchedPurchaseIds = new Set(results.map(r => r.purchaseInv._id.toString()));
  for (const pInv of purchaseInvoices) {
    if (!matchedPurchaseIds.has(pInv._id.toString())) {
      results.push({
        purchaseInv: pInv,
        gstr2aInv: null,
        status: 'missing',
        differenceAmount: 0,
        confidenceScore: 0,
        flag: null
      });
    }
  }

  // ── Extra GSTR-2A invoices (supplier filed but buyer has no record) ──
  const extraGstr2a = gstr2aInvoices.filter(g => !usedGstr2aIds.has(g._id.toString()));

  // ── Compute stats from actual results ──
  const stats = { matched: 0, mismatch: 0, missing: 0, extra: extraGstr2a.length };
  for (const r of results) {
    stats[r.status] = (stats[r.status] || 0) + 1;
  }

  const finalScore = Math.max(0, 100 - (stats.mismatch * 5) - (stats.missing * 8) - (stats.extra * 3));

  // ── Persist results for matched / mismatch / missing purchase invoices ──
  for (const r of results) {
    const pInv = r.purchaseInv;
    let historyNote = '';
    if (r.status === 'matched') {
      historyNote = r.flag === 'fuzzy'
        ? 'Fuzzy match on invoice number resolved successfully.'
        : 'Exact match resolved successfully.';
    } else if (r.status === 'mismatch') {
      historyNote = `Amount differs by ₹${Math.abs(r.differenceAmount).toLocaleString()}`;
    } else {
      historyNote = 'Missing from Supplier GSTR-2A portal data.';
    }

    await ReconciliationResult.findOneAndUpdate(
      { invoiceId: pInv._id },
      {
        matchStatus: r.status,
        differenceAmount: r.differenceAmount,
        confidenceScore: r.confidenceScore,
        matchedWith: r.gstr2aInv ? r.gstr2aInv._id : null,
        flag: r.flag,
        engineVersion: '4.0-deterministic',
        ourRecord: pInv,
        portalRecord: r.gstr2aInv || null
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await Invoice.findByIdAndUpdate(pInv._id, {
      status: r.status,
      $push: {
        statusHistory: {
          $each: [
            { status: 'preprocessing', actor: 'Reconciliation Engine', actorRole: 'System', note: 'Deterministic matching initiated...', timestamp: new Date(Date.now() - 1000) },
            { status: r.status, actor: 'Reconciliation Engine', actorRole: 'System', note: historyNote, timestamp: new Date() }
          ]
        }
      }
    });
  }

  // ── Persist extra GSTR-2A records ──
  for (const gInv of extraGstr2a) {
    await ReconciliationResult.findOneAndUpdate(
      { invoiceId: gInv._id },
      {
        matchStatus: 'extra',
        differenceAmount: 0,
        confidenceScore: 0,
        flag: 'supplier_filed_not_received',
        engineVersion: '4.0-deterministic',
        ourRecord: null,
        portalRecord: gInv
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await Invoice.findByIdAndUpdate(gInv._id, {
      status: 'missing',
      $push: {
        statusHistory: {
          status: 'extra', actor: 'Reconciliation Engine', actorRole: 'System',
          note: 'Supplier filed but no corresponding purchase record found.',
          timestamp: new Date()
        }
      }
    });
  }

  // ── Persist compliance score ──
  await ComplianceScore.create({
    userId,
    gstin: buyerGstin,
    score: finalScore,
    metrics: stats,
    timestamp: new Date()
  });

  return { stats, finalScore };
};
