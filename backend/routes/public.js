const express = require('express');
const pool = require('../config/db');
const router = express.Router();

router.get('/home', async (req, res, next) => {
  try {
    const [[members]] = await pool.query(
      "SELECT COUNT(*) AS count FROM users WHERE role='USER' AND account_status='ACTIVE'"
    );
    const [[equipment]] = await pool.query(
      "SELECT COUNT(*) AS count FROM equipment WHERE active=1"
    );
    const [[products]] = await pool.query(
      "SELECT COUNT(*) AS count FROM products WHERE active=1"
    );

    res.json({
      name: 'Gym Arena – KJU',
      tagline: 'Train. Connect. Progress.',
      stats: {
        activeMembers: members.count,
        equipment: equipment.count,
        products: products.count
      },
      services: [
        'College credential login',
        'Coin-based monthly membership',
        'Equipment booking',
        'QR check-in and check-out',
        'Member connections and workout partners',
        'Diet-plan requests',
        'Gym product store',
        'Invoices and admin management'
      ]
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
