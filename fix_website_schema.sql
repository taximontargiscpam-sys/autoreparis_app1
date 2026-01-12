
-- Run this on the WEBSITE project (pncgdoq... / "site-devis")

ALTER TABLE "public"."devis_auto" 
ADD COLUMN IF NOT EXISTS "statut" text DEFAULT 'nouveau';

-- Optional: Enable RLS updates if not already allowed
ALTER TABLE "public"."devis_auto" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable update for anyone" 
ON "public"."devis_auto"
FOR UPDATE 
USING (true) 
WITH CHECK (true);
