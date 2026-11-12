const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireReadyUser } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireReadyUser);

router.get('/members', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, username, full_name
       FROM users
       WHERE role='USER' AND account_status='ACTIVE' AND id<>?
       ORDER BY full_name`,
      [req.user.id]
    );
    res.json({ members: rows });
  } catch (error) { next(error); }
});

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.requester_id, c.addressee_id, c.status, c.created_at,
              r.username AS requester_username, r.full_name AS requester_name,
              a.username AS addressee_username, a.full_name AS addressee_name
       FROM member_connections c
       JOIN users r ON r.id=c.requester_id
       JOIN users a ON a.id=c.addressee_id
       WHERE c.requester_id=? OR c.addressee_id=?
       ORDER BY c.created_at DESC`,
      [req.user.id, req.user.id]
    );
    res.json({ connections: rows });
  } catch (error) { next(error); }
});

router.post('/request', async (req, res, next) => {
  const targetId = Number(req.body.userId);
  if (!Number.isInteger(targetId) || targetId <= 0 || targetId === req.user.id) {
    return res.status(400).json({ error: 'Choose a valid member.' });
  }
  try {
    const [target] = await pool.query(
      "SELECT id FROM users WHERE id=? AND role='USER' AND account_status='ACTIVE'",
      [targetId]
    );
    if (!target.length) return res.status(404).json({ error: 'Member not found.' });

    const [existing] = await pool.query(
      `SELECT id, status FROM member_connections
       WHERE (requester_id=? AND addressee_id=?) OR (requester_id=? AND addressee_id=?) LIMIT 1`,
      [req.user.id, targetId, targetId, req.user.id]
    );
    if (existing.length) return res.status(409).json({ error: `Connection already exists with status ${existing[0].status}.` });

    const [result] = await pool.query(
      `INSERT INTO member_connections (requester_id, addressee_id, status)
       VALUES (?, ?, 'PENDING')`,
      [req.user.id, targetId]
    );
    res.status(201).json({ message: 'Connection request sent.', connectionId: result.insertId });
  } catch (error) { next(error); }
});

router.post('/:id/respond', async (req, res, next) => {
  const action = String(req.body.action || '').toUpperCase();
  if (!['ACCEPT', 'REJECT'].includes(action)) {
    return res.status(400).json({ error: 'Action must be ACCEPT or REJECT.' });
  }
  try {
    const status = action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';
    const [result] = await pool.query(
      `UPDATE member_connections SET status=?
       WHERE id=? AND addressee_id=? AND status='PENDING'`,
      [status, Number(req.params.id), req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Pending request not found.' });
    res.json({ message: `Connection ${status.toLowerCase()}.` });
  } catch (error) { next(error); }
});

router.post('/workout-sessions', async (req, res, next) => {
  const partnerId = Number(req.body.partnerId);
  const scheduledAt = String(req.body.scheduledAt || '');
  const notes = String(req.body.notes || '').trim().slice(0, 500);
  if (!Number.isInteger(partnerId) || !scheduledAt) {
    return res.status(400).json({ error: 'Partner and workout date/time are required.' });
  }
  try {
    const [connectionRows] = await pool.query(
      `SELECT id FROM member_connections
       WHERE status='ACCEPTED' AND
       ((requester_id=? AND addressee_id=?) OR (requester_id=? AND addressee_id=?)) LIMIT 1`,
      [req.user.id, partnerId, partnerId, req.user.id]
    );
    if (!connectionRows.length) {
      return res.status(403).json({ error: 'You can schedule workouts only with accepted connections.' });
    }
    const [result] = await pool.query(
      `INSERT INTO workout_sessions (creator_id, partner_id, scheduled_at, notes, status)
       VALUES (?, ?, ?, ?, 'PLANNED')`,
      [req.user.id, partnerId, scheduledAt, notes || null]
    );
    res.status(201).json({ message: 'Workout session planned.', sessionId: result.insertId });
  } catch (error) { next(error); }
});

router.get('/workout-sessions', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.id, s.scheduled_at, s.notes, s.status,
              c.full_name AS creator_name, p.full_name AS partner_name,
              c.username AS creator_username, p.username AS partner_username
       FROM workout_sessions s
       JOIN users c ON c.id=s.creator_id
       JOIN users p ON p.id=s.partner_id
       WHERE s.creator_id=? OR s.partner_id=?
       ORDER BY s.scheduled_at`,
      [req.user.id, req.user.id]
    );
    res.json({ sessions: rows });
  } catch (error) { next(error); }
});

module.exports = router;
