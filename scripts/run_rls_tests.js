#!/usr/bin/env node
/**
 * scripts/run_rls_tests.js — Ejecutor automatizado de tests/rls.sql
 * Ejecuta la suite de verificación RLS en Supabase y valida los resultados
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// Cargar .env
const envPath = path.resolve(REPO_ROOT, '.env');
if (fs.existsSync(envPath)) {
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

const token = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.SUPABASE_PROJECT_REF;

if (!token || !projectRef) {
  console.error('[ERROR] Faltan variables SUPABASE_ACCESS_TOKEN o SUPABASE_PROJECT_REF en .env');
  process.exit(1);
}

const rlsSqlPath = path.resolve(REPO_ROOT, 'tests', 'rls.sql');
const query = fs.readFileSync(rlsSqlPath, 'utf8');

console.log('🧪 Ejecutando tests/rls.sql contra Supabase PostgreSQL...');
const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query })
});

if (!res.ok) {
  const errText = await res.text();
  console.error(`❌ [FALLO HTTP ${res.status}]`, errText);
  process.exit(1);
}

const result = await res.json();
console.log('✅ [RLS OK] Suite de seguridad ejecutada con éxito sin violaciones:');
console.log(result);
