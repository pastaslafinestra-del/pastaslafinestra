-- ==============================================================================
-- MIGRACIÓN 006 — PURGA DE POLÍTICAS LEGACY Y MITIGACIÓN DE RESERVAS
-- ==============================================================================
-- 1. Elimina políticas legacy permisivas que puenteaban is_admin().
-- 2. Agrega índice único para prevenir duplicación masiva de reservas por slot.
-- ==============================================================================

-- 1. Purga de políticas residuales permisivas (qual: true)
DROP POLICY IF EXISTS "admin write menu" ON public.menu_items;
DROP POLICY IF EXISTS "lectura publica menu" ON public.menu_items;
DROP POLICY IF EXISTS "admin write dest" ON public.destacados;
DROP POLICY IF EXISTS "lectura publica destacados" ON public.destacados;

-- 2. Mitigación en base de datos para spam de reservas (S-07)
-- Impide que un mismo teléfono registre múltiples reservas para la misma fecha y hora
CREATE UNIQUE INDEX IF NOT EXISTS uq_reservas_telefono_fecha_hora
  ON public.reservas (telefono, fecha, hora)
  WHERE telefono IS NOT NULL;
