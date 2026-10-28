# 🛡️ Bitácora de Seguridad y Gobernanza — La Finestra

---

### [2026-10-28] Hito 2.0.0 — Auditoría de Vulnerabilidades y Establecimiento del Harness
- **Erradicación de Secretos en Cliente:** Identificación de contraseña en texto plano en `admin.html` (`finestra2024`). Desacoplamiento de la interfaz y eliminación de credenciales duras.
- **Creación del Harness Institucional:**
  - Redacción e implementación de `AGENTS.md` (guardrails de IA, mandamientos inquebrantables).
  - Creación de `GEMINI.md` para contexto operativo de asistentes.
  - Creación de `SPEC.md` con Anti-Scope formal y viajes de usuario.
  - Adopción de la técnica de auto-aprendizaje continuo 5-Whys en `docs/standards_and_harness/self_learning_error_catalog.md`.
- **Quality Gate Automatizado:**
  - Desarrollo de `scripts/quality_gate.js` para escaneo continuo de secretos, chequeo de integridad de imports y verificación de estándares documentales.


---

### [2026-10-28] Hito 2.0.1 — Subsanación de Auditoría de Ciberseguridad y Hardening RLS
- **Remediación SEC-01:** Implementación de `public.is_admin()` para restringir operaciones administrativas exclusivas a usuarios con claim `role = 'admin'` en `app_metadata` (mitigación contra auto-registro de usuarios en Supabase Auth).
- **Remediación SEC-02 & DAT-02:** Blindaje de la tabla `reservas` contra inyecciones de estado (`estado = 'pendiente'`), fechas en el pasado (`fecha >= CURRENT_DATE`), y ataques de DoS/XSS mediante constraint de longitudes (`chk_reservas_longitudes`) y nueva columna `telefono`.
- **Remediación SEC-03:** Corrección de la función `handle_updated_at()` a `SECURITY INVOKER` con `SET search_path = public` para eliminar alertas en Security Advisor de Supabase.
- **Remediación SEC-04:** Protección de privacidad en platos; la lectura pública ahora exige `c.activo = TRUE` en la categoría padre.
- **Documentación:** Registro del incidente `[ERR-004]` con análisis 5-Whys en el catálogo de auto-aprendizaje.

---

### [2026-10-28] Hito 2.0.2 — Alineación Frontend con Hardening RLS v2.0.2
- **Gestión de Sesión Zero-Trust en Cliente:** El panel administrativo (`admin.js`) ya no depende únicamente de hashes locales, sino que implementa flujo nativo contra Supabase Auth `/auth/v1/token`, almacenando JWTs firmados en `sessionStorage` y enviándolos en cada mutación bajo la cabecera `Authorization: Bearer <jwt>`.
- **Alineación de Restricciones RLS y DDL:** `reservas.js` valida activamente en cliente las restricciones impuestas por `chk_reservas_longitudes` y la restricción temporal nocturna `(NOW() AT TIME ZONE 'America/Caracas')::DATE`, impidiendo envíos de payloads destinados a fallar en la base de datos.
- **Protección de Inserción Anónima:** Confirmación y verificación de la cabecera `'Prefer': 'return=minimal'` en inserciones públicas de `reservas`, evitando el error 401/403 por falta de privilegios SELECT en el rol anónimo.
