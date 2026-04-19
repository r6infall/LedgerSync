const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');
const ComplianceScore = require('../models/ComplianceScore');
const crypto = require('crypto');

// POST /api/payments/mock-confirm — simulate Razorpay payment confirmation
router.post('/mock-confirm', auth, async (req, res) => {
  try {
    const { invoiceId, transactionId, amount, mockSignature, paymentMethod } = req.body;

    const invoice = await Invoice.findOne({ _id: invoiceId, uploadedBy: req.user._id });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Check for duplicate payment
    const existing = await Payment.findOne({ invoiceId, status: 'paid' });
    if (existing) return res.status(400).json({ error: 'Invoice already paid', payment: existing });

    const itcAmount = invoice.gstAmount || 0;
    const now = new Date();

    const payment = await Payment.create({
      invoiceId,
      buyerId: req.user._id,
      amount,
      transactionId,
      mockSignature,
      status: 'paid',
      paymentMethod: paymentMethod || 'mock_upi',
      itcUnlocked: true,
      itcAmount,
      paidAt: now,
      timeline: [
        { event: 'payment_initiated', actor: 'Buyer', timestamp: new Date(now - 3000), note: 'Buyer initiated mock payment' },
        { event: 'payment_processing', actor: 'System', timestamp: new Date(now - 1000), note: 'Simulated 2s processing delay' },
        { event: 'payment_confirmed', actor: 'System', timestamp: now, note: `Transaction: ${transactionId}` },
        { event: 'itc_unlocked', actor: 'System', timestamp: now, note: `₹${itcAmount.toLocaleString('en-IN')} now claimable` }
      ]
    });

    // Update invoice status and push timeline entries
    await Invoice.findByIdAndUpdate(invoiceId, {
      status: 'paid',
      $push: {
        statusHistory: {
          $each: [
            { status: 'paid', actor: 'Buyer', actorRole: 'Buyer', note: `Payment confirmed (mock) — ₹${amount.toLocaleString('en-IN')} — Transaction: ${transactionId}`, timestamp: now },
            { status: 'itc-unlocked', actor: 'System', actorRole: 'System', note: `ITC of ₹${itcAmount.toLocaleString('en-IN')} unlocked after payment confirmation`, timestamp: now }
          ]
        }
      }
    });

    // Create notification
    await Notification.create({
      userId: req.user._id,
      message: `Mock payment of ₹${amount.toLocaleString('en-IN')} confirmed for Invoice ${invoice.invoiceNumber}. ITC of ₹${itcAmount.toLocaleString('en-IN')} is now unlocked. Transaction: ${transactionId}`,
      type: 'success'
    });

    res.json({ success: true, payment, itcAmount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payments/buyer — buyer's payment history
router.get('/buyer', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ buyerId: req.user._id })
      .populate('invoiceId')
      .sort({ createdAt: -1 });

    // Find invoices that are payable but not yet paid
    const paidInvoiceIds = payments.filter(p => p.status === 'paid').map(p => p.invoiceId?._id?.toString());
    const payableInvoices = await Invoice.find({
      uploadedBy: req.user._id,
      status: { $in: ['matched', 'approved'] },
      _id: { $nin: paidInvoiceIds }
    }).sort({ invoiceDate: -1 });

    // Check overdue (matched/approved but unpaid and >30 days old)
    const overdueInvoices = payableInvoices.filter(inv => {
      const daysSince = Math.floor((Date.now() - new Date(inv.invoiceDate)) / (1000 * 60 * 60 * 24));
      return daysSince > 30;
    });

    res.json({ payments, payableInvoices, overdueInvoices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payments/seller — seller sees payments received
router.get('/seller', auth, async (req, res) => {
  try {
    // Find invoices where this seller's GSTIN is the sellerGstin
    const sellerInvoices = await Invoice.find({ sellerGstin: req.user.gstin, source: 'gstr2a' }).select('_id');
    const sellerInvoiceIds = sellerInvoices.map(i => i._id);

    // Also find purchase invoices referencing this seller
    const purchaseInvs = await Invoice.find({ sellerGstin: req.user.gstin, source: 'purchase' }).select('_id');
    const allIds = [...sellerInvoiceIds, ...purchaseInvs.map(i => i._id)];

    const payments = await Payment.find({ invoiceId: { $in: allIds } })
      .populate('invoiceId')
      .populate('buyerId', 'name email gstin businessName')
      .sort({ paidAt: -1 });

    res.json({ payments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payments/:id — single payment detail
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('invoiceId')
      .populate('buyerId', 'name email gstin businessName');
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json({ payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
