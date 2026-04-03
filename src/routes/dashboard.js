const express = require('express');
const { computeSummary, listRecords } = require('../models/recordModel');
const { authMiddleware, requiresRole } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/summary', requiresRole(['admin', 'analyst', 'viewer']), async (req, res) => {
  const filters = {
    type: req.query.type,
    category: req.query.category,
    startDate: req.query.startDate,
    endDate: req.query.endDate
  };
  const summary = await computeSummary(filters);
  res.json({ summary });
});

router.get('/trend', requiresRole(['admin', 'analyst', 'viewer']), async (req, res) => {
  const records = await listRecords({
    startDate: req.query.startDate,
    endDate: req.query.endDate
  });

  const byMonth = {};
  records.forEach((r) => {
    const m = new Date(r.date).toISOString().slice(0, 7);
    byMonth[m] = byMonth[m] || { income: 0, expense: 0 };
    byMonth[m][r.type] += r.amount;
  });

  const trend = Object.keys(byMonth)
    .sort()
    .map((month) => ({ month, income: byMonth[month].income, expense: byMonth[month].expense }));

  res.json({ trend });
});

module.exports = router;
