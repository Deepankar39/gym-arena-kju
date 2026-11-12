const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { normalizeUsername, validCollegeUsername } = require('../utils/validation');

const router = express.Router();

function setSessionCookie(res, user) {
  const token = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  res.cookie('ga_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: String(process.env.COOKIE_SECURE).toLowerCase() === 'true',
    maxAge: 8 * 60 * 60 * 1000
  });
}

router.post('/register', async (req, res, next) => {
  const username = normalizeUsername(req.body.username);
  const fullName = String(req.body.fullName || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();

  if (!validCollegeUsername(username)) {
    return res.status(400).json({
      error: 'Username must follow the college format, for example 26MCAD14.'
    });
  }
  if (fullName.length < 2 || fullName.length > 100) {
    return res.status(400).json({ error: 'Please enter a valid full name.' });
  }
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.query(
      'SELECT id FROM users WHERE username = ? LIMIT 1',
      [username]
    );
    if (existing.length) {
      await connection.rollback();
      return res.status(409).json({ error: 'This college username is already registered.' });
    }

    const passwordHash = await bcrypt.hash(username, 12);
    const [result] = await connection.query(
      `INSERT INTO users
       (username, password_hash, full_name, email, role, account_status, must_change_password)
       VALUES (?, ?, ?, ?, 'USER', 'PENDING', 1)`,
      [username, passwordHash, fullName, email || null]
    );
    await connection.query(
      'INSERT INTO wallets (user_id, balance) VALUES (?, 0)',
      [result.insertId]
    );
    await connection.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
       VALUES (?, 'REGISTER', 'USER', ?, ?)`,
      [result.insertId, result.insertId, `Registration submitted by ${username}`]
    );
    await connection.commit();

    res.status(201).json({
      message: 'Registration submitted. An admin must approve your account before login.',
      initialPassword: username
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const username = normalizeUsername(req.body.username);
    const password = String(req.body.password || '');
    const portal = String(req.body.portal || '').trim().toUpperCase();

    if (portal && !['MEMBER', 'ADMIN'].includes(portal)) {
      return res.status(400).json({ error: 'Invalid login portal.' });
    }

    const [rows] = await pool.query(
      `SELECT id, username, password_hash, full_name, role, account_status, must_change_password
       FROM users WHERE username = ? LIMIT 1`,
      [username]
    );
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = rows[0];
    if (user.account_status === 'PENDING') {
      return res.status(403).json({ error: 'Your account is waiting for admin approval.' });
    }
    if (user.account_status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Your account is not active.' });
    }

    if (portal === 'ADMIN' && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'This account is not authorized for the administrator portal.' });
    }
    if (portal === 'MEMBER' && user.role !== 'USER') {
      return res.status(403).json({ error: 'Administrators must use the administrator login.' });
    }

    setSessionCookie(res, user);
    res.json({
      message: 'Login successful.',
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
        mustChangePassword: Boolean(user.must_change_password)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const [walletRows] = await pool.query(
      'SELECT balance FROM wallets WHERE user_id = ?',
      [req.user.id]
    );
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        fullName: req.user.full_name,
        role: req.user.role,
        mustChangePassword: Boolean(req.user.must_change_password),
        coinBalance: walletRows[0]?.balance || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must contain at least 8 characters.' });
    }
    if (newPassword.toUpperCase() === req.user.username.toUpperCase()) {
      return res.status(400).json({ error: 'New password must be different from your username.' });
    }

    const [rows] = await pool.query(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length || !(await bcrypt.compare(currentPassword, rows[0].password_hash))) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?',
      [passwordHash, req.user.id]
    );
    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('ga_token', { httpOnly: true, sameSite: 'lax' });
  res.json({ message: 'Logged out.' });
});

module.exports = router;
