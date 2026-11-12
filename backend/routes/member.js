const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireReadyUser } = require('../middleware/auth');
const { invoiceNumber } = require('../utils/invoice');

const router = express.Router();
router.use(requireAuth, requireReadyUser);

router.get('/summary', async (req, res, next) => {
  try {
    const [[wallet]] = await pool.query(
      'SELECT balance FROM wallets WHERE user_id = ?',
      [req.user.id]
    );
    const [memberships] = await pool.query(
      `SELECT m.id, p.name AS plan_name, p.monthly_coin_price, m.start_date, m.end_date,
              CASE WHEN m.end_date >= CURDATE() THEN 'ACTIVE' ELSE 'EXPIRED' END AS current_status
       FROM memberships m
       JOIN membership_plans p ON p.id = m.plan_id
       WHERE m.user_id = ?
       ORDER BY m.end_date DESC LIMIT 1`,
      [req.user.id]
    );
    const [attendance] = await pool.query(
      `SELECT id, check_in_at, check_out_at
       FROM attendance WHERE user_id = ? ORDER BY check_in_at DESC LIMIT 5`,
      [req.user.id]
    );
    const [plans] = await pool.query(
      'SELECT id, name, monthly_coin_price, description FROM membership_plans WHERE active = 1 ORDER BY monthly_coin_price'
    );

    res.json({
      coinBalance: wallet?.balance || 0,
      membership: memberships[0] || null,
      plans,
      recentAttendance: attendance
    });
  } catch (error) {
    next(error);
  }
});

router.post('/renew-membership', async (req, res, next) => {
  const planId = Number(req.body.planId);
  if (!Number.isInteger(planId) || planId <= 0) {
    return res.status(400).json({ error: 'A valid membership plan is required.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [plans] = await connection.query(
      'SELECT id, name, monthly_coin_price FROM membership_plans WHERE id = ? AND active = 1 FOR UPDATE',
      [planId]
    );
    if (!plans.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Membership plan not found.' });
    }
    const plan = plans[0];

    const [wallets] = await connection.query(
      'SELECT balance FROM wallets WHERE user_id = ? FOR UPDATE',
      [req.user.id]
    );
    const balance = wallets[0]?.balance || 0;
    if (balance < plan.monthly_coin_price) {
      await connection.rollback();
      return res.status(400).json({ error: 'Not enough coins for membership renewal.' });
    }

    const [currentRows] = await connection.query(
      `SELECT id, end_date FROM memberships
       WHERE user_id = ? ORDER BY end_date DESC LIMIT 1 FOR UPDATE`,
      [req.user.id]
    );

    let membershipId;
    let newEndDate;
    if (currentRows.length) {
      membershipId = currentRows[0].id;
      const [dateRows] = await connection.query(
        `SELECT DATE_FORMAT(
           DATE_ADD(
             CASE WHEN ? >= CURDATE() THEN ? ELSE CURDATE() END,
             INTERVAL 1 MONTH
           ), '%Y-%m-%d'
         ) AS new_end`,
        [currentRows[0].end_date, currentRows[0].end_date]
      );
      newEndDate = dateRows[0].new_end;
      await connection.query(
        `UPDATE memberships
         SET plan_id=?, end_date=?, status='ACTIVE', last_renewal_at=NOW()
         WHERE id=?`,
        [planId, newEndDate, membershipId]
      );
    } else {
      const [dateRows] = await connection.query(
        "SELECT DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-%d') AS new_end"
      );
      newEndDate = dateRows[0].new_end;
      const [insertResult] = await connection.query(
        `INSERT INTO memberships
         (user_id, plan_id, start_date, end_date, status, last_renewal_at)
         VALUES (?, ?, CURDATE(), ?, 'ACTIVE', NOW())`,
        [req.user.id, planId, newEndDate]
      );
      membershipId = insertResult.insertId;
    }

    await connection.query(
      'UPDATE wallets SET balance = balance - ? WHERE user_id = ?',
      [plan.monthly_coin_price, req.user.id]
    );
    await connection.query(
      `INSERT INTO wallet_transactions
       (user_id, transaction_type, amount, reason, created_by)
       VALUES (?, 'DEBIT', ?, ?, NULL)`,
      [req.user.id, plan.monthly_coin_price, `Monthly membership renewal: ${plan.name}`]
    );

    const number = invoiceNumber('MEM');
    await connection.query(
      `INSERT INTO invoices
       (invoice_number, user_id, invoice_type, reference_id, coin_amount, description)
       VALUES (?, ?, 'MEMBERSHIP', ?, ?, ?)`,
      [number, req.user.id, membershipId, plan.monthly_coin_price, `${plan.name} membership renewal`]
    );

    await connection.commit();
    res.json({
      message: 'Membership renewed successfully.',
      invoiceNumber: number,
      endDate: newEndDate,
      coinsUsed: plan.monthly_coin_price
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

router.get('/wallet-transactions', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, transaction_type, amount, reason, created_at
       FROM wallet_transactions WHERE user_id=? ORDER BY created_at DESC LIMIT 100`,
      [req.user.id]
    );
    res.json({ transactions: rows });
  } catch (error) {
    next(error);
  }
});


router.get('/workout-plan', async (req, res) => {
  const minutes = Number(req.query.minutes);
  if (!Number.isInteger(minutes) || minutes < 10 || minutes > 240) {
    return res.status(400).json({ error: 'Minutes must be a whole number between 10 and 240.' });
  }

  const workouts = [
    { name: 'Warm-up', minutes: 10, benefit: 12 },
    { name: 'Treadmill', minutes: 25, benefit: 30 },
    { name: 'Strength Training', minutes: 35, benefit: 45 },
    { name: 'Cycling', minutes: 30, benefit: 36 },
    { name: 'Core Workout', minutes: 20, benefit: 26 },
    { name: 'Stretching', minutes: 15, benefit: 18 }
  ];

  const n = workouts.length;
  const dp = Array.from({ length: n + 1 }, () => Array(minutes + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let t = 0; t <= minutes; t++) {
      dp[i][t] = dp[i - 1][t];
      const w = workouts[i - 1];
      if (w.minutes <= t) {
        dp[i][t] = Math.max(dp[i][t], w.benefit + dp[i - 1][t - w.minutes]);
      }
    }
  }

  let t = minutes;
  const selected = [];
  for (let i = n; i > 0; i--) {
    if (dp[i][t] !== dp[i - 1][t]) {
      selected.push(workouts[i - 1]);
      t -= workouts[i - 1].minutes;
    }
  }
  selected.reverse();

  res.json({
    algorithm: '0/1 Knapsack Dynamic Programming',
    availableMinutes: minutes,
    totalMinutes: selected.reduce((sum, w) => sum + w.minutes, 0),
    totalBenefit: dp[n][minutes],
    workouts: selected
  });
});

module.exports = router;
