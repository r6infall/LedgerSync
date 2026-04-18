const fs = require('fs');
const path = require('path');

const DEMO_GSTIN = '27AAPFU0939F1ZV';

const PURCHASE_INVOICES = [
  // Exact
  { inv: 'TXT/2024/001', gstin: '29AABCT1332L1ZT', date: '2024-04-05', taxable: 50000, gst: 9000,  total: 59000,  hsn: '5208' },
  { inv: 'TXT/2024/002', gstin: '29AABCT1332L1ZT', date: '2024-04-08', taxable: 30000, gst: 5400,  total: 35400,  hsn: '5208' },
  { inv: 'TXT/2024/003', gstin: '29AABCT1332L1ZT', date: '2024-04-12', taxable: 20000, gst: 3600,  total: 23600,  hsn: '5208' },
  { inv: 'FAB/APR/101',  gstin: '06AABCE3803M1ZH', date: '2024-04-03', taxable: 42143, gst: 5057,  total: 47200,  hsn: '5407' },
  { inv: 'FAB/APR/102',  gstin: '06AABCE3803M1ZH', date: '2024-04-09', taxable: 25286, gst: 3034,  total: 28320,  hsn: '5407' },
  { inv: 'FAB/APR/103',  gstin: '06AABCE3803M1ZH', date: '2024-04-15', taxable: 56893, gst: 6827,  total: 63720,  hsn: '5407' },
  { inv: 'IND/2024/0441',gstin: '27AAACI3829P1ZS', date: '2024-04-06', taxable: 17981, gst: 899,   total: 18880,  hsn: '5101' },
  { inv: 'IND/2024/0442',gstin: '27AAACI3829P1ZS', date: '2024-04-11', taxable: 12362, gst: 618,   total: 12980,  hsn: '5101' },
  { inv: 'IND/2024/0443',gstin: '27AAACI3829P1ZS', date: '2024-04-18', taxable: 30000, gst: 1500,  total: 31500,  hsn: '5101' },
  { inv: 'MUM-INV-2024-0081', gstin: '33AABCM4751A1ZD', date: '2024-04-04', taxable: 64531, gst: 18069, total: 82600, hsn: '5309' },
  { inv: 'MUM-INV-2024-0082', gstin: '33AABCM4751A1ZD', date: '2024-04-10', taxable: 39875, gst: 11165, total: 51040, hsn: '5309' },
  { inv: 'HYD/04/2024/223',   gstin: '36AABCP3981L1ZK', date: '2024-04-07', taxable: 21847, gst: 3933,  total: 25780, hsn: '5402' },
  // Mismatches (amounts differ in 2A)
  { inv: 'TXT/2024/004', gstin: '29AABCT1332L1ZT', date: '2024-04-20', taxable: 38500, gst: 6930,  total: 45430, hsn: '5208' },
  { inv: 'FAB/APR/104',  gstin: '06AABCE3803M1ZH', date: '2024-04-22', taxable: 47500, gst: 5700,  total: 53200, hsn: '5407' },
  { inv: 'IND/2024/0444',gstin: '27AAACI3829P1ZS', date: '2024-04-25', taxable: 17000, gst: 850,   total: 17850, hsn: '5101' },
  { inv: 'MUM-INV-2024-0083', gstin: '33AABCM4751A1ZD', date: '2024-04-28', taxable: 57000, gst: 15960, total: 72960, hsn: '5309' },
  // Missing in 2A
  { inv: 'HYD/04/2024/251', gstin: '36AABCP3981L1ZK', date: '2024-04-13', taxable: 31000, gst: 5580, total: 36580, hsn: '5402' },
  { inv: 'HYD/04/2024/252', gstin: '36AABCP3981L1ZK', date: '2024-04-19', taxable: 24500, gst: 4410, total: 28910, hsn: '5402' },
  { inv: 'HYD/04/2024/253', gstin: '36AABCP3981L1ZK', date: '2024-04-24', taxable: 18000, gst: 3240, total: 21240, hsn: '5402' },
  { inv: 'HYD/04/2024/254', gstin: '36AABCP3981L1ZK', date: '2024-04-27', taxable: 42000, gst: 7560, total: 49560, hsn: '5402' }
];

const GSTR2A_MISMATCH_ENTRIES = [
  { inv: 'TXT/2024/004', gstin: '29AABCT1332L1ZT', date: '2024-04-20', taxable: 38136, gst: 6864,  total: 45000 },
  { inv: 'FAB/APR/104',  gstin: '06AABCE3803M1ZH', date: '2024-04-22', taxable: 46429, gst: 5571,  total: 52000 },
  { inv: 'IND/2024/0444',gstin: '27AAACI3829P1ZS', date: '2024-04-25', taxable: 16000, gst: 800,   total: 16800 },
  { inv: 'MUM-INV-2024-0083', gstin: '33AABCM4751A1ZD', date: '2024-04-28', taxable: 55078, gst: 15422, total: 70500 },
];

const GSTR2A_EXTRA = [
  { inv: 'DEL/EXP/24/0091', gstin: '07AABCK8291P1ZV', date: '2024-04-02', taxable: 32712, gst: 5888, total: 38600 },
  { inv: 'DEL/EXP/24/0092', gstin: '07AABCK8291P1ZV', date: '2024-04-14', taxable: 23644, gst: 4256, total: 27900 },
  { inv: 'CAL/B2B/2024/331', gstin: '19AAACU9831L1ZM', date: '2024-04-16', taxable: 81429, gst: 9771, total: 91200 },
  { inv: 'CAL/B2B/2024/332', gstin: '19AAACU9831L1ZM', date: '2024-04-23', taxable: 39554, gst: 4746, total: 44300 }
];

const generateCsvLines = (data) => {
  const header = 'Invoice Number,Supplier GSTIN,Buyer GSTIN,Invoice Date,Taxable Amount,GST Amount,Total Amount,HSN Code';
  const rows = data.map(i => `${i.inv},${i.gstin},${DEMO_GSTIN},${i.date},${i.taxable},${i.gst},${i.total},${i.hsn || '9983'}`);
  return [header, ...rows].join('\n');
};

const purchaseCsv = generateCsvLines(PURCHASE_INVOICES);
const gstr2aCsvData = [
  ...PURCHASE_INVOICES.slice(0, 12),
  ...GSTR2A_MISMATCH_ENTRIES,
  ...GSTR2A_EXTRA
];
const gstr2aCsv = generateCsvLines(gstr2aCsvData);

fs.writeFileSync(path.join(__dirname, 'sample_purchase.csv'), purchaseCsv);
fs.writeFileSync(path.join(__dirname, 'sample_gstr2a.csv'), gstr2aCsv);

console.log('✅ Generated sample_purchase.csv and sample_gstr2a.csv with matching data.');
