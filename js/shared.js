(function () {
  const cfg = window.APP_CONFIG || {};
  const key = cfg.SUPABASE_ANON_KEY || '';
  const isConfigured = Boolean(cfg.SUPABASE_URL && key && !key.includes('PASTE_'));
  const supabaseClient = isConfigured && window.supabase
    ? window.supabase.createClient(cfg.SUPABASE_URL, key)
    : null;

  function money(value) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0));
  }

  function safe(value) {
    return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  function resolveImage(url) {
    if (!url) return 'assets/no-image.svg';
    if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
    return new URL(url.replace(/^\//, ''), new URL('./', window.location.href)).href;
  }

  function productUrl(barcode) {
    const url = new URL('product.html', new URL('./', window.location.href));
    url.searchParams.set('code', barcode);
    return url.href;
  }

  function normalizeCode(raw) {
    const value = String(raw || '').trim();
    if (!value) return '';
    try {
      const url = new URL(value);
      return url.searchParams.get('code') || value;
    } catch (_) {
      return value;
    }
  }

  async function getProducts({ includeInactive = false } = {}) {
    if (!supabaseClient) {
      const local = JSON.parse(localStorage.getItem('pn_demo_products') || 'null');
      const rows = local || window.DEMO_PRODUCTS || [];
      return includeInactive ? rows : rows.filter(p => p.active !== false);
    }
    let query = supabaseClient.from('products').select('*').order('name').order('size');
    if (!includeInactive) query = query.eq('active', true);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async function getProductByCode(code) {
    const normalized = normalizeCode(code);
    if (!normalized) return null;
    if (!supabaseClient) {
      const rows = await getProducts({ includeInactive: true });
      return rows.find(p => String(p.barcode).toLowerCase() === normalized.toLowerCase()) || null;
    }
    const { data, error } = await supabaseClient.from('products').select('*').eq('barcode', normalized).maybeSingle();
    if (error) throw error;
    return data;
  }

  function renderBarcode(svg, value, opts = {}) {
    if (!svg || !window.JsBarcode) return;
    try {
      window.JsBarcode(svg, value, {
        format: 'CODE128',
        displayValue: true,
        height: opts.height || 42,
        width: opts.width || 1.7,
        margin: opts.margin ?? 4,
        fontSize: opts.fontSize || 12,
        background: '#ffffff',
        lineColor: '#111111'
      });
    } catch (e) {
      svg.outerHTML = `<div class="barcode-fallback">${safe(value)}</div>`;
    }
  }

  function renderQr(container, text, size = 96) {
    if (!container || !window.QRCode) return;
    container.innerHTML = '';
    new window.QRCode(container, {
      text,
      width: size,
      height: size,
      colorDark: '#111111',
      colorLight: '#ffffff',
      correctLevel: window.QRCode.CorrectLevel.M
    });
  }

  window.PN = {
    cfg, isConfigured, supabase: supabaseClient,
    money, safe, resolveImage, productUrl, normalizeCode,
    getProducts, getProductByCode, renderBarcode, renderQr
  };
})();
