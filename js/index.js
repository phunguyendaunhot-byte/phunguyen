let allProducts = [];
let scanner = null;

function productCard(product) {
  const p = window.PN;
  return `
    <article class="product-card">
      <a class="product-image" href="product.html?code=${encodeURIComponent(product.barcode)}">
        <img src="${p.safe(p.resolveImage(product.image_url))}" alt="${p.safe(product.name)}" loading="lazy">
      </a>
      <div class="product-body">
        <div class="badge-row">
          <span class="badge">${p.safe(product.size)}</span>
          <span class="code">${p.safe(product.barcode)}</span>
        </div>
        <h3><a href="product.html?code=${encodeURIComponent(product.barcode)}">${p.safe(product.name)}</a></h3>
        <div class="price">${p.money(product.net_price)}</div>
        <div class="market-price">Giá thị trường: ${p.money(product.market_price)}</div>
        <div class="card-actions">
          <a class="btn btn-primary" href="product.html?code=${encodeURIComponent(product.barcode)}">Xem chi tiết</a>
          <button class="btn" type="button" data-copy="${p.safe(p.productUrl(product.barcode))}">Sao chép link</button>
        </div>
      </div>
    </article>`;
}

function renderProducts(rows) {
  const grid = document.getElementById('productGrid');
  if (!rows.length) {
    grid.innerHTML = '<div class="empty">Không tìm thấy sản phẩm phù hợp.</div>';
    return;
  }
  grid.innerHTML = rows.map(productCard).join('');
  grid.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        const old = btn.textContent;
        btn.textContent = 'Đã sao chép';
        setTimeout(() => btn.textContent = old, 1300);
      } catch (_) {
        prompt('Sao chép đường dẫn sau:', btn.dataset.copy);
      }
    });
  });
}

function applyFilter() {
  const keyword = document.getElementById('catalogSearch').value.trim().toLowerCase();
  const size = document.getElementById('sizeFilter').value;
  const rows = allProducts.filter(item => {
    const haystack = [item.name, item.barcode, item.sku, item.size].join(' ').toLowerCase();
    return (!keyword || haystack.includes(keyword)) && (!size || item.size === size);
  });
  renderProducts(rows);
  document.getElementById('productCount').textContent = `${rows.length} sản phẩm`;
}

function goToCode(raw) {
  const code = window.PN.normalizeCode(raw);
  if (!code) return;
  if (/^https?:\/\//i.test(code)) {
    window.location.href = code;
    return;
  }
  window.location.href = `product.html?code=${encodeURIComponent(code)}`;
}

async function startScanner() {
  const modal = document.getElementById('scanModal');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  if (scanner) return;
  scanner = new Html5Qrcode('reader');
  try {
    const cameras = await Html5Qrcode.getCameras();
    if (!cameras.length) throw new Error('Không tìm thấy camera.');
    const backCamera = cameras.find(c => /back|rear|environment/i.test(c.label)) || cameras[cameras.length - 1];
    await scanner.start(
      backCamera.id,
      { fps: 10, qrbox: { width: 270, height: 170 }, aspectRatio: 1.4 },
      decodedText => {
        closeScanner().finally(() => goToCode(decodedText));
      },
      () => {}
    );
  } catch (error) {
    document.getElementById('scanMessage').textContent = `Không mở được camera: ${error.message}. Bạn vẫn có thể nhập mã ở ô tìm kiếm.`;
  }
}

async function closeScanner() {
  document.getElementById('scanModal').classList.remove('open');
  document.body.style.overflow = '';
  if (scanner) {
    try { await scanner.stop(); } catch (_) {}
    try { await scanner.clear(); } catch (_) {}
    scanner = null;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const notice = document.getElementById('configNotice');
  if (!window.PN.isConfigured) notice.classList.add('show');

  try {
    allProducts = await window.PN.getProducts();
    renderProducts(allProducts);
    document.getElementById('productCount').textContent = `${allProducts.length} sản phẩm`;
    const sizes = [...new Set(allProducts.map(x => x.size).filter(Boolean))].sort();
    document.getElementById('sizeFilter').innerHTML = '<option value="">Tất cả quy cách</option>' + sizes.map(s => `<option>${window.PN.safe(s)}</option>`).join('');
  } catch (error) {
    document.getElementById('productGrid').innerHTML = `<div class="empty">Không tải được dữ liệu: ${window.PN.safe(error.message)}</div>`;
  }

  document.getElementById('catalogSearch').addEventListener('input', applyFilter);
  document.getElementById('sizeFilter').addEventListener('change', applyFilter);
  document.getElementById('heroSearchForm').addEventListener('submit', event => {
    event.preventDefault();
    const raw = document.getElementById('heroSearch').value.trim();
    const exact = allProducts.find(p => [p.barcode, p.sku].some(v => String(v || '').toLowerCase() === raw.toLowerCase()));
    if (exact) return goToCode(exact.barcode);
    document.getElementById('catalogSearch').value = raw;
    applyFilter();
    document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
  });

  document.querySelectorAll('[data-scan]').forEach(el => el.addEventListener('click', startScanner));
  document.getElementById('closeScan').addEventListener('click', closeScanner);
  document.getElementById('scanModal').addEventListener('click', event => {
    if (event.target.id === 'scanModal') closeScanner();
  });
});
