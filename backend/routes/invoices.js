const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireReadyUser } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireReadyUser);

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, invoice_number, invoice_type, reference_id, coin_amount, description, created_at
       FROM invoices WHERE user_id=? ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ invoices: rows });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT i.id, i.invoice_number, i.invoice_type, i.reference_id, i.coin_amount,
              i.description, i.created_at, u.username, u.full_name
       FROM invoices i JOIN users u ON u.id=i.user_id
       WHERE i.id=? AND i.user_id=? LIMIT 1`,
      [Number(req.params.id), req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Invoice not found.' });
    res.json({ invoice: rows[0] });
  } catch (error) { next(error); }
});

module.exports = router;
