-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. USERS (extends auth.users)
create table public.users (
  id uuid references auth.users not null primary key,
  role text check (role in ('admin', 'frontdesk', 'mecanicien', 'lecture')) not null default 'lecture',
  nom text,
  prenom text,
  email text,
  actif boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.users enable row level security;

-- 2. CLIENTS
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  nom text not null,
  prenom text,
  telephone text,
  email text,
  adresse text,
  ville text,
  code_postal text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.clients enable row level security;

-- 3. VEHICLES
create table public.vehicles (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients not null,
  marque text not null,
  modele text not null,
  immatriculation text not null,
  kilometrage integer,
  annee integer,
  vin text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.vehicles enable row level security;

-- 4. PRODUCTS
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  nom text not null,
  categorie text check (categorie in ('mecanique', 'carrosserie', 'entretien', 'pneus', 'batterie', 'autre')),
  code_barres text,
  reference_fournisseur text,
  prix_achat_unitaire numeric,
  prix_vente_unitaire numeric,
  stock_actuel integer default 0,
  stock_min integer default 5,
  localisation text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.products enable row level security;

-- 5. INTERVENTIONS
create table public.interventions (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients not null,
  vehicle_id uuid references public.vehicles not null,
  mecanicien_id uuid references public.users,
  date_heure_debut_prevue timestamp with time zone,
  date_heure_fin_prevue timestamp with time zone,
  date_heure_debut_reelle timestamp with time zone,
  date_heure_fin_reelle timestamp with time zone,
  statut text check (statut in ('planifiee', 'en_cours', 'en_attente_pieces', 'terminee', 'facturee', 'annulee', 'no_show')) default 'planifiee',
  type_intervention text,
  commentaire text,
  total_achat numeric default 0,
  total_vente numeric default 0,
  marge_totale numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.interventions enable row level security;

-- 6. INTERVENTION_LINES
create table public.intervention_lines (
  id uuid default uuid_generate_v4() primary key,
  intervention_id uuid references public.interventions not null,
  type_ligne text check (type_ligne in ('piece', 'main_oeuvre', 'autre')),
  product_id uuid references public.products,
  description text,
  quantite numeric default 1,
  prix_achat_unitaire numeric default 0,
  prix_vente_unitaire numeric default 0,
  total_achat_ligne numeric generated always as (quantite * prix_achat_unitaire) stored,
  total_vente_ligne numeric generated always as (quantite * prix_vente_unitaire) stored
);
alter table public.intervention_lines enable row level security;

-- 7. LEADS_SITE_WEB
create table public.leads_site_web (
  id uuid default uuid_generate_v4() primary key,
  source text,
  nom text,
  prenom text,
  telephone text,
  email text,
  message text,
  type_demande text,
  statut text check (statut in ('nouveau', 'en_traitement', 'transformé_en_client', 'perdu')) default 'nouveau',
  converted_client_id uuid references public.clients,
  converted_intervention_id uuid references public.interventions,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.leads_site_web enable row level security;

-- 8. STOCK_MOVEMENTS
create table public.stock_movements (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products not null,
  type text check (type in ('entree', 'sortie', 'correction')),
  quantite integer not null,
  motif text,
  intervention_id uuid references public.interventions,
  user_id uuid references public.users,
  stock_avant integer,
  stock_apres integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.stock_movements enable row level security;

-- 9. VEHICLE_PHOTOS
create table public.vehicle_photos (
  id uuid default uuid_generate_v4() primary key,
  intervention_id uuid references public.interventions not null,
  url_image text not null,
  type text,
  commentaire text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.vehicle_photos enable row level security;

-- 10. TEAM_AVAILABILITY
create table public.team_availability (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users not null,
  date date not null,
  statut text check (statut in ('present', 'repos', 'conge', 'arret', 'autre')),
  commentaire text
);
alter table public.team_availability enable row level security;

-- 11. INVOICES
create table public.invoices (
  id uuid default uuid_generate_v4() primary key,
  intervention_id uuid references public.interventions not null,
  numero_facture text,
  date_facture date default CURRENT_DATE,
  total_ht numeric,
  total_tva numeric,
  total_ttc numeric,
  pdf_url text,
  statut text check (statut in ('brouillon', 'emise', 'payee', 'annulee')) default 'brouillon',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.invoices enable row level security;

-- 12. ACTIVITY_LOG
create table public.activity_log (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users,
  type_evenement text,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.activity_log enable row level security;


-- BASIC RLS POLICIES (Allow all for v1 prototype, refine later)
create policy "Enable all access for authenticated users" on public.users for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.clients for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.vehicles for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.products for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.interventions for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.intervention_lines for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.leads_site_web for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.stock_movements for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.vehicle_photos for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.team_availability for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.invoices for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.activity_log for all using (auth.role() = 'authenticated');

-- REALTIME PUBLICATION
alter publication supabase_realtime add table public.leads_site_web;
alter publication supabase_realtime add table public.interventions;
alter publication supabase_realtime add table public.intervention_lines;
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.stock_movements;
