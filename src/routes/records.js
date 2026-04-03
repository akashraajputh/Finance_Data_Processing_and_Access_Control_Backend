const express = require('express');
const { createRecord, listRecords, getRecordById, updateRecord, deleteRecord, countRecords } = require('../models/recordModel');
const { authMiddleware, requiresRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();
router.use(authMiddleware);
/**
 * @swagger
 * /records:
 *   post:
 *     summary: Create a new financial record
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - type
 *               - category
 *               - date
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Record created
 *       403:
 *         description: Forbidden
 *   get:
 *     summary: Get financial records with optional filters and pagination
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of records
 */
router.post(
  '/',
  requiresRole(['admin']),
  validate([
    { name: 'amount', required: true, validate: (v) => typeof v === 'number' && v >= 0 },
    { name: 'type', required: true, validate: (v) => ['income', 'expense'].includes(v) },
    { name: 'category', required: true },
    { name: 'date', required: true, validate: (v) => !Number.isNaN(Date.parse(v)) }
  ]),
  async (req, res) => {
    try {
      const record = await createRecord({ ...req.body, created_by: req.user.id });
      res.status(201).json({ record });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Unable to create record' });
    }
  }
);

router.get('/', requiresRole(['admin', 'analyst', 'viewer']), async (req, res) => {
  const filters = {
    type: req.query.type,
    category: req.query.category,
    startDate: req.query.startDate,
    endDate: req.query.endDate
  };
  const pagination = {
    limit: req.query.limit ? parseInt(req.query.limit) : null,
    offset: req.query.offset ? parseInt(req.query.offset) : null
  };
  const records = await listRecords(filters, pagination);
  const countResult = await countRecords(filters);
  res.json({ records, total: countResult.total, limit: pagination.limit, offset: pagination.offset });
});

router.get('/:id', requiresRole(['admin', 'analyst', 'viewer']), async (req, res) => {
  const record = await getRecordById(req.params.id);
  if (!record) return res.status(404).json({ error: 'Record not found' });
  res.json({ record });
});

router.put('/:id', requiresRole(['admin']), async (req, res) => {
  const id = req.params.id;
  const record = await getRecordById(id);
  if (!record) return res.status(404).json({ error: 'Record not found' });

  const allowed = ['amount', 'type', 'category', 'date', 'note'];
  const update = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  });
  if (update.type && !['income', 'expense'].includes(update.type)) {
    return res.status(400).json({ error: 'Type must be income or expense' });
  }
  if (update.date && Number.isNaN(Date.parse(update.date))) {
    return res.status(400).json({ error: 'Invalid date format' });
  }

  await updateRecord(id, update);
  const updated = await getRecordById(id);
  res.json({ record: updated });
});

router.delete('/:id', requiresRole(['admin']), async (req, res) => {
  const record = await getRecordById(req.params.id);
  if (!record) return res.status(404).json({ error: 'Record not found' });
  await deleteRecord(req.params.id);
  res.json({ message: 'Record soft-deleted' });
});

module.exports = router;
