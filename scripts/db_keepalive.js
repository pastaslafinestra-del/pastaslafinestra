#!/usr/bin/env node
/**
 * scripts/db_keepalive.js — Diagnóstico de salud y Keep-Alive activo para Supabase
 *
 * Propósito:
 *   1. Realizar peticiones reales a PostgREST (/rest/v1/menu_items y /rest/v1/destacados)
 *      para reiniciar el contador de inactividad de 7 días del plan gratuito de Supabase.
 *   2. Si existen credenciales administrativas en .env (SUPABASE_ACCESS_TOKEN),
 *      ejecutar una consulta directa en PostgreSQL para verificar integridad de tablas.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SUPABASE_URL, SUPABASE_ANON } from '../js/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

function loadEnv() {
  const envPath = path.resolve(REPO_ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const baseUrl = (process.env.SUPABASE_URL || SUPABASE_URL || '').replace(/\/+$/, '');
const anonKey = process.env.SUPABASE_ANON_KEY || SUPABASE_ANON;

console.log('\n💓 =================================================================');
console.log('   SUPABASE KEEP-ALIVE & HEALTH CHECK — LA FINESTRA');
console.log('=================================================================\n');

try {
  const startRest = Date.now();
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };

  const [menuRes, destRes] = await Promise.all([
    fetch(`${baseUrl}/rest/v1/menu_items?select=id,categoria,name,disponible&disponible=eq.true`, { headers }),
    fetch(`${baseUrl}/rest/v1/destacados?select=id,badge,orden,name,img,menu_item_id,menu_items(id,name,img)&disponible=eq.true&order=orden.asc`, { headers }),
  ]);

  if (!menuRes.ok) throw new Error(`PostgREST menu_items devolvió HTTP ${menuRes.status}`);
  if (!destRes.ok) throw new Error(`PostgREST destacados devolvió HTTP ${destRes.status}`);

  const menuItems = await menuRes.json();
  const destacados = await destRes.json();
  const restLatency = Date.now() - startRest;

  console.log(`  [✅ ONLINE] PostgREST API activa (${restLatency} ms)`);
  console.log(`  [📦 DATOS]  ${menuItems.length} platos activos en menu_items | ${destacados.length} destacados activos`);

  for (const d of destacados) {
    const linkedName = d.menu_items?.name || d.name;
    const linkedImg = d.menu_items?.img || d.img || '(sin imagen)';
    console.log(`     • [${d.orden}] ${d.badge} -> ${linkedName} [img: ${linkedImg}]`);
  }

  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  const projectRef = process.env.SUPABASE_PROJECT_REF?.trim();
  if (token && projectRef) {
    const pgStart = Date.now();
    const pgRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `SELECT NOW() AS server_time, current_database() AS db_name, (SELECT count(*) FROM public.reservas) AS total_reservas;`,
      }),
    });
    if (pgRes.ok) {
      const pgData = await pgRes.json();
      const row = Array.isArray(pgData) ? pgData[0] : pgData;
      console.log(`  [🐘 PG SQL] Motor PostgreSQL activo (${Date.now() - pgStart} ms) — Hora servidor: ${row?.server_time} | Reservas registradas: ${row?.total_reservas}`);
    }
  }

  console.log('\n✨ Pulso Keep-Alive registrado exitosamente. Proyecto protegido contra pausa por inactividad.\n');
  process.exit(0);
} catch (err) {
  console.error(`\n❌ [ALERTA KEEP-ALIVE] Error al contactar Supabase: ${err.message}\n`);
  process.exit(1);
}
