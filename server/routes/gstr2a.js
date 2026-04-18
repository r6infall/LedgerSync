const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const auth    = require('../middleware/auth');
const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');

// GET /api/gstr2a/mock
router.get('/mock', auth, async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../data/mock-gstr2a.json');
    const parsedData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    const buyerGstin = (req.user.gstin || '27AAPFU0939F1ZV').toUpperCase();

    // ─── Normalise both formats into a flat list ─────────────────────
    // Format A: flat array  [ { ctin, inum, idt, val, itms }, … ]  ← our mock
    // Format B: NIC envelope { b2b: [{ ctin, inv:[{inum,idt,val,itms}] }] }
    let flatInvoices = [];

    if (Array.isArray(parsedData)) {
      // Format A
      flatInvoices = parsedData.map(i => ({
        ctin: i.ctin || '',
        inum: i.inum || '',
        idt:  i.idt  || '',
        val:  i.val  || 0,
        itms: i.itms || [],
      }));
    } else if (parsedData.b2b && Array.isArray(parsedData.b2b)) {
      // Format B
      parsedData.b2b.forEach(s => {
        if (Array.isArray(s.inv)) {
          s.inv.forEach(i => flatInvoices.push({
            ctin: s.ctin || '',
            inum: i.inum || '',
            idt:  i.idt  || '',
            val:  i.val  || 0,
            itms: i.itms || [],
          }));
        }
      });
    }

    // ─── Parse each entry ─────────────────────────────────────────────
    const validInvoices = [];
    const errors = [];
    let totalRows = 0;

    flatInvoices.forEach(inv => {
      totalRows++;
      const sellerGst = inv.ctin.toUpperCase();
      const invNum    = inv.inum;

      // dd-mm-yyyy → JS Date
      let invoiceDate = new Date();
      if (inv.idt) {
        const p = inv.idt.split('-');
        if (p.length === 3) invoiceDate = new Date(`${p[2]}-${p[1]}-${p[0]}`);
      }

      const totalAmount = Number(inv.val || 0);
      let taxableAmt = 0, gstAmt = 0;

      if (Array.isArray(inv.itms)) {
        inv.itms.forEach(item => {
          if (item.itm_det) {
            taxableAmt += Number(item.itm_det.txval || 0);
            // NIC uses camt/samt for CGST/SGST and iamt for IGST
            gstAmt += Number(item.itm_det.iamt || 0)
                    + Number(item.itm_det.camt || 0)
                    + Number(item.itm_det.samt || 0)
                    + Number(item.itm_det.igst || 0)
                    + Number(item.itm_det.cgst || 0)
                    + Number(item.itm_det.sgst || 0);
          }
        });
      }

      // Fallback: derive from total when itms amounts are 0
      if (taxableAmt === 0 && totalAmount > 0) {
        taxableAmt = Math.round((totalAmount / 1.18) * 100) / 100;
        gstAmt     = Math.round((totalAmount - taxableAmt) * 100) / 100;
      }

      let rowValid = true, reason = '';
      if (!invNum)                          { rowValid = false; reason = 'Invoice Number is missing.'; }
      else if (!gstinRegex.test(sellerGst)) { rowValid = false; reason = `Invalid Supplier GSTIN: ${sellerGst}`; }
      else if (taxableAmt <= 0)             { rowValid = false; reason = 'Taxable amount must be positive.'; }

      if (rowValid) {
        validInvoices.push({
          invoiceNumber: invNum,
          sellerGstin:   sellerGst,
          buyerGstin,
          invoiceDate,
          taxableAmount: taxableAmt,
          gstAmount:     gstAmt,
          totalAmount:   totalAmount || (taxableAmt + gstAmt),
          hsnCode:       '',
          source:        'gstr2a',
          status:        'pending',
          uploadedBy:    req.user._id,
        });
      } else {
        errors.push({ row: totalRows, reason });
      }
    });

    // ─── Persist (replace existing GSTR-2A to avoid duplicates) ──────
    // Delete old GSTR-2A invoices for this user before inserting fresh ones
    await Invoice.deleteMany({ uploadedBy: req.user._id, source: 'gstr2a' });

    if (validInvoices.length > 0) {
      await Invoice.insertMany(validInvoices);
      await Notification.create({
        userId:  req.user._id,
        message: `${validInvoices.length} GSTR-2A invoices fetched from GST portal and synced successfully.`,
        type:    'success',
      });
    }

    res.status(200).json({
      totalRows,
      validRows:   validInvoices.length,
      invalidRows: errors.length,
      errors,
    });

  } catch (err) {
    console.error('Mock GSTR-2A error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
