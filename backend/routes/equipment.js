const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireReadyUser } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireReadyUser);

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.id, e.name, e.description, e.status,
              b.id AS booking_id, b.start_date, b.end_date, b.days,
              u.full_name AS booked_by, u.username AS booked_by_username
       FROM equipment e
       LEFT JOIN equipment_bookings b
         ON b.equipment_id=e.id
        AND b.status='BOOKED'
        AND b.end_date >= CURDATE()
       LEFT JOIN users u ON u.id=b.user_id
       WHERE e.active=1
       ORDER BY e.name, b.start_date`
    );

    const map = new Map();
    for (const row of rows) {
      if (!map.has(row.id)) {
        map.set(row.id, {
          id: row.id,
          name: row.name,
          description: row.description,
          status: row.status,
          bookings: []
        });
      }
      if (row.booking_id) {
        map.get(row.id).bookings.push({
          id: row.booking_id,
          startDate: row.start_date,
          endDate: row.end_date,
          days: row.days,
          bookedBy: row.booked_by,
          username: row.booked_by_username
        });
      }
    }
    res.json({ equipment: [...map.values()] });
  } catch (error) {
    next(error);
  }
});

router.post('/book', async (req, res, next) => {
  const equipmentId = Number(req.body.equipmentId);
  const startDate = String(req.body.startDate || '');
  const endDate = String(req.body.endDate || '');

  if (!Number.isInteger(equipmentId) || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return res.status(400).json({ error: 'Equipment and valid start/end dates are required.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [equipmentRows] = await connection.query(
      "SELECT id, name, status FROM equipment WHERE id=? AND active=1 FOR UPDATE",
      [equipmentId]
    );
    if (!equipmentRows.length || equipmentRows[0].status === 'MAINTENANCE') {
      await connection.rollback();
      return res.status(400).json({ error: 'Equipment is not available for booking.' });
    }

    const [[dateInfo]] = await connection.query(
      `SELECT DATEDIFF(?, ?) + 1 AS days,
              (? >= CURDATE()) AS start_ok,
              (? >= ?) AS end_ok`,
      [endDate, startDate, startDate, endDate, startDate]
    );
    if (!dateInfo.start_ok || !dateInfo.end_ok || dateInfo.days < 1 || dateInfo.days > 30) {
      await connection.rollback();
      return res.status(400).json({ error: 'Booking must be 1–30 days and cannot start in the past.' });
    }

    const [overlap] = await connection.query(
      `SELECT id FROM equipment_bookings
       WHERE equipment_id=? AND status='BOOKED'
         AND NOT (end_date < ? OR start_date > ?)
       LIMIT 1 FOR UPDATE`,
      [equipmentId, startDate, endDate]
    );
    if (overlap.length) {
      await connection.rollback();
      return res.status(409).json({ error: 'This equipment is already booked for the selected dates.' });
    }

    const [result] = await connection.query(
      `INSERT INTO equipment_bookings
       (equipment_id, user_id, start_date, end_date, days, status)
       VALUES (?, ?, ?, ?, ?, 'BOOKED')`,
      [equipmentId, req.user.id, startDate, endDate, dateInfo.days]
    );
    await connection.commit();
    res.status(201).json({ message: 'Equipment booked successfully.', bookingId: result.insertId });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

router.get('/mine', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.id, e.name AS equipment_name, b.start_date, b.end_date, b.days, b.status
       FROM equipment_bookings b JOIN equipment e ON e.id=b.equipment_id
       WHERE b.user_id=? ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json({ bookings: rows });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/cancel', async (req, res, next) => {
  try {
    const [result] = await pool.query(
      `UPDATE equipment_bookings
       SET status='CANCELLED'
       WHERE id=? AND user_id=? AND status='BOOKED' AND start_date >= CURDATE()`,
      [Number(req.params.id), req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Active booking not found.' });
    res.json({ message: 'Booking cancelled.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
