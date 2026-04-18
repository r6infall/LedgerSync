const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');

// POST /api/payments/create — mock order creation
router.post('/create', auth, async (req, res) => {
  try {
    const { invoiceId, amount, supplierGstin } = req.body;

    const invoice = await Invoice.findOne({ _id: invoiceId, uploadedBy: req.user._id });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Mock Razorpay order id
    const mockOrderId = `order_mock_${Date.now()}`;

    const payment = await Payment.create({
      invoiceId,
      supplierId: req.user._id, // Just storing the current user for reference in test mode
      amount,
      razorpayOrderId: mockOrderId,
      status: 'pending'
    });

    res.json({
      orderId: mockOrderId,
      amount: amount * 100,
      currency: 'INR',
      paymentId: payment._id,
      keyId: 'rzp_test_mock_key_123'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/verify — mock verification
router.post('/verify', auth, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, invoiceId } = req.body;

    // In a real app we verify razorpaySignature here
    // For mock, we just assume it's valid if it reaches here

    const invoice = await Invoice.findOne({ _id: invoiceId, uploadedBy: req.user._id });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const itcUnlocked = invoice.gstAmount || 0;

    const payment = await Payment.findOneAndUpdate(
      { invoiceId, status: 'pending' },
      {
        razorpayPaymentId: razorpayPaymentId || `pay_mock_${Date.now()}`,
        status: 'completed',
        itcUnlocked
      },
      { new: true }
    );

    // Update invoice status so it contributes to matched/ITC
    await Invoice.findByIdAndUpdate(invoiceId, { status: 'matched' });

    await Notification.create({
      userId: req.user._id,
      message: `Payment of ₹${invoice.taxableAmount.toLocaleString('en-IN')} complete. ₹${itcUnlocked.toLocaleString('en-IN')} ITC unlocked for invoice ${invoice.invoiceNumber}.`,
      type: 'success'
    });

    res.json({ success: true, payment, itcUnlocked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payments/history
router.get('/history', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ supplierId: req.user._id })
      .populate('invoiceId')
      .sort({ createdAt: -1 });

    const pendingInvoices = await Invoice.find({ 
      uploadedBy: req.user._id, 
      status: { $in: ['mismatch', 'missing'] } 
    }).sort({ invoiceDate: -1 });

    res.json({ payments, pendingInvoices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
