const authMessage = document.getElementById('authMessage');
function showAuth(message, error = false) {
  if (!authMessage) return;
  authMessage.textContent = message;
  authMessage.className = `form-message ${error ? 'error' : 'success'}`;
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    showAuth('Signing in...');
    const portal = String(loginForm.dataset.portal || '').toUpperCase();
    try {
      const data = await GymApi.request('/api/auth/login', {
        method: 'POST',
        body: {
          username: document.getElementById('loginUsername').value,
          password: document.getElementById('loginPassword').value,
          portal
        }
      });
      if (data.user.mustChangePassword) location.href = '/change-password.html';
      else location.href = data.user.role === 'ADMIN' ? '/admin.html' : '/dashboard.html';
    } catch (error) {
      showAuth(error.message, true);
    }
  });
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    showAuth('Submitting registration...');
    try {
      const data = await GymApi.request('/api/auth/register', {
        method: 'POST',
        body: {
          username: document.getElementById('registerUsername').value,
          fullName: document.getElementById('registerName').value,
          email: document.getElementById('registerEmail').value
        }
      });
      showAuth(`${data.message} Initial password: ${data.initialPassword}`);
      registerForm.reset();
    } catch (error) {
      showAuth(error.message, true);
    }
  });
}

const changePasswordForm = document.getElementById('changePasswordForm');
if (changePasswordForm) {
  changePasswordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const next = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;
    if (next !== confirm) return showAuth('New passwords do not match.', true);
    try {
      await GymApi.request('/api/auth/change-password', {
        method: 'POST',
        body: {
          currentPassword: document.getElementById('currentPassword').value,
          newPassword: next
        }
      });
      const me = await GymApi.request('/api/auth/me');
      showAuth('Password changed. Redirecting...');
      setTimeout(() => {
        location.href = me.user.role === 'ADMIN' ? '/admin.html' : '/dashboard.html';
      }, 700);
    } catch (error) {
      showAuth(error.message, true);
    }
  });
}
