require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Invoice = require('./models/Invoice');

  // Get all unique buyerGstins
  const buyers = await Invoice.distinct('buyerGstin');
  console.log('Unique buyerGstins:', buyers);

  for (const bg of buyers) {
    const purchase = await Invoice.find({ buyerGstin: bg, source: 'purchase' }).lean();
    const gstr2a = await Invoice.find({ buyerGstin: bg, source: 'gstr2a' }).lean();
    console.log(`\n--- buyerGstin: ${bg} ---`);
    console.log(`  Purchase (${purchase.length}):`);
    purchase.forEach(p => console.log(`    ${p.invoiceNumber} | seller: ${p.sellerGstin} | amt: ${p.totalAmount} | by: ${p.uploadedBy}`));
    console.log(`  GSTR2A (${gstr2a.length}):`);
    gstr2a.forEach(g => console.log(`    ${g.invoiceNumber} | seller: ${g.sellerGstin} | amt: ${g.totalAmount} | by: ${g.uploadedBy}`));
  }

  process.exit(0);
});
