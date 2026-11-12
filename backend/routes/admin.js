const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireReadyUser, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireReadyUser, requireAdmin);

router.get('/dashboard', async (req, res, next) => {
  try {
    const [[users]] = await pool.query("SELECT COUNT(*) count FROM users WHERE role='USER'");
    const [[pending]] = await pool.query("SELECT COUNT(*) count FROM users WHERE role='USER' AND account_status='PENDING'");
    const [[activeMemberships]] = await pool.query("SELECT COUNT(*) count FROM memberships WHERE end_date>=CURDATE()");
    const [[openAttendance]] = await pool.query("SELECT COUNT(*) count FROM attendance WHERE check_out_at IS NULL");
    const [[bookings]] = await pool.query("SELECT COUNT(*) count FROM equipment_bookings WHERE status='BOOKED' AND end_date>=CURDATE()");
    const [[diet]] = await pool.query("SELECT COUNT(*) count FROM diet_requests WHERE status='PENDING'");
    const [[orders]] = await pool.query("SELECT COUNT(*) count FROM orders WHERE status='PAID'");
    res.json({
      stats: {
        users: users.count,
        pendingUsers: pending.count,
        activeMemberships: activeMemberships.count,
        checkedInNow: openAttendance.count,
        activeBookings: bookings.count,
        pendingDietRequests: diet.count,
        paidOrders: orders.count
      }
    });
  } catch (error) { next(error); }
});

router.get('/users', async (req, res, next) => {
  try {
    const search = String(req.query.q || '').trim().slice(0, 100);
    const like = `%${search}%`;
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.email, u.role, u.account_status,
              u.must_change_password, u.created_at, COALESCE(w.balance,0) coin_balance
       FROM users u LEFT JOIN wallets w ON w.user_id=u.id
       WHERE (? = '' OR CAST(u.id AS CHAR) = ? OR u.username LIKE ? OR u.full_name LIKE ?)
       ORDER BY FIELD(u.account_status,'PENDING','ACTIVE','SUSPENDED'), u.created_at DESC`,
      [search, search, like, like]
    );
    res.json({ users: rows, search });
  } catch (error) { next(error); }
});

router.post('/users/:id/status', async (req, res, next) => {
  const status = String(req.body.status || '').toUpperCase();
  if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
    return res.status(400).json({ error: 'Status must be ACTIVE or SUSPENDED.' });
  }
  try {
    const targetId = Number(req.params.id);
    if (targetId === req.user.id && status === 'SUSPENDED') {
      return res.status(400).json({ error: 'You cannot suspend your own admin account.' });
    }
    const [result] = await pool.query(
      `UPDATE users SET account_status=? WHERE id=? AND role='USER'`,
      [status, targetId]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'User not found.' });
    await pool.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
       VALUES (?, 'USER_STATUS', 'USER', ?, ?)`,
      [req.user.id, targetId, `Status changed to ${status}`]
    );
    res.json({ message: `User status changed to ${status}.` });
  } catch (error) { next(error); }
});

router.post('/users/:id/coins', async (req, res, next) => {
  const amount = Number(req.body.amount);
  const reason = String(req.body.reason || '').trim().slice(0, 255);
  if (!Number.isInteger(amount) || amount === 0 || Math.abs(amount) > 100000 || !reason) {
    return res.status(400).json({ error: 'Enter a non-zero whole coin amount and a reason.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const targetId = Number(req.params.id);
    const [walletRows] = await connection.query(
      `SELECT w.balance FROM wallets w JOIN users u ON u.id=w.user_id
       WHERE w.user_id=? AND u.role='USER' FOR UPDATE`,
      [targetId]
    );
    if (!walletRows.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'User wallet not found.' });
    }
    const newBalance = walletRows[0].balance + amount;
    if (newBalance < 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Coin adjustment would make the wallet negative.' });
    }
    await connection.query('UPDATE wallets SET balance=? WHERE user_id=?', [newBalance, targetId]);
    await connection.query(
      `INSERT INTO wallet_transactions (user_id, transaction_type, amount, reason, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [targetId, amount > 0 ? 'CREDIT' : 'DEBIT', Math.abs(amount), reason, req.user.id]
    );
    await connection.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
       VALUES (?, 'COIN_ADJUST', 'WALLET', ?, ?)`,
      [req.user.id, targetId, `${amount > 0 ? '+' : ''}${amount} coins: ${reason}`]
    );
    await connection.commit();
    res.json({ message: 'Coin balance updated.', balance: newBalance });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally { connection.release(); }
});

router.get('/equipment', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM equipment ORDER BY name');
    res.json({ equipment: rows });
  } catch (error) { next(error); }
});

router.post('/equipment', async (req, res, next) => {
  const name = String(req.body.name || '').trim();
  const description = String(req.body.description || '').trim().slice(0, 500);
  if (name.length < 2) return res.status(400).json({ error: 'Equipment name is required.' });
  try {
    const [result] = await pool.query(
      `INSERT INTO equipment (name, description, status, active)
       VALUES (?, ?, 'AVAILABLE', 1)`,
      [name, description || null]
    );
    res.status(201).json({ message: 'Equipment added.', id: result.insertId });
  } catch (error) { next(error); }
});

router.put('/equipment/:id', async (req, res, next) => {
  const status = String(req.body.status || '').toUpperCase();
  const active = Number(req.body.active);
  if (!['AVAILABLE', 'MAINTENANCE'].includes(status) || ![0, 1].includes(active)) {
    return res.status(400).json({ error: 'Valid equipment status and active value are required.' });
  }
  try {
    const [result] = await pool.query(
      'UPDATE equipment SET status=?, active=? WHERE id=?',
      [status, active, Number(req.params.id)]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Equipment not found.' });
    res.json({ message: 'Equipment updated.' });
  } catch (error) { next(error); }
});

router.get('/products', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY name');
    res.json({ products: rows });
  } catch (error) { next(error); }
});

router.post('/products', async (req, res, next) => {
  const name = String(req.body.name || '').trim();
  const description = String(req.body.description || '').trim().slice(0, 1000);
  const coinPrice = Number(req.body.coinPrice);
  const stockQty = Number(req.body.stockQty);
  const imageUrl = String(req.body.imageUrl || '').trim().slice(0, 500);
  if (name.length < 2 || !Number.isInteger(coinPrice) || coinPrice < 0 || !Number.isInteger(stockQty) || stockQty < 0) {
    return res.status(400).json({ error: 'Valid product name, coin price and stock are required.' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO products (name, description, coin_price, stock_qty, image_url, active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [name, description || null, coinPrice, stockQty, imageUrl || null]
    );
    res.status(201).json({ message: 'Product added.', id: result.insertId });
  } catch (error) { next(error); }
});

router.put('/products/:id', async (req, res, next) => {
  const coinPrice = Number(req.body.coinPrice);
  const stockQty = Number(req.body.stockQty);
  const active = Number(req.body.active);
  if (!Number.isInteger(coinPrice) || coinPrice < 0 || !Number.isInteger(stockQty) || stockQty < 0 || ![0, 1].includes(active)) {
    return res.status(400).json({ error: 'Valid coin price, stock and active value are required.' });
  }
  try {
    const [result] = await pool.query(
      'UPDATE products SET coin_price=?, stock_qty=?, active=? WHERE id=?',
      [coinPrice, stockQty, active, Number(req.params.id)]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Product not found.' });
    res.json({ message: 'Product updated.' });
  } catch (error) { next(error); }
});

router.get('/diet-requests', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.*, u.username, u.full_name
       FROM diet_requests d JOIN users u ON u.id=d.user_id
       ORDER BY FIELD(d.status,'PENDING','IN_REVIEW','COMPLETED'), d.created_at DESC`
    );
    res.json({ requests: rows });
  } catch (error) { next(error); }
});

router.put('/diet-requests/:id', async (req, res, next) => {
  const status = String(req.body.status || '').toUpperCase();
  const planText = String(req.body.planText || '').trim().slice(0, 10000);
  if (!['IN_REVIEW', 'COMPLETED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid diet request status.' });
  }
  if (status === 'COMPLETED' && planText.length < 10) {
    return res.status(400).json({ error: 'Completed requests require a diet-plan response.' });
  }
  try {
    const [result] = await pool.query(
      'UPDATE diet_requests SET status=?, plan_text=?, updated_at=NOW() WHERE id=?',
      [status, planText || null, Number(req.params.id)]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Diet request not found.' });
    res.json({ message: 'Diet request updated.' });
  } catch (error) { next(error); }
});

router.get('/membership-plans', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM membership_plans ORDER BY monthly_coin_price');
    res.json({ plans: rows });
  } catch (error) { next(error); }
});

router.put('/membership-plans/:id', async (req, res, next) => {
  const price = Number(req.body.monthlyCoinPrice);
  const active = Number(req.body.active);
  if (!Number.isInteger(price) || price < 0 || ![0, 1].includes(active)) {
    return res.status(400).json({ error: 'Valid monthly coin price and active value are required.' });
  }
  try {
    const [result] = await pool.query(
      'UPDATE membership_plans SET monthly_coin_price=?, active=? WHERE id=?',
      [price, active, Number(req.params.id)]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Membership plan not found.' });
    res.json({ message: 'Membership plan updated.' });
  } catch (error) { next(error); }
});

router.get('/attendance', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.id, a.check_in_at, a.check_out_at, u.username, u.full_name
       FROM attendance a JOIN users u ON u.id=a.user_id
       ORDER BY a.check_in_at DESC LIMIT 200`
    );
    res.json({ attendance: rows });
  } catch (error) { next(error); }
});

router.get('/bookings', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.id, b.start_date, b.end_date, b.days, b.status,
              e.name equipment_name, u.username, u.full_name
       FROM equipment_bookings b
       JOIN equipment e ON e.id=b.equipment_id
       JOIN users u ON u.id=b.user_id
       ORDER BY b.created_at DESC LIMIT 200`
    );
    res.json({ bookings: rows });
  } catch (error) { next(error); }
});

router.get('/orders', async (req, res, next) => {
  try {
    const search = String(req.query.q || '').trim().slice(0, 100);
    const like = `%${search}%`;
    const [rows] = await pool.query(
      `SELECT o.id, o.total_coins, o.status, o.created_at,
              u.id AS user_id, u.username, u.full_name, u.email
       FROM orders o
       JOIN users u ON u.id=o.user_id
       WHERE (? = '' OR CAST(o.id AS CHAR) LIKE ? OR u.username LIKE ? OR u.full_name LIKE ?)
       ORDER BY o.created_at DESC LIMIT 200`,
      [search, like, like, like]
    );

    if (rows.length) {
      const orderIds = rows.map(row => row.id);
      const [items] = await pool.query(
        `SELECT oi.order_id, oi.quantity, oi.unit_coin_price,
                p.id AS product_id, p.name AS product_name
         FROM order_items oi
         JOIN products p ON p.id=oi.product_id
         WHERE oi.order_id IN (?)
         ORDER BY oi.order_id DESC, oi.id`,
        [orderIds]
      );
      const byOrder = new Map();
      for (const item of items) {
        if (!byOrder.has(item.order_id)) byOrder.set(item.order_id, []);
        byOrder.get(item.order_id).push(item);
      }
      for (const order of rows) order.items = byOrder.get(order.id) || [];
    }

    res.json({ orders: rows, search });
  } catch (error) { next(error); }
});

router.get('/audit', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.id, a.action, a.entity_type, a.entity_id, a.details, a.created_at,
              u.username actor_username, u.full_name actor_name
       FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_user_id
       ORDER BY a.created_at DESC LIMIT 300`
    );
    res.json({ logs: rows });
  } catch (error) { next(error); }
});

module.exports = router;
