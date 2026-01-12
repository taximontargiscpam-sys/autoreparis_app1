
-- Enable CASCADE DELETE for Clients and related data
-- Run this in the SQL Editor of your Main App Supabase project (wjvq...)

BEGIN;

-- 1. VEHICLES: Delete vehicles when Client is deleted
ALTER TABLE "public"."vehicles" DROP CONSTRAINT IF EXISTS "vehicles_client_id_fkey";
ALTER TABLE "public"."vehicles"
    ADD CONSTRAINT "vehicles_client_id_fkey"
    FOREIGN KEY ("client_id")
    REFERENCES "public"."clients"("id")
    ON DELETE CASCADE;

-- 2. INTERVENTIONS: Delete interventions when Client OR Vehicle is deleted
-- Fix link to Client
ALTER TABLE "public"."interventions" DROP CONSTRAINT IF EXISTS "interventions_client_id_fkey";
ALTER TABLE "public"."interventions"
    ADD CONSTRAINT "interventions_client_id_fkey"
    FOREIGN KEY ("client_id")
    REFERENCES "public"."clients"("id")
    ON DELETE CASCADE;

-- Fix link to Vehicle
ALTER TABLE "public"."interventions" DROP CONSTRAINT IF EXISTS "interventions_vehicle_id_fkey";
ALTER TABLE "public"."interventions"
    ADD CONSTRAINT "interventions_vehicle_id_fkey"
    FOREIGN KEY ("vehicle_id")
    REFERENCES "public"."vehicles"("id")
    ON DELETE CASCADE;

-- 3. INTERVENTION LINES: Delete lines when Intervention is deleted
ALTER TABLE "public"."intervention_lines" DROP CONSTRAINT IF EXISTS "intervention_lines_intervention_id_fkey";
ALTER TABLE "public"."intervention_lines"
    ADD CONSTRAINT "intervention_lines_intervention_id_fkey"
    FOREIGN KEY ("intervention_id")
    REFERENCES "public"."interventions"("id")
    ON DELETE CASCADE;

-- 4. PHOTOS: Delete photos when Intervention is deleted
ALTER TABLE "public"."vehicle_photos" DROP CONSTRAINT IF EXISTS "vehicle_photos_intervention_id_fkey";
ALTER TABLE "public"."vehicle_photos"
    ADD CONSTRAINT "vehicle_photos_intervention_id_fkey"
    FOREIGN KEY ("intervention_id")
    REFERENCES "public"."interventions"("id")
    ON DELETE CASCADE;

-- 5. INVOICES: Delete invoices when Intervention is deleted
ALTER TABLE "public"."invoices" DROP CONSTRAINT IF EXISTS "invoices_intervention_id_fkey";
ALTER TABLE "public"."invoices"
    ADD CONSTRAINT "invoices_intervention_id_fkey"
    FOREIGN KEY ("intervention_id")
    REFERENCES "public"."interventions"("id")
    ON DELETE CASCADE;

-- 6. LEADS (Website): Don't delete lead, just unlink client
ALTER TABLE "public"."leads_site_web" DROP CONSTRAINT IF EXISTS "leads_site_web_converted_client_id_fkey";
ALTER TABLE "public"."leads_site_web"
    ADD CONSTRAINT "leads_site_web_converted_client_id_fkey"
    FOREIGN KEY ("converted_client_id")
    REFERENCES "public"."clients"("id")
    ON DELETE SET NULL;

COMMIT;
