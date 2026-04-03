const request = require('supertest');
const app = require('../app');
const { initUserTable, getUserByUsername, createUser } = require('../models/userModel');
const { initRecordTable } = require('../models/recordModel');

describe('Finance Data Processing Backend', () => {
  beforeAll(async () => {
    await initUserTable();
    await initRecordTable();
    const admin = await getUserByUsername('admin');
    if (!admin) {
      await createUser({ username: 'admin', password: 'admin123', role: 'admin' });
    }
    const viewer = await getUserByUsername('viewer');
    if (!viewer) {
      await createUser({ username: 'viewer', password: 'viewer123', role: 'viewer' });
    }
  });

  it('should login admin and get a token', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'admin', password: 'admin123' })
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ username: 'admin', role: 'admin' });
  });

  it('should create a record and read summaries', async () => {
    const loginRes = await request(app).post('/auth/login').send({ username: 'admin', password: 'admin123' });
    const token = loginRes.body.token;

    const recordRes = await request(app)
      .post('/records')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 250, type: 'income', category: 'salary', date: '2026-04-02', note: 'test salary' });

    expect(recordRes.statusCode).toBe(201);
    expect(recordRes.body.record).toMatchObject({ amount: 250, type: 'income', category: 'salary' });

    const summaryRes = await request(app)
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(summaryRes.statusCode).toBe(200);
    expect(summaryRes.body.summary).toHaveProperty('totalIncome');
    expect(summaryRes.body.summary.totalIncome).toBeGreaterThanOrEqual(250);
  });

  it('should deny viewer from creating records', async () => {
    const loginRes = await request(app).post('/auth/login').send({ username: 'viewer', password: 'viewer123' });
    const token = loginRes.body.token;

    const recordRes = await request(app)
      .post('/records')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 100, type: 'expense', category: 'food', date: '2026-04-02' });

    expect(recordRes.statusCode).toBe(403);
    expect(recordRes.body.error).toContain('Forbidden');
  });

  it('should allow viewer to read records and summaries', async () => {
    const loginRes = await request(app).post('/auth/login').send({ username: 'viewer', password: 'viewer123' });
    const token = loginRes.body.token;

    const recordsRes = await request(app)
      .get('/records')
      .set('Authorization', `Bearer ${token}`);

    expect(recordsRes.statusCode).toBe(200);
    expect(recordsRes.body).toHaveProperty('records');

    const summaryRes = await request(app)
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(summaryRes.statusCode).toBe(200);
    expect(summaryRes.body).toHaveProperty('summary');
  }, 10000);

  it('should return 401 for invalid login', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'admin', password: 'wrongpass' });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('should return 401 for missing token', async () => {
    const res = await request(app).get('/records');
    expect(res.statusCode).toBe(401);
  });
});
