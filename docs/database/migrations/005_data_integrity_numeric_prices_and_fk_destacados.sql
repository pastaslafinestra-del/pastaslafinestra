-- =============================================================================
-- MIGRACIÓN 005 — INTEGRIDAD DE DATOS Y MODELO (D-01, D-02, D-06)
-- Repositorio: moisesrojasp89-Dev/lafinestra
-- Propósito:
--   1. (D-01) Precios numéricos tipados price_usd y price_max_usd en menu_items.
--   2. (D-02) Foreign Key menu_item_id en destacados (eliminación de data drift).
--   3. (D-06) Limpieza de emojis de presentación en el campo taxonómico cat.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. (D-01) PRECIOS NUMÉRICOS EN public.menu_items
-- -----------------------------------------------------------------------------
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS price_usd NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS price_max_usd NUMERIC(8,2);

-- Migrar datos preexistentes desde price TEXT hacia price_usd y price_max_usd
UPDATE public.menu_items
SET price_usd = (
  CASE
    WHEN price LIKE '%–%' THEN
      REPLACE(REPLACE(TRIM(split_part(price, '–', 1)), '$', ''), ',', '.')::NUMERIC(8,2)
    ELSE
      REPLACE(REPLACE(TRIM(price), '$', ''), ',', '.')::NUMERIC(8,2)
  END
),
price_max_usd = (
  CASE
    WHEN price LIKE '%–%' THEN
      REPLACE(REPLACE(TRIM(split_part(price, '–', 2)), '$', ''), ',', '.')::NUMERIC(8,2)
    ELSE
      NULL
  END
)
WHERE price_usd IS NULL;

-- Asignar 0.00 por defecto en caso de registros con formato no parseable
UPDATE public.menu_items
SET price_usd = 0.00
WHERE price_usd IS NULL;

-- Endurecer restricciones NOT NULL y CHECK
ALTER TABLE public.menu_items
  ALTER COLUMN price_usd SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_menu_items_price_usd') THEN
    ALTER TABLE public.menu_items ADD CONSTRAINT chk_menu_items_price_usd CHECK (price_usd >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_menu_items_price_max_usd') THEN
    ALTER TABLE public.menu_items ADD CONSTRAINT chk_menu_items_price_max_usd CHECK (price_max_usd IS NULL OR price_max_usd >= price_usd);
  END IF;
END $$;

COMMENT ON COLUMN public.menu_items.price_usd IS 'Precio base en USD (D-01: numérico exacto para operaciones financieras)';
COMMENT ON COLUMN public.menu_items.price_max_usd IS 'Precio tope en USD para platos con rango de precios (D-01)';

-- -----------------------------------------------------------------------------
-- 2. (D-02) VINCULACIÓN DE DESTACADOS A menu_items (FOREIGN KEY)
-- -----------------------------------------------------------------------------
ALTER TABLE public.destacados
  ADD COLUMN IF NOT EXISTS menu_item_id BIGINT;

-- Vincular destacados existentes por coincidencia de nombre
UPDATE public.destacados d
SET menu_item_id = m.id
FROM public.menu_items m
WHERE d.menu_item_id IS NULL
  AND (
    LOWER(TRIM(d.name)) = LOWER(TRIM(m.name))
    OR (d.name LIKE '%Burrata%' AND m.name LIKE '%Burrata%')
    OR (d.name LIKE '%Pasticho%' AND m.name LIKE '%Pasticho%')
    OR (d.name LIKE '%Ripieno%' AND m.name LIKE '%Ripieno%')
    OR (d.name LIKE '%Frutti%' AND m.name LIKE '%Frutti%')
    OR (d.name LIKE '%Salumiera%' AND m.name LIKE '%Salumiera%')
  );

-- En caso de algún destacado no vinculado, enlazar al primer plato disponible para no violar NOT NULL
UPDATE public.destacados
SET menu_item_id = (SELECT id FROM public.menu_items ORDER BY id ASC LIMIT 1)
WHERE menu_item_id IS NULL;

ALTER TABLE public.destacados
  ALTER COLUMN menu_item_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_destacados_menu_item') THEN
    ALTER TABLE public.destacados
      ADD CONSTRAINT fk_destacados_menu_item
      FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_destacados_menu_item_id') THEN
    ALTER TABLE public.destacados
      ADD CONSTRAINT uq_destacados_menu_item_id UNIQUE (menu_item_id);
  END IF;
END $$;

-- Permitir que campos duplicados sean opcionales (la fuente de verdad es menu_items)
ALTER TABLE public.destacados
  ALTER COLUMN name DROP NOT NULL,
  ALTER COLUMN price DROP NOT NULL;

COMMENT ON COLUMN public.destacados.menu_item_id IS 'Referencia foránea única al plato de menu_items (D-02: Zero Data Drift)';

-- -----------------------------------------------------------------------------
-- 3. (D-06) LIMPIEZA DE EMOJIS DE PRESENTACIÓN EN EL CAMPO cat
-- -----------------------------------------------------------------------------
UPDATE public.menu_items SET cat = 'Pastificio' WHERE cat = 'Pastificio ⭐';
UPDATE public.menu_items SET cat = 'Ripieno' WHERE cat = 'Ripieno ⭐';
