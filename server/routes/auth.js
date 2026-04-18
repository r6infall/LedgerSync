const express = require('express');
const router = express.Router();
const User = require('../models/User');
const admin = require('../firebaseAdmin');

// POST /api/auth/sync
// Called by the frontend after a successful Firebase registration
router.post('/sync', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    const { name, email, gstin, businessName } = req.body;

    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (gstin && !gstinRegex.test(gstin)) {
      return res.status(400).json({ error: "Invalid GSTIN format. Example: 27AAPFU0939F1ZV" });
    }

    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (user) {
      // Update existing
      user.name = name || user.name;
      user.gstin = gstin || user.gstin;
      user.businessName = businessName || user.businessName;
      await user.save();
    } else {
      // Create new
      user = await User.create({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email || email,
        name,
        gstin,
        businessName
      });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error('Sync Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
// Still use standard middleware to fetch current user
router.get('/me', require('../middleware/auth'), (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
