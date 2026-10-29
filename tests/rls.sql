-- ==============================================================================
-- tests/rls.sql — Checklist de Verificación y Pruebas RLS
-- ==============================================================================
-- Ejecutable directamente en Supabase SQL Editor, psql o via scripts/run_rls_tests.js
-- Implementa asserts explícitos con GET DIAGNOSTICS n = ROW_COUNT
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TEST 1: Rol 'anon' (Visitante público no autenticado)
-- Regla: No puede actualizar ningún plato (UPDATE 0) ni insertar (ERROR RLS)
-- ------------------------------------------------------------------------------
BEGIN;
SET LOCAL ROLE anon;

-- Assert 1.1: UPDATE debe afectar exactamente 0 filas
DO $$
DECLARE n int;
BEGIN
  UPDATE public.menu_items SET price_usd = price_usd WHERE id = (SELECT min(id) FROM public.menu_items);
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN
    RAISE EXCEPTION 'FALLO RLS: anon actualizó % filas (esperado: 0)', n;
  END IF;
  RAISE NOTICE '[OK] TEST 1.1: anon bloqueado en UPDATE (ROW_COUNT = 0)';
END $$;

-- Assert 1.2: INSERT debe fallar con insufficient_privilege
DO $$
BEGIN
  INSERT INTO public.menu_items (categoria, name, price, price_usd) VALUES ('entradas', 'x_test_anon', '$1', 1.00);
  RAISE EXCEPTION 'FALLO RLS: anon pudo insertar un plato en el menú';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE '[OK] TEST 1.2: anon bloqueado correctamente por RLS al insertar en menu_items';
END $$;

ROLLBACK;


-- ------------------------------------------------------------------------------
-- TEST 2: Rol 'authenticated' NO ADMIN (Usuario registrado sin claims en app_metadata)
-- Regla: No puede modificar platos (UPDATE 0) y no puede leer reservas (count = 0)
-- ------------------------------------------------------------------------------
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000001","app_metadata":{}}',
  true
);

-- Assert 2.1: UPDATE debe afectar exactamente 0 filas
DO $$
DECLARE n int;
BEGIN
  UPDATE public.menu_items SET price_usd = price_usd WHERE id = (SELECT min(id) FROM public.menu_items);
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN
    RAISE EXCEPTION 'FALLO RLS: authenticated no-admin actualizó % filas (esperado: 0)', n;
  END IF;
  RAISE NOTICE '[OK] TEST 2.1: authenticated no-admin bloqueado en UPDATE (ROW_COUNT = 0)';
END $$;

-- Assert 2.2: SELECT count(*) en reservas debe ser 0
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT count(*) INTO v_count FROM public.reservas;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'FALLO RLS: authenticated no-admin pudo leer % reservas ajenas', v_count;
  ELSE
    RAISE NOTICE '[OK] TEST 2.2: authenticated no-admin tiene lectura 0 sobre reservas';
  END IF;
END $$;

ROLLBACK;


-- ------------------------------------------------------------------------------
-- TEST 3: Rol 'authenticated' ADMIN (app_metadata.role = 'admin')
-- Regla: Tiene permiso total de gestión (UPDATE > 0 exitoso)
-- ------------------------------------------------------------------------------
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000002","app_metadata":{"role":"admin"}}',
  true
);

-- Assert 3.1: UPDATE debe afectar al menos 1 fila
DO $$
DECLARE n int;
BEGIN
  UPDATE public.menu_items SET disponible = disponible WHERE id = (SELECT min(id) FROM public.menu_items);
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN
    RAISE EXCEPTION 'FALLO RLS: admin no pudo actualizar ninguna fila (ROW_COUNT = 0)';
  END IF;
  RAISE NOTICE '[OK] TEST 3.1: admin autorizado en UPDATE (ROW_COUNT = %)', n;
END $$;

ROLLBACK;
