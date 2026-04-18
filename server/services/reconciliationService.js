const Invoice = require('../models/Invoice');
const ReconciliationResult = require('../models/ReconciliationResult');
const Notification = require('../models/Notification');

function getLevenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
  for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, 
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

async function runReconciliation(userId) {
  const purchaseInvoices = await Invoice.find({ uploadedBy: userId, source: 'purchase' });
  const gstr2aInvoices = await Invoice.find({ uploadedBy: userId, source: 'gstr2a' });

  const allInvoiceIds = [...purchaseInvoices.map(i => i._id), ...gstr2aInvoices.map(i => i._id)];
  await ReconciliationResult.deleteMany({ invoiceId: { $in: allInvoiceIds } });

  const results = { matched: 0, mismatches: 0, missing: 0, totalProcessed: purchaseInvoices.length + gstr2aInvoices.length };
  const docsToInsert = [];
  const gstr2aMatched = new Set();

  const createRecord = (inv) => {
    if (!inv) return null;
    return {
      invoiceNumber: inv.invoiceNumber,
      sellerGstin: inv.sellerGstin,
      invoiceDate: inv.invoiceDate,
      taxableAmount: inv.taxableAmount,
      gstAmount: inv.gstAmount,
      totalAmount: inv.totalAmount,
      buyerGstin: inv.buyerGstin
    };
  };

  for (const purchase of purchaseInvoices) {
    let bestMatch = null;
    let matchType = 'missing';

    for (const portal of gstr2aInvoices) {
      if (gstr2aMatched.has(portal._id.toString())) continue;

      if (purchase.sellerGstin.toUpperCase() === portal.sellerGstin.toUpperCase()) {
        const isSameInv = purchase.invoiceNumber.toLowerCase() === portal.invoiceNumber.toLowerCase();
        const diff = Math.abs(purchase.totalAmount - portal.totalAmount);
        const tolerance = purchase.totalAmount * 0.01;

        if (isSameInv) {
          if (diff <= tolerance) {
            bestMatch = portal;
            matchType = 'exact';
            break;
          } else {
            bestMatch = portal;
            matchType = 'mismatch';
            break;
          }
        } else {
          const lev = getLevenshteinDistance(purchase.invoiceNumber.toLowerCase(), portal.invoiceNumber.toLowerCase());
          if (lev <= 2 && diff <= tolerance) {
            bestMatch = portal;
            matchType = 'fuzzy';
          }
        }
      }
    }

    if (matchType === 'exact') {
      gstr2aMatched.add(bestMatch._id.toString());
      docsToInsert.push({
        invoiceId: purchase._id,
        matchStatus: 'matched',
        ourRecord: createRecord(purchase),
        portalRecord: createRecord(bestMatch),
        differenceAmount: 0,
        confidenceScore: 100,
        remarks: 'Exact match'
      });
      await Invoice.findByIdAndUpdate(purchase._id, { status: 'matched' });
      await Invoice.findByIdAndUpdate(bestMatch._id, { status: 'matched' });
      results.matched++;
    } else if (matchType === 'fuzzy') {
      gstr2aMatched.add(bestMatch._id.toString());
      docsToInsert.push({
        invoiceId: purchase._id,
        matchStatus: 'matched',
        ourRecord: createRecord(purchase),
        portalRecord: createRecord(bestMatch),
        differenceAmount: Math.abs(purchase.totalAmount - bestMatch.totalAmount),
        confidenceScore: 80,
        remarks: 'Fuzzy match on invoice number'
      });
      await Invoice.findByIdAndUpdate(purchase._id, { status: 'matched' });
      await Invoice.findByIdAndUpdate(bestMatch._id, { status: 'matched' });
      results.matched++;
    } else if (matchType === 'mismatch') {
      gstr2aMatched.add(bestMatch._id.toString());
      docsToInsert.push({
        invoiceId: purchase._id,
        matchStatus: 'mismatch',
        ourRecord: createRecord(purchase),
        portalRecord: createRecord(bestMatch),
        differenceAmount: purchase.totalAmount - bestMatch.totalAmount,
        confidenceScore: 60,
        remarks: 'Amount mismatch'
      });
      await Invoice.findByIdAndUpdate(purchase._id, { status: 'mismatch' });
      await Invoice.findByIdAndUpdate(bestMatch._id, { status: 'mismatch' });
      results.mismatches++;
    } else {
      docsToInsert.push({
        invoiceId: purchase._id,
        matchStatus: 'missing',
        ourRecord: createRecord(purchase),
        portalRecord: null,
        differenceAmount: purchase.totalAmount,
        confidenceScore: 0,
        remarks: 'Supplier may not have filed'
      });
      await Invoice.findByIdAndUpdate(purchase._id, { status: 'missing' });
      results.missing++;
    }
  }

  for (const portal of gstr2aInvoices) {
    if (!gstr2aMatched.has(portal._id.toString())) {
      docsToInsert.push({
        invoiceId: portal._id,
        matchStatus: 'missing',
        ourRecord: null,
        portalRecord: createRecord(portal),
        differenceAmount: portal.totalAmount,
        confidenceScore: 0,
        remarks: 'Not in your records'
      });
      await Invoice.findByIdAndUpdate(portal._id, { status: 'missing' });
      results.missing++;
    }
  }

  if (docsToInsert.length > 0) {
    await ReconciliationResult.insertMany(docsToInsert);
  }

  await Notification.create({
    userId,
    type: 'success',
    message: `Reconciliation complete. ${results.matched} matched, ${results.mismatches} mismatches, ${results.missing} missing.`
  });

  return results;
}

module.exports = { runReconciliation };
