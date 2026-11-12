const { request, escapeHtml, date, dateTime, toast, logout } = GymApi;
const state = { me: null, summary: null, equipment: [], connections: [], orders: [], cart: new Map() };

function tag(text, type = '') { return `<span class="tag ${type}">${escapeHtml(text)}</span>`; }
function table(headers, rows) {
  return `<table class="table"><thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.join('') : `<tr><td colspan="${headers.length}" class="muted">No records found.</td></tr>`}</tbody></table>`;
}
function connectionTag(status, incoming = false) {
  const label = status === 'ACCEPTED' ? 'Connected' : status === 'PENDING' ? (incoming ? 'Needs response' : 'Request sent') : status === 'REJECTED' ? 'Rejected' : status;
  const type = status === 'ACCEPTED' ? 'ok' : status === 'PENDING' ? 'warn' : status === 'REJECTED' ? 'bad' : '';
  return tag(label, type);
}
function safeImageUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value, location.origin);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch (_) { return ''; }
}
function paymentStatus(order) { return order.status === 'PAID' ? 'PAID' : 'CANCELLED'; }
function setView(name) {
  document.querySelectorAll('.app-view').forEach(v => v.classList.toggle('active', v.id === `view-${name}`));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === name));
}

document.querySelectorAll('.nav-item').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => setView(b.dataset.go)));
document.getElementById('logoutBtn').addEventListener('click', logout);

async function loadMe() {
  const data = await request('/api/auth/me');
  state.me = data.user;
  if (data.user.mustChangePassword) return location.href = '/change-password.html';
  if (data.user.role === 'ADMIN') return location.href = '/admin.html';
  document.getElementById('welcomeTitle').textContent = `Welcome, ${data.user.fullName}`;
  document.getElementById('coinBalance').textContent = data.user.coinBalance;
}

async function loadSummary() {
  const data = await request('/api/member/summary');
  state.summary = data;
  document.getElementById('coinBalance').textContent = data.coinBalance;
  document.getElementById('overviewCoins').textContent = data.coinBalance;

  const m = data.membership;
  document.getElementById('overviewMembership').textContent = m?.current_status || 'NONE';
  document.getElementById('overviewMembershipEnd').textContent = m ? `Ends ${date(m.end_date)}` : 'No membership yet';
  document.getElementById('membershipCurrent').innerHTML = m
    ? `<p><strong>${escapeHtml(m.plan_name)}</strong> ${tag(m.current_status, m.current_status === 'ACTIVE' ? 'ok' : 'bad')}</p><p>Valid: ${date(m.start_date)} → ${date(m.end_date)}</p>`
    : '<p class="muted">No membership has been activated yet.</p>';

  document.getElementById('planSelect').innerHTML = data.plans.map(p => `<option value="${p.id}">${escapeHtml(p.name)} — ${p.monthly_coin_price} coins</option>`).join('');
  document.getElementById('recentAttendance').innerHTML = data.recentAttendance.length
    ? data.recentAttendance.map(a => `<div class="list-item attendance-item"><div><span class="muted label-small">CHECK IN</span><strong>${dateTime(a.check_in_at)}</strong></div><div><span class="muted label-small">CHECK OUT</span><strong>${a.check_out_at ? dateTime(a.check_out_at) : 'Still checked in'}</strong></div></div>`).join('')
    : '<p class="muted">No attendance records yet.</p>';
}

async function loadWallet() {
  const { transactions } = await request('/api/member/wallet-transactions');
  document.getElementById('walletTransactions').innerHTML = table(
    ['Type', 'Coins', 'Reason', 'Date'],
    transactions.map(t => `<tr><td>${tag(t.transaction_type, t.transaction_type === 'CREDIT' ? 'ok' : 'warn')}</td><td>${t.amount}</td><td>${escapeHtml(t.reason)}</td><td>${dateTime(t.created_at)}</td></tr>`)
  );
}

document.getElementById('renewForm').addEventListener('submit', async e => {
  e.preventDefault();
  const out = document.getElementById('renewMessage');
  try {
    const data = await request('/api/member/renew-membership', { method: 'POST', body: { planId: Number(document.getElementById('planSelect').value) } });
    out.textContent = `${data.message} Invoice ${data.invoiceNumber}`; out.className = 'form-message success';
    await Promise.all([loadMe(), loadSummary(), loadWallet(), loadInvoices()]);
  } catch (error) { out.textContent = error.message; out.className = 'form-message error'; }
});

async function loadEquipment() {
  const data = await request('/api/equipment');
  state.equipment = data.equipment;
  document.getElementById('equipmentGrid').innerHTML = data.equipment.map(e => `
    <article class="data-card"><div class="row"><h3>${escapeHtml(e.name)}</h3>${tag(e.status, e.status === 'AVAILABLE' ? 'ok' : 'warn')}</div>
      <p>${escapeHtml(e.description || 'Gym equipment')}</p>
      <strong>Current/Future bookings</strong>
      ${e.bookings.length ? e.bookings.map(b => `<div class="list-item top-gap"><strong>${escapeHtml(b.bookedBy)} (${escapeHtml(b.username)})</strong><p>${date(b.startDate)} → ${date(b.endDate)} · ${b.days} day(s)</p></div>`).join('') : '<p class="muted">No active bookings.</p>'}
    </article>`).join('');
  document.getElementById('equipmentSelect').innerHTML = data.equipment.filter(e => e.status === 'AVAILABLE').map(e => `<option value="${e.id}">${escapeHtml(e.name)}</option>`).join('');
}

async function loadMyBookings() {
  const { bookings } = await request('/api/equipment/mine');
  const active = bookings.filter(b => b.status === 'BOOKED' && new Date(b.end_date) >= new Date(new Date().toDateString())).length;
  document.getElementById('overviewBookings').textContent = active;
  document.getElementById('myBookings').innerHTML = table(['Equipment', 'Dates', 'Days', 'Status', 'Action'], bookings.map(b => `<tr><td>${escapeHtml(b.equipment_name)}</td><td>${date(b.start_date)} → ${date(b.end_date)}</td><td>${b.days}</td><td>${tag(b.status, b.status === 'BOOKED' ? 'ok' : '')}</td><td>${b.status === 'BOOKED' ? `<button class="btn danger small cancel-booking" data-id="${b.id}">Cancel</button>` : '—'}</td></tr>`));
}

document.getElementById('equipmentForm').addEventListener('submit', async e => {
  e.preventDefault(); const out = document.getElementById('equipmentMessage');
  try {
    await request('/api/equipment/book', { method: 'POST', body: { equipmentId: Number(document.getElementById('equipmentSelect').value), startDate: document.getElementById('equipmentStart').value, endDate: document.getElementById('equipmentEnd').value } });
    out.textContent = 'Equipment booked.'; out.className = 'form-message success';
    await Promise.all([loadEquipment(), loadMyBookings()]);
  } catch (error) { out.textContent = error.message; out.className = 'form-message error'; }
});
document.getElementById('myBookings').addEventListener('click', async e => {
  const b = e.target.closest('.cancel-booking'); if (!b) return;
  try { await request(`/api/equipment/${b.dataset.id}/cancel`, { method: 'POST' }); toast('Booking cancelled.'); await Promise.all([loadEquipment(), loadMyBookings()]); } catch (error) { toast(error.message, true); }
});

async function loadConnections() {
  const [{ members }, connectionData, sessionsData] = await Promise.all([
    request('/api/connections/members'), request('/api/connections'), request('/api/connections/workout-sessions')
  ]);
  state.connections = connectionData.connections;
  const directoryMembers = members.filter(m => m.id !== state.me.id);
  const acceptedIds = new Set();
  connectionData.connections.filter(c => c.status === 'ACCEPTED').forEach(c => acceptedIds.add(c.requester_id === state.me.id ? c.addressee_id : c.requester_id));
  document.getElementById('overviewConnections').textContent = acceptedIds.size;

  document.getElementById('memberDirectory').innerHTML = directoryMembers.length ? directoryMembers.map(m => {
    const existing = connectionData.connections.find(c => c.requester_id === m.id || c.addressee_id === m.id);
    const incoming = existing ? existing.addressee_id === state.me.id : false;
    return `<div class="list-item"><div class="row"><div><strong>${escapeHtml(m.full_name)}</strong><p>${escapeHtml(m.username)}</p></div>${existing ? connectionTag(existing.status, incoming) : `<button class="btn primary small connect-btn" data-id="${m.id}">Connect</button>`}</div></div>`;
  }).join('') : '<p class="muted">No other active members.</p>';

  document.getElementById('connectionsList').innerHTML = connectionData.connections.length ? connectionData.connections.map(c => {
    const incoming = c.addressee_id === state.me.id;
    const other = c.requester_id === state.me.id ? `${c.addressee_name} (${c.addressee_username})` : `${c.requester_name} (${c.requester_username})`;
    const direction = c.status === 'ACCEPTED' ? 'Workout connection' : incoming ? 'Incoming request' : 'Outgoing request';
    return `<div class="list-item"><div class="row"><div><strong>${escapeHtml(other)}</strong><p>${direction}</p></div>${incoming && c.status === 'PENDING' ? `<div class="table-actions"><button class="btn primary small respond-connection" data-id="${c.id}" data-action="ACCEPT">Accept</button><button class="btn danger small respond-connection" data-id="${c.id}" data-action="REJECT">Reject</button></div>` : connectionTag(c.status, incoming)}</div></div>`;
  }).join('') : '<p class="muted">No connection requests yet.</p>';

  const acceptedMembers = directoryMembers.filter(m => acceptedIds.has(m.id));
  document.getElementById('workoutPartner').innerHTML = acceptedMembers.length
    ? acceptedMembers.map(m => `<option value="${m.id}">${escapeHtml(m.full_name)} (${escapeHtml(m.username)})</option>`).join('')
    : '<option value="">Connect with a member first</option>';
  document.getElementById('workoutSessions').innerHTML = sessionsData.sessions.length ? sessionsData.sessions.map(s => `<div class="list-item"><strong>${escapeHtml(s.creator_name)} + ${escapeHtml(s.partner_name)}</strong><p>${dateTime(s.scheduled_at)} · ${escapeHtml(s.status)}${s.notes ? ` · ${escapeHtml(s.notes)}` : ''}</p></div>`).join('') : '<p class="muted">No workout sessions planned.</p>';
}

document.getElementById('memberDirectory').addEventListener('click', async e => {
  const b = e.target.closest('.connect-btn'); if (!b) return;
  try { await request('/api/connections/request', { method: 'POST', body: { userId: Number(b.dataset.id) } }); toast('Connection request sent.'); await loadConnections(); } catch (error) { toast(error.message, true); }
});
document.getElementById('connectionsList').addEventListener('click', async e => {
  const b = e.target.closest('.respond-connection'); if (!b) return;
  try { await request(`/api/connections/${b.dataset.id}/respond`, { method: 'POST', body: { action: b.dataset.action } }); toast('Connection updated.'); await loadConnections(); } catch (error) { toast(error.message, true); }
});
document.getElementById('workoutSessionForm').addEventListener('submit', async e => {
  e.preventDefault();
  try { await request('/api/connections/workout-sessions', { method: 'POST', body: { partnerId: Number(document.getElementById('workoutPartner').value), scheduledAt: document.getElementById('workoutDateTime').value.replace('T', ' '), notes: document.getElementById('workoutNotes').value } }); toast('Workout planned.'); e.target.reset(); await loadConnections(); } catch (error) { toast(error.message, true); }
});

async function loadAttendance() {
  const [qr, history] = await Promise.all([request('/api/attendance/qr'), request('/api/attendance/mine')]);
  document.getElementById('memberQr').src = qr.qrDataUrl;
  document.getElementById('qrPayload').textContent = qr.payload;
  document.getElementById('attendanceHistory').innerHTML = history.attendance.length ? history.attendance.map(a => `<div class="list-item attendance-item"><div><span class="muted label-small">CHECK IN</span><strong>${dateTime(a.check_in_at)}</strong></div><div><span class="muted label-small">CHECK OUT</span><strong>${a.check_out_at ? dateTime(a.check_out_at) : 'Still checked in'}</strong></div></div>`).join('') : '<p class="muted">No attendance records yet.</p>';
}

async function loadDiet() {
  const { requests: rows } = await request('/api/diet/requests');
  document.getElementById('dietRequests').innerHTML = rows.length ? rows.map(r => `<div class="list-item"><div class="row"><strong>${escapeHtml(r.goal)}</strong>${tag(r.status, r.status === 'COMPLETED' ? 'ok' : 'warn')}</div><p>${r.height_cm} cm · ${r.weight_kg} kg · ${escapeHtml(r.food_preference || 'No preference')}</p>${r.plan_text ? `<p><strong>Plan:</strong> ${escapeHtml(r.plan_text)}</p>` : ''}</div>`).join('') : '<p class="muted">No diet requests yet.</p>';
}
document.getElementById('dietForm').addEventListener('submit', async e => {
  e.preventDefault(); const out = document.getElementById('dietMessage');
  try { await request('/api/diet/requests', { method: 'POST', body: { age:Number(document.getElementById('dietAge').value), heightCm:Number(document.getElementById('dietHeight').value), weightKg:Number(document.getElementById('dietWeight').value), goal:document.getElementById('dietGoal').value, foodPreference:document.getElementById('dietFood').value, allergies:document.getElementById('dietAllergies').value, notes:document.getElementById('dietNotes').value } }); out.textContent='Request submitted.';out.className='form-message success';e.target.reset();await loadDiet(); } catch(error){out.textContent=error.message;out.className='form-message error';}
});

async function loadShop() {
  const { products } = await request('/api/shop/products');
  document.getElementById('productGrid').innerHTML = products.length ? products.map(p => {
    const imageUrl = safeImageUrl(p.image_url);
    const image = imageUrl
      ? `<div class="product-media"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><div class="product-placeholder" hidden>GA</div></div>`
      : '<div class="product-media"><div class="product-placeholder">GA</div></div>';
    return `<article class="data-card product-card">${image}<div class="product-card-body"><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.description || 'Gym Arena product')}</p><div class="row product-meta"><strong>${p.coin_price} coins</strong><span class="muted">Stock ${p.stock_qty}</span></div><div class="form-grid three top-gap"><label>Qty<input class="product-qty" data-id="${p.id}" type="number" min="1" max="20" value="1"></label><button class="btn primary add-cart" data-id="${p.id}" data-name="${escapeHtml(p.name)}" ${p.stock_qty < 1 ? 'disabled' : ''}>${p.stock_qty < 1 ? 'Out of stock' : 'Add to cart'}</button></div></div></article>`;
  }).join('') : '<p class="muted">No products are currently available.</p>';
}

async function loadOrders() {
  const { orders } = await request('/api/shop/orders');
  state.orders = orders;
  document.getElementById('ordersList').innerHTML = table(
    ['Order ID', 'Order date', 'Products', 'Qty', 'Coins', 'Payment', 'Order status', ''],
    orders.map(o => {
      const productNames = o.items.map(i => escapeHtml(i.name)).join('<br>');
      const quantities = o.items.map(i => i.quantity).join('<br>');
      return `<tr><td><strong>#${o.id}</strong></td><td>${dateTime(o.created_at)}</td><td>${productNames || '—'}</td><td>${quantities || '—'}</td><td><strong>${o.total_coins}</strong></td><td>${tag(paymentStatus(o), o.status === 'PAID' ? 'ok' : 'bad')}</td><td>${tag(o.status, o.status === 'PAID' ? 'ok' : 'bad')}</td><td><button class="btn ghost small view-order" data-id="${o.id}">View Details</button></td></tr>`;
    })
  );
}

function showMemberOrderDetails(orderId) {
  const order = state.orders.find(o => Number(o.id) === Number(orderId));
  if (!order) return;
  document.getElementById('memberOrderDetailsTitle').textContent = `Order #${order.id}`;
  document.getElementById('memberOrderDetailsBody').innerHTML = `
    <div class="order-summary-grid">
      <div><span>Order date</span><strong>${dateTime(order.created_at)}</strong></div>
      <div><span>Total coins</span><strong>${order.total_coins}</strong></div>
      <div><span>Payment status</span>${tag(paymentStatus(order), order.status === 'PAID' ? 'ok' : 'bad')}</div>
      <div><span>Order status</span>${tag(order.status, order.status === 'PAID' ? 'ok' : 'bad')}</div>
    </div>
    <div class="table-wrap top-gap">${table(['Product', 'Quantity', 'Unit coins', 'Line total'], order.items.map(i => `<tr><td>${escapeHtml(i.name)}</td><td>${i.quantity}</td><td>${i.unit_coin_price}</td><td>${i.quantity * i.unit_coin_price}</td></tr>`))}</div>`;
  document.getElementById('memberOrderDetails').hidden = false;
  document.getElementById('memberOrderDetails').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function updateCartCount(){ document.getElementById('cartCount').textContent=[...state.cart.values()].reduce((s,x)=>s+x,0); }
document.getElementById('productGrid').addEventListener('click', e => {
  const b=e.target.closest('.add-cart'); if(!b)return; const id=Number(b.dataset.id); const input=document.querySelector(`.product-qty[data-id="${id}"]`); const qty=Math.max(1,Number(input?.value||1)); state.cart.set(id,(state.cart.get(id)||0)+qty);updateCartCount();toast(`${b.dataset.name} added to cart.`);
});
document.getElementById('checkoutBtn').addEventListener('click', async () => {
  if(!state.cart.size)return toast('Your cart is empty.',true);
  try{const data=await request('/api/shop/orders',{method:'POST',body:{items:[...state.cart].map(([productId,quantity])=>({productId,quantity}))}});state.cart.clear();updateCartCount();toast(`Purchase complete. ${data.totalCoins} coins used.`);await Promise.all([loadMe(),loadSummary(),loadWallet(),loadShop(),loadOrders(),loadInvoices()]);}catch(error){toast(error.message,true);}
});
document.getElementById('ordersList').addEventListener('click', e => {
  const button = e.target.closest('.view-order');
  if (button) showMemberOrderDetails(Number(button.dataset.id));
});
document.getElementById('closeMemberOrderDetails').addEventListener('click', () => {
  document.getElementById('memberOrderDetails').hidden = true;
});


document.getElementById('workoutPlannerForm').addEventListener('submit', async e => {
  e.preventDefault();
  const out = document.getElementById('workoutPlanResult');
  try {
    const data = await request(`/api/member/workout-plan?minutes=${encodeURIComponent(document.getElementById('plannerMinutes').value)}`);
    out.innerHTML = `<div class="list-item"><strong>${escapeHtml(data.algorithm)}</strong><p>Used ${data.totalMinutes}/${data.availableMinutes} minutes · Benefit score ${data.totalBenefit}</p></div>` +
      data.workouts.map(w => `<div class="list-item"><strong>${escapeHtml(w.name)}</strong><p>${w.minutes} minutes · benefit ${w.benefit}</p></div>`).join('');
  } catch (error) {
    out.innerHTML = `<div class="list-item"><p>${escapeHtml(error.message)}</p></div>`;
  }
});

async function loadInvoices() {
  const { invoices } = await request('/api/invoices');
  document.getElementById('invoiceList').innerHTML = table(['Invoice','Type','Coins','Description','Date',''], invoices.map(i => `<tr><td>${escapeHtml(i.invoice_number)}</td><td>${escapeHtml(i.invoice_type)}</td><td>${i.coin_amount}</td><td>${escapeHtml(i.description)}</td><td>${dateTime(i.created_at)}</td><td><a class="btn ghost small" href="/invoice.html?id=${i.id}">View</a></td></tr>`));
}

async function init() {
  try {
    await loadMe();
    await Promise.all([loadSummary(), loadWallet(), loadEquipment(), loadMyBookings(), loadConnections(), loadAttendance(), loadDiet(), loadShop(), loadOrders(), loadInvoices()]);
  } catch (error) {
    if (error.status === 401) location.href = '/member-login.html';
    else toast(error.message, true);
  }
}
init();
