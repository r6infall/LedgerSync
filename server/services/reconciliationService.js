const Invoice = require('../models/Invoice');
const ReconciliationResult = require('../models/ReconciliationResult');

const AMOUNT_TOLERANCE = 0.01; // 1% tolerance

async function runReconciliation(userId) {
  // Fetch all purchase invoices and GSTR-2A invoices for the user
  const [purchaseInvoices, gstr2aInvoices] = await Promise.all([
    Invoice.find({ uploadedBy: userId, source: 'purchase' }),
    Invoice.find({ uploadedBy: userId, source: 'gstr2a' })
  ]);

  const results = { matched: 0, mismatches: 0, missing: 0, total: purchaseInvoices.length };
  const gstr2aMap = new Map();

  // Index GSTR-2A invoices by invoiceNumber + sellerGstin
  for (const inv of gstr2aInvoices) {
    const key = `${inv.invoiceNumber.toLowerCase()}::${inv.sellerGstin.toUpperCase()}`;
    gstr2aMap.set(key, inv);
  }

  // Delete old reconciliation results for these invoices
  const purchaseIds = purchaseInvoices.map(i => i._id);
  await ReconciliationResult.deleteMany({ invoiceId: { $in: purchaseIds } });

  const reconciliationDocs = [];

  for (const purchase of purchaseInvoices) {
    const key = `${purchase.invoiceNumber.toLowerCase()}::${purchase.sellerGstin.toUpperCase()}`;
    const portal = gstr2aMap.get(key);

    if (!portal) {
      // Missing in GSTR-2A
      reconciliationDocs.push({
        invoiceId: purchase._id,
        matchStatus: 'missing',
        differenceAmount: purchase.totalAmount,
        ourRecord: { totalAmount: purchase.totalAmount, gstAmount: purchase.gstAmount },
        portalRecord: null,
        confidenceScore: 0,
        remarks: 'Invoice not found in GSTR-2A portal data'
      });
      await Invoice.findByIdAndUpdate(purchase._id, { status: 'missing' });
      results.missing++;
    } else {
      const diff = Math.abs(purchase.totalAmount - portal.totalAmount);
      const tolerance = purchase.totalAmount * AMOUNT_TOLERANCE;
      const isMismatch = diff > tolerance ||
        purchase.gstAmount !== portal.gstAmount ||
        purchase.buyerGstin.toUpperCase() !== portal.buyerGstin.toUpperCase();

      const confidenceScore = isMismatch
        ? Math.max(0, 100 - Math.round((diff / (purchase.totalAmount || 1)) * 1000))
        : 100;

      reconciliationDocs.push({
        invoiceId: purchase._id,
        matchStatus: isMismatch ? 'mismatch' : 'matched',
        differenceAmount: diff,
        ourRecord: {
          totalAmount: purchase.totalAmount,
          gstAmount: purchase.gstAmount,
          buyerGstin: purchase.buyerGstin
        },
        portalRecord: {
          totalAmount: portal.totalAmount,
          gstAmount: portal.gstAmount,
          buyerGstin: portal.buyerGstin
        },
        confidenceScore,
        remarks: isMismatch
          ? `Amount difference: ₹${diff.toFixed(2)}. GST discrepancy detected.`
          : 'Invoice matches portal record exactly'
      });

      await Invoice.findByIdAndUpdate(purchase._id, { status: isMismatch ? 'mismatch' : 'matched' });

      if (isMismatch) results.mismatches++;
      else results.matched++;
    }
  }

  if (reconciliationDocs.length > 0) {
    await ReconciliationResult.insertMany(reconciliationDocs);
  }

  return results;
}

module.exports = { runReconciliation };
