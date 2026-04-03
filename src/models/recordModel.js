const { run, get, all } = require('./db');

async function initRecordTable() {
  await run(`CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    type TEXT CHECK(type IN ('income','expense')) NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    note TEXT,
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,
    deleted_at TEXT
  )`);
}

async function createRecord(data) {
  const { amount, type, category, date, note, created_by } = data;
  const result = await run(
    'INSERT INTO records (amount, type, category, date, note, created_by) VALUES (?, ?, ?, ?, ?, ?)',
    [amount, type, category, date, note || '', created_by]
  );
  return getRecordById(result.id);
}

function getRecordById(id) {
  return get('SELECT * FROM records WHERE id = ? AND deleted_at IS NULL', [id]);
}

function listRecords(filters = {}, pagination = {}) {
  const conditions = ['deleted_at IS NULL'];
  const params = [];

  if (filters.type) {
    conditions.push('type = ?');
    params.push(filters.type);
  }
  if (filters.category) {
    conditions.push('category = ?');
    params.push(filters.category);
  }
  if (filters.startDate) {
    conditions.push('date >= ?');
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    conditions.push('date <= ?');
    params.push(filters.endDate);
  }

  let query = `SELECT * FROM records WHERE ${conditions.join(' AND ')} ORDER BY date DESC`;
  if (pagination.limit) {
    query += ' LIMIT ?';
    params.push(pagination.limit);
    if (pagination.offset) {
      query += ' OFFSET ?';
      params.push(pagination.offset);
    }
  }
  return all(query, params);
}

function countRecords(filters = {}) {
  const conditions = ['deleted_at IS NULL'];
  const params = [];

  if (filters.type) {
    conditions.push('type = ?');
    params.push(filters.type);
  }
  if (filters.category) {
    conditions.push('category = ?');
    params.push(filters.category);
  }
  if (filters.startDate) {
    conditions.push('date >= ?');
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    conditions.push('date <= ?');
    params.push(filters.endDate);
  }

  return get(`SELECT COUNT(*) as total FROM records WHERE ${conditions.join(' AND ')}`, params);
}

function updateRecord(id, data) {
  const updates = [];
  const params = [];
  const allowed = ['amount', 'type', 'category', 'date', 'note'];
  allowed.forEach((key) => {
    if (data[key] !== undefined) {
      updates.push(`${key} = ?`);
      params.push(data[key]);
    }
  });
  if (!updates.length) return Promise.resolve({ changes: 0 });
  params.push(new Date().toISOString());
  params.push(id);
  return run(`UPDATE records SET ${updates.join(', ')}, updated_at = ? WHERE id = ? AND deleted_at IS NULL`, params);
}

function deleteRecord(id) {
  return run('UPDATE records SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL', [new Date().toISOString(), id]);
}

async function computeSummary(filters = {}) {
  const records = await listRecords(filters);
  const summary = {
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
    categoryTotals: {},
    recentActivity: []
  };

  records.forEach((r) => {
    if (r.type === 'income') summary.totalIncome += r.amount;
    if (r.type === 'expense') summary.totalExpense += r.amount;

    if (!summary.categoryTotals[r.category]) summary.categoryTotals[r.category] = 0;
    summary.categoryTotals[r.category] += r.type === 'income' ? r.amount : -r.amount;
  });

  summary.netBalance = summary.totalIncome - summary.totalExpense;
  summary.recentActivity = records.slice(0, 10);

  return summary;
}

module.exports = {
  initRecordTable,
  createRecord,
  getRecordById,
  listRecords,
  updateRecord,
  deleteRecord,
  countRecords,
  computeSummary
};
