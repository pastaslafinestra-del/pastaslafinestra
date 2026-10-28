-- =============================================================================
-- 🍝 LA FINESTRA — DOSSIER DE AUDITORÍA DE BASE DE DATOS Y CIBERSEGURIDAD
-- =============================================================================
-- Repositorio:       moisesrojasp89-Dev/lafinestra
-- Tipo de Archivo:   Master SQL Script (DDL + DML + Políticas RLS + Chequeos de Auditoría)
-- Destinatario:      Arquitecto de Software & Auditor de Ciberseguridad
-- Motor:             PostgreSQL 14+ / Supabase Cloud
-- Versión:           2.0.2 (Certificación Final de Ciberseguridad & Puesta en Producción)
-- Fecha:             2026-10-28
-- =============================================================================

/*
================================================================================
ÍNDICE DE CONTENIDO DEL DOSSIER:
================================================================================
1. MODELO DE AMENAZAS Y ARQUITECTURA DE CIBERSEGURIDAD (THREAT MODEL)
   - Separación de Roles (anon vs authenticated con app_metadata inmutable)
   - Remediación SEC-01: Control de Acceso basado en Claims (public.is_admin())
   - Remediación SEC-02: Blindaje de Inyección de Estado y Storage DoS en Reservas
   - Remediación SEC-03: Eliminación de SECURITY DEFINER en Triggers
   - Remediación SEC-04: Validación de Categoría Activa en Políticas de Platos
2. SCRIPT DDL DE DEFINICIÓN (schema.sql)
   - Extensiones y Configuración Base
   - Tabla: categorias
   - Tabla: menu_items (con UNIQUE categoria, name y ON DELETE RESTRICT)
   - Tabla: destacados (con UNIQUE name)
   - Tabla: reservas (con columna telefono y CHECK chk_reservas_longitudes)
   - Índices de Alto Rendimiento
   - Trigger PL/pgSQL SECURITY INVOKER con search_path explícito
3. MATRIZ DE POLÍTICAS ROW LEVEL SECURITY (RLS HARDENED)
   - Políticas para 'anon' (Solo lectura condicional y creación restringida)
   - Políticas para 'authenticated' restringidas por public.is_admin()
4. SCRIPT DML DE DATOS SEMILLA (seed.sql)
   - 9 Categorías Oficiales (Idempotente ON CONFLICT)
   - 58 Platos Reales de la Carta Italiana (Idempotente ON CONFLICT)
   - 5 Platos Estrella Destacados (Idempotente ON CONFLICT)
5. BATERÍA DE PRUEBAS DE PENETRACIÓN Y AUDITORÍA DE POLÍTICAS RLS (PENTEST SQL)
================================================================================
*/

-- =============================================================================
-- 1. MODELO DE AMENAZAS Y ARQUITECTURA DE CIBERSEGURIDAD
-- =============================================================================
/*
  MATRIZ DE ACCESO POR ROL REMEDIADA (v2.0.1):
  -----------------------------------------------------------------------------
  Tabla        | Rol: anon (Público)              | Rol: authenticated (Admin)
  -----------------------------------------------------------------------------
  categorias   | SELECT (activo = TRUE)           | ALL (restringido a is_admin())
  menu_items   | SELECT (disponible & cat activa) | ALL (restringido a is_admin())
  destacados   | SELECT (disponible = TRUE)       | ALL (restringido a is_admin())
  reservas     | INSERT (estado='pendiente' & >=) | ALL (restringido a is_admin())
  -----------------------------------------------------------------------------

  SUBSANACIÓN DE HALLAZGOS DEL ARQUITECTO:
  - [SEC-01] Prevención de Escalada de Privilegios: Las políticas administrativas
    ya no confían ciegamente en 'authenticated'. Requieren auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'.
  - [SEC-02] Integridad de Reservas: El INSERT público exige estado='pendiente' y fecha >= CURRENT_DATE,
    blindando contra State Tampering y reservas en el pasado.
  - [SEC-02 / DAT-02] Columna telefono y constraint chk_reservas_longitudes para mitigar Storage DoS y XSS.
  - [SEC-03] handle_updated_at() utiliza SECURITY INVOKER con SET search_path = public.
  - [SEC-04] menu_items valida que la categoría padre esté activa (c.activo = TRUE).
  - [DAT-01] Sincronización exacta al 100% con los 58 platos y 5 destacados reales de la carta.
  - [DAT-03] Idempotencia garantizada mediante ON CONFLICT DO UPDATE en todas las tablas.
*/

-- =============================================================================
-- 2. SCRIPT DDL DE DEFINICIÓN DE ESTRUCTURA (SCHEMA)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 2.1 TABLA: categorias
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
-- 2.2 TABLA: menu_items
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.menu_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    categoria TEXT NOT NULL REFERENCES public.categorias(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    cat TEXT,                            -- Subcategoría visual (ej. 'Pasta Larga', 'Ravioli')
    name TEXT NOT NULL,                  -- Nombre gastronómico del plato
    descripcion TEXT,                    -- Ingredientes y notas de preparación
    price TEXT NOT NULL,                 -- Precio formateado (ej. '$8,04')
    img TEXT,                            -- Ruta relativa o clave de Storage (ej. 'entradas/burrata_pesto.webp')
    img_style TEXT,                      -- Estilos CSS de encuadre en card
    wa_text TEXT,                        -- Frase pre-formateada para WhatsApp
    orden INTEGER NOT NULL DEFAULT 0,    -- Orden numérico de visualización
    disponible BOOLEAN NOT NULL DEFAULT TRUE, -- Disponibilidad de cocina
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_menu_items_cat_name UNIQUE (categoria, name)
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
-- 2.3 TABLA: destacados
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.destacados (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    badge TEXT NOT NULL,                 -- Insignia (ej. '⭐ Chef recomienda', '🔥 Más Vendido')
    name TEXT NOT NULL,
    descripcion TEXT,
    price TEXT NOT NULL,
    img TEXT,
    wa_text TEXT,
    orden INTEGER NOT NULL DEFAULT 0,
    disponible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_destacados_name UNIQUE (name)
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_destacados_name') THEN
        ALTER TABLE public.destacados ADD CONSTRAINT uq_destacados_name UNIQUE (name);
    END IF;
END $$;

COMMENT ON TABLE public.destacados IS 'Platos recomendados desplegados en el carrusel de inicio';

-- -----------------------------------------------------------------------------
-- 2.4 TABLA: reservas (Hardened con Columna Teléfono y Constraint de Longitud)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reservas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre TEXT NOT NULL,
    telefono TEXT,                       -- Número telefónico de contacto/confirmación
    fecha DATE NOT NULL,
    hora TEXT NOT NULL,
    personas TEXT NOT NULL,
    notas TEXT,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'cancelada', 'completada')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_reservas_longitudes CHECK (
        char_length(nombre) BETWEEN 2 AND 120 AND
        char_length(hora) <= 20 AND
        char_length(personas) <= 20 AND
        (telefono IS NULL OR char_length(telefono) <= 30) AND
        (notas IS NULL OR char_length(notas) <= 500)
    )
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
-- 2.5 ÍNDICES DE RENDIMIENTO (Mitigación DoS y Full Table Scans)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_menu_items_cat_disp ON public.menu_items(categoria, disponible, orden ASC);
CREATE INDEX IF NOT EXISTS idx_destacados_disp ON public.destacados(disponible, orden ASC);
CREATE INDEX IF NOT EXISTS idx_reservas_fecha_hora ON public.reservas(fecha, hora);

-- -----------------------------------------------------------------------------
-- 2.6 TRIGGER DE AUDITORÍA: Actualización automática de updated_at
-- (Remediación SEC-03: SECURITY INVOKER + SET search_path = public)
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
-- 2.7 FUNCIÓN DE AUTORIZACIÓN: is_admin()
-- (Remediación SEC-01: Blindaje contra auto-registro de usuarios)
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

-- =============================================================================
-- 3. MATRIZ DE POLÍTICAS ROW LEVEL SECURITY (RLS HARDENED)
-- =============================================================================

ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destacados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

-- Limpieza idempotente de políticas previas
DROP POLICY IF EXISTS "Lectura publica categorias" ON public.categorias;
DROP POLICY IF EXISTS "Lectura publica menu_items disponibles" ON public.menu_items;
DROP POLICY IF EXISTS "Lectura publica destacados disponibles" ON public.destacados;
DROP POLICY IF EXISTS "Creacion publica reservas" ON public.reservas;
DROP POLICY IF EXISTS "Gestion total admin categorias" ON public.categorias;
DROP POLICY IF EXISTS "Gestion total admin menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "Gestion total admin destacados" ON public.destacados;
DROP POLICY IF EXISTS "Gestion total admin reservas" ON public.reservas;

-- ── 3.1 POLÍTICAS PÚBLICAS (anon) ──────────────────────────────────────────

-- Anon solo lee categorías activas
CREATE POLICY "Lectura publica categorias"
    ON public.categorias FOR SELECT
    TO anon, authenticated
    USING (activo = TRUE);

-- Anon solo lee platos disponibles cuya categoría padre también esté activa (SEC-04)
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

-- Anon puede registrar reservas únicamente con estado 'pendiente' y fecha en hora local de Venezuela (UTC-4)
CREATE POLICY "Creacion publica reservas"
    ON public.reservas FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        estado = 'pendiente'
        AND fecha >= (NOW() AT TIME ZONE 'America/Caracas')::DATE
    );

-- ── 3.2 POLÍTICAS ADMINISTRATIVAS BLINDADAS (authenticated) ────────────────
-- (SEC-01: Requiere que el usuario autenticado posea el claim role='admin' en app_metadata)

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

-- =============================================================================
-- 4. SCRIPT DML: DATOS SEMILLA REALES (SEED DATA - 100% IDEMPOTENTE)
-- =============================================================================

-- 4.1 INSERTAR CATEGORÍAS (9 Categorías Oficiales)
INSERT INTO public.categorias (id, nombre, orden, activo) VALUES
  ('entradas', 'Entradas', 0, TRUE),
  ('pastas', 'Pastas Frescas', 10, TRUE),
  ('pizzas', 'Pizzas Artesanales', 20, TRUE),
  ('proteinas', 'Proteínas', 30, TRUE),
  ('ensaladas', 'Ensaladas', 40, TRUE),
  ('infantil', 'Menú Infantil', 50, TRUE),
  ('postres', 'Postres', 60, TRUE),
  ('bebidas', 'Bebidas', 70, TRUE),
  ('adicionales', 'Adicionales', 80, TRUE)
ON CONFLICT (id) DO UPDATE 
SET nombre = EXCLUDED.nombre, orden = EXCLUDED.orden, activo = EXCLUDED.activo;

-- 4.2 INSERTAR PLATOS DEL MENÚ (58 Items Reales de js/menu-data.js)
INSERT INTO public.menu_items (categoria, cat, name, descripcion, price, img, img_style, wa_text, orden, disponible) VALUES
  ('entradas', NULL, 'Triángolo al Pomodoro', 'Triángulos de masa crocante, bañados en salsa napolitana y queso pecorino.', '$8,04', NULL, NULL, 'un Triángolo al Pomodoro', 0, TRUE),
  ('entradas', NULL, 'Burrata Pesto', 'Perlas fritas de Mozzarella de Búfala rellenas de pesto, en salsa pomodoro, acompañadas de pan de masa madre.', '$10,64', 'entradas/burrata_pesto.webp', NULL, 'una Burrata Pesto', 1, TRUE),
  ('entradas', NULL, 'Caponata Siciliana', 'Berenjenas, pimentones, cebolla morada, aceitunas negras y tomates encurtidos en aceite de oliva y vinagre de manzana.', '$8,04', NULL, NULL, 'una Caponata Siciliana', 2, TRUE),
  ('entradas', NULL, 'Bruschettas', 'Tostadas de pan de masa madre con tomate deshidratado, pesto y aceto balsámico.', '$8,04', NULL, NULL, 'Bruschettas', 3, TRUE),
  ('entradas', NULL, 'Fettunta', 'Pan de masa madre tostado al estilo toscano.', '$8,04', NULL, NULL, 'Fettunta', 4, TRUE),
  ('entradas', NULL, 'Frittata', 'Bolitas apanadas fritas rellenas de pasta, salsa bologna, mozzarella y queso pecorino, servidas con más salsa bologna.', '$8,04', NULL, NULL, 'Frittata', 5, TRUE),
  ('entradas', NULL, 'Rotolo', 'Rollo de queso crema, pimentón dulce, pistacho, nueces y tocineta, servido como dip para untar en tostadas de pan de masa madre.', '$8,04', 'entradas/Rotolo.webp', NULL, 'Rotolo', 6, TRUE),
  ('pastas', 'Pasta Larga', 'Fettuccine / Tallarín', 'Con la salsa de tu preferencia. Hasta 3 salsas en un mismo plato.', '$8,71', NULL, NULL, 'Pasta Larga', 100, TRUE),
  ('pastas', 'Pastificio ⭐', 'Pastificio', 'En un mismo plato: Pasticho de Bologna, Tallarín 4 Formaggio y Milanesa de Pollo a la Pizzaiola.', '$16,08', NULL, NULL, 'el Pastificio', 101, TRUE),
  ('pastas', 'Pasta Corta', 'Cavatelli / Gnocchi de Papa', 'Con la salsa de tu preferencia. Hasta 3 salsas en un mismo plato.', '$8,71', 'pastas/Gnocchi_s_de_papa.webp', NULL, 'Pasta Corta', 102, TRUE),
  ('pastas', 'Ravioli', 'Ravioli — Almendra & Manzana Acaramelada', 'Ravioli relleno, acompañado de la salsa de tu preferencia.', '$11,39', NULL, NULL, 'Ravioli Almendra y Manzana', 103, TRUE),
  ('pastas', 'Ravioli', 'Ravioli — Carne', 'Ravioli relleno de carne, acompañado de la salsa de tu preferencia.', '$10,05', NULL, NULL, 'Ravioli de Carne', 104, TRUE),
  ('pastas', 'Ravioli', 'Ravioli — Cerdo a la Naranja / Ricotta & Espinaca / Jamón Serrano & Mozz', 'Ravioli relleno a tu elección.', '$9,38 – $11,73', NULL, NULL, 'Ravioli', 105, TRUE),
  ('pastas', 'Frutti di Mare', 'Tallarín Frutti Latte', 'Tallarines salteados en aceite de oliva con salsa frutos del mar (Calamar, Camarón, Pulpo Baby, Mejillón).', '$20,10', 'pastas/Tallarin_frutti_latte.webp', NULL, 'Tallarín Frutti Latte', 106, TRUE),
  ('pastas', 'Frutti di Mare', 'Tallarín Frutti Roja', 'Tallarines en salsa napolitana con frutos del mar (Calamar, Camarón, Pulpo Baby, Mejillón).', '$20,10', 'pastas/Tallarin_Frutti_Roja.webp', NULL, 'Tallarín Frutti Roja', 107, TRUE),
  ('pastas', 'Pasticho', 'Pasticho Tradicional de Bologna', 'Salsa Bologna, Salsa Bechamel, Queso Mozzarella, Queso Parmesano, Jamón Artesanal.', '$9,38', 'pastas/Pasticho_Tradicional_de_Bologna.webp', NULL, 'Pasticho Tradicional', 108, TRUE),
  ('pastas', 'Pasticho', 'Pasticho de Berenjena con Bologna', 'Láminas de Berenjena, Salsa Bologna, Salsa Bechamel, Queso Mozzarella, Queso Parmesano, Jamón Artesanal.', '$9,38', NULL, NULL, 'Pasticho de Berenjena', 109, TRUE),
  ('pastas', 'Ripieno ⭐', 'Ripieno Finestra', 'Bola de pan de masa madre rellena con Brócoli, Zanahoria, Champiñones y Pechuga de Pollo en salsa blanca.', '$10,72', NULL, NULL, 'Ripieno Finestra', 110, TRUE),
  ('pastas', 'Ripieno ⭐', 'Ripieno Ragú', 'Bola de pan de masa madre rellena con Ragú de Mechada.', '$10,72', 'pastas/Ripieno_Ragú.webp', NULL, 'Ripieno Ragú', 111, TRUE),
  ('pastas', 'Ripieno ⭐', 'Ripieno Azzurro', 'Bola de pan de masa madre rellena con Lomito en tiras encurtido en vino tinto y romero, con toque de Queso Azul.', '$12,06', NULL, NULL, 'Ripieno Azzurro', 112, TRUE),
  ('pizzas', NULL, 'Margherita', 'Napolitana, mozzarella, tomate cherry, albahaca fresca, mozzarella de búfala, trazos de pesto.', '$9,38', NULL, NULL, 'Pizza Margherita', 200, TRUE),
  ('pizzas', NULL, 'Quattro Formaggi', 'Bechamel, queso mozzarella, queso brie, queso provolone, queso pecorino crocante.', '$14,74', NULL, NULL, 'Pizza Quattro Formaggi', 201, TRUE),
  ('pizzas', NULL, 'Marinara', 'Napolitana, tomate deshidratado, ajo en rodajas crocantes, anchoas, polvo de aceitunas negras, trazos de albahaca.', '$9,38', 'pizzas/Marinara.webp', NULL, 'Pizza Marinara', 202, TRUE),
  ('pizzas', NULL, 'Quotidiano', 'Napolitana, mozzarella, jamón artesanal, pechuga de pollo en tiras, champiñones salteados en oliva y vino blanco.', '$9,38', NULL, NULL, 'Pizza Quotidiano', 203, TRUE),
  ('pizzas', NULL, 'Valeria', 'Napolitana, mozzarella, pepperoni, queso pecorino crocante.', '$9,38', NULL, NULL, 'Pizza Valeria', 204, TRUE),
  ('pizzas', NULL, 'Frutti di Mare', 'Napolitana, aros de calamar, camarón, pulpo, mejillón negro, perejil deshidratado.', '$20,10', NULL, NULL, 'Pizza Frutti di Mare', 205, TRUE),
  ('pizzas', NULL, 'Purtroppo', 'Pomodoro, mozzarella, tomate confitado, jamón serrano, rúgula, orégano, pecorino en tiras, polvo de aceitunas verdes.', '$11,39', NULL, NULL, 'Pizza Purtroppo', 206, TRUE),
  ('pizzas', NULL, 'Salumiera', 'Pomodoro, mozzarella, jamón artesanal, chorizo español, bologna de cerdo & pistacho, trazos de nuez, pimienta negra.', '$11,39', 'pizzas/Salumiera.webp', NULL, 'Pizza Salumiera', 207, TRUE),
  ('pizzas', NULL, 'Carpaccio', 'Napolitana, tomate deshidratado, carpaccio de lomito, alcaparras asadas, pecorino en lajas, reducción de aceto balsámico.', '$11,39', NULL, NULL, 'Pizza Carpaccio', 208, TRUE),
  ('pizzas', NULL, 'Messo', 'Bechamel, mozzarella, pomodoro, pesto.', '$9,38', NULL, NULL, 'Pizza Messo', 209, TRUE),
  ('proteinas', NULL, 'Milanesa de Pollo a la Pizzaiola', 'Pechuga de pollo apanada, napolitana, mozzarella, tomate cherry y albahaca fresca.', '$10,72', NULL, NULL, 'Milanesa de Pollo', 300, TRUE),
  ('proteinas', NULL, 'Pollo al Limone', 'Pechuga de pollo en salsa de limón y alcaparras, acompañada de vegetales salteados.', '$10,72', NULL, NULL, 'Pollo al Limone', 301, TRUE),
  ('proteinas', NULL, 'Lomito a la Finestra', 'Medallones de lomito en salsa de vino tinto y romero, acompañados de papas rústicas.', '$16,08', NULL, NULL, 'Lomito a la Finestra', 302, TRUE),
  ('ensaladas', NULL, 'Capressa', 'Tomate fresco, mozzarella de búfala, albahaca, aceite de oliva y aceto balsámico.', '$8,04', NULL, NULL, 'Capressa', 400, TRUE),
  ('ensaladas', NULL, 'Giardino', 'Mix de rúgula y lechuga, tomate deshidratado, aceituna negra, palmito, pasas, mozzarella en cubitos, nuez, jamón serrano y aderezo de aceto balsámico con vino.', '$14,74', NULL, NULL, 'Giardino', 401, TRUE),
  ('ensaladas', NULL, 'Panzanella', 'Lechuga, pepino, celery, tomate, aceitunas verdes, toque de cebolla morada, crotones de masa madre, almendras.', '$10,72', NULL, NULL, 'Panzanella', 402, TRUE),
  ('infantil', NULL, 'Pastichito', 'Capas de pasta fresca, salsa bologna, salsa bechamel, jamón de cerdo, mozzarella.', '$5,36', NULL, NULL, 'Pastichito', 500, TRUE),
  ('infantil', NULL, 'Media Porción Pasta Larga', 'Pasta larga a elección, acompañada de la salsa de su preferencia.', '$5,36', NULL, NULL, 'Media Porción Pasta', 501, TRUE),
  ('infantil', NULL, 'Tenders de Pollo', 'Tiras de pechuga de pollo empanizadas y fritas, acompañadas de papas fritas rústicas.', '$8,04', NULL, NULL, 'Tenders de Pollo', 502, TRUE),
  ('infantil', NULL, 'Bambini (Mini Pizza)', 'Mini pizza 20 cms — Napolitana, mozzarella, jamón artesanal.', '$6,70', NULL, NULL, 'Bambini Mini Pizza', 503, TRUE),
  ('postres', NULL, 'Tiramisú Experiencia ⭐', 'Servimos en vivo el mejor tiramisú de la ciudad. Una experiencia única preparada en tu mesa.', '$4,02', NULL, NULL, 'el Tiramisú Experiencia', 600, TRUE),
  ('postres', NULL, 'Pannacotta', 'Nata de crema de leche y queso crema, bañada en reducción de frutos rojos.', '$4,02', NULL, NULL, 'Pannacotta', 601, TRUE),
  ('postres', NULL, 'Cheesecake de Maracuyá', 'Base de galleta dulce triturada, con capa a base de queso crema y topping de maracuyá.', '$4,02', NULL, NULL, 'Cheesecake de Maracuyá', 602, TRUE),
  ('bebidas', 'Naturales', 'Jugos Naturales', 'Mora · Parchita · Frappé de Mango · Frappé de Maracuyá · Frappé Limonada & Menta · Frappé Limonada & Frutos Rojos.', '$2,68', 'bebidas/jugo_de_mora.webp', NULL, 'un Jugo Natural', 700, TRUE),
  ('bebidas', 'Refrescos', 'Frappé (todos los sabores)', 'Consulta los sabores disponibles del día.', '$3,35', 'bebidas/Frappe.webp', NULL, 'un Frappé', 701, TRUE),
  ('bebidas', 'Aguas', 'Agua con Gas', 'Sola · con Rodajas de Limón · con Frutos Rojos · con Maracuyá.', '$3,35', 'bebidas/agua_con_gas.webp', NULL, 'Agua con Gas', 702, TRUE),
  ('bebidas', 'Refrescos', 'Nestea de Durazno', 'Té frío de durazno.', '$2,68', 'bebidas/Té_de_durazno.webp', NULL, 'Nestea de Durazno', 703, TRUE),
  ('bebidas', 'Aguas', 'Agua Minalba 600ml', 'Agua mineral natural.', '$2,01', 'bebidas/agua_minalba.webp', 'background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#F0EDE6;', 'Agua Minalba', 704, TRUE),
  ('bebidas', 'Refrescos', 'Refrescos Lata', 'Todas las variedades disponibles.', '$3,04', 'bebidas/coca_cola_lata.webp', 'background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#F0EDE6;', 'un Refresco Lata', 705, TRUE),
  ('bebidas', 'Familiar', 'Coca Cola 2L', 'Solo para llevar.', '$3,35', 'bebidas/coca_cola_2l.webp', 'background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#F0EDE6;', 'Coca Cola 2L', 706, TRUE),
  ('adicionales', NULL, 'Festival (3 salsas en 1 plato)', 'Pesto Latte + Carbonara + Napolitana en un mismo plato.', '$3,35', NULL, NULL, 'el Festival Italiano', 800, TRUE),
  ('adicionales', NULL, 'Due Salsa (2 salsas en 1 plato)', '2 salsas a tu elección en un mismo plato.', '$2,68', NULL, NULL, 'Due Salsa', 801, TRUE),
  ('adicionales', NULL, 'Pan (unidad)', 'Pan artesanal de masa madre.', '$0,34', NULL, NULL, 'Pan', 802, TRUE),
  ('adicionales', NULL, 'Queso Parmesano', 'Porción de queso parmesano rallado.', '$2,68', NULL, NULL, 'Queso Parmesano', 803, TRUE),
  ('adicionales', NULL, 'Ravioli (para llevar)', 'Ravioli frescos para preparar en casa.', '$5,36', 'adicionales/ravioli.webp', NULL, 'Ravioli para llevar', 804, TRUE),
  ('adicionales', NULL, 'Pasta Fresca (para llevar)', 'Pasta fresca artesanal para preparar en casa.', '$2,68', NULL, NULL, 'Pasta Fresca para llevar', 805, TRUE),
  ('adicionales', NULL, 'Salsas (para llevar)', 'Salsas frescas del día para llevar a casa.', '$6,70', NULL, NULL, 'Salsas para llevar', 806, TRUE),
  ('adicionales', NULL, 'Conservas', 'Conservas artesanales de la casa.', '$8,04', NULL, NULL, 'Conservas de La Finestra', 807, TRUE)
ON CONFLICT (categoria, name) DO UPDATE
SET cat = EXCLUDED.cat,
    descripcion = EXCLUDED.descripcion,
    price = EXCLUDED.price,
    img = EXCLUDED.img,
    img_style = EXCLUDED.img_style,
    wa_text = EXCLUDED.wa_text,
    orden = EXCLUDED.orden,
    disponible = EXCLUDED.disponible,
    updated_at = NOW();

-- 4.3 INSERTAR PLATOS DESTACADOS (5 Items Estrella)
INSERT INTO public.destacados (badge, name, descripcion, price, img, wa_text, orden, disponible) VALUES
  ('⭐ Chef recomienda', 'Burrata Pesto', 'Perlas fritas de Mozzarella de Búfala rellenas de pesto, en salsa pomodoro, acompañadas de pan de masa madre.', '$10,64', 'entradas/burrata_pesto.webp', 'una Burrata Pesto', 0, TRUE),
  ('🔥 Más Vendido', 'Pasticho Tradicional de Bologna', 'Capas de pasta fresca, salsa bologna, bechamel, mozzarella y queso parmesano gratinado.', '$9,38', 'pastas/Pasticho_Tradicional_de_Bologna.webp', 'Pasticho Tradicional de Bologna', 1, TRUE),
  ('🍽️ Favorito', 'Tallarín Frutti Latte', 'Tallarín fresco con salsa blanca, frutos de mar salteados en oliva y vino blanco.', '$20,10', 'pastas/Tallarin_frutti_latte.webp', 'Tallarín Frutti Latte', 2, TRUE),
  ('✨ Especial', 'Ripieno Ragú', 'Ravioli relleno bañado en ragú de carne cocido a fuego lento.', '$10,72', 'pastas/Ripieno_Ragú.webp', 'Ripieno Ragú', 3, TRUE),
  ('🔥 Más Vendido', 'Salumiera', 'Pomodoro, mozzarella, jamón artesanal, chorizo español, bologna de cerdo & pistacho, trazos de nuez, pimienta negra.', '$11,39', 'pizzas/Salumiera.webp', 'Pizza Salumiera', 4, TRUE)
ON CONFLICT (name) DO UPDATE
SET badge = EXCLUDED.badge,
    descripcion = EXCLUDED.descripcion,
    price = EXCLUDED.price,
    img = EXCLUDED.img,
    wa_text = EXCLUDED.wa_text,
    orden = EXCLUDED.orden,
    disponible = EXCLUDED.disponible,
    updated_at = NOW();

-- =============================================================================
-- 5. BATERÍA DE PRUEBAS DE AUDITORÍA Y PENTESTING DE RLS (VERIFICACIÓN)
-- =============================================================================
/*
  EJECUTAR ESTOS BLOQUES COMO USUARIO 'anon' EN EL SQL EDITOR DE SUPABASE:

  -- TEST 1: Intentar leer platos ocultos/desactivados
  -- Resultado Esperado: 0 filas devueltas (el plato 'inactivo' no es visible).
  -- SET ROLE anon;
  -- SELECT * FROM public.menu_items WHERE disponible = FALSE;

  -- TEST 2: Intentar leer platos de una categoría desactivada (SEC-04)
  -- Resultado Esperado: 0 filas devueltas.
  -- SET ROLE anon;
  -- SELECT m.* FROM public.menu_items m JOIN public.categorias c ON m.categoria = c.id WHERE c.activo = FALSE;

  -- TEST 3: Intentar inyectar reserva pre-confirmada (SEC-02)
  -- Resultado Esperado: ERROR: new row violates row-level security policy for table "reservas"
  -- SET ROLE anon;
  -- INSERT INTO public.reservas (nombre, fecha, hora, personas, estado)
  -- VALUES ('Hacker', CURRENT_DATE, '12:00', '2', 'confirmada');

  -- TEST 4: Intentar inyectar reserva en el pasado (SEC-02)
  -- Resultado Esperado: ERROR: new row violates row-level security policy for table "reservas"
  -- SET ROLE anon;
  -- INSERT INTO public.reservas (nombre, fecha, hora, personas, estado)
  -- VALUES ('Hacker', CURRENT_DATE - INTERVAL '1 day', '12:00', '2', 'pendiente');

  -- TEST 5: Intentar modificar o alterar un precio como usuario anon
  -- Resultado Esperado: ERROR: new row violates row-level security policy for table "menu_items"
  -- SET ROLE anon;
  -- UPDATE public.menu_items SET price = '$0.01' WHERE id = 1;

  -- TEST 6: Intentar leer las reservas de otros clientes como anon
  -- Resultado Esperado: 0 filas devueltas (anon tiene INSERT pero NO SELECT)
  -- SET ROLE anon;
  -- SELECT * FROM public.reservas;
*/

-- =============================================================================
-- FIN DEL SCRIPT DE AUDITORÍA (v2.0.1)
-- =============================================================================
