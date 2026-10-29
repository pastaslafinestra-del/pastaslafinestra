#!/usr/bin/env node
/**
 * ==============================================================================
 * LA FINESTRA — GESTOR DE USUARIOS ADMINISTRATIVOS (SUPABASE AUTH)
 * ==============================================================================
 * Crea o actualiza usuarios con el claim obligatorio app_metadata: { role: 'admin' }
 * requerido por las políticas RLS public.is_admin() en PostgreSQL.
 *
 * Uso:
 *   node scripts/create_admin.js <email> <password>
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// Cargar .env si existe
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

async function getServiceRoleKey(projectRef, accessToken) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    throw new Error(`[HTTP ${res.status}] No se pudieron obtener las API keys de Supabase`);
  }
  const keys = await res.json();
  const serviceKey = keys.find(k => k.name === 'service_role')?.api_key;
  if (!serviceKey) {
    throw new Error('No se encontró la clave service_role en el proyecto de Supabase');
  }
  return serviceKey;
}

async function main() {
  const args = process.argv.slice(2);
  const email = args[0]?.trim();
  const password = args[1]?.trim();

  console.log('\n🔐 =================================================================');
  console.log('   LA FINESTRA — PROVISIONAMIENTO DE ADMINISTRADOR (SUPABASE AUTH)');
  console.log('=================================================================');

  if (!email || !password) {
    console.log('Uso:');
    console.log('  node scripts/create_admin.js <email> <password>\n');
    console.log('Ejemplo:');
    console.log('  node scripts/create_admin.js admin@lafinestra.com "MiPasswordSeguro123"\n');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('❌ La contraseña debe tener al menos 6 caracteres.\n');
    process.exit(1);
  }

  const projectRef = process.env.SUPABASE_PROJECT_REF;
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

  if (!projectRef || !accessToken) {
    console.error('❌ Faltan SUPABASE_PROJECT_REF o SUPABASE_ACCESS_TOKEN en tu archivo .env.');
    process.exit(1);
  }

  process.stdout.write('🔑 Obteniendo credenciales administrativas de Supabase...');
  const serviceKey = await getServiceRoleKey(projectRef, accessToken);
  console.log(' [OK]');

  const authAdminUrl = `https://${projectRef}.supabase.co/auth/v1/admin/users`;

  process.stdout.write(`👤 Registrando usuario admin: ${email}...`);

  // Intentar crear usuario
  const createRes = await fetch(authAdminUrl, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      app_metadata: {
        role: 'admin'
      }
    })
  });

  const createData = await createRes.json();

  if (createRes.ok) {
    console.log(' [CREADO ✅]');
    console.log('\n✨ ¡Usuario administrador provisionado con éxito!');
    console.log(`   • Email:        ${email}`);
    console.log(`   • Rol RLS:      admin (app_metadata: { role: 'admin' })`);
    console.log(`   • Email Estado: Confirmado automáticamente`);
    console.log(`\n👉 Ya puedes iniciar sesión en: https://lafinestra.vercel.app/admin (o en local /admin)\n`);
    return;
  }

  // Si ya existe, actualizar contraseña y app_metadata
  if (createData.msg?.includes('already been registered') || createData.message?.includes('already registered')) {
    console.log(' [YA EXISTE — ACTUALIZANDO ROL Y PASSWORD]');

    // Buscar el usuario existente
    const listRes = await fetch(authAdminUrl, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    });
    const listData = await listRes.json();
    const existing = (listData.users || []).find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!existing) {
      throw new Error(`El usuario ${email} ya existe pero no se pudo localizar su ID.`);
    }

    const updateRes = await fetch(`${authAdminUrl}/${existing.id}`, {
      method: 'PUT',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password,
        email_confirm: true,
        app_metadata: {
          ...existing.app_metadata,
          role: 'admin'
        }
      })
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      throw new Error(`Error al actualizar usuario: ${errText}`);
    }

    console.log('\n✨ ¡Usuario administrador actualizado con éxito!');
    console.log(`   • Email:        ${email}`);
    console.log(`   • Rol RLS:      admin (app_metadata: { role: 'admin' })`);
    console.log(`   • Contraseña:   Actualizada`);
    console.log(`\n👉 Ya puedes iniciar sesión en: https://lafinestra.vercel.app/admin (o en local /admin)\n`);
    return;
  }

  throw new Error(`Error de Supabase Auth: ${JSON.stringify(createData)}`);
}

main().catch(err => {
  console.error(`\n❌ [ERROR] ${err.message}\n`);
  process.exit(1);
});
