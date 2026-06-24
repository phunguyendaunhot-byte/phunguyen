document.addEventListener('DOMContentLoaded', async () => {
  const code = new URLSearchParams(location.search).get('code') || '';
  const root = document.getElementById('productRoot');
  if (!code) {
    root.innerHTML = '<div class="empty">Chưa có mã sản phẩm. Hãy quay lại trang tra cứu và nhập hoặc quét mã.</div>';
    return;
  }
  try {
    const item = await window.PN.getProductByCode(code);
    if (!item || item.active === false) {
      root.innerHTML = `<div class="empty"><h2>Không tìm thấy sản phẩm</h2><p>Mã đã quét: <strong>${window.PN.safe(code)}</strong></p><a class="btn btn-primary" href="index.html">Quay lại tra cứu</a></div>`;
      return;
    }
    document.title = `${item.name} | Phú Nguyên`;
    root.innerHTML = `
      <article class="detail-card">
        <div class="detail-image"><img src="${window.PN.safe(window.PN.resolveImage(item.image_url))}" alt="${window.PN.safe(item.name)}"></div>
        <div class="detail-info">
          <div class="detail-company">${window.PN.safe(item.company_name || window.PN.cfg.COMPANY.name)}</div>
          <h1>${window.PN.safe(item.name)}</h1>
          <div class="detail-meta">
            <span class="meta-pill"><strong>Quy cách:</strong> ${window.PN.safe(item.size)}</span>
            <span class="meta-pill"><strong>Mã:</strong> ${window.PN.safe(item.barcode)}</span>
            ${item.sku ? `<span class="meta-pill"><strong>SKU:</strong> ${window.PN.safe(item.sku)}</span>` : ''}
          </div>
          <p style="color:#6c727a;line-height:1.75">${window.PN.safe(item.description || 'Thông tin sản phẩm chính hãng do Công ty TNHH XNK Phú Nguyên phân phối.')}</p>
          <div class="detail-price">${window.PN.money(item.net_price)}</div>
          <div class="detail-market">Giá thị trường: ${window.PN.money(item.market_price)}</div>
          <div class="codes-panel">
            <div class="barcode-wrap"><svg id="barcodeSvg"></svg><p style="font-size:12px;color:#6c727a">Có thể quét mã vạch bằng ứng dụng đọc Code 128 hoặc dùng QR bên cạnh với camera điện thoại.</p></div>
            <div><div class="qr-box" id="qrBox"></div><div style="font-size:11px;text-align:center;margin-top:6px">Quét để mở lại</div></div>
          </div>
          <div class="form-actions">
            <a class="btn btn-primary" href="tel:0901239566">Gọi Mr Hưng</a>
            <a class="btn" href="index.html">Xem sản phẩm khác</a>
          </div>
        </div>
      </article>`;
    window.PN.renderBarcode(document.getElementById('barcodeSvg'), item.barcode, { height: 55, width: 2 });
    window.PN.renderQr(document.getElementById('qrBox'), window.PN.productUrl(item.barcode), 96);
  } catch (error) {
    root.innerHTML = `<div class="empty">Không tải được dữ liệu: ${window.PN.safe(error.message)}</div>`;
  }
});
