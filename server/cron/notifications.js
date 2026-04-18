const cron = require('node-cron');
const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Temporarily set to run every minute for testing as requested
cron.schedule('* * * * *', async () => {
  console.log('Running notification cron job...');
  try {
    const users = await User.find();
    
    for (const user of users) {
      // 1. Supplier mismatch rate
      const mismatchedInvoices = await Invoice.find({ uploadedBy: user._id, status: 'mismatch' });
      const supplierCounts = {};
      for (const inv of mismatchedInvoices) {
        supplierCounts[inv.sellerGstin] = (supplierCounts[inv.sellerGstin] || 0) + 1;
      }

      for (const [gstin, count] of Object.entries(supplierCounts)) {
        if (count >= 3) {
          // Prevent spamming every minute during test
          const recent = await Notification.findOne({
            userId: user._id,
            message: `High mismatch rate from ${gstin} — review this supplier.`,
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          });
          if (!recent) {
            await Notification.create({
              userId: user._id,
              message: `High mismatch rate from ${gstin} — review this supplier.`,
              type: 'warning'
            });
          }
        }
      }

      // Dates
      const today = new Date();
      const gstr1Date = new Date(today.getFullYear(), today.getMonth() + 1, 11);
      const gstr1DaysLeft = Math.ceil((gstr1Date - today) / (1000 * 60 * 60 * 24));
      
      const gstr3bDate = new Date(today.getFullYear(), today.getMonth() + 1, 20);
      const gstr3bDaysLeft = Math.ceil((gstr3bDate - today) / (1000 * 60 * 60 * 24));

      // 2. GSTR-3B due in 7 days
      // Note: for testing so it definitely fires, we bypass the strict day check if not exactly 7
      const shouldTrigger3B = gstr3bDaysLeft === 7 || true; // bypassed for test
      if (shouldTrigger3B) {
        const unresolved = mismatchedInvoices.length;
        const recent3b = await Notification.findOne({
          userId: user._id,
          message: new RegExp('GSTR-3B due'),
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });
        if (!recent3b && unresolved > 0) {
          await Notification.create({
            userId: user._id,
            message: `GSTR-3B due in ${gstr3bDaysLeft === 7 ? 7 : gstr3bDaysLeft} days. ${unresolved} mismatches still unresolved.`,
            type: 'warning'
          });
        }
      }

      // 3. GSTR-1 due in 3 days
      const shouldTrigger1 = gstr1DaysLeft === 3 || true; // bypassed for test
      if (shouldTrigger1) {
        const recent1 = await Notification.findOne({
          userId: user._id,
          message: new RegExp('GSTR-1 due'),
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });
        if (!recent1) {
          await Notification.create({
            userId: user._id,
            message: `GSTR-1 due in ${gstr1DaysLeft === 3 ? 3 : gstr1DaysLeft} days. File now.`,
            type: 'danger'
          });
        }
      }
    }
  } catch (err) {
    console.error('Cron job error:', err);
  }
});
