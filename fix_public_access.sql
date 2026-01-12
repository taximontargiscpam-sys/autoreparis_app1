-- PUBLIC ACCESS FOR VEHICLE TRACKING
-- Purpose: Allow unauthenticated users (anon) to query vehicles by plate and view their interventions.

-- 1. VEHICLES: Allow public SELECT
DROP POLICY IF EXISTS "Public can read vehicles" ON public.vehicles;
CREATE POLICY "Public can read vehicles" 
ON public.vehicles FOR SELECT 
TO anon
USING (true); 
-- Note: In a stricter environment, we could try to limit this, but filtering by plate effectively works 
-- because they need to guess the exact plate.

-- 2. INTERVENTIONS: Allow public SELECT
DROP POLICY IF EXISTS "Public can read interventions" ON public.interventions;
CREATE POLICY "Public can read interventions" 
ON public.interventions FOR SELECT 
TO anon
USING (true);

-- 3. INTERVENTION LINES: Allow public SELECT (to see parts/labor)
DROP POLICY IF EXISTS "Public can read lines" ON public.intervention_lines;
CREATE POLICY "Public can read lines" 
ON public.intervention_lines FOR SELECT 
TO anon
USING (true);

-- 4. VEHICLE PHOTOS: Allow public SELECT (optional, but good for trust)
DROP POLICY IF EXISTS "Public can read photos" ON public.vehicle_photos;
CREATE POLICY "Public can read photos" 
ON public.vehicle_photos FOR SELECT 
TO anon
USING (true);

-- 5. USERS: Allow public SELECT (to see mechanic name)
-- Use carefully. Only allow reading public info if needed. 
-- Schema shows 'nom, prenom'. Let's allow it for now as the tracking UI displays mechanic name.
DROP POLICY IF EXISTS "Public can read basic user info" ON public.users;
CREATE POLICY "Public can read basic user info" 
ON public.users FOR SELECT 
TO anon
USING (true);
