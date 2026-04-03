async function main() {
  const url = 'http://localhost:4000/auth/login';
  const payload = { username: 'admin', password: 'admin123' };

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const txt = await resp.text();
    console.log('status', resp.status);
    console.log('body', txt);
    if (resp.status !== 200) {
      process.exit(1);
    }

    const json = JSON.parse(txt);
    const token = json.token;
    console.log('token', token);

    if (!token) {
      throw new Error('No token');
    }

    // create record
    const recordResp = await fetch('http://localhost:4000/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount: 100, type: 'income', category: 'test', date: '2026-04-02', note: 'unit test' }),
    });
    console.log('record status', recordResp.status);
    console.log('record body', await recordResp.text());

    // summary
    const sumResp = await fetch('http://localhost:4000/dashboard/summary', {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('summary status', sumResp.status);
    console.log('summary body', await sumResp.text());

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
