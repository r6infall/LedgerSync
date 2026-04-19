const cron = require('node-cron');
const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Payment = require('../models/Payment');
const MissingInvoiceRequest = require('../models/MissingInvoiceRequest');
const aiService = require('../services/aiService');

// 08:00 daily IST — AI Smart Reminder (Feature 6)
cron.schedule('0 8 * * *', async () => {
  console.log('[Cron 08:00] AI Smart Reminders...');
  try {
    const users = await User.find();
    for (const user of users) {
      const invoices = await Invoice.find({ uploadedBy: user._id, source: 'purchase' });
      let mismatchCount = 0, missingCount = 0, itcAtRisk = 0;
      const supplierIssues = {};

      for (const inv of invoices) {
        if (inv.status === 'mismatch') { mismatchCount++; itcAtRisk += inv.gstAmount || 0; supplierIssues[inv.sellerGstin] = true; }
        else if (inv.status === 'missing') { missingCount++; itcAtRisk += inv.gstAmount || 0; }
      }

      let pending = [];
      if (mismatchCount > 0) pending.push({ desc: 'Resolve mismatches with ' + Object.keys(supplierIssues).join(', '), amount: itcAtRisk });
      if (missingCount > 0) pending.push({ desc: 'Follow up missing invoices', amount: 0 });
      if (pending.length === 0) continue;

      const reminder = await aiService.generateSmartReminder(user.name, user.businessName, pending);
      if (reminder && !reminder.error) {
        await Notification.create({
          userId: user._id,
          type: 'ai_reminder',
          priority: 'medium',
          title: 'AI Daily Reminder',
          message: reminder.reminder || reminder.response
        });
      }
    }
  } catch (err) { console.error('[Cron 08:00] Error:', err.message); }
}, { scheduled: true, timezone: 'Asia/Kolkata' });

// 08:05 daily IST — Deadline alerts
cron.schedule('5 8 * * *', async () => {
  console.log('[Cron 08:05] Deadline alerts...');
  try {
    const today = new Date();
    const deadlineDay = 20;
    const nextDeadline = new Date(today.getFullYear(), today.getMonth() + (today.getDate() > deadlineDay ? 1 : 0), deadlineDay);
    const daysUntil = Math.ceil((nextDeadline - today) / (1000 * 60 * 60 * 24));

    if (daysUntil <= 7 && daysUntil > 0) {
      const users = await User.find();
      for (const user of users) {
        const alreadyNotified = await Notification.findOne({
          userId: user._id, type: 'deadline_alert',
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });
        if (alreadyNotified) continue;

        const mismatches = await Invoice.countDocuments({ uploadedBy: user._id, status: 'mismatch' });
        await Notification.create({
          userId: user._id,
          type: 'deadline_alert',
          priority: daysUntil <= 3 ? 'critical' : 'high',
          title: `GST Filing Deadline in ${daysUntil} Days`,
          message: `GSTR-3B filing deadline is ${nextDeadline.toLocaleDateString('en-IN')} (${daysUntil} days away). ${mismatches > 0 ? `${mismatches} unresolved mismatches remain.` : 'All invoices are reconciled.'}`
        });
      }
    }
  } catch (err) { console.error('[Cron 08:05] Error:', err.message); }
}, { scheduled: true, timezone: 'Asia/Kolkata' });

// 08:10 daily IST — Overdue payment check
cron.schedule('10 8 * * *', async () => {
  console.log('[Cron 08:10] Overdue payment check...');
  try {
    const users = await User.find();
    for (const user of users) {
      const invoices = await Invoice.find({
        uploadedBy: user._id, status: { $in: ['matched', 'approved'] }, source: 'purchase'
      });
      for (const inv of invoices) {
        const daysSince = Math.floor((Date.now() - new Date(inv.invoiceDate)) / (1000 * 60 * 60 * 24));
        if (daysSince <= 30) continue;
        const paid = await Payment.findOne({ invoiceId: inv._id, status: 'paid' });
        if (paid) continue;
        const alreadyNotified = await Notification.findOne({
          userId: user._id, message: new RegExp(`Payment overdue for Invoice ${inv.invoiceNumber}`),
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });
        if (alreadyNotified) continue;
        await Notification.create({
          userId: user._id,
          type: 'overdue_payment',
          priority: 'high',
          title: 'Payment Overdue',
          message: `Payment overdue for Invoice ${inv.invoiceNumber}. ITC of ₹${(inv.gstAmount || 0).toLocaleString('en-IN')} is blocked until payment.`,
          relatedInvoiceId: inv._id
        });
      }
    }
  } catch (err) { console.error('[Cron 08:10] Error:', err.message); }
}, { scheduled: true, timezone: 'Asia/Kolkata' });

// 08:15 daily IST — Overdue missing invoice requests
cron.schedule('15 8 * * *', async () => {
  console.log('[Cron 08:15] Missing invoice overdue escalation...');
  try {
    const overdueRequests = await MissingInvoiceRequest.find({
      status: 'requested',
      requestedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    for (const req of overdueRequests) {
      req.status = 'overdue';
      await req.save();

      // Notify buyer
      await Notification.create({
        userId: req.buyerId,
        type: 'missing_invoice_request',
        priority: 'high',
        title: 'Missing Invoice Overdue',
        message: `Invoice request for ${req.gstr2aInvoiceData?.invoiceNumber} is overdue (>7 days). Supplier ${req.supplierGstin} has not responded.`
      });

      // Notify seller
      if (req.supplierId) {
        await Notification.create({
          userId: req.supplierId,
          type: 'missing_invoice_request',
          priority: 'critical',
          title: 'ESCALATION: Invoice Upload Overdue',
          message: `Invoice ${req.gstr2aInvoiceData?.invoiceNumber} request is overdue (>7 days). Please upload immediately.`
        });
      }
    }
  } catch (err) { console.error('[Cron 08:15] Error:', err.message); }
}, { scheduled: true, timezone: 'Asia/Kolkata' });

// Every 5 minutes — expire old notifications
cron.schedule('*/5 * * * *', async () => {
  try {
    await Notification.updateMany(
      { expired: false, expiresAt: { $lt: new Date() } },
      { expired: true }
    );
  } catch (err) { /* silent */ }
});

console.log('✅ All cron jobs registered (IST timezone)');
