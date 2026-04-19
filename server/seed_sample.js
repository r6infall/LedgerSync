/**
 * Seed sample invoices for the buyer/seller pair.
 * Buyer GSTIN:  07LMNOP4321K1Z2
 * Seller GSTIN: 33QWERT9876H2Z7
 *
 * Creates 3 purchase + 3 GSTR-2A invoices under the buyer account:
 *   INV-001  → exact match   (same amount in both)
 *   INV-002  → mismatch      (amount differs)
 *   INV-003  → missing       (no GSTR-2A counterpart)
 *   INV-EXTRA → extra        (GSTR-2A only, no purchase)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Invoice = require('./models/Invoice');
const ReconciliationResult = require('./models/ReconciliationResult');
const User = require('./models/User');

const BUYER_GSTIN  = '07LMNOP4321K1Z2';
const SELLER_GSTIN = '33QWERT9876H2Z7';

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Find buyer user
  const buyer = await User.findOne({ gstin: BUYER_GSTIN });
  if (!buyer) {
    console.error('No user found with buyer GSTIN:', BUYER_GSTIN);
    console.log('Available users:');
    const all = await User.find({}, 'email gstin');
    all.forEach(u => console.log(`  ${u.email} → ${u.gstin || '(none)'}`));
    process.exit(1);
  }
  console.log('Buyer user:', buyer.email, '→', buyer._id);

  // Clean old data for this buyer
  await Invoice.deleteMany({ uploadedBy: buyer._id });
  await ReconciliationResult.deleteMany({});
  console.log('Cleared old invoice data for buyer');

  // ── Purchase Invoices (buyer's books) ──
  const purchaseInvoices = [
    {
      invoiceNumber: 'INV-001',
      sellerGstin: SELLER_GSTIN,
      buyerGstin: BUYER_GSTIN,
      invoiceDate: new Date('2025-04-05'),
      taxableAmount: 100000,
      gstAmount: 18000,
      totalAmount: 118000,
      hsnCode: '8471',
      source: 'purchase',
      status: 'pending',
      uploadedBy: buyer._id,
    },
    {
      invoiceNumber: 'INV-002',
      sellerGstin: SELLER_GSTIN,
      buyerGstin: BUYER_GSTIN,
      invoiceDate: new Date('2025-04-10'),
      taxableAmount: 50000,
      gstAmount: 9000,
      totalAmount: 59000,
      hsnCode: '8471',
      source: 'purchase',
      status: 'pending',
      uploadedBy: buyer._id,
    },
    {
      invoiceNumber: 'INV-003',
      sellerGstin: SELLER_GSTIN,
      buyerGstin: BUYER_GSTIN,
      invoiceDate: new Date('2025-04-15'),
      taxableAmount: 75000,
      gstAmount: 13500,
      totalAmount: 88500,
      hsnCode: '8471',
      source: 'purchase',
      status: 'pending',
      uploadedBy: buyer._id,
    },
  ];

  // ── GSTR-2A Invoices (supplier-filed, fetched from portal) ──
  const gstr2aInvoices = [
    {
      // Matches INV-001 exactly
      invoiceNumber: 'INV-001',
      sellerGstin: SELLER_GSTIN,
      buyerGstin: BUYER_GSTIN,
      invoiceDate: new Date('2025-04-05'),
      taxableAmount: 100000,
      gstAmount: 18000,
      totalAmount: 118000,
      hsnCode: '8471',
      source: 'gstr2a',
      status: 'pending',
      uploadedBy: buyer._id,
    },
    {
      // Matches INV-002 by number but amount differs → mismatch
      invoiceNumber: 'INV-002',
      sellerGstin: SELLER_GSTIN,
      buyerGstin: BUYER_GSTIN,
      invoiceDate: new Date('2025-04-10'),
      taxableAmount: 51000,
      gstAmount: 9000,
      totalAmount: 60000,  // buyer has 59000 → ₹1,000 difference
      hsnCode: '8471',
      source: 'gstr2a',
      status: 'pending',
      uploadedBy: buyer._id,
    },
    {
      // Extra — exists in GSTR-2A but buyer has no purchase record
      invoiceNumber: 'INV-EXTRA',
      sellerGstin: SELLER_GSTIN,
      buyerGstin: BUYER_GSTIN,
      invoiceDate: new Date('2025-04-20'),
      taxableAmount: 65000,
      gstAmount: 11700,
      totalAmount: 76700,
      hsnCode: '8471',
      source: 'gstr2a',
      status: 'pending',
      uploadedBy: buyer._id,
    },
  ];

  await Invoice.insertMany([...purchaseInvoices, ...gstr2aInvoices]);

  console.log('\n✅ Seeded 3 purchase + 3 GSTR-2A invoices');
  console.log('Expected reconciliation results:');
  console.log('  INV-001  → matched  (exact amounts)');
  console.log('  INV-002  → mismatch (₹59,000 vs ₹60,000)');
  console.log('  INV-003  → missing  (no GSTR-2A counterpart)');
  console.log('  INV-EXTRA → extra   (no purchase counterpart)');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
