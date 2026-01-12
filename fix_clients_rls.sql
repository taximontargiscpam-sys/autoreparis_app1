
-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Allow Authenticated users to INSERT new clients
CREATE POLICY "Enable insert for authenticated users only"
ON "public"."clients"
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow Authenticated users to UPDATE clients
CREATE POLICY "Enable update for authenticated users only"
ON "public"."clients"
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow Authenticated users to SELECT clients (if not already there)
CREATE POLICY "Enable select for authenticated users only"
ON "public"."clients"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);
