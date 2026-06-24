let adminProducts = [];
let editingId = '';

const $ = id => document.getElementById(id);

function showMessage(text, type = 'ok') {
  const box = $('adminMessage');
  box.className = `message ${type}`;
  box.textContent = text;
  box.hidden = false;
  setTimeout(() => box.hidden = true, 3500);
}

function setAuthView(loggedIn) {
  $('loginView').hidden = loggedIn || !window.PN.isConfigured;
  $('adminView').hidden = !loggedIn && window.PN.isConfigured;
  $('demoBanner').hidden = window.PN.isConfigured;
  $('logoutBtn').hidden = !window.PN.isConfigured || !loggedIn;
}

async function loadProducts() {
  adminProducts = await window.PN.getProducts({ includeInactive: true });
  renderTable();
}

function renderTable() {
  const query = $('adminSearch').value.trim().toLowerCase();
  const rows = adminProducts.filter(p => [p.name,p.barcode,p.sku,p.size].join(' ').toLowerCase().includes(query));
  $('adminCount').textContent = `${rows.length} sản phẩm`;
  $('productTableBody').innerHTML = rows.map(p => `
    <tr>
      <td><img class="thumb" src="${window.PN.safe(window.PN.resolveImage(p.image_url))}" alt=""></td>
      <td><strong>${window.PN.safe(p.name)}</strong><br><span class="code">${window.PN.safe(p.barcode)}</span></td>
      <td>${window.PN.safe(p.size)}</td>
      <td>${window.PN.money(p.market_price)}</td>
      <td><strong>${window.PN.money(p.net_price)}</strong></td>
      <td><span class="status ${p.active !== false ? 'on' : 'off'}">${p.active !== false ? 'Đang bán' : 'Ẩn'}</span></td>
      <td>
        <button class="btn" style="padding:7px 9px" data-edit="${p.id}">Sửa</button>
        <a class="btn" style="padding:7px 9px" href="product.html?code=${encodeURIComponent(p.barcode)}" target="_blank">Xem</a>
        <button class="btn btn-danger" style="padding:7px 9px" data-delete="${p.id}">Xóa</button>
      </td>
    </tr>`).join('') || '<tr><td colspan="7" style="text-align:center;padding:28px">Chưa có sản phẩm.</td></tr>';

  document.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => editProduct(btn.dataset.edit)));
  document.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => deleteProduct(btn.dataset.delete)));
}

function resetForm() {
  editingId = '';
  $('productForm').reset();
  $('active').checked = true;
  $('company_name').value = window.PN.cfg.COMPANY.name;
  $('formTitle').textContent = 'Thêm sản phẩm';
  $('saveBtn').textContent = 'Lưu sản phẩm';
  $('imagePreview').src = 'assets/no-image.svg';
}

function editProduct(id) {
  const p = adminProducts.find(x => String(x.id) === String(id));
  if (!p) return;
  editingId = p.id;
  ['barcode','sku','name','size','market_price','net_price','currency','image_url','company_name','description'].forEach(field => {
    $(field).value = p[field] ?? '';
  });
  $('active').checked = p.active !== false;
  $('formTitle').textContent = 'Chỉnh sửa sản phẩm';
  $('saveBtn').textContent = 'Cập nhật sản phẩm';
  $('imagePreview').src = window.PN.resolveImage(p.image_url);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function uploadImage(file, barcode) {
  if (!file || !window.PN.supabase) return null;
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const cleanCode = String(barcode).replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `${cleanCode}/${Date.now()}.${ext}`;
  const { error } = await window.PN.supabase.storage.from('product-images').upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  const { data } = window.PN.supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

function formPayload() {
  return {
    barcode: $('barcode').value.trim(),
    sku: $('sku').value.trim(),
    name: $('name').value.trim(),
    size: $('size').value.trim(),
    market_price: Number($('market_price').value || 0),
    net_price: Number($('net_price').value || 0),
    currency: $('currency').value || 'VND',
    image_url: $('image_url').value.trim(),
    company_name: $('company_name').value.trim() || window.PN.cfg.COMPANY.name,
    description: $('description').value.trim(),
    active: $('active').checked,
    updated_at: new Date().toISOString()
  };
}

async function saveProduct(event) {
  event.preventDefault();
  const payload = formPayload();
  if (!payload.barcode || !payload.name || !payload.size) {
    return showMessage('Vui lòng nhập mã barcode, tên sản phẩm và quy cách.', 'error');
  }
  $('saveBtn').disabled = true;
  try {
    const file = $('image_file').files[0];
    const uploaded = await uploadImage(file, payload.barcode);
    if (uploaded) payload.image_url = uploaded;

    if (window.PN.supabase) {
      let result;
      if (editingId) {
        result = await window.PN.supabase.from('products').update(payload).eq('id', editingId).select().single();
      } else {
        result = await window.PN.supabase.from('products').insert(payload).select().single();
      }
      if (result.error) throw result.error;
    } else {
      let rows = JSON.parse(localStorage.getItem('pn_demo_products') || 'null') || [...window.DEMO_PRODUCTS];
      if (editingId) {
        rows = rows.map(p => String(p.id) === String(editingId) ? { ...p, ...payload } : p);
      } else {
        rows.push({ ...payload, id: `local-${Date.now()}`, created_at: new Date().toISOString() });
      }
      localStorage.setItem('pn_demo_products', JSON.stringify(rows));
    }
    showMessage(editingId ? 'Đã cập nhật sản phẩm.' : 'Đã thêm sản phẩm.');
    resetForm();
    await loadProducts();
  } catch (error) {
    showMessage(`Không thể lưu: ${error.message}`, 'error');
  } finally {
    $('saveBtn').disabled = false;
  }
}

async function deleteProduct(id) {
  const p = adminProducts.find(x => String(x.id) === String(id));
  if (!p || !confirm(`Xóa sản phẩm “${p.name}” (${p.size})?`)) return;
  try {
    if (window.PN.supabase) {
      const { error } = await window.PN.supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    } else {
      const rows = adminProducts.filter(x => String(x.id) !== String(id));
      localStorage.setItem('pn_demo_products', JSON.stringify(rows));
    }
    showMessage('Đã xóa sản phẩm.');
    await loadProducts();
  } catch (error) {
    showMessage(`Không thể xóa: ${error.message}`, 'error');
  }
}

async function login(event) {
  event.preventDefault();
  $('loginMessage').hidden = true;
  const { error } = await window.PN.supabase.auth.signInWithPassword({
    email: $('email').value.trim(),
    password: $('password').value
  });
  if (error) {
    $('loginMessage').textContent = error.message;
    $('loginMessage').hidden = false;
  }
}

async function init() {
  $('company_name').value = window.PN.cfg.COMPANY.name;
  $('productForm').addEventListener('submit', saveProduct);
  $('resetBtn').addEventListener('click', resetForm);
  $('adminSearch').addEventListener('input', renderTable);
  $('generateCode').addEventListener('click', () => {
    const sku = $('sku').value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');
    $('barcode').value = sku ? `PN-${sku}` : `PN-${Date.now().toString().slice(-8)}`;
  });
  $('image_url').addEventListener('input', () => $('imagePreview').src = window.PN.resolveImage($('image_url').value));
  $('image_file').addEventListener('change', () => {
    const file = $('image_file').files[0];
    if (file) $('imagePreview').src = URL.createObjectURL(file);
  });
  $('loginForm').addEventListener('submit', login);
  if (window.PN.isConfigured) {
    $('logoutBtn').addEventListener('click', async () => { await window.PN.supabase.auth.signOut(); location.reload(); });
  }
  $('resetDemo').addEventListener('click', () => { localStorage.removeItem('pn_demo_products'); location.reload(); });

  if (!window.PN.isConfigured) {
    setAuthView(false);
    await loadProducts();
    return;
  }
  const { data } = await window.PN.supabase.auth.getSession();
  const loggedIn = Boolean(data.session);
  setAuthView(loggedIn);
  if (loggedIn) await loadProducts();
  window.PN.supabase.auth.onAuthStateChange(async (_event, session) => {
    setAuthView(Boolean(session));
    if (session) await loadProducts();
  });
}

document.addEventListener('DOMContentLoaded', init);
