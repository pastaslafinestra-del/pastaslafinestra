-- ==============================================================================
-- 004_tighten_reservas_bounds.sql
-- ==============================================================================
-- Auditoría Sonnet 5.5 (S-07): Endurecimiento de política RLS para reservas
-- Cierra el vector de fecha sin tope superior limitando a máximo 90 días futuros
-- ==============================================================================

DROP POLICY IF EXISTS "Creacion publica reservas" ON public.reservas;
CREATE POLICY "Creacion publica reservas"
    ON public.reservas FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        estado = 'pendiente'
        AND fecha >= (NOW() AT TIME ZONE 'America/Caracas')::DATE
        AND fecha <= ((NOW() AT TIME ZONE 'America/Caracas')::DATE + 90)
    );
