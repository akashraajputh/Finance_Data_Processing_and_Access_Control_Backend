const app = require('./app');
const { initUserTable } = require('./models/userModel');
const { initRecordTable } = require('./models/recordModel');

async function init() {
  await initUserTable();
  await initRecordTable();

  // seed admin user if none
  const { getUserByUsername, createUser } = require('./models/userModel');
  const admin = await getUserByUsername('admin');
  if (!admin) {
    await createUser({ username: 'admin', password: 'admin123', role: 'admin' });
    console.log('Seeded initial admin user: admin/admin123');
  }

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

init().catch((err) => {
  console.error('Initialization failed', err);
  process.exit(1);
});
