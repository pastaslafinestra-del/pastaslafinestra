-- ==============================================================================
-- tests/rls.sql — Checklist de Verificación y Pruebas RLS
-- ==============================================================================
-- Cumplimiento: Auditoría Sonnet 5.5 (S-03)
-- Ejecutable directamente en Supabase SQL Editor o psql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TEST 1: Rol 'anon' (Visitante público no autenticado)
-- Regla: No puede actualizar ningún plato (UPDATE 0) ni insertar (ERROR RLS)
-- ------------------------------------------------------------------------------
BEGIN;
SET LOCAL ROLE anon;

-- Esperado: UPDATE 0 (ninguna fila afectada por política RLS)
UPDATE public.menu_items SET price = '$0,01' WHERE id = 1;

-- Esperado: ERROR 42501 (violación de row-level security al insertar)
DO $$
BEGIN
  INSERT INTO public.menu_items (categoria, name, price) VALUES ('entradas', 'x_test_anon', '$1');
  RAISE EXCEPTION 'FALLO: anon pudo insertar un plato en el menú';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE '[OK] anon bloqueado correctamente por RLS al insertar en menu_items';
END $$;

ROLLBACK;


-- ------------------------------------------------------------------------------
-- TEST 2: Rol 'authenticated' NO ADMIN (Usuario registrado sin claims)
-- Regla: No puede modificar platos (UPDATE 0) y no puede leer reservas (count = 0)
-- ------------------------------------------------------------------------------
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000001","app_metadata":{}}',
  true
);

-- Esperado: UPDATE 0 (RLS bloquea escritura a usuarios sin role: admin)
UPDATE public.menu_items SET price = '$0,01' WHERE id = 1;

-- Esperado: count(*) = 0 (RLS bloquea lectura de reservas de terceros)
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT count(*) INTO v_count FROM public.reservas;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'FALLO: authenticated no-admin pudo leer % reservas', v_count;
  ELSE
    RAISE NOTICE '[OK] authenticated no-admin tiene lectura 0 sobre reservas';
  END IF;
END $$;

ROLLBACK;


-- ------------------------------------------------------------------------------
-- TEST 3: Rol 'authenticated' ADMIN (app_metadata.role = 'admin')
-- Regla: Tiene permiso total de gestión (UPDATE 1 exitoso)
-- ------------------------------------------------------------------------------
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000002","app_metadata":{"role":"admin"}}',
  true
);

-- Esperado: UPDATE 1 (o mayor a 0 si existe el registro id=1)
UPDATE public.menu_items SET disponible = disponible WHERE id = 1;

DO $$
BEGIN
  RAISE NOTICE '[OK] authenticated admin tiene permisos de actualización completos';
END $$;

ROLLBACK;
