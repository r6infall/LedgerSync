/**
 * Seed notifications for demo — run with: node scripts/seedNotifications.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ledgersync');
  console.log('Connected to MongoDB');

  const user = await User.findOne({ role: 'buyer' });
  if (!user) { console.log('No buyer user found. Register one first.'); process.exit(1); }

  const now = Date.now();
  const notifications = [
    {
      userId: user._id,
      type: 'mismatch_detected',
      priority: 'critical',
      title: 'Critical: ITC at Risk',
      message: '4 invoices mismatched — ₹86,400 ITC at risk. Run AI analysis to see fix steps.',
      createdAt: new Date(now - 2 * 60 * 60 * 1000) // 2h ago
    },
    {
      userId: user._id,
      type: 'missing_invoice_request',
      priority: 'high',
      title: 'Supplier Filing Issue',
      message: 'Sharma Textiles has not filed GSTR-1 for March. 2 invoices missing from GSTR-2A.',
      createdAt: new Date(now - 5 * 60 * 60 * 1000) // 5h ago
    },
    {
      userId: user._id,
      type: 'deadline_alert',
      priority: 'high',
      title: 'GST Filing Deadline in 6 Days',
      message: 'GST filing deadline in 6 days — 4 unresolved mismatches remain.',
      createdAt: new Date(now - 8 * 60 * 60 * 1000) // 8h ago
    },
    {
      userId: user._id,
      type: 'invoice_approved',
      priority: 'medium',
      title: 'Invoice Approved',
      message: 'Invoice INV-2025-018 approved by buyer. ITC of ₹22,000 now claimable.',
      createdAt: new Date(now - 24 * 60 * 60 * 1000) // 1 day ago
    },
    {
      userId: user._id,
      type: 'payment_confirmed',
      priority: 'medium',
      title: 'Payment Confirmed',
      message: 'Mock payment confirmed — ₹1,18,000 paid to Kumar Fabrics. Transaction: pay_mock_abc123def456.',
      createdAt: new Date(now - 48 * 60 * 60 * 1000) // 2 days ago
    },
    {
      userId: user._id,
      type: 'ai_reminder',
      priority: 'medium',
      title: 'AI Daily Reminder',
      message: `${user.name || 'User'}, you have 4 mismatches with Sharma Textiles and Delhi Weaves worth ₹86,400. Filing deadline in 6 days. Resolve now to avoid 18% interest.`,
      createdAt: new Date(now - 12 * 60 * 60 * 1000) // 12h ago
    },
    {
      userId: user._id,
      type: 'info',
      priority: 'low',
      title: 'Score Improved',
      message: 'Compliance score improved from 68 to 74 after 2 invoices resolved.',
      createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      isRead: true
    },
    {
      userId: user._id,
      type: 'anomaly_detected',
      priority: 'high',
      title: 'AI Anomaly Detected',
      message: 'AI detected a potential duplicate: INV-2025-012 and INV-2025-019 have identical amounts (₹50,000) from the same supplier.',
      createdAt: new Date(now - 6 * 60 * 60 * 1000) // 6h ago
    }
  ];

  // Clear existing seed-style notifications to avoid duplicates
  await Notification.deleteMany({ userId: user._id, title: { $in: notifications.map(n => n.title) } });

  await Notification.insertMany(notifications);
  console.log(`✅ Seeded ${notifications.length} notifications for user: ${user.name} (${user._id})`);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
