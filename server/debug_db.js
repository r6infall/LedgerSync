require('dotenv').config();
const mongoose = require('mongoose');
const Invoice = require('./models/Invoice');
const ReconciliationResult = require('./models/ReconciliationResult');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const user = await User.findOne({ email: 'demo@taxsync.ai' });
  const purchases = await Invoice.find({ uploadedBy: user._id, source: 'purchase' });
  const gstr2a = await Invoice.find({ uploadedBy: user._id, source: 'gstr2a' });
  
  console.log(`User ID: ${user._id}`);
  console.log(`Purchases: ${purchases.length}`);
  console.log(`GSTR-2A: ${gstr2a.length}`);
  
  if (purchases.length > 0 && gstr2a.length > 0) {
    console.log('Sample Purchase:', purchases[0].invoiceNumber, purchases[0].sellerGstin, purchases[0].totalAmount);
    console.log('Sample GSTR2A:', gstr2a[0].invoiceNumber, gstr2a[0].sellerGstin, gstr2a[0].totalAmount);
  }

  const results = await ReconciliationResult.find().populate('invoiceId');
  const matched = results.filter(r => r.matchStatus === 'matched').length;
  const missing = results.filter(r => r.matchStatus === 'missing').length;
  console.log(`Results: ${results.length} total, ${matched} matched, ${missing} missing`);
  
  process.exit(0);
});
