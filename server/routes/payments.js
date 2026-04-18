const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder'
});

// POST /api/payments/create-order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { invoiceId, amount } = req.body;

    const invoice = await Invoice.findOne({ _id: invoiceId, uploadedBy: req.user._id });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // in paise
      currency: 'INR',
      receipt: `rcpt_${invoiceId}_${Date.now()}`,
      notes: { invoiceId: invoiceId.toString(), userId: req.user._id.toString() }
    });

    const payment = await Payment.create({
      invoiceId,
      supplierId: req.user._id,
      amount,
      razorpayOrderId: order.id,
      status: 'pending'
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: payment._id,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/verify
router.post('/verify', auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await Payment.findByIdAndUpdate(paymentId, { status: 'failed' });
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        razorpayPaymentId: razorpay_payment_id,
        status: 'completed',
        itcUnlocked: (await Payment.findById(paymentId)).amount * 0.18 // 18% GST as ITC
      },
      { new: true }
    );

    // Update invoice status
    await Invoice.findByIdAndUpdate(payment.invoiceId, { status: 'accepted' });

    await Notification.create({
      userId: req.user._id,
      message: `Payment of ₹${payment.amount.toLocaleString('en-IN')} verified. ITC of ₹${payment.itcUnlocked.toFixed(2)} unlocked.`,
      type: 'success'
    });

    res.json({ message: 'Payment verified', payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payments — list payments
router.get('/', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ supplierId: req.user._id })
      .populate('invoiceId')
      .sort({ createdAt: -1 });
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
