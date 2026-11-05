-- =============================================================================
-- MIGRACIÓN 008 — CORRECCIÓN DE RUTA DE IMAGEN DE NESTEA DE DURAZNO
-- Repositorio: moisesrojasp89-Dev/lafinestra
-- Propósito:
--   Corregir la ruta de imagen de 'Nestea de Durazno' de 'bebidas/Té_de_durazno.webp'
--   a 'bebidas/Te_de_durazno.webp' (sin tilde), coincidiendo 1:1 con el objeto
--   real almacenado en el bucket 'menu-images' de Supabase Storage.
-- =============================================================================

UPDATE public.menu_items
SET img = 'bebidas/Te_de_durazno.webp',
    updated_at = NOW()
WHERE name = 'Nestea de Durazno';
