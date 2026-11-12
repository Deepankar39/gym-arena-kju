require('dotenv').config();

const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const pool = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { requireAdminPage, requireMemberPage } = require('./middleware/auth');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be set in .env and should be at least 32 characters long.');
  process.exit(1);
}

const app = express();
const PORT = Number(process.env.PORT || 3000);
const frontendDir = path.join(__dirname, '..', 'frontend');

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/public', require('./routes/public'));
app.use('/api/member', require('./routes/member'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/connections', require('./routes/connections'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/diet', require('./routes/diet'));
app.use('/api/shop', require('./routes/shop'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/admin', require('./routes/admin'));

// Protect role-specific HTML pages without changing the existing API/session model.
app.get('/dashboard.html', requireMemberPage, (req, res) => {
  res.sendFile(path.join(frontendDir, 'dashboard.html'));
});
app.get('/admin.html', requireAdminPage, (req, res) => {
  res.sendFile(path.join(frontendDir, 'admin.html'));
});

app.use(express.static(frontendDir));

app.get('/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({ message: 'Gym Arena – KJU backend and MySQL are connected.' });
  } catch (error) {
    next(error);
  }
});

app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found.' }));
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Gym Arena – KJU running at http://localhost:${PORT}`);
});

async function shutdown() {
  console.log('\nShutting down Gym Arena – KJU...');
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
