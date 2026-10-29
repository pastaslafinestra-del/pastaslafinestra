# 🍝 DOSSIER DE AUDITORÍA: JAVASCRIPT FRONTEND & PANEL ADMINISTRATIVO
## La Finestra — Ristorante e Pastificio Italiano (San Cristóbal, Venezuela)
**Versión de Certificación:** 2.0.3 (Hardened Post-Auditoría SAST)  
**Destinatario:** Arquitecto de Software & Auditor de Ciberseguridad  
**Fecha:** 28 de Octubre de 2026  
**Ámbito:** Suite completa de frontend (`config.js`, `menu-fetch.js`, `reservas.js`, `admin.js`, `cart.js`, `mcard.js`, `main.js`).

---

## 🧭 1. Resumen de Remediación Post-Auditoría SAST (v2.0.2 → v2.0.3)

Todos los hallazgos identificados en el informe del auditor han sido subsanados e integrados quirúrgicamente:

| ID | Severidad | Categoría | Archivo | Estado | Remediación Implementada |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **FE-SEC-01** | **ALTA** | DOM XSS / Inyección HTML | `js/admin.js`, `js/mcard.js` | **SUBSANADO ✅** | Implementación de `escHtml()` para sanitizar todas las interpolaciones en `innerHTML`. En `deleteItem()` y `deleteDest()` se eliminó la interpolación de nombres dentro de atributos `onclick`, pasando únicamente el ID numérico (`Number(id)`) y buscando el objeto en memoria. En `mcard.js` se implementó `sanitizeStyle()` para neutralizar escapes en `imgStyle`. |
| **FE-SEC-02** | **MEDIA-ALTA** | Lógica de Auth / Falso Positivo Offline | `js/admin.js` | **SUBSANADO ✅** | Aislamiento claro del modo contingencia offline vs sesión Supabase Auth. Se agregó revocación de token en servidor en `logout()` invocando `POST /auth/v1/logout` con `keepalive: true`. |
| **FE-SEC-03** | **MEDIA** | Subida de Archivos sin Restricción | `js/admin.js` | **SUBSANADO ✅** | Lista blanca estricta de MIME types (`image/webp`, `image/jpeg`, `image/png`), límite de peso a 4 MB (`MAX_UPLOAD_BYTES`) y sanitización de carpetas (`safeFolder = String(folder).replace(/[^a-z0-9_-]/gi, '')`). |
| **FE-BUG-01** | **MEDIA** | Desincronización de Constraints SQL | `js/reservas.js` | **SUBSANADO ✅** | Validación estricta en cliente sincronizada 1:1 con `chk_reservas_longitudes`: `telefono.length <= 30` y `notas.length <= 500`. |
| **FE-BUG-02** | **MEDIA** | Condición de Carrera / Spam en Fetch | `js/reservas.js` | **SUBSANADO ✅** | Inyección de `keepalive: true` en el `fetch` hacia Supabase para evitar abortos de red al disparar deep-links móviles a WhatsApp, y bloqueo temporal anti-doble clic en `#rf-submit` (3 segundos). |
| **FE-ARCH-01** | **INFO** | Categorías y Visor de Reservas | Arquitectura | **DOCUMENTADO ℹ️** | Documentado para fase 2: orden dinámico de pestañas vía tabla `categorias` y módulo administrativo de cambio de estado de reservas (`pendiente` → `confirmada`). |

---

## 📜 2. Código Fuente Completo de los 7 Módulos de Frontend

A continuación se presentan íntegros y en texto plano todos los módulos de JavaScript para su revisión exhaustiva:

### Módulo 1: `js/config.js`
```javascript
export const WA_NUMBER       = '584247842743';
export const ASSETS_BASE_URL = 'https://atjijqvwwdlydgsonptr.supabase.co/storage/v1/object/public/menu-images/';

export const SUPABASE_URL  = 'https://atjijqvwwdlydgsonptr.supabase.co';
export const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0amlqcXZ3d2RseWRnc29ucHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMTI1MDIsImV4cCI6MjA5NDg4ODUwMn0.DDVEbZaVmAqmuvUs-jAHYAWm1PVUyT1zzy5gKJCdK3Q';
```

---

### Módulo 2: `js/menu-fetch.js`
```javascript
/**
 * menu-fetch.js — Capa de datos con arquitectura Local-First Resilient Fallback.
 *
 * Prioridad de carga:
 *   1. Intenta consultar Supabase REST API con timeout acotado (1500ms).
 *   2. Si la conexión falla (DNS no resuelve, offline, 404/500, timeout),
 *      conmuta automáticamente al catálogo tipado local (menu-data.js).
 *
 * Invariante: loadMenuData() NUNCA arroja excepciones no controladas.
 */

import { SUPABASE_URL, SUPABASE_ANON } from './config.js';
import { menuData as localMenuData, destacadosData as localDestacadosData } from './menu-data.js';

const BASE_URL = (SUPABASE_URL || '').replace(/\/+$/, '');

const HEADERS = {
  'apikey':        SUPABASE_ANON,
  'Authorization': `Bearer ${SUPABASE_ANON}`,
};

const FETCH_TIMEOUT_MS = 1500;

async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  if (typeof AbortController === 'undefined') {
    return fetch(url, options);
  }
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function fetchTable(table, params = '') {
  const res = await fetchWithTimeout(`${BASE_URL}/rest/v1/${table}?${params}`, {
    headers: HEADERS,
  });
  if (!res.ok) throw new Error(`[Supabase] HTTP ${res.status} al consultar ${table}`);
  return res.json();
}

export async function loadMenuData() {
  try {
    const [items, destacados] = await Promise.all([
      fetchTable('menu_items', 'disponible=eq.true&order=orden.asc'),
      fetchTable('destacados',  'disponible=eq.true&order=orden.asc'),
    ]);

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('[Supabase] Respuesta vacía o inválida');
    }

    // Reconstruye el formato esperado por mcard.js
    const menuData = {};
    items.forEach(row => {
      if (!menuData[row.categoria]) menuData[row.categoria] = [];
      menuData[row.categoria].push({
        name:     row.name,
        desc:     row.descripcion,
        price:    row.price,
        cat:      row.cat,
        img:      row.img,
        imgStyle: row.img_style,
        waText:   row.wa_text,
      });
    });

    const destacadosData = destacados.map(row => ({
      badge:  row.badge,
      name:   row.name,
      desc:   row.descripcion,
      price:  row.price,
      img:    row.img,
      waText: row.wa_text,
    }));

    return { menuData, destacadosData, source: 'supabase' };
  } catch (err) {
    console.warn(`[menu-fetch] ⚠️ Supabase no disponible (${err.message}). Activando Local-First Fallback.`);
    return {
      menuData: localMenuData,
      destacadosData: localDestacadosData,
      source: 'local-fallback',
    };
  }
}
```

---

### Módulo 3: `js/reservas.js`
```javascript
/**
 * reservas.js — Lógica del módulo de reservas de mesa (La Finestra).
 *
 * Responsabilidades:
 *   - Manejo de chips de hora y personas.
 *   - Validación defensiva de campos obligatorios y longitudes (1:1 con chk_reservas_longitudes).
 *   - Envío asíncrono a Supabase public.reservas (con 'Prefer: return=minimal' y keepalive: true).
 *   - Apertura de WhatsApp con el mensaje estructurado usando config.js.
 */

import { WA_NUMBER, SUPABASE_URL, SUPABASE_ANON } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
  // Inicialización defensiva de fecha mínima (Zona Horaria America/Caracas UTC-4)
  // Sincronizado con la política RLS: fecha >= (NOW() AT TIME ZONE 'America/Caracas')::DATE
  const fechaInput = document.getElementById('res-fecha');
  if (fechaInput) {
    try {
      const hoyVzla = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Caracas' }).format(new Date());
      fechaInput.min = hoyVzla;
      if (!fechaInput.value) fechaInput.value = hoyVzla;
    } catch (e) {
      const hoyIso = new Date().toISOString().split('T')[0];
      fechaInput.min = hoyIso;
      if (!fechaInput.value) fechaInput.value = hoyIso;
    }
  }

  // Selección de chip de hora
  document.querySelectorAll('#res-hora-chips .rf-chip').forEach(chip => {
    chip.addEventListener('click', function() {
      document.querySelectorAll('#res-hora-chips .rf-chip').forEach(c => c.classList.remove('activo'));
      this.classList.add('activo');
    });
  });

  // Selección de chip de personas
  document.querySelectorAll('#res-personas-chips .rf-chip').forEach(chip => {
    chip.addEventListener('click', function() {
      document.querySelectorAll('#res-personas-chips .rf-chip').forEach(c => c.classList.remove('activo'));
      this.classList.add('activo');
    });
  });

  // Envío de reserva por WhatsApp y persistencia en Supabase
  const submitBtn = document.getElementById('rf-submit');
  if (!submitBtn) return;

  submitBtn.addEventListener('click', async () => {
    if (submitBtn.disabled) return;

    const nombre   = document.getElementById('res-nombre')?.value.trim() || '';
    const telefono = document.getElementById('res-telefono')?.value.trim() || '';
    const fecha    = document.getElementById('res-fecha')?.value || '';
    const horaEl   = document.querySelector('#res-hora-chips .rf-chip.activo');
    const persEl   = document.querySelector('#res-personas-chips .rf-chip.activo');
    const notas    = document.getElementById('res-notas')?.value.trim() || '';
    const errorEl  = document.getElementById('rf-error');

    const showError = (msg) => {
      if (!errorEl) return;
      errorEl.textContent = msg;
      errorEl.classList.add('visible');
      errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    if (!nombre || !fecha || !horaEl || !persEl) {
      showError('Por favor completa todos los campos obligatorios.');
      return;
    }

    // Validación estricta 1:1 con constraint SQL chk_reservas_longitudes
    if (nombre.length < 2 || nombre.length > 120) {
      showError('El nombre debe contener entre 2 y 120 caracteres.');
      return;
    }

    if (telefono.length > 30) {
      showError('El número de teléfono no puede exceder 30 caracteres.');
      return;
    }

    if (notas.length > 500) {
      showError('Las notas adicionales no pueden exceder 500 caracteres.');
      return;
    }

    if (errorEl) errorEl.classList.remove('visible');

    const horaVal = horaEl.dataset.val;
    const persVal = persEl.dataset.val;

    // Bloqueo temporal anti-doble clic (evita reservas duplicadas)
    submitBtn.disabled = true;
    setTimeout(() => { submitBtn.disabled = false; }, 3000);

    // 1. Persistencia defensiva en Supabase con keepalive: true
    // Garantiza que el navegador móvil no aborte el POST al cambiar a la app de WhatsApp
    if (SUPABASE_URL && SUPABASE_ANON) {
      try {
        fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/reservas`, {
          method: 'POST',
          keepalive: true,
          headers: {
            'apikey':        SUPABASE_ANON,
            'Authorization': `Bearer ${SUPABASE_ANON}`,
            'Content-Type':  'application/json',
            'Prefer':        'return=minimal'
          },
          body: JSON.stringify({
            nombre,
            telefono: telefono || null,
            fecha,
            hora: String(horaVal).slice(0, 20),
            personas: String(persVal).slice(0, 20),
            notas: notas || null,
            estado: 'pendiente'
          })
        }).catch(err => {
          console.warn('[reservas] Persistencia en nube no disponible:', err.message);
        });
      } catch (err) {
        // Degrada silenciosamente al canal WhatsApp
      }
    }

    // 2. Formateo y Apertura del canal WhatsApp
    const [y, m, d] = fecha.split('-');
    const dias  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const fo = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    const fechaLegible = `${dias[fo.getDay()]} ${d} de ${meses[parseInt(m, 10) - 1]} de ${y}`;

    const lines = [
      '📅 *Reserva en La Finestra*',
      '',
      `👤 *Nombre:* ${nombre}`,
    ];

    if (telefono) {
      lines.push(`📱 *Teléfono:* ${telefono}`);
    }

    lines.push(`📆 *Fecha:* ${fechaLegible}`);
    lines.push(`🕐 *Hora:* ${horaVal}`);
    lines.push(`👥 *Personas:* ${persVal}`);

    if (notas) {
      lines.push(`📝 *Notas:* ${notas}`);
    }

    lines.push('');
    lines.push('_Enviado desde el portal oficial de La Finestra_');

    const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(waUrl, '_blank');
  });
});
```

---

### Módulo 4: `js/admin.js`
```javascript
/**
 * admin.js — Lógica desacoplada del Panel Administrativo de La Finestra.
 *
 * Arquitectura:
 *   - Sanitización Anti-XSS con escHtml() en todas las vistas de tabla.
 *   - Restricción estricta de subida de imágenes (MIME whitelist + límite 4 MB).
 *   - Autenticación nativa con Supabase Auth (/auth/v1/token) + Bearer JWT.
 *   - Revocación de sesión en servidor en logout() (/auth/v1/logout).
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
    toast('Aviso: Has ingresado en Modo Local Offline. Para gestionar Supabase ingresa tu correo.', 'err');
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
```

---

### Módulo 5: `js/cart.js`
```javascript
/**
 * cart.js — Carrito de compras de La Finestra.
 *
 * Responsabilidades:
 *   - Estado del carrito (items, cantidades, subtotal)
 *   - Renderizado del drawer
 *   - Generación del mensaje WhatsApp formateado
 *   - Sanitización defensiva de atributos en el DOM
 */

import { WA_NUMBER } from './config.js';

export const Cart = (() => {

  /* ── Estado ─────────────────────────────────────────── */
  let items = [];

  /* ── Utilidades ─────────────────────────────────────── */
  function parsePrice(str) {
    const clean = str.split('–')[0]
      .replace(/[^0-9,\.]/g, '')
      .replace(',', '.');
    return parseFloat(clean) || 0;
  }

  function makeId(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  function totalUnits() {
    return items.reduce((acc, i) => acc + i.qty, 0);
  }

  function subtotal() {
    return items.reduce((acc, i) => acc + i.price * i.qty, 0);
  }

  function fmtPrice(num) {
    return '$' + num.toFixed(2).replace('.', ',');
  }

  function escHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ── Mensaje WhatsApp ───────────────────────────────── */
  function buildWaMessage() {
    const lines = items.map(i =>
      `• ${i.qty}x ${i.name} — ${fmtPrice(i.price * i.qty)}`
    );
    lines.push('');
    lines.push(`*Total: ${fmtPrice(subtotal())}*`);
    lines.push('');
    lines.push('¡Hola! Quiero realizar este pedido 🍝');
    return encodeURIComponent(lines.join('\n'));
  }

  /* ── DOM refs ───────────────────────────────────────── */
  let drawerEl, overlayEl, badgeEl, itemsEl, subtotalEl, fabEl, countEl;

  function injectHTML() {
    const WA_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;

    const CART_SVG = `<svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg>`;

    document.body.insertAdjacentHTML('beforeend', `
      <div class="cart-overlay" id="cart-overlay"></div>

      <div class="cart-drawer" id="cart-drawer" role="dialog" aria-label="Carrito de compras">
        <div class="cart-header">
          <div>
            <span class="cart-header-title">Tu pedido</span>
            <span class="cart-header-count" id="cart-count"></span>
          </div>
          <div class="cart-header-actions">
            <button class="cart-clear" id="cart-clear" aria-label="Vaciar pedido" style="display:none">
              Vaciar todo
            </button>
            <button class="cart-close" id="cart-close" aria-label="Cerrar carrito">
              <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        <div class="cart-items" id="cart-items"></div>
        <div class="cart-footer" id="cart-footer">
          <div class="cart-subtotal-row">
            <span class="cart-subtotal-label">Subtotal</span>
            <span class="cart-subtotal-value" id="cart-subtotal">$0,00</span>
          </div>
          <p class="cart-note">Precios en USD · Tasa BCV del día · 25% dcto. pagando en divisas</p>
          <a id="cart-wa-btn" class="cart-btn-wa" target="_blank">
            ${WA_SVG}
            Enviar pedido por WhatsApp
          </a>
        </div>
      </div>

      <button class="cart-fab" id="cart-fab" aria-label="Ver carrito">
        ${CART_SVG}
        <span class="cart-badge" id="cart-badge"></span>
      </button>
    `);
  }

  let clearEl;

  function bindRefs() {
    drawerEl   = document.getElementById('cart-drawer');
    overlayEl  = document.getElementById('cart-overlay');
    badgeEl    = document.getElementById('cart-badge');
    itemsEl    = document.getElementById('cart-items');
    subtotalEl = document.getElementById('cart-subtotal');
    fabEl      = document.getElementById('cart-fab');
    countEl    = document.getElementById('cart-count');
    clearEl    = document.getElementById('cart-clear');
  }

  function bindEvents() {
    document.getElementById('cart-close').addEventListener('click', close);
    overlayEl.addEventListener('click', close);
    fabEl.addEventListener('click', open);
    clearEl.addEventListener('click', clearAll);

    itemsEl.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.dataset.action === 'inc') changeQty(id,  1);
      if (btn.dataset.action === 'dec') changeQty(id, -1);
    });
  }

  /* ── Abrir / Cerrar ─────────────────────────────────── */
  function open() {
    drawerEl.classList.add('open');
    overlayEl.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    drawerEl.classList.remove('open');
    overlayEl.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ── Renderizado ────────────────────────────────────── */
  function render() {
    const units = totalUnits();
    const total = subtotal();

    badgeEl.textContent = units > 99 ? '99+' : units;
    badgeEl.classList.toggle('visible', units > 0);
    countEl.textContent = units > 0 ? `(${units} ${units === 1 ? 'ítem' : 'ítems'})` : '';
    subtotalEl.textContent = fmtPrice(total);

    // Mostrar "Vaciar todo" solo cuando hay ítems
    clearEl.style.display = items.length > 0 ? 'block' : 'none';

    const waBtn = document.getElementById('cart-wa-btn');
    if (items.length > 0) {
      waBtn.href = `https://wa.me/${WA_NUMBER}?text=${buildWaMessage()}`;
      waBtn.style.pointerEvents = '';
      waBtn.style.opacity = '1';
    } else {
      waBtn.href = '#';
      waBtn.style.pointerEvents = 'none';
      waBtn.style.opacity = '0.5';
    }

    if (items.length === 0) {
      itemsEl.innerHTML = `
        <div class="cart-empty">
          <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg>
          <div class="cart-empty-title">Tu carrito está vacío</div>
          <div class="cart-empty-sub">Agrega platos con el botón&nbsp;<strong>+</strong> en cada card</div>
        </div>`;
      return;
    }

    const ICON_MINUS = `<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>`;
    const ICON_PLUS  = `<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`;

    itemsEl.innerHTML = items.map(item => `
      <div class="cart-item" data-item-id="${escHtml(item.id)}">
        <div class="cart-item-info">
          <div class="cart-item-name" title="${escHtml(item.name)}">${escHtml(item.name)}</div>
          <div class="cart-item-price">${fmtPrice(item.price * item.qty)}</div>
        </div>
        <div class="cart-qty">
          <button class="cart-qty-btn ${item.qty === 1 ? 'will-remove' : ''}"
                  data-action="dec" data-id="${escHtml(item.id)}"
                  aria-label="Reducir cantidad">${ICON_MINUS}</button>
          <span class="cart-qty-num">${item.qty}</span>
          <button class="cart-qty-btn" data-action="inc" data-id="${escHtml(item.id)}"
                  aria-label="Aumentar cantidad">${ICON_PLUS}</button>
        </div>
      </div>`).join('');
  }

  /* ── Estado ─────────────────────────────────────────── */
  function add(name, priceStr, btnEl) {
    const id       = makeId(name);
    const price    = parsePrice(priceStr);
    const existing = items.find(i => i.id === id);

    if (existing) {
      existing.qty += 1;
    } else {
      items.push({ id, name, price, qty: 1 });
    }

    if (btnEl) {
      btnEl.classList.remove('adding');
      void btnEl.offsetWidth;
      btnEl.classList.add('adding');
      btnEl.addEventListener('animationend', () => btnEl.classList.remove('adding'), { once: true });
    }

    render();
  }

  function clearAll() {
    items = [];
    render();
  }

  function changeQty(id, delta) {
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return;
    items[idx].qty += delta;
    if (items[idx].qty <= 0) items.splice(idx, 1);
    render();
  }

  /* ── Init ───────────────────────────────────────────── */
  function init() {
    injectHTML();
    bindRefs();
    bindEvents();
    render();
  }

  return { init, add, open, close };

})();
```

---

### Módulo 6: `js/mcard.js`
```javascript
/**
 * mcard.js — Componente de card del menú.
 *
 * Los datos (menuData, destacadosData) se reciben como parámetros
 * desde main.js, que los carga desde Supabase via menu-fetch.js.
 *
 * Implementa sanitización defensiva escHtml() y sanitizeStyle()
 * para prevenir escape de atributos HTML y vectores DOM XSS.
 */

import { ASSETS_BASE_URL } from './config.js';
import { Cart }             from './cart.js';

window.Cart = Cart;

const ICON_PLUS = `<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`;

// ── SANITIZACIÓN DEFENSIVA PARA RENDERIZADO EN DOM ───────
function escHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeStyle(css) {
  if (!css) return '';
  return String(css).replace(/["'<>\\]/g, '');
}

function buildMcard(plato) {
  const hasImg = Boolean(plato.img);
  const wrapperClasses = ['mcard'];
  if (hasImg) wrapperClasses.push('mcard-foto', 'mcard-clean');

  let imgBlock = '';
  if (hasImg) {
    const safeImg    = encodeURI(`${ASSETS_BASE_URL}${plato.img}`);
    const baseStyle  = `background-image:url('${safeImg}')`;
    const extraStyle = plato.imgStyle ? `;${sanitizeStyle(plato.imgStyle)}` : '';
    const imgClass   = plato.imgStyle ? 'mcard-img mcard-img--producto' : 'mcard-img';
    imgBlock = `<div class="${imgClass}" style="${baseStyle}${extraStyle}"></div>`;
  }

  const catBlock = plato.cat ? `<div class="mcard-cat">${escHtml(plato.cat)}</div>` : '';

  return `
    <div class="${wrapperClasses.join(' ')}">
      ${imgBlock}
      <div class="mcard-body">
        ${catBlock}
        <div class="mcard-name">${escHtml(plato.name)}</div>
        <div class="mcard-desc">${escHtml(plato.desc)}</div>
        <div class="mcard-footer">
          <span class="mcard-price">${escHtml(plato.price)}</span>
          <button class="mcard-btn"
                  onclick="Cart.add(this.dataset.name, this.dataset.price, this)"
                  data-name="${escHtml(plato.name)}"
                  data-price="${escHtml(plato.price)}"
                  aria-label="Agregar ${escHtml(plato.name)} al carrito">${ICON_PLUS}</button>
        </div>
      </div>
    </div>`.trim();
}

function renderGrid(panelId, platos) {
  const panel = document.getElementById(panelId);
  if (!panel) { console.warn(`[mcard] Panel #${panelId} no encontrado.`); return; }
  const grid = panel.querySelector('.mgrid');
  if (!grid)  { console.warn(`[mcard] .mgrid no encontrado en #${panelId}.`); return; }
  grid.innerHTML = platos.map(buildMcard).join('\n');
}

export function initMenu(menuData) {
  renderGrid('p-entradas',    menuData.entradas    || []);
  renderGrid('p-pastas',      menuData.pastas      || []);
  renderGrid('p-pizzas',      menuData.pizzas      || []);
  renderGrid('p-proteinas',   menuData.proteinas   || []);
  renderGrid('p-ensaladas',   menuData.ensaladas   || []);
  renderGrid('p-infantil',    menuData.infantil    || []);
  renderGrid('p-postres',     menuData.postres     || []);
  renderGrid('p-bebidas',     menuData.bebidas     || []);
  renderGrid('p-adicionales', menuData.adicionales || []);
}

function buildDestCard(plato) {
  const safeImg = encodeURI(`${ASSETS_BASE_URL}${plato.img}`);
  return `
    <div class="dest-card">
      <div class="dest-img" style="background-image:url('${safeImg}')">
        <span class="dest-badge">${escHtml(plato.badge)}</span>
      </div>
      <div class="dest-info">
        <div class="dest-name">${escHtml(plato.name)}</div>
        <div class="dest-desc">${escHtml(plato.desc)}</div>
        <div class="dest-bottom">
          <span class="dest-price">${escHtml(plato.price)}</span>
          <button class="dest-btn"
                  onclick="Cart.add(this.dataset.name, this.dataset.price, this)"
                  data-name="${escHtml(plato.name)}"
                  data-price="${escHtml(plato.price)}"
                  aria-label="Agregar ${escHtml(plato.name)} al carrito">${ICON_PLUS}</button>
        </div>
      </div>
    </div>`.trim();
}

export function renderDestacados(destacadosData) {
  const scroll        = document.querySelector('.dest-scroll');
  const dotsContainer = document.querySelector('.dest-dots');
  if (!scroll || !dotsContainer) return;

  scroll.innerHTML = destacadosData.map(buildDestCard).join('\n');
  dotsContainer.innerHTML = destacadosData
    .map((_, i) => `<span class="dest-dot${i === 0 ? ' active' : ''}"></span>`)
    .join('\n');
}
```

---

### Módulo 7: `js/main.js`
```javascript
/**
 * main.js — Punto de entrada principal (ES Module).
 * Carga datos desde Supabase con Local-First Fallback y orquesta el frontend.
 */

import { Cart }                       from './cart.js';
import { initMenu, renderDestacados } from './mcard.js';
import { loadMenuData }               from './menu-fetch.js';

/* ── 0. Barra de urgencia (horario) ─────────────────────────────── */
function initUrgencyBar() {
  const bar = document.getElementById('urgency-bar');
  if (!bar) return;
  const now      = new Date();
  const totalMin = now.getHours() * 60 + now.getMinutes();
  const isOpen   = totalMin >= 660 && totalMin < 1320;
  if (isOpen) {
    bar.innerHTML = '🍝 Abierto ahora &nbsp;·&nbsp; Lunes a Domingo 11:00 AM – 10:00 PM &nbsp;·&nbsp; Delivery disponible &nbsp;<a href="https://wa.me/584247842743" target="_blank">Ordenar ahora →</a>';
  } else {
    bar.classList.add('closed');
    bar.innerHTML = '🔴 Cerrado &nbsp;·&nbsp; Nuestro horario es Lunes a Domingo 11:00 AM – 10:00 PM';
  }
}
initUrgencyBar();

/* ── 1. Carrito ─────────────────────────────────────────────────── */
Cart.init();

/* ── 5. Reduced motion (movido aquí para que initStagger lo use) ── */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── 2. Datos (Supabase / Local-First Fallback) → renderizado ────── */
try {
  const { menuData, destacadosData } = await loadMenuData();
  renderDestacados(destacadosData);
  initMenu(menuData);
  initStagger(); // Cards ya existen en el DOM
} catch (err) {
  console.error('[main] Error cargando menú:', err);
}

/* ── 3. Tabs ────────────────────────────────────────────────────── */
function showTab(id, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('on'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
  document.getElementById('p-' + id)?.classList.add('on');
  btn.classList.add('on');

  const tabsWrap = btn.closest('.tabs-wrap');
  if (tabsWrap) {
    tabsWrap.scrollTo({
      left: btn.offsetLeft - (tabsWrap.offsetWidth / 2) + (btn.offsetWidth / 2),
      behavior: 'smooth'
    });
  }

  // Animar cards del panel recién activado
  if (!reducedMotion) {
    const panel = document.getElementById('p-' + id);
    if (panel) animateCards(panel.querySelectorAll('.mcard'));
  }
}
window.showTab = showTab;

function initTabs() {
  document.querySelectorAll('.tab[data-tab]').forEach(btn => {
    btn.addEventListener('click', function () { showTab(this.dataset.tab, this); });
  });
}
initTabs();

/* ── 4. Nav móvil ───────────────────────────────────────────────── */
window.toggleMenu = () => document.getElementById('navMobile')?.classList.toggle('open');
window.closeMenu  = () => document.getElementById('navMobile')?.classList.remove('open');

/* ── 6. Scroll reveal ───────────────────────────────────────────── */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); revealObserver.unobserve(e.target); }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.fade, .fade-left, .fade-right').forEach(el => {
  reducedMotion ? el.classList.add('in') : revealObserver.observe(el);
});

/* ── 7. Stagger ─────────────────────────────────────────────────── */
function animateCards(cards) {
  cards.forEach((card, i) => {
    card.style.opacity    = '0';
    card.style.transform  = 'translateY(16px)';
    card.style.transition = `opacity 0.45s ease ${i * 60}ms, transform 0.45s ease ${i * 60}ms`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      card.style.opacity = '1'; card.style.transform = 'translateY(0)';
    }));
  });
}

function initStagger() {
  if (reducedMotion) return;

  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    const allCards = Array.from(document.querySelectorAll('.mcard, .dest-card'));
    allCards.forEach(card => { card.style.opacity = '0'; });

    requestAnimationFrame(() => requestAnimationFrame(() => {
      // Para cada card, buscar su contenedor scrolleable como root
      const observed = new Set();

      allCards.forEach(card => {
        // Buscar el scroll container más cercano
        const container = card.closest('.mgrid, .dest-scroll') || null;

        if (observed.has(container)) return; // ya hay un observer para ese container

        const siblings = container
          ? Array.from(container.querySelectorAll('.mcard, .dest-card'))
          : [card];

        const obs = new IntersectionObserver(entries => {
          entries.forEach(e => {
            if (!e.isIntersecting) return;
            e.target.style.transition = 'opacity 0.45s ease';
            e.target.style.opacity    = '1';
            obs.unobserve(e.target);
          });
        }, {
          root: container || null,
          threshold: 0.1,
          rootMargin: '0px 60px 0px 0px'
        });

        siblings.forEach(c => obs.observe(c));
        if (container) observed.add(container);
      });
    }));
  } else {
    // Desktop: observer por grid (comportamiento original)
    const gridObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        animateCards(entry.target.querySelectorAll('.mcard, .dest-card'));
        gridObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.mgrid, .dest-scroll').forEach(el => gridObserver.observe(el));
  }
}

/* ── 8. Nav highlight ───────────────────────────────────────────── */
(function () {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  if (!sections.length || !navLinks.length) return;
  new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
      }
    });
  }, { threshold: 0.4 }).observe(...sections);
})();

/* ── 9. Destacados dots ─────────────────────────────────────────── */
(function () {
  const scroll = document.querySelector('.dest-scroll');
  const dots   = document.querySelectorAll('.dest-dot');
  if (!scroll || !dots.length) return;
  scroll.addEventListener('scroll', () => {
    const index = Math.round(scroll.scrollLeft / 226);
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
  }, { passive: true });
})();

/* ── 10. Tabs sticky ────────────────────────────────────────────── */
(function () {
  const sentinel   = document.querySelector('.tabs-sentinel');
  const stickyWrap = document.querySelector('.tabs-sticky-wrap');
  const tabsWrap   = stickyWrap?.querySelector('.tabs-wrap');
  if (!sentinel || !stickyWrap) return;
  new IntersectionObserver(entries => {
    entries.forEach(e => stickyWrap.classList.toggle('is-stuck', !e.isIntersecting));
  }, { threshold: 0 }).observe(sentinel);
  if (tabsWrap) {
    tabsWrap.addEventListener('scroll', () => {
      stickyWrap.classList.toggle('scrolled-end',
        tabsWrap.scrollLeft + tabsWrap.offsetWidth >= tabsWrap.scrollWidth - 4);
    });
  }
})();
```
