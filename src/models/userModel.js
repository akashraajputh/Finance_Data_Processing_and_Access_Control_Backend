const { run, get, all } = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // In production, use env var

async function initUserTable() {
  await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
}

async function createUser({ username, password, role = 'viewer', status = 'active' }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const result = await run(
    'INSERT INTO users (username, password_hash, role, status) VALUES (?, ?, ?, ?)',
    [username, passwordHash, role, status]
  );
  return getUserById(result.id);
}

function getUserById(id) {
  return get('SELECT id, username, role, status, created_at FROM users WHERE id = ?', [id]);
}

function getUserByUsername(username) {
  return get('SELECT * FROM users WHERE username = ?', [username]);
}

function listUsers() {
  return all('SELECT id, username, role, status FROM users');
}

function updateUserRole(id, newRole) {
  return run('UPDATE users SET role = ? WHERE id = ?', [newRole, id]);
}

function updateUserStatus(id, status) {
  return run('UPDATE users SET status = ? WHERE id = ?', [status, id]);
}

async function generateToken(user) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = {
  initUserTable,
  createUser,
  getUserById,
  getUserByUsername,
  listUsers,
  updateUserRole,
  updateUserStatus,
  generateToken,
  verifyToken
};
