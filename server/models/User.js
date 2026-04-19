const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  gstin: { type: String, trim: true, uppercase: true },
  businessName: { type: String, trim: true },
  role: { type: String, enum: ['buyer', 'seller'], default: 'buyer' },
  aiSupplierRisk: { type: mongoose.Schema.Types.Mixed },
  aiForecast: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
