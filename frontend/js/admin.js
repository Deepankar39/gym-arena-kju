const { request, escapeHtml, date, dateTime, toast, logout } = GymApi;
let scanner = null;
let adminOrdersCache = [];

function tag(text, type=''){return `<span class="tag ${type}">${escapeHtml(text)}</span>`;}
function paymentStatus(order){return order.status==='PAID'?'PAID':'CANCELLED';}
function table(headers, rows){return `<table class="table"><thead><tr>${headers.map(h=>`<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.join(''):`<tr><td colspan="${headers.length}" class="muted">No records found.</td></tr>`}</tbody></table>`;}
function setView(name){document.querySelectorAll('.app-view').forEach(v=>v.classList.toggle('active',v.id===`view-${name}`));document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===name));}
document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
document.getElementById('logoutBtn').addEventListener('click',logout);

async function requireAdminUser(){
  const {user}=await request('/api/auth/me');
  if(user.mustChangePassword)return location.href='/change-password.html';
  if(user.role!=='ADMIN')return location.href='/dashboard.html';
  document.getElementById('adminName').textContent=user.fullName;
}

async function loadDashboard(){
  const {stats}=await request('/api/admin/dashboard');
  const labels=[['Users',stats.users],['Pending approvals',stats.pendingUsers],['Active memberships',stats.activeMemberships],['Checked in now',stats.checkedInNow],['Active bookings',stats.activeBookings],['Pending diet requests',stats.pendingDietRequests],['Paid orders',stats.paidOrders]];
  document.getElementById('adminMetrics').innerHTML=labels.map(([l,v])=>`<article class="metric-card"><span>${escapeHtml(l)}</span><strong>${v}</strong><small>Live database count</small></article>`).join('');
}

async function loadUsers(search=''){
  const query=search?`?q=${encodeURIComponent(search)}`:'';
  const {users}=await request(`/api/admin/users${query}`);
  document.getElementById('adminUsers').innerHTML=table(['Member ID','User','Name','Status','Coins','Password','Actions'],users.map(u=>`<tr><td><strong>#${u.id}</strong></td><td>${escapeHtml(u.username)}<br><small>${escapeHtml(u.role)}</small></td><td>${escapeHtml(u.full_name)}</td><td>${tag(u.account_status,u.account_status==='ACTIVE'?'ok':u.account_status==='PENDING'?'warn':'bad')}</td><td>${u.coin_balance}</td><td>${u.must_change_password?'Must change':'Changed'}</td><td><div class="table-actions">${u.role==='USER'?`<button class="btn primary small user-status" data-id="${u.id}" data-status="ACTIVE">Approve/Activate</button><button class="btn danger small user-status" data-id="${u.id}" data-status="SUSPENDED">Suspend</button><button class="btn ghost small coin-adjust" data-id="${u.id}" data-user="${escapeHtml(u.username)}">Coins</button>`:''}</div></td></tr>`));
}
function currentUserSearch(){return document.getElementById('adminUserSearch')?.value.trim()||'';}
document.getElementById('adminUsers').addEventListener('click',async e=>{
  const statusBtn=e.target.closest('.user-status');
  if(statusBtn){try{await request(`/api/admin/users/${statusBtn.dataset.id}/status`,{method:'POST',body:{status:statusBtn.dataset.status}});toast('User status updated.');await Promise.all([loadUsers(currentUserSearch()),loadDashboard()]);}catch(error){toast(error.message,true);}return;}
  const coinBtn=e.target.closest('.coin-adjust');
  if(coinBtn){const amount=Number(prompt(`Coin adjustment for ${coinBtn.dataset.user}. Use positive to add, negative to deduct:`));if(!Number.isInteger(amount)||amount===0)return;const reason=prompt('Reason for this coin adjustment:');if(!reason)return;try{const data=await request(`/api/admin/users/${coinBtn.dataset.id}/coins`,{method:'POST',body:{amount,reason}});toast(`New balance: ${data.balance} coins.`);await loadUsers(currentUserSearch());}catch(error){toast(error.message,true);}}
});


document.getElementById('adminUserSearchForm').addEventListener('submit',async e=>{
  e.preventDefault();
  try{await loadUsers(currentUserSearch());}catch(error){toast(error.message,true);}
});
document.getElementById('clearAdminUserSearch').addEventListener('click',async()=>{
  document.getElementById('adminUserSearch').value='';
  try{await loadUsers('');}catch(error){toast(error.message,true);}
});

async function processQr(payload){
  try{const data=await request('/api/attendance/scan',{method:'POST',body:{payload}});document.getElementById('scanResult').textContent=data.message;toast(data.message);await Promise.all([loadDashboard(),loadOperations()]);}catch(error){document.getElementById('scanResult').textContent=error.message;toast(error.message,true);}
}
document.getElementById('manualScanForm').addEventListener('submit',e=>{e.preventDefault();processQr(document.getElementById('manualQrPayload').value);});
document.getElementById('startScannerBtn').addEventListener('click',async()=>{
  if(typeof Html5Qrcode==='undefined')return toast('QR scanner library could not load. Use the manual payload field.',true);
  try{
    if(scanner){await scanner.stop().catch(()=>{});scanner.clear();scanner=null;document.getElementById('startScannerBtn').textContent='Start camera scanner';return;}
    scanner=new Html5Qrcode('qr-reader');
    await scanner.start({facingMode:'environment'},{fps:8,qrbox:{width:220,height:220}},async decoded=>{await processQr(decoded);});
    document.getElementById('startScannerBtn').textContent='Stop camera scanner';
  }catch(error){scanner=null;toast(`Camera scanner: ${error}`,true);}
});

async function loadEquipment(){
  const {equipment}=await request('/api/admin/equipment');
  document.getElementById('adminEquipment').innerHTML=equipment.map(e=>`<article class="data-card"><div class="row"><h3>${escapeHtml(e.name)}</h3>${tag(e.status,e.status==='AVAILABLE'?'ok':'warn')}</div><p>${escapeHtml(e.description||'')}</p><div class="table-actions"><button class="btn ghost small equipment-toggle" data-id="${e.id}" data-status="${e.status==='AVAILABLE'?'MAINTENANCE':'AVAILABLE'}" data-active="${e.active}">Mark ${e.status==='AVAILABLE'?'Maintenance':'Available'}</button><button class="btn ${e.active?'danger':'primary'} small equipment-active" data-id="${e.id}" data-status="${e.status}" data-active="${e.active?0:1}">${e.active?'Disable':'Enable'}</button></div></article>`).join('');
}
document.getElementById('adminEquipmentForm').addEventListener('submit',async e=>{e.preventDefault();try{await request('/api/admin/equipment',{method:'POST',body:{name:document.getElementById('adminEquipmentName').value,description:document.getElementById('adminEquipmentDescription').value}});e.target.reset();toast('Equipment added.');await loadEquipment();}catch(error){toast(error.message,true);}});
document.getElementById('adminEquipment').addEventListener('click',async e=>{const b=e.target.closest('.equipment-toggle,.equipment-active');if(!b)return;try{await request(`/api/admin/equipment/${b.dataset.id}`,{method:'PUT',body:{status:b.dataset.status,active:Number(b.dataset.active)}});toast('Equipment updated.');await loadEquipment();}catch(error){toast(error.message,true);}});

async function loadProducts(){
  const {products}=await request('/api/admin/products');
  document.getElementById('adminProducts').innerHTML=products.map(p=>`<article class="data-card"><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.description||'')}</p><p><strong>${p.coin_price} coins</strong> · Stock ${p.stock_qty} · ${p.active?'Active':'Hidden'}</p><div class="form-grid three"><label>Price<input class="product-price" data-id="${p.id}" type="number" min="0" value="${p.coin_price}"></label><label>Stock<input class="product-stock" data-id="${p.id}" type="number" min="0" value="${p.stock_qty}"></label><button class="btn ghost small product-save" data-id="${p.id}" data-active="${p.active}">Save</button><button class="btn ${p.active?'danger':'primary'} small product-toggle" data-id="${p.id}" data-active="${p.active?0:1}">${p.active?'Hide':'Show'}</button></div></article>`).join('');
}
document.getElementById('adminProductForm').addEventListener('submit',async e=>{e.preventDefault();try{await request('/api/admin/products',{method:'POST',body:{name:document.getElementById('adminProductName').value,description:document.getElementById('adminProductDescription').value,coinPrice:Number(document.getElementById('adminProductPrice').value),stockQty:Number(document.getElementById('adminProductStock').value),imageUrl:document.getElementById('adminProductImage').value}});e.target.reset();toast('Product added.');await loadProducts();}catch(error){toast(error.message,true);}});
document.getElementById('adminProducts').addEventListener('click',async e=>{const save=e.target.closest('.product-save,.product-toggle');if(!save)return;const id=save.dataset.id;const price=Number(document.querySelector(`.product-price[data-id="${id}"]`).value);const stock=Number(document.querySelector(`.product-stock[data-id="${id}"]`).value);const active=save.classList.contains('product-toggle')?Number(save.dataset.active):Number(save.dataset.active);try{await request(`/api/admin/products/${id}`,{method:'PUT',body:{coinPrice:price,stockQty:stock,active}});toast('Product updated.');await loadProducts();}catch(error){toast(error.message,true);}});

async function loadDiet(){
  const {requests}=await request('/api/admin/diet-requests');
  document.getElementById('adminDietRequests').innerHTML=requests.length?requests.map(r=>`<article class="panel"><div class="row"><div><h3>${escapeHtml(r.full_name)} · ${escapeHtml(r.username)}</h3><p>${r.age} yrs · ${r.height_cm} cm · ${r.weight_kg} kg · ${escapeHtml(r.goal)}</p></div>${tag(r.status,r.status==='COMPLETED'?'ok':'warn')}</div><p>Food: ${escapeHtml(r.food_preference||'Not specified')} · Allergies: ${escapeHtml(r.allergies||'None stated')}</p><p>${escapeHtml(r.notes||'')}</p><label>Plan / response<textarea class="diet-plan" data-id="${r.id}">${escapeHtml(r.plan_text||'')}</textarea></label><div class="table-actions top-gap"><button class="btn ghost small diet-update" data-id="${r.id}" data-status="IN_REVIEW">Mark In Review</button><button class="btn primary small diet-update" data-id="${r.id}" data-status="COMPLETED">Complete</button><button class="btn danger small diet-update" data-id="${r.id}" data-status="REJECTED">Reject</button></div></article>`).join(''):'<p class="muted">No diet requests.</p>';
}
document.getElementById('adminDietRequests').addEventListener('click',async e=>{const b=e.target.closest('.diet-update');if(!b)return;const planText=document.querySelector(`.diet-plan[data-id="${b.dataset.id}"]`).value;try{await request(`/api/admin/diet-requests/${b.dataset.id}`,{method:'PUT',body:{status:b.dataset.status,planText}});toast('Diet request updated.');await Promise.all([loadDiet(),loadDashboard()]);}catch(error){toast(error.message,true);}});

async function loadPlans(){
  const {plans}=await request('/api/admin/membership-plans');
  document.getElementById('adminPlans').innerHTML=plans.map(p=>`<article class="data-card"><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.description||'')}</p><label>Monthly coin price<input class="plan-price" data-id="${p.id}" type="number" min="0" value="${p.monthly_coin_price}"></label><div class="table-actions top-gap"><button class="btn primary small plan-save" data-id="${p.id}" data-active="${p.active}">Save price</button><button class="btn ${p.active?'danger':'ghost'} small plan-toggle" data-id="${p.id}" data-active="${p.active?0:1}">${p.active?'Disable':'Enable'}</button></div></article>`).join('');
}
document.getElementById('adminPlans').addEventListener('click',async e=>{const b=e.target.closest('.plan-save,.plan-toggle');if(!b)return;const id=b.dataset.id;const price=Number(document.querySelector(`.plan-price[data-id="${id}"]`).value);const active=b.classList.contains('plan-toggle')?Number(b.dataset.active):Number(b.dataset.active);try{await request(`/api/admin/membership-plans/${id}`,{method:'PUT',body:{monthlyCoinPrice:price,active}});toast('Membership plan updated.');await loadPlans();}catch(error){toast(error.message,true);}});

async function loadAdminOrders(search=''){
  const query=search?`?q=${encodeURIComponent(search)}`:'';
  const {orders}=await request(`/api/admin/orders${query}`);
  adminOrdersCache=orders;
  document.getElementById('adminOrders').innerHTML=table(
    ['Order','Customer','Date','Products','Coins','Payment','Order status',''],
    orders.map(o=>`<tr><td><strong>#${o.id}</strong></td><td>${escapeHtml(o.full_name)}<br><small>${escapeHtml(o.username)}${o.email?` · ${escapeHtml(o.email)}`:''}</small></td><td>${dateTime(o.created_at)}</td><td>${o.items.length?o.items.map(i=>`${escapeHtml(i.product_name)} × ${i.quantity}`).join('<br>'):'—'}</td><td><strong>${o.total_coins}</strong></td><td>${tag(paymentStatus(o),o.status==='PAID'?'ok':'bad')}</td><td>${tag(o.status,o.status==='PAID'?'ok':'bad')}</td><td><button class="btn ghost small admin-view-order" data-id="${o.id}">View Details</button></td></tr>`)
  );
}

function showAdminOrderDetails(orderId){
  const order=adminOrdersCache.find(o=>Number(o.id)===Number(orderId));
  if(!order)return;
  document.getElementById('adminOrderDetailsTitle').textContent=`Order #${order.id}`;
  document.getElementById('adminOrderDetailsBody').innerHTML=`
    <div class="order-summary-grid">
      <div><span>Customer</span><strong>${escapeHtml(order.full_name)}</strong><small>${escapeHtml(order.username)}</small></div>
      <div><span>Order date</span><strong>${dateTime(order.created_at)}</strong></div>
      <div><span>Total coins</span><strong>${order.total_coins}</strong></div>
      <div><span>Payment status</span>${tag(paymentStatus(order),order.status==='PAID'?'ok':'bad')}</div>
      <div><span>Order status</span>${tag(order.status,order.status==='PAID'?'ok':'bad')}</div>
    </div>
    <div class="table-wrap top-gap">${table(['Product','Quantity','Unit coins','Line total'],order.items.map(i=>`<tr><td>${escapeHtml(i.product_name)}</td><td>${i.quantity}</td><td>${i.unit_coin_price}</td><td>${i.quantity*i.unit_coin_price}</td></tr>`))}</div>`;
  document.getElementById('adminOrderDetails').hidden=false;
  document.getElementById('adminOrderDetails').scrollIntoView({behavior:'smooth',block:'nearest'});
}

async function loadOperations(){
  const [bookingsData,attendanceData]=await Promise.all([request('/api/admin/bookings'),request('/api/admin/attendance')]);
  document.getElementById('adminBookings').innerHTML=table(['Equipment','Member','Dates','Days','Status'],bookingsData.bookings.map(b=>`<tr><td>${escapeHtml(b.equipment_name)}</td><td>${escapeHtml(b.full_name)}<br><small>${escapeHtml(b.username)}</small></td><td>${date(b.start_date)} → ${date(b.end_date)}</td><td>${b.days}</td><td>${tag(b.status,b.status==='BOOKED'?'ok':'')}</td></tr>`));
  document.getElementById('adminAttendance').innerHTML=table(['Member','Check in','Check out'],attendanceData.attendance.map(a=>`<tr><td>${escapeHtml(a.full_name)}<br><small>${escapeHtml(a.username)}</small></td><td>${dateTime(a.check_in_at)}</td><td>${a.check_out_at?dateTime(a.check_out_at):tag('CHECKED IN','ok')}</td></tr>`));
  await loadAdminOrders(document.getElementById('adminOrderSearch')?.value.trim()||'');
}

document.getElementById('adminOrderSearchForm').addEventListener('submit',async e=>{
  e.preventDefault();
  try{await loadAdminOrders(document.getElementById('adminOrderSearch').value.trim());}catch(error){toast(error.message,true);}
});
document.getElementById('clearAdminOrderSearch').addEventListener('click',async()=>{
  document.getElementById('adminOrderSearch').value='';
  try{await loadAdminOrders('');}catch(error){toast(error.message,true);}
});
document.getElementById('adminOrders').addEventListener('click',e=>{
  const button=e.target.closest('.admin-view-order');
  if(button)showAdminOrderDetails(Number(button.dataset.id));
});
document.getElementById('closeAdminOrderDetails').addEventListener('click',()=>{
  document.getElementById('adminOrderDetails').hidden=true;
});

async function loadAudit(){
  const {logs}=await request('/api/admin/audit');
  document.getElementById('auditLog').innerHTML=table(['Time','Actor','Action','Entity','Details'],logs.map(l=>`<tr><td>${dateTime(l.created_at)}</td><td>${escapeHtml(l.actor_name||'System')}<br><small>${escapeHtml(l.actor_username||'')}</small></td><td>${escapeHtml(l.action)}</td><td>${escapeHtml(l.entity_type)} ${l.entity_id??''}</td><td>${escapeHtml(l.details||'')}</td></tr>`));
}

async function init(){
  try{await requireAdminUser();await Promise.all([loadDashboard(),loadUsers(),loadEquipment(),loadProducts(),loadDiet(),loadPlans(),loadOperations(),loadAudit()]);}
  catch(error){if(error.status===401)location.href='/admin-login.html';else toast(error.message,true);}
}
init();
