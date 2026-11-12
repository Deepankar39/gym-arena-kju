const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function getSessionUser(req) {
  const token = req.cookies.ga_token;
  if (!token) return null;

  const payload = jwt.verify(token, process.env.JWT_SECRET);
  const [rows] = await pool.query(
    `SELECT id, username, full_name, role, account_status, must_change_password
     FROM users WHERE id = ? LIMIT 1`,
    [payload.sub]
  );

  if (!rows.length || rows[0].account_status !== 'ACTIVE') return null;
  return rows[0];
}

async function requireAuth(req, res, next) {
  try {
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: 'Login required.' });
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }
}

function requireReadyUser(req, res, next) {
  if (req.user.must_change_password) {
    return res.status(403).json({
      error: 'You must change your initial password before using the application.',
      code: 'PASSWORD_CHANGE_REQUIRED'
    });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

function pageRoleGuard(role) {
  return async function requireRolePage(req, res, next) {
    try {
      const user = await getSessionUser(req);
      if (!user) {
        return res.redirect(role === 'ADMIN' ? '/admin-login.html' : '/member-login.html');
      }
      if (user.must_change_password) return res.redirect('/change-password.html');
      if (user.role !== role) {
        return res.redirect(user.role === 'ADMIN' ? '/admin.html' : '/dashboard.html');
      }
      req.user = user;
      next();
    } catch (_) {
      return res.redirect(role === 'ADMIN' ? '/admin-login.html' : '/member-login.html');
    }
  };
}

const requireAdminPage = pageRoleGuard('ADMIN');
const requireMemberPage = pageRoleGuard('USER');

module.exports = {
  requireAuth,
  requireReadyUser,
  requireAdmin,
  requireAdminPage,
  requireMemberPage
};
