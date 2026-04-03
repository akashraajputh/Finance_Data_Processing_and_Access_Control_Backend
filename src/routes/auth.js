const express = require('express');
const bcrypt = require('bcrypt');
const { createUser, getUserByUsername, generateToken } = require('../models/userModel');
const { validate } = require('../middleware/validate');

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [viewer, analyst, admin]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or username exists
 */
router.post(
  '/register',
  validate([
    { name: 'username', required: true },
    { name: 'password', required: true },
    { name: 'role', required: false }
  ]),
  async (req, res) => {
    try {
      const { username, password, role } = req.body;
      const userExists = await getUserByUsername(username);
      if (userExists) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      const user = await createUser({ username, password, role: role || 'viewer' });
      res.status(201).json({ user: { id: user.id, username: user.username, role: user.role, status: user.status } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not register user' });
    }
  }
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login',
  validate([
    { name: 'username', required: true },
    { name: 'password', required: true }
  ]),
  async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      if (user.status !== 'active') {
        return res.status(403).json({ error: 'User is inactive' });
      }

      const token = await generateToken(user);
      res.json({ token, user: { id: user.id, username: user.username, role: user.role, status: user.status } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

module.exports = router;
