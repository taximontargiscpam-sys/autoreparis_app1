
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wjvqdvjtzwmusabbinnl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqdnFkdmp0endtdXNhYmJpbm5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODA0MDgsImV4cCI6MjA4Mjg1NjQwOH0.s9khE4mXagZNe2YgcpySdZl23DBtia35zAntt-nZK6c';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seed() {
    console.log('🌱 Seeding database...');

    // 0. Authenticate to bypass RLS
    const email = 'test@gmail.com';
    const password = 'password123'; // Temporary password for seeding

    let { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
        console.log('User not found, creating new admin user...');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) {
            console.error('Error creating user:', signUpError);
            return;
        }
        authData = signUpData;
        console.log('✅ Admin user created');
    } else {
        console.log('✅ Logged in as admin');
    }

    if (!authData.session) {
        console.error('No session created. Check if email confirmation is enabled in Supabase.');
        // Proceeding might fail if RLS is strict, but let's try.
        // Often, signUp returns a session unless "Confirm Email" is on.
    }

    // 1. Clients
    const { data: client, error: cError } = await supabase
        .from('clients')
        .insert([
            { nom: 'Dupont', prenom: 'Jean', email: 'jean.dupont@email.com', telephone: '0601020304', adresse: '12 Rue de la Paix' },
            { nom: 'Martin', prenom: 'Sophie', email: 'sophie.martin@email.com', telephone: '0699887766', adresse: '45 Avenue des Champs' }
        ])
        .select()
        .limit(1)
        .single();

    if (cError) console.error('Error creating clients:', cError);
    else console.log('✅ Clients created');

    if (!client) return;

    // 2. Vehicles
    const { data: vehicle1, error: vError } = await supabase
        .from('vehicles')
        .insert([
            { client_id: client.id, marque: 'Peugeot', modele: '308', immatriculation: 'AA-123-BB', annee: 2020, vin: 'VF3...' },
            { client_id: client.id, marque: 'Renault', modele: 'Clio V', immatriculation: 'BB-456-CC', annee: 2022, vin: 'VF1...' }
        ])
        .select()
        .limit(1)
        .single();

    if (vError) console.error('Error creating vehicles:', vError);
    else console.log('✅ Vehicles created (AA-123-BB)');

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
                description: 'Vidange + Filtres + Contrôle technique',
                total_ttc: 350.00
            },
            {
                vehicle_id: vehicle1.id,
                client_id: client.id,
                statut: 'planifiee',
                type_intervention: 'Changement Pneus',
                date_heure_debut_prevue: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                description: 'Pneus AV Michelin',
                total_ttc: 220.00
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
            { nom: 'Huile 5W30 Castrol', reference: 'HUI-5W30', description: 'Bidon 5L', prix_vente_ttc: 45.90, stock_actuel: 12, seuil_alerte: 5, emplacement: 'A-01' },
            { nom: 'Filtre à Huile Bosch', reference: 'FIL-B01', description: 'Pour Peugeot/Citroen', prix_vente_ttc: 12.50, stock_actuel: 3, seuil_alerte: 5, emplacement: 'B-02' },
            { nom: 'Plaquettes AV Brembo', reference: 'PLA-BR1', description: 'Jeu de 4', prix_vente_ttc: 35.00, stock_actuel: 8, seuil_alerte: 4, emplacement: 'C-05' }
        ]);

    if (pError) console.error('Error creating products:', pError);
    else console.log('✅ Products created');

    console.log('✨ Seeding completed!');
}

seed();
