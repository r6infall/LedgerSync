const mongoose = require('mongoose');
const Invoice = require('./models/Invoice');
require('dotenv').config();

async function testDelete() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected');
  
  // Try to delete all
  const res = await Invoice.deleteMany({});
  console.log('Deleted:', res.deletedCount);
  
  mongoose.disconnect();
}

testDelete();
