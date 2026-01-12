-- 1. Drop the FK constraint to allow 'Virtual Users' (Employees without login)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- 2. Insert Team Members (using random UUIDs)
INSERT INTO public.users (id, role, nom, prenom, email, actif) VALUES
(uuid_generate_v4(), 'mecanicien', 'Dubois', 'Thomas', 'thomas@garage.com', true),
(uuid_generate_v4(), 'mecanicien', 'Martin', 'Sarah', 'sarah@garage.com', true),
(uuid_generate_v4(), 'mecanicien', 'Petit', 'Marc', 'marc@garage.com', true);
