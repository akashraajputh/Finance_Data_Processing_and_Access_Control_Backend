const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const defaultDbPath = process.env.NODE_ENV === 'test'
  ? path.join(__dirname, '..', '..', 'data', 'test.db')
  : path.join(__dirname, '..', '..', 'data', 'finance.db');

// Render free dyno has no persistent disk; use /tmp for ephemeral storage there.
const dbFile = process.env.DB_PATH || (process.env.NODE_ENV === 'production' ? '/tmp/db.sqlite' : defaultDbPath);

// For /tmp or paths that are not file-based, skip directory creation.
if (!dbFile.startsWith('/tmp')) {
  const dbDir = path.dirname(dbFile);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error('SQLite open error', err);
    process.exit(1);
  } else {
    console.log('Database opened successfully at', dbFile);
  }
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = { db, run, get, all };