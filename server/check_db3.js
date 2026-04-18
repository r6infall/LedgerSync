require('dotenv').config();
const mongoose = require('mongoose');
const Invoice = require('./models/Invoice');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const p = await Invoice.findOne({source: 'purchase', invoiceNumber: 'TXT/2024/001'}); 
  const g = await Invoice.findOne({source: 'gstr2a', invoiceNumber: 'TXT/2024/001'}); 
  console.log({
    pUploadedBy: p?.uploadedBy, 
    gUploadedBy: g?.uploadedBy, 
    pId: p?._id, 
    gId: g?._id, 
    pDate: p?.invoiceDate, 
    gDate: g?.invoiceDate, 
    pAmt: p?.totalAmount, 
    gAmt: g?.totalAmount
  }); 
  process.exit(0);
});
