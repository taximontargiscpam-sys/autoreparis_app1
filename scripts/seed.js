
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env
const envPath = path.resolve(__dirname, '../.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const SUPABASE_URL = envConfig.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = envConfig.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seed() {
    console.log('🌱 Seeding database...');

    // 0. Authenticate as admin to bypass RLS
    const email = 'admin@autoreparis.com';
    const password = 'Garage2026!';

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
        console.error('Error signing in as admin:', authError.message);
        console.log('Make sure to run create_admin_user.js first.');
        return;
    }
    console.log('✅ Logged in as admin');

    if (!authData.session) {
        console.error('No session created. Check if email confirmation is enabled in Supabase.');
        // Proceeding might fail if RLS is strict, but let's try.
        // Often, signUp returns a session unless "Confirm Email" is on.
    }

    // 1. Clients
    const { data: clients, error: cError } = await supabase
        .from('clients')
        .insert([
            { nom: 'Dupont', prenom: 'Jean', email: 'jean.dupont@email.com', telephone: '0601020304', adresse: '12 Rue de la Paix' },
            { nom: 'Martin', prenom: 'Sophie', email: 'sophie.martin@email.com', telephone: '0699887766', adresse: '45 Avenue des Champs' }
        ])
        .select();

    if (cError) console.error('Error creating clients:', cError);
    else console.log('✅ Clients created');

    const client = clients?.[0];
    if (!client) return;

    // 2. Vehicles
    const { data: vehicles, error: vError } = await supabase
        .from('vehicles')
        .insert([
            { client_id: client.id, marque: 'Peugeot', modele: '308', immatriculation: 'AA-123-BB', annee: 2020, vin: 'VF3...' },
            { client_id: client.id, marque: 'Renault', modele: 'Clio V', immatriculation: 'BB-456-CC', annee: 2022, vin: 'VF1...' }
        ])
        .select();

    if (vError) console.error('Error creating vehicles:', vError);
    else console.log('✅ Vehicles created');

    const vehicle1 = vehicles?.[0];
    if (!vehicle1) return;

    // 3. Interventions
    const { error: iError } = await supabase
        .from('interventions')
        .insert([
            {
                vehicle_id: vehicle1.id,
                client_id: client.id,
                statut: 'en_cours',
                type_intervention: 'Révision Complète',
                date_heure_debut_prevue: new Date().toISOString(),
                commentaire: 'Vidange + Filtres + Contrôle technique'
            },
            {
                vehicle_id: vehicle1.id,
                client_id: client.id,
                statut: 'planifiee',
                type_intervention: 'Changement Pneus',
                date_heure_debut_prevue: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                commentaire: 'Pneus AV Michelin'
            }
        ]);

    if (iError) console.error('Error creating interventions:', iError);
    else console.log('✅ Interventions created');

    // 4. Leads
    const { error: lError } = await supabase
        .from('leads_site_web')
        .insert([
            { nom: 'Durand', prenom: 'Paul', telephone: '0611223344', email: 'paul@test.com', type_demande: 'Devis Carrosserie', message: 'Rayure sur portière droite', statut: 'nouveau' },
            { nom: 'Lefebvre', prenom: 'Marie', telephone: '0755667788', email: 'marie@test.com', type_demande: 'Rendez-vous Urgent', message: 'Bruit suspect moteur', statut: 'en_traitement' }
        ]);

    if (lError) console.error('Error creating leads:', lError);
    else console.log('✅ Leads created');

    // 5. Products
    const { error: pError } = await supabase
        .from('products')
        .insert([
            { nom: 'Huile 5W30 Castrol', reference_fournisseur: 'HUI-5W30', prix_vente_unitaire: 45.90, stock_actuel: 12, stock_min: 5, localisation: 'A-01' },
            { nom: 'Filtre à Huile Bosch', reference_fournisseur: 'FIL-B01', prix_vente_unitaire: 12.50, stock_actuel: 3, stock_min: 5, localisation: 'B-02' },
            { nom: 'Plaquettes AV Brembo', reference_fournisseur: 'PLA-BR1', prix_vente_unitaire: 35.00, stock_actuel: 8, stock_min: 4, localisation: 'C-05' }
        ]);

    if (pError) console.error('Error creating products:', pError);
    else console.log('✅ Products created');

    console.log('✨ Seeding completed!');
}

seed();
