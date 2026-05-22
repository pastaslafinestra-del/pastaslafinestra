/**
 * menu-fetch.js — Carga el menú y destacados desde Supabase.
 *
 * Reemplaza menu-data.js. Devuelve los mismos objetos (menuData, destacadosData)
 * que el resto del frontend ya espera — mcard.js no necesita cambios.
 */

import { SUPABASE_URL, SUPABASE_ANON } from './config.js';

const HEADERS = {
  'apikey':        SUPABASE_ANON,
  'Authorization': `Bearer ${SUPABASE_ANON}`,
};

async function fetchTable(table, params = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: HEADERS,
  });
  if (!res.ok) throw new Error(`[Supabase] Error cargando ${table}: ${res.status}`);
  return res.json();
}

export async function loadMenuData() {
  const [items, destacados, secciones] = await Promise.all([
    fetchTable('menu_items', 'disponible=eq.true&order=orden.asc'),
    fetchTable('destacados',  'disponible=eq.true&order=orden.asc'),
    fetchTable('secciones_menu', 'order=orden.asc').catch(() => []), // tabla puede no existir aún
  ]);

  // Reconstruye el mismo formato que mcard.js ya usa
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

  // Mapa de visibilidad de secciones: { entradas: true, congelados: false, ... }
  // Si la tabla está vacía o una sección no tiene fila, se muestra por defecto
  const seccionesConfig = {};
  secciones.forEach(row => { seccionesConfig[row.key] = row.activa; });

  return { menuData, destacadosData, seccionesConfig };
}