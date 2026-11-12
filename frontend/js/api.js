window.GymApi = (() => {
  async function request(url, options = {}) {
    const config = { credentials: 'same-origin', ...options };
    if (config.body && typeof config.body !== 'string') {
      config.headers = { 'Content-Type': 'application/json', ...(config.headers || {}) };
      config.body = JSON.stringify(config.body);
    } else if (config.body) {
      config.headers = { 'Content-Type': 'application/json', ...(config.headers || {}) };
    }

    const response = await fetch(url, config);
    let data = {};
    try { data = await response.json(); } catch (_) {}

    if (!response.ok) {
      if (data.code === 'PASSWORD_CHANGE_REQUIRED' && !location.pathname.endsWith('/change-password.html')) {
        location.href = '/change-password.html';
      }
      const error = new Error(data.error || `Request failed (${response.status})`);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function date(value) {
    if (!value) return '—';
    const d = new Date(String(value).replace(' ', 'T'));
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
  }

  function dateTime(value) {
    if (!value) return '—';
    const d = new Date(String(value).replace(' ', 'T'));
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
  }

  function toast(message, isError = false) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.className = `toast show${isError ? ' error' : ''}`;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { el.className = 'toast'; }, 3000);
  }

  async function logout() {
    const adminContext = location.pathname.includes('admin');
    try { await request('/api/auth/logout', { method: 'POST' }); } catch (_) {}
    location.href = adminContext ? '/admin-login.html' : '/member-login.html';
  }

  return { request, escapeHtml, date, dateTime, toast, logout };
})();
