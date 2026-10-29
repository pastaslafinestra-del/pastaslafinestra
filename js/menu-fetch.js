/**
 * menu-fetch.js — Capa de datos con arquitectura Local-First Resilient Fallback.
 *
 * Prioridad de carga:
 *   1. Intenta consultar Supabase REST API con timeout acotado (1500ms).
 *   2. Si la conexión falla (DNS no resuelve, offline, 404/500, timeout),
 *      conmuta automáticamente al catálogo tipado local (menu-data.js).
 *
 * Invariante: loadMenuData() NUNCA arroja excepciones no controladas.
 * La carta de La Finestra siempre se renderiza sin interrupción.
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

export function fmtPrice(priceUsd, priceMaxUsd) {
  if (priceUsd === null || priceUsd === undefined) return '';
  const fmt = (n) => '$' + Number(n).toFixed(2).replace('.', ',');
  if (priceMaxUsd !== null && priceMaxUsd !== undefined && Number(priceMaxUsd) > Number(priceUsd)) {
    return `${fmt(priceUsd)} – ${fmt(priceMaxUsd)}`;
  }
  return fmt(priceUsd);
}

export async function loadMenuData() {
  try {
    const [items, destacados] = await Promise.all([
      fetchTable('menu_items', 'disponible=eq.true&order=orden.asc'),
      fetchTable('destacados', 'select=id,badge,orden,disponible,name,descripcion,price,img,wa_text,menu_items(id,name,descripcion,price_usd,price_max_usd,price,img,wa_text)&disponible=eq.true&order=orden.asc'),
    ]);

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('[Supabase] Respuesta vacía o inválida');
    }

    // Reconstruye el formato esperado por mcard.js
    const menuData = {};
    items.forEach(row => {
      if (!menuData[row.categoria]) menuData[row.categoria] = [];
      const displayPrice = row.price_usd != null ? fmtPrice(row.price_usd, row.price_max_usd) : row.price;
      menuData[row.categoria].push({
        name:     row.name,
        desc:     row.descripcion,
        price:    displayPrice,
        priceUsd: row.price_usd != null ? Number(row.price_usd) : null,
        cat:      row.cat,
        img:      row.img,
        imgStyle: row.img_style,
        waText:   row.wa_text,
      });
    });

    const destacadosData = destacados.map(row => {
      const m = row.menu_items || {};
      const displayPrice = m.price_usd != null ? fmtPrice(m.price_usd, m.price_max_usd) : (m.price || row.price);
      return {
        badge:    row.badge,
        name:     m.name || row.name,
        desc:     m.descripcion || row.descripcion,
        price:    displayPrice,
        priceUsd: m.price_usd != null ? Number(m.price_usd) : null,
        img:      m.img || row.img,
        waText:   m.wa_text || row.wa_text,
      };
    });

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
