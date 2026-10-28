-- =============================================================================
-- ESQUEMA DDL POSTGRESQL / SUPABASE — LA FINESTRA
-- Versión: 2.0.2 (Certificación Final de Ciberseguridad & Puesta en Producción)
-- Repositorio: moisesrojasp89-Dev/lafinestra
-- Estándar: Zero-Trust RLS, Timezone-Aware, Idempotente y Defensivo
-- =============================================================================

-- Habilitar extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. TABLA: categorias
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categorias (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    orden INTEGER NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.categorias IS 'Categorías taxonómicas del menú gastronómico';
COMMENT ON COLUMN public.categorias.activo IS 'Si es FALSE, oculta automáticamente la categoría y todos sus platos a anon';

-- -----------------------------------------------------------------------------
-- 2. TABLA: menu_items
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.menu_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    categoria TEXT NOT NULL REFERENCES public.categorias(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    cat TEXT,                            -- Subcategoría visual (ej. 'Pasta Larga', 'Ravioli')
    name TEXT NOT NULL,                  -- Nombre del plato
    descripcion TEXT,                    -- Descripción e ingredientes
    price TEXT NOT NULL,                 -- Precio formateado (ej. '$8,04')
    img TEXT,                            -- Ruta relativa de la foto (ej. 'entradas/burrata_pesto.webp')
    img_style TEXT,                      -- Estilos CSS de encuadre
    wa_text TEXT,                        -- Frase para el mensaje de WhatsApp
    orden INTEGER NOT NULL DEFAULT 0,    -- Orden de despliegue en la carta
    disponible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asegurar constraint UNIQUE para idempotencia incluso en tablas preexistentes (v2.0.0 -> v2.0.2)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_menu_items_cat_name') THEN
        ALTER TABLE public.menu_items ADD CONSTRAINT uq_menu_items_cat_name UNIQUE (categoria, name);
    END IF;
END $$;

COMMENT ON TABLE public.menu_items IS 'Catálogo completo de platos, pizzas, postres y bebidas';
COMMENT ON COLUMN public.menu_items.disponible IS 'Si es FALSE, RLS oculta el plato automáticamente a clientes anon';

-- -----------------------------------------------------------------------------
-- 3. TABLA: destacados
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.destacados (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    badge TEXT NOT NULL,                 -- Etiqueta (ej. '⭐ Chef recomienda', '🔥 Más Vendido')
    name TEXT NOT NULL,
    descripcion TEXT,
    price TEXT NOT NULL,
    img TEXT,
    wa_text TEXT,
    orden INTEGER NOT NULL DEFAULT 0,
    disponible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_destacados_name') THEN
        ALTER TABLE public.destacados ADD CONSTRAINT uq_destacados_name UNIQUE (name);
    END IF;
END $$;

COMMENT ON TABLE public.destacados IS 'Platos recomendados desplegados en el carrusel de inicio';

-- -----------------------------------------------------------------------------
-- 4. TABLA: reservas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reservas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre TEXT NOT NULL,
    telefono TEXT,                       -- Número telefónico de confirmación
    fecha DATE NOT NULL,
    hora TEXT NOT NULL,
    personas TEXT NOT NULL,
    notas TEXT,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'cancelada', 'completada')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asegurar columna telefono y constraint de longitudes sobre tablas preexistentes
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE public.reservas DROP CONSTRAINT IF EXISTS chk_reservas_longitudes;
ALTER TABLE public.reservas ADD CONSTRAINT chk_reservas_longitudes CHECK (
    char_length(nombre) BETWEEN 2 AND 120 AND
    char_length(hora) <= 20 AND
    char_length(personas) <= 20 AND
    (telefono IS NULL OR char_length(telefono) <= 30) AND
    (notas IS NULL OR char_length(notas) <= 500)
);

COMMENT ON TABLE public.reservas IS 'Reservas de mesa solicitadas por comensales';

-- -----------------------------------------------------------------------------
-- 5. ÍNDICES DE RENDIMIENTO (Mitigación DoS y Full Table Scans)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_menu_items_cat_disp ON public.menu_items(categoria, disponible, orden ASC);
CREATE INDEX IF NOT EXISTS idx_destacados_disp ON public.destacados(disponible, orden ASC);
CREATE INDEX IF NOT EXISTS idx_reservas_fecha_hora ON public.reservas(fecha, hora);

-- -----------------------------------------------------------------------------
-- 6. TRIGGER DE AUDITORÍA: Actualización automática de updated_at
-- (SECURITY INVOKER + search_path explícito)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at_menu_items ON public.menu_items;
CREATE TRIGGER set_updated_at_menu_items
    BEFORE UPDATE ON public.menu_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_destacados ON public.destacados;
CREATE TRIGGER set_updated_at_destacados
    BEFORE UPDATE ON public.destacados
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_reservas ON public.reservas;
CREATE TRIGGER set_updated_at_reservas
    BEFORE UPDATE ON public.reservas
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 7. FUNCIÓN HELPER DE AUTORIZACIÓN: is_admin()
-- (Verificación estricta de app_metadata inmutable)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    FALSE
  );
$$;

-- -----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destacados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

-- Limpieza preventiva e idempotente de políticas
DROP POLICY IF EXISTS "Lectura publica categorias" ON public.categorias;
DROP POLICY IF EXISTS "Lectura publica menu_items disponibles" ON public.menu_items;
DROP POLICY IF EXISTS "Lectura publica destacados disponibles" ON public.destacados;
DROP POLICY IF EXISTS "Creacion publica reservas" ON public.reservas;
DROP POLICY IF EXISTS "Gestion total admin categorias" ON public.categorias;
DROP POLICY IF EXISTS "Gestion total admin menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "Gestion total admin destacados" ON public.destacados;
DROP POLICY IF EXISTS "Gestion total admin reservas" ON public.reservas;

-- ── 8.1 Políticas Públicas (anon) ──────────────────────────────────────────

-- Anon solo lee categorías activas
CREATE POLICY "Lectura publica categorias"
    ON public.categorias FOR SELECT
    TO anon, authenticated
    USING (activo = TRUE);

-- Anon solo lee platos disponibles cuya categoría padre también esté activa
CREATE POLICY "Lectura publica menu_items disponibles"
    ON public.menu_items FOR SELECT
    TO anon, authenticated
    USING (
        disponible = TRUE
        AND EXISTS (
            SELECT 1 FROM public.categorias c
            WHERE c.id = menu_items.categoria AND c.activo = TRUE
        )
    );

-- Anon solo lee destacados marcados como disponibles
CREATE POLICY "Lectura publica destacados disponibles"
    ON public.destacados FOR SELECT
    TO anon, authenticated
    USING (disponible = TRUE);

-- Anon puede registrar reservas con estado 'pendiente' y fecha en hora local de Venezuela (UTC-4)
-- Ajuste: evalúa contra (NOW() AT TIME ZONE 'America/Caracas')::DATE para no rechazar reservas nocturnas pasadas las 8:00 PM
CREATE POLICY "Creacion publica reservas"
    ON public.reservas FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        estado = 'pendiente'
        AND fecha >= (NOW() AT TIME ZONE 'America/Caracas')::DATE
    );

-- ── 8.2 Políticas Administrativas Blindadas (authenticated) ────────────────
-- Requiere claim role='admin' en app_metadata

CREATE POLICY "Gestion total admin categorias"
    ON public.categorias FOR ALL
    TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Gestion total admin menu_items"
    ON public.menu_items FOR ALL
    TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Gestion total admin destacados"
    ON public.destacados FOR ALL
    TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Gestion total admin reservas"
    ON public.reservas FOR ALL
    TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());
