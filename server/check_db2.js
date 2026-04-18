require('dotenv').config();
const mongoose = require('mongoose');
const Invoice = require('./models/Invoice');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const invs = await Invoice.find({ source: 'gstr2a' }).sort({createdAt: -1}).limit(2);
  console.log(invs);
  process.exit(0);
});
