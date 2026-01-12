-- Allow public (anon) read access to vehicles (for license plate search)
CREATE POLICY "Public read access" ON public.vehicles FOR SELECT TO anon USING (true);

-- Allow public (anon) read access to interventions (for status tracking)
CREATE POLICY "Public read access" ON public.interventions FOR SELECT TO anon USING (true);

-- Allow public (anon) read access to clients (if needed for display, though mainly vehicle/intervention is enough for now)
-- CREATE POLICY "Public read access" ON public.clients FOR SELECT TO anon USING (true);
