const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const Notification = require('../models/Notification');
const MissingInvoiceRequest = require('../models/MissingInvoiceRequest');

// POST /api/missing-invoices/request — buyer requests missing invoice from seller
router.post('/request', auth, async (req, res) => {
  try {
    const { gstr2aInvoiceId, note } = req.body;

    const gstr2aInv = await Invoice.findById(gstr2aInvoiceId);
    if (!gstr2aInv) return res.status(404).json({ error: 'GSTR-2A invoice not found' });

    // Prevent duplicate requests
    const existing = await MissingInvoiceRequest.findOne({ buyerId: req.user._id, gstr2aInvoiceId });
    if (existing) return res.status(400).json({ error: 'Already requested', request: existing });

    // Find seller by GSTIN
    const seller = await User.findOne({ gstin: gstr2aInv.sellerGstin });

    const request = await MissingInvoiceRequest.create({
      buyerId: req.user._id,
      supplierId: seller?._id || null,
      supplierGstin: gstr2aInv.sellerGstin,
      gstr2aInvoiceId,
      gstr2aInvoiceData: {
        invoiceNumber: gstr2aInv.invoiceNumber,
        invoiceDate: gstr2aInv.invoiceDate,
        totalAmount: gstr2aInv.totalAmount,
        gstAmount: gstr2aInv.gstAmount,
        sellerGstin: gstr2aInv.sellerGstin
      },
      status: 'requested',
      note: note || '',
      requestedAt: new Date()
    });

    // Notify seller if they exist on the platform
    if (seller) {
      await Notification.create({
        userId: seller._id,
        message: `Buyer has requested Invoice ${gstr2aInv.invoiceNumber} dated ${new Date(gstr2aInv.invoiceDate).toLocaleDateString('en-IN')} for ₹${gstr2aInv.totalAmount?.toLocaleString('en-IN')}. Please upload it on LedgerSync.`,
        type: 'missing_invoice_request'
      });
    }

    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/missing-invoices/buyer — buyer's missing invoices + requests
router.get('/buyer', auth, async (req, res) => {
  try {
    // Get all GSTR-2A invoices for this buyer that are status 'missing' or 'extra'
    const missingInvoices = await Invoice.find({
      buyerGstin: req.user.gstin,
      source: 'gstr2a',
      status: { $in: ['missing', 'extra', 'pending'] }
    }).lean();

    // Get existing requests by this buyer
    const requests = await MissingInvoiceRequest.find({ buyerId: req.user._id })
      .populate('supplierId', 'name businessName email')
      .lean();

    // Map request status onto each missing invoice
    const enriched = missingInvoices.map(inv => {
      const req = requests.find(r => r.gstr2aInvoiceId?.toString() === inv._id.toString());
      return {
        ...inv,
        requestStatus: req?.status || 'not_requested',
        requestId: req?._id || null,
        requestedAt: req?.requestedAt || null,
        sellerResponse: req?.sellerResponse || null,
        fulfilledAt: req?.fulfilledAt || null,
        // Check overdue: requested >7 days ago and still not fulfilled
        isOverdue: req?.status === 'requested' && req?.requestedAt && (Date.now() - new Date(req.requestedAt)) > 7 * 24 * 60 * 60 * 1000
      };
    });

    res.json({ missingInvoices: enriched, totalMissing: enriched.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/missing-invoices/seller — requests assigned to this seller
router.get('/seller', auth, async (req, res) => {
  try {
    const requests = await MissingInvoiceRequest.find({ supplierGstin: req.user.gstin })
      .populate('buyerId', 'name businessName email gstin')
      .sort({ requestedAt: -1 })
      .lean();

    // Enrich with days since request
    const enriched = requests.map(r => ({
      ...r,
      daysSinceRequest: Math.floor((Date.now() - new Date(r.requestedAt)) / (1000 * 60 * 60 * 24)),
      isOverdue: r.status === 'requested' && (Date.now() - new Date(r.requestedAt)) > 7 * 24 * 60 * 60 * 1000
    }));

    res.json({ requests: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/missing-invoices/:id/fulfill — seller fulfills the request
router.post('/:id/fulfill', auth, async (req, res) => {
  try {
    const { note } = req.body;

    const request = await MissingInvoiceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    request.status = 'fulfilled';
    request.sellerResponse = note || 'Invoice uploaded';
    request.fulfilledAt = new Date();
    await request.save();

    // Notify buyer
    await Notification.create({
      userId: request.buyerId,
      message: `Seller has uploaded Invoice ${request.gstr2aInvoiceData.invoiceNumber}. Please verify and approve.`,
      type: 'success'
    });

    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
