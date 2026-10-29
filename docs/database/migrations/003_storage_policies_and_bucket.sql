-- ==============================================================================
-- 003_storage_policies_and_bucket.sql
-- ==============================================================================
-- Auditoría Sonnet 5.5 (S-05): Configuración y Políticas RLS en Supabase Storage
-- Bucket: menu-images con límites de tamaño, tipos MIME y RLS admin estricto
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-images',
  'menu-images',
  TRUE,
  4194304, -- 4 MB
  ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Políticas de RLS sobre storage.objects para el bucket menu-images
DROP POLICY IF EXISTS "admin sube imagenes" ON storage.objects;
CREATE POLICY "admin sube imagenes" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'menu-images' AND public.is_admin());

DROP POLICY IF EXISTS "admin edita imagenes" ON storage.objects;
CREATE POLICY "admin edita imagenes" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'menu-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'menu-images' AND public.is_admin());

DROP POLICY IF EXISTS "admin borra imagenes" ON storage.objects;
CREATE POLICY "admin borra imagenes" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'menu-images' AND public.is_admin());
