const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireReadyUser } = require('../middleware/auth');
const { invoiceNumber } = require('../utils/invoice');

const router = express.Router();
router.use(requireAuth, requireReadyUser);

router.get('/products', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, description, coin_price, stock_qty, image_url
       FROM products WHERE active=1 ORDER BY name`
    );
    res.json({ products: rows });
  } catch (error) { next(error); }
});

router.post('/orders', async (req, res, next) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!items.length) return res.status(400).json({ error: 'Your cart is empty.' });

  const normalized = [];
  for (const item of items) {
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);
    if (!Number.isInteger(productId) || !Number.isInteger(quantity) || productId <= 0 || quantity <= 0 || quantity > 20) {
      return res.status(400).json({ error: 'Cart contains an invalid product or quantity.' });
    }
    normalized.push({ productId, quantity });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    let total = 0;
    const lockedItems = [];

    for (const item of normalized) {
      const [rows] = await connection.query(
        'SELECT id, name, coin_price, stock_qty FROM products WHERE id=? AND active=1 FOR UPDATE',
        [item.productId]
      );
      if (!rows.length) {
        await connection.rollback();
        return res.status(404).json({ error: `Product ${item.productId} is not available.` });
      }
      const product = rows[0];
      if (product.stock_qty < item.quantity) {
        await connection.rollback();
        return res.status(400).json({ error: `Not enough stock for ${product.name}.` });
      }
      total += product.coin_price * item.quantity;
      lockedItems.push({ ...product, quantity: item.quantity });
    }

    const [walletRows] = await connection.query(
      'SELECT balance FROM wallets WHERE user_id=? FOR UPDATE',
      [req.user.id]
    );
    if ((walletRows[0]?.balance || 0) < total) {
      await connection.rollback();
      return res.status(400).json({ error: 'Not enough coins to complete this purchase.' });
    }

    const [orderResult] = await connection.query(
      "INSERT INTO orders (user_id, total_coins, status) VALUES (?, ?, 'PAID')",
      [req.user.id, total]
    );
    for (const item of lockedItems) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_coin_price)
         VALUES (?, ?, ?, ?)`,
        [orderResult.insertId, item.id, item.quantity, item.coin_price]
      );
      await connection.query(
        'UPDATE products SET stock_qty=stock_qty-? WHERE id=?',
        [item.quantity, item.id]
      );
    }

    await connection.query('UPDATE wallets SET balance=balance-? WHERE user_id=?', [total, req.user.id]);
    await connection.query(
      `INSERT INTO wallet_transactions (user_id, transaction_type, amount, reason, created_by)
       VALUES (?, 'DEBIT', ?, ?, NULL)`,
      [req.user.id, total, `Shop purchase order #${orderResult.insertId}`]
    );

    const number = invoiceNumber('SHOP');
    await connection.query(
      `INSERT INTO invoices
       (invoice_number, user_id, invoice_type, reference_id, coin_amount, description)
       VALUES (?, ?, 'PURCHASE', ?, ?, ?)`,
      [number, req.user.id, orderResult.insertId, total, `Gym Arena shop order #${orderResult.insertId}`]
    );

    await connection.commit();
    res.status(201).json({
      message: 'Purchase completed.',
      orderId: orderResult.insertId,
      totalCoins: total,
      invoiceNumber: number
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally { connection.release(); }
});

router.get('/orders', async (req, res, next) => {
  try {
    const [orders] = await pool.query(
      `SELECT id, total_coins, status, created_at FROM orders
       WHERE user_id=? ORDER BY created_at DESC`,
      [req.user.id]
    );
    for (const order of orders) {
      const [items] = await pool.query(
        `SELECT oi.quantity, oi.unit_coin_price, p.name
         FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?`,
        [order.id]
      );
      order.items = items;
    }
    res.json({ orders });
  } catch (error) { next(error); }
});

module.exports = router;
