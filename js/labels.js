document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('labelGrid');
  try {
    const rows = await window.PN.getProducts();
    root.innerHTML = rows.map((p, i) => `
      <article class="label-card">
        <div>
          <img class="label-logo" src="assets/logo.png" alt="Phú Nguyên">
          <div class="label-title" style="margin-top:3mm">${window.PN.safe(p.name)}</div>
          <div style="font-size:11px;margin-top:1.5mm">Quy cách: <strong>${window.PN.safe(p.size)}</strong></div>
          <div class="label-price">${window.PN.money(p.net_price)}</div>
          <svg id="bc-${i}"></svg>
        </div>
        <div class="label-qr"><div id="qr-${i}"></div></div>
      </article>`).join('');
    rows.forEach((p, i) => {
      window.PN.renderBarcode(document.getElementById(`bc-${i}`), p.barcode, { height: 35, width: 1.35, fontSize: 10, margin: 1 });
      window.PN.renderQr(document.getElementById(`qr-${i}`), window.PN.productUrl(p.barcode), 94);
    });
    document.getElementById('labelCount').textContent = `${rows.length} tem`;
  } catch (error) {
    root.innerHTML = `<div class="empty">Không tải được tem: ${window.PN.safe(error.message)}</div>`;
  }
});
