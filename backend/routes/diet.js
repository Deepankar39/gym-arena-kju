const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireReadyUser } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireReadyUser);

router.post('/requests', async (req, res, next) => {
  const age = Number(req.body.age);
  const heightCm = Number(req.body.heightCm);
  const weightKg = Number(req.body.weightKg);
  const goal = String(req.body.goal || '').trim();
  const foodPreference = String(req.body.foodPreference || '').trim();
  const allergies = String(req.body.allergies || '').trim().slice(0, 500);
  const notes = String(req.body.notes || '').trim().slice(0, 1000);

  if (!Number.isInteger(age) || age < 16 || age > 100 || heightCm < 100 || heightCm > 250 || weightKg < 30 || weightKg > 300 || !goal) {
    return res.status(400).json({ error: 'Please provide valid age, height, weight and goal.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO diet_requests
       (user_id, age, height_cm, weight_kg, goal, food_preference, allergies, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [req.user.id, age, heightCm, weightKg, goal, foodPreference || null, allergies || null, notes || null]
    );
    res.status(201).json({
      message: 'Diet-plan request submitted. The gym/admin team can review and respond.',
      requestId: result.insertId
    });
  } catch (error) { next(error); }
});

router.get('/requests', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, age, height_cm, weight_kg, goal, food_preference, allergies, notes,
              status, plan_text, created_at, updated_at
       FROM diet_requests WHERE user_id=? ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ requests: rows });
  } catch (error) { next(error); }
});

module.exports = router;
