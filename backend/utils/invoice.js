function invoiceNumber(prefix = 'INV') {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${stamp}-${random}`;
}

module.exports = { invoiceNumber };
