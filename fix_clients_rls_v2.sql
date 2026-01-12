
-- 1. Drop existing policies to avoid "Exists already" errors
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."clients";
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON "public"."clients";
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON "public"."clients";
DROP POLICY IF EXISTS "Enable all for authenticated users only" ON "public"."clients";
DROP POLICY IF EXISTS "L'application peut lire les demandes" ON "public"."clients";

-- 2. Enable RLS
ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;

-- 3. Create Permissive Policies (Allow everything for logged-in users)

-- INSERT
CREATE POLICY "Enable insert for authenticated users only"
ON "public"."clients"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE
CREATE POLICY "Enable update for authenticated users only"
ON "public"."clients"
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- SELECT
CREATE POLICY "Enable select for authenticated users only"
ON "public"."clients"
FOR SELECT
TO authenticated
USING (true);

-- DELETE (Optional, but good for admin)
CREATE POLICY "Enable delete for authenticated users only"
ON "public"."clients"
FOR DELETE
TO authenticated
USING (true);
