const express = require('express');
const { listUsers, getUserById, updateUserRole, updateUserStatus } = require('../models/userModel');
const { authMiddleware, requiresRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(authMiddleware);

router.get('/', requiresRole(['admin', 'analyst', 'viewer']), async (req, res) => {
  const users = await listUsers();
  res.json({ users });
});

router.patch(
  '/:id/role',
  requiresRole(['admin']),
  validate([{ name: 'role', required: true, validate: (v) => ['viewer', 'analyst', 'admin'].includes(v) }]),
  async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const target = await getUserById(id);
    if (!target) return res.status(404).json({ error: 'User not found' });
    await updateUserRole(id, role);
    res.json({ message: 'Role updated', id, role });
  }
);

router.patch(
  '/:id/status',
  requiresRole(['admin']),
  validate([{ name: 'status', required: true, validate: (v) => ['active', 'inactive'].includes(v) }]),
  async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const target = await getUserById(id);
    if (!target) return res.status(404).json({ error: 'User not found' });
    await updateUserStatus(id, status);
    res.json({ message: 'Status updated', id, status });
  }
);

module.exports = router;
