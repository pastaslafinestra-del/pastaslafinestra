-- =============================================================================
-- MIGRACIÓN 007 — CORRECCIÓN DETERMINISTA DE ENLACES FORÁNEOS EN DESTACADOS
-- Repositorio: moisesrojasp89-Dev/lafinestra
-- Propósito:
--   1. Corregir la ruta de imagen de Ripieno Ragú ('pastas/Ripieno_Ragu.webp'
--      sin tilde, coincidiendo 1:1 con el objeto real en storage.objects).
--   2. Corregir los vínculos menu_item_id en public.destacados que en la migración
--      005 quedaron enlazados por coincidencia parcial (LIKE '%Frutti%' -> Pizza
--      Frutti di Mare en vez de Tallarín Frutti Latte; LIKE '%Ripieno%' -> Ripieno
--      Finestra en vez de Ripieno Ragú).
-- =============================================================================

UPDATE public.menu_items
SET img = 'pastas/Ripieno_Ragu.webp',
    updated_at = NOW()
WHERE name = 'Ripieno Ragú';

UPDATE public.destacados
SET menu_item_id = (SELECT id FROM public.menu_items WHERE name = 'Burrata Pesto' LIMIT 1)
WHERE orden = 0;

UPDATE public.destacados
SET menu_item_id = (SELECT id FROM public.menu_items WHERE name = 'Pasticho Tradicional de Bologna' LIMIT 1)
WHERE orden = 1;

UPDATE public.destacados
SET menu_item_id = (SELECT id FROM public.menu_items WHERE name = 'Tallarín Frutti Latte' LIMIT 1)
WHERE orden = 2;

UPDATE public.destacados
SET menu_item_id = (SELECT id FROM public.menu_items WHERE name = 'Ripieno Ragú' LIMIT 1)
WHERE orden = 3;

UPDATE public.destacados
SET menu_item_id = (SELECT id FROM public.menu_items WHERE name = 'Salumiera' LIMIT 1)
WHERE orden = 4;

-- Sincronizar campos espejo en public.destacados con su plato maestro en menu_items
UPDATE public.destacados d
SET name        = m.name,
    descripcion = m.descripcion,
    price       = m.price,
    img         = m.img,
    wa_text     = m.wa_text,
    updated_at  = NOW()
FROM public.menu_items m
WHERE d.menu_item_id = m.id;
