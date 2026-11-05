/**
 * admin.js — Lógica desacoplada del Panel Administrativo de La Finestra.
 *
 * Arquitectura:
 *   - ES Module desacoplado de admin.html.
 *   - Autenticación con soporte para JWT de Supabase Auth (role: 'admin') o hash local SHA-256.
 *   - Conexión a Supabase REST API mediante config.js con cabeceras dinámicas seguras.
 */

import { SUPABASE_URL, SUPABASE_ANON } from './config.js';

// ── SANITIZADOR ANTI-XSS PARA RENDERIZADO EN DOM ─────────
function escHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const BASE_URL    = SUPABASE_URL.replace(/\/+$/, '');
const STORAGE_URL = `${BASE_URL}/storage/v1/object/public/menu-images/`;

// ── AUTENTICACIÓN Y GESTIÓN DE SESIÓN ZERO-TRUST (S-01, S-04) ──
function getHeaders() {
  const token = sessionStorage.getItem('admin_jwt') || SUPABASE_ANON;
  return {
    'apikey':        SUPABASE_ANON,
    'Authorization': `Bearer ${token}`,
    'Content-Type':  'application/json'
  };
}

function jwtRole(token) {
  try {
    const p = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(p)).app_metadata?.role ?? null;
  } catch {
    return null;
  }
}

async function refreshSession() {
  const rt = sessionStorage.getItem('admin_refresh');
  if (!rt) return false;
  try {
    const r = await fetch(`${BASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rt })
    });
    if (!r.ok) return false;
    const d = await r.json();
    sessionStorage.setItem('admin_jwt', d.access_token);
    sessionStorage.setItem('admin_refresh', d.refresh_token);
    return true;
  } catch {
    return false;
  }
}

function forceRelogin(msg = 'Tu sesión ha expirado. Por favor ingresa nuevamente.') {
  sessionStorage.removeItem('admin_jwt');
  sessionStorage.removeItem('admin_refresh');
  sessionStorage.removeItem('admin_user');
  sessionStorage.removeItem('lafinestra_admin_auth');
  const panelEl = document.getElementById('panel');
  const loginEl = document.getElementById('login-screen');
  if (panelEl) panelEl.style.display = 'none';
  if (loginEl) loginEl.style.display = 'flex';
  const errEl = document.getElementById('login-error');
  if (errEl) {
    errEl.textContent = msg;
    errEl.style.display = 'block';
  }
}

function updateBadge(identifier = '') {
  const badge = document.getElementById('admin-user-badge');
  if (!badge) return;
  badge.textContent = `● Supabase: ${identifier || 'Admin'}`;
  badge.className   = 'badge-user auth';
}

function enterPanel(identifier = '') {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('panel').style.display = 'block';
  document.getElementById('login-error').style.display = 'none';
  updateBadge(identifier);
  loadMenu();
  loadDestacados();
}

// ── AUTH (S-01: Solo Supabase Auth Real) ─────────────────
export async function doLogin() {
  const emailInput = document.getElementById('email-input');
  const pwdInput   = document.getElementById('pwd-input');
  const errorEl    = document.getElementById('login-error');
  const email      = emailInput ? emailInput.value.trim() : '';
  const password   = pwdInput ? pwdInput.value : '';

  if (errorEl) errorEl.style.display = 'none';

  if (!email || !password) {
    if (errorEl) {
      errorEl.textContent = 'Ingresa correo y contraseña';
      errorEl.style.display = 'block';
    }
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey':       SUPABASE_ANON,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const raw = await res.text();
    if (!res.ok) {
      if (errorEl) {
        errorEl.textContent = 'Credenciales incorrectas';
        errorEl.style.display = 'block';
      }
      return;
    }

    const data = JSON.parse(raw);
    const role = jwtRole(data.access_token);
    if (role !== 'admin') {
      if (errorEl) {
        errorEl.textContent = 'Acceso denegado: este usuario no es administrador';
        errorEl.style.display = 'block';
      }
      return;
    }

    sessionStorage.setItem('admin_jwt', data.access_token);
    sessionStorage.setItem('admin_refresh', data.refresh_token);
    sessionStorage.setItem('admin_user', data.user?.email || email);
    sessionStorage.setItem('lafinestra_admin_auth', '1');

    enterPanel(data.user?.email || email);
  } catch (err) {
    if (errorEl) {
      errorEl.textContent = 'Error de conexión con el servicio de autenticación';
      errorEl.style.display = 'block';
    }
  }
}

export async function logout() {
  const token = sessionStorage.getItem('admin_jwt');
  if (token && token !== SUPABASE_ANON) {
    try {
      fetch(`${BASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: getHeaders(),
        keepalive: true
      }).catch(() => {});
    } catch (_) {}
  }
  sessionStorage.removeItem('admin_jwt');
  sessionStorage.removeItem('admin_refresh');
  sessionStorage.removeItem('admin_user');
  sessionStorage.removeItem('lafinestra_admin_auth');
  document.getElementById('panel').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  const pwdInput = document.getElementById('pwd-input');
  if (pwdInput) pwdInput.value = '';
}

// ── NAVIGATION ───────────────────────────────────────────
export function switchSection(name, btn) {
  document.querySelectorAll('.section-view').forEach(s => s.classList.remove('on'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('on'));
  const targetSection = document.getElementById('section-' + name);
  if (targetSection) targetSection.classList.add('on');
  const targetTab = btn || document.querySelector(`.nav-tab[data-section="${name}"]`);
  if (targetTab) targetTab.classList.add('on');
}

// ── TOAST ────────────────────────────────────────────────
export function toast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── HELPER CENTRALIZADO REST CON VERIFICACIÓN RLS REAL (S-02, S-03b, S-04) ──
function friendlyError(status, raw) {
  let msg = raw;
  try {
    const j = JSON.parse(raw);
    msg = j.message || j.error_description || j.hint || raw;
  } catch {}
  if (status === 401) return 'Sesión no autorizada o expirada (HTTP 401)';
  if (status === 403 || /row-level security/i.test(msg)) return 'Acceso denegado (RLS): requiere rol admin';
  if (status === 409 || /duplicate key/i.test(msg)) return 'Ya existe un plato con ese nombre en esa categoría';
  return msg || `Error HTTP ${status}`;
}

async function sb(method, path, body = null, isRetry = false) {
  const headers = { ...getHeaders() };
  if (method !== 'GET') {
    headers['Prefer'] = 'return=representation'; // Exigir representación para verificar filas afectadas
  }
  const url = `${BASE_URL}/rest/v1/${path}`;
  const r = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const raw = await r.text(); // Lectura única del stream para evitar doble consumo

  if (r.status === 401 && !isRetry) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return sb(method, path, body, true);
    }
    forceRelogin('Tu sesión ha expirado');
    throw new Error('Sesión expirada');
  }

  if (!r.ok) {
    throw new Error(friendlyError(r.status, raw));
  }

  const data = raw ? JSON.parse(raw) : [];

  // En PATCH y DELETE, si devuelve array vacío significa que RLS bloqueó o no existía la fila
  if (['PATCH', 'DELETE'].includes(method) && Array.isArray(data) && data.length === 0) {
    throw new Error('No se guardó: sin permisos o el registro ya no existe');
  }

  return data;
}

const sbGet    = (table, params = '') => sb('GET', `${table}?${params}`);
const sbInsert = (table, data)        => sb('POST', table, data);
const sbUpdate = (table, id, data)    => sb('PATCH', `${table}?id=eq.${id}`, data);
const sbDelete = (table, id)          => sb('DELETE', `${table}?id=eq.${id}`);

// ── IMAGE UPLOAD CON LISTA BLANCA MIME Y LÍMITE DE PESO ──
const ALLOWED_MIME = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png':  'png'
};
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB máximo

async function uploadImage(file, folder) {
  const ext = ALLOWED_MIME[file.type];
  if (!ext) {
    throw new Error('Formato no permitido. Usa únicamente imágenes WEBP, JPG o PNG.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('La imagen supera el límite máximo de 4 MB.');
  }
  const safeFolder = String(folder).replace(/[^a-z0-9_-]/gi, '');
  const name  = `${safeFolder}/${Date.now()}.${ext}`;
  const headers = getHeaders();
  headers['Content-Type'] = file.type;
  const r = await fetch(`${BASE_URL}/storage/v1/object/menu-images/${name}`, {
    method: 'POST',
    headers,
    body: file
  });
  if (!r.ok) throw new Error('Error subiendo imagen a almacenamiento (verifica permisos de admin)');
  return name;
}

export function previewImg(input) {
  const file = input.files[0];
  if (!file) return;
  const img = document.getElementById('img-preview-item');
  img.src = URL.createObjectURL(file);
  img.style.display = 'block';
}

export function previewDestImg(input) {
  const file = input.files[0];
  if (!file) return;
  const img = document.getElementById('img-preview-dest');
  img.src = URL.createObjectURL(file);
  img.style.display = 'block';
}

// ── MENU ─────────────────────────────────────────────────
let allItems = [];

async function loadMenu() {
  try {
    allItems = await sbGet('menu_items', 'order=categoria.asc,orden.asc');
    renderStats();
    renderTable();
  } catch(e) {
    toast('Error cargando menú: ' + e.message, 'err');
  }
}

function renderStats() {
  const total   = allItems.length;
  const activos = allItems.filter(i => i.disponible).length;
  const cats    = [...new Set(allItems.map(i => i.categoria))].length;
  document.getElementById('menu-stats').innerHTML = `
    <div class="stat-card"><div class="stat-label">Total platos</div><div class="stat-value">${total}</div></div>
    <div class="stat-card"><div class="stat-label">Activos</div><div class="stat-value">${activos}</div></div>
    <div class="stat-card"><div class="stat-label">Sin imagen</div><div class="stat-value">${allItems.filter(i=>!i.img).length}</div></div>
    <div class="stat-card"><div class="stat-label">Categorías</div><div class="stat-value">${cats}</div></div>
  `;
}

export function filterTable() {
  const cat = document.getElementById('cat-filter').value;
  const q   = document.getElementById('search-input').value.toLowerCase();
  const filtered = allItems.filter(i =>
    (!cat || i.categoria === cat) &&
    (!q   || i.name.toLowerCase().includes(q) || (i.descripcion||'').toLowerCase().includes(q))
  );
  renderRows(filtered);
}

function renderTable() { renderRows(allItems); }

function renderRows(items) {
  const tbody = document.getElementById('menu-tbody');
  if (!items.length) { tbody.innerHTML = '<tr><td colspan="7" class="loading">Sin resultados</td></tr>'; return; }
  tbody.innerHTML = items.map(item => `
    <tr>
      <td>${item.img
        ? `<img class="td-img" src="${escHtml(STORAGE_URL + item.img)}" alt="">`
        : `<div class="td-img-placeholder"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`
      }</td>
      <td><div class="td-cat">${escHtml(item.categoria)}</div>${item.cat ? `<div style="font-size:11px;color:var(--muted)">${escHtml(item.cat)}</div>` : ''}</td>
      <td class="td-name">${escHtml(item.name)}</td>
      <td class="td-desc">${escHtml(item.descripcion || '')}</td>
      <td class="td-price">${escHtml(item.price)}</td>
      <td>
        <label class="toggle">
          <input type="checkbox" class="toggle-disp-item" data-id="${Number(item.id)}" ${item.disponible ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </td>
      <td>
        <div class="actions">
          <button class="act-btn" data-action="openModal" data-id="${Number(item.id)}">Editar</button>
          <button class="act-btn del" data-action="deleteItem" data-id="${Number(item.id)}">Borrar</button>
        </div>
      </td>
    </tr>`).join('');
}

export async function toggleDisponible(id, val) {
  try {
    await sbUpdate('menu_items', id, { disponible: val });
    const item = allItems.find(i => i.id === id);
    if (item) item.disponible = val;
    renderStats();
    toast(val ? 'Plato activado' : 'Plato desactivado');
  } catch(e) { toast('Error actualizando: ' + e.message, 'err'); }
}

export async function deleteItem(id) {
  const target = allItems.find(i => i.id === id);
  const name = target ? target.name : `#${id}`;
  if (!confirm(`¿Eliminar "${name}"?`)) return;
  try {
    await sbDelete('menu_items', id);
    allItems = allItems.filter(i => i.id !== id);
    renderStats(); renderTable();
    toast('Plato eliminado');
  } catch(e) { toast('Error eliminando: ' + e.message, 'err'); }
}

// ── MODAL MENU ───────────────────────────────────────────
let editingId = null;

export function openModal(id = null) {
  editingId = id;
  document.getElementById('modal-title').textContent = id ? 'Editar plato' : 'Nuevo plato';
  document.getElementById('edit-id').value = id || '';
  document.getElementById('img-preview-item').style.display = 'none';
  document.getElementById('f-img-file').value = '';
  document.getElementById('current-img-label').textContent = '';

  if (id) {
    const item = allItems.find(i => i.id === id);
    if (!item) return;
    document.getElementById('f-categoria').value  = item.categoria || 'entradas';
    document.getElementById('f-cat').value        = item.cat || '';
    document.getElementById('f-name').value       = item.name || '';
    document.getElementById('f-desc').value       = item.descripcion || '';
    document.getElementById('f-price').value      = item.price || '';
    document.getElementById('f-watext').value     = item.wa_text || '';
    document.getElementById('f-orden').value      = item.orden ?? 0;
    document.getElementById('f-disponible').value = item.disponible ? 'true' : 'false';
    if (item.img) {
      document.getElementById('current-img-label').textContent = `Imagen actual: ${item.img}`;
      document.getElementById('img-preview-item').src = STORAGE_URL + item.img;
      document.getElementById('img-preview-item').style.display = 'block';
    }
  } else {
    document.getElementById('f-categoria').value  = 'entradas';
    document.getElementById('f-cat').value        = '';
    document.getElementById('f-name').value       = '';
    document.getElementById('f-desc').value       = '';
    document.getElementById('f-price').value      = '';
    document.getElementById('f-watext').value     = '';
    document.getElementById('f-orden').value      = 0;
    document.getElementById('f-disponible').value = 'true';
  }
  document.getElementById('item-modal').classList.add('open');
}

export function closeModal() { document.getElementById('item-modal').classList.remove('open'); }

export async function saveItem() {
  const name = document.getElementById('f-name').value.trim();
  const desc = document.getElementById('f-desc').value.trim();
  const price = document.getElementById('f-price').value.trim();
  if (!name || !desc || !price) { toast('Nombre, descripción y precio son obligatorios', 'err'); return; }

  let priceUsd = 0;
  let priceMaxUsd = null;
  if (price.includes('–')) {
    const parts = price.split('–');
    priceUsd = parseFloat(parts[0].replace(/[^0-9,.]/g, '').replace(',', '.')) || 0;
    priceMaxUsd = parseFloat(parts[1].replace(/[^0-9,.]/g, '').replace(',', '.')) || null;
  } else {
    priceUsd = parseFloat(price.replace(/[^0-9,.]/g, '').replace(',', '.')) || 0;
  }
  const formattedPrice = fmtPrice(priceUsd, priceMaxUsd) || price;

  const categoria  = document.getElementById('f-categoria').value;
  const cat        = document.getElementById('f-cat').value.trim() || null;
  const wa_text    = document.getElementById('f-watext').value.trim();
  const orden      = parseInt(document.getElementById('f-orden').value) || 0;
  const disponible = document.getElementById('f-disponible').value === 'true';
  const imgFile    = document.getElementById('f-img-file').files[0];

  let imgPath = editingId ? (allItems.find(i => i.id === editingId)?.img || null) : null;

  try {
    if (imgFile) imgPath = await uploadImage(imgFile, categoria);

    const payload = {
      categoria,
      cat,
      name,
      descripcion: desc,
      price: formattedPrice,
      price_usd: priceUsd,
      price_max_usd: priceMaxUsd,
      wa_text,
      orden,
      disponible,
      img: imgPath
    };

    if (editingId) {
      try {
        await sbUpdate('menu_items', editingId, payload);
      } catch (err) {
        if (/price_usd|price_max_usd/i.test(err.message)) {
          const { price_usd, price_max_usd, ...legacyPayload } = payload;
          await sbUpdate('menu_items', editingId, legacyPayload);
        } else {
          throw err;
        }
      }
      const idx = allItems.findIndex(i => i.id === editingId);
      if (idx !== -1) allItems[idx] = { ...allItems[idx], ...payload };
      toast('Plato actualizado ✓');
    } else {
      let created;
      try {
        [created] = await sbInsert('menu_items', payload);
      } catch (err) {
        if (/price_usd|price_max_usd/i.test(err.message)) {
          const { price_usd, price_max_usd, ...legacyPayload } = payload;
          [created] = await sbInsert('menu_items', legacyPayload);
        } else {
          throw err;
        }
      }
      allItems.push(created);
      toast('Plato creado ✓');
    }

    closeModal(); renderStats(); renderTable();
  } catch(e) { toast('Error guardando: ' + e.message, 'err'); }
}

// ── HELPER DE FORMATEO DE MONEDA (D-01) ─────────────────
function fmtPrice(priceUsd, priceMaxUsd) {
  if (priceUsd === null || priceUsd === undefined) return '';
  const fmt = (n) => '$' + Number(n).toFixed(2).replace('.', ',');
  if (priceMaxUsd !== null && priceMaxUsd !== undefined && Number(priceMaxUsd) > Number(priceUsd)) {
    return `${fmt(priceUsd)} – ${fmt(priceMaxUsd)}`;
  }
  return fmt(priceUsd);
}

// ── DESTACADOS (D-02: Relacionados por Foreign Key a menu_items) ──
let allDest = [];

async function loadDestacados() {
  try {
    try {
      allDest = await sbGet('destacados', 'select=id,badge,orden,disponible,name,descripcion,price,img,wa_text,menu_item_id,menu_items(id,name,descripcion,price,price_usd,price_max_usd,img,wa_text)&order=orden.asc');
    } catch {
      allDest = await sbGet('destacados', 'order=orden.asc');
    }
    renderDestTable();
  } catch(e) {
    toast('Error cargando destacados: ' + e.message, 'err');
  }
}

function renderDestTable() {
  const tbody = document.getElementById('dest-tbody');
  if (!allDest.length) { tbody.innerHTML = '<tr><td colspan="6" class="loading">Sin destacados</td></tr>'; return; }
  tbody.innerHTML = allDest.map(d => {
    const m = d.menu_items || {};
    const imgPath = m.img || d.img;
    const name = m.name || d.name || '(Plato no encontrado)';
    const price = m.price_usd != null ? fmtPrice(m.price_usd, m.price_max_usd) : (m.price || d.price || '');
    return `
    <tr>
      <td>${imgPath
        ? `<img class="td-img" src="${escHtml(STORAGE_URL + imgPath)}" alt="">`
        : `<div class="td-img-placeholder"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`
      }</td>
      <td style="font-size:14px">${escHtml(d.badge)}</td>
      <td class="td-name">${escHtml(name)}</td>
      <td class="td-price">${escHtml(price)}</td>
      <td>
        <label class="toggle">
          <input type="checkbox" class="toggle-disp-dest" data-id="${Number(d.id)}" ${d.disponible ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </td>
      <td>
        <div class="actions">
          <button class="act-btn" data-action="openDestModal" data-id="${Number(d.id)}">Editar</button>
          <button class="act-btn del" data-action="deleteDest" data-id="${Number(d.id)}">Borrar</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

export async function toggleDest(id, val) {
  try {
    await sbUpdate('destacados', id, { disponible: val });
    const d = allDest.find(i => i.id === id);
    if (d) d.disponible = val;
    toast(val ? 'Activado' : 'Desactivado');
  } catch(e) { toast('Error: ' + e.message, 'err'); }
}

export async function deleteDest(id) {
  const target = allDest.find(d => d.id === id);
  const m = target ? (target.menu_items || {}) : {};
  const name = m.name || (target ? target.name : `#${id}`);
  if (!confirm(`¿Eliminar destacado "${name}"?`)) return;
  try {
    await sbDelete('destacados', id);
    allDest = allDest.filter(d => d.id !== id);
    renderDestTable();
    toast('Eliminado');
  } catch(e) { toast('Error eliminando: ' + e.message, 'err'); }
}

let editingDestId = null;

function populateDestItemSelect(selectedId = null) {
  const sel = document.getElementById('df-menu-item-id');
  if (!sel) return;
  sel.innerHTML = allItems.map(item => {
    const isSel = Number(selectedId) === Number(item.id) ? 'selected' : '';
    return `<option value="${Number(item.id)}" ${isSel}>${escHtml(item.name)} (${escHtml(item.categoria)} - ${escHtml(item.price)})</option>`;
  }).join('');
}

export function openDestModal(id = null) {
  editingDestId = id;
  document.getElementById('dest-modal-title').textContent = id ? 'Editar destacado' : 'Nuevo destacado';

  if (id) {
    const d = allDest.find(i => i.id === id);
    if (!d) return;
    populateDestItemSelect(d.menu_item_id);
    document.getElementById('df-badge').value      = d.badge || '';
    document.getElementById('df-orden').value      = d.orden ?? 0;
    document.getElementById('df-disponible').value = d.disponible ? 'true' : 'false';
  } else {
    populateDestItemSelect();
    document.getElementById('df-badge').value      = '⭐ Chef recomienda';
    document.getElementById('df-orden').value      = 0;
    document.getElementById('df-disponible').value = 'true';
  }
  document.getElementById('dest-modal').classList.add('open');
}

export function closeDestModal() { document.getElementById('dest-modal').classList.remove('open'); }

export async function saveDestacado() {
  const menuItemId = Number(document.getElementById('df-menu-item-id').value);
  const badge      = document.getElementById('df-badge').value.trim();
  const orden      = parseInt(document.getElementById('df-orden').value) || 0;
  const disponible = document.getElementById('df-disponible').value === 'true';

  if (!menuItemId || !badge) {
    toast('Selecciona un plato y define la etiqueta/badge', 'err');
    return;
  }

  const targetItem = allItems.find(i => i.id === menuItemId);
  const payload = {
    menu_item_id: menuItemId,
    badge,
    orden,
    disponible,
    name:        targetItem ? targetItem.name : undefined,
    descripcion: targetItem ? targetItem.descripcion : undefined,
    price:       targetItem ? targetItem.price : undefined,
    img:         targetItem ? targetItem.img : undefined,
    wa_text:     targetItem ? targetItem.wa_text : undefined
  };

  try {
    if (editingDestId) {
      try {
        await sbUpdate('destacados', editingDestId, payload);
      } catch (err) {
        if (/menu_item_id/i.test(err.message)) {
          const { menu_item_id, ...legacyPayload } = payload;
          await sbUpdate('destacados', editingDestId, legacyPayload);
        } else {
          throw err;
        }
      }
      toast('Destacado actualizado ✓');
    } else {
      try {
        await sbInsert('destacados', payload);
      } catch (err) {
        if (/menu_item_id/i.test(err.message)) {
          const { menu_item_id, ...legacyPayload } = payload;
          await sbInsert('destacados', legacyPayload);
        } else {
          throw err;
        }
      }
      toast('Destacado creado ✓');
    }
    closeDestModal();
    loadDestacados();
  } catch(e) {
    toast('Error guardando: ' + e.message, 'err');
  }
}

// ── EVENT DELEGATION CENTRALIZADO (S-06: Cero handlers inline) ──
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  const id = el.dataset.id ? Number(el.dataset.id) : null;
  const section = el.dataset.section;

  switch (action) {
    case 'doLogin': doLogin(); break;
    case 'logout': logout(); break;
    case 'switchSection': switchSection(section, el); break;
    case 'openModal': openModal(id); break;
    case 'closeModal': closeModal(); break;
    case 'saveItem': saveItem(); break;
    case 'deleteItem': if (id) deleteItem(id); break;
    case 'openDestModal': openDestModal(id); break;
    case 'closeDestModal': closeDestModal(); break;
    case 'saveDestacado': saveDestacado(); break;
    case 'deleteDest': if (id) deleteDest(id); break;
  }
});

document.addEventListener('change', (e) => {
  if (e.target.matches('#cat-filter')) {
    filterTable();
  } else if (e.target.matches('#f-img-file')) {
    previewImg(e.target);
  } else if (e.target.matches('#df-img-file')) {
    previewDestImg(e.target);
  } else if (e.target.matches('.toggle-disp-item')) {
    const id = Number(e.target.dataset.id);
    toggleDisponible(id, e.target.checked);
  } else if (e.target.matches('.toggle-disp-dest')) {
    const id = Number(e.target.dataset.id);
    toggleDest(id, e.target.checked);
  }
});

document.addEventListener('input', (e) => {
  if (e.target.matches('#search-input')) {
    filterTable();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.target.matches('#pwd-input') && e.key === 'Enter') {
    doLogin();
  }
});

// Auto-login si ya existe sesión activa y verificada con rol admin
const jwt  = sessionStorage.getItem('admin_jwt');
const user = sessionStorage.getItem('admin_user');
if (jwt && jwtRole(jwt) === 'admin') {
  enterPanel(user || 'Admin');
} else if (jwt) {
  logout();
}
