(async () => {
  const id = new URLSearchParams(location.search).get('id');
  const card = document.getElementById('invoiceCard');
  if (!id) { card.innerHTML = '<p>Invoice ID is missing.</p>'; return; }
  try {
    const { invoice } = await GymApi.request(`/api/invoices/${encodeURIComponent(id)}`);
    card.innerHTML = `
      <div class="invoice-head"><div><span class="eyebrow">GYM ARENA – KJU</span><h1>Invoice</h1></div><div><strong>${GymApi.escapeHtml(invoice.invoice_number)}</strong><br><small>${GymApi.dateTime(invoice.created_at)}</small></div></div>
      <div class="invoice-grid"><div><h3>Billed to</h3><p>${GymApi.escapeHtml(invoice.full_name)}<br>${GymApi.escapeHtml(invoice.username)}</p></div><div><h3>Details</h3><p>Type: ${GymApi.escapeHtml(invoice.invoice_type)}<br>Reference: #${invoice.reference_id}</p></div></div>
      <hr><p>${GymApi.escapeHtml(invoice.description)}</p><div class="invoice-total">${invoice.coin_amount} coins</div>
      <p class="muted">This invoice records a Gym Arena internal coin transaction.</p>`;
  } catch (error) { card.innerHTML = `<p>${GymApi.escapeHtml(error.message)}</p>`; }
})();
