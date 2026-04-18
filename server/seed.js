/**
 * LedgerSync AI — Demo Seed Script
 * Creates a complete demo dataset for Ravi Textiles Pvt Ltd
 * Run: npm run seed (from /server directory)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const admin = require('./firebaseAdmin');

const User = require('./models/User');
const Invoice = require('./models/Invoice');
const Notification = require('./models/Notification');
const Payment = require('./models/Payment');
const ReconciliationResult = require('./models/ReconciliationResult');
const { runReconciliation } = require('./services/reconciliationService');

const DEMO_EMAIL    = 'demo@taxsync.ai';
const DEMO_PASSWORD = 'Demo@1234';
const DEMO_GSTIN    = '27AAPFU0939F1ZV';
const BUYER_GSTIN   = '27AAPFU0939F1ZV';

// 5 supplier GSTINs
const SUPPLIERS = [
  { gstin: '29AABCT1332L1ZT', name: 'Textile Corp Bangalore' },
  { gstin: '06AABCE3803M1ZH', name: 'Elegant Fabrics Haryana' },
  { gstin: '27AAACI3829P1ZS', name: 'Indo Weave Industries' },
  { gstin: '33AABCM4751A1ZD', name: 'Mumbai Cloth Merchant' },
  { gstin: '36AABCP3981L1ZK', name: 'Polyester Pvt Ltd Hyderabad' },
];

// 20 purchase invoices
// 12 will match GSTR-2A exactly, 4 will mismatch (amounts differ), 4 will be missing
const PURCHASE_INVOICES = [
  // ─── EXACT MATCHES (12) ───────────────────────────────────
  { inv: 'TXT/2024/001', gstin: '29AABCT1332L1ZT', date: '2024-04-05', taxable: 50000, gst: 9000,  total: 59000,  hsn: '5208', match: 'exact' },
  { inv: 'TXT/2024/002', gstin: '29AABCT1332L1ZT', date: '2024-04-08', taxable: 30000, gst: 5400,  total: 35400,  hsn: '5208', match: 'exact' },
  { inv: 'TXT/2024/003', gstin: '29AABCT1332L1ZT', date: '2024-04-12', taxable: 20000, gst: 3600,  total: 23600,  hsn: '5208', match: 'exact' },
  { inv: 'FAB/APR/101',  gstin: '06AABCE3803M1ZH', date: '2024-04-03', taxable: 42143, gst: 5057,  total: 47200,  hsn: '5407', match: 'exact' },
  { inv: 'FAB/APR/102',  gstin: '06AABCE3803M1ZH', date: '2024-04-09', taxable: 25286, gst: 3034,  total: 28320,  hsn: '5407', match: 'exact' },
  { inv: 'FAB/APR/103',  gstin: '06AABCE3803M1ZH', date: '2024-04-15', taxable: 56893, gst: 6827,  total: 63720,  hsn: '5407', match: 'exact' },
  { inv: 'IND/2024/0441',gstin: '27AAACI3829P1ZS', date: '2024-04-06', taxable: 17981, gst: 899,   total: 18880,  hsn: '5101', match: 'exact' },
  { inv: 'IND/2024/0442',gstin: '27AAACI3829P1ZS', date: '2024-04-11', taxable: 12362, gst: 618,   total: 12980,  hsn: '5101', match: 'exact' },
  { inv: 'IND/2024/0443',gstin: '27AAACI3829P1ZS', date: '2024-04-18', taxable: 30000, gst: 1500,  total: 31500,  hsn: '5101', match: 'exact' },
  { inv: 'MUM-INV-2024-0081', gstin: '33AABCM4751A1ZD', date: '2024-04-04', taxable: 64531, gst: 18069, total: 82600, hsn: '5309', match: 'exact' },
  { inv: 'MUM-INV-2024-0082', gstin: '33AABCM4751A1ZD', date: '2024-04-10', taxable: 39875, gst: 11165, total: 51040, hsn: '5309', match: 'exact' },
  { inv: 'HYD/04/2024/223',   gstin: '36AABCP3981L1ZK', date: '2024-04-07', taxable: 21847, gst: 3933,  total: 25780, hsn: '5402', match: 'exact' },

  // ─── AMOUNT MISMATCHES (4) ────────────────────────────────
  // GSTR-2A has different amounts (indexes 13-16 in mock-gstr2a.json)
  { inv: 'TXT/2024/004', gstin: '29AABCT1332L1ZT', date: '2024-04-20', taxable: 38500, gst: 6930,  total: 45430, hsn: '5208', match: 'mismatch' },
  { inv: 'FAB/APR/104',  gstin: '06AABCE3803M1ZH', date: '2024-04-22', taxable: 47500, gst: 5700,  total: 53200, hsn: '5407', match: 'mismatch' },
  { inv: 'IND/2024/0444',gstin: '27AAACI3829P1ZS', date: '2024-04-25', taxable: 17000, gst: 850,   total: 17850, hsn: '5101', match: 'mismatch' },
  { inv: 'MUM-INV-2024-0083', gstin: '33AABCM4751A1ZD', date: '2024-04-28', taxable: 57000, gst: 15960, total: 72960, hsn: '5309', match: 'mismatch' },

  // ─── MISSING — supplier never filed GSTR-1 (4) ───────────
  { inv: 'HYD/04/2024/251', gstin: '36AABCP3981L1ZK', date: '2024-04-13', taxable: 31000, gst: 5580, total: 36580, hsn: '5402', match: 'missing' },
  { inv: 'HYD/04/2024/252', gstin: '36AABCP3981L1ZK', date: '2024-04-19', taxable: 24500, gst: 4410, total: 28910, hsn: '5402', match: 'missing' },
  { inv: 'HYD/04/2024/253', gstin: '36AABCP3981L1ZK', date: '2024-04-24', taxable: 18000, gst: 3240, total: 21240, hsn: '5402', match: 'missing' },
  { inv: 'HYD/04/2024/254', gstin: '36AABCP3981L1ZK', date: '2024-04-27', taxable: 42000, gst: 7560, total: 49560, hsn: '5402', match: 'missing' },
];

// GSTR-2A entries that correspond to the 4 mismatches (different amounts)
const GSTR2A_MISMATCH_ENTRIES = [
  { inv: 'TXT/2024/004', gstin: '29AABCT1332L1ZT', date: '2024-04-20', taxable: 38136, gst: 6864,  total: 45000 },
  { inv: 'FAB/APR/104',  gstin: '06AABCE3803M1ZH', date: '2024-04-22', taxable: 46429, gst: 5571,  total: 52000 },
  { inv: 'IND/2024/0444',gstin: '27AAACI3829P1ZS', date: '2024-04-25', taxable: 16000, gst: 800,   total: 16800 },
  { inv: 'MUM-INV-2024-0083', gstin: '33AABCM4751A1ZD', date: '2024-04-28', taxable: 55078, gst: 15422, total: 70500 },
];

async function seed() {
  console.log('🌱 LedgerSync Demo Seed Script');
  console.log('━'.repeat(50));

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected');

  // ─── 1. Create or reuse Firebase demo user ─────────────────
  let firebaseUid;
  try {
    const existing = await admin.auth().getUserByEmail(DEMO_EMAIL);
    firebaseUid = existing.uid;
    console.log(`♻️  Reusing Firebase user: ${DEMO_EMAIL}`);
  } catch {
    const created = await admin.auth().createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      displayName: 'Ravi Sharma',
    });
    firebaseUid = created.uid;
    console.log(`✅ Created Firebase user: ${DEMO_EMAIL}`);
  }

  // ─── 2. Create or update MongoDB User ──────────────────────
  let user = await User.findOne({ email: DEMO_EMAIL });
  if (!user) {
    user = await User.create({
      firebaseUid,
      email: DEMO_EMAIL,
      name: 'Ravi Sharma',
      gstin: DEMO_GSTIN,
      businessName: 'Ravi Textiles Pvt Ltd',
    });
    console.log('✅ Created demo user in MongoDB');
  } else {
    user.firebaseUid = firebaseUid;
    user.name = 'Ravi Sharma';
    user.gstin = DEMO_GSTIN;
    user.businessName = 'Ravi Textiles Pvt Ltd';
    await user.save();
    console.log('♻️  Updated demo user in MongoDB');
  }

  const userId = user._id;

  // ─── 3. Clear existing data ─────────────────────────────────
  await Invoice.deleteMany({ uploadedBy: userId });
  await Notification.deleteMany({ userId });
  await Payment.deleteMany({ userId });
  await ReconciliationResult.deleteMany({});
  console.log('🗑️  Cleared old seed data');

  // ─── 4. Insert 20 purchase invoices ────────────────────────
  const purchaseDocs = PURCHASE_INVOICES.map(p => ({
    invoiceNumber: p.inv,
    sellerGstin: p.gstin,
    buyerGstin: BUYER_GSTIN,
    invoiceDate: new Date(p.date),
    taxableAmount: p.taxable,
    gstAmount: p.gst,
    totalAmount: p.total,
    hsnCode: p.hsn,
    source: 'purchase',
    status: 'pending',
    uploadedBy: userId,
  }));
  await Invoice.insertMany(purchaseDocs);
  console.log(`✅ Inserted ${purchaseDocs.length} purchase invoices`);

  // ─── 5. Insert 20 GSTR-2A invoices ─────────────────────────
  // 12 exact matches (same amounts as purchase)
  const gstr2aExact = PURCHASE_INVOICES.slice(0, 12).map(p => ({
    invoiceNumber: p.inv,
    sellerGstin: p.gstin,
    buyerGstin: BUYER_GSTIN,
    invoiceDate: new Date(p.date),
    taxableAmount: p.taxable,
    gstAmount: p.gst,
    totalAmount: p.total,
    hsnCode: p.hsn,
    source: 'gstr2a',
    status: 'pending',
    uploadedBy: userId,
  }));

  // 4 mismatches (different amounts)
  const gstr2aMismatch = GSTR2A_MISMATCH_ENTRIES.map(p => ({
    invoiceNumber: p.inv,
    sellerGstin: p.gstin,
    buyerGstin: BUYER_GSTIN,
    invoiceDate: new Date(p.date),
    taxableAmount: p.taxable,
    gstAmount: p.gst,
    totalAmount: p.total,
    source: 'gstr2a',
    status: 'pending',
    uploadedBy: userId,
  }));

  // 4 extra GSTR-2A entries with no matching purchase invoice
  const gstr2aExtra = [
    { inv: 'DEL/EXP/24/0091', gstin: '07AABCK8291P1ZV', date: '2024-04-02', taxable: 32712, gst: 5888, total: 38600, hsn: '5309' },
    { inv: 'DEL/EXP/24/0092', gstin: '07AABCK8291P1ZV', date: '2024-04-14', taxable: 23644, gst: 4256, total: 27900, hsn: '5309' },
    { inv: 'CAL/B2B/2024/331', gstin: '19AAACU9831L1ZM', date: '2024-04-16', taxable: 81429, gst: 9771, total: 91200, hsn: '5407' },
    { inv: 'CAL/B2B/2024/332', gstin: '19AAACU9831L1ZM', date: '2024-04-23', taxable: 39554, gst: 4746, total: 44300, hsn: '5407' },
  ].map(p => ({
    invoiceNumber: p.inv,
    sellerGstin: p.gstin,
    buyerGstin: BUYER_GSTIN,
    invoiceDate: new Date(p.date),
    taxableAmount: p.taxable,
    gstAmount: p.gst,
    totalAmount: p.total,
    hsnCode: p.hsn,
    source: 'gstr2a',
    status: 'pending',
    uploadedBy: userId,
  }));

  await Invoice.insertMany([...gstr2aExact, ...gstr2aMismatch, ...gstr2aExtra]);
  console.log(`✅ Inserted ${gstr2aExact.length + gstr2aMismatch.length + gstr2aExtra.length} GSTR-2A invoices`);

  // ─── 6. Run reconciliation ──────────────────────────────────
  console.log('🔄 Running reconciliation...');
  const results = await runReconciliation(userId);
  console.log(`✅ Reconciliation complete: ${results.matched} matched, ${results.mismatches} mismatches, ${results.missing} missing`);

  // ─── 7. Pre-create 5 notifications ─────────────────────────
  const now = new Date();
  const notifications = [
    {
      userId,
      type: 'success',
      message: `Reconciliation complete. 12 matched, 4 mismatches, 4 missing.`,
      createdAt: new Date(now - 5 * 60 * 1000), // 5 min ago
    },
    {
      userId,
      type: 'warning',
      message: `High mismatch rate from 36AABCP3981L1ZK — review this supplier.`,
      createdAt: new Date(now - 30 * 60 * 1000), // 30 min ago
    },
    {
      userId,
      type: 'danger',
      message: `GSTR-1 due in 3 days. File now to avoid penalties.`,
      createdAt: new Date(now - 2 * 60 * 60 * 1000), // 2 hrs ago
    },
    {
      userId,
      type: 'warning',
      message: `GSTR-3B due in 7 days. 4 mismatches still unresolved.`,
      createdAt: new Date(now - 4 * 60 * 60 * 1000), // 4 hrs ago
    },
    {
      userId,
      type: 'info',
      message: `New GSTR-2A data available for April 2024. Run reconciliation to update your status.`,
      createdAt: new Date(now - 24 * 60 * 60 * 1000), // 1 day ago
    },
  ];
  await Notification.insertMany(notifications);
  console.log('✅ Created 5 demo notifications');

  // ─── Done ───────────────────────────────────────────────────
  console.log('\n━'.repeat(50));
  console.log('🎉 Demo seed complete!');
  console.log(`   Email:    ${DEMO_EMAIL}`);
  console.log(`   Password: ${DEMO_PASSWORD}`);
  console.log(`   GSTIN:    ${DEMO_GSTIN}`);
  console.log('━'.repeat(50));

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
