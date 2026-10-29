#!/usr/bin/env node
/**
 * ==============================================================================
 * LA FINESTRA — RUNNER INSTITUCIONAL DE MIGRACIONES AUTOMATIZADAS
 * ==============================================================================
 * Gobernanza: Basado en estándares AEON y ChatbotWS
 * Certificación Arquitectónica: Aprobado con Correcciones Obligatorias (Oct 2026)
 *
 * Características de Ingeniería:
 * 1. Lock Transaccional: pg_advisory_xact_lock(2026102801) dentro de BEGIN ... COMMIT
 *    (previene bloqueos huérfanos en pooler :6543 Transaction Mode y en HTTPS stateless).
 * 2. Transacción Atómica Única por Archivo: DDL/DML + INSERT en auditoría en el mismo bloque.
 * 3. Normalización Estricta SHA-256: .replace(/\r\n/g, '\n').trim() contra falsos positivos CRLF/LF.
 * 4. Simulación Transaccional Real (--dry-run): Ejecución con ROLLBACK en motor PostgreSQL real.
 * 5. Cero Secretos e Identificadores Hardcodeados: Lectura dinámica de SUPABASE_PROJECT_REF.
 * 6. Dual Transport: Supabase Management API HTTPS (cero dependencias) o TCP Pooler (pg).
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const MIGRATIONS_DIR = path.resolve(REPO_ROOT, 'docs', 'database', 'migrations');
const ADVISORY_LOCK_ID = 2026102801;

// -----------------------------------------------------------------------------
// 1. CARGA NATIVA DE VARIABLES DE ENTORNO (.env)
// -----------------------------------------------------------------------------
function loadEnv() {
  const envPath = path.resolve(REPO_ROOT, '.env');
  if (!fs.existsSync(envPath)) return;

  try {
    const raw = fs.readFileSync(envPath, 'utf8');
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch (err) {
    console.warn(`[WARN] No se pudo leer .env: ${err.message}`);
  }
}

loadEnv();

// -----------------------------------------------------------------------------
// 2. UTILIDADES DE SEGURIDAD Y NORMALIZACIÓN
// -----------------------------------------------------------------------------
function maskUrl(url) {
  if (!url) return '';
  return url.replace(/:([^@/]+)@/, ':***@');
}

function maskToken(token) {
  if (!token) return '';
  if (token.length <= 8) return '***';
  return token.substring(0, 4) + '...' + token.substring(token.length - 4);
}

function resolveProjectRef() {
  if (process.env.SUPABASE_PROJECT_REF) {
    return process.env.SUPABASE_PROJECT_REF.trim();
  }
  const dbUrl = process.env.DATABASE_URL || '';
  const matchDb = dbUrl.match(/postgres\.([a-z0-9_-]+):/i);
  if (matchDb) return matchDb[1];

  const supaUrl = process.env.SUPABASE_URL || '';
  const matchUrl = supaUrl.match(/https:\/\/([a-z0-9_-]+)\.supabase\.co/i);
  if (matchUrl) return matchUrl[1];

  return null;
}

/**
 * Normalización estricta del contenido SQL según la Regla 3 del Arquitecto.
 * Elimina discrepancias CRLF vs LF y espacios iniciales/finales.
 */
function computeChecksum(rawSql) {
  const normalized = rawSql.replace(/\r\n/g, '\n').trim();
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

/**
 * Sanitiza sentencias BEGIN y COMMIT externas escritas a nivel de archivo (Regla 2).
 * Respeta bloques internos de PL/pgSQL (DO $$ BEGIN ... END $$; o funciones).
 */
function sanitizeOuterTransactions(sql) {
  const lines = sql.split(/\r?\n/);
  const result = [];
  let inPlPgSql = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detección de entrada/salida de strings de dólar $$ (bloques PL/pgSQL)
    const dollarMatches = (line.match(/\$\$/g) || []).length;
    if (dollarMatches % 2 === 1) {
      inPlPgSql = !inPlPgSql;
    }

    if (!inPlPgSql) {
      // Ignorar BEGIN; o BEGIN TRANSACTION; en el ámbito global
      if (/^BEGIN(\s+TRANSACTION)?\s*;?$/i.test(trimmed)) {
        continue;
      }
      // Ignorar COMMIT; o COMMIT TRANSACTION; en el ámbito global
      if (/^COMMIT(\s+TRANSACTION)?\s*;?$/i.test(trimmed)) {
        continue;
      }
    }
    result.push(line);
  }

  return result.join('\n').trim();
}

// -----------------------------------------------------------------------------
// 3. TABLA DE AUDITORÍA INMUTABLE
// -----------------------------------------------------------------------------
const AUDIT_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS public.schema_migrations_audit (
    filename VARCHAR(255) PRIMARY KEY,
    checksum CHAR(64) NOT NULL,
    applied_by VARCHAR(100) DEFAULT CURRENT_USER,
    execution_time_ms INTEGER NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.schema_migrations_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.schema_migrations_audit FROM PUBLIC, anon, authenticated;
`;

// -----------------------------------------------------------------------------
// 4. CLIENTE DE TRANSPORTE A: SUPABASE MANAGEMENT API (HTTPS / ZERO-DEP)
// -----------------------------------------------------------------------------
class SupabaseHttpsRunner {
  constructor(projectRef, accessToken) {
    this.projectRef = projectRef;
    this.accessToken = accessToken;
    this.endpoint = `https://api.supabase.com/v1/projects/${this.projectRef}/database/query`;
  }

  async executeQuery(sql) {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!res.ok) {
      const errText = await res.text();
      let parsedMessage = errText;
      try {
        const parsed = JSON.parse(errText);
        parsedMessage = parsed.message || parsed.error || errText;
      } catch (_) {}
      throw new Error(`[HTTP ${res.status}] ${parsedMessage}`);
    }

    return await res.json();
  }

  async ensureAuditTable() {
    await this.executeQuery(AUDIT_TABLE_SQL);
  }

  async getAppliedMigrations() {
    try {
      const rows = await this.executeQuery(`
        SELECT filename, checksum, applied_by, execution_time_ms, executed_at
        FROM public.schema_migrations_audit
        ORDER BY executed_at ASC;
      `);
      const map = new Map();
      if (Array.isArray(rows)) {
        for (const row of rows) {
          map.set(row.filename, {
            checksum: row.checksum,
            applied_by: row.applied_by,
            execution_time_ms: row.execution_time_ms,
            executed_at: row.executed_at
          });
        }
      }
      return map;
    } catch (err) {
      if (err.message.includes('schema_migrations_audit') || err.message.includes('does not exist')) {
        await this.ensureAuditTable();
        return new Map();
      }
      throw err;
    }
  }

  async applyMigration(filename, sqlContent, checksum, isDryRun) {
    const sanitized = sanitizeOuterTransactions(sqlContent);
    const escapedFilename = filename.replace(/'/g, "''");
    const escapedChecksum = checksum.replace(/'/g, "''");

    const startTime = Date.now();

    // Payload Atómico Único según Reglas 1, 2 y 4:
    // Lock transaccional + Migración + Auditoría + COMMIT (o ROLLBACK en dry-run)
    const transactionSql = `
BEGIN;
SELECT pg_advisory_xact_lock(${ADVISORY_LOCK_ID});

${sanitized}

INSERT INTO public.schema_migrations_audit (filename, checksum, execution_time_ms, applied_by)
VALUES ('${escapedFilename}', '${escapedChecksum}', 0, CURRENT_USER)
ON CONFLICT (filename) DO UPDATE
SET checksum = EXCLUDED.checksum, execution_time_ms = EXCLUDED.execution_time_ms, executed_at = NOW();

${isDryRun ? 'ROLLBACK;' : 'COMMIT;'}
    `.trim();

    await this.executeQuery(transactionSql);
    const elapsedMs = Date.now() - startTime;

    // Si no fue dry-run, actualizar el tiempo de ejecución exacto medido
    if (!isDryRun) {
      try {
        await this.executeQuery(`
          UPDATE public.schema_migrations_audit
          SET execution_time_ms = ${elapsedMs}
          WHERE filename = '${escapedFilename}';
        `);
      } catch (_) {}
    }

    return elapsedMs;
  }
}

// -----------------------------------------------------------------------------
// 5. CLIENTE DE TRANSPORTE B: POSTGRESQL POOLER DIRECTO (pg)
// -----------------------------------------------------------------------------
class PostgresTcpRunner {
  constructor(databaseUrl) {
    this.databaseUrl = databaseUrl;
    this.client = null;
  }

  async connect() {
    let pgModule;
    try {
      pgModule = await import('pg');
    } catch {
      throw new Error(
        "El paquete 'pg' no está instalado en node_modules.\n" +
        "Para usar conexión directa TCP (DATABASE_URL), ejecuta: npm install pg --save-dev\n" +
        "O configura SUPABASE_ACCESS_TOKEN en tu archivo .env para usar la HTTPS Management API (sin dependencias)."
      );
    }
    const Client = pgModule.default?.Client || pgModule.Client;
    this.client = new Client({
      connectionString: this.databaseUrl,
      connectionTimeoutMillis: 10000
    });
    await this.client.connect();
  }

  async close() {
    if (this.client) {
      await this.client.end();
      this.client = null;
    }
  }

  async ensureAuditTable() {
    await this.client.query(AUDIT_TABLE_SQL);
  }

  async getAppliedMigrations() {
    try {
      const res = await this.client.query(`
        SELECT filename, checksum, applied_by, execution_time_ms, executed_at
        FROM public.schema_migrations_audit
        ORDER BY executed_at ASC;
      `);
      const map = new Map();
      for (const row of res.rows) {
        map.set(row.filename, {
          checksum: row.checksum,
          applied_by: row.applied_by,
          execution_time_ms: row.execution_time_ms,
          executed_at: row.executed_at
        });
      }
      return map;
    } catch (err) {
      if (err.message.includes('schema_migrations_audit') || err.message.includes('does not exist')) {
        await this.ensureAuditTable();
        return new Map();
      }
      throw err;
    }
  }

  async applyMigration(filename, sqlContent, checksum, isDryRun) {
    const sanitized = sanitizeOuterTransactions(sqlContent);
    const startTime = Date.now();

    await this.client.query('BEGIN');
    try {
      await this.client.query(`SELECT pg_advisory_xact_lock(${ADVISORY_LOCK_ID});`);
      await this.client.query(sanitized);

      await this.client.query(`
        INSERT INTO public.schema_migrations_audit (filename, checksum, execution_time_ms, applied_by)
        VALUES ($1, $2, $3, CURRENT_USER)
        ON CONFLICT (filename) DO UPDATE
        SET checksum = EXCLUDED.checksum, execution_time_ms = EXCLUDED.execution_time_ms, executed_at = NOW();
      `, [filename, checksum, 0]);

      const elapsedMs = Date.now() - startTime;

      if (isDryRun) {
        await this.client.query('ROLLBACK');
      } else {
        await this.client.query('COMMIT');
        // Actualizar tiempo final
        await this.client.query(
          `UPDATE public.schema_migrations_audit SET execution_time_ms = $1 WHERE filename = $2`,
          [elapsedMs, filename]
        );
      }
      return elapsedMs;
    } catch (err) {
      await this.client.query('ROLLBACK');
      throw err;
    }
  }
}

// -----------------------------------------------------------------------------
// 6. DETECCIÓN AUTOMÁTICA DEL RUNNER DISPONIBLE
// -----------------------------------------------------------------------------
async function resolveRunner() {
  const projectRef = resolveProjectRef();
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (accessToken && projectRef) {
    return {
      type: 'HTTPS_MANAGEMENT_API',
      description: `Supabase Management API HTTPS (Project Ref: ${projectRef}, Token: ${maskToken(accessToken)})`,
      runner: new SupabaseHttpsRunner(projectRef, accessToken)
    };
  }

  if (databaseUrl) {
    const runner = new PostgresTcpRunner(databaseUrl);
    return {
      type: 'POSTGRES_TCP',
      description: `PostgreSQL Pooler TCP (${maskUrl(databaseUrl)})`,
      runner
    };
  }

  return {
    type: 'NONE',
    description: 'Sin credenciales activas configuradas en .env',
    runner: null
  };
}

// -----------------------------------------------------------------------------
// 7. ORQUESTACIÓN Y COMANDOS CLI
// -----------------------------------------------------------------------------
function listMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();
}

async function handleStatus() {
  console.log('\n📊 ESTADO DE MIGRACIONES — LA FINESTRA\n=================================================================');
  const files = listMigrationFiles();
  if (files.length === 0) {
    console.log('ℹ️  No hay archivos de migración en docs/database/migrations/.');
    return;
  }

  const transport = await resolveRunner();
  console.log(`🔌 Conector: ${transport.description}`);

  if (!transport.runner) {
    console.log('\n⚠️  Mostrando solo archivos locales (sin conexión remota a Supabase):');
    for (const f of files) {
      const fullPath = path.join(MIGRATIONS_DIR, f);
      const raw = fs.readFileSync(fullPath, 'utf8');
      const hash = computeChecksum(raw);
      console.log(`  • ${f.padEnd(36)} [LOCAL] (SHA-256: ${hash.substring(0, 12)}...)`);
    }
    console.log('\n💡 Tip: Configura SUPABASE_ACCESS_TOKEN o DATABASE_URL en .env para ver el estado remoto.');
    return;
  }

  if (transport.type === 'POSTGRES_TCP') {
    await transport.runner.connect();
  }

  try {
    const appliedMap = await transport.runner.getAppliedMigrations();
    console.log('\nArchivo                                Estado               Detalles');
    console.log('---------------------------------------------------------------------------------');

    for (const f of files) {
      const fullPath = path.join(MIGRATIONS_DIR, f);
      const raw = fs.readFileSync(fullPath, 'utf8');
      const localHash = computeChecksum(raw);
      const record = appliedMap.get(f);

      if (!record) {
        console.log(`${f.padEnd(38)} [PENDIENTE]          Aún no ejecutado en Supabase`);
      } else if (record.checksum === localHash) {
        const timeStr = `${record.execution_time_ms || 0}ms`;
        console.log(`${f.padEnd(38)} [APLICADO ✅]        Ejecutado (${timeStr}) (SHA: ${localHash.substring(0, 8)}...)`);
      } else {
        console.log(`${f.padEnd(38)} [🚨 DESAJUSTE HASH]   BD: ${record.checksum.substring(0, 8)}... != Local: ${localHash.substring(0, 8)}...`);
      }
    }
  } finally {
    if (transport.type === 'POSTGRES_TCP') {
      await transport.runner.close();
    }
  }
}

async function handleMigrate(options) {
  const { all, file, dryRun } = options;
  console.log('\n🔄 =================================================================');
  console.log(`   LA FINESTRA — DISPATCHER DE MIGRACIONES ${dryRun ? '[SIMULACIÓN --DRY-RUN]' : '[PRODUCCIÓN]'}`);
  console.log('   Estándar de Gobernanza Institucional AEON & ChatbotWS');
  console.log('=================================================================');

  const files = listMigrationFiles();
  let targetFiles = [];

  if (file) {
    const base = path.basename(file);
    if (!files.includes(base)) {
      throw new Error(`El archivo especificado no existe en docs/database/migrations/: ${base}`);
    }
    targetFiles = [base];
  } else if (all) {
    targetFiles = files;
  } else {
    console.log('Uso:');
    console.log('  node scripts/db_migrate.js --all');
    console.log('  node scripts/db_migrate.js --all --dry-run');
    console.log('  node scripts/db_migrate.js --file docs/database/migrations/001_initial_schema_v2.0.2.sql');
    console.log('  node scripts/db_migrate.js --status');
    return;
  }

  const transport = await resolveRunner();
  console.log(`🔌 Conector: ${transport.description}`);

  // Simulación Offline si no hay credenciales (Regla 4)
  if (!transport.runner) {
    console.log('\n⚠️  MODO OFFLINE — Sin credenciales configuradas en .env.');
    console.log('📋 Plan de ejecución previsto:');
    for (let i = 0; i < targetFiles.length; i++) {
      const f = targetFiles[i];
      const raw = fs.readFileSync(path.join(MIGRATIONS_DIR, f), 'utf8');
      const hash = computeChecksum(raw);
      console.log(`  [${i + 1}/${targetFiles.length}] ${f.padEnd(36)} (SHA: ${hash.substring(0, 12)}...)`);
    }
    console.log('\n💡 Para ejecutar contra la base de datos real, configura tu .env (ver .env.example).');
    return;
  }

  if (transport.type === 'POSTGRES_TCP') {
    await transport.runner.connect();
  }

  try {
    const appliedMap = await transport.runner.getAppliedMigrations();
    let appliedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < targetFiles.length; i++) {
      const f = targetFiles[i];
      const fullPath = path.join(MIGRATIONS_DIR, f);
      const raw = fs.readFileSync(fullPath, 'utf8');
      const checksum = computeChecksum(raw);
      const record = appliedMap.get(f);

      if (record && !dryRun) {
        if (record.checksum === checksum) {
          console.log(`[${i + 1}/${targetFiles.length}] ${f.padEnd(36)} ... [SKIPPED] (Ya aplicado previamente)`);
          skippedCount++;
          continue;
        } else {
          console.warn(`[${i + 1}/${targetFiles.length}] 🚨 ALERTA: ${f} ya fue aplicado pero su hash local difiere.`);
          console.warn(`       BD:    ${record.checksum}`);
          console.warn(`       Local: ${checksum}`);
        }
      }

      const prefix = `[${i + 1}/${targetFiles.length}] ${f.padEnd(36)} ...`;
      process.stdout.write(`${prefix} aplicando...`);

      const elapsedMs = await transport.runner.applyMigration(f, raw, checksum, dryRun);

      if (dryRun) {
        console.log(`\r${prefix} [DRY_RUN_OK] (Validado en PostgreSQL - ROLLBACK) (${elapsedMs} ms)`);
      } else {
        console.log(`\r${prefix} [APPLIED ✅] (${elapsedMs} ms) (SHA: ${checksum.substring(0, 8)}...)`);
      }
      appliedCount++;
    }

    console.log('\n-----------------------------------------------------------------');
    if (dryRun) {
      console.log(`✨ Simulación finalizada con éxito: ${appliedCount} verificadas sintácticamente con ROLLBACK.`);
    } else {
      console.log(`✨ Proceso completado: ${appliedCount} aplicadas, ${skippedCount} omitidas.`);
    }
    console.log('-----------------------------------------------------------------\n');
  } finally {
    if (transport.type === 'POSTGRES_TCP') {
      await transport.runner.close();
    }
  }
}

// -----------------------------------------------------------------------------
// 8. PUNTO DE ENTRADA PRINCIPAL
// -----------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const isStatus = args.includes('--status');
  const isDryRun = args.includes('--dry-run');
  const isAll = args.includes('--all');
  const fileIdx = args.indexOf('--file');
  const fileArg = fileIdx !== -1 && args[fileIdx + 1] ? args[fileIdx + 1] : null;

  try {
    if (isStatus) {
      await handleStatus();
    } else if (isAll || fileArg) {
      await handleMigrate({ all: isAll, file: fileArg, dryRun: isDryRun });
    } else {
      await handleMigrate({ all: false, file: null, dryRun: false });
    }
  } catch (err) {
    console.error(`\n❌ [ERROR CRÍTICO] La ejecución falló:\n${err.message}\n`);
    process.exit(1);
  }
}

main();
