const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const { parse } = require('csv-parse/sync');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');

// Multer setup — store in memory
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) cb(null, true);
    else cb(new Error('Only .xlsx, .xls, .csv files allowed'));
  }
});

// GET /api/invoices — list invoices for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const { status, source, search, page = 1, limit = 20 } = req.query;
    const query = { uploadedBy: req.user._id };
    if (status) query.status = status;
    if (source) query.source = source;
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { sellerGstin: { $regex: search, $options: 'i' } },
        { buyerGstin: { $regex: search, $options: 'i' } }
      ];
    }
    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ invoices, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/invoices — create single invoice
router.post('/', auth, async (req, res) => {
  try {
    const invoice = await Invoice.create({ ...req.body, uploadedBy: req.user._id });
    res.status(201).json({ invoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/invoices/upload — bulk upload from file
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    let records = [];

    if (ext === '.csv') {
      records = parse(req.file.buffer.toString(), {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
    } else {
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      records = xlsx.utils.sheet_to_json(sheet);
    }

    const invoices = records.map(r => ({
      invoiceNumber: r.invoiceNumber || r.invoice_number || r['Invoice Number'] || '',
      sellerGstin: (r.sellerGstin || r.seller_gstin || r['Seller GSTIN'] || '').toUpperCase(),
      buyerGstin: (r.buyerGstin || r.buyer_gstin || r['Buyer GSTIN'] || '').toUpperCase(),
      invoiceDate: new Date(r.invoiceDate || r.invoice_date || r['Invoice Date'] || Date.now()),
      taxableAmount: Number(r.taxableAmount || r.taxable_amount || r['Taxable Amount'] || 0),
      gstAmount: Number(r.gstAmount || r.gst_amount || r['GST Amount'] || 0),
      totalAmount: Number(r.totalAmount || r.total_amount || r['Total Amount'] || 0),
      hsnCode: r.hsnCode || r.hsn_code || r['HSN Code'] || '',
      source: req.body.source || 'purchase',
      status: 'pending',
      uploadedBy: req.user._id
    })).filter(inv => inv.invoiceNumber);

    if (invoices.length === 0) return res.status(400).json({ error: 'No valid invoices found in file' });

    const created = await Invoice.insertMany(invoices);

    // Create notification
    await Notification.create({
      userId: req.user._id,
      message: `${created.length} invoices uploaded successfully from ${req.file.originalname}`,
      type: 'success'
    });

    res.status(201).json({ count: created.length, invoices: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/invoices/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, uploadedBy: req.user._id });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ invoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/invoices/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, uploadedBy: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ invoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/invoices/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, uploadedBy: req.user._id });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
