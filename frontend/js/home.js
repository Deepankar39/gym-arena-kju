(async () => {
  try {
    const data = await GymApi.request('/api/public/home');
    document.getElementById('statMembers').textContent = data.stats.activeMembers;
    document.getElementById('statEquipment').textContent = data.stats.equipment;
    document.getElementById('statProducts').textContent = data.stats.products;
  } catch (_) {
    document.getElementById('statMembers').textContent = '—';
    document.getElementById('statEquipment').textContent = '—';
    document.getElementById('statProducts').textContent = '—';
  }
})();
