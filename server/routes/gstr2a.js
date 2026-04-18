const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');

// GET /api/gstr2a/mock
router.get('/mock', auth, async (req, res) => {
  try {
    // Read the mock JSON file
    const filePath = path.join(__dirname, '../data/mock-gstr2a.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const parsedData = JSON.parse(rawData);

    const validInvoices = [];
    const errors = [];
    
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    
    // Default Buyer GSTIN to user's GSTIN or the one from JSON
    const buyerGstin = (req.user.gstin || parsedData.gstin || '').toUpperCase();

    let totalRows = 0;

    // Parse the NIC format
    if (parsedData.b2b && Array.isArray(parsedData.b2b)) {
      parsedData.b2b.forEach(supplier => {
        const sellerGst = (supplier.ctin || '').toUpperCase();
        
        if (supplier.inv && Array.isArray(supplier.inv)) {
          supplier.inv.forEach((inv, index) => {
            totalRows++;
            const invNum = inv.inum || '';
            const invDateRaw = inv.idt || ''; // Format: dd-mm-yyyy
            let invoiceDate = new Date();
            if (invDateRaw) {
              const parts = invDateRaw.split('-');
              if (parts.length === 3) {
                // mm-dd-yyyy format for JS Date
                invoiceDate = new Date(`${parts[1]}-${parts[0]}-${parts[2]}`);
              }
            }

            const totalAmount = Number(inv.val || 0);
            
            // Calculate taxable and GST amounts from items
            let taxableAmt = 0;
            let gstAmt = 0;
            
            if (inv.itms && Array.isArray(inv.itms)) {
              inv.itms.forEach(item => {
                if (item.itm_det) {
                  taxableAmt += Number(item.itm_det.txval || 0);
                  gstAmt += Number(item.itm_det.igst || 0) + Number(item.itm_det.cgst || 0) + Number(item.itm_det.sgst || 0);
                }
              });
            }

            let rowValid = true;
            let reason = '';

            if (!invNum) { rowValid = false; reason = 'Invoice Number is missing.'; }
            else if (!gstinRegex.test(sellerGst)) { rowValid = false; reason = `Invalid Supplier GSTIN format: ${sellerGst}`; }
            else if (taxableAmt <= 0) { rowValid = false; reason = 'Taxable amount must be a positive number.'; }

            if (rowValid) {
              validInvoices.push({
                invoiceNumber: invNum,
                sellerGstin: sellerGst,
                buyerGstin: buyerGstin,
                invoiceDate: invoiceDate,
                taxableAmount: taxableAmt,
                gstAmount: gstAmt,
                totalAmount: totalAmount || (taxableAmt + gstAmt),
                hsnCode: '', // NIC summary format often doesn't have HSN at top level
                source: 'gstr2a',
                status: 'pending',
                uploadedBy: req.user._id
              });
            } else {
              errors.push({ row: totalRows, reason });
            }
          });
        }
      });
    }

    if (validInvoices.length > 0) {
      await Invoice.insertMany(validInvoices);
      await Notification.create({
        userId: req.user._id,
        message: `${validInvoices.length} GSTR-2A invoices fetched from portal successfully`,
        type: 'success'
      });
    }

    res.status(200).json({
      totalRows: totalRows,
      validRows: validInvoices.length,
      invalidRows: errors.length,
      errors
    });

  } catch (err) {
    console.error('Mock GSTR-2A error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
