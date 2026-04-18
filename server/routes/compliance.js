const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ComplianceScore = require('../models/ComplianceScore');
const complianceService = require('../services/complianceService');

// GET /api/compliance/score — get latest compliance score
router.get('/score', auth, async (req, res) => {
  try {
    let score = await ComplianceScore.findOne({ userId: req.user._id }).sort({ calculatedAt: -1 });
    if (!score) {
      score = await complianceService.calculateScore(req.user._id);
    }
    res.json({ score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/compliance/recalculate — force recalculation
router.post('/recalculate', auth, async (req, res) => {
  try {
    const score = await complianceService.calculateScore(req.user._id);
    res.json({ score, message: 'Compliance score recalculated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/compliance/history — score history
router.get('/history', auth, async (req, res) => {
  try {
    const history = await ComplianceScore.find({ userId: req.user._id })
      .sort({ calculatedAt: -1 })
      .limit(12);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
