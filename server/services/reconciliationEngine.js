const Invoice = require('../models/Invoice');
const ReconciliationResult = require('../models/ReconciliationResult');
const ComplianceScore = require('../models/ComplianceScore');
const levenshtein = require('fast-levenshtein');

exports.runEngine = async (buyerGstin, userId) => {
  // Clear previous runs to maintain idempotency during iterative tests
  await ReconciliationResult.deleteMany({});
  
  const purchaseInvoices = await Invoice.find({ buyerGstin, source: 'purchase' }).lean();
  const gstr2aInvoices = await Invoice.find({ buyerGstin, source: 'gstr2a' }).lean();
  
  let matchedGstr2aIds = new Set();
  let stats = { matched: 0, mismatch: 0, missing: 0, extra: 0 };
  
  for (let pInv of purchaseInvoices) {
    let result = null;
    let newStatus = 'pending';
    let historyNote = '';
    
    // Step 1: Exact match
    const exactMatch = gstr2aInvoices.find(g => 
      !matchedGstr2aIds.has(g._id.toString()) &&
      g.invoiceNumber === pInv.invoiceNumber &&
      g.sellerGstin === pInv.sellerGstin
    );
    
    if (exactMatch) {
       let diff = Math.abs(exactMatch.totalAmount - pInv.totalAmount);
       if (diff < 1) {
          result = { matchStatus: 'matched', confidenceScore: 100, matchedWith: exactMatch._id, flag: null };
          newStatus = 'matched';
          stats.matched++;
          historyNote = 'Exact match resolved successfully.';
       } else {
          // Step 3: Amount mismatch
          result = { matchStatus: 'mismatch', differenceAmount: exactMatch.totalAmount - pInv.totalAmount, confidenceScore: 60, matchedWith: exactMatch._id, flag: null };
          newStatus = 'mismatch';
          stats.mismatch++;
          historyNote = `Amount differs by ₹${Math.abs(result.differenceAmount).toLocaleString()}`;
       }
       matchedGstr2aIds.add(exactMatch._id.toString());
    } else {
       // Step 2: Fuzzy match
       const fuzzyMatch = gstr2aInvoices.find(g => 
         !matchedGstr2aIds.has(g._id.toString()) &&
         g.sellerGstin === pInv.sellerGstin &&
         levenshtein.get(g.invoiceNumber, pInv.invoiceNumber) <= 2
       );
       
       if (fuzzyMatch) {
          let diff = Math.abs(fuzzyMatch.totalAmount - pInv.totalAmount);
          if (diff < 1) {
             result = { matchStatus: 'matched', confidenceScore: 80, matchedWith: fuzzyMatch._id, flag: 'fuzzy' };
             newStatus = 'matched';
             stats.matched++;
             historyNote = `Fuzzy mapping matched reliably (Ref: ${fuzzyMatch.invoiceNumber})`;
          } else {
             // Amount mismatch on fuzzy
             result = { matchStatus: 'mismatch', differenceAmount: fuzzyMatch.totalAmount - pInv.totalAmount, confidenceScore: 60, matchedWith: fuzzyMatch._id, flag: 'fuzzy' };
             newStatus = 'mismatch';
             stats.mismatch++;
             historyNote = `Amount differs by ₹${Math.abs(result.differenceAmount).toLocaleString()}`;
          }
          matchedGstr2aIds.add(fuzzyMatch._id.toString());
       } else {
          // Step 4: Missing from GSTR-2A
          result = { matchStatus: 'missing', confidenceScore: 0, matchedWith: null, flag: null };
          newStatus = 'missing';
          stats.missing++;
          historyNote = `Missing from Supplier GSTR-2A portal payload.`;
       }
    }
    
    // Save Result
    await ReconciliationResult.create({
      invoiceId: pInv._id,
      matchStatus: result.matchStatus,
      differenceAmount: result.differenceAmount || 0,
      confidenceScore: result.confidenceScore,
      matchedWith: result.matchedWith,
      flag: result.flag,
      engineVersion: '2.0',
      ourRecord: pInv,
      portalRecord: result.matchedWith ? gstr2aInvoices.find(g => g._id.toString() === result.matchedWith.toString()) : null
    });
    
    // Push dual timeline nodes per explicitly requested requirement format
    await Invoice.findByIdAndUpdate(pInv._id, {
      status: newStatus,
      $push: {
        statusHistory: {
          $each: [
            { status: 'preprocessing', actor: 'System', actorRole: 'System', note: '', timestamp: new Date(Date.now() - 1000) },
            { status: newStatus, actor: 'System', actorRole: 'System', note: historyNote, timestamp: new Date() }
          ]
        }
      }
    });
  }
  
  // Step 5: Extra in GSTR-2A
  for (let gInv of gstr2aInvoices) {
    if (!matchedGstr2aIds.has(gInv._id.toString())) {
       stats.extra++;
       await ReconciliationResult.create({
         invoiceId: gInv._id,
         matchStatus: 'extra',
         differenceAmount: 0,
         confidenceScore: 0,
         flag: 'supplier_filed_not_received',
         engineVersion: '2.0',
         ourRecord: null,
         portalRecord: gInv
       });
       
       await Invoice.findByIdAndUpdate(gInv._id, {
         status: 'missing', 
         $push: {
           statusHistory: {
             status: 'extra', actor: 'System', actorRole: 'System', note: 'Supplier filed but practically unrecorded internally', timestamp: new Date()
           }
         }
       });
    }
  }
  
  // Recalculate Compliance Score
  let rawScore = 100 - (stats.mismatch * 5) - (stats.missing * 8) - (stats.extra * 3);
  let finalScore = rawScore < 0 ? 0 : rawScore;
  
  await ComplianceScore.create({
    userId,
    gstin: buyerGstin,
    score: finalScore,
    metrics: stats,
    timestamp: new Date()
  });
  
  return { stats, finalScore };
};
