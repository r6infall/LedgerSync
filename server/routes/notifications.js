const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

// GET /api/notifications — unread first, then by date
router.get('/', auth, async (req, res) => {
  try {
    const { filter } = req.query;
    const query = { userId: req.user._id, expired: { $ne: true } };

    if (filter === 'unread') query.isRead = false;
    else if (filter === 'ai_reminder') query.type = 'ai_reminder';
    else if (filter === 'deadlines') query.type = { $in: ['deadline_alert', 'overdue_payment'] };
    else if (filter === 'payments') query.type = { $in: ['payment_confirmed', 'itc_unlocked', 'overdue_payment'] };
    else if (filter === 'invoices') query.type = { $in: ['approval', 'rejection', 'change_request', 'mismatch_detected', 'missing_invoice_request', 'missing_invoice_fulfilled'] };

    const notifications = await Notification.find(query)
      .sort({ isRead: 1, createdAt: -1 })
      .limit(100);
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false, expired: { $ne: true } });
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!n) return res.status(404).json({ error: 'Not found' });
    res.json({ notification: n });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Also support PUT for backward compat
router.put('/:id/read', auth, async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!n) return res.status(404).json({ error: 'Not found' });
    res.json({ notification: n });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: 'All marked read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Also support PUT for backward compat
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: 'All marked read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
