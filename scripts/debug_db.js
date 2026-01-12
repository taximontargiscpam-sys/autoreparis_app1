require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugDB() {
    console.log("🔍 Debugging DB Data...");

    // 1. Get ALL vehicles with that plate
    const { data: vehicles, error: vError } = await supabase
        .from('vehicles')
        .select('id, created_at')
        .ilike('immatriculation', 'AA-123-BB');

    if (vError) {
        console.error("VEHICLE ERROR:", vError);
        return;
    }

    console.log(`Found ${vehicles.length} vehicles with plate AA-123-BB:`);
    vehicles.forEach(v => console.log(` - ID: ${v.id} (Created: ${v.created_at})`));

    // 2. Get ALL interventions (just top 50 to check)
    const { data: interventions, error: iError } = await supabase
        .from('interventions')
        .select('id, vehicle_id, created_at, statut')
        .order('created_at', { ascending: false })
        .limit(20);

    if (iError) {
        console.error("INTERVENTION ERROR:", iError);
        return;
    }

    console.log(`\nFound ${interventions.length} recent interventions:`);
    interventions.forEach(i => console.log(` - Int ID: ${i.id} | Linked Vehicle: ${i.vehicle_id} | Status: ${i.statut}`));

    // 3. Cross-reference
    console.log("\nMatching Analysis:");
    let matchFound = false;
    for (const v of vehicles) {
        const match = interventions.find(i => i.vehicle_id === v.id);
        if (match) {
            console.log(`✅ MATCH FOUND! Vehicle ${v.id} has Intervention ${match.id}`);
            matchFound = true;
        } else {
            console.log(`❌ Vehicle ${v.id} is ORPHAN (no intervention in top 20)`);
        }
    }
}

debugDB();
