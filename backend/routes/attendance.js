const express = require('express');
const crypto = require('crypto');
const QRCode = require('qrcode');
const pool = require('../config/db');
const { requireAuth, requireReadyUser, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/qr', requireAuth, requireReadyUser, async (req, res, next) => {
  try {
    let [rows] = await pool.query('SELECT token FROM qr_tokens WHERE user_id=?', [req.user.id]);
    let token;
    if (!rows.length) {
      token = crypto.randomBytes(24).toString('hex');
      await pool.query('INSERT INTO qr_tokens (user_id, token) VALUES (?, ?)', [req.user.id, token]);
    } else {
      token = rows[0].token;
    }
    const payload = `GYMARENA:${token}`;
    const dataUrl = await QRCode.toDataURL(payload, { width: 320, margin: 2 });
    res.json({ qrDataUrl: dataUrl, payload });
  } catch (error) { next(error); }
});

router.get('/mine', requireAuth, requireReadyUser, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, check_in_at, check_out_at FROM attendance WHERE user_id=? ORDER BY check_in_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json({ attendance: rows });
  } catch (error) { next(error); }
});

router.post('/scan', requireAuth, requireReadyUser, requireAdmin, async (req, res, next) => {
  const raw = String(req.body.payload || '').trim();
  const token = raw.startsWith('GYMARENA:') ? raw.slice('GYMARENA:'.length) : raw;
  if (!token) return res.status(400).json({ error: 'QR payload is required.' });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [tokenRows] = await connection.query(
      `SELECT q.user_id, u.username, u.full_name
       FROM qr_tokens q JOIN users u ON u.id=q.user_id
       WHERE q.token=? AND u.account_status='ACTIVE' FOR UPDATE`,
      [token]
    );
    if (!tokenRows.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Invalid member QR code.' });
    }
    const member = tokenRows[0];
    const [openRows] = await connection.query(
      `SELECT id FROM attendance
       WHERE user_id=? AND check_out_at IS NULL
       ORDER BY check_in_at DESC LIMIT 1 FOR UPDATE`,
      [member.user_id]
    );
    let action;
    if (openRows.length) {
      await connection.query(
        'UPDATE attendance SET check_out_at=NOW(), checked_out_by=? WHERE id=?',
        [req.user.id, openRows[0].id]
      );
      action = 'CHECK_OUT';
    } else {
      await connection.query(
        'INSERT INTO attendance (user_id, check_in_at, checked_in_by) VALUES (?, NOW(), ?)',
        [member.user_id, req.user.id]
      );
      action = 'CHECK_IN';
    }
    await connection.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
       VALUES (?, ?, 'ATTENDANCE', ?, ?)`,
      [req.user.id, action, member.user_id, `${action} for ${member.username}`]
    );
    await connection.commit();
    res.json({ message: `${member.full_name} ${action === 'CHECK_IN' ? 'checked in' : 'checked out'} successfully.`, action, member });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally { connection.release(); }
});

module.exports = router;
