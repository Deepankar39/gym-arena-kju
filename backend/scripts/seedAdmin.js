require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function main() {
  const username = '26MCAD00';
  const fullName = 'Gym Arena Administrator';
  const passwordHash = await bcrypt.hash(username, 12);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [rows] = await connection.query('SELECT id FROM users WHERE username=? LIMIT 1', [username]);
    let userId;

    if (rows.length) {
      userId = rows[0].id;
      await connection.query(
        `UPDATE users
         SET password_hash=?, full_name=?, role='ADMIN', account_status='ACTIVE', must_change_password=1
         WHERE id=?`,
        [passwordHash, fullName, userId]
      );
    } else {
      const [result] = await connection.query(
        `INSERT INTO users
         (username, password_hash, full_name, role, account_status, must_change_password)
         VALUES (?, ?, ?, 'ADMIN', 'ACTIVE', 1)`,
        [username, passwordHash, fullName]
      );
      userId = result.insertId;
      await connection.query('INSERT INTO wallets (user_id, balance) VALUES (?, 0)', [userId]);
    }

    await connection.commit();
    console.log('Admin ready.');
    console.log(`Username: ${username}`);
    console.log(`Initial password: ${username}`);
    console.log('Change the password on first login.');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
