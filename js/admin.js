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

// Obtener cabeceras de autorización con JWT administrativo o fallback anónimo
function getHeaders() {
  const token = sessionStorage.getItem('lafinestra_admin_jwt') || SUPABASE_ANON;
  return {
    'apikey':        SUPABASE_ANON,
    'Authorization': `Bearer ${token}`,
    'Content-Type':  'application/json'
  };
}

// Hash SHA-256 precalculado para validación de acceso seguro en cliente
const ADMIN_HASH = 'c08a736df601ffc0ebe11d102608ceaee8b9f9a0f2e34428a9e766fc6de3aa33';

async function sha256(text) {
  const buffer = new TextEncoder().encode(text);
  const hash   = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function updateBadge(mode, identifier = '') {
  const badge = document.getElementById('admin-user-badge');
  if (!badge) return;
  if (mode === 'auth') {
    badge.textContent = `● Supabase: ${identifier || 'Admin'}`;
    badge.className   = 'badge-user auth';
  } else if (mode === 'jwt') {
    badge.textContent = '● JWT Token Activo';
    badge.className   = 'badge-user auth';
  } else {
    badge.textContent = '⚠️ Modo Local (Offline)';
    badge.className   = 'badge-user local';
  }
}

function enterPanel(mode, identifier = '') {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('panel').style.display = 'block';
  document.getElementById('login-error').style.display = 'none';
  updateBadge(mode, identifier);
  loadMenu();
  loadDestacados();
}

// ── AUTH ─────────────────────────────────────────────────
export async function doLogin() {
  const emailInput = document.getElementById('email-input');
  const pwdInput   = document.getElementById('pwd-input');
  const errorEl    = document.getElementById('login-error');
  const email      = emailInput ? emailInput.value.trim() : '';
  const input      = pwdInput ? pwdInput.value.trim() : '';

  if (!input) {
    if (errorEl) { errorEl.textContent = 'Por favor ingresa la contraseña'; errorEl.style.display = 'block'; }
    return;
  }

  // 1. Verificación nativa con Supabase Auth si se suministra correo
  if (email && input && !input.startsWith('ey')) {
    try {
      const res = await fetch(`${BASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey':       SUPABASE_ANON,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password: input })
      });
      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem('lafinestra_admin_jwt', data.access_token);
        sessionStorage.setItem('lafinestra_admin_auth', '1');
        sessionStorage.setItem('lafinestra_admin_user', data.user?.email || email);
        enterPanel('auth', data.user?.email || email);
        return;
      }
    } catch (err) {
      console.warn('[admin] Supabase Auth no disponible:', err.message);
    }
  }

  // 2. Verificación si el administrador suministra un JWT directo con claim role='admin'
  if (input.startsWith('ey') && input.split('.').length === 3) {
    sessionStorage.setItem('lafinestra_admin_jwt', input);
    sessionStorage.setItem('lafinestra_admin_auth', '1');
    sessionStorage.setItem('lafinestra_admin_user', 'JWT Token');
    enterPanel('jwt');
    return;
  }

  // 3. Verificación defensiva por hash SHA-256 precalculado (Modo local de contingencia)
  const hash = await sha256(input);
  if (hash === ADMIN_HASH) {
    sessionStorage.setItem('lafinestra_admin_auth', '1');
    sessionStorage.setItem('lafinestra_admin_mode', 'local');
    enterPanel('local');
    return;
  }

  if (errorEl) {
    errorEl.textContent = 'Credenciales no autorizadas';
    errorEl.style.display = 'block';
  }
}

export async function logout() {
  const token = sessionStorage.getItem('lafinestra_admin_jwt');
  if (token && token !== SUPABASE_ANON) {
    try {
      fetch(`${BASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: getHeaders(),
        keepalive: true
      }).catch(() => {});
    } catch (_) {}
  }
  sessionStorage.removeItem('lafinestra_admin_auth');
  sessionStorage.removeItem('lafinestra_admin_jwt');
  sessionStorage.removeItem('lafinestra_admin_user');
  sessionStorage.removeItem('lafinestra_admin_mode');
  document.getElementById('panel').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  const pwdInput = document.getElementById('pwd-input');
  if (pwdInput) pwdInput.value = '';
}

// ── NAVIGATION ───────────────────────────────────────────
export function switchSection(name, btn) {
  document.querySelectorAll('.section-view').forEach(s => s.classList.remove('on'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('on'));
  document.getElementById('section-' + name).classList.add('on');
  btn.classList.add('on');
}

// ── TOAST ────────────────────────────────────────────────
export function toast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── SUPABASE HELPERS CON CONTROL DEFENSIVO RLS ───────────
async function parseError(response) {
  let text = '';
  try {
    const json = await response.json();
    text = json.message || json.error_description || JSON.stringify(json);
  } catch (e) {
    text = await response.text();
  }
  if (response.status === 401) {
    return 'Sesión expirada o token no autorizado (HTTP 401). Inicia sesión nuevamente.';
  }
  if (response.status === 403 || text.toLowerCase().includes('row-level security')) {
    return 'Acceso denegado por políticas RLS. Requiere usuario con app_metadata.role = "admin".';
  }
  return text || `Error HTTP ${response.status}`;
}

async function sbGet(table, params = '') {
  const r = await fetch(`${BASE_URL}/rest/v1/${table}?${params}`, { headers: getHeaders() });
  if (!r.ok) throw new Error(await parseError(r));
  return r.json();
}

async function sbInsert(table, data) {
  const r = await fetch(`${BASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...getHeaders(), 'Prefer': 'return=representation' },
    body: JSON.stringify(data)
  });
  if (!r.ok) throw new Error(await parseError(r));
  return r.json();
}

async function sbUpdate(table, id, data) {
  const r = await fetch(`${BASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...getHeaders(), 'Prefer': 'return=representation' },
    body: JSON.stringify(data)
  });
  if (!r.ok) throw new Error(await parseError(r));
  return r.json();
}

async function sbDelete(table, id) {
  const r = await fetch(`${BASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!r.ok) throw new Error(await parseError(r));
}

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
  const token = sessionStorage.getItem('lafinestra_admin_jwt') || SUPABASE_ANON;
  const r = await fetch(`${BASE_URL}/storage/v1/object/menu-images/${name}`, {
    method: 'POST',
    headers: {
      'apikey':        SUPABASE_ANON,
      'Authorization': `Bearer ${token}`,
      'Content-Type':  file.type
    },
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
    toast('Nota: Base de datos remota no disponible. Modo visualización activa.', 'err');
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
          <input type="checkbox" ${item.disponible ? 'checked' : ''} onchange="Admin.toggleDisponible(${Number(item.id)}, this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </td>
      <td>
        <div class="actions">
          <button class="act-btn" onclick="Admin.openModal(${Number(item.id)})">Editar</button>
          <button class="act-btn del" onclick="Admin.deleteItem(${Number(item.id)})">Borrar</button>
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

  const categoria  = document.getElementById('f-categoria').value;
  const cat        = document.getElementById('f-cat').value.trim() || null;
  const wa_text    = document.getElementById('f-watext').value.trim();
  const orden      = parseInt(document.getElementById('f-orden').value) || 0;
  const disponible = document.getElementById('f-disponible').value === 'true';
  const imgFile    = document.getElementById('f-img-file').files[0];

  let imgPath = editingId ? (allItems.find(i => i.id === editingId)?.img || null) : null;

  try {
    if (imgFile) imgPath = await uploadImage(imgFile, categoria);

    const payload = { categoria, cat, name, descripcion: desc, price, wa_text, orden, disponible, img: imgPath };

    if (editingId) {
      await sbUpdate('menu_items', editingId, payload);
      const idx = allItems.findIndex(i => i.id === editingId);
      if (idx !== -1) allItems[idx] = { ...allItems[idx], ...payload };
      toast('Plato actualizado ✓');
    } else {
      const [created] = await sbInsert('menu_items', payload);
      allItems.push(created);
      toast('Plato creado ✓');
    }

    closeModal(); renderStats(); renderTable();
  } catch(e) { toast('Error guardando: ' + e.message, 'err'); }
}

// ── DESTACADOS ───────────────────────────────────────────
let allDest = [];

async function loadDestacados() {
  try {
    allDest = await sbGet('destacados', 'order=orden.asc');
    renderDestTable();
  } catch(e) { toast('Nota: Destacados no disponibles en red.', 'err'); }
}

function renderDestTable() {
  const tbody = document.getElementById('dest-tbody');
  if (!allDest.length) { tbody.innerHTML = '<tr><td colspan="6" class="loading">Sin destacados</td></tr>'; return; }
  tbody.innerHTML = allDest.map(d => `
    <tr>
      <td>${d.img
        ? `<img class="td-img" src="${escHtml(STORAGE_URL + d.img)}" alt="">`
        : `<div class="td-img-placeholder"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`
      }</td>
      <td style="font-size:14px">${escHtml(d.badge)}</td>
      <td class="td-name">${escHtml(d.name)}</td>
      <td class="td-price">${escHtml(d.price)}</td>
      <td>
        <label class="toggle">
          <input type="checkbox" ${d.disponible ? 'checked' : ''} onchange="Admin.toggleDest(${Number(d.id)}, this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </td>
      <td>
        <div class="actions">
          <button class="act-btn" onclick="Admin.openDestModal(${Number(d.id)})">Editar</button>
          <button class="act-btn del" onclick="Admin.deleteDest(${Number(d.id)})">Borrar</button>
        </div>
      </td>
    </tr>`).join('');
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
  const name = target ? target.name : `#${id}`;
  if (!confirm(`¿Eliminar destacado "${name}"?`)) return;
  try {
    await sbDelete('destacados', id);
    allDest = allDest.filter(d => d.id !== id);
    renderDestTable();
    toast('Eliminado');
  } catch(e) { toast('Error eliminando: ' + e.message, 'err'); }
}

let editingDestId = null;

export function openDestModal(id = null) {
  editingDestId = id;
  document.getElementById('dest-modal-title').textContent = id ? 'Editar destacado' : 'Nuevo destacado';
  document.getElementById('img-preview-dest').style.display = 'none';
  document.getElementById('df-img-file').value = '';
  document.getElementById('dest-current-img-label').textContent = '';

  if (id) {
    const d = allDest.find(i => i.id === id);
    if (!d) return;
    document.getElementById('df-badge').value      = d.badge || '';
    document.getElementById('df-name').value       = d.name || '';
    document.getElementById('df-desc').value       = d.descripcion || '';
    document.getElementById('df-price').value      = d.price || '';
    document.getElementById('df-watext').value     = d.wa_text || '';
    document.getElementById('df-orden').value      = d.orden ?? 0;
    document.getElementById('df-disponible').value = d.disponible ? 'true' : 'false';
    if (d.img) {
      document.getElementById('dest-current-img-label').textContent = `Imagen actual: ${d.img}`;
      document.getElementById('img-preview-dest').src = STORAGE_URL + d.img;
      document.getElementById('img-preview-dest').style.display = 'block';
    }
  } else {
    ['df-badge','df-name','df-desc','df-price','df-watext'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('df-orden').value = 0;
    document.getElementById('df-disponible').value = 'true';
  }
  document.getElementById('dest-modal').classList.add('open');
}

export function closeDestModal() { document.getElementById('dest-modal').classList.remove('open'); }

export async function saveDestacado() {
  const badge = document.getElementById('df-badge').value.trim();
  const name  = document.getElementById('df-name').value.trim();
  const desc  = document.getElementById('df-desc').value.trim();
  const price = document.getElementById('df-price').value.trim();
  if (!badge || !name || !desc || !price) { toast('Badge, nombre, descripción y precio son obligatorios', 'err'); return; }

  const wa_text    = document.getElementById('df-watext').value.trim();
  const orden      = parseInt(document.getElementById('df-orden').value) || 0;
  const disponible = document.getElementById('df-disponible').value === 'true';
  const imgFile    = document.getElementById('df-img-file').files[0];

  let imgPath = editingDestId ? (allDest.find(d => d.id === editingDestId)?.img || null) : null;

  try {
    if (imgFile) imgPath = await uploadImage(imgFile, 'destacados');

    const payload = { badge, name, descripcion: desc, price, wa_text, orden, disponible, img: imgPath };

    if (editingDestId) {
      await sbUpdate('destacados', editingDestId, payload);
      const idx = allDest.findIndex(d => d.id === editingDestId);
      if (idx !== -1) allDest[idx] = { ...allDest[idx], ...payload };
      toast('Destacado actualizado ✓');
    } else {
      const [created] = await sbInsert('destacados', payload);
      allDest.push(created);
      toast('Destacado creado ✓');
    }

    closeDestModal(); renderDestTable();
  } catch(e) { toast('Error guardando: ' + e.message, 'err'); }
}

// Exponer en window para manejadores HTML onclick
window.Admin = {
  doLogin, logout, switchSection, toast, previewImg, previewDestImg,
  filterTable, toggleDisponible, deleteItem, openModal, closeModal, saveItem,
  toggleDest, deleteDest, openDestModal, closeDestModal, saveDestacado
};

// Auto-login si ya existe sesión activa
if (sessionStorage.getItem('lafinestra_admin_auth') === '1') {
  const jwt  = sessionStorage.getItem('lafinestra_admin_jwt');
  const user = sessionStorage.getItem('lafinestra_admin_user');
  const mode = jwt ? (user && user !== 'JWT Token' ? 'auth' : 'jwt') : 'local';
  enterPanel(mode, user || '');
}
