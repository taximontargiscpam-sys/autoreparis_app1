
-- Enable DELETE for authenticated users on critical tables

-- 1. CLIENTS
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON "public"."clients";
CREATE POLICY "Enable delete for authenticated users only"
ON "public"."clients"
FOR DELETE
TO authenticated
USING (true);

-- 2. PRODUCTS (Stock)
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON "public"."products";
CREATE POLICY "Enable delete for authenticated users only"
ON "public"."products"
FOR DELETE
TO authenticated
USING (true);

-- 3. INTERVENTIONS
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON "public"."interventions";
CREATE POLICY "Enable delete for authenticated users only"
ON "public"."interventions"
FOR DELETE
TO authenticated
USING (true);

-- 4. USERS (Team)
-- Note: This only deletes from the 'public.users' table, not the Supabase Auth user.
-- Deleting the Auth user requires Service Role, which we can't do from the app directly safely.
-- But usually hiding them (active=false) is better. The user asked for "supprimer" though.
-- We will enable DELETE on public.users just in case they want a hard delete of the profile.
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON "public"."users";
CREATE POLICY "Enable delete for authenticated users only"
ON "public"."users"
FOR DELETE
TO authenticated
USING (true);
