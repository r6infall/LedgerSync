const fs = require('fs');
const path = require('path');

const gstr2aRaw = fs.readFileSync(path.join(__dirname, 'server', 'data', 'mock-gstr2a.json'), 'utf8');
const gstr2aData = JSON.parse(gstr2aRaw);

const lines = ['Invoice Number,Supplier GSTIN,Buyer GSTIN,Invoice Date,Taxable Amount,GST Amount,Total Amount,HSN Code'];

// We want to generate some exact matches, some mismatches, and leave some missing.
let count = 0;
gstr2aData.b2b.forEach(supplier => {
  const sellerGstin = supplier.ctin;
  supplier.inv.forEach(inv => {
    count++;
    const invNum = inv.inum;
    const date = inv.idt.replace(/-/g, '/'); // changing format slightly shouldn't affect much, but let's stick to YYYY-MM-DD
    const dParts = inv.idt.split('-');
    const isoDate = `${dParts[2]}-${dParts[1]}-${dParts[0]}`;
    
    let txval = inv.itms[0].itm_det.txval;
    let gstAmt = inv.itms[0].itm_det.cgst + inv.itms[0].itm_det.sgst;
    
    // Introduce mismatches
    if (count % 4 === 0) {
      // Amount mismatch (higher)
      txval += 5000;
    } else if (count % 5 === 0) {
      // GST mismatch
      gstAmt += 1000;
    }
    
    const totalAmount = txval + gstAmt;

    // Skip every 6th invoice to create "missing" status (exists in 2A, not in Purchase)
    // Actually if it exists in 2A but not purchase, it won't be reconciled by current logic because the loop is over purchaseInvoices!
    // Wait, the current logic ONLY loops over purchaseInvoices:
    // for (const purchase of purchaseInvoices)
    // If we want missing, we should ADD an invoice to Purchase that is NOT in GSTR2A!
    
    lines.push(`${invNum},${sellerGstin},27BBBBBBBBBBBBZ,${isoDate},${txval},${gstAmt},${totalAmount},9983`);
  });
});

// Add a few extra purchase invoices that are NOT in GSTR2A (to show Missing)
lines.push(`INV-MISSING-1,27AAPFU0939F1ZV,27BBBBBBBBBBBBZ,2024-10-15,10000,1800,11800,9983`);
lines.push(`INV-MISSING-2,07BBNPP1234K2Z1,27BBBBBBBBBBBBZ,2024-10-18,25000,4500,29500,9983`);

fs.writeFileSync('sample_purchase.csv', lines.join('\n'));
console.log('Created sample_purchase.csv');
